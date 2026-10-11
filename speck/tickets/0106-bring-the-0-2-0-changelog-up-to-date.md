---
id: "0106"
title: Prepare release 0.3.0                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0124", "0125"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T14:35:05.249Z"

---
# 0106 · Prepare release 0.3.0

**Status:** 🔨 building

## Problem
speck has no release process. Every ship pushes straight to `main`, so anyone installing from `main` gets whatever shipped minutes ago, and the 0.2.0 tag was only created on 11 October, a day after the README's setup prompt started pointing at it. A lot has shipped since 0.2.0, and none of it is in a release.

## Outcome
speck is ready to be released as 0.3.0, with a repeatable way to release that keeps the version, the changelog and the setup prompt in step.

## Acceptance criteria
1. `package.json` has version `0.3.0`, and `speck init` prints `speck 0.3.0`.
2. `CHANGELOG.md` has a 0.3.0 section above the 0.2.0 one. It describes, in plain English and under a few headings, what someone using speck can do or will notice that's new since the `v0.2.0` tag. The 0.2.0 section is unchanged.
3. The README's setup prompt names `v0.3.0`, and the README's and the brief's status lines say 0.3.0, a public preview.
4. A test fails when the version in `package.json`, the newest section of `CHANGELOG.md` and the version in the README's setup prompt don't all match. Tests that pinned 0.2.0 check against the current version instead.
5. The brief has a short "Releases" section: `main` moves with every ship, releases are tagged versions, the README always points at the latest release, and the maintainer creates and pushes the tag once the release ticket has shipped, as shipping is theirs.

## Out of scope
- Creating and pushing the `v0.3.0` tag, which the maintainer does.
- A release command or skill: the user's own steps stay capture, ticket, build and ship.

## Notes
- `v0.2.0` was tagged on 11 October 2026 on `3250c9a` (0092's ship).
- Between this ticket shipping and the tag being pushed, the README's prompt points at a tag that doesn't exist yet, so tag straight after it ships.
- Waits for 0124 and 0125, so they're in the release.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
