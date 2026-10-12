---
id: "0134"
title: "Restyle the control panel in the zen look"                # one outcome, no "and"
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
created: 2026-10-12
started: "2026-10-12T18:33:24.615Z"

---
# 0134 · Restyle the control panel in the zen look

**Status:** 🔨 building

## Problem
The control panel's dark, dense look doesn't match the calmer "zen" style chosen for speck's landing page, so the two feel like different products. The user wants only the look changed: everything the panel shows and does stays exactly the same.

## Outcome
The panel looks like the zen mockup: light paper background, moss-green accent, hairline borders, serif headings, monospace labels and numbered sections (1 Plan, 2 Build, 3 Shipped). It shows the same information and works exactly as before.

## Acceptance criteria
1. The first `:root` block in `templates/panel.html` sets exactly these values: `--bg: #ecebdf; --panel: #f4f4ea; --raise: #e1e1d2; --line: #bfbfb5; --line-soft: #d7d7cc; --text: #1f2521; --muted: #474e47; --faint: #858b7f; --accent: #4c6b52; --bad: #b0412e`. `--ok`, `--warn`, `--run`, `--idea`, `--inbox`, `--bug` and `--fix` are each set to a 6-digit hex colour that is different from the other six and from `--accent` and `--bad`, with a contrast ratio of at least 3:1 against `--bg`. `PALETTE` in `test/support/panel.mjs` and the literal in the 0126 AC2 test list the new values for the same 14 names they list today, so the colour check fails if any of them changes.
2. The page makes no request to any other host: it has no `http://` or `https://` URL in a `<link>`, `<script src>`, `@import` or CSS `url(…)`. In a browser, the computed `font-family` of the Plan, Build and Shipped `h2` headings includes `serif` and not `monospace`, and the computed `font-family` of a ticket id (`.id`) includes `monospace`.
3. Each of the Plan, Build and Shipped section headings shows its number (1, 2 and 3) beside the heading. The number is decorative: it is hidden from screen readers (`aria-hidden="true"`), and the heading's own text is still exactly `Plan`, `Build` or `Shipped`.
4. Nothing the panel does changes. This ticket's diff against the base branch changes nothing between `<script>` and `</script>` in `templates/panel.html`, and changes no file in `scripts/`. Every `id` in the page's static HTML before the change is still present, and no visible text is added or removed apart from the section numbers in AC3.
5. No test that passed before this change fails, except the colour checks named in AC1, which are updated to the new values.

## Out of scope
- Anything in the mockup that the panel doesn't do today: the "speck run · on" pill (0127), the light/dark switch button, the "Your first decision" caption, the five summary figures and the footer line.
- A dark version of the zen look. The panel is light only after this ticket.
- Any change to behaviour, data, wording, layout logic or the server (`scripts/panel.mjs`).

## Notes
- Design reference: the zen mockup in the user's landing page project (`mockups/zen/panel.html` in speck-site). It isn't in this repo, so this ticket carries what matters: the colours in AC1, plus serif headings and ticket titles, a light sans for body text, monospace uppercase spaced-out labels, 0.5px hairline borders, square corners, cards on `--panel` over the `--bg` page, the open ticket marked by a 2px `--accent` left edge, and `--bad` kept for blocked and "needs you" only.
- Fonts: name the mockup's fonts first (Shippori Mincho for the serif, Zen Kaku Gothic New for the sans, IBM Plex Mono for the mono), so they're used if installed, then fall back to Georgia/serif, system-ui/sans-serif and ui-monospace/monospace. Don't load them from Google Fonts or any other host.
- Keep the existing CSS variable names so the rules that use them (for example `var(--accent)` on tickets and `var(--idea)` on ideas) keep working. Replace the other hard-coded dark colours in the stylesheet (for example in `.resume .cmd`) with light ones.
- AC4 is checked by the reviewer against this ticket's diff. Don't add a test that freezes the script, because later tickets must be able to change it.
- The change is meant to be undone with one `git revert` of its commit if the user doesn't like it, so keep it to the panel page and the colour tests.
- Checked 2026-10-12: the mockup's colours, fonts and layout, read from `mockups/zen/panel.html` in the local speck-site project.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
