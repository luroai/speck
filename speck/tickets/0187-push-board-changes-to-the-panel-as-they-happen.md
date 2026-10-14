---
id: "0187"
title: "Push board changes to the panel as they happen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-update-the-panel-in-real-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0177"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T22:06:47.011Z"

---
# 0187 · Push board changes to the panel as they happen

**Status:** 🔨 building

## Problem
The panel page asks for the whole board every 2 seconds, whether anything has changed or not. Changes show up as much as 2 seconds late, every open page costs the panel a full reading of the board every 2 seconds, and a slow answer flashes "Disconnected" across the top (0186).

## Outcome
The panel sends each change to every open page as it happens, and pages no longer ask for the board on a timer.

## Acceptance criteria
1. An open page shows a change to the board within 1 second of the file that records it changing, without asking for it. That covers a ticket's status, fields or text, an idea, a build starting, ending, pausing or being stopped, a ship starting or ending, and speck run being turned on or off. A change no file records, such as a build's process ending while speck run is off, shows within 30 seconds.
2. The page no longer asks for the board on a timer. While nothing changes, an open page and the panel exchange only a keep-alive, at least every 30 seconds.
3. However many pages are open, the panel works out the board once per change, and changes in quick succession (for example, a commit that changes ten tickets) reach each page as one update.
4. When the connection drops, for example when the panel restarts on new code, the network blips or a phone wakes from sleep, the page reconnects by itself and shows the current board at once. "Disconnected" shows only if it can't reconnect within 10 seconds.
5. No test that passed before this change fails, except checks that the page polls `/api/state` every 2 seconds (`test/panel-0059.test.mjs`, AC4), which change to check criterion 2.

## Out of scope
- Sending only what changed rather than the whole board (0188).
- An open build log (0189).
- Making the full board smaller (0178).

## Notes
- Server-Sent Events (`EventSource` in the page, a `text/event-stream` answer from the panel) fit: one-way, reconnecting by themselves, plain HTTP, and no dependency.
- Over plain HTTP/1.1, as at `127.0.0.1`, a browser keeps only about six connections open per address, so each page should hold one stream, and 0189's log updates should share it.
- The panel server already watches its own code for changes (`codeStamp()` in `scripts/panel.mjs`).
- Checked 2026-10-14: Cloudflare's own docs give a 100-second proxy read timeout (error 524), and say Cloudflare Tunnel buffers proxied answers unless they're `Content-Type: text/event-stream`, which it streams as the data arrives.
- Checked 2026-10-14: Node's docs say `fs.watch` gained `recursive` support on Linux in v19.1.0; it works on the installed Node v22.23.3.
- Builds after 0177 (one shared reading of the board for every request) and 0186.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
