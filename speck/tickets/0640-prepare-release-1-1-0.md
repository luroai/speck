---
id: "0640"
title: "Prepare release 1.1.0"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0638","0639"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T13:24:37.152Z"

---
# 0640 · Prepare release 1.1.0

**Status:** 🔨 building

## Problem
speck has grown since 1.0.0: it checks the work in the running app, works out how to start each app, keeps test logins on your machine, carries on after usage limits, and ships faster on quick tests. Anyone following the setup prompt, or updating speck in a project, still gets 1.0.0.

## Outcome
speck is ready to be released as 1.1.0.

## Acceptance criteria
1. `package.json` has version `1.1.0`, and `speck init` prints `speck 1.1.0`.
2. `CHANGELOG.md` has a 1.1.0 section above the 1.0.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.0.0` tag, from the tickets shipped since (checked by review). The 1.0.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.1.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.1.0.md` holds the notes for the GitHub release page: a short paragraph on speck checking the work, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.0.0 (setting `commands.start` or letting speck work it out, `speck logins`, `commands.test_full`, and that a round saved with `speck record` no longer ships by itself), and a link to the 1.1.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.1.0.

## Out of scope
- Creating the `v1.1.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.1.0.md` when this lands on `main`.
- Taking the README's demo pictures again: the Build lane they show hasn't changed since 1.0.0.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-11: "create a release ticket … for 1.1". A minor release after 0598 (1.0.0): 1.1 on the roadmap, "Checks the work".
- Covers every ticket shipped since `v1.0.0`: 0622 to 0637, plus 0638 and the README ticket, which it waits for, and any other that ships before this is built.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.1.0` tag and its GitHub release page appeared. If not: `gh release create v1.1.0 --target main --title "speck 1.1.0" --notes-file docs/releases/v1.1.0.md`.
- Checked 2026-11-11: `package.json` is `1.0.0`; the README's status line reads "Status: 1.0.0. It works end to end on your own machine."

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
