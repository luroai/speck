---
id: "0068"
title: "Remove product.md so the code is the only source of truth"                # one outcome, no "and"
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
after: ["0063"]             # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:42:50.070Z"

---
# 0068 · Remove product.md so the code is the only source of truth

**Status:** 🔨 building

## Problem
`speck/product.md` has grown to about 400 lines that restate in prose what the code already does, and almost every ticket has to edit it. That costs each build and review round time on wording, and because every branch touches the same file, an uncommitted edit to it in the base checkout blocks ships (as it did for 0058).

## Outcome
speck no longer has a living spec. The code, the tickets and the tests are the record of what the product does, and nothing in speck creates, reads, updates or reviews `product.md`.

## Acceptance criteria
1. `speck init` in a repo with no `speck/product.md` doesn't create one, and the speck section it writes to `AGENTS.md` doesn't mention `product.md`. In a repo that already has `speck/product.md`, `speck init` leaves that file byte-for-byte unchanged. `templates/product.md` no longer exists.
2. A reviewer verdict with no `product_md` field passes verdict validation, and `templates/review-verdict.schema.json` doesn't list `product_md`. The reviewer prompt, for round 1 and for later rounds, contains no `product.md` content and asks for no `product.md` check. The review summary has no `product.md` line, and a review round stored before this change, which has a `product_md` field, still shows without an error.
3. No file in `skills/`, `templates/`, `README.md`, `AGENTS.md`, `docs/brief.md` or `docs/HANDOFF.md` mentions `product.md` or a "living spec". The build skill has no step to update a spec, and the capture and ticket skills' overlap checks compare against idea notes and tickets only (in `speck/ideas/`, `speck/ideas/done/`, `speck/tickets/` and `speck/tickets/done/`).
4. `speck/product.md` is deleted from this repo, no test reads it, and `npm test` passes.

## Out of scope
- Rewriting finished tickets, idea notes or review logs that mention `product.md`: they're history.
- Draft tickets 0016 and 0024, which have criteria or notes about `product.md`: the user rewords them separately.
- Deleting `product.md` from other projects that already use speck: `speck init` leaves it there, and those projects can delete it themselves.
- Changing how `speck ship` handles uncommitted edits in the base checkout.

## Notes
- Decision (user, 2026-10-09): the code is the source of truth; remove the living spec rather than trim it.
- Where a skill or doc said to check `product.md` for a product question, point to the ticket and the code instead.
- Tests that only check the wording of `product.md` (0032, 0036 AC5, 0037, 0042 AC5, 0048 AC5) go. Tests that use `speck/product.md` only as a handy tracked file to edit should use another file.
- `after: 0063` because 0063 is still building and edits `product.md`.
- Self-check: no changes. Checked an old round with `product_md` (kept and shown without error), `init --force` over an existing `product.md` (left alone) and a rebuilt round-1 prompt (no `product.md`). One known limit: a ticket already mid-review when speck is updated resends its saved round-1 prompt exactly as it was sent, so that copy can still hold the old `product.md` text.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
