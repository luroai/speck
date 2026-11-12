---
id: "0662"
title: "Pick a ticket's build level in the panel"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0660"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T12:09:58.743Z"
approved: "2026-11-12T12:49:07.710Z"
finished: "2026-11-12T12:56:19.295Z"

---
# 0662 · Pick a ticket's build level in the panel

**Status:** ✅ done

## Problem
After 0660, giving a ticket a level means `speck set` or editing the ticket. From the panel on your phone you can already change a ticket's priority, but not the level it's built at.

## Outcome
A ticket's facts in the panel show its level, and you can change it there, as you can its priority.

## Acceptance criteria
1. A ticket's facts in the panel show a Level beside Priority: the level's name with a capital first letter, or "Settings" when the ticket has none.
2. Choosing Level offers each of the project's levels and Settings. Picking one sets the ticket's `level` as `speck set <id> level <name>` does, and Settings blanks it; the facts show the new level without a reload.
3. Changing the level of a ticket that's building, reviewing, blocked or approved is refused with the message `speck set` gives for it, and the ticket keeps its level. A done or cancelled ticket shows its level without offering to change it.

## Out of scope
- Changing the levels themselves: 0661.
- Setting a ticket's own builder model or effort in the panel.

## Notes
- Follow the priority picker: `POST /api/tickets/<id>/priority/<n>` in `scripts/panel.mjs` and `setPriority` in `templates/panel.js`.
- Failing before this build: none
- Self-check: a level from the URL that the project doesn't have, including `constructor` and `__proto__`, is refused before any write; the pane's Level got a 44 px tap area; the Level menu became a short vertical list so its names don't break in a narrow tile; a seventh cell in an open Plan card's table, Type, has its row to itself.
- Pictures: the full view only. This branch's board has no drafts, so the open Plan card's Level isn't pictured; its tests cover it.
- speck (2026-11-12 12:34 UTC) told you: The build is slow, not stuck. It ran the related tests twice, about 3 and 5.5 minutes each over roughly 2,700 tests. The first run failed 5 of them because its own menu CSS made some controls smaller than 44 px. It fixed that and the second run passed. It then checked the menu in a browser and is now re-running the tests after one more CSS change, before its first review. Why: The build log shows steady progress with no step stalling, and the base branch's tests passed at the start. Two full related-test runs on a machine with a load average of about 84 explain most of the extra time.

## In plain words
A ticket's facts in the panel now show its build level next to its priority: Quick, Balanced, Deep, or Settings when it has none. On a ticket that hasn't started building, press the level to pick another from a short list. The change is saved straight away and shows at once, and choosing Settings takes the level off. On a ticket that's already being built, reviewed, blocked or waiting to ship, the panel refuses and says why under the level, which stays as it was. A shipped ticket just shows its level.

To see it, open any ticket's full view, or open a draft in Plan, and press the value under Level. Worth watching: an open draft in Plan now has seven facts, so Type sits on a row of its own.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,074,384
- Elapsed since build started: 39 min
- Changed lines: 133 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- `speck set <id> level ""` can't blank a level from the command line, though the panel can: speck/ideas/2026-11-12-let-speck-set-blank-a-ticket-s-level.md.
- Known limit: with `worktrees` off, a ticket being built in the main checkout gets the panel's own refusal, as `speck set` has none to copy there.

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
    "reviewed_sha": "f410ef58947b20d3dcf0e7b2ba7b19bbda6c16c8",
    "session": "fresh",
    "thread_id": "01a1cfc6-7e60-7ae1-9dda-145e8f7dca74",
    "builder_response": "- Tests run: `speck test --related` with test/panel-level-0662.test.mjs and the existing test files this ticket changed (test/status-json.test.mjs test/resume-0044.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0424.test.mjs test/panel-0462.test.mjs test/panel-0465.test.mjs test/panel-0583.test.mjs test/panel-0624.test.mjs test/panel-0463.test.mjs test/panel-0077.test.mjs), plus every related file. 4 timing tests (0287, 0630, 0159, 0182) failed in that run while the machine's load average was ~68; their files re-run on their own all pass (appended at the end of the test output).\n- Existing tests changed: they listed the facts tables or `speck status --json`'s keys exactly, and the ticket adds a Level fact and the board's `levels`. 0462 AC4 now skips the Level cell's value, which holds the picker, as a draft's priority value already does in the Plan card. 0463's browser check of an even table now lets a lone seventh cell (Type) span its row.\n- Design notes: the write is in scripts/panel-level.mjs, as scripts/panel.mjs and scripts/speck.mjs are at the 600-line limit; the level route shares the priority route's match and guards. A ticket being built in its own worktree gets `speck set`'s own refusal (checkNotBeingBuilt), word for word. With worktrees off, a building/reviewing/blocked/approved ticket in this checkout has no `speck set` refusal to copy, so the panel refuses it with its own message. Levels from the URL are checked against the project's levels (levelProblem) before any write.\n- Pictures: the full view in light and dark, with the menu open and with a refusal. This branch's board has no drafts, so the Plan card isn't pictured.\n",
    "seconds": 74,
    "usage": {
      "input_tokens": 745680,
      "cached_input_tokens": 669056,
      "cache_write_input_tokens": 0,
      "output_tokens": 1371,
      "reasoning_output_tokens": 102
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 76624,
      "cached": 669056,
      "write": 0,
      "output": 1371
    },
    "cost_usd": 0.2338636,
    "tests": {
      "failing": 4,
      "second_try": []
    },
    "saved_at": "2026-11-12T12:42:08.377Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js levelFact and templates/panel-popups.js paneFacts place Level immediately after Priority and capitalise its name, defaulting to Settings. The two 0662 AC1 tests exercise Plan cards and full views; both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "levelPicker offers state.levels plus Settings; setLevel updates the displayed ticket after success. scripts/panel-level.mjs panelSetLevel validates and commits the level or blanks it. Passing 0662 AC2 tests cover choices, immediate display, clearing, persistence, unknown levels and route protection."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetLevel calls checkNotBeingBuilt for the CLI's exact worktree refusal and rejects all four in-hand statuses before writing. levelFact renders done and cancelled levels without controls. Passing 0662 AC3 tests cover exact CLI refusal, unchanged files for every restricted status, displayed refusal and a done ticket's read-only fact."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now shows each ticket’s build level and lets you change it to a project level or Settings. Changes appear immediately, and tickets already being worked on are protected. The relevant tests passed, including reruns of the reported timing failures. No blocking issues found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f4712e7b823aefb057f36ced2a1d5a6093357b10",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1cfc6-7e60-7ae1-9dda-145e8f7dca74",
    "builder_response": "Merge round: main merged into the ticket branch after the ship queue's merge hit a conflict.\n- scripts/panel.mjs (class: logic, 1 conflict): only the comment above panelServer that lists the panel's write routes. main (0661) added `POST /api/levels/<name>/set, /add or /remove (0661)`, this ticket added `POST /api/tickets/<id>/level/<name> (0662)`. Kept both in the one line. No code lines conflicted; 0661's import and route and this ticket's import and route are both in, and the file is still 600 lines.\n- Tests run: test/panel-level-0662.test.mjs test/settings-levels-0661.test.mjs test/status-json.test.mjs test/resume-0044.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0424.test.mjs test/panel-0462.test.mjs test/panel-0465.test.mjs test/panel-0583.test.mjs test/panel-0624.test.mjs test/panel-0463.test.mjs test/panel-0077.test.mjs test/panel-0140.test.mjs (310 pass, 0 fail).\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 1072467,
      "cached_input_tokens": 960640,
      "cache_write_input_tokens": 0,
      "output_tokens": 1917,
      "reasoning_output_tokens": 102
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35203,
      "cached": 291584,
      "write": 0,
      "output": 546
    },
    "cost_usd": 0.1050244,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T12:49:05.318Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "levelFact in templates/panel.js and paneFacts in templates/panel-popups.js still show Level immediately after Priority, capitalised or Settings when blank. Both 0662 AC1 tests passed after the merge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "levelPicker offers the board's project levels and Settings; setLevel updates the displayed value after success. panelSetLevel validates and commits changes, including clearing the level. The 0662 AC2 tests passed. scripts/panel.mjs preserves both the ticket-level route and 0661's separate project-level editing route."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetLevel retains checkNotBeingBuilt's exact CLI refusal and rejects building, reviewing, blocked and approved tickets before writing. levelFact offers no control for done or cancelled tickets. The 0662 AC3 tests passed, covering refusal messages, unchanged levels and read-only display."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves both the ticket Level picker and the project’s level editor in Settings. All three acceptance criteria remain satisfied. The recorded tests show 310 passed, none failed and three skipped. No blocking issues found."
  }
}
```

</details>
