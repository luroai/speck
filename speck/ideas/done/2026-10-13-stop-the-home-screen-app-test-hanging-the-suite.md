# Stop the home-screen app test hanging the suite

Captured: 2026-10-13 · Status: ticketed (0206)
From ticket: 0152

## What
The panel's home-screen app tests (0149) drive headless Chrome, and each call to it waits for an answer with no time limit. Give those calls a time limit, so a call Chrome never answers fails that test instead of hanging the whole suite.

## Why
About one full run in three hung at test 714 while 0152 was built, both through `speck test` and when run directly. 0152 now ends such a run after 5 minutes, but it still fails, so builds and ships fail at random.

## Notes
- From the builder's own notes on 0152. The stuck run had a panel server and Chrome open under `test/panel-0149.test.mjs`; `send` in `browserPage` (`test/support/panel.mjs`) has no timeout.
