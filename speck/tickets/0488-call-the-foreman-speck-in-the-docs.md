---
id: "0488"
title: "Call the Foreman speck in the docs"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0487"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:48:07.127Z"
approved: "2026-10-24T19:56:47.806Z"

---
# 0488 · Call the Foreman speck in the docs

**Status:** 👍 approved

## Problem
The README, the brief, the setup skill and the agent's own skill still describe the Foreman, its settings and its commands, after the panel, the messages and the settings stop using it.

## Outcome
speck's docs describe speck as the one watching the pipeline, with the new setting and command names.

## Acceptance criteria
1. `README.md`, `docs/brief.md`, every `skills/*/SKILL.md` and `templates/config.yml` contain no "Foreman" or "foreman" in any case, except the old setting names and `speck foreman` where they say those still work.
2. They name `watch`, `watch_agent`, `watch_model`, `watch_effort`, `speck answer`, `speck dismiss`, `speck watch` and the `speck-watch` skill wherever they named the old ones, and the brief's `speck config set` row says the old setting names are still read.
3. The README's and the brief's descriptions of the header, Settings' Watching group and blocked questions read naturally with speck as the one watching, in British English (checked by review).
4. `CHANGELOG.md` and `docs/releases/` don't change. No test that passed before this change fails.

## Out of scope
- The code's own wording (0485, 0486, 0487).

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: README's Foreman and Settings bullets (lines 130 to 165), the brief's `speck panel`, `speck config set`, `speck foreman` and `speck status` rows, `skills/speck-setup/SKILL.md` (its Foreman agent questions) and the agent's skill, moved to `skills/speck-watch/SKILL.md` by 0486.
- Waits for 0487, which names the settings this describes, and through it 0485 and 0486.
- Failing before this build: none
- Self-check: the brief no longer names the cache files and the environment variable whose names say foreman (it names `speck/.cache/runs/` instead), and the commit-prefix sentence says exactly what the old prefix still does.
- Tests updated: 0285, 0286, 0287, 0298, 0318, 0334 and 0392 checked the README, the brief or the setup skill for the old names, which this ticket replaces, so they now check the new ones.
- Pictures: none, because only the wording of the docs changes, not how anything looks.

## In plain words
speck's guides no longer talk about a separate "Foreman". The README, the design brief and the setup and watching instructions now say speck itself watches the work, call the settings group Watching, and use the new setting names (watch, watch_agent, watch_model, watch_effort) and the new commands for answering or dismissing speck's questions. They also say the old names still work, so older setups aren't left out. To see it, read the README's panel section, or the part about questions speck answers for you. Nothing speck does has changed: only the words describing it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 New or changed assertions pin document prose and sentence structure, contrary to the review rules.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 531,002
- Elapsed since build started: 9 min
- Changed lines: 58 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups only, so no inbox notes): the cache files speck run writes (`run.foreman.json`, `run.foreman-did.jsonl`, `run.foreman-agent.json`, `run.foreman-answer.*`) and the agent's environment variable still have foreman in their names; the brief now names only their folder. Renaming them would let the brief name them again.

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
    "reviewed_sha": "0c146cb429f7bcd51c4ec8a376f68ce222cbb57c",
    "session": "fresh",
    "thread_id": "01a16f7b-4ffa-7a10-8fcd-30c90b3640c9",
    "builder_response": "- Tests run: `speck test --related` with test/docs-0488.test.mjs (this ticket's), the existing test files it changed (test/foreman-0285.test.mjs, test/foreman-agent-0287.test.mjs, test/foreman-answer-0318.test.mjs, test/foreman-fix-0286.test.mjs, test/foreman-provider-0392.test.mjs, test/release-0298.test.mjs, test/setup-0334.test.mjs) and test/docs-0267.test.mjs (which failed in an earlier run), plus every test file naming a changed file, and the repo's checks.\n- The seven existing tests checked the docs for the old names (`foreman_*`, `speck foreman answer`, `run.foreman*.json`, `speck(<id>): Foreman:`), which this ticket deliberately replaces; each now checks the new name for the same fact.\n- The brief no longer names `run.foreman.json`, `run.foreman-did.jsonl`, `run.foreman-answer.<id>.<time>.json` or `SPECK_FOREMAN_RUN`, since AC1 allows \"foreman\" only for the old setting names and `speck foreman`; it names the folder `speck/.cache/runs/` instead.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 203833,
      "cached_input_tokens": 159872,
      "cache_write_input_tokens": 0,
      "output_tokens": 827,
      "reasoning_output_tokens": 45
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:55:34.107Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Search of README.md, docs/brief.md, skills/*/SKILL.md and templates/config.yml finds only permitted compatibility references. The 0488 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The README, brief, setup skill and watch skill use the new settings and commands. The brief's config set row explicitly says the old names are still read. All three 0488 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md's Header and Settings bullets and docs/brief.md's panel row describe speck watching, the Watching group and blocked questions naturally in British English."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The branch diff leaves CHANGELOG.md and docs/releases/ unchanged. The recorded related test run reports 1041 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/docs-0488.test.mjs; test/foreman-0285.test.mjs; test/setup-0334.test.mjs",
        "issue": "New or changed assertions pin document prose and sentence structure, contrary to the review rules. Examples include requiring the word 'still' in the same sentence as every old name (lines 23 and 42–45), requiring '`watch` set to fix' (line 51), requiring 'records them in' in the brief's status row, and matching 'speck's (own )?agent' followed by Cursor and another agent within one sentence. Equivalent editorial changes would fail these tests.",
        "suggested_fix": "Keep assertions about setting names, commands, paths and forbidden names. Remove assertions about prose wording and sentence boundaries; assess the compatibility explanation and natural language by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The documents consistently call the watcher speck and explain the new settings and commands. The reported tests pass, but several assertions depend on exact prose or sentence structure. Those must be loosened before approval."
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
    "reviewed_sha": "699d8d3523057e60e83943d079974abaed19f8b8",
    "session": "continued",
    "thread_id": "01a16f7b-4ffa-7a10-8fcd-30c90b3640c9",
    "builder_response": "- Tests run: test/docs-0488.test.mjs test/foreman-0285.test.mjs test/foreman-agent-0287.test.mjs test/foreman-answer-0318.test.mjs test/foreman-fix-0286.test.mjs test/foreman-provider-0392.test.mjs test/release-0298.test.mjs test/setup-0334.test.mjs test/docs-0267.test.mjs, with the repo's checks.\n- F1: fixed. test/docs-0488.test.mjs: AC1 now only checks that no line has \"foreman\" once the old setting names and `speck foreman …` code spans are taken out (no \"still\" or sentence split); the config set row test checks only that the row names the four new and four old setting names; the '`watch` set to fix' check is gone. test/foreman-0285.test.mjs checks only that the brief's status row names `speck/.cache/runs/`. test/setup-0334.test.mjs AC1 checks only that the all-Cursor bullet has `speck config set watch_agent <name>`. The rest is left to review.\n",
    "seconds": 13,
    "usage": {
      "input_tokens": 325024,
      "cached_input_tokens": 274944,
      "cache_write_input_tokens": 0,
      "output_tokens": 1318,
      "reasoning_output_tokens": 45
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:56:36.326Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Repository search confirms the specified documents contain 'foreman' only in old setting names and command aliases, with compatibility explained. The revised 0488 AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md, docs/brief.md and the setup and watch skills use the new settings, commands and skill name. The brief's config set row explicitly says old names are still read. All three 0488 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reviewed README.md's Header and Settings bullets and docs/brief.md's panel row: they naturally describe speck watching, the Watching group and blocked questions in British English. These passages are unchanged since round 1."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The branch diff leaves CHANGELOG.md and docs/releases/ unchanged. The latest recorded test run reports 207 passed, zero failed and three skipped; the earlier related run also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/docs-0488.test.mjs; test/foreman-0285.test.mjs; test/setup-0334.test.mjs",
        "issue": "The identified assertions tied tests to prose wording and sentence structure.",
        "suggested_fix": "Completed: the revised assertions check names, commands and paths without the identified prose requirements.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The docs consistently describe speck as watching the pipeline and explain the new names and backwards compatibility. The brittle prose checks have been fixed, and the reported tests pass. Ready for the owner's merge decision."
  }
}
```

</details>
