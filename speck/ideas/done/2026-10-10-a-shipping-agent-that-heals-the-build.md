# A shipping agent that heals the build

Captured: 2026-10-10 · Status: ticketed (0094, 0097, 0098, 0099, 0100, 0101, 0102, 0103, 0104, 0105)

## What
A third agent in the pipeline, separate from the builder and reviewer, owns everything from "approved" to "shipped". Builds run in parallel, but the shipping agent ships one ticket at a time, in order. It handles merges, conflicts, catch-ups and a broken `main` itself, and only asks the user when a real decision is needed. "Like a self-healing build process."

## Why
A failed build, merge or ship is jarring for a non-technical user. On 2026-10-10, a broken `main`, two builds fixing the same test, a re-review that hit the round limit and approved tickets that couldn't ship all needed someone technical to step in. None of them needed a product decision.

## Notes
- Decided: an independent agent, which may be the same model family as the builder (its logic edits are reviewed anyway). Its model is set in config like `reviewer_model`; default a Sonnet-class model, with Haiku-class fine where conflicts are rare.
- Decided: two skills. `/speck-ship` stays the user's gate (only the user can start it) and adds the ticket to the ship queue instead of merging. A new `speck-integrate` skill is the shipping agent's procedure, started only by the pipeline. Builders stop at approved: `speck ship --auto` leaves the build skill.
- Decided: `speck run` gets one ship lane beside its parallel build slots. Order: fix tickets first, then the order tickets were approved. Eligible: covered by `auto_ship`, or sent with `/speck-ship`. For the ticket at the front it runs `speck ship <id>`; a clean ship needs no agent. A recoverable failure (a conflict, a branch behind `main`, tests failing only after catching up) starts the shipping agent with a `ship_command` (like `build_command`) and waits for it. A ticket needing a decision is set aside with its question and the queue moves on; a broken `main` holds the queue.
- Decided: the queue is its own command (for example `speck ship-queue`), which ships every eligible ticket in order and exits. `speck run`'s ship lane calls it continually; without `speck run`, `/speck-ship <id>` (after marking the ticket) and the end of `/speck-build` (when `auto_ship` covers it) call it. A ship lock means only one runs at a time: a second call adds its ticket and exits. The fix ticket's own ship restarts a held queue. "The user said ship this" is a local marker in `speck/.cache/`, not a commit.
- Decided: a chained ticket waits until everything in its `after:` has shipped (`done`), not just been approved. `speck run` already does this; `speck start` must refuse too, naming what it's still waiting for, since today it only checks the ticket is ready.
- Conflicts, in three classes: handled with no extra review (a clean merge, the same change on both sides, separate lines added to the same list or table, lockfiles or generated files rebuilt with the project's tools; tests must pass); handled, then checked by the reviewer (any logic edit: a merge-only round that doesn't count towards `max_review_rounds`); or brought to the user (tickets that contradict each other, or a resolution the reviewer keeps rejecting).
- Keeps `main` healthy: checks the tests on `main` as well as on the branch before each ship. If `main` is broken, it holds the queue, says so once in plain words, and creates one fix ticket. It never patches `main` inside another ticket.
- Decided: fix tickets are their own type (like `bug`) and come in at P0, ahead of everything (priorities run 1 to 5 today, so P0 is new). `auto_fix_main`, off by default, lets the shipping agent set its fix ticket ready itself; otherwise the user does (Gate 1).
- The CLI provides the facts (the kind of conflict, whether a test fails on `main` or only on the branch); the agent provides the judgement.
- The user hears only decisions, as product questions. Everything else shows in the panel as progress: "In the ship queue", "Catching up with main", "Shipped".
- Replaces `speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`, and builds on 0048 and the handoffs in `speck/ideas/2026-10-10-hand-off-to-a-claude-conversation-from-the-panel.md`. Pairs with `speck/ideas/2026-10-10-keep-builders-to-their-own-ticket.md`.
- `main` already says 0.2.0 (0092). If this goes in first, hold the `v0.2.0` tag and add it to the changelog; otherwise it's 0.3.0.
- Later, not first: a stronger model only for logic conflicts.
