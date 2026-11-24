---
id: "0713"
title: "Show that speck is checking a question in the app"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-show-that-speck-is-checking-a-question-in-the-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0709"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T13:48:38.552Z"
blocked_at: ""
waited_seconds: 21
approved: "2026-11-24T14:24:10.975Z"

---
# 0713 · Show that speck is checking a question in the app

**Status:** 👍 approved

## Problem
While speck's watch agent is about to check a blocked question in the running app, the ticket says "Waiting for you" and counts under Needs you, though speck may carry on by itself. You may check it by hand for nothing.

## Outcome
Such a ticket says speck is checking it in the app, and counts under Needs you only once the agent asks you.

## Acceptance criteria
1. While speck's watch agent is checking, or will check, a blocked ticket's question in the running app, the ticket's card, its full view and `speck status` say that speck is checking it in the app, not "Waiting for you".
2. Such a ticket isn't counted under Needs you, in the bridge's Needs you, or in `speck status`'s list of what waits for you.
3. Once the agent has asked you, or when speck won't check it (`watch` off or `tell`, a high-risk ticket, or the check already done for this question with no action), the ticket reads "Waiting for you" and counts under Needs you, as today.
4. No test that passed before this change fails.

## Out of scope
- How the check itself runs (0636, 0651).

## Notes
- `fixable`/`decidable` in `scripts/foreman.mjs` exclude questions with a Check in the app line, so `foreman_will` is false for them. The agent's queue (`appCheckable`, `s.checked` in `scripts/foreman-agent.mjs`) never reaches the board.
- Waits for the ticket that keeps a ticket waiting on its base ticket out of Needs you: both change `buildGroup`, `doingNow` and the Needs you counts.
- Failing before this build: none
- Found failing on the base branch during this build, outside the recorded quick result: test/panel-0469.test.mjs (both its 390 px and 600 px tests, on the Plan card's chain facts). Checked on the base commit without this change: it fails the same way there, so it's left unchanged.
- Self-check: no changes (checked an empty or missing watch-agent record, a built-in name as the ticket's id, and a check already made for an earlier question; each has a test)
- Went with the recommendation: Keep today's behaviour with watch off (chosen by speck, as watch is decide, 2026-11-24 14:21 UTC).

## In plain words
When a build stops on a question it wants checked in the running app, and speck is going to check it for you, the ticket now says "speck is checking it in the app" instead of "Waiting for you". Its card sits under Building rather than Needs you, and the header, the bridge and `speck status` don't count it as waiting for you. Once speck has asked you something, or checked and left it to you, or won't check it at all (watch off or tell, or a high-risk ticket), it reads "Waiting for you" again as before.

To see it, set watch to fix or decide and look at a low-risk ticket blocked on a question with a Check in the app line. Worth knowing: while speck run is off, such a ticket still says speck is checking it, as tickets speck will decide for do; nothing happens until speck run is on again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
With watch set to off, should a blocked question that asks for a check in the app keep today's behaviour, where its card reads Waiting for you and sits under Needs you in the Build lane but the header's count and the bridge leave it out (as they do every blocked question while watch is off), or should it be counted there too? I recommend keeping today's behaviour: the criterion says "as today", and counting only these questions would make watch off treat them differently from every other blocked question.

Recommended: Keep today's behaviour with watch off
Other options: Count it in the header and the bridge with watch off, for these questions only; Count every blocked question there with watch off (a wider change than this ticket)
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): escalate: F1 Criterion 3 requires watch-off tickets to count under Needs you, while the existing watch-off contract explicitly excludes them.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 397,528
- Elapsed since build started: 36 min
- Changed lines: 63 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - While speck run is off, a ticket speck would check in the app still says speck is checking it. Skipped as a duplicate of speck/ideas/2026-10-18-foreman-will-take-it-while-speck-run-is-off.md (dropped), which covers the same for recommendations speck will take.
  - test/panel-0469.test.mjs fails on the base branch (Plan card's chain facts under mouse vs touch). Skipped as covered by fix ticket 0735.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9c0e784bb1d6f51c90a62b4a995362dc22e90c6f",
    "session": "fresh",
    "thread_id": "01a20dee-0128-7db1-95bf-2dc454834cea",
    "builder_response": "- Tests run: test/app-check-0713.test.mjs test/panel-0159.test.mjs test/panel-0469.test.mjs test/panel-0476.test.mjs test/panel-0517.test.mjs\n\nRound 1.\n\n- First I ran `speck test --related test/app-check-0713.test.mjs` once (496 files, since nearly every test names scripts/speck.mjs; full output kept at /tmp/speck-0713-related.txt). Five tests failed there, all real-browser ones: 0159 AC3 (took 5239 ms), 0476 AC2 (timed out on a flick), 0517 AC3 (frame timings), and both 0469 layout tests. The machine's load average was 52–76 during the run.\n- I then ran the files it named plus this ticket's own (the attached output). 0159, 0476 and 0517 pass: their failures were load. Both 0469 tests still fail, on the Plan card's chain facts (`span.chain-item > button.chain-id` sizes under mouse vs touch), which this ticket doesn't touch.\n- I checked 0469 on the base commit (87966b1e) in a throwaway detached worktree, without this change: both tests fail there the same way. So it's failing on the base branch already, outside the recorded quick result. It's noted in the ticket's Notes and left unchanged.\n- Pictures of the card and full view, in the light and dark looks, are kept with the review pack.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 273884,
      "cached_input_tokens": 219648,
      "cache_write_input_tokens": 0,
      "output_tokens": 1176,
      "reasoning_output_tokens": 135
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54236,
      "cached": 219648,
      "write": 0,
      "output": 1176
    },
    "cost_usd": 0.1421968,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:21:10.448Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "appChecking in scripts/app-check.mjs supplies the state used by the card, full view and CLI. The seven passing 0713 tests include display checks and integration with the actual agent queue."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "buildGroup, foremanView and projectSummary exclude app-checking tickets. Passing test '0713 AC2' exercises all three counts."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "Passing 0713 tests cover asking the user, completed checks, tell and high risk. However, foremanView and projectSummary explicitly exclude blocked questions when watch is off. A direct check returned status 'Idle' and needs_you 0, conflicting with this criterion's counting requirement but preserving the existing setting's documented behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported targeted tests pass except the two unchanged 0469 layout tests, reproduced by the builder on the base commit. The reviewed change does not touch their chain layout behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; scripts/panel-summary.mjs; test/app-check-0713.test.mjs",
        "issue": "Criterion 3 requires watch-off tickets to count under Needs you, while the existing watch-off contract explicitly excludes them. The implementation retains that exclusion. Tests check that off disables app_checking but never check its resulting Needs you counts.",
        "suggested_fix": "Resolve the intended watch-off behaviour with the owner, then align criterion 3 and add a test covering the agreed counts.",
        "state": "open"
      }
    ],
    "escalation_question": "With watch set to off, should blocked app-check questions count under Needs you, or should the existing exclusion remain?",
    "summary": "Tickets now show when speck is checking their question and stop counting as needing your attention until the check finishes or asks you. The tests cover these transitions. One product decision remains: the ticket asks for watch-off questions to count under Needs you, contrary to the existing setting's behaviour."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "109fd3bb3935faeb4237f520c8df06c95520e433",
    "session": "continued",
    "thread_id": "01a20dee-0128-7db1-95bf-2dc454834cea",
    "builder_response": "- Tests run: test/app-check-0713.test.mjs test/panel-0469.test.mjs\n- F1: fixed. The question was answered: keep today's behaviour with watch off (recorded in the ticket's Notes, \"Went with the recommendation: Keep today's behaviour with watch off\"). So with watch off, AC3's \"counts under Needs you, as today\" means what it does today: the card reads Waiting for you under Needs you in the Build lane, and the header's count and the bridge leave it out as they do every blocked question while watch is off. No code change was needed. I added the test '0713 AC3: with watch off …' in test/app-check-0713.test.mjs, which checks app_checking is false, the Build lane's Needs you group, the full view's Waiting for you line, the header word, the bridge's needs_you, that it's counted the same as any other blocked question, and `speck status`'s line.\n- test/panel-0469.test.mjs still fails both its tests, as it does on the base commit without this change (round 1's response); it's unchanged.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 395818,
      "cached_input_tokens": 333184,
      "cache_write_input_tokens": 0,
      "output_tokens": 1710,
      "reasoning_output_tokens": 144
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8398,
      "cached": 113536,
      "write": 0,
      "output": 534
    },
    "cost_usd": 0.0334896,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:23:49.641Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "appChecking feeds the card, full view and CLI through statusData and foremanBoard. Passing 0713 AC1 tests verify the wording and actual agent queue transitions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "buildGroup, foremanView and projectSummary exclude checking tickets. Passing 0713 AC2 tests exercise the Build lane, header and bridge counts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0713 tests cover agent questions, completed checks, tell and high risk. The recorded decision preserves existing watch-off behaviour; the new passing test verifies Waiting for you in the Build lane and CLI, with exclusion from header and bridge counts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "All eight 0713 tests pass. The two unchanged 0469 layout failures were reported as reproduced on the base commit; no regression attributable to this change was identified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman.mjs; scripts/panel-summary.mjs; test/app-check-0713.test.mjs",
        "issue": "The ambiguity about watch-off counting is settled by the recorded decision to preserve existing behaviour. The added test exercises that behaviour across the relevant displays and counts.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Tickets now show when speck is checking their question and stay out of Needs you until user input is required. Tests cover the transitions and preserve the agreed watch-off behaviour. No blocking concerns remain; the two existing layout test failures are unrelated."
  }
}
```

</details>
