---
id: "0336"
title: "Prepare release 0.10.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0331","0332","0333","0334","0335"]                # ticket ids that must be done first
created: 2026-10-20

---
# 0336 · Prepare release 0.10.0

**Status:** 📋 ready

## Problem
0330 to 0335 make an all-Cursor setup work from setup's questions alone: Cursor builds on Auto, a built-in Cursor reviewer on a chosen model, the Foreman on Cursor, models picked from the account's list, and a test command for folders without tests. Anyone following the setup prompt gets 0.9.1 without them, and the user is waiting for this release to test speck in Cursor on their work laptop.

## Outcome
speck is ready to be released as 0.10.0, the Cursor-native release.

## Acceptance criteria
1. `package.json` has version `0.10.0`, and `speck init` prints `speck 0.10.0`.
2. `CHANGELOG.md` has a 0.10.0 section above the 0.9.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.9.1` tag, from the tickets shipped since, leading with setting speck up to run entirely in Cursor (checked by review). The 0.9.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.10.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.10.0.md` holds the notes for the GitHub release page: one short paragraph saying this release makes speck work entirely in Cursor, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.9.1, and a link to the 0.10.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.10.0.

## Out of scope
- Creating the `v0.10.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.10.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-20 as the Cursor-native release. Follows 0329 (0.9.1). A minor release, as it adds features.
- Covers every ticket shipped since `v0.9.1`: 0330 to 0335, which it waits for (`after:`).
- After it ships, check that the `v0.10.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.10.0 --target main --title "speck 0.10.0" --notes-file docs/releases/v0.10.0.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
