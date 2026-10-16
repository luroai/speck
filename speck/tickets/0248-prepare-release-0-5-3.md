---
id: "0248"
title: "Prepare release 0.5.3"                # one outcome, no "and"
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
after: ["0247"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T10:07:12.997Z"

---
# 0248 · Prepare release 0.5.3

**Status:** 🔨 building

## Problem
0247 makes `speck run` switch to its new code by itself once it's idle, so shipped changes to `speck run` go live without anyone turning it off and on. Anyone following the README's setup prompt still gets 0.5.2 without it.

## Outcome
speck is ready to be released as 0.5.3.

## Acceptance criteria
1. `package.json` has version `0.5.3`, and `speck init` prints `speck 0.5.3`.
2. `CHANGELOG.md` has a 0.5.3 section above the 0.5.2 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.5.2` tag, from the tickets shipped since. The 0.5.2 and 0.5.1 sections are unchanged.
3. The README's setup prompt names `v0.5.3`, the README's and the brief's status lines say 0.5.3, a public preview, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.2` have made untrue.
4. `docs/releases/v0.5.3.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release so that `speck run` runs its newest code by itself, each fix in it and why it matters, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.5.2, and a link to the 0.5.3 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0243 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.3.

## Out of scope
- Creating the `v0.5.3` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.3.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-16, for patch release 0.5.3. Follows 0243 (0.5.2).
- Waits for every ticket planned for this release (0247), so it's in it.
- Upgrading from 0.5.2: a `speck run` that's already on is still running 0.5.2's code, which can't switch, so it has to be turned off and on once after upgrading. Say so in the release notes.
- After it ships, check that the `v0.5.3` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.3 --target main --title "speck 0.5.3" --notes-file docs/releases/v0.5.3.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
