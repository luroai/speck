---
id: "0669"
title: "Choose a ticket's builder model in the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-choose-the-builder-s-model-per-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0667"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-15T12:53:56.455Z"
approved: "2026-11-15T13:11:53.089Z"

---
# 0669 · Choose a ticket's builder model in the panel

**Status:** 👍 approved

## Problem
Since 0659 a ticket can name its own builder and model, but only in the ticket file or with `speck set`. A draft or ready ticket in the panel doesn't say which builder, model and effort it will be built with, so you can't see what a level or the ticket's own model will do, or change it from your phone.

## Outcome
A ticket in the panel says what it will be built with, and you can change its builder and model there.

## Acceptance criteria
1. A ticket's facts, in an open draft in Plan and in a ticket's full view, show a Builder fact with the agent, model and effort its next build would use, worked out as a build would (the ticket's own, else its level's, else the Builder's in Settings), such as "Claude Code · Fable · high", with "default model" or "default effort" for one nobody sets. Under it, in smaller words, it says where they come from: "This ticket", the level's name (such as "Deep level") or "Default".
2. Pressing the Builder fact opens a menu offering "Default", then the same agent and model choices as the Builder's row in Settings, in the same words. Picking one sets the ticket's `builder` and `builder_model` as `speck set` does, and "Default" blanks both, so the level or Settings decides. The facts show the change without a reload.
3. Changing it is refused, with the message `speck set` gives, for a ticket that's building, reviewing, blocked or approved, and it keeps its builder. A done or cancelled ticket shows the builder, model and effort it was built with, without the menu.
4. A pick the ready check would refuse, such as the same model as the ticket's reviewer without `allow_same_model_review`, is refused with the ready check's message, and the ticket keeps its builder.

## Out of scope
- Setting a ticket's own `builder_effort` in the panel: a level sets effort.
- The Level menu's own wording: 0667.

## Notes
- Follow the Level fact and menu from 0662 (`levelFact` in `templates/panel.js`, `POST /api/tickets/<id>/level/<name>` in `scripts/panel.mjs`). The board already gives each ticket `builder`, `builder_label` and `builder_model`, worked out with its level (`ticketBuilderModel` in `scripts/build-model.mjs`). It needs the effort and where they come from too.
- The full view already has a Builder fact (`paneFacts` in `templates/panel-popups.js`), showing only the agent and model. The open draft in Plan has none.
- Failing before this build: none
- Self-check: no changes. A done or cancelled ticket's Builder fact is worked out from its own builder, model and level, with the settings as they are now for anything it leaves blank, as speck keeps no other record of the settings a build ran with.

## In plain words
A ticket's facts in the panel now include Builder: the agent, model and effort its next build will use, such as "Claude Code · Opus · medium", with a small line under it saying whether that comes from the ticket itself, its level or the default. Press it to pick another agent and model from the same list as the Builder in Settings, or Default to hand the choice back to the level and Settings. You'll see it in an open draft in Plan and in any ticket's full view. A ticket that's already being built, or is waiting to ship, refuses the change and says why, as does a pick the ready check wouldn't allow, such as the same model as the ticket's reviewer. Worth knowing: the list can be long when Cursor is one of your agents, so the menu scrolls; and a shipped ticket that left its model to Settings shows today's Settings, not necessarily what it was built with.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 496,306
- Elapsed since build started: 18 min
- Changed lines: 223 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Idea: show what a shipped ticket was really built with, rather than working it out from today's settings (speck/ideas/2026-11-15-show-what-a-shipped-ticket-was-built-with.md).
- Known limit: with Cursor as one of your agents the Builder menu lists about 300 models, as the Settings Builder list does. The menu scrolls; a search or grouping would help both.
- Tidy-up: builderEntries borrows the Settings view's state for one synchronous call to reuse its list. Passing the view to levelEntries and its helpers would be cleaner.

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
    "reviewed_sha": "800d9dc95388bcfa9f5a62848c95bd1d78bb3d16",
    "session": "fresh",
    "thread_id": "01a1df54-928c-75c0-9c17-bd72df40463c",
    "builder_response": "- Tests run: test/panel-builder-0669.test.mjs, with `speck test --related`, which also ran every existing test file that names a file this branch changed (1912 tests, 0 failing).\n- Round 1. Notes for the reviewer:\n  - The board gives each ticket `build_with` (scripts/level-builds.mjs `ticketBuild`), worked out as `levelBuilds` works out a level's, plus `from` and the ticket's own builder and model.\n  - `POST /api/tickets/<id>/builder?builder=&model=` (scripts/panel-builder.mjs) refuses as the Level picker does, plus any error the ready check would gain from the pick.\n  - The menu's choices come from `levelEntries()` in panel-settings.js, read against the full `/api/settings` answer (`builderEntries` swaps `settingsView` for the call), so they are the Settings Builder row's own entries and words. The test compares the two lists on one page.\n  - A done or cancelled ticket's Builder fact uses its own builder, model and level, with the settings as they are now for anything it leaves blank: speck keeps no record of the settings a build ran with (noted in the ticket).\n  - Pictures: the full view's Builder fact and its open menu, light and dark. The real menu lists about 300 Cursor models, so it scrolls.\n",
    "seconds": 70,
    "usage": {
      "input_tokens": 494965,
      "cached_input_tokens": 430464,
      "cache_write_input_tokens": 0,
      "output_tokens": 1341,
      "reasoning_output_tokens": 271
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 64501,
      "cached": 430464,
      "write": 0,
      "output": 1341
    },
    "cost_usd": 0.1854584,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:11:33.482Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/level-builds.mjs ticketBuild/buildsWith resolve ticket, level and Settings values using the build helpers. templates/panel.js builderFact shows the values and source in Plan and paneFacts. Passing AC1 tests cover resolution and both views."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderEntries reuses Settings’ levelEntries; panelSetBuilder writes and commits both fields. setBuilder updates local state immediately. Passing AC2 tests compare menu wording, exercise picks and Default, and verify updates without another board request."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetBuilder checks worktree protection and refuses all four active statuses before writing. builderFact omits the picker for done and cancelled tickets. Passing AC3 tests cover refusal messages, unchanged files and the completed-ticket display. Historical values follow the fallback limitation recorded in the ticket’s Notes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelSetBuilder runs lintTicket against the proposed fields and returns newly introduced ready-check errors before writing. The passing AC4 test exercises a same-model refusal, checks its message and verifies the file remains unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel shows each ticket’s builder, model, effort and source, and lets users change the builder and model. Active builds are protected and invalid selections are refused. The relevant tests passed; no blocking issues found. Finished tickets use current settings for values they did not record explicitly, as documented in the ticket."
  }
}
```

</details>
