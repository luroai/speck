---
id: "0522"
title: "Prepare release 0.18.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0519","0520","0521"]                # ticket ids that must be done first
created: 2026-10-26

---
# 0522 · Prepare release 0.18.0

**Status:** 📋 ready

## Problem
Since 0.17.0, every closed card in the panel is the same height, with a Plan card's priority, size, risk and type as small labels (0519), ideas and the inbox have their own Capture lane left of Plan (0520), and ideas an agent raised are labelled as an agent's there (0521). Anyone following the setup prompt, or updating speck in another project, still gets 0.17.0 without them.

## Outcome
speck is ready to be released as 0.18.0.

## Acceptance criteria
1. `package.json` has version `0.18.0`, and `speck init` prints `speck 0.18.0`.
2. `CHANGELOG.md` has a 0.18.0 section above the 0.17.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.17.0` tag, from the tickets shipped since (checked by review). The 0.17.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.18.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.18.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.17.0, including that ideas and the inbox have moved from Plan to the Capture lane, and a link to the 0.18.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.18.0.

## Out of scope
- Creating the `v0.18.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.18.0.md` when this lands on `main`.
- Updating speck in the user's other projects.
- The landing page, which lives in its own repo.
- The changes themselves: 0519, 0520 and 0521.

## Notes
- Asked for 2026-10-26: "Create a release ticket after these and set them all as ready." A minor release, as 0520 adds a lane and 0521 a label. Follows 0518 (0.17.0).
- Covers every ticket shipped since `v0.17.0`: 0519, 0520 and 0521, which it waits for (`after:` names 0521, which waits for 0520, which waits for 0519), and any other that ships before this is built.
- After it ships, check that the `v0.18.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.18.0 --target main --title "speck 0.18.0" --notes-file docs/releases/v0.18.0.md`.
- Checked 2026-10-26: `package.json` is `0.17.0`.
- Relies on nothing outside this repo.
## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
