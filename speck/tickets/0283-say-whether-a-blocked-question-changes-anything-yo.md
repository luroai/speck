---
id: "0283"
title: "Say whether a blocked question changes anything you'd notice"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0290", "0293"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:25:31.161Z"
approved: "2026-10-18T12:28:47.890Z"

---
# 0283 · Say whether a blocked question changes anything you'd notice

**Status:** 👍 approved

## Problem
When a build blocks, its question gives the options and a recommendation, but nothing says whether the choice changes anything the user would notice, or whether the recommendation is a clear winner or a judgement call. So every blocked ticket waits for the user, even though none has ever needed a product decision: on 2026-10-17, 0274 blocked on a test 0270 left behind, and the user just took the recommendation.

## Outcome
Every blocked question says, in a form speck can read, which option the build recommends, whether any option changes what the user would notice, and whether the recommendation is a clear winner.

## Acceptance criteria
1. The build skill (`skills/speck-build/SKILL.md`) has a build that blocks record three things with its question: the option it recommends, whether any option changes something the user would notice (what speck does, shows or ships), and whether the recommendation is a clear winner or the options are close. (checked by review)
2. speck keeps those three on the blocked ticket where programs can read them, and `speck status --json` gives them for each blocked ticket.
3. A ticket blocked without them still blocks and reads as it does today, with the three given as unknown.
4. The panel shows, on a blocked ticket's question, "Changes what you'd notice" or "Doesn't change what you'd notice", and "Clear recommendation" or "Close call", and nothing for an unknown.

## Out of scope
- Acting on them: 0284 (from the panel) and 0286 (the Foreman).

## Notes
- First step of `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`.
- Blocking is in `/speck-build` sections 5 and 6, and `speck set <id> status blocked`. speck run writes a blocked question itself in `scripts/run.mjs` (search for "Blocked question").
- Failing before this build: none
- Self-check: a yes or no value such as `constructor` is now read as unknown, not as a built-in name; the panel shows the facts on a blocked ticket even when its section holds nothing but them.
- The three are written as lines under `## Blocked question` (`Recommended:`, `Changes what you'd notice:`, `Clear winner:`). `speck status --json` gives them as `blocked_recommendation`, `blocked_noticeable` and `blocked_clear`, null when unknown, and leaves them out of `blocked_question`. The text `speck status` still prints the whole section.

## In plain words
When a build stops to ask you something, it now also says which option it recommends, whether any of the options would change something you'd notice, and whether its pick is a clear winner or a close call. On a blocked ticket in the panel, under its question, you'll see "Changes what you'd notice" or "Doesn't change what you'd notice", and "Clear recommendation" or "Close call". Questions asked before this change look just as they did, with neither label. This only shows the information: nothing acts on it yet. That comes in the next tickets.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 94,956
- Elapsed since build started: 3 min
- Changed lines: 63 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The text `speck status` still prints a blocked question's three fact lines along with the question. That's harmless, but it could show them as words like the panel does.
- A build stopped from the panel or with `speck stop` gets a "Stopped by you" question with all three facts unknown, which is right, because there's nothing to choose.

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
    "reviewed_sha": "d6bad70aa775a65c59d53737d68844f2467f44f6",
    "thread_id": "01a14efb-fda9-77b3-88a7-bf370604f7b9",
    "seconds": 19,
    "usage": {
      "input_tokens": 94290,
      "cached_input_tokens": 56192,
      "cache_write_input_tokens": 0,
      "output_tokens": 666,
      "reasoning_output_tokens": 20
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:28:38.176Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 6 step 1 specifies all three machine-readable lines and defines noticeable changes and a clear winner. The shipping-block instructions also reference these lines."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/question-facts.mjs reads the stored section lines; scripts/speck.mjs statusData exposes blocked_recommendation, blocked_noticeable and blocked_clear. Passing AC2 test exercises ticket storage and statusData, which status --json serialises."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests verify existing questions retain their text and blocked status, with missing facts null. Invalid values remain in the question. The text status path still reads the original section."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html questionFacts and queueItem display the required labels only for known booleans. Passing AC4 test exercises both values, unknown and partially known facts, and a section containing only facts."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Blocked questions now record the recommended option, whether the choice affects anything users notice, and how clear the recommendation is. The panel displays the two new labels, while older questions remain supported. The reported tests pass, and I found no blocking issues."
  }
}
```

</details>
