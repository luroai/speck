---
id: "0142"
title: "Format Markdown in opened Plan items"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0142 · Format Markdown in opened Plan items

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
