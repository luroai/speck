# Ship approved tickets locally, without a pull request

Captured: 2026-10-08 · Status: ticketed (0006)

## What
Automate everything from "ticket is ready" to "reviewer approved" with no GitHub PR. The approved branch waits locally, and `/speck-ship <id>` is the human gate: it merges the branch, pushes and tidies up.

## Why
speck's niche is solo builders who want to build things beyond a single prompt. For them a GitHub PR is mostly a place to click Merge, and it brings `gh`, branch protection and the self-approval problem with it. The ticket, the review rounds and `product.md` in the repo already hold everything the PR carried.

## Notes
- The human gate stays: agents never run ship themselves; running `/speck-ship` is the approval.
- New status `approved` between `reviewing` and `done`, so the board can show what's waiting.
- The PR flow must come back later as an option (see 2026-10-08-pr-ship-mode.md).
