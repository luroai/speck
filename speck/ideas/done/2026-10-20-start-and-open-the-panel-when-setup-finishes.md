# Start and open the panel when setup finishes

Captured: 2026-10-20 · Status: ticketed (0509, 0510)

## What
At the end of setup, start the panel and open it automatically, in the agent's built-in browser where it has one.

## Why
In Cursor (2026-10-20), the agent loaded the panel into Cursor's integrated browser by itself after setup, which the user found awesome. Speck's own setup doesn't do it, so other agents and setups end without the panel on screen, and the user has to find out how to start it.

## Notes
- Setup's last section (section 8, "Finish" in `skills/speck-setup/SKILL.md`) runs `speck doctor` and says what to do next, but doesn't start the panel.
- Related: `speck/ideas/2026-10-19-load-the-panel-s-font-and-icons-from-relative-addresses.md`, as built-in browsers may open the panel under a proxied path.
- Open: which agents have a built-in browser setup can open it in (Cursor's, Claude Code's desktop app), and what to do in a plain terminal: open the system browser, or print the address?
- Open: should it also turn `speck run` on, or leave that to the user?
