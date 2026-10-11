---
id: "0111"
title: "Write the one-build-at-a-time principle into the brief"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T09:49:24.065Z"

---
# 0111 · Write the one-build-at-a-time principle into the brief

**Status:** 🔍 reviewing

## Problem
speck has no stated position on parallel builds. Without one, tickets keep adding machinery to make builds run side by side: about 20 since worktrees shipped (0028), with a five-ticket ship queue (0101–0105) next. That work makes speck harder to trust and to use. On 10 and 11 October parallel builds ran the machine out of memory, stopped 0097 shipping with a test port clash, had two builds fix the same test and left builds inheriting a broken `main`.

## Outcome
`docs/brief.md` states that speck runs one build at a time, and why, so later tickets can be checked against it.

## Acceptance criteria
1. The brief's Principles list has a principle that speck runs one build at a time (WIP 1), each build in its own worktree, so the user keeps shaping ideas and tickets on the base branch while builds and ships are handled. It says the user can create tickets, set them ready and walk away.
2. Beside that principle, the brief gives the reasons, at least these:
   - **Bottleneck:** speck's value is its gates, and the user's attention, not agent time, is the bottleneck.
   - **Simplicity:** one build at a time keeps order, `after:` dependencies, conflicts and a broken base branch simple, because each build starts from the latest base branch.
   - **Users:** it fits speck's users, who shape product rather than debug races.
   - **Isolation versus parallelism:** worktrees are kept for isolation; running builds side by side is a different thing.
   - **Cost:** the cost is throughput.
   - **Coming back:** parallel builds would return only as a deliberately designed feature.
3. The brief says there is no separate shipping agent: each build ships its own ticket.
4. No part of the brief, the README or the skills says or implies that builds run in parallel (for example, the `speck test` row's "Builds run in parallel"), and no test that passed before this change fails.

## Out of scope
- Removing `max_parallel_builds`, test turns (0109) or other parallel-build machinery. That comes later, in small tickets.
- Changing how `speck-integrate` is started (0116).

## Notes
- Decided 2026-10-11 with the user. Already done outside tickets: `max_parallel_builds` set to 1 in `speck/config.yml`, and 0102–0105 cancelled.
- Write it in British English, in the brief's plain style.
- Failing before this build: none
- The brief's `speck-integrate` row kept "ship queue" (test 0101 checks for it) but now says nothing starts the skill and that each build ships its own ticket. The skill itself still calls its reader "the shipping agent": 0116 removes it, so it's left alone here.
- Self-check: the new test file loads the clean-up helper first, as every test file must. `split-0018`'s panel hand-over test failed once with a socket hang-up and passed on three runs alone and on the next full run; this change touches no code.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- `templates/config.yml` still describes `max_parallel_builds` as "how many builds speck run keeps going at once", and `max_parallel_tests` as runs from any worktree. Skipped as an inbox note: it's part of removing the parallel-build machinery, which `speck/ideas/done/2026-10-11-one-build-at-a-time.md` already plans as later small tickets.
- `skills/speck-integrate/SKILL.md` still calls its reader "the shipping agent", started by the ship queue. Skipped: ticket 0116 folds it into `/speck-build` and removes it.

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
    "reviewed_sha": "ae6ecd6ff45b9bc2233de48b528d234b31155612",
    "thread_id": "01a12a64-8c80-75a3-a0f2-950bf05ceca3",
    "seconds": 36,
    "usage": {
      "input_tokens": 414634,
      "cached_input_tokens": 303872,
      "cache_write_input_tokens": 0,
      "output_tokens": 773,
      "reasoning_output_tokens": 106
    },
    "saved_at": "2026-10-11T09:57:10.947Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "docs/brief.md, Principles item 7 states WIP 1, a worktree per build, continued shaping on the base branch, and creating tickets, setting them ready and walking away. Both AC1 tests in test/brief-0111.test.mjs exercise this wording and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Principles item 7 includes all six required reasons. The AC2 test in test/brief-0111.test.mjs checks each reason against the actual brief and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Principles item 7 explicitly says each build ships its own ticket and there is no separate shipping agent. The speck-integrate row agrees. Both AC3 tests passed. The integrate skill remains unchanged as expressly deferred in the ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Inspected README.md, docs/brief.md and skills for parallel-build claims; the obsolete wording has been removed. AC4 tests check these files and passed. Existing tests were not changed; supplied full-suite output reports 965 passed, zero failed and three skipped. The suite was not rerun because its temporary-file writes conflict with this review's read-only restriction."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The brief clearly states the one-build-at-a-time principle and its reasons, with each build handling its own shipping. Conflicting wording was removed from the README and build skill. The tests check the actual documents, and the reported suite has no failures. No blocking concerns found."
  }
}
```

</details>
