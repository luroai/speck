---
id: "0356"
title: "Send your changes back to an approved ticket's build"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0355"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:41:24.475Z"

---
# 0356 · Send your changes back to an approved ticket's build

**Status:** 🔍 reviewing

## Problem
When the user reads an approved result and wants it changed, the only way today is a new ticket. Documents will often need a revision or two, and a new ticket for each one goes round in circles.

## Outcome
The user sends a note back to an approved ticket, its build revises the work, and it comes back approved after another review.

## Acceptance criteria
1. `speck changes <id> "<note>"` on an approved ticket adds the note, dated, to the ticket's Review log as changes asked for by the user and commits it. Until the ticket is approved again, neither `speck ship --auto` nor the ship queue ships it.
2. `speck run` resumes the ticket's build session with a message that contains the note and tells it to make the changes, run the review loop again, and stop once it's approved. The reviewer's next round is given the note to check as well as the acceptance criteria.
3. `speck changes` refuses, changing nothing and saying why, for a ticket that isn't approved, an empty note, or a ticket whose build session can't be resumed.
4. No test that passed before this change fails.

## Out of scope
- The panel's box and button (0357).
- Comments on particular passages or lines.
- Changes asked for on a ticket that's already done: that's still a new ticket.

## Notes
- Agreed with the user 2026-10-21: one note per round on the same ticket, rather than a new ticket per revision. It works for code tickets as well as documents.
- The ship queue's hand-backs (0194) already resume a build session with a message and hold the ticket from shipping meanwhile: `handBackQueue`, `handBackMessage` and `resumeFor` in `scripts/hand-back.mjs`. A new hand-back kind for the user's note fits there.
- The reviewer prompt is built in `scripts/review.mjs` from `templates/reviewer-prompt.md`.
- Failing before this build: none
- AC4 has no test of its own: `speck ship` runs the whole suite. The related existing test files (close, review rounds, hand-backs, auto-ship, pull requests) pass with this change.
- Self-check: no changes

## In plain words
When you read an approved result and want something changed, you can now send a note back to it with `speck changes`, rather than writing a new ticket. The note is kept, dated, in the ticket's review history. While `speck run` is on, it hands the note to the same build session that made the work. That build makes the changes, and the reviewer checks them against your note as well as the ticket's original goals. Until it's approved again, nothing ships it, automatically or by hand.

To see it, take an approved ticket that `speck run` built, run `speck changes <id> "what you want changed"`, and watch the ticket go back to reviewing and then approved again. It refuses, saying why, for a ticket that isn't approved, an empty note, or a build it can't pick up again. Worth knowing: the rounds that check your changes are labelled "merge rounds" in the history, even though nothing was merged, and there's no button for this in the panel yet (that's ticket 0357).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Rounds that check the user's changes are labelled "merge round": speck/ideas/2026-10-21-call-a-round-after-asked-for-changes-a-changes-round.md.
  - Known limit: when a changes hand-back is dropped because a round already reviewed the changes, speck run says nothing about it in its log.
  - Known limit: `speck status`'s text view doesn't show that changes are waiting on an approved ticket; the panel's box and button are 0357.

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
    "reviewed_sha": "cbb7c5b4961184a709968d2ae7b688f722deeb85",
    "thread_id": "01a15e13-0929-77f3-981c-65b35c4e7195",
    "seconds": 44,
    "usage": {
      "input_tokens": 242382,
      "cached_input_tokens": 181632,
      "cache_write_input_tokens": 0,
      "output_tokens": 1058,
      "reasoning_output_tokens": 212
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:48:31.612Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "askForChanges commits a dated Review log entry. ticketNext and autoShipWhyNot hold shipping; the passing AC1 tests exercise CLI shipping and the ship queue."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing AC2 tests cover immediate resumption and reviewer prompts, but handBackQueue.check discards the request if any commit is made before resumption."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "askForChanges validates status, note and resumeFor before writing. The passing AC3 refusal test checks the ticket, commit and run record remain unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported test run: 119 passed, zero failed, three skipped. Related existing test files also reportedly pass; no test weakening or unrelated changes found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs",
        "issue": "handBackQueue.check deletes a changes hand-back whenever the branch head differs from the commit recorded with the note. For example, send a note while speck run is off, commit another ticket edit, then start speck run: the build is never resumed. The Review log still holds shipping, and speck changes refuses another note because the first remains pending, leaving the request stranded.",
        "suggested_fix": "Keep user changes queued across subsequent commits while their Review log request still awaits review. Retain the existing stale-head handling for shipping hand-backs. Add a test that commits a ticket edit after askForChanges and verifies the queue still resumes the build with the note.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal revision flow works and prevents premature shipping. However, a commit made before the build resumes silently cancels its queued revision while leaving shipping blocked. Fix that lost-request case before merge."
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
    "reviewed_sha": "c0a3d240c4acf04804cde4333744ea9e04bc5d21",
    "thread_id": "01a15e13-0929-77f3-981c-65b35c4e7195",
    "seconds": 20,
    "usage": {
      "input_tokens": 370211,
      "cached_input_tokens": 304256,
      "cache_write_input_tokens": 0,
      "output_tokens": 1601,
      "reasoning_output_tokens": 212
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:49:38.926Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "askForChanges commits the dated Review log note. ticketNext and autoShipWhyNot prevent shipping pending changes. Passing AC1 tests cover the CLI, ship queue and reapproval."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "handBackQueue preserves pending user requests across commits and resumes the build with handBackMessage. reviewerPrompt includes the note until approval. Passing AC2 tests exercise these behaviours, including the F1 regression."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "askForChanges validates refusals before writing. Passing AC3 tests verify explanatory errors and unchanged ticket contents, commit and run record."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported round-2 results: 155 passed, zero failed, three skipped, including related hand-back and session tests. No weakened tests or unrelated changes found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/hand-back.mjs",
        "issue": "A commit before resumption previously discarded the queued user request, leaving shipping blocked.",
        "suggested_fix": "Implemented: changes hand-backs remain live while the Review log request awaits review; shipping hand-backs retain their existing head check. Passing regression tests cover preservation and removal after review.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The revision flow now preserves requests across intervening commits, resumes the build with the note, and requires another review before shipping. The previous blocking issue is resolved, and all reported tests pass."
  }
}
```

</details>
