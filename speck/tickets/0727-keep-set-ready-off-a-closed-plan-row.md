---
id: "0727"
title: "Keep Set ready off a closed Plan row"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:15:49.304Z"
approved: "2026-11-24T17:37:52.477Z"
blocked_at: ""
waited_seconds: 10

---
# 0727 · Keep Set ready off a closed Plan row

**Status:** 👍 approved

## Problem
Every closed draft in Plan has a Set ready button on its row, so a ticket can be set ready without ever being opened, and the button takes space the title needs. Gate 1 should come after at least a scan of the ticket.

## Outcome
Set ready shows only once a draft is open, on its open row or in its full view, and a closed row gives its title the room.

## Acceptance criteria
1. A closed draft row in Plan has no Set ready button, and its title and details line run to where the button was, still ending in an ellipsis only when they don't fit.
2. An open draft row still has Set ready, behaving as today: it can't be pressed while the draft fails the ready check and says why, and reads "Setting ready…" while the request is under way.
3. A draft's full view still has Set ready in its bar, as today.
4. The brief's description of Plan says Set ready is on an open draft and in its full view, not on the row.
5. No test that passed before this change fails, except tests that check for Set ready on a closed row, which are changed to check it isn't there.

## Out of scope
- The priority tag, which stays on the closed row.
- `speck set <id> status ready`, which is unchanged.

## Notes
- Raised by the user on 2026-11-24 from a screenshot of the panel in Cursor's browser pane: the button crowds each row, and opening a ticket first should be the habit.
- `ticketHead` in `templates/panel.js` adds `setReadyButton` to every draft's top row; the closed row's grid gives it column 2 (`.item.row .head .set-ready` in `templates/panel-cards.css`). The brief's Plan description is in the `speck panel` row of `docs/brief.md` ("with Set ready and priority on the row").
- Failing before this build: test/tmp-cleanup.test.mjs AC1 AC2 (expects TAP `# fail 2`; Node 24's default reporter prints `ℹ fail 2`). Recorded suite for this code: passed.
- Self-check: AC4 brief test uses names that survive 0267 rewording, not a fixed sentence
- Went with the recommendation: Hold other brief panel-description ships until this lands, then try again (chosen by speck, as watch is decide, 2026-11-24 17:36 UTC).

## In plain words
Closed drafts in Plan no longer show Set ready on the row, so each title has the room the button used to take. Open a draft (or its full view) to set it ready, with the same checks and “Setting ready…” behaviour as before. Priority stays on the closed row.

## Blocked question
Other shipped work keeps rewriting the same panel description in the brief (`docs/brief.md`), so this ticket can't land: it has already been handed back twice for that clash. Options: (A) hold other tickets that change that panel description until this one has shipped, then try shipping it again; (B) drop this ticket's brief wording and ship only the panel behaviour; (C) keep trying after each other ship. I recommend A, so the brief stays accurate with the change.

Recommended: Hold other brief panel-description ships until this lands, then try again
Other options: Drop the brief wording and ship the panel only; Keep trying after each other ship
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.
Round 3 (codex, merge round): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 3 of them merge rounds
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 975,990
- Elapsed since build started: 142 min
- Changed lines: 10 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Accept Node 24's fail line in tmp-cleanup → speck/ideas/2026-11-24-accept-node-24-s-fail-line-in-tmp-cleanup.md

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
    "reviewed_sha": "e11c71fff14b343ef384d806ca260e3bc7994f39",
    "session": "fresh",
    "thread_id": "01a20e47-477c-7963-bbd3-b1126e78d938",
    "builder_response": "- Tests run: test/panel-0727.test.mjs test/panel-0586.test.mjs test/panel-0419.test.mjs test/panel-0463.test.mjs test/panel.test.mjs\n- Failing before this build (unchanged): test/tmp-cleanup.test.mjs AC1 AC2 — Node 24's default reporter prints `ℹ fail 2` instead of TAP `# fail 2`. Not caused by this ticket.\n- Round 1: Set ready is only added in `ticketHead` when the draft is open; closed Plan rows keep priority on the details line and give the title the room the button used to take. Brief Plan description and closed-row tests updated for AC5.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 207110,
      "cached_input_tokens": 163072,
      "cache_write_input_tokens": 0,
      "output_tokens": 839,
      "reasoning_output_tokens": 97
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44038,
      "cached": 163072,
      "write": 0,
      "output": 839
    },
    "cost_usd": 0.1127732,
    "saved_at": "2026-11-24T15:58:30.156Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js ticketHead omits Set ready when closed. Passing panel-0727 AC1 tests check its absence and ellipsis rules; panel-0586 AC4 checks the recovered title width and truncation in a real browser."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead retains setReadyButton for open drafts. Passing panel-0727 AC2 exercises readiness errors, the disabled button, pending text and POST; panel-0586 tests retain refusal coverage."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-popups.js readyBar still uses setReadyButton. Passing panel-0727 AC3 opens the full view and checks its Set ready bar."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's Plan description says priority remains on the row and Set ready appears on an open draft and in its full view. Passing panel-0727 AC4 checks those documented facts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported tests pass apart from the explicitly recorded pre-existing tmp-cleanup failure. Changed existing assertions concern closed-row Set ready behaviour; no unrelated test fixes appear in the ticket's diff."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Closed Plan drafts now give their titles more room and require opening before Set ready appears. Open drafts and full views retain the existing readiness checks and request behaviour. Relevant tests pass; the sole reported failure predates this change."
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
    "reviewed_sha": "0a28ba42bace540e0eb4bfda52535b5b42dffeb5",
    "merge": true,
    "session": "continued",
    "thread_id": "01a20e47-477c-7963-bbd3-b1126e78d938",
    "builder_response": "- Tests run: test/panel-0727.test.mjs test/panel-0586.test.mjs test/panel-0419.test.mjs test/panel-0463.test.mjs test/panel.test.mjs\n- Failing before this build (unchanged): test/tmp-cleanup.test.mjs AC1 AC2\n- Merge conflict resolution:\n  - docs/brief.md (class: logic): kept this ticket's Plan wording (Set ready on an open draft and in its full view, priority on the row) and main's newer session-counting text (each session at its newest total when a later build or sub-agent grows).\n  - templates/panel.js: clean auto-merge; Set ready still only on open drafts.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 454939,
      "cached_input_tokens": 382976,
      "cache_write_input_tokens": 0,
      "output_tokens": 1596,
      "reasoning_output_tokens": 112
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 27925,
      "cached": 219904,
      "write": 0,
      "output": 757
    },
    "cost_usd": 0.0854104,
    "saved_at": "2026-11-24T16:52:39.028Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js ticketHead still omits Set ready for closed drafts. Unchanged panel-0727 AC1 tests and the panel-0586 AC4 browser layout test pass after merging."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead retains setReadyButton on open drafts; that function preserves readiness disabling, explanatory tooltip and pending text. panel-0727 AC2 and existing request/refusal tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The full-view Set ready bar remains covered by passing panel-0727 AC3."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md retains Set ready on an open draft and in its full view, with priority on the row. Its diff against merged main contains only that intended Plan change, preserving main's newer session-counting description. panel-0727 AC4 passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied post-merge run reports 224 passes, three skips and only the recorded pre-existing tmp-cleanup failure. The previously approved tests and layout rules remain unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the approved behaviour and main's newer documentation. Closed drafts hide Set ready; opening a draft restores it with the existing checks. Relevant tests pass, with only the previously recorded unrelated failure."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ab2bf71365a2c07522e12e9f5a1070738cce977d",
    "merge": true,
    "session": "continued",
    "thread_id": "01a20e47-477c-7963-bbd3-b1126e78d938",
    "builder_response": "- Tests run: test/panel-0727.test.mjs test/panel-0586.test.mjs test/panel-0419.test.mjs test/panel-0463.test.mjs test/panel.test.mjs\n- Failing before this build (unchanged): test/tmp-cleanup.test.mjs AC1 AC2\n- Merge conflict resolution:\n  - docs/brief.md (class: logic): kept this ticket's Plan wording (Set ready on an open draft and in its full view, priority on the row) and main's newer Settings description (Cursor-like groups and rows).\n  - templates/panel.js and templates/panel-cards.css: clean auto-merge; Set ready still only on open drafts.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 676369,
      "cached_input_tokens": 576896,
      "cache_write_input_tokens": 0,
      "output_tokens": 2201,
      "reasoning_output_tokens": 112
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 27510,
      "cached": 193920,
      "write": 0,
      "output": 605
    },
    "cost_usd": 0.080462,
    "saved_at": "2026-11-24T17:25:29.066Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js ticketHead still omits Set ready when closed; panel-cards.css retains title and details truncation. Unchanged panel-0727 AC1 tests and panel-0586 AC4 browser layout test pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead still adds setReadyButton for open drafts. Passing panel-0727 AC2 exercises readiness disabling, explanation, pending text and the ready request; existing refusal tests also pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-popups.js retains readyBar. Passing panel-0727 AC3 checks Set ready in the draft's full-view bar."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The docs/brief.md diff against merged main contains only the intended Plan change: priority on the row, Set ready on an open draft and in its full view. Main's newer Settings description is preserved. panel-0727 AC4 passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied post-merge run reports 224 passes, three skips and only the recorded pre-existing tmp-cleanup failure. The ticket's behaviour tests remain unchanged from the previous approval."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The latest merge preserves both the intended Plan behaviour and main's updated Settings documentation. All relevant checks pass; the only reported failure predates this change. No new concerns."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e0f1c3f98242207282e74a04a8ed1732fcbec570",
    "merge": true,
    "session": "continued",
    "thread_id": "01a20e47-477c-7963-bbd3-b1126e78d938",
    "builder_response": "- Tests run: test/panel-0727.test.mjs test/panel-0586.test.mjs test/panel-0419.test.mjs test/panel-0463.test.mjs test/panel.test.mjs\n- Failing before this build (unchanged): test/tmp-cleanup.test.mjs AC1 AC2\n- After handed-back block: went with hold other brief panel-description ships, then try again.\n- Merge conflict resolution:\n  - docs/brief.md (class: logic): kept this ticket's Plan wording (Set ready on an open draft and in its full view, priority on the row) and main's newer `machine_parallel_builds` description.\n",
    "seconds": 12,
    "usage": {
      "input_tokens": 973187,
      "cached_input_tokens": 823936,
      "cache_write_input_tokens": 0,
      "output_tokens": 2803,
      "reasoning_output_tokens": 112
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 49778,
      "cached": 247040,
      "write": 0,
      "output": 602
    },
    "cost_usd": 0.13028,
    "saved_at": "2026-11-24T17:37:50.344Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js ticketHead still omits Set ready for closed drafts. Layout rules and tests are unchanged since approval; panel-0727 AC1 and panel-0586 AC4 browser checks pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead retains setReadyButton for open drafts. Its disabled state, explanatory tooltip and pending label remain intact. panel-0727 AC2 and existing request/refusal tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-popups.js readyBar still includes setReadyButton. panel-0727 AC3 passes, checking the draft's full-view bar."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The docs/brief.md diff against merged main contains only the intended Plan description change: priority stays on the row, with Set ready on an open draft and in its full view. Main's machine_parallel_builds description is preserved. panel-0727 AC4 passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied run reports 224 passes, three skips and only the recorded pre-existing tmp-cleanup failure. No implementation or behaviour-test changes were introduced since the previous approval."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the approved Plan behaviour and main's new build-limit documentation. Relevant tests pass; the sole reported failure predates this change. No new concerns."
  }
}
```

</details>
