---
id: "0042"
title: "Set a draft ticket to ready from the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T14:00:42.783Z"

---
# 0042 · Set a draft ticket to ready from the panel

**Status:** 🔨 building

## Problem
Gate 1 now happens in the panel, but setting a ticket to ready still means leaving it for a terminal, running `speck set <id> status ready` and committing the ticket. That breaks the flow from reading a ticket to approving it.

## Outcome
An open draft ticket in the panel has a Set ready button that approves it and commits the ticket, with the same lint gate as the CLI, and nothing but the panel itself can use it.

## Acceptance criteria
1. An open draft ticket in Shaping has a Set ready button. The button is disabled, with hover text saying why, while the ticket has lint errors.
2. Clicking it sets the ticket to `ready` exactly as `speck set <id> status ready` does, then commits only that ticket's file as `speck(<id>): ready`. Any other changes in the checkout, staged or not, stay as they were. By the next refresh the ticket has left Shaping and shows in the queue.
3. When the server refuses, the ticket stays a draft, nothing is committed, and the panel shows the reason under the button. It refuses a ticket that fails lint (giving the same messages as `speck lint`), a ticket that isn't a draft, an id with no ticket, and a checkout that isn't on `base_branch`.
4. The server accepts the request only with an `Origin` of `http://127.0.0.1:<port>` or `http://localhost:<port>` and a token it generates afresh each time it starts and puts into the page it serves. A missing or wrong `Origin` or token gets 403 and changes nothing. The `Host` check still applies, every other non-`GET` request still gets 405, and the `GET` routes are unchanged.
5. `speck/product.md` says the panel can now do this one write and nothing else, and describes the protection in criterion 4.

## Out of scope
- Any other write from the panel, such as editing, cancelling or reordering tickets.
- Starting the build (0043).
- A login, or reaching the panel from another machine.

## Notes
- Risk is high: this adds a write to a local server with no login. A `Host` check alone doesn't stop a web page in your browser from posting a form to `127.0.0.1`, hence the `Origin` check and token.
- `speck start` refuses a ticket with uncommitted changes, which is why the button commits the ticket.
- Builds after 0041, which changes the same page.
- Checked 2026-10-09: browsers send an `Origin` header on cross-site form posts and `fetch` POSTs (Fetch standard).
- Self-check: a token header with non-ASCII characters made the byte comparison throw and crashed the server, so tokens are now compared as bytes (test added). A failed commit left the ticket staged; it's now unstaged with `git reset` (test added). If the ticket file already had staged changes before the click and the commit fails, those are unstaged too. Also checked: duplicate `Origin` or token headers (joined by Node, so refused), ids that aren't 1–4 digits (405), and that clicking the button doesn't toggle the row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
