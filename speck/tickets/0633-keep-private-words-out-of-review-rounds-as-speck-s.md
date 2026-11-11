---
id: "0633"
title: "Keep private words out of review rounds as speck saves them"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-keep-auto-ship-after-a-private-words-fix.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:01:26.858Z"
blocked_at: ""
waited_seconds: 17

---
# 0633 · Keep private words out of review rounds as speck saves them

**Status:** 🔨 building

## Problem
When a reviewer quotes one of your private words in its evidence, the ship refuses (exit 17) and the build rewords the round by hand. Since 0629 a reworded round no longer matches its receipt, so a ticket that should ship by itself waits for you, for a change that only rewords one line.

## Outcome
A review round never holds a private word, as speck takes them out when it saves the round, so a ship isn't refused for one in a round.

## Acceptance criteria
1. When a reviewer's verdict holds one of the words in `~/.config/speck/private-words`, in any case, the round `speck review` or `speck record` saves has each one replaced by `[private]`, as it replaces your home folder's path with `~/` today, and the rest of the round is as the reviewer wrote it.
2. A round saved that way by `speck review` matches its receipt, so a ticket whose only private words were in its review rounds ships with `speck ship <id> --auto`, with no exit 17.
3. Without a private-words file, rounds are saved as they are today.
4. No test that passed before this change fails.

## Out of scope
- Private words anywhere else in a ticket: the ship still refuses those (exit 17) and the build takes them out.

## Notes
- `saveRound` in `scripts/review.mjs` already runs the round through `tildePaths`; `privateWordList` is in `scripts/private-words.mjs`.
- Receipts are 0629's: the receipt must be made from the round as saved.
- Failing before this build: not checked
- Self-check: speck's own verdict fields (verdict, id, status, severity, state) and the round's meta, apart from the builder's response, are kept as they are, so a private word such as "approve" can't break a round.
- Review round 1 F1: a home folder path is written as `~/` before private words are taken out.
- Review round 1 F2: the private-word check that ship and the commit check share skips speck's own `[private]` markers.
- Went with the recommendation: A: the private-word checks skip speck's own [private] markers (chosen by speck, as watch is decide, 2026-11-11 11:09 UTC).

## In plain words
When a reviewer quotes one of your private words, speck now writes it as [private] in the saved review, in any case, just as it already writes your home folder as ~. The ship no longer stops for a private word in a review, and a ticket that would ship by itself still does, without waiting for you.

To see it, add a word to your private-words file that a reviewer is likely to quote, then look at that ticket's review rounds: the word shows as [private]. Private words anywhere else in a ticket still stop the ship as before. The check now also ignores speck's own [private] markers, so text that you type as exactly "[private]" isn't checked for private words.

## Blocked question
speck now writes each private word in a review round as `[private]`, but a private word that is part of the word "private" itself (such as "riv" or "ate") would still be found in that marker, so the ship would still refuse. Should speck's checks skip its own `[private]` markers (A, a small change to the private-word check that ship and the commit check share), leave this as a known limit, since private words are usually names (B), or use a marker with no letters in it instead of `[private]` (C, which changes acceptance criterion 1)? I recommend A: it keeps the marker the ticket asks for and closes the gap for every word.
Recommended: A: the private-word checks skip speck's own [private] markers
Other options: B: leave it as a known limit; C: use a marker with no letters instead of [private]
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox.
- Known limit: the private-word check skips any exact lower-case `[private]` in a line, including one a person typed, not only those speck wrote.

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
    "reviewed_sha": "3f71a52cc931221e0222804abf060be5b9ad0613",
    "session": "fresh",
    "thread_id": "01a1ca4a-351a-7633-bd75-85db7f83011b",
    "builder_response": "- Tests run: `speck test --related test/private-words-0633.test.mjs` (the ticket's own test file plus every existing test file that names a changed file, 1471 tests, 0 failing).\n- Design choice: only the reviewer's text and the builder's response are redacted. The verdict fields speck reads (verdict, id, status, severity, state) and the rest of the round's meta stay as they are, so a private word such as \"approve\" or a reviewer's name can't break a round.\n- Known limit, not fixed here: a private word that is part of \"[private]\" itself (for example \"riv\") would still be in the round, and the ship would still refuse it.\n",
    "seconds": 47,
    "usage": {
      "input_tokens": 125490,
      "cached_input_tokens": 88192,
      "cache_write_input_tokens": 0,
      "output_tokens": 1089,
      "reasoning_output_tokens": 285
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37298,
      "cached": 88192,
      "write": 0,
      "output": 1089
    },
    "cost_usd": 0.0943052,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:07:49.892Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The five 0633 tests cover normal redaction, review and record. However, scripts/review.mjs saveRound redacts before tildePaths: with home /home/zorblat and private word zorblat, /home/zorblat/project becomes /home/[private]/project instead of ~/project."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 integration test verifies receipts and auto-ship for the sample words. However, redactPrivateWords('riv', ['riv']) produces '[private]', which privateHit still flags as a private word, so shipping still refuses this case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing '0633 AC3' test exercises review without a private-words file and checks the saved verdict remains unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported related-test run passed 1468 tests with zero failures and three skips. No existing tests were changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "Redacting private words before home paths prevents the existing ~/ substitution when a private word appears in the home path.",
        "suggested_fix": "Normalise home paths before private-word replacement, and add coverage where the home folder contains a private word in reviewer text and the builder response.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/private-words.mjs",
        "issue": "The required replacement '[private]' itself contains possible private words, such as 'riv'. The existing ship scanner therefore rejects a redacted round, contradicting the promised outcome. The builder acknowledges this limitation, but the ticket does not exclude it.",
        "suggested_fix": "Resolve whether generated redaction markers should be exempt from private-word checks, then implement and test the agreed behaviour through auto-ship.",
        "state": "open"
      }
    ],
    "escalation_question": "Should generated '[private]' markers be exempt from private-word checks when a configured private word occurs inside that marker?",
    "summary": "The normal redaction and receipt flow works in the supplied tests. Two gaps remain: redaction can break home-path shortening, and some private words still block shipping because they occur inside '[private]'. The latter needs a decision about how replacement markers should be treated."
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
    "reviewed_sha": "97a9fca8aab560341324d8ffbfbd69d84b68edb6",
    "session": "continued",
    "thread_id": "01a1ca4a-351a-7633-bd75-85db7f83011b",
    "builder_response": "- Tests run: `speck test --related test/private-words-0633.test.mjs` (the ticket's own test file plus every existing test file that names a changed file: 1474 tests, 0 failing, 3 skipped).\n- F1: fixed. `redactPrivateWords` (scripts/private-words.mjs) now runs each string through `tildePaths` before replacing words, so a home folder whose path holds a private word is still written as `~/`. Test: \"0633 AC1 F1\", through `speck review` with the reviewer's text and the builder's response.\n- F2: fixed, with the option chosen for the blocked question (A, recorded in the ticket's Notes): `privateHit`, which ship and the commit check share, replaces speck's own `[private]` markers with a NUL before looking for words, so a word inside a marker (\"riv\") isn't found and the text either side of a marker isn't joined into one word. Only the exact lower-case marker speck writes is skipped. Tests: \"0633 AC2 F2\" (unit, and through `speck review` then `speck ship --auto` with the word \"riv\").\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 210129,
      "cached_input_tokens": 165888,
      "cache_write_input_tokens": 0,
      "output_tokens": 1619,
      "reasoning_output_tokens": 302
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6943,
      "cached": 77696,
      "write": 0,
      "output": 530
    },
    "cost_usd": 0.0269556,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T11:13:35.685Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound redacts reviewer text and builder responses while preserving control fields. redactPrivateWords now applies tildePaths first. Passing AC1 tests exercise mixed-case words, review, record, and home paths containing private words."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "saveRound creates the receipt from the round read back after saving. Both AC2 auto-ship integration tests passed, including the 'riv' marker case. privateHit exempts exact '[private]' markers in accordance with the recorded decision."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Without configured words, redactPrivateWords returns its input unchanged and saveRound retains existing tildePaths handling. The AC3 integration test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reported related-test run completed with 1471 passing tests, zero failures and three skips. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "Private-word replacement previously prevented home-path shortening when the home path contained a private word.",
        "suggested_fix": "Resolved: home paths are shortened before redaction, with an integration test covering reviewer text and the builder response.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/private-words.mjs",
        "issue": "Private words contained in '[private]' previously caused redacted rounds to fail shipping checks.",
        "suggested_fix": "Resolved under the recorded marker-exemption decision: privateHit skips exact generated markers. Unit and auto-ship integration tests cover this behaviour.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both earlier findings are resolved. Review text is redacted while home paths remain shortened, and saved rounds retain valid receipts for automatic shipping. The reported tests pass, including the replacement-marker edge case."
  }
}
```

</details>
