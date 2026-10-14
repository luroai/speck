---
id: "0170"
title: "Use speck's eared logo across the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
