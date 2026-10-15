---
id: "0197"
title: "Run the full test suite once per review round in a build"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:17:42.890Z"
approved: "2026-10-15T13:29:49.753Z"
finished: "2026-10-15T13:33:39.516Z"

---
# 0197 · Run the full test suite once per review round in a build

**Status:** ✅ done

## Problem
A build runs the full test suite after implementing, again after each fix in its self-check, and again before each review round. With two builds at once each full run took 3 to 5 minutes on 2026-10-15, and full runs were 40 to 65% of every build's time (0180: 15 of 23 minutes). This slows every project that uses speck, more so the bigger its suite.

## Outcome
Between its starting check and its ship, a build runs the full suite only once before each review round, and uses the ticket's own tests the rest of the time.

## Acceptance criteria
1. The build skill tells the builder to run only the ticket's own test files (`speck test --files <file>…`) while implementing and while fixing what the self-check finds, then the full suite (`speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`) once, after the self-check and before the first review round. It no longer tells the builder to run the full suite when the ticket's tests first pass, or after each self-check fix.
2. The build and review skills tell the builder to run the full suite once before each later review round, merge rounds included, after its fixes for that round, and not at any other point between rounds.
3. If that full run fails because of the change, the skills tell the builder to fix it, using the failing tests' own files to check the fix, then run the full suite again before the round. A round is never started on a full run that failed because of the change.
4. The starting check (what fails before the build) and the steps for a ship that's handed back are unchanged, and the copies of both skills that `speck init` installs say the same as `skills/`.
5. No test that passed before this change fails, except checks of the old wording, which change to check AC1 to AC3.

## Out of scope
- Making each full run quicker (0198).
- The tests `speck ship` runs on the merged result, which stay the final check before anything lands.
- Choosing a subset of the suite by what a change touches.

## Notes
- Asked for 2026-10-15: "Builds take too long."
- The full-suite instructions are in `skills/speck-build/SKILL.md` section 3 steps 2 and 4 and section 4, and `skills/speck-review/SKILL.md` ("Your turn"). `.claude/skills/` holds this repo's installed copies.
- The starting check already reuses the saved result for the base branch (0112), so it costs nothing when the last ship tested the same code.
- Expected saving: about one full run per build, more with several review rounds. Not a target.
- Failing before this build: none
- Self-check: no changes

## In plain words
Builds now run the whole set of tests less often. While building and fixing, the builder checks its work with just the ticket's own tests, and runs everything once just before each review. If that full run turns up a problem the change caused, the builder fixes it and runs everything again before the review starts, so reviewers still always see a clean, complete run. You should notice builds finishing sooner, most of all when there are several review rounds. Worth watching: problems in other parts of the product now show up a little later in a build, at the full run before review rather than straight after the first fix.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 147,373
- Elapsed since build started: 12 min
- Changed lines: 15 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none sent to the inbox. Known limit: the first full run here failed on three timing-sensitive tests as well as the old-wording checks (0176 AC1, 0177 AC3, 0153 AC2), which passed on speck test's own rerun; speck already logs flaky tests, so no new note.

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
    "reviewed_sha": "bf6c4669e4f06c4146a4d8191f82be3f5651c9b9",
    "thread_id": "01a13fc0-a366-7f01-951a-5f5999cff53a",
    "seconds": 29,
    "usage": {
      "input_tokens": 146679,
      "cached_input_tokens": 100992,
      "cache_write_input_tokens": 0,
      "output_tokens": 694,
      "reasoning_output_tokens": 13
    },
    "saved_at": "2026-10-15T13:29:40.802Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md §3 steps 2, 4 and 5 use ticket files during implementation and self-check, then one full run before review. All three 0197 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Build skill §4 and review skill 'Your turn' require one full run after fixes before each later round, including merge rounds, and prohibit other runs between rounds. Both 0197 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both skills require change-caused failures to be fixed using failing test files, followed by another full run before review. The 0197 AC3 test checks all three instruction locations and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Git diff confirms pre-flight and handed-back ship steps are unchanged. Installed skills resolve to the source skills; installTooling copies both skills into both supported directories. Both 0197 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0197-tests.txt: 1862 tests, 1859 passed, 3 skipped, zero failures. Changes to test/files-0113.test.mjs replace assertions about the superseded timing with checks of the new timing."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The instructions now reserve full-suite checks for review rounds and use focused tests during implementation and fixes. They require another full check after fixing a failure. Starting and shipping checks remain unchanged, installed skills match, and the suite has no failures."
  }
}
```

</details>
