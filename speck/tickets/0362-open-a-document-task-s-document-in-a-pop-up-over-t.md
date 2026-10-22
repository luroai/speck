---
id: "0362"
title: "Open a document task's document in a pop-up over the whole panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-open-a-document-in-a-pop-up-over-the-whole-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0361"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:05:04.994Z"

---
# 0362 · Open a document task's document in a pop-up over the whole panel

**Status:** 🔍 reviewing

## Problem
A document task's Markdown document opens in the side pane, which is at most 480 px wide. That's narrow for reading a document, and reading it is how you review a document task before you ship it.

## Outcome
Pressing a Markdown document's button in a review pack shows it, formatted, in a pop-up that covers the whole panel window.

## Acceptance criteria
1. Pressing a Markdown file's button at the top of a document task's review pack opens a pop-up that covers the whole panel window at every width, in both looks. It shows the file's path, a Close button and the document formatted as the side pane formats it today, tables included, with its text in a centred column at most 760 px wide. The side pane no longer shows the document.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long document scrolls inside the pop-up, not the page behind it.
3. Close and Escape close the pop-up and leave the review pack open in the side pane as it was, with the focus back on the file's button.
4. While the file is loading, or when it can't be fetched, the pop-up says so, with the same wording as the side pane today. A file that isn't Markdown still opens in a new tab, as today.
5. No test that passed before this change fails, except checks that a Markdown file shows in the side pane with a "Back to the review pack" button, which are changed to check AC1 and AC3.

## Out of scope
- Shipping from the pop-up: 0363.
- The review pack itself, which stays in the side pane.
- The notice board's pop-up (`speck/ideas/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md`), though it should be able to share this pop-up's look later.

## Notes
- Today: `documentsPart`, `openDocument` and `documentPane` in `templates/panel.html` (0354, 0359). The side pane is `#full-ticket`, made modal in 0060, and focus returns to its opener as in 0326.
- The "Back to the review pack" button goes: closing the pop-up returns to the pack.
- Failing before this build: none
- Self-check: added a test that the pop-up closes, and the side pane stops being inert, when the ticket leaves the board while its document is open; it already passed.

## In plain words
In a document task's review pack, pressing a Markdown file's button now opens the document over the whole panel window instead of in the narrow side pane. The text sits in a comfortable centred column, tables included, with the file's name and a Close button at the top. Close, or the Escape key, takes you back to the review pack just as you left it.

To see it, open the review pack of a document task and press the button for its Markdown file. Files that aren't Markdown still open in a new tab.

Worth a look: on a phone, the Close button scrolls away with a long document, so you scroll back up to close it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups:
- Keep the pop-up's path and Close button in view while a long document scrolls: `speck/ideas/2026-10-22-keep-the-document-pop-up-s-close-button-in-view.md`.

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
    "reviewed_sha": "e8bcdba3fb3ca9879635c15f2c788d63d8383f60",
    "thread_id": "01a1642a-9053-7891-838b-4e7e9709d275",
    "seconds": 27,
    "usage": {
      "input_tokens": 122957,
      "cached_input_tokens": 74496,
      "cache_write_input_tokens": 0,
      "output_tokens": 796,
      "reasoning_output_tokens": 82
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:11:40.120Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: openDocument and drawDoc render Markdown with tables in #doc-view; its fixed inset layout fills the window and centres a column capped at 760 px using theme colours. Passing 0362 AC1 tests cover formatting, layout rules and the unchanged review pack."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawDoc makes the side pane and backdrop inert and focuses the dialog; holdPage keeps the underlying page inert and locks page scrolling. #doc-view provides internal scrolling and overscroll containment. Passing 0362 AC2 tests check these behaviours and rules."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "closeDoc restores focus to the document button without rebuilding the pack. The Escape handler closes the document first. Passing 0362 AC3 tests cover Close, Escape, retained pack nodes, late responses and removal of the ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "openDocument preserves the previous loading and failure messages; documentsPart retains window.open for other file types. Passing 0362 AC4 tests exercise loading, HTTP failure, network failure and non-Markdown files."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test run reports 139 passes, zero failures and three skips across the selected files and required checks. Changes to existing 0354 and 0359 assertions match the explicitly permitted move from the side pane to the pop-up. No unrelated implementation changes found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Markdown documents now open over the whole panel while the review pack stays underneath. Closing returns focus to the file button. Loading, errors and other file types retain their existing behaviour. The tests pass, and no blocking issues were found."
  }
}
```

</details>
