---
id: "0507"
title: "Prepare release 0.16.0"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0502", "0503", "0504", "0505", "0506", "0508", "0509", "0510"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T23:37:58.835Z"

---
# 0507 · Prepare release 0.16.0

**Status:** 🔨 building

## Problem
Since 0.15.0, speck has a new watching animation, the scene it's in most of the time while builds run, and a ship check that keeps private words and home folder paths out of what it publishes. None of it is in a release yet, so projects that install speck don't get it.

## Outcome
speck 0.16.0 is ready to tag, with its changelog and release notes.

## Acceptance criteria
1. `package.json` has version `0.16.0`, and `speck init` prints `speck 0.16.0`.
2. `CHANGELOG.md` has a 0.16.0 section above the 0.15.0 one. It describes, in plain English, what someone using speck can now do since the `v0.15.0` tag, from the tickets shipped since (checked by review). The 0.15.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.16.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.16.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.15.0, and a link to the 0.16.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.16.0.

## Out of scope
- Tagging and publishing the release: the release workflow does both when this ships to main (0240).

## Notes
- Asked for by the user on 2026-10-25: "Set all tickets in plan as ready, then create a release."
- What's new since `v0.15.0`, for the changelog: speck watches a little retro TV for each build, with 21 things it does at random while it watches, from ticking off its checklist and popcorn to Pong, a spider and a drumroll (0502 to 0505); and `speck ship` refuses to publish a private word or your home folder's path in anything under `speck/`, writing home paths as `~/` (0506); and a not-pushed warning clears once its ticket is on the remote, even if its commit was rewritten (0508); `speck panel --background` and `--stop` (0509); and setup ending with the panel open, in the agent's own browser where it has one, and `speck run` on (0510). Check each against `git log v0.15.0..HEAD`.
- Same shape as 0452 (release 0.15.0).
- Waits for 0502 to 0506, and 0508 to 0510, added by the user on 2026-10-25.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
