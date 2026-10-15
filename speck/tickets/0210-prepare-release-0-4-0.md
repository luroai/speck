---
id: "0210"
title: "Prepare release 0.4.0"                # one outcome, no "and"
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
after: ["0198", "0199", "0200", "0201", "0202", "0203", "0204", "0205", "0206", "0207", "0208", "0209", "0211", "0212"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:58:43.144Z"

---
# 0210 · Prepare release 0.4.0

**Status:** 🔨 building

## Problem
Over 70 tickets have shipped since the `v0.3.0` tag on 11 October, including speck run's ship queue, testing the merged result before a ship, retrying chance test failures and the fixes for leaked processes. Anyone following the README's setup prompt still gets 0.3.0.

## Outcome
speck is ready to be released as 0.4.0.

## Acceptance criteria
1. `package.json` has version `0.4.0`, and `speck init` prints `speck 0.4.0`.
2. `CHANGELOG.md` has a 0.4.0 section above the 0.3.0 one. It describes, in plain English and under a few headings, what someone using speck can do or will notice that's new since the `v0.3.0` tag, from the tickets shipped since. The 0.3.0 section is unchanged.
3. The README's setup prompt names `v0.4.0`, and the README's and the brief's status lines say 0.4.0, a public preview.
4. The brief's principle 7 describes how builds and shipping work in this release: builds end at approved, one ship queue in `speck run` ships tickets one at a time, and `max_parallel_builds` sets how many builds run at once (1 unless changed).
5. No test that passed before this change fails. The test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.4.0.
6. `docs/releases/v0.4.0.md` holds the notes for the GitHub release page, written for someone deciding whether to try speck or upgrade: one short paragraph on what speck is and what this release is about, the three to five changes that matter most and why, how to install it (the setup prompt's command), what changes for someone upgrading from 0.3.0 (including that only `speck run` ships auto-ship tickets now, so it must be on), and a link to the full 0.4.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
7. The README's "Built with speck" figures (tickets shipped and cancelled, the median time from a build starting to its ticket shipping, and the median review rounds with how many were approved first time) are worked out again from `speck/tickets/done/` as it is when this is built, the same way as before, and match it.

## Out of scope
- Creating and pushing the `v0.4.0` tag, and publishing the GitHub release from `docs/releases/v0.4.0.md`, which the maintainer does once this has shipped.
- The jobs design (planned for 0.5.0).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Follows the release process in the brief's "Releases" section and 0106 (0.3.0).
- Waits for every ticket planned for this release, so they're in it.
- The tag goes on straight after this ships, since until then the README points at a tag that doesn't exist yet. Then the GitHub release: `gh release create v0.4.0 --verify-tag --title "speck 0.4.0" --notes-file docs/releases/v0.4.0.md`.
- Checked 2026-10-15: the repo has tags `v0.2.0` and `v0.3.0` but no GitHub releases yet (`gh release list`), so this is the first release page.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
