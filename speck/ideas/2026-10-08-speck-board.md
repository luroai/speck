# speck board

Captured: 8 October 2026 · Status: idea (separate project, after speck v0.1)

A local kanban app over a repo's `speck/` folder, for managing ideas and tickets visually instead of in chat.

- Columns map to ticket status: Ideas, Draft, Ready for Dev, Building, Reviewing, Blocked, Done.
- Cards are ticket files. Editing a card edits the file, so there's no separate database.
- Set priority, size, risk, builder and reviewer on the card.
- Turning an idea card into a ticket runs `/speck-ticket`.
- **Dragging a card to Ready for Dev is Gate 1.** It joins the build queue (see below), so it builds when it reaches the front.
- The Blocked column shows the agent's question and lets you answer it inline.
- Each card shows its review rounds and actuals.
- Merging stays in GitHub. The board never approves or merges.

## Decided (8 October 2026)
- **Web app, not a TUI.** `speck board` starts a zero-dependency `node:http` server serving one plain HTML/JS page. Native browser drag and drop; file watching pushes live updates to the page via server-sent events.
- **Remote access by domain.** Runs on a headless box behind a Cloudflare Tunnel on a private domain, reachable from any browser. Tailscale works as a private fallback.
- Cloudflare Access (allow only the user's email) in front of the tunnel is required, since the board can start agents. The server also checks its own token and optionally the `Cf-Access-Jwt-Assertion` header.
- Server binds to `127.0.0.1` and checks the `Host` header against a configurable allow-list that includes the tunnel domain.
- Server-sent events need a heartbeat (around every 30 seconds) and the page reconnects automatically, because Cloudflare drops idle connections.
- Builds run on the box, not in the browser's request, so closing the tab never stops a build.
- Saving a card fails if the file changed since it was loaded, in case an agent wrote to it meanwhile.
- The board can never set `approved` or `done`.

- **One board per repo.** Each repo runs its own board; no multi-repo view.

## Borrowed from Cline Kanban (github.com/cline/kanban)
- Show the agent's latest message or tool call on Building and Reviewing cards, via agent hooks.
- A diff view in the card, beside the review rounds, to help decide whether to run `/speck-ship`.
- A passcode by default when the board is exposed, alongside Cloudflare Access.
- Keep: state in the repo's ticket files, the human gates, and agents' normal permission checks. Chains move forward when you ship, not when an agent finishes.

## Build queue and WIP limit (decided 8 October 2026)
- Ready for Dev is a queue. When nothing is in progress, the next eligible `ready` ticket starts building, ordered by priority then ticket number.
- `wip_limit` in `config.yml`, default 1, counts building and reviewing tickets. One agent at a time.
- Tickets can declare `depends_on: [<id>]`. A ticket is only eligible once everything it depends on is `done` (shipped), so no build sits on unshipped work.
- `approved` tickets don't count as WIP, but a cap (for example 3 approved or blocked) pauses the queue until you ship or answer.
- Blocked tickets are skipped; the queue moves to the next independent ticket.
- The board server runs the queue. Without the board, `/speck-next` builds the next eligible ticket.
- A maximum number of builds per day or run, so an overnight queue can't burn through tokens.
- **Worktrees rejected for now.** One ticket at a time in one checkout. Worktrees would only earn their place for parallel builds, which go against low WIP, and they need extra setup for gitignored files like `.env` and `node_modules`.
