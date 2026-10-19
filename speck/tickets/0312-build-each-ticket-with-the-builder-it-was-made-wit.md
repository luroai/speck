---
id: "0312"
title: "Build each ticket with the builder it was made with"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0319", "0317"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:43:06.442Z"
approved: "2026-10-19T05:56:57.211Z"

---
# 0312 · Build each ticket with the builder it was made with

**Status:** 👍 approved

## Problem
A ticket records the builder it was made with, but `speck run` builds every ready ticket with the builder in `speck/config.yml`. After switching the builder, tickets that still say `builder: claude` are built with the new one, which the ticket doesn't say.

## Outcome
`speck run` builds each ticket with the builder the ticket records.

## Acceptance criteria
1. With `build_command` blank, `speck run` starts each ticket's build with the command for the builder in that ticket's `builder:` field (0289, 0290), and passes `builder_model` only when that builder is the one in `speck/config.yml`.
2. A ticket with no `builder:` field is built with the builder in `speck/config.yml`, as today.
3. When `build_command` is set, every build uses it, as today, and `speck run` says once when it starts that tickets' own builders are ignored because `build_command` is set.
4. A ticket whose builder isn't installed isn't started, and the Foreman's detail says why.
5. Hand-backs and resumed builds use the builder the build started with.

## Out of scope
- Changing a ticket's builder from the panel.

## Notes
- From `speck/ideas/2026-10-18-build-older-tickets-with-the-builder-they-were-made-with.md` (inbox, from 0293). Builds start in `scripts/run.mjs`.
- Failing before this build: none
- With `build_command` blank, a ticket recording `claude` is started with the `build_command` speck sets up for Claude Code. A config whose own builder is `claude` with `build_command` blank is still refused when `speck run` starts, as today (AC2), so this applies when the config's builder is Codex or Cursor.
- AC3's line is said only when a ticket that isn't done or cancelled records a builder other than the config's, so the default Claude Code setup, which sets `build_command`, isn't told about it on every start.
- The Codex and Cursor `speck run` tests in 0289 and 0290 now give their ticket `builder: codex` and `builder: cursor`: with `builder: claude`, as before, it's now built with Claude Code.
- Self-check: no changes

## In plain words
When speck builds tickets on its own, each ticket is now built by the coding agent it was made with, such as Claude Code or Codex, rather than whichever one is set in the settings today. This applies when no build command is set by hand, which is how Codex and Cursor are set up. A ticket whose agent isn't installed on this machine isn't started: speck says why, and the Foreman's detail shows it. A build that is carried on later, after it stopped or was handed back, carries on with the agent it started with.

To see it, set the builder to Codex, leave a ready ticket that says it was made with Claude Code, and turn speck run on: that ticket is built by Claude Code, and a Codex ticket by Codex.

Worth keeping an eye on: with a build command set by hand, which is how Claude Code is set up, every ticket still uses that command. speck run then says once, as it starts, that the agent each ticket records is ignored.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The same-model review guard still treats builder_model as applying to every Claude ticket, although this change deliberately removes it when the configured builder differs.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,206,079
- Elapsed since build started: 14 min
- Changed lines: 143 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- With `builder: claude`, `build_command` is set, so tickets made with Codex or Cursor are built by Claude Code, while the Settings view says tickets keep their builder: speck/ideas/2026-10-19-build-codex-tickets-with-codex-after-switching-to-claude.md.
- Skipped, a duplicate: the same-model check still treats builder_model as not passed to Codex and Cursor builds, matching speck/ideas/2026-10-18-same-model-check-counts-builder-model-on-codex-builds.md.

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
    "reviewed_sha": "d01080c52ceca38f543edf2234b798e88e4bc89f",
    "thread_id": "01a152b5-4876-7911-80cc-6b629f3b14a6",
    "seconds": 39,
    "usage": {
      "input_tokens": 268841,
      "cached_input_tokens": 215296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1288,
      "reasoning_output_tokens": 318
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:50:13.466Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ticket-builder.mjs buildPlan/configFor select each ticket's builder and suppress another builder's model. Passing AC1 unit and process tests exercise this."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketBuilder falls back to configBuilder; passing AC2 tests cover absent, blank and null fields."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "launchPlan preserves an explicit build_command; runOn prints ignoredBuildersNote at startup. Passing AC3 process test verifies the command and single notice."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "buildPlan checks installation; launchPlan records the refusal for the Foreman. Passing AC4 process test checks no build starts and the Foreman's detail explains why."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Run records retain plan.agent; resumeFor dispatches on that recorded agent for both resumption and hand-backs. Passing AC5 tests exercise Claude and Codex across configuration changes; existing Cursor tests cover its session resumption."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/same-model.mjs",
        "issue": "The same-model review guard still treats builder_model as applying to every Claude ticket, although this change deliberately removes it when the configured builder differs. Verified directly: with config builder codex and builder_model gpt-6.1-sol, a Claude ticket with Claude reviewer_model sonnet returns no same-model problem, while buildPlan starts Claude without any model. The builder can therefore use its default Sonnet model and be reviewed by that same model despite the independence guard.",
        "suggested_fix": "Make ticketSameModelProblem use the model actually passed to the ticket's selected builder. When build_command is blank and the ticket's builder differs from the configured builder, treat its builder model as unspecified. Add a regression test for this mixed-builder case.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The builder selection, missing-installation reporting and session resumption meet the ticket's criteria. One safeguard needs updating: a ticket can now pass the independent-review check using a model setting that its builder never receives, allowing the same model to build and review it."
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
    "reviewed_sha": "65fc1865ac164cf8e6f074c5b18127ecc8315e6c",
    "thread_id": "01a152b5-4876-7911-80cc-6b629f3b14a6",
    "seconds": 17,
    "usage": {
      "input_tokens": 385354,
      "cached_input_tokens": 323712,
      "cache_write_input_tokens": 0,
      "output_tokens": 1792,
      "reasoning_output_tokens": 318
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:51:51.301Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ticket-builder.mjs buildPlan/configFor choose the ticket's builder and pass builder_model only for the configured builder. Passing AC1 unit and process tests cover command selection; the new regression test covers the review guard."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketBuilder falls back to configBuilder for missing or blank builder fields. The passing AC2 test exercises these cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "launchPlan uses the explicit build_command; runOn prints ignoredBuildersNote once at startup. The passing AC3 process test checks both behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "buildPlan checks installation and launchPlan records the refusal for the Foreman. The passing AC4 process test verifies no build starts and the detail explains why."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "runOn stores the selected agent in the run record; resumeFor uses that agent for resumed builds and hand-backs. Passing AC5 tests cover configuration changes, with existing Cursor tests covering chat resumption."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/same-model.mjs",
        "issue": "The review guard previously counted a configured builder_model that the ticket's builder would not receive. ticketSameModelProblem now treats that builder as using its default model and refuses potentially identical reviewers.",
        "suggested_fix": "Implemented, with a passing regression test covering the mixed-builder case.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Each ticket now uses its recorded builder, missing installations are explained, and resumed builds retain their original builder. The independent-review safeguard has also been corrected. All criteria pass, with no blocking findings remaining."
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
    "reviewed_sha": "3428b30ecf5073d93683842a3b1687749c206d11",
    "merge": true,
    "thread_id": "01a152b5-4876-7911-80cc-6b629f3b14a6",
    "seconds": 18,
    "usage": {
      "input_tokens": 546483,
      "cached_input_tokens": 463616,
      "cache_write_input_tokens": 0,
      "output_tokens": 2321,
      "reasoning_output_tokens": 318
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:56:54.349Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ticket-builder.mjs buildPlan/configFor select each ticket's builder and restrict builder_model to the configured builder. Passing AC1 tests cover command selection and the review guard. The merged sameModelProblem preserves main's Codex model handling and this ticket's model suppression."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketBuilder falls back to configBuilder when the ticket records no builder. The passing AC2 test covers missing, blank and null values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "launchPlan preserves explicit build_command; runOn prints ignoredBuildersNote once at startup under the ticket's stated conditions. The passing AC3 process test checks both behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "buildPlan checks installation; launchPlan records the reason and runOn forwards it to the Foreman. The passing AC4 process test verifies no build starts and the detail explains why."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "runOn records the selected agent, and resumeFor dispatches using that record for resumed builds and hand-backs. Passing AC5 and existing Codex/Cursor tests cover session continuation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/same-model.mjs",
        "issue": "The review guard previously counted a model setting that the ticket's builder would not receive. The merged implementation retains the fix while preserving main's support for configured Codex models.",
        "suggested_fix": "No further change required; the regression test passes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both changes correctly. Tickets use their recorded builders, missing installations are explained, and resumed builds retain their original builder. All five criteria pass, and the independent-review safeguard remains fixed. No blocking findings remain."
  }
}
```

</details>
