---
id: "0665"
title: "Prepare release 1.3.0"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-11-12

---
# 0665 · Prepare release 1.3.0

**Status:** 📋 ready

## Problem
1.3, "Picks the crew", lets each ticket build on its own model and effort, adds build levels you set on the team page and pick per ticket, and has speck fix main itself when the full suite fails (0656 to 0663). Anyone following the setup prompt, or updating speck in a project, still gets 1.2.0.

## Outcome
speck is ready to be released as 1.3.0.

## Acceptance criteria
1. `package.json` has version `1.3.0`, and `speck init` prints `speck 1.3.0`.
2. `CHANGELOG.md` has a 1.3.0 section above the 1.2.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.2.0` tag, from the tickets shipped since (checked by review). The 1.2.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.3.0, the README says in plain words that you can build a ticket at a level, such as quick, deep or one of your own, or on a model of its own (checked by review), the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.3.0.md` holds the notes for the GitHub release page: a short paragraph on picking the crew, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.2.0 (the `level`, `builder_model` and `builder_effort` lines on a ticket and what blank means, the three default levels and `levels:` in `speck/config.yml`, and that speck makes and readies a fix ticket when the full suite fails, with `watch` set to fix or decide), and a link to the 1.3.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.3.0.

## Out of scope
- Creating the `v1.3.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.3.0.md` when this lands on `main`.
- Taking the README's demo pictures again, unless the Build lane they show has changed.
- The landing page, which lives in its own repo.
- The Sonnet and DeepSeek trial and choosing the crew from results, which come in a later release.

## Notes
- Asked for 2026-11-12: "create a release ticket to just get everything else that we've achieved out". A minor release after 0653 (1.2.0): 1.3 on the roadmap, "Picks the crew".
- Covers every ticket shipped since `v1.2.0`: 0656 to 0663, and any other that ships before this is built, such as 0664 if it ships first. 0656 and 0663 fix this repo's own tests, so the changelog leaves them out unless someone using speck would notice them.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.3.0` tag and its GitHub release page appeared. If not: `gh release create v1.3.0 --target main --title "speck 1.3.0" --notes-file docs/releases/v1.3.0.md`.
- Checked 2026-11-12: `package.json` is `1.2.0`, `v1.2.0` is tagged, and `CHANGELOG.md`'s newest section is 1.2.0.
- 0653's checks that name 1.2.0 as the current version should check the current version, as 0653 did for 0640's, and `test/docs-0491.test.mjs` should allow this ticket's test to name the version.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
