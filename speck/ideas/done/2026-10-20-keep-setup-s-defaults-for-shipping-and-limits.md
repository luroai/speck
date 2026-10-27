# Keep setup's defaults for shipping and limits

Captured: 2026-10-20 · Status: ticketed (0547)

## What
Setup should just carry out the defaults for now, rather than asking what the user wants for each setting. Still ask about the specific models, but leave all the risk and auto-ship settings (and the rest of section 7) at their defaults.

## Why
Setting up in Cursor on the user's work laptop (2026-10-20), setup asked about each setting in turn. For someone setting speck up for the first time, that's a lot of questions about things they don't yet have a view on, and it slows down getting to the first ticket.

## Notes
- Reverses part of 0269 (done), which added section 7 of `skills/speck-setup/SKILL.md`: go through `ship_mode`, `auto_ship` and `auto_ship_risk`, `max_parallel_builds` and `max_parallel_tests`, and the ticket limits one at a time.
- Keep asking about: the builder, the reviewer and the Foreman, and their models (section 5, and 0334's all-Cursor setup).
- Open: should setup still say, in a line, that these settings exist and can be changed later in the panel's Settings view or with `speck config set`?
- Open: does `ship_mode` stay a question when the base branch needs pull requests (section 3 already brings up pull request mode then)?
- Open: is `max_parallel_builds` still worth setting from the machine, or left at its default too?
