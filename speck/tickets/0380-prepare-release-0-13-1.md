---
id: "0380"
title: "Prepare release 0.13.1"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-prepare-release-0-13-1.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375","0376","0377","0378","0379"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-23T00:04:00.884Z"

---
# 0380 · Prepare release 0.13.1

**Status:** 🔨 building

## Problem
0376 launches a stopped ticket again without restarting speck run, 0377 stops a chance failure handing a ticket back, 0378 makes doctor check a Cursor reviewer, and 0379 keeps a pop-up's Close button in view. Anyone following the setup prompt, or updating speck on another machine, gets 0.13.0 without them.

## Outcome
speck is ready to be released as 0.13.1.

## Acceptance criteria
1. `package.json` has version `0.13.1`, and `speck init` prints `speck 0.13.1`.
2. `CHANGELOG.md` has a 0.13.1 section above the 0.13.0 one. It describes, in plain English, what someone using speck will notice is fixed since the `v0.13.0` tag, from the tickets shipped since (checked by review). The 0.13.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.13.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.13.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.13.0, and a link to the 0.13.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.13.1.

## Out of scope
- Creating the `v0.13.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.13.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0376, 0377, 0378 and 0379.

## Notes
- Asked for 2026-10-22 as a patch after 0.13.0 (0375). The four fixes are defects, not new behaviour. Nothing changes config or the commands.
- Covers every ticket shipped since `v0.13.0`: 0376, 0377, 0378 and 0379, which it waits for, and 0375, and any other that ships before this is built.
- After it ships, check that the `v0.13.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.13.1 --target main --title "speck 0.13.1" --notes-file docs/releases/v0.13.1.md`.
- Checked 2026-10-22: `package.json` is `0.12.0` until 0375 ships `0.13.0`. 0346 prepared the 0.10.3 patch the same way.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
