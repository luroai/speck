---
id: "0052"
title: "Show a build's log growing as it runs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0051"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:33:06.309Z"

---
# 0052 · Show a build's log growing as it runs

**Status:** 🔨 building

## Problem
An open log is a snapshot from the moment the ticket was opened: the ticket file changes only at a status or a review round, so the 2-second state refresh leaves the log standing still while the build prints. Reloading the page is the only way to see the newest lines, and a build's most useful output is always its last few lines.

## Outcome
An open log keeps up with the build by itself: the newest lines slide in at the bottom and older ones move up out of view, with the reader free to scroll back through what's been shown.

## Acceptance criteria
1. While a queue ticket is open, the panel asks for its log once a second, on its own timer, separate from the 2-second state poll, and stops asking as soon as the ticket is closed. A ticket that has never been opened is never asked for.
2. The open log shows only the newest lines (the 200-line tail 0051's endpoint returns), in a box with a fixed height and its own scrollbar. The box never grows, however long the build runs: as new lines arrive they appear at the bottom and the oldest lines in the box move up out of it.
3. With the box at the bottom, it stays pinned to the bottom on every update, so the newest line is always in view: the log appears to scroll itself. After the reader scrolls up, the box stays where they left it and any text they selected there stays selected; scrolling back down to the bottom makes it follow again.
4. A request that fails (the server is down) leaves the log on screen as it was and changes nothing else, and the next successful response shows the new text.
5. A log replaced by a new build of the same ticket (a shorter file) shows the new log with no lines left over from the old one, with the box at the bottom.

## Out of scope
- Stopping the requests once a build has ended, or any other guess at when to stop.
- Faster than once a second, and pushing lines over a stream rather than asking for them.
- Keeping older lines, searching them, or letting the history outgrow the box.
- The red row's 50-line exit message for a build that has exited (0045).

## Notes
- After 0051, which adds the endpoint and the open row (fixed height, own scrollbar, and the "earlier lines aren't shown" line when the file is longer than the tail).
- Checked 2026-10-09: the log is replaced, not appended, at each launch of a build for that ticket, so a second build shows a shorter file (`fs.openSync(log, 'w')` in `scripts/speck.mjs`).
- The page already replaces text in place, character by character, so a selection survives an update (`setText`, 0050). Reuse it rather than rebuilding the log block.
- "At the bottom" is judged with a small tolerance in pixels, because a scroll box's `scrollTop` rarely lands exactly on `scrollHeight - clientHeight`.
- The update re-pins by setting `scrollTop`, with no smooth animation. A short smooth scroll is the alternative if the jump looks harsh; the user hasn't asked for one.
- Fetching the whole tail again each second is a small local request, and keeps the endpoint stateless: no byte offsets, no `Range` header.
- The log's own timer and box update must be kept out of `render()`, so a state refresh doesn't restart or duplicate it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
