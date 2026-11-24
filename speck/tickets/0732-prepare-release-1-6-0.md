---
id: "0732"
title: "Prepare release 1.6.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0701","0702","0703","0704","0705","0706","0707","0708","0709","0710","0711","0712","0713","0714","0715","0716","0717","0718","0719","0720","0721","0722","0723","0724","0725","0726","0727","0728","0729","0730","0731"]                # ticket ids that must be done first
created: 2026-11-24

---
# 0732 · Prepare release 1.6.0

**Status:** 📋 ready

## Problem
Since 1.5.0, speck's Claude models are named properly (0700), and 0701 to 0731 make the panel look and work like part of Cursor (Settings laid out like Cursor's and saving each change straight away, a soft highlight for chained tickets, Set ready only on an open ticket), add Try it from a review pack, a build limit across projects and a usage warning on the bridge, and fix stalls around tickets built on others. Anyone following the setup prompt, or updating speck in a project, still gets 1.5.0.

## Outcome
speck is ready to be released as 1.6.0.

## Acceptance criteria
1. `package.json` has version `1.6.0`, and `speck init` prints `speck 1.6.0`.
2. `CHANGELOG.md` has a 1.6.0 section above the 1.5.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.5.0` tag, from the tickets shipped since (checked by review). The 1.5.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.6.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.6.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.5.0 (such as Settings saving each change straight away, and the new `machine_parallel_builds` setting), and a link to the 1.6.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.6.0.

## Out of scope
- Creating the `v1.6.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.6.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the lanes they show have changed (0727 and 0728 change Plan's rows, so check them).
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-24, after the idea sweep and the Cursor look tickets.
- Covers every ticket shipped since `v1.5.0`: 0700, and 0701 to 0731, which it waits for, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them; the steadied tests (0723, 0724) can be one line.
- If one of 0701 to 0731 is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- A minor release rather than a patch: it adds features (Try it, instant saving in Settings, a machine-wide build limit, the bridge's usage warning).
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.6.0` tag and its GitHub release page appeared. If not: `gh release create v1.6.0 --target main --title "speck 1.6.0" --notes-file docs/releases/v1.6.0.md`.
- Checked 2026-11-24: `v1.5.0` is tagged on origin.
- 0695's checks that name 1.5.0 as the current version should check the current version, as 0695 did for 0684's.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
