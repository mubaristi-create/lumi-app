-- Server-authoritative events; no balance, progress or historical notification removal.
alter table public.lumi_notification_preferences add column locale text not null default 'az' check(locale in('az','en','ru'));
create table public.lumi_rank_notice_state(
 round_id uuid not null references public.lumi_rounds(id),user_id uuid not null references public.user_profiles(id),
 baseline_rank integer not null,current_rank integer not null,last_notice timestamptz,
 primary key(round_id,user_id));
alter table public.lumi_rank_notice_state enable row level security;
revoke all on public.lumi_rank_notice_state from public,anon,authenticated;

create function public.lumi_event_copy(p_kind text,p_locale text,p_place integer default null,p_points bigint default null)
returns jsonb language sql immutable set search_path='' as $$
select case p_locale
when 'en' then jsonb_build_object('title',case p_kind when 'leader_gained' then 'Congratulations! You are #1!' when 'leader_lost' then 'The lead changed hands' when 'rank_drop' then 'Your ranking has changed' when 'winner' then 'You are among this week’s winners!' when 'result' then 'A new week, a new opportunity' else 'Your daily mascot bonus is ready' end,
'body',case p_kind when 'leader_gained' then 'You currently lead the weekly race. Keep playing to defend your position!' when 'leader_lost' then 'Another player took first place. The race is still on — you can climb back!' when 'rank_drop' then 'You are now # '||p_place||'. Keep collecting LUMI to climb the leaderboard.' when 'winner' then 'You finished #'||p_place||' with '||p_points||' LUMI. Check your official result and prize instructions in Lumi.' when 'result' then 'You did not place in the top three this time. A new weekly race brings another chance!' else 'Play with your mascot and collect your daily LUMI bonus.' end)
when 'ru' then jsonb_build_object('title',case p_kind when 'leader_gained' then 'Поздравляем! Вы на первом месте!' when 'leader_lost' then 'Лидер сменился' when 'rank_drop' then 'Ваша позиция изменилась' when 'winner' then 'Вы среди победителей недели!' when 'result' then 'Новая неделя — новый шанс' else 'Ежедневный бонус маскота готов' end,
'body',case p_kind when 'leader_gained' then 'Вы лидируете в недельном соревновании. Продолжайте играть, чтобы удержать позицию!' when 'leader_lost' then 'Другой игрок вышел на первое место. Соревнование продолжается — вы ещё можете вернуться!' when 'rank_drop' then 'Теперь вы на месте '||p_place||'. Собирайте LUMI и поднимайтесь в рейтинге.' when 'winner' then 'Вы заняли место '||p_place||' с '||p_points||' LUMI. Итог и условия получения приза доступны в Lumi.' when 'result' then 'В этот раз вы не вошли в тройку. Новая недельная гонка — новая возможность!' else 'Играйте с маскотом и получайте ежедневный бонус LUMI.' end)
else jsonb_build_object('title',case p_kind when 'leader_gained' then 'Təbriklər! Sən hazırda 1-ci yerdəsən!' when 'leader_lost' then 'Liderlik əldən getdi!' when 'rank_drop' then 'Sıralamadakı mövqeyin dəyişdi!' when 'winner' then 'Təbriklər! Həftənin qalibləri arasındasan!' when 'result' then 'Yeni həftə, yeni fürsət!' else 'Gündəlik maskot bonusun hazırdır' end,
'body',case p_kind when 'leader_gained' then 'Liderliyini qorumaq üçün oynamağa davam et!' when 'leader_lost' then 'Amma yarış hələ bitməyib. Yenidən birinci ola bilərsən!' when 'rank_drop' then 'Hazırda '||p_place||'-ci yerdəsən. Yenidən yüksəlmək üçün LUMI toplamağa davam et!' when 'winner' then 'Həftəni '||p_place||'-ci yerdə, '||p_points||' LUMI ilə bitirdin. Rəsmi nəticəni və mükafat təlimatlarını Lumi-də yoxla.' when 'result' then 'Bu dəfə ilk üçlüyə düşmədin, amma növbəti həftə yeni fürsətin var! Oynamağa davam et!' else 'Maskotla oyna və gündəlik LUMI bonusunu topla.' end) end
$$;
revoke all on function public.lumi_event_copy(text,text,integer,bigint) from public,anon,authenticated;

create or replace function public.lumi_notice(p_user uuid,p_title text,p_body text,p_event text)
returns void language plpgsql security definer set search_path='' as $$begin
 insert into public.user_notifications(user_id,title,body,event_key) values(p_user,p_title,p_body,p_event) on conflict(user_id,event_key)do nothing;
 -- The existing AFTER INSERT trigger alone fans out the exact inbox notification.
end;$$;

create function public.lumi_rank_event(p_user uuid,p_round uuid,p_old integer,p_new integer,p_event text)
returns void language plpgsql security definer set search_path='' as $$
declare s public.lumi_rank_notice_state%rowtype;pref public.lumi_notification_preferences%rowtype;k text;c jsonb;begin
 insert into public.lumi_rank_notice_state(round_id,user_id,baseline_rank,current_rank)values(p_round,p_user,p_old,p_new)on conflict do nothing;
 select * into s from public.lumi_rank_notice_state where round_id=p_round and user_id=p_user for update;
 update public.lumi_rank_notice_state set current_rank=p_new,baseline_rank=least(baseline_rank,p_new) where round_id=p_round and user_id=p_user;
 select * into pref from public.lumi_notification_preferences where user_id=p_user;
 if pref.ranking=false then return;end if;
 k=case when p_new=1 and p_old>1 then 'leader_gained' when p_old=1 and p_new>1 then 'leader_lost' when p_new>=s.baseline_rank+3 then 'rank_drop' else null end;
 if k is null or s.last_notice>clock_timestamp()-interval '30 minutes' or
 (select count(*)from public.user_notifications where user_id=p_user and event_key like 'rank:%' and created_at>clock_timestamp()-interval '24 hours')>=6 then return;end if;
 c=public.lumi_event_copy(k,coalesce(pref.locale,'az'),p_new);
 perform public.lumi_notice(p_user,c->>'title',c->>'body','rank:'||p_round||':'||p_event||':'||k);
 update public.lumi_rank_notice_state set baseline_rank=p_new,last_notice=clock_timestamp() where round_id=p_round and user_id=p_user;
end;$$;
revoke all on function public.lumi_rank_event(uuid,uuid,integer,integer,text) from public,anon,authenticated;

create or replace function public.lumi_competition_credit()returns trigger language plpgsql security definer set search_path='' as $$
declare rid uuid;r public.lumi_rounds%rowtype;total bigint;other record;begin
 rid=public.lumi_current_round();select *into r from public.lumi_rounds where id=rid for update;
 select balance into total from public.wallets where user_id=new.user_id;
 insert into public.lumi_week_scores(round_id,user_id,points)values(rid,new.user_id,total)on conflict(round_id,user_id)do update set points=excluded.points,updated_at=clock_timestamp();
 if new.delta>0 and exists(select 1 from public.user_profiles where id=new.user_id and leaderboard_visible and not is_suspended and not deletion_pending)then
 for other in
 with ranks as(select w.user_id,
 row_number()over(order by w.balance desc,p.created_at,p.id)::integer as current_rank,
 row_number()over(order by (w.balance-case when w.user_id=new.user_id then new.delta else 0 end) desc,p.created_at,p.id)::integer as previous_rank
 from public.wallets w join public.user_profiles p on p.id=w.user_id where w.week_start=public.lumi_week_start() and p.leaderboard_visible and not p.is_suspended and not p.deletion_pending)
 select *from ranks where current_rank<>previous_rank and(user_id=new.user_id or current_rank>previous_rank)
 loop perform public.lumi_rank_event(other.user_id,rid,other.previous_rank,other.current_rank,new.id::text);end loop;
 end if;return new;end;$$;

create or replace function public.lumi_finalize_round(p_round uuid)returns void language plpgsql security definer set search_path='' as $$
declare r public.lumi_rounds%rowtype;w record;c jsonb;lang text;begin
 select *into r from public.lumi_rounds where id=p_round for update;
 if not found or r.selection_mode<>'top3' or r.finalized_at is not null or r.ends_at>clock_timestamp()then return;end if;
 if r.prize_enabled then
 insert into public.lumi_round_results(round_id,user_id,place,points)
 select r.id,s.user_id,row_number()over(order by s.points desc,s.updated_at,s.user_id)::int,s.points from public.lumi_week_scores s join public.user_profiles p on p.id=s.user_id where s.round_id=r.id and s.points>0 and not p.is_suspended and not p.deletion_pending and p.leaderboard_visible order by s.points desc,s.updated_at,s.user_id limit 3 on conflict do nothing;
 end if;
 update public.lumi_rounds set status='closed',finalized_at=clock_timestamp()where id=r.id;
 if r.prize_enabled then
 for w in select s.user_id,s.points,x.place from public.lumi_week_scores s join public.user_profiles p on p.id=s.user_id left join public.lumi_round_results x on x.round_id=s.round_id and x.user_id=s.user_id where s.round_id=r.id and s.points>0 and not p.is_suspended and not p.deletion_pending and p.leaderboard_visible
 loop
 if coalesce((select ranking from public.lumi_notification_preferences where user_id=w.user_id),true)=false then continue;end if;
 if exists(select 1 from public.user_notifications where user_id=w.user_id and(event_key='weekly-result:'||r.id or event_key like 'weekly-result:'||r.id||':%'))then continue;end if;
 select locale into lang from public.lumi_notification_preferences where user_id=w.user_id;
 c=public.lumi_event_copy(case when w.place is null then 'result' else 'winner'end,coalesce(lang,'az'),w.place,w.points);
 insert into public.user_notifications(user_id,title,body,event_key,kind,route)values(w.user_id,c->>'title',c->>'body','weekly-result:'||r.id,case when w.place is null then 'result' else 'winner'end,'index.html#home')on conflict(user_id,event_key)do nothing;
 end loop;end if;end;$$;
CREATE OR REPLACE FUNCTION public.lumi_notification_tick(p_now timestamp with time zone DEFAULT clock_timestamp())
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare r record;slot bigint=floor(extract(epoch from p_now)/3600);h timestamptz=date_trunc('hour',p_now);n integer=0;i integer;title text;body text;begin
 perform pg_advisory_xact_lock(hashtext('lumi-notification-clock'));
 for r in select p.id,p.created_at,coalesce(s.hourly,true)hourly,coalesce(s.daily,true)daily from public.user_profiles p left join public.lumi_notification_preferences s on s.user_id=p.id where not p.is_suspended and not p.deletion_pending loop
 if r.daily and coalesce((select(value->>'daily')::boolean from public.app_settings where key='games'),false)then
 insert into public.user_notifications(user_id,title,body,event_key,kind,route)
 select r.id,'Gündəlik maskot bonusun hazırdır ☀️','Maskotla oyna və gündəlik LUMI xallarını topla.','daily-ready:'||coalesce(g.id::text,'first'),'daily','daily-bonus.html'from(select 1)x left join lateral(select id,next_eligible_at from public.game_runs where user_id=r.id and game='daily'order by started_at desc,id desc limit 1)g on true where g.id is null or g.next_eligible_at<=p_now on conflict(user_id,event_key)do nothing;if found then n=n+1;end if;
 end if;end loop;return n;end;$function$;

CREATE OR REPLACE FUNCTION public.lumi_notification_settings(p_changes jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare u uuid=public.require_lumi_player();p public.lumi_notification_preferences%rowtype;begin
 insert into public.lumi_notification_preferences(user_id)values(u)on conflict do nothing;
 if p_changes is not null then
 if jsonb_typeof(p_changes)<>'object' or exists(select 1 from jsonb_object_keys(p_changes)k where k not in('push_enabled','hourly','daily','ranking','locale'))then raise exception 'Invalid notification settings';end if;
 if p_changes ? 'locale' and (p_changes->>'locale' is null or p_changes->>'locale' not in('az','en','ru')) then raise exception 'Invalid notification language';end if;
 update public.lumi_notification_preferences set locale=coalesce(p_changes->>'locale',locale), push_enabled=coalesce((p_changes->>'push_enabled')::boolean,push_enabled),hourly=coalesce((p_changes->>'hourly')::boolean,hourly),daily=coalesce((p_changes->>'daily')::boolean,daily),ranking=coalesce((p_changes->>'ranking')::boolean,ranking),updated_at=clock_timestamp()where user_id=u;
 end if;select *into p from public.lumi_notification_preferences where user_id=u;return to_jsonb(p)-'user_id';end;$function$;

create function public.lumi_daily_notice_language() returns trigger language plpgsql security definer set search_path='' as $$
declare c jsonb;lang text;begin
 if new.kind='daily' or new.event_key like 'daily-ready:%' then
 select locale into lang from public.lumi_notification_preferences where user_id=new.user_id;
 c=public.lumi_event_copy('daily',coalesce(lang,'az'));new.title=c->>'title';new.body=c->>'body';
 end if;return new;end;$$;
revoke all on function public.lumi_daily_notice_language() from public,anon,authenticated;
create trigger lumi_daily_notice_language before insert on public.user_notifications for each row execute function public.lumi_daily_notice_language();
