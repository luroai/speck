---
id: "0184"
title: "Make the logo's dot the builder's eye"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
- The new eye's PNGs, compressed at level 9, held bytes ("O6", "o4") that the "no model name is hard-coded" scan flags, so the PNG writer in `test/support/icons.mjs` now uses zlib's default level, whose bytes pass it at all three sizes.
- The "dot doesn't touch the stroke" check is geometric: the header's mark scales as a whole and no rule changes its stroke width, so one check covers phone, desktop and the slim header. 0170's browser checks still cover the dot's colour at each.
- Self-check: no changes

## In plain words
The red dot in speck's logo is now the builder's eye: bigger, and sitting just above the middle of the circle instead of low down like a nose. It shows this way in the panel's header, in light and dark mode, and on the home-screen icon. To see it, open the panel and look at the logo beside "speck". A phone keeps the home-screen icon it already has, so remove the app from the home screen and add it again to get the new one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (all already in the inbox, so no new notes):
  - The model-name scan reads the PNG icons as text and flagged the eye's level-9 PNGs; worked around by compressing at zlib's default level. Matches speck/ideas/2026-10-14-skip-images-in-the-model-name-check.md.
  - 0128 AC4 failed once in a full run (speck run's start-up line came before its "already running" error) and passed 3 times alone. Matches speck/ideas/2026-10-15-fix-the-0128-ac4-test-that-fails-by-chance.md.

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
    "reviewed_sha": "fe1429dc04408db69ea274b714d06057e47c83c6",
    "thread_id": "01a13fb0-f046-7dc0-ac66-69ceff11dc58",
    "seconds": 43,
    "usage": {
      "input_tokens": 141504,
      "cached_input_tokens": 98176,
      "cache_write_input_tokens": 0,
      "output_tokens": 805,
      "reasoning_output_tokens": 42
    },
    "saved_at": "2026-10-15T13:12:45.018Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/icons/icon.svg changes only the dot to (31.7, 33.2), radius 4.8, preserving #b0412e and all other artwork. Passing test '0184 AC1' pins the complete SVG."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Independently regenerated all three PNGs in memory using test/support/icons.mjs: each matches the committed file exactly. Passing 0149, 0170 and 0184 AC2 tests also check artwork pixels."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html has the required geometry and theme colours. Passing 0184 AC3 tests check geometry and clearance; independently calculated clearance is 12.72 SVG units. The full log confirms 0170 browser checks passed in both themes at desktop and phone widths, including the slim header."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0184-tests.txt confirms 1,840 tests: 1,837 passed, three skipped and zero failed. Existing artwork assertions were updated to the new eye without weakening their checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel logo and home-screen icons now use the larger, higher eye, with the existing colours and surrounding artwork preserved. The eye stays clear of the outline at every header size. Tests pass, and no blocking concerns were found."
  }
}
```

</details>
