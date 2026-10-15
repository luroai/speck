---
id: "0236"
title: "Prepare release 0.4.1"                # one outcome, no "and"
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
after: ["0227","0228","0229","0230","0231","0232","0233","0234","0235","0237"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0236 · Prepare release 0.4.1

**Status:** 📝 draft

## Problem
Builds spend most of their time running speck's test suite: about 8 minutes on an 8 GB MacBook Air, several times per ticket. A build could also end itself while its suite ran in the background. The 0.4.1 tickets make the suite and builds faster and keep test runs in the foreground, and anyone following the README's setup prompt still gets 0.4.0.

## Outcome
speck is ready to be released as 0.4.1.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `package.json` has version `0.4.1`, and `speck init` prints `speck 0.4.1`.
2. `CHANGELOG.md` has a 0.4.1 section above the 0.4.0 one. It describes, in plain English and under a few headings, what someone using speck will notice is fixed or changed since the `v0.4.0` tag, from the tickets shipped since. The 0.4.0 section is unchanged.
3. The README's setup prompt names `v0.4.1`, and the README's and the brief's status lines say 0.4.1, a public preview.
4. `docs/releases/v0.4.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release that makes builds faster and steadier, the three to five changes that matter most, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.4.0, and a link to the 0.4.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0210 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.4.1.

## Out of scope
- Creating and pushing the `v0.4.1` tag, and publishing the GitHub release from `docs/releases/v0.4.1.md`, which the maintainer does once this has shipped.
- The fixes planned for 0.4.2 (0213 to 0225, released by 0226).

## Notes
- Asked for 2026-10-15, for patch release 0.4.1. Follows 0210 (0.4.0) and 0106 (0.3.0).
- Waits for every ticket planned for this release (0227 to 0235, and 0237), so they're in it. Changes for speck's own test suite only (0229 to 0234) belong under a short heading for people working on speck, or are left out of the release notes.
- After it ships: tag `v0.4.1`, then `gh release create v0.4.1 --verify-tag --title "speck 0.4.1" --notes-file docs/releases/v0.4.1.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
