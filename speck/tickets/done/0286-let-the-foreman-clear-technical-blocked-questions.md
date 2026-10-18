---
id: "0286"
title: "Let the Foreman clear technical blocked questions"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0284"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:07:36.873Z"
approved: "2026-10-18T13:13:57.392Z"
finished: "2026-10-18T13:16:24.051Z"

---
# 0286 · Let the Foreman clear technical blocked questions

**Status:** ✅ done

## Problem
A build that blocks on a technical question waits for the user, though the user has always taken the build's recommendation. The work stops until they notice.

## Outcome
With the Foreman's Fixing setting on, speck run takes the recommendation for a blocked question that doesn't change anything the user would notice and has a clear winner, and starts the build again, without waiting for the user.

## Acceptance criteria
1. A new setting, `foreman_fixing`, takes `off`, `tell` or `fix`, `tell` by default. It's in the config template with a comment, `speck config set` accepts it, and the Settings view's Foreman group offers it with an explanation.
2. With `fix`, when a ticket blocks with a question that doesn't change what the user would notice and has a clear recommendation (0283), speck run resumes the build with the recommended option on its next check, as the panel's button (0284) does, and records in the ticket's Notes that the Foreman chose it.
3. A question that changes what the user would notice, is a close call, or has any of the three unknown, is left for the user, whatever the setting.
4. The Foreman takes a ticket's recommendation at most once per ticket. If the same ticket blocks again, it's left for the user.
5. With `tell` or `off`, blocked tickets wait for the user, as today. With `tell`, the Foreman's status counts them under Needs you.

## Out of scope
- Anything other than blocked questions: 0287.

## Notes
- Never: set a ticket ready, approve work, or ship beyond what `auto_ship` covers.
- Failing before this build: none
- Self-check: the Foreman now skips a blocked ticket whose build speck run still has running (tried on a later check), rather than logging that it left the question for you; a refusal is worded as "didn't take its recommendation".
- How it works: speck run's Foreman calls 0284's goWith with `by: 'foreman'`, so the Notes line says "chosen by the Foreman", and that line is how it knows it has already chosen once for the ticket. 0284's `blockedRepo` test helper moved to `test/support/blocked.mjs` to share it. Adding a setting changed the fixed setting lists in the 0257 and 0258 tests.

## In plain words
There's a new Foreman setting, Fixing, in the Settings view's Foreman group (`foreman_fixing` in the config file), with three choices: off, tell and fix. It starts at tell, which works as before: a build that stops with a question waits for you, and the Foreman's status counts it under Needs you. Off works the same, except the status doesn't count those tickets.

With fix, when a build stops with a question where none of the options would change anything you'd notice and its recommendation is a clear winner, speck run takes the recommendation by itself and starts the build again, just as the panel's Go with the recommendation button does. The ticket's notes say the Foreman chose it, and when. It does this only once per ticket: if the same ticket stops again, it waits for you. Any question that would change what you'd notice, or is a close call, or doesn't say, always waits for you.

To see it, set Fixing to fix with speck run on, and watch a ticket blocked on a technical question go back to building on speck run's next check. Worth keeping an eye on: for now the only record of the Foreman's choice is in the ticket's notes and speck run's log.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 223,916
- Elapsed since build started: 6 min
- Changed lines: 126 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The Foreman's choices show only in the ticket's Notes and speck run's log: saved to the inbox as `speck/ideas/2026-10-18-show-what-the-foreman-answered.md`.
- With `fix`, a blocked ticket the Foreman is about to clear still counts under Needs you until speck run's next check, which is a few seconds at most.
- As with 0284's button, if the run record can't be saved after the choice is committed, the ticket shows building but isn't resumed; speck run's log says how to resume it by hand.

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
    "reviewed_sha": "d2ca5530278b47b1480decffc9e50fd41126dd97",
    "thread_id": "01a14f25-0c88-7a13-8365-5b4a8ba906b5",
    "seconds": 25,
    "usage": {
      "input_tokens": 223149,
      "cached_input_tokens": 159360,
      "cache_write_input_tokens": 0,
      "output_tokens": 767,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:13:35.772Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Config validation, template, settings API and Settings view offer off/tell/fix with tell as default and an explanation. Four passing 0286 AC1 tests exercise these paths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "run.mjs calls foremanFixQueue before goWithQueue. The passing AC2 test exercises the real goWith write and commit, Foreman attribution in Notes, and same-check resume command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foreman.mjs fixable requires a recommendation, blocked_noticeable === false and blocked_clear === true. The passing AC3 test verifies noticeable changes, close calls and missing facts leave the ticket untouched."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "go-with.mjs checks the persistent Foreman choice in Notes before writing. The passing AC4 test blocks the ticket again and verifies no further choice, commit or resume occurs."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "foremanFixQueue acts only with fix; foremanView counts blocked tickets unless fixing is off. Both AC5 tests passed, checking unchanged tickets and Needs you counts."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Foreman can now answer clear technical questions automatically when Fixing is set to fix, records its choice and resumes the build. Other questions remain for the user, and automatic answers are limited to once per ticket. The targeted tests passed; no blocking issues found."
  }
}
```

</details>
