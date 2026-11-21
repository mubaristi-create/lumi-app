begin;
do $test$
declare u uuid=gen_random_uuid();rid uuid;event uuid=gen_random_uuid();n integer;test_round uuid=gen_random_uuid();ids uuid[];v uuid;i integer;begin
 insert into auth.users(id,email,raw_user_meta_data)values(u,'lumi-test-'||u||'@example.invalid','{}');
 insert into public.user_profiles(id,username)values(u,'LumiTest210')on conflict(id)do nothing;
 insert into public.lumi_notification_preferences(user_id,locale,push_enabled)values(u,'en',false)on conflict(user_id)do update set locale='en',push_enabled=false;
 select id into rid from public.lumi_rounds order by starts_at desc limit 1;
 perform public.lumi_rank_event(u,rid,10,11,event::text);
 perform public.lumi_rank_event(u,rid,11,12,event::text);
 if exists(select 1 from public.user_notifications where user_id=u)then raise exception 'Small rank change notified';end if;
 perform public.lumi_rank_event(u,rid,12,13,event::text);
 perform public.lumi_rank_event(u,rid,12,14,gen_random_uuid()::text);
 select count(*) into n from public.user_notifications where user_id=u;
 if n<>1 then raise exception 'Rank cooldown failed %',n;end if;
 if not exists(select 1 from public.user_notifications n join public.lumi_push_queue q on q.notification_id=n.id and q.title=n.title and q.body=n.body where n.user_id=u and n.title='Your ranking has changed')then raise exception 'Inbox/push language mismatch';end if;
 update public.lumi_rank_notice_state set last_notice=clock_timestamp()-interval '31 minutes' where user_id=u;
 perform public.lumi_rank_event(u,rid,2,1,gen_random_uuid()::text);
 if not exists(select 1 from public.user_notifications where user_id=u and title='Congratulations! You are #1!')then raise exception 'Leader gain absent';end if;
 update public.lumi_notification_preferences set ranking=false where user_id=u;
 update public.lumi_rank_notice_state set last_notice=clock_timestamp()-interval '31 minutes' where user_id=u;
 perform public.lumi_rank_event(u,rid,1,2,gen_random_uuid()::text);
 if (select count(*)from public.user_notifications where user_id=u)<>2 then raise exception 'Disabled rank preference ignored';end if;
 insert into public.lumi_rounds(id,title,starts_at,ends_at,status,selection_mode,prize_enabled,target,winner_limit)values(test_round,'Rollback-only notification test',clock_timestamp()-interval '2 hours',clock_timestamp()-interval '1 hour','closed','top3',true,10000,3);
 ids=array[]::uuid[];
 for i in 1..4 loop
 v=gen_random_uuid();ids=array_append(ids,v);
 insert into auth.users(id,email,raw_user_meta_data)values(v,'lumi-test-'||v||'@example.invalid','{}');
 insert into public.user_profiles(id,username)values(v,'LumiTestResult'||i)on conflict(id)do nothing;
 insert into public.lumi_week_scores(round_id,user_id,points)values(test_round,v,i*100);
 end loop;
 perform public.lumi_finalize_round(test_round);perform public.lumi_finalize_round(test_round);
 if (select count(*)from public.lumi_round_results where round_id=test_round)<>3 then raise exception 'Top3 final result failed';end if;
 if (select count(*)from public.user_notifications where user_id=any(ids)and event_key='weekly-result:'||test_round)<>4 then raise exception 'Weekly result once per participant failed';end if;
 if (select count(*)from public.user_notifications where user_id=any(ids)and kind='result')<>1 then raise exception 'Nonwinner missing';end if;
 if has_function_privilege('anon','public.lumi_rank_event(uuid,uuid,integer,integer,text)','execute') then raise exception 'Private event helper exposed';end if;
end;$test$;
rollback;
select 'PASS: small-change suppression, 30-minute cooldown, language/inbox/push equality, leader gain, opt-out, finalized top3 and nonwinner once; all fixture data rolled back' as validation;
