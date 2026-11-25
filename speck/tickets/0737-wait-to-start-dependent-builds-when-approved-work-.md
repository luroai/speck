---
id: "0737"
title: "Wait to start dependent builds when approved work conflicts with main"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-25T07:40:11.352Z"

---
# 0737 · Wait to start dependent builds when approved work conflicts with main

**Status:** 🔍 reviewing

## Problem
Since 1.4, speck run starts a waiting ticket on the approved work of the ticket it waits for. When that approved work no longer merges cleanly into `main`, the build can't start and stops at once, and speck run then leaves the ticket as "ended without starting" until someone sets it ready again. On 2026-11-24, 0707 and 0730 both stalled this way behind 0729.

## Outcome
A waiting ticket starts on approved work only when that work merges cleanly into `main`, and otherwise waits for it to ship and starts by itself.

## Acceptance criteria
1. speck run doesn't start a ticket on another ticket's approved work when that work doesn't merge cleanly into `main`; it waits until that ticket has shipped, then starts it from `main` as usual.
2. While it waits for this reason, `speck status` and the panel say it is waiting for that ticket to ship because its approved work clashes with `main`, naming the ticket.
3. A ticket whose build stopped before starting for this reason is started again by speck run once it can start, without being set ready again.
4. When the approved work merges cleanly into `main`, the ticket starts on it as today.
5. No test that passed before this change fails.

## Out of scope
- Settling the clash itself: that happens at the approved ticket's ship, as today.

## Notes
- Made by speck's watch agent on 2026-11-24 when 0730 couldn't start; filled in the same day at the user's say-so.
- Starting on approved work is 0674/0675 (`startsOn`, `afterWait` in `scripts/built-on.mjs`); the "ended without starting" hold is `ownWait` in `scripts/run.mjs`, cleared by `readyAgain` in `scripts/build-records.mjs`.
- `speck merge-check` can tell whether a branch merges cleanly into the base branch.
- Failing before this build: none
- Self-check: speck run won't relaunch a ticket on the clash mark alone, only once the base branch's or the approved ticket's branch tip has moved since (no relaunch loop); the build log is read for speck start's new refusal wording as well as the old merge refusal; trimmed run.mjs back to the 600-line limit.

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
    "reviewed_sha": "f14f26414cc28194773f1032765af24648bf9735",
    "session": "fresh",
    "thread_id": "01a211b0-8b3c-70e3-9bd1-828c1ceeda25",
    "builder_response": "- Tests run: `speck test --related test/built-on-0737.test.mjs` (the ticket's own file plus every existing test file naming a changed file; 5329 tests, 0 failing).\n- How it works: `startWaits` (scripts/built-on.mjs) now checks with `git merge-tree` that an approved after: ticket's branch merges cleanly into the base branch before offering it as `on`; otherwise it returns a `why` and `clash: { id, base }`. `speck start` therefore refuses before making a branch, and `speck status --json` gives `start_clash`. `afterWait` (speck run's reason, which `speck status` and the panel header show) says \"waiting for <id> to ship, as its approved work clashes with <base>\"; the panel's row and full view say so too.\n- AC3: when a build ends with its ticket still ready, speck run keeps in its run record `start_clash` (from the status row, or from speck start's refusal in the build log) and the base and clash ticket's branch tips. `ownWait` lets it launch again, without it being set ready, once nothing in after: holds it back and those tips have moved (shipped, or its work changed), so it can't loop on an unchanged clash.\n- Pictures taken of the Build lane row and the full view, light and dark.\n- Note: scripts/run.mjs is exactly at the 600-line limit of the 0078 check.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 182623,
      "cached_input_tokens": 130560,
      "cache_write_input_tokens": 0,
      "output_tokens": 945,
      "reasoning_output_tokens": 121
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52063,
      "cached": 130560,
      "write": 0,
      "output": 945
    },
    "cost_usd": 0.126632,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T07:52:29.365Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "built-on.mjs startWaits checks mergeability before offering approved work. Passing AC1 tests cover refusal and starting from main after shipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "afterWait exposes the named clash reason; passing AC2 tests cover the reason used by status and the panel row and full view."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "build-records.mjs clashWaited requires start_clash in the saved record. Previously stalled builds lack that field. run.mjs only populates it when handling a build's exit, so an already-ended build retained in launched across a code switch remains held. Tests manually create the new mark rather than exercising this recovery."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 test starts a ticket on cleanly merging approved work after main has advanced."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run completed with 5326 passing, three skipped and no failures. The changes show no additional regression requiring a whole-suite run at this stage."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "Existing builds that ended before this update cannot recover automatically across speck run's code switch. Their ids remain in launched, but their records contain only still_ready_commit. clashWaited rejects records without start_clash, and the old refusal log is only parsed during exit handling, which has already happened. Even after the dependency ships, ownWait reports 'ended without starting' indefinitely.",
        "suggested_fix": "Recognise the old merge refusal for already-ended records when evaluating recovery, while respecting explicit stops and avoiding repeated launches. Add a process-level regression test covering an old-format stalled record carried through a code switch, followed by dependency shipping and automatic launch without editing the dependent ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "New builds correctly wait when approved work clashes with main, and the panel explains why. However, builds already stalled before this update can remain stuck after their dependency ships. That recovery gap needs fixing before approval."
  }
}
```

</details>
