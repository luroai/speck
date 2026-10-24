---
id: "0470"
title: "Title the Pipeline pop-up Pipeline log in dot-matrix letters"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0469"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0470 · Title the Pipeline pop-up Pipeline log in dot-matrix letters

**Status:** 📝 draft

## Problem
Pressing speck's screen opens a pop-up titled `Pipeline` in small monospace text, with a separate `Log` heading on the line under it. Since 0458 the log is all it shows, so the two headings split one name over two lines, and the small title doesn't match speck's header.

## Outcome
The pop-up has one title, `Pipeline log`, on its top row, in the same dot-matrix lettering as the word "speck" in the header.

## Acceptance criteria
1. The pop-up's top row reads `Pipeline log`, beside Close, and there's no `Log` heading under it: the log box starts straight under the top row. Its dialog's accessible name is `Pipeline log`.
2. The title is in the dot-matrix font and weight the header's "speck" uses (Doto), at least 18 px, on one line beside Close at every width from 320 px, checked in a real browser in both looks.
3. Close, Escape, a click outside and the focus work as before (0415), and the top row still stays in view while the log scrolls. No test that passed before this change fails.

## Out of scope
- The log box and its lines (0459, 0460).
- The titles of the other pop-ups.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot: "The title should read pipeline log … put them all on the top line … make the title a little bit bigger, maybe even like in the same dot matrix style text as the speck title."
- Today: `renderForeman` in `templates/panel.js` draws the top as `Pipeline` and Close, and the log section's `Log` heading. `#foreman .top .title` in `templates/panel.css` sets the title in the monospace font at 12 px. The header's word is `.bezel .name`, in `Doto` at weight 900.
- Waits for 0469, the last queued ticket that changes `templates/panel.css`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
