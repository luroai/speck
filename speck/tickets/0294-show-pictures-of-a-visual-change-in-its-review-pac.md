---
id: "0294"
title: "Show pictures of a visual change in its review pack"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0284"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:07:36.362Z"

---
# 0294 · Show pictures of a visual change in its review pack

**Status:** 🔨 building

## Problem
For a ticket that changes how something looks, the review pack gives criteria with ticks and the reviewer's words, but no picture. Someone who doesn't read code can't judge a visual change without checking out the branch or waiting until it ships, though deciding whether to ship (Gate 2) is what the pack is for.

## Outcome
The review pack of a ticket that changes how something looks shows pictures of the result.

## Acceptance criteria
1. The build skill has a build whose ticket changes how something looks (the panel, a page, or how the README renders) take pictures of each changed view in a real browser, in the light and dark looks where both exist, before review. (checked by review)
2. The pictures are kept with the ticket's review pack in `speck/.cache/`, not committed, and `speck pack <id>` lists them with what each shows.
3. The panel's review pack shows them, each with its caption, and opens one full size when pressed.
4. A pack with no pictures looks as it does today.

## Out of scope
- Before-and-after comparisons.
- Pictures of documents: `speck/ideas/2026-10-17-review-documents-an-agentic-task-writes.md`.

## Notes
- From `speck/ideas/2026-10-16-show-images-in-review-packs.md`, with its open questions decided: the builder takes the pictures, of the result only, in light and dark, kept beside the pack.
- Failing before this build: none
- AC1 is checked by review: the new step 5 in section 3 of `skills/speck-build/SKILL.md`. A test checks only the facts it names (the command, the folder).
- Self-check: a caption with a line break, hand-edited into `pictures.json`, is now put on one line when read, so the pack's list keeps one line per picture.
- Pictures: taken in a real browser (Chromium through Playwright) of a throwaway repo's review pack with two sample pictures, light and dark, and kept with `speck picture 0294`.
- Tests already drive a real browser with `browserPage()` in `test/support/panel.mjs`. The pack is built in `scripts/pack.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
