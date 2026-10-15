---
id: "0226"
title: Prepare release 0.5.1                # one outcome, no "and"
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
after: ["0213","0214","0215","0216","0217","0218","0219","0220","0221","0222","0223","0224","0225","0236"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0226 · Prepare release 0.5.1

**Status:** 📝 draft

## Problem
The 0.5.1 tickets fix problems in what 0.4.0 shipped: the ship queue's messages, stopping and restarting builds, build timers, the reviewer's test summary, review packs and the panel. Anyone following the README's setup prompt still gets 0.5.0 without them.

## Outcome
speck is ready to be released as 0.5.1.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `package.json` has version `0.5.1`, and `speck init` prints `speck 0.5.1`.
2. `CHANGELOG.md` has a 0.5.1 section above the 0.5.0 one. It describes, in plain English and under a few headings, what someone using speck will notice is fixed or changed since the `v0.5.0` tag, from the tickets shipped since. The 0.5.0 and 0.4.0 sections are unchanged.
3. The README's setup prompt names `v0.5.1`, and the README's and the brief's status lines say 0.5.1, a public preview.
4. `docs/releases/v0.5.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release of fixes to what 0.4.0 shipped, the three to five fixes that matter most, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.5.0, and a link to the 0.5.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0210 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.1.

## Out of scope
- Creating and pushing the `v0.5.1` tag, and publishing the GitHub release from `docs/releases/v0.5.1.md`, which the maintainer does once this has shipped.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-15, for patch release 0.5.1. Follows 0210 (0.4.0) and 0106 (0.3.0).
- Waits for every ticket planned for this release (0213 to 0225), so they're in it.
- After it ships: tag `v0.5.1`, then `gh release create v0.5.1 --verify-tag --title "speck 0.5.1" --notes-file docs/releases/v0.5.1.md`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
