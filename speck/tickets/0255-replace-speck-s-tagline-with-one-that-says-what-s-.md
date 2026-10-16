---
id: "0255"
title: "Replace speck's tagline with one that says what's different"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:40:42.823Z"

---
# 0255 · Replace speck's tagline with one that says what's different

**Status:** 🔨 building

## Problem
speck's tagline, "Your judgement, at agent speed.", only makes sense once you know there are agents doing the work and that you keep two decisions. Someone with no context, such as a reader of the README or a hiring team, can't tell what speck is or why it's different from a plain coding agent.

## Outcome
speck's tagline says what's different about it, the same way everywhere in this repo: the README, `speck help` and `package.json`.

## Acceptance criteria
1. Under the `# speck` heading, the README opens with the tagline **Ship code you can't read, and still trust it.** followed by this plain line: "speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time, so you can set them going, walk away and trust what you come back to." The old tagline "Your judgement, at agent speed." no longer appears in the README.
2. The first line of `speck help`, the comment at the top of `scripts/speck.mjs` and the `description` in `package.json` use the new tagline in place of "Your judgement, at agent speed.", which none of them contains any more.
3. No test that passed before this change fails, apart from tests that check the old tagline, which check the new one instead.

## Out of scope
- The rest of the README's opening (0251) and its sections' first sentences (0256).
- The landing page (speck-site repo), which still has the old tagline.

## Notes
- Split from 0251 on 2026-10-16. Tagline and plain line chosen by the maintainer on 2026-10-16: use them word for word. The tagline's point is what a plain agent session doesn't give you: a second AI checks every change against agreed criteria, the same way every time, so a non-coder can trust work they can't read.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
