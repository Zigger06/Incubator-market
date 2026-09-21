-- Additive migration: existing messages remain valid as phone callbacks.
alter table public.contact_messages
  add column preferred_channel text not null default 'phone'
    check (preferred_channel in ('phone', 'whatsapp', 'telegram')),
  add column telegram_username text not null default '',
  add constraint contact_telegram_username check (
    (preferred_channel = 'telegram' and telegram_username ~ '^[a-zA-Z][a-zA-Z0-9_]{4,31}$')
    or (preferred_channel <> 'telegram' and telegram_username = '')
  );

create or replace function public.submit_contact(p_hash text,p_message jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare k text; n integer; channel text := coalesce(p_message->>'preferred_channel','phone');
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid key';end if;
 -- Preserve global-first locking and both rate limits from the first migration.
 foreach k in array array['global',p_hash] loop
  insert into private.contact_limits(key,window_start,count) values(k,now(),1)
  on conflict(key) do update set count=case when private.contact_limits.window_start<now()-interval '1 hour' then 1 else private.contact_limits.count+1 end,window_start=case when private.contact_limits.window_start<now()-interval '1 hour' then now() else private.contact_limits.window_start end
  returning count into n;
  if n>(case when k='global' then 100 else 5 end) then raise exception 'rate limited';end if;
 end loop;
 delete from private.contact_limits where window_start<now()-interval '2 days';
 insert into public.contact_messages(name,phone,subject,message,preferred_channel,telegram_username)
 values(trim(p_message->>'name'),p_message->>'phone',trim(p_message->>'subject'),trim(p_message->>'message'),
 channel,case when channel='telegram' then coalesce(p_message->>'telegram_username','') else '' end);
end;
$$;
revoke all on function public.submit_contact(text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_contact(text,jsonb) to service_role;
