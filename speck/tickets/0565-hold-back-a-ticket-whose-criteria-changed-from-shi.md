---
id: "0565"
title: "Hold back a ticket whose criteria changed from shipping by itself"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:01:57.301Z"

---
# 0565 · Hold back a ticket whose criteria changed from shipping by itself

**Status:** 🔍 reviewing

## Problem
A build can change its ticket's acceptance criteria, as 0529's did when a criterion turned out wrong, and nothing records it: no copy of the criteria is kept from when the ticket was set ready, and nothing compares them. Once speck decides questions itself, a ticket could ship by itself with criteria you never agreed to.

## Outcome
A ticket whose acceptance criteria differ from the ones it was set ready with waits for you at Ship, and its review pack shows what changed.

## Acceptance criteria
1. A ticket's criteria count as changed when the Acceptance criteria section in its branch's copy of the ticket differs from the one in the base branch's copy where its branch started, apart from spaces at the ends of lines.
2. `auto_ship` never ships a ticket whose criteria changed: `speck run`'s ship queue leaves it approved, and `speck ship <id> --auto` refuses, saying its acceptance criteria changed since it was set ready. `speck ship <id>` run by you, and the panel's Ship button, ship it as before.
3. Its review pack has a "Criteria changed" part above the criteria, giving for each criterion changed, added or removed the text it was set ready with and the text now.
4. `speck status --json` gives each open ticket `criteria_changed`, true or false, and the Build card of an approved ticket whose criteria changed says it waits for you because a criterion changed.
5. No test that passed before this change fails.

## Out of scope
- Stopping a build from changing its criteria.
- Pull request mode's own merge rules beyond `auto_ship`.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Decided with the user on 2026-11-08: when speck changes a criterion, the ticket waits at Ship rather than the build stopping to ask.
- Today: `autoShipWhyNot` in `scripts/ship.mjs` (about lines 406 to 416) decides what ships by itself; the review pack is in `scripts/pack.mjs` (about lines 95 to 108); the board is `statusData` in `scripts/speck.mjs` (about lines 428 to 460).
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a criterion over several lines now has its line ends compared line by line, so a blank line inside it is kept

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "67d75a494db15d1dba37dfa52c7d3a41292ff76c",
    "session": "fresh",
    "thread_id": "01a1bd78-c4e9-7913-abaf-73d4e26329cd",
    "builder_response": "- Tests run: test/criteria-0565.test.mjs test/run-settings-0549.test.mjs test/seen-builds-0300.test.mjs test/stopped-wait-0217.test.mjs test/turns-0109.test.mjs test/waiting-0166.test.mjs, plus the commands.checks files.\n- An earlier `speck test --related` run over every test file naming a changed file had 5 failures among 2216 tests, all in `speck run` and pause timing tests, with the machine's load average near 60 from other builds (a run just before had one different failure, test/seen-builds-0300). None of them involve this change; they are the extra files above, and all pass in this run.\n- Criterion 5 is checked by those runs here, and in full by `speck ship`.\n- Pictures of the Build card and review pack, in both looks, are filed with `speck picture`.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 173173,
      "cached_input_tokens": 124672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1019,
      "reasoning_output_tokens": 122
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 48501,
      "cached": 124672,
      "write": 0,
      "output": 1019
    },
    "cost_usd": 0.1196592,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:23:23.919Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/criteria-changed.mjs: criteriaChange uses core.mjs: forkPoint, which returns the current merge-base. After merging newer base commits into the ticket branch, this can move the comparison baseline beyond where the branch started. The passing merge test leaves the base's criteria unchanged, so misses this."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "autoShipBlocker and statusData correctly use criteriaChange, and the reported CLI and queue tests pass. However, the moving baseline in F1 can return unchanged and allow automatic shipping despite criteria differing from the original."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "pack.mjs inserts criteriaChangedLines above the criteria in both packs. Reported AC3 tests cover changed, added, removed and multiline criteria, table escaping and section-only changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData exposes criteria_changed; panel-model.js and panel.js explain the wait. Reported AC4 tests exercise CLI JSON and closed and open Build cards, including tasks."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied final run reports 198 passing tests, zero failures and three skips, including the files that previously failed during this build. No unrelated test changes appear in the diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/criteria-changed.mjs",
        "issue": "The original criteria baseline is not stable. If main changes the ticket's criteria after the ticket branch starts, and the ticket merges main and adopts those criteria, forkPoint returns that newer main commit. Both sides then contain the new criteria, so criteriaChange returns null, the warning disappears and automatic shipping becomes eligible. The criteria still differ from those where the branch originally started.",
        "suggested_fix": "Use a stable record of the branch's original base commit or original criteria. Add a regression test where main changes the criteria after branching and the ticket merges that change; verify the change remains flagged, appears in the pack and blocks automatic shipping.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shipping guard, review pack and panel work in the tested cases. However, merging newer base-branch criteria can erase the comparison history and let changed criteria ship automatically. Preserve the original baseline before merging."
  }
}
```

</details>
