---
id: "0344"
title: "Leave the time a machine was asleep out of a build's time"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0342"]                # ticket ids that must be done first
created: 2026-10-20
blocked_at: ""
started: "2026-10-20T21:44:44.530Z"
waited_seconds: 662

---
# 0344 · Leave the time a machine was asleep out of a build's time

**Status:** 🔍 reviewing

## Problem
When a laptop's lid is closed during a build, every process sleeps with it, but the wall clock carries on, so the build's time counts the hours asleep. The user saw build timers of 300 minutes after closing their laptop during Cursor builds (2026-10-20). That skews the panel's Shipped figures and the README's "Built with speck" figures, which are speck's proof of how fast it is.

## Outcome
Time the machine spent asleep during a build doesn't count towards the build's time, in the panel or in speck's figures.

## Acceptance criteria
1. When the machine sleeps while speck run is on and a ticket is building or reviewing, speck run adds the time it was asleep to that ticket's `waited_seconds` once, at its first check after waking.
2. A check that comes late while the machine stayed awake, for example on a busy machine, adds nothing.
3. A ticket that was paused or blocked while the machine slept doesn't get that time added twice.
4. The README's "Built with speck" figures leave each ticket's `waited_seconds` out of its time, as the panel's Shipped median already does.
5. No test that passed before this change fails.

## Out of scope
- Tickets already recorded with time asleep in them: speck has no record of when they slept.
- Builds started by hand, with speck run off.
- The review pack's and delivery log's "Elapsed since build started", which is wall-clock time by its name.

## Notes
- `waited_seconds` already leaves blocked, paused and stopped time out (0166, `addWaited` in `scripts/core.mjs`, `scripts/stop-wait.mjs`, and pausing in `scripts/run.mjs`). The panel's timer and Shipped median subtract it (`waited` in `templates/panel.html`). The README figures come from `builtWithSpeckFigures` in `test/support/figures.mjs`, which uses `finished` minus `started`.
- Checked 2026-10-20: on Linux, Node's monotonic clock (`process.hrtime`, `performance.now()`, both libuv's `CLOCK_MONOTONIC`) leaves out time the machine was suspended, as the `clock_gettime(2)` man page says (only `CLOCK_BOOTTIME` includes it), so the gap between it and the wall clock is the time asleep.
- Unconfirmed (the user chose this, 2026-10-20): on macOS, Node's clock keeps counting through sleep, so the gap catches nothing there. macOS instead records when it last went to sleep and woke, in `sysctl -n kern.sleeptime` and `kern.waketime` (`{ sec = …, usec = … }`). This machine can't run macOS, so neither has been checked here.
- After 0342, which also changes `scripts/run.mjs`.
- The Foreman (2026-10-20 21:24 UTC) asked you: Node's clock keeps counting through sleep on macOS, so the planned clock gap only catches sleep on Linux: should 0344 use the gap on Linux plus macOS's recorded sleep and wake times (unverified here), go Linux only, or keep just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build found that the ticket's untested assumption about the clock holds on Linux but not on macOS, so it stopped before starting and needs you to choose how the ticket should change.
- The Foreman (2026-10-20 21:25 UTC) asked you: 0344 can't be built until you pick how it should handle macOS, where Node's clock keeps counting through sleep: Linux plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build stopped before starting because my earlier question about how the ticket should handle macOS sleep is still unanswered, and only you can choose the ticket's scope.
- The Foreman (2026-10-20 21:26 UTC) asked you: How should 0344 handle macOS, where Node's clock keeps counting through sleep: Linux clock gap plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build stopped before starting for a third time because the macOS question is still unanswered; speck run keeps restarting it because each note I add to the ticket counts as setting it ready again, so it will keep looping until you answer or move the ticket back to draft.
- The Foreman (2026-10-20 21:27 UTC) made draft fix ticket 0349: Don't restart a ticket's build while a Foreman question on it is waiting. Why: speck run has now restarted 0344's build four times, because each note the Foreman adds while asking counts as setting the ticket ready again, even though the user still hasn't answered the macOS question; that needs its own fix, and asking the same question a fourth time wouldn't stop it.
- The Foreman (2026-10-20 21:28 UTC) asked you: 0344 is waiting on your macOS choice and speck run keeps restarting it: pick Linux plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures, or move 0344 back to draft until you decide. I recommend Linux plus macOS.. Why: The build stopped before starting for the fifth time because the macOS question is still unanswered; draft fix 0349 already covers the restart loop, so only your answer, or moving the ticket to draft, will stop it.
- The Foreman (2026-10-20 21:29 UTC) asked you: 0344 is still waiting on your macOS choice (Linux plus macOS's recorded sleep and wake times, Linux only, or just the README figures; I recommend Linux plus macOS), and fix 0349 for the restart loop is still a draft, not shipped: will you answer, or move 0344 to draft and set 0349 ready to stop the loop?. Why: The build stopped before starting for the sixth time because the macOS question is still unanswered, and it wrongly thought fix 0349 had shipped when it's still a draft, so speck run will keep restarting 0344 until you answer or move it to draft.
- The Foreman (2026-10-20 21:30 UTC) asked you: Which way for 0344's macOS sleep: Linux clock gap plus macOS's recorded sleep and wake times (macOS part unverified; my recommendation), Linux only, or just the README figures? Until you answer, moving 0344 to draft is the only thing that stops speck run restarting it.. Why: The build stopped before starting for the seventh time because the macOS question is still unanswered, and draft fix 0349 for the restart loop isn't ready yet, so only your choice or moving 0344 to draft will stop it.
- The Foreman (2026-10-20 21:31 UTC) asked you: For 0344's macOS sleep, choose Linux clock gap plus macOS's recorded sleep and wake times (macOS part unverified; my recommendation), Linux only, or just the README figures, and until then move 0344 to draft, as that's the only thing that stops speck run restarting it.. Why: The build stopped before starting for the eighth time because the macOS question is still unanswered and fix 0349 for the restart loop is still a draft, so nothing has changed that would let the build go on.
- The Foreman (2026-10-20 21:33 UTC) resumed its build: Don't start building. Block 0344 the usual way, with this as its blocked question: How should 0344 catch sleep on macOS, where Node's clock keeps counting while the Mac sleeps: (1) the Linux clock gap plus the Mac's recorded sleep and wake times, with the Mac part marked unconfirmed in Notes (recommended), (2) Linux only, with macOS out of scope, or (3) just the README figures (criterion 4)? Then end.. Why: The build stopped again because the macOS question is still unanswered, and asking it once more would only add a note that restarts the build, so the build should block the ticket with that question, which stops the restarts until you answer.
- Went with the recommendation: Linux clock gap plus the Mac's recorded sleep and wake times, with the Mac part marked unconfirmed in Notes (chosen by the user in the panel, 2026-10-20 UTC; the panel's button couldn't record it, as the build stopped before it had a branch).
- Failing before this build: none
- Self-check: no changes. Checked: a quoted or missing `waited_seconds` in the README figures, a pending Go with the recommendation (its ticket isn't counted, as its build isn't running, so its branch isn't moved under it), a killed build (`countStop` counts from after waking, so nothing overlaps), and a ticket that blocks or is approved just after waking (it was building while asleep, so it gets the time).
- Known limits: on Linux, the wall clock set forward by more than 5 seconds between two checks reads as sleep. A sleep while `speck run` is switching to new code isn't counted, as the new code starts its own clock. From the clock gap alone, speck can't tell exactly when a sleep began, so it takes anything less than the sleep's length after the last check as before it, which is wrong only if the machine was awake longer than it then slept between two checks. Recording the time commits the ticket in its build's worktree while the build runs, as pausing does while it's held, so any change the build hasn't committed to its ticket goes into that commit.
- Tests ran: `test/sleep-0344.test.mjs` and the release tests that use `test/support/figures.mjs`.
- The Foreman (2026-10-20 21:48 UTC) resumed its build: The user has answered the macOS question: go with option 1, the Linux clock gap plus the Mac's recorded sleep and wake times, with the Mac part marked unconfirmed in Notes (see the 'Went with the recommendation' note). Ignore the earlier instruction to block and end: 0344 is building now, so carry on building it to the acceptance criteria and through review.. Why: The user answered the macOS question, but the restarted build followed the Foreman's older instruction to block and end, so it stopped without building; it should now build the option the user chose.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
How should 0344 catch sleep on macOS, where Node's clock keeps counting while the Mac sleeps: (1) the Linux clock gap plus the Mac's recorded sleep and wake times, with the Mac part marked unconfirmed in Notes (recommended, as it covers both machines speck runs on), (2) Linux only, with macOS out of scope, or (3) just the README figures (criterion 4)?

Recommended: Linux clock gap plus the Mac's recorded sleep and wake times
Changes what you'd notice: yes
Clear winner: no

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
    "reviewed_sha": "533c12469aec7269c2162a24ae00cfc81da308b6",
    "thread_id": "01a15b4c-d67d-7610-a351-bdcb5d49b8fc",
    "seconds": 45,
    "usage": {
      "input_tokens": 240402,
      "cached_input_tokens": 180608,
      "cache_write_input_tokens": 0,
      "output_tokens": 1478,
      "reasoning_output_tokens": 248
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:52:49.688Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests exercise established builds, but scripts/run.mjs:431 calls sleeps.check before launching or resuming builds. sleepQueue records eligibility only during that check, so a build started afterwards misses any sleep before the next check."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "clockGap compares wall-clock and monotonic elapsed time. The passing AC2 tests exercise late awake checks on Linux and macOS, including an old macOS sleep record."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "scripts/sleep-wait.mjs:95 uses the previous check's eligibility without checking when a pause or blocked period began. The AC3 tests cover states established before that previous check, but miss transitions between checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "test/support/figures.mjs builtWithSpeckFigures subtracts waited_seconds. The passing AC4 test verifies the resulting median and an individual ticket's duration."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied run reports 208 passed, 0 failed and 3 skipped across the ticket tests and affected release tests. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/sleep-wait.mjs:95",
        "issue": "Sleep can be counted twice if a ticket becomes paused or blocked between checks. For example, a check records an active build, the user pauses it, then closes the laptop before the next check. On waking, sleepQueue adds the entire sleep because the ticket was previously eligible. Playing the build later adds the same hours through countPause. A blocked transition before sleep has the equivalent overlap through waitFields.",
        "suggested_fix": "Account for the actual sleep interval and its overlap with pause and blocked intervals, preserving sleep credit when those transitions happen after waking. Add regression tests for pausing and blocking after the preceding check but before sleep, including the eventual resume.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs:431",
        "issue": "A newly launched or resumed build can miss an entire sleep. sleeps.check snapshots eligible tickets before goWiths, resumeKilled, handBacks and launch run. If a build starts and the laptop sleeps before the next poll, the first check after waking detects the sleep but excludes that ticket because it is absent from before. The clock baseline then advances, permanently losing those hours.",
        "suggested_fix": "Track build eligibility changes when builds start or resume, with timestamps sufficient to credit sleep during their active interval. Add a behavioural test covering launch or resume followed by sleep before the next poll; the current source-pattern integration test cannot catch this ordering bug.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The README calculation works, and the tests pass. Sleep accounting still has two timing gaps: it can miss sleep just after a build starts, or subtract the same hours twice when a build is paused or blocked just before sleep. Both need fixing before merge. The macOS implementation remains unverified on a real Mac, as agreed in the ticket."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2588fa05d68d508305eec5ecdaa6c1884a7da760",
    "thread_id": "01a15b4c-d67d-7610-a351-bdcb5d49b8fc",
    "seconds": 39,
    "usage": {
      "input_tokens": 550158,
      "cached_input_tokens": 469248,
      "cache_write_input_tokens": 0,
      "output_tokens": 2689,
      "reasoning_output_tokens": 375
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T21:56:03.925Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "sleepQueue now reads current tickets and run records rather than using the previous eligibility snapshot. Passing AC1 tests cover building, reviewing, launch between checks, exit after waking and simulated macOS sleep."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 tests exercise late awake checks on both platforms. clockGap still subtracts monotonic elapsed time, and macGap rejects sleep records from before the interval."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The new F1 tests cover a pause that remains marked until after sleepQueue runs. playBuild removes that mark when resuming, so a play before the first post-wake check still causes duplicate accounting. The builder acknowledges this in Notes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "builtWithSpeckFigures subtracts waited_seconds, and the passing AC4 test verifies both an individual duration and the resulting median."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied targeted run reports 212 passed, 0 failed and 3 skipped. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/sleep-wait.mjs:inHandAsleep",
        "issue": "The duplicate-accounting fix is incomplete. If a paused build is played after waking but before speck run checks, countPause adds the whole pause and playBuild removes its mark. sleepQueue then sees a running build with no pause and adds the sleep again. A read-only invocation confirmed that inHandAsleep accepts this state for another 3,600 seconds of credit. The equivalent loss of blocked history can occur when a blocked ticket resumes before the check. Documenting this limitation does not satisfy criterion 3.",
        "suggested_fix": "Retain enough pause and blocked interval history after resume to exclude sleep already counted as waiting. Add regression tests that resume before the first post-wake check and assert the final waited_seconds counts the sleep once.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/sleep-wait.mjs:sleepQueue",
        "issue": "The previous eligibility snapshot excluded builds launched between checks. The snapshot has been removed, and current build state is now evaluated against the detected sleep.",
        "suggested_fix": "No further change required for this finding; the passing AC1 F2 regression test exercises launch between checks followed by sleep.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Builds started between checks now receive sleep credit correctly, and all reported tests pass. One blocking problem remains: resuming a paused or blocked build before the first check after waking can subtract the sleeping hours twice. The new tests do not cover that order of events."
  }
}
```

</details>
