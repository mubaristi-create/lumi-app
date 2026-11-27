begin;
create table public.lumi_competition_schedule (
 id boolean primary key default true check(id), title text not null,
 starts_at timestamptz not null, ends_at timestamptz not null,
 gap_days integer not null default 2 check(gap_days between 1 and 30),
 auto_repeat boolean not null default true, version integer not null default 1,
 updated_at timestamptz not null default clock_timestamp(),
 check(ends_at>starts_at and ends_at-starts_at<=interval '60 days')
);
alter table public.lumi_competition_schedule enable row level security;
revoke all on public.lumi_competition_schedule from public,anon,authenticated;
insert into public.lumi_competition_schedule(id,title,starts_at,ends_at)
select true,title,starts_at,ends_at from public.lumi_rounds where status='active' order by starts_at desc limit 1;
insert into public.lumi_competition_schedule(id,title,starts_at,ends_at)
select true,'Həftənin Lumi yarışı',clock_timestamp()+interval '2 days',clock_timestamp()+interval '9 days'
where not exists(select 1 from public.lumi_competition_schedule);

create or replace function public.lumi_current_round()returns uuid language plpgsql security definer set search_path='' as $$
declare r public.lumi_rounds%rowtype;s public.lumi_competition_schedule%rowtype;x record;
 t timestamptz=clock_timestamp();a timestamptz;b timestamptz;span interval;cycles bigint;
begin
 perform pg_advisory_xact_lock(4973678982999079);
 for x in select id from public.lumi_rounds where selection_mode='top3' and finalized_at is null and ends_at<=t order by ends_at loop
  perform public.lumi_finalize_round(x.id);
 end loop;
 if not coalesce((select(data->>'competition_enabled')::boolean from public.lumi_control_settings where id),false)then return null;end if;
 select *into r from public.lumi_rounds where status='active' and starts_at<=t and ends_at>t order by starts_at desc limit 1;
 if found then return r.id;end if;
 select *into s from public.lumi_competition_schedule where id for update;
 if s.ends_at<=t then
  if not s.auto_repeat then return null;end if;
  span=s.ends_at-s.starts_at;a=s.ends_at+make_interval(days=>s.gap_days);b=a+span;
  if b<=t then
   cycles=floor(extract(epoch from(t-a))/extract(epoch from(span+make_interval(days=>s.gap_days))))::bigint;
   a=a+(span+make_interval(days=>s.gap_days))*cycles;b=a+span;
   if b<=t then a=b+make_interval(days=>s.gap_days);b=a+span;end if;
  end if;
  update public.lumi_competition_schedule set starts_at=a,ends_at=b,version=version+1,updated_at=t where id returning *into s;
 end if;
 if t<s.starts_at or t>=s.ends_at then return null;end if;
 select *into r from public.lumi_rounds where status='active' and starts_at=s.starts_at and ends_at=s.ends_at limit 1;
 if not found then
  insert into public.lumi_rounds(title,starts_at,ends_at,target,winner_limit,prize_azn,selection_mode,prize_enabled)
  values(s.title,s.starts_at,s.ends_at,0,3,public.lumi_rule('competition_prize_azn',5),'top3',true)returning *into r;
 end if;
 return r.id;
end;$$;
revoke all on function public.lumi_current_round()from public,anon,authenticated;

create or replace function public.lumi_competition_credit()returns trigger language plpgsql security definer set search_path='' as $$
declare rid uuid;total bigint;other record;r public.lumi_rounds%rowtype;begin
 rid=public.lumi_current_round();if rid is null then return new;end if;
 select *into r from public.lumi_rounds where id=rid for update;
 if new.created_at<r.starts_at or new.created_at>=r.ends_at then return new;end if;
 insert into public.lumi_week_scores(round_id,user_id,points)values(rid,new.user_id,greatest(0,new.delta))
 on conflict(round_id,user_id)do update set points=greatest(0,public.lumi_week_scores.points+new.delta),updated_at=clock_timestamp();
 if new.delta>0 and exists(select 1 from public.user_profiles where id=new.user_id and leaderboard_visible and not is_suspended and not deletion_pending)then
  for other in with ranks as(select s.user_id,
   row_number()over(order by s.points desc,p.created_at,p.id)::integer as current_rank,
   row_number()over(order by(s.points-case when s.user_id=new.user_id then new.delta else 0 end)desc,p.created_at,p.id)::integer as previous_rank
   from public.lumi_week_scores s join public.user_profiles p on p.id=s.user_id where s.round_id=rid and p.leaderboard_visible and not p.is_suspended and not p.deletion_pending)
   select *from ranks where current_rank<>previous_rank and(user_id=new.user_id or current_rank>previous_rank)
  loop perform public.lumi_rank_event(other.user_id,rid,other.previous_rank,other.current_rank,new.id::text);end loop;
 end if;return new;end;$$;
revoke all on function public.lumi_competition_credit()from public,anon,authenticated;

create or replace function public.lumi_admin_competition(p_action text default 'overview',p_data jsonb default '{}',p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.lumi_control_settings%rowtype;s public.lumi_competition_schedule%rowtype;r public.lumi_rounds%rowtype;
 prior public.lumi_admin_requests%rowtype;result jsonb;old jsonb;a timestamptz;b timestamptz;reason text;en boolean;roundid uuid;
begin
 if not public.is_lumi_admin()then raise exception 'Admin access required'using errcode='42501';end if;
 select *into cfg from public.lumi_control_settings where id for update;
 perform pg_advisory_xact_lock(4973678982999079);
 select *into s from public.lumi_competition_schedule where id for update;
 if p_action<>'overview'then
  if p_request is null then raise exception 'Request id required';end if;
  reason=trim(coalesce(p_data->>'reason',''));if length(reason)not between 3 and 500 then raise exception 'Reason required';end if;
  select *into prior from public.lumi_admin_requests where request_id=p_request;
  if found then
   if prior.actor_id<>auth.uid()or prior.operation<>'competition.'||p_action or prior.payload<>p_data then raise exception 'Request conflict';end if;
   return prior.result;
  end if;
  old=to_jsonb(s)||jsonb_build_object('enabled',cfg.data->'competition_enabled');
  if p_action='toggle'then
   if jsonb_typeof(p_data->'enabled')is distinct from 'boolean'then raise exception 'Enabled must be boolean';end if;
   en=(p_data->>'enabled')::boolean;
   update public.lumi_competition_schedule set version=version+1,updated_at=clock_timestamp()where id;
  elsif p_action='save'then
   if(p_data->>'version')::integer is distinct from s.version then raise exception 'Schedule changed; reload';end if;
   a=(p_data->>'starts_at')::timestamptz;b=(p_data->>'ends_at')::timestamptz;
   if a is null or b is null or b<=clock_timestamp()or b-a<interval '1 hour'or b-a>interval '60 days' then raise exception 'Invalid campaign dates';end if;
   if jsonb_typeof(p_data->'enabled')is distinct from 'boolean'or jsonb_typeof(p_data->'auto_repeat')is distinct from 'boolean'then raise exception 'Boolean required';end if;
   if nullif(trim(p_data->>'title'),'')is null then raise exception 'Title required';end if;
   roundid=nullif(p_data->>'round_id','')::uuid;
   if roundid is not null then
    select *into r from public.lumi_rounds where id=roundid and status='active'and finalized_at is null for update;
    if not found then raise exception 'Campaign already finished';end if;
    if a<>r.starts_at and exists(select 1 from public.lumi_week_scores where round_id=r.id and points>0)then raise exception 'Cannot move start after points were earned';end if;
   else
    if a<clock_timestamp()-interval '1 minute'then raise exception 'New campaign must start in the future';end if;
    if exists(select 1 from public.lumi_rounds where status='active'and finalized_at is null and ends_at+make_interval(days=>(p_data->>'gap_days')::integer)>a)then raise exception 'Allow the configured break after the current campaign';end if;
   end if;
   if exists(select 1 from public.lumi_rounds where status='active'and id is distinct from roundid and starts_at<b and ends_at>a)then raise exception 'Campaign dates overlap';end if;
   update public.lumi_competition_schedule set title=left(trim(p_data->>'title'),100),starts_at=a,ends_at=b,
    gap_days=(p_data->>'gap_days')::integer,auto_repeat=(p_data->>'auto_repeat')::boolean,version=version+1,updated_at=clock_timestamp()where id;
   if roundid is not null then update public.lumi_rounds set title=left(trim(p_data->>'title'),100),starts_at=a,ends_at=b where id=roundid;end if;
   en=(p_data->>'enabled')::boolean;
  else raise exception 'Unknown campaign action';end if;
  update public.lumi_control_settings set data=jsonb_set(data,'{competition_enabled}',to_jsonb(en)),version=version+1 where id;
 end if;
 perform public.lumi_current_round();
 select *into s from public.lumi_competition_schedule where id;
 select *into r from public.lumi_rounds where status='active'and finalized_at is null order by starts_at desc limit 1;
 result=jsonb_build_object('schedule',to_jsonb(s),'enabled',(select data->'competition_enabled' from public.lumi_control_settings where id),'round',case when r.id is null then null else to_jsonb(r)end);
 if p_action<>'overview'then
  insert into public.admin_audit(actor_id,action,target_id,before_data,after_data,reason)values(auth.uid(),'competition.'||p_action,'global',old,result,reason);
  insert into public.lumi_admin_requests(request_id,actor_id,operation,payload,result)values(p_request,auth.uid(),'competition.'||p_action,p_data,result);
 end if;return result;
end;$$;
revoke all on function public.lumi_admin_competition(text,jsonb,uuid)from public,anon;
grant execute on function public.lumi_admin_competition(text,jsonb,uuid)to authenticated;

-- Older admin versions retain a working switch, without destroying earned results.
do $patch$declare s text;begin
 s=pg_get_functiondef('public.lumi_admin_control(text,jsonb,uuid)'::regprocedure);
 s=replace(s,'select *into cfg from public.lumi_control_settings where id for update;',
 'if p_action in(''round_start'',''round_close'')then return public.lumi_admin_competition(''toggle'',p_data||jsonb_build_object(''enabled'',p_action=''round_start''),p_request);end if;select *into cfg from public.lumi_control_settings where id for update;');
 s=replace(s,'update public.lumi_rounds set prize_enabled=(v->>''competition_enabled'')::boolean where status=''active''and selection_mode=''top3'';','');
 execute s;
end;$patch$;

create or replace function public.lumi_rankings()returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid=public.require_lumi_player();rid uuid;begin
 perform public.lumi_current_round();select id into rid from public.lumi_rounds where status='active'and starts_at<=clock_timestamp()and ends_at>clock_timestamp()order by starts_at desc limit 1;
 return coalesce((select jsonb_agg(to_jsonb(q))from(select row_number()over(order by s.points desc,s.updated_at,p.id)as place,p.username,p.avatar_index,p.avatar_path,s.points,
 coalesce(b.icon,'')as badge,coalesce(b.label,'')as badge_label,p.id=u as mine from public.lumi_week_scores s join public.user_profiles p on p.id=s.user_id
 left join public.lumi_badges b on b.user_id=p.id where s.round_id=rid and s.points>0 and not p.is_suspended and not p.deletion_pending and p.leaderboard_visible
 order by s.points desc,s.updated_at,p.id limit 100)q),'[]'::jsonb);
end;$$;

create or replace function public.lumi_platform_state()returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid=public.require_lumi_player();r public.lumi_rounds%rowtype;finished public.lumi_rounds%rowtype;s public.lumi_competition_schedule%rowtype;enabled boolean;state text;begin
 perform public.lumi_current_round();select *into s from public.lumi_competition_schedule where id;
 select *into r from public.lumi_rounds where status='active'and starts_at<=clock_timestamp()and ends_at>clock_timestamp()order by starts_at desc limit 1;
 enabled=coalesce((select(data->>'competition_enabled')::boolean from public.lumi_control_settings where id),false);
 state=case when not enabled then 'disabled'when r.id is not null then 'active'when s.starts_at>clock_timestamp()then 'scheduled'else 'finished'end;
 select *into finished from public.lumi_rounds where selection_mode='top3'and finalized_at is not null and prize_enabled order by ends_at desc limit 1;
 return jsonb_build_object('rules',(select data from public.lumi_control_settings where id),'version',(select version from public.lumi_control_settings where id),
 'round',case when r.id is null then null else to_jsonb(r)||jsonb_build_object('prize_enabled',enabled and r.prize_enabled)end,
 'competition',jsonb_build_object('status',state,'enabled',enabled,'next_starts_at',s.starts_at,'next_ends_at',s.ends_at,'gap_days',s.gap_days,'auto_repeat',s.auto_repeat),
 'results_round',case when finished.id is null then null else to_jsonb(finished)end,
 'week_points',coalesce((select points from public.lumi_week_scores where user_id=u and round_id=r.id),0),
 'my_rank',(select(q->>'place')::int from jsonb_array_elements(public.lumi_rankings())q where(q->>'mine')::boolean),
 'coins',coalesce((select coins from public.eyo_players where user_id=u),80),'ad_next_at',(select next_at from public.lumi_ad_rewards where user_id=u),'server_now',clock_timestamp(),
 'badge',(select to_jsonb(b)from public.lumi_badges b where user_id=u),
 'winners',coalesce((select jsonb_agg(jsonb_build_object('place',w.place,'username',p.username,'points',w.points,'avatar_index',p.avatar_index,'avatar_path',p.avatar_path,'created_at',w.created_at)order by w.place)from public.lumi_round_results w join public.user_profiles p on p.id=w.user_id where w.round_id=finished.id),'[]'::jsonb),
 'my_winner',(select to_jsonb(w)from public.lumi_round_results w where w.round_id=finished.id and w.user_id=u));end;$$;
notify pgrst,'reload schema';
commit;
