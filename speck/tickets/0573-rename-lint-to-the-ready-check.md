---
id: "0573"
title: "Rename lint to the ready check"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-rename-lint-to-a-plainer-term.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0563","0564","0565","0566","0567","0568","0569","0570","0571","0572"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:39:05.212Z"

---
# 0573 · Rename lint to the ready check

**Status:** 🔍 reviewing

## Problem
"Lint" is programmer jargon and doesn't say what the check does, and the user once had to ask what "lint passes" meant. The panel already calls the same checks Readiness, so speck uses two names for one thing, in the CLI, the skills, the docs and its messages.

## Outcome
speck calls the check that a ticket is ready to build the ready check, run with `speck check <id>`, and `speck lint <id>` still works.

## Acceptance criteria
1. `speck check <id>` does what `speck lint <id>` does today, with the same results and exit codes, and `speck lint <id>` still works the same. speck's help lists `speck check` and says `speck lint` still works.
2. speck's own messages that name the check, such as `speck set <id> status ready` refusing a ticket, call it the ready check and name `speck check`, not lint.
3. The skills, `docs/brief.md`, the README and the ticket template name `speck check` and the ready check, and don't name `speck lint` or lint, apart from saying once in the brief that `speck lint` still works.
4. The panel's Readiness list is headed "Ready check".
5. No test that passed before this change fails.

## Out of scope
- `CHANGELOG.md`'s earlier sections, release notes and shipped tickets, which keep the old name.
- What the check reports and how it marks errors (✗) and warnings (!).

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- Decided: `speck check`, called the ready check in prose, as the idea suggested. `speck lint` stays as another name, so older skills in other projects don't break.
- Today: the command is `cmdLint` in `scripts/speck.mjs` and `scripts/lint.mjs`; "lint" appears in `scripts/` (`core.mjs`, `ship.mjs`, `output.mjs`, `pack.mjs`, `stall.mjs`, `detect.mjs` and others), `skills/speck-build`, `skills/speck-ticket`, `skills/speck-review`, `docs/brief.md` and about 50 test files. The panel's heading is in `templates/panel.js` (`'Readiness'`).
- Waits for every other ticket in 0.22.0, as it touches the skills, the brief and scripts they change.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a ticket with no id in its frontmatter was told to run `speck check undefined`; it now says `speck check <id>`, with a test.
- Kept on purpose: internal names (`lintTicket`, `scripts/lint.mjs`, the `lint` and `lint_messages` fields in `speck status --json`) and code comments, which no user reads. The README's new `check` row is left to review, as tests may only check certain README facts.

## In plain words
speck now calls its check that a ticket is ready to build the ready check, everywhere you'd meet it: the command is `speck check`, and the panel's list on a draft is headed Ready check instead of Readiness. The old `speck lint` command still works, so nothing breaks in projects with older instructions. To see it, open a draft in the panel's Plan lane, or try to set an unfinished ticket ready and read why it's refused. The one thing to watch is that the data speck gives to other programs still uses the old name inside it, which nobody sees in normal use.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "ba81d754aff06a8d0dca66263f91888094f83e9d",
    "session": "fresh",
    "thread_id": "01a1bdc5-721a-7ca0-b328-800183f51d7d",
    "builder_response": "- Tests run: test/ready-check-0573.test.mjs test/panel-0054.test.mjs test/panel-0061.test.mjs test/panel-0062.test.mjs test/panel-0063.test.mjs test/panel-0079.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs test/panel-0519.test.mjs test/panel.test.mjs test/ready-gate-0252.test.mjs test/skills.test.mjs, with --related (which adds every test file naming a changed file).\n- Existing tests changed only where they pin words this ticket has to change (AC2 to AC4): the panel's heading, pass line, tooltip and fact label, the `Not ready:` refusal, and two skill sentences.\n- test/panel-0063 AC2: it asserted no text \"Readiness\" in a non-draft's pane. A non-draft's facts table now has a \"Ready check\" cell, where it said \"Lint\", so that assertion now checks the list's pass line; the headings assertion just above it still proves there's no list heading.\n- Kept on purpose, as nobody using speck reads them: `lintTicket`, `scripts/lint.mjs`, `lint` and `lint_messages` in `speck status --json`, and code comments.\n- The README's new `check` row has no test, as the build rules only allow tests of certain README facts. Please check it by reading.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 195974,
      "cached_input_tokens": 140928,
      "cache_write_input_tokens": 0,
      "output_tokens": 821,
      "reasoning_output_tokens": 133
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55046,
      "cached": 140928,
      "write": 0,
      "output": 821
    },
    "cost_usd": 0.1323948,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:47:06.888Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs maps check and lint to the same cmdCheck function, preserving the previous implementation. Passing 0573 AC1 tests compare output and exit codes for valid, invalid and missing tickets, and check help."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "checkSetTicket, HELP and templates/panel.js use ready check terminology. Passing 0573 AC2 tests cover refusal messages, missing frontmatter ids, help, panel success text and tooltips. Remaining lint references are internal names, comments or the compatibility alias."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0573 AC3 tests check skills, templates/ticket.md and docs/brief.md for the new command and removal of lint terminology, except the brief's single compatibility note. README.md's command table was checked directly: its check row describes the ready check."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.js readiness() renders the heading Ready check. The passing 0573 AC4 test exercises the rendered panel with fakePage."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded related-test run reports 2,378 passes, zero failures and three skips. Existing test changes reflect the requested terminology; the command's checking logic is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The command, panel and guidance now call this the ready check. The old lint command still works with the same results. Relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
