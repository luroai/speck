# Agent guide

1. Read `speck/product.md` first to understand what speck is and its current state.
2. Read `docs/brief.md` for the full design: workflow, ticket size rules and the review loop protocol.
3. Work only from a `ready` ticket in `speck/tickets/`. If no ticket exists for the change, create one or ask.
4. Keep changes within the ticket's size limits (`speck/config.yml`). If the work is bigger, stop and propose a split.
5. Never merge or ship unless the user runs `/speck-ship`. Never approve your own work. Review is done by the configured reviewer.

Use British English in docs.

## speck

This repo uses speck. Read `speck/product.md` first: it describes what the product is today. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship`.
