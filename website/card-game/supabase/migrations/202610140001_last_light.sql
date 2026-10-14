-- Last Light only. Apply in the existing Lumara project before deploying the frontend.
-- No retrospective tables, policies, users or functions are changed.
begin;
create schema if not exists last_light_private;
revoke all on schema last_light_private from public, anon, authenticated;

create table if not exists last_light_private.rooms (
  code text primary key check (code ~ '^[a-z0-9]{12}$'),
  owner_id uuid not null,
  version bigint not null default 1 check (version >= 1),
  users jsonb not null check (jsonb_typeof(users) = 'array'),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
alter table last_light_private.rooms enable row level security;
revoke all on last_light_private.rooms from public, anon, authenticated;
create index if not exists last_light_rooms_owner on last_light_private.rooms(owner_id);

-- Realtime delivers only a version change. Each player then fetches their filtered view.
create table if not exists public.last_light_room_updates (
  code text primary key references last_light_private.rooms(code) on delete cascade,
  version bigint not null,
  updated_at timestamptz not null default now()
);
alter table public.last_light_room_updates enable row level security;
revoke all on public.last_light_room_updates from public, anon, authenticated;
grant select on public.last_light_room_updates to authenticated;

create or replace function public.last_light_is_member(p_code text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from last_light_private.rooms r where r.code = p_code
    and r.expires_at > now() and r.users @> jsonb_build_array(auth.uid()::text));
$$;
revoke all on function public.last_light_is_member(text) from public, anon, authenticated;
grant execute on function public.last_light_is_member(text) to authenticated;
drop policy if exists last_light_member_updates on public.last_light_room_updates;
create policy last_light_member_updates on public.last_light_room_updates for select to authenticated
  using (public.last_light_is_member(code));

-- These RPCs can only be called by the authenticated Edge Function's service client.
create or replace function public.last_light_create(p_code text, p_owner uuid, p_users jsonb, p_state jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text, 0));
  -- Only rooms still in use count: unfinished, unexpired, and active recently
  -- (an idle lobby frees its slot after an hour, an idle game after a day).
  if (select count(*) from last_light_private.rooms r join public.last_light_room_updates u on u.code = r.code
      where r.owner_id = p_owner and r.expires_at > now() and r.state->'winner' = 'null'::jsonb
        and u.updated_at > now() - case when r.state->>'phase' = 'lobby' then interval '1 hour' else interval '1 day' end) >= 5 then
    raise exception using errcode = 'LL429', message = 'You already have five active rooms. Finish a game before creating another.';
  end if;
  if jsonb_array_length(p_users) < 2 or jsonb_array_length(p_users) > 10 or p_users->>0 <> p_owner::text then
    raise exception 'Invalid room members';
  end if;
  insert into last_light_private.rooms(code, owner_id, users, state) values(p_code, p_owner, p_users, p_state);
  insert into public.last_light_room_updates(code, version) values(p_code, 1);
end;
$$;

create or replace function public.last_light_load(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('code', code, 'version', version, 'users', users, 'state', state)
  from last_light_private.rooms where code = p_code and expires_at > now();
$$;

-- Every save keeps the room alive for seven days from now. p_notify = false (private hand reorders)
-- saves without waking other players.
drop function if exists public.last_light_commit(text, bigint, jsonb, jsonb);
create or replace function public.last_light_commit(p_code text, p_version bigint, p_users jsonb, p_state jsonb, p_notify boolean default true)
returns boolean language plpgsql security definer set search_path = '' as $$
declare next_version bigint;
begin
  update last_light_private.rooms set users = p_users, state = p_state, version = version + 1, expires_at = now() + interval '7 days'
  where code = p_code and version = p_version and expires_at > now()
  returning version into next_version;
  if next_version is null then return false; end if;
  if p_notify then
    update public.last_light_room_updates set version = next_version, updated_at = now() where code = p_code;
  end if;
  return true;
end;
$$;
revoke all on function public.last_light_create(text, uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.last_light_load(text) from public, anon, authenticated;
revoke all on function public.last_light_commit(text, bigint, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.last_light_create(text, uuid, jsonb, jsonb) to service_role;
grant execute on function public.last_light_load(text) to service_role;
grant execute on function public.last_light_commit(text, bigint, jsonb, jsonb, boolean) to service_role;

-- The test harness and fresh local databases may not have this publication.
do $$ begin
  if exists(select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') and
    not exists(select 1 from pg_catalog.pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'last_light_room_updates') then
    alter publication supabase_realtime add table public.last_light_room_updates;
  end if;
end $$;
commit;
