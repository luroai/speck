---
id: "0498"
title: Recommend agents in the README from testing so far                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0497"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T10:28:57.095Z"
approved: "2026-10-25T10:29:58.256Z"
finished: "2026-10-25T10:33:29.521Z"

---
# 0498 · Recommend agents in the README from testing so far

**Status:** ✅ done

## Problem
The README lists the agents speck works with but doesn't say which to pick, and says only that Claude Code is "the agent speck is most tested with". A new user can't tell that one agent works but two is better, or which pairing has done best in testing, and might pick Grok to review without knowing it's slow at it.

## Outcome
The README says one agent works but two different agents are best for adversarial review, and lists the best options from testing so far, with Claude Code as the best builder.

## Acceptance criteria
1. The README says speck works with one agent doing both building and reviewing, with `allow_same_model_review: true`, but that two different agents are best, because a second model reviews adversarially and catches what the builder misses. (checked by review)
2. The README lists the best options from testing so far: Claude Code as the builder, Codex with gpt-6.1-sol as the reviewer, and Grok through Cursor as fine for building but slow as a reviewer, finding the same problems as Codex in 4 to 11 minutes a round against Codex's under a minute. (checked by review)
3. The sentence "Claude Code is the agent speck is most tested with." in Get started is gone, and Claude Code is named as the best builder instead. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Changing any default in `speck/config.yml` or setup.
- Naming speck in place of "It" (0496) and the bursts paragraph (0497).
- Benchmarking more agents or models.

## Notes
- Keep it short: 0490 just cut the README down. A few lines under Under the hood's **Your agents**, plus the Get started change, is the expected size.
- Wording agreed with the user on 2026-10-25:
  > **Which to choose.** speck works with one agent building and reviewing (set `allow_same_model_review: true`), but two different agents are best: a second model reviews adversarially and catches what the builder misses. The best options from testing so far:
  > - **Builder: Claude Code.** Claude Code builds speck itself.
  > - **Reviewer: Codex, with gpt-6.1-sol.** Codex has reviewed almost every speck ticket, usually in under a minute a round.
  > - **Grok through Cursor** worked well as a builder in a short test, but is slow as a reviewer: it found the same problems as Codex but took 4 to 11 minutes a round.
- Don't start a sentence or label with "It" for speck or an agent, as 0496 sets out.
- Checked 2026-10-25: 456 done tickets record `Reviewer: codex, model gpt-6.1-sol` and 5 record Cursor with grok-4.7-high or grok-4.7-high-fast (`speck/tickets/done/` Delivery logs). `builder: claude`, `reviewer: codex`, `reviewer_model: gpt-6.1-sol` and `allow_same_model_review` are in `speck/config.yml`.
- Checked 2026-10-23 by the user: on the same review prompt, Codex gpt-6.1-sol took 30 s; grok-4.7-high-fast 313 to 417 s and grok-4.7-medium-fast 275 s, all finding the same blocking bug. Grok built a small ticket in 2 minutes in a scratch-repo test.
- Waits for 0497: this changes the agents paragraph and Get started, near the lines 0497 changes.
- Asked for by the user on 2026-10-25.
- Failing before this build: none
- No new tests: AC1–3 are checked by review (README wording), and AC4 is the existing suite. A reviewer can check by reading README's Get started and Under the hood's **Which to choose.**
- Self-check: no changes
- Pictures: none, because the change is README wording only, with no new layout or images

## In plain words
The README now helps new users pick their agents. It says one agent can build and review on its own, but two different agents work best, because the second one reviews the work with fresh eyes. It recommends Claude Code to build and Codex to review, and warns that Grok through Cursor builds well but reviews slowly. Get started now calls Claude Code the best builder so far. To see it, read Get started and the "Which to choose" part of Under the hood. Keep an eye on the recommendations as more agents are tried: they reflect testing up to now.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 49,262
- Elapsed since build started: 1 min
- Changed lines: 8 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "4bc7220059b8585981dfcfaab208bfc60787d3b7",
    "session": "fresh",
    "thread_id": "01a1729b-ca92-7a20-9380-04dd1fa4236f",
    "builder_response": "- Tests run: `speck test --related test/luro-0082.test.mjs` (31 files: every test file naming README.md, plus the commands.checks files). 353 pass, 0 fail, 3 skipped.\n- No new tests: AC1–3 end with \"(checked by review)\" (README wording, which the build rules forbid testing), and AC4 is the existing suite.\n- The **Which to choose.** paragraph and list use the wording agreed with the user in the ticket's Notes, placed after **Your agents.** under Under the hood. Get started now says Claude Code \"is the best builder in testing so far\".\n",
    "seconds": 16,
    "usage": {
      "input_tokens": 48771,
      "cached_input_tokens": 19456,
      "cache_write_input_tokens": 0,
      "output_tokens": 491,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T10:29:50.490Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md, Under the hood's 'Which to choose' paragraph, explicitly describes one agent with allow_same_model_review: true and recommends two different agents so a second model catches what the builder misses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md, 'Which to choose' list, recommends Claude Code for building and Codex with gpt-6.1-sol for reviewing. It describes Grok through Cursor as a capable builder whose reviews found the same problems but took 4 to 11 minutes, against Codex's usually under a minute."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md, Get started, replaces the previous 'most tested with' sentence with 'Claude Code is the best builder in testing so far.'"
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0498-tests.txt: 356 tests, 353 passed, 3 skipped and 0 failed. The diff changes only README wording and the ticket's build records; no tests or executable code changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now gives concise guidance on choosing a builder and reviewer, including the tested pairing and Grok's slower reviews. The wording meets all criteria, stays within scope, and the related tests pass."
  }
}
```

</details>
