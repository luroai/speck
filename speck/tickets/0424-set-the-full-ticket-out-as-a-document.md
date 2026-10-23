---
id: "0424"
title: "Set the full ticket out as a document"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0423"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T18:19:05.570Z"
approved: "2026-10-23T18:30:15.118Z"

---
# 0424 · Set the full ticket out as a document

**Status:** 👍 approved

## Problem
The full ticket's text runs together: section headings, paragraphs and lists are close in size and spacing, so it doesn't read as a document with a clear order of parts.

## Outcome
The full ticket and a review pack read as a hierarchical document: a title, section headings, then the text, each clearly set apart.

## Acceptance criteria
1. The ticket's title is the largest text, with its id and status above it in small type, and its priority, size, risk and type on one line under it.
2. Each section (such as Problem, Outcome, Acceptance criteria, Out of scope and Notes) has a heading smaller than the title and larger than the text, with more space above it than between the section's paragraphs.
3. The text is at least 15 px with a line height of at least 1.5. A heading inside a section's text (`#` to `###`) is smaller than the section's heading, and each level is smaller than the one above it.
4. Numbered lists, such as the acceptance criteria, have their numbers hanging to the left of the text, and nested lists are indented under their item.
5. A review pack uses the same sizes for its title, headings, text and lists.

## Out of scope
- What the full ticket and review pack contain.

## Notes
- The user asked for this on 2026-10-23.
- Today: the full ticket's Markdown is drawn by `markdown()` in `templates/panel.html` (0132, 0158).
- Waits for 0423: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: the status above the title now follows a change to the ticket in place (it was only drawn when the pane was built), and a review pack's Close stays on the id's line rather than dropping under its title (found in the pictures).
- Changed existing tests: 0143 and 0063 asserted the full ticket's top line as id, title, Close; it is now id, status, Close, title (this ticket's AC1).

## In plain words
The full ticket and a review pack now read like a document. The ticket's number and status sit in small type at the top, its title is the largest text with its tags just under it, and each section (Problem, Outcome and so on) has a clear heading with room above it. The text itself is bigger and more widely spaced, and numbered lists hang their numbers to the left. A review pack uses the same sizes, its tables included.

To see it, open any ticket's Full ticket, or an approved or shipped ticket's Review pack.

Worth a look: the bigger text makes a review pack's tables wider, so on a narrow window their columns wrap more. The pop-up that shows a document task's document keeps its old, smaller look for now.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Explicit overrides leave code blocks at 12 px and Markdown tables at 13 px.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 289,937
- Elapsed since build started: 11 min
- Changed lines: 36 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The document pop-up (a document task's document) keeps its old type sizes: saved to the inbox as speck/ideas/2026-10-23-set-a-document-task-s-document-out-the-same-way.md.
  - Known limit: at 15 px a review pack's criteria table is wider, so its narrow Result column wraps more on a narrow window.

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
    "reviewed_sha": "935cb43ce01e23fae549dad63824a4c27261f167",
    "session": "fresh",
    "thread_id": "01a16a05-4c6a-7013-a6ac-6b42161bde4b",
    "builder_response": "- Tests run: test/panel-0424.test.mjs test/panel-0143.test.mjs test/panel-0063.test.mjs (plus the commands.checks files, which speck test adds)\n- Also run, outside this file, while building: every test file that mentions the full ticket or Review pack (51 files, 557 passing, real-browser ones included).\n- Changed existing tests: test/panel-0143.test.mjs and test/panel-0063.test.mjs asserted the full ticket's top line as id, title, Close (by position). AC1 adds the status above the title, so the line is now id, status, Close, title, tags; those lines now find the title by its class.\n- Design: CSS-only type scale on #full-ticket (title 26px, section headings 19px serif, text 15px/1.6, # / ## / ### inside text 18/16/15px). A review pack's own Markdown headings get the section-heading rule through `#full-ticket > .md` (the pack's text is the only .md straight in the pane; a ticket's sections are inside its body). #doc-view is left as it was.\n- Pictures: 4 (full ticket and review pack, light and dark) kept with speck picture.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 100647,
      "cached_input_tokens": 73984,
      "cache_write_input_tokens": 0,
      "output_tokens": 1008,
      "reasoning_output_tokens": 145
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:28:39.201Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: fullTicket() places id and state above the 26 px title, with paneTags() below. Passing 0424 AC1 tests cover structure, sizes and status updates."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: section h4 rules use 19 px headings and 28 px top margins versus 15 px body text and 10 px paragraph spacing. Passing 0424 AC2 tests exercise these rules and section rendering."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The .md and criteria containers use 15 px/1.6 and internal headings use 18/16/15 px, but templates/panel.html:571 overrides code-block text to 12 px and :573 overrides table text to 13 px. The AC3 test checks only container declarations."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html:566 sets outside list markers and 1.6em indentation for criteria and Markdown lists. mdBlocks() nests lists inside their parent item. The passing 0424 AC4 test checks markers, indentation and criteria list rendering."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Review packs share the title, section-heading and list rules, as the passing AC5 test confirms, but their acceptance-criteria tables retain 13 px text rather than the required 15 px document text. The test's PACK fixture includes a table but never checks its font size."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:571",
        "issue": "Explicit overrides leave code blocks at 12 px and Markdown tables at 13 px. This includes the review pack's core acceptance-criteria table, so substantial document text remains below the ticket's 15 px minimum. The new tests inspect parent declarations and miss these overrides.",
        "suggested_fix": "Make table and code-block text within #full-ticket at least 15 px, preserving the separate #doc-view styles. Extend the tests to check these rendered text elements or their effective CSS rules.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The title, section hierarchy and lists meet the requested layout. However, review-pack tables and code blocks still display smaller text than required. Fix those sizes and extend the tests before approval."
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
    "reviewed_sha": "43a4b1c40607b9cf25ba5ecfd67bcc563208b5c1",
    "session": "continued",
    "thread_id": "01a16a05-4c6a-7013-a6ac-6b42161bde4b",
    "builder_response": "- Tests run: test/panel-0424.test.mjs test/panel-0143.test.mjs test/panel-0063.test.mjs test/panel-0158.test.mjs test/panel-0132.test.mjs test/panel-0417.test.mjs (plus the commands.checks files)\n- F1: fixed. templates/panel.html: a new rule after the shared table rules, `#full-ticket .md table, #full-ticket pre code { font-size: 15px; }`, so a review pack's tables and any code block in a ticket or pack are the 15 px text size (th/td inherit it). #doc-view keeps its 13 px tables and 12 px code. New test \"0424 AC3: tables and code blocks … are the text size too\" checks the last rule setting a size for the table and pre code is at least 15 px, that th, td, p, inline code, summary and criteria items set nothing smaller, and that #doc-view is unchanged; it fails with the new rule removed. Checked in a real browser too: a pack's td computes to 15px. Pictures re-taken.\n",
    "seconds": 14,
    "usage": {
      "input_tokens": 186672,
      "cached_input_tokens": 153856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1610,
      "reasoning_output_tokens": 145
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:29:57.412Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "fullTicket() places the id and status above the title and tags below it. The CSS gives the title 26 px and its own line. Passing 0424 AC1 tests cover structure, sizes and status updates."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html sets section headings to 19 px, between the 26 px title and 15 px text, with 28 px above versus 10 px paragraph spacing. Both 0424 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Text uses 15 px/1.6; internal headings use 18/16/15 px. The new rule overrides table and code-block sizes to 15 px. Passing AC3 tests now cover those overrides as well as the hierarchy and line height."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "List CSS uses outside markers and 1.6em indentation; mdBlocks() nests lists inside their parent items. The 0424 AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Review packs share the title, section-heading, text and list rules, including the corrected 15 px tables and code blocks. The 0424 AC5 and expanded AC3 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:575",
        "issue": "The previously undersized table and code-block text now uses 15 px. The added regression test checks the effective final declarations.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The ticket and review pack now meet the requested document hierarchy and text sizes. The earlier sizing gap is fixed and covered by a regression test. All five criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
