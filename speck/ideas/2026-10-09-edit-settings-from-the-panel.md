# Edit settings from the panel

Captured: 2026-10-09 · Status: idea

## What
Make settings configurable from the panel: change the settings in `speck/config.yml` from a popup in the panel.

## Why
Changing a setting today means opening `speck/config.yml` in an editor. Doing it from the panel keeps the user in one place.

## Notes
- The panel is read-only today (only `GET`, never writes to the repo), so this needs the panel to write. 0042 (set a draft ticket to ready from the panel) is the first ticket that makes the panel write, so this could build on it.
- Which settings should the popup show: all of `speck/config.yml`, or a chosen set (for example builder, reviewer, reviewer model and effort, auto_ship, auto_ship_risk, worktrees, limits)?
- Should the popup check values before saving (for example reviewer effort must be blank, low, medium, high, xhigh or max)?
- Should the comments in `config.yml` be kept when the file is saved?
- Should a change be committed, or left uncommitted for the user?
- How should the popup be opened (for example a settings button in the header)?
- The panel has no login, so anything that can reach `127.0.0.1` could change config. Is that acceptable?
