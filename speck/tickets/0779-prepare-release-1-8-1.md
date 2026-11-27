---
id: "0779"
title: "Prepare release 1.8.1"                # one outcome, no "and"
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
after: ["0771","0772","0773","0774","0775","0776","0777","0778"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0772"
started: "2026-11-27T01:50:57.520Z"

---
# 0779 · Prepare release 1.8.1

**Status:** 🔨 building

## Problem
Since 1.8.0, `speck serve` switches to new code by itself and its `--stop` stops an installed service, test summaries work on Node 24, related test runs stay small, several unsteady tests are steady and the Waits for fact says approved. Anyone updating speck still gets 1.8.0.

## Outcome
speck is ready to be released as 1.8.1.

## Acceptance criteria
1. `package.json` has version `1.8.1`, and `speck init` prints `speck 1.8.1`.
2. `CHANGELOG.md` has a 1.8.1 section above the 1.8.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.8.0` tag, from the tickets shipped since (checked by review). The 1.8.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.8.1, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.8.1.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project, and restarting `speck serve` once if it was installed before this release), and a link to the 1.8.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.8.1.

## Out of scope
- Creating the `v1.8.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.8.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-26: an overnight batch of small, low-risk fixes after 1.8.0.
- Covers every ticket shipped since `v1.8.0`, the ones it waits for included, and any other that ships before this is built, such as fix tickets. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them; the steadied tests can be one line.
- If one of the tickets it waits for is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.8.1` tag and its GitHub release page appeared. If not: `gh release create v1.8.1 --target main --title "speck 1.8.1" --notes-file docs/releases/v1.8.1.md`.
- Checked 2026-11-26: `v1.8.0` is tagged on origin.
- Failing before this build: not checked

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
