---
id: "0680"
title: "Let a build carry on past the review limit when you say so"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0679"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:29:50.734Z"
approved: "2026-11-15T14:45:31.122Z"
finished: "2026-11-15T14:50:17.923Z"

---
# 0680 · Let a build carry on past the review limit when you say so

**Status:** ✅ done

## Problem
A ticket that reaches `limits.max_review_rounds` without approval blocks with a question, and its recommendation can be to allow another round. Answering that changes nothing: the resumed build asks for a round, `speck review` refuses with "Max review rounds reached", and the ticket blocks again with the same question. With `watch: decide`, speck can take such a recommendation up to three times in a row, each one resuming a build that can only block again.

## Outcome
Your answer to a review-limit question lets the build take two more rounds, and speck never takes that recommendation by itself.

## Acceptance criteria
1. A build that blocks at the review limit adds `Review limit: yes` on a line of its own beside its question's other facts, as the build skill tells it to, and `speck status --json` gives it as `blocked_review_limit`.
2. Once you've answered such a question, with the panel's Answer, its Go with the recommendation button or `speck answer`, the ticket may have up to 2 more review rounds: `speck next` says `fix`, and `speck review` and `speck record` accept them. If neither approves, it blocks again with `Review limit: yes`, and your next answer allows 2 more.
3. speck never goes with the recommendation of a `Review limit: yes` question by itself: with `watch: fix` or `decide` the question waits for you, and speck says why once.
4. The ticket's Review rounds, its review log and the review pack mark each of those rounds as one you allowed, `limits.max_review_rounds` in `speck/config.yml` is left as it is, and the brief's Max rounds reached line and `speck watch` row say so.
5. No test that passed before this change fails.

## Out of scope
- The extra round a ticket gets by itself when one blocking finding is left (0242).
- Merge rounds and `limits.max_merge_rounds`.
- A block for a repeated disagreement or an escalation by the reviewer: your answer resumes the build as today.

## Notes
- `nextAction` and `extraRound` in `scripts/review.mjs` enforce the limit. `goWith` in `scripts/go-with.mjs` refuses what speck may not take by itself, as it does for a size guard question that isn't a split.
- The build skill forbids a build to change `limits.max_review_rounds`, which stays. The build needs a way your answer opens instead.
- Decision: 2 rounds for each answer, enough for one fix and the round that checks it, without an endless loop.
- This repo has blocked at the review limit 5 times in its history (counted 2026-11-15), so this is about the stall each one causes, not how often it happens.
- Failing before this build: none
- Self-check: the review-limit rules moved from scripts/review.mjs into scripts/review-limit.mjs (re-exported) to keep every script under 600 lines; the test's allowance helper adds to an existing Notes section rather than adding a second one.
- Pictures: none, because nothing anyone sees in the panel changed.

## In plain words
When a build runs out of review rounds, it now marks its question as being at the review limit. If you answer it, with Go with the recommendation in the panel or by answering speck's question about it, the ticket gets 2 more review rounds and carries on, rather than blocking again straight away. If those 2 don't end in approval, it asks you again, and your next answer allows 2 more. The review limit in your settings stays as it is, and the ticket's review rounds and review pack say which rounds you allowed. speck never answers this kind of question by itself, even with watch set to fix or decide: it waits for you and says why once in speck run's log. One thing to watch: if you answer by editing the ticket and restarting the build by hand, no extra rounds are allowed yet (saved as an idea).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new speck answer / panel Answer allowance path has no test.; F2 The instruction identifies exhausted review rounds by a reason starting 'No approval after', but nextAction also uses that prefix when max_merge_rounds is exhausted.; F3 The brief test asserts the prose phrase 'review limit' in the watch row.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 261,709
- Elapsed since build started: 16 min
- Changed lines: 228 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- An answer given by hand (written in the ticket, then /speck-build) allows no more rounds: only the button and `speck answer` add the allowance. Saved to the inbox: speck/ideas/2026-11-15-let-an-answer-given-by-hand-allow-more-review-rounds.md.
- The panel's blocked question doesn't show that it's at the review limit (no chip beside Clear recommendation / Close call). Left as a known limit.
- Answering speck's question and also pressing Go with the recommendation on the same block would allow 4 rounds, not 2. Unlikely, since speck's agent rarely asks about a blocked ticket; left as a known limit.

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
    "reviewed_sha": "053805ea9cab941acb7b4ad50a6815de505a1370",
    "session": "fresh",
    "thread_id": "01a1dfa9-4525-7943-abb1-ae393db1fa10",
    "builder_response": "- Tests run: `speck test --related test/review-limit-0680.test.mjs` (every test file naming a changed file: 3559 passed, 3 failed in test/review-0242.test.mjs, which matched the old refusal's exact words). I kept those words (\"… Block the ticket.\") and put the review-limit hint after them, then ran `speck test --files test/review-limit-0680.test.mjs test/review-0242.test.mjs`: 162 passed, 0 failed (this round's test output).\n- Design: an answer to a `Review limit: yes` question (Go with the recommendation by the user, or `speck answer` / the panel's Answer to speck's question while the ticket is blocked there) adds `- Review limit: you allowed 2 more review rounds (<when>).` to the ticket's Notes. `allowedRounds(raw)` counts those lines × 2; `nextAction(all, cfg, allowed)` says fix while fewer rounds marked `meta.allowed` than that have been used. `speck review` and `speck record` save such rounds with `allowed: true`. limits.max_review_rounds is never touched.\n- The round-limit rules (openBlocking, isMergeRound, mergeRun, ordinaryRounds, extraRoundDue, extraRound, nextAction) moved unchanged apart from 0680's additions from scripts/review.mjs into scripts/review-limit.mjs, re-exported from review.mjs, so no script is over 600 lines (test/split-0078's check).\n- speck never takes it: fixable/decidable leave out `blocked_review_limit`; goWith refuses `by: 'foreman'`; `speck watch decide` (cantDecide) refuses; foremanFixQueue says why once per ticket with watch fix or decide.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 137964,
      "cached_input_tokens": 84480,
      "cache_write_input_tokens": 0,
      "output_tokens": 909,
      "reasoning_output_tokens": 115
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 53484,
      "cached": 84480,
      "write": 0,
      "output": 909
    },
    "cost_usd": 0.124506,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:43:26.927Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "question-facts.mjs parses reviewLimit; statusData exposes blocked_review_limit. The passing AC1 test checks both and the build skill instruction."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Passing AC2 tests exercise goWith, review and record. None exercises the new allowance branch in foremanReply used by speck answer and the panel's Answer; the integration helper writes allowance notes directly."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test checks fix/decide exclusion, goWith refusal and one-time queue explanation. cantDecide also refuses review-limit questions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests exercise roundsLine, reviewPack and close's review log. The brief describes user allowances and watch refusal; the review integration test verifies config stays unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported final targeted run passed 162 tests with no failures; the earlier related run's three refusal-message failures were corrected and rerun."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The new speck answer / panel Answer allowance path has no test. The tests only exercise the recommendation button and manually insert allowance notes, leaving an explicit part of AC2 unverified.",
        "suggested_fix": "Exercise foremanReply or its CLI/panel entry points against a review-limit question and verify the allowance is recorded and enables two rounds. Cover dismissal and an ordinary question granting none.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "The instruction identifies exhausted review rounds by a reason starting 'No approval after', but nextAction also uses that prefix when max_merge_rounds is exhausted. It therefore tells builds to mark merge-limit questions Review limit: yes, contrary to the ticket's exclusion of merge rounds. Answers then record ordinary-round allowances that cannot unblock the merge limit.",
        "suggested_fix": "Distinguish ordinary review-limit exhaustion from merge-limit exhaustion in the instruction or structured next-action result, and test that merge-limit blocks do not receive this marker or allowance.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The brief test asserts the prose phrase 'review limit' in the watch row. This checks document wording rather than a command, setting or other concrete fact, which the review rules explicitly prohibit.",
        "suggested_fix": "Replace the prose assertion with a check of a concrete fact, such as the documented Review limit: yes marker, or revise the criterion to be checked by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The recommendation button enables two more rounds, and automatic recommendations correctly wait for you. Changes are needed to verify the Answer routes, keep merge-limit questions outside this feature, and remove a fragile documentation wording test."
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
    "reviewed_sha": "d76328afe1f25284206b9e462d7b8d0983f6ddca",
    "session": "continued",
    "thread_id": "01a1dfa9-4525-7943-abb1-ae393db1fa10",
    "builder_response": "- Tests run: `speck test --files test/review-limit-0680.test.mjs test/review-0242.test.mjs test/foreman-answer-0318.test.mjs`: 183 passed, 0 failed.\n- F1: fixed. New test \"0680 AC2: answering speck's question about a ticket blocked at the review limit, with speck answer or the panel's Answer, notes 2 more rounds\" calls foremanReply (what `speck answer` and the panel's Answer both run, via cmdForemanReply / panelForemanReply) on a ticket blocked with `Review limit: yes`: the Notes get the allowance line, allowedRounds is 2 and ticketNext says fix. Dismissing allows none, and answering at an ordinary question allows none. The 0318 test's agent-queue helpers (agents, asked) moved unchanged into test/support/foreman-asked.mjs so both tests share them; asked() takes an optional question.\n- F2: fixed. The build skill now names the reason in full: block with `Review limit: yes` only when it starts `No approval after <n> review rounds`, and says a block after merge rounds (`No approval after <n> merge rounds`), a repeated disagreement or an escalation never gets it. The review skill's block bullet says \"max review rounds reached, not merge rounds\". New test checks that the skill names both reasons, that the review-limit reason matches and the merge-limit reason doesn't, and that an allowance doesn't open merge rounds (nextAction with allowed 2 still blocks after max_merge_rounds). The reason strings themselves are unchanged, as older tests check them exactly.\n- F3: fixed. The watch-row wording assertion is gone; the brief test now checks only names: `Review limit: yes`, `blocked_review_limit` and the `Review limit: you allowed 2 more review rounds` Notes line on the Max rounds reached line.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 260120,
      "cached_input_tokens": 196864,
      "cache_write_input_tokens": 0,
      "output_tokens": 1589,
      "reasoning_output_tokens": 133
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9772,
      "cached": 112384,
      "write": 0,
      "output": 680
    },
    "cost_usd": 0.0375824,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:45:09.007Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "questionFacts parses Review limit: yes and statusData exposes blocked_review_limit. Passing AC1 test checks these facts and the build skill's instruction."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests now exercise foremanReply, shared by speck answer and panel Answer, including dismissal and ordinary-question controls. Other AC2 tests exercise goWith, repeated allowances, next, review and record. The skill explicitly excludes merge-limit blocks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test verifies fix/decide exclusion, goWith refusal and one-time queue explanation. cantDecide independently refuses review-limit questions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify roundsLine, reviewPack and close's review log mark allowed rounds. The integration test verifies config remains unchanged. docs/brief.md's Max rounds reached passage and watch row explain allowances and automatic-choice refusal."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported targeted run passed 183 tests, with zero failures and three skips, including the affected existing review-limit and answer tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The answer allowance path previously lacked coverage.",
        "suggested_fix": "Completed: the new foremanReply test verifies the allowance enables fix, while dismissal and ordinary questions grant none.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-build/SKILL.md",
        "issue": "The previous instruction also matched exhausted merge rounds.",
        "suggested_fix": "Completed: the instruction distinguishes review-round and merge-round reasons and explicitly excludes merge blocks. A passing regression test verifies allowances cannot open merge rounds.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/review-limit-0680.test.mjs",
        "issue": "The brief test previously asserted ordinary prose wording.",
        "suggested_fix": "Completed: the prose assertion was removed; remaining brief assertions check concrete marker and field names.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Your answer now allows two more review rounds, with each round clearly recorded. Automatic recommendations wait for you, and merge limits remain separate. All previous findings are resolved; the reported tests pass."
  }
}
```

</details>
