---
id: "0125"
title: "Describe speck the same way everywhere"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T14:27:44.427Z"

---
# 0125 · Describe speck the same way everywhere

**Status:** 👍 approved

## Problem
speck describes itself in different words in different places. `package.json` and `speck help` say "small tickets, independent review, you merge", where the README says "You ship". `speck help` says `speck doctor` checks GitHub, which speck no longer needs. And `speck init`'s next steps describe an older way of working: typing `/speck-capture` and shipping each ticket by hand, with no mention of `speck run` or the panel. A first-time user gets a different picture from each.

## Outcome
`package.json`, `speck help` and `speck init` describe speck the same way the README does.

## Acceptance criteria
1. `package.json`'s description and the first line of `speck help` use the README's tagline, "Small tickets. Independent review. You ship.", and nothing in either says "you merge".
2. `speck help` describes `speck doctor` by what it checks today (git, the builder and the reviewer), without saying GitHub is needed.
3. `speck init`'s next steps describe today's workflow in plain words: shape tickets with `/speck-ticket`, set them ready, start `speck run` to build them one at a time, and follow along in `speck panel`. Approved tickets ship with `/speck-ship`, or by themselves when `auto_ship` is on.
4. No test that passed before this change fails, apart from tests that check the old wording, which check the new wording instead.

## Out of scope
- The README and the brief, already up to date.
- The setup skill's own wording.

## Notes
- Failing before this build: none
- Self-check: narrowed init's auto_ship line to tickets whose risk is in auto_ship_risk (the default covers only low risk), and tested it

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,004
- Elapsed since build started: 5 min
- Changed lines: 17 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "d413e0030618311fd8d8fd11088ca8ea4db36e07",
    "thread_id": "01a12b60-ae02-7590-b060-82edd94b4ff8",
    "seconds": 28,
    "usage": {
      "input_tokens": 82441,
      "cached_input_tokens": 62080,
      "cache_write_input_tokens": 0,
      "output_tokens": 563,
      "reasoning_output_tokens": 0
    },
    "saved_at": "2026-10-11T14:32:27.039Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json description and scripts/speck.mjs HELP use the README tagline. Directly running help confirms it. Passing test '0125 AC1' checks both and rejects 'you merge'."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs HELP describes Node.js, git, builder and reviewer checks, consistent with scripts/install.mjs doctor checks. Passing test '0125 AC2' exercises help and excludes GitHub from its doctor line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/install.mjs next steps cover shaping tickets, setting ready, sequential builds with run, following panel, manual shipping and automatic shipping restricted by auto_ship_risk. Passing test '0125 AC3' invokes init and checks its actual output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0125-tests.txt: 1109 tests, 1106 passed, 3 skipped, zero failures. Existing tests were not changed or weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The package description, help and installation guidance now describe the same workflow. The guidance accurately explains automatic shipping eligibility. Tests exercise the actual command output, and the full suite has no failures. The change stays within scope and is ready for the owner's merge decision."
  }
}
```

</details>
