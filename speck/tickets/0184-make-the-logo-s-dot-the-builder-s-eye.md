---
id: "0184"
title: "Make the logo's dot the builder's eye"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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
started: "2026-10-15T12:51:28.852Z"

---
# 0184 · Make the logo's dot the builder's eye

**Status:** 🔨 building

## Problem
speck's logo has a small red dot below the circle's centre, which reads as a nose. The builder badge (0168) uses the same character with the red dot as a larger eye above the centre, so the logo and the character don't match.

## Outcome
The logo's red dot is the builder's eye wherever the panel shows the logo: larger, and just above the circle's centre.

## Acceptance criteria
1. In `templates/icons/icon.svg` the dot is a circle with `cx="31.7"`, `cy="33.2"` and `r="4.8"`, in the same colour as before (`#b0412e`). The circle, the ears, the background, the stroke and the group's translate are unchanged.
2. `icon-192.png`, `icon-512.png` and `apple-touch-icon.png` are made again from the new `icon.svg` and match it, by the same check that compares them today (0149, 0170).
3. The mark in the panel header has the same dot (`cx` 31.7, `cy` 33.2, `r` 4.8), still `#b0412e` in light mode and `#d4664e` in dark mode, and the dot doesn't touch the circle's stroke on phone or desktop, including the slim header (0160).
4. No test that passed before this change fails, except checks of the old dot (`cy` 38, `r` 2.3), which are changed to check AC1 to AC3.

## Out of scope
- The landing page and the GitHub avatars (speck-site; the avatars were updated by hand on 2026-10-14).
- The builder badge itself.

## Notes
- Asked for 2026-10-14: "The red dot is now an eye and not a nose, so I think it needs to be larger and higher on the logo."
- The eye: `cx` 31.7, `cy` 33.2, `r` 4.8 in the mark's 64-unit box. The circle's centre is (31.7, 35.38) and its radius 21.5, so this puts the eye 2.2 units above the centre, at about a fifth of the circle's width, the same place and size as the builder badge's eye (0168: eye radius 4.5 at 2 units above the centre of a body of radius 20).
- The old dot is pinned in `test/panel-0149.test.mjs` and `test/panel-0170.test.mjs`. The PNGs are made with `node -e "import('./test/support/icons.mjs').then(m => m.writeIcons())"`.
- 0170 notes that some stroke widths make PNG bytes that the "no model name is hard-coded" scan of `templates/` flags; the new dot could do the same.
- A phone keeps the home-screen icon it fetched, so the user needs to remove and re-add the app to see the new one.

- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
