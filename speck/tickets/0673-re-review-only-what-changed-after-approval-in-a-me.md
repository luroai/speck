---
id: "0673"
title: "Re-review only what changed after approval in a merge round"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:05.771Z"

---
# 0673 · Re-review only what changed after approval in a merge round

**Status:** 🔍 reviewing

## Problem
When a ship is refused for a conflict or for tests that fail on the change as it would land, the build merges the base branch in and the change is reviewed again. That merge round gives the reviewer the branch's whole change against the base branch, so it reads again everything it has already approved. This repo has had 155 merge rounds, and a ticket whose ship is refused takes 12.6 minutes from its first ship attempt to shipped, against 3.8 for one that ships cleanly.

## Outcome
A merge round gives the reviewer only what changed since it approved: how each conflict was resolved and anything the build changed after.

## Acceptance criteria
1. In a merge round that follows a merge of the base branch, the diff in the reviewer's prompt holds what the merge changed beyond a clean merge (each resolved conflict, and anything else changed by hand in the merge commit) and every change committed after it. A file the base branch changed and the ticket didn't isn't in it, nor is a part of the ticket's change that the merge left as it was approved. When that leaves nothing, the prompt says so in words, and the round still runs.
2. The prompt names the commit the reviewer approved, says the base branch has been merged in since, and gives the command that prints the whole change against the base branch, for the reviewer to run when it needs the rest.
3. Every other round is given what it is today: round 1 the whole change, a later round the changes since the last review, and a round before the first approval whose branch has merged the base branch in, the whole change as merged.
4. `docs/brief.md` (Merge rounds), `skills/speck-review/SKILL.md` and the Conflict step of `skills/speck-build/SKILL.md` each say what a merge round shows the reviewer, and none still says it's the whole change against the base branch.
5. No test that passed before this change fails.

## Out of scope
- When a round counts as a merge round, and `limits.max_merge_rounds`.
- What `speck ship` checks and tests before it lands a change.
- A round before the first approval.

## Notes
- Decision: what the base branch brought in was reviewed in its own tickets, and `speck ship` tests the two together as they would land (0192), so the merge round's job is the resolution and any fix.
- `reviewSince` in `scripts/review.mjs` picks where the diff starts, and the prompt's lines for a round after a merge are just above it (0097, 0241).
- Checked 2026-11-15: `git show --remerge-diff <merge>` prints what a merge commit changed beyond git's own merge of its two parents, and runs on git 2.53.0 here. It came in git 2.36 (git's release notes). `speck ship` already uses `git merge-tree --write-tree`, which came in git 2.38, so a git that can ship has it.
- Failing before this build: none
- Self-check: `speck diff` printed only the diff, so a claude-subagent reviewer wouldn't get the approved commit or the whole-change command; it now prints the same paragraph, heading and diff as the prompt in a merge round after a merge. Renamed 0241's "still given the whole change as merged" test to match what it checks.
- Changed tests: 0048 AC3 and 0048 round 1 F1 checked that a merge round after a merge gets the whole change (`+feature`); AC1 here replaces that, so they now check the resolved conflict, the new heading and the whole-change command instead.
- AC4 has no test: it's about how the brief and two skills read, so the reviewer checks it by reading `docs/brief.md` (Merge rounds), `skills/speck-review/SKILL.md` (claude-subagent round 2) and `skills/speck-build/SKILL.md` (Conflict step 5). Review round 1 F1.
- Pictures: none, because nothing anyone sees in the panel changes.
- What this gives up: a second read of the whole change sometimes finds what round 1 missed. 0667 had 4 review rounds, 3 of them merge rounds, and its first merge round raised two findings on the ticket's own change. After this, a merge round finds only what the merge and the changes after it got wrong.
- speck (2026-11-15 13:58 UTC) told you: Nothing is stuck. The build is near its end and has run the related tests, about 2,600 of them, twice and is starting a third run so the reviewer gets clean output. A machine load of about 45 made each run slow. The second run hit a ship queue timing test (0264 AC3) that failed once in three runs on its own. It's flaky under load and unrelated to this change. Why: The build log shows each step finishing and both large test runs completing with only expected or unrelated failures, nothing hanging, while the load average stayed between 36 and 46 throughout.

## In plain words
When an approved ticket can't ship because other work landed on the same files, the build merges that work in and asks the reviewer to look again. The reviewer used to reread the whole ticket every time. Now it's shown only how the clash was settled and anything changed afterwards, with a note saying which version it approved and how to see the whole change if it needs to. Tickets that bump into other work should get back to shipping faster. You can see it in a ticket's review pack: a merge round's summary talks about the merge rather than the whole ticket. Keep an eye out for anything a merge round now misses that a second full read would have caught.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (known limit): a merge round's diff also shows the ticket file's own changes since the approval, such as `speck close` setting it approved and filling its logs, as any later round's diff does. Only the review rounds are left out.
- Follow-up skipped, already captured: `0264 AC3` failed once in a related run and passes alone (speck/ideas/2026-11-11-steady-the-0264-ac3-ship-queue-test.md).
- Follow-up skipped, already captured: `0109 AC1` failed once in a related run and passes alone (speck/ideas/2026-11-08-steady-six-speck-run-timing-tests-under-load.md).

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
    "reviewed_sha": "510379e5a3e420f4120859b40c0c129f9ceba831",
    "session": "fresh",
    "thread_id": "01a1df85-9fed-7282-8cc3-c48bdc3e7c59",
    "builder_response": "- Tests run: `speck test --related test/review-0673.test.mjs test/review-0241.test.mjs test/ship-0048.test.mjs` (the ticket's own file, the two existing files it changed, and the 247 related files plus commands.checks). 2600 of 2604 pass, 3 skipped; the one failure, `0109 AC1: with a run already going in another worktree, speck test waits...`, is a timing test on test turns that this change doesn't touch, and it passes when run on its own. An earlier related run had another timing failure the same way (0264 AC3, the ship queue's launch), which also passes on its own.\n- How it works: `reviewSince` in scripts/review.mjs, in a merge round whose branch has merged the base branch in since the last reviewed commit, starts the diff at the tree of `git merge-tree --write-tree <last reviewed> <new merge base>`: git's own merge, conflict markers and all. So the diff holds each resolution, any hand change in the merge and every later commit, and leaves out files only the base branch changed and the parts of the ticket's change the merge left alone. If git can't work out the merge, it falls back to the whole change as merged, as before. `diffSection` builds the prompt's paragraph (approved commit, base merged in since, `git diff <merge base> HEAD` for the whole change) and the \"Nothing: …\" sentence when the diff is empty.\n- `speck diff` prints the same paragraph, heading and diff in that case, so a claude-subagent reviewer gets what Codex gets.\n- Changed existing tests: 0048 AC3 and 0048 round 1 F1 checked that a merge round after a merge is given the whole change (`+feature`, the \"whole change against main as merged\" heading, `(<merge base>..HEAD)`). This ticket's AC1 reverses that, so they now check the resolved conflict (`-=======`), the new heading and the `git diff <merge base> HEAD` command, and still check that main's own file isn't shown and that speck diff matches the prompt. 0241's \"still given the whole change as merged\" test only had its name changed; its assertion is unchanged.\n- Docs: brief Merge rounds paragraph, speck-review's claude-subagent round 2 line (`speck diff`) and speck-build's Conflict step 5.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 161789,
      "cached_input_tokens": 114688,
      "cache_write_input_tokens": 0,
      "output_tokens": 995,
      "reasoning_output_tokens": 69
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47101,
      "cached": 114688,
      "write": 0,
      "output": 995
    },
    "cost_usd": 0.1156208,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:04:33.949Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/review.mjs reviewSince and cleanMerge compare HEAD with Git's computed merge tree. Passing 0673 AC1 tests cover conflict resolution, hand edits, later commits, excluded files and an empty diff that still runs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "diffSection names the approved commit, explains the merge and provides the whole-change command. Passing 0673 AC2 checks both the reviewer prompt and speck diff, and executes the supplied command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0673 AC3 exercises round 1, a later round without a merge and a merge before first approval. reviewSince retains their previous behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The brief's Merge rounds paragraph, speck-review's claude-subagent instructions and speck-build's Conflict step 5 describe the reduced diff. The reported AC4 test passes, although its wording assertions violate the review rules (F1)."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported run: 2600 passed, three skipped and one timing failure in 0109 AC1 that reportedly passes alone. Inspection of that test and the scoped changes provides no evidence of a regression caused by this implementation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/review-0673.test.mjs:135",
        "issue": "The AC4 test checks exact prose in docs/brief.md, including forbidden sentence fragments and the required phrase 'clean merge'. It also extracts only the paragraph's first line. A harmless rewording or reflow can fail this test. The review rules explicitly prohibit tests of document wording.",
        "suggested_fix": "Remove the brief's prose assertions and check its explanation by review. Mark the documentation wording criterion '(checked by review)' rather than enforcing particular phrases.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The implementation and reported tests support the intended narrower merge review, including empty diffs and access to the whole change. One test must change before approval: it locks the design document to particular wording, which the review rules prohibit."
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
    "reviewed_sha": "7cf4a1e57d1a03fbc90b7b4b44fb0d68f758129a",
    "session": "continued",
    "thread_id": "01a1df85-9fed-7282-8cc3-c48bdc3e7c59",
    "builder_response": "- Tests run: test/review-0673.test.mjs test/review-0241.test.mjs test/ship-0048.test.mjs, with commands.checks (166 pass, 3 skipped, 0 fail).\n- F1: fixed. Removed the AC4 test from test/review-0673.test.mjs (and the ROOT path it used). I haven't edited the ticket's acceptance criteria, because changing them after ready would take the ticket out of auto_ship. Its Notes say instead that AC4 has no test and is checked by reading docs/brief.md (Merge rounds), skills/speck-review/SKILL.md (claude-subagent round 2) and skills/speck-build/SKILL.md (Conflict step 5).\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 262590,
      "cached_input_tokens": 211200,
      "cache_write_input_tokens": 0,
      "output_tokens": 1581,
      "reasoning_output_tokens": 149
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4289,
      "cached": 96512,
      "write": 0,
      "output": 586
    },
    "cost_usd": 0.0240892,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:10:02.199Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "reviewSince and cleanMerge in scripts/review.mjs retain the reduced merge-tree diff. Passing 0673 AC1 tests cover conflicts, hand edits, later commits, excluded files and an empty diff that still runs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "diffSection names the approved commit and supplies the whole-change command. Passing 0673 AC2 exercises the reviewer prompt and speck diff and executes that command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0673 AC3 verifies round 1, later rounds without a merge and merges before first approval retain their previous diff behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Checked by reading, as clarified in the ticket's Notes: docs/brief.md:122 describes resolutions and subsequent changes; skills/speck-review/SKILL.md:91 describes the reduced diff and whole-change command; skills/speck-build/SKILL.md:118 gives the same guidance for conflict reviews."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest reported run of the three affected test files and commands.checks has 166 passes, three skips and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/review-0673.test.mjs",
        "issue": "The documentation wording test identified in round 1 has been removed, along with its unused ROOT constant.",
        "suggested_fix": "None required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change narrows merge reviews to conflict resolutions and subsequent edits while preserving access to the whole change. The problematic documentation test is removed, the guidance is consistent, and the latest tests pass. Ready for merge consideration."
  }
}
```

</details>
