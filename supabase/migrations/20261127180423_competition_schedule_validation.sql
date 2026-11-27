begin;
do $patch$declare s text;begin
 s=pg_get_functiondef('public.lumi_admin_competition(text,jsonb,uuid)'::regprocedure);
 if position('where status=''active''and finalized_at is null and ends_at+'in s)=0 then raise exception 'Campaign validation source changed';end if;
 s=replace(s,'where status=''active''and finalized_at is null and ends_at+','where selection_mode=''top3''and prize_enabled and ends_at+');
 s=replace(s,'update public.lumi_control_settings set data=jsonb_set(data,''{competition_enabled}'',to_jsonb(en)),version=version+1 where id;',
 'update public.lumi_control_settings set data=jsonb_set(data,''{competition_enabled}'',to_jsonb(en)),version=version+1 where id;
  if en then update public.lumi_rounds set prize_enabled=true where status=''active''and finalized_at is null and ends_at>clock_timestamp();end if;');
 execute s;
end;$patch$;
notify pgrst,'reload schema';
commit;
