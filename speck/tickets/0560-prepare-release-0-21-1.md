---
id: "0560"
title: "Prepare release 0.21.1"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0551","0552","0553","0554","0555","0556","0557","0558","0559","0561","0562"]                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T16:17:57.201Z"

---
# 0560 · Prepare release 0.21.1

**Status:** 🔨 building

## Problem
Since 0.21.0, a set of fixes is on the way: the panel's switch stops a speck run that didn't start in time (0551), the pull request queue hands back a ticket refused for private words (0552), the review pack's reviewer tokens match the panel's (0553), a failed Codex review round says why (0554), a build's end reads only recent Codex sessions (0556), five more tests are steadier or can fail again (0555, 0557 to 0559), and a task's review pack opens with its summary (0561) and folds its subfolders (0562). Anyone following the setup prompt, or updating speck in a project, still gets 0.21.0 without them.

## Outcome
speck is ready to be released as 0.21.1.

## Acceptance criteria
1. `package.json` has version `0.21.1`, and `speck init` prints `speck 0.21.1`.
2. `CHANGELOG.md` has a 0.21.1 section above the 0.21.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.21.0` tag, from the tickets shipped since (checked by review). The 0.21.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.21.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.21.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release with a friendlier review pack for tasks, each fix or small change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.21.0, and a link to the 0.21.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.21.1.

## Out of scope
- Creating the `v0.21.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.21.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The changes themselves: 0551 to 0559, 0561 and 0562.

## Notes
- Asked for 2026-10-29: "Yes to all of it. Plus the test ones then release the patch", as a patch after 0.21.0. Then: "Ticket it for me. Add everything to the patch and set them all ready please", which added 0561 and 0562, the task review pack's summary and folded subfolders. Follows 0539 (0.21.0); 0515 prepared the 0.16.1 patch the same way.
- Covers every ticket shipped since `v0.21.0`: 0551 to 0559, 0561 and 0562, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v0.21.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.21.1 --target main --title "speck 0.21.1" --notes-file docs/releases/v0.21.1.md`.
- Checked 2026-10-29: `package.json` is `0.21.0`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the changelog's tests line first said "Five" of speck's tests were steadied, but 0559 alone covers several, so it no longer gives a number; the release notes say a build's end reads sessions changed since the ticket's first build started, as 0556 does. The README's Built with speck figures (545 shipped, 16 cancelled, 13 minutes, 1 round, 277 first round) are checked against the done tickets at the commit this was built from, not in the README itself, as 0491 leaves the README's wording to review.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
