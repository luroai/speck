---
id: "0282"
title: "Prepare release 0.6.0"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T09:46:26.237Z"

---
# 0282 · Prepare release 0.6.0

**Status:** 🔨 building

## Problem
Since `v0.5.4`, speck has gained a Settings view in the panel that explains and changes the settings people tune, with settings for this machine only, a builder model and model lists for the reviewer (0257–0261, 0268, 0273–0281). Setup now goes through those settings (0269). Shipping copes better when `main` fails or has moved on GitHub (0263–0265). Builds run a project's quick repo-wide checks (0272), and a document's wording is checked by review, not by tests (0266, 0267). Anyone following the setup prompt today gets 0.5.4 without any of it.

## Outcome
speck is ready to be released as 0.6.0.

## Acceptance criteria
1. `package.json` has version `0.6.0`, and `speck init` prints `speck 0.6.0`.
2. `CHANGELOG.md` has a 0.6.0 section above the 0.5.4 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.5.4` tag, from the tickets shipped since. The 0.5.4 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.6.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.5.4` have made untrue.
4. `docs/releases/v0.6.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install it, anything that changes for someone upgrading from 0.5.4 (such as new settings and their defaults), and a link to the 0.6.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0254 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.6.0.

## Out of scope
- Creating the `v0.6.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.6.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- Changing what the README says about builders other than Claude Code: `speck/ideas/2026-10-17-build-with-any-agent.md`.

## Notes
- Asked for 2026-10-18, for minor release 0.6.0: it adds features, so it isn't a patch. Follows 0254 (0.5.4).
- Covers every ticket shipped since `v0.5.4`: 0257–0281, apart from 0262, which only updated tests.
- After it ships, check that the `v0.6.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.6.0 --target main --title "speck 0.6.0" --notes-file docs/releases/v0.6.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Built from main at `speck(0281): Draw every Settings control's border on all four sides`: 265 shipped, 16 cancelled, 13 minutes median, 1 round median, 136 approved in the first round, worked out as 0254 did. 0267 made tests stop reading this repo's `speck/` folder and pinning wording, so the figures test reads the done tickets at that commit with git and looks for each figure in the README; it skips when that commit isn't in the checkout's history, as in 0267's rewording check.
- "The 0.5.4 and earlier sections are unchanged" is checked against the `v0.5.4` tag's changelog, skipped when the tag isn't there.
- 0254's checks that named 0.5.4 as the current version now check the current version, as 0254 did for 0248.
- Self-check: README's setup and ship-queue sentences narrowed to what 0263, 0265 and 0269 do; release notes no longer say the machine values live in `speck/config.yml`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
