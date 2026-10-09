---
id: "0057"
title: "File ticketed idea notes in speck/ideas/done"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:06:19.069Z"

---
# 0057 · File ticketed idea notes in speck/ideas/done

**Status:** 👍 approved

## Problem
Idea notes stay in `speck/ideas/` forever, so once most ideas are ticketed the folder is mostly finished notes. Tickets already get filed in `speck/tickets/done/` when closed, and ideas have no equivalent, so the folder doesn't show at a glance what's still to shape.

## Outcome
An idea note is filed in `speck/ideas/done/` once it's ticketed, so `speck/ideas/` holds only ideas still waiting.

## Acceptance criteria
1. `speck new "<title>" --source=speck/ideas/<file>.md` sets the note's status to `ticketed (<id>)` as today, moves the note to `speck/ideas/done/<file>.md` under the same name, and writes that new path as the ticket's `source:`.
2. `speck new` with `--source=speck/ideas/done/<file>.md` adds the new id to that note's `ticketed (…)` status and leaves it where it is; with `--source=speck/ideas/<file>.md` for a note that has already moved, it uses the note in `speck/ideas/done/` instead of refusing.
3. Re-running `speck init` moves every note in `speck/ideas/` whose status starts with `ticketed` into `speck/ideas/done/`, and rewrites the `source:` of every ticket (in `speck/tickets/` and `speck/tickets/done/`) that pointed at a moved note to its new path; notes with any other status stay put.
4. `speck status` counts notes in `speck/ideas/done/` as ticketed, alongside those in `speck/ideas/`; `speck status --json` and the panel list only notes in `speck/ideas/`.
5. The overlap check (`speck-capture`), `/speck-ticket` and inbox triage read the notes in `speck/ideas/done/` as well as `speck/ideas/`.

## Out of scope
- Hiding ticketed ideas in the panel (0056).
- Filing `dropped` notes away.
- Moving a note back when its tickets are cancelled: an idea's `ticketed (…)` status is only ever added to.

## Notes
- Mirrors how closed tickets are filed in `speck/tickets/done/` (0007).
- Folder name `speck/ideas/done/`, and filing on the first ticket rather than when all its tickets are done, are defaults chosen while ticketing, to confirm before ready. An idea still being split, such as `speck/ideas/2026-10-08-speck-board.md`, moves on its first ticket and is ticketed from `done/` after that (criterion 2).
- Touches the CLI (`new`, `init`, `status`) and the skill text in `skills/`; product.md and `docs/brief.md` need updating.
- Related inbox note: `speck/ideas/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md`.
- The 0009 tests' note reader now follows a ticketed note into `speck/ideas/done/`, since AC1 moves it; their content checks are unchanged.
- Self-check: added a test for the product.md claim that a build's follow-up check reads `speck/ideas/done/`; refusing a name already taken in `speck/ideas/done/` (in `new`) and leaving it with a message (in `init`) came from checking repeated names.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 412,424
- Elapsed since build started: 8 min
- Changed lines: 85 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. This repo's own ticketed notes are still in `speck/ideas/` until `speck init` is re-run here, which files them and rewrites the matching `source:` lines.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e0f1e2c6487a321ebce74fbe079f6ca0d177d97d",
    "thread_id": "01a12215-f2e7-7532-bc46-24e7c96693ce",
    "seconds": 38,
    "usage": {
      "input_tokens": 411564,
      "cached_input_tokens": 319744,
      "cache_write_input_tokens": 0,
      "output_tokens": 860,
      "reasoning_output_tokens": 56
    },
    "saved_at": "2026-10-09T19:14:24.540Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdNew updates the status, moves the note and records its new source path. The 0057 AC1 integration tests exercise this and refusal on name collisions; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdNew resolves missing inbox paths into done/ and extends ticketedStatus. The 0057 AC2 integration test creates three tickets using both paths and checks accumulated ids and sources; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fileTicketedIdeas, called by cmdInit, migrates ticketed notes and updates sources in both ticket folders. The 0057 AC3 tests cover other statuses, repeated init, preserved comments and collisions; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus counts both folders; statusData reads only top-level ideas. The 0057 AC4 tests verify text counts, JSON and the panel's /api/state response; supplied results pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The capture overlap instructions, ticket context and overlap steps, and triage comparison explicitly include ideas/done/. The 0057 AC5 test checks these instruction sections, which implement this capability; supplied results pass."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The living spec matches filing, migration, old-path lookup, collision handling and the distinction between text counts and JSON/panel lists."
    },
    "escalation_question": "",
    "summary": "Ticketed ideas are filed away while remaining available for further tickets and overlap checks. Migration preserves other notes and avoids overwriting duplicate names. All five criteria have relevant passing tests in the supplied results. I verified the code and test assertions and found no blocking issues; tests were not rerun in this read-only review."
  }
}
```

</details>
