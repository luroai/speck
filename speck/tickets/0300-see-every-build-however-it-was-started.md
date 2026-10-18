---
id: "0300"
title: "See every build, however it was started"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0287"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:44:56.380Z"

---
# 0300 · See every build, however it was started

**Status:** 🔍 reviewing

## Problem
speck run looks for builds it didn't start only when it starts up or switches to new code. A build started afterwards with `/speck-build` in a conversation, or a build resumed by hand, isn't counted towards `max_parallel_builds`, isn't watched for stopping partway, and can show in the panel as stopped while it's running, because its run record says it exited. Seen on 2026-10-18 with 0290 and 0291, resumed by hand.

## Outcome
speck run sees every build of the repo's tickets, however it was started, and counts, shows and watches each one as it does its own.

## Acceptance criteria
1. A ticket whose build was started with `/speck-build` while speck run is running is counted towards `max_parallel_builds` within one of speck run's checks, and speck run doesn't start a build of it.
2. A build resumed outside speck run, for a ticket whose run record says its build exited, shows in the panel as building, not stopped, within one of speck run's checks.
3. When such a build's process ends with its ticket still building or reviewing, speck run treats it as it does a build of its own that stopped partway.
4. A build's process is found from the build itself: the speck commands every build runs (`speck start`, and the commands it runs as it works) record which process they're running in, so nothing has to be done by hand.
5. Builds speck run starts itself are counted, shown and watched exactly as today.

## Out of scope
- Starting a build from the panel.

## Notes
- Today the adoption is `adoptEarlierBuilds` in `scripts/run.mjs`, run only at start. Run records are `speck/.cache/runs/<id>.json`.
- The Foreman (0286, 0287) relies on seeing every build.
- Failing before this build: none
- Self-check: a build outside speck run stops counting once its ticket is no longer building or reviewing, since a conversation stays open after it approves or blocks, and speck run may then launch that ticket when it's ready again; builds speck run started skip the check before reading anything; the brief names only the commands a test covers.

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
    "reviewed_sha": "861f56b062220eb919572641517412a809c313f8",
    "thread_id": "01a14f48-203b-7933-b7d7-fee5045f109b",
    "seconds": 38,
    "usage": {
      "input_tokens": 215113,
      "cached_input_tokens": 165248,
      "cache_write_input_tokens": 0,
      "output_tokens": 1320,
      "reasoning_output_tokens": 203
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:52:06.679Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 tests exercise ordinary adoption and slot release, but scripts/run.mjs fails to release external builds during a code switch or after manually resuming a build previously launched by this runner."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test exercises noteBuild and claimResumed, verifying that statusData clears build_exit and build_stopped."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing combined AC1/AC3 test kills an adopted process and verifies stopped-partway handling and capacity release; checkAdopted uses the existing killedInHand and lookInto paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 tests exercise process ancestry detection and real CLI dispatch through an agent stand-in for next, start and diffstat."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 tests verify preservation of live records, exclusion through SPECK_BUILD_SESSION, and a runner-launched build completing without external adoption."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "tick returns for switchWhenIdle before calling adoptSeen. If code changes while an external conversation is building, the switch waits for that process to end. Approving or blocking its ticket cannot release its slot because the release logic is now skipped on every check. An open conversation can therefore stall the runner's code switch indefinitely.",
        "suggested_fix": "Reconcile adopted external builds' ticket status before evaluating whether the runner is idle for a code switch. Add coverage where code changes, an external build approves its ticket, and its conversation remains alive.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "adopt sets seen to rec.seen === true && fresh, where fresh means the ticket is absent from launched. A build previously launched by this runner remains in launched after exiting. If it is then resumed by hand, claimResumed correctly marks its record seen, but adopt discards that classification. When the resumed build approves or blocks, its open conversation continues occupying a build slot, contrary to the ticket's explicit self-check.",
        "suggested_fix": "Track ownership of the current process independently from whether this runner previously launched the ticket. Add a regression test for a runner-launched build exiting, being resumed externally, and completing while its conversation remains alive.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Normal external builds are detected and shown correctly, and the supplied tests pass. Two lifecycle gaps can still leave an open conversation occupying a build slot after its work finishes, including indefinitely delaying a code update. These need fixing before merge."
  }
}
```

</details>
