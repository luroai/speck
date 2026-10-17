---
id: "0262"
title: "Make the README tests pass again after the README revision"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T07:03:30.339Z"

---
# 0262 · Make the README tests pass again after the README revision

**Status:** 🔨 building

## Problem
Seven README tests fail on main, so `speck ship` refuses every approved ticket, 0257 included, and nothing can ship. They started failing after the README was revised on GitHub (commit 1041577, merged into main as 9ffa622). The failing tests are 0249 AC1, 0250 AC1, 0251 AC1, AC2, AC3 and AC5, and 0255 AC1. 0250 AC1 and 0255 AC1 expect the README's plain line to read "…the same way every time, so you can set them going, walk away and trust what you come back to." but it now ends at "every time.". 0249 AC1 says "the picture comes after the opening paragraph", and the 0251 tests say "the plain line comes before the image".

## Outcome
main's whole test suite passes again, and the README keeps what the revision on GitHub meant to say.

## Acceptance criteria
1. On main, `test/readme-0249.test.mjs`, `test/readme-0250.test.mjs`, `test/readme-0251.test.mjs` and `test/tagline-0255.test.mjs` all pass.
2. The README's opening keeps the intent of the revision in commit 1041577. Where a test checks wording or an order that the revision changed on purpose, the test is updated to the new README and says so in a comment, rather than the README being put back as it was.
3. No test is deleted or skipped to get there, and no other test starts failing.

## Out of scope
- Any other change to the README.
- Changes outside the README and these four test files.

## Notes
- The seven tests above failed in the full run recorded for main at 9ffa622 on 2026-10-17. Fixing them is this ticket's whole purpose.
- Which side to change, the README or a test, depends on what the revision meant. Read `git show 1041577` before changing either.
- Failing before this build: 0249 AC1, 0250 AC1 (the README opens with the tagline…), 0251 AC1, AC2, AC3 and AC5, and 0255 AC1. The recorded result for 9ffa622 failed (exit code 1); its saved output is cut short, so these seven come from running the four README test files. They are this ticket's subject, so unlike other failures from before a build they are fixed here, as the ticket's Notes say.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
