---
id: "0312"
title: "Build each ticket with the builder it was made with"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0312 · Build each ticket with the builder it was made with

**Status:** 🔍 reviewing

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
