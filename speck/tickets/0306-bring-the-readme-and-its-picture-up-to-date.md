---
id: "0306"
title: "Bring the README and its picture up to date"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0287", "0293", "0294", "0296", "0304", "0305", "0308"]  # ticket ids that must be done first
created: 2026-10-18

---
# 0306 · Bring the README and its picture up to date

**Status:** 📋 ready

## Problem
The README describes speck as it was at 0.5.4, and its picture (0249) shows the panel's old look. Since then speck has gained a Settings view, the Foreman, builds with Codex and Cursor, a Claude Code reviewer, pull request mode and pictures in review packs, and the panel has the LCD look (0302–0305). Someone reading the README sees neither.

## Outcome
The README describes what speck does now, and its picture shows the panel as it looks now.

## Acceptance criteria
1. The README says what each of these does for someone using speck, in the section where it fits: the Settings view, the Foreman (one status for the pipeline, and clearing technical blockages), building with Claude Code, Codex or Cursor, reviewing with Claude Code from the command line, pull request mode, and pictures of a visual change in review packs. Every claim matches a shipped ticket. (checked by review)
2. Nothing in the README is untrue of speck as it is when this is built, including what it says about which agents can build and review. (checked by review)
3. The light and dark pictures in `docs/images/` are taken again, the same way as 0249's, so they show the panel with the LCD badges, the LCD mark and title, and the Foreman's status in the header, with made-up tickets. Each is at least 1600 pixels wide and under 800 KB, with no text or EXIF metadata.
4. Neither picture shows a person's name, account or email address, a client or project name other than speck, a "Disconnected" banner or a speck version number.
5. No test that passed before this change fails.

## Out of scope
- The landing page, which lives in its own repo.

## Notes
- 0249's pictures were made with the demo in `speck-assets/readme/demo/` beside this checkout, outside the repo: `server.mjs` serves the real panel page from a speck checkout with made-up tickets inside a mock agent app (`frame.html`), and `shoot.mjs` takes the screenshot at 2× with headless Chromium. Don't commit that folder or its paths.
- Waits for everything it describes, so the README and picture match what ships.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
