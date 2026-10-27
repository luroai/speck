# Load the panel's font and icons from relative addresses

Captured: 2026-10-19 · Status: ticketed (0543)

## What
The panel's header shows "speck" in a plain monospace font instead of Doto's dot-matrix lettering when the panel is opened through a proxy that puts it under a path, such as cptr's built-in browser. Load the font, and the other files the page links to, from addresses relative to the page rather than from the site's root.

## Why
`templates/panel.html` loads the font from `url("/fonts/Doto.ttf")`. Under cptr's browser the page is at `https://notes.pandabast.xyz/api/browser/frame/<id>/http/127.0.0.1:4779/`, so that address becomes `https://notes.pandabast.xyz/fonts/Doto.ttf`, which is cptr's own app page (HTML, 200), not the font. The title falls back to monospace, and the panel looks unlike the landing page that 0304 matched it to. Anyone opening the panel through a path-prefixed proxy sees the same.

## Notes
- Found 2026-10-19 from speck-site: `http://127.0.0.1:4779/fonts/Doto.ttf` serves the 457 KB font, while `https://notes.pandabast.xyz/fonts/Doto.ttf` answers `text/html`.
- Other root-absolute links in the page: `/icon.svg`, `/manifest.webmanifest`, and the page's fetches (`/api/state`, `/api/settings`, `/api/tickets/…`) and `/api/events`. The fetches work under cptr's proxy today, likely because cptr rewrites requests made from script but not CSS `url()`s. That's unconfirmed, because the proxy needs a cptr login.
- Open question: change only the CSS `url()` (the visible bug), or every root-absolute address in the page, so it also works behind proxies that don't rewrite fetches?
- Open question: does the `--url https://<hostname>` tunnel setup, or the phone's home-screen app, rely on any of these being root-absolute?
- Builds on 0304 (Doto in the header, served by `scripts/panel.mjs`).
