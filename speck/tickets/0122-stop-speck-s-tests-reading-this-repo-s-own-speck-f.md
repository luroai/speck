---
id: "0122"
title: "Stop speck's tests reading this repo's own speck folder"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-stop-tests-depending-on-files-under-speck.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0121"]                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:25:08.256Z"

---
# 0122 · Stop speck's tests reading this repo's own speck folder

**Status:** 🔍 reviewing

## Problem
Since 0112, `speck test` and `speck ship` reuse a test result when nothing outside `speck/` has changed. Some of speck's own tests read this repo's files under `speck/`: its config, done tickets and filed idea notes, and the private-words check scans them all. A change there can then pass or fail on a reused result that a fresh run would give differently.

## Outcome
No test in this repo reads this repo's own files under `speck/`, so a reused result is always the result a fresh run would give.

## Acceptance criteria
1. No test reads a file under this repo's own `speck/` folder. Tests that checked fixed content there (for example the repo's `speck/config.yml`, a done ticket or a filed idea note) check the same thing against test data of their own or a temporary repo, or are removed where what they checked was a one-off change that's already recorded in its ticket.
2. The private-words check (`test/private-words-0084.test.mjs`, `test/luro-0082.test.mjs`) no longer scans files under `speck/`. It still scans every other tracked file.
3. A new test fails if any test file reads this repo's own `speck/` folder, so it can't come back unnoticed.
4. No test that passed before this change fails, apart from tests this ticket removes under AC1. The Delivery log lists each test removed and why.

## Out of scope
- Checking tickets for private words (0121).
- Changing how test results are reused.

## Notes
- Known readers from 0112's build: `test/luro-0082.test.mjs` (done tickets and an idea note), `test/product-0068.test.mjs` (`speck/product.md`), `test/worktrees.test.mjs` (the repo's `speck/config.yml`). The builder should search for others.
- After this, tickets are checked for private words by `speck lint` (0121) instead, at the moment they're set ready.
- Failing before this build: none
- Readers found: the three in the note above, `test/product-0068.test.mjs` (`speck/product.md`), and the private-words scan in `test/support/private-words.mjs`, which both 0082's and 0084's checks use. No other test builds a path into this repo's `speck/` folder or runs the CLI there.
- AC4 can't be checked by a test of its own: the full suite went from 1073 tests (1070 passing, 3 skipped) to 1078 (1075 passing, 3 skipped), with no test file or test removed whole. Only assertions inside three tests were removed (see the Delivery log).
- Self-check: narrowed the AC1 test's name to what the check finds (a path built into `speck/`), and stopped it flagging a `\/` inside a regex as a path.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Removed (no whole test was removed; these assertions were, as one-off changes already recorded in their tickets):
- `test/luro-0082.test.mjs` AC4: the checks that a done idea note says "the maintainer" and that 0053's done ticket gives a path starting with `~/`. 0082 records those edits; the brief's check stays. The test is renamed to match.
- `test/product-0068.test.mjs` AC4: the check that `speck/product.md` is gone from this repo. 0068 records its removal; the check that no test reads it stays.
- `test/worktrees.test.mjs` 0028 AC4: the check that this repo's `speck/config.yml` turns worktrees on. 0028 records it; the check on the config template stays.

Known limit: the AC3 check reads the tests' source, on one line or across several. It finds paths built from the repo's root (`ROOT`, `REPO`, `HERE`), calls to helpers defined over it, and `fs` calls or `path.resolve` given a relative path starting with `speck`. It wouldn't find, say, `git show HEAD:speck/…` run in the repo, or the CLI run with the repo as its folder. A line that reads a temporary repo's `speck/` in a form it flags carries the comment `reads a temporary repo` (one does: the fake reviewer in `test/support/speck.mjs`).

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
    "reviewed_sha": "67c0902f22a695da5dde2b9a8daa93cf2409ec08",
    "thread_id": "01a12af2-6b5a-7212-8ff1-d74ce810e32c",
    "seconds": 35,
    "usage": {
      "input_tokens": 100778,
      "cached_input_tokens": 55424,
      "cache_write_input_tokens": 0,
      "output_tokens": 947,
      "reasoning_output_tokens": 18
    },
    "saved_at": "2026-10-11T12:32:08.005Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The repo reads were removed from luro-0082.test.mjs AC4, product-0068.test.mjs AC4 and worktrees.test.mjs 0028 AC4. The new AC1 source scan passes; inspection found no remaining current reader."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/support/private-words.mjs filesNaming excludes speck/ using a Git pathspec. The passing 0122 AC2 test exercises tracked files inside speck/ and outside it, including docs/speck/ and speckle.md."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "test/support/repo-speck.mjs readsRepoSpeck checks each line separately. Independently invoking it with fs.readFileSync(path.join(ROOT, followed by a newline and 'speck', 'config.yml')) returns [], so an ordinary multiline repo read passes the guard."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full output at /tmp/speck-0122-tests.txt confirms 1078 tests, 1075 passing, 3 skipped and no failures. The Delivery log lists all removed assertions and their reasons; the diff removes no whole tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/repo-speck.mjs",
        "issue": "The regression guard misses ordinary reads merely formatted across lines, even using the recognised ROOT variable. It also misses a direct relative read such as fs.readFileSync('speck/config.yml') from the suite's repo working directory. The current AC3 samples only verify the supported single-line forms, so the required protection can be bypassed accidentally.",
        "suggested_fix": "Strengthen the guard to catch multiline root-based reads and repo-relative reads, while preserving temporary-repo cases. Add negative regression samples for these forms and verify they cause the guard to report a reader. Consider enforcement at runtime if source matching cannot reliably distinguish execution contexts.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The existing dependencies on the repo’s speck folder have been removed, and the full suite passes. However, the new safeguard misses common ways of reading that folder, including an ordinary multiline path. Fix that protection before merge so the same stale-test-result problem cannot quietly return."
  }
}
```

</details>
