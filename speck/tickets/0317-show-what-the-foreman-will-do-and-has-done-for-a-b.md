---
id: "0317"
title: "Show what the Foreman will do and has done for a blocked ticket"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0308", "0309"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:36:46.607Z"
approved: "2026-10-18T22:49:21.083Z"

---
# 0317 · Show what the Foreman will do and has done for a blocked ticket

**Status:** 👍 approved

## Problem
With the Foreman's Fixing set to `fix`, a blocked ticket looks the same as one waiting for you, though the Foreman is about to take its recommendation, and once it has, the panel doesn't say so: it's only in the ticket's Notes and speck run's log. On 2026-10-18, 0305 showed as blocked and then carried on, with nothing on the board to say why. Its Notes also said "chosen by the user in the panel", which may not be how it was chosen.

## Outcome
The panel shows whether the Foreman's Fixing is on, what it will do about each blocked ticket, and what it has done.

## Acceptance criteria
1. The Foreman's status in the header shows when Fixing is `fix`, for example "Fixing on" beside its status word, and its detail says which setting Fixing has.
2. A blocked ticket whose question the Foreman will answer (Fixing is `fix`, the question doesn't change what you'd notice, the recommendation is a clear winner, and the Foreman hasn't answered it before) says on its card that the Foreman will take its recommendation, instead of waiting for you. Any other blocked ticket says it's waiting for you.
3. When the Foreman has taken a recommendation, the ticket's card says "The Foreman went with the recommendation" with the option and the time, until the ticket moves on, and the Foreman's detail lists what it has taken in the last 24 hours. `speck status` shows the same.
4. A recommendation is recorded as chosen by the Foreman when the Foreman chose it and by you only when you pressed the button. Each is shown as such.

## Out of scope
- Answering the Foreman agent's own questions: 0318.

## Notes
- From `speck/ideas/2026-10-18-show-what-the-foreman-answered.md` (inbox, from 0286) and the user's report on 0305. Taking a recommendation is in `scripts/go-with.mjs` (`FOREMAN_CHOSE`); the status is `scripts/foreman.mjs` and `templates/panel.html`.
- Failing before this build: none
- 0305 (the report in Problem): its question said "Changes what you'd notice: yes", so the Foreman couldn't take it, and its run record has no `by`, so the choice came from the panel's button, and its Notes were right. goWith already recorded the Foreman's choices as the Foreman's (0286); this build makes the panel pass `by: 'user'` itself and has goWith refuse any other `by`, so a choice is never put down to you by default.
- "Until the ticket moves on": the card shows who went with the recommendation while the ticket is building or reviewing and hasn't been approved since the choice. The Notes give the time to the minute, so a choice made in the same minute as an approval counts as before it.
- The Foreman will take a recommendation only when speck run could resume the build too (goWith refuses otherwise), so the card says it's waiting for you then. A blocked ticket the Foreman will take isn't counted under Needs you.
- Two earlier tests (0053 AC4, 0069 AC2) expected the blocked card's line as "Answer the question, then run /speck-build <id>"; it now starts "Waiting for you. ", and their expected text is updated to match.
- Self-check: the header passed null to replaceChildren when Fixing wasn't fix, which a browser shows as the word "null": fixed. The blocked card's progress line said "it has a question for you" on a ticket the Foreman will take: it now says the Foreman will take its recommendation.

## In plain words
When the Foreman is set to answer questions itself, the panel now says so: "Fixing on" sits beside its status at the top, and opening it says what that setting does. Each blocked ticket says either that the Foreman will take its recommendation or that it's waiting for you, and only the ones waiting for you count under Needs you. Once a recommendation has been taken, the ticket says who took it, the Foreman or you with the button, which option and when, until the ticket is approved. The Foreman's detail lists what it took in the last day, and `speck status` shows all of this too.

To see it, set the Foreman's Fixing to fix in Settings and look at a blocked ticket. Worth knowing: while speck run is off, a ticket can still say the Foreman will take it, though nothing happens until speck run is on. On 0305, the record was right: its question changed something you'd notice, so the Foreman couldn't take it, and it was the button that did.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 240,595
- Elapsed since build started: 13 min
- Changed lines: 140 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): speck/ideas/2026-10-18-foreman-will-take-it-while-speck-run-is-off.md, a blocked card says the Foreman will take its recommendation even while speck run is off.
- Known limit: the Notes give a choice's time to the minute, so a choice made in the same minute as an approval is taken to be before it, and the card doesn't show it.

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
    "reviewed_sha": "84cafd5350bedc66c679adddc624237eca15328f",
    "thread_id": "01a15133-f03a-71a3-b973-091d2c77d826",
    "seconds": 25,
    "usage": {
      "input_tokens": 239689,
      "cached_input_tokens": 186112,
      "cache_write_input_tokens": 0,
      "output_tokens": 906,
      "reasoning_output_tokens": 257
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:49:05.568Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html render() and renderForeman() show Fixing on and its setting. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/foreman-took.mjs foremanFacts() checks eligibility, previous choices and resumability; queueItem() renders the corresponding message. All four AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanFacts() controls choice visibility; foremanView() collects recent choices; panel rendering and foremanTicketLines() show option and time. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The panel explicitly passes by: 'user'; foremanFixQueue() passes by: 'foreman'. Notes attribution is parsed and displayed in the panel and status output. Both AC4 tests passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now shows when Fixing is on, which blocked tickets the Foreman will handle, and who took each recommendation and when. The command-line status shows the same information. The tests exercise these behaviours and reported 182 passes, no failures and three skips. No blocking issues found."
  }
}
```

</details>
