---
id: "0147"
title: Style the panel like the landing page                # one outcome, no "and"
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
created: 2026-10-13
started: "2026-10-13T19:36:41.412Z"

---
# 0147 · Style the panel like the landing page

**Status:** 🔨 building

## Problem
The landing page now has a picture of the control panel, styled to match the rest of the page: warm white paper, near-black ink and a vermilion accent. The real panel still uses the greener zen colours from 0134 and 0136, so it looks different from how the landing page shows it.

## Outcome
The real panel uses the landing page's colours and font names, in both light and dark. Nothing else changes: layout, wording and behaviour stay exactly as they are.

## Acceptance criteria
1. In light mode (the first `:root` block in `templates/panel.html`, plus the block that sets the `-bg` tints), these are set to exactly: `--bg: #faf9f5; --panel: #ffffff; --raise: #f0eee6; --line: #cccbc8; --line-soft: #e8e7e3; --text: #141413; --muted: #3d3d3a; --faint: #73726c; --accent: #b0412e; --bad: #c42a3c; --ok: #56713f; --warn: #9c6a10; --run: #3b6286; --idea: #7a4f86; --inbox: #2f7469; --bug: #a3466f; --fix: #7a6a14; --accent-bg: #f7ebe6; --idea-bg: #f2ecf3; --inbox-bg: #e9f2f0; --bad-bg: #fae6e8`.
2. In dark mode (the `:root[data-theme="dark"]` block), these are set to exactly: `--bg: #181818; --panel: #1f1f1f; --raise: #222222; --line: #3d3d3d; --line-soft: #262626; --text: #e4e4e4; --muted: #b4b4b4; --faint: #8a8a8a; --accent: #d4664e; --bad: #ec5a6b; --ok: #9db584; --warn: #d6a24a; --run: #7ea6cf; --idea: #b597c6; --inbox: #6fb5aa; --bug: #d685ab; --fix: #c9b65c; --accent-bg: #2e2320; --idea-bg: #2a2430; --inbox-bg: #1d2a28; --bad-bg: #341d21`.
3. The panel's colour tests (`PALETTE` in `test/support/panel.mjs`, `test/mockup-0126.test.mjs`, `test/panel-0134.test.mjs` and `test/panel-0136.test.mjs`) check the values in AC1 and AC2 and still fail if any of them changes. The dark backdrop behind the full-ticket pane is unchanged, and the light one is `rgba(20, 20, 19, .2)`.
4. Every font list in the panel's stylesheet names the same fonts as the landing page, in this order: `"Shippori Mincho", "Noto Serif JP", Georgia, serif` for the serif, `"Zen Kaku Gothic New", "Noto Sans JP", system-ui, sans-serif` for the sans, and `"IBM Plex Mono", ui-monospace, monospace` for the mono. No font is loaded from another host.
5. Nothing else changes. This ticket's diff against the base branch changes only colour values and font lists in `templates/panel.html`'s stylesheet, and the colour and font tests named in AC3. It changes nothing between `<script>` and `</script>` and no file in `scripts/`. No test that passed before this change fails, except those colour and font checks, which are updated to the new values.

## Out of scope
- Layout, sizes, spacing, borders, wording and the light/dark switch. They stay as they are.
- The landing page itself, which lives in the speck-site project.

## Notes
- Source: the panel illustration on the landing page (`site/index.html` in speck-site, section "The control panel", `.win` styles) and that page's `:root` and dark-mode colours. It isn't in this repo, so the values are copied here.
- Mapping from the landing page: `--bg` = paper, `--panel` = card, `--raise` = paper-2, `--text`/`--muted`/`--faint` = ink/ink-2/ink-3, `--accent` = the vermilion seal colour. `--line` and `--line-soft` are the landing page's two hairline colours worked out as solid colours over the paper.
- `--bad` (errors, blocked, needs you) is a crimson, deliberately not the vermilion, so an error never looks like the accent. The other colours are muted, earthy versions of their old hues: ok sage, warn ochre, run slate blue, idea plum (also the approved-and-waiting-to-ship colour from 0138), inbox teal, bug rose, fix mustard.
- Each colour in AC1 and AC2 has a contrast ratio of at least 4.4:1 against its mode's `--bg`, checked 2026-10-13.
- The palette was shown to the user as a mockup of the live panel (local, in `mockups/landing-palette/`, not in git).
- To undo it, revert the ship commit.
- Checked 2026-10-13: the colours and fonts, read from `site/index.html` in the local speck-site project.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
