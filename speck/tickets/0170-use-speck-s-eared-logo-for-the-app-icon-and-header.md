---
id: "0170"
title: "Use speck's eared logo across the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T15:38:58.848Z"

---
# 0170 · Use speck's eared logo across the panel

**Status:** 🔍 reviewing

## Problem
The panel's home-screen app icon and tab icon (0149) are a plain ensō with a red dot, but speck's logo on the landing page is the ensō with two small ears. The panel's header shows only the word "speck", with no logo at all.

## Outcome
The home-screen icon, the tab icon and the panel header all use speck's logo with the ears, the same mark as the landing page.

## Acceptance criteria
1. `icon.svg`, `icon-192.png`, `icon-512.png` and `apple-touch-icon.png` show the landing page's mark: the open circle, the two small ear arcs and the red dot, centred on the solid `#faf9f5` background with no transparency, replacing 0149's ensō and dot. Its strokes are thick enough to read at 180 px.
2. The mark is drawn from the landing page's own shapes (see Notes), so it matches the landing page exactly apart from stroke width and size.
3. The panel header shows the mark immediately to the left of the "speck" wordmark, about as tall as the wordmark, in the header's text colour with the red dot, in light and dark mode, and on phone and desktop (including the slim header from 0160).
4. The mark is decorative in the header (hidden from screen readers), and the manifest, the icon routes and their address checks work as before (0149).
5. No test that passed before this change fails, except checks of 0149's ensō-and-dot artwork, which are changed to check the new mark.

## Out of scope
- The builder badge character (0168): this is the logo, without legs or eye.
- The landing page itself.

## Notes
- The landing page's mark, `<symbol id="mark" viewBox="0 0 64 64">` in speck-site's `site/index.html`:
  - circle: `M14.5 22.5 A21.5 21.5 0 1 0 22 16.2`
  - ears: `M12.6 19.8 a5.2 5.2 0 0 1 8.2 -5.6` and `M43.2 14.2 a5.2 5.2 0 0 1 8.2 5.6`
  - all `fill="none"`, round caps, stroke width 1.4 on the site (thicker for an icon); ink `#141413`
  - dot: `circle cx=32 cy=38 r=2.3`, `#b0412e` (`#d4664e` in dark)
- The icons live in `templates/icons/` (0149). A phone keeps the icon it fetched when the app was added, so the user needs to remove and re-add the home-screen app to see the new one.
- Asked for on 2026-10-14: "Use the logo with the ears from the landing page, and not the one with the legs."
- Failing before this build: none
- The icon's stroke is 2.2 units (6.2 px at 180 px). 2.4 and 2.5 compress to PNG bytes containing "o6", which the "no model name is hard-coded" scan of `templates/` flags, so a width whose PNGs pass it was picked.
- On a phone the mark needed 16 px the project's name didn't have (0140 AC3), so the phone header's column gap is 6 px, the mark is 0.9 em with 4 px after it, and "control panel" has no extra margin or letter spacing.
- Self-check: the phone header was tightened so the project's name isn't cut short; the icon's stroke width was changed so its PNGs pass the model-name scan

## In plain words
The panel now carries speck's logo with the two small ears, the same mark as on the landing page. It's the home-screen app icon and the browser tab icon, and it also appears just before the word "speck" at the top of the panel, in light and dark mode, on a phone and on a computer.

To see it, open the panel: the logo is at the top left. A phone keeps the icon it saved when the app was added, so remove the home-screen app and add it again to get the new icon.

Worth a look: on a phone the top row is a little tighter than before so the project's name still fits beside the logo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The "no model name is hard-coded" test reads the PNG icons as text and can flag random compressed bytes such as "o6": saved to the inbox as speck/ideas/2026-10-14-skip-images-in-the-model-name-check.md.

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
    "reviewed_sha": "f30e68659569c7398968e3881b83e70f7f89c3a3",
    "thread_id": "01a13b1c-e857-7042-914c-879d87868f6e",
    "seconds": 33,
    "usage": {
      "input_tokens": 110013,
      "cached_input_tokens": 63488,
      "cache_write_input_tokens": 0,
      "output_tokens": 731,
      "reasoning_output_tokens": 13
    },
    "saved_at": "2026-10-14T15:52:25.852Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/icons/icon.svg contains the circle, ears and dot on #faf9f5 with 2.2-unit strokes. Passing 0170 AC1 tests verify centring, RGB PNGs, artwork pixels and SVG-to-PNG consistency for all three sizes. Visual inspection of apple-touch-icon.png confirms the mark."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The paths and dot in templates/icons/icon.svg and templates/panel.html match the landing-page shapes supplied in the ticket. Both 0170 AC2 shape-comparison tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html places the currentColor SVG immediately before speck and supplies light/dark dot colours. All four 0170 AC3 browser tests passed at 1280 and 375 px; phone tests also exercise the slim header. The existing 0140 header-fit test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The header SVG has aria-hidden=\"true\" and focusable=\"false\". Both accessibility tests and the asset-serving test passed. Existing 0149 tests for allowed/refused addresses, HTTP methods and manifest/icon routes also passed; route implementation is unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0170-tests.txt: 1575 tests, 1572 passed, zero failed, three unrelated existing skips. Only 0149 artwork assertions were updated; existing layout and address-check tests remain intact."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The app and tab icons now use speck’s eared logo, and the header displays the same mark in both themes and phone layouts. The artwork matches the supplied landing-page shapes, accessibility and address checks remain intact, and the full suite has no failures. Ready for the owner’s merge decision."
  }
}
```

</details>
