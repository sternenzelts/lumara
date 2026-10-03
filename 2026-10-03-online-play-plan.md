# Lumara Online Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put Lumara online, so anyone with the link can register (nickname only) and a team can play a retro together. The website gets a pre-registration section. Both are hosted on GitHub Pages.

**Architecture:**
- A new `Backend` implementation (`backend/supabase.ts`) sits behind the existing `Backend` interface, so game screens don't change.
- **Writes go through Postgres functions (RPC)** that run with elevated rights (`security definer`) and repeat the local backend's rules: stage, Warden, vote limit, welcome wishes, balances.
- **Tables are read-only to clients.** Their row-level security lets players read team data, and only their own author and voter links.
- **Live play uses Supabase Realtime:**
  - `postgres_changes` re-fetches the watched data;
  - one broadcast and presence channel carries cues and positions.
- **GitHub Actions** builds the website and the game into one Pages site: the website at `/`, the game at `/play/`.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, `@supabase/supabase-js` v2, Supabase (Auth anonymous + email, Postgres, Realtime), GitHub Actions + GitHub Pages.

**Spec:** `gacha-art/2026-10-03-online-play-design.md`

## Global Constraints
- **Hosting:** GitHub Pages on Jay's account **`sternenzelts`**, repo **`lumara`**, **public**. Website at `https://sternenzelts.github.io/lumara/`, game at `https://sternenzelts.github.io/lumara/play/`.
- **Players register with a nickname only.** Supabase **anonymous sign-in**, no email, no Google.
- **Admin** is Jay, by email login (magic link), via a hidden "Warden sign-in". Anonymous users are never admins.
- **Anyone may register.** There's no domain restriction.
- **The pre-registration reward is exactly 6,000 Starlight**, granted once on the first game load of a pre-registered player. **No title.**
- **Milestone tiers:** +200 Starlight for everyone at 10, 25 and 50 pre-registrations.
- **Launch:** 16 Oct 2026. After launch, the website section switches to "Play now →".
- **Anonymity:**
  - `fragments` and `votes` rows never contain a user id;
  - author and voter links are readable only by their owner;
  - nothing in the app lets anyone, including the Warden or an admin, see authors.
- **Thought and vote rules:**
  - a thought only during `fragment_drop`;
  - a vote only during `vote`;
  - at most **3** votes per player per session;
  - the server enforces all three.
- **The local demo backend stays.** The backend is chosen by `import.meta.env.VITE_SUPABASE_URL`: present means Supabase, absent means local.
- **The game look stays.** No licence or legal warnings anywhere.
- **Every task ends with `npx tsc --noEmit -p .` and `npx vitest run` green** in `interface/`, and in `website/` for website tasks.

## Review Focus
1. **Returning visitor.** Opening the game again in the same browser must sign in silently as the same player. Pin it with an adapter test: an existing session means `signInAnonymously` isn't called (Task 5).
2. **Two tabs, same player.** Cues aren't doubled, and presence isn't shown as a peer of yourself. Test: `onPeers` excludes your own key (Task 6).
3. **Losing the network mid-voyage.** The Realtime channel reconnects and watchers re-fetch. Test: firing the channel status `SUBSCRIBED` again triggers a re-fetch (Task 4).
4. **Pre-registering twice, or from the game and the website.** The reward is granted once. A SQL test calls `claim_prereg_reward()` twice and checks there's a single grant (Task 2).
5. **A Warden who left.** An admin can still move the stage. A SQL test has an admin call `set_session` on someone else's session (Task 2).

---

## File map
| File | Role |
|---|---|
| `lumara/` (new git repo root = `gacha-art/`) | `.gitignore` excludes `node_modules`, `dist`, raw `characters/**/source*`, `.impeccable` and `sanctuary/*.blend` |
| `supabase/migrations/0001_lumara.sql` | tables, row-level security, RPC functions |
| `supabase/tests/0001_lumara_test.sql` | SQL assertions run with `execute_sql` |
| `interface/src/backend/supabaseRows.ts` | pure row ↔ type mappers |
| `interface/src/backend/supabaseRows.test.ts` | mapper tests |
| `interface/src/backend/supabase.ts` | the `createSupabaseBackend(client)` adapter |
| `interface/src/backend/supabase.test.ts` | adapter tests with a fake client |
| `interface/src/backend/index.ts` | picks Supabase or local |
| `interface/src/components/AdminSignIn.tsx` | the hidden Warden email sign-in (`#warden-login`) |
| `website/src/preregister.ts` | pre-registration client (sign-in, `preregister` RPC, count) |
| `website/src/Preregister.tsx` | the website section |
| `.github/workflows/pages.yml` | build both, deploy Pages |
| `.github/workflows/keepalive.yml` | ping Supabase every 3 days |

---

### Task 1: Repo on GitHub (`sternenzelts/lumara`, public)

**Files:**
- Create: `gacha-art/.gitignore`
- Create: `gacha-art/README.md`
- Interfaces: Consumes nothing. Produces the repo `sternenzelts/lumara` on `main`.

- [ ] **Step 1: Write `.gitignore`**
```gitignore
node_modules/
dist/
.impeccable/
**/.playwright-mcp/
*.blend
*.blend1
characters/**/chibi/*_source.webp
characters/**/_unused/
characters/**/audio/
**/*.mp4
.env
.env.*
```
- [ ] **Step 2: Check the size before committing**

Run: `cd gacha-art && git init -b main && git add -A && git count-objects -vH && git ls-files | xargs -I{} du -k "{}" 2>/dev/null | sort -rn | head -5`

Expected: no single file is 95 MB or more. If one is, add it to `.gitignore` and repeat.
- [ ] **Step 3: Write the README.** Explain what each folder is, `npm run dev` for both apps, and that live data needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] **Step 4: Commit and create the public repo**
```bash
git commit -m "chore: initial import of Lumara (game, website, art pipeline)"
gh repo create sternenzelts/lumara --public --source . --remote origin --push
```
Expected: `https://github.com/sternenzelts/lumara` exists with `main`.

---

### Task 2: Supabase project, schema, rules and SQL tests

**Prerequisite (Jay):** create a free Supabase account. Then Claude uses the Supabase tool:
1. `list_organizations`
2. `get_cost` / `confirm_cost`
3. `create_project` named `lumara` in the nearest region

Each step needs Jay's OK. Then, in the dashboard:
- Auth → **enable Anonymous sign-ins**.
- Auth → Email → **enable magic link**.
- **Site URL** = `https://sternenzelts.github.io/lumara/`.

**Files:**
- Create: `supabase/migrations/0001_lumara.sql`
- Create: `supabase/tests/0001_lumara_test.sql`
- Interfaces: Produces these RPC names and argument names, which Tasks 4, 5, 8 and 9 call exactly:
  - `ensure_player()`, `set_nickname(p_name)`, `mark_intro_seen()`, `set_display_character(p_character)`
  - `append_pull(p_character, p_grade, p_source, p_session)`
  - `create_session(p_name)`, `set_session(p_session, p_patch jsonb)`, `join_session(p_session)`, `set_my_character(p_session, p_character)`
  - `add_fragment(p_session, p_text, p_category)`, `delete_my_fragment(p_fragment)`, `my_fragment_ids(p_session)`
  - `cast_vote(p_session, p_fragment)`, `remove_my_vote(p_session, p_fragment)`, `my_votes(p_session)`
  - `add_vow(p_session, p_text, p_owner)`, `update_vow(p_vow, p_patch jsonb)`
  - `grant_currency(p_user, p_currency, p_amount)`, `save_settings(p_data jsonb)`
  - `preregister(p_name)`, `prereg_count()`, `claim_prereg_reward()`, `is_admin()`, `keepalive()`

- [ ] **Step 1: Write the SQL tests first** (`supabase/tests/0001_lumara_test.sql`)

They impersonate users with `set_config('request.jwt.claims', …)` and `set role authenticated`. Each block raises on failure.
```sql
-- helpers
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),  -- admin (Jay)
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  -- admin creates a voyage; b and c join
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint T')).id as id;
  select set_session((select id from t_sess), '{"stage":"fragment_drop"}');
  reset role;
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- b writes a thought; c cannot see who wrote it
  create temp table t_frag as select (add_fragment((select id from t_sess), 'hello', 'spark')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  do $$ begin if exists (select 1 from fragment_authors) then raise exception 'FAIL: c can read b''s author link'; end if; end $$;
  do $$ begin if (select count(*) from fragments) <> 1 then raise exception 'FAIL: c cannot read thoughts'; end if; end $$;
  -- c is not Warden: cannot change stage
  do $$ begin begin perform set_session((select id from t_sess), '{"stage":"vote"}'); raise exception 'FAIL: non-Warden moved stage'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- voting is closed during fragment_drop
  do $$ begin begin perform cast_vote((select id from t_sess), (select id from t_frag)); raise exception 'FAIL: vote outside Vote stage'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- admin (not Warden of record? he is) moves to vote; c votes 3 times, 4th rejected
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"vote"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select cast_vote((select id from t_sess), (select id from t_frag)); select cast_vote((select id from t_sess), (select id from t_frag)); select cast_vote((select id from t_sess), (select id from t_frag));
  do $$ begin begin perform cast_vote((select id from t_sess), (select id from t_frag)); raise exception 'FAIL: 4th vote accepted'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin if exists (select 1 from information_schema.columns where table_name in ('fragments','votes') and column_name like '%user%') then raise exception 'FAIL: author column on public table'; end if; end $$;
  -- pre-registration reward once
  select preregister('Bee'); select claim_prereg_reward(); select claim_prereg_reward();
  do $$ begin if (select count(*) from currency_grants where user_id = '00000000-0000-0000-0000-00000000000c' and amount = 6000) <> 1 then raise exception 'FAIL: prereg reward not exactly once'; end if; end $$;
  -- admin can act on a session whose Warden left
  reset role; update sessions set warden_id = '00000000-0000-0000-0000-00000000000b' where id = (select id from t_sess);
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"hall"}');
  -- anonymous users are never admins
  reset role; insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000b');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin if is_admin() then raise exception 'FAIL: anonymous user is admin'; end if; end $$;
rollback;
```
- [ ] **Step 2: Run them before the migration.** Use `execute_sql` with the file contents.

Expected: ERROR, because the functions don't exist yet.
- [ ] **Step 3: Write the migration** (`supabase/migrations/0001_lumara.sql`)
```sql
create extension if not exists pgcrypto;
create or replace function now_ms() returns bigint language sql stable as $$ select (extract(epoch from now())*1000)::bigint $$;

create table app_admins (user_id uuid primary key references auth.users on delete cascade);
create table settings (id int primary key default 1 check (id = 1), data jsonb not null);
insert into settings(data) values ('{"pullMode":"fresh","rates":{"sPlusPlus":0.005,"sPlus":0.03},"pity":{"enabled":true,"sPlus":30,"sPlusPlus":100},"featuredCharacterId":"mahesvara","movement":true,"skipVowReview":false,"starlight":{"start":1200,"attend":300,"perVote":50,"perVow":200,"pullCost":200},"stardust":{"dupeA":10,"dupeSPlus":50,"dupeSPlusPlus":50,"costA":60,"costSPlus":300,"costSPlusPlus":1000}}');
create table players (user_id uuid primary key references auth.users on delete cascade, nickname text, intro_seen bool not null default false,
  display_character_id text, owned jsonb not null default '{}', preregistered_at bigint, prereg_claimed bool not null default false, created_at bigint not null default now_ms());
create table pulls (id uuid primary key default gen_random_uuid(), user_id uuid not null references players on delete cascade, character_id text not null,
  grade text not null check (grade in ('S++','S+','A')), source text not null check (source in ('opening','banner','exchange','welcome')), duplicate bool not null, session_id uuid, at bigint not null default now_ms());
create table currency_grants (id uuid primary key default gen_random_uuid(), user_id uuid not null references players on delete cascade, currency text not null check (currency in ('starlight','stardust')),
  amount int not null check (amount between 1 and 1000000), by_user_id uuid, at bigint not null default now_ms());
create table sessions (id uuid primary key default gen_random_uuid(), sprint_name text not null, stage text not null default 'register', status text not null default 'active' check (status in ('active','paused','ended')),
  warden_id uuid not null references auth.users, current_fragment_id uuid, timer_ends_at bigint, created_at bigint not null default now_ms());
create table attendance (session_id uuid references sessions on delete cascade, user_id uuid references players on delete cascade, joined_at bigint not null default now_ms(), votes_cast int not null default 0, character_id text, primary key (session_id, user_id));
create table fragments (id uuid primary key default gen_random_uuid(), session_id uuid not null references sessions on delete cascade, text text not null check (length(text) between 1 and 1500),
  category text not null check (category in ('radiance','fracture','spark','wildcard')), created_at bigint not null default now_ms());
create table fragment_authors (fragment_id uuid primary key references fragments on delete cascade, user_id uuid not null references auth.users);
create table votes (id uuid primary key default gen_random_uuid(), session_id uuid not null references sessions on delete cascade, fragment_id uuid not null references fragments on delete cascade);
create table vote_owners (vote_id uuid primary key references votes on delete cascade, user_id uuid not null references auth.users, session_id uuid not null);
create table vows (id uuid primary key default gen_random_uuid(), session_id uuid not null references sessions on delete cascade, text text not null check (length(text) between 1 and 1000),
  owner_id uuid, status text not null default 'open' check (status in ('open','fulfilled','not_yet','carried','dropped')), created_at bigint not null default now_ms());

-- read rules: everyone signed in reads team data; author/voter links only their owner. No client writes at all (RPC only).
alter table settings enable row level security; alter table players enable row level security; alter table pulls enable row level security;
alter table currency_grants enable row level security; alter table sessions enable row level security; alter table attendance enable row level security;
alter table fragments enable row level security; alter table fragment_authors enable row level security; alter table votes enable row level security;
alter table vote_owners enable row level security; alter table vows enable row level security; alter table app_admins enable row level security;
create policy read_all on settings for select to authenticated using (true);
create policy read_all on players for select to authenticated using (true);
create policy read_all on pulls for select to authenticated using (true);
create policy read_all on currency_grants for select to authenticated using (true);
create policy read_all on sessions for select to authenticated using (true);
create policy read_all on attendance for select to authenticated using (true);
create policy read_all on fragments for select to authenticated using (true);
create policy read_all on votes for select to authenticated using (true);
create policy read_all on vows for select to authenticated using (true);
create policy read_own on fragment_authors for select to authenticated using (user_id = auth.uid());
create policy read_own on vote_owners for select to authenticated using (user_id = auth.uid());

-- helpers
create or replace function is_admin() returns bool language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins a join auth.users u on u.id = a.user_id where a.user_id = auth.uid() and coalesce(u.is_anonymous,false) = false) $$;
create or replace function ensure_player() returns void language sql security definer set search_path = public as $$
  insert into players(user_id) values (auth.uid()) on conflict do nothing $$;
create or replace function require_stage(p_session uuid, allowed text[]) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from sessions where id = p_session and status = 'active' and stage = any(allowed)) then raise exception 'The retro has moved on. Your screen will follow the current stage.'; end if;
  if not exists (select 1 from attendance where session_id = p_session and user_id = auth.uid()) then raise exception 'Join this retro first.'; end if;
end $$;
create or replace function require_warden(p_session uuid) returns sessions language plpgsql security definer set search_path = public as $$
declare s sessions; begin
  select * into s from sessions where id = p_session;
  if s.id is null then raise exception 'This retro is no longer available. Return to the Sanctuary.'; end if;
  if not is_admin() and s.warden_id <> auth.uid() then raise exception 'Only the Warden can change this retro.'; end if;
  return s; end $$;

-- player
create or replace function set_nickname(p_name text) returns void language plpgsql security definer set search_path = public as $$
declare n text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')); begin
  if length(n) < 2 or length(n) > 16 then raise exception 'Choose a name between 2 and 16 characters.'; end if;
  perform ensure_player(); update players set nickname = n where user_id = auth.uid(); end $$;
create or replace function mark_intro_seen() returns void language sql security definer set search_path = public as $$
  insert into players(user_id, intro_seen) values (auth.uid(), true) on conflict (user_id) do update set intro_seen = true $$;
create or replace function set_display_character(p_character text) returns void language plpgsql security definer set search_path = public as $$
begin if coalesce((select (owned->>p_character)::int from players where user_id = auth.uid()),0) < 1 then raise exception 'You have not collected this character yet.'; end if;
  update players set display_character_id = p_character where user_id = auth.uid(); end $$;
create or replace function starlight_balance(p_user uuid) returns int language sql stable security definer set search_path = public as $$
  with st as (select data->'starlight' s from settings)
  select greatest(0, (select (s->>'start')::int from st)
    + coalesce((select sum(amount) from currency_grants where user_id = p_user and currency = 'starlight'),0)
    + (select (s->>'attend')::int from st) * (select count(distinct session_id) from attendance where user_id = p_user)
    + (select (s->>'perVote')::int from st) * coalesce((select sum(votes_cast) from attendance where user_id = p_user),0)
    + (select (s->>'perVow')::int from st) * (select count(*) from vows where status = 'fulfilled')
    - (select (s->>'pullCost')::int from st) * (select count(*) from pulls where user_id = p_user and source = 'banner'))::int $$;
create or replace function stardust_balance(p_user uuid) returns int language sql stable security definer set search_path = public as $$
  with sd as (select data->'stardust' d from settings)
  select greatest(0, coalesce((select sum(amount) from currency_grants where user_id = p_user and currency = 'stardust'),0)
    + coalesce((select sum(case when p.source = 'exchange' then -(case p.grade when 'S++' then (d->>'costSPlusPlus')::int when 'S+' then (d->>'costSPlus')::int else (d->>'costA')::int end)
                               when p.duplicate then (case p.grade when 'S++' then (d->>'dupeSPlusPlus')::int when 'S+' then (d->>'dupeSPlus')::int else (d->>'dupeA')::int end) else 0 end)
                from pulls p, sd where p.user_id = p_user),0))::int $$;
create or replace function append_pull(p_character text, p_grade text, p_source text, p_session uuid default null) returns pulls language plpgsql security definer set search_path = public as $$
declare me players; dup bool; r pulls; st jsonb := (select data from settings); welcome_claimed int; begin
  perform ensure_player(); select * into me from players where user_id = auth.uid() for update;
  if p_source = 'welcome' then
    select count(*) into welcome_claimed from pulls where user_id = auth.uid() and source = 'welcome';
    if me.nickname is null or not me.intro_seen or welcome_claimed >= 5 or (welcome_claimed = 0 and exists (select 1 from pulls where user_id = auth.uid())) then raise exception 'Your free welcome wishes are already claimed or unavailable.'; end if;
  elsif p_source = 'banner' and starlight_balance(auth.uid()) < (st->'starlight'->>'pullCost')::int then raise exception 'You need % Starlight for a wish.', st->'starlight'->>'pullCost';
  elsif p_source = 'exchange' and stardust_balance(auth.uid()) < (case p_grade when 'S++' then (st->'stardust'->>'costSPlusPlus')::int when 'S+' then (st->'stardust'->>'costSPlus')::int else (st->'stardust'->>'costA')::int end) then raise exception 'You need more Stardust for this exchange.';
  elsif p_source = 'opening' and (p_session is null or exists (select 1 from pulls where user_id = auth.uid() and source = 'opening' and session_id = p_session)) then raise exception 'You already claimed this voyage’s free wish.'; end if;
  dup := coalesce((me.owned->>p_character)::int,0) > 0;
  insert into pulls(user_id, character_id, grade, source, duplicate, session_id) values (auth.uid(), p_character, p_grade, p_source, dup, p_session) returning * into r;
  update players set owned = jsonb_set(owned, array[p_character], to_jsonb(coalesce((owned->>p_character)::int,0) + 1)), display_character_id = coalesce(display_character_id, p_character) where user_id = auth.uid();
  return r; end $$;

-- sessions
create or replace function create_session(p_name text) returns sessions language plpgsql security definer set search_path = public as $$
declare s sessions; begin
  if not is_admin() then raise exception 'Ask Jay to start a retro.'; end if;
  if btrim(coalesce(p_name,'')) = '' then raise exception 'Give this voyage a name.'; end if;
  if exists (select 1 from sessions where status <> 'ended') then raise exception 'A retro is already in progress. Join it from the Sanctuary.'; end if;
  insert into sessions(sprint_name, warden_id) values (left(btrim(p_name), 80), auth.uid()) returning * into s;
  perform ensure_player(); insert into attendance(session_id, user_id) values (s.id, auth.uid()); return s; end $$;
create or replace function set_session(p_session uuid, p_patch jsonb) returns void language plpgsql security definer set search_path = public as $$
begin perform require_warden(p_session);
  update sessions set stage = coalesce(p_patch->>'stage', stage), status = coalesce(p_patch->>'status', status),
    current_fragment_id = case when p_patch ? 'currentFragmentId' then (p_patch->>'currentFragmentId')::uuid else current_fragment_id end,
    timer_ends_at = case when p_patch ? 'timerEndsAt' then (p_patch->>'timerEndsAt')::bigint else timer_ends_at end,
    sprint_name = coalesce(left(p_patch->>'sprintName', 80), sprint_name), warden_id = coalesce((p_patch->>'wardenId')::uuid, warden_id)
  where id = p_session; end $$;
create or replace function join_session(p_session uuid) returns void language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from sessions where id = p_session and status <> 'ended') then raise exception 'No active retro with that code. Check the code with your Warden.'; end if;
  perform ensure_player(); insert into attendance(session_id, user_id) values (p_session, auth.uid()) on conflict do nothing; end $$;
create or replace function set_my_character(p_session uuid, p_character text) returns void language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from attendance where session_id = p_session and user_id = auth.uid()) then raise exception 'Join the retro first.'; end if;
  if coalesce((select (owned->>p_character)::int from players where user_id = auth.uid()),0) < 1 then raise exception 'Choose a character from your collection.'; end if;
  update attendance set character_id = p_character where session_id = p_session and user_id = auth.uid(); end $$;

-- thoughts and votes (anonymous)
create or replace function add_fragment(p_session uuid, p_text text, p_category text) returns fragments language plpgsql security definer set search_path = public as $$
declare f fragments; begin
  if btrim(coalesce(p_text,'')) = '' then raise exception 'Write a thought before sending it.'; end if;
  perform require_stage(p_session, array['fragment_drop']);
  insert into fragments(session_id, text, category) values (p_session, left(btrim(p_text),1500), p_category) returning * into f;
  insert into fragment_authors values (f.id, auth.uid()); return f; end $$;
create or replace function delete_my_fragment(p_fragment uuid) returns void language plpgsql security definer set search_path = public as $$
declare sid uuid := (select session_id from fragments where id = p_fragment); begin
  if not exists (select 1 from fragment_authors where fragment_id = p_fragment and user_id = auth.uid()) then raise exception 'You can only remove your own thoughts.'; end if;
  perform require_stage(sid, array['fragment_drop']); delete from fragments where id = p_fragment; end $$;
create or replace function my_fragment_ids(p_session uuid) returns setof uuid language sql stable security definer set search_path = public as $$
  select a.fragment_id from fragment_authors a join fragments f on f.id = a.fragment_id where a.user_id = auth.uid() and f.session_id = p_session $$;
create or replace function cast_vote(p_session uuid, p_fragment uuid) returns void language plpgsql security definer set search_path = public as $$
declare v uuid; n int; begin
  perform require_stage(p_session, array['vote']);
  select count(*) into n from vote_owners where user_id = auth.uid() and session_id = p_session;
  if n >= 3 then raise exception 'You have used all three votes. Remove one to vote elsewhere.'; end if;
  if not exists (select 1 from fragments where id = p_fragment and session_id = p_session) then raise exception 'This thought is no longer available.'; end if;
  insert into votes(session_id, fragment_id) values (p_session, p_fragment) returning id into v;
  insert into vote_owners values (v, auth.uid(), p_session);
  update attendance set votes_cast = n + 1 where session_id = p_session and user_id = auth.uid(); end $$;
create or replace function remove_my_vote(p_session uuid, p_fragment uuid) returns void language plpgsql security definer set search_path = public as $$
declare v uuid; begin perform require_stage(p_session, array['vote']);
  select o.vote_id into v from vote_owners o join votes x on x.id = o.vote_id where o.user_id = auth.uid() and x.session_id = p_session and x.fragment_id = p_fragment limit 1;
  if v is null then raise exception 'You have no vote on this thought.'; end if;
  delete from votes where id = v;
  update attendance set votes_cast = (select count(*) from vote_owners where user_id = auth.uid() and session_id = p_session) where session_id = p_session and user_id = auth.uid(); end $$;
create or replace function my_votes(p_session uuid) returns setof uuid language sql stable security definer set search_path = public as $$
  select x.fragment_id from vote_owners o join votes x on x.id = o.vote_id where o.user_id = auth.uid() and x.session_id = p_session $$;

-- vows
create or replace function add_vow(p_session uuid, p_text text, p_owner uuid) returns vows language plpgsql security definer set search_path = public as $$
declare v vows; begin perform require_warden(p_session);
  if btrim(coalesce(p_text,'')) = '' then raise exception 'Write an action item first.'; end if;
  insert into vows(session_id, text, owner_id) values (p_session, left(btrim(p_text),1000), p_owner) returning * into v; return v; end $$;
create or replace function update_vow(p_vow uuid, p_patch jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from vows where id = p_vow) then raise exception 'This vow is no longer available.'; end if;
  if not is_admin() and not exists (select 1 from sessions where status <> 'ended' and warden_id = auth.uid()) then raise exception 'Only the Warden can update vows.'; end if;
  update vows set text = coalesce(left(p_patch->>'text',1000), text), status = coalesce(p_patch->>'status', status),
    owner_id = case when p_patch ? 'ownerId' then (p_patch->>'ownerId')::uuid else owner_id end where id = p_vow; end $$;

-- admin
create or replace function grant_currency(p_user uuid, p_currency text, p_amount int) returns void language plpgsql security definer set search_path = public as $$
declare active sessions; begin
  select * into active from sessions where status <> 'ended' order by created_at desc limit 1;
  if not is_admin() and (active.id is null or active.warden_id <> auth.uid() or not exists (select 1 from attendance where session_id = active.id and user_id = p_user)) then raise exception 'Only an admin or this party’s Warden can give currency.'; end if;
  insert into currency_grants(user_id, currency, amount, by_user_id) values (p_user, p_currency, p_amount, auth.uid()); end $$;
create or replace function save_settings(p_data jsonb) returns void language plpgsql security definer set search_path = public as $$
begin if not is_admin() then raise exception 'Only Jay can change settings.'; end if; update settings set data = p_data where id = 1; end $$;

-- pre-registration
create or replace function preregister(p_name text) returns void language plpgsql security definer set search_path = public as $$
begin perform set_nickname(p_name); update players set preregistered_at = coalesce(preregistered_at, now_ms()) where user_id = auth.uid(); end $$;
create or replace function prereg_count() returns int language sql stable security definer set search_path = public as $$ select count(*)::int from players where preregistered_at is not null $$;
grant execute on function prereg_count() to anon;
create or replace function claim_prereg_reward() returns int language plpgsql security definer set search_path = public as $$
declare me players; n int := prereg_count(); bonus int := 6000 + 200 * ((n >= 10)::int + (n >= 25)::int + (n >= 50)::int); begin
  select * into me from players where user_id = auth.uid() for update;
  if me.user_id is null or me.preregistered_at is null or me.prereg_claimed then return 0; end if;
  insert into currency_grants(user_id, currency, amount, by_user_id) values (auth.uid(), 'starlight', 6000, null);
  if bonus > 6000 then insert into currency_grants(user_id, currency, amount, by_user_id) values (auth.uid(), 'starlight', bonus - 6000, null); end if;
  update players set prereg_claimed = true where user_id = auth.uid(); return bonus; end $$;
create or replace function keepalive() returns int language sql stable security definer set search_path = public as $$ select 1 $$;
grant execute on function keepalive() to anon;

-- realtime: publish the tables the game watches
alter publication supabase_realtime add table players, pulls, currency_grants, sessions, attendance, fragments, votes, vows, settings;
```
- [ ] **Step 4: Apply it.** `apply_migration` with name `0001_lumara` and the file body.

Expected: success.
- [ ] **Step 5: Run the SQL tests.** `execute_sql` with `supabase/tests/0001_lumara_test.sql`.

Expected: no `FAIL:` errors (the transaction rolls back).
- [ ] **Step 6: Make Jay admin.** After Jay signs in once by email (Task 7), run `insert into app_admins(user_id) select id from auth.users where email = '<jay's email>';`.
- [ ] **Step 7: Commit** `git add supabase && git commit -m "feat(db): Lumara schema, rules and RPCs with SQL tests"`

---

### Task 3: Row mappers (pure)

**Files:**
- Create: `interface/src/backend/supabaseRows.ts`
- Test: `interface/src/backend/supabaseRows.test.ts`
- Interfaces: Produces `toSession`, `toAttendance`, `toFragment`, `toVote`, `toVow`, `toPlayer(row, pulls, grants)` and `toSettings`, all returning the existing `types.ts` types.

- [ ] **Step 1: Failing test**
```ts
import { describe, expect, it } from 'vitest';
import { toPlayer, toSession, toVow } from './supabaseRows';

describe('row mappers', () => {
  it('maps a session row to a Session', () => {
    expect(toSession({ id: 's1', sprint_name: 'Sprint 9', stage: 'vote', status: 'active', warden_id: 'u1', current_fragment_id: null, timer_ends_at: null, created_at: 5 }))
      .toEqual({ id: 's1', sprintName: 'Sprint 9', stage: 'vote', status: 'active', wardenId: 'u1', currentFragmentId: null, timerEndsAt: null, createdAt: 5 });
  });
  it('builds a Player with pulls and grants, and old-shape defaults', () => {
    const p = toPlayer({ user_id: 'u1', nickname: null, intro_seen: false, display_character_id: null, owned: { wren: 1 } },
      [{ character_id: 'wren', grade: 'A', source: 'welcome', duplicate: false, session_id: null, at: 3 }],
      [{ id: 'g1', currency: 'starlight', amount: 6000, by_user_id: null, at: 4 }]);
    expect(p).toEqual({ userId: 'u1', nickname: null, introSeen: false, displayCharacterId: null, owned: { wren: 1 },
      pulls: [{ characterId: 'wren', grade: 'A', source: 'welcome', duplicate: false, at: 3 }],
      currencyGrants: [{ id: 'g1', currency: 'starlight', amount: 6000, byUserId: '', at: 4 }] });
  });
  it('keeps the voyage id on a free wish', () => {
    const p = toPlayer({ user_id: 'u1', nickname: 'A', intro_seen: true, display_character_id: null, owned: {} }, [{ character_id: 'rook', grade: 'A', source: 'opening', duplicate: false, session_id: 's1', at: 1 }], []);
    expect(p.pulls[0].sessionId).toBe('s1');
  });
  it('maps a vow', () => {
    expect(toVow({ id: 'v', session_id: 's', text: 't', owner_id: null, status: 'open', created_at: 1 })).toEqual({ id: 'v', sessionId: 's', text: 't', ownerId: null, status: 'open', createdAt: 1 });
  });
});
```
- [ ] **Step 2:** Run `npx vitest run src/backend/supabaseRows.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement**
```ts
import type { Attendance, CurrencyGrant, Fragment, Player, PullRecord, Session, Settings, Vote, Vow } from './types';
type Row = Record<string, any>;
export const toSession = (r: Row): Session => ({ id: r.id, sprintName: r.sprint_name, stage: r.stage, status: r.status, wardenId: r.warden_id, currentFragmentId: r.current_fragment_id ?? null, timerEndsAt: r.timer_ends_at ?? null, createdAt: Number(r.created_at) });
export const toAttendance = (r: Row): Attendance => ({ userId: r.user_id, sessionId: r.session_id, joinedAt: Number(r.joined_at), votesCast: r.votes_cast, characterId: r.character_id ?? null });
export const toFragment = (r: Row): Fragment => ({ id: r.id, sessionId: r.session_id, text: r.text, category: r.category, createdAt: Number(r.created_at) });
export const toVote = (r: Row): Vote => ({ id: r.id, sessionId: r.session_id, fragmentId: r.fragment_id });
export const toVow = (r: Row): Vow => ({ id: r.id, sessionId: r.session_id, text: r.text, ownerId: r.owner_id ?? null, status: r.status, createdAt: Number(r.created_at) });
const toPull = (r: Row): PullRecord => ({ characterId: r.character_id, grade: r.grade, source: r.source, duplicate: r.duplicate, at: Number(r.at), ...(r.session_id ? { sessionId: r.session_id } : {}) });
const toGrant = (r: Row): CurrencyGrant => ({ id: r.id, currency: r.currency, amount: r.amount, byUserId: r.by_user_id ?? '', at: Number(r.at) });
export const toPlayer = (r: Row, pulls: Row[], grants: Row[]): Player => ({ userId: r.user_id, nickname: r.nickname ?? null, introSeen: !!r.intro_seen, displayCharacterId: r.display_character_id ?? null, owned: r.owned ?? {}, pulls: pulls.map(toPull), currencyGrants: grants.map(toGrant) });
export const toSettings = (r: Row): Settings => r.data as Settings;
```
- [ ] **Step 4:** Run it again. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "feat(backend): Supabase row mappers"` (add the new files first).

---

### Task 4: Supabase backend: reads and live watching

**Files:**
- Create: `interface/src/backend/supabase.ts`
- Test: `interface/src/backend/supabase.test.ts`
- Modify: `interface/package.json` (add `@supabase/supabase-js@^2`)
- Interfaces:
  - Consumes the Task 3 mappers.
  - Produces `createSupabaseBackend(client: SupabaseClient, me: Me): Backend` with every `watch*`, `profiles`, `myFragmentIds` and `myVotes` working. The mutations come in Task 5.

- [ ] **Step 1: Install** `cd interface && npm i @supabase/supabase-js@^2`
- [ ] **Step 2: Failing test with a fake client.** It records `from().select()` calls and lets the test fire `postgres_changes` and status callbacks.
```ts
import { describe, expect, it, vi } from 'vitest';
import { createSupabaseBackend } from './supabase';

function fakeClient(tables: Record<string, any[]>) {
  const handlers: { table: string; cb: () => void }[] = []; let status: (s: string) => void = () => {};
  const query = (t: string) => { const q: any = { _rows: tables[t] || [], select: () => q, eq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] === v); return q; }, neq: (k: string, v: any) => { q._rows = q._rows.filter((r: any) => r[k] !== v); return q; }, in: (k: string, v: any[]) => { q._rows = q._rows.filter((r: any) => v.includes(r[k])); return q; }, order: () => q, then: (res: any) => res({ data: q._rows, error: null }) }; return q; };
  const channel: any = { on: (_: string, f: any, cb: () => void) => { handlers.push({ table: f.table, cb }); return channel; }, subscribe: (cb: (s: string) => void) => { status = cb; cb('SUBSCRIBED'); return channel; }, unsubscribe: vi.fn() };
  return { client: { from: query, channel: () => channel, removeChannel: vi.fn(), rpc: vi.fn(async () => ({ data: [], error: null })) } as any, fire: (t: string) => handlers.filter(h => h.table === t).forEach(h => h.cb()), resubscribe: () => status('SUBSCRIBED'), tables };
}
const me = { id: 'u1', name: 'Ana', isAdmin: false };
const flush = () => new Promise(r => setTimeout(r, 0));

describe('supabase backend reads', () => {
  it('watchActiveSession returns the newest non-ended session and updates on change', async () => {
    const f = fakeClient({ sessions: [{ id: 's1', sprint_name: 'A', stage: 'vote', status: 'active', warden_id: 'u2', created_at: 2 }] });
    const seen: any[] = []; createSupabaseBackend(f.client, me).watchActiveSession(s => seen.push(s?.id ?? null)); await flush();
    f.tables.sessions[0].status = 'ended'; f.fire('sessions'); await flush();
    expect(seen).toEqual(['s1', null]);
  });
  it('re-fetches when the channel reconnects (network drop)', async () => {
    const f = fakeClient({ vows: [] }); const cb = vi.fn(); createSupabaseBackend(f.client, me).watchVows(cb); await flush();
    f.tables.vows.push({ id: 'v', session_id: 's', text: 't', owner_id: null, status: 'open', created_at: 1 }); f.resubscribe(); await flush();
    expect(cb).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'v' })]);
  });
  it('watchPlayer never emits a provisional null for an existing player', async () => {
    const f = fakeClient({ players: [{ user_id: 'u1', nickname: 'Ana', intro_seen: true, owned: {} }], pulls: [], currency_grants: [] });
    const cb = vi.fn(); createSupabaseBackend(f.client, me).watchPlayer('u1', cb); await flush();
    expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toMatchObject({ userId: 'u1', nickname: 'Ana' });
  });
});
```
- [ ] **Step 3:** Run it. Expected: FAIL, module not found.
- [ ] **Step 4: Implement the reads.** A `live(tables, load, cb)` helper fetches once, then re-fetches on any change to the listed tables and on every `SUBSCRIBED` (reconnect).
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend, Me, Player, Session, Settings, Unsubscribe } from './types';
import { toAttendance, toFragment, toPlayer, toSession, toSettings, toVote, toVow } from './supabaseRows';

export function createSupabaseBackend(sb: SupabaseClient, me: Me): Backend {
  const rows = async (q: PromiseLike<{ data: any; error: any }>) => { const { data, error } = await q; if (error) throw new Error(error.message); return data as any[]; };
  let n = 0;
  const live = <T,>(tables: string[], load: () => Promise<T>, cb: (v: T) => void): Unsubscribe => {
    let alive = true; let seq = 0;
    const run = async () => { const mine = ++seq; try { const v = await load(); if (alive && mine === seq) cb(v); } catch (e) { console.error(e); } };
    const ch = sb.channel(`watch-${++n}`);
    tables.forEach(table => ch.on('postgres_changes' as any, { event: '*', schema: 'public', table }, () => void run()));
    ch.subscribe((status: string) => { if (status === 'SUBSCRIBED') void run(); });
    return () => { alive = false; sb.removeChannel(ch); };
  };
  const loadPlayer = async (userId: string): Promise<Player | null> => {
    const [p] = await rows(sb.from('players').select('*').eq('user_id', userId)); if (!p) return null;
    const [pulls, grants] = await Promise.all([rows(sb.from('pulls').select('*').eq('user_id', userId).order('at')), rows(sb.from('currency_grants').select('*').eq('user_id', userId))]);
    return toPlayer(p, pulls, grants);
  };
  const backend = {
    mode: 'artifact' as const,
    async me() { return me; },
    async profiles(ids: string[]) { const r = await rows(sb.from('players').select('user_id,nickname').in('user_id', ids)); return Object.fromEntries(ids.map(id => [id, { name: r.find(x => x.user_id === id)?.nickname || 'Warden' }])); },
    watchActiveSession: (cb: (s: Session | null) => void) => live(['sessions'], async () => (await rows(sb.from('sessions').select('*').neq('status', 'ended').order('created_at', { ascending: false }))).map(toSession)[0] ?? null, cb),
    watchSessions: (cb: (s: Session[]) => void) => live(['sessions'], async () => (await rows(sb.from('sessions').select('*').order('created_at', { ascending: false }))).map(toSession), cb),
    watchAttendance: (sid: string, cb: any) => live(['attendance'], async () => (await rows(sb.from('attendance').select('*').eq('session_id', sid))).map(toAttendance), cb),
    watchFragments: (sid: string, cb: any) => live(['fragments'], async () => (await rows(sb.from('fragments').select('*').eq('session_id', sid).order('created_at'))).map(toFragment), cb),
    watchVotes: (sid: string, cb: any) => live(['votes'], async () => (await rows(sb.from('votes').select('*').eq('session_id', sid))).map(toVote), cb),
    watchVows: (cb: any) => live(['vows'], async () => (await rows(sb.from('vows').select('*').order('created_at'))).map(toVow), cb),
    watchPlayer: (userId: string, cb: any) => live(['players', 'pulls', 'currency_grants'], () => loadPlayer(userId), cb),
    watchPlayers: (cb: any) => live(['players', 'pulls', 'currency_grants'], async () => {
      const [ps, pulls, grants] = await Promise.all([rows(sb.from('players').select('*')), rows(sb.from('pulls').select('*').order('at')), rows(sb.from('currency_grants').select('*'))]);
      return ps.map(p => toPlayer(p, pulls.filter(x => x.user_id === p.user_id), grants.filter(x => x.user_id === p.user_id))); }, cb),
    watchSettings: (cb: (s: Settings) => void) => live(['settings'], async () => toSettings((await rows(sb.from('settings').select('*')))[0]), cb),
    async myFragmentIds(sid: string) { const { data, error } = await sb.rpc('my_fragment_ids', { p_session: sid }); if (error) throw new Error(error.message); return (data ?? []) as string[]; },
    async myVotes(sid: string) { const { data, error } = await sb.rpc('my_votes', { p_session: sid }); if (error) throw new Error(error.message); return (data ?? []) as string[]; },
  };
  return backend as unknown as Backend;   // completed in Tasks 5 and 6
}
```
- [ ] **Step 5:** Run the tests. Expected: PASS (3).
- [ ] **Step 6: Commit** `git add -A interface && git commit -m "feat(backend): Supabase reads with live re-fetch"`

---

### Task 5: Supabase backend: writes (RPC), and sign-in on open

**Files:**
- Modify: `interface/src/backend/supabase.ts`
- Create: `interface/src/backend/supabaseAuth.ts`
- Test: `interface/src/backend/supabase.test.ts` (extend)
- Interfaces:
  - Consumes the Task 2 RPC names.
  - Produces every `Backend` write method, plus `connect(client): Promise<Me>` in `supabaseAuth.ts`. That signs in anonymously only when there's no session, calls `ensure_player`, and returns `{ id, name, isAdmin }`.

- [ ] **Step 1: Failing tests**
```ts
import { connect } from './supabaseAuth';
describe('supabase writes and sign-in', () => {
  it('castVote calls the RPC with the right names and surfaces its error text', async () => {
    const f = fakeClient({}); f.client.rpc = vi.fn(async () => ({ data: null, error: { message: 'You have used all three votes. Remove one to vote elsewhere.' } }));
    await expect(createSupabaseBackend(f.client, me).castVote('s1', 'f1')).rejects.toThrow('three votes');
    expect(f.client.rpc).toHaveBeenCalledWith('cast_vote', { p_session: 's1', p_fragment: 'f1' });
  });
  it('a returning visitor is not signed in again', async () => {
    const auth = { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u9', is_anonymous: true } } } })), signInAnonymously: vi.fn() };
    const client: any = { auth, rpc: vi.fn(async (name: string) => ({ data: name === 'is_admin' ? false : null, error: null })), from: () => ({ select: () => ({ eq: async () => ({ data: [{ nickname: 'Bo' }], error: null }) }) }) };
    expect(await connect(client)).toEqual({ id: 'u9', name: 'Bo', isAdmin: false });
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });
  it('a new visitor is signed in anonymously', async () => {
    const auth = { getSession: vi.fn(async () => ({ data: { session: null } })), signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'n1', is_anonymous: true } }, error: null })) };
    const client: any = { auth, rpc: vi.fn(async () => ({ data: false, error: null })), from: () => ({ select: () => ({ eq: async () => ({ data: [], error: null }) }) }) };
    expect((await connect(client)).id).toBe('n1'); expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });
});
```
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement the writes.** Add these to the `backend` object in `supabase.ts`:
```ts
    ...((call: (name: string, args?: object) => Promise<any>) => ({
      createSession: async (name: string) => toSession(await call('create_session', { p_name: name })),
      updateSession: (id: string, patch: object) => call('set_session', { p_session: id, p_patch: patch }),
      join: (sid: string) => call('join_session', { p_session: sid }),
      setMyCharacter: (sid: string, c: string) => call('set_my_character', { p_session: sid, p_character: c }),
      addFragment: async (sid: string, text: string, category: string) => toFragment(await call('add_fragment', { p_session: sid, p_text: text, p_category: category })),
      deleteMyFragment: (_sid: string, fid: string) => call('delete_my_fragment', { p_fragment: fid }),
      castVote: (sid: string, fid: string) => call('cast_vote', { p_session: sid, p_fragment: fid }),
      removeMyVote: (sid: string, fid: string) => call('remove_my_vote', { p_session: sid, p_fragment: fid }),
      addVow: async (sid: string, text: string, owner: string | null) => toVow(await call('add_vow', { p_session: sid, p_text: text, p_owner: owner })),
      updateVow: (id: string, patch: object) => call('update_vow', { p_vow: id, p_patch: patch }),
      grantCurrency: (userId: string, currency: string, amount: number) => call('grant_currency', { p_user: userId, p_currency: currency, p_amount: amount }),
      appendMyPull: (r: { characterId: string; grade: string; source: string; sessionId?: string }) => call('append_pull', { p_character: r.characterId, p_grade: r.grade, p_source: r.source, p_session: r.sessionId ?? null }),
      setMyDisplayCharacter: (c: string) => call('set_display_character', { p_character: c }),
      setMyNickname: (name: string) => call('set_nickname', { p_name: name }),
      markIntroSeen: () => call('mark_intro_seen'),
      saveSettings: (s: object) => call('save_settings', { p_data: s }),
    }))(async (name, args) => { const { data, error } = await sb.rpc(name, args); if (error) throw new Error(error.message); return data; }),
```
- [ ] **Step 4: Implement `supabaseAuth.ts`**
```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Me } from './types';
/** Silent sign-in: reuse this browser's session, or create an anonymous player. Then make sure the player row exists. */
export async function connect(sb: SupabaseClient): Promise<Me> {
  let user = (await sb.auth.getSession()).data.session?.user;
  if (!user) { const { data, error } = await sb.auth.signInAnonymously(); if (error) throw new Error(error.message); user = data.user!; }
  await sb.rpc('ensure_player');
  await sb.rpc('claim_prereg_reward');   // pre-registered Wardens get 6,000 Starlight on their first game load (once, server-side)
  const { data: rows } = await sb.from('players').select('nickname').eq('user_id', user.id);
  const { data: isAdmin } = await sb.rpc('is_admin');
  return { id: user.id, name: rows?.[0]?.nickname || 'Warden', isAdmin: !!isAdmin };
}
```
- [ ] **Step 5:** Run the tests. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -am "feat(backend): Supabase writes via RPC, silent anonymous sign-in"`

---

### Task 6: Live cues and presence (Realtime broadcast and presence)

**Files:**
- Modify: `interface/src/backend/supabase.ts`
- Test: `interface/src/backend/supabase.test.ts` (extend)
- Interfaces: Produces `emit`, `on`, `setPresence` and `onPeers`. Everyone signed in shares one channel, `lumara-live`. It's a team game with one voyage at a time.

- [ ] **Step 1: Failing tests**
```ts
describe('supabase cues and presence', () => {
  it('emit delivers to own listeners (self) and broadcasts', async () => {
    const sent: any[] = []; const bc: any[] = [];
    const ch: any = { on: (_t: string, f: any, cb: any) => { bc.push({ f, cb }); return ch; }, subscribe: () => ch, send: (m: any) => { sent.push(m); bc.filter(x => x.f.event === m.event).forEach(x => x.cb({ payload: m.payload })); }, track: vi.fn(), presenceState: () => ({}) };
    const client: any = { channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() };
    const b = createSupabaseBackend(client, me); const got: any[] = []; b.on('skill', (d, from) => got.push([d, from]));
    b.emit('skill', { x: 1 }); expect(got).toEqual([[{ x: 1 }, 'u1']]); expect(sent[0]).toMatchObject({ type: 'broadcast', event: 'skill' });
  });
  it('onPeers excludes your own presence', () => {
    let sync = () => {}; const ch: any = { on: (_t: string, f: any, cb: any) => { if (f.event === 'sync') sync = cb; return ch; }, subscribe: () => ch, send: vi.fn(), track: vi.fn(),
      presenceState: () => ({ u1: [{ x: 1, y: 1 }], u2: [{ x: 0.5, y: 0.5, facing: 'left', characterId: 'wren', moving: false }] }) };
    const b = createSupabaseBackend({ channel: () => ch, removeChannel: vi.fn(), from: () => ({}), rpc: vi.fn() } as any, me);
    const cb = vi.fn(); b.onPeers(cb); sync(); expect(Object.keys(cb.mock.lastCall![0])).toEqual(['u2']);
  });
});
```
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement.** Add these inside `createSupabaseBackend`, before `const backend`:
```ts
  const cueSubs = new Map<string, Set<(d: unknown, from: string) => void>>();
  const peerSubs = new Set<(p: Record<string, any>) => void>();
  let peers: Record<string, any> = {}; let lastSent = 0;
  const liveCh = sb.channel('lumara-live', { config: { broadcast: { self: false }, presence: { key: me.id } } });
  ['pull_reveal', 'reaction', 'stage_cue', 'skill', 'say'].forEach(event =>
    liveCh.on('broadcast' as any, { event }, ({ payload }: any) => cueSubs.get(event)?.forEach(fn => fn(payload.data, payload.from))));
  liveCh.on('presence' as any, { event: 'sync' }, () => {
    const state = liveCh.presenceState() as Record<string, any[]>;
    peers = Object.fromEntries(Object.entries(state).filter(([k, v]) => k !== me.id && v.length).map(([k, v]) => [k, v[v.length - 1]]));
    peerSubs.forEach(fn => fn({ ...peers }));
  });
  liveCh.subscribe();
```
Then add these to the `backend` object:
```ts
    emit(topic: string, data: unknown) { cueSubs.get(topic)?.forEach(fn => fn(data, me.id)); liveCh.send({ type: 'broadcast', event: topic, payload: { data, from: me.id } }); },
    on(topic: string, cb: (d: unknown, from: string) => void) { let s = cueSubs.get(topic); if (!s) cueSubs.set(topic, s = new Set()); s.add(cb); return () => { s!.delete(cb); }; },
    setPresence(p: object) { if (Date.now() - lastSent < 95) return; lastSent = Date.now(); void liveCh.track(p); },
    onPeers(cb: (p: Record<string, any>) => void) { peerSubs.add(cb); cb({ ...peers }); return () => { peerSubs.delete(cb); }; },
```
Own cues are delivered locally once (`self: false` on the channel), so none are doubled.

Remove the `as unknown as Backend` cast. The object now satisfies `Backend` in full, which `tsc` proves.
- [ ] **Step 4:** Run the tests and `npx tsc --noEmit -p .`. Expected: PASS, with no type errors.
- [ ] **Step 5: Commit** `git commit -am "feat(backend): Realtime cues and presence"`

---

### Task 7: Choosing the backend, startup, and the hidden Warden sign-in

**Files:**
- Modify: `interface/src/backend/index.ts`
- Modify: `interface/src/App.tsx:45` (`useState(getBackend)` becomes an async ready gate)
- Create: `interface/src/components/AdminSignIn.tsx`
- Create: `interface/.env.example`
- Test: `interface/src/backend/index.test.ts`
- Interfaces: Produces `loadBackend(): Promise<Backend>`. It gives Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, and local otherwise. The existing `getBackend()` stays for tests and the dev preview.

- [ ] **Step 1: Failing test**
```ts
import { describe, expect, it, vi } from 'vitest';
describe('loadBackend', () => {
  it('uses the local demo backend when no Supabase env is set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', ''); const { loadBackend } = await import('./index');
    expect((await loadBackend()).mode).toBe('local');
  });
});
```
- [ ] **Step 2:** Run it. Expected: FAIL, `loadBackend` is not exported.
- [ ] **Step 3: Implement `index.ts`**
```ts
import type { Backend } from './types';
import { createLocalBackend } from './local';
let instance: Backend | null = null;
export function configureBackend(backend: Backend) { instance = backend; }
export function getBackend(): Backend { return instance ||= createLocalBackend(); }
/** Live: Supabase (silent anonymous sign-in) when configured, else the single-browser demo. */
export async function loadBackend(): Promise<Backend> {
  if (instance) return instance;
  const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return (instance = createLocalBackend());
  const [{ createClient }, { createSupabaseBackend }, { connect }] = await Promise.all([import('@supabase/supabase-js'), import('./supabase'), import('./supabaseAuth')]);
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return (instance = createSupabaseBackend(sb, await connect(sb)));
}
```
- [ ] **Step 4: The App gate.** In `App.tsx`, wrap the existing `App` body as `Game`, and render it once the backend is ready:
```tsx
export default function App() {
  const [backend, setBackend] = useState<Backend | null>(null); const [err, setErr] = useState('');
  useEffect(() => { loadBackend().then(setBackend).catch(e => setErr(String(e?.message || e))); }, []);
  if (err) return <main className="fatal-error"><Sparkles size={40} /><h1>The Sanctuary is unreachable.</h1><p>{err}</p><Button onClick={() => location.reload()}>Try again</Button></main>;
  if (!backend) return <main className="opening" aria-busy="true" />;
  return location.hash === '#warden-login' ? <AdminSignIn /> : <Game backend={backend} />;
}
```
- [ ] **Step 4b: The Start button for new visitors (Jay, 2026-10-03).** `loadBackend()` signs in silently **only when this browser already has a session** (returning players). A **new** visitor sees a game-styled **"Start"** screen first: the Lumara title, Seren, and a gold **Start your voyage** button. Pressing it calls `signInAnonymously()`, then the existing intro and nickname step.
  - **Code:** split `connect` into two exports:
    - `resume(sb): Promise<Me | null>`: returns null when there's no session;
    - `start(sb): Promise<Me>`: signs in anonymously, then runs `ensure_player`, `claim_prereg_reward` and the profile.
  - **`App`:** when `resume` returns null, render `<StartScreen onStart={…} />`.
  - **Test:**
    - with no session, `loadBackend` doesn't call `signInAnonymously` and reports "needs start";
    - pressing Start calls it once.

`Game` takes `backend` as a prop in place of `useState(getBackend)`.
- [ ] **Step 5: `AdminSignIn.tsx`** (game styling, email magic link)
```tsx
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
export default function AdminSignIn() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [err, setErr] = useState('');
  const send = async () => { const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } }); if (error) setErr(error.message); else setSent(true); };
  return <main className="opening warden-login"><h1>Warden sign-in</h1>{sent ? <p>Check your email for the sign-in link.</p> : <>
    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" />
    <button className="game-action" onClick={send} disabled={!email}>Email me a link</button>{err && <p role="alert">{err}</p>}</>}</main>;
}
```
- [ ] **Step 6: A note in the opening for anonymous players.** On the nickname step, add one line: "Your Warden lives in this browser."
- [ ] **Step 7: `.env.example`**
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase → Project Settings → API>
```
- [ ] **Step 8:** Run `npx tsc --noEmit -p . && npx vitest run`. Expected: all green, with the existing tests still on the local backend.
- [ ] **Step 9: Live smoke test.** Create `interface/.env.local` with the real values, run `npm run dev` and open it in two browsers (normal and private):
  1. Both get the intro and a nickname.
  2. `#warden-login` signs Jay in.
  3. Run Task 2 Step 6 to make Jay admin.
  4. Jay creates a voyage; the other browser joins with the code.
  5. Walking shows on both screens, and skills, chatter and the lamp moment show on both.
- [ ] **Step 10: Commit** `git commit -am "feat: Supabase backend selection, silent sign-in, Warden email sign-in"`

---

### Task 8: Website pre-registration section

**Files:**
- Create: `website/src/preregister.ts`
- Create: `website/src/Preregister.tsx`
- Modify: `website/src/App.tsx` (render `<Preregister />` just above the final "The next dawn starts with you" section)
- Modify: `website/src/styles.css`
- Modify: `website/package.json` (add `@supabase/supabase-js@^2`)
- Test: `website/src/preregister.test.ts`
- Interfaces:
  - Consumes the RPCs `preregister(p_name)` and `prereg_count()`.
  - Produces `launchState(now: Date) → { live: boolean; days; hours; minutes }` and `milestoneLamps(count) → number` (0–3).

- [ ] **Step 1: Failing tests**
```ts
import { describe, expect, it } from 'vitest';
import { LAUNCH, launchState, milestoneLamps } from './preregister';
describe('pre-registration', () => {
  it('counts down to 16 Oct 2026 and switches to live at launch', () => {
    expect(launchState(new Date('2026-10-15T00:00:00+08:00'))).toMatchObject({ live: false, days: 1 });
    expect(launchState(LAUNCH)).toMatchObject({ live: true });
  });
  it('lights milestone lamps at 10, 25 and 50 Wardens', () => {
    expect([0, 9, 10, 24, 25, 50, 80].map(milestoneLamps)).toEqual([0, 0, 1, 1, 2, 3, 3]);
  });
});
```
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement `preregister.ts`**
```ts
import { createClient } from '@supabase/supabase-js';
export const LAUNCH = new Date('2026-10-16T09:00:00+08:00');
export const REWARD = 6000;
export const MILESTONES = [10, 25, 50];
export function launchState(now: Date) {
  const ms = Math.max(0, LAUNCH.getTime() - now.getTime());
  return { live: ms === 0, days: Math.floor(ms / 864e5), hours: Math.floor(ms / 36e5) % 24, minutes: Math.floor(ms / 6e4) % 60 };
}
export const milestoneLamps = (count: number) => MILESTONES.filter(m => count >= m).length;
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined, key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const sb = url && key ? createClient(url, key, { auth: { persistSession: true } }) : null;
export async function waitingCount(): Promise<number> { if (!sb) return 0; const { data } = await sb.rpc('prereg_count'); return data ?? 0; }
/** Same origin as the game, so this anonymous session IS the player's game account. */
export async function preregister(nickname: string): Promise<void> {
  if (!sb) throw new Error('Pre-registration opens soon.');
  if (!(await sb.auth.getSession()).data.session) { const { error } = await sb.auth.signInAnonymously(); if (error) throw new Error(error.message); }
  const { error } = await sb.rpc('preregister', { p_name: nickname }); if (error) throw new Error(error.message);
}
```
- [ ] **Step 4: Implement `Preregister.tsx`.** It's the game look: a gold-framed panel, Marcellus heading and the 12-lamp language.
  - **Heading:** "Pre-register for the first voyage."
  - **Countdown:** days, hours and minutes, re-computed every 30 s.
  - **Reward:** "**6,000 Starlight** waits for you on launch day."
  - **The Wardens counter:** "**N** Wardens waiting", with 3 lamps (lit = `milestoneLamps`) labelled 10, 25 and 50 (+200 each).
  - **The form:** a nickname field (2–16 characters) and **Pre-register**. On success: "You're registered, {nickname}. See you on 16 Oct." Store `prereg-name` in `localStorage` so it shows on revisit.
  - **When `launchState(now).live`:** hide the form and countdown, and show **Play now →** linking to `./play/`.
  - **Motion:** respects reduced motion and the site's Pause motion.
- [ ] **Step 5:** Run `cd website && npx vitest run && npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 6: Manual check** with `.env.local` set:
  1. Pre-register on the website.
  2. Open `/play/` in the same browser (after Task 9, or `npm run dev` on the game with the same Supabase).
  3. The player keeps the nickname and has **+6,000 Starlight**.
  4. Reload: there's no second grant.
- [ ] **Step 7: Commit** `git commit -am "feat(website): pre-registration with countdown, 6,000 Starlight reward and milestones"`

---

### Task 9: Deploying to GitHub Pages, and the keep-alive

**Files:**
- Create: `.github/workflows/pages.yml`
- Create: `.github/workflows/keepalive.yml`
- Interfaces:
  - Consumes the repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Set them with `gh secret set` from Jay's values.
  - Produces the live site.

- [ ] **Step 1: The deploy workflow**
```yaml
name: Deploy Lumara
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci && npm test && npm run build
        working-directory: interface
      - run: npm ci && npx vitest run && npm run build
        working-directory: website
      - run: mkdir -p website/dist/play && cp -r interface/dist/. website/dist/play/ && touch website/dist/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with: { path: website/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.d.outputs.page_url }}' }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```
- [ ] **Step 2: The keep-alive**
```yaml
name: Keep Supabase awake
on: { schedule: [{ cron: '0 3 */3 * *' }], workflow_dispatch: {} }
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST "${{ secrets.VITE_SUPABASE_URL }}/rest/v1/rpc/keepalive" \
            -H "apikey: ${{ secrets.VITE_SUPABASE_ANON_KEY }}" -H "Content-Type: application/json" -d '{}'
```
- [ ] **Step 3: Secrets, then turn on Pages**
```bash
gh secret set VITE_SUPABASE_URL --repo sternenzelts/lumara --body "<url>"
gh secret set VITE_SUPABASE_ANON_KEY --repo sternenzelts/lumara --body "<anon key>"
gh api -X POST repos/sternenzelts/lumara/pages -f build_type=workflow
```
- [ ] **Step 4: Push and watch**
  - Run: `git add .github && git commit -m "ci: deploy website + game to GitHub Pages, keep-alive" && git push`, then `gh run watch`.
  - Expected: green. `https://sternenzelts.github.io/lumara/` shows the website, and `/lumara/play/` shows the game.
- [ ] **Step 5: Supabase redirect URL.** In Auth → URL configuration, add `https://sternenzelts.github.io/lumara/play/`, so Jay's magic link returns to the game.
- [ ] **Step 6: Run the keep-alive manually.** `gh workflow run keepalive.yml` and then `gh run watch`. Expected: green.

---

### Task 10: Live two-browser pass and team dry run

**Files:**
- Create: `gacha-art/LAUNCH-CHECKLIST.md`
- Interfaces: Consumes everything. Produces a signed-off checklist.

- [ ] **Step 1: Write the checklist** with these exact checks. Run them on the deployed URL in two browsers (normal and private) plus one phone:
  1. **New visitor:** the intro, nickname and 5 welcome wishes; reloading keeps the same player.
  2. **Website pre-registration:** pre-register, then the game in the same browser has +6,000 Starlight, and reloading doesn't grant it again. The counter goes up.
  3. **Warden:** Jay signs in at `#warden-login` and creates a voyage; the other player joins by code.
  4. **All 6 stages:**
     - thoughts are anonymous (the other player can't see who wrote what);
     - a 4th vote is refused;
     - vow review with one Confirm lights the lamps on **both** screens;
     - the free wish at Homecoming, once only.
  5. **Live:**
     - both see each other walk;
     - skills (Ayaka's time stop freezes the other player, Azrenth cuts it);
     - chatter and the speech bubbles;
     - pull reveals.
  6. **Network drop:** turn wifi off for 10 s and back on. The screens catch up without a reload.
  7. **Phone:** play a stage, with the skill bar and the stage window both usable.
- [ ] **Step 2: Run the checklist** and fix anything that fails. Each fix gets its own test and commit.
- [ ] **Step 3: Dry run with 2–3 teammates by 14 Oct.** Note any issues in the checklist.
- [ ] **Step 4: Commit** `git commit -am "docs: launch checklist results"`
