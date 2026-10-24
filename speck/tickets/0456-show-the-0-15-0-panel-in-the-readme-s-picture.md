---
id: "0456"
title: "Show the 0.15.0 panel in the README's picture"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-24T19:52:29.222Z"

---
# 0456 · Show the 0.15.0 panel in the README's picture

**Status:** 🔍 reviewing

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
- Failing before this build: none
- AC2's test (`test/readme-0456.test.mjs`) passes before this build too, since 0306's pictures also met those file facts; what's new in the pictures is checked by review.
- Pictures taken with the demo outside the repo, as 0306's: its server now serves every templates file the panel page loads, fills in `{{page}}`, and maps `Segoe UI` to Liberation Sans in the demo page only; its pane is 430 px wide, shot at 2× in a 1440 × 900 window (2880 × 1800 PNGs).
- Self-check: no changes (checked both pictures for names, accounts, version numbers, the word Foreman, a Disconnected banner and other products' marks; the panel's text is sans-serif apart from its own monospace ids and tags).

## In plain words
The picture at the top of the README now shows the rebuilt panel: an agent conversation on the left and the panel in a narrow browser pane beside it, with speck's screen as the header, the Plan, Build and Shipped strip, and the Build lane open with one ticket ready to ship, one being built and two queued. There's a light and a dark version, and GitHub shows whichever matches the reader's setting. To see it, open the README on GitHub once this has shipped. The pictures will need taking again whenever the panel's look changes a lot.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5fc0880d6122fb36a640ac9c4e5a54c8154b2b7e",
    "session": "fresh",
    "thread_id": "01a16f7a-b50d-78c2-b7ce-1548315d799b",
    "builder_response": "- Tests run: test/readme-0456.test.mjs, with `speck test --related` (61 related files, all passing).\n- The two pictures are `docs/images/demo-light.png` and `docs/images/demo-dark.png` (2880 × 1800, a 1440 × 900 window at 2×). The panel is in a 430 CSS px browser pane on the right of a generic mock agent app, as 0306's were taken (demo outside the repo, not committed). Please open both images to check AC1 and AC3.\n- What they show: speck's LCD screen as the header (BUILDING 1 with the time); the Plan, Build and Shipped strip with Build marked; the Build lane open as a light card, with 0042 approved and ready to ship, 0043 being built and 0045 and 0046 queued. Made-up tickets (a shop). Panel text is Liberation Sans (Segoe UI mapped in the demo page only); ids and tags stay in the panel's own monospace.\n- AC4: the README's alt text now describes the new picture.\n- AC2's test passes against 0306's old pictures too, since they also met those file facts.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 95393,
      "cached_input_tokens": 69632,
      "cache_write_input_tokens": 0,
      "output_tokens": 801,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:54:55.484Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Visually inspected docs/images/demo-light.png and demo-dark.png: conversation left, phone-width panel right, LCD header, Plan/Build/Shipped strip with Build selected, and fictional tickets 0042 ready to ship, 0043 building and two queued. Text is sans-serif except the panel's display, ids and tags. Both themes are represented; the pane's proportions match the stated 430 CSS pixels."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/readme-0456.test.mjs exercises the image file requirements and passed. Independent chunk inspection confirms both PNGs are 2880 × 1800, light 305469 bytes and dark 285216 bytes, containing only IHDR, IDAT and IEND chunks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Visual inspection of both images found no personal details, other project or product names or logos, Disconnected banner, version number or word Foreman."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md's image alt text accurately describes the narrow browser pane, LCD screen and open Build lane with approved, building and queued tickets. Reported related tests passed: 656 passed, three skipped, zero failures. Changes are limited to the pictures, alt text, image test and ticket record."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The light and dark pictures now show the updated phone-width panel beside a generic agent conversation. The alt text matches, image requirements are met, and the related tests passed. No blocking concerns found."
  }
}
```

</details>
