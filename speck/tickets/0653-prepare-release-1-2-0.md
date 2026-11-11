---
id: "0653"
title: "Prepare release 1.2.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0642","0643","0644","0645","0646","0647","0648","0649","0650","0651","0652"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0653 · Prepare release 1.2.0

**Status:** 📋 ready

## Problem
1.2, "Your team", turns Settings into a team page with a character for each member, shows each subscription's usage, and moves builds, reviews, the watch agent and QA to another agent on their bench when one runs out (0642 to 0652). Anyone following the setup prompt, or updating speck in a project, still gets 1.1.0.

## Outcome
speck is ready to be released as 1.2.0.

## Acceptance criteria
1. `package.json` has version `1.2.0`, and `speck init` prints `speck 1.2.0`.
2. `CHANGELOG.md` has a 1.2.0 section above the 1.1.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.1.0` tag, from the tickets shipped since (checked by review). The 1.1.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.2.0, the README says in plain words that you set up your team once and speck keeps it working when an agent runs out of usage (checked by review), the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.2.0.md` holds the notes for the GitHub release page: a short paragraph on your team, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 1.1.0 (the benches and what blank means, `qa_agent`, and that Cursor's usage is read from its usage screen), and a link to the 1.2.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.2.0.

## Out of scope
- Creating the `v1.2.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.2.0.md` when this lands on `main`.
- Taking the README's demo pictures again: the Build lane they show isn't changed by 1.2.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-11: "get a new release ticket created and set ready too". A minor release after 0640 (1.1.0): 1.2 on the roadmap, "Your team".
- Covers every ticket shipped since `v1.1.0`: 0642 to 0652, which it waits for, and any other that ships before this is built, such as 0641 once it's shipped.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.2.0` tag and its GitHub release page appeared. If not: `gh release create v1.2.0 --target main --title "speck 1.2.0" --notes-file docs/releases/v1.2.0.md`.
- Checked 2026-11-11: `package.json` is `1.1.0`, and `v1.1.0` is tagged.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
