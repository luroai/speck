---
id: "0142"
title: "Format Markdown in opened Plan items"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:00:45.866Z"

---
# 0142 · Format Markdown in opened Plan items

**Status:** 🔍 reviewing

## Problem
When a draft ticket, an idea or an inbox note is opened in the panel's Plan section, its text is shown as raw Markdown: `**bold**`, backticks, list dashes and `#` headings appear as typed. The full ticket pane already formats the same Markdown, so the short view is harder to read than it needs to be.

## Outcome
An opened draft ticket, idea or inbox note in Plan shows its Markdown formatted, the same way the full ticket pane does.

## Acceptance criteria
1. In an opened draft ticket in Plan, the Problem and Outcome text is formatted as Markdown exactly as the full ticket pane formats it: bold, italics, inline code, lists, headings and http and https links.
2. In an opened idea or inbox note, the note's whole text is formatted the same way, its tables included, as they are in the review pack.
3. Markdown is never read as HTML: text such as `<b>x</b>` or `<script>` in a ticket or note shows as those characters.
4. Text selected in an opened draft, idea or inbox note stays selected across the panel's refreshes, as it does today.
5. No test that passed before this change fails, except checks that an idea or inbox note is shown as preformatted plain text, which are changed to check the formatted text.

## Out of scope
- The full ticket pane, which already formats Markdown.
- Changing what an opened item shows (which sections), only how its text looks.

## Notes
- Draft Problem and Outcome use `part()`, which puts the text in a plain `<p>`; ideas and inbox notes use a `<pre class="note">` (`ideaItem`, `inboxItem` in `templates/panel.html`). The pane uses `mdPart()` with `markdown()` and `mdBlocks()`.
- Failing before this build: none
- Self-check: no changes
- Older tests changed: 0039 and 0040 found an idea's note by its `pre` tag or its first text node, so they now find its paragraph (AC5). 0061's out-of-scope check that the short view in the Tickets list stays plain text asserts the opposite of AC1, so it now checks the Markdown is formatted; AC5's exception doesn't name it, but no build can meet AC1 and keep it.

## In plain words
When you open a draft ticket, an idea or an inbox note in the panel's Plan section, its text now looks the way it does in the full ticket pane: bold, italics, code, lists, headings and links are formatted instead of showing their raw symbols, and tables in ideas and inbox notes show as tables, as in the review pack. To see it, open any draft, idea or inbox note in Plan. Text that looks like web code still shows exactly as typed, and selecting text still works through the panel's refreshes. Ideas and inbox notes are no longer shown in a typewriter font.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-ups, no inbox notes): the panel's `.detail ol` styles no longer match anything in Plan, since an opened draft doesn't list its criteria there, and could go.

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
    "reviewed_sha": "5b70ac420fefbe8f83d2edb4b03cf752246a5790",
    "thread_id": "01a1344d-4bfb-7810-9e0f-f195fdf4dabf",
    "seconds": 43,
    "usage": {
      "input_tokens": 144192,
      "cached_input_tokens": 101632,
      "cache_write_input_tokens": 0,
      "output_tokens": 698,
      "reasoning_output_tokens": 30
    },
    "saved_at": "2026-10-13T08:08:06.733Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html part() uses the same markdown() and mdBlocks() as mdPart(). Passing panel-0142 AC1 test checks required formatting and compares the resulting blocks with the full pane."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "noteOf() formats the whole body with tables enabled, matching the review pack's renderer. Passing panel-0142 AC2 tests exercise both ideas and inbox notes, including table cells and inline formatting."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "mdBlocks() and mdInline() create elements and text nodes without interpreting source HTML. Passing panel-0142 AC3 tests verify literal HTML in drafts, notes and tables."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0142 AC4 tests verify retained nodes for drafts, ideas and inbox notes. The browser test also passed and verifies actual selections survive refreshes in formatted draft text and an idea table."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0142-tests.txt: 1264 passed, zero failed, three skipped. Changes to 0039 and 0040 preserve their selection assertions. The replaced 0061 plain-text expectation directly contradicts AC1; its replacement checks the newly required behaviour rather than weakening coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Opened Plan drafts, ideas and inbox notes now format Markdown using the existing renderer, including tables in notes. HTML remains literal text, and selections survive refreshes. The recorded suite has no failures. No blocking concerns found."
  }
}
```

</details>
