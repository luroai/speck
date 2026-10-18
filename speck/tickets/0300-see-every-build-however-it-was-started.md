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
speck run now notices every build of your tickets, not only the ones it started itself. If you build a ticket by typing `/speck-build` in a conversation, or carry on a stopped build by hand, speck run counts it against how many builds may run at once, won't start a second build of it, and the panel shows it as building rather than stopped. If that build stops partway, speck run handles it as it would one of its own. Nothing needs doing by hand: the build is noticed the next time it runs one of speck's commands, or straight away when it's a stopped build carried on by hand.

To see it, start speck run, then build a ticket in a conversation: speck run's output says the ticket "is being built outside speck run", and the panel shows it as building. Once the build approves or blocks the ticket, it stops taking up a build slot, even if the conversation stays open.

Worth keeping an eye on: if a conversation building a ticket is closed partway, speck run carries that session on by itself, as it does for its own builds.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups:
- Inbox: speck/ideas/2026-10-18-let-speck-pause-and-stop-a-build-started-outside-speck-run.md (pause and stop don't reach a build speck run didn't start).
- Skipped as a duplicate: a stopped build resumed by hand gets a new process in its run record, so the time it waited stopped may not be added to the build's waiting time. Matches speck/ideas/2026-10-15-know-when-a-stopped-build-starts-again.md.
- Known limit: a conversation's build that ends partway is resumed by speck run with build_command when its session can be resumed, as speck run's own killed builds are.
- Known limit: a build is found from the agent above a speck command through shells only (Claude Code, Codex and Cursor's CLI); a command run any other way, or from a test runner, isn't taken for a build.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ce7bad652b199e1d1d26da70cd1999b4c16dcedf",
    "thread_id": "01a14f48-203b-7933-b7d7-fee5045f109b",
    "seconds": 23,
    "usage": {
      "input_tokens": 327268,
      "cached_input_tokens": 269184,
      "cache_write_input_tokens": 0,
      "output_tokens": 2005,
      "reasoning_output_tokens": 203
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:54:26.640Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs adoptSeen counts external builds before scheduling. Passing AC1 tests verify capacity limits, prevention of duplicate launches, and release after approval, including during code switching and after external resumption."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test verifies that noteBuild and claimResumed remove an exited record's stopped state in statusData. adoptSeen invokes claimResumed on each normal check."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkAdopted uses the existing killedInHand and lookInto handling. The passing combined AC1/AC3 test verifies stopped-partway handling and capacity release after an external process ends."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/speck.mjs dispatch calls noteThisBuild automatically. Passing AC4 tests exercise ancestry detection and real CLI calls for next, start and diffstat, verifying that records identify the agent process."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests verify the SPECK_BUILD_SESSION exclusion, preservation of existing live records, and normal completion of a runner-launched build without external adoption."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "External conversations could prevent a code switch after their tickets finished.",
        "suggested_fix": "Completed: tick now calls releaseSeen before switchWhenIdle. The new passing regression test verifies switching while the approved build's conversation remains alive.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run.mjs",
        "issue": "An externally resumed build previously launched by this runner could retain its slot after approval.",
        "suggested_fix": "Completed: adopt tracks seen independently from fresh, so releaseSeen releases the current external process. The new passing regression test verifies another ticket launches while the resumed conversation remains alive.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "External builds are counted, shown and watched automatically. Both lifecycle issues are fixed and covered by passing regression tests. All acceptance criteria pass, with no blocking findings remaining."
  }
}
```

</details>
