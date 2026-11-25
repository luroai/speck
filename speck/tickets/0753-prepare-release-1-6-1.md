---
id: "0753"
title: "Prepare release 1.6.1"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0741","0742","0743","0744","0745","0746","0747","0748","0749","0750","0751","0752","0737"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0737"
started: "2026-11-25T07:54:47.119Z"

---
# 0753 · Prepare release 1.6.1

**Status:** 🔨 building

## Problem
Since 1.6.0, 0737 and 0741 to 0752 start a waiting ticket only on approved work that merges cleanly, fix a test that failed every build on current Node, steady two timing tests, let a waiting test run hand back before the builder's shell limit, name only tests that still fail after a full-suite retry, show the machine-wide build limit in Settings, name Settings controls for screen readers, swap the builder's and reviewer's agents in one step, say under Needs you when the main checkout is bare, and file fewer duplicate follow-ups. Anyone updating speck still gets 1.6.0.

## Outcome
speck is ready to be released as 1.6.1.

## Acceptance criteria
1. `package.json` has version `1.6.1`, and `speck init` prints `speck 1.6.1`.
2. `CHANGELOG.md` has a 1.6.1 section above the 1.6.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.6.0` tag, from the tickets shipped since (checked by review). The 1.6.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.6.1, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.6.1.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.6.0 (if anything), and a link to the 1.6.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.6.1.

## Out of scope
- Creating the `v1.6.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.6.1.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the lanes they show have changed.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-24, after triaging the follow-ups from 1.6.0's builds.
- Covers every ticket shipped since `v1.6.0`: 0741 to 0752, which it waits for, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them.
- If one of 0741 to 0752 is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- A patch release, as the user asked for on 2026-11-24.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.6.1` tag and its GitHub release page appeared. If not: `gh release create v1.6.1 --target main --title "speck 1.6.1" --notes-file docs/releases/v1.6.1.md`.
- Checked 2026-11-24: `v1.6.0` is tagged on origin.
- 0732's checks that name 1.6.0 as the current version should check the current version, as 0732 did for 0695's.
- Failing before this build: not checked
- Built from main at `speck(0754): ship` (the 0754 fix's ship), with 0737's approved work under it: `speck start` started this on 0737, so 0737 ships first and is in the changelog. 0754 is a test-only fix, so it's only in the changelog's Tests line. `npm run prices` ran on 2026-11-25. The README's demo pictures show the Build lane, which these tickets don't change apart from a row that appears only when the main checkout is bare, so they weren't taken again.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
