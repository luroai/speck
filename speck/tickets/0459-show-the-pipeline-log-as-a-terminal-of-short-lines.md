---
id: "0459"
title: "Show the pipeline log as a terminal of short lines"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0457", "0458"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0459 · Show the pipeline log as a terminal of short lines

**Status:** 📝 draft

## Problem
The Pipeline pop-up's Log section lists speck run's raw lines, newest first, on the page's own background. Many are long sentences with session ids and file paths, so it doesn't read as a log of what the pipeline is doing.

## Outcome
The Log section is a small terminal that streams what happens in the pipeline, one short line at a time.

## Acceptance criteria
1. The Log section is a box with the same black background, light text colours and four-sided border as a ticket's build log after 0455, in both looks.
2. Each line of `run.log` shows as one summary of at most 48 characters, starting with the ticket's id when it names one. These kinds show as: `Launched <id> …` as `<id> build started`; `<id> build exited with code 0.` as `<id> build finished`; any other exit code as `<id> build failed (code <n>)`; `Shipping <id>: …` as `<id> shipping`; `Shipped <id>.` as `<id> shipped`; `<id> didn't ship: …` as `<id> didn't ship`, followed by a short reason if it fits; `Resumed <id> …` as `<id> build resumed`; `<id> build … stopped.` as `<id> build stopped`. Any other line shows its first sentence, cut to 48 characters with `…`. No summary shows a session id, a process id, a file path or a command.
3. The oldest line is at the top and the newest at the bottom, as in a terminal, still the latest 200 lines. A new line appears within the panel's 2-second refresh, and the box scrolls to show it, unless the reader has scrolled up, in which case they stay where they are.
4. With no `run.log`, the box says speck run hasn't written anything yet. The server still reads only `speck/.cache/runs/run.log` (0415). No test that passed before this change fails.

## Out of scope
- The Right now section above it (0458).
- What speck run writes to `run.log`, and times on each line.

## Notes
- Asked for by the user on 2026-10-24: "the build log is like another terminal looking like thing within that page, which kind of like just streams like the log of things that are happening throughout the pipeline … summaries is fine." A first try, to be tuned once it's been used.
- Today: `drawRunLog` and `runLogShift` in `templates/panel.js`, styled by `.foreman ol.run-log` in `templates/panel.css` (0415). It shows newest first, and 0415 keeps a scrolled reader's place by shifting the scroll as lines arrive at the top; with newest at the bottom, that logic changes.
- The line forms in criterion 2 are the ones in this repo's `run.log` on 2026-10-24.
- Waits for 0457 (and so 0455, 0454 and 0453): all change `templates/panel.css`, and criterion 1 reuses 0455's look. Waits for 0458: both change `renderForeman` in `templates/panel.js`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
