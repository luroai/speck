---
id: "0108"
title: "Build only tickets whose ready status is committed"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0095", "0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T19:51:22.377Z"

---
# 0108 · Build only tickets whose ready status is committed

**Status:** 🔍 reviewing

## Problem
`speck set <id> status ready` doesn't commit the ticket, but `speck run` launches any ticket marked ready, committed or not. `speck start` then refuses the uncommitted ticket, so on 2026-10-10 five builds (0095, 0097–0100) each committed their own ticket on `main` in the shared checkout to get past it, with five different commit messages. Builders changing `main` to get past a refusal is exactly the improvising speck must stop.

## Outcome
A ticket is built only once its ready status is committed, setting a ticket ready commits it, and builders never change the main checkout to get past a refusal.

## Acceptance criteria
1. `speck set <id> status ready` commits only that ticket's file, as `speck(<id>): ready`, as setting ready from the panel does. It refuses, changing nothing, when the checkout isn't on the base branch. Other `speck set` changes still don't commit.
2. `speck run` launches a ticket only when it's `ready` in the base branch's latest commit. A ticket marked ready but not committed isn't launched, and `speck run` says once that it's waiting for that ticket to be committed.
3. The build skill says never to commit, stage or change files in the main checkout, and that when `speck start` refuses, the builder reports the reason in plain words and stops.
4. No test that passed before this change fails.

## Out of scope
- Committing other `speck set` changes.

## Notes
- After 0095 (also changes the build skill) and 0100 (also changes `speck set`), to avoid merge conflicts.
- `speck start` already refuses an uncommitted ticket; that refusal is what the builders worked around.
- Failing before this build: none
- Three existing tests ran `speck set <id> status ready` assuming it doesn't commit. Only their fixtures changed, and each still checks the same thing: `CLI: init, new, lint, set ready, status` (speck.test.mjs) and 0083 AC3 (lint-0083.test.mjs) now give git an identity (and 0083's repo a `main` branch), since this machine has no global git identity; 0079 AC5 (panel-0079.test.mjs) undoes `speck set`'s commit before replaying the panel's Ready, so the panel has something to commit.
- A ticket set ready from speck/tickets/done/ is committed as a move: the commit removes the copy in done/ when git knew it, so nothing is left over. Setting ready on a ticket already committed as ready commits nothing.
- Self-check: narrowed the skill's "if `speck start` refuses, stop" to a `ready` ticket, since resuming deliberately runs `speck start` and uses its refusal; added tests for a detached HEAD, a failed commit after a move from done/, and setting ready twice.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- To the inbox: speck/ideas/2026-10-10-put-a-stopped-build-back-in-the-queue.md (a stopped build can't be set ready again with `speck set` now that it commits only on the base branch). Checked against speck/ideas/2026-10-09-resume-a-build-stopped-before-it-started.md and ticket 0110, which cover other cases.
- Tidy-up: the panel's refusal for a draft filed in speck/tickets/done/ still ends "then commit it", which `speck set` now does itself.
- Tidy-up: the panel checks the branch with `git rev-parse --abbrev-ref HEAD` and `speck set` with `git symbolic-ref`, which also works before the first commit; they could share one helper.
- The 0.2.0 changelog doesn't mention this yet; 0106 brings it up to date.

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
    "reviewed_sha": "bd9537dbecf8e0a83371a2615702fc17a4bc688d",
    "thread_id": "01a1276a-caee-72c3-a8a1-d8c565ff0287",
    "seconds": 20,
    "usage": {
      "input_tokens": 297465,
      "cached_input_tokens": 190976,
      "cache_write_input_tokens": 0,
      "output_tokens": 649,
      "reasoning_output_tokens": 44
    },
    "saved_at": "2026-10-10T20:04:52.854Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdSet checks the base branch before writing and commits only the ticket through commitTicketOnly. test/ready-0108.test.mjs covers unrelated staged files, branch and detached-HEAD refusals, failed commits, moves from done/, repeated ready settings and other changes remaining uncommitted."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs readyOnBase reads the ticket from refs/heads/<base>; tick gates launches and reports waiting once per ticket. AC2 tests exercise uncommitted and never-committed tickets, unrelated commits, committed-ready launches and launching after commitment."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md prohibits committing, staging or changing files in the main checkout and requires reporting the reason and stopping when start refuses a ready ticket. The AC3 test checks these instructions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Provided full-suite output reports 853 passes, zero failures and three skips. Existing test changes preserve their assertions and adapt fixtures to the newly required commit. Tests were inspected but not rerun because they write temporary repositories and this review is read-only."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setting a ticket ready now commits that ticket on the base branch, and automatic builds wait until its ready status is committed. Builder instructions also require stopping when starting is refused. The tests cover the main behaviour and failure paths; no blocking issues were found."
  }
}
```

</details>
