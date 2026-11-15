---
id: "0681"
title: "Set several tickets ready with one command"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:38:42.344Z"
approved: "2026-11-15T13:58:29.367Z"
finished: "2026-11-15T14:09:53.060Z"

---
# 0681 · Set several tickets ready with one command

**Status:** ✅ done

## Problem
Gate 1 takes one command per ticket: `speck set <id> status ready`. After a round of ticket writing leaves several drafts, setting them ready means running it once for each and reading each result.

## Outcome
One command sets several named tickets ready.

## Acceptance criteria
1. `speck set <id> <id>… status ready`, with two or more ids, runs the ready check on each ticket, sets each one that passes ready and commits it as `speck set <id> status ready` does, one commit per ticket, in the order given.
2. A ticket that fails the ready check, or that `speck set <id> status ready` would refuse for any other reason, is left unchanged, and the others are still set ready. The command names each ticket it left, with the reason, and exits with a failing code when it left any.
3. Several ids with any other field or value are refused with the usage line, and nothing changes.
4. `speck help` and the brief's `speck set` row show the form.
5. No test that passed before this change fails.

## Out of scope
- Setting every draft ready without naming them: you still name each ticket.
- The panel.
- Changing other fields on several tickets at once.

## Notes
- `cmdSet` in `scripts/speck.mjs`. Each ticket keeps its own `speck(<id>): ready` commit, which `speck run` and `speck start` look for.
- The ticket skill's rule stands: an agent sets a ticket ready only when you've named that ticket.
- Failing before this build: none
- Self-check: no changes. The several-ids loop lives in scripts/set-ready.mjs, so speck.mjs stays within the 600-line rule.

## In plain words
You can now set several tickets ready in one go by naming them all, for example `speck set 12 14 15 status ready`, instead of running the command once per ticket. Each ticket is checked and saved on its own, in the order you named them. If one isn't ready yet, or can't be set ready for another reason, it's left as it was, the others still go ahead, and the command lists each one it skipped with the reason. Try it after writing a few drafts. Only `status ready` works with several tickets; any other change still takes one ticket at a time.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 173,041
- Elapsed since build started: 20 min
- Changed lines: 35 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "4f6f8cfffb9efb11cfcaa12b16896661cd5fd93b",
    "session": "fresh",
    "thread_id": "01a1df7f-ed52-7530-bfb6-9affbbb43c6f",
    "builder_response": "- Tests run: `speck test --related test/set-0681.test.mjs test/panel-0079.test.mjs test/full-suite-0630.test.mjs` (the ticket's own tests plus every existing test file naming a changed file; 2582 tests, 0 failed).\n- The several-ids loop is in scripts/set-ready.mjs and calls cmdSet itself for each id, so each ticket gets exactly what `speck set <id> status ready` does (ready check, base-branch check, its own `speck(<id>): ready` commit). cmdSet stays in speck.mjs because test/panel-0079 pins its shared checks there, and two import lines were joined so speck.mjs stays within the 600-line rule (test/split-0078).\n- AC5: the related run above passed; `speck ship` runs the full suite.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 172217,
      "cached_input_tokens": 144256,
      "cache_write_input_tokens": 0,
      "output_tokens": 824,
      "reasoning_output_tokens": 63
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 27961,
      "cached": 144256,
      "write": 0,
      "output": 824
    },
    "cost_usd": 0.0785876,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T13:58:21.684Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/set-ready.mjs:setSeveralReady calls cmdSet sequentially for each id. Passing test '0681 AC1' verifies ready statuses, commit order and one ticket file per commit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "setSeveralReady catches each SpeckError, continues and reports refusals with a failing exit. Passing AC2 tests cover failed ready checks, missing tickets and done tickets. cmdSet checks before writing; commitTicketOnly restores the original ticket when committing fails."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "setSeveralReady validates the field and value before processing tickets. Passing AC3 tests verify invalid forms produce usage and leave ticket contents, working tree and commit history unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/speck.mjs:HELP and docs/brief.md's speck set row show the multiple-id form. Passing AC4 test checks this command syntax in both."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 2582 tests, 2579 passed, 3 skipped and no failures. The ticket changes introduce no apparent regression; the whole-suite shipping check remains required."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The command sets named tickets ready in order, with a separate commit for each. Refused tickets stay unchanged and are reported while the remaining tickets proceed. Tests cover the requested behaviour and passed. No blocking concerns found."
  }
}
```

</details>
