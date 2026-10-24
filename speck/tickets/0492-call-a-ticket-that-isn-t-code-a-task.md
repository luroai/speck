---
id: "0492"
title: "Call a ticket that isn't code a task"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:02:10.113Z"

---
# 0492 · Call a ticket that isn't code a task

**Status:** 🔍 reviewing

## Problem
A ticket that isn't a code change is called a "document task" (`task: document`), but its build can do any job whose result it leaves in `outputs/`: an email draft, a plan, a report or research. "Document" undersells it, and the same word also means the README and `docs/` in speck's rules for acceptance criteria.

## Outcome
A ticket is code or a task, `kind: code | task`, and everything speck shows people calls a ticket that isn't code a task.

## Acceptance criteria
1. A ticket's kind is `kind: code` (the default) or `kind: task`. `speck new` and `templates/ticket.md` write `kind: code`, with the comment `# code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)`. `speck lint` refuses any other value, and a `kind: task` ticket needs a valid `output:` as a document ticket does today.
2. A ticket with only `task: code` or `task: document` works exactly as one with `kind: code` or `kind: task`, and where a ticket has both, `kind` wins. speck never rewrites a ticket's old line itself.
3. Nothing speck prints, nothing the panel shows (text, tags, tooltips, accessible names and the review pack) and nothing the reviewer's prompt says for a task ticket calls it a document task or document ticket, or calls its result a document. The panel's tag for one reads `task`, with the tip `Task: the build does a task and leaves its result in outputs/, not code`, and a finished one's closed card reads `Read the result`.
4. A task ticket's build, review, review pack with its links to its files, `speck output`, and waiting for you to ship it all work as before. No test that passed before this change fails.

## Out of scope
- The skills, `docs/brief.md` and the README (0493).
- The `outputs/` folder and the `output:` field, which keep their names.
- "Document" in speck's rules for criteria about the README and `docs/`, which keeps that meaning.

## Notes
- Asked for by the user on 2026-10-24: rename "documents" on tickets to "Task", "because I think the document support actually does it all already". The user chose `kind: code | task`, with the old `task:` lines still read, over changing only the words people read.
- Today: `TASKS` and `ticketTask` in `scripts/core.mjs`, `scripts/lint.mjs`, `scripts/output.mjs`, `scripts/pack.mjs`, `scripts/review.mjs`, `scripts/ship.mjs` (a document task waits for you to ship it), `scripts/pr-ship.mjs`, `scripts/panel.mjs`, the `speck output` line in `scripts/speck.mjs`'s usage, `templates/ticket.md`, `templates/reviewer-document.md`, and in the panel `taskTag` and the card's kind in `templates/panel.js`, the `Finished · read the document` words in `templates/panel-model.js`, and the pack's file links in `templates/panel-popups.js`.
- One ticket has `task: document` today: `speck/tickets/done/0358-…`. Every other ticket file has `task: code`.
- Unchained: 0489 changes only the first line of `speck help` and the comment at the top of `scripts/speck.mjs`, and 0491 the reviewer prompt's point 2 in `templates/reviewer-prompt.md`, not `reviewer-document.md`.
- Failing before this build: none
- Self-check: `speck status --json` dropped the raw `task` field an old ticket carries, so it gives only `kind`; the full-ticket pop-up's starting accessible name `Document` became `Result`. Old tests that asserted the old words (0350, 0353, 0355, 0359, 0361, 0443, 0462, 0463, 0484) now assert the new ones; the fixtures in `test/support/documents.mjs` and `test/support/doc-ship.mjs` make their ticket a task with the old `task: document` line, so the old line stays covered.

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
    "reviewed_sha": "a354331244699be8010974342b9d6f9350421949",
    "session": "fresh",
    "thread_id": "01a16f8c-2600-7981-9c4d-311c8f9b5ad5",
    "builder_response": "- Tests run: `speck test --related` on test/kind-0492.test.mjs test/task-0350.test.mjs test/pack-0359.test.mjs test/prompt-0353.test.mjs test/ship-0355.test.mjs test/panel-0361.test.mjs test/panel-0443.test.mjs test/panel-0462.test.mjs test/panel-0463.test.mjs test/panel-0484.test.mjs (161 related files). Four timing-sensitive tests failed under a load average of ~25 (0484's clock passing 100:00, 0232's CPU budget, 0384); their files (test/panel-0484.test.mjs, test/quick-waits-0232.test.mjs, test/review-wait-0384.test.mjs) passed on a re-run, appended to the test output.\n- Older tests that asserted the old words or `task: 'document'` fixtures now assert the new words and `kind: 'task'`; the facts they check are unchanged. test/support/documents.mjs and test/support/doc-ship.mjs swap the template's `kind: code` line for the old `task: document` line, so the 0354/0355/0359/0361 tests still run on an old-format ticket (AC2, AC4).\n- `templates/reviewer-document.md` keeps its file name (the prompt never shows it); its text now says task and result.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 232426,
      "cached_input_tokens": 168192,
      "cache_write_input_tokens": 0,
      "output_tokens": 980,
      "reasoning_output_tokens": 166
    },
    "tests": {
      "failing": 4,
      "second_try": []
    },
    "saved_at": "2026-10-24T20:14:09.552Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "core.mjs ticketKind, lint.mjs lintTicket and templates/ticket.md implement the new field, validation and output requirement. Passing 0492 AC1 tests exercise these paths and speck new."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "core.mjs ticketKind maps legacy values and gives kind precedence. Passing 0492 AC2 tests check compatibility, precedence, status JSON and preservation of the old line through speck set."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Output messages, reviewer-document.md, panel taskTag and panel-model.js use task/result. Passing 0492 AC3 tests exercise displayed tags, tooltips, accessible names and finished cards."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0492 AC4 tests exercise output folders, reviewer file listings, pack links, served files and automatic shipping prevention. Existing prompt, pack and shipping tests cover legacy tickets. The four initial failures passed on rerun in /tmp/speck-0492-tests.txt."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/kind-0492.test.mjs:112",
        "issue": "The new assertion pins templates/reviewer-document.md to the exact heading “## The result”. This checks a document's wording and fails on a harmless heading edit, which the review rules explicitly identify as blocking.",
        "suggested_fix": "Remove the exact reviewer-template heading assertion. Keep the checks for prohibited terminology and the behavioural checks that the prompt identifies the output folder and files.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The rename appears to work, including compatibility with older tickets and access to task results. One new test must change because it unnecessarily locks the reviewer instructions to an exact heading."
  }
}
```

</details>
