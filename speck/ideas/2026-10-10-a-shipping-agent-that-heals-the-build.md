# A shipping agent that heals the build

Captured: 2026-10-10 · Status: idea

## What
A third agent in the pipeline, separate from the builder and reviewer, owns everything from "approved" to "shipped". Builds run in parallel, but the shipping agent ships one ticket at a time, in order. It handles merges, conflicts, catch-ups and a broken `main` itself, and only asks the user when a real decision is needed. "Like a self-healing build process."

## Why
A failed build, merge or ship is jarring for a non-technical user. On 2026-10-10, a broken `main`, two builds fixing the same test, a re-review that hit the round limit and approved tickets that couldn't ship all needed someone technical to step in. None of them needed a product decision.

## Notes
- Its own agent in config, with its model configurable (like `reviewer_model`).
- Builders stop at approved. With `auto_ship` on, the shipping agent ships what the reviewer approved; with it off, `/speck-ship` adds the ticket to its queue.
- Conflicts, in three classes: handled with no extra review (a clean merge, the same change on both sides, separate lines added to the same list or table, lockfiles or generated files rebuilt with the project's tools; tests must pass); handled and then checked by the reviewer (anything that edits logic: a merge-only round that doesn't count towards `max_review_rounds`); or brought to the user (tickets that contradict each other, or a resolution the reviewer keeps rejecting).
- Keeps `main` healthy: checks the tests on `main` as well as on the branch before each ship. If `main` is broken, it holds the queue, says so once in plain words, and creates one fix ticket. It never patches `main` inside another ticket.
- Fix tickets are their own type (like `bug`) and come in at P0, ahead of everything. Priorities today run 1 to 5, so P0 is new.
- `auto_fix_main`, off by default: when on, the shipping agent may set its fix ticket ready itself; when off, the user does (Gate 1).
- The CLI provides the facts (the kind of conflict, whether a test fails on `main` or only on the branch); the agent provides the judgement.
- The user hears only decisions, as product questions. Everything else shows in the panel as progress: "In the ship queue", "Catching up with main", "Shipped".
- Replaces `speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`, and builds on 0048 (resolving a ship conflict) and the "What went wrong?" and "Answer this" handoffs in `speck/ideas/2026-10-10-hand-off-to-a-claude-conversation-from-the-panel.md`.
- Wanted before the first public release (0.2.0).
- Open: should agents of the same model family be allowed as builder and shipping agent? Its logic edits are reviewed by the reviewer either way.
