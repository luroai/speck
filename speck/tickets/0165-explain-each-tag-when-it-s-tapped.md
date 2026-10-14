---
id: "0165"
title: "Explain each tag when it's tapped"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0161"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T18:10:45.412Z"

---
# 0165 · Explain each tag when it's tapped

**Status:** 🔨 building

## Problem
On a draft ticket the priority tag opens the priority menu, so on a phone it needs a 44 px tap area, which makes it look bigger and spaced differently from the size, risk and type tags beside it. The other tags can't be tapped at all, and their short codes (P3, M, low, fix) don't explain themselves to someone new to speck.

## Outcome
Every tag looks the same size and can be tapped: the priority tag on a draft still opens its menu, and every other tag shows a short explanation of what it means.

## Acceptance criteria
1. All tags (priority, size, risk, bug and fix), wherever they appear (Plan, the Build queue and the full ticket pane), have the same visible size, and every one has a tap area at least 44 × 44 px at viewports under 700 px, extended invisibly so the visible boxes stay equal and evenly spaced.
2. Tapping, clicking or pressing Enter or Space on a tag that doesn't open a menu shows a small tip next to it, saying what it means: priority ("Priority 3: built after P0 to P2 tickets"), size ("S: a small, contained change" or "M: several files or one new component"), risk ("Low risk: ships by itself once approved" or "High risk: waits for you to ship it", following `auto_ship` and `auto_ship_risk` in `speck/config.yml`), "Bug: fixes a defect" and "Fix: fixes a broken main, built before anything else". With a mouse, the tip also shows on hover.
3. Only one tip is open at a time. It closes when the user taps or clicks anywhere else, presses Escape or scrolls, and it never opens or closes the ticket it belongs to. It stays on screen at a viewport 375 px wide.
4. On a draft in Plan, the priority tag still opens the priority menu, as today, instead of a tip. Elsewhere it shows its tip.
5. Each tag is announced by screen readers with its meaning (for example "Size M: several files or one new component"), and no test that passed before this change fails.

## Out of scope
- What the tags' values are or how they're set.
- Tag colours and text size (0161).

## Notes
- Builds after 0161, which sets the tags' size and colours.
- Tags are built by `tags()` and `typeTag()` in `templates/panel.html`; the priority menu is `priorityPicker()`. The 44 px tap area on the priority tag alone comes from 0140's `.tag.pick` rule.
- The size wording follows `/speck-ticket`'s size rules.
- Failing before this build: none
- The risk tip uses each ticket's `auto_ship` from `speck status --json` (0167), which follows `auto_ship` and `auto_ship_risk`. A board-wide field would have broken 0030, 0031 and 0044, which pin the top-level keys and require `/api/state` to match `status --json`.
- Older tests that pinned tags as unclickable, which AC2 and AC3 change on purpose, now expect the tip instead, as 0039 already did for 0077: 0039 AC1 skips tags (as it skips the priority tag), 0051 AC2 checks a tag's click goes no further, 0077 AC1 and 0143 AC4 press the tag and check it opens no menu. 0161 AC4 presses Tab up to 60 times instead of 25, since each tag is now a Tab stop. Nothing else in them changed.
- 0128 AC3 and 0148 AC2 (speck run timing, draft fix ticket 0173) fail now and then in a full run and pass alone. This build doesn't touch them.
- Self-check: the Plan priority tag's pointer was overridden by the new help pointer; it now applies only to tags that show a tip, with a test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
