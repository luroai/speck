---
id: "0172"
title: "Give the shipping stage its own badge loop"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0196"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T12:34:06.153Z"

---
# 0172 · Give the shipping stage its own badge loop

**Status:** 🔍 reviewing

## Problem
While a ticket ships, the builder badge plays the same laptop loop as writing code, or stands still once the build has ended (builds end at approved since 0194), so the user can't tell from the badge that the work is finished and on its way out.

## Outcome
The badge has a shipping loop of its own: the builder pushes the finished block off on a little paper boat.

## Acceptance criteria
1. While a ticket is shipping (by hand, by auto-ship or by `speck run`'s ship queue), its badge plays the shipping loop and not the laptop loop, whether or not its build is still running, and the badge's accessible name stays "The builder is shipping". Writing code still plays the laptop loop.
2. In each loop of about 3 seconds, a finished block with a green tick on it sits on a small paper boat in front of the builder, on a thin line of water. The builder pushes the boat with both arms, and the boat, with the block on it, slides off to the right and out of the tile. A new boat with a ticked block then appears for the next loop.
3. The block is drawn in the same style as the laptop loop's finished block, and the tick in the panel's green (`--ok`). The boat is a simple folded-paper shape in the badge's line style, in light and dark mode. Nothing is clipped by the tile's edge except the boat and block as they leave on the right.
4. With `prefers-reduced-motion: reduce`, the badge shows a still frame of the builder with both hands on the boat carrying the ticked block, and nothing moves.
5. No test that passed before this change fails.

## Out of scope
- The card's border colour while shipping (0171).
- The other stages' loops (0168, 0169).

## Notes
- Asked for 2026-10-14. Changed 2026-10-15: "Can we just have the builder pushing the box with a green tick on it off the screen? Maybe with the box being on what looks like a little paper boat?"
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first). It has no shipping state yet: reuse its builder, block and tick drawing code.
- Today shipping shows the `type` pose (`badgeOf` in `templates/panel.html`); the still frames are in `STILL_AT`.
- Failing before this build: none
- Build: the mockup now has two shipping styles ("Push it off" and "Set sail"); this follows the sail style's boat on the water, with the boat redrawn as a folded-paper shape and short straight arms added to the builder, as in the mockup.
- Build: shipping and waiting to ship had the laptop pose, so the tests from 0156, 0168, 0169 and 0196 that said so now expect the shipping pose. 0168's in-browser edge test leaves out the shipping pose, whose boat leaves past the edge on purpose; 0172's own tests check its edge instead.
- Self-check: the comment above `badgeOf` now names the shipping loop; no other changes.
- Builds after 0196, which makes the panel show a ticket as shipping from its approval until it ships, whether or not its build is running.

## In plain words
While a ticket is shipping, or approved and waiting for auto-ship to ship it, the little builder on its card no longer types at a laptop. Instead it pushes a paper boat carrying a finished block with a green tick off to the right, and a new boat pops up every few seconds. Writing code still shows the laptop. To see it, open the panel while a ticket ships. With reduced motion turned on, the badge holds still, with the builder's hands on the boat. Worth a look: the boat is small at this size, so check that it reads as a boat in both light and dark mode.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Skipped: the 0128 AC4 test failed once by chance in this build's full run and passed on its retry; it duplicates `speck/ideas/2026-10-15-fix-the-0128-ac4-test-that-fails-by-chance.md`.
- No new ideas went to the inbox.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0f32d4590a7ca04819062332d076a2bbea8c32ed",
    "thread_id": "01a13fa4-d3e5-7d30-85b5-d096fca5c924",
    "seconds": 32,
    "usage": {
      "input_tokens": 157556,
      "cached_input_tokens": 110080,
      "cache_write_input_tokens": 0,
      "output_tokens": 741,
      "reasoning_output_tokens": 44
    },
    "saved_at": "2026-10-15T12:59:20.367Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: badgeOf selects ship for shipping and type for writing code. The passing 0172 AC1 test covers manual shipping with a running or ended build, the ship queue and auto-ship waiting; active shipping retains the required accessible name."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: POSES.ship implements a repeating 3.2-second push and glide. Both passing 0172 AC2 tests exercise the water, boat, ticked block, two hands, rightward departure and replacement boat."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "POSES.ship reuses box and tick, with C.ok, C.paper and C.ink supplied by panel theme tokens. Passing 0172 AC3 tests check drawing style and bounds, including real-browser clipping. The existing light/dark layout tests include the shipping badge."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "STILL_AT.ship selects 1100 ms; paintBadge uses that fixed time with reduced motion. The passing 0172 AC4 test checks both hands and the ticked block; the existing 0168 browser motion test includes shipping and verifies unchanged frames under reduced motion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0172-tests.txt: 1823 tests, 1820 passed, zero failed and three skipped. Existing test changes update shipping expectations and replace its general clipping check with dedicated coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipping now has its own paper-boat animation, while coding keeps the laptop loop. Reduced motion shows the builder holding the ticked block on the boat. The tests pass, and I found no blocking issues or unrelated changes."
  }
}
```

</details>
