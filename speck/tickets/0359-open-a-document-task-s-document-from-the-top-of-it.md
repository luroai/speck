---
id: "0359"
title: "Open a document task's document from the top of its review pack"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0359 · Open a document task's document from the top of its review pack

**Status:** 📝 draft

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
- Unverified: how cptr's built-in browser opens links (seen by the user on 2026-10-21, not checked in cptr). Cursor's built-in browser may do the same; a button with no address avoids it in either.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
