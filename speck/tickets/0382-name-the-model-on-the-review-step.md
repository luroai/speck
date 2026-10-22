---
id: "0382"
title: "Name the model on the review step"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-name-the-model-on-the-review-step.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0381"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:45:50.514Z"
approved: "2026-10-22T22:48:51.936Z"

---
# 0382 · Name the model on the review step

**Status:** 👍 approved

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
- Failing before this build: none
- Self-check: no changes

## In plain words
While a ticket is in review, its card on the board now names the model doing the review, written just as it is in the settings, for example "grok-4.7-high is reviewing · round 2". If no model is set for the ticket or for the project, the card names the reviewer as before, such as "Codex is reviewing". While the builder fixes the reviewer's findings, the card still names the builder. To see it, set a reviewer model in Settings and watch a ticket's card while it's being reviewed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 86,954
- Elapsed since build started: 3 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "aac31cd168efef1a2482311014312ea7bd4b8643",
    "thread_id": "01a165cd-22ec-7c62-9b8e-bcd858e6a28e",
    "seconds": 18,
    "usage": {
      "input_tokens": 86405,
      "cached_input_tokens": 51328,
      "cache_write_input_tokens": 0,
      "output_tokens": 549,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T22:48:42.841Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html doing() uses review_model without capitalising it in both reviewing paths. The passing 0382 AC1 panel test checks model names and round numbers; the statusData test checks ticket-model precedence."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData() resolves review_model through core.mjs reviewerSettings(), also used by review execution. Passing 0382 AC2 tests check config fallback, both models blank, reviewer-family fallback and no reviewer set."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "doing() retains round numbers and the existing builder-fixing branch. The passing 0382 AC3 test checks that round 2 findings still name Claude as the builder."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded targeted run reports 145 passed, 3 skipped and no failures across 148 tests. No existing tests were changed, and the production diff is confined to resolving and displaying the review model."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Reviewing cards now show the configured model exactly as named, with the round number. Reviewer-name fallbacks and builder-fixing messages are preserved. The targeted tests passed, and I found no blocking issues."
  }
}
```

</details>
