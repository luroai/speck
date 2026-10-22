---
id: "0379"
title: "Keep a pop-up's Close button in view"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-keep-the-document-pop-up-s-close-button-in-view.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.411Z"

---
# 0379 · Keep a pop-up's Close button in view

**Status:** 🔨 building

## Problem
A long document's pop-up scrolls its path and Close button away with the document. On a phone there is no Escape key, so closing it means scrolling back to the top. The Settings pop-up and the Foreman's pop-up are the same kind of window.

## Outcome
The path and Close button stay at the top of a document pop-up, and Close stays at the top of the Settings and Foreman pop-ups, while the rest scrolls.

## Acceptance criteria
1. In a document task's pop-up, the file's path and Close stay in view at the top while the document scrolls, at every width, in both looks. Scrolling the document to its end on a 390 px wide window leaves Close visible, and pressing it still closes the pop-up.
2. The Settings pop-up from 0368 keeps its heading and Close in view at the top while the settings scroll. The Foreman's pop-up keeps its Close in view at the top while its detail scrolls. Pressing Close still closes each one.
3. Ship and Ask for changes stay with the document, and scroll with it, as they do today.
4. Escape still closes each pop-up. Nothing behind an open pop-up can be clicked, scrolled or reached with Tab, as today.
5. No test that passed before this change fails, except a check that Close scrolls with the document, which is changed to check criterion 1.

## Out of scope
- Pinning Ship and Ask for changes. They stay with the document.
- What the pop-ups show, apart from what stays in view.

## Notes
- Checked 2026-10-22: `#doc-view` and `#foreman` in `templates/panel.html` are the scrolling window (`overflow-y: auto`), and the path and Close sit inside it (0362, 0366). 0363 puts Ship and Ask for changes in that same scroll. 0368 turns Settings into a pop-up of this look.
- The Foreman's pop-up is included: it is the same window as the document's, so leaving its Close to scroll away would keep the phone problem on one of the three.
- Waits for 0375, which waits for 0368, so the Settings pop-up exists when this is built. It changes `templates/panel.html`.
- Failing before this build: none
- Self-check: a setting's explanation opening above a row just under the Settings pop-up's held top line would have gone under that line, so it now goes below its row there (test added). The pop-ups' own top padding moved into the top line, in their existing rules, so no second rule changes their size (0362's check).
- AC5: no existing test checked that Close scrolls with the document, so none needed changing.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
