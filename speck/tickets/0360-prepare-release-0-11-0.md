---
id: "0360"
title: "Prepare release 0.11.0"                # one outcome, no "and"
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
after: ["0359"]                # ticket ids that must be done first
created: 2026-10-21

---
# 0360 · Prepare release 0.11.0

**Status:** 📝 draft

## Problem
0350 to 0357 and 0359 add document tasks: a ticket can write a document instead of code, into a folder it names inside `outputs/`, which git ignores. The reviewer checks the document passage by passage, the review pack opens it, and it waits for the user to ship it or ask for changes. Anyone following the setup prompt, or updating speck on another machine, gets 0.10.3 without them.

## Outcome
speck is ready to be released as 0.11.0.

## Acceptance criteria
1. `package.json` has version `0.11.0`, and `speck init` prints `speck 0.11.0`.
2. `CHANGELOG.md` has a 0.11.0 section above the 0.10.3 one. It describes, in plain English, what someone using speck can now do since the `v0.10.3` tag, from the tickets shipped since: what a document task is, how to make one, where its document goes, how it's reviewed, and shipping it or asking for changes, which works for code tickets too (checked by review). The 0.10.3 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.11.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.11.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that adds document tasks, what's new and why it matters, how to update (running the install command again in each project, which also adds `/outputs/` to `.gitignore`), anything that changes for someone upgrading from 0.10.3, and a link to the 0.11.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.11.0.

## Out of scope
- Creating the `v0.11.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.11.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- Writing document tasks into the brief's principles or the positioning: that waits until more tasks have shipped.

## Notes
- Asked for 2026-10-21 as a minor release, the first with document tasks. Follows 0346 (0.10.3).
- Covers every ticket shipped since `v0.10.3`: 0350 to 0357, 0359, which it waits for (`after:`), and any other that ships before this is built. 0358 was a trial run of a document task, which changed nothing in speck, so it needn't be mentioned.
- The two follow-up notes from 0356 and 0357 (the brief's description of Ask for changes, and calling the next round a changes round) are still ideas, not in this release.
- After it ships, check that the `v0.11.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.11.0 --target main --title "speck 0.11.0" --notes-file docs/releases/v0.11.0.md`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
