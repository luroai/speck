---
id: "0307"
title: "Prepare release 0.9.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0302", "0303", "0304", "0305", "0306", "0308"]  # ticket ids that must be done first
created: 2026-10-18

---
# 0307 · Prepare release 0.9.0

**Status:** 📋 ready

## Problem
Once 0302–0306 ship, the panel has the LCD look from the Luro design (its badges, mark, title and app icon), and the README and its picture describe speck as it is now. Anyone following the setup prompt, or updating speck on another machine, gets 0.8.0 without it.

## Outcome
speck is ready to be released as 0.9.0.

## Acceptance criteria
1. `package.json` has version `0.9.0`, and `speck init` prints `speck 0.9.0`.
2. `CHANGELOG.md` has a 0.9.0 section above the 0.8.0 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.8.0` tag, from the tickets shipped since. The 0.8.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.9.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.8.0` have made untrue.
4. `docs/releases/v0.9.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install or update it (running the install command again in each project), anything that changes for someone upgrading from 0.8.0 (such as new settings and their defaults), and a link to the 0.9.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0298 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.9.0.

## Out of scope
- Creating the `v0.9.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.9.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-18, so the user can update speck on their other machines. Follows 0298 (0.8.0).
- Covers: 0302–0306. It waits for all of them (`after:`), so they're all in it.
- After it ships, check that the `v0.9.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.9.0 --target main --title "speck 0.9.0" --notes-file docs/releases/v0.9.0.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
