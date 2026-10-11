---
id: "0096"
title: "Warn when a criterion asks for the whole suite to pass"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-keep-builders-to-their-own-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T08:18:15.053Z"

---
# 0096 · Warn when a criterion asks for the whole suite to pass

**Status:** 👍 approved

## Problem
A criterion like "the full test suite passes" can't be met when `main` is already broken, so it pushes the builder to fix things outside the ticket. That's how 0090 came to fix an unrelated test.

## Outcome
Tickets ask that no test that passed before the change fails, and `speck lint` warns when a criterion asks for the whole suite to pass.

## Acceptance criteria
1. The `speck-ticket` skill tells the writer to phrase suite-wide criteria as "no test that passed before this change fails", and never as "the full test suite passes" or similar.
2. `speck lint <id>` prints a `!` warning naming the criterion when one asks for the full, whole or entire test suite, or all tests, to pass, and suggests the wording above.
3. As with lint's other warnings, it doesn't make `speck lint` fail or stop `speck set <id> status ready`.
4. A criterion that doesn't ask for the whole suite to pass gets no such warning.

## Out of scope
- Rewording existing tickets.
- Builder and reviewer behaviour (0095).

## Notes
- Failing before this build: none
- Self-check: quoted text in a criterion ("…", “…”, `…`) no longer counts, so a criterion that only talks about the wording (like this ticket's AC1) gets no warning.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The detector misses ordinary requirements such as 'All tests must pass' and 'The entire test suite should pass'.; F2 The unbounded 'pass' match generates false warnings for words such as 'passively', violating AC4.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,134,225
- Elapsed since build started: 12 min
- Changed lines: 24 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox.
- Known limit: the warning matches a fixed list of phrasings (full, whole or entire suite, or all tests, then pass, passes, passed, passing or green, optionally after words like must, should or still). Other wordings, such as "every test passes", "the test suite passes" or "npm test passes", get no warning.

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
    "reviewed_sha": "e3b6c64fffb794dc47877bbb91bf25963c62b70e",
    "thread_id": "01a12a11-b6c0-73f1-b3a4-43f9fb1d3c88",
    "seconds": 33,
    "usage": {
      "input_tokens": 389396,
      "cached_input_tokens": 288000,
      "cache_write_input_tokens": 0,
      "output_tokens": 911,
      "reasoning_output_tokens": 29
    },
    "saved_at": "2026-10-11T08:26:39.636Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md explicitly requires the replacement wording and forbids whole-suite passing criteria. test/lint-0096.test.mjs AC1 checks that instruction; the supplied run passes."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "scripts/core.mjs asksWholeSuite detects the tested simple forms, but direct read-only calls to lintTicket produce no warning for 'All tests must pass.' or 'The entire test suite should pass.'. Wrapped criteria are also missed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs prints warnings with '! ' and checks only errors when setting ready. Both AC3 integration tests exercise the real CLI and pass in the supplied run."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "A direct call to lintTicket warns for 'All tests passively document expected behaviour.', although this does not require tests to pass. The regex matches the prefix 'pass' without a word boundary."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The detector misses ordinary requirements such as 'All tests must pass' and 'The entire test suite should pass'. It also examines only numbered first lines, missing a requirement continued onto the following line.",
        "suggested_fix": "Recognise ordinary requirement forms, including must/should pass, and inspect complete criteria including continuation lines. Add regression tests for these cases.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The unbounded 'pass' match generates false warnings for words such as 'passively', violating AC4.",
        "suggested_fix": "Match complete passing verbs rather than arbitrary words beginning with 'pass', and add a negative regression test.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The writing guidance and advisory warning behaviour are implemented, with honest integration tests. However, the warning misses common ways of requiring all tests to pass and can flag unrelated wording. These detection errors need fixing before approval."
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
    "reviewed_sha": "fbb00e35ecb83ef1eace95eb6a1d2b9f768d8632",
    "thread_id": "01a12a11-b6c0-73f1-b3a4-43f9fb1d3c88",
    "seconds": 24,
    "usage": {
      "input_tokens": 742283,
      "cached_input_tokens": 563328,
      "cache_write_input_tokens": 0,
      "output_tokens": 1635,
      "reasoning_output_tokens": 29
    },
    "saved_at": "2026-10-11T08:29:46.717Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md requires the replacement wording and forbids whole-suite passing wording. The AC1 test in test/lint-0096.test.mjs passes in the supplied run."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs lintTicket, wholeCriteria and asksWholeSuite detect full/whole/entire suites and all tests, including must/should and wrapped criteria. Independent read-only probes confirm the earlier failing examples now warn. AC2 CLI tests verify '! ', criterion identification and suggested wording; all pass in the supplied run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs prints warnings separately and uses only lint errors to block readiness. Both AC3 CLI tests in test/lint-0096.test.mjs pass in the supplied run."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "asksWholeSuite uses a word boundary and excludes quoted wording. AC4 negative tests pass in the supplied run; independent probes confirm 'passively' and the recommended wording produce no warning."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The detector previously missed must/should requirements and wrapped criteria. The helper-word matching and wholeCriteria now address these cases, with passing regression tests.",
        "suggested_fix": "Completed.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The detector previously matched 'passively'. Complete-word matching now prevents this false warning, with a passing regression test.",
        "suggested_fix": "Completed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The warning and writing guidance meet the ticket’s criteria. Both earlier problems are fixed and covered by meaningful tests. The supplied suite reports 942 passing tests, no failures and three skips. No blocking concerns remain."
  }
}
```

</details>
