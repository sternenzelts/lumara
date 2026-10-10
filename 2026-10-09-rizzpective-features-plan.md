# Rizzpective Features for Lumara Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lumara gets the nine Rizzpective features it is missing, built into the voyage stages and drawn in Lumara's gacha look:
- Make a Vow from a thought
- Lobby controls
- Self Check-In
- Peer Feedback
- Speaker turns
- Homecoming report and Archives
- Party Portrait
- Report image download
- Recognition card

**Architecture:**
- Online play is already live: the Supabase schema in `supabase/migrations/0001`–`0004` is applied, and `backend/supabase.ts` is in use.
- New server rules go in three new migrations:
  - `0005_party.sql`: lock, remove player, speaker field.
  - `0006_checkins.sql`
  - `0007_peer_feedback.sql`
- Each migration has a rollback-only SQL test, run with the Supabase MCP `execute_sql`.
- Every new `Backend` method is implemented twice:
  - in `backend/local.ts` (demo);
  - in `backend/supabase.ts` (RPC).
- Pure rules live in new `logic/*.ts` files with Vitest tests.
- UI is in new components with jsdom tests. `screens.tsx` changes are only wiring.
- One pure `buildReport()` feeds the Homecoming screen, the Archives screen and the PNG. That makes "the image matches the screen" true by construction.

**Tech Stack:**
- Front end: React 19, TypeScript 5.9, Vite 7, Vitest 3 (jsdom), lucide-react.
- Back end: `@supabase/supabase-js` v2, Supabase Postgres (RLS + `security definer` RPCs) and Realtime.
- Browser APIs: Canvas 2D for the PNG.

**Spec:** `2026-10-09-rizzpective-features-design.md` (repo root). Executors read both.

## Global Constraints

**Dates and verification**
- **Launch is 2026-10-16. The team dry run is 2026-10-14.** Tasks 1–14 (features 9, 8, 1, 2, 3, 4, 6) must land before the dry run. Tasks 15–16 (features 5, 7) may slip past launch.
- **Every task ends green** in `interface/`:
  - `npx tsc --noEmit -p .`
  - `npx vitest run`
  - The baseline is 30 files and 280 tests passing on 2026-10-09.

**Database**
- **Jay's OK before touching the live database.** Never `apply_migration` without Jay's explicit yes in chat for that migration.
  - SQL tests are `begin … rollback` and leave nothing behind.
  - Still, don't run them while a voyage is in progress: they briefly end the active session inside the transaction.
- **Pushing to `main` deploys** (GitHub Pages Action), so never push without Jay's OK.
- **`0006_checkins` goes live only together with the Task 7 deploy** (Task 7, Step 7). Applied alone, it would stop the deployed game from leaving the lobby.
- **Migrations are additive.** The current live front end must keep working after each migration is applied:
  - new columns have defaults;
  - `create or replace` keeps every existing field.

**Anonymity (unchanged rules, plus new ones)**
- `fragments` and `votes` never hold a user id.
- `peer_ratings` never holds a rater id.
- Nothing in the app links a thought, vote or rating to its author.

**Privacy of results**
- Check-in averages and peer results are returned **only once the voyage reaches Homecoming** (stage `rewards` or `completed`). This stops anyone working out a single player's answers by watching the averages change as each person finishes.
- Check-ins happen in the lobby and lock when the voyage starts. Players only ever see their own answers. The Warden and admins see individual answers only from Homecoming (stage `rewards`/`completed`).

**Open-point defaults from the spec (follow them)**
- **A.** The Warden and admins see each player's check-in answers, from Homecoming on.
- **B.** No Starlight is given for feedback.
- **C.** Peer results show even with 2–3 raters.
- **D.** Each player gets one speaker turn per voyage.
- **E.** Joining stays open, with a lock; there are no invite codes.

**Defaults added by this plan (Jay can change them; listed again in the hand-off)**
- **F.** Peer feedback stays editable during Homecoming, as the spec says. A late edit can still be diffed by someone watching. Accepted for now. Check-ins lock at the start, so this no longer applies to them.
- **G.** The report shows each viewer **only their own** "Starlight earned this voyage". Every player's figure would reveal their vote count.
- **H.** "Promises kept" for a voyage = vows from the voyage just before it that are now `fulfilled`. Vows store no "fulfilled-in" session.
- **I.** Removing a player deletes their attendance row, which also drops that voyage's attend and vote Starlight for them. If they rejoin, it comes back.

**Look and code**
- **Look:** follow `interface/DESIGN.md` and the existing voyage CSS:
  - navy `#0a1a2c` / `#10233a`
  - gold `#d8bf82` / `#e9cf8f`
  - ink `#fff4dc`, muted `#b9c6d2`
  - `Marcellus` for headings, `Manrope` for text
  - It must not look like SaaS: no cards-in-cards and no default grey UI. Invoke the `frontend-design` skill before styling each new panel.
- **The local demo backend keeps parity.** Every rule enforced in SQL is also enforced in `local.ts`.
- **Code style:** match the repo: compact single-line JSX and terse helpers. Comments only where the existing code would have one.

## Review Focus

1. **Answers before Homecoming.**
   - `checkInSummary` returns `null`, `peerSummary` returns `[]`, and the Warden's check-in rows are empty until Homecoming.
   - Players never see other players' answers.
   - Pinned in Task 5 and Task 8 (SQL) and Task 6 and Task 9 (local).
2. **Reconnect vs newcomer after the start.**
   - A member re-entering through the voyage gate (`GameShell.tsx:132`) gets in.
   - A newcomer, or a player removed mid-voyage, is refused.
   - "Return to lobby" reopens joining.
   - Pinned in Task 2 (SQL) and Task 3 (local).
3. **A lobby that can't start.** A member who is away, or owns no companion, holds back "Enter the Sanctuary". Removing them must unblock the start. Pinned in Task 6 (local).
4. **A removed player vanishes everywhere:**
   - speaker pool;
   - peer targets;
   - check-in "of" counts;
   - ratings they gave or received;
   - portrait.
   - Pinned in Tasks 5, 6, 8, 9 and 13.
5. **Cancel voyage still erases everything.** Pinned in Tasks 5 and 8 (SQL) and Tasks 6 and 9 (local).

The outsider-viewer test in Task 13 stays. It just leaves the top-five list.

---

## File map

| File | Role |
|---|---|
| `supabase/migrations/0005_party.sql` | `sessions.party_locked`, `sessions.speaker`; `set_session` replaced; `join_session` (closed after start), `set_my_character` (lobby only); `remove_player` |
| `supabase/migrations/0006_checkins.sql` | `checkins`, `attendance.checkin_done`, `refresh_progress`, `save_checkin`, `checkin_summary`; `set_session` (start gate) |
| `supabase/migrations/0007_peer_feedback.sql` | `peer_ratings`, `peer_rating_owners`, `attendance.peer_given`, `rate_peer`, `my_peer_ratings`, `peer_summary`; `refresh_progress` and `remove_player` replaced |
| `supabase/tests/0005_party_test.sql`, `0006_checkins_test.sql`, `0007_peer_feedback_test.sql` | rollback-only assertions |
| `interface/src/backend/types.ts` | new types and `Backend` methods |
| `interface/src/backend/local.ts`, `supabase.ts`, `supabaseRows.ts` | both backends + row mappers |
| `interface/src/logic/report.ts` | `rankByVotes`, `promisesKept`, `portraitGroups`, `buildReport` |
| `interface/src/logic/feedback.ts` | `summarizeCheckIns`, `summarizePeers`, `peerDone`, `pendingPeerFeedback`, `finishWarningText` |
| `interface/src/logic/speaker.ts` | speaker-turn state machine + `reelFrames` |
| `interface/src/logic/reportImage.ts` | file names, `reportLines`, canvas drawing, download |
| `interface/src/logic/index.ts` | add `voyageStarlight` |
| `interface/src/data/feedback.ts` | check-in questions, peer traits (spec copy) |
| `interface/src/data/recognitionLines.ts` | one recognition line + voice clip per character |
| `interface/src/components/ThoughtPicker.tsx` | feature 9 |
| `interface/src/components/PartyControls.tsx` | feature 8 (in-voyage) |
| `interface/src/components/CheckInPanel.tsx` | feature 1 (lobby: companion + check-in, Finalize) |
| `interface/src/components/PeerFeedbackPanel.tsx` | feature 2 |
| `interface/src/components/SpeakerPanel.tsx`, `SpeakerReel.tsx` | feature 3 |
| `interface/src/components/PartyPortrait.tsx` | feature 6 |
| `interface/src/components/HomecomingReport.tsx`, `useVoyageSummaries.ts` | feature 4 |
| `interface/src/components/RecognitionCard.tsx` | feature 7 |
| `interface/src/components/feedback.css`, `speaker.css`, `report.css` | styles |
| `interface/src/screens.tsx` | wiring in `RetroScreen` and `ArchivesScreen` |
| `interface/src/components/VoyageLobby.tsx`, `VoyageHud.tsx`, `Scene.tsx` | small prop additions |

---

## Phase A: must land before the dry run (Tasks 1–14)

### Task 1: Make a Vow from a thought (feature 9)

> **Revision 2:** R2-6 changes `ThoughtPicker`. It lists only undiscussed thoughts, oldest first, with no vote counts, and its `votes` prop is removed.

**Files:**
- Create: `interface/src/logic/report.ts`
- Create: `interface/src/logic/report.test.ts`
- Create: `interface/src/components/ThoughtPicker.tsx`
- Create: `interface/src/components/ThoughtPicker.test.tsx`
- Create: `interface/src/components/feedback.css`
- Modify: `interface/src/screens.tsx` (Vow Altar block in `RetroScreen`, line ~155)

**Interfaces:**
- Produces:
  - `rankByVotes(fragments: Fragment[], votes: Vote[]): { fragment: Fragment; votes: number }[]` sorts most votes first, then the older thought first.
  - `ThoughtPicker({ fragments, votes, onPick(text: string) })`.

Note: `logic/index.ts` `revealOrder` is still a stub that doesn't sort. The Hall's order is **not** changed here. Mention this to Jay instead.

- [ ] **Step 1: Write the failing tests**

`interface/src/logic/report.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Fragment, Vote } from '../backend/types';
import { rankByVotes } from './report';

const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: id, category: 'spark', createdAt });
const vote = (fragmentId: string): Vote => ({ id: fragmentId + Math.random(), sessionId: 's', fragmentId });

describe('rankByVotes', () => {
  it('puts the most-voted thought first and breaks ties by age', () => {
    const r = rankByVotes([frag('a', 1), frag('b', 2), frag('c', 3)], [vote('c'), vote('c'), vote('b'), vote('a')]);
    expect(r.map(x => [x.fragment.id, x.votes])).toEqual([['c', 2], ['a', 1], ['b', 1]]);
  });
  it('lists unvoted thoughts with 0 votes', () => {
    expect(rankByVotes([frag('a', 1)], []).map(x => x.votes)).toEqual([0]);
  });
});
```

`interface/src/components/ThoughtPicker.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThoughtPicker from './ThoughtPicker';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const fragments = [
  { id: 'a', sessionId: 's', text: 'Standups ran long', category: 'fracture' as const, createdAt: 1 },
  { id: 'b', sessionId: 's', text: 'Pairing helped', category: 'radiance' as const, createdAt: 2 },
];
async function render(onPick = vi.fn()) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<ThoughtPicker fragments={fragments} votes={[{ id: 'v', sessionId: 's', fragmentId: 'b' }]} onPick={onPick} />));
  return { el, onPick };
}
describe('ThoughtPicker', () => {
  it('lists thoughts most-voted first', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('li p')].map(p => p.textContent)).toEqual(['Pairing helped', 'Standups ran long']);
  });
  it('fills the Vow box with the chosen thought', async () => {
    const { el, onPick } = await render();
    await act(async () => el.querySelector<HTMLButtonElement>('button[aria-label="Make a Vow from: Standups ran long"]')!.click());
    expect(onPick).toHaveBeenCalledWith('Standups ran long');
  });
  it('renders nothing without thoughts', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<ThoughtPicker fragments={[]} votes={[]} onPick={vi.fn()} />));
    expect(el.innerHTML).toBe('');
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd interface && npx vitest run src/logic/report.test.ts src/components/ThoughtPicker.test.tsx`
Expected: FAIL. The modules `./report` and `./ThoughtPicker` don't exist.

- [ ] **Step 3: Implement**

`interface/src/logic/report.ts`:
```ts
import type { Fragment, Vote } from '../backend/types';

/** Thoughts with their vote counts: most votes first, then the older thought first. */
export function rankByVotes(fragments: Fragment[], votes: Vote[]): { fragment: Fragment; votes: number }[] {
  return fragments.map(fragment => ({ fragment, votes: votes.filter(v => v.fragmentId === fragment.id).length }))
    .sort((a, b) => b.votes - a.votes || a.fragment.createdAt - b.fragment.createdAt);
}
```

`interface/src/components/ThoughtPicker.tsx`:
```tsx
import { ScrollText } from 'lucide-react';
import type { Fragment, Vote } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { rankByVotes } from '../logic/report';
import './feedback.css';

/** Vow Altar (Warden): the voyage's thoughts, most-voted first; "Make a Vow" copies one into the Vow box. */
export default function ThoughtPicker({ fragments, votes, onPick }: { fragments: Fragment[]; votes: Vote[]; onPick: (text: string) => void }) {
  const ranked = rankByVotes(fragments, votes);
  if (!ranked.length) return null;
  return <section className="thought-picker" aria-label="Thoughts from this voyage"><h4>Thoughts from this voyage</h4>
    <ol>{ranked.map(({ fragment: f, votes: n }) => <li key={f.id}>
      <span className={`category-label ${f.category}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</span>
      <p>{f.text}</p><span className="thought-votes">{n} {n === 1 ? 'vote' : 'votes'}</span>
      <button type="button" onClick={() => onPick(f.text)} aria-label={`Make a Vow from: ${f.text}`}><ScrollText size={14} />Make a Vow</button>
    </li>)}</ol>
  </section>;
}
```

`interface/src/components/feedback.css` (later tasks append to this file):
```css
/* Vow Altar side panels: thoughts to turn into Vows, self check-in, peer feedback. Same navy-and-gold frame as the voyage window. */
.thought-picker{margin-top:18px;border-top:1px solid #d8bf8255;padding-top:12px}
.thought-picker h4{margin:0 0 8px;font-family:'Marcellus',serif;font-weight:400;font-size:17px;color:#fff4dc}
.thought-picker ol{list-style:none;margin:0;padding:0;display:grid;gap:8px;max-height:260px;overflow:auto;scrollbar-width:thin}
.thought-picker li{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:4px 10px;padding:8px 10px;border:1px solid #d8bf8233;background:#10233acc}
.thought-picker li p{grid-column:1/-1;margin:0;font-size:14px;line-height:1.45;color:#e4ebf1}
.thought-votes{font-size:12px;color:#b9c6d2}
.thought-picker button{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid #d8bf8299;background:transparent;color:#e9cf8f;font:inherit;font-size:12.5px;cursor:pointer}
.thought-picker button:hover{background:#d8bf821f}
.thought-picker button:focus-visible{outline:2px solid #fff4dc;outline-offset:2px}
```

`interface/src/screens.tsx`:
- Add the import `import ThoughtPicker from './components/ThoughtPicker';`.
- In the Vow Altar block, put the picker right after the closing `</form>` of the Warden's vow form. It must stay inside the Warden branch of the ternary, so wrap the form and the picker in a fragment:
```tsx
{warden ? <><form className="vow-form" …unchanged…</form><ThoughtPicker fragments={fragments} votes={votes} onPick={t => setVowText(t.slice(0, 1000))} /></> : <p>…</p>}
```
`slice(0, 1000)` is needed because a thought can be 1,500 characters and a Vow at most 1,000.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx vitest run src/logic/report.test.ts src/components/ThoughtPicker.test.tsx && npx tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 5: Run the full suite, then commit**

Run: `cd interface && npx vitest run`
Expected: all green.
```bash
git add interface/src/logic/report.ts interface/src/logic/report.test.ts interface/src/components/ThoughtPicker.tsx interface/src/components/ThoughtPicker.test.tsx interface/src/components/feedback.css interface/src/screens.tsx
git commit -m "Game: Vow Altar lists the voyage's thoughts (most-voted first); 'Make a Vow' fills the Vow box"
```

---

### Task 2: Server rules for lock, remove and speaker (migration 0005)

> **Revised (lobby check-in):** read Appendix section **Rev C** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `supabase/tests/0005_party_test.sql`
- Create: `supabase/migrations/0005_party.sql`

**Interfaces:**
- Produces:
  - Columns `sessions.party_locked bool not null default false` and `sessions.speaker jsonb` (nullable).
  - `set_session(p_session, p_patch)` also takes `partyLocked` (bool) and `speaker` (object or `null`).
  - `join_session(p_session)` refuses newcomers while locked.
  - `remove_player(p_session uuid, p_user uuid)`.

- [ ] **Step 1: Write the SQL test** (`supabase/tests/0005_party_test.sql`)

```sql
-- 0005: lock, lock-aware join, Warden removal, speaker field. Run with execute_sql; everything rolls back.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';   -- rolled back; lets create_session run
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint L')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- the Warden locks the party
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), '{"partyLocked":true}');
  do $$ begin if not (select party_locked from sessions where id = (select id from t_sess)) then raise exception 'FAIL: lock not saved'; end if; end $$;
  -- a newcomer is refused; a member re-entering through the gate is not
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: joined a locked party'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- only the Warden removes, and never themselves
  do $$ begin begin perform remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000a'); raise exception 'FAIL: non-Warden removed a player'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  do $$ begin begin perform remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000a'); raise exception 'FAIL: Warden removed themselves'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000b');
  do $$ begin if exists (select 1 from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') then raise exception 'FAIL: removed player still attends'; end if; end $$;
  -- removed + locked = refused; unlocked = can rejoin
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: removed player rejoined a locked party'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), '{"partyLocked":false}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- speaker round-trips, survives unrelated patches, and clears with null
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), '{"speaker":{"currentId":"00000000-0000-0000-0000-00000000000b","spoken":[],"skipped":[]}}');
  do $$ begin if (select speaker->>'currentId' from sessions where id = (select id from t_sess)) is distinct from '00000000-0000-0000-0000-00000000000b' then raise exception 'FAIL: speaker not saved'; end if; end $$;
  select set_session((select id from t_sess), '{"stage":"hall"}');
  do $$ begin if (select speaker from sessions where id = (select id from t_sess)) is null then raise exception 'FAIL: unrelated patch cleared speaker'; end if; end $$;
  select set_session((select id from t_sess), '{"speaker":null}');
  do $$ begin if (select speaker from sessions where id = (select id from t_sess)) is not null then raise exception 'FAIL: speaker not cleared'; end if; end $$;
rollback;
```

- [ ] **Step 2: Run it before the migration and watch it fail**

Make sure no voyage is being played right now. Then use the Supabase MCP `execute_sql` with the file contents. If the project id is unknown, run `list_projects` and take the one named `lumara`.
Expected: an error mentioning `"partyLocked"`/`party_locked` or `remove_player` does not exist.

- [ ] **Step 3: Write the migration** (`supabase/migrations/0005_party.sql`)

```sql
-- Lobby controls and speaker turns: two new session fields, lock-aware join, Warden removal.
alter table sessions add column if not exists party_locked bool not null default false;
alter table sessions add column if not exists speaker jsonb;

-- Same as 0001 plus partyLocked and speaker (a JSON null clears the speaker).
create or replace function set_session(p_session uuid, p_patch jsonb) returns void language plpgsql security definer set search_path = public as $$
begin perform require_warden(p_session);
  update sessions set stage = coalesce(p_patch->>'stage', stage), status = coalesce(p_patch->>'status', status),
    current_fragment_id = case when p_patch ? 'currentFragmentId' then (p_patch->>'currentFragmentId')::uuid else current_fragment_id end,
    timer_ends_at = case when p_patch ? 'timerEndsAt' then (p_patch->>'timerEndsAt')::bigint else timer_ends_at end,
    sprint_name = coalesce(left(p_patch->>'sprintName', 80), sprint_name), warden_id = coalesce((p_patch->>'wardenId')::uuid, warden_id),
    party_locked = coalesce((p_patch->>'partyLocked')::bool, party_locked),
    speaker = case when p_patch ? 'speaker' then nullif(p_patch->'speaker', 'null'::jsonb) else speaker end
  where id = p_session; end $$;

-- Members already in the party may always re-enter (the voyage gate calls this on every click); only newcomers meet the lock.
create or replace function join_session(p_session uuid) returns void language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from sessions where id = p_session and status <> 'ended') then raise exception 'No active retro with that code. Check the code with your Warden.'; end if;
  if exists (select 1 from attendance where session_id = p_session and user_id = auth.uid()) then return; end if;
  if (select party_locked from sessions where id = p_session) then raise exception 'The party is locked. Ask your Warden to unlock it.'; end if;
  perform ensure_player(); insert into attendance(session_id, user_id) values (p_session, auth.uid()) on conflict do nothing; end $$;

-- Warden/admin: take a player out of the party. Their anonymous thoughts and votes stay. They can rejoin unless the party is locked.
create or replace function remove_player(p_session uuid, p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare s sessions := require_warden(p_session); begin
  if s.status = 'ended' then raise exception 'This voyage has ended.'; end if;
  if p_user = s.warden_id then raise exception 'The Warden can’t be removed from their own party.'; end if;
  delete from attendance where session_id = p_session and user_id = p_user; end $$;
revoke execute on function remove_player(uuid, uuid) from public, anon;
grant execute on function remove_player(uuid, uuid) to authenticated;
```

- [ ] **Step 4: Ask Jay, then apply.** Ask: "OK to apply migration `0005_party` to the live Lumara database? It only adds two session columns and a remove function; today's game keeps working."
  - On a clear yes, run `apply_migration` with name `0005_party` and the file body.

- [ ] **Step 5: Re-run the SQL test**

Run the `execute_sql` from Step 2 again.
Expected: completes with no `FAIL:` exception.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0005_party.sql supabase/tests/0005_party_test.sql
git commit -m "DB: party lock (refuses only newcomers), Warden can remove a player, speaker field on sessions"
```

---

### Task 3: Lock, remove and speaker in both backends

> **Revised (lobby check-in):** read Appendix section **Rev D** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Modify: `interface/src/backend/types.ts`
- Modify: `interface/src/backend/local.ts`
- Modify: `interface/src/backend/supabase.ts`
- Modify: `interface/src/backend/supabaseRows.ts`
- Test: `interface/src/backend/local.test.ts`, `interface/src/backend/supabase.test.ts`, `interface/src/backend/supabaseRows.test.ts`
- Fix literals that tsc flags: `src/App.test.tsx`, `src/dev/vowReviewPreview.tsx` and any others.

**Interfaces:**
- Consumes: RPC `remove_player(p_session, p_user)` and the `set_session` keys `partyLocked` / `speaker` from Task 2.
- Produces:
  - `SpeakerState = { currentId: UserId | null; spoken: UserId[]; skipped: UserId[] }`
  - `Session.partyLocked: boolean`
  - `Session.speaker: SpeakerState | null`
  - `Backend.removePlayer(sessionId: string, userId: UserId): Promise<void>`
  - `updateSession(id, { partyLocked })` and `updateSession(id, { speaker })`.

- [ ] **Step 1: Write the failing tests**

Append to `interface/src/backend/local.test.ts` inside `describe('local demo contract', …)`:
```ts
  it('a locked party refuses newcomers but lets members re-enter', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Locked'); await ana.join(s.id);
    await jay.updateSession(s.id, { partyLocked: true });
    await expect(bob.join(s.id)).rejects.toThrow('locked');
    await ana.join(s.id);   // the voyage gate calls join again; must not throw
    await jay.updateSession(s.id, { partyLocked: false }); await bob.join(s.id);
  });
  it('only the Warden removes players, never themselves, and the removed can rejoin when unlocked', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Remove'); await ana.join(s.id);
    await expect(ana.removePlayer(s.id, 'jay')).rejects.toThrow('Only the Warden');
    await expect(jay.removePlayer(s.id, 'jay')).rejects.toThrow('can’t be removed');
    await jay.removePlayer(s.id, 'ana');
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.map(a => a.userId)).toEqual(['jay']);
    await ana.join(s.id); jay.watchAttendance(s.id, a => att = a);
    expect(att.map(a => a.userId).sort()).toEqual(['ana', 'jay']);
  });
  it('reads sessions saved before lock/speaker existed as unlocked with no speaker', async () => {
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ sessions: [{ id: 'old', sprintName: 'Old', stage: 'hall', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 }], attendance: [], fragments: [], votes: [], vows: [], players: [] }));
    let s: Session | null = null; createLocalBackend('jay').watchActiveSession(x => s = x);
    expect(s).toMatchObject({ partyLocked: false, speaker: null });
  });
```

Append to `interface/src/backend/supabase.test.ts` inside `describe('supabase writes and sign-in', …)`:
```ts
  it('removePlayer calls remove_player with the right names', async () => {
    const f = fakeClient({}); await createSupabaseBackend(f.client, me).removePlayer('s1', 'u2');
    expect(f.client.rpc).toHaveBeenCalledWith('remove_player', { p_session: 's1', p_user: 'u2' });
  });
```

Append to `interface/src/backend/supabaseRows.test.ts`. Use that file's existing `describe`, or add one:
```ts
it('maps party_locked and speaker on sessions', () => {
  const speaker = { currentId: 'u1', spoken: [], skipped: ['u2'] };
  expect(toSession({ id: 's', sprint_name: 'S', stage: 'hall', status: 'active', warden_id: 'w', created_at: 1, party_locked: true, speaker })).toMatchObject({ partyLocked: true, speaker });
  expect(toSession({ id: 's', sprint_name: 'S', stage: 'hall', status: 'active', warden_id: 'w', created_at: 1 })).toMatchObject({ partyLocked: false, speaker: null });
});
```
If `toSession` isn't already imported in that file, add it to the import.

- [ ] **Step 2: Run them and watch them fail**

Run: `cd interface && npx vitest run src/backend`
Expected: FAIL. `removePlayer` is not a function, the new fields are missing, and the locked join doesn't throw.

- [ ] **Step 3: Implement**

`types.ts`:
- Add above `Session`:
  ```ts
  /** Resonance Hall speaker turns (feature 3). */
  export interface SpeakerState { currentId: UserId | null; spoken: UserId[]; skipped: UserId[] }
  ```
- Add to `Session`:
  ```ts
  /** Warden: while on, nobody new can join (members can still re-enter). */ partyLocked: boolean; speaker: SpeakerState | null;
  ```
- Add to `Backend` after `join`:
  ```ts
  /** Warden/admin: take a player out of the party (attendance only; anonymous thoughts and votes stay). */
  removePlayer(sessionId: string, userId: UserId): Promise<void>;
  ```

`supabaseRows.ts` `toSession`: append `, partyLocked: !!r.party_locked, speaker: r.speaker ?? null`.

`supabase.ts`: after `join:`, add
```ts
    removePlayer: async (sid, userId) => { await call('remove_player', { p_session: sid, p_user: userId }); },
```

`local.ts`:
- `read()`: after the `copy.players = …` line, add
  ```ts
  copy.sessions = copy.sessions.map(x => ({ ...x, partyLocked: x.partyLocked ?? false, speaker: x.speaker ?? null }));
  ```
- `createSession`: add `partyLocked: false, speaker: null` to the `session` literal.
- Replace `join` with:
  ```ts
      async join(sid) {
        await mutate(s => {
          const session = s.sessions.find(x => x.id === sid && x.status !== 'ended');
          if (!session) throw new Error('No active retro with that code. Check the code with your Warden.');
          if (!s.attendance.some(x => x.sessionId === sid && x.userId === id)) {
            if (session.partyLocked) throw new Error('The party is locked. Ask your Warden to unlock it.');
            s.attendance.push({ userId: id, sessionId: sid, joinedAt: Date.now(), votesCast: 0, characterId: null });
          }
          player(s);
        });
      },
      async removePlayer(sid, userId) {
        await mutate(s => {
          const session = requireWarden(s, sid);
          if (session.status === 'ended') throw new Error('This voyage has ended.');
          if (userId === session.wardenId) throw new Error('The Warden can’t be removed from their own party.');
          s.attendance = s.attendance.filter(x => !(x.sessionId === sid && x.userId === userId));
        });
      },
  ```

Then run `npx tsc --noEmit -p .` and add `partyLocked: false, speaker: null` to every `Session` literal it flags. Known places: `src/App.test.tsx` (3), `src/dev/vowReviewPreview.tsx` (1) and `src/backend/supabaseRows.test.ts`. If a test file builds a `Backend` object by hand (check `src/screens/WorldMap.test.tsx`), add `removePlayer: vi.fn()` or a cast, matching how that file handles the other methods.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add interface/src
git commit -m "Game: party lock and remove-player in both backends; sessions carry partyLocked and speaker"
```

---

### Task 4: Lobby controls UI (feature 8)

> **Revised (lobby check-in):** read Appendix section **Rev E** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Modify: `interface/src/components/VoyageLobby.tsx`
- Modify: `interface/src/components/voyage-lobby.css`
- Test: `interface/src/components/VoyageLobby.test.tsx`
- Create: `interface/src/components/PartyControls.tsx`
- Create: `interface/src/components/PartyControls.test.tsx`
- Modify: `interface/src/components/VoyageHud.tsx` (new optional `partyControls` slot)
- Modify: `interface/src/screens.tsx` (`RetroScreen`: pass the new props)

**Interfaces:**
- Consumes: `Session.partyLocked`, `backend.updateSession(id, { partyLocked })`, `backend.removePlayer(sid, userId)`.
- Produces:
  - `VoyageLobby` gets new props `locked: boolean; onToggleLock?: () => void; onRemove?: (userId: string) => void`.
  - `PartyControls({ members: LobbyMember[]; locked; busy; onToggleLock; onRemove })`.
  - `VoyageHud` gets a new prop `partyControls?: ReactNode`.

- [ ] **Step 1: Write the failing tests**

Append to `VoyageLobby.test.tsx`:
- Change the `render` default props to include `locked: false`.
- Add a second member to the tests that need one.
```tsx
  it('lets the Warden lock and unlock the party', async () => {
    const onToggleLock = vi.fn();
    const { el } = await render({ onToggleLock });
    await act(async () => button(el, 'Lock party')!.click());
    expect(onToggleLock).toHaveBeenCalled();
    const locked = await render({ locked: true, onToggleLock });
    expect(button(locked.el, 'Unlock party')).toBeTruthy();
  });
  it('shows a newcomer that the party is locked', async () => {
    const { el } = await render({ joined: false, warden: false, locked: true });
    const join = button(el, 'Party locked')!;
    expect(join.disabled).toBe(true);
  });
  it('lets the Warden remove a teammate but not themselves', async () => {
    const onRemove = vi.fn();
    const { el } = await render({ onRemove, members: [...members, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false }] });
    expect(el.querySelector('[aria-label="Remove Jay from the party"]')).toBeNull();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remove Ana from the party"]')!.click());
    expect(onRemove).toHaveBeenCalledWith('ana');
  });
```

`PartyControls.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyControls from './PartyControls';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const members = [{ userId: 'jay', name: 'Jay', characterId: null, warden: true, you: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false }];
async function render(locked = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { members, locked, busy: false, onToggleLock: vi.fn(), onRemove: vi.fn() };
  await act(async () => createRoot(el).render(<PartyControls {...props} />));
  await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Party controls"]')!.click());
  return { el, props };
}
describe('PartyControls', () => {
  it('toggles the lock and removes a teammate', async () => {
    const { el, props } = await render();
    await act(async () => [...el.querySelectorAll('button')].find(b => b.textContent?.includes('Lock party'))!.click());
    expect(props.onToggleLock).toHaveBeenCalled();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remove Ana from the party"]')!.click());
    expect(props.onRemove).toHaveBeenCalledWith('ana');
    expect(el.querySelector('[aria-label="Remove Jay from the party"]')).toBeNull();
  });
  it('says when the party is locked', async () => {
    const { el } = await render(true);
    expect(el.textContent).toContain('Unlock party');
    expect(el.textContent).toContain('nobody new can join');
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd interface && npx vitest run src/components/VoyageLobby.test.tsx src/components/PartyControls.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`VoyageLobby.tsx`:
- Import: `import { Copy, Hourglass, Lock, LockOpen, Swords, UserPlus, X } from 'lucide-react';`
- Extend the props with `locked, onToggleLock, onRemove`. Type:
  ```ts
  locked: boolean; onToggleLock?: () => void; onRemove?: (userId: string) => void;
  ```
- Join button for a newcomer:
  ```tsx
  {!joined ? <button className="lobby-primary" disabled={busy || locked} onClick={onJoin}>{locked ? <><Lock size={19} />Party locked</> : <><UserPlus size={19} />Join the party</>}</button>
  ```
  The rest of the ternary is unchanged.
- Under `lobby-count`:
  ```tsx
  {warden && onToggleLock && <button className="lobby-lock" disabled={busy} aria-pressed={locked} onClick={onToggleLock}>{locked ? <><LockOpen size={15} />Unlock party</> : <><Lock size={15} />Lock party</>}</button>}
  ```
- In each party `li`, after `lobby-name`:
  ```tsx
  {warden && onRemove && !m.warden && <button className="lobby-remove" disabled={busy} aria-label={`Remove ${m.name} from the party`} onClick={() => onRemove(m.userId)}><X size={14} /></button>}
  ```

`voyage-lobby.css` (append):
```css
.lobby-lock{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:8px 14px;border:1px solid #d8bf8299;background:#10233acc;color:#e9cf8f;font:inherit;font-size:13px;cursor:pointer}
.lobby-lock[aria-pressed="true"]{background:#d8bf8226;color:#fff4dc}
.lobby-party li{position:relative}
.lobby-remove{position:absolute;top:4px;right:4px;width:26px;height:26px;display:grid;place-items:center;border:1px solid #d8bf8266;border-radius:50%;background:#0a1a2ccc;color:#fff4dc;cursor:pointer;opacity:.75}
.lobby-remove:hover,.lobby-remove:focus-visible{opacity:1;outline:2px solid #fff4dc;outline-offset:2px}
```

`PartyControls.tsx`:
```tsx
import { useState } from 'react';
import { Lock, LockOpen, UsersRound } from 'lucide-react';
import type { LobbyMember } from './VoyageLobby';

/** Warden, during the voyage: lock/unlock the party and remove a teammate (they can rejoin unless locked). */
export default function PartyControls({ members, locked, busy, onToggleLock, onRemove }: { members: LobbyMember[]; locked: boolean; busy: boolean; onToggleLock: () => void; onRemove: (userId: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="party-controls">
    <button disabled={busy} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Party controls">{locked ? <Lock size={16} /> : <UsersRound size={16} />}<span className="voyage-btn-text">Party</span></button>
    {open && <div className="party-controls-panel" role="dialog" aria-label="Party">
      <button className="lobby-lock" disabled={busy} aria-pressed={locked} onClick={onToggleLock}>{locked ? <><LockOpen size={15} />Unlock party</> : <><Lock size={15} />Lock party</>}</button>
      <p>{locked ? 'Locked: nobody new can join.' : 'Open: teammates can join with the code.'}</p>
      <ul>{members.map(m => <li key={m.userId}><span>{m.name}{m.warden && <small> · Warden</small>}</span>{!m.warden && <button disabled={busy} onClick={() => onRemove(m.userId)} aria-label={`Remove ${m.name} from the party`}>Remove</button>}</li>)}</ul>
    </div>}
  </div>;
}
```
Append to `feedback.css`:
```css
.party-controls{position:relative;display:inline-flex}
.party-controls-panel{position:absolute;bottom:calc(100% + 8px);right:0;z-index:30;width:260px;display:grid;gap:8px;padding:12px;border:1px solid #d8bf8299;background:#0a1a2cf2;color:#fff4dc}
.party-controls-panel p{margin:0;font-size:12.5px;color:#b9c6d2}
.party-controls-panel ul{list-style:none;margin:0;padding:0;display:grid;gap:4px;max-height:220px;overflow:auto}
.party-controls-panel li{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:14px}
.party-controls-panel li small{color:#d8bf82}
.party-controls-panel li button{padding:3px 9px;border:1px solid #d8bf8266;background:transparent;color:#e9cf8f;font:inherit;font-size:12px;cursor:pointer}
```

`VoyageHud.tsx`:
- Add the prop `partyControls?: ReactNode` (import `type ReactNode` from `react`).
- Render `{partyControls}` as the first child of the `voyage-warden` group.

`screens.tsx` `RetroScreen`:
- Before `if (lobby)`, build the shared member list:
  ```tsx
  const members = attendance.map(a => ({ userId: a.userId, name: profiles[a.userId]?.name || a.userId, characterId: a.characterId || (a.userId === me.id ? player?.displayCharacterId || null : null), warden: a.userId === session.wardenId, you: a.userId === me.id }));
  const toggleLock = () => run(() => backend.updateSession(session.id, { partyLocked: !session.partyLocked }), session.partyLocked ? 'The party is open again.' : 'Party locked. Nobody new can join.');
  const removePlayer = (userId: string) => run(() => backend.removePlayer(session.id, userId), `${profiles[userId]?.name || 'They'} left the party. They can rejoin unless it’s locked.`);
  ```
  Use `members` for the existing `VoyageLobby members` prop instead of the inline map.
- Pass `locked={session.partyLocked} onToggleLock={warden ? toggleLock : undefined} onRemove={warden ? removePlayer : undefined}` to `VoyageLobby`.
- Pass `partyControls={warden ? <PartyControls members={members} locked={session.partyLocked} busy={busy} onToggleLock={toggleLock} onRemove={removePlayer} /> : undefined}` to `VoyageHud`.
- Import `PartyControls`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. Start the dev preview with the local backend.
2. Open tab A at `/?player=jay` and tab B at `/?player=ana`.
3. Jay starts a voyage and locks it. Ana sees "Party locked".
4. Jay unlocks. Ana joins.
5. Jay removes Ana. Ana is back at the lobby with "Join the party".
6. Take a screenshot of the lobby with the lock and remove controls.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: Warden can lock/unlock the party and remove a player (lobby and in-voyage Party panel)"
```

---

### Task 5: Check-ins on the server (migration 0006)

> **Revised (lobby check-in):** read Appendix section **Rev F** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `supabase/tests/0006_checkins_test.sql`
- Create: `supabase/migrations/0006_checkins.sql`

**Interfaces:**
- Produces:
  - Table `checkins(session_id, user_id, sat, growth, at)`, primary key `(session_id, user_id)`, cascading with the session.
  - `attendance.checkin_done bool`.
  - Internal `refresh_progress(p_session)`.
  - `save_checkin(p_session uuid, p_sat int, p_growth int)`.
  - `checkin_summary(p_session uuid) returns jsonb` → `{"sat": int|null, "growth": int|null, "n": int, "of": int}`, or `null` before Homecoming.
  - RLS: own row, or the voyage's Warden, or admins.
  - Realtime: `checkins` is published.

- [ ] **Step 1: Write the SQL test** (`supabase/tests/0006_checkins_test.sql`)

```sql
-- 0006: check-ins. Run with execute_sql; everything rolls back.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint C')).id as id;
  select set_session((select id from t_sess), '{"stage":"fragment_drop"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  do $$ begin begin perform save_checkin((select id from t_sess), 4, 5); raise exception 'FAIL: check-in outside Vow Altar/Homecoming'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"vow_altar"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  select save_checkin((select id from t_sess), 4, 5);
  do $$ begin begin perform save_checkin((select id from t_sess), 0, 3); raise exception 'FAIL: accepted 0'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform save_checkin((select id from t_sess), 3, 6); raise exception 'FAIL: accepted 6'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select save_checkin((select id from t_sess), 2, 3); select save_checkin((select id from t_sess), 3, 3);   -- second call edits
  -- c reads only their own row; no averages before Homecoming; progress (not answers) is public
  do $$ begin if (select count(*) from checkins) <> 1 then raise exception 'FAIL: player reads others'' check-ins'; end if; end $$;
  do $$ begin if (select sat from checkins) <> 3 then raise exception 'FAIL: edit not saved'; end if; end $$;
  do $$ begin if checkin_summary((select id from t_sess)) is not null then raise exception 'FAIL: averages visible before Homecoming'; end if; end $$;
  do $$ begin if not (select checkin_done from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') then raise exception 'FAIL: checkin_done not set'; end if; end $$;
  -- admin reads all rows; a non-admin Warden of this voyage too
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  do $$ begin if (select count(*) from checkins where session_id = (select id from t_sess)) <> 2 then raise exception 'FAIL: admin cannot read check-ins'; end if; end $$;
  reset role; update sessions set warden_id = '00000000-0000-0000-0000-00000000000b' where id = (select id from t_sess);
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin if (select count(*) from checkins where session_id = (select id from t_sess)) <> 2 then raise exception 'FAIL: Warden cannot read check-ins'; end if; end $$;
  -- Homecoming: averages as % of 5; a (party member) did not check in
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"rewards"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin if checkin_summary((select id from t_sess)) <> '{"sat":70,"growth":80,"n":2,"of":3}'::jsonb then raise exception 'FAIL: summary %', checkin_summary((select id from t_sess)); end if; end $$;
  -- a removed player stops counting
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000c');
  do $$ begin if checkin_summary((select id from t_sess)) <> '{"sat":80,"growth":100,"n":1,"of":2}'::jsonb then raise exception 'FAIL: removed player still counted %', checkin_summary((select id from t_sess)); end if; end $$;
  -- cancelling the voyage erases its check-ins
  select cancel_session((select id from t_sess));
  reset role;
  do $$ begin if exists (select 1 from checkins where session_id = (select id from t_sess)) then raise exception 'FAIL: cancel left check-ins'; end if; end $$;
rollback;
```

- [ ] **Step 2: Run it before the migration and watch it fail.** `execute_sql` with the file.
Expected: `function save_checkin(...) does not exist`.

- [ ] **Step 3: Write the migration** (`supabase/migrations/0006_checkins.sql`)

```sql
-- Self Check-In: one row per player per voyage. Players read only their own; the voyage's Warden and admins read all of it.
-- Everyone else gets team averages from checkin_summary — and only once Homecoming starts, so nobody can work out
-- one player's answers by watching the average change as each person finishes.
create table checkins (session_id uuid not null references sessions on delete cascade, user_id uuid not null references players on delete cascade,
  sat int not null check (sat between 1 and 5), growth int not null check (growth between 1 and 5), at bigint not null default now_ms(),
  primary key (session_id, user_id));
alter table attendance add column if not exists checkin_done bool not null default false;
alter table checkins enable row level security;
create policy read_own_or_warden on checkins for select to authenticated
  using (user_id = auth.uid() or is_admin() or exists (select 1 from sessions s where s.id = session_id and s.warden_id = auth.uid()));

-- Who has finished (never what they answered). Recomputed for the whole party after every save or removal.
create or replace function refresh_progress(p_session uuid) returns void language sql security definer set search_path = public as $$
  update attendance a set checkin_done = exists (select 1 from checkins c where c.session_id = a.session_id and c.user_id = a.user_id)
  where a.session_id = p_session $$;

create or replace function save_checkin(p_session uuid, p_sat int, p_growth int) returns void language plpgsql security definer set search_path = public as $$
begin perform require_stage(p_session, array['vow_altar','rewards']);
  if p_sat is null or p_growth is null or p_sat not between 1 and 5 or p_growth not between 1 and 5 then raise exception 'Pick 1 to 5 for both questions.'; end if;
  insert into checkins(session_id, user_id, sat, growth) values (p_session, auth.uid(), p_sat, p_growth)
    on conflict (session_id, user_id) do update set sat = excluded.sat, growth = excluded.growth, at = now_ms();
  perform refresh_progress(p_session); end $$;

-- Team averages as % of 5, counting only current party members. Null before Homecoming.
create or replace function checkin_summary(p_session uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (select 1 from sessions where id = p_session and stage in ('rewards','completed')) then null else
    (select jsonb_build_object('sat', round(avg(c.sat) * 20)::int, 'growth', round(avg(c.growth) * 20)::int, 'n', count(c.user_id)::int, 'of', count(*)::int)
     from attendance a left join checkins c on c.session_id = a.session_id and c.user_id = a.user_id where a.session_id = p_session) end $$;

revoke execute on function refresh_progress(uuid) from public, anon, authenticated;
revoke execute on function save_checkin(uuid, int, int) from public, anon;
revoke execute on function checkin_summary(uuid) from public, anon;
grant execute on function save_checkin(uuid, int, int) to authenticated;
grant execute on function checkin_summary(uuid) to authenticated;
alter publication supabase_realtime add table checkins;
```

- [ ] **Step 4: Ask Jay, then apply.** Ask: "OK to apply migration `0006_checkins` to the live database? It adds a check-ins table and a done flag on attendance."
  - On a clear yes, run `apply_migration` with name `0006_checkins`.

- [ ] **Step 5: Re-run the SQL test.**
Expected: no `FAIL:`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0006_checkins.sql supabase/tests/0006_checkins_test.sql
git commit -m "DB: self check-ins (own row / Warden / admin read), averages only from Homecoming, done flag on attendance"
```

---

### Task 6: Check-ins in both backends

> **Revised (lobby check-in):** read Appendix section **Rev G** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `interface/src/logic/feedback.ts`
- Create: `interface/src/logic/feedback.test.ts`
- Modify: `interface/src/backend/types.ts`, `local.ts`, `supabase.ts`, `supabaseRows.ts`
- Test: `local.test.ts`, `supabase.test.ts`, `supabaseRows.test.ts`

**Interfaces:**
- Consumes: the RPCs `save_checkin(p_session, p_sat, p_growth)` and `checkin_summary(p_session)`, and the table `checkins`, from Task 5.
- Produces:
  - `CheckIn = { sessionId: string; userId: UserId; sat: number; growth: number }`
  - `CheckInSummary = { sat: number | null; growth: number | null; n: number; of: number }`
  - `Attendance.checkinDone: boolean`
  - `summarizeCheckIns(rows: CheckIn[], partyIds: UserId[]): CheckInSummary`
  - Backend methods:
    - `saveMyCheckIn(sessionId, sat, growth): Promise<void>`
    - `myCheckIn(sessionId): Promise<CheckIn | null>`
    - `checkInSummary(sessionId): Promise<CheckInSummary | null>`
    - `watchCheckIns(sessionId, cb: (rows: CheckIn[]) => void): Unsubscribe`

- [ ] **Step 1: Write the failing tests**

`interface/src/logic/feedback.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { summarizeCheckIns } from './feedback';

describe('summarizeCheckIns', () => {
  it('averages current party members as % of 5', () => {
    const rows = [{ sessionId: 's', userId: 'b', sat: 4, growth: 5 }, { sessionId: 's', userId: 'c', sat: 3, growth: 3 }, { sessionId: 's', userId: 'gone', sat: 1, growth: 1 }];
    expect(summarizeCheckIns(rows, ['a', 'b', 'c'])).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
  });
  it('reports null averages when nobody checked in', () => {
    expect(summarizeCheckIns([], ['a'])).toEqual({ sat: null, growth: null, n: 0, of: 1 });
  });
});
```

Append to `local.test.ts`:
```ts
  it('check-ins: own row, Warden sees all, averages only from Homecoming, cancel erases', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Check'); await ana.join(s.id); await bob.join(s.id);
    await expect(ana.saveMyCheckIn(s.id, 4, 5)).rejects.toThrow('moved on');   // stage is register
    await jay.updateSession(s.id, { stage: 'vow_altar' });
    for (const bad of [[0, 3], [3, 6], [2.5, 3]]) await expect(ana.saveMyCheckIn(s.id, bad[0], bad[1])).rejects.toThrow('1 to 5');
    await ana.saveMyCheckIn(s.id, 4, 5); await bob.saveMyCheckIn(s.id, 2, 3); await bob.saveMyCheckIn(s.id, 3, 3);
    expect(await bob.myCheckIn(s.id)).toMatchObject({ sat: 3, growth: 3 });
    expect(await ana.checkInSummary(s.id)).toBeNull();
    let seen: unknown[] = []; ana.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);
    jay.watchCheckIns(s.id, r => seen = r); expect(seen).toHaveLength(2);
    let att: Attendance[] = []; ana.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.checkinDone).toBe(true); expect(att.find(a => a.userId === 'jay')?.checkinDone).toBe(false);
    await jay.updateSession(s.id, { stage: 'rewards' });
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
    await jay.removePlayer(s.id, 'bob');
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 80, growth: 100, n: 1, of: 2 });
    await jay.cancelSession(s.id);
    expect(JSON.parse(localStorage.getItem('lumara.demo.v1')!).checkins).toEqual([]);
  });
```

Append to `supabase.test.ts`:
```ts
  it('check-in calls use the RPC names and pass the summary through', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    await b.saveMyCheckIn('s1', 4, 5);
    expect(f.client.rpc).toHaveBeenCalledWith('save_checkin', { p_session: 's1', p_sat: 4, p_growth: 5 });
    f.client.rpc = vi.fn(async () => ({ data: { sat: 70, growth: 80, n: 2, of: 3 }, error: null }));
    expect(await b.checkInSummary('s1')).toEqual({ sat: 70, growth: 80, n: 2, of: 3 });
    expect(f.client.rpc).toHaveBeenCalledWith('checkin_summary', { p_session: 's1' });
  });
  it('myCheckIn reads only the caller’s row', async () => {
    const f = fakeClient({ checkins: [{ session_id: 's1', user_id: 'u1', sat: 3, growth: 4 }, { session_id: 's1', user_id: 'u2', sat: 1, growth: 1 }] });
    expect(await createSupabaseBackend(f.client, me).myCheckIn('s1')).toEqual({ sessionId: 's1', userId: 'u1', sat: 3, growth: 4 });
  });
```

Append to `supabaseRows.test.ts`:
```ts
it('maps checkin_done on attendance', () => {
  expect(toAttendance({ user_id: 'u', session_id: 's', joined_at: 1, votes_cast: 0, checkin_done: true }).checkinDone).toBe(true);
  expect(toAttendance({ user_id: 'u', session_id: 's', joined_at: 1, votes_cast: 0 }).checkinDone).toBe(false);
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd interface && npx vitest run src/logic/feedback.test.ts src/backend`
Expected: FAIL.

- [ ] **Step 3: Implement**

`types.ts`:
- `Attendance`: add `checkinDone: boolean`.
- Add:
  ```ts
  export interface CheckIn { sessionId: string; userId: UserId; sat: number; growth: number }
  /** Team check-in as % of 5 (null when nobody checked in); n of `of` party members checked in. */
  export interface CheckInSummary { sat: number | null; growth: number | null; n: number; of: number }
  ```
- `Backend` (after `watchAttendance`):
  ```ts
  /** Self Check-In (feature 1): 1–5 each, Vow Altar or Homecoming only; editable until the voyage ends. */
  saveMyCheckIn(sessionId: string, sat: number, growth: number): Promise<void>;
  myCheckIn(sessionId: string): Promise<CheckIn | null>;
  /** Team averages; null before Homecoming (stage rewards/completed). */
  checkInSummary(sessionId: string): Promise<CheckInSummary | null>;
  /** Warden/admin: every player's picks. Everyone else always gets []. */
  watchCheckIns(sessionId: string, cb: (rows: CheckIn[]) => void): Unsubscribe;
  ```

`interface/src/logic/feedback.ts`:
```ts
import type { CheckIn, CheckInSummary, UserId } from '../backend/types';

const pct = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) : null;

/** Team check-in averages (% of 5) over current party members only. */
export function summarizeCheckIns(rows: CheckIn[], partyIds: UserId[]): CheckInSummary {
  const mine = rows.filter(r => partyIds.includes(r.userId));
  return { sat: pct(mine.map(r => r.sat)), growth: pct(mine.map(r => r.growth)), n: mine.length, of: partyIds.length };
}
```

`supabaseRows.ts`:
- `toAttendance`: append `, checkinDone: !!r.checkin_done`.
- Add:
  ```ts
  export const toCheckIn = (r: Row): CheckIn => ({ sessionId: r.session_id, userId: r.user_id, sat: r.sat, growth: r.growth });
  ```
  Add `CheckIn` to the type import.

`supabase.ts`:
- Import `toCheckIn` and the type `CheckInSummary`.
- Add to the reads:
  ```ts
      watchCheckIns: (sid, cb) => live(['checkins', 'attendance'], async () => (await rows(sb.from('checkins').select('*').eq('session_id', sid))).map(toCheckIn), cb),
      async myCheckIn(sid) { const [r] = await rows(sb.from('checkins').select('*').eq('session_id', sid).eq('user_id', me.id)); return r ? toCheckIn(r) : null; },
      async checkInSummary(sid) { return ((await call('checkin_summary', { p_session: sid })) ?? null) as CheckInSummary | null; },
  ```
- Add to the writes:
  ```ts
      saveMyCheckIn: async (sid, sat, growth) => { await call('save_checkin', { p_session: sid, p_sat: sat, p_growth: growth }); },
  ```
- Row security returns `[]` from `checkins` to non-Wardens, so `watchCheckIns` needs no extra filter.

`local.ts`:
- `Store` adds `checkins: CheckIn[]`, and `memory`'s initial value adds `checkins: []`.
- `read()` adds:
  ```ts
  copy.checkins ??= [];
  copy.attendance = copy.attendance.map(a => ({ ...a, checkinDone: a.checkinDone ?? false }));
  ```
- The attendance literal in `join` adds `checkinDone: false`.
- New helpers next to `requireStage`:
  ```ts
  const isWardenOf = (s: Store, sid: string) => identity.isAdmin || s.sessions.find(x => x.id === sid)?.wardenId === id;
  const reportOpen = (s: Store, sid: string) => ['rewards', 'completed'].includes(s.sessions.find(x => x.id === sid)?.stage ?? '');
  const partyOf = (s: Store, sid: string) => s.attendance.filter(a => a.sessionId === sid).map(a => a.userId);
  /** Who has finished (never what they answered), recomputed for the whole party. */
  const progress = (s: Store, sid: string) => { for (const a of s.attendance.filter(x => x.sessionId === sid)) a.checkinDone = s.checkins.some(c => c.sessionId === sid && c.userId === a.userId); };
  ```
- Methods:
  ```ts
      async saveMyCheckIn(sid, sat, growth) {
        if (![sat, growth].every(v => Number.isInteger(v) && v >= 1 && v <= 5)) throw new Error('Pick 1 to 5 for both questions.');
        await mutate(s => {
          requireStage(s, sid, ['vow_altar', 'rewards']);
          const row = s.checkins.find(c => c.sessionId === sid && c.userId === id);
          if (row) Object.assign(row, { sat, growth }); else s.checkins.push({ sessionId: sid, userId: id, sat, growth });
          progress(s, sid);
        });
      },
      async myCheckIn(sid) { return read().checkins.find(c => c.sessionId === sid && c.userId === id) ?? null; },
      async checkInSummary(sid) { const s = read(); return reportOpen(s, sid) ? summarizeCheckIns(s.checkins.filter(c => c.sessionId === sid), partyOf(s, sid)) : null; },
      watchCheckIns(sid, cb) { return watch(s => isWardenOf(s, sid) ? s.checkins.filter(c => c.sessionId === sid) : [], cb); },
  ```
- `cancelSession`: add `s.checkins = s.checkins.filter(x => x.sessionId !== sid);`.
- Import `summarizeCheckIns` from `'../logic/feedback'`, and `CheckIn` in the types import.

Then fix every `Attendance` literal tsc flags by adding `checkinDone: false`: `App.test.tsx`, `dev/vowReviewPreview.tsx` and `logic/index.test.ts`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add interface/src
git commit -m "Game: self check-in in both backends (own picks, Warden view, averages from Homecoming)"
```

---

### Task 7: Self Check-In panel (feature 1)

> **Revised (lobby check-in):** read Appendix section **Rev H** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `interface/src/data/feedback.ts`
- Create: `interface/src/components/CheckInPanel.tsx`
- Create: `interface/src/components/CheckInPanel.test.tsx`
- Modify: `interface/src/components/feedback.css`
- Modify: `interface/src/screens.tsx` (`RetroScreen`: Vow Altar + Homecoming)

**Interfaces:**
- Consumes: `backend.saveMyCheckIn`, `backend.myCheckIn` (Task 6).
- Produces:
  - `CHECKIN_QUESTIONS` and `PEER_TRAITS` (the second is used in Task 10).
  - `CheckInPanel({ saved: CheckIn | null; busy: boolean; onSave(sat: number, growth: number) })`.

- [ ] **Step 1: Write the failing test** (`CheckInPanel.test.tsx`)

```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CheckInPanel from './CheckInPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
async function render(saved: { sessionId: string; userId: string; sat: number; growth: number } | null = null) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onSave = vi.fn();
  await act(async () => createRoot(el).render(<CheckInPanel saved={saved} busy={false} onSave={onSave} />));
  return { el, onSave };
}
const radio = (el: HTMLElement, group: string, label: string) => el.querySelector<HTMLButtonElement>(`[role="radiogroup"][aria-label="${group}"] [aria-label^="${label}"]`)!;
const save = (el: HTMLElement) => [...el.querySelectorAll('button')].find(b => /check-in/i.test(b.textContent || ''))!;
describe('CheckInPanel', () => {
  it('needs both answers before saving', async () => {
    const { el, onSave } = await render();
    expect(save(el).disabled).toBe(true);
    await act(async () => radio(el, 'Sprint Satisfaction', '5').click());
    expect(save(el).disabled).toBe(true);
    await act(async () => radio(el, 'Self Growth', '3').click());
    await act(async () => save(el).click());
    expect(onSave).toHaveBeenCalledWith(5, 3);
  });
  it('shows the saved picks and offers an update', async () => {
    const { el } = await render({ sessionId: 's', userId: 'u', sat: 2, growth: 4 });
    expect(radio(el, 'Sprint Satisfaction', '2').getAttribute('aria-checked')).toBe('true');
    expect(save(el).textContent).toContain('Update');
  });
  it('labels each step in the spec’s words', async () => {
    const { el } = await render();
    expect(radio(el, 'Sprint Satisfaction', '5').textContent).toContain('Legendary');
    expect(radio(el, 'Self Growth', '1').textContent).toContain('Same level');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd interface && npx vitest run src/components/CheckInPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`interface/src/data/feedback.ts`:
```ts
import type { PeerTrait } from '../backend/types';

/** Self Check-In questions (the same as Rizzpective's; the team already uses them). */
export const CHECKIN_QUESTIONS = [
  { key: 'sat', icon: '♥', title: 'Sprint Satisfaction', ask: 'How satisfied are you with your overall experience this sprint?', labels: ['Rough sprint', 'A bit bumpy', 'Okay', 'Good run', 'Legendary'] },
  { key: 'growth', icon: '◆', title: 'Self Growth', ask: 'How much do you feel you learned, improved, or grew during this sprint?', labels: ['Same level', 'A little XP', 'Leveled up', 'Big level-up', 'Class evolved'] },
] as const;

/** Peer Feedback traits (the same as Rizzpective's). */
export const PEER_TRAITS: { key: PeerTrait; icon: string; title: string; measures: string; hint: string }[] = [
  { key: 'collab', icon: '🤝', title: 'Party Spirit', measures: 'Collaboration & camaraderie', hint: 'Great to team up with' },
  { key: 'owner', icon: '🛡', title: 'Dependable', measures: 'Ownership & reliability', hint: 'Owns it and follows through' },
  { key: 'comm', icon: '💬', title: 'Clear Comms', measures: 'Communication & constructive candor', hint: 'Shares openly, kindly and honestly' },
  { key: 'impact', icon: '⚔️', title: 'Impact', measures: 'Contribution & excellence', hint: 'Brings quality work to the quest' },
  { key: 'growth', icon: '🌱', title: 'Levels Up', measures: 'Growth & forward thinking', hint: 'Learns, improves and looks ahead' },
];
```
`PeerTrait` doesn't exist until Task 9. Add the type to `types.ts` now so this compiles:
```ts
export type PeerTrait = 'collab' | 'owner' | 'comm' | 'impact' | 'growth';
export type PeerScores = Record<PeerTrait, number>;
```

`interface/src/components/CheckInPanel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { CheckIn } from '../backend/types';
import { CHECKIN_QUESTIONS } from '../data/feedback';
import './feedback.css';

type Picks = { sat: number | null; growth: number | null };
/** Self Check-In (feature 1): two 1–5 questions, both required; editable until the voyage ends. */
export default function CheckInPanel({ saved, busy, onSave }: { saved: CheckIn | null; busy: boolean; onSave: (sat: number, growth: number) => void }) {
  const [picks, setPicks] = useState<Picks>({ sat: saved?.sat ?? null, growth: saved?.growth ?? null });
  useEffect(() => { setPicks({ sat: saved?.sat ?? null, growth: saved?.growth ?? null }); }, [saved?.sat, saved?.growth]);
  const ready = picks.sat !== null && picks.growth !== null;
  return <section className="checkin-panel" aria-label="Self check-in">
    <header><h3>Self Check-In</h3><p>Only you and your Warden see your picks. The party sees team averages at Homecoming.</p></header>
    {CHECKIN_QUESTIONS.map(q => <fieldset key={q.key}><legend><span aria-hidden="true">{q.icon}</span> {q.title}</legend><p>{q.ask}</p>
      <div className="checkin-scale" role="radiogroup" aria-label={q.title}>{q.labels.map((label, i) => { const v = i + 1; const on = picks[q.key] === v;
        return <button key={v} type="button" role="radio" aria-checked={on} aria-label={`${v} · ${label}`} className={on ? 'on' : ''} onClick={() => setPicks(p => ({ ...p, [q.key]: v }))}><strong>{v}</strong><span>{label}</span></button>; })}</div>
    </fieldset>)}
    <button className="feedback-save" disabled={busy || !ready} onClick={() => { if (picks.sat !== null && picks.growth !== null) onSave(picks.sat, picks.growth); }}>{saved ? 'Update check-in' : 'Save check-in'}</button>
  </section>;
}
```

Append to `feedback.css`:
```css
.feedback-panels{display:grid;gap:18px;margin-top:18px;border-top:1px solid #d8bf8255;padding-top:14px}
.checkin-panel,.peer-panel{display:grid;gap:12px;color:#fff4dc}
.checkin-panel header h3,.peer-panel header h3{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:20px}
.checkin-panel header p,.peer-panel header p{margin:2px 0 0;font-size:12.5px;color:#b9c6d2}
.checkin-panel fieldset{margin:0;padding:0;border:0;display:grid;gap:6px}
.checkin-panel legend{font-family:'Marcellus',serif;font-size:16px;color:#e9cf8f}
.checkin-panel fieldset p{margin:0;font-size:13px;color:#d9e2ea}
.checkin-scale{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.checkin-scale button{display:grid;justify-items:center;gap:2px;padding:8px 4px;border:1px solid #d8bf8244;background:#10233acc;color:#d9e2ea;font:inherit;cursor:pointer;transition:transform .15s var(--ease,ease),border-color .15s}
.checkin-scale button strong{font-family:'Marcellus',serif;font-size:20px;font-weight:400;color:#fff4dc}
.checkin-scale button span{font-size:11px;line-height:1.2;text-align:center}
.checkin-scale button:hover{border-color:#d8bf82aa}
.checkin-scale button.on{border-color:#f3dca0;background:linear-gradient(180deg,#e9cf8f33,#c9a45a26);transform:translateY(-2px);box-shadow:0 0 14px #e9cf8f44}
.checkin-scale button:focus-visible,.feedback-save:focus-visible{outline:2px solid #fff4dc;outline-offset:2px}
.feedback-save{justify-self:start;min-height:42px;padding:0 20px;border:1px solid #f3dca0;background:linear-gradient(180deg,#e9cf8f,#c9a45a);color:#1b2a3a;font:inherit;font-weight:700;cursor:pointer}
.feedback-save:disabled{opacity:.5;cursor:not-allowed}
@media (max-width:560px){.checkin-scale button span{font-size:10px}}
```

`screens.tsx` `RetroScreen`:
- State and loading. Put these with the existing state at the top of `RetroScreen`, **before** `if (!session) return`, or React throws a hook-order error when a voyage starts:
  ```tsx
  const [myCheck, setMyCheck] = useState<CheckIn | null>(null);
  useEffect(() => { let live = true; if (!session || !['vow_altar', 'rewards'].includes(session.stage)) return; backend.myCheckIn(session.id).then(c => { if (live) setMyCheck(c); }).catch(() => {}); return () => { live = false; }; }, [backend, session?.id, session?.stage]);
  ```
  Import the type `CheckIn`.
- After `const brief = …`:
  ```tsx
  const feedback = joined && ['vow_altar', 'rewards'].includes(session.stage) ? <div className="feedback-panels"><CheckInPanel saved={myCheck} busy={busy} onSave={(sat, growth) => run(async () => { await backend.saveMyCheckIn(session.id, sat, growth); setMyCheck(await backend.myCheckIn(session.id)); }, 'Check-in saved.')} /></div> : null;
  ```
- Vow Altar:
  - Replace the non-Warden text with `<p>Your Warden is writing the Vows. While they do, check in and rate your allies below.</p>`.
  - After the `vows…map(VowRow)` list, render `{feedback}`.
- Homecoming: render `{feedback}` at the end of the `rewards-stage` div. Task 14 moves it under the report.
- Import `CheckInPanel`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. Use the local backend with two tabs.
2. Go to the Vow Altar and check in from both tabs.
3. Reload: the picks persist and the button says "Update check-in".
4. At phone width (375px), the five steps fit without scrolling sideways.
5. Take a screenshot.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: Self Check-In panel at the Vow Altar and Homecoming"
```

---

### Task 8: Peer feedback on the server (migration 0007)

> **Revision 2:** this migration is now `0008_peer_feedback` (file names and the `apply_migration` name), because `0007` is taken by R2-1.

> **Revised (lobby check-in):** read Appendix section **Rev I** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `supabase/tests/0007_peer_feedback_test.sql`
- Create: `supabase/migrations/0007_peer_feedback.sql`

**Interfaces:**
- Produces:
  - Tables `peer_ratings(id, session_id, target_id, scores jsonb)`. There is no rater column and no read policy.
  - `peer_rating_owners(rating_id, user_id, session_id, target_id)`, unique `(user_id, session_id, target_id)`, read only by the owner.
  - `attendance.peer_given int`.
  - `refresh_progress` now also sets `peer_given`.
  - `remove_player` now refreshes progress.
  - `rate_peer(p_session uuid, p_target uuid, p_scores jsonb)`.
  - `my_peer_ratings(p_session) returns table(target_id uuid, scores jsonb)`.
  - `peer_summary(p_session) returns table(target_id uuid, raters int, collab int, owner int, comm int, impact int, growth int)`. The values are % of 5. It returns nothing before Homecoming, the caller's own row for players, and every row for the Warden or admins. Raters and targets who left the party don't count.

- [ ] **Step 1: Write the SQL test** (`supabase/tests/0007_peer_feedback_test.sql`)

```sql
-- 0007: peer feedback. Run with execute_sql; everything rolls back.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000d','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  -- temp tables are created as the authenticated role so every test user can read them
  create temp table t_ok as select '{"collab":5,"owner":4,"comm":3,"impact":4,"growth":5}'::jsonb as s;
  create temp table t_sess as select (create_session('Sprint P')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"vow_altar"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  select rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000c', (select s from t_ok));
  do $$ begin begin perform rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000b', (select s from t_ok)); raise exception 'FAIL: rated self'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000d', (select s from t_ok)); raise exception 'FAIL: rated a non-member'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000c', '{"collab":2.5,"owner":4,"comm":3,"impact":4,"growth":5}'); raise exception 'FAIL: accepted 2.5'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000c', '{"collab":5,"owner":4,"comm":3,"impact":4}'); raise exception 'FAIL: accepted a missing trait'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000c', '{"collab":"5","owner":4,"comm":3,"impact":4,"growth":5}'); raise exception 'FAIL: accepted a string score'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- editing keeps one rating per teammate
  select rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000c', '{"collab":1,"owner":1,"comm":1,"impact":1,"growth":1}');
  do $$ begin if (select count(*) from peer_rating_owners) <> 1 then raise exception 'FAIL: edit made a second rating'; end if; end $$;
  do $$ begin if (select count(*) from my_peer_ratings((select id from t_sess))) <> 1 or (select scores->>'collab' from my_peer_ratings((select id from t_sess))) <> '1' then raise exception 'FAIL: my ratings wrong'; end if; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select rate_peer((select id from t_sess), '00000000-0000-0000-0000-00000000000b', (select s from t_ok));
  -- nobody reads ratings directly; owner links are private; no results before Homecoming; progress is public
  do $$ begin if (select count(*) from peer_ratings) <> 0 then raise exception 'FAIL: ratings readable'; end if; end $$;
  do $$ begin if (select count(*) from peer_rating_owners) <> 1 then raise exception 'FAIL: other owners readable'; end if; end $$;
  do $$ begin if (select count(*) from peer_summary((select id from t_sess))) <> 0 then raise exception 'FAIL: results before Homecoming'; end if; end $$;
  do $$ begin if (select peer_given from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') <> 1 then raise exception 'FAIL: peer_given'; end if; end $$;
  do $$ begin if exists (select 1 from information_schema.columns where table_name = 'peer_ratings' and column_name like '%user%') then raise exception 'FAIL: rater column on peer_ratings'; end if; end $$;
  -- Homecoming: a player sees only their own result; the admin sees everyone's
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"rewards"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin if (select count(*) from peer_summary((select id from t_sess))) <> 1 or (select target_id from peer_summary((select id from t_sess))) <> '00000000-0000-0000-0000-00000000000c'
    or (select collab from peer_summary((select id from t_sess))) <> 20 or (select raters from peer_summary((select id from t_sess))) <> 1 then raise exception 'FAIL: player result wrong'; end if; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  do $$ begin if (select count(*) from peer_summary((select id from t_sess))) <> 2 then raise exception 'FAIL: admin should see both results'; end if; end $$;
  -- removing c drops ratings c gave and received, and b's progress
  select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000c');
  do $$ begin if (select count(*) from peer_summary((select id from t_sess))) <> 0 then raise exception 'FAIL: removed player still counted'; end if; end $$;
  do $$ begin if (select peer_given from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') <> 0 then raise exception 'FAIL: peer_given not refreshed'; end if; end $$;
  -- cancel erases ratings and owner links
  select cancel_session((select id from t_sess));
  reset role;
  do $$ begin if exists (select 1 from peer_ratings where session_id = (select id from t_sess)) or exists (select 1 from peer_rating_owners where session_id = (select id from t_sess)) then raise exception 'FAIL: cancel left ratings'; end if; end $$;
rollback;
```

- [ ] **Step 2: Run it before the migration and watch it fail.**
Expected: `function rate_peer(...) does not exist`.

- [ ] **Step 3: Write the migration** (`supabase/migrations/0007_peer_feedback.sql`)

```sql
-- Peer Feedback, same pattern as fragments/fragment_authors: ratings never store the rater; the owner link is private.
-- Nobody reads peer_ratings directly — results come only from peer_summary, from Homecoming on.
create table peer_ratings (id uuid primary key default gen_random_uuid(), session_id uuid not null references sessions on delete cascade,
  target_id uuid not null references auth.users on delete cascade, scores jsonb not null);
create table peer_rating_owners (rating_id uuid primary key references peer_ratings on delete cascade, user_id uuid not null references auth.users on delete cascade,
  session_id uuid not null references sessions on delete cascade, target_id uuid not null, unique (user_id, session_id, target_id));
alter table peer_ratings enable row level security;   -- no policy: unreadable
alter table peer_rating_owners enable row level security;
create policy read_own on peer_rating_owners for select to authenticated using (user_id = auth.uid());
alter table attendance add column if not exists peer_given int not null default 0;

-- Who has finished (never what they answered): check-in done, and how many current teammates each player has rated.
create or replace function refresh_progress(p_session uuid) returns void language sql security definer set search_path = public as $$
  update attendance a set
    checkin_done = exists (select 1 from checkins c where c.session_id = a.session_id and c.user_id = a.user_id),
    peer_given = (select count(*) from peer_rating_owners o join attendance t on t.session_id = o.session_id and t.user_id = o.target_id
                  where o.session_id = a.session_id and o.user_id = a.user_id)::int
  where a.session_id = p_session $$;

create or replace function rate_peer(p_session uuid, p_target uuid, p_scores jsonb) returns void language plpgsql security definer set search_path = public as $$
declare k text; v jsonb; rid uuid; clean jsonb := '{}'; begin
  perform require_stage(p_session, array['vow_altar','rewards']);
  if p_target = auth.uid() then raise exception 'You can’t rate yourself.'; end if;
  if not exists (select 1 from attendance where session_id = p_session and user_id = p_target) then raise exception 'That ally isn’t in this party.'; end if;
  foreach k in array array['collab','owner','comm','impact','growth'] loop
    v := p_scores->k;
    if v is null or jsonb_typeof(v) <> 'number' or (v::text)::numeric not in (1,2,3,4,5) then raise exception 'Rate every trait from 1 to 5 stars.'; end if;
    clean := clean || jsonb_build_object(k, (v::text)::numeric::int);
  end loop;
  select rating_id into rid from peer_rating_owners where user_id = auth.uid() and session_id = p_session and target_id = p_target;
  if rid is null then
    insert into peer_ratings(session_id, target_id, scores) values (p_session, p_target, clean) returning id into rid;
    insert into peer_rating_owners values (rid, auth.uid(), p_session, p_target);
  else update peer_ratings set scores = clean where id = rid; end if;
  perform refresh_progress(p_session); end $$;

create or replace function my_peer_ratings(p_session uuid) returns table(target_id uuid, scores jsonb) language sql stable security definer set search_path = public as $$
  select o.target_id, r.scores from peer_rating_owners o join peer_ratings r on r.id = o.rating_id where o.user_id = auth.uid() and o.session_id = p_session $$;

-- % of 5 per trait for each target, counting only raters and targets still in the party.
create or replace function peer_summary(p_session uuid) returns table(target_id uuid, raters int, collab int, owner int, comm int, impact int, growth int)
language sql stable security definer set search_path = public as $$
  select r.target_id, count(*)::int,
    round(avg((r.scores->>'collab')::int) * 20)::int, round(avg((r.scores->>'owner')::int) * 20)::int, round(avg((r.scores->>'comm')::int) * 20)::int,
    round(avg((r.scores->>'impact')::int) * 20)::int, round(avg((r.scores->>'growth')::int) * 20)::int
  from peer_ratings r
  join peer_rating_owners o on o.rating_id = r.id
  join attendance t on t.session_id = r.session_id and t.user_id = r.target_id
  join attendance g on g.session_id = r.session_id and g.user_id = o.user_id
  join sessions s on s.id = r.session_id
  where r.session_id = p_session and s.stage in ('rewards','completed') and (r.target_id = auth.uid() or is_admin() or s.warden_id = auth.uid())
  group by r.target_id $$;

-- 0005 + refresh everyone's progress (ratings for the removed player stop counting).
create or replace function remove_player(p_session uuid, p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare s sessions := require_warden(p_session); begin
  if s.status = 'ended' then raise exception 'This voyage has ended.'; end if;
  if p_user = s.warden_id then raise exception 'The Warden can’t be removed from their own party.'; end if;
  delete from attendance where session_id = p_session and user_id = p_user;
  perform refresh_progress(p_session); end $$;

revoke execute on function refresh_progress(uuid) from public, anon, authenticated;
revoke execute on function rate_peer(uuid, uuid, jsonb) from public, anon;
revoke execute on function my_peer_ratings(uuid) from public, anon;
revoke execute on function peer_summary(uuid) from public, anon;
grant execute on function rate_peer(uuid, uuid, jsonb) to authenticated;
grant execute on function my_peer_ratings(uuid) to authenticated;
grant execute on function peer_summary(uuid) to authenticated;
```

- [ ] **Step 4: Ask Jay, then apply.** Ask: "OK to apply migration `0007_peer_feedback` to the live database? It adds the two rating tables and a progress count on attendance."
  - On a clear yes, run `apply_migration` with name `0007_peer_feedback`.

- [ ] **Step 5: Re-run the SQL test** for this migration, then `0005` and `0006` again, because `remove_player` and `refresh_progress` changed.
Expected: no `FAIL:` in any of them.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0007_peer_feedback.sql supabase/tests/0007_peer_feedback_test.sql
git commit -m "DB: anonymous peer ratings (no rater stored), private owner links, results from Homecoming, removal-aware progress"
```

---

### Task 9: Peer feedback in both backends

> **Revised (lobby check-in):** read Appendix section **Rev J** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Modify: `interface/src/backend/types.ts`, `local.ts`, `supabase.ts`, `supabaseRows.ts`
- Modify: `interface/src/logic/feedback.ts`, `feedback.test.ts`
- Test: `local.test.ts`, `supabase.test.ts`, `supabaseRows.test.ts`

**Interfaces:**
- Consumes: the RPCs `rate_peer`, `my_peer_ratings`, `peer_summary` and the column `attendance.peer_given` from Task 8. `PeerTrait`/`PeerScores` were added in Task 7.
- Produces:
  - `PeerResult = { targetId: UserId; raters: number; pct: PeerScores }`
  - `Attendance.peerGiven: number`
  - `summarizePeers(ratings: { targetId: UserId; scores: PeerScores }[]): PeerResult[]`
  - `peerDone(a: Attendance, party: Attendance[]): boolean`
  - `pendingFeedback(party: Attendance[]): { checkin: number; peer: number }`
  - `finishWarningText(p: { checkin: number; peer: number }): string | null`
  - Backend methods:
    - `ratePeer(sessionId, targetId, scores: PeerScores): Promise<void>`
    - `myPeerRatings(sessionId): Promise<Record<UserId, PeerScores>>`
    - `peerSummary(sessionId): Promise<PeerResult[]>`

- [ ] **Step 1: Write the failing tests**

Append to `feedback.test.ts`:
```ts
import { finishWarningText, peerDone, pendingFeedback, summarizePeers } from './feedback';
const att = (userId: string, checkinDone: boolean, peerGiven: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast: 0, characterId: null, checkinDone, peerGiven });
describe('peer feedback helpers', () => {
  it('averages each trait as % of 5 per target', () => {
    const r = summarizePeers([{ targetId: 'b', scores: { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 } }, { targetId: 'b', scores: { collab: 3, owner: 4, comm: 3, impact: 4, growth: 5 } }]);
    expect(r).toEqual([{ targetId: 'b', raters: 2, pct: { collab: 80, owner: 80, comm: 60, impact: 80, growth: 100 } }]);
  });
  it('counts a player done once they rated every teammate (solo players are done)', () => {
    const party = [att('a', true, 2), att('b', true, 1), att('c', false, 0)];
    expect(party.map(a => peerDone(a, party))).toEqual([true, false, false]);
    expect(peerDone(att('solo', false, 0), [att('solo', false, 0)])).toBe(true);
  });
  it('builds the Finish warning, or none when everyone is done', () => {
    const party = [att('a', true, 2), att('b', false, 1), att('c', false, 0)];
    expect(pendingFeedback(party)).toEqual({ checkin: 2, peer: 2 });
    expect(finishWarningText({ checkin: 2, peer: 1 })).toBe('2 players haven’t checked in and 1 player hasn’t finished peer feedback. Once you finish, nobody can add more.');
    expect(finishWarningText({ checkin: 0, peer: 0 })).toBeNull();
  });
});
```

Append to `local.test.ts`:
```ts
  it('peer feedback: no self-rating, editable, own result only, Warden sees all, removal-aware', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Peers'); await ana.join(s.id); await bob.join(s.id);
    await jay.updateSession(s.id, { stage: 'vow_altar' });
    const ok = { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 };
    await expect(ana.ratePeer(s.id, 'ana', ok)).rejects.toThrow('yourself');
    await expect(ana.ratePeer(s.id, 'zed', ok)).rejects.toThrow('isn’t in this party');
    await expect(ana.ratePeer(s.id, 'bob', { ...ok, collab: 2.5 })).rejects.toThrow('1 to 5');
    await ana.ratePeer(s.id, 'bob', ok); await ana.ratePeer(s.id, 'bob', { ...ok, collab: 1 });
    await bob.ratePeer(s.id, 'ana', ok);
    expect(await ana.myPeerRatings(s.id)).toEqual({ bob: { ...ok, collab: 1 } });
    expect(await ana.peerSummary(s.id)).toEqual([]);   // before Homecoming
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.peerGiven).toBe(1);
    await jay.updateSession(s.id, { stage: 'rewards' });
    expect((await bob.peerSummary(s.id)).map(r => [r.targetId, r.raters, r.pct.collab])).toEqual([['bob', 1, 20]]);
    expect((await jay.peerSummary(s.id)).map(r => r.targetId).sort()).toEqual(['ana', 'bob']);
    await jay.removePlayer(s.id, 'bob');
    expect(await jay.peerSummary(s.id)).toEqual([]);
    jay.watchAttendance(s.id, a => att = a); expect(att.find(a => a.userId === 'ana')?.peerGiven).toBe(0);
    const pub = JSON.parse(localStorage.getItem('lumara.demo.v1')!).peerRatings as object[];   // the shared store never holds the rater
    expect(pub.every(r => Object.keys(r).sort().join() === 'id,scores,sessionId,targetId')).toBe(true);
  });
```

Append to `supabase.test.ts`:
```ts
  it('peer calls use the RPC names and map rows', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    const ok = { collab: 5, owner: 4, comm: 3, impact: 4, growth: 5 };
    await b.ratePeer('s1', 'u2', ok);
    expect(f.client.rpc).toHaveBeenCalledWith('rate_peer', { p_session: 's1', p_target: 'u2', p_scores: ok });
    f.client.rpc = vi.fn(async (name: string) => ({ data: name === 'peer_summary' ? [{ target_id: 'u1', raters: 2, collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 }] : [{ target_id: 'u2', scores: ok }], error: null }));
    expect(await b.peerSummary('s1')).toEqual([{ targetId: 'u1', raters: 2, pct: { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 } }]);
    expect(await b.myPeerRatings('s1')).toEqual({ u2: ok });
  });
```

Append to `supabaseRows.test.ts`:
```ts
it('maps peer_given on attendance', () => {
  expect(toAttendance({ user_id: 'u', session_id: 's', joined_at: 1, votes_cast: 0, peer_given: 2 }).peerGiven).toBe(2);
  expect(toAttendance({ user_id: 'u', session_id: 's', joined_at: 1, votes_cast: 0 }).peerGiven).toBe(0);
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `cd interface && npx vitest run src/logic/feedback.test.ts src/backend`
Expected: FAIL.

- [ ] **Step 3: Implement**

`types.ts`:
- `Attendance`: add `/** How many current teammates this player has rated (never whom or how). */ peerGiven: number`.
- Add:
  ```ts
  /** One player's peer result: % of 5 per trait and how many allies rated them. */
  export interface PeerResult { targetId: UserId; raters: number; pct: PeerScores }
  ```
- `Backend`:
  ```ts
  /** Peer Feedback (feature 2): rate a teammate 1–5 on each trait; never yourself; Vow Altar or Homecoming only. */
  ratePeer(sessionId: string, targetId: UserId, scores: PeerScores): Promise<void>;
  /** The caller's own ratings, by teammate (to show ✓ and edit). */
  myPeerRatings(sessionId: string): Promise<Record<UserId, PeerScores>>;
  /** [] before Homecoming; the caller's own result for players; everyone's for the Warden/admins. */
  peerSummary(sessionId: string): Promise<PeerResult[]>;
  ```

`logic/feedback.ts` (append, and extend the type import):
```ts
const TRAITS: PeerTrait[] = ['collab', 'owner', 'comm', 'impact', 'growth'];
/** Per-target averages (% of 5) of the given ratings. */
export function summarizePeers(ratings: { targetId: UserId; scores: PeerScores }[]): PeerResult[] {
  const targets = [...new Set(ratings.map(r => r.targetId))];
  return targets.map(targetId => { const mine = ratings.filter(r => r.targetId === targetId);
    return { targetId, raters: mine.length, pct: Object.fromEntries(TRAITS.map(t => [t, pct(mine.map(r => r.scores[t])) ?? 0])) as PeerScores }; });
}
export const peerDone = (a: Attendance, party: Attendance[]) => a.peerGiven >= party.length - 1;
export function pendingFeedback(party: Attendance[]) {
  return { checkin: party.filter(a => !a.checkinDone).length, peer: party.filter(a => !peerDone(a, party)).length };
}
const notYet = (n: number, what: string) => `${n} ${n === 1 ? 'player hasn’t' : 'players haven’t'} ${what}`;
/** The Warden's warning on "Finish voyage" (they can still finish). */
export function finishWarningText({ checkin, peer }: { checkin: number; peer: number }): string | null {
  const parts = [checkin && notYet(checkin, 'checked in'), peer && notYet(peer, 'finished peer feedback')].filter(Boolean);
  return parts.length ? `${parts.join(' and ')}. Once you finish, nobody can add more.` : null;
}
```
The import line becomes `import type { Attendance, CheckIn, CheckInSummary, PeerResult, PeerScores, PeerTrait, UserId } from '../backend/types';`.

`supabaseRows.ts`:
- `toAttendance`: append `, peerGiven: r.peer_given ?? 0`.
- Add:
  ```ts
  export const toPeerResult = (r: Row): PeerResult => ({ targetId: r.target_id, raters: r.raters, pct: { collab: r.collab, owner: r.owner, comm: r.comm, impact: r.impact, growth: r.growth } });
  ```

`supabase.ts`:
```ts
    ratePeer: async (sid, targetId, scores) => { await call('rate_peer', { p_session: sid, p_target: targetId, p_scores: scores }); },
    async myPeerRatings(sid) { const r = ((await call('my_peer_ratings', { p_session: sid })) ?? []) as { target_id: string; scores: PeerScores }[]; return Object.fromEntries(r.map(x => [x.target_id, x.scores])); },
    async peerSummary(sid) { return (((await call('peer_summary', { p_session: sid })) ?? []) as any[]).map(toPeerResult); },
```

`local.ts`:
- `Store` adds `peerRatings: { id: string; sessionId: string; targetId: UserId; scores: PeerScores }[]`, with initial value `[]`.
- `PrivateStore` adds `peer: Record<string, Record<UserId, string>>` (session → teammate → rating id), with initial value `{}`.
- `read()` adds:
  ```ts
  copy.peerRatings ??= [];
  copy.attendance = copy.attendance.map(a => ({ ...a, peerGiven: a.peerGiven ?? 0 }));
  ```
  Merge this into the Task 6 attendance map.
- `readPrivate()` returns `structuredClone({ ...privateMemory, peer: privateMemory.peer ?? {} })`.
- The `join` attendance literal adds `peerGiven: 0`.
- Add:
  ```ts
  /** Another player's private store (demo only: every tab shares one browser). */
  const privateOf = (userId: string): PrivateStore => {
    if (userId === id) return readPrivate();
    try { const raw = localStorage.getItem(`${KEY}.private.${userId}`); return { fragments: {}, votes: {}, peer: {}, ...(raw ? JSON.parse(raw) : {}) }; } catch { return { fragments: {}, votes: {}, peer: {} }; }
  };
  ```
- Replace `progress` with:
  ```ts
  const progress = (s: Store, sid: string) => {
    const members = s.attendance.filter(x => x.sessionId === sid); const party = new Set(members.map(a => a.userId));
    for (const a of members) {
      a.checkinDone = s.checkins.some(c => c.sessionId === sid && c.userId === a.userId);
      a.peerGiven = Object.keys(privateOf(a.userId).peer[sid] ?? {}).filter(t => party.has(t)).length;
    }
  };
  ```
- Methods:
  ```ts
      async ratePeer(sid, targetId, scores) {
        const traits = ['collab', 'owner', 'comm', 'impact', 'growth'] as const;
        if (!traits.every(t => Number.isInteger(scores?.[t]) && scores[t] >= 1 && scores[t] <= 5)) throw new Error('Rate every trait from 1 to 5 stars.');
        await mutate(s => {
          requireStage(s, sid, ['vow_altar', 'rewards']);
          if (targetId === id) throw new Error('You can’t rate yourself.');
          if (!s.attendance.some(a => a.sessionId === sid && a.userId === targetId)) throw new Error('That ally isn’t in this party.');
          const p = readPrivate(); const mine = p.peer[sid] ||= {}; const clean = Object.fromEntries(traits.map(t => [t, scores[t]])) as PeerScores;
          const existing = s.peerRatings.find(r => r.id === mine[targetId]);
          if (existing) existing.scores = clean; else { const rid = uid(); s.peerRatings.push({ id: rid, sessionId: sid, targetId, scores: clean }); mine[targetId] = rid; }
          writePrivate(p); progress(s, sid);
        });
      },
      async myPeerRatings(sid) { const s = read(); const mine = readPrivate().peer[sid] ?? {}; return Object.fromEntries(Object.entries(mine).flatMap(([t, rid]) => { const r = s.peerRatings.find(x => x.id === rid); return r ? [[t, r.scores]] : []; })); },
      async peerSummary(sid) {
        const s = read(); if (!reportOpen(s, sid)) return [];
        const party = partyOf(s, sid); const live = new Set(party.flatMap(u => Object.values(privateOf(u).peer[sid] ?? {})));
        const all = summarizePeers(s.peerRatings.filter(r => r.sessionId === sid && party.includes(r.targetId) && live.has(r.id)));
        return isWardenOf(s, sid) ? all : all.filter(r => r.targetId === id);
      },
  ```
- `removePlayer`: after the filter, call `progress(s, sid);`.
- `cancelSession`: add `s.peerRatings = s.peerRatings.filter(x => x.sessionId !== sid);`.
- Import `summarizePeers`, and the types `PeerResult` and `PeerScores`.

Then fix the `Attendance` literals tsc flags by adding `peerGiven: 0`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add interface/src
git commit -m "Game: peer feedback in both backends (no rater stored, own result only, Warden sees all, removal-aware)"
```

---

### Task 10: Peer Feedback panel and finish warning (feature 2)

> **Revision 2:** use `VoyageHud`'s `nextWarning` from R2-3 instead of adding `finishWarning`: `{ title: 'Finish the voyage?', text: finishWarningText(...), stay: 'Keep going', go: 'Finish anyway' }`.

> **Revised (lobby check-in):** read Appendix section **Rev K** first. It replaces parts of this task, and it wins where they disagree.

**Files:**
- Create: `interface/src/components/PeerFeedbackPanel.tsx`
- Create: `interface/src/components/PeerFeedbackPanel.test.tsx`
- Create: `interface/src/components/PartyProgress.tsx`, `PartyProgress.test.tsx` (the Warden sees who has finished, and each player's check-in picks, per feature 1 open point A)
- Modify: `interface/src/components/feedback.css`
- Modify: `interface/src/components/VoyageHud.tsx`, `VoyageHud.test.tsx` (prop `finishWarning`)
- Modify: `interface/src/screens.tsx`

**Interfaces:**
- Consumes:
  - `ratePeer`, `myPeerRatings` (Task 9)
  - `PEER_TRAITS` (Task 7)
  - `pendingFeedback`, `finishWarningText` (Task 9)
- Produces:
  - `PeerFeedbackPanel({ allies: { userId; name; characterId }[]; mine: Record<UserId, PeerScores>; busy; onSave(targetId, scores): Promise<boolean> })`.
  - `VoyageHud` gets the prop `finishWarning?: string | null`.
  - `PartyProgress({ members: { userId; name }[]; attendance: Attendance[]; checkins: CheckIn[] })`. This is Warden-only. It also consumes `watchCheckIns` (Task 6) and `peerDone` (Task 9).

- [ ] **Step 1: Write the failing tests**

`PartyProgress.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyProgress from './PartyProgress';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const att = (userId: string, checkinDone: boolean, peerGiven: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast: 0, characterId: null, checkinDone, peerGiven });
describe('PartyProgress', () => {
  it('shows the Warden who has finished and each player’s check-in picks', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<PartyProgress members={[{ userId: 'a', name: 'Ana' }, { userId: 'b', name: 'Bob' }]} attendance={[att('a', true, 1), att('b', false, 0)]} checkins={[{ sessionId: 's', userId: 'a', sat: 4, growth: 5 }]} />));
    const row = (name: string) => [...el.querySelectorAll('li')].find(li => li.textContent?.includes(name))!;
    expect(row('Ana').querySelector('[aria-label="Checked in"]')).toBeTruthy(); expect(row('Ana').querySelector('[aria-label="Peer feedback done"]')).toBeTruthy();
    expect(row('Ana').textContent).toContain('♥ 4 · ◆ 5');
    expect(row('Bob').querySelector('[aria-label="Not checked in"]')).toBeTruthy(); expect(row('Bob').textContent).not.toContain('♥ ');
  });
});
```
Players never get this panel: `RetroScreen` renders it only when `warden`. The local and Supabase backends already return `[]` from `watchCheckIns` to non-Wardens (Tasks 5 and 6).

`PeerFeedbackPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PeerFeedbackPanel from './PeerFeedbackPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const allies = [{ userId: 'ana', name: 'Ana', characterId: 'wren' }, { userId: 'bob', name: 'Bob', characterId: null }];
async function render(mine = {}, onSave = vi.fn(async () => true)) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<PeerFeedbackPanel allies={allies} mine={mine} busy={false} onSave={onSave} />));
  return { el, onSave };
}
const star = (el: HTMLElement, trait: string, n: number) => el.querySelector<HTMLButtonElement>(`[aria-label="${trait}: ${n} of 5 stars"]`)!;
const saveBtn = (el: HTMLElement) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes('Save & next ally'))!;
describe('PeerFeedbackPanel', () => {
  it('needs all five traits, saves, then moves to the next ally', async () => {
    const { el, onSave } = await render();
    expect(el.querySelector('[aria-pressed="true"]')?.textContent).toContain('Ana');
    for (const t of ['Party Spirit', 'Dependable', 'Clear Comms', 'Impact']) await act(async () => star(el, t, 4).click());
    expect(saveBtn(el).disabled).toBe(true);
    await act(async () => star(el, 'Levels Up', 5).click());
    await act(async () => saveBtn(el).click());
    expect(onSave).toHaveBeenCalledWith('ana', { collab: 4, owner: 4, comm: 4, impact: 4, growth: 5 });
    expect(el.querySelector('[aria-pressed="true"]')?.textContent).toContain('Bob');
  });
  it('marks rated allies with a check and loads their saved stars', async () => {
    const { el } = await render({ ana: { collab: 2, owner: 3, comm: 4, impact: 5, growth: 1 } });
    expect(el.querySelector('[aria-label="Ana · rated"]')).toBeTruthy();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Ana · rated"]')!.click());
    expect(star(el, 'Party Spirit', 2).getAttribute('aria-checked')).toBe('true');
  });
});
```

Append to `VoyageHud.test.tsx`. Reuse its existing render helper. If the helper's props don't include `finishWarning`, pass it through the partial-props argument the helper already takes.
```tsx
  it('warns the Warden before finishing when feedback is missing, and can still finish', async () => {
    const { el, props } = await render({ nextLabel: 'Finish voyage', finishWarning: '1 player hasn’t checked in. Once you finish, nobody can add more.' });
    await act(async () => [...el.querySelectorAll('button')].find(b => b.textContent?.includes('Finish voyage'))!.click());
    expect(props.onNext).not.toHaveBeenCalled();
    expect(el.textContent).toContain('hasn’t checked in');
    await act(async () => [...el.querySelectorAll('button')].find(b => b.textContent === 'Finish anyway')!.click());
    expect(props.onNext).toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run them and watch them fail.**
Run: `cd interface && npx vitest run src/components/PeerFeedbackPanel.test.tsx src/components/VoyageHud.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`PeerFeedbackPanel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Check, Star } from 'lucide-react';
import type { PeerScores, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { PEER_TRAITS } from '../data/feedback';
import { Art } from './ui';
import './feedback.css';

type Ally = { userId: UserId; name: string; characterId: string | null };
/** Peer Feedback (feature 2): pick an ally, rate all five traits, "Save & next ally". Ratings are anonymous and editable until the voyage ends. */
export default function PeerFeedbackPanel({ allies, mine, busy, onSave }: { allies: Ally[]; mine: Record<UserId, PeerScores>; busy: boolean; onSave: (targetId: UserId, scores: PeerScores) => Promise<boolean> }) {
  const [target, setTarget] = useState<UserId | null>(allies.find(a => !mine[a.userId])?.userId ?? allies[0]?.userId ?? null);
  const [draft, setDraft] = useState<Partial<PeerScores>>(target ? mine[target] ?? {} : {});
  useEffect(() => { setDraft(target ? mine[target] ?? {} : {}); }, [target, mine]);
  if (!allies.length) return <section className="peer-panel" aria-label="Peer feedback"><header><h3>Peer Feedback</h3><p>No allies to rate yet.</p></header></section>;
  const complete = PEER_TRAITS.every(t => draft[t.key]);
  const save = async () => {
    if (!target || !complete || !(await onSave(target, draft as PeerScores))) return;
    const order = allies.map(a => a.userId); const at = order.indexOf(target);
    const next = [...order.slice(at + 1), ...order.slice(0, at)].find(u => !mine[u]); if (next) setTarget(next);
  };
  return <section className="peer-panel" aria-label="Peer feedback">
    <header><h3>Peer Feedback</h3><p>Anonymous: nobody, not even your Warden, sees who gave which stars.</p></header>
    <div className="peer-chips" role="group" aria-label="Allies">{allies.map(a => <button key={a.userId} type="button" aria-pressed={a.userId === target} aria-label={mine[a.userId] ? `${a.name} · rated` : a.name} onClick={() => setTarget(a.userId)}>
      <Art character={characterById(a.characterId)} kind="cutout" decorative /><span>{a.name}</span>{mine[a.userId] && <Check size={14} className="peer-done" />}</button>)}</div>
    {target && <div className="peer-traits">{PEER_TRAITS.map(t => <div key={t.key} className="peer-trait"><div><strong><span aria-hidden="true">{t.icon}</span> {t.title}</strong><small>{t.hint}</small></div>
      <div className="peer-stars" role="radiogroup" aria-label={t.title}>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={draft[t.key] === n} aria-label={`${t.title}: ${n} of 5 stars`} className={(draft[t.key] ?? 0) >= n ? 'lit' : ''} onClick={() => setDraft(d => ({ ...d, [t.key]: n }))}><Star size={20} /></button>)}</div></div>)}</div>}
    <button className="feedback-save" disabled={busy || !complete} onClick={() => void save()}>Save &amp; next ally</button>
  </section>;
}
```

Append to `feedback.css`:
```css
.peer-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
.peer-chips button{position:relative;flex:0 0 auto;display:grid;justify-items:center;gap:2px;width:78px;padding:6px 4px 4px;border:1px solid #d8bf8244;background:#10233acc;color:#d9e2ea;font:inherit;font-size:12px;cursor:pointer}
.peer-chips button[aria-pressed="true"]{border-color:#f3dca0;box-shadow:0 0 14px #e9cf8f44;color:#fff4dc}
.peer-chips .character-art,.peer-chips .silhouette{height:64px;width:auto;object-fit:contain}
.peer-done{position:absolute;top:4px;right:4px;color:#e9cf8f}
.peer-traits{display:grid;gap:8px}
.peer-trait{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.peer-trait strong{display:block;font-family:'Marcellus',serif;font-weight:400;font-size:15px}
.peer-trait small{font-size:12px;color:#b9c6d2}
.peer-stars{display:flex;gap:2px}
.peer-stars button{padding:4px;border:0;background:none;color:#5d6d80;cursor:pointer;transition:transform .12s}
.peer-stars button.lit{color:#e9cf8f;filter:drop-shadow(0 0 6px #e9cf8f66)}
.peer-stars button.lit svg{fill:currentColor}
.peer-stars button:hover{transform:scale(1.12)}
.peer-stars button:focus-visible,.peer-chips button:focus-visible{outline:2px solid #fff4dc;outline-offset:2px}
```

`PartyProgress.tsx`:
```tsx
import { Check, Heart, Star } from 'lucide-react';
import type { Attendance, CheckIn, UserId } from '../backend/types';
import { peerDone } from '../logic/feedback';
import './feedback.css';

/** Warden/admin only: who has checked in and finished peer feedback, plus each player's check-in picks (never anyone's peer ratings). */
export default function PartyProgress({ members, attendance, checkins }: { members: { userId: UserId; name: string }[]; attendance: Attendance[]; checkins: CheckIn[] }) {
  return <section className="party-progress" aria-label="Party progress"><h4>Party progress</h4>
    <ul>{members.map(m => { const a = attendance.find(x => x.userId === m.userId); const c = checkins.find(x => x.userId === m.userId); const peer = a ? peerDone(a, attendance) : false;
      return <li key={m.userId}><span>{m.name}</span>
        <span className={a?.checkinDone ? 'done' : ''} aria-label={a?.checkinDone ? 'Checked in' : 'Not checked in'}><Heart size={14} />{a?.checkinDone && <Check size={12} />}</span>
        <span className={peer ? 'done' : ''} aria-label={peer ? 'Peer feedback done' : 'Peer feedback not done'}><Star size={14} />{peer && <Check size={12} />}</span>
        {c && <small>♥ {c.sat} · ◆ {c.growth}</small>}</li>; })}</ul>
  </section>;
}
```
Append to `feedback.css`:
```css
.party-progress{display:grid;gap:6px;color:#fff4dc}
.party-progress h4{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:17px}
.party-progress ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.party-progress li{display:grid;grid-template-columns:1fr auto auto 80px;align-items:center;gap:10px;padding:4px 0;border-bottom:1px dashed #d8bf8222;font-size:13.5px}
.party-progress li span[aria-label]{display:inline-flex;align-items:center;gap:2px;color:#5d6d80}
.party-progress li span.done{color:#e9cf8f}
.party-progress li small{color:#b9c6d2;text-align:right}
```
`screens.tsx` `RetroScreen`:
- Add `const [checkins] = useWatch<CheckIn[]>(cb => session && warden ? backend.watchCheckIns(session.id, cb) : (() => {}), [], [backend, session?.id, warden]);`. Put it with the existing state at the top of `RetroScreen`, **before** `if (!session) return`.
- Inside `feedback`, first child for the Warden: `{warden && <PartyProgress members={members} attendance={attendance} checkins={checkins} />}`.
- Import `PartyProgress` and `useWatch`.

`VoyageHud.tsx`:
- Add the prop `finishWarning?: string | null` and `const [finishing, setFinishing] = useState(false);`.
- The Next button's onClick becomes `() => finishWarning ? setFinishing(true) : onNext()`.
- Add after the cancel confirm:
  ```tsx
  {warden && finishing && finishWarning && <div className="voyage-confirm" role="alertdialog" aria-modal="true" aria-labelledby="voyage-finish-title">
    <h3 id="voyage-finish-title">Finish the voyage?</h3><p>{finishWarning}</p>
    <div><button autoFocus onClick={() => setFinishing(false)}>Keep going</button><button disabled={busy} onClick={() => { setFinishing(false); onNext(); }}>Finish anyway</button></div>
  </div>}
  ```

`screens.tsx` `RetroScreen`:
- State and loading, like `myCheck`. Put them at the top of `RetroScreen`, **before** `if (!session) return`:
  ```tsx
  const [myPeer, setMyPeer] = useState<Record<string, PeerScores>>({});
  useEffect(() => { let live = true; if (!session || !['vow_altar', 'rewards'].includes(session.stage)) return; backend.myPeerRatings(session.id).then(r => { if (live) setMyPeer(r); }).catch(() => {}); return () => { live = false; }; }, [backend, session?.id, session?.stage]);
  ```
- Inside the `feedback` element, after `CheckInPanel`:
  ```tsx
  <PeerFeedbackPanel allies={members.filter(m => !m.you)} mine={myPeer} busy={busy} onSave={async (t, sc) => { let ok = false; await run(async () => { await backend.ratePeer(session.id, t, sc); setMyPeer(await backend.myPeerRatings(session.id)); ok = true; }, 'Rating saved.'); return ok; }} />
  ```
  `members` comes from Task 4.
- `VoyageHud`: pass `finishWarning={session.stage === 'rewards' ? finishWarningText(pendingFeedback(attendance)) : null}`.
- Import `PeerFeedbackPanel`, `PeerScores`, `finishWarningText` and `pendingFeedback`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. Open three local tabs: jay, ana and bob.
2. Ana rates Bob, then edits the rating. The ✓ shows. Ana can't see her own chip.
3. At Homecoming, Finish shows the warning while Bob hasn't rated anyone.
4. Take a phone-width screenshot of the panel.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: Peer Feedback panel (character chips, five traits, Save & next ally) and the Warden's finish warning"
```

---

### Task 11: Speaker-turn rules and the `speaker` cue (feature 3, logic)

> **Superseded by Revision 2 (R2-4).** Skip this task.

**Files:**
- Create: `interface/src/logic/speaker.ts`
- Create: `interface/src/logic/speaker.test.ts`
- Modify: `interface/src/backend/types.ts` (`CueTopic`)
- Modify: `interface/src/backend/supabase.ts` (`openLive` broadcast list)
- Test: `interface/src/backend/supabase.test.ts`

**Interfaces:**
- Consumes: `SpeakerState` (Task 3).
- Produces:
  - `NO_SPEAKER: SpeakerState`
  - `speakerMark(s, id): 'speaking' | 'spoken' | 'skipped' | 'waiting'`
  - `speakerPool(party, s): UserId[]`
  - `spinSpeaker(party, s, rng?): SpeakerState | null`
  - `finishTurn(s): SpeakerState`
  - `skipSpeaker(s, id): SpeakerState`
  - `addBack(s, id): SpeakerState`
  - `speakerCounts(party, s): { spoken: number; remaining: number }`
  - `reelFrames(party, pickedId, rng?, length = 14): UserId[]`
  - `CueTopic` includes `'speaker'`, with payload `{ sessionId: string; frames: UserId[] }`.

- [ ] **Step 1: Write the failing tests** (`speaker.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { addBack, finishTurn, NO_SPEAKER, reelFrames, skipSpeaker, speakerCounts, speakerMark, speakerPool, spinSpeaker } from './speaker';

const party = ['a', 'b', 'c'];
const seq = (...xs: number[]) => () => xs.shift() ?? 0;
describe('speaker turns', () => {
  it('spins among those who have not spoken and never picks anyone twice', () => {
    let s = spinSpeaker(party, null, seq(0))!; expect(s.currentId).toBe('a');
    s = finishTurn(s); expect(s).toEqual({ currentId: null, spoken: ['a'], skipped: [] });
    s = spinSpeaker(party, s, seq(0))!; expect(s.currentId).toBe('b');
    s = finishTurn(spinSpeaker(party, finishTurn(s), seq(0))!);
    expect(s.spoken).toEqual(['a', 'b', 'c']); expect(spinSpeaker(party, s)).toBeNull();
  });
  it('spin again re-rolls to someone else and the first pick goes back to waiting', () => {
    const first = spinSpeaker(party, null, seq(0))!;
    const again = spinSpeaker(party, first, seq(0))!;
    expect(again.currentId).toBe('b'); expect(speakerMark(again, 'a')).toBe('waiting');
  });
  it('skipped players are never picked until added back', () => {
    let s = skipSpeaker(NO_SPEAKER, 'a');
    expect(speakerPool(party, s)).toEqual(['b', 'c']);
    s = skipSpeaker(spinSpeaker(party, s, seq(0))!, 'b');   // skipping the current speaker clears the turn
    expect(s.currentId).toBeNull(); expect(speakerPool(party, s)).toEqual(['c']);
    expect(speakerPool(party, addBack(s, 'a'))).toEqual(['a', 'c']);
  });
  it('counts spoken and remaining over the current party (removed players drop out)', () => {
    const s = { currentId: 'b', spoken: ['a', 'gone'], skipped: ['c'] };
    expect(speakerCounts(party, s)).toEqual({ spoken: 1, remaining: 1 });
  });
  it('builds a reel that lands on the pick', () => {
    const f = reelFrames(party, 'c', seq(0.1, 0.5, 0.9), 6);
    expect(f).toHaveLength(6); expect(f.at(-1)).toBe('c'); expect(f.every(id => party.includes(id))).toBe(true);
  });
});
```

Append to `supabase.test.ts` in the `describe('supabase cues and presence', …)` block. Use the channel fake that the existing cue tests use, and copy their exact pattern for capturing `ch.on('broadcast', { event })` registrations:
```ts
  it('listens for the speaker cue on the live channel', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    const got = vi.fn(); b.on('speaker', got); b.emit('speaker', { sessionId: 's1', frames: ['u1'] });
    expect(got).toHaveBeenCalledWith({ sessionId: 's1', frames: ['u1'] }, 'u1');
  });
```
This test proves local delivery. Also extend the existing test in that block that lists or fires broadcast events, so it covers `'speaker'`. If none exists, assert in `fakeClient` that `channel.on` was called with `{ event: 'speaker' }`:
```ts
    expect(registered).toContainEqual(expect.objectContaining({ event: 'speaker' }));
```
Here `registered` collects the filter objects passed to `channel.on`. Add that collection to `fakeClient`'s `channel.on` (`registered.push(f)`) and return it.

- [ ] **Step 2: Run them and watch them fail.**
Expected: FAIL (module missing).

- [ ] **Step 3: Implement** (`logic/speaker.ts`)

```ts
import type { SpeakerState, UserId } from '../backend/types';

export const NO_SPEAKER: SpeakerState = { currentId: null, spoken: [], skipped: [] };
export type SpeakerMark = 'speaking' | 'spoken' | 'skipped' | 'waiting';
export function speakerMark(s: SpeakerState | null, id: UserId): SpeakerMark {
  return s?.currentId === id ? 'speaking' : s?.spoken.includes(id) ? 'spoken' : s?.skipped.includes(id) ? 'skipped' : 'waiting';
}
/** Who a spin can pick: current party members who haven't spoken, aren't skipped, and aren't speaking now. */
export const speakerPool = (party: UserId[], s: SpeakerState | null) => party.filter(id => speakerMark(s, id) === 'waiting');
/** Spin, or "Spin again" while someone is speaking (they go back to waiting, not to spoken). Null when nobody is left. */
export function spinSpeaker(party: UserId[], s: SpeakerState | null, rng = Math.random): SpeakerState | null {
  const pool = speakerPool(party, s); if (!pool.length) return null;
  return { ...(s ?? NO_SPEAKER), currentId: pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))] };
}
/** "Done": the current speaker has had their one turn this voyage. */
export function finishTurn(s: SpeakerState | null): SpeakerState {
  return s?.currentId ? { currentId: null, spoken: [...s.spoken, s.currentId], skipped: s.skipped } : s ?? NO_SPEAKER;
}
/** "Skip": take an absent player out of the pool (ends their turn if they were picked). */
export function skipSpeaker(s: SpeakerState | null, id: UserId): SpeakerState {
  const b = s ?? NO_SPEAKER; return { currentId: b.currentId === id ? null : b.currentId, spoken: b.spoken, skipped: b.skipped.includes(id) ? b.skipped : [...b.skipped, id] };
}
export const addBack = (s: SpeakerState | null, id: UserId): SpeakerState => { const b = s ?? NO_SPEAKER; return { ...b, skipped: b.skipped.filter(x => x !== id) }; };
/** "Spoken N · Remaining M" over the current party (speaking now counts as remaining). */
export function speakerCounts(party: UserId[], s: SpeakerState | null) {
  const marks = party.map(id => speakerMark(s, id));
  return { spoken: marks.filter(m => m === 'spoken').length, remaining: marks.filter(m => m === 'waiting' || m === 'speaking').length };
}
/** Portraits the roulette shows on every screen, ending on the pick. */
export function reelFrames(party: UserId[], pickedId: UserId, rng = Math.random, length = 14): UserId[] {
  return [...Array.from({ length: length - 1 }, () => party[Math.min(party.length - 1, Math.floor(rng() * party.length))]), pickedId];
}
```

`types.ts`: `export type CueTopic = 'pull_reveal' | 'reaction' | 'stage_cue' | 'skill' | 'say' | 'speaker';`

`supabase.ts` `openLive`: `(['pull_reveal', 'reaction', 'stage_cue', 'skill', 'say', 'speaker'] as const)`.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add interface/src
git commit -m "Game: speaker-turn rules (spin, spin again, done, skip, add back) and a live 'speaker' cue"
```

---

### Task 12: Speaker turns in the Resonance Hall (feature 3, UI)

> **Superseded by Revision 2 (R2-5).** Skip this task.

**Files:**
- Create: `interface/src/components/SpeakerPanel.tsx`, `SpeakerPanel.test.tsx`
- Create: `interface/src/components/SpeakerReel.tsx`, `SpeakerReel.test.tsx`
- Create: `interface/src/components/speaker.css`
- Modify: `interface/src/components/Scene.tsx` (prop `speakerId`: spotlight class + the chosen player walks to the beacon)
- Modify: `interface/src/components/Scene.test.tsx`
- Modify: `interface/src/screens.tsx`

**Interfaces:**
- Consumes: everything from `logic/speaker.ts`, `Session.speaker`, and the `backend.emit/on('speaker')` cue.
- Produces:
  - `SpeakerPanel({ party: { userId; name; characterId }[]; speaker; warden; busy; onChange(next: SpeakerState, frames?: UserId[]) })`
  - `SpeakerReel({ backend, sessionId, party })`
  - `Scene` gets the prop `speakerId?: string | null`.

- [ ] **Step 1: Write the failing tests**

`SpeakerPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SpeakerState } from '../backend/types';
import SpeakerPanel from './SpeakerPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
async function render(speaker: SpeakerState | null, warden = true) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onChange = vi.fn();
  await act(async () => createRoot(el).render(<SpeakerPanel party={party} speaker={speaker} warden={warden} busy={false} onChange={onChange} />));
  return { el, onChange };
}
const btn = (el: HTMLElement, text: string) => [...el.querySelectorAll('button')].find(b => b.textContent === text);
describe('SpeakerPanel', () => {
  it('spins and sends the new state with reel frames ending on the pick', async () => {
    const { el, onChange } = await render(null);
    expect(el.textContent).toContain('Spoken 0 · Remaining 2');
    await act(async () => btn(el, 'Spin')!.click());
    const [next, frames] = onChange.mock.calls[0];
    expect(['a', 'b']).toContain(next.currentId); expect(frames.at(-1)).toBe(next.currentId);
  });
  it('shows Done and Spin again during a turn; Done marks spoken', async () => {
    const { el, onChange } = await render({ currentId: 'a', spoken: [], skipped: [] });
    expect(el.textContent).toContain('Now speaking: Ana');
    await act(async () => btn(el, 'Done')!.click());
    expect(onChange).toHaveBeenCalledWith({ currentId: null, spoken: ['a'], skipped: [] });
    expect(btn(el, 'Spin again')).toBeTruthy();
  });
  it('skips and adds back', async () => {
    const { el, onChange } = await render({ currentId: null, spoken: [], skipped: ['b'] });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Add Bob back"]')!.click());
    expect(onChange).toHaveBeenCalledWith({ currentId: null, spoken: [], skipped: [] });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Skip Ana"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith({ currentId: null, spoken: [], skipped: ['b', 'a'] });
  });
  it('players see the tracker but no controls', async () => {
    const { el } = await render({ currentId: 'b', spoken: ['a'], skipped: [] }, false);
    expect(el.textContent).toContain('Spoken 1 · Remaining 1');
    expect(btn(el, 'Done')).toBeUndefined(); expect(btn(el, 'Spin again')).toBeUndefined();
  });
});
```

`SpeakerReel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../backend/local';
import SpeakerReel from './SpeakerReel';

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });
describe('SpeakerReel', () => {
  it('plays the same reel on every screen and lands on the pick', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} close() {} });
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const backend = createLocalBackend('jay');
    const el = document.createElement('div'); document.body.append(el);
    const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
    await act(async () => createRoot(el).render(<SpeakerReel backend={backend} sessionId="s1" party={party} />));
    expect(el.textContent).toBe('');
    await act(async () => backend.emit('speaker', { sessionId: 'other', frames: ['a'] }));
    expect(el.textContent).toBe('');
    await act(async () => backend.emit('speaker', { sessionId: 's1', frames: ['a', 'b', 'a', 'b'] }));
    // Each frame's timeout is scheduled by an effect after the previous render, so advance in small steps.
    const advance = async (ms: number) => { for (let t = 0; t < ms; t += 50) await act(async () => { vi.advanceTimersByTime(50); }); };
    await advance(1000);
    expect(el.querySelector('.speaker-reel.landed')?.textContent).toContain('Bob');
    await advance(2000);
    expect(el.textContent).toBe('');
  });
});
```

`Scene.test.tsx`:
- Extend `render`'s `extra` type with `speakerId?: string | null`.
- Pass `speakerId={speakerId}` to `<Scene>` inside `draw`. Hold it in a `let speakerId = extra.speakerId ?? null;` next to `frozen`.
- Add `speak: (id: string | null) => act(async () => { speakerId = id; draw(extra.stage); })` to the returned object.
- Then add:
```tsx
describe('speaker turns', () => {
  it('spotlights the chosen speaker and walks them to the beacon', async () => {
    const el = await render('wren', { stage: 'hall' });
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeNull();
    const before = posOf(el);
    await el.speak('jay'); await run(1500);
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeTruthy();
    const after = posOf(el); const goal = { x: MAP.beacon.x, y: MAP.beacon.y + 0.06 };
    expect(Math.hypot(after.x - goal.x, after.y - goal.y)).toBeLessThan(Math.hypot(before.x - goal.x, before.y - goal.y));
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
Expected: FAIL.

- [ ] **Step 3: Implement**

`SpeakerPanel.tsx`:
```tsx
import type { SpeakerState, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { addBack, finishTurn, reelFrames, skipSpeaker, speakerCounts, speakerMark, speakerPool, spinSpeaker, type SpeakerMark } from '../logic/speaker';
import { Art } from './ui';
import './speaker.css';

type Member = { userId: UserId; name: string; characterId: string | null };
const MARK: Record<SpeakerMark, string> = { speaking: 'Speaking', spoken: 'Spoken', skipped: 'Skipped', waiting: 'Waiting' };
/** Resonance Hall speaker turns (feature 3): everyone gets one turn; the Warden spins, ends turns, skips the absent. */
export default function SpeakerPanel({ party, speaker, warden, busy, onChange }: { party: Member[]; speaker: SpeakerState | null; warden: boolean; busy: boolean; onChange: (next: SpeakerState, frames?: UserId[]) => void }) {
  const ids = party.map(p => p.userId); const { spoken, remaining } = speakerCounts(ids, speaker);
  const current = party.find(p => p.userId === speaker?.currentId); const canSpin = speakerPool(ids, speaker).length > 0;
  const spin = () => { const next = spinSpeaker(ids, speaker); if (next?.currentId) onChange(next, reelFrames(ids, next.currentId)); };
  return <section className="speaker-panel" aria-label="Speaker turns">
    <header><h4>Speaker turns</h4><p>Spoken {spoken} · Remaining {remaining}</p></header>
    <p className="speaker-now">{current ? <>Now speaking: <strong>{current.name}</strong></> : canSpin ? 'Spin to choose who speaks next.' : 'Everyone has had a turn.'}</p>
    <ul>{party.map(m => { const mark = speakerMark(speaker, m.userId); return <li key={m.userId} className={`mark-${mark}`}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative /><span>{m.name}</span><small>{MARK[mark]}</small>
      {warden && (mark === 'waiting' || mark === 'speaking') && <button disabled={busy} aria-label={`Skip ${m.name}`} onClick={() => onChange(skipSpeaker(speaker, m.userId))}>Skip</button>}
      {warden && mark === 'skipped' && <button disabled={busy} aria-label={`Add ${m.name} back`} onClick={() => onChange(addBack(speaker, m.userId))}>Add back</button>}
    </li>; })}</ul>
    {warden && <div className="speaker-controls">{current
      ? <><button disabled={busy} onClick={() => onChange(finishTurn(speaker))}>Done</button><button disabled={busy || !canSpin} onClick={spin}>Spin again</button></>
      : <button className="speaker-spin" disabled={busy || !canSpin} onClick={spin}>Spin</button>}</div>}
  </section>;
}
```

`SpeakerReel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Backend, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { useReducedMotion } from '../hooks';
import { Art } from './ui';
import './speaker.css';

type Member = { userId: UserId; name: string; characterId: string | null };
/** The roulette every screen plays at the same moment when the Warden spins (cue topic 'speaker'). */
export default function SpeakerReel({ backend, sessionId, party }: { backend: Backend; sessionId: string; party: Member[] }) {
  const [frames, setFrames] = useState<UserId[] | null>(null); const [i, setI] = useState(0); const reduced = useReducedMotion();
  useEffect(() => backend.on('speaker', data => {
    const d = data as { sessionId?: string; frames?: UserId[] };
    if (d?.sessionId === sessionId && Array.isArray(d.frames) && d.frames.length) { setFrames(d.frames); setI(reduced ? d.frames.length - 1 : 0); }
  }), [backend, sessionId, reduced]);
  useEffect(() => {
    if (!frames) return;
    if (i >= frames.length - 1) { const t = setTimeout(() => setFrames(null), 1800); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), 70 + i * 18); return () => clearTimeout(t);   // slows down like a reel
  }, [frames, i]);
  if (!frames) return null;
  const m = party.find(p => p.userId === frames[i]); const landed = i >= frames.length - 1;
  return <div className={`speaker-reel${landed ? ' landed' : ''}`} role="status" aria-live="polite">
    <Art character={characterById(m?.characterId)} kind="cutout" decorative /><strong>{m?.name ?? '…'}</strong>{landed && <span>speaks next</span>}
  </div>;
}
```

`speaker.css`:
```css
/* Resonance Hall speaker turns: tracker, roulette reel, spotlight. */
.speaker-panel{margin-top:16px;border-top:1px solid #d8bf8255;padding-top:12px;display:grid;gap:8px;color:#fff4dc}
.speaker-panel header{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.speaker-panel h4{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:17px}
.speaker-panel header p,.speaker-now{margin:0;font-size:13px;color:#b9c6d2}
.speaker-now strong{color:#e9cf8f}
.speaker-panel ul{list-style:none;margin:0;padding:0;display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin}
.speaker-panel li{flex:0 0 auto;display:grid;justify-items:center;gap:2px;width:84px;padding:6px 4px;border:1px solid #d8bf8233;background:#10233acc;font-size:12.5px}
.speaker-panel li .character-art,.speaker-panel li .silhouette{height:58px;width:auto;object-fit:contain}
.speaker-panel li small{font-size:11px;color:#b9c6d2}
.speaker-panel li.mark-speaking{border-color:#f3dca0;box-shadow:0 0 16px #e9cf8f55}
.speaker-panel li.mark-spoken{opacity:.6}
.speaker-panel li.mark-skipped{opacity:.45;border-style:dashed}
.speaker-panel li button{padding:2px 8px;border:1px solid #d8bf8266;background:transparent;color:#e9cf8f;font:inherit;font-size:11px;cursor:pointer}
.speaker-controls{display:flex;gap:8px}
.speaker-controls button{min-height:38px;padding:0 16px;border:1px solid #d8bf8299;background:#10233acc;color:#fff4dc;font:inherit;cursor:pointer}
.speaker-controls .speaker-spin{border-color:#f3dca0;background:linear-gradient(180deg,#e9cf8f,#c9a45a);color:#1b2a3a;font-weight:700}
.speaker-controls button:disabled{opacity:.5;cursor:not-allowed}
.speaker-reel{position:fixed;left:50%;top:22%;z-index:40;transform:translateX(-50%);display:grid;justify-items:center;gap:4px;padding:14px 26px 12px;border:1px solid #d8bf8299;background:radial-gradient(circle at 50% 30%,#1d3a5c,#0a1a2cf2);color:#fff4dc;pointer-events:none}
.speaker-reel .character-art,.speaker-reel .silhouette{height:150px;width:auto;object-fit:contain}
.speaker-reel strong{font-family:'Marcellus',serif;font-weight:400;font-size:24px}
.speaker-reel span{font-size:13px;color:#e9cf8f}
.speaker-reel.landed{box-shadow:0 0 40px #e9cf8f66;animation:speaker-land .5s var(--ease,ease-out)}
@keyframes speaker-land{from{transform:translateX(-50%) scale(.92)}to{transform:translateX(-50%) scale(1)}}
.speaker-your-turn{position:fixed;left:50%;top:84px;z-index:35;transform:translateX(-50%);margin:0;padding:10px 22px;border:1px solid #f3dca0;background:linear-gradient(180deg,#e9cf8f,#c9a45a);color:#1b2a3a;font-family:'Marcellus',serif;font-size:18px}
.scene-character.speaker-spotlight::before{content:'';position:absolute;left:50%;bottom:0;width:140%;height:70%;transform:translateX(-50%);background:radial-gradient(ellipse at 50% 100%,#f3dca0aa,transparent 70%);pointer-events:none;z-index:-1}
@media (prefers-reduced-motion:reduce){.speaker-reel.landed{animation:none}}
```
Check that `.scene-character` is `position:absolute`. It already is, in `world.css`. If it isn't, add `position:relative` to the spotlight rule's parent.

`Scene.tsx`:
- Add `speakerId?: string | null` to the props.
- In `fieldClass`, add `speakerId && speakerId === id ? 'speaker-spotlight' : '',` to the array.
- After the gathering `useEffect` (around line 194), add:
  ```tsx
    // Speaker turns: the chosen player walks to the beacon. Positions are self-broadcast, so only their own screen moves them.
    const lastSpeaker = useRef(speakerId);
    useEffect(() => {
      const changed = lastSpeaker.current !== speakerId; lastSpeaker.current = speakerId;
      if (changed && speakerId === me.id && movement) { keys.current.clear(); walkTo(gatherSpot({ x: MAP.beacon.x, y: MAP.beacon.y + 0.06 }, 0, 1), 2.2); }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speakerId]);
  ```
  Use the same prop name as Scene's movement flag (`movement`).

`screens.tsx` `RetroScreen`:
- Before `backdrop`, add:
  ```tsx
  const speakerId = session.stage === 'hall' ? session.speaker?.currentId ?? null : null;
  const changeSpeaker = (next: SpeakerState, frames?: UserId[]) => run(async () => { await backend.updateSession(session.id, { speaker: next }); if (frames) backend.emit('speaker', { sessionId: session.id, frames }); });
  ```
  Pass `speakerId={speakerId}` to `<Scene>`.
- In the hall block, after `hall-controls`, add:
  ```tsx
  <SpeakerPanel party={members} speaker={session.speaker} warden={warden} busy={busy} onChange={changeSpeaker} />
  ```
- After `</VoyageWindow>`, add:
  ```tsx
  {session.stage === 'hall' && <SpeakerReel backend={backend} sessionId={session.id} party={members} />}
  {speakerId === me.id && <p className="speaker-your-turn" role="status">Your turn — the hall is listening.</p>}
  ```
- Import `SpeakerPanel`, `SpeakerReel`, `SpeakerState` and `UserId`.
- Also delete the stale `<p className="preview-note">Reveal order and vote glows are temporary previews; …</p>` line? **No**: leave it. It's unrelated, so mention it to Jay instead.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. Open three local tabs and go to the Hall.
2. The Warden spins: every tab plays the same reel and lands on the same name.
3. The chosen tab shows "Your turn" and walks to the beacon.
4. Done → Spin never picks them again. Skip → never picked. Add back → pickable.
5. Reload the chosen tab mid-turn: the banner and spotlight persist, because they come from session state.
6. Turn on reduce-motion: the reel lands at once.
7. Take a screenshot.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: speaker turns in the Resonance Hall (shared roulette, spotlight, walk to the beacon, tracker, Warden controls)"
```

---

### Task 13: Report model, voyage Starlight and portrait layout (features 4 and 6, logic)

**Files:**
- Modify: `interface/src/logic/report.ts`, `report.test.ts`
- Modify: `interface/src/logic/index.ts`, `index.test.ts`

**Interfaces:**
- Consumes:
  - `rankByVotes` (Task 1)
  - `CheckInSummary`, `PeerResult` (Tasks 6 and 9)
  - `CATEGORIES`
- Produces:
  - `voyageStarlight({ settings, attendance, promisesKept }): number`
  - `promisesKept(session, sessions, vows): number`
  - `portraitGroups<T>(items: T[]): T[][]`
  - `PortraitMember = { userId; name; characterId: string | null; warden: boolean }`
  - `VoyageReport`
  - `buildReport(input: ReportInput): VoyageReport`

- [ ] **Step 1: Write the failing tests**

Append to `logic/index.test.ts`. Use that file's style and the existing `DEFAULT_SETTINGS` import, or import it from `'../backend/local'`:
```ts
import { voyageStarlight } from './index';
describe('voyageStarlight', () => {
  it('pays attending, own votes and the team’s promises kept at this gate', () => {
    const a = { userId: 'ana', sessionId: 's', joinedAt: 1, votesCast: 3, characterId: null, checkinDone: false, peerGiven: 0 };
    expect(voyageStarlight({ settings: DEFAULT_SETTINGS, attendance: a, promisesKept: 2 })).toBe(300 + 3 * 50 + 2 * 200);
    expect(voyageStarlight({ settings: DEFAULT_SETTINGS, attendance: undefined, promisesKept: 2 })).toBe(0);
  });
});
```

Append to `logic/report.test.ts`:
```ts
import { DEFAULT_SETTINGS } from '../backend/local';
import type { Attendance, Player, Session, Vow } from '../backend/types';
import { buildReport, portraitGroups, promisesKept } from './report';

const sess = (id: string, createdAt: number, extra: Partial<Session> = {}): Session => ({ id, sprintName: id, stage: 'rewards', status: 'active', wardenId: 'w', currentFragmentId: null, timerEndsAt: null, createdAt, partyLocked: false, speaker: null, ...extra });
const vow = (id: string, sessionId: string, status: Vow['status'], ownerId: string | null = null): Vow => ({ id, sessionId, text: id, ownerId, status, createdAt: 1 });
const att = (userId: string, extra: Partial<Attendance> = {}): Attendance => ({ userId, sessionId: 'now', joinedAt: 1, votesCast: 2, characterId: null, checkinDone: true, peerGiven: 1, ...extra });
const player = (userId: string, displayCharacterId: string | null): Player => ({ userId, displayCharacterId, owned: {}, pulls: [], nickname: userId, introSeen: true });

describe('promisesKept', () => {
  it('counts the previous voyage’s vows that are fulfilled', () => {
    const sessions = [sess('old', 1), sess('prev', 2), sess('now', 3)];
    const vows = [vow('a', 'prev', 'fulfilled'), vow('b', 'prev', 'not_yet'), vow('c', 'old', 'fulfilled'), vow('d', 'now', 'open')];
    expect(promisesKept(sessions[2], sessions, vows)).toBe(1);
    expect(promisesKept(sessions[0], sessions, vows)).toBe(0);
  });
});
describe('portraitGroups', () => {
  it('uses one row up to 5, two rows up to 10, rows of 6 beyond', () => {
    const n = (k: number) => portraitGroups(Array.from({ length: k }, (_, i) => i)).map(r => r.length);
    expect(n(1)).toEqual([1]); expect(n(5)).toEqual([5]); expect(n(8)).toEqual([4, 4]); expect(n(9)).toEqual([5, 4]); expect(n(13)).toEqual([6, 6, 1]);
  });
});
describe('buildReport', () => {
  const base = () => ({
    session: sess('now', 3, { wardenId: 'w' }), sessions: [sess('prev', 2), sess('now', 3)],
    attendance: [att('ana', { joinedAt: 2, characterId: 'wren' }), att('w', { joinedAt: 3 })], players: [player('w', 'seren'), player('ana', 'rook')],
    profiles: { ana: { name: 'Ana' }, w: { name: 'Jay' } },
    fragments: [{ id: 'f1', sessionId: 'now', text: 'Keep pairing', category: 'radiance' as const, createdAt: 1 }, { id: 'f2', sessionId: 'now', text: 'Fix CI', category: 'fracture' as const, createdAt: 2 }, { id: 'f3', sessionId: 'now', text: 'Faster CI', category: 'fracture' as const, createdAt: 3 }],
    votes: [{ id: 'v', sessionId: 'now', fragmentId: 'f3' }],
    vows: [vow('Ship it', 'now', 'open', 'ana'), vow('Tidy', 'now', 'open'), vow('kept', 'prev', 'fulfilled')],
    settings: DEFAULT_SETTINGS, checkIn: { sat: 70, growth: 80, n: 2, of: 2 },
    peer: [{ targetId: 'ana', raters: 1, pct: { collab: 80, owner: 80, comm: 80, impact: 80, growth: 80 } }, { targetId: 'w', raters: 1, pct: { collab: 60, owner: 60, comm: 60, impact: 60, growth: 60 } }],
  });
  it('puts the Warden first and falls back to the display companion', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.portrait).toEqual([{ userId: 'w', name: 'Jay', characterId: 'seren', warden: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false }]);
  });
  it('shows a player only their own peer result and their own Starlight', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.peer.map(p => p.userId)).toEqual(['ana']);
    expect(r.numbers).toEqual({ thoughts: 3, votes: 1, vows: 2, promisesKept: 1, myStarlight: 300 + 2 * 50 + 200 });
  });
  it('shows the Warden everyone’s peer results', () => {
    expect(buildReport({ ...base(), viewerId: 'w', viewerSeesAll: true }).peer.map(p => p.name).sort()).toEqual(['Ana', 'Jay']);
  });
  it('gives an outsider no Starlight and no peer rows (Archives viewer)', () => {
    const r = buildReport({ ...base(), viewerId: 'stranger', viewerSeesAll: false });
    expect(r.numbers.myStarlight).toBeNull(); expect(r.peer).toEqual([]);
  });
  it('groups thoughts by category, most-voted first, and names vow owners', () => {
    const r = buildReport({ ...base(), viewerId: 'ana', viewerSeesAll: false });
    expect(r.thoughts.find(t => t.category === 'fracture')!.items.map(i => i.text)).toEqual(['Faster CI', 'Fix CI']);
    expect(r.thoughts.map(t => t.category)).toEqual(['radiance', 'fracture']);   // empty categories are left out
    expect(r.vows).toEqual([{ text: 'Ship it', owner: 'Ana' }, { text: 'Tidy', owner: 'Shared by the team' }]);
  });
  it('drops peer rows for players no longer in the party', () => {
    const r = buildReport({ ...base(), attendance: [att('w')], viewerId: 'w', viewerSeesAll: true });
    expect(r.peer.map(p => p.userId)).toEqual(['w']);
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
Expected: FAIL.

- [ ] **Step 3: Implement**

`logic/index.ts` (append):
```ts
/** Starlight one player earned in one voyage: attending, their own votes, and the team's promises kept at its Sanctuary Gate. */
export function voyageStarlight({ settings, attendance, promisesKept }: { settings: Settings; attendance: Attendance | undefined; promisesKept: number }): number {
  return attendance ? settings.starlight.attend + settings.starlight.perVote * attendance.votesCast + settings.starlight.perVow * promisesKept : 0;
}
```

`logic/report.ts` (append; extend the imports):
```ts
import type { Attendance, CheckInSummary, Fragment, FragmentCategory, PeerResult, PeerScores, Player, Session, Settings, UserId, Vote, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { voyageStarlight } from './index';

/** Promises kept at a voyage's Sanctuary Gate: the voyage just before it, its vows now fulfilled. */
export function promisesKept(session: Session, sessions: Session[], vows: Vow[]): number {
  const before = sessions.filter(s => s.createdAt < session.createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
  return before ? vows.filter(v => v.sessionId === before.id && v.status === 'fulfilled').length : 0;
}
/** Party Portrait rows: 1–5 in one row, 6–10 in two, then rows of 6. */
export function portraitGroups<T>(items: T[]): T[][] {
  const sizes = items.length <= 5 ? [items.length] : items.length <= 10 ? [Math.ceil(items.length / 2), Math.floor(items.length / 2)] : Array.from({ length: Math.ceil(items.length / 6) }, () => 6);
  let at = 0; return sizes.map(n => items.slice(at, at += n)).filter(r => r.length);
}
export interface PortraitMember { userId: UserId; name: string; characterId: string | null; warden: boolean }
export interface VoyageReport {
  sprintName: string; date: number; portrait: PortraitMember[];
  numbers: { thoughts: number; votes: number; vows: number; promisesKept: number; /** The viewer's own; null when they weren't in the party. */ myStarlight: number | null };
  checkIn: CheckInSummary | null;
  peer: { userId: UserId; name: string; raters: number; pct: PeerScores }[];
  thoughts: { category: FragmentCategory; label: string; plain: string; items: { text: string; votes: number }[] }[];
  vows: { text: string; owner: string }[];
}
export interface ReportInput {
  session: Session; sessions: Session[]; viewerId: UserId; /** Warden of this voyage, or an admin. */ viewerSeesAll: boolean;
  attendance: Attendance[]; players: Player[]; profiles: Record<string, { name: string }>;
  fragments: Fragment[]; votes: Vote[]; vows: Vow[]; settings: Settings; checkIn: CheckInSummary | null; peer: PeerResult[];
}
/** Everything the Homecoming report, Archives and the saved image show — one model, so they always match. */
export function buildReport(i: ReportInput): VoyageReport {
  const party = i.attendance.filter(a => a.sessionId === i.session.id).sort((a, b) => Number(b.userId === i.session.wardenId) - Number(a.userId === i.session.wardenId) || a.joinedAt - b.joinedAt);
  const name = (id: UserId) => i.profiles[id]?.name || 'Warden';
  const kept = promisesKept(i.session, i.sessions, i.vows); const mine = party.find(a => a.userId === i.viewerId);
  const ranked = rankByVotes(i.fragments.filter(f => f.sessionId === i.session.id), i.votes.filter(v => v.sessionId === i.session.id));
  return {
    sprintName: i.session.sprintName, date: i.session.createdAt,
    portrait: party.map(a => ({ userId: a.userId, name: name(a.userId), characterId: a.characterId ?? i.players.find(p => p.userId === a.userId)?.displayCharacterId ?? null, warden: a.userId === i.session.wardenId })),
    numbers: { thoughts: ranked.length, votes: i.votes.filter(v => v.sessionId === i.session.id).length, vows: i.vows.filter(v => v.sessionId === i.session.id).length, promisesKept: kept, myStarlight: mine ? voyageStarlight({ settings: i.settings, attendance: mine, promisesKept: kept }) : null },
    checkIn: i.checkIn,
    peer: i.peer.filter(p => party.some(a => a.userId === p.targetId) && (i.viewerSeesAll || p.targetId === i.viewerId)).map(p => ({ userId: p.targetId, name: name(p.targetId), raters: p.raters, pct: p.pct })),
    thoughts: CATEGORIES.map(c => ({ category: c.id, label: c.label, plain: c.plain, items: ranked.filter(r => r.fragment.category === c.id).map(r => ({ text: r.fragment.text, votes: r.votes })) })).filter(g => g.items.length),
    vows: i.vows.filter(v => v.sessionId === i.session.id).map(v => ({ text: v.text, owner: v.ownerId ? name(v.ownerId) : 'Shared by the team' })),
  };
}
```
Check that `CATEGORIES` imports cleanly into a logic file. It imports lucide icons, which is fine in Vitest. If that causes a cycle or size problem, copy just the ids and labels.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add interface/src/logic
git commit -m "Game: voyage report model (portrait, numbers, own Starlight, check-in, private peer results, thoughts, vows)"
```

---

### Task 14: Homecoming report, Party Portrait and Archives (features 4 and 6, UI)

**Files:**
- Create: `interface/src/components/PartyPortrait.tsx`
- Create: `interface/src/components/HomecomingReport.tsx`, `HomecomingReport.test.tsx`
- Create: `interface/src/components/useVoyageSummaries.ts`
- Create: `interface/src/components/report.css`
- Modify: `interface/src/screens.tsx` (`RetroScreen` rewards block; `ArchivesScreen`)

**Interfaces:**
- Consumes: `buildReport`, `portraitGroups`, `VoyageReport` (Task 13), `checkInSummary`/`peerSummary` (Tasks 6 and 9), `MAP.image`.
- Produces:
  - `PartyPortrait({ members: PortraitMember[] })`
  - `HomecomingReport({ report: VoyageReport; viewerSeesAll: boolean; actions?: ReactNode })`
  - `useVoyageSummaries(backend, sessionId, attendance, stage): { checkIn: CheckInSummary | null; peer: PeerResult[] }`

- [ ] **Step 1: Write the failing test** (`HomecomingReport.test.tsx`)

```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VoyageReport } from '../logic/report';
import HomecomingReport from './HomecomingReport';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const pct = { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 };
const report = (extra: Partial<VoyageReport> = {}): VoyageReport => ({
  sprintName: 'Sprint 3', date: Date.UTC(2026, 9, 5), portrait: Array.from({ length: 4 }, (_, i) => ({ userId: 'u' + i, name: 'P' + i, characterId: i ? 'wren' : null, warden: i === 0 })),
  numbers: { thoughts: 5, votes: 9, vows: 2, promisesKept: 1, myStarlight: 650 }, checkIn: { sat: 90, growth: 70, n: 3, of: 4 },
  peer: [{ userId: 'u1', name: 'P1', raters: 3, pct }], thoughts: [{ category: 'spark', label: 'Spark', plain: 'Try', items: [{ text: 'Try pairing', votes: 4 }] }],
  vows: [{ text: 'Ship it', owner: 'Shared by the team' }], ...extra });
async function render(r: VoyageReport, viewerSeesAll = false) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<HomecomingReport report={r} viewerSeesAll={viewerSeesAll} />));
  return el;
}
describe('HomecomingReport', () => {
  it('shows every section in the spec’s order', async () => {
    const el = await render(report());
    expect([...el.querySelectorAll('section[aria-label]')].map(s => s.getAttribute('aria-label'))).toEqual(['Voyage numbers', 'Team check-in', 'Your peer feedback', 'All thoughts', 'Vows to carry']);
    expect(el.querySelectorAll('.portrait-member')).toHaveLength(4);
    const numbers = el.querySelector('section[aria-label="Voyage numbers"]')!.textContent;
    expect(numbers).toContain('promise kept'); expect(numbers).toContain('650');
    expect(el.textContent).toContain('Satisfaction 90%'); expect(el.textContent).toContain('3 of 4 checked in');
    expect(el.textContent).toContain('Try pairing'); expect(el.textContent).toContain('Ship it');
    expect(el.textContent).not.toContain('Reward totals will be connected');
  });
  it('labels the peer section for the Warden and handles empty states', async () => {
    const el = await render(report({ peer: [], checkIn: { sat: null, growth: null, n: 0, of: 4 }, numbers: { thoughts: 0, votes: 0, vows: 0, promisesKept: 0, myStarlight: null } }), true);
    expect(el.querySelector('section[aria-label="Peer feedback"]')?.textContent).toContain('No peer feedback this voyage');
    expect(el.textContent).toContain('Nobody checked in'); expect(el.textContent).toContain('—');
  });
  it('lays out 8 companions in two rows', async () => {
    const el = await render(report({ portrait: Array.from({ length: 8 }, (_, i) => ({ userId: 'u' + i, name: 'P' + i, characterId: 'wren', warden: false })) }));
    expect([...el.querySelectorAll('.portrait-row')].map(r => r.children.length)).toEqual([4, 4]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**
Expected: FAIL.

- [ ] **Step 3: Implement**

`PartyPortrait.tsx`:
```tsx
import type { CSSProperties } from 'react';
import { characterById } from '../data/characters';
import { MAP } from '../data/sanctuaryMap';
import { portraitGroups, type PortraitMember } from '../logic/report';
import { Art } from './ui';
import './report.css';

/** Party Portrait (feature 6): every voyage companion together on the Sanctuary plaza, nicknames beneath. */
export default function PartyPortrait({ members }: { members: PortraitMember[] }) {
  return <figure className={`party-portrait${members.length > 10 ? ' crowded' : ''}`} style={{ '--plaza': `url(${MAP.image})` } as CSSProperties} aria-label="Party portrait">
    {portraitGroups(members).map((row, r) => <div className="portrait-row" key={r}>{row.map(m => <div className="portrait-member" key={m.userId}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative /><span>{m.name}{m.warden && <small>Warden</small>}</span></div>)}</div>)}
  </figure>;
}
```

`HomecomingReport.tsx`:
```tsx
import type { ReactNode } from 'react';
import { PEER_TRAITS } from '../data/feedback';
import type { VoyageReport } from '../logic/report';
import PartyPortrait from './PartyPortrait';
import './report.css';

/** Homecoming mission report (feature 4) — also the Archives view. Built from one VoyageReport, the same model the saved image draws. */
export default function HomecomingReport({ report: r, viewerSeesAll, actions }: { report: VoyageReport; viewerSeesAll: boolean; actions?: ReactNode }) {
  const n = r.numbers;
  return <article className="homecoming-report">
    <PartyPortrait members={r.portrait} />
    <header><h3>{r.sprintName}</h3><p>{new Date(r.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p></header>
    {actions && <div className="report-actions">{actions}</div>}
    <section aria-label="Voyage numbers" className="report-numbers">
      <div><strong>{n.thoughts}</strong><span>thoughts shared</span></div><div><strong>{n.votes}</strong><span>votes cast</span></div>
      <div><strong>{n.vows}</strong><span>Vows made</span></div><div><strong>{n.promisesKept}</strong><span>{n.promisesKept === 1 ? 'promise kept' : 'promises kept'}</span></div>
      <div className="report-starlight"><strong>{n.myStarlight === null ? '—' : n.myStarlight.toLocaleString()}</strong><span>Starlight you earned</span></div>
    </section>
    <section aria-label="Team check-in" className="report-checkin">{r.checkIn && r.checkIn.sat !== null && r.checkIn.growth !== null
      ? <><p><span>♥</span> Satisfaction {r.checkIn.sat}%</p><p><span>◆</span> Growth {r.checkIn.growth}%</p><small>{r.checkIn.n} of {r.checkIn.of} checked in</small></>
      : <p>Nobody checked in this voyage.</p>}</section>
    <section aria-label={viewerSeesAll ? 'Peer feedback' : 'Your peer feedback'} className="report-peer">{r.peer.length
      ? <table><thead><tr><th scope="col">{viewerSeesAll ? 'Ally' : 'You'}</th>{PEER_TRAITS.map(t => <th scope="col" key={t.key} title={t.measures}><span aria-hidden="true">{t.icon}</span> {t.title}</th>)}<th scope="col">Raters</th></tr></thead>
        <tbody>{r.peer.map(p => <tr key={p.userId}><th scope="row">{p.name}</th>{PEER_TRAITS.map(t => <td key={t.key}>{p.pct[t.key]}%</td>)}<td>{p.raters}</td></tr>)}</tbody></table>
      : <p>{viewerSeesAll ? 'No peer feedback this voyage.' : 'No allies rated you this voyage.'}</p>}</section>
    <section aria-label="All thoughts" className="report-thoughts">{r.thoughts.length ? r.thoughts.map(g => <div key={g.category}><h4><span className={`category-label ${g.category}`}>{g.label}</span> {g.plain}</h4>
      <ol>{g.items.map((t, k) => <li key={k}><p>{t.text}</p><span>{t.votes} {t.votes === 1 ? 'vote' : 'votes'}</span></li>)}</ol></div>) : <p>No thoughts were shared.</p>}</section>
    <section aria-label="Vows to carry" className="report-vows">{r.vows.length ? <ul>{r.vows.map((v, k) => <li key={k}><p>{v.text}</p><span>{v.owner}</span></li>)}</ul> : <p>No Vows were made.</p>}</section>
  </article>;
}
```

`useVoyageSummaries.ts`:
```ts
import { useEffect, useState } from 'react';
import type { Attendance, Backend, CheckInSummary, PeerResult, Stage } from '../backend/types';

/** Check-in averages and peer results for one voyage. Re-fetched when anyone's progress changes, and every 15 s during Homecoming (an edit doesn't change progress). */
export function useVoyageSummaries(backend: Backend, sessionId: string | null, attendance: Attendance[], stage: Stage | undefined) {
  const [checkIn, setCheckIn] = useState<CheckInSummary | null>(null); const [peer, setPeer] = useState<PeerResult[]>([]);
  const key = attendance.map(a => `${a.userId}:${a.checkinDone ? 1 : 0}:${a.peerGiven}`).sort().join('|');
  useEffect(() => {
    if (!sessionId) return; let live = true;
    const load = () => Promise.all([backend.checkInSummary(sessionId), backend.peerSummary(sessionId)]).then(([c, p]) => { if (live) { setCheckIn(c); setPeer(p); } }).catch(() => {});
    void load(); const t = stage === 'rewards' ? setInterval(load, 15000) : undefined;
    return () => { live = false; if (t) clearInterval(t); };
  }, [backend, sessionId, key, stage]);
  return { checkIn, peer };
}
```

`report.css`:
```css
/* Homecoming report, Party Portrait, recognition card. A mission report, not a dashboard: gold rules, Marcellus numerals, the plaza behind the party. */
.party-portrait{margin:0;display:grid;gap:4px;padding:18px 12px 10px;background:linear-gradient(180deg,#0a1a2c33,#0a1a2ccc),var(--plaza) center 58%/cover;border:1px solid #d8bf8266}
.portrait-row{display:flex;justify-content:center;align-items:flex-end;gap:clamp(4px,2vw,22px)}
.portrait-member{display:grid;justify-items:center;width:clamp(64px,14vw,128px)}
.portrait-member .character-art,.portrait-member .silhouette{height:clamp(96px,20vw,190px);width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 8px 12px #0a1a2c)}
.party-portrait.crowded .portrait-member{width:clamp(48px,10vw,92px)}
.party-portrait.crowded .portrait-member .character-art,.party-portrait.crowded .portrait-member .silhouette{height:clamp(70px,13vw,120px)}
.portrait-member span{display:grid;justify-items:center;font-family:'Marcellus',serif;font-size:14px;color:#fff4dc;text-shadow:0 1px 6px #0a1a2c;text-align:center}
.portrait-member small{font-family:'Manrope',sans-serif;font-size:11px;color:#d8bf82}
.homecoming-report{display:grid;gap:16px;color:#fff4dc;text-align:left}
.homecoming-report>header h3{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:26px}
.homecoming-report>header p{margin:2px 0 0;font-size:13px;color:#b9c6d2}
.report-actions{display:flex;flex-wrap:wrap;gap:8px}
.homecoming-report section{border-top:1px solid #d8bf8255;padding-top:10px}
.report-numbers{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
.report-numbers div{display:grid;gap:2px}
.report-numbers strong{font-family:'Marcellus',serif;font-weight:400;font-size:30px;color:#e9cf8f}
.report-numbers span{font-size:12.5px;color:#b9c6d2}
.report-checkin{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 22px}
.report-checkin p{margin:0;font-family:'Marcellus',serif;font-size:20px}
.report-checkin p span{color:#e9cf8f}
.report-checkin small{color:#b9c6d2}
.report-peer{overflow-x:auto}
.report-peer table{border-collapse:collapse;width:100%;font-size:13px}
.report-peer th,.report-peer td{padding:6px 8px;border-bottom:1px solid #d8bf8222;text-align:center;white-space:nowrap}
.report-peer th[scope="row"],.report-peer thead th:first-child{text-align:left;font-family:'Marcellus',serif;font-weight:400}
.report-peer td{color:#e9cf8f;font-variant-numeric:tabular-nums}
.report-thoughts h4{margin:8px 0 4px;font-size:14px;font-weight:600;color:#d9e2ea}
.report-thoughts ol,.report-vows ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.report-thoughts li,.report-vows li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed #d8bf8222}
.report-thoughts li p,.report-vows li p{margin:0;font-size:14px;line-height:1.45;color:#e4ebf1}
.report-thoughts li span,.report-vows li span{flex:0 0 auto;font-size:12px;color:#b9c6d2}
.homecoming-report section>p{margin:0;font-size:13.5px;color:#b9c6d2}
@media (max-width:560px){.report-numbers strong{font-size:24px}.report-checkin p{font-size:17px}}
```

`screens.tsx` `RetroScreen`:
- Add:
  ```tsx
  const summaries = useVoyageSummaries(backend, session?.id ?? null, attendance, session?.stage);
  ```
  It goes near the other hooks, **before** the early `return`s, so the hook order is stable.
- After `members`, add:
  ```tsx
  const seesAll = warden;
  const report = buildReport({ session, sessions, viewerId: me.id, viewerSeesAll: seesAll, attendance, players, profiles, fragments, votes, vows, settings, checkIn: summaries.checkIn, peer: summaries.peer });
  ```
  Add `players` to the `useUI()` destructure.
- Replace the whole `rewards-stage` div body with:
  ```tsx
  <div className="rewards-stage"><HomecomingReport report={report} viewerSeesAll={seesAll} actions={<>{player?.pulls.some(p => p.source === 'opening' && p.sessionId === session.id) ? <p className="small-copy">Free wish claimed — your new companion is in your collection.</p> : <Button onClick={() => pull('opening')} disabled={busy}><Sparkles size={16} />Claim your free wish</Button>}<Button secondary onClick={() => navigate('banner')}>Visit the character banner<ArrowRight size={16} /></Button></>} />{feedback}</div>
  ```
  This removes the old three-count summary and the "Reward totals will be connected…" line.
- Import `HomecomingReport`, `useVoyageSummaries` and `buildReport`.

`screens.tsx` `ArchivesScreen`:
```tsx
export function ArchivesScreen() {
  const { sessions, vows, me, backend, allAttendance, players, profiles, settings } = useUI(); const [selected, setSelected] = useState<string | null>(null);
  const ended = sessions.filter(s => s.status === 'ended'); const session = ended.find(s => s.id === selected);
  const [fragments] = useWatch<Fragment[]>(cb => selected ? backend.watchFragments(selected, cb) : (() => {}), [], [backend, selected]);
  const [votes] = useWatch<Vote[]>(cb => selected ? backend.watchVotes(selected, cb) : (() => {}), [], [backend, selected]);
  const attendance = allAttendance.filter(a => a.sessionId === selected);
  const summaries = useVoyageSummaries(backend, selected, attendance, session?.stage);
  const seesAll = me.isAdmin || session?.wardenId === me.id;
  …keep the existing heading and list markup; in the detail branch, after the date <p>, render:
  <HomecomingReport report={buildReport({ session, sessions, viewerId: me.id, viewerSeesAll: seesAll, attendance, players, profiles, fragments, votes, vows, settings, checkIn: summaries.checkIn, peer: summaries.peer })} viewerSeesAll={seesAll} />
  …then keep the existing "Vows from this voyage" SectionTitle + VowRow list (it shows outcomes).
}
```
- Import `useWatch` from `./hooks`, plus the types `Fragment` and `Vote`.
- Drop the now-unused `fragments` that `ArchivesScreen` took from `useUI`.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green. `App.test.tsx` may assert the old reward-summary text. If so, update that assertion to the new report text, because the spec removes the old block.

- [ ] **Step 5: Check it in the browser**

Play a voyage to Homecoming with 1, 4 and 8 local tabs (`?player=p1…p8`). For each:
- The portrait layout is correct: 1 row, 1 row, then 2 rows.
- Ana's report shows only Ana's peer row. Jay's shows everyone's.
- At 375px wide, nothing scrolls sideways (the peer table scrolls inside its own box).
- Finish the voyage. Archives shows the same report, and the vow outcomes below it.
- Take screenshots at desktop and phone width.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: Homecoming mission report with Party Portrait; Archives shows the full report"
```

---

## Phase B: may slip past launch (Tasks 15–16)

### Task 15: Save voyage record as an image (feature 5)

**Files:**
- Create: `interface/src/logic/reportImage.ts`, `reportImage.test.ts`
- Modify: `interface/src/screens.tsx` (button in the Homecoming `actions` and in Archives)
- Test: `interface/src/components/HomecomingReport.test.tsx` (cross-check)

**Interfaces:**
- Consumes: `VoyageReport`, `portraitGroups` (Task 13), `PEER_TRAITS`, `MAP.image`, `characterById(...).art.cutout`.
- Produces:
  - `reportFileName(sprintName: string, date: number): string` → `Lumara-<sprint>-<YYYY-MM-DD>.png`
  - `reportLines(r: VoyageReport, viewerSeesAll: boolean): ReportLine[]`
  - `renderReportImage(r, viewerSeesAll): Promise<HTMLCanvasElement>`
  - `saveCanvas(canvas, fileName): Promise<void>`
  - `slug(text: string): string`

- [ ] **Step 1: Write the failing tests** (`reportImage.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import type { VoyageReport } from './report';
import { reportFileName, reportLines } from './reportImage';

const pct = { collab: 80, owner: 60, comm: 100, impact: 80, growth: 40 };
const r: VoyageReport = { sprintName: 'Sprint 3 · Official', date: new Date(2026, 9, 5).getTime(), portrait: [],
  numbers: { thoughts: 5, votes: 9, vows: 2, promisesKept: 1, myStarlight: 650 }, checkIn: { sat: 90, growth: 70, n: 3, of: 4 },
  peer: [{ userId: 'u1', name: 'Ana', raters: 3, pct }], thoughts: [{ category: 'spark', label: 'Spark', plain: 'Try', items: [{ text: 'Try pairing', votes: 4 }] }],
  vows: [{ text: 'Ship it', owner: 'Bo' }] };
describe('report image', () => {
  it('names the file Lumara-<sprint>-<date>.png', () => {
    expect(reportFileName('Sprint 3 · Official', r.date)).toBe('Lumara-Sprint-3-Official-2026-10-05.png');
    expect(reportFileName('···', r.date)).toBe('Lumara-voyage-2026-10-05.png');
  });
  it('draws the same sections the screen shows, in order', () => {
    const text = reportLines(r, false).map(l => l.text);
    expect(text[0]).toBe('Sprint 3 · Official');
    const order = ['Voyage numbers', 'Team check-in', 'Your peer feedback', 'All thoughts', 'Vows to carry'].map(h => text.indexOf(h));
    expect(order.every((x, i) => x > 0 && (i === 0 || x > order[i - 1]))).toBe(true);
    expect(text).toContain('Ana · Party Spirit 80% · Dependable 60% · Clear Comms 100% · Impact 80% · Levels Up 40% · 3 raters');
    expect(text).toContain('Try pairing (4 votes)');
    expect(text).toContain('Ship it — Bo');
  });
  it('titles the peer section for the Warden', () => {
    expect(reportLines(r, true).map(l => l.text)).toContain('Peer feedback');
  });
});
```

Append to `HomecomingReport.test.tsx`. This proves "image = screen" for peer rows:
```tsx
import { reportLines } from '../logic/reportImage';
  it('every peer row in the image is on the screen', async () => {
    const el = await render(report());
    for (const p of report().peer) expect(el.textContent).toContain(p.name);
    expect(reportLines(report(), false).filter(l => l.text.includes('Party Spirit')).length).toBe(report().peer.length);
  });
```

- [ ] **Step 2: Run them and watch them fail.**
Expected: FAIL.

- [ ] **Step 3: Implement** (`logic/reportImage.ts`)

```ts
import { characterById } from '../data/characters';
import { PEER_TRAITS } from '../data/feedback';
import { MAP } from '../data/sanctuaryMap';
import { portraitGroups, type VoyageReport } from './report';

export type ReportLine = { kind: 'title' | 'heading' | 'text' | 'muted'; text: string };
export const slug = (s: string) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const ymd = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const reportFileName = (sprintName: string, date: number) => `Lumara-${slug(sprintName) || 'voyage'}-${ymd(date)}.png`;

/** The report as lines of text, in the screen's section order (the canvas draws exactly these). */
export function reportLines(r: VoyageReport, viewerSeesAll: boolean): ReportLine[] {
  const n = r.numbers; const L: ReportLine[] = [{ kind: 'title', text: r.sprintName }, { kind: 'muted', text: new Date(r.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) }];
  L.push({ kind: 'heading', text: 'Voyage numbers' }, { kind: 'text', text: `${n.thoughts} thoughts shared · ${n.votes} votes cast · ${n.vows} Vows made · ${n.promisesKept} ${n.promisesKept === 1 ? 'promise' : 'promises'} kept` },
    { kind: 'text', text: `Starlight you earned: ${n.myStarlight === null ? '—' : n.myStarlight.toLocaleString()}` });
  L.push({ kind: 'heading', text: 'Team check-in' }, r.checkIn && r.checkIn.sat !== null ? { kind: 'text', text: `♥ Satisfaction ${r.checkIn.sat}% · ◆ Growth ${r.checkIn.growth}% · ${r.checkIn.n} of ${r.checkIn.of} checked in` } : { kind: 'muted', text: 'Nobody checked in this voyage.' });
  L.push({ kind: 'heading', text: viewerSeesAll ? 'Peer feedback' : 'Your peer feedback' });
  if (r.peer.length) for (const p of r.peer) L.push({ kind: 'text', text: `${p.name} · ${PEER_TRAITS.map(t => `${t.title} ${p.pct[t.key]}%`).join(' · ')} · ${p.raters} ${p.raters === 1 ? 'rater' : 'raters'}` });
  else L.push({ kind: 'muted', text: viewerSeesAll ? 'No peer feedback this voyage.' : 'No allies rated you this voyage.' });
  L.push({ kind: 'heading', text: 'All thoughts' });
  for (const g of r.thoughts) { L.push({ kind: 'muted', text: `${g.label} · ${g.plain}` }); for (const t of g.items) L.push({ kind: 'text', text: `${t.text} (${t.votes} ${t.votes === 1 ? 'vote' : 'votes'})` }); }
  if (!r.thoughts.length) L.push({ kind: 'muted', text: 'No thoughts were shared.' });
  L.push({ kind: 'heading', text: 'Vows to carry' }, ...(r.vows.length ? r.vows.map(v => ({ kind: 'text' as const, text: `${v.text} — ${v.owner}` })) : [{ kind: 'muted' as const, text: 'No Vows were made.' }]));
  return L;
}

const W = 1080, PAD = 64, BAND = 440;
const FONT = { title: "400 46px Marcellus, serif", heading: "400 30px Marcellus, serif", text: "400 24px Manrope, sans-serif", muted: "400 21px Manrope, sans-serif" };
const COLOR = { title: '#fff4dc', heading: '#e9cf8f', text: '#e4ebf1', muted: '#b9c6d2' };
const GAP = { title: 60, heading: 56, text: 34, muted: 30 };
const loadImage = (src: string) => new Promise<HTMLImageElement | null>(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function wrap(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? `${line} ${word}` : word; if (g.measureText(next).width > max && line) { out.push(line); line = word; } else line = next; }
  return [...out, line];
}
/** Draws the report (portrait band on the plaza, then the text) onto a canvas. */
export async function renderReportImage(r: VoyageReport, viewerSeesAll: boolean): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const c = document.createElement('canvas'); let g = c.getContext('2d')!;
  const rows = reportLines(r, viewerSeesAll).flatMap(l => { g.font = FONT[l.kind]; return wrap(g, l.text, W - PAD * 2).map((text, k) => ({ ...l, text, first: k === 0 })); });
  c.width = W; c.height = PAD + BAND + 28 + rows.reduce((h, l) => h + (l.first ? GAP[l.kind] : 30), 0) + PAD; g = c.getContext('2d')!;
  g.fillStyle = '#0a1a2c'; g.fillRect(0, 0, c.width, c.height);
  const plaza = await loadImage(MAP.image);
  if (plaza) { const s = Math.max(W / plaza.width, BAND / plaza.height); g.globalAlpha = .8; g.drawImage(plaza, (W - plaza.width * s) / 2, PAD - (plaza.height * s - BAND) * .58, plaza.width * s, plaza.height * s); g.globalAlpha = 1; }
  g.fillStyle = '#0a1a2c'; g.fillRect(0, 0, W, PAD); g.fillRect(0, PAD + BAND, W, c.height);   // crop the plaza to its band
  const groups = portraitGroups(r.portrait); const rowH = BAND / Math.max(1, groups.length);
  g.textAlign = 'center'; g.font = "400 22px Marcellus, serif";
  for (const [ri, row] of groups.entries()) for (const [i, m] of row.entries()) {
    const slot = W / row.length, cx = slot * i + slot / 2, bottom = PAD + (ri + 1) * rowH - 26;
    const src = characterById(m.characterId)?.art.cutout; const img = src ? await loadImage(src) : null;
    if (img) { const h = rowH - 34, w = h * img.width / img.height; g.drawImage(img, cx - w / 2, bottom - h, w, h); }
    g.fillStyle = '#fff4dc'; g.fillText(m.name, cx, bottom + 22, slot - 8);
  }
  g.textAlign = 'left'; let y = PAD + BAND + 28;
  for (const l of rows) { y += l.first ? GAP[l.kind] : 30; g.font = FONT[l.kind]; g.fillStyle = COLOR[l.kind]; g.fillText(l.text, PAD, y); }
  return c;
}
/** A normal browser download (GitHub Pages; no artifact download feature needed). */
export async function saveCanvas(c: HTMLCanvasElement, fileName: string) {
  const blob = await new Promise<Blob | null>(res => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Your browser couldn’t draw the image. Try again or use a screenshot.');
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

`screens.tsx`:
- In the Homecoming `actions`, add:
  ```tsx
  <Button secondary disabled={busy} onClick={() => run(async () => saveCanvas(await renderReportImage(report, seesAll), reportFileName(report.sprintName, report.date)), 'Voyage record saved.')}><Download size={16} />Save voyage record</Button>
  ```
- In `ArchivesScreen`, build the report once as `const report = session ? buildReport({ … }) : null`, alongside the other hooks and with no early return before them. Pass `report` to `HomecomingReport` and pass the same button as `actions`. Take `run` and `busy` from `useUI`.
- Import `Download` from lucide, and `renderReportImage`, `reportFileName` and `saveCanvas`.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. As Ana, at Homecoming, click "Save voyage record" and open the PNG.
2. It shows the portrait, the numbers and only Ana's peer row.
3. As Jay, it shows everyone's peer rows.
4. Repeat from Archives.
5. Check the canvas isn't tainted: no console error from `toBlob`.
6. Attach both PNGs to the hand-off.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: Save voyage record as a PNG (same report model as the screen; players get only their own peer result)"
```

---

### Task 16: Personal recognition card (feature 7)

**Files:**
- Create: `interface/src/data/recognitionLines.ts`, `recognitionLines.test.ts`
- Create: `interface/src/components/RecognitionCard.tsx`, `RecognitionCard.test.tsx`
- Modify: `interface/src/logic/reportImage.ts` (add `renderCardImage`, `cardFileName`)
- Modify: `interface/src/components/report.css`
- Modify: `interface/src/screens.tsx` (Homecoming: "Your recognition" button)

**Interfaces:**
- Consumes:
  - `voiceSrc(characterId, lineId)` from `logic/chatter.ts`
  - `VOICE_LINES`
  - `readSerenMuted()` from `logic/voice.ts`
  - `saveCanvas`, `slug` (Task 15)
  - the viewer's portrait member and `report.numbers.myStarlight` (Task 13)
- Produces:
  - `RECOGNITION: Record<string, { text: string; clip: string }>`
  - `RecognitionCard({ characterId, nickname, sprintName, starlight, date, onClose })`
  - `cardFileName(sprintName, date, nickname)`
  - `renderCardImage(card): Promise<HTMLCanvasElement>`

**Content for Jay to approve.** These lines are drafted in each companion's voice and never mention counts. Each clip is an existing voiced line, checked to exist under `public/art/<id>/voice/`. The card shows the drafted line as its quote; while the clip plays, its own words show as a small caption.

| Companion | Recognition line (draft) | Voice clip |
|---|---|---|
| mahesvara | "You held your ground this sprint. …I noticed. Don't make me regret saying so." | `retro_end` |
| keira | "You were a total spark this sprint~! The whole system glowed brighter with you in it!" | `retro_end` |
| ayaka | "You worked hard enough for the both of us. …So I'll allow you a nap. Well earned." | `retro_end` |
| azrenth | "Even a demon king knows strength when he sees it. This sprint, yours burned bright." | `retro_end` |
| lucien | "Under this moon, your effort did not go unseen. You may be proud tonight." | `retro_end` |
| seren | "Every voyage you join, Lumara shines a little brighter. Thank you for coming home with us." | `stage_rewards` |
| ashvane | "Steady hands, honest work. That's the kind of comrade I'd stand beside." | `retro_end` |
| suvara | "You carried a piece of tomorrow on your shoulders this sprint. The horizon thanks you." | `retro_end` |
| sollene | "Your quiet care steadied us all. The moon saw every bit of it." | `retro_end` |
| wren | "You kept the whole party moving! Let's chase the next wind together!" | `retro_end` |
| rook | "Not bad, partner. You pulled your weight and then some." | `retro_end` |
| calla | "Skill and patience, in just the right measure. A remedy this team needed." | `retro_end` |
| kairo | "Your resolve ran deep this sprint. The current carried us further because of you." | `retro_end` |
| dax | "You kept the fire burning all sprint long! That's what I call fired up!" | `retro_end` |

- [ ] **Step 1: Write the failing tests**

`recognitionLines.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from './characters';
import { RECOGNITION } from './recognitionLines';
import { VOICE_LINES } from './voiceLines';

describe('recognition lines', () => {
  it('every pullable character has a line and an existing voiced clip', () => {
    for (const c of CHARACTERS) {
      expect(RECOGNITION[c.id]?.text, c.id).toBeTruthy();
      expect(VOICE_LINES[c.id]?.some(l => l.id === RECOGNITION[c.id].clip), `${c.id} clip`).toBe(true);
    }
  });
});
```

`RecognitionCard.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RecognitionCard from './RecognitionCard';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); localStorage.clear(); });
async function render(characterId: string | null) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const played: string[] = [];
  vi.stubGlobal('Audio', class { volume = 1; src: string; constructor(src: string) { this.src = src; played.push(src); } play() { return Promise.resolve(); } pause() {} });
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<RecognitionCard characterId={characterId} nickname="Ana" sprintName="Sprint 3" starlight={650} date={1} onClose={vi.fn()} />));
  return { el, played };
}
describe('RecognitionCard', () => {
  it('shows the companion, nickname, sprint, line and Starlight, and plays the voiced line', async () => {
    const { el, played } = await render('wren');
    expect(el.textContent).toContain('Ana'); expect(el.textContent).toContain('Sprint 3'); expect(el.textContent).toContain('650');
    expect(el.textContent).toContain('chase the next wind');
    expect(played[0]).toContain('art/wren/voice/retro_end.mp3');
  });
  it('never shows thought or vote counts', async () => {
    const { el } = await render('wren');
    expect(el.textContent).not.toMatch(/thought|vote/i);
  });
  it('falls back to Seren when no companion is set', async () => {
    const { el } = await render(null);
    expect(el.textContent).toContain('Lumara shines a little brighter');
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
Expected: FAIL.

- [ ] **Step 3: Implement**

`data/recognitionLines.ts`: write the table above as
```ts
/** Feature 7: each companion's recognition line on a player's Homecoming card (drafted by Claude, approved by Jay), and the existing voiced clip played with it. */
export const RECOGNITION: Record<string, { text: string; clip: string }> = {
  mahesvara: { text: 'You held your ground this sprint. …I noticed. Don’t make me regret saying so.', clip: 'retro_end' },
  keira: { text: 'You were a total spark this sprint~! The whole system glowed brighter with you in it!', clip: 'retro_end' },
  ayaka: { text: 'You worked hard enough for the both of us. …So I’ll allow you a nap. Well earned.', clip: 'retro_end' },
  azrenth: { text: 'Even a demon king knows strength when he sees it. This sprint, yours burned bright.', clip: 'retro_end' },
  lucien: { text: 'Under this moon, your effort did not go unseen. You may be proud tonight.', clip: 'retro_end' },
  seren: { text: 'Every voyage you join, Lumara shines a little brighter. Thank you for coming home with us.', clip: 'stage_rewards' },
  ashvane: { text: 'Steady hands, honest work. That’s the kind of comrade I’d stand beside.', clip: 'retro_end' },
  suvara: { text: 'You carried a piece of tomorrow on your shoulders this sprint. The horizon thanks you.', clip: 'retro_end' },
  sollene: { text: 'Your quiet care steadied us all. The moon saw every bit of it.', clip: 'retro_end' },
  wren: { text: 'You kept the whole party moving! Let’s chase the next wind together!', clip: 'retro_end' },
  rook: { text: 'Not bad, partner. You pulled your weight and then some.', clip: 'retro_end' },
  calla: { text: 'Skill and patience, in just the right measure. A remedy this team needed.', clip: 'retro_end' },
  kairo: { text: 'Your resolve ran deep this sprint. The current carried us further because of you.', clip: 'retro_end' },
  dax: { text: 'You kept the fire burning all sprint long! That’s what I call fired up!', clip: 'retro_end' },
};
```

`logic/reportImage.ts` (append):
```ts
export const cardFileName = (sprintName: string, date: number, nickname: string) => reportFileName(sprintName, date).replace(/\.png$/, `-${slug(nickname) || 'card'}.png`);
/** Recognition card as a 1080×1350 image: splash art, then nickname, sprint, the companion's line and Starlight. */
export async function renderCardImage(card: { characterId: string; nickname: string; sprintName: string; line: string; starlight: number | null }): Promise<HTMLCanvasElement> {
  await document.fonts?.ready;
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, c.height); grad.addColorStop(0, '#1d3a5c'); grad.addColorStop(1, '#0a1a2c'); g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
  const ch = characterById(card.characterId); const art = ch?.art.splash ? await loadImage(ch.art.splash) : null;
  if (art) { const s = Math.max(1080 / art.width, 820 / art.height); g.drawImage(art, (1080 - art.width * s) / 2, 0, art.width * s, art.height * s); }
  const fade = g.createLinearGradient(0, 560, 0, 860); fade.addColorStop(0, '#0a1a2c00'); fade.addColorStop(1, '#0a1a2c'); g.fillStyle = fade; g.fillRect(0, 560, 1080, 300); g.fillStyle = '#0a1a2c'; g.fillRect(0, 860, 1080, 490);
  g.strokeStyle = '#d8bf82'; g.lineWidth = 2; g.strokeRect(28, 28, 1024, 1294);
  g.textAlign = 'center'; g.fillStyle = '#fff4dc'; g.font = "400 64px Marcellus, serif"; g.fillText(card.nickname, 540, 900, 960);
  g.fillStyle = '#d8bf82'; g.font = "400 26px Manrope, sans-serif"; g.fillText(`${card.sprintName} · with ${ch?.name ?? 'Seren'}`, 540, 948, 960);
  g.fillStyle = '#e4ebf1'; g.font = "italic 400 34px Marcellus, serif"; let y = 1030; for (const l of wrap(g, `“${card.line}”`, 900)) { g.fillText(l, 540, y); y += 46; }
  g.fillStyle = '#e9cf8f'; g.font = "400 40px Marcellus, serif"; g.fillText(card.starlight === null ? '' : `✦ ${card.starlight.toLocaleString()} Starlight earned`, 540, 1270);
  return c;
}
```

`RecognitionCard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { characterById } from '../data/characters';
import { RECOGNITION } from '../data/recognitionLines';
import { VOICE_LINES } from '../data/voiceLines';
import { voiceSrc } from '../logic/chatter';
import { cardFileName, renderCardImage, saveCanvas } from '../logic/reportImage';
import { readSerenMuted } from '../logic/voice';
import { Art } from './ui';
import './report.css';

/** Personal recognition card (feature 7). Never shows how many thoughts or votes this player gave. */
export default function RecognitionCard({ characterId, nickname, sprintName, starlight, date, onClose }: { characterId: string | null; nickname: string; sprintName: string; starlight: number | null; date: number; onClose: () => void }) {
  const id = characterId && RECOGNITION[characterId] ? characterId : 'seren'; const line = RECOGNITION[id]; const character = characterById(id);
  const voiced = VOICE_LINES[id]?.find(l => l.id === line.clip)?.text; const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (readSerenMuted()) return;
    try { const a = new Audio(voiceSrc(id, line.clip)); a.volume = 0.85; void a.play()?.catch(() => {}); return () => a.pause(); } catch { return undefined; }
  }, [id, line.clip]);
  const save = async () => { setSaving(true); setError(''); try { await saveCanvas(await renderCardImage({ characterId: id, nickname, sprintName, line: line.text, starlight }), cardFileName(sprintName, date, nickname)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the card.'); } finally { setSaving(false); } };
  return <div className="recognition-card" role="dialog" aria-modal="true" aria-label="Your recognition card">
    <button className="recognition-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
    <div className="recognition-art"><Art character={character} kind="splash" decorative /></div>
    <div className="recognition-body">
      <h3>{nickname}</h3><p className="recognition-sprint">{sprintName} · with {character?.name}</p>
      <blockquote>“{line.text}”</blockquote>
      {voiced && <p className="recognition-voice" aria-label="Voiced line">♪ {voiced}</p>}
      {starlight !== null && <p className="recognition-starlight">✦ {starlight.toLocaleString()} Starlight earned</p>}
      <button className="feedback-save" disabled={saving} onClick={() => void save()}><Download size={15} /> Save card</button>{error && <p role="alert">{error}</p>}
    </div>
  </div>;
}
```
Check that the `readSerenMuted` export is still in `logic/voice.ts` (seen at line 4 on 2026-10-09) and that `voiceSrc` is still in `logic/chatter.ts` (line 7).

Append to `report.css`:
```css
.recognition-card{position:fixed;inset:0;z-index:60;margin:auto;width:min(440px,calc(100vw - 32px));height:min(760px,calc(100vh - 40px));display:grid;grid-template-rows:minmax(0,1fr) auto;border:1px solid #d8bf82;background:linear-gradient(180deg,#1d3a5c,#0a1a2c);color:#fff4dc;box-shadow:0 30px 80px #000a;overflow:hidden;animation:card-in .45s var(--ease,ease-out)}
.recognition-art{min-height:0;overflow:hidden;mask-image:linear-gradient(180deg,#000 70%,transparent)}
.recognition-art .character-art{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.recognition-body{display:grid;justify-items:center;gap:6px;padding:0 22px 22px;text-align:center}
.recognition-body h3{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:34px}
.recognition-sprint{margin:0;font-size:13px;color:#d8bf82}
.recognition-body blockquote{margin:6px 0 0;font-family:'Marcellus',serif;font-style:italic;font-size:18px;line-height:1.45;color:#e4ebf1}
.recognition-voice{margin:0;font-size:12px;color:#b9c6d2}
.recognition-starlight{margin:4px 0;font-family:'Marcellus',serif;font-size:20px;color:#e9cf8f}
.recognition-close{position:absolute;top:10px;right:10px;z-index:1;width:34px;height:34px;display:grid;place-items:center;border:1px solid #d8bf8266;border-radius:50%;background:#0a1a2ccc;color:#fff4dc;cursor:pointer}
@keyframes card-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.recognition-card{animation:none}}
```

`screens.tsx` `RetroScreen`:
- Add `const [cardOpen, setCardOpen] = useState(false);` at the top of `RetroScreen`, **before** `if (!session) return`.
- In the Homecoming `actions`, when `report.numbers.myStarlight !== null` (the viewer is in the party), add:
  ```tsx
  <Button onClick={() => setCardOpen(true)}><Sparkles size={16} />Your recognition</Button>
  ```
- After the window, add:
  ```tsx
  {cardOpen && <RecognitionCard characterId={report.portrait.find(m => m.userId === me.id)?.characterId ?? null} nickname={me.name} sprintName={session.sprintName} starlight={report.numbers.myStarlight} date={session.createdAt} onClose={() => setCardOpen(false)} />}
  ```
- Reset `cardOpen` on stage change, in the existing stage `useEffect`.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser**

1. Open the card for a player with an S++ companion and for one with an A companion.
2. The voice plays, and stays silent when Seren is muted.
3. "Save card" downloads `Lumara-<sprint>-<date>-<nickname>.png`.
4. At 375px, the card fits on screen.
5. Take screenshots.

- [ ] **Step 6: Commit**

```bash
git add interface/src
git commit -m "Game: personal recognition card at Homecoming (companion line + voice, Starlight, save as image)"
```

---

### Task 17: Live pass before the dry run

**Files:** none. This task is verification and the hand-off.

- [ ] **Step 1: Full suite and build.** `cd interface && npx tsc --noEmit -p . && npx vitest run && npm run build`. Expected: all green, and `check-build` passes.
- [ ] **Step 2: Re-run all three SQL tests** (`0005`, `0006`, `0007`) against the live project. Expected: no `FAIL:`.
- [ ] **Step 3: Online two-browser pass.** First get Jay's OK to push `main`, since a push deploys. Then, on `https://sternenzelts.github.io/lumara/play/`, with one normal window and one private window:
  - lock and unlock;
  - remove and rejoin;
  - check-in;
  - peer rating;
  - speaker spin seen on both screens;
  - Homecoming report: the player sees only their own peer row;
  - Archives after Finish;
  - PNG download.
  - Use `?player=` local tabs only if the deploy is still waiting on Jay.
- [ ] **Step 4: Hand-off note to Jay.** Include:
  - screenshots;
  - the defaults F–I;
  - the recognition-line table for approval;
  - two notes:
    - the Hall's reveal order is still the unsorted stub (`revealOrder`);
    - the old "temporary previews" note under the Hall is still there;
    - polish item: the speaker is written to the session before the reel cue goes out. "Now speaking", the spotlight and "Your turn" therefore show the pick about 2 s before the reel lands. If that bothers him, a fix is to hide those three while a reel is playing.

---

## Self-review (done while writing)

**Spec coverage:**

| Feature | Covered by |
|---|---|
| 1 | Tasks 2–3 (join/companion lock), Tasks 5–7 (lobby check-in, start gate); the Warden's party progress (answers from Homecoming) in Task 10 |
| 2 | Tasks 8–10 (finish warning in Task 10) |
| 3 | Tasks 11–12 (a new cue topic, spotlight, walk, "Your turn", tracker, Warden controls) |
| 4 | Tasks 13–14 (Archives sections 2–6 + portrait) |
| 5 | Task 15 |
| 6 | Tasks 13–14 (1/4/8-player layouts checked in Task 14, Step 5) |
| 7 | Task 16 (content table for Jay) |
| 8 | Tasks 2–4 (invite codes left out per open point E) |
| 9 | Task 1 |

- The spec's build-order step 1 ("fit tables into the online-play schema once") is replaced by three additive migrations. The schema is already live, so this deviation is deliberate.
- **Type names used across tasks:**
  - `SpeakerState`, `CheckIn`, `CheckInSummary`, `PeerTrait`, `PeerScores`, `PeerResult`, `PortraitMember`, `VoyageReport`.
  - Backend methods: `removePlayer`, `saveMyCheckIn`, `myCheckIn`, `checkInSummary`, `watchCheckIns`, `ratePeer`, `myPeerRatings`, `peerSummary`.
  - RPCs: `remove_player`, `save_checkin`, `checkin_summary`, `rate_peer`, `my_peer_ratings`, `peer_summary`.
  - They are used with the same spelling in every task.
- **Review Focus:** each of the five lines has a named test in its owning task.

---

## Appendix: lobby check-in revision (approved 2026-10-09)

Self Check-In moved to the lobby (Gather). Each section below replaces the named parts of its task. **Where a task and its section disagree, the section wins.**

### Rev C. Task 2: Server rules for lock, remove, joining after start and speaker (migration 0005)

**Files:** unchanged.

**Interfaces → Produces** adds:
- `join_session` refuses newcomers while the party is locked **or** once the voyage has left `register`. Existing members always get through.
- `set_my_character` works only in `register`.

**Step 1: SQL test** (replaces `supabase/tests/0005_party_test.sql`)

Stages are moved with a direct `update`, because from 0006 on `set_session` also needs everyone checked in.

```sql
-- 0005: lock, joining after start, companion lock, Warden removal, speaker field. Run with execute_sql; everything rolls back.
-- Stages are moved with a direct update: from 0006 on, set_session also needs everyone checked in.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000d','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint L')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- the Warden locks the party: a newcomer is refused; a member re-entering is not
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), '{"partyLocked":true}');
  do $$ begin if not (select party_locked from sessions where id = (select id from t_sess)) then raise exception 'FAIL: lock not saved'; end if; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: joined a locked party'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- only the Warden removes, and never themselves
  do $$ begin begin perform remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000a'); raise exception 'FAIL: non-Warden removed a player'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  do $$ begin begin perform remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000a'); raise exception 'FAIL: Warden removed themselves'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000b');
  do $$ begin if exists (select 1 from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') then raise exception 'FAIL: removed player still attends'; end if; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: removed player rejoined a locked party'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"partyLocked":false}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  -- the voyage starts: newcomers refused, companions locked, members reconnect, removed players stay out
  reset role; update sessions set stage = 'fragment_drop' where id = (select id from t_sess);
  update players set owned = '{"wren":1}' where user_id = '00000000-0000-0000-0000-00000000000c';
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: newcomer joined after the start'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select join_session((select id from t_sess));   -- reconnect
  do $$ begin begin perform set_my_character((select id from t_sess), 'wren'); raise exception 'FAIL: companion changed after the start'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000c');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform join_session((select id from t_sess)); raise exception 'FAIL: removed player rejoined mid-voyage'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- Return to lobby reopens joining and companions
  reset role; update sessions set stage = 'register' where id = (select id from t_sess);
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess)); select set_my_character((select id from t_sess), 'wren');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000d'); select join_session((select id from t_sess));
  -- speaker round-trips, survives unrelated patches, and clears with null
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), '{"speaker":{"currentId":"00000000-0000-0000-0000-00000000000b","spoken":[],"skipped":[]}}');
  do $$ begin if (select speaker->>'currentId' from sessions where id = (select id from t_sess)) is distinct from '00000000-0000-0000-0000-00000000000b' then raise exception 'FAIL: speaker not saved'; end if; end $$;
  select set_session((select id from t_sess), '{"timerEndsAt":1}');
  do $$ begin if (select speaker from sessions where id = (select id from t_sess)) is null then raise exception 'FAIL: unrelated patch cleared speaker'; end if; end $$;
  select set_session((select id from t_sess), '{"speaker":null}');
  do $$ begin if (select speaker from sessions where id = (select id from t_sess)) is not null then raise exception 'FAIL: speaker not cleared'; end if; end $$;
rollback;
```

**Step 3: migration**

Same as before (`set_session` with partyLocked/speaker, and `remove_player`). Replace the `join_session` block and add `set_my_character`:

```sql
-- Members already in the party may always re-enter (the voyage gate calls this on every click).
-- Newcomers meet the lock, and joining closes once the voyage leaves the lobby.
create or replace function join_session(p_session uuid) returns void language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from sessions where id = p_session and status <> 'ended') then raise exception 'No active retro with that code. Check the code with your Warden.'; end if;
  if exists (select 1 from attendance where session_id = p_session and user_id = auth.uid()) then return; end if;
  if (select party_locked from sessions where id = p_session) then raise exception 'The party is locked. Ask your Warden to unlock it.'; end if;
  if (select stage from sessions where id = p_session) <> 'register' then raise exception 'This voyage has already started. Join the next one.'; end if;
  perform ensure_player(); insert into attendance(session_id, user_id) values (p_session, auth.uid()) on conflict do nothing; end $$;

-- Companions are chosen in the lobby and lock when the voyage starts.
create or replace function set_my_character(p_session uuid, p_character text) returns void language plpgsql security definer set search_path = public as $$
begin if not exists (select 1 from sessions where id = p_session and status <> 'ended' and stage = 'register') then raise exception 'Companions are locked once the voyage starts.'; end if;
  if not exists (select 1 from attendance where session_id = p_session and user_id = auth.uid()) then raise exception 'Join the retro first.'; end if;
  if coalesce((select (owned->>p_character)::int from players where user_id = auth.uid()),0) < 1 then raise exception 'Choose a character from your collection.'; end if;
  update attendance set character_id = p_character where session_id = p_session and user_id = auth.uid(); end $$;
```

**Step 4: Jay's question** becomes:
> OK to apply `0005_party`? It adds two session columns and a remove function, closes joining once a voyage starts, and locks companions after the start. Today's game keeps working, but late joiners will be refused mid-voyage.

The commit message becomes: `DB: party lock, joining closes at the start (reconnects still work), companions lock at the start, Warden can remove a player, speaker field`.

---

### Rev D. Task 3: Lock, remove, joining after start and speaker in both backends

**Interfaces → Produces** adds:
- local `join` refuses newcomers outside `register`;
- local `setMyCharacter` refuses outside `register`.

**Step 1: tests.** Add this helper at the top of `local.test.ts`, after the imports. Import `Stage` from `./types`.

```ts
/** Test shortcut: move a voyage's stage directly in the demo store (skips the Warden and check-in rules). */
const setStage = (sid: string, stage: Stage) => {
  const s = JSON.parse(localStorage.getItem('lumara.demo.v1')!); s.sessions.find((x: Session) => x.id === sid).stage = stage;
  localStorage.setItem('lumara.demo.v1', JSON.stringify(s));
};
```
The three earlier tests stay: lock and re-enter, Warden-only remove, old sessions read as unlocked. Add:
```ts
  it('once the voyage starts: newcomers refused, members reconnect, companions lock, removed players stay out; the lobby reopens', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Started'); await ana.join(s.id);
    await ana.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await ana.setMyCharacter(s.id, 'wren');
    setStage(s.id, 'fragment_drop');
    await expect(bob.join(s.id)).rejects.toThrow('already started');
    await ana.join(s.id);   // reconnect through the voyage gate
    await expect(ana.setMyCharacter(s.id, 'wren')).rejects.toThrow('locked');
    await jay.removePlayer(s.id, 'ana');
    await expect(ana.join(s.id)).rejects.toThrow('already started');
    setStage(s.id, 'register');   // Return to lobby
    await ana.join(s.id); await bob.join(s.id); await ana.setMyCharacter(s.id, 'wren');
  });
```

**Step 3: `local.ts`.** `join` becomes:
```ts
    async join(sid) {
      await mutate(s => {
        const session = s.sessions.find(x => x.id === sid && x.status !== 'ended');
        if (!session) throw new Error('No active retro with that code. Check the code with your Warden.');
        if (!s.attendance.some(x => x.sessionId === sid && x.userId === id)) {   // members may always reconnect
          if (session.partyLocked) throw new Error('The party is locked. Ask your Warden to unlock it.');
          if (session.stage !== 'register') throw new Error('This voyage has already started. Join the next one.');
          s.attendance.push({ userId: id, sessionId: sid, joinedAt: Date.now(), votesCast: 0, characterId: null });
        }
        player(s);
      });
    },
```
`setMyCharacter` becomes:
```ts
    async setMyCharacter(sid, characterId) { await mutate(s => {
      if (s.sessions.find(x => x.id === sid && x.status !== 'ended')?.stage !== 'register') throw new Error('Companions are locked once the voyage starts.');
      const a = s.attendance.find(x => x.sessionId === sid && x.userId === id); if (!a) throw new Error('Join the retro first.');
      if (!player(s).owned[characterId]) throw new Error('Choose a character from your collection.'); a.characterId = characterId; }); },
```
The rest of Task 3 is unchanged.

Run the full suite early in this task. `App.test.tsx` seeds sessions mid-voyage (around lines 68 and 161). If one of its tests has a player join who isn't in the seeded attendance, it will now hit "already started". Fix the seed by adding the player to `attendance`, not the rule.

---

### Rev E. Task 4: Lobby controls UI (feature 8)

**What changes:** the lock toggle stays in the lobby only. During the voyage, joining is closed anyway (Task 2), so the in-voyage Party panel keeps only Remove, plus a note.

**Interfaces:** `PartyControls({ members: LobbyMember[]; busy: boolean; onRemove: (userId: string) => void })`. There are no lock props.

`PartyControls.test.tsx` (replaces it):
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyControls from './PartyControls';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const members = [{ userId: 'jay', name: 'Jay', characterId: null, warden: true, you: true, ready: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false, ready: true }];
describe('PartyControls', () => {
  it('removes a teammate (never the Warden) and says joining is closed', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el); const onRemove = vi.fn();
    await act(async () => createRoot(el).render(<PartyControls members={members} busy={false} onRemove={onRemove} />));
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Party controls"]')!.click());
    expect(el.textContent).toContain('Joining is closed');
    expect(el.querySelector('[aria-label="Remove Jay from the party"]')).toBeNull();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remove Ana from the party"]')!.click());
    expect(onRemove).toHaveBeenCalledWith('ana');
  });
});
```
The `ready` field is added to `LobbyMember` in Task 7. Until Task 7 lands, leave `ready` out of this test's members, then add it in Task 7.

`PartyControls.tsx` (replaces it):
```tsx
import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import type { LobbyMember } from './VoyageLobby';

/** Warden, during the voyage: remove a teammate. Joining is closed until the party returns to the lobby. */
export default function PartyControls({ members, busy, onRemove }: { members: LobbyMember[]; busy: boolean; onRemove: (userId: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="party-controls">
    <button disabled={busy} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Party controls"><UsersRound size={16} /><span className="voyage-btn-text">Party</span></button>
    {open && <div className="party-controls-panel" role="dialog" aria-label="Party">
      <p>Joining is closed while the voyage runs. A removed player can’t rejoin until you return to the lobby.</p>
      <ul>{members.map(m => <li key={m.userId}><span>{m.name}{m.warden && <small> · Warden</small>}</span>{!m.warden && <button disabled={busy} onClick={() => onRemove(m.userId)} aria-label={`Remove ${m.name} from the party`}>Remove</button>}</li>)}</ul>
    </div>}
  </div>;
}
```

Wiring: `partyControls={warden ? <PartyControls members={members} busy={busy} onRemove={removePlayer} /> : undefined}`. The `toggleLock` helper is still passed to `VoyageLobby`.

Remove the `.party-controls-panel .lobby-lock` usage. The `.lobby-lock` CSS stays for the lobby. Everything else in Task 4 (lobby lock, Party-locked join button, × remove in the lobby) is unchanged.

---

### Rev F. Task 5: Lobby check-ins on the server (migration 0006)

**Interfaces → Produces:**
- `checkins` table, `attendance.checkin_done`, `refresh_progress`.
- `save_checkin(p_session, p_sat, p_growth)`: lobby only, and needs a companion.
- `checkin_summary(p_session)`: `null` before Homecoming.
- RLS: your own row; the voyage's Warden and admins only from Homecoming.
- `set_session` refuses to leave `register` while anyone hasn't checked in.
- `0001_lumara_test.sql` is updated for the start gate.

**Step 1: SQL test** (replaces `supabase/tests/0006_checkins_test.sql`)
```sql
-- 0006: lobby check-ins and the start gate. Run with execute_sql; everything rolls back.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  insert into players(user_id, owned) values ('00000000-0000-0000-0000-00000000000a','{"wren":1}'), ('00000000-0000-0000-0000-00000000000b','{"wren":1}'), ('00000000-0000-0000-0000-00000000000c','{"wren":1}');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint C')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  -- finalizing needs a companion; 1–5 only; editing works in the lobby
  do $$ begin begin perform save_checkin((select id from t_sess), 4, 5); raise exception 'FAIL: checked in without a companion'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select set_my_character((select id from t_sess), 'wren'); select save_checkin((select id from t_sess), 4, 5);
  do $$ begin begin perform save_checkin((select id from t_sess), 0, 3); raise exception 'FAIL: accepted 0'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  do $$ begin begin perform save_checkin((select id from t_sess), 3, 6); raise exception 'FAIL: accepted 6'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  select set_my_character((select id from t_sess), 'wren'); select save_checkin((select id from t_sess), 2, 3); select save_checkin((select id from t_sess), 3, 3);
  do $$ begin if (select count(*) from checkins) <> 1 or (select sat from checkins) <> 3 then raise exception 'FAIL: player reads others, or edit not saved'; end if; end $$;
  do $$ begin if checkin_summary((select id from t_sess)) is not null then raise exception 'FAIL: averages before Homecoming'; end if; end $$;
  do $$ begin if not (select checkin_done from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000b') then raise exception 'FAIL: ✓ not set'; end if; end $$;
  -- the Warden (not checked in yet) can't start; admins see no answers in the lobby
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  do $$ begin begin perform set_session((select id from t_sess), '{"stage":"fragment_drop"}'); raise exception 'FAIL: started before everyone checked in'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select set_session((select id from t_sess), '{"partyLocked":true}');   -- other lobby changes still work
  do $$ begin if (select count(*) from checkins where session_id = (select id from t_sess)) <> 0 then raise exception 'FAIL: admin reads answers in the lobby'; end if; end $$;
  select set_my_character((select id from t_sess), 'wren'); select save_checkin((select id from t_sess), 5, 5);
  select set_session((select id from t_sess), '{"stage":"fragment_drop"}');
  -- started: check-ins lock; a non-admin Warden still sees only their own row mid-voyage
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform save_checkin((select id from t_sess), 5, 5); raise exception 'FAIL: check-in edited after the start'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  reset role; update sessions set warden_id = '00000000-0000-0000-0000-00000000000b' where id = (select id from t_sess);
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin if (select count(*) from checkins where session_id = (select id from t_sess)) <> 1 then raise exception 'FAIL: Warden reads answers before Homecoming'; end if; end $$;
  -- Homecoming: the Warden sees every answer; players still only their own; averages appear
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"rewards"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin if (select count(*) from checkins where session_id = (select id from t_sess)) <> 3 then raise exception 'FAIL: Warden cannot read answers at Homecoming'; end if; end $$;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin if (select count(*) from checkins) <> 1 then raise exception 'FAIL: player reads others at Homecoming'; end if; end $$;
  do $$ begin if checkin_summary((select id from t_sess)) <> '{"sat":80,"growth":87,"n":3,"of":3}'::jsonb then raise exception 'FAIL: summary %', checkin_summary((select id from t_sess)); end if; end $$;
  -- a removed player stops counting; cancelling erases check-ins
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select remove_player((select id from t_sess), '00000000-0000-0000-0000-00000000000c');
  do $$ begin if checkin_summary((select id from t_sess)) <> '{"sat":90,"growth":100,"n":2,"of":2}'::jsonb then raise exception 'FAIL: removed player still counted %', checkin_summary((select id from t_sess)); end if; end $$;
  select cancel_session((select id from t_sess));
  reset role;
  do $$ begin if exists (select 1 from checkins where session_id = (select id from t_sess)) then raise exception 'FAIL: cancel left check-ins'; end if; end $$;
rollback;
```
Averages: sat (4+3+5)/3 = 4 → 80%; growth (5+3+5)/3 = 4.33 → 87%. After the removal: sat 4.5 → 90%; growth 5 → 100%.

**Step 1b: keep `0001_lumara_test.sql` green.**
- Add the `ready_all` helper after its `as_user` helper:
  ```sql
  -- Test shortcut (run as the superuser): everyone in the party has a companion and has checked in, so the voyage may start.
  create or replace function pg_temp.ready_all(p_session uuid) returns void language sql as $$
    update attendance set character_id = coalesce(character_id, 'wren'), checkin_done = true where session_id = p_session;
    insert into checkins(session_id, user_id, sat, growth) select session_id, user_id, 4, 4 from attendance where session_id = p_session on conflict do nothing $$;
  ```
- After `begin;`, add `update sessions set status = 'ended' where status <> 'ended';`.
- Replace the block from `-- admin creates a voyage; b and c join` through c's `join_session` with:
  ```sql
  -- admin creates a voyage; b and c join in the lobby and everyone checks in
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint T')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  reset role; select pg_temp.ready_all((select id from t_sess));
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"fragment_drop"}');
  -- b writes a thought; c cannot see who wrote it
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  create temp table t_frag as select (add_fragment((select id from t_sess), 'hello', 'spark')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  ```
- The rest of 0001 is unchanged.

**Step 3: migration** (replaces `supabase/migrations/0006_checkins.sql`)
```sql
-- Self Check-In happens in the lobby: every member picks a companion and checks in, and the voyage can't start until all have.
-- Players read only their own row; the voyage's Warden and admins read every answer only from Homecoming.
create table checkins (session_id uuid not null references sessions on delete cascade, user_id uuid not null references players on delete cascade,
  sat int not null check (sat between 1 and 5), growth int not null check (growth between 1 and 5), at bigint not null default now_ms(),
  primary key (session_id, user_id));
alter table attendance add column if not exists checkin_done bool not null default false;
alter table checkins enable row level security;
create policy read_own_or_warden_at_homecoming on checkins for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from sessions s where s.id = session_id and s.stage in ('rewards','completed') and (s.warden_id = auth.uid() or is_admin())));

-- Who has finished (never what they answered). Recomputed for the whole party after every save or removal.
create or replace function refresh_progress(p_session uuid) returns void language sql security definer set search_path = public as $$
  update attendance a set checkin_done = exists (select 1 from checkins c where c.session_id = a.session_id and c.user_id = a.user_id)
  where a.session_id = p_session $$;

create or replace function save_checkin(p_session uuid, p_sat int, p_growth int) returns void language plpgsql security definer set search_path = public as $$
begin perform require_stage(p_session, array['register']);
  if p_sat is null or p_growth is null or p_sat not between 1 and 5 or p_growth not between 1 and 5 then raise exception 'Pick 1 to 5 for both questions.'; end if;
  if (select character_id from attendance where session_id = p_session and user_id = auth.uid()) is null then raise exception 'Pick your voyage companion first.'; end if;
  insert into checkins(session_id, user_id, sat, growth) values (p_session, auth.uid(), p_sat, p_growth)
    on conflict (session_id, user_id) do update set sat = excluded.sat, growth = excluded.growth, at = now_ms();
  perform refresh_progress(p_session); end $$;

-- 0005 + the start gate: the voyage leaves the lobby only when every member has checked in.
create or replace function set_session(p_session uuid, p_patch jsonb) returns void language plpgsql security definer set search_path = public as $$
declare s sessions := require_warden(p_session); begin
  if s.stage = 'register' and coalesce(p_patch->>'stage', 'register') <> 'register'
     and exists (select 1 from attendance where session_id = p_session and not checkin_done) then
    raise exception 'Everyone in the party must check in before the voyage starts.'; end if;
  update sessions set stage = coalesce(p_patch->>'stage', stage), status = coalesce(p_patch->>'status', status),
    current_fragment_id = case when p_patch ? 'currentFragmentId' then (p_patch->>'currentFragmentId')::uuid else current_fragment_id end,
    timer_ends_at = case when p_patch ? 'timerEndsAt' then (p_patch->>'timerEndsAt')::bigint else timer_ends_at end,
    sprint_name = coalesce(left(p_patch->>'sprintName', 80), sprint_name), warden_id = coalesce((p_patch->>'wardenId')::uuid, warden_id),
    party_locked = coalesce((p_patch->>'partyLocked')::bool, party_locked),
    speaker = case when p_patch ? 'speaker' then nullif(p_patch->'speaker', 'null'::jsonb) else speaker end
  where id = p_session; end $$;

-- Team averages as % of 5, counting only current party members. Null before Homecoming.
create or replace function checkin_summary(p_session uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (select 1 from sessions where id = p_session and stage in ('rewards','completed')) then null else
    (select jsonb_build_object('sat', round(avg(c.sat) * 20)::int, 'growth', round(avg(c.growth) * 20)::int, 'n', count(c.user_id)::int, 'of', count(*)::int)
     from attendance a left join checkins c on c.session_id = a.session_id and c.user_id = a.user_id where a.session_id = p_session) end $$;

revoke execute on function refresh_progress(uuid) from public, anon, authenticated;
revoke execute on function save_checkin(uuid, int, int) from public, anon;
revoke execute on function checkin_summary(uuid) from public, anon;
grant execute on function save_checkin(uuid, int, int) to authenticated;
grant execute on function checkin_summary(uuid) to authenticated;
alter publication supabase_realtime add table checkins;
```

**Steps 2, 4 and 5 change: 0006 is NOT applied in this task.**

Once 0006 is live, no voyage can leave the lobby until everyone has checked in, and the deployed front end has no check-in screen until Task 7 ships. So:
- **Step 2 (watch it fail):** run the 0006 test alone with `execute_sql`. Expected: `function save_checkin(...) does not exist`.
- **Step 4 (test without applying):**
  1. Create the pg_temp `as_user` and `ready_all` helpers outside a transaction, as usual. `ready_all` only needs to exist once the migration body has run inside the transaction, so create it after the 0006 body.
  2. Run one rolled-back `execute_sql`: `begin;`, then the whole 0006 migration body, then the 0006 test body (everything between its own `begin;` and `rollback;`), then `rollback;`.
  3. Run the 0001 test the same way, with the 0006 body in front.
  4. Expected: no `FAIL:`. The DDL and `alter publication` roll back too, so the live database is untouched.
  5. Don't run this while a voyage is in progress.
- **Step 5:** nothing to apply here. Task 7's last step applies 0006 together with the deploy.

The commit becomes: `DB: lobby check-ins migration + tests (companion first, lock at start, start gate, answers to the Warden from Homecoming); applied with the Task 7 deploy`. Also `git add supabase/tests/0001_lumara_test.sql`.

---

### Rev G. Task 6: Lobby check-ins in both backends

**Interfaces:** unchanged, except for these rules:
- `saveMyCheckIn` works in `register` only, after a companion is set.
- `updateSession` refuses to leave `register` until everyone has checked in.
- `watchCheckIns` returns rows to the Warden/admin only from Homecoming. Players always get `[]`.

**Step 1: tests.**

Add this helper to `local.test.ts`, next to `setStage`. Import `CheckIn` and `Attendance`.
```ts
/** Test shortcut: everyone in the party has picked a companion and checked in (the lobby's start rule). */
const checkInEveryone = (sid: string) => {
  const s = JSON.parse(localStorage.getItem('lumara.demo.v1')!); s.checkins ??= [];
  for (const a of s.attendance.filter((x: Attendance) => x.sessionId === sid)) {
    a.characterId ??= 'wren'; a.checkinDone = true;
    if (!s.checkins.some((c: CheckIn) => c.sessionId === sid && c.userId === a.userId)) s.checkins.push({ sessionId: sid, userId: a.userId, sat: 4, growth: 4 });
  }
  localStorage.setItem('lumara.demo.v1', JSON.stringify(s));
};
```
**Existing tests:** every test that moves a voyage out of `register` with `updateSession` needs `checkInEveryone(s.id)` after its joins and before that call. On 2026-10-09 that means `local.test.ts` around lines 56, 64, 78, 90, 121 and 129. Run the suite to find any others; tsc won't catch them.

The check-in test replaces the old one:
```ts
  it('lobby check-in: companion first, start waits for everyone, locks at the start, answers hidden until Homecoming', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana'), bob = createLocalBackend('bob');
    const s = await jay.createSession('Check'); await ana.join(s.id); await bob.join(s.id);
    for (const b of [jay, ana, bob]) await b.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await expect(ana.saveMyCheckIn(s.id, 4, 5)).rejects.toThrow('companion');
    for (const b of [jay, ana, bob]) await b.setMyCharacter(s.id, 'wren');
    for (const bad of [[0, 3], [3, 6], [2.5, 3]]) await expect(ana.saveMyCheckIn(s.id, bad[0], bad[1])).rejects.toThrow('1 to 5');
    await ana.saveMyCheckIn(s.id, 4, 5); await bob.saveMyCheckIn(s.id, 2, 3); await bob.saveMyCheckIn(s.id, 3, 3);
    expect(await bob.myCheckIn(s.id)).toMatchObject({ sat: 3, growth: 3 });
    let att: Attendance[] = []; ana.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.checkinDone).toBe(true); expect(att.find(a => a.userId === 'jay')?.checkinDone).toBe(false);
    await expect(jay.updateSession(s.id, { stage: 'fragment_drop' })).rejects.toThrow('check in');
    await jay.updateSession(s.id, { partyLocked: true });   // other lobby changes still work
    let seen: unknown[] = []; jay.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);   // no answers in the lobby
    await jay.saveMyCheckIn(s.id, 5, 5); await jay.updateSession(s.id, { stage: 'fragment_drop' });
    await expect(bob.saveMyCheckIn(s.id, 5, 5)).rejects.toThrow('moved on');
    jay.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);   // nor mid-voyage
    expect(await ana.checkInSummary(s.id)).toBeNull();
    await jay.updateSession(s.id, { stage: 'rewards' });
    jay.watchCheckIns(s.id, r => seen = r); expect(seen).toHaveLength(3);
    ana.watchCheckIns(s.id, r => seen = r); expect(seen).toEqual([]);
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 80, growth: 87, n: 3, of: 3 });
    await jay.removePlayer(s.id, 'bob');
    expect(await ana.checkInSummary(s.id)).toEqual({ sat: 90, growth: 100, n: 2, of: 2 });
    await jay.cancelSession(s.id);
    expect(JSON.parse(localStorage.getItem('lumara.demo.v1')!).checkins).toEqual([]);
  });
  it('removing a player who never checked in unblocks the start', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Away'); await ana.join(s.id);
    await jay.appendMyPull({ at: 1, characterId: 'wren', grade: 'A', source: 'banner', duplicate: false });
    await jay.setMyCharacter(s.id, 'wren'); await jay.saveMyCheckIn(s.id, 3, 3);
    await expect(jay.updateSession(s.id, { stage: 'fragment_drop' })).rejects.toThrow('check in');
    await jay.removePlayer(s.id, 'ana'); await jay.updateSession(s.id, { stage: 'fragment_drop' });
  });
```
The `feedback.test.ts` and `supabase.test.ts` / `supabaseRows.test.ts` additions are unchanged.

**Step 3: `local.ts`** (differences from the old Task 6):
```ts
    async updateSession(sid, patch) { await mutate(s => {
      const session = requireWarden(s, sid);
      if (session.stage === 'register' && patch.stage && patch.stage !== 'register' && s.attendance.some(a => a.sessionId === sid && !a.checkinDone))
        throw new Error('Everyone in the party must check in before the voyage starts.');
      Object.assign(session, patch); }); },
    async saveMyCheckIn(sid, sat, growth) {
      if (![sat, growth].every(v => Number.isInteger(v) && v >= 1 && v <= 5)) throw new Error('Pick 1 to 5 for both questions.');
      await mutate(s => {
        requireStage(s, sid, ['register']);
        if (!s.attendance.find(a => a.sessionId === sid && a.userId === id)?.characterId) throw new Error('Pick your voyage companion first.');
        const row = s.checkins.find(c => c.sessionId === sid && c.userId === id);
        if (row) Object.assign(row, { sat, growth }); else s.checkins.push({ sessionId: sid, userId: id, sat, growth });
        progress(s, sid);
      });
    },
    watchCheckIns(sid, cb) { return watch(s => isWardenOf(s, sid) && reportOpen(s, sid) ? s.checkins.filter(c => c.sessionId === sid) : [], cb); },
```
`myCheckIn`, `checkInSummary`, `progress` and `cancelSession` are unchanged.

**`supabase.ts`:** `watchCheckIns` watches `['checkins', 'attendance', 'sessions']`, so the Warden's list fills in when the stage reaches Homecoming. Row security does the hiding.

The commit becomes: `Game: lobby check-in in both backends (companion first, start gate, lock at start, answers from Homecoming)`.

---

### Rev H. Task 7: Lobby check-in panel (feature 1)

**Files:**
- Create: `interface/src/data/feedback.ts` (unchanged from before)
- Create: `interface/src/components/CheckInPanel.tsx`
- Create: `interface/src/components/CheckInPanel.test.tsx`
- Modify: `interface/src/components/VoyageLobby.tsx`, `VoyageLobby.test.tsx` (✓ in the party line, start gate, `checkIn` slot)
- Modify: `interface/src/components/feedback.css`, `voyage-lobby.css`
- Modify: `interface/src/screens.tsx` (`RetroScreen` lobby branch)
- Modify: `interface/src/components/PartyControls.test.tsx` (add `ready` to its members)

**Interfaces:**
- Consumes: `setMyCharacter`, `saveMyCheckIn`, `myCheckIn`, `Attendance.checkinDone`.
- Produces:
  - `CheckInPanel({ owned: CharacterDef[]; companionId: string | null; saved: CheckIn | null; busy: boolean; onSave(companionId: string, sat: number, growth: number) })`.
  - `LobbyMember.ready: boolean`.
  - `VoyageLobby` gets the prop `checkIn?: ReactNode`.
  - `CHECKIN_QUESTIONS` and `PEER_TRAITS` (also adds `PeerTrait`/`PeerScores` to `types.ts`, as before).

- [ ] **Step 1: Write the failing tests**

`CheckInPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS } from '../data/characters';
import CheckInPanel from './CheckInPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const owned = CHARACTERS.filter(c => ['wren', 'rook'].includes(c.id));
async function render(p: { companionId?: string | null; saved?: { sessionId: string; userId: string; sat: number; growth: number } | null; owned?: typeof owned } = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onSave = vi.fn();
  await act(async () => createRoot(el).render(<CheckInPanel owned={p.owned ?? owned} companionId={p.companionId ?? null} saved={p.saved ?? null} busy={false} onSave={onSave} />));
  return { el, onSave };
}
const radio = (el: HTMLElement, group: string, label: string) => el.querySelector<HTMLButtonElement>(`[role="radiogroup"][aria-label="${group}"] [aria-label^="${label}"]`)!;
const save = (el: HTMLElement) => [...el.querySelectorAll('button')].find(b => /check-in/i.test(b.textContent || ''))!;
describe('CheckInPanel', () => {
  it('needs a companion and both answers before Finalize', async () => {
    const { el, onSave } = await render();
    await act(async () => radio(el, 'Sprint Satisfaction', '5').click());
    await act(async () => radio(el, 'Self Growth', '3').click());
    expect(save(el).disabled).toBe(true);
    await act(async () => radio(el, 'Voyage companion', 'Rook').click());
    expect(save(el).textContent).toContain('Finalize');
    await act(async () => save(el).click());
    expect(onSave).toHaveBeenCalledWith('rook', 5, 3);
  });
  it('shows the saved companion and answers, and offers an update', async () => {
    const { el } = await render({ companionId: 'wren', saved: { sessionId: 's', userId: 'u', sat: 2, growth: 4 } });
    expect(radio(el, 'Voyage companion', 'Wren').getAttribute('aria-checked')).toBe('true');
    expect(radio(el, 'Sprint Satisfaction', '2').getAttribute('aria-checked')).toBe('true');
    expect(save(el).textContent).toContain('Update');
  });
  it('labels each step in the spec’s words, and tells a player with no companions what to do', async () => {
    const { el } = await render();
    expect(radio(el, 'Sprint Satisfaction', '5').textContent).toContain('Legendary');
    expect(radio(el, 'Self Growth', '1').textContent).toContain('Same level');
    const empty = await render({ owned: [] });
    expect(empty.el.textContent).toContain('no companions yet');
  });
});
```

Append to `VoyageLobby.test.tsx`:
- Default `members` get `ready: true`.
- Members added in Task 4's tests get `ready: true` too.

```tsx
  it('keeps Enter the Sanctuary closed until everyone has checked in', async () => {
    const { el } = await render({ members: [...members, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false, ready: false }] });
    expect(button(el, 'Enter the Sanctuary')!.disabled).toBe(true);
    expect(el.textContent).toContain('Waiting for 1 to check in');
  });
  it('shows the Warden every ✓ and a player only their own', async () => {
    const party = [{ userId: 'jay', name: 'Jay', characterId: null, warden: true, you: false, ready: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: true, ready: true }];
    const asWarden = await render({ members: party.map(m => ({ ...m, you: m.userId === 'jay' })) });
    expect(asWarden.el.querySelectorAll('.lobby-ready')).toHaveLength(2);
    const asPlayer = await render({ members: party, warden: false });
    expect([...asPlayer.el.querySelectorAll('.lobby-ready')].map(x => x.getAttribute('aria-label'))).toEqual(['Ana is checked in']);
  });
  it('tells a newcomer or a removed player that the voyage is under way', async () => {
    const { el } = await render({ joined: false, warden: false, started: true });
    const join = button(el, 'Voyage under way')!;
    expect(join.disabled).toBe(true);
  });
  it('renders the check-in slot', async () => {
    const { el } = await render({ checkIn: <p>check-in here</p> });
    expect(el.textContent).toContain('check-in here');
  });
```

- [ ] **Step 2: Run them and watch them fail.**

Run: `cd interface && npx vitest run src/components/CheckInPanel.test.tsx src/components/VoyageLobby.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`data/feedback.ts`: unchanged from the old Task 7.

`CheckInPanel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { CheckIn } from '../backend/types';
import type { CharacterDef } from '../data/characters';
import { CHECKIN_QUESTIONS } from '../data/feedback';
import { Art } from './ui';
import './feedback.css';

type Picks = { sat: number | null; growth: number | null };
/** Lobby Self Check-In (feature 1): choose this voyage's companion, rate both questions, Finalize. Editable until the voyage starts. */
export default function CheckInPanel({ owned, companionId, saved, busy, onSave }: { owned: CharacterDef[]; companionId: string | null; saved: CheckIn | null; busy: boolean; onSave: (companionId: string, sat: number, growth: number) => void }) {
  const [companion, setCompanion] = useState(companionId);
  const [picks, setPicks] = useState<Picks>({ sat: saved?.sat ?? null, growth: saved?.growth ?? null });
  useEffect(() => { setCompanion(companionId); }, [companionId]);
  useEffect(() => { setPicks({ sat: saved?.sat ?? null, growth: saved?.growth ?? null }); }, [saved?.sat, saved?.growth]);
  const ready = companion !== null && picks.sat !== null && picks.growth !== null;
  return <section className="checkin-panel" aria-label="Self check-in">
    <header><h3>Before we set sail</h3><p>Choose your companion and check in. Your answers stay private until Homecoming. Then the party sees team averages, and your Warden sees each answer.</p></header>
    <fieldset><legend>Voyage companion</legend>{owned.length
      ? <div className="checkin-companions" role="radiogroup" aria-label="Voyage companion">{owned.map(c => <button key={c.id} type="button" role="radio" aria-checked={companion === c.id} aria-label={c.name} className={companion === c.id ? 'on' : ''} onClick={() => setCompanion(c.id)}><Art character={c} kind="cutout" decorative /><span>{c.name}</span></button>)}</div>
      : <p>You have no companions yet. Make a wish at the banner first.</p>}</fieldset>
    {CHECKIN_QUESTIONS.map(q => <fieldset key={q.key}><legend><span aria-hidden="true">{q.icon}</span> {q.title}</legend><p>{q.ask}</p>
      <div className="checkin-scale" role="radiogroup" aria-label={q.title}>{q.labels.map((label, i) => { const v = i + 1; const on = picks[q.key] === v;
        return <button key={v} type="button" role="radio" aria-checked={on} aria-label={`${v} · ${label}`} className={on ? 'on' : ''} onClick={() => setPicks(p => ({ ...p, [q.key]: v }))}><strong>{v}</strong><span>{label}</span></button>; })}</div>
    </fieldset>)}
    <button className="feedback-save" disabled={busy || !ready} onClick={() => { if (companion && picks.sat !== null && picks.growth !== null) onSave(companion, picks.sat, picks.growth); }}>{saved ? 'Update check-in' : 'Finalize check-in'}</button>
  </section>;
}
```

`feedback.css`: the old Task 7 rules, minus `.feedback-panels` (Task 10 adds that), plus:
```css
.checkin-companions{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
.checkin-companions button{flex:0 0 auto;display:grid;justify-items:center;gap:2px;width:76px;padding:6px 4px;border:1px solid #d8bf8244;background:#10233acc;color:#d9e2ea;font:inherit;font-size:12px;cursor:pointer}
.checkin-companions button.on{border-color:#f3dca0;box-shadow:0 0 14px #e9cf8f44;color:#fff4dc}
.checkin-companions .character-art,.checkin-companions .silhouette{height:64px;width:auto;object-fit:contain}
.checkin-companions button:focus-visible{outline:2px solid #fff4dc;outline-offset:2px}
```

`VoyageLobby.tsx`:
- `LobbyMember` adds `/** Checked in (✓). */ ready: boolean`.
- New prop `checkIn?: ReactNode`, rendered inside `.lobby-brief` after the briefing list: `{checkIn && <div className="lobby-checkin">{checkIn}</div>}`.
- New prop `started?: boolean` (default `false`). A non-member sees the lobby after the start: a newcomer, or a player removed mid-voyage. For them, the join button becomes
  ```tsx
  <button className="lobby-primary" disabled><Hourglass size={19} />Voyage under way</button>
  ```
  This is checked before the "Party locked" case. In `RetroScreen`, pass `started={session.stage !== 'register'}`.
- `const waiting = members.filter(m => !m.ready).length;`
- The Warden's Enter button: `disabled={busy || paused || waiting > 0}`. Under the action:
  ```tsx
  {warden && <p className="lobby-count">{waiting ? `Waiting for ${waiting} to check in` : 'Everyone is checked in'}</p>}
  ```
- In each party `li`:
  ```tsx
  {m.ready && (warden || m.you) && <span className="lobby-ready" aria-label={`${m.name} is checked in`}>✓</span>}
  ```

`voyage-lobby.css` (append):
```css
.lobby-checkin{margin-top:22px;padding:16px;border:1px solid #d8bf8255;background:#0a1a2ccc}
.lobby-ready{position:absolute;top:4px;left:4px;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#e9cf8f;color:#1b2a3a;font-weight:700;font-size:14px;box-shadow:0 0 10px #e9cf8f88}
```

`screens.tsx` `RetroScreen`:
- State and loading go at the top, with the existing state, **before** `if (!session) return`:
  ```tsx
  const [myCheck, setMyCheck] = useState<CheckIn | null>(null);
  useEffect(() => { let live = true; if (!session || session.stage !== 'register') return; backend.myCheckIn(session.id).then(c => { if (live) setMyCheck(c); }).catch(() => {}); return () => { live = false; }; }, [backend, session?.id, session?.stage]);
  ```
- `members` (Task 4) adds `ready: a.checkinDone`.
- `VoyageLobby` gets:
  ```tsx
  checkIn={joined ? <CheckInPanel owned={ownedCharacters} companionId={ownAttendance?.characterId ?? null} saved={myCheck} busy={busy} onSave={(c, sat, growth) => run(async () => { if (c !== ownAttendance?.characterId) await backend.setMyCharacter(session.id, c); await backend.saveMyCheckIn(session.id, sat, growth); setMyCheck(await backend.myCheckIn(session.id)); }, 'Checked in. You’re ready to sail.')} /> : undefined}
  ```
  `ownedCharacters` already exists in `RetroScreen`.
- Import `CheckInPanel` and the type `CheckIn`.
- The Vow Altar and Homecoming no longer show a check-in. Task 10 adds the `feedback` block.

- [ ] **Step 4: Run the tests and watch them pass.**
Run: `cd interface && npx tsc --noEmit -p . && npx vitest run`
Expected: all green.

- [ ] **Step 5: Check it in the browser.**
1. Use three local tabs (jay, ana, bob) in the lobby.
2. Each picks a companion and finalizes. Jay sees ✓s appear; Ana sees only her own.
3. "Enter the Sanctuary" stays disabled until the third ✓.
4. Ana edits her answers: still fine.
5. Jay starts the voyage. Ana's panel is gone. A fourth tab (`?player=cy`) can't join. Reloading Ana's tab reconnects her.
6. Jay presses "Return to lobby": editing and joining are back.
7. At phone width (375px), nothing scrolls sideways.
8. Take screenshots.

- [ ] **Step 6: Commit**
```bash
git add interface/src
git commit -m "Game: lobby check-in (companion + two questions, Finalize ✓); the voyage starts only when everyone is checked in"
```

- [ ] **Step 7 (new): Interim deploy and apply 0006, in one sitting.**
  1. Ask Jay: "OK to push `main` (this deploys Tasks 1–7: Make a Vow, lobby controls, lobby check-in) and apply `0006_checkins` right after? From then on, a voyage starts only when everyone has checked in."
  2. On a clear yes, push. Wait for the Pages Action to finish, then `apply_migration` `0006_checkins`.
  3. Re-run the 0001, 0005 and 0006 tests. Expected: no `FAIL:`.
  4. Open the live game once and check that the lobby shows the check-in panel.
  5. Don't do any of this while a voyage is in progress.

---

### Rev I. Task 8: Peer feedback on the server (only the test setup changes)

0006 is live by now (Task 7, Step 7), so 0007 is applied normally, with Jay's OK.

In `0007_peer_feedback_test.sql`:
- Add the same `pg_temp.ready_all` helper as Task 5 Step 1b, after `as_user`.
- Replace
  ```sql
  reset role; select pg_temp.as_user('…a', false); select set_session((select id from t_sess), '{"stage":"vow_altar"}');
  ```
  with:
  ```sql
  reset role; select pg_temp.ready_all((select id from t_sess));   -- everyone checked in, so the voyage may start
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"vow_altar"}');
  ```

The migration is unchanged.

---

### Rev J. Task 9: Peer feedback in both backends (the start gate and the finish-warning helper change)

**Interfaces → Produces:** `pendingFeedback` and `finishWarningText({ checkin, peer })` are replaced by:
- `pendingPeerFeedback(party: Attendance[]): number`
- `finishWarningText(peer: number): string | null`

`feedback.test.ts`: the third test becomes:
```ts
  it('builds the Finish warning from peer feedback only, or none when everyone is done', () => {
    const party = [att('a', true, 2), att('b', true, 1), att('c', true, 0)];
    expect(pendingPeerFeedback(party)).toBe(2);
    expect(finishWarningText(2)).toBe('2 players haven’t finished peer feedback. Once you finish, nobody can add more.');
    expect(finishWarningText(1)).toBe('1 player hasn’t finished peer feedback. Once you finish, nobody can add more.');
    expect(finishWarningText(0)).toBeNull();
  });
```
Update the import line to match.

`logic/feedback.ts`: replace `pendingFeedback`, `notYet` and `finishWarningText` with:
```ts
/** How many players haven't rated every teammate yet. */
export const pendingPeerFeedback = (party: Attendance[]) => party.filter(a => !peerDone(a, party)).length;
/** The Warden's warning on "Finish voyage" (they can still finish). */
export function finishWarningText(peer: number): string | null {
  return peer ? `${peer} ${peer === 1 ? 'player hasn’t' : 'players haven’t'} finished peer feedback. Once you finish, nobody can add more.` : null;
}
```

`local.test.ts` peer test: add `checkInEveryone(s.id);` after the joins and before `await jay.updateSession(s.id, { stage: 'vow_altar' });`.

---

### Rev K. Task 10: Peer Feedback panel, party progress and finish warning (feature 2)

**What changes:**
- `feedback` is defined here and holds only peer feedback, plus `PartyProgress` for the Warden.
- `PartyProgress` drops the check-in column, since everyone checked in before the start. It shows peer ✓, and from Homecoming each player's check-in answers.
- The finish warning covers peer feedback only.

**Interfaces → Produces:**
- `PartyProgress({ members: { userId; name }[]; attendance: Attendance[]; checkins: CheckIn[] })`
- `VoyageHud` `finishWarning?: string | null`
- `PeerFeedbackPanel` (unchanged)

`PartyProgress.test.tsx` (replaces it):
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyProgress from './PartyProgress';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const att = (userId: string, peerGiven: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast: 0, characterId: null, checkinDone: true, peerGiven });
describe('PartyProgress', () => {
  it('shows who finished peer feedback, and check-in answers only when the backend returns them (Homecoming)', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<PartyProgress members={[{ userId: 'a', name: 'Ana' }, { userId: 'b', name: 'Bob' }]} attendance={[att('a', 1), att('b', 0)]} checkins={[{ sessionId: 's', userId: 'a', sat: 4, growth: 5 }]} />));
    const row = (name: string) => [...el.querySelectorAll('li')].find(li => li.textContent?.includes(name))!;
    expect(row('Ana').querySelector('[aria-label="Peer feedback done"]')).toBeTruthy(); expect(row('Ana').textContent).toContain('♥ 4 · ◆ 5');
    expect(row('Bob').querySelector('[aria-label="Peer feedback not done"]')).toBeTruthy(); expect(row('Bob').textContent).not.toContain('♥ ');
  });
});
```
The `PeerFeedbackPanel` test is unchanged. In the `VoyageHud` test, the `finishWarning` text becomes `'1 player hasn’t finished peer feedback. Once you finish, nobody can add more.'` and its `toContain` becomes `'peer feedback'`.

`PartyProgress.tsx` (replaces it):
```tsx
import { Check, Star } from 'lucide-react';
import type { Attendance, CheckIn, UserId } from '../backend/types';
import { peerDone } from '../logic/feedback';
import './feedback.css';

/** Warden/admin only: who has finished peer feedback; from Homecoming, each player's check-in answers too. Never anyone's peer ratings. */
export default function PartyProgress({ members, attendance, checkins }: { members: { userId: UserId; name: string }[]; attendance: Attendance[]; checkins: CheckIn[] }) {
  return <section className="party-progress" aria-label="Party progress"><h4>Party progress</h4>
    <ul>{members.map(m => { const a = attendance.find(x => x.userId === m.userId); const c = checkins.find(x => x.userId === m.userId); const peer = a ? peerDone(a, attendance) : false;
      return <li key={m.userId}><span>{m.name}</span>
        <span className={peer ? 'done' : ''} aria-label={peer ? 'Peer feedback done' : 'Peer feedback not done'}><Star size={14} />{peer && <Check size={12} />}</span>
        <small>{c ? `♥ ${c.sat} · ◆ ${c.growth}` : ''}</small></li>; })}</ul>
  </section>;
}
```
The CSS row changes to `.party-progress li{…grid-template-columns:1fr auto 80px…}`.

`screens.tsx` `RetroScreen`:
- At the top, before `if (!session) return`:
  - `myPeer` state and effect (as before);
  - `const [checkins] = useWatch<CheckIn[]>(cb => session && warden ? backend.watchCheckIns(session.id, cb) : (() => {}), [], [backend, session?.id, warden]);`
- After `const brief = …`:
  ```tsx
  const feedback = joined && ['vow_altar', 'rewards'].includes(session.stage) ? <div className="feedback-panels">
    {warden && <PartyProgress members={members} attendance={attendance} checkins={checkins} />}
    <PeerFeedbackPanel allies={members.filter(m => !m.you)} mine={myPeer} busy={busy} onSave={async (t, sc) => { let ok = false; await run(async () => { await backend.ratePeer(session.id, t, sc); setMyPeer(await backend.myPeerRatings(session.id)); ok = true; }, 'Rating saved.'); return ok; }} />
  </div> : null;
  ```
- Vow Altar:
  - The non-Warden text becomes `<p>Your Warden is writing the Vows. While they do, rate your allies below.</p>`.
  - Render `{feedback}` after the vows list.
- Homecoming: render `{feedback}` at the end of `rewards-stage`. Task 14 keeps it under the report.
- `VoyageHud`: `finishWarning={session.stage === 'rewards' ? finishWarningText(pendingPeerFeedback(attendance)) : null}`.
- Add `.feedback-panels{display:grid;gap:18px;margin-top:18px;border-top:1px solid #d8bf8255;padding-top:14px}` to `feedback.css`.
- Imports: `PeerFeedbackPanel`, `PartyProgress`, `useWatch`, the types `CheckIn` and `PeerScores`, `finishWarningText` and `pendingPeerFeedback`.

**Step 5, browser:**
1. Open three local tabs and go to the Vow Altar.
2. Ana rates Bob and edits the rating. The ✓ shows, and Ana can't see her own chip.
3. Jay's Party progress shows Ana done and Bob not, with no check-in answers.
4. At Homecoming, the answers appear for Jay.
5. Finish warns only about peer feedback.
6. Take a phone-width screenshot.

The commit becomes: `Game: Peer Feedback panel, the Warden's party progress (answers from Homecoming), finish warning for peer feedback`.

---

## Revision 2 (2026-10-10): picks, chosen-speaker Discuss, Vow Altar review

**Spec:** design doc sections 3 (revised), 9 (revised) and 10 (new).

**Order and what this replaces:**
- Run **R2-1 to R2-7 next**, then Tasks 8–10 and 13–17.
- **Tasks 11 and 12 are superseded.** R2-4 and R2-5 replace them; skip them.
- **Task 8's migration is renumbered `0008_peer_feedback`**, because `0007` is taken by R2-1.
- **Task 10 (and Rev K) use R2-3's `nextWarning` instead of `finishWarning`:**
  - title `'Finish the voyage?'`
  - text from `finishWarningText(...)`
  - buttons `'Keep going'` / `'Finish anyway'`

**Already live:** Tasks 1–7 (features 9, 8, 1). Migrations 0005 and 0006 are applied.

**Database:** Jay runs migrations in the Supabase SQL Editor. Claude checks the result with a read-only query before any push.

### R2 Global Constraints
- Everything in the plan's Global Constraints still applies:
  - green `tsc` and `vitest` after every task;
  - no push to `main` without Jay's OK;
  - the local backend keeps parity;
  - the voyage look.
- **Picks stay anonymous rows.** `votes` never holds a user id. Only the chosen player's own choice reveals that they picked that thought.
- **No pick counts and no ranking in Discuss.** Thoughts are listed oldest first.
- **Starlight:** `perVote` per pick, no cap. The formula in `logic/index.ts` is unchanged.

### R2 Review Focus
1. **Reload mid-turn.** A chosen player who refreshes while choosing gets the same choices back. The choices are computed from `myVotes`, which reloads. Pinned in R2-5 (DiscussStage renders from props only).
2. **Speaker JSON saved before these fields existed** (`thoughtId`/`phase`/`discussed` missing) reads as empty. Pinned in R2-4 (row mapper and local read).
3. **The chosen player leaves or is removed mid-turn.** Skip clears the turn, including its thought and phase. Pinned in R2-4 (`skipSpeaker`).
4. **Fewer than 3 thoughts written:** the minimum becomes the number of thoughts. Pinned in R2-2 (`minPicks`).
5. **Only the chosen player can choose, and only from their own undiscussed picks**, with the fallback. Pinned in R2-1 (SQL) and R2-4 (local).

---

### R2-1: Server: picks and choosing a turn's thought (migration 0007)

**Files:**
- Create: `supabase/migrations/0007_picks_and_turns.sql`
- Create: `supabase/tests/0007_picks_and_turns_test.sql`
- Modify: `supabase/tests/0001_lumara_test.sql` (its vote-cap lines)

**Interfaces:**
- Produces:
  - `cast_vote(p_session, p_fragment)`: no cap, and it refuses a second pick of the same thought ("You already picked this thought."). `votes_cast` = the number of picks.
  - `choose_turn_thought(p_session uuid, p_fragment uuid)`: sets `speaker.thoughtId` and `speaker.phase = 'discussing'`.
- Consumes: `sessions.speaker` from 0005 (now holding `currentId, spoken, skipped, thoughtId, phase, discussed`), `vote_owners`/`votes`, and `require_stage` from 0001.

- [ ] **Step 1: Write the SQL test** (`supabase/tests/0007_picks_and_turns_test.sql`)
```sql
-- 0007: picks (no cap, one per thought) and choosing a turn's thought. Run in the SQL Editor; everything rolls back.
create or replace function pg_temp.as_user(uid uuid, anon bool default true) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated','is_anonymous', anon)::text, true);
  set local role authenticated;
end $$;
create or replace function pg_temp.ready_all(p_session uuid) returns void language sql as $$
  update attendance set character_id = coalesce(character_id, 'wren'), checkin_done = true where session_id = p_session;
  insert into checkins(session_id, user_id, sat, growth) select session_id, user_id, 4, 4 from attendance where session_id = p_session on conflict do nothing $$;
begin;
  update sessions set status = 'ended' where status <> 'ended';
  insert into auth.users(id, aud, role, is_anonymous) values
    ('00000000-0000-0000-0000-00000000000a','authenticated','authenticated', false),
    ('00000000-0000-0000-0000-00000000000b','authenticated','authenticated', true),
    ('00000000-0000-0000-0000-00000000000c','authenticated','authenticated', true);
  insert into app_admins(user_id) values ('00000000-0000-0000-0000-00000000000a');
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  create temp table t_sess as select (create_session('Sprint V')).id as id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_session((select id from t_sess));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_session((select id from t_sess));
  reset role; select pg_temp.ready_all((select id from t_sess));
  select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"fragment_drop"}');
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  create temp table t_f(n int, id uuid);
  insert into t_f select 1, (add_fragment((select id from t_sess), 'one', 'spark')).id;
  insert into t_f select 2, (add_fragment((select id from t_sess), 'two', 'spark')).id;
  insert into t_f select 3, (add_fragment((select id from t_sess), 'three', 'fracture')).id;
  insert into t_f select 4, (add_fragment((select id from t_sess), 'four', 'radiance')).id;
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"vote"}');
  -- c picks all four (no cap), cannot pick one twice, un-picks one; votes_cast counts picks
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select cast_vote((select id from t_sess), id) from t_f order by n;
  do $$ begin begin perform cast_vote((select id from t_sess), (select id from t_f where n = 1)); raise exception 'FAIL: picked the same thought twice'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select remove_my_vote((select id from t_sess), (select id from t_f where n = 4));
  do $$ begin if (select votes_cast from attendance where session_id = (select id from t_sess) and user_id = '00000000-0000-0000-0000-00000000000c') <> 3 then raise exception 'FAIL: votes_cast is not the number of picks'; end if; end $$;
  do $$ begin if exists (select 1 from information_schema.columns where table_name = 'votes' and column_name like '%user%') then raise exception 'FAIL: user column on votes'; end if; end $$;
  -- Discuss: the Warden makes c the chooser
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false); select set_session((select id from t_sess), '{"stage":"hall"}');
  select set_session((select id from t_sess), jsonb_build_object('speaker', jsonb_build_object('currentId', '00000000-0000-0000-0000-00000000000c', 'spoken', '[]'::jsonb, 'skipped', '[]'::jsonb, 'thoughtId', null, 'phase', 'choosing', 'discussed', '[]'::jsonb)));
  -- b is not the chosen player
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
  do $$ begin begin perform choose_turn_thought((select id from t_sess), (select id from t_f where n = 1)); raise exception 'FAIL: non-chosen player chose'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- c must choose one of their own picks (4 was un-picked)
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform choose_turn_thought((select id from t_sess), (select id from t_f where n = 4)); raise exception 'FAIL: chose a thought they did not pick'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  select choose_turn_thought((select id from t_sess), (select id from t_f where n = 1));
  do $$ begin if (select speaker->>'thoughtId' from sessions where id = (select id from t_sess)) is distinct from (select id::text from t_f where n = 1) or (select speaker->>'phase' from sessions where id = (select id from t_sess)) <> 'discussing' then raise exception 'FAIL: choice not saved'; end if; end $$;
  do $$ begin begin perform choose_turn_thought((select id from t_sess), (select id from t_f where n = 2)); raise exception 'FAIL: chose twice'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- a discussed thought cannot be chosen again
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), jsonb_build_object('speaker', jsonb_build_object('currentId', '00000000-0000-0000-0000-00000000000c', 'spoken', '[]'::jsonb, 'skipped', '[]'::jsonb, 'thoughtId', null, 'phase', 'choosing', 'discussed', jsonb_build_array((select id::text from t_f where n = 1)))));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  do $$ begin begin perform choose_turn_thought((select id from t_sess), (select id from t_f where n = 1)); raise exception 'FAIL: chose a discussed thought'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
  -- none of c's picks left: any undiscussed thought
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', false);
  select set_session((select id from t_sess), jsonb_build_object('speaker', jsonb_build_object('currentId', '00000000-0000-0000-0000-00000000000c', 'spoken', '[]'::jsonb, 'skipped', '[]'::jsonb, 'thoughtId', null, 'phase', 'choosing', 'discussed', (select jsonb_agg(id::text) from t_f where n <= 3))));
  reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
  select choose_turn_thought((select id from t_sess), (select id from t_f where n = 4));
  select 'ALL PASSED' as result;
rollback;
```

`supabase/tests/0001_lumara_test.sql`:
- Replace the comment `-- admin (not Warden of record? he is) moves to vote; c votes 3 times, 4th rejected` with `-- admin moves to vote; c picks the thought once; a second pick of the same thought is refused`.
- Replace the line `select cast_vote(…); select cast_vote(…); select cast_vote(…);` with one `select cast_vote((select id from t_sess), (select id from t_frag));`.
- Replace the `'FAIL: 4th vote accepted'` line with:
```sql
  do $$ begin begin perform cast_vote((select id from t_sess), (select id from t_frag)); raise exception 'FAIL: picked the same thought twice'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $$;
```

- [ ] **Step 2: Write the migration** (`supabase/migrations/0007_picks_and_turns.sql`)
```sql
-- Vote as picks (feature 10): one pick per thought, no upper limit; votes_cast counts picks.
create or replace function cast_vote(p_session uuid, p_fragment uuid) returns void language plpgsql security definer set search_path = public as $$
declare v uuid; begin
  perform require_stage(p_session, array['vote']);
  if not exists (select 1 from fragments where id = p_fragment and session_id = p_session) then raise exception 'This thought is no longer available.'; end if;
  if exists (select 1 from vote_owners o join votes x on x.id = o.vote_id where o.user_id = auth.uid() and x.session_id = p_session and x.fragment_id = p_fragment) then raise exception 'You already picked this thought.'; end if;
  insert into votes(session_id, fragment_id) values (p_session, p_fragment) returning id into v;
  insert into vote_owners values (v, auth.uid(), p_session);
  update attendance set votes_cast = (select count(*) from vote_owners where user_id = auth.uid() and session_id = p_session) where session_id = p_session and user_id = auth.uid(); end $$;

-- Discuss turns (feature 3): the chosen player picks the thought for their turn — one of their own undiscussed picks,
-- or any undiscussed thought when none of their picks are left. Everything else about turns stays Warden-only (set_session).
create or replace function choose_turn_thought(p_session uuid, p_fragment uuid) returns void language plpgsql security definer set search_path = public as $$
declare s sessions; done jsonb; open_picks uuid[]; begin
  select * into s from sessions where id = p_session for update;
  if s.id is null or s.status <> 'active' or s.stage <> 'hall' then raise exception 'The retro has moved on. Your screen will follow the current stage.'; end if;
  if s.speaker is null or s.speaker->>'currentId' is distinct from auth.uid()::text or s.speaker->>'phase' is distinct from 'choosing' then raise exception 'It isn’t your turn to choose a thought.'; end if;
  if not exists (select 1 from fragments where id = p_fragment and session_id = p_session) then raise exception 'This thought is no longer available.'; end if;
  done := coalesce(s.speaker->'discussed', '[]'::jsonb);
  if done ? p_fragment::text then raise exception 'That thought was already discussed.'; end if;
  select array_agg(distinct x.fragment_id) into open_picks from vote_owners o join votes x on x.id = o.vote_id
    where o.user_id = auth.uid() and x.session_id = p_session and not (done ? x.fragment_id::text);
  if open_picks is not null and not (p_fragment = any(open_picks)) then raise exception 'Choose one of the thoughts you picked.'; end if;
  update sessions set speaker = speaker || jsonb_build_object('thoughtId', p_fragment::text, 'phase', 'discussing') where id = p_session; end $$;
revoke execute on function choose_turn_thought(uuid, uuid) from public, anon;
grant execute on function choose_turn_thought(uuid, uuid) to authenticated;
```

- [ ] **Step 3: Check it, without applying.** Ask Jay to run, in the SQL Editor, `begin;` + the migration body + the 0007 test body (between its `begin;` and `rollback;`) + `rollback;`. The pg_temp helpers go first, outside the transaction.
  - Expected: the run ends with `ALL PASSED` and nothing is saved.
  - Applying happens in R2-7, with the deploy.

- [ ] **Step 4:** `supabase/` is git-ignored, so there's nothing to commit. Add a ledger line.

---

### R2-2: Picks in both backends, the minimum, and voice lines

**Files:**
- Create: `interface/src/logic/picks.ts`, `interface/src/logic/picks.test.ts`
- Modify: `interface/src/backend/local.ts` (`castVote`), `interface/src/backend/local.test.ts`
- Modify: `interface/src/logic/chatter.ts`, `interface/src/logic/chatter.test.ts`

**Interfaces:**
- Produces:
  - `minPicks(thoughts: number): number`
  - `underPicked(party: Attendance[], thoughts: number): number`
  - `pickWarningText(under: number, min: number): string | null`
  - local `castVote` refuses a second pick of the same thought, with no cap.
  - `eventLine(id, 'vote')` skips lines that mention three votes.
- The Supabase backend's `castVote` is unchanged (the rule lives in the RPC).

- [ ] **Step 1: Write the failing tests**

`interface/src/logic/picks.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { minPicks, pickWarningText, underPicked } from './picks';

const att = (userId: string, votesCast: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast, characterId: null, checkinDone: true });
describe('picks', () => {
  it('asks for 3 picks, or every thought when fewer were written', () => {
    expect(minPicks(10)).toBe(3); expect(minPicks(2)).toBe(2); expect(minPicks(0)).toBe(0);
  });
  it('counts players under the minimum', () => {
    expect(underPicked([att('a', 3), att('b', 1), att('c', 0)], 5)).toBe(2);
    expect(underPicked([att('a', 2)], 2)).toBe(0);
  });
  it('warns the Warden, or not at all', () => {
    expect(pickWarningText(2, 3)).toBe('2 players picked fewer than 3 thoughts. Continue anyway?');
    expect(pickWarningText(1, 1)).toBe('1 player picked fewer than 1 thought. Continue anyway?');
    expect(pickWarningText(0, 3)).toBeNull(); expect(pickWarningText(2, 0)).toBeNull();
  });
});
```

In `interface/src/backend/local.test.ts`, delete the test `'supports three stacked votes and only removes the caller’s votes'` (stacking is gone) and add:
```ts
  it('picks: one per thought, no upper limit, un-pick works, votesCast counts picks', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Picks'); await ana.join(s.id); checkInEveryone(s.id);
    await jay.updateSession(s.id, { stage: 'fragment_drop' });
    const ids: string[] = []; for (const t of ['one', 'two', 'three', 'four']) ids.push((await jay.addFragment(s.id, t, 'spark')).id);
    await jay.updateSession(s.id, { stage: 'vote' });
    for (const fid of ids) await ana.castVote(s.id, fid);
    await expect(ana.castVote(s.id, ids[0])).rejects.toThrow('already picked');
    await ana.removeMyVote(s.id, ids[3]);
    expect((await ana.myVotes(s.id)).sort()).toEqual(ids.slice(0, 3).sort());
    let att: Attendance[] = []; jay.watchAttendance(s.id, a => att = a);
    expect(att.find(a => a.userId === 'ana')?.votesCast).toBe(3);
  });
```

In `interface/src/logic/chatter.test.ts`, replace `expect(eventLine('seren', 'vote')?.id).toBe('stage_vote');` with:
```ts
    expect(eventLine('seren', 'vote')).toBeUndefined();          // "You have 3 votes…" is no longer true
    expect(eventLine('mahesvara', 'vote')).toBeUndefined();      // "Three votes…"
    expect(eventLine('dax', 'vote')?.id).toBe('vote');           // still fits picking
```

- [ ] **Step 2: Run them and watch them fail.**
Run: `cd interface && npx vitest run src/logic/picks.test.ts src/backend/local.test.ts src/logic/chatter.test.ts`
Expected: FAIL. `picks` is missing, the 4th pick throws "all three votes", and eventLine returns `stage_vote`.

- [ ] **Step 3: Implement**

`interface/src/logic/picks.ts`:
```ts
import type { Attendance } from '../backend/types';

/** Picks each player should make at the Vote stage: 3, or every thought when fewer were written. */
export const minPicks = (thoughts: number) => Math.min(3, thoughts);
/** How many party members picked fewer than the minimum. */
export const underPicked = (party: Attendance[], thoughts: number) => party.filter(a => a.votesCast < minPicks(thoughts)).length;
/** The Warden's warning on Next stage at the Vote stage; null when everyone picked enough. */
export function pickWarningText(under: number, min: number): string | null {
  return under && min ? `${under} ${under === 1 ? 'player' : 'players'} picked fewer than ${min} ${min === 1 ? 'thought' : 'thoughts'}. Continue anyway?` : null;
}
```

`interface/src/backend/local.ts`: replace `castVote` with:
```ts
    async castVote(sid, fid) {
      const vote: Vote = { id: uid(), sessionId: sid, fragmentId: fid };
      await mutate(s => {
        const p = readPrivate(); const own = p.votes[sid] ||= [];
        requireStage(s, sid, ['vote']); if (!s.fragments.some(x => x.id === fid && x.sessionId === sid)) throw new Error('This thought is no longer available.');
        if (s.votes.some(x => x.fragmentId === fid && own.includes(x.id))) throw new Error('You already picked this thought.');
        s.votes.push(vote); own.push(vote.id); s.attendance.find(x => x.sessionId === sid && x.userId === id)!.votesCast = own.length;
        writePrivate(p);
      });
    },
```

`interface/src/logic/chatter.ts`: replace `eventLine` with:
```ts
// Picks have no cap now: lines about "three votes" would be wrong at the Vote stage.
const OUTDATED_VOTE = /\bthree\b|\b3 votes\b/i;
export function eventLine(characterId: string, moment: RetroMoment): VoiceLine | undefined {
  const lines = (VOICE_LINES[characterId] || []).filter(l => moment !== 'vote' || !OUTDATED_VOTE.test(l.text));
  return MOMENT_IDS[moment].map(id => lines.find(l => l.id === id)).find(Boolean);
}
```

- [ ] **Step 4: Run the tests and watch them pass.** Run `cd interface && npx tsc --noEmit -p . && npx vitest run`. Expected: all green.
- [ ] **Step 5: Commit**
```bash
git add interface/src
git commit -m "Game: votes become picks (one per thought, no cap) in the demo backend; minimum-picks helpers; no 'three votes' lines at the Vote stage"
```

---

### R2-3: Vote board as picks, the Next warning, and copy

**Files:**
- Modify: `interface/src/components/VoteBoard.tsx`, `VoteBoard.test.tsx`, `vote-board.css`
- Modify: `interface/src/components/VoyageHud.tsx`, `VoyageHud.test.tsx`
- Modify: `interface/src/logic/voyage.ts` (briefing copy)
- Modify: `interface/src/components/AdminSettings.tsx` (label)
- Modify: `interface/src/screens.tsx` (pass `nextWarning` at the Vote stage)

**Interfaces:**
- Consumes: `minPicks`, `underPicked`, `pickWarningText` (R2-2).
- Produces:
  - `VoyageHud` prop `nextWarning?: { title: string; text: string; stay: string; go: string } | null`. Task 10 uses it for Finish.
  - `VoteBoard` keeps its props `{ fragments, votes, ownVotes, busy, onVote, onUnvote }`.

- [ ] **Step 1: Write the failing tests**

`interface/src/components/VoteBoard.test.tsx`: keep the header (imports, `frag`, `FRAGMENTS`, `render`, `card`) and replace the `describe` block with:
```tsx
describe('VoteBoard', () => {
  it('shows progress toward 3 picks', async () => {
    const { el } = await render({ ownVotes: ['b'] });
    expect(el.querySelectorAll('.vb-hand .vb-orb').length).toBe(3);
    expect(el.querySelectorAll('.vb-hand .vb-orb.spent').length).toBe(2);
    expect(el.querySelector('.vb-hand')?.getAttribute('aria-label')).toBe('You picked 1 of at least 3');
  });
  it('asks for every thought when fewer than 3 were written', async () => {
    const { el } = await render({ fragments: FRAGMENTS.slice(0, 2) });
    expect(el.querySelectorAll('.vb-hand .vb-orb').length).toBe(2);
    expect(el.textContent).toContain('Pick at least 2');
  });
  it('picks and un-picks a thought', async () => {
    const { el, props } = await render({ ownVotes: ['a'] });
    await act(async () => card(el, 'b').querySelector<HTMLButtonElement>('.vb-give')!.click());
    expect(props.onVote).toHaveBeenCalledWith('b');
    const picked = card(el, 'a').querySelector<HTMLButtonElement>('.vb-give')!;
    expect(picked.getAttribute('aria-pressed')).toBe('true'); expect(picked.textContent).toContain('Picked');
    await act(async () => picked.click());
    expect(props.onUnvote).toHaveBeenCalledWith('a');
  });
  it('has no upper limit', async () => {
    const { el } = await render({ ownVotes: ['a', 'b'], fragments: [...FRAGMENTS, frag('d', 'spark'), frag('e', 'spark')] });
    expect(card(el, 'c').querySelector<HTMLButtonElement>('.vb-give')!.disabled).toBe(false);
    const more = await render({ ownVotes: ['a', 'b', 'c', 'd'], fragments: [...FRAGMENTS, frag('d', 'spark'), frag('e', 'spark')] });
    expect(more.el.querySelector('.vb-extra')?.textContent).toBe('+1');
  });
  it('shows how many players picked each thought', async () => {
    const votes: Vote[] = [{ id: '1', sessionId: 's1', fragmentId: 'b' }, { id: '2', sessionId: 's1', fragmentId: 'b' }];
    const { el } = await render({ votes });
    expect(card(el, 'b').querySelector('.vb-count')?.textContent).toBe('2 picks');
  });
  it('says picks stay private until you are chosen to speak', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Your picks stay private until you’re chosen to speak');
  });
  it('filters by crystal, with counts', async () => {
    const { el } = await render();
    const fracture = [...el.querySelectorAll<HTMLButtonElement>('.vb-filter button')].find(b => b.textContent?.includes('Fracture'))!;
    expect(fracture.textContent).toContain('2');
    await act(async () => fracture.click());
    expect(el.querySelectorAll('[data-fragment]').length).toBe(2);
  });
  it('invites the Warden back when there is nothing to vote on', async () => {
    const { el } = await render({ fragments: [] });
    expect(el.textContent).toContain('No thoughts to vote on yet');
  });
});
```

Append to `interface/src/components/VoyageHud.test.tsx`:
```tsx
  it('warns before Next when given a warning, and can still continue', async () => {
    const nextWarning = { title: 'Move on to Discuss?', text: '2 players picked fewer than 3 thoughts. Continue anyway?', stay: 'Keep voting', go: 'Continue anyway' };
    const { el, props } = await render({ nextWarning });
    await act(async () => button(el, 'Next stage')!.click());
    expect(props.onNext).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alertdialog"]')?.textContent).toContain('2 players picked fewer than 3');
    await act(async () => button(el, 'Keep voting')!.click());
    expect(el.querySelector('[role="alertdialog"]')).toBeNull();
    await act(async () => button(el, 'Next stage')!.click());
    await act(async () => button(el, 'Continue anyway')!.click());
    expect(props.onNext).toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run them and watch them fail.**
Run: `cd interface && npx vitest run src/components/VoteBoard.test.tsx src/components/VoyageHud.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`VoteBoard.tsx`:
- Imports: `import { Check, Plus } from 'lucide-react';` and `import { minPicks } from '../logic/picks';`. Drop `Star` and `MAX`.
- Doc comment: `/** Starlight Vote: pick the thoughts you want to discuss — at least minPicks, no upper limit. Picks stay private until you're chosen to speak. */`
- In the component:
```tsx
  const [filter, setFilter] = useState<FragmentCategory | 'all'>('all');
  const min = minPicks(fragments.length); const picked = ownVotes.length;
```
- Header:
```tsx
    <header className="vb-head">
      <div>
        <h3>Pick what you want to talk about</h3>
        <p>Pick at least {min}. Your picks stay private until you’re chosen to speak. Then you choose one to discuss.</p>
      </div>
      <div className="vb-hand" role="img" aria-label={`You picked ${picked} of at least ${min}`}>
        {Array.from({ length: min }, (_, i) => <i key={i} className={`vb-orb ${i < picked ? '' : 'spent'}`}><Check size={18} strokeWidth={2} /></i>)}
        {picked > min && <span className="vb-extra">+{picked - min}</span>}
      </div>
    </header>
```
- Each card's footer:
```tsx
        const total = votes.filter(v => v.fragmentId === f.id).length;
        const mine = ownVotes.includes(f.id);
        …
          <footer>
            <span className="vb-count">{total} {total === 1 ? 'pick' : 'picks'}</span>
            <button className={`vb-give ${mine ? 'on' : ''}`} aria-pressed={mine} disabled={busy} onClick={() => mine ? onUnvote(f.id) : onVote(f.id)}>{mine ? <><Check size={15} />Picked</> : <><Plus size={15} />Pick</>}</button>
          </footer>
```
- `className={`vb-card ${mine ? 'chosen' : ''}`}` stays.

`vote-board.css` (append):
```css
.vb-extra{align-self:center;font:600 15px Marcellus,serif;color:#f5d27a}
.vb-count{font-size:12.5px;color:#b9c6d2}
.vb-give.on{color:#fff4dc;background:#1b3043;border-color:#e9cf8f}
```
Remove the now-unused `.vb-stars`, `.vb-star` and `button.vb-star` rules, along with their entries in the focus and reduced-motion lists.

`VoyageHud.tsx`:
- Add the prop `nextWarning?: { title: string; text: string; stay: string; go: string } | null` and `const [warning, setWarning] = useState(false);`.
- The Next button's onClick becomes `() => nextWarning ? setWarning(true) : onNext()`.
- After the cancel confirm, add:
```tsx
    {warden && warning && nextWarning && <div className="voyage-confirm" role="alertdialog" aria-modal="true" aria-labelledby="voyage-next-title">
      <h3 id="voyage-next-title">{nextWarning.title}</h3><p>{nextWarning.text}</p>
      <div><button autoFocus onClick={() => setWarning(false)}>{nextWarning.stay}</button><button disabled={busy} onClick={() => { setWarning(false); onNext(); }}>{nextWarning.go}</button></div>
    </div>}
```

`logic/voyage.ts`, `VOYAGE_BRIEFING`:
- `vote.text` becomes `'Pick at least 3 thoughts you want to discuss. Your picks stay private until you’re chosen to speak.'`
- `hall.text` becomes `'The Warden spins for a speaker. They choose one of their picks, the party discusses it, and it becomes a Vow.'`
- `vow_altar.text` becomes `'Review the Vows made in Discuss and add any that are missing.'`

`AdminSettings.tsx`: in `STARLIGHT`, `perVote: 'Each vote cast'` becomes `perVote: 'Each thought picked'`.

`screens.tsx` `RetroScreen`: after `const brief = …`, add
```tsx
  const pickWarning = pickWarningText(underPicked(attendance, fragments.length), minPicks(fragments.length));
```
and pass this to `VoyageHud`:
```tsx
      nextWarning={session.stage === 'vote' && pickWarning ? { title: 'Move on to Discuss?', text: pickWarning, stay: 'Keep voting', go: 'Continue anyway' } : null}
```
Import `minPicks`, `pickWarningText` and `underPicked` from `./logic/picks`.

- [ ] **Step 4: Run the tests and watch them pass.** Run `cd interface && npx tsc --noEmit -p . && npx vitest run`. Expected: all green. If another test reads the old briefing or board copy, update it to the new copy.
- [ ] **Step 5: Browser check.**
  1. Use the local demo with two tabs at the Vote stage.
  2. Pick 4 thoughts, then un-pick one. A second pick on the same card isn't possible: the button toggles.
  3. With one player under 3, the Warden gets the warning, and both buttons work.
  4. Take a screenshot.
- [ ] **Step 6: Commit**
```bash
git add interface/src
git commit -m "Game: Vote board as picks (at least 3, no cap, private until chosen); Warden warned when someone picked fewer"
```

---

### R2-4: Turn rules, choosing a thought, and the `speaker` cue (replaces Task 11)

**Files:**
- Create: `interface/src/logic/speaker.ts`, `interface/src/logic/speaker.test.ts`
- Modify: `interface/src/backend/types.ts`, `local.ts`, `supabase.ts`, `supabaseRows.ts`
- Test: `local.test.ts`, `supabase.test.ts`, `supabaseRows.test.ts`
- Fix any `SpeakerState` literal that tsc flags.

**Interfaces:**
- Consumes: the RPC `choose_turn_thought(p_session, p_fragment)` (R2-1) and `Session.speaker` (Task 3).
- Produces:
  - `TurnPhase = 'choosing' | 'discussing' | 'vow'`.
  - `SpeakerState = { currentId; spoken; skipped; thoughtId: string | null; phase: TurnPhase | null; discussed: string[] }`.
  - `Backend.chooseTurnThought(sessionId: string, fragmentId: string): Promise<void>`.
  - `CueTopic` gets `'speaker'`, with payload `{ sessionId: string; frames: UserId[] }`.
  - From `logic/speaker.ts`:
    - `NO_SPEAKER`
    - `speakerMark(s, id)`, `speakerPool(party, s)`
    - `spinSpeaker(party, s, rng?)` (phase becomes `'choosing'`)
    - `startVow(s)`, `finishTurn(s)`
    - `skipSpeaker(s, id)`, `addBack(s, id)`
    - `speakerCounts(party, s)`
    - `reelFrames(party, pickedId, rng?, length?)`
    - `turnChoices(fragments, ownPicks, discussed): Fragment[]`

- [ ] **Step 1: Write the failing tests**

`interface/src/logic/speaker.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Fragment } from '../backend/types';
import { addBack, finishTurn, NO_SPEAKER, reelFrames, skipSpeaker, speakerCounts, speakerMark, speakerPool, spinSpeaker, startVow, turnChoices } from './speaker';

const party = ['a', 'b', 'c'];
const seq = (...xs: number[]) => () => xs.shift() ?? 0;
const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: id, category: 'spark', createdAt });
describe('turns', () => {
  it('spin starts a choosing turn for a waiting player; nobody gets two turns', () => {
    let s = spinSpeaker(party, null, seq(0))!;
    expect(s).toMatchObject({ currentId: 'a', phase: 'choosing', thoughtId: null });
    s = finishTurn(startVow({ ...s, thoughtId: 'f1', phase: 'discussing' }));
    expect(s).toEqual({ currentId: null, spoken: ['a'], skipped: [], thoughtId: null, phase: null, discussed: ['f1'] });
    s = finishTurn(spinSpeaker(party, s, seq(0))!); s = finishTurn(spinSpeaker(party, s, seq(0))!);
    expect(s.spoken).toEqual(['a', 'b', 'c']); expect(spinSpeaker(party, s)).toBeNull();
  });
  it('spin again while choosing picks someone else; the first goes back to waiting', () => {
    const again = spinSpeaker(party, spinSpeaker(party, null, seq(0))!, seq(0))!;
    expect(again.currentId).toBe('b'); expect(speakerMark(again, 'a')).toBe('waiting');
  });
  it('startVow moves a discussing turn to the Vow box', () => {
    expect(startVow({ ...NO_SPEAKER, currentId: 'a', thoughtId: 'f1', phase: 'discussing' }).phase).toBe('vow');
  });
  it('skipping the current speaker clears their turn and thought; skipped players are never picked', () => {
    const s = skipSpeaker({ ...NO_SPEAKER, currentId: 'b', thoughtId: 'f1', phase: 'discussing' }, 'b');
    expect(s).toMatchObject({ currentId: null, thoughtId: null, phase: null, skipped: ['b'] });
    expect(speakerPool(party, s)).toEqual(['a', 'c']);
    expect(speakerPool(party, addBack(s, 'b'))).toEqual(['a', 'b', 'c']);
  });
  it('counts over the current party (removed players drop out)', () => {
    expect(speakerCounts(party, { ...NO_SPEAKER, currentId: 'b', spoken: ['a', 'gone'], skipped: ['c'] })).toEqual({ spoken: 1, remaining: 1 });
  });
  it('builds a reel that lands on the pick', () => {
    const f = reelFrames(party, 'c', seq(0.1, 0.5, 0.9), 6);
    expect(f).toHaveLength(6); expect(f.at(-1)).toBe('c');
  });
  it('offers the chooser their own undiscussed picks, oldest first; else every undiscussed thought', () => {
    const fs = [frag('f3', 3), frag('f1', 1), frag('f2', 2)];
    expect(turnChoices(fs, ['f2', 'f3'], []).map(f => f.id)).toEqual(['f2', 'f3']);
    expect(turnChoices(fs, ['f2', 'f3'], ['f2', 'f3']).map(f => f.id)).toEqual(['f1']);
    expect(turnChoices(fs, [], ['f1']).map(f => f.id)).toEqual(['f2', 'f3']);
  });
});
```

Append to `local.test.ts`. Add `import { NO_SPEAKER } from '../logic/speaker';` and `SpeakerState` to the types import.
```ts
  it('turns: only the chosen player chooses, from their own undiscussed picks, with a fallback', async () => {
    const jay = createLocalBackend('jay'), ana = createLocalBackend('ana');
    const s = await jay.createSession('Turns'); await ana.join(s.id); checkInEveryone(s.id);
    await jay.updateSession(s.id, { stage: 'fragment_drop' });
    const f1 = (await jay.addFragment(s.id, 'one', 'spark')).id, f2 = (await jay.addFragment(s.id, 'two', 'spark')).id, f3 = (await jay.addFragment(s.id, 'three', 'spark')).id;
    await jay.updateSession(s.id, { stage: 'vote' }); await ana.castVote(s.id, f1); await ana.castVote(s.id, f2);
    await jay.updateSession(s.id, { stage: 'hall' });
    const turn = (patch: Partial<SpeakerState> = {}) => jay.updateSession(s.id, { speaker: { ...NO_SPEAKER, currentId: 'ana', phase: 'choosing', ...patch } });
    await turn();
    await expect(jay.chooseTurnThought(s.id, f1)).rejects.toThrow('your turn');
    await expect(ana.chooseTurnThought(s.id, f3)).rejects.toThrow('you picked');
    await ana.chooseTurnThought(s.id, f1);
    let now: Session | null = null; jay.watchActiveSession(x => now = x);
    expect((now as Session | null)?.speaker).toMatchObject({ thoughtId: f1, phase: 'discussing' });
    await expect(ana.chooseTurnThought(s.id, f2)).rejects.toThrow('your turn');   // already discussing
    await turn({ discussed: [f1] }); await expect(ana.chooseTurnThought(s.id, f1)).rejects.toThrow('already discussed');
    await turn({ discussed: [f1, f2] }); await ana.chooseTurnThought(s.id, f3);   // none of her picks left: any undiscussed thought
  });
  it('reads a speaker saved before turns had thoughts as an empty turn state', async () => {
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ sessions: [{ id: 'old', sprintName: 'Old', stage: 'hall', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1, partyLocked: false, speaker: { currentId: 'ana', spoken: [], skipped: [] } }], attendance: [], fragments: [], votes: [], vows: [], players: [] }));
    let s: Session | null = null; createLocalBackend('jay').watchActiveSession(x => s = x);
    expect((s as Session | null)?.speaker).toEqual({ currentId: 'ana', spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [] });
  });
```

Append to `supabase.test.ts`, in `describe('supabase writes and sign-in', …)`:
```ts
  it('chooseTurnThought calls choose_turn_thought', async () => {
    const f = fakeClient({}); await createSupabaseBackend(f.client, me).chooseTurnThought('s1', 'f1');
    expect(f.client.rpc).toHaveBeenCalledWith('choose_turn_thought', { p_session: 's1', p_fragment: 'f1' });
  });
  it('delivers the speaker cue to its own listeners', async () => {
    const f = fakeClient({}); const b = createSupabaseBackend(f.client, me);
    const got = vi.fn(); b.on('speaker', got); b.emit('speaker', { sessionId: 's1', frames: ['u1'] });
    expect(got).toHaveBeenCalledWith({ sessionId: 's1', frames: ['u1'] }, 'u1');
  });
```
Append to `supabaseRows.test.ts`:
```ts
  it('fills turn fields missing from an older speaker', () => {
    expect(toSession({ id: 's', sprint_name: 'S', stage: 'hall', status: 'active', warden_id: 'w', created_at: 1, speaker: { currentId: 'u1', spoken: [], skipped: [] } }).speaker)
      .toEqual({ currentId: 'u1', spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [] });
  });
```

- [ ] **Step 2: Run them and watch them fail.** Expected: FAIL (`speaker` module missing, `chooseTurnThought` missing, speaker not normalized).

- [ ] **Step 3: Implement**

`types.ts`:
- Replace the `SpeakerState` interface with:
```ts
/** Resonance Hall turns (feature 3): spin → the chosen player chooses a thought → discuss → the Warden's Vow box. */
export type TurnPhase = 'choosing' | 'discussing' | 'vow';
export interface SpeakerState { currentId: UserId | null; spoken: UserId[]; skipped: UserId[]; /** The thought the current speaker chose. */ thoughtId: string | null; phase: TurnPhase | null; /** Thoughts already discussed this voyage. */ discussed: string[] }
```
- `CueTopic` adds `| 'speaker'`.
- `Backend` (after `removePlayer`):
```ts
  /** The chosen speaker only: the thought for their turn (one of their own undiscussed picks, or any undiscussed thought when none are left). */
  chooseTurnThought(sessionId: string, fragmentId: string): Promise<void>;
```

`logic/speaker.ts`:
```ts
import type { Fragment, SpeakerState, UserId } from '../backend/types';

export const NO_SPEAKER: SpeakerState = { currentId: null, spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [] };
export type SpeakerMark = 'speaking' | 'spoken' | 'skipped' | 'waiting';
export function speakerMark(s: SpeakerState | null, id: UserId): SpeakerMark {
  return s?.currentId === id ? 'speaking' : s?.spoken.includes(id) ? 'spoken' : s?.skipped.includes(id) ? 'skipped' : 'waiting';
}
/** Who a spin can pick: current party members who haven't spoken, aren't skipped, and aren't speaking now. */
export const speakerPool = (party: UserId[], s: SpeakerState | null) => party.filter(id => speakerMark(s, id) === 'waiting');
/** Spin (or "Spin again" while the chosen player is still choosing): a waiting player starts choosing. Null when nobody is left. */
export function spinSpeaker(party: UserId[], s: SpeakerState | null, rng = Math.random): SpeakerState | null {
  const pool = speakerPool(party, s); if (!pool.length) return null;
  return { ...(s ?? NO_SPEAKER), currentId: pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))], thoughtId: null, phase: 'choosing' };
}
/** "Done discussing": the Warden's Vow box opens. */
export const startVow = (s: SpeakerState): SpeakerState => ({ ...s, phase: 'vow' });
/** "Make Vow" or "Skip": the turn ends — the speaker has spoken and their thought is discussed. */
export function finishTurn(s: SpeakerState | null): SpeakerState {
  const b = s ?? NO_SPEAKER; if (!b.currentId) return b;
  return { currentId: null, spoken: [...b.spoken, b.currentId], skipped: b.skipped, thoughtId: null, phase: null,
    discussed: b.thoughtId && !b.discussed.includes(b.thoughtId) ? [...b.discussed, b.thoughtId] : b.discussed };
}
/** "Skip": take an absent player out of the pool (ends their turn, thought and all, if they were chosen). */
export function skipSpeaker(s: SpeakerState | null, id: UserId): SpeakerState {
  const b = s ?? NO_SPEAKER; const cur = b.currentId === id;
  return { ...b, currentId: cur ? null : b.currentId, thoughtId: cur ? null : b.thoughtId, phase: cur ? null : b.phase, skipped: b.skipped.includes(id) ? b.skipped : [...b.skipped, id] };
}
export const addBack = (s: SpeakerState | null, id: UserId): SpeakerState => { const b = s ?? NO_SPEAKER; return { ...b, skipped: b.skipped.filter(x => x !== id) }; };
/** "Spoken N · Remaining M" over the current party (speaking now counts as remaining). */
export function speakerCounts(party: UserId[], s: SpeakerState | null) {
  const marks = party.map(id => speakerMark(s, id));
  return { spoken: marks.filter(m => m === 'spoken').length, remaining: marks.filter(m => m === 'waiting' || m === 'speaking').length };
}
/** Portraits the roulette shows on every screen, ending on the pick. */
export function reelFrames(party: UserId[], pickedId: UserId, rng = Math.random, length = 14): UserId[] {
  return [...Array.from({ length: length - 1 }, () => party[Math.min(party.length - 1, Math.floor(rng() * party.length))]), pickedId];
}
/** What the chosen player may choose: their own undiscussed picks, or every undiscussed thought when none are left. Oldest first — no counts, no ranking. */
export function turnChoices(fragments: Fragment[], ownPicks: string[], discussed: string[]): Fragment[] {
  const open = fragments.filter(f => !discussed.includes(f.id)).sort((a, b) => a.createdAt - b.createdAt);
  const mine = open.filter(f => ownPicks.includes(f.id));
  return mine.length ? mine : open;
}
```

`supabaseRows.ts` `toSession`: replace `speaker: r.speaker ?? null` with:
```ts
speaker: r.speaker ? { thoughtId: null, phase: null, discussed: [], ...r.speaker } : null
```

`supabase.ts`:
- `openLive` cue list becomes `(['pull_reveal', 'reaction', 'stage_cue', 'skill', 'say', 'speaker'] as const)`.
- Add to the writes: `chooseTurnThought: async (sid, fid) => { await call('choose_turn_thought', { p_session: sid, p_fragment: fid }); },`

`local.ts`:
- `read()`: the sessions map becomes
```ts
copy.sessions = copy.sessions.map(x => ({ ...x, partyLocked: x.partyLocked ?? false, speaker: x.speaker ? { thoughtId: null, phase: null, discussed: [], ...x.speaker } : null }));
```
- After `removePlayer`, add:
```ts
    async chooseTurnThought(sid, fid) {
      await mutate(s => {
        const session = s.sessions.find(x => x.id === sid);
        if (!session || session.status !== 'active' || session.stage !== 'hall') throw new Error('The retro has moved on. Your screen will follow the current stage.');
        const sp = session.speaker;
        if (!sp || sp.currentId !== id || sp.phase !== 'choosing') throw new Error('It isn’t your turn to choose a thought.');
        if (!s.fragments.some(x => x.id === fid && x.sessionId === sid)) throw new Error('This thought is no longer available.');
        if (sp.discussed.includes(fid)) throw new Error('That thought was already discussed.');
        const own = readPrivate().votes[sid] ?? [];
        const openPicks = s.votes.filter(v => v.sessionId === sid && own.includes(v.id) && !sp.discussed.includes(v.fragmentId)).map(v => v.fragmentId);
        if (openPicks.length && !openPicks.includes(fid)) throw new Error('Choose one of the thoughts you picked.');
        session.speaker = { ...sp, thoughtId: fid, phase: 'discussing' };
      });
    },
```

`dev/vowReviewPreview.tsx`: add `chooseTurnThought: unsupported,`.

- [ ] **Step 4: Run the tests and watch them pass.** Run `cd interface && npx tsc --noEmit -p . && npx vitest run`. Expected: all green.
- [ ] **Step 5: Commit**
```bash
git add interface/src
git commit -m "Game: Discuss turn rules (spin, choose a thought, discuss, Vow) and chooseTurnThought in both backends; live 'speaker' cue"
```

---

### R2-5: Discuss stage UI (replaces Task 12)

**Files:**
- Create: `interface/src/components/DiscussStage.tsx`, `DiscussStage.test.tsx`
- Create: `interface/src/components/SpeakerPanel.tsx`, `SpeakerPanel.test.tsx`
- Create: `interface/src/components/TurnVowBox.tsx`
- Create: `interface/src/components/SpeakerReel.tsx`, `SpeakerReel.test.tsx`
- Create: `interface/src/components/speaker.css`
- Modify: `interface/src/components/Scene.tsx`, `Scene.test.tsx` (`speakerId`: spotlight + the chosen player walks to the beacon)
- Modify: `interface/src/screens.tsx` (the hall block becomes `DiscussStage`; the reveal controls and their now-unused helpers and imports are removed)

**Interfaces:**
- Consumes: everything from `logic/speaker.ts` (R2-4), `backend.chooseTurnThought`, `addVow`, `updateSession({ speaker })`, `emit/on('speaker')`.
- Produces:
  - `DiscussStage({ speaker, meId, warden, busy, party, fragments, ownPicks, vows, onSpeaker(next, frames?), onChoose(fragmentId), onMakeVow(text, ownerId), onTimer() })`
  - `SpeakerPanel({ party, speaker, warden, busy, onChange })` and `type SpeakerMember = { userId; name; characterId }`
  - `TurnVowBox({ thought, party, busy, onMake, onSkip })`
  - `SpeakerReel({ backend, sessionId, party })`
  - `Scene` prop `speakerId?: string | null`

- [ ] **Step 1: Write the failing tests**

`DiscussStage.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Fragment, SpeakerState } from '../backend/types';
import { NO_SPEAKER } from '../logic/speaker';
import DiscussStage from './DiscussStage';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const party = [{ userId: 'jay', name: 'Jay', characterId: null }, { userId: 'ana', name: 'Ana', characterId: 'wren' }];
const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: `Thought ${id}`, category: 'spark', createdAt });
const fragments = [frag('f1', 1), frag('f2', 2), frag('f3', 3)];
const turn = (p: Partial<SpeakerState>): SpeakerState => ({ ...NO_SPEAKER, ...p });
async function render(p: Partial<Parameters<typeof DiscussStage>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { speaker: null, meId: 'jay', warden: true, busy: false, party, fragments, ownPicks: [] as string[], vows: [], onSpeaker: vi.fn(), onChoose: vi.fn(), onMakeVow: vi.fn(), onTimer: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<DiscussStage {...props} />));
  return { el, props };
}
const btn = (el: HTMLElement, text: string) => [...el.querySelectorAll('button')].find(b => b.textContent === text);
describe('DiscussStage', () => {
  it('lets the Warden spin: a player starts choosing and every screen gets the same reel', async () => {
    const { el, props } = await render();
    await act(async () => btn(el, 'Spin')!.click());
    const [next, frames] = props.onSpeaker.mock.calls[0];
    expect(next.phase).toBe('choosing'); expect(['jay', 'ana']).toContain(next.currentId); expect(frames.at(-1)).toBe(next.currentId);
  });
  it('shows the chosen player only their own undiscussed picks, with no counts', async () => {
    const { el, props } = await render({ meId: 'ana', warden: false, speaker: turn({ currentId: 'ana', phase: 'choosing', discussed: ['f1'] }), ownPicks: ['f1', 'f2'] });
    const choices = [...el.querySelectorAll('.turn-chooser li button')];
    expect(choices.map(b => b.textContent)).toEqual(['SparkThought f2']);
    expect(el.querySelector('.turn-chooser')?.textContent).not.toMatch(/\d+ (pick|vote)/);
    await act(async () => (choices[0] as HTMLButtonElement).click());
    expect(props.onChoose).toHaveBeenCalledWith('f2');
  });
  it('falls back to any undiscussed thought when none of their picks are left', async () => {
    const { el } = await render({ meId: 'ana', warden: false, speaker: turn({ currentId: 'ana', phase: 'choosing', discussed: ['f1'] }), ownPicks: ['f1'] });
    expect(el.querySelectorAll('.turn-chooser li').length).toBe(2);
    expect(el.textContent).toContain('None of your picks are left');
  });
  it('tells everyone else who is choosing, and lets the Warden spin again', async () => {
    const { el } = await render({ speaker: turn({ currentId: 'ana', phase: 'choosing' }) });
    expect(el.textContent).toContain('Ana is choosing a thought…');
    expect(btn(el, 'Spin again')).toBeTruthy();
  });
  it('shows the chosen thought to everyone; the Warden ends the discussion', async () => {
    const { el, props } = await render({ speaker: turn({ currentId: 'ana', phase: 'discussing', thoughtId: 'f2' }) });
    expect(el.querySelector('.turn-thought')?.textContent).toContain('Thought f2');
    await act(async () => btn(el, 'Done discussing')!.click());
    expect(props.onSpeaker).toHaveBeenCalledWith(expect.objectContaining({ phase: 'vow', thoughtId: 'f2' }));
  });
  it('opens the Warden’s Vow box pre-filled; Make Vow or Skip ends the turn', async () => {
    const speaker = turn({ currentId: 'ana', phase: 'vow', thoughtId: 'f2' });
    const { el, props } = await render({ speaker });
    expect(el.querySelector('textarea')?.value).toBe('Thought f2');
    await act(async () => btn(el, 'Make Vow')!.click());
    expect(props.onMakeVow).toHaveBeenCalledWith('Thought f2', null);
    await act(async () => btn(el, 'Skip')!.click());
    expect(props.onSpeaker).toHaveBeenCalledWith(expect.objectContaining({ currentId: null, spoken: ['ana'], discussed: ['f2'] }));
  });
  it('tells players the Warden is writing a Vow', async () => {
    const { el } = await render({ warden: false, speaker: turn({ currentId: 'ana', phase: 'vow', thoughtId: 'f2' }) });
    expect(el.textContent).toContain('The Warden is writing a Vow…');
    expect(el.querySelector('textarea')).toBeNull();
  });
});
```
The test's `btn(el, 'Skip')` must not match a SpeakerPanel "Skip" button. The panel's per-member buttons have text "Skip", so give the Vow box's skip button the text `Skip this Vow`, and in that test use `btn(el, 'Skip this Vow')`. Use this test line:
```tsx
    await act(async () => btn(el, 'Skip this Vow')!.click());
```

`SpeakerPanel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SpeakerState } from '../backend/types';
import { NO_SPEAKER } from '../logic/speaker';
import SpeakerPanel from './SpeakerPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
async function render(speaker: SpeakerState | null, warden = true) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onChange = vi.fn();
  await act(async () => createRoot(el).render(<SpeakerPanel party={party} speaker={speaker} warden={warden} busy={false} onChange={onChange} />));
  return { el, onChange };
}
describe('SpeakerPanel', () => {
  it('tracks spoken and remaining', async () => {
    const { el } = await render({ ...NO_SPEAKER, currentId: 'b', spoken: ['a'] }, false);
    expect(el.textContent).toContain('Spoken 1 · Remaining 1');
    expect(el.querySelector('button')).toBeNull();
  });
  it('lets the Warden skip and add back', async () => {
    const { el, onChange } = await render({ ...NO_SPEAKER, skipped: ['b'] });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Add Bob back"]')!.click());
    expect(onChange).toHaveBeenCalledWith({ ...NO_SPEAKER });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Skip Ana"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_SPEAKER, skipped: ['b', 'a'] });
  });
});
```

`SpeakerReel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../backend/local';
import SpeakerReel from './SpeakerReel';

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });
describe('SpeakerReel', () => {
  it('plays the same reel on every screen and lands on the pick', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} close() {} });
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const backend = createLocalBackend('jay');
    const el = document.createElement('div'); document.body.append(el);
    const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
    await act(async () => createRoot(el).render(<SpeakerReel backend={backend} sessionId="s1" party={party} />));
    await act(async () => backend.emit('speaker', { sessionId: 'other', frames: ['a'] }));
    expect(el.textContent).toBe('');
    await act(async () => backend.emit('speaker', { sessionId: 's1', frames: ['a', 'b', 'a', 'b'] }));
    // Each frame's timeout is scheduled by an effect after the previous render, so advance in small steps.
    const advance = async (ms: number) => { for (let t = 0; t < ms; t += 50) await act(async () => { vi.advanceTimersByTime(50); }); };
    await advance(1000);
    expect(el.querySelector('.speaker-reel.landed')?.textContent).toContain('Bob');
    await advance(2000);
    expect(el.textContent).toBe('');
  });
});
```

`Scene.test.tsx`:
- Extend `render`'s `extra` with `speakerId?: string | null`, and hold it in `let speakerId = extra.speakerId ?? null;`.
- Pass `speakerId={speakerId}` to `<Scene>` in `draw`.
- Add `speak: (id: string | null) => act(async () => { speakerId = id; draw(extra.stage); })` to the returned object.
- Then add:
```tsx
describe('speaker turns', () => {
  it('spotlights the chosen speaker and walks them to the beacon', async () => {
    const el = await render('wren', { stage: 'hall' });
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeNull();
    const before = posOf(el);
    await el.speak('jay'); await run(1500);
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeTruthy();
    const after = posOf(el); const goal = { x: MAP.beacon.x, y: MAP.beacon.y + 0.06 };
    expect(Math.hypot(after.x - goal.x, after.y - goal.y)).toBeLessThan(Math.hypot(before.x - goal.x, before.y - goal.y));
  });
});
```

- [ ] **Step 2: Run them and watch them fail.** Expected: FAIL (modules missing; no spotlight).

- [ ] **Step 3: Implement**

`SpeakerPanel.tsx`:
```tsx
import type { SpeakerState, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { addBack, skipSpeaker, speakerCounts, speakerMark, type SpeakerMark } from '../logic/speaker';
import { Art } from './ui';
import './speaker.css';

export type SpeakerMember = { userId: UserId; name: string; characterId: string | null };
const MARK: Record<SpeakerMark, string> = { speaking: 'Speaking', spoken: 'Spoken', skipped: 'Skipped', waiting: 'Waiting' };
/** The party's turns: who has spoken, who is waiting, who was skipped. The Warden can skip an absent player or add them back. */
export default function SpeakerPanel({ party, speaker, warden, busy, onChange }: { party: SpeakerMember[]; speaker: SpeakerState | null; warden: boolean; busy: boolean; onChange: (next: SpeakerState) => void }) {
  const { spoken, remaining } = speakerCounts(party.map(p => p.userId), speaker);
  return <section className="speaker-panel" aria-label="Speaker turns">
    <header><h4>Speaker turns</h4><p>Spoken {spoken} · Remaining {remaining}</p></header>
    <ul>{party.map(m => { const mark = speakerMark(speaker, m.userId); return <li key={m.userId} className={`mark-${mark}`}>
      <Art character={characterById(m.characterId)} kind="cutout" decorative /><span>{m.name}</span><small>{MARK[mark]}</small>
      {warden && (mark === 'waiting' || mark === 'speaking') && <button disabled={busy} aria-label={`Skip ${m.name}`} onClick={() => onChange(skipSpeaker(speaker, m.userId))}>Skip</button>}
      {warden && mark === 'skipped' && <button disabled={busy} aria-label={`Add ${m.name} back`} onClick={() => onChange(addBack(speaker, m.userId))}>Add back</button>}
    </li>; })}</ul>
  </section>;
}
```

`TurnVowBox.tsx`:
```tsx
import { useState } from 'react';
import type { UserId } from '../backend/types';

/** After a turn: the Warden turns the discussed thought into a Vow (pre-filled), or skips it. */
export default function TurnVowBox({ thought, party, busy, onMake, onSkip }: { thought: string; party: { userId: UserId; name: string }[]; busy: boolean; onMake: (text: string, ownerId: UserId | null) => void; onSkip: () => void }) {
  const [text, setText] = useState(thought.slice(0, 1000)); const [owner, setOwner] = useState('');
  return <form className="vow-form turn-vow" aria-label="Make a Vow from this thought" onSubmit={e => { e.preventDefault(); if (text.trim()) onMake(text.trim(), owner || null); }}>
    <label>Vow · action item<textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={1000} required /></label>
    <div><label>Owner · optional<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">Shared by the team</option>{party.map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}</select></label>
      <button type="submit" className="speaker-spin" disabled={busy || !text.trim()}>Make Vow</button><button type="button" disabled={busy} onClick={onSkip}>Skip this Vow</button></div>
  </form>;
}
```

`DiscussStage.tsx`:
```tsx
import { Clock3, Sparkles } from 'lucide-react';
import type { Fragment, SpeakerState, UserId, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { finishTurn, NO_SPEAKER, reelFrames, speakerPool, spinSpeaker, startVow, turnChoices } from '../logic/speaker';
import SpeakerPanel, { type SpeakerMember } from './SpeakerPanel';
import TurnVowBox from './TurnVowBox';
import './speaker.css';

/** Resonance Hall (feature 3): spin → the chosen player brings one of their picks → the party discusses → the Warden turns it into a Vow. */
export default function DiscussStage({ speaker, meId, warden, busy, party, fragments, ownPicks, vows, onSpeaker, onChoose, onMakeVow, onTimer }: {
  speaker: SpeakerState | null; meId: UserId; warden: boolean; busy: boolean; party: SpeakerMember[]; fragments: Fragment[]; ownPicks: string[]; vows: Vow[];
  onSpeaker: (next: SpeakerState, frames?: UserId[]) => void; onChoose: (fragmentId: string) => void; onMakeVow: (text: string, ownerId: UserId | null) => void; onTimer: () => void;
}) {
  const s = speaker ?? NO_SPEAKER; const ids = party.map(p => p.userId);
  const current = party.find(p => p.userId === s.currentId); const thought = fragments.find(f => f.id === s.thoughtId);
  const canSpin = speakerPool(ids, s).length > 0;
  const spin = () => { const next = spinSpeaker(ids, s); if (next?.currentId) onSpeaker(next, reelFrames(ids, next.currentId)); };
  const cat = (f: Fragment) => CATEGORIES.find(c => c.id === f.category);
  const choices = turnChoices(fragments, ownPicks, s.discussed); const fromOwn = choices.some(f => ownPicks.includes(f.id));
  return <div className="discuss-stage">
    <div className="stage-intro"><h3>Make room for the conversation.</h3><p>The chosen player brings one of their picks, the party talks it through, and the Warden turns it into a Vow.</p></div>
    <section className="turn-card" aria-live="polite">
      {!current ? <p className="turn-idle">{canSpin ? (warden ? 'Spin to choose who speaks next.' : 'Your Warden will spin for the next speaker.') : 'Everyone has had a turn.'}</p>
        : s.phase === 'choosing' ? (current.userId === meId
          ? <div className="turn-chooser"><h4>Your turn — choose a thought to discuss</h4><p>{fromOwn ? 'From the thoughts you picked.' : 'None of your picks are left — choose any thought.'}</p>
              <ul>{choices.map(f => <li key={f.id}><button disabled={busy} onClick={() => onChoose(f.id)}><span className={`category-label ${f.category}`}>{cat(f)?.label}</span>{f.text}</button></li>)}</ul></div>
          : <p className="turn-idle">{current.name} is choosing a thought…</p>)
        : thought && <article key={thought.id} className="hall-fragment turn-thought"><Sparkles size={24} strokeWidth={1} /><span className={`category-label ${thought.category}`}>{cat(thought)?.label} · {cat(thought)?.plain}</span><p>{thought.text}</p><span>{current.name} brought this thought</span></article>}
      {current && s.phase === 'vow' && (warden
        ? <TurnVowBox key={s.thoughtId ?? ''} thought={thought?.text ?? ''} party={party} busy={busy} onMake={onMakeVow} onSkip={() => onSpeaker(finishTurn(s))} />
        : <p className="turn-idle">The Warden is writing a Vow…</p>)}
    </section>
    {warden && <div className="hall-controls">
      {!current && <button className="speaker-spin" disabled={busy || !canSpin} onClick={spin}>Spin</button>}
      {current && s.phase === 'choosing' && <button disabled={busy || !canSpin} onClick={spin}>Spin again</button>}
      {current && s.phase === 'discussing' && <button className="speaker-spin" disabled={busy} onClick={() => onSpeaker(startVow(s))}>Done discussing</button>}
      <button disabled={busy} onClick={onTimer}><Clock3 size={16} />3-minute timer</button>
    </div>}
    <SpeakerPanel party={party} speaker={s} warden={warden} busy={busy} onChange={onSpeaker} />
    {vows.length > 0 && <section className="turn-vows" aria-label="Vows made this voyage"><h4>Vows so far</h4><ul>{vows.map(v => <li key={v.id}>{v.text}</li>)}</ul></section>}
  </div>;
}
```
The test expects the chooser button text `'SparkThought f2'`: the label span text followed by the thought text.

`SpeakerReel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Backend, UserId } from '../backend/types';
import { characterById } from '../data/characters';
import { useReducedMotion } from '../hooks';
import { Art } from './ui';
import './speaker.css';

type Member = { userId: UserId; name: string; characterId: string | null };
/** The roulette every screen plays at the same moment when the Warden spins (cue topic 'speaker'). */
export default function SpeakerReel({ backend, sessionId, party }: { backend: Backend; sessionId: string; party: Member[] }) {
  const [frames, setFrames] = useState<UserId[] | null>(null); const [i, setI] = useState(0); const reduced = useReducedMotion();
  useEffect(() => backend.on('speaker', data => {
    const d = data as { sessionId?: string; frames?: UserId[] };
    if (d?.sessionId === sessionId && Array.isArray(d.frames) && d.frames.length) { setFrames(d.frames); setI(reduced ? d.frames.length - 1 : 0); }
  }), [backend, sessionId, reduced]);
  useEffect(() => {
    if (!frames) return;
    if (i >= frames.length - 1) { const t = setTimeout(() => setFrames(null), 1800); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), 70 + i * 18); return () => clearTimeout(t);   // slows down like a reel
  }, [frames, i]);
  if (!frames) return null;
  const m = party.find(p => p.userId === frames[i]); const landed = i >= frames.length - 1;
  return <div className={`speaker-reel${landed ? ' landed' : ''}`} role="status" aria-live="polite">
    <Art character={characterById(m?.characterId)} kind="cutout" decorative /><strong>{m?.name ?? '…'}</strong>{landed && <span>speaks next</span>}
  </div>;
}
```

`speaker.css`:
```css
/* Resonance Hall turns: the turn card, the chooser, the tracker, the roulette reel, the spotlight. */
.discuss-stage{display:grid;gap:14px}
.turn-card{display:grid;gap:12px;min-height:90px}
.turn-idle{margin:0;padding:18px;border:1px dashed #d8bf8255;text-align:center;font-family:'Marcellus',serif;font-size:18px;color:#e4ebf1}
.turn-chooser h4{margin:0 0 2px;font-family:'Marcellus',serif;font-weight:400;font-size:20px;color:#fff4dc}
.turn-chooser p{margin:0 0 10px;font-size:13px;color:#b9c6d2}
.turn-chooser ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.turn-chooser li button{display:grid;gap:4px;width:100%;padding:10px 12px;border:1px solid #d8bf8244;background:#10233acc;color:#e4ebf1;font:inherit;font-size:14px;line-height:1.45;text-align:left;cursor:pointer}
.turn-chooser li button:hover{border-color:#e9cf8f;box-shadow:0 0 14px #e9cf8f33}
.turn-chooser li button:focus-visible,.hall-controls button:focus-visible,.speaker-panel button:focus-visible{outline:2px solid #fff4dc;outline-offset:2px}
.turn-vow{margin:0}
.turn-vows h4{margin:0 0 6px;font-family:'Marcellus',serif;font-weight:400;font-size:16px;color:#e9cf8f}
.turn-vows ul{margin:0;padding-left:18px;display:grid;gap:4px;font-size:14px;color:#e4ebf1}
.hall-controls{display:flex;flex-wrap:wrap;gap:8px}
.hall-controls button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px;border:1px solid #d8bf8299;background:#10233acc;color:#fff4dc;font:inherit;cursor:pointer}
.speaker-spin{border-color:#f3dca0!important;background:linear-gradient(180deg,#e9cf8f,#c9a45a)!important;color:#1b2a3a!important;font-weight:700}
.hall-controls button:disabled,.turn-vow button:disabled{opacity:.5;cursor:not-allowed}
.speaker-panel{border-top:1px solid #d8bf8255;padding-top:12px;display:grid;gap:8px;color:#fff4dc}
.speaker-panel header{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.speaker-panel h4{margin:0;font-family:'Marcellus',serif;font-weight:400;font-size:17px}
.speaker-panel header p{margin:0;font-size:13px;color:#b9c6d2}
.speaker-panel ul{list-style:none;margin:0;padding:0;display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin}
.speaker-panel li{flex:0 0 auto;display:grid;justify-items:center;gap:2px;width:84px;padding:6px 4px;border:1px solid #d8bf8233;background:#10233acc;font-size:12.5px}
.speaker-panel li .character-art,.speaker-panel li .silhouette{height:58px;width:auto;object-fit:contain}
.speaker-panel li small{font-size:11px;color:#b9c6d2}
.speaker-panel li.mark-speaking{border-color:#f3dca0;box-shadow:0 0 16px #e9cf8f55}
.speaker-panel li.mark-spoken{opacity:.6}
.speaker-panel li.mark-skipped{opacity:.45;border-style:dashed}
.speaker-panel li button{padding:2px 8px;border:1px solid #d8bf8266;background:transparent;color:#e9cf8f;font:inherit;font-size:11px;cursor:pointer}
.speaker-reel{position:fixed;left:50%;top:22%;z-index:40;transform:translateX(-50%);display:grid;justify-items:center;gap:4px;padding:14px 26px 12px;border:1px solid #d8bf8299;background:radial-gradient(circle at 50% 30%,#1d3a5c,#0a1a2cf2);color:#fff4dc;pointer-events:none}
.speaker-reel .character-art,.speaker-reel .silhouette{height:150px;width:auto;object-fit:contain}
.speaker-reel strong{font-family:'Marcellus',serif;font-weight:400;font-size:24px}
.speaker-reel span{font-size:13px;color:#e9cf8f}
.speaker-reel.landed{box-shadow:0 0 40px #e9cf8f66;animation:speaker-land .5s var(--ease,ease-out)}
@keyframes speaker-land{from{transform:translateX(-50%) scale(.92)}to{transform:translateX(-50%) scale(1)}}
.speaker-your-turn{position:fixed;left:50%;top:84px;z-index:35;transform:translateX(-50%);margin:0;padding:10px 22px;border:1px solid #f3dca0;background:linear-gradient(180deg,#e9cf8f,#c9a45a);color:#1b2a3a;font-family:'Marcellus',serif;font-size:18px}
.scene-character.speaker-spotlight::before{content:'';position:absolute;left:50%;bottom:0;width:140%;height:70%;transform:translateX(-50%);background:radial-gradient(ellipse at 50% 100%,#f3dca0aa,transparent 70%);pointer-events:none;z-index:-1}
@media (prefers-reduced-motion:reduce){.speaker-reel.landed{animation:none}}
```

`Scene.tsx`:
- Add the prop `speakerId?: string | null`.
- In `fieldClass`, add `speakerId && speakerId === id ? 'speaker-spotlight' : '',` to the array.
- After the gathering `useEffect`, add:
```tsx
  // Speaker turns: the chosen player walks to the beacon. Positions are self-broadcast, so only their own screen moves them.
  const lastSpeaker = useRef(speakerId);
  useEffect(() => {
    const changed = lastSpeaker.current !== speakerId; lastSpeaker.current = speakerId;
    if (changed && speakerId === me.id && movement) { keys.current.clear(); walkTo(gatherSpot({ x: MAP.beacon.x, y: MAP.beacon.y + 0.06 }, 0, 1), 2.2); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);
```

`screens.tsx` `RetroScreen`:
- Before `backdrop`, add:
```tsx
  const speakerId = session.stage === 'hall' ? session.speaker?.currentId ?? null : null;
  const changeSpeaker = (next: SpeakerState, frames?: UserId[]) => run(async () => { await backend.updateSession(session.id, { speaker: next }); if (frames) backend.emit('speaker', { sessionId: session.id, frames }); });
```
  Pass `speakerId={speakerId}` to `<Scene>`.
- Replace the whole `{session.stage === 'hall' && …}` block with:
```tsx
      {session.stage === 'hall' && <DiscussStage speaker={session.speaker} meId={me.id} warden={warden} busy={busy} party={members} fragments={fragments} ownPicks={ownVotes} vows={vows.filter(v => v.sessionId === session.id)}
        onSpeaker={changeSpeaker} onChoose={fid => run(() => backend.chooseTurnThought(session.id, fid))}
        onMakeVow={(text, owner) => run(async () => { await backend.addVow(session.id, text, owner); await backend.updateSession(session.id, { speaker: finishTurn(session.speaker) }); }, 'A new Vow to carry forward.')}
        onTimer={() => run(() => backend.updateSession(session.id, { timerEndsAt: Date.now() + 180000 }))} />}
```
- After `</VoyageWindow>`, add:
```tsx
    {session.stage === 'hall' && <SpeakerReel backend={backend} sessionId={session.id} party={members} />}
    {speakerId === me.id && <p className="speaker-your-turn" role="status">Your turn — the hall is listening.</p>}
```
- Remove what only the old hall block used: `revealNext`, `ordered`, `current`, `currentIndex`, `hallRef`, the gsap `.hall-fragment` effect, and the `fragmentGlow`/`revealOrder`/`gsap` imports. Grep `screens.tsx` for each name first and remove only the ones nothing else uses. `tsc` here doesn't flag unused locals. Leave `revealOrder`/`fragmentGlow` defined in `logic/index.ts`.
- Imports: `DiscussStage`, `SpeakerReel`, `finishTurn` from `./logic/speaker`, and the types `SpeakerState` and `UserId`.

- [ ] **Step 4: Run the tests and watch them pass.** Run `cd interface && npx tsc --noEmit -p . && npx vitest run`. Expected: all green.
- [ ] **Step 5: Browser check.**
  1. Use the local demo with three tabs (jay, ana, bob), everyone checked in. Write 4 thoughts, and have Ana pick 3.
  2. In the Hall, Jay spins: all tabs show the same reel.
  3. If Ana is chosen, her tab lists only her picks, with no counts. The others see "Ana is choosing a thought…". Ana chooses one, and every tab shows it.
  4. Jay presses Done discussing. The Vow box is pre-filled. Make Vow adds it to "Vows so far", and the tracker shows "Spoken 1".
  5. Reload Ana's tab while she's choosing: her choices come back.
  6. Skip removes an absent player, and Add back returns them.
  7. Take screenshots at desktop and phone width.
- [ ] **Step 6: Commit**
```bash
git add interface/src
git commit -m "Game: Discuss turns — spin, the chosen player brings one of their picks, discuss, the Warden's Vow box; shared roulette, spotlight, walk to the beacon"
```

---

### R2-6: Vow Altar review

**Files:**
- Modify: `interface/src/components/ThoughtPicker.tsx`, `ThoughtPicker.test.tsx` (undiscussed thoughts only, not ranked, no counts)
- Create: `interface/src/components/VowEditRow.tsx`, `VowEditRow.test.tsx`
- Modify: `interface/src/components/feedback.css`
- Modify: `interface/src/screens.tsx` (Vow Altar block)

**Interfaces:**
- Consumes: `Session.speaker.discussed` (R2-4) and `backend.updateVow(id, { text, ownerId })`.
- Produces:
  - `ThoughtPicker({ fragments, onPick })`: the `votes` prop is removed. `rankByVotes` stays in `logic/report.ts` for the Homecoming report.
  - `VowEditRow({ vow, party, busy, onSave(patch: { text: string; ownerId: UserId | null }) })`.

- [ ] **Step 1: Write the failing tests**

`ThoughtPicker.test.tsx` (replace the `describe` body; `render` no longer passes `votes`):
```tsx
describe('ThoughtPicker', () => {
  it('lists the given thoughts oldest first, with no vote counts', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('li p')].map(p => p.textContent)).toEqual(['Standups ran long', 'Pairing helped']);
    expect(el.textContent).not.toMatch(/\d+ votes?/);
  });
  it('fills the Vow box with the chosen thought', async () => {
    const { el, onPick } = await render();
    await act(async () => el.querySelector<HTMLButtonElement>('button[aria-label="Make a Vow from: Standups ran long"]')!.click());
    expect(onPick).toHaveBeenCalledWith('Standups ran long');
  });
  it('renders nothing without thoughts', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<ThoughtPicker fragments={[]} onPick={vi.fn()} />));
    expect(el.innerHTML).toBe('');
  });
});
```
In that file's `render`, the element becomes `<ThoughtPicker fragments={fragments} onPick={onPick} />`.

`VowEditRow.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VowEditRow from './VowEditRow';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const vow = { id: 'v1', sessionId: 's', text: 'Fix CI', ownerId: null, status: 'open' as const, createdAt: 1 };
const setValue = (el: HTMLTextAreaElement | HTMLSelectElement, value: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value); el.dispatchEvent(new Event(el instanceof HTMLTextAreaElement ? 'input' : 'change', { bubbles: true }));
};
describe('VowEditRow', () => {
  it('saves a changed text and owner; Save waits for a change', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el); const onSave = vi.fn();
    await act(async () => createRoot(el).render(<VowEditRow vow={vow} party={[{ userId: 'ana', name: 'Ana' }]} busy={false} onSave={onSave} />));
    const save = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(save.disabled).toBe(true);
    await act(async () => { setValue(el.querySelector('textarea')!, 'Fix CI this week'); setValue(el.querySelector('select')!, 'ana'); });
    await act(async () => save.click());
    expect(onSave).toHaveBeenCalledWith({ text: 'Fix CI this week', ownerId: 'ana' });
  });
});
```

- [ ] **Step 2: Run them and watch them fail.** Expected: FAIL (ThoughtPicker still ranks and shows counts; VowEditRow missing).

- [ ] **Step 3: Implement**

`ThoughtPicker.tsx`:
```tsx
import { ScrollText } from 'lucide-react';
import type { Fragment } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import './feedback.css';

/** Vow Altar (Warden): thoughts nobody chose to discuss, oldest first; "Make a Vow" copies one into the Vow box. */
export default function ThoughtPicker({ fragments, onPick }: { fragments: Fragment[]; onPick: (text: string) => void }) {
  const list = [...fragments].sort((a, b) => a.createdAt - b.createdAt);
  if (!list.length) return null;
  return <section className="thought-picker" aria-label="Thoughts not discussed"><h4>Thoughts not discussed</h4>
    <ol>{list.map(f => <li key={f.id}>
      <span className={`category-label ${f.category}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</span>
      <p>{f.text}</p>
      <button type="button" onClick={() => onPick(f.text)} aria-label={`Make a Vow from: ${f.text}`}><ScrollText size={14} />Make a Vow</button>
    </li>)}</ol>
  </section>;
}
```
In `feedback.css`, the `.thought-picker li` grid becomes `grid-template-columns:auto 1fr`, and remove the `.thought-votes` rule.

`VowEditRow.tsx`:
```tsx
import { useState } from 'react';
import type { UserId, Vow } from '../backend/types';
import './feedback.css';

/** Vow Altar review (Warden): edit a Vow's words or owner. */
export default function VowEditRow({ vow, party, busy, onSave }: { vow: Vow; party: { userId: UserId; name: string }[]; busy: boolean; onSave: (patch: { text: string; ownerId: UserId | null }) => void }) {
  const [text, setText] = useState(vow.text); const [owner, setOwner] = useState(vow.ownerId ?? '');
  const changed = text.trim() !== vow.text || (owner || null) !== vow.ownerId;
  return <form className="vow-edit-row" aria-label={`Edit Vow: ${vow.text}`} onSubmit={e => { e.preventDefault(); if (changed && text.trim()) onSave({ text: text.trim(), ownerId: owner || null }); }}>
    <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={1000} aria-label="Vow text" />
    <select value={owner} onChange={e => setOwner(e.target.value)} aria-label="Owner"><option value="">Shared by the team</option>{party.map(p => <option key={p.userId} value={p.userId}>{p.name}</option>)}</select>
    <button type="submit" disabled={busy || !changed || !text.trim()}>Save</button>
  </form>;
}
```
`feedback.css` (append):
```css
.vow-edit-row{display:grid;grid-template-columns:1fr auto auto;align-items:start;gap:8px;padding:8px 0;border-bottom:1px dashed #d8bf8233}
.vow-edit-row textarea{min-height:44px;padding:8px;border:1px solid #d8bf8244;background:#10233acc;color:#fff4dc;font:inherit;font-size:14px;resize:vertical}
.vow-edit-row select{min-height:36px;border:1px solid #d8bf8244;background:#10233a;color:#fff4dc;font:inherit;font-size:13px}
.vow-edit-row button{min-height:36px;padding:0 14px;border:1px solid #d8bf8299;background:transparent;color:#e9cf8f;font:inherit;cursor:pointer}
.vow-edit-row button:disabled{opacity:.45;cursor:default}
@media (max-width:560px){.vow-edit-row{grid-template-columns:1fr}}
```

`screens.tsx`, Vow Altar block:
- Stage intro: `<h3>Review the Vows.</h3><p>Every turn in Discuss ended at the Vow box. Fix wording or owners, and add anything still missing.</p>`
- Warden branch: the add form (unchanged), then the review list, then the undiscussed thoughts:
```tsx
{vows.filter(v => v.sessionId === session.id).map(v => <VowEditRow key={v.id} vow={v} party={members} busy={busy} onSave={patch => run(() => backend.updateVow(v.id, patch), 'Vow updated.')} />)}
<ThoughtPicker fragments={fragments.filter(f => !(session.speaker?.discussed ?? []).includes(f.id))} onPick={t => setVowText(t.slice(0, 1000))} />
```
- Players keep the read-only `VowRow` list. Remove the old trailing `vows…map(VowRow)` for the Warden, since it's replaced by the edit rows.
- Import `VowEditRow`.

- [ ] **Step 4: Run the tests and watch them pass.** Run `cd interface && npx tsc --noEmit -p . && npx vitest run`. Expected: all green.
- [ ] **Step 5: Browser check.** After two Discuss turns, the Vow Altar shows both Vows as editable rows for the Warden, and only the undiscussed thoughts below them. Save changes the Vow on the other tab. Take a screenshot.
- [ ] **Step 6: Commit**
```bash
git add interface/src
git commit -m "Game: Vow Altar becomes a review — edit Vows from Discuss; only undiscussed thoughts offered, unranked"
```

---

### R2-7: Go live

- [ ] **Step 1:** Jay runs `supabase/migrations/0007_picks_and_turns.sql` in the SQL Editor (project `sllaffecbkuayzjxvqju`).
- [ ] **Step 2:** Claude confirms with a read-only query:
```sql
select (select position('already picked' in prosrc) > 0 from pg_proc where proname = 'cast_vote' and pronamespace = 'public'::regnamespace) as picks,
       exists (select 1 from pg_proc where proname = 'choose_turn_thought' and pronamespace = 'public'::regnamespace) as turns;
```
  Expected: both `true`.
- [ ] **Step 3:** Run `cd interface && npx tsc --noEmit -p . && npx vitest run && npm run build`. Expected: green.
- [ ] **Step 4:** With Jay's OK, push `main` and watch the Pages run until it succeeds. Then check that the live bundle contains `Pick what you want to talk about` and `Done discussing`.
- [ ] **Step 5:** Hand-off note:
  - companions whose "three votes" lines now stay silent at the Vote stage;
  - Seren's `stage_hall` clip ("most voted first") is unused;
  - picks reveal the chooser's pick by design.
