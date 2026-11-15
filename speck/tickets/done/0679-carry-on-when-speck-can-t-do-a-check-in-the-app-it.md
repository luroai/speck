---
id: "0679"
title: "Carry on when speck can't do a check in the app itself"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:06.042Z"
approved: "2026-11-15T14:27:11.621Z"
finished: "2026-11-15T14:29:32.533Z"

---
# 0679 · Carry on when speck can't do a check in the app itself

**Status:** ✅ done

## Problem
When a build asks for a check in the running app that speck's agent can't make, such as how something sounds or how a page behaves in a browser it can't run, the agent asks you, and the build stops until you answer. The rest of the ticket, its remaining work and its review rounds, could be finished in that time, leaving you one look at the end.

## Outcome
With `watch: decide`, a check speck can't make is left for you at the end: the build carries on with its recommendation, and the ticket waits approved with the check listed.

## Acceptance criteria
1. speck's agent has a third action for a check in the app, beside `decide` and `ask`: `speck watch leave <id> --saw "<why it couldn't make the check>"`. With `watch: decide` and a low-risk ticket it goes with the build's recommendation as `decide` does, counts towards the 3 recommendations speck may take for a ticket, and writes the check, in the build's own words, in the ticket's Notes as left for you. It refuses where `decide` refuses.
2. The agent's brief for a check says when to use it: only when what the check asks for is something it can't see or do, such as a sound, another device, or a browser or account it can't use. It says never to use it when what it saw disagrees with the recommendation, or for a check it could make. (checked by review)
3. Auto-ship leaves a ticket with a check left for you approved, giving the check as its reason, and its review pack lists each check left for you above its changes. `speck ship <id>` run by you ships it.
4. The brief describes the action in its `speck watch` row and in its paragraph on checks in the app, which no longer says such a question is never taken unchecked.
5. No test that passed before this change fails.

## Out of scope
- Checks speck's agent can make: nothing changes for them.
- `watch: fix`, `tell` and `off`, and high-risk tickets: the question waits for you as today.
- Marking a left check as done: shipping the ticket is your word on it.

## Notes
- This changes a rule the brief states today: "Such a question is never taken unchecked." Decision: the check still happens before anything ships, by you, at the end of the build and not in the middle of it.
- Checks in the app came in 0636 (`scripts/app-check.mjs`, whose `CHECK_ACTIONS` are `decide` and `ask`, and `scripts/foreman-agent.mjs`). QA (0651) makes the checks when it's set, and gets the same action.
- `autoShipWhyNot` in `scripts/ship.mjs` gives auto-ship's reasons for leaving a ticket, which `speck status` and the panel already show.
- Failing before this build: none
- Self-check: leave named "speck watch decide" in its refusal with watch: fix, so the refusal now names the action run; `wentWithLines` didn't read a leave's Notes line as a call speck made, so its pattern now takes it; the brief test no longer finds the paragraph by its wording.
- Pictures: none, because nothing changes how anything looks: the review pack gains a plain text section, which the tests check.
- `--saw "<text>"` (with a space, as criterion 1 writes it) and `--why "<text>"` are read as `--saw=` and `--why=` for every `speck watch` action. A leave with no `--why` takes its `--saw` as the reason.
- speck (2026-11-15 13:58 UTC) told you: The build is slow but healthy: it has made steady progress and is now re-running related tests ahead of review. The time went on several rounds of test fixes (the 600-line file cap, a note regex, a resume test and a docs test that rewords the brief) while the machine was very busy, with a load average of about 36 to 46. Why: The build log shows it moving forward step by step with no hung command, and the latest full test run on the base branch's newest commit passed, so nothing outside the ticket is broken.

## In plain words
When speck is asked to check something in the running app that it simply can't check itself, such as how an alert sounds or how a page works on another device, it no longer stops the build to ask you. With the watch setting on decide and a low-risk ticket, it goes with the build's recommendation, lets the build and its reviews finish, and leaves the check for you. The finished ticket then waits for you instead of shipping by itself: its reason not to ship names the check, and its review pack lists each check left for you near the top. Make the check, then ship it as usual. Worth watching: that speck only leaves checks it truly can't make, and still asks when what it saw disagrees with the recommendation.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 340,182
- Elapsed since build started: 51 min
- Changed lines: 107 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: the speck-watch skill still says to ask when the agent can't sign in, which overlaps with leaving a check that needs an account it can't use (reviewer's minor finding F1). Saved to the inbox: speck/ideas/2026-11-15-say-when-a-sign-in-check-is-left-rather-than-asked.md.
- Note: test/full-suite-0630.test.mjs's "a full run doesn't wait for the max_parallel_tests turns" failed once under the load of a 245-file related run and passed alone three times; it's timing-sensitive, unrelated to this change.

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
    "reviewed_sha": "eae074824f3a7e72cb3688e65e6595f805a40a9d",
    "session": "fresh",
    "thread_id": "01a1df8f-7355-77b2-9377-89bf15bf7273",
    "builder_response": "- Tests run: `speck test --related test/app-check-0679.test.mjs` (the ticket's own file plus every existing test file naming a changed file: 245 files, all passing). An earlier run of the same set had one load-sensitive failure in test/full-suite-0630.test.mjs (\"didn't wait for the held turn\"), which passes alone three times out of three and in this run.\n- Criterion 2 is checked by review: the brief in scripts/app-check.mjs (checkBrief) and skills/speck-watch/SKILL.md.\n- Notes on choices: `leave` takes the recommendation itself when no option is named (or the recommendation if named, refusing any other). `--saw \"<text>\"` with a space is read as `--saw=<text>` (and `--why` likewise), as criterion 1 writes the command. A leave without `--why` uses its `--saw` as why.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 200404,
      "cached_input_tokens": 139776,
      "cache_write_input_tokens": 0,
      "output_tokens": 844,
      "reasoning_output_tokens": 141
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 60628,
      "cached": 139776,
      "write": 0,
      "output": 844
    },
    "cost_usd": 0.1436736,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:15:15.113Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAction in scripts/foreman-agent.mjs implements leave with the recommendation, shared refusal checks, Notes recording and build resumption. Passing 0679 AC1 tests exercise these paths and the three-recommendation limit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "checkBrief in scripts/app-check.mjs and the Checking in the app section of skills/speck-watch/SKILL.md explicitly restrict leave to checks the agent cannot perform and forbid it for contradictory observations or checks it could make."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs blocks automatic shipping through leftChecks; scripts/pack.mjs lists deferred checks in both packs. Passing AC3 tests exercise the ship queue, automatic refusal, pack output and successful manual shipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md describes leave in both the watch command row and app-check paragraph. The passing AC4 test checks the command facts and removal of the previous prohibition."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the supplied test log: 2,791 tests, 2,788 passing, three skipped and no failures across the related test run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "skills/speck-watch/SKILL.md",
        "issue": "The final ask instruction still says to ask whenever the agent cannot sign in, while the preceding leave instruction permits deferring a check requiring an account it cannot use. These directions overlap.",
        "suggested_fix": "Qualify the sign-in instruction so it clearly allows leave under watch: decide when the required account is unavailable.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The build can continue when the agent cannot perform an app check, while keeping that check visible for you and preventing automatic shipping. Tests cover continuation, safeguards and manual shipping. One small clarification would make the sign-in instructions more consistent."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9cfb69123ad33cf407e21594e1f99390c1cab2fe",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1df8f-7355-77b2-9377-89bf15bf7273",
    "builder_response": "Merge round: main merged into the ticket branch after speck ship hit a conflict.\n- docs/brief.md (class: logic, 1 conflict in the command table): main added a sentence to the `speck set` row (setting several tickets ready at once); this ticket added two sentences to the `speck watch` row (the `leave` action). Resolved by taking main's version of the block and adding this ticket's two sentences back into the `speck watch` row, unchanged. Both sides' text is kept, nothing else changed.\n- Tests run: test/app-check-0679.test.mjs test/docs-0267.test.mjs (the ticket's own tests, and the test that rewords and reorders the brief and checks no test depends on its wording), plus the commands.checks files that speck test runs with them. All pass.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 338721,
      "cached_input_tokens": 267648,
      "cache_write_input_tokens": 0,
      "output_tokens": 1461,
      "reasoning_output_tokens": 141
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 10445,
      "cached": 127872,
      "write": 0,
      "output": 617
    },
    "cost_usd": 0.0398472,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:27:08.723Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs retains leave's recommendation selection, shared refusal checks, Notes entry and build resumption. All AC1 tests in test/app-check-0679.test.mjs pass after the merge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed checkBrief in scripts/app-check.mjs and skills/speck-watch/SKILL.md: both restrict leave to checks the agent cannot perform and forbid using it for contradictory observations or checks it could make."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs and scripts/speck.mjs retain the deferred-check auto-ship blocker; scripts/pack.mjs lists checks in both packs. Passing AC3 tests cover automatic refusal, retained approved status, pack output and manual shipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md retains leave in its app-check paragraph and watch command row, alongside main's new multiple-ticket set command description. The AC4 test and docs-0267 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the current test log: 160 tests, 157 passing, three skipped and no failures. The conflict resolution preserves both sides' documentation changes without changing runtime behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "skills/speck-watch/SKILL.md",
        "issue": "The instruction to ask whenever the agent cannot sign in still overlaps with permission to leave a check requiring an unavailable account. This remains unchanged and is recorded as a follow-up idea.",
        "suggested_fix": "Clarify when unavailable account access permits leave under watch: decide and when sign-in trouble requires asking.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves both changes, and all checks run for this round pass. Builds can continue with unavailable app checks recorded for you, while automatic shipping remains blocked. The previously noted minor sign-in instruction ambiguity remains tracked for follow-up."
  }
}
```

</details>
