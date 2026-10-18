---
id: "0319"
title: "Stop calling speck run's own builds outside speck run"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:35:05.298Z"

---
# 0319 · Stop calling speck run's own builds outside speck run

**Status:** 🔍 reviewing

## Problem
Since 0300, `speck run` says a build it has just launched itself is "being built outside speck run". On 2026-10-18 it said so of 0302, 0305 and 0309 a moment after launching each. The build is counted once and runs normally, but the message is wrong, and it makes the log and the Foreman's detail misleading.

## Outcome
`speck run` says a build is outside speck run only when it didn't start it.

## Acceptance criteria
1. A build `speck run` launches is reported as launched once, and never as being built outside speck run, for as long as it runs.
2. A build `speck run` resumes (a hand-back, a stopped build, or a recommendation taken) is reported as resumed, and never as outside speck run.
3. A build started with `/speck-build` in a conversation, or resumed by hand, is still reported once as being built outside speck run, as 0300 made it.
4. Builds that carry on through a switch to new code are reported as 0301 made them.

## Out of scope
- Anything else 0300 does.

## Notes
- The message is written where `scripts/run.mjs` adopts builds (search for "being built outside speck run").
- Failing before this build: none
- Cause found: on 2026-10-18 two speck runs were watching this repo at once (processes 434685, running since 16 Oct, and 1571492, holding the lock since 14:54), both logging to the same run.log. Each launch by one was found a check later by the other, which took it for a build outside speck run. A single speck run never mislabels its own builds (0300 AC5's test). The fix labels a found build by its record: only records marked `seen`, which only noteBuild and claimResumed write, are outside speck run; any other is "already being built". How two speck runs got past the lock is a separate follow-up.
- Self-check: no changes. Unusual records (no `seen`, `seen` not true) read as another speck run's build; carried builds (0301) and the start-up adoption are untouched.

## In plain words
speck run no longer says a build it started, or resumed, is "being built outside speck run". The message was showing up because a second speck run was watching the same project and mistook the first one's builds for ones started by hand. Builds you start yourself from a conversation, or resume by hand, are still reported as outside speck run, once. To see it, watch speck run's log as it launches a ticket: there's a "Launched" line and no "outside speck run" line after it. Keep an eye out for two speck runs on one project, which shouldn't happen: that's saved as a separate idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Two speck runs watched this repo at once, past the lock: saved as speck/ideas/2026-10-18-find-how-two-speck-runs-watched-one-repo.md.
  - With two speck runs, a build stopping is logged by both ("build exited" and "build … stopped"). Goes away with the follow-up above.

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
    "reviewed_sha": "6199128d1fd2ef7a97a74e24cde022b3d14c8633",
    "thread_id": "01a1512a-da1e-74b2-b01b-45d1b8b40580",
    "seconds": 24,
    "usage": {
      "input_tokens": 137795,
      "cached_input_tokens": 90880,
      "cache_write_input_tokens": 0,
      "output_tokens": 919,
      "reasoning_output_tokens": 60
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:39:09.219Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run.mjs adoptSeen uses adoptedAs and skips running builds. Passing 0319 integration test checks adoption of another run's launch; passing 0300 AC5 integration test checks an actual launch through its exit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "resumeKilled in run.mjs, resumeHandBack in hand-back.mjs and goWithQueue in go-with.mjs preserve seen:true from earlier conversation or manual builds. adoptedAs then labels these speck-run-resumed builds outside speck run. The 0319 AC2 test constructs only records without seen:true and misses this lifecycle."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "noteBuild and claimResumed mark external builds seen:true. Passing 0319 AC3 tests exercise both writers, and the integration test verifies the outside-speck-run message appears once."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "adoptEarlierBuilds retains the carried-build message unchanged. The passing 0319 integration test checks 'carries on through the switch' for a handed-over running build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/seen-builds.mjs",
        "issue": "seen:true describes an earlier external build, but all three speck run resume paths retain that flag. If a conversation build stops and speck run resumes it, another watching run still calls the new build outside speck run. This leaves criterion 2 unsatisfied in the same multiple-run situation this fix targets.",
        "suggested_fix": "Ensure records written when speck run resumes a build identify its current ownership, including records previously marked seen:true. Add coverage starting with a genuinely external record and exercising the resume writers before checking the adoption message.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly labels newly launched builds and preserves manual-build and code-switch reporting. One case remains: when speck run resumes a build previously run by hand, its old external-build marker survives and can produce the same misleading message."
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
    "reviewed_sha": "9c09d43b1f81c3bc15a38cc5e75540ba3e7d32a7",
    "thread_id": "01a1512a-da1e-74b2-b01b-45d1b8b40580",
    "seconds": 15,
    "usage": {
      "input_tokens": 260220,
      "cached_input_tokens": 196224,
      "cache_write_input_tokens": 0,
      "output_tokens": 1507,
      "reasoning_output_tokens": 60
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:44:01.326Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run.mjs adoptSeen skips running builds and uses adoptedAs to label found records. Passing 0319 tests cover another run's launch; the passing 0300 AC5 integration test follows an actual launch through exit without an outside-speck-run message."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "All four resume writers now use resumedRecord to remove seen. Passing 0319 AC2 tests exercise hand-back, recommendation and Foreman resume writers from seen:true records, checking both saved and build records. The integration test exercises stopped-build resumption through a real speck run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "noteBuild and claimResumed still mark external builds seen:true. Passing 0319 AC3 tests exercise both writers, and the integration test checks that the external-build message appears once."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "adoptEarlierBuilds retains its carried-build reporting. The passing 0319 integration test verifies 'carries on through the switch' for a handed-over build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs",
        "issue": "External-build markers previously survived when speck run resumed those builds.",
        "suggested_fix": "Implemented: resumedRecord removes seen in every resume writer, with regression coverage for each path.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change now distinguishes speck run's launched and resumed builds from builds run by hand, while preserving code-switch reporting. The previous resume-marker problem is fixed. All reviewed criteria pass; the reported test run has no failures."
  }
}
```

</details>
