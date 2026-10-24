---
id: "0447"
title: "Keep related tests from picking the whole suite"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:45:31.476Z"
approved: "2026-10-24T07:57:43.023Z"

---
# 0447 · Keep related tests from picking the whole suite

**Status:** 👍 approved

## Problem
`speck test --related` (0437) brings in a test through a module under `test/support/` when the module names a changed file. Nearly every support module names `scripts/speck.mjs`, the CLI they run, so any change to it picks almost the whole suite (374 of 390 test files for 0437), and a change to one `SKILL.md` picks every test naming any skill.

## Outcome
`speck test --related` picks the tests that really cover a change, so a build that changes the CLI or a skill runs a small set.

## Acceptance criteria
1. A test file is brought in through a module under `test/support/` only for a changed file that at most a quarter of those modules name. A changed file named by more of them, such as `scripts/speck.mjs`, brings in only the test files that name it themselves.
2. A change to one skill's `SKILL.md` brings in only test files that name that skill, by its folder (such as `skills/speck-build`) or its name (such as `speck-build`).
3. For a branch that changes `scripts/turns.mjs`, `skills/speck-build/SKILL.md` and `docs/brief.md`, as 0437's did, `--related` picks fewer than 100 test files, including every test file that names `scripts/turns.mjs` itself.
4. `docs/brief.md`'s `speck test` row says how `--related` chooses.

## Out of scope
- Running the whole suite at ship.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From my own note on 0437's first `--related` run. `speck test` is in `scripts/turns.mjs`.
- Waits for nothing: no open ticket changes these files.
- Failing before this build: none
- Self-check: support modules that import each other in a loop now each name what the other does, and a file at the repo's root is named after `../` but not after another folder.
- 0437's tests' fixture gets two more empty support modules, so its panel page is named by one of four modules rather than one of two and still counts through it.
- AC3 measures a copy of this repo's `test/` folder as it is (a test may not name a commit, so it can't be pinned to the tree the ticket measured): today it picks 96, most of them (70) for naming `docs/brief.md` itself.

## In plain words
Before its first review, a build runs the existing tests that cover what it changed. Until now, changing speck's main command or one of its skills made that pick almost every test, so the check took as long as the full run. Now a build that changes the main command runs about 85 tests rather than 374, and a change to one skill brings in only the tests about that skill. You can see it in a build's log: the list of related tests it prints before the first review is much shorter. Worth keeping an eye on: the design brief is checked by about 70 tests, so a change to it still brings in a fair number, and that count grows as tests are added.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 131,671
- Elapsed since build started: 12 min
- Changed lines: 63 (limit 5000)
Follow-ups:
- The AC3 count (96 today, limit 100) grows with every test that names `docs/brief.md`, so it will start failing an unrelated ship. Saved to the inbox: `speck/ideas/2026-10-24-keep-the-related-tests-count-check-from-failing-as-tests-grow.md`.

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
    "reviewed_sha": "448124a97f413291c9e982e2ce6c3b70ddcf8b6f",
    "session": "fresh",
    "thread_id": "01a16ce9-9d3f-79b3-a521-ca2ac4812ab5",
    "builder_response": "- Tests run: `speck test --related test/related-0447.test.mjs test/related-0437.test.mjs` (70 test files, commands.checks alongside): 764 pass, 0 fail.\n- Round 1. Notes on choices:\n  - The ticket says nearly every support module names `scripts/speck.mjs`, but by their own text only 11 of 51 do (under a quarter). Most of the rest run the CLI through `panel.mjs`, `cli.mjs` or `ship.mjs`, so a support module now names a file when it, or a support module it imports, does. With that, `scripts/speck.mjs` is named by more than a quarter and brings in only tests that name it directly (85 today, was 374).\n  - Basename matching was also letting `./support/speck.mjs` name `scripts/speck.mjs`. A file name after a `/` now counts only after its own folder's name (`scripts/speck.mjs`, `../scripts/speck.mjs`, `.speck/scripts/speck.mjs`), or after `../`/`./` for a file at the repo root.\n  - AC2: a SKILL.md is named by its folder path, by `<parent>/<skill>` (so `skills/speck-build` names `.claude/skills/speck-build/SKILL.md`), or by the skill's name not straight after `/`, `.` or `$`, so `/speck-build` and `$speck-build` commands in build_command fixtures don't count as reading the skill. Never through a support module.\n  - AC3 copies this repo's current `test/` folder (a test can't pin a commit id: history-0085 forbids it). Today: 96 picked (70 of them name docs/brief.md directly).\n  - 0437's test fixture gets two more empty support modules, so its panel page is named by one module in four and still counts through it; the test's intent is unchanged. Its repo/write helpers moved to `test/support/related.mjs` for sharing.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 131059,
      "cached_input_tokens": 82176,
      "cache_write_input_tokens": 0,
      "output_tokens": 612,
      "reasoning_output_tokens": 89
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:57:22.561Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/related.mjs: relatedTests counts support modules naming each changed file, follows their imports safely through cycles, and permits indirect selection only at or below one quarter. Passing 0447 AC1 tests cover the threshold, direct selection, transitive imports and cycles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/related.mjs: namer matches SKILL.md changes by skill folder or name; relatedTests excludes indirect skill selection. The passing 0447 AC2 test covers matching skills, other skills, generic SKILL.md references and support imports."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0447 AC3 test copies the repository’s current test folder, changes the three specified files, asserts fewer than 100 selections and checks inclusion of every test naming turns.mjs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md’s speck test row explains direct naming, skill matching, support imports and the quarter threshold. The passing 0447 AC4 test checks relevant file and command facts without fixing prose wording."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Related test selection now avoids broad support helpers pulling in almost the whole suite and distinguishes individual skills. The tests exercise the selection rules and the requested under-100 benchmark. The recorded run passed 764 tests with no failures; I found no blocking issues."
  }
}
```

</details>
