---
id: "0329"
title: "Prepare release 0.9.1"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0328"]                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T09:45:52.601Z"

---
# 0329 · Prepare release 0.9.1

**Status:** 🔨 building

## Problem
Six bug fixes have shipped since 0.9.0 (0322–0327), and 0328 will add a seventh. Anyone following the setup prompt, or updating speck on another machine, gets 0.9.0 without them.

## Outcome
speck is ready to be released as 0.9.1.

## Acceptance criteria
1. `package.json` has version `0.9.1`, and `speck init` prints `speck 0.9.1`.
2. `CHANGELOG.md` has a 0.9.1 section above the 0.9.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.9.0` tag, from the tickets shipped since (checked by review). The 0.9.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.9.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.9.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.9.0, and a link to the 0.9.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.9.1.

## Out of scope
- Creating the `v0.9.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.9.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-19 as a patch release. Follows 0307 (0.9.0).
- Covers every ticket shipped since `v0.9.0`: 0322–0327, and 0328, which it waits for (`after:`).
- After it ships, check that the `v0.9.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.9.1 --target main --title "speck 0.9.1" --notes-file docs/releases/v0.9.1.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.9.0`: 0322–0328.
- Built from main at `speck(0328): Say what became of a question the Foreman asked in its recent actions`: 312 shipped, 16 cancelled, 13 minutes median, 2 rounds median, 152 approved in the first round, worked out as 0307 did, with its figures test.
- 0307's checks that named 0.9.0 as the current version now check the current version, and its figures test checks only the figures 0.9.0 was built from, as 0307 did for 0298.
- README: no ticket since `v0.9.0` left it saying anything untrue (0324 updated its `build_command` line), so only its status line and figures change here.
- Self-check: the changelog no longer says the Foreman's detail tells you a ticket whose build never started is waiting to be set ready again: it's `speck run`'s log that says so.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
