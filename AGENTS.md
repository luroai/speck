# Agent guide

1. Read `docs/brief.md` for the full design: workflow, ticket size rules and the review loop protocol. The code, the tickets and the tests are the record of what speck does today.
2. Work only from a `ready` ticket in `speck/tickets/`. If no ticket exists for the change, create one or ask.
3. Keep changes within the ticket's size limits (`speck/config.yml`). If the work is bigger, stop and propose a split.
4. Never merge or ship unless the user runs `/speck-ship` or clicks the Ship button in an approved ticket's review pack in the panel, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it. Never approve your own work. Review is done by the configured reviewer.

Use British English in docs.

## Quick tests

Test each criterion the quickest way that really checks it. Quick: the fake page from `fakePage()` in `test/support/panel.mjs` for the panel's page script, and calling the functions in `scripts/` directly. Slow: a real browser from `browserPage()`, a real panel from `startPanel()` and starting `speck run`, each of which starts a real process. A slow one is worth it only when the criterion is about what only the real thing does, such as selecting text in a browser or a build process starting and stopping.

## speck

This repo uses speck. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship` or clicks the Ship button in an approved ticket's review pack in the panel, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it.
