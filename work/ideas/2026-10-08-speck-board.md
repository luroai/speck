# speck board

Captured: 8 October 2026 · Status: idea (separate project, after speck v0.1)

A local kanban app over a repo's `work/` folder, for managing ideas and tickets visually instead of in chat.

- Columns map to ticket status: Ideas, Draft, Ready for Dev, Building, Reviewing, Blocked, Done.
- Cards are ticket files. Editing a card edits the file, so there's no separate database.
- Set priority, size, risk, builder and reviewer on the card.
- Turning an idea card into a ticket runs `/speck:ticket`.
- **Dragging a card to Ready for Dev is Gate 1** and starts `/speck:build`.
- The Blocked column shows the agent's question and lets you answer it inline.
- Each card shows its review rounds and actuals.
- Merging stays in GitHub. The board never approves or merges.

Open questions: whether it's a web app or a TUI; which machine runs builds (local or headless); whether it watches several repos.
