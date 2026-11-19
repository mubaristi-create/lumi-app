alter table public.lumi_push_devices add column platform text not null default 'android' check(platform in('android','ios'));
CREATE OR REPLACE FUNCTION public.lumi_push_register(p_token text, p_installation uuid, p_platform text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare u uuid=public.require_lumi_player();r public.lumi_push_devices%rowtype;n uuid;begin
 if p_platform is null or p_platform not in('android','ios') or (p_platform='ios' and p_token !~ '^[a-fA-F0-9]{64}$') then raise exception 'Invalid push platform';end if;
 if p_installation is null or length(p_token)not between 20 and 4096 then raise exception 'Invalid device';end if;
 perform public.lumi_rate_guard('push-register',12,60);
 select *into r from public.lumi_push_devices where token=p_token for update;
 if found and r.user_id<>u and r.installation<>p_installation then raise exception 'Device conflict'using errcode='42501';end if;
 if found then delete from public.lumi_push_devices where user_id=u and installation=p_installation and id<>r.id;update public.lumi_push_devices set user_id=u,installation=p_installation,platform=p_platform,enabled=true,last_seen=clock_timestamp()where id=r.id returning id into n;
 else insert into public.lumi_push_devices(user_id,installation,token,platform)values(u,p_installation,p_token,p_platform)on conflict(user_id,installation)do update set token=excluded.token,platform=excluded.platform,enabled=true,last_seen=clock_timestamp()returning id into n;end if;
 return n;end;$function$;

revoke all on function public.lumi_push_register(text,uuid,text) from public,anon;grant execute on function public.lumi_push_register(text,uuid,text) to authenticated;
CREATE OR REPLACE FUNCTION public.lumi_push_claim()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare batch jsonb;begin
 perform pg_advisory_xact_lock(hashtext('lumi-push-fanout'));
 insert into public.lumi_push_deliveries(queue_id,device_id)
 select q.id,d.id from public.lumi_push_queue q join public.lumi_push_devices d on d.user_id=q.user_id and d.enabled
 join public.lumi_notification_preferences p on p.user_id=q.user_id and p.push_enabled
 join public.user_profiles u on u.id=q.user_id and not u.is_suspended and not u.deletion_pending
 where q.notification_id is not null and q.created_at>clock_timestamp()-interval '1 hour' and q.created_at>=d.last_seen-interval '5 minutes'
 and case q.kind when 'hourly'then p.hourly when 'daily'then p.daily when 'ranking'then p.ranking else true end
 on conflict do nothing;
 update public.lumi_push_deliveries x set status='expired'from public.lumi_push_queue q where x.queue_id=q.id and x.status in('pending','retry','sending')and(q.created_at<clock_timestamp()-interval '1 hour' or x.attempts>=5);
 with due as(select x.id from public.lumi_push_deliveries x join public.lumi_push_devices d on d.id=x.device_id and d.enabled join public.lumi_push_queue q on q.id=x.queue_id and q.user_id=d.user_id join public.lumi_notification_preferences p on p.user_id=d.user_id and p.push_enabled where (x.status in('pending','retry')and x.next_at<=clock_timestamp()or x.status='sending'and x.locked_at<clock_timestamp()-interval '3 minutes')and case q.kind when 'hourly'then p.hourly when 'daily'then p.daily when 'ranking'then p.ranking else true end order by x.id limit 40 for update of x skip locked),claimed as(update public.lumi_push_deliveries x set status='sending',attempts=attempts+1,locked_at=clock_timestamp()from due where x.id=due.id returning x.*)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'attempt',c.attempts,'token',d.token,'platform',d.platform,'title',q.title,'body',q.body,'route',q.route,'kind',q.kind,'notification_id',q.notification_id)),'[]'::jsonb)into batch from claimed c join public.lumi_push_devices d on d.id=c.device_id join public.lumi_push_queue q on q.id=c.queue_id;return batch;end;$function$;
