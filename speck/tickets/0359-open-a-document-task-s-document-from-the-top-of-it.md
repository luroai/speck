---
id: "0359"
title: "Open a document task's document from the top of its review pack"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T14:38:20.251Z"
approved: "2026-10-21T14:43:36.513Z"

---
# 0359 · Open a document task's document from the top of its review pack

**Status:** 👍 approved

## Problem
In the trial run (0358), the user found a document task's document hard to spot: the panel lists it under the acceptance criteria table, below the verdict, the summary and the criteria. And pressing it opened the document twice: formatted in the panel's side pane, as intended, and in a new tab of cptr's built-in browser as well. For a document, reading it is Gate 2, so opening it should be the first thing in the pack and happen once.

## Outcome
A document task's review pack opens with a button for its document, and pressing it shows the document in the panel and nowhere else.

## Acceptance criteria
1. In the panel, a document task's review pack shows one button per file in its output folder at the top of the pane, above the Ship and Ask for changes row, each labelled with the file's path from the project root. The files are no longer listed under the acceptance criteria table as well.
2. Pressing a Markdown file's button shows it formatted in the side pane, as now, and opens no new tab or window: the button isn't a link with an address or a target, so a browser that opens such links itself, such as cptr's built-in browser, has nothing to open.
3. Pressing any other file's button opens it in a new tab, served by the panel, as its link does now.
4. `speck pack <id>` puts a document task's "Document" section straight after the summary, before the acceptance criteria.
5. No test that passed before this change fails.

## Out of scope
- How the document itself is formatted in the side pane.
- Code tickets' review packs, and the pictures of a visual change (0294), which stay where they are.

## Notes
- From the user's trial of 0358 on 2026-10-21.
- `documentsPart`, `openDocument` and `packPane` in `templates/panel.html`; `documentLines` in `scripts/output.mjs`, which `reviewPack` in `scripts/pack.mjs` places.
- The link's click handler already calls `preventDefault`, yet a tab still opened, so cptr's browser most likely acts on links with `target="_blank"` before the page's own handler runs.
- Checked 2026-10-21: cptr's source isn't installed on this box, so how its built-in browser opens links couldn't be confirmed beyond what the user saw on 2026-10-21. It doesn't change the ticket: a button with no address gives any browser nothing to open. Cursor's built-in browser may do the same; a button with no address avoids it in either.
- Failing before this build: not checked
- Self-check: no changes. Checked a pack still loading or with no files shows no buttons, and a file the server lists with an address outside its folder gets no button. 0354's panel tests checked for links under the criteria, which this ticket replaces with buttons at the top: they now check the same things with the buttons.

## In plain words
When you open a document task's review pack in the panel, its document is now the first thing you see: a button for each file, at the top, above Ship and Ask for changes. Pressing a Markdown file's button shows it formatted in the panel and opens nothing else, so it no longer pops up a second time in a new tab of your editor's built-in browser. Any other kind of file still opens in a new tab. The printed review pack lists the document straight after the summary too.

To see it, open the review pack of a document task, such as 0358, and press its button. Worth a check: whether cptr's browser still opens a tab for a non-Markdown file, which is meant to open in one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 162,783
- Elapsed since build started: 5 min
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
    "reviewed_sha": "3a22f59a100d8e30f429fa2bd5ce6a2716690cfe",
    "thread_id": "01a15eea-4360-78e0-8d46-4fdf2c53ebdd",
    "seconds": 33,
    "usage": {
      "input_tokens": 162047,
      "cached_input_tokens": 114048,
      "cache_write_input_tokens": 0,
      "output_tokens": 736,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T14:43:25.925Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: packPane places documentsPart above shipPart and outside the pack body. Passing 0359 AC1 tests verify path labels, placement, no duplicate listing and no buttons for an empty list."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "documentsPart creates a button without href or target and calls openDocument for Markdown. The passing 0359 AC2 test exercises the click, checks formatted content and verifies no window.open call."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "documentsPart calls window.open with the panel URL, _blank and noopener for other files. Passing 0359 AC3 and 0354 server tests cover opening and serving these files."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/pack.mjs: reviewPack inserts documentLines immediately after the summary. Both 0359 AC4 tests pass, including the CLI output and a missing output folder."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the supplied test log: 127 passed, 0 failed, 3 skipped. Updated 0354 tests retain behavioural coverage. The limited change shows no apparent regression; the whole-suite check remains with speck ship."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Document files now appear as buttons above the shipping controls. Markdown opens formatted in the panel without opening another tab; other files open separately. The command-line pack lists documents immediately after its summary. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>
