---
id: "0515"
title: "Prepare release 0.16.1"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-26-prepare-release-0-16-1.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0514"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T14:47:39.378Z"

---
# 0515 · Prepare release 0.16.1

**Status:** 🔨 building

## Problem
Since 0.16.0, Settings can turn same-model review on or off, speck's watching is slower, the Auto-build-off dot is grey, and a trackpad lane-swipe fix is on the way. Anyone following the setup prompt, or updating speck on another machine, still gets 0.16.0 without them.

## Outcome
speck is ready to be released as 0.16.1.

## Acceptance criteria
1. `package.json` has version `0.16.1`, and `speck init` prints `speck 0.16.1`.
2. `CHANGELOG.md` has a 0.16.1 section above the 0.16.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.16.0` tag, from the tickets shipped since (checked by review). The 0.16.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.16.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.16.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix or small change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.16.0, and a link to the 0.16.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.16.1.

## Out of scope
- Creating the `v0.16.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.16.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0511, 0512, 0513 and 0514.

## Notes
- Asked for 2026-10-26 as a patch after 0.16.0, once everything else open is done. Follows 0507 (0.16.0). The open work when this was written was 0514; 0511 to 0513 had already shipped.
- Covers every ticket shipped since `v0.16.0`: 0511, 0512, 0513 and 0514, which it waits for (`after:` includes 0514), and any other that ships before this is built.
- After it ships, check that the `v0.16.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.16.1 --target main --title "speck 0.16.1" --notes-file docs/releases/v0.16.1.md`.
- Checked 2026-10-26: `package.json` is `0.16.0`. 0346 prepared the 0.10.3 patch the same way.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0515.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (498 shipped, 16 cancelled, 13 minutes, 1 round, 254 in round 1), and the reviewer checks the README gives them.
- `test/release-0507.test.mjs`'s checks of the current version now follow `package.json`, as 0507 did for 0452, and `test/docs-0491.test.mjs` lets `test/release-0515.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- Shipped since `v0.16.0`: 0511, 0512, 0513 and 0514, and no others.
- Self-check: dropped an upgrade note saying to reload an open panel, as the panel already picks up its own new code; each other claim checked against the four shipped tickets.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
