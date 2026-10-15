---
id: "0222"
title: "Say in the plain pack when the reviewer couldn't see the code"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-12-say-in-the-plain-pack-when-the-reviewer-couldn-t-see-the-code.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0215"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:20:05.089Z"

---
# 0222 · Say in the plain pack when the reviewer couldn't see the code

**Status:** 🔨 building

## Problem
When a reviewer couldn't look round the project in a review round and judged the change from the diff alone, the full review pack warns about it but `speck pack <id> --plain` doesn't. The readers of the plain pack are the ones who can't check the code themselves, so they most need to know the review was done half-blind.

## Outcome
The plain pack says when the reviewer couldn't see the rest of the code.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When any review round of a ticket was done without the reviewer being able to look round the project (a round the full pack marks "Reviewer could not inspect the repo"), `speck pack <id> --plain` includes the sentence "In at least one review round, the reviewer could only see the change itself, not the rest of the code."
2. The sentence appears once, however many rounds it applies to, and doesn't appear when the reviewer could look round the project in every round.
3. No test that passed before this change fails.

## Out of scope
- Changing the full pack's warning.
- Detecting this for reviewers other than Codex, which is the only one that records it today.

## Notes
- `plainPack()` in `scripts/pack.mjs` reads only the latest round today; the full pack checks every round's `sandbox_ok`.
- 0131's tests limit the plain pack: no paths, models or tokens, and exactly one sentence matching `risk`, `sensitive` or `closer look`. The sentence in AC1 uses none of those words.
- The note's open question is settled as any round, as the full pack does.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
