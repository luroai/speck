---
id: "0564"
title: "Take every recommendation with watch: decide"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0563"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:42:35.286Z"
approved: "2026-11-08T23:57:38.241Z"
finished: "2026-11-09T00:01:50.482Z"

---
# 0564 · Take every recommendation with watch: decide

**Status:** ✅ done

## Problem
Most blocked questions end with you pressing Go with the recommendation: in this repo, 15 of the 17 recommendations taken were picked by hand. `watch: fix` takes one only when no option changes what you'd notice and the recommendation is a clear winner, so most questions still wait for you, and their builds sit blocked until you look.

## Outcome
With `watch: decide`, speck takes the recommendation of every blocked question that has one and carries on, waiting for you only where it shouldn't decide.

## Acceptance criteria
1. `watch` takes `decide` as well as `off`, `tell` and `fix`, in `speck config set`, `speck/config.yml` and the Settings view, which explains it. Any other value is still refused.
2. With `watch: decide`, each of `speck run`'s checks takes the recommendation of a blocked ticket whose question has one, whatever its "Changes what you'd notice" and "Clear winner" lines say, as the Go with the recommendation button does: it adds `- Went with the recommendation: <option> (chosen by speck, as watch is decide, <YYYY-MM-DD HH:MM> UTC).` to the ticket's Notes and resumes its build.
3. With `watch: decide`, a blocked ticket waits for you when its question has no recommendation, when its risk is high, or when speck has already taken 3 recommendations for it.
4. With `watch: decide`, everything `watch: fix` does still happens, a ticket speck will decide doesn't count under Needs you, and its card says speck will take the recommendation, as with `fix`.
5. With `off`, `tell` or `fix`, blocked questions are handled exactly as before, `docs/brief.md` describes `decide`, and no test that passed before this change fails.

## Out of scope
- The watch agent's own questions (0567).
- Holding back a ticket whose criteria changed (0565).
- Making `decide` the default for new projects.
- Size-guard splits, which 0563 handles under `fix` and so under `decide`.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Decided: a new value rather than widening `fix`, so anyone who wants speck to ask about noticeable changes keeps `fix`.
- Today: `FIXING` and `FIXING_SAYS` in `scripts/foreman.mjs` (about line 36), `fixable(t)` (about line 46), `foremanFixQueue` in `scripts/foreman-fix.mjs`, `goWith` and `choseOnce` in `scripts/go-with.mjs` (once per ticket today), `watch` validated in `scripts/config.mjs`, explained in `scripts/settings.mjs`, commented in `templates/config.yml`, and described in `docs/brief.md`'s `speck panel` and `speck config set` rows. Places that check for `'fix'` and must count `decide` too: `scripts/foreman-agent.mjs` (about lines 233 and 314), `scripts/foreman-took.mjs` (about line 34), `scripts/foreman.mjs` (about lines 110 and 124).
- Waits for 0563, which adds the size-guard fact this needs and changes the same functions. 0563 is a draft with a decision still open.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: added a test that `fix` still takes a high-risk ticket's recommendation, as before; `decide` waits on a risk that isn't low, so an unknown risk is left for the user. Split `speck split-off`'s note and the resumed build's message to name `decide`.

## In plain words
There's a new choice for the watch setting, decide. With it, when a build stops with a question and says what it recommends, speck takes that recommendation and carries on, even when it changes something you'd notice. It still waits for you if the question has no recommendation, if the ticket is high risk, or once speck has already decided 3 times for that ticket. The off, tell and fix choices work as they did.

To see it, pick decide under Watching in Settings. A blocked ticket's card then says speck will take its recommendation, and the ticket's notes record each choice speck made and when.

Keep an eye on what speck chooses for a while, as these are now choices you won't be asked about. Asking to raise the size limit is still never decided for you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 299,714
- Elapsed since build started: 15 min
- Changed lines: 99 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The README's line on `watch: fix` looking into stops doesn't mention `decide`, which does that too. A small wording tidy-up.

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
    "reviewed_sha": "b11a6743521b2969816173707cbb6c43339bffc6",
    "session": "fresh",
    "thread_id": "01a1bd98-030f-7291-b766-8a5a1356e321",
    "builder_response": "- Tests run: test/watch-decide-0564.test.mjs test/foreman-fix-0286.test.mjs, plus every existing test file `--related` brought in (2331 tests, 0 failed, 3 skipped).\n- One existing test changed: test/foreman-fix-0286.test.mjs pinned the Settings choices to exactly off, tell, fix. AC1 needs decide offered there, so that one assertion now lists decide too; it is not weakened.\n- Decision on AC3 and AC4 together: a high-risk ticket waits under decide even when fix would have taken its recommendation (AC3 is the specific rule). Under fix, high-risk tickets are taken as before.\n- A size guard's recommendation to raise the limit is still never taken under decide, as 0563 says and the ticket's Out of scope leaves it. A size-guard split counts towards the 3 like any other.\n- A risk that is neither low nor high is left for the user under decide, matching \"anything unknown is left for you\".\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 298888,
      "cached_input_tokens": 235008,
      "cache_write_input_tokens": 0,
      "output_tokens": 826,
      "reasoning_output_tokens": 45
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 63880,
      "cached": 235008,
      "write": 0,
      "output": 826
    },
    "cost_usd": 0.1595208,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-08T23:57:28.129Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "FIXING in scripts/foreman.mjs feeds config validation and Settings choices. Passing 0564 AC1 tests cover CLI saving, repository config, Settings saving and invalid values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanFixQueue calls goWith, and scripts/run.mjs checks goWithQueue immediately afterwards. Passing AC2 tests exercise the recorded Notes line and build resumption with noticeable changes and missing facts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "decidable rejects tickets without recommendations or low risk; goWith enforces MAX_DECIDED using choseCount. Passing AC3 tests cover high risk, missing recommendations, the third and fourth choices, and historical choices."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "speckActs enables the existing agent queue for decide. foremanFacts supplies foreman_will to the existing card and Needs you behaviour. Passing AC4 tests cover eligibility, counting, status output and agent launch; existing test/foreman-0317.test.mjs covers card rendering."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests preserve off, tell and fix behaviour, including fix on high-risk tickets. docs/brief.md describes decide and its limits. The recorded related-test run reports 2328 passed, 0 failed and 3 skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The new decide setting takes recommendations automatically, resumes builds and leaves high-risk tickets or tickets with three prior automatic choices for you. Existing watch modes retain their behaviour. The tests exercise the changes and report no failures; no blocking issues found."
  }
}
```

</details>
