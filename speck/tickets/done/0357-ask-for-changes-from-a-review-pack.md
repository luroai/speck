---
id: "0357"
title: "Ask for changes from a review pack"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0356"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T10:52:50.899Z"
approved: "2026-10-21T10:59:14.506Z"
finished: "2026-10-21T11:01:53.158Z"

---
# 0357 · Ask for changes from a review pack

**Status:** ✅ done

## Problem
Gate 2 happens in the panel, often on a phone. With `speck changes` (0356) only on the command line, a user reading a document in the panel can ship it but can't ask for changes there.

## Outcome
An approved ticket's review pack in the panel has a box for a note and an "Ask for changes" button that sends it back to the build.

## Acceptance criteria
1. An approved ticket's review pack shows a text box and an "Ask for changes" button next to its Ship button. The button can't be pressed while the box is empty or only spaces.
2. Pressing it runs `speck changes <id>` with the note, through `POST /api/tickets/<id>/changes`, and shows what speck said, as the Ship button shows what `speck ship` said.
3. When `speck changes` refuses, the panel shows its reason and keeps the note in the box.
4. No test that passed before this change fails.

## Out of scope
- Comments on passages of a document.
- Anything `speck changes` itself does (0356).

## Notes
- The Ship button (0133) is the pattern to follow: its route in `scripts/panel.mjs` and its place above the review pack in `templates/panel.html`.
- Failing before this build: none
- Self-check: what speck said after a sent note stayed for the life of the page and hid the box, even once the ticket was approved again; opening the pack now clears it, as it does Ship's messages.

## In plain words
When a ticket is approved, its review pack in the panel now has a box under the title where you can write what you'd like changed, and an "Ask for changes" button beside Ship. Pressing it sends your note back to the ticket's build, which makes the changes and has them reviewed again before the ticket can ship. You can do this from your phone as well as from the command line.

To see it, open an approved ticket's review pack in the panel. The button stays greyed out until you've typed something. After you press it, the panel shows what speck said. If speck turns the note down, for example because the ticket already has changes waiting, the reason shows in red and your note stays in the box so you don't lose it.

Worth keeping an eye on: the note only goes through for a ticket that Auto-build built, since that is the build it hands the note back to.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 101,166
- Elapsed since build started: 6 min
- Changed lines: 108 (limit 5000)
Follow-ups:
- Idea: describe the panel's Ask for changes button in the brief (speck/ideas/2026-10-21-describe-the-panel-s-ask-for-changes-button-in-the-brief.md).
- Skipped as a duplicate: none.

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
    "reviewed_sha": "46b5dc9c78042de53e0ea466eec026d03f972af1",
    "thread_id": "01a15e1c-d073-7923-b32d-243fed46c707",
    "seconds": 23,
    "usage": {
      "input_tokens": 100577,
      "cached_input_tokens": 60928,
      "cache_write_input_tokens": 0,
      "output_tokens": 589,
      "reasoning_output_tokens": 53
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:58:51.939Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: shipPart and changesPart show the note box beside Ship and disable submission for blank input. Passing AC1 tests in test/panel-0357.test.mjs exercise visibility and whitespace handling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "askForChanges posts the note to the authenticated changes route; panelChanges spawns speck changes with separate arguments and returns its output. Passing AC2 tests exercise the page, CLI invocation and real HTTP route."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "askForChanges retains changesNotes on refusal and displays the returned error. Passing AC3 tests check the reason and retained note across updates, network failure, and the CLI's actual refusal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output reports 128 passed, zero failed and three skipped across 131 tests, including the existing Ship tests and repository checks. The diff contains no weakened existing tests or unrelated implementation changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The review pack now lets users send a change request beside Ship, displays the command's response, and preserves the note when submission fails. The tests exercise the page and server behaviour. No blocking issues found."
  }
}
```

</details>
