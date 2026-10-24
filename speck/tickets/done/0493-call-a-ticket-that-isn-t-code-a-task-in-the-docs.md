---
id: "0493"
title: "Call a ticket that isn't code a task in the docs"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0492", "0490"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:41:21.961Z"
approved: "2026-10-24T20:45:41.852Z"
finished: "2026-10-24T20:49:12.856Z"

---
# 0493 · Call a ticket that isn't code a task in the docs

**Status:** ✅ done

## Problem
After 0492, speck calls a ticket that isn't code a task, with `kind: code | task`, but its skills, the brief and the README still describe document tasks and `task: document`. Agents following the skills would keep writing the old field.

## Outcome
speck's skills and docs describe `kind: code | task`, and a ticket that isn't code is a task wherever they mention it.

## Acceptance criteria
1. `skills/*/SKILL.md`, `docs/brief.md` and `README.md` name `kind: code` and `kind: task` wherever they named `task: code` or `task: document`, and none of them says "document task", "document ticket" or `task: document`, except one line in the brief saying the old `task:` field is still read.
2. The ticket skill tells the agent to set `kind: task` when the build does a job and leaves its result in `outputs/` rather than changing the project's code, such as an email draft, a plan or a report, with an `output:` folder as today (checked by review).
3. "Document" still means a file written for people to read, such as the README and `docs/`, in the rules for criteria about documents, and those rules don't change (checked by review). `CHANGELOG.md` and `docs/releases/` don't change. No test that passed before this change fails.

## Out of scope
- The code, the panel and the reviewer's prompt (0492).

## Notes
- Asked for by the user on 2026-10-24, with 0492.
- Today: `skills/speck-ticket/SKILL.md` (step 4's Task bullet), `skills/speck-build/SKILL.md` (two mentions), `docs/brief.md` (five) and the README.
- Waits for 0492 (the field it describes) and 0490, which rewrites the README after 0489 and 0491, which change the README, the ticket skill and the brief's rules for documents.
- Failing before this build: none
- Self-check: no changes. The brief's new paragraph on `kind` matches `ticketKind` and `outputProblem`; `test/ship-0355.test.mjs` now finds the brief's lines about how a task ships by the word task rather than document task.

## In plain words
speck's own instructions to its agents and its design guide now call a ticket that isn't code a task, and tell agents to write `kind: task` on one, matching what the panel and speck's messages already say. Nothing speck does changes: an agent making a ticket for an email draft, a plan or a report now writes the new field rather than the old one.

To see it, ask for a ticket that drafts an email: it should come out with `kind: task` and an output folder. The guide still says older tickets with the old line keep working.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 188,749
- Elapsed since build started: 4 min
- Changed lines: 18 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups only, no inbox notes): the title of the 0355 test about how a task ships still says "document task"; it isn't shown to people.

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
    "reviewed_sha": "c642c0d71b4dcbbdf402c158c3782d861a0160c5",
    "session": "fresh",
    "thread_id": "01a16fa9-0e42-7993-91af-900942e38039",
    "builder_response": "- Tests run: `speck test --related test/docs-0493.test.mjs test/ship-0355.test.mjs` (107 files: this ticket's test, the 0355 test it changed, and every test file naming a changed file). 1119 pass, 0 fail.\n- The README already calls a ticket that isn't code a task and never named `task:`, so it is unchanged; per 0491 the README isn't read by tests for this, so AC1's README part is for review.\n- `test/ship-0355.test.mjs` found the brief's lines about how a task ships by the words \"document task\"; it now finds them by the word task, asserting the same facts.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 188083,
      "cached_input_tokens": 133248,
      "cache_write_input_tokens": 0,
      "output_tokens": 666,
      "reasoning_output_tokens": 38
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T20:45:33.853Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The three passing AC1 tests in test/docs-0493.test.mjs check the skills and brief for current field names and prohibited legacy terms. docs/brief.md:172 contains the sole legacy-field exception. README.md:7 already calls non-code work a task and contains no legacy field names."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md:24 explicitly instructs agents to use kind: task for jobs such as email drafts, plans and reports, with an output: folder relative to outputs/."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The document rules remain unchanged in docs/brief.md:79 and both skills. CHANGELOG.md and docs/releases/ have no changes. The supplied related-test run reports 1119 passes, zero failures and three skips. The adjusted ship-0355 test retains its existing factual assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The guidance now calls non-code work a task and tells agents to use the new kind field. Document review rules remain intact, and the tests reported no regressions. Ready for the owner's merge decision."
  }
}
```

</details>
