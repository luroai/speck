---
id: "0061"
title: "Show the full ticket's text as formatted Markdown"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0060"]               # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:42:48.053Z"

---
# 0061 · Show the full ticket's text as formatted Markdown

**Status:** 🔨 building

## Problem
The full ticket pane shows each section as plain text, so Markdown such as `**bold**`, `` `code` `` and `- ` lists shows its raw symbols. Long notes and criteria with code and lists are harder to read than in a Markdown viewer.

## Outcome
The full ticket pane shows each section's Markdown formatted, the way a Markdown viewer would.

## Acceptance criteria
1. In every section of the pane (problem, outcome, each acceptance criterion, out of scope and notes), this Markdown shows formatted: `**bold**` as bold; `*italic*` and `_italic_` as italic; `` `code` `` in monospace with a background; fenced code blocks (three backticks) as monospace blocks keeping their line breaks and spaces; lines starting `- `, `* ` or `1. ` as bulleted or numbered lists, nested by their indentation; `#`, `##` and `###` lines as headings smaller than the section's own heading; and blank lines between paragraphs.
2. A link `[text](url)` whose URL starts `http://` or `https://` shows its text as a link that opens in a new tab. Any other link shows as its text only, with nothing to click.
3. Anything else, including raw HTML such as `<script>` or `<img src=x onerror=alert(1)>`, shows as literal text, exactly as written. Markdown symbols inside code spans and code blocks show as written, unformatted.
4. Text selected in the pane stays selected through the 2-second refresh while that ticket's data in `/api/state` is unchanged, as it does today.

## Out of scope
- Ideas, inbox notes, the short open view in the Tickets list, and the queue: they stay plain text.
- Tables, images, blockquotes and other Markdown not listed above: they show as literal text.
- Making the pane modal (0060).

## Notes
- After 0060, as both change the side pane in `templates/panel.html`.
- The page is one file served locally: nothing may be loaded from the network, such as a Markdown library from a CDN.
- product.md says ticket text is "always shown as text, never as HTML": it needs to say the pane formats the Markdown listed here and shows everything else as text.
- The sections come from `/api/state` as their Markdown text (`problem`, `outcome`, `acceptance_criteria`, `out_of_scope`, `notes`). Nothing in the JSON changes.
- Headings: "smaller than the section's own heading" is built as ranking below it: `#` is an `h5`, `##` and `###` are `h6` (classes `md-h1` to `md-h3`), under the section's `h4`, no larger than body text.
- Three older assertions expected the raw `- Not this.` / `- A note.` / `- A new note.` in the pane (`test/panel-0054.test.mjs`, `test/panel.test.mjs`). AC1 makes those list items, so they now look for the item text.
- Self-check: a list starting `0.` showed as starting at 1, lists nested 2000 deep overflowed the stack, and long runs of unmatched `[`, `*`, `**` or `_` took seconds; fixed with `start` kept as written, nesting capped at 16 levels, closer searches remembered per call and code spans found once, with a test for each.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
