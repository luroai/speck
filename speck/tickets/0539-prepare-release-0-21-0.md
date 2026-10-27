---
id: "0539"
title: "Prepare release 0.21.0"                # one outcome, no "and"
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
after: ["0538"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0539 · Prepare release 0.21.0

**Status:** 📋 ready

## Problem
Since 0.20.0, the panel's Capture lane shows how many notes it holds (0536), lists notes captured on the same day newest first (0537) and lets you star the notes you like (0538). Anyone following the setup prompt, or updating speck in a project, still gets 0.20.0 without them.

## Outcome
speck is ready to be released as 0.21.0.

## Acceptance criteria
1. `package.json` has version `0.21.0`, and `speck init` prints `speck 0.21.0`.
2. `CHANGELOG.md` has a 0.21.0 section above the 0.20.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.20.0` tag, from the tickets shipped since (checked by review). The 0.20.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.21.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.21.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.20.0, that costs are estimates at API list prices, and a link to the 0.21.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.21.0.

## Out of scope
- Creating the `v0.21.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.21.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The changes themselves: 0536 to 0538.

## Notes
- Asked for 2026-10-27: "Create another release ticket and set all tickets to ready."
- A minor release, as 0537 adds a time to the `Captured:` line of new notes and 0538 lets the panel write a note's `Starred:` line. Follows 0535 (0.20.0).
- Covers every ticket shipped since `v0.20.0`: 0536 to 0538, which it waits for (`after:` names 0538, the last in their chain), and any other that ships before this is built.
- After it ships, check that the `v0.21.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.21.0 --target main --title "speck 0.21.0" --notes-file docs/releases/v0.21.0.md`.
- Checked 2026-10-27: `package.json` is `0.20.0`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
