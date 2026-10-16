---
id: "0249"
title: "Show speck's panel beside an agent conversation at the top of the README"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T11:09:08.751Z"

---
# 0249 · Show speck's panel beside an agent conversation at the top of the README

**Status:** 🔨 building

## Problem
People landing on speck's GitHub page, such as someone reading a job application, see only text. What speck is like to use, your agent's conversation on one side and speck's panel open beside it in the agent app, isn't shown anywhere in the README.

## Outcome
Near the top, the README shows a demo image of an agent app with a conversation on the left and speck's panel open in its browser pane on the right, in the reader's light or dark theme.

## Acceptance criteria
1. `README.md` shows the demo image supplied for this ticket of an agent app, a conversation on the left and speck's panel open in its browser pane on the right, placed after the opening paragraph and before the first `##` heading.
2. There's a light and a dark version, and the README picks between them with a `<picture>` element whose `<source>` uses `media="(prefers-color-scheme: dark)"`, falling back to the light one in an `<img>` with alt text that says it's an agent conversation beside speck's panel.
3. Both image files are committed under `docs/images/`, are each at least 1600 pixels wide and under 800 KB.
4. Neither image shows a person's name, account or email address, a panel "Disconnected" banner or a speck version number: anything like that in a supplied screenshot is cropped out or covered.
5. No test that passed before this change fails.

## Out of scope
- Making the images: they're supplied, in light and dark.
- Changing the README's wording, apart from the image: that's 0250, which waits for this one.

## Notes
- Source: `demo-light.png` and `demo-dark.png` in `speck-assets/readme/`, beside this checkout on the build machine, outside the repo. They show the real panel page with made-up tickets for a demo shop, inside a mock agent app (no product's branding), at 3000×1880. Use them as they are, apart from any resizing or compressing the size limits need. Don't commit that path, or the demo's server and frame from `speck-assets/readme/demo/`. If the images aren't there, block and ask for them.
- The images are public: check them for anything private (names, accounts, client or project names other than speck) before committing.
- Checked 2026-10-16: GitHub renders `<picture>` with a `prefers-color-scheme` `<source>` in a README: `gh api markdown` (gfm) keeps the `<source media="(prefers-color-scheme: dark)">` and wraps the element in GitHub's `<themed-picture>`, which switches the image with the reader's GitHub theme.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
