---
id: "0272"
title: "Run a project's quick repo-wide checks in every build"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0270"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T11:05:42.220Z"

---
# 0272 · Run a project's quick repo-wide checks in every build

**Status:** 🔍 reviewing

## Problem
Builds run only the ticket's own test files, and `speck ship` runs the whole suite. That's on purpose, to save the suite's minutes on every build (0113). But some of a project's tests check rules for the whole repo, such as speck's limit of 600 lines per script (0078 AC2) and its ban on commit ids in tests (0085 AC3). A build breaks those without knowing, and they only fail at ship time, costing a hand-back and another review round. Four of the six hand-backs on 2026-10-17 were rules like these.

## Outcome
A project can name the quick test files that check rules for the whole repo, and every build runs them alongside the ticket's own tests, so a broken rule is caught before review rather than at ship time.

## Acceptance criteria
1. A new setting, `commands.checks`, lists test files that check rules for the whole repo. It's in the config template, blank by default, with a comment saying what it's for, and `speck config set` accepts it.
2. When `commands.checks` lists files, the build skill runs them together with the ticket's own test files every time it runs those before a review round, merge rounds included, and treats a failure in them like a failure in the ticket's own tests. When it's blank, builds run as today.
3. A file listed in `commands.checks` that doesn't exist makes the run fail, saying which file is missing.
4. This repo's `speck/config.yml` lists the test files for 0078 AC2 and 0085 AC3, and any other test file that checks a rule for the whole repo and runs in under 5 seconds.
5. `docs/brief.md` describes `commands.checks` beside `commands.test_files`.

## Out of scope
- Running the whole suite during a build.
- The slow-test list, which 0271 makes unnecessary.

## Notes
- `commands.test_files` and `speck test --files` (0113) are the model: see `scripts/config.mjs` for the keys `speck config set` accepts.
- Criterion 2 is about the skill's instructions, so check it by review.
- Failing before this build: none
- AC4 has no automated test: 0122 forbids tests reading this repo's `speck/` folder. Check it by reading `commands.checks` in `speck/config.yml`; every `speck test --files` in this build also fails if a listed file is missing. Listed: 0078 AC2 (scripts under 600 lines), 0085 AC3 (no commit ids), 0122 AC1 (no test reads `speck/`), 0082 AC2 (private words), the tmp clean-up rule (every test file loads the helper first), 0173 AC2 (no single check that a stopped process has gone) 0068 AC3/AC4 (no product.md), 0253 AC2/AC4 (npx commands use the latest release; no release test checks the prompt's version), 0111 AC4 (no skill says builds run in parallel), 0116 AC4 (no doc describes the removed skill), review.test.mjs AC2 (no hard-coded model names), 0107 AC1 (skills stay in the slash menu) and 0205 AC4 (installed skill copies match `skills/`). Left out: `test/suite-0271.test.mjs` (0271 AC4) takes about 5.5 seconds and `test/docs-0267.test.mjs` about 7; `test/split-0270.test.mjs` repeats 0078 AC2 and its AC3/AC4 test fails on any branch that changes an existing test file.
- Self-check: a hand-written `commands.checks` that speck reads as a number was ignored; it's now checked as a file name like any other.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "283eecfede59fd1db04277fc90fbdf938340d2cd",
    "thread_id": "01a1498d-a2fc-7c12-ba13-61683aa6c1dd",
    "seconds": 32,
    "usage": {
      "input_tokens": 212924,
      "cached_input_tokens": 157824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1267,
      "reasoning_output_tokens": 156
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T11:10:13.806Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/config.yml defines blank commands.checks with an explanatory comment. scripts/config.mjs accepts it; passing 0272 AC1 tests cover setting, reading and clearing it."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md requires checks alongside ticket tests and treats their failures as blocking review. scripts/turns.mjs cmdTest automatically includes them in every --files run, including merge rounds. Passing AC2 tests cover inclusion, deduplication, failure propagation and blank settings."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/turns.mjs checkFiles validates listed files before starting tests and names missing files. Passing AC3 tests cover missing files, directories and blank commands.test_files."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "speck/config.yml includes the seven stated files but omits test/install-0253.test.mjs, which contains quick rules scanning skills and test files across the repo."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md describes commands.checks immediately after commands.test_files behaviour, including configuration, failures and blank behaviour. The passing AC5 test checks the setting names."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/config.yml",
        "issue": "The checks list misses test/install-0253.test.mjs. Its tests enforce repo-wide rules: every speck npx command across skills uses the latest release, and no test retains the obsolete release-prompt checks. The entire file uses local reads and assertions without starting processes, making it a quick repo-wide check required by AC4.",
        "suggested_fix": "Add test/install-0253.test.mjs to commands.checks and verify it passes within five seconds. Check the remaining repo-wide rule files for similar omissions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new setting works, and the supplied test run passed. Builds will catch failures in configured checks before review. The repo’s own list is incomplete, however: it leaves out a quick file that enforces rules across skills and tests."
  }
}
```

</details>
