# speck control panel (was: speck board)

Captured: 8 October 2026 · Reframed: 9 October 2026 · Status: ticketed (0030, 0031, 0033, 0034, 0035, 0039, 0040, 0041, 0042, 0043, 0044, 0050, 0051, 0052, 0053)

A local control panel over a repo's `speck/` folder. It isn't a kanban board. Everything between Ready and shipped is an agent pipeline that runs in minutes, so there's no work passing between people to track in columns. The panel is a CI pipeline whose trigger is a ticket being set to `ready`, with a space around the two places that need a human: shaping work before Gate 1, and answering the pipeline when it asks.

## Why not a kanban board
- Kanban columns show who holds what and where work piles up between people. In speck, people only touch both ends.
- Building, Reviewing and Approved are machine stages. With `auto_ship` on, nobody acts on Approved either. Columns for them would mostly show machines moving cards along.
- Nobody should ever drag a card into Building or Reviewing, so drag between columns goes.

## Where the human's attention goes
1. **Shaping, before Ready.** Ideas into tickets, tightening acceptance criteria, deciding what's worth doing. This is now the real work, and Gate 1 is the most important decision.
2. **The queue.** What runs next.
3. **Exceptions.** When the pipeline needs you: blocked questions, escalated review loops, approved tickets that `auto_ship` doesn't cover.

Everything else is information.

## Screen
Shaping and Queue are the two main areas, side by side, with Shipped as a compact table underneath. Dark grey, thin borders, square corners. A mockup is in `mockups/speck-panel/` (gitignored, local only).

- **Shaping:** ideas and draft tickets, with readiness hints: lint result, open questions, overlaps, and tickets that touch the same files. One ticket can be opened to show its outcome, acceptance criteria and readiness checklist, which is what you need in front of you at Gate 1.
- **Queue:** the whole pipeline, top to bottom:
  - **Needs you:** blocked tickets with their question, escalations, and approved tickets waiting on `/speck-ship`. Usually empty, and empty is the goal.
  - **Running:** every ticket being built, each in its own worktree (0029), shown like a CI run: build → self-check → review round 1, 2… → approve → ship. The review findings and the agent's latest message or tool call are its logs.
  - **Up next:** `ready` tickets in run order. A ticket waiting on an unfinished `after:` ticket is marked, for example "waiting on 0017".
- **Shipped:** a changelog of the latest tickets with actuals (time, review rounds, tokens) and a few medians, which is also the proof data the brief asks for.

## Where the CI analogy doesn't hold
- **CI never asks questions. This pipeline does.** Blocked tickets and escalations make it a pipeline with an inbox, so Needs you sits at the top of the queue.
- **Answering is not chatting.** Answering a blocked question writes to the ticket and resumes the build: the ticket is the conversation, which keeps the repo the source of truth. Talking to an agent mid-run means plugging into live agent sessions. That's a separate, much later idea.
- **The queue needs a total order.** `priority: 1–5` has ties, and `after:` only covers dependencies. One rank per ticket (for example an `order` field in the frontmatter) gives the run order, survives restarts and works without the panel.

## Stages
1. **Read-only.** Every area is a view over the ticket files, so version 1 needs no writes. Built on a JSON form of `speck status` that already includes tickets in other worktrees (0029).
2. **Writes, in this order:** set a ticket to `ready` (Gate 1), reorder the queue, answer a blocked question.
3. **Later:** the panel runs the queue itself (see below), a diff view beside the review rounds, live agent activity via agent hooks (seeing a running build's log, from the file `speck run` already writes, is ticketed as 0051 and 0052).

## Kept from the board decisions (8 October 2026)
- **Web app, not a TUI.** A zero-dependency `node:http` server serving one plain HTML/JS page. Version 1 can poll for updates. Server-sent events come later, with a heartbeat around every 30 seconds and automatic reconnects, because Cloudflare drops idle connections.
- **Local first.** The server binds to `127.0.0.1` and checks the `Host` header against an allow-list. Read-only, it can be reached privately over Tailscale.
- **Before the panel can write or start agents:** a Cloudflare Tunnel on a private domain with Cloudflare Access (only the user's email) in front, the server's own token or passcode, and optionally the `Cf-Access-Jwt-Assertion` header.
- Builds run on the box, not in the browser's request, so closing the tab never stops a build.
- A save fails if the file changed since it was loaded, in case an agent wrote to it meanwhile.
- The panel can never set `approved` or `done`, and it never merges or ships. Shipping stays with `/speck-ship`, or `auto_ship`.
- **One panel per repo.** No multi-repo view.
- Keep from Cline Kanban (github.com/cline/kanban): state in the repo's ticket files, the human gates, and agents' normal permission checks. Chains move forward when you ship, not when an agent finishes.

## Build queue (decided 8 October 2026)
- **Builds run in parallel (decided 9 October 2026).** Every eligible `ready` ticket starts building, from the top of the queue, each in its own worktree. There's no WIP limit: running in parallel turned out much faster.
- Two tickets that touch the same files don't run at the same time, because the second would conflict when it ships and `speck ship` refuses rather than rebasing. The later one waits until the earlier one ships.
- A ticket is only eligible once every ticket in its `after:` list is `done` (shipped), so no build sits on unshipped work.
- A cap on tickets waiting for you (for example 3 approved or blocked) pauses the queue until you ship or answer.
- Blocked tickets are skipped, and the queue moves to the next independent ticket.
- The panel server runs the queue. Without the panel, `/speck-next` builds the next eligible ticket.
- **Worktrees: adopted for isolation (ticket 0028, 9 October 2026).** First rejected because they only seemed worth it for parallel builds. They came back for a different reason: several sessions sharing one checkout kept colliding (branch switches under another session, files swept into the wrong commit). Each build now gets its own worktree. Worktrees then made parallel builds possible, which is now the plan (see above). `worktree_setup` covers gitignored files like `.env` and `node_modules`.

## Open questions
- **Inside the speck CLI or a separate project?** Inside (for example `speck panel`) reuses the frontmatter and review-round parsers with no duplication, but `docs/brief.md` lists the board as a later, separate project and out of scope for v0.1.
- **Name:** `speck panel`, `speck watch` or something else.
- **Order field:** a new `order` field, or reuse `priority` with ties broken by id.
