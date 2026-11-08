---
id: "0563"
title: "Let watch: fix carry on when a build goes over the size limit"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:03:08.081Z"

---
# 0563 · Let watch: fix carry on when a build goes over the size limit

**Status:** 🔍 reviewing

## Problem
When a build goes over `limits.max_changed_lines`, the size guard blocks it with a proposed split as its question. The builder marks that question "Changes what you'd notice: yes", because the first ticket ships without part of its scope, and "Clear winner: no", because raising the limit is the other option. So `watch: fix` always leaves it for you, even though the answer is nearly always the split, the code is already written, and nothing about what is finally delivered changes.

## Outcome
With `watch: fix`, speck takes a size-guard split itself, as it does a question that changes nothing you'd notice and has a clear winner. The build carries on with the first part, and the rest goes into a new ticket that runs straight after it.

## Acceptance criteria
1. A build blocked by the size guard says so in its question's facts, separately from its other three lines, so speck can tell a size-guard block from any other question.
2. With `watch: fix`, `speck run` takes the recommendation of a size-guard block whose recommendation is to split, once per ticket. It notes in the ticket's Notes that speck chose it, and resumes the build. Raising the limit is never taken automatically.
3. The split-off ticket is made `ready`, with `after:` naming the original, holds the scope the original gives up, and says in its Notes which ticket it came from and why.
4. With `watch: tell` or `off`, a size-guard block waits for you as it does now, and any other question is handled exactly as before.
5. The build skill's size-guard steps and `docs/brief.md` describe the new behaviour (checked by review), and no test that passed before this change fails.

## Out of scope
- Any other kind of blocked question, such as a product question.
- Changing the size limits themselves.

## Notes
- Seen in practice: a build at 1,400 changed lines against a 1,000-line limit proposed keeping about 975 lines and moving about 425 into a follow-up ticket. The user went with the recommendation, and it changed nothing about what was delivered.
- Decided by the user on 2026-11-08: the split-off ticket starts `ready`, as its scope was approved when the original was set ready, so `speck run` builds it straight after.
- Failing before this build: none
- Self-check: fill and Notes errors now remove the new draft rather than leaving it; added tests for a main checkout off the base branch, built-in names and missing arguments.

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
    "reviewed_sha": "3d0db3f03532ea2f6c1dd5b2bd78a096b771fcbd",
    "session": "fresh",
    "thread_id": "01a1bd70-21ef-7753-934b-ef81296e65a6",
    "builder_response": "Round 1.\n- Tests run: test/size-guard-0563.test.mjs test/split-0078.test.mjs test/blocked-0283.test.mjs test/foreman-fix-0286.test.mjs test/go-with-0284.test.mjs test/foreman-0317.test.mjs test/watch-0486.test.mjs test/skills.test.mjs, plus the commands.checks files that speck test --files adds. Before that, speck test --related ran 2,154 tests with one failure from this change (scripts/speck.mjs over its 600-line limit), now fixed.\n- A size-guard block is told apart by a fourth fact line, `Size guard: yes`. questionFacts adds the key only when the line is present, as test/blocked-0283 pins the three-fact shape.\n- The split is taken only when the recommendation starts with \"Split\" and doesn't mention raising, increasing or lifting; otherwise the size-guard block waits, even if it claims no noticeable change and a clear winner.\n- The scope of the split-off comes from the resumed build, through a new agent-only command, `speck split-off`. It commits on the base branch in the main checkout because `speck new` only sees every ticket number there. With the main checkout off the base branch (including worktrees off), speck leaves the question for the user rather than resuming a build that couldn't file the ticket.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 152506,
      "cached_input_tokens": 98176,
      "cache_write_input_tokens": 0,
      "output_tokens": 1149,
      "reasoning_output_tokens": 328
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54330,
      "cached": 98176,
      "write": 0,
      "output": 1149
    },
    "cost_usd": 0.1299676,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:14:02.134Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "questionFacts reads the separate Size guard fact; the build skill requires its fourth line. AC1 tests cover parsing and board exposure."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests cover choosing, recording, resuming and refusing another choice. However, goWith rejects size-guard splits whenever the main checkout is off the base branch, which prevents this behaviour entirely with worktrees disabled."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "splitOff creates and commits a ready ticket containing the supplied scope, after dependency and provenance Notes. AC3 tests exercise these fields, duplicate prevention and invalid input."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests exercise tell and off leaving the block untouched, and ordinary questions retaining their previous eligibility and resume behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The build skill's size-guard steps and docs/brief.md describe automatic choice and split-off creation. The reported targeted run passed 179 tests with no failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/go-with.mjs",
        "issue": "The new mainBranch check prevents automatic splits for every build with worktrees disabled. In that supported configuration, the main checkout holds the build's ticket branch, so it cannot satisfy the base-branch requirement. The added test explicitly expects refusal in this situation, but acceptance criterion 2 requires watch: fix to resume a recommended size-guard split without this restriction.",
        "suggested_fix": "Support safely creating the follow-up on the base branch when the build occupies the main checkout, preserving the build's work. Add a test with worktrees disabled that verifies automatic choice, resume and ready follow-up creation.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The automatic split works for builds in separate worktrees, with useful safeguards and tests. It still leaves every build using the main checkout waiting for the user, so the promised behaviour is incomplete."
  }
}
```

</details>
