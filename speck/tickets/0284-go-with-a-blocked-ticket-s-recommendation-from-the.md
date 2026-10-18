---
id: "0284"
title: "Go with a blocked ticket's recommendation from the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0285"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:54:45.451Z"

---
# 0284 · Go with a blocked ticket's recommendation from the panel

**Status:** 🔍 reviewing

## Problem
Clearing a blocked ticket means messaging an agent "go with the recommendation" or resuming its session by hand, even when the build has already said what it recommends.

## Outcome
A blocked ticket's question in the panel has a button that takes the build's recommendation and starts the build again.

## Acceptance criteria
1. A blocked ticket whose question has a recommendation (0283) shows a "Go with the recommendation" button beside the question in the panel. A ticket without one shows no button.
2. Pressing it resumes the ticket's own build session, as speck run resumes a build after a hand-back, with a message saying the user chose the recommended option, naming it, and to carry on from where it left off. The ticket shows as building again.
3. The ticket's Notes record that the user took the recommendation, with the option and the time.
4. When the build can't be resumed (no run record, or no session), the button isn't shown, and the question says how to resume it by hand, as the panel does today.

## Out of scope
- Answering with a different option, or in your own words.
- The Foreman doing this by itself: 0286.

## Notes
- speck run's hand-backs resume a build in `scripts/hand-back.mjs` (`resumeArgv`). Panel writes are in `scripts/panel.mjs`.
- Failing before this build: none
- Self-check: a choice left waiting while speck run is off could later resume a session already carried on by hand, so the choice now keeps the branch's commit and speck run drops it if the branch has moved or the session is in use (tested). Also dropped a stray record write before the commit.

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
    "reviewed_sha": "06dd8047e3d3f47bb664fab401955e3964f9779b",
    "thread_id": "01a14f1b-f6b4-7cd0-aa3c-1d05898594ae",
    "seconds": 42,
    "usage": {
      "input_tokens": 236610,
      "cached_input_tokens": 194432,
      "cache_write_input_tokens": 0,
      "output_tokens": 1169,
      "reasoning_output_tokens": 348
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:03:56.629Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html goWithButton checks blocked status, recommendation and blocked_resumable. The AC1 page and status tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests cover the standard Claude command successfully. However, goWith accepts a session without checking whether resumeFor can construct a resume command; goWithQueue can subsequently discard the choice without resuming the build."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/go-with.mjs goWith appends the option and UTC time to Notes and commits the ticket. The combined AC2/AC3 test exercises this and passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The missing-record and missing-session tests passed, but goWithResumable only checks for a session string. A build_command that resumeFor cannot resume still gets the button."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/go-with.mjs",
        "issue": "Resumability is checked too late. With a run record containing a session but a custom build_command lacking the placeholders required by resumeArgv, the panel offers the button and goWith commits the choice and sets the ticket building. goWithQueue then discovers it cannot resume, removes the pending choice and only logs instructions. The user's blocked question has disappeared without its build restarting.",
        "suggested_fix": "Check whether resumeFor can construct the resume command before offering the button and again before modifying the ticket. When it cannot, retain blocked status and show the manual resume instructions. Add a test using a session-bearing record and an unsupported build_command.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The standard build path is covered by passing tests, and choices are recorded with their time. One failure path needs fixing: the panel can accept a recommendation and clear the blocked state even when it cannot restart that build."
  }
}
```

</details>
