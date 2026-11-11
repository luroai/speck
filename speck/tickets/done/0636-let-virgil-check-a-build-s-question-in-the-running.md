---
id: "0636"
title: "Let speck check a build's question in the running app"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-virgil-checks-the-work-in-the-running-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0634","0635"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:36:54.947Z"
approved: "2026-11-11T11:50:00.241Z"
finished: "2026-11-11T11:52:16.422Z"

---
# 0636 · Let speck check a build's question in the running app

**Status:** ✅ done

## Problem
Builds often block with "check this in the app yourself" or "log in and check", and you go with the recommendation almost every time. Each one stops the ticket until you're back, for a check an agent can do by starting the app, signing in and taking screenshots.

## Outcome
With `watch: decide`, or `fix` for a check that clearly passes, speck checks a build's question in the running app itself, carries on and tells you what it saw, with its screenshots in the review pack.

## Acceptance criteria
1. The build skill asks the user to check something in the app only as a blocked question with a `Check in the app: <what to look at>` line beside its other facts, and the ticket's full view and `speck status --json` give that line.
2. With `watch: decide` and `commands.start` set, `speck run` starts its watch agent for a low-risk blocked ticket with that line, once per question, and its brief says to start the app with `speck app`, sign in with `speck logins` when it needs to, keep a screenshot of each thing it checked with `speck picture` and then take one action. It goes with the build's recommendation when what it saw agrees with it, and otherwise asks you, saying what it saw.
3. With `watch: fix`, the agent may go with the recommendation only when it judges that the check clearly passes; anything else it asks you about.
4. Whatever it does, it stops the app it started, its action's line in the ticket's Notes says what it checked and what it saw, and the review pack shows its screenshots with their captions.
5. With `watch: tell` or `off`, high risk or `commands.start` blank, the question waits for you as it does today.

## Out of scope
- Checking the app before a build blocks, such as a check in every build.

## Notes
- Decided 2026-11-11: speck makes the call with `decide`; with `fix` it only passes a check that clearly passes.
- Question facts are in `scripts/question-facts.mjs`; the watch agent's brief and actions in `scripts/foreman-agent.mjs` and `skills/speck-watch/SKILL.md`; `speck picture` keeps pictures (0294).
- After 0634 (`speck app`) and 0635 (`speck logins`).
- Failing before this build: none
- Read as: a question with a `Check in the app:` line is never taken unchecked, so with `commands.start` blank (or tell, off, high risk) it waits for you even with watch: decide, rather than being taken blind.
- Self-check: a check's decide must name the build's own recommendation, and needs --saw; --saw is refused on any other run; the resume after a check with watch: fix says watch: fix rather than decide.

## In plain words
When a build wants something checked in the running app, it now says so on its question with a "Check in the app" line, which the ticket's page shows under the question. With watch set to decide or fix, and a start command for your app set, speck checks it itself on a low-risk ticket: it starts the app, signs in with a saved test login if it needs to, takes screenshots and either carries on with the build's recommendation or asks you, saying what it saw. With fix it only carries on when the check clearly passes. Its note in the ticket says what it checked and what it saw, the screenshots show in the review pack, and the app is stopped afterwards. Otherwise, such a question waits for you, even with decide. To see it, set `commands.start` and watch to decide, and let a build block on a visual question. Worth watching: while speck is checking, the ticket still says it's waiting for you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 foremanAction accepts a decision after the blocked question or requested app check has changed during the agent's run.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 325,911
- Elapsed since build started: 13 min
- Changed lines: 196 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): show that speck is checking a question in the app, rather than "Waiting for you" (speck/ideas/2026-11-11-show-that-speck-is-checking-a-question-in-the-app.md).
- Known limit: only Claude Code's check runs have a fixed tool list (speck, read-only git, Playwright's tools and headless Chromium/Chrome); Codex and Cursor runs run unsandboxed as their other watch runs do, kept to the rules by the brief and skill.
- Known limit: a check queued and then dropped (watch turned off meanwhile, or the config unreadable) isn't checked again for the same question.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6e37392ac02f408a45cb474d225144910d41107e",
    "session": "fresh",
    "thread_id": "01a1ca6f-d2b3-7913-a1b1-8bc172f0ce59",
    "builder_response": "- Tests run: `speck test --related test/app-check-0636.test.mjs` (the ticket's own test file, plus the 251 existing test files that name a changed file, and the repo's checks). All pass.\n- Read as: a question with a `Check in the app:` line is never taken unchecked by speck run's fix/decide check (fixable/decidable exclude it), so with tell, off, high risk or commands.start blank it waits for you even under watch: decide. Noted in the ticket's Notes.\n- A check run may only `decide` (only the build's own recommendation; with watch: fix too) or `ask`, and must say `--saw`. speck run stops the ticket's app (stopApp) once the agent ends, whatever it did. Claude Code's check runs may also use Playwright's tools or headless Chromium/Chrome to look at the app.\n- Pictures: two of the blocked ticket's full view with its new Check in the app line, light and dark.\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 197563,
      "cached_input_tokens": 139008,
      "cache_write_input_tokens": 0,
      "output_tokens": 883,
      "reasoning_output_tokens": 174
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58555,
      "cached": 139008,
      "write": 0,
      "output": 883
    },
    "cost_usd": 0.1398408,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:48:45.468Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "question-facts.mjs parses checkInApp; statusData exposes blocked_check_in_app; panel.js renders it. The AC1 tests passed, and the build skill requires this blocked-question format."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The queue and brief are covered by passing AC2 tests, but foremanAction does not verify that the current question matches the question the agent checked before accepting its decision."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkBrief and the watch skill limit watch: fix decisions to clearly passing checks. The AC3 test covers launching, deciding and resuming with watch: fix."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "finish invokes stopCheckApp after the agent ends; foremanAction records the check and observation in Notes. Passing AC4 tests cover cleanup invocation and captioned pictures; pack.mjs includes picturesLines."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "appCheckable excludes tell, off, high risk and missing commands.start; fixable and decidable exclude app-check questions. The corresponding tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "foremanAction accepts a decision after the blocked question or requested app check has changed during the agent's run. It compares the option with the current recommendation but never compares the current question with s.running.key. If the recommendation stays the same, an observation about the old check can resume the build on a new, unchecked question.",
        "suggested_fix": "Before accepting a check decision, require the ticket to remain blocked and its current question, app-check line and recommendation to match the running check's key. Refuse stale decisions without changing anything, and test a changed check with an unchanged recommendation.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change adds app checks, recorded observations and screenshot support, and the reported tests pass. One safeguard is missing: if the question changes while the agent checks it, the agent can carry on using an observation about the old question. Fix that before merge."
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
    "reviewed_sha": "b47234a805ece630183827e3b6896442027feb14",
    "session": "continued",
    "thread_id": "01a1ca6f-d2b3-7913-a1b1-8bc172f0ce59",
    "builder_response": "- Tests run: test/app-check-0636.test.mjs test/watch-decide-0567.test.mjs (with the repo's checks). All pass.\n- F1: fixed. scripts/app-check.mjs `checkStale` rebuilds the question's key (question text, Check in the app line, recommendation) from the ticket as it is now and compares it with the running check's key, and requires the ticket still blocked. foremanAction refuses both decide and ask on a check run when it's stale, before changing anything. New test \"0636 AC2: a check is refused once the question has changed during it, even with the same recommendation\" covers a changed check line, a changed question with the same recommendation, and a ticket no longer blocked, checking no commit, no ticket change and no action logged.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 324506,
      "cached_input_tokens": 258560,
      "cache_write_input_tokens": 0,
      "output_tokens": 1405,
      "reasoning_output_tokens": 174
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7391,
      "cached": 119552,
      "write": 0,
      "output": 522
    },
    "cost_usd": 0.0319572,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:49:43.786Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The build skill requires a blocked question with Check in the app. questionFacts, statusData and panel.js expose the line; all AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "appCheckable, appChecks and checkBrief implement eligible launches, question deduplication and app-check instructions. foremanAction now rejects stale questions before recording an action. All AC2 tests, including the new regression test, passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "checkBrief and the watch skill permit watch: fix decisions only when the check clearly passes. The AC3 test passed, covering launch, decision and correctly labelled resume."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "finish invokes app cleanup after the agent ends; checkedSays records observations in Notes; reviewPack includes captioned pictures. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "appCheckable excludes tell, off, high risk and blank commands.start. Automatic fix/decide excludes questions requiring app checks. All AC5 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "An agent could previously act on a question changed since its app check began.",
        "suggested_fix": "Implemented: checkStale requires blocked status and compares the current question, app-check line and recommendation against the running check's key before accepting either action. The passing regression test verifies refusal without ticket changes, commits or logged actions.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change meets all five criteria. App checks record observations and screenshots, clean up the app and leave ineligible questions for you. The stale-question safeguard is fixed, and all reported tests passed. Ready for the owner's merge decision."
  }
}
```

</details>
