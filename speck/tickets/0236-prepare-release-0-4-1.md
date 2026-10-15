---
id: "0236"
title: Prepare release 0.5.0                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0227","0228","0229","0230","0231","0232","0233","0234","0235","0237","0238","0239","0240"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0236 · Prepare release 0.5.0

**Status:** 📝 draft

## Problem
Builds spend most of their time running speck's test suite: about 8 minutes on an 8 GB MacBook Air, several times per ticket, with test runs from builds side by side taking over the computer. A build could also end itself while its suite ran in the background. The 0.5.0 tickets run the whole suite once per ticket, when it ships, make test runs take turns at a low priority, make the suite faster and keep test runs in the foreground, and anyone following the README's setup prompt still gets 0.4.0.

## Outcome
speck is ready to be released as 0.5.0.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `package.json` has version `0.5.0`, and `speck init` prints `speck 0.5.0`.
2. `CHANGELOG.md` has a 0.5.0 section above the 0.4.0 one. It describes, in plain English and under a few headings, what someone using speck will notice is fixed or changed since the `v0.4.0` tag, from the tickets shipped since. The 0.4.0 section is unchanged.
3. The README's setup prompt names `v0.5.0`, and the README's and the brief's status lines say 0.5.0, a public preview, and the README's "How you work with it" says that a build runs the ticket's own tests and that the whole suite runs when a ticket ships.
4. `docs/releases/v0.5.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release in which a ticket gets one whole test run, when it ships, and test runs no longer take over the computer, the three to five changes that matter most, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.4.0 (including that the reviewer no longer sees a whole-suite run, and that `speck test --files` waits its turn), and a link to the 0.5.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0210 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.0.

## Out of scope
- Creating the `v0.5.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.0.md` when this lands on `main`.
- The fixes planned for 0.5.1 (0213 to 0225, released by 0226).

## Notes
- Asked for 2026-10-15, for minor release 0.5.0, renamed from patch release 0.4.1 once 0235, 0238 and 0239 changed how builds run tests. Follows 0210 (0.4.0) and 0106 (0.3.0).
- Waits for every ticket planned for this release (0227 to 0235, and 0237 to 0239), so they're in it. Changes for speck's own test suite only (0229 to 0234) belong under a short heading for people working on speck, or are left out of the release notes.
- After it ships, check that the `v0.5.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.0 --target main --title "speck 0.5.0" --notes-file docs/releases/v0.5.0.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
