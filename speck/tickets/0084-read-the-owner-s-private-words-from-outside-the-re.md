---
id: "0084"
title: "Read the owner's private words from outside the repo in 0082's check"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:14:35.849Z"

---
# 0084 · Read the owner's private words from outside the repo in 0082's check

**Status:** 👍 approved

## Problem
0082's AC2 test checks that no tracked file names the owner, so it has to know the words to look for. It holds them in the test file, split into parts and joined at runtime. Anyone reading the file can join them too, so the repo still names the owner, and the history rewrite that follows 0082 can't remove them without breaking the test.

## Outcome
0082's check reads the words to look for from a file on the owner's machine, outside the repo, so no tracked file contains them in any form.

## Acceptance criteria
1. The check reads its words from `~/.config/speck/private-words` (the current user's home folder, as the operating system reports it): one word per line, ignoring blank lines and lines starting with `#`. Matching is case-insensitive and finds a word anywhere in a file, as today.
2. With at least one word listed, the check fails if a tracked file other than 0082's ticket file contains any of them, and its message names each such file. Otherwise it passes.
3. When the file is missing or lists no words, the check is reported as skipped, not as passed or failed, and the rest of the suite runs as normal.
4. `test/luro-0082.test.mjs` no longer contains the words, whole or in parts. Its other tests are unchanged.

## Out of scope
- A general speck feature for private words, such as a lint check. This only changes 0082's test.
- Rewriting history, which is done by hand after this ships.

## Notes
- The words are listed in 0082's ticket file (its AC2), which the reviewer can read. The history rewrite later replaces them there too, which is why 0082's ticket file stays excluded from the check for now.
- Tests should set `HOME` to a temporary folder, so they don't depend on the machine's own list.
- The owner keeps their list at that path on their machine. It's never committed.
- AC4's "its other tests are unchanged" is checked by reading the diff of `test/luro-0082.test.mjs`: only the AC2 test and one import line change. A test comparing against a base commit would break after the history rewrite.
- Self-check: the check now matches words literally (`git grep -F`), so a listed word with `.` or `*` doesn't match more than it says; a list that exists but can't be read stops the check with a plain message naming the file rather than skipping it; a `git grep` error fails the check rather than passing it. AC4's test ignores backticked phrases with spaces (such as `git grep`) when reading 0082's words.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 242,608
- Elapsed since build started: 9 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "09d12ee512f3ff494869daafe910e70d659124bf",
    "thread_id": "01a125fa-c591-7ff2-84f5-0f62debb56c6",
    "seconds": 29,
    "usage": {
      "input_tokens": 241890,
      "cached_input_tokens": 155520,
      "cache_write_input_tokens": 0,
      "output_tokens": 718,
      "reasoning_output_tokens": 53
    },
    "saved_at": "2026-10-10T13:23:02.512Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/private-words.mjs uses os.homedir(), trims lines, ignores blanks/comments and runs case-insensitive literal git grep. AC1 tests cover parsing and matching; child-process tests set HOME to temporary folders."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "filesNaming excludes 0082's ticket paths and returns matching tracked filenames. AC2 tests cover multiple matches, exclusions, no matches, and the actual 0082 check's failure/pass messages."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "readPrivateWords returns [] for a missing list; 0082's AC2 calls t.skip for an empty list. AC3 tests verify TAP skip reporting and successful execution of the remaining tests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The repository diff changes only one import and the AC2 test in test/luro-0082.test.mjs. The AC4 test checks whole words and string fragments against 0082's ticket."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The check now reads the owner's words from their home folder, reports matching files, and skips when no words are configured. The other existing tests are unchanged. Coverage exercises the actual check and its error paths. No blocking issues found. Independent execution was limited by the sandbox rejecting a child process; the supplied test results report all new tests passing."
  }
}
```

</details>
