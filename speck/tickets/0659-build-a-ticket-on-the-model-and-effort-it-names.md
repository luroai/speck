---
id: "0659"
title: Build each ticket on the builder settings it names                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-choose-the-builder-s-model-per-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T11:07:53.378Z"
approved: "2026-11-12T11:20:13.006Z"

---
# 0659 · Build each ticket on the builder settings it names

**Status:** 👍 approved

## Problem
`builder_model` and `builder_effort` in `speck/config.yml` apply to every build, so a project can't build one ticket on one model and the next on another. Someone whose tickets need different strengths, such as a game with graphics tickets for one model and logic tickets for another, has to change the setting by hand between builds.

## Outcome
A ticket can name its own `builder_model` and `builder_effort`. Each build of that ticket runs on them, and a ticket that leaves them blank builds exactly as it does today.

## Acceptance criteria
1. A ticket with `builder_model: <m>` is started, resumed and handed back on `<m>`, passed the way speck passes the settings' `builder_model` to that builder today (Claude Code and a model provider as `--model <m>`, Codex as `-m <m>`, Cursor as `--model <m>`), in place of the settings' value. This holds when the ticket's `builder:` names an agent other than the one in `speck/config.yml`, whose builds today get no model. A blank or missing ticket value gives the command speck gives today.
2. A ticket with `builder_effort: <e>` is built with `<e>` in place of the settings' `builder_effort`, given to Claude Code as `--effort <e>` and to Codex as `model_reasoning_effort="<e>"`, and not given to Cursor or a model provider, as today. `speck check` refuses a ticket `builder_effort` that the settings' `builder_effort` would refuse, with a message naming the ticket's value.
3. The same-family ready check and the board's builder model use the ticket's `builder_model` when it's set: with `builder: claude`, `reviewer: claude-subagent`, `allow_same_model_review: false` and `reviewer_model: opus`, `speck check` refuses a ticket with `builder_model: opus` and accepts one with `builder_model: sonnet`.
4. When speck run starts or moves a ticket's build to another agent on `builder_bench` because the builder is held by a usage limit, it doesn't pass the ticket's `builder_model` or `builder_effort` to that agent, as it doesn't pass the settings' values today.
5. A ticket `speck new` makes has blank `builder_model` and `builder_effort` lines, each with a comment saying what blank means, and `docs/brief.md` says a ticket's own value overrides the settings', in the Builder model and Builder effort paragraphs.

## Out of scope
- Setting a ticket's builder model or effort from the panel. `speck set <id> builder_model <m>` or an edit to the ticket does it.
- Levels such as Quick, Balanced and Deep, or presets by kind of work, that pick a model and effort for a ticket (1.3, from `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md`). They'll resolve to these two fields, with a ticket's own `builder_model` winning.
- Choosing the model for a ticket automatically when it's written.
- Builds started by hand with `/speck-build`, which run on the session's own model.
- Checking that a model name exists: model names stay free text in the builder's own format, as `reviewer_model` is.

## Notes
- Follow `reviewer_model` and `reviewer_effort` on tickets (`reviewerSettings` in `scripts/core.mjs`): a ticket value wins, a blank one falls back to the settings when the build starts.
- The settings' `builder_model` reaches only the builder `speck/config.yml` names (0312). A ticket's value is written for the ticket's own builder, so it reaches that builder whichever it is. A build_command set by hand still gets `--model` only for Claude Code, as today.
- Likely files: `scripts/build-model.mjs`, `scripts/ticket-builder.mjs` (`configFor`), `scripts/same-model.mjs`, `scripts/builder-stand-in.mjs`, `scripts/lint.mjs`, `templates/ticket.md`, `docs/brief.md`.
- Checked 2026-11-12: Claude Code takes `--model <alias or name>` and `--effort <level>`; Codex takes `-m <model>` and `-c model_reasoning_effort="<e>"`; Cursor's agent takes `--model <name>` (as speck passes them today, `scripts/build-model.mjs`, `scripts/codex-build.mjs`, `scripts/cursor-build.mjs`).
- Failing before this build: none
- Self-check: narrowed the brief's claim to say a build_command you've written gives a ticket's model only to Claude Code; a hand-written command passes the ticket's values only when the ticket's builder is the configured one, as it builds every ticket with that builder.

## In plain words
Each ticket can now name the model and the effort its builds run on, so one ticket can build on one model and the next on another without changing your settings in between. Leave them blank and the ticket builds exactly as before, on your settings. To try it, give a ticket a model (for example `speck set <id> builder_model sonnet`) and let speck run build it: the build, any resume after it stops and any hand-back after a refused ship all run on that model. The ready check refuses an effort it doesn't know, and it also refuses a model that would make the builder and reviewer the same model. Worth knowing: when a usage limit moves a build to another agent on your builder bench, speck clears the ticket's own model and effort, because they were written for the agent the ticket started with.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Stand-in suppression lasts only for the initial launch.; F2 AC5's brief requirement has no automated coverage, although it states setting facts and is not marked as checked by review.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 378,081
- Elapsed since build started: 12 min
- Changed lines: 130 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - When a stand-in on builder_bench is recorded as the ticket's builder, the ticket's own builder_model and builder_effort are cleared rather than kept for when it goes back to its first builder, as `builder:` itself is overwritten. Restoring both after the limit resets would need its own ticket if wanted.
  - A run record from before this change has no ticket values, so a build started before it resumes on the settings', as it did.

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
    "reviewed_sha": "c98c2f17b79965f3e8562000e46da822c2715880",
    "session": "fresh",
    "thread_id": "01a1cf77-8a26-7290-989f-b8ed2a961c4d",
    "builder_response": "- Tests run: `speck test --related test/ticket-builder-0659.test.mjs` (the ticket's own file plus every existing test file naming a changed file, and the repo checks): 1744 tests, 0 failures.\n- Design: `buildConfig(cfg, builder, t)` in build-model.mjs replaces ticket-builder's `configFor`: a ticket's own builder_model/builder_effort win for its builder whichever it is; blank falls back to the settings' only for the configured builder (0312, unchanged).\n- speck run reads the ticket's own values from its frontmatter at launch (`launchTicket`), because status tickets carry the board's resolved `builder_model`, not the ticket's own. It keeps them in the run record as `ticket_builder_model`/`ticket_builder_effort`, which `resumeFor` applies to every resume, hand-back, go-with and usage-limit resume.\n- Stand-ins (run.mjs's standIn launch, build-take-over and the stand-in's same-model check) use `standInTicket`, which blanks both values (AC4).\n- Hand-written build_command: only a Claude Code build gets the ticket's values, and only when the ticket's builder is the configured one, as that command builds every ticket.\n- AC5's docs part is checked by review (brief.md, Builder model and Builder effort paragraphs); no wording test added.\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 146952,
      "cached_input_tokens": 90112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1116,
      "reasoning_output_tokens": 292
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56840,
      "cached": 90112,
      "write": 0,
      "output": 1116
    },
    "cost_usd": 0.1338512,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T11:15:32.275Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "buildConfig/buildPlan apply ticket models; launchPlan records them and resumeFor restores them. AC1 tests cover launch, fallback, Claude/Codex/provider resumes and custom commands. Cursor retains its initial model in its chat."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "buildConfig applies effort overrides; lintTicket validates ticket effort through knownEffort. AC2 tests cover supported builders, excluded builders and invalid-value messages; reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketSameModelProblem and ticketBuilderModel resolve ticket models. AC3 tests exercise opus rejection, sonnet acceptance and board model resolution; reported passing."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "standInTicket strips values for the initial launch, but recordBuilder and recordTakeOver persist the replacement builder while retaining the original builder_model/builder_effort. Later launches read those values again."
      },
      {
        "id": 5,
        "status": "unclear",
        "evidence": "The template and both brief paragraphs contain the requested information. The AC5 test checks new-ticket fields and comments, but no test checks the brief's setting facts; this criterion is not marked '(checked by review)'."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/builder-stand-in.mjs",
        "issue": "Stand-in suppression lasts only for the initial launch. recordBuilder and recordTakeOver permanently change the ticket's builder but retain its original model and effort. A subsequent fresh launch reads those fields through launchTicket and passes the original builder's settings to the replacement agent. The board also reports that retained model even though the stand-in did not use it.",
        "suggested_fix": "Persist enough information to keep the original model and effort suppressed for the stand-in throughout its lifecycle, or clear/archive them when recording the replacement builder. Cover the persisted ticket, board resolution and a subsequent fresh launch in a regression test, including recordTakeOver.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/ticket-builder-0659.test.mjs",
        "issue": "AC5's brief requirement has no automated coverage, although it states setting facts and is not marked as checked by review. The builder's response cannot independently grant that exception.",
        "suggested_fix": "Add a fact-based check for the builder_model and builder_effort override documentation in the brief, without asserting exact prose or paragraph order.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Ticket-specific model and effort settings work on the main launch and resume paths, and the reported tests pass. A replacement builder can later receive settings intended for the original builder because those values remain on the ticket. That lifecycle bug and a missing documentation check need fixing before merge."
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
    "reviewed_sha": "509819fa79b26054e572548afe001103e89dd025",
    "session": "continued",
    "thread_id": "01a1cf77-8a26-7290-989f-b8ed2a961c4d",
    "builder_response": "- Tests run: `speck test --related test/ticket-builder-0659.test.mjs` (the ticket's own file, every existing test file naming a changed file, and the repo checks): 1748 tests, 0 failures.\n- F1: fixed. New `standInText` in scripts/ticket-builder.mjs sets the stand-in as `builder:` and clears the ticket's own non-blank `builder_model`/`builder_effort` (keeping their comments, adding no lines to tickets without them). `recordBuilder` (builder-stand-in.mjs) and `recordTakeOver` (build-take-over.mjs) use it, so a later fresh launch, resume or the board never gives them to the stand-in. Tests: \"recording a stand-in … clears its own model and effort\" (persisted ticket, board resolution, later fresh launch), \"recording a take-over clears …\", and \"a ticket without its own values is recorded as before\". The brief says speck clears them when it records the stand-in.\n- F2: fixed. The brief's Builder model and Builder effort paragraphs now give the commands that set a ticket's own value (`speck set <id> builder_model <model>`, `speck set <id> builder_effort <effort>`), and a test checks each paragraph names its command. A first version checking phrases failed the repo's 0267 rewording check, so the test checks the command, a fact that survives rewording.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 376207,
      "cached_input_tokens": 295936,
      "cache_write_input_tokens": 0,
      "output_tokens": 1874,
      "reasoning_output_tokens": 305
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23431,
      "cached": 205824,
      "write": 0,
      "output": 758
    },
    "cost_usd": 0.0750244,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T11:20:02.564Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "buildConfig and buildPlan apply ticket models across builders; launchPlan records overrides and resumeFor restores them. Passing AC1 tests cover launch, resume, fallback, alternate builders and custom commands. Cursor retains the initial model in its chat."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "buildConfig applies effort overrides, and lintTicket validates them using knownEffort with the ticket value in its error. Passing AC2 tests cover Claude/Codex overrides, Cursor/provider exclusions and invalid values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketSameModelProblem and ticketBuilderModel use the ticket model. Passing AC3 tests verify opus rejection, sonnet acceptance and board resolution."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "standInTicket suppresses overrides at launch. Both recordBuilder and recordTakeOver now use standInText to clear persisted overrides. Passing AC4 regression tests check persisted tickets, board resolution, subsequent launches and take-over recording."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/ticket.md includes blank fields with explanatory comments. Both Builder paragraphs in docs/brief.md describe ticket overrides. Passing AC5 tests check new-ticket fields and the documented setting commands."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/builder-stand-in.mjs",
        "issue": "Previously, persisted ticket overrides could reach a replacement builder on a later launch. Both recording paths now clear those overrides, with regression coverage.",
        "suggested_fix": "Completed through standInText, used by recordBuilder and recordTakeOver.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/ticket-builder-0659.test.mjs",
        "issue": "The brief previously lacked fact-based documentation coverage. The added AC5 test checks the setting commands in both relevant paragraphs without asserting explanatory prose or order.",
        "suggested_fix": "Completed with the documentation command checks.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Tickets can choose their own builder model and effort while blank values preserve existing behaviour. Replacement builders now safely discard settings intended for the original builder. Both previous findings are resolved; the reported 1,748-test run has no failures. Ready for the owner's merge decision."
  }
}
```

</details>
