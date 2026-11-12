---
id: "0660"
title: "Build a ticket at the level it names"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T11:56:01.061Z"

---
# 0660 · Build a ticket at the level it names

**Status:** 🔍 reviewing

## Problem
Since 0659 a ticket can name its own builder model and effort, but you have to know and type the right model for each one. You think about tickets as "quick", "deep" or "graphics work", not in model names, and a project that uses the same few combinations over and over has to repeat them on every ticket.

## Outcome
`speck/config.yml` holds named build levels, each giving a builder, model and effort, and a ticket that names a level is built with them.

## Acceptance criteria
1. A `levels:` map in `speck/config.yml` names each level, and each level can give `builder`, `builder_model` and `builder_effort`, each optional. A project whose config has no `levels:` gets three: `quick` with `builder_effort: low`, `balanced` with nothing set, and `deep` with `builder_effort: max`. A config that has `levels:` gets exactly the levels it lists, which can include others, such as `graphics`.
2. A ticket with `level: <name>` is started, resumed and handed back with that level's builder, model and effort, each passed as 0659 passes a ticket's own. For each of the three, a value on the ticket itself wins over the level's, and a value the level leaves out falls back to the settings, so a ticket with `level: balanced` or a blank `level` builds exactly as it would without one.
3. `speck check` refuses a ticket whose `level` isn't one of the project's levels, naming the levels there are, and refuses a level whose `builder_effort` is one it would refuse in the settings. The same-family ready check uses the builder and model the level gives the ticket.
4. When speck run moves a ticket's build to another agent on `builder_bench` because of a usage limit, it doesn't pass the level's model or effort to that agent, as it doesn't pass the ticket's own (0659).
5. A ticket `speck new` makes has a blank `level` line with a comment saying what blank means, the `speck/config.yml` that `speck init` writes lists the three default levels, and `docs/brief.md` has a Build levels paragraph saying the order a ticket's value, its level's and the settings' are used in.

## Out of scope
- Changing levels from the team page: 0661.
- Picking a ticket's level in the panel: 0662. `speck set <id> level <name>` or an edit to the ticket does it.
- Levels for the reviewer or QA.
- Virgil or the ticket writer picking a ticket's level by itself.

## Notes
- Level names are lowercase letters, digits and hyphens. The panel shows them with a capital first letter.
- Levels live in `speck/config.yml`, as tickets that name them are shared with the project. A level's model is free text in its builder's own format, as `builder_model` is.
- Failing before this build: none
- Self-check: a stand-in's ticket blanks its level only when it names one, so tickets without a level stand in as before.
- Builds on 0659's resolution in `scripts/build-model.mjs` and `scripts/ticket-builder.mjs`. Likely files also `scripts/core.mjs` (`ticketAgents`), `scripts/same-model.mjs`, `scripts/builder-stand-in.mjs`, `scripts/lint.mjs`, `templates/ticket.md`, `templates/config.yml`, `docs/brief.md`.

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
    "reviewed_sha": "f12753c77ce6263a54f03b4b0fdfc1e1aef753e0",
    "session": "fresh",
    "thread_id": "01a1cfa6-1756-7041-b5a6-540b96bd022d",
    "builder_response": "- Tests run: `speck test --related test/ticket-builder-0660.test.mjs test/ticket-builder-0659.test.mjs` (the ticket's own tests, 0659's, every test file naming a changed file, and the checks).\n- One failure in that run, `0264 AC3: speck run doesn't put shipping on hold` (test/ship-0264.test.mjs), is unrelated and flaky under load: it passed in the previous related run of the same code and passes 3 times out of 3 run on its own. It tests the ship queue, which this ticket doesn't touch.\n- Design: `scripts/levels.mjs` fills each of builder, builder_model and builder_effort a ticket leaves blank from its level (`levelled`). It's applied where a ticket's frontmatter is read: `ticketAgents` (so the board's builder and speck run's launch agent come from the level), `ticketSameModelProblem`, `ticketBuilderModel` and `launchTicket` (so the run record keeps the level's model and effort for resumes and hand-backs, as 0659 does for a ticket's own). `buildConfig` itself doesn't read levels, so a stand-in, built from a ticket without its level, never gets them; `standInTicket` blanks a level the ticket names and `standInText` clears the ticket's `level` line when it records a stand-in.\n- No pictures: nothing anyone sees in the panel changes.\n",
    "seconds": 49,
    "usage": {
      "input_tokens": 288714,
      "cached_input_tokens": 246784,
      "cache_write_input_tokens": 0,
      "output_tokens": 1144,
      "reasoning_output_tokens": 179
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41930,
      "cached": 246784,
      "write": 0,
      "output": 1144
    },
    "cost_usd": 0.1199784,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-12T12:06:19.486Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/levels.mjs supplies defaults and preserves explicitly configured levels; AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketAgents and launchTicket resolve level values; AC2 tests cover precedence, launch commands and resume records and passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "lintTicket validates the normalised level effort, which silently removes boolean and structured values before validation. Existing AC3 tests cover strings only."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "standInTicket and standInText clear level values; AC4 tests cover usage-limit take-over and persisted clearing and passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Templates include the blank level and default levels. docs/brief.md describes ticket → level → settings precedence; AC5 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/lint.mjs",
        "issue": "Invalid level efforts can pass speck check. For example, YAML builder_effort: true becomes a boolean, which levelValues converts to an empty string. lintTicket consequently skips validation and builds with a fallback effort, although the settings reject \"true\". Arrays and maps are similarly discarded.",
        "suggested_fix": "Validate the raw configured builder_effort before normalising it for resolution. Add tests for boolean and structured invalid values alongside the existing invalid-string test.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Named build levels work across launches, resumes and stand-ins, with tests covering the main paths. One validation gap needs fixing: some invalid effort values are silently ignored instead of rejected."
  }
}
```

</details>
