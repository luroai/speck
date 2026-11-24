---
id: "0716"
title: "Let speck set blank a ticket's build settings"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-let-speck-set-blank-a-ticket-s-level.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:23:00.891Z"

---
# 0716 · Let speck set blank a ticket's build settings

**Status:** 🔍 reviewing

## Problem
Someone working from the terminal, or an agent, can give a ticket a level or its own builder and model but can't take them off again without editing the file by hand, while the panel can. `speck set` lets only `priority` take an empty value.

## Outcome
`speck set <id> <field> ""` blanks a ticket's level, builder and reviewer fields.

## Acceptance criteria
1. `speck set <id> level ""` writes `level: ""` to the ticket, as the panel's Default choice does, and says the field is now blank.
2. The same works for `builder`, `builder_model`, `builder_effort`, `reviewer`, `reviewer_model` and `reviewer_effort`.
3. Blanking any of these is refused for a ticket being built, as setting any other value is.
4. Fields that can't be blank, such as `title` and `status`, still give the usage message when given "".
5. No test that passed before this change fails.

## Out of scope
- The panel, which already blanks level, builder and model.

## Notes
- `cmdSet` in `scripts/speck.mjs` allows an empty value only for `priority`. `scripts/panel-level.mjs` already blanks a level through the same `checkSetValue`/`checkSetTicket`.
- Failing before this build: none
- Self-check: no changes

## In plain words
From the terminal you can now take a level, builder or reviewer setting off a ticket with `speck set` and an empty value, as the panel's Default choice already does. It says the setting is now blank. Try it on a draft ticket. Fields such as the title and status still can't be emptied.

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
    "reviewed_sha": "ee2e203e77c2e40ababebb4fe7cc03a6e11bdf8e",
    "session": "fresh",
    "thread_id": "01a20df9-4c71-74a3-b711-9dd4281e53b7",
    "builder_response": "Tests: test/set-0716.test.mjs and every test file naming scripts/speck.mjs (--related), all pass. Added BLANKABLE fields to cmdSet; blank prints \"is now blank\".\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 122749,
      "cached_input_tokens": 85120,
      "cache_write_input_tokens": 0,
      "output_tokens": 669,
      "reasoning_output_tokens": 16
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37629,
      "cached": 85120,
      "write": 0,
      "output": 669
    },
    "cost_usd": 0.09046,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:33:13.975Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdSet accepts an explicit empty level and reports it as blank. Passing test '0716 AC1' first sets quick, then verifies level: \"\" and the confirmation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdSet includes all six builder/reviewer fields in BLANKABLE. Passing test '0716 AC2' invokes the CLI for each and verifies the written empty value and confirmation; builder and reviewer initially have non-empty fixture values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet calls checkNotBeingBuilt before writing, regardless of field. Passing test '0716 AC3' starts a real worktree build, verifies blanking is refused and confirms the ticket remains unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdSet retains the usage guard for fields outside the blankable list. Passing test '0716 AC4' checks explicit empty title and status values both produce the usage message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0716-tests.txt reports 1,776 tests: 1,773 passed, three skipped and zero failed. The implementation is confined to empty-value handling and confirmation output; existing tests were not altered."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The terminal command now clears a ticket's level and builder/reviewer settings and confirms they are blank. Existing protection against changes during a build remains in place. The tests pass, and I found no blocking issues."
  }
}
```

</details>
