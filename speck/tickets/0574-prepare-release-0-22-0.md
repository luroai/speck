---
id: "0574"
title: "Prepare release 0.22.0"                # one outcome, no "and"
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
after: ["0563","0564","0565","0566","0567","0568","0569","0570","0571","0572","0573"]                # ticket ids that must be done first
created: 2026-11-08

---
# 0574 · Prepare release 0.22.0

**Status:** 📋 ready

## Problem
Since 0.21.1, speck is on its way to deciding for you rather than asking: `watch: decide` takes every recommendation (0564), and its agent acts on its own (0567), asking about a stop only once (0566). A ticket whose criteria changed waits for you at Ship (0565), the panel lists what speck decided (0568), a size-guard split is taken by itself (0563), and speck looks into a build that runs long (0569). `speck doctor` says whether the commit check is on (0570), lint is now the ready check (0573), and two more tests are steadier (0571, 0572). Anyone following the setup prompt, or updating speck in a project, still gets 0.21.1 without them.

## Outcome
speck is ready to be released as 0.22.0.

## Acceptance criteria
1. `package.json` has version `0.22.0`, and `speck init` prints `speck 0.22.0`.
2. `CHANGELOG.md` has a 0.22.0 section above the 0.21.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.21.1` tag, from the tickets shipped since (checked by review). The 0.21.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.22.0, a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v0.22.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, leading with speck deciding for you and telling you, each change in it and why it matters, how to update (running the install command again in each project, then `watch: decide` in Settings to try it), anything that changes for someone upgrading from 0.21.1 (`speck lint` is now `speck check`, and still works), that costs are estimates at API list prices, and a link to the 0.22.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.22.0.

## Out of scope
- Creating the `v0.22.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.22.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The panel's new look and taking out the LCD screen, which come in a later release.
- The changes themselves: 0563 to 0573.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- A minor release, as it adds `watch: decide`, `speck watch decide` and `tell`, `speck check` and `criteria_changed` in `speck status --json`. Follows 0560 (0.21.1).
- Covers every ticket shipped since `v0.21.1`: 0563 to 0573, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v0.22.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.22.0 --target main --title "speck 0.22.0" --notes-file docs/releases/v0.22.0.md`.
- Checked 2026-11-08: `package.json` is `0.21.1`.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
