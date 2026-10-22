---
id: "0382"
title: "Name the model on the review step"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-name-the-model-on-the-review-step.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0381"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0382 · Name the model on the review step

**Status:** 📋 ready

## Problem
While a ticket is being reviewed, its card says "Cursor is reviewing" or "Claude is reviewing". That names the family. When a model is set, it hides the model that is actually reviewing.

## Outcome
A ticket being reviewed names the model that is reviewing it.

## Acceptance criteria
1. While a review round is running, or the ticket is in review and the builder is not fixing findings, the card's sentence names the model the review runs on, as that model is written, then "is reviewing · round N". A ticket whose `reviewer_model` is `grok-4.7-high` says "grok-4.7-high is reviewing · round 2", and does not say only "Cursor" or "Claude".
2. When the ticket's `reviewer_model` is blank, the sentence names `speck/config.yml`'s `reviewer_model` instead. When that is blank too, the sentence stays as it is today and names the reviewer, such as "Codex is reviewing · round 1", or "The reviewer is reviewing · round 1" when no reviewer is set.
3. The round number stays. While the builder is fixing a round's findings, the sentence still names the builder, as it does today.
4. No test that passed before this change fails, except a check that a reviewing card names the reviewer family while a model is set, which is changed to check criterion 1.

## Out of scope
- Naming the builder's model while it builds or fixes findings.
- How Settings lays out the reviewer and its model: 0381.

## Notes
- Checked 2026-10-22: `doing` in `templates/panel.html` builds the sentence from `t.reviewer` (`name(t.reviewer, 'the reviewer') is reviewing · round N`), which is the family. `reviewerSettings` in `scripts/core.mjs` picks the ticket's `reviewer_model` when it isn't blank, otherwise `speck/config.yml`'s, and null when both are blank. `statusData` in `scripts/speck.mjs` spreads the ticket's frontmatter, so the card has the ticket's `reviewer_model`, not the config's when the ticket's is blank.
- The model is shown as written. It is not capitalised the way the family name is ("Cursor").
- Waits for 0381, which changes `templates/panel.html`. 0375 waits for this, so it ships in 0.13.0.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
