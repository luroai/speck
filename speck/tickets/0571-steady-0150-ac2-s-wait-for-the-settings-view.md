---
id: "0571"
title: "Steady 0150 AC2's wait for the Settings view"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-29-steady-0150-ac2-s-wait-for-the-settings-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:08:41.949Z"
approved: "2026-11-08T23:24:01.798Z"

---
# 0571 · Steady 0150 AC2's wait for the Settings view

**Status:** 👍 approved

## Problem
0150 AC2 (Enter or Space on the focused button starts or pauses speck run) waits 10 seconds for the Settings view to finish loading its agents' lists. The lists come from the agents themselves, which took up to 12 seconds under load in 0557's runs, so the test failed twice there and a ship on a busy machine could hand a ticket back for nothing.

## Outcome
0150 AC2 passes on a busy machine, and still fails if what it checks breaks.

## Acceptance criteria
1. 0150 AC2 waits for the Settings view to finish loading with a time limit at least as long as 0472 AC3's after 0557.
2. Any other test that waits for "Loading your agents" to go with the 10-second default gets the same limit, and the Delivery log names them.
3. 0150 AC2 still fails if Enter or Space on the focused button doesn't start or pause speck run: the Delivery log says how this was checked.
4. `test/panel-0150.test.mjs` passes five runs in a row while the whole suite runs at the same time, and five runs of the file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- How fast the Settings view reads the agents' lists.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0557's whole-suite runs: "timed out waiting for the Settings view" twice. The wait is in `test/panel-0150.test.mjs`, around line 158.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes
- Pictures: none needed, the ticket changes nothing anyone sees.

## In plain words
Nothing changes in speck itself. One of speck's own checks, which makes sure Enter and Space work on the Auto-build switch, now gives Settings up to a minute to load instead of ten seconds. On a busy machine that check could fail for no real reason and send a finished ticket back, and that should now stop.

The check still fails if the keys really stop working: we broke each key on purpose and it caught both. There's nothing new to see in the panel.

Worth keeping an eye on: a different check, on how fast the lanes slide, failed once while the machine was very busy and passed when run again. It's in the inbox as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 125,584
- Elapsed since build started: 15 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

AC2: the only wait for "Loading your agents" to go that used the 10-second default was 0150 AC2's own, in `test/panel-0150.test.mjs`. A search of `test/` found no other `until` on that text: 0472 AC3 already had its limit from 0557 and waits on `settingsView.catalogues`, and the mentions in `test/settings-0407.test.mjs` and `test/settings-0409.test.mjs` are assertions against the fake page, not waits. So no other test changed.

AC3: checked by breaking the real panel in `templates/panel.js` for one run each, then restoring it. A `keydown` listener on the Auto-build button called `preventDefault` for one key. With Enter blocked, 0150 AC2 failed with "timed out waiting for Enter to start it". With Space blocked, it failed with "timed out waiting for Space to pause it". Unbroken, it passed. `test/steady-0571.test.mjs` also checks the test still presses both keys and checks both calls.

AC4: `test/panel-0150.test.mjs` passed five runs of the file alone (9 passed, 0 failed each, 12 to 13 s), and five runs while `npm test` ran the whole suite at the same time (9 passed, 0 failed each, 14 to 20 s, the suite still running at the end of each). The machine's load average was about 57.

AC5: that whole-suite run, under the load above, had 4508 passed, 1 failed and 3 skipped. The failure was 0517 AC3 (each slide's first frame within 50 ms of the lane change), at 81 ms for one frame. It passed three runs out of three when re-run alone on this branch, and this ticket changes only a wait in another test, so it isn't caused by this change. `speck ship` runs the whole suite again before anything lands.

Follow-ups: 0517 AC3 failed once under load, the second time after 0557: speck/ideas/2026-11-08-steady-the-0517-ac3-frame-time-test-under-load.md.

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
    "reviewed_sha": "a6cc64063c1d2726ca75bb8ded51f73c38ec08f9",
    "session": "fresh",
    "thread_id": "01a1bd78-e023-7eb0-aed6-e94678b72f8b",
    "builder_response": "- Tests run: test/steady-0571.test.mjs test/panel-0150.test.mjs (with --related, and the repo's commands.checks files)\n- The change: `test/panel-0150.test.mjs` gives 0150 AC2's wait for the Settings view a limit of 60 s, as 0472 AC3 has. No product code changed.\n- AC3, AC4 and AC5 were checked by running them, as the ticket's Delivery log records: Enter and Space each broken in the real panel, five runs alone and five with the whole suite beside them.\n- The one whole-suite run, needed by AC4, had one failure: 0517 AC3, a 50 ms timing budget at 81 ms under a load average near 57. It passed 3 of 3 alone on this branch. This ticket doesn't touch that code.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 124803,
      "cached_input_tokens": 86912,
      "cache_write_input_tokens": 0,
      "output_tokens": 781,
      "reasoning_output_tokens": 11
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37891,
      "cached": 86912,
      "write": 0,
      "output": 781
    },
    "cost_usd": 0.0922832,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:23:28.332Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0150.test.mjs passes AGENTS_MS=60000 to the Settings wait, matching panel-0472.test.mjs. Passing 0571 AC1 checks the limit and its use; support/panel.mjs until() honours the third argument."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Repository search confirms this was the only default-limit until() waiting for 'Loading your agents'. The Delivery log records this and explains the other occurrences. 0571 AC2 passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0150 AC2 still dispatches real browser Enter and Space events and asserts the on/off requests. The Delivery log records separate mutations blocking each key and the corresponding test failures. The unchanged keyboard assertions and passing browser runs support this."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0571-alone-{1..5}.txt and busy-{1..5}.txt record nine passes with no skips or failures each. busy.sh and busy.log confirm the whole suite remained running during all five concurrent runs. Results are recorded in the Delivery log."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The review run reports 120 passes, no failures and three skips. The concurrent whole-suite run's sole failure was an unrelated 0517 frame timing assertion; the Delivery log records three successful isolated reruns. The committed change only extends another test's Settings wait and adds checks; shipping will recheck the whole suite."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The keyboard test now allows a minute for Settings to load while preserving its checks that Enter starts and Space pauses the run. All ten required repeated runs passed. One unrelated timing test failed under heavy load; the whole suite will run again before shipping."
  }
}
```

</details>
