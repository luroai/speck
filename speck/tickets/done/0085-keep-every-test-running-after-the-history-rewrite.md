---
id: "0085"
title: "Keep every test running after the history rewrite"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-10T13:29:12.837Z"
finished: "2026-10-10T13:34:33.510Z"

---
# 0085 · Keep every test running after the history rewrite

**Status:** ✅ done

## Problem
The history rewrite changes every commit id and removes the owner's words from 0082's ticket. Two tests depend on those: 0081's AC5 finds the panel from before 0081 by a fixed commit id, so it would quietly skip, and 0084's AC4 reads the owner's words from 0082's ticket, so it would fail. A trial rewrite on 2026-10-10 showed both.

## Outcome
The test suite gives the same results before and after the history rewrite.

## Acceptance criteria
1. 0081's AC5 finds the panel as it was before 0081 from the commit whose message is `speck(0081): ready`, not from a fixed commit id. It runs, rather than skipping, in this repo.
2. 0084's AC4 takes the words to look for from the owner's list, `~/.config/speck/private-words`, read as 0082's check reads it. When that list is missing or empty, it's reported as skipped. It no longer reads 0082's ticket.
3. No test or file under `scripts/`, `skills/` or `templates/` refers to a commit by its id.
4. The full suite passes, and with the owner's list in place, the only skips are the three 0078 ones that skip today.

## Out of scope
- The history rewrite itself, which is done by hand after this ships.
- Changing what 0081's or 0084's tests check.

## Notes
- Found by a trial rewrite with `git filter-repo` in a scratch copy: 684 tests, 1 failure (0084 AC4) and 4 skips (0081 AC5, plus the three 0078 skips that also happen today).
- Checked 2026-10-10: `9ff5e4c` in `test/panel-0081.test.mjs` is the only fixed commit id in `test/`, `scripts/`, `skills/` and `templates/`.
- Self-check: the AC2 test's word was a random UUID, which could share two characters with a string in 0082's test file and fail by chance, so it is now a fixed word of letters no string there is made of; the AC2 check of 0084's source looks only for a read of this repo's tickets, as 0084's AC2 fixture names ticket paths.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 237,260
- Elapsed since build started: 4 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Known limit (review F1, minor): the history-0085 AC1 check that 0081's AC5 runs only rejects the skip for a missing pre-0081 panel. It still accepts a skip for missing Chromium, so it can run where Chrome isn't installed, and a failure of AC5 itself is reported by AC5's own run in the suite. No inbox note.

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
    "reviewed_sha": "b18e3ea6821a224c20da9a203db9585b0a4ba907",
    "thread_id": "01a12603-c74a-75e0-a87e-caef15fa5d8d",
    "seconds": 27,
    "usage": {
      "input_tokens": 236505,
      "cached_input_tokens": 152576,
      "cache_write_input_tokens": 0,
      "output_tokens": 755,
      "reasoning_output_tokens": 38
    },
    "saved_at": "2026-10-10T13:32:50.905Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-0081.test.mjs before() uses commitBySubject('speck(0081): ready'); git log confirms that subject identifies the original baseline. history-0085.test.mjs tests exact matching and baseline availability. Supplied full-suite output shows 0081 AC5 passing without a skip."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "private-words-0084.test.mjs AC4 now uses the same readPrivateWords() helper as 0082, with missing/empty lists skipped and existing whole-word and fragment assertions preserved. history-0085.test.mjs exercises missing, empty, comment-only, clean and offending lists."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Repository search found no fixed commit references in test/, scripts/, skills/ or templates/. history-0085.test.mjs AC3 scans those paths and checks candidate strings against Git commit objects; supplied output reports it passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Supplied full-suite output reports 690 tests, 687 passes, zero failures and exactly the three existing 0078 skips; both affected checks run. Tests were not rerun because they create temporary files and this review is read-only."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "test/history-0085.test.mjs",
        "issue": "The AC1 child-test assertion rejects only the historical-panel skip message. It also accepts a failed test or a skip caused by missing Chrome, despite its name claiming the test runs.",
        "suggested_fix": "Assert that the reported line starts with ok and contains no # SKIP, and check the child process exit status.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The two affected tests now find their inputs independently of rewritten commit IDs and ticket wording, while preserving their existing checks. The supplied full-suite run passes with exactly the expected three skips. One new regression assertion could be stronger, but there is no blocking issue."
  }
}
```

</details>
