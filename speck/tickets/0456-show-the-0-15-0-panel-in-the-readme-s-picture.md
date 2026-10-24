---
id: "0456"
title: "Show the 0.15.0 panel in the README's picture"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0453", "0454", "0455", "0457", "0458", "0459", "0460", "0461", "0462", "0463", "0464", "0465", "0466", "0467", "0468", "0469", "0471", "0476", "0477", "0478", "0480", "0481", "0483", "0484", "0485"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0456 · Show the 0.15.0 panel in the README's picture

**Status:** 📋 ready

## Problem
The README's picture, taken on 19 October for 0306, shows the panel before 0.15.0's rebuild: the old header with its Foreman box and buttons, square-edged LCD badges and the Plan and Build sections stacked down the page. 0.15.0 rebuilds the panel, so someone reading the README sees a panel that no longer exists.

## Outcome
The README's light and dark pictures show the 0.15.0 panel at phone width, in a browser pane beside an agent conversation, as it's used in an agent app or an editor such as Cursor.

## Acceptance criteria
1. The light and dark pictures in `docs/images/` are taken again, the same way as 0306's, so they show an agent conversation on the left and the panel as it looks when this is built in a browser pane on the right, between 390 and 440 CSS pixels wide: speck's LCD screen as the header, the Plan, Build and Shipped strip with the open lane marked, the open lane as a light card, and at least one ticket being built and one approved and waiting to ship, with made-up tickets. The panel's text is in a sans-serif font, never a monospace stand-in, except where the panel itself uses monospace. The light picture uses the panel's light look and the dark one its dark look. (checked by review)
2. Each picture is a PNG at least 1600 pixels wide and under 800 KB, with no text or EXIF metadata.
3. Neither picture shows a person's name, account or email address, a client or project name other than speck, a "Disconnected" banner, a speck version number, the word Foreman, or another product's name or logo. (checked by review)
4. The README's `<img>` alt text describes what the new picture shows. (checked by review) No test that passed before this change fails.

## Out of scope
- The README's wording: its opening (0489) and the rest (0490).
- The landing page, which lives in its own repo.

## Notes
- Asked for by the user on 2026-10-24: "a screenshot of what the new panel would look like in an agent chat or within Cursor", set as the README image.
- 0306's pictures were made with the demo in `speck-assets/readme/demo/` beside this checkout, outside the repo: `server.mjs` serves the real panel page from a speck checkout with made-up tickets inside a mock agent app (`frame.html`), and `shoot.mjs` takes the screenshot at 2× with headless Chromium. Update it for the new panel (the panel is now split across `templates/panel.html`, `panel.css`, `panel.js` and the files they load). Don't commit that folder or its paths.
- The mock agent app stays generic: it can be laid out like an editor with an agent chat and a browser pane, but shows no product's name or logo.
- `test/readme-0306.test.mjs` already checks AC2's file facts for the same two files.
- Refined by the user on 2026-10-24: the panel at phone width beside an agent app. Draft pictures taken that day are on https://claude.ai/artifact/1TAXHPCUZ9wvSfkdaLKQzW: a 430 px pane at 2×, 1440 × 900.
- Checked 2026-10-24: the demo's `server.mjs` serves only `panel.html`, `lcd.js`, the font and icons, so the split panel loads unstyled. It needs to serve every `templates/*.css` and `*.js` the page loads. Its `frame.html` pane is 640 px wide; 430 px gives a phone-width panel (draft pictures, above).
- Checked 2026-10-24 (`fc-list`): this machine has only the Liberation fonts, so the panel's system-font stack falls back to Liberation Mono. The draft pictures mapped `Segoe UI` to Liberation Sans with `@font-face { src: local(...) }` in the demo page only.
- Waits for every 0.15.0 ticket that changes the panel's look or feel, 0453 to 0455 and 0457 to 0469, 0471, 0476 to 0478, 0480, 0481 and 0483 to 0485, so the picture shows the panel as it ships (the user asked on 2026-10-24 for it to come right after all of them). 0452 waits for this.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
