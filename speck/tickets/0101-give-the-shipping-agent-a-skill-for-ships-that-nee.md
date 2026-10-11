---
id: "0101"
title: "Give the shipping agent a skill for ships that need help"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0097", "0098", "0099", "0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T08:18:17.251Z"

---
# 0101 · Give the shipping agent a skill for ships that need help

**Status:** 🔍 reviewing

## Problem
When a ship can't go through cleanly, someone has to merge the base branch in, resolve conflicts, get the merge re-reviewed and ship again, or notice that `main` is broken. Today that's the builder improvising or the user stepping in. Speck needs one agent whose only job is this, which only asks the user about real decisions.

## Outcome
A `speck-integrate` skill tells the shipping agent how to get one approved ticket shipped when the plain ship couldn't, and when to stop and ask.

## Acceptance criteria
1. `speck init` installs a `speck-integrate` skill in both skill folders. It's agent-only: its frontmatter has `user-invocable: false`, so it isn't in Claude Code's `/` menu, and its description says only the ship queue starts it, never a person or another skill.
2. For a conflict, it merges the base branch in and uses `speck merge-check` (0098): `added-lines` conflicts in lists, tables or imports keep both sides, lockfiles are rebuilt with the project's own install command, and any `logic` resolution keeps the intent of both sides. Once the tests pass, every conflict merge gets a merge round (0097) before it ships: nothing ships after a merge without review.
3. When `speck ship` exits 14 (0099), it changes no code. It creates one fix ticket (0100) describing the failure in plain words, unless an open fix ticket already covers it. It sets that ticket ready only when `auto_fix_main` is true in `speck/config.yml`, then stops.
4. It asks the user only when two tickets contradict each other, or when `speck next` blocks a merge round. It blocks the ticket with a question in plain words, without git terms, giving the options and its recommendation.
5. It never changes a file the merge doesn't need, never merges or pushes except through `speck ship`, and never edits a ticket's Review rounds.

## Out of scope
- Starting the agent and the order of ships (0102).

## Notes
- `auto_fix_main` is off by default (0102 adds the setting).
- Decided 2026-10-10: new skills are agent-only; only Capture, Ticket, Build and Ship (plus the existing review and status) are for people.
- Checked 2026-10-10: `user-invocable: false` in a skill's frontmatter hides it from the `/` menu while Claude can still load it (Claude Code skills docs).
- A skill is text: tests can check AC1 and that each step is named; the reviewer checks the rest by reading it.
- Failing before this build: none
- Answered 2026-10-11 (blocked question: `speck ship` refuses files changed after approval, so a merge can't ship unreviewed): option (a). AC2 narrowed so every conflict merge gets a merge round (0097) before it ships. Letting `speck ship` accept a simple merge without another review is a separate idea, `speck/ideas/2026-10-11-ship-a-simple-merge-without-another-review.md`.
- Two existing tests assumed the old set of skills and were updated for AC1: `test/speck.test.mjs` now expects 8 skills, and `test/setup-0107.test.mjs` lets `speck-integrate` be agent-only alongside `speck-setup`.
- Self-check: the merge round's response file is written fresh (a stale one from the build could be sent), an open fix ticket that already covers the failure is still set ready when `auto_fix_main` allows it, `speck set … ready` is run in the main checkout, and a branch not checked out anywhere stops the agent.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Known limit: nothing starts `speck-integrate` until the ship queue (0102) exists, and "the ship queue tries it again later" after repeated conflicts or a failing base branch depends on 0102 too.
- Skipped, already captured: letting `speck ship` accept a simple merge without another review (`speck/ideas/2026-10-11-ship-a-simple-merge-without-another-review.md`).

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
    "reviewed_sha": "66f092b4f09b9bdf0cfdafa019600c91a7f9d16d",
    "thread_id": "01a12a22-a557-72d2-8e64-6ba58d5d9fc7",
    "seconds": 35,
    "usage": {
      "input_tokens": 412651,
      "cached_input_tokens": 303360,
      "cache_write_input_tokens": 0,
      "output_tokens": 887,
      "reasoning_output_tokens": 39
    },
    "saved_at": "2026-10-11T08:45:11.284Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-integrate/SKILL.md frontmatter meets the requirements; scripts/install.mjs installTooling discovers it for both folders. The supplied AC1 installation tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The Conflict section specifies classification, preserving both sides, rebuilding lockfiles, testing and mandatory merge review before shipping. AC2 text tests pass in the supplied output."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Base branch failing steps 1 and 3 reuse any open fix ticket and unconditionally set it ready when auto_fix_main is true, including tickets already building, reviewing or approved."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Conflict step 8 asks the user after two merges even without contradictory tickets or a blocked review round. The AC4 test checks only the Asking the user section and misses this exception."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Rules section limits changes to merge needs, reserves base merges and pushes for speck ship, and prohibits editing Review rounds. Corresponding text tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-integrate/SKILL.md:40",
        "issue": "Repeated shipping conflicts introduce a third reason to ask the user, contrary to AC4. New compatible changes arriving during shipping do not necessarily mean tickets contradict each other.",
        "suggested_fix": "Remove this unconditional question. Ask only after establishing contradictory requirements or when speck next blocks the merge round; otherwise report and stop if retries must be bounded. Extend the test to inspect all question paths.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-integrate/SKILL.md:46",
        "issue": "An existing fix ticket may already be building, reviewing or approved in another worktree. Sending it through status ready can reset its progress or act on the stale main-checkout copy, rather than simply reusing the ongoing fix.",
        "suggested_fix": "Check the existing ticket's authoritative status, including its worktree. Preserve ongoing or approved fixes and only promote eligible draft tickets when auto_fix_main is true. Add text checks for these status guards.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new skill is installed correctly and requires independent review after resolving shipping conflicts. Two instructions need correction: it asks the owner about routine repeated conflicts, and it can reset an existing repair ticket that is already underway. The supplied tests pass but miss these cases."
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
    "reviewed_sha": "bb6a51f5f8c288d214fb18472bdc8fd47a6e495f",
    "thread_id": "01a12a22-a557-72d2-8e64-6ba58d5d9fc7",
    "seconds": 24,
    "usage": {
      "input_tokens": 779300,
      "cached_input_tokens": 593664,
      "cache_write_input_tokens": 0,
      "output_tokens": 1455,
      "reasoning_output_tokens": 39
    },
    "saved_at": "2026-10-11T08:47:46.015Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-integrate/SKILL.md has user-invocable: false and the required queue-only description. scripts/install.mjs installs discovered skills into both folders; AC1 installation tests pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The Conflict section requires merge-check classification, preserving both sides, rebuilding lockfiles, tests and independent merge review before shipping. The AC2 instruction tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Base branch failing prohibits code changes, reuses a covering fix ticket and promotes only an unstarted draft when auto_fix_main is true. AC3 and the new AC3 F2 guard test pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Conflict step 8 now stops without a routine question. The Asking the user section restricts questions to contradictory tickets or blocked merge review and requires plain wording, options and a recommendation. AC4 and AC4 F1 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Rules section restricts changes to merge needs, reserves base merges and pushes for speck ship and prohibits manual Review rounds edits. AC5 tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-integrate/SKILL.md:40",
        "issue": "Repeated shipping conflicts previously introduced an unauthorised reason to ask the user. The revised instruction stops and reports instead.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-integrate/SKILL.md:48",
        "issue": "Existing fix tickets could previously be reset to ready. Promotion now requires a draft in the main checkout with no existing ticket branch, preserving ongoing work.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both requested fixes are complete. The skill handles shipping conflicts with independent review, records existing base failures without changing code, and preserves repairs already underway. All five criteria pass; the supplied suite reports 933 passes, no failures and three skips."
  }
}
```

</details>
