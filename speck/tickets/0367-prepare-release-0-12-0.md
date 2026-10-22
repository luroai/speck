---
id: "0367"
title: "Prepare release 0.12.0"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0366"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0367 · Prepare release 0.12.0

**Status:** 📝 draft

## Problem
0361 to 0366 make the panel calmer in a narrow pane, such as Cursor's or the Claude desktop app's: a finished document task is a short row, a document opens in a pop-up you can ship it from, the header is one row with the project always shown, and the Foreman's status scrolls across a dot-matrix notice board whose detail opens in a pop-up. Anyone following the setup prompt, or updating speck on another machine, gets 0.11.0 without them.

## Outcome
speck is ready to be released as 0.12.0.

## Acceptance criteria
1. `package.json` has version `0.12.0`, and `speck init` prints `speck 0.12.0`.
2. `CHANGELOG.md` has a 0.12.0 section above the 0.11.0 one. It describes, in plain English, what someone using speck can now do since the `v0.11.0` tag, from the tickets shipped since (checked by review). The 0.11.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.12.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.12.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that reworks the panel for narrow panes, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.11.0, and a link to the 0.12.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.12.0.

## Out of scope
- Creating the `v0.12.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.12.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-22 as a release of the panel changes found using speck in Cursor. A minor release, as it adds features (pop-ups, shipping from a document, the notice board) without breaking anything. Follows 0360 (0.11.0).
- Covers every ticket shipped since `v0.11.0`: 0361 to 0366, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.12.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.12.0 --target main --title "speck 0.12.0" --notes-file docs/releases/v0.12.0.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
