# Agent guide

1. Read `docs/brief.md` for the full design: workflow, ticket size rules and the review loop protocol. The code, the tickets and the tests are the record of what speck does today.
2. Work only from a `ready` ticket in `speck/tickets/`. If no ticket exists for the change, create one or ask.
3. Keep changes within the ticket's size limits (`speck/config.yml`). If the work is bigger, stop and propose a split.
4. Never merge or ship unless the user runs `/speck-ship`, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it. Never approve your own work. Review is done by the configured reviewer.

Use British English in docs.

## speck

This repo uses speck. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship`, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it.
