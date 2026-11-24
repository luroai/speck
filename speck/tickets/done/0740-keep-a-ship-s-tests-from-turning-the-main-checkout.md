---
id: "0740"
title: "Keep a ship's tests from turning the main checkout bare"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T20:10:40.702Z"
approved: "2026-11-24T20:48:23.518Z"
finished: "2026-11-24T20:51:33.613Z"

---
# 0740 · Keep a ship's tests from turning the main checkout bare

**Status:** ✅ done

## Problem
At 18:02:36 on 2026-11-24, during 0738's ship, `core.bare = true` was written to the main checkout's `.git/config`. Git then refused to work there, so the panel loaded no data, two later ships moved `main` without updating the files on disk, and builds stopped before starting. It can happen again on any ship until the cause is found.

## Outcome
Nothing a ship or its tests run can make the main checkout bare, and a ship refuses to go ahead if it finds it so.

## Acceptance criteria
1. The cause is found and named in the ticket's Notes: which command, run by which test or script, wrote `core.bare = true` to the main checkout. (checked by review)
2. Running the quick tests (`commands.test`) from the main checkout, as `speck ship` does, with `GIT_DIR`, `GIT_WORK_TREE` and `GIT_INDEX_FILE` set to the main checkout's in the environment, leaves its `.git/config` byte for byte as it was.
3. Every test helper that creates a bare repository creates it only in its own temporary folder, whatever git variables the environment holds.
4. When the main checkout isn't a work tree (`core.bare` is true), `speck ship` and speck run's ship queue refuse to ship, change nothing, and say that the main checkout's `core.bare` is set and how to set it back.
5. No test that passed before this change fails.

## Out of scope
- Repairing a checkout that has already fallen behind `main`: done by hand on 2026-11-24.

## Notes
- Evidence: `.git/config` was last written at 18:02:36, the second 0738's merge commit was made (`speck/.cache/runs/0738.ship.log`, whose quick tests ran 3,951 tests just before). The 0739 and 0738 ships then updated `main` without touching the index or files on disk.
- Places that run `git init --bare`: `test/support/ship.mjs`, `test/support/pr.mjs`, `test/support/doc-ship.mjs`, `test/tmp-cleanup.test.mjs`, and others found by `grep -rln -- --bare test/`. `git init` reinitialises the repository `GIT_DIR` names when that is set, so one leaked into a test's git command would make the main repository bare.
- Fixed by hand on 2026-11-24: `git config core.bare false`, then the files changed by the 0739 and 0738 ships restored from `HEAD`.
- Failing before this build: none
- Cause (AC1): not a ship's tests. The 0739 build, looking for the commit that broke two browser tests, made a worktree of this repository at `/tmp/speck-0739-bisect` and ran `git bisect run /tmp/speck-0739-bis.sh …` there, between 17:46 and 17:50. `git bisect run` gives its script `GIT_DIR` set to that worktree's folder in the main checkout's git folder (`.git/worktrees/speck-0739-bisect`), and the script ran `node --test` on `test/panel-0164.test.mjs` and `test/panel-0058.test.mjs`. Both make their repo with `panelRepo()`, whose first command, in `buildPanelRepo()` in `test/support/panel.mjs`, is `git init -q -b main` in a new temporary folder, run with `{ ...process.env, ...gitEnv }` and so with that `GIT_DIR`. With `GIT_DIR` set, `git init` reinitialises the repository it names instead of the folder, and as that path doesn't end in `/.git`, git takes the repository to be bare and writes `core.bare = true` to its config, which every worktree shares: the main checkout's `.git/config`. Worktrees other than the main checkout ignore `core.bare`, so builds, the 0739 build's own tests and the ships' tests carried on as before.
- Evidence for the cause: the main checkout's own reflog (`git reflog HEAD` there) has 0739's fix ticket committed there at 17:46:03, and nothing more until the repair; `main`'s reflog has the 0739 merge at 17:56:35 and the 0738 merge at 18:02:36, which the main checkout's reflog doesn't. With the main checkout bare, `git worktree list` shows it as bare, so `speck ship` found `main` checked out nowhere and merged each ticket in its own worktree, which is how `main` moved without the files on disk. The 18:02:36 time on `.git/config` came from 0738's ship deleting its branch: `git branch -D` rewrites `.git/config` every time, so it doesn't date the change. The bisect also named commits as bad that passed when the build ran them outside it, as the tests' git commands went to this repository. Reproduced on a clone: `git bisect run` in a worktree, with a script that calls `panelRepo()`, sets `core.bare = true` in the clone's `.git/config`, and `git status` in its main checkout then says "this operation must be run in a work tree".
- Self-check: an auto-ship refused while the main checkout was bare left its ship record, which speck run's ship queue would have taken as the ticket's last try, so after `core.bare` was set back the ticket would have waited for a new commit. The queue now removes that record when it sees the main checkout bare as the ship ends (test added), and carries on if it can't. Also checked: `git init --bare` given a folder still sets `core.bare` in the main checkout when `GIT_COMMON_DIR` is set, and fails when `GIT_WORK_TREE` is, so `initBare` gives git none of git's repository variables as well as the folder.

## In plain words
The main checkout stopped working on 24 November because of how one build hunted for a bug, not because of a ship. It ran speck's tests in a way that let them reach the real project folder instead of their own throwaway folders, and one of them switched off that folder's working files. speck's tests now always stay inside their own folders, however they're started. If the main checkout is ever switched off like that again, shipping refuses rather than moving the project on behind your back. It says what's wrong and gives the one command that switches it back on, and speck run holds every ship until you've run it, then carries on by itself.

There's nothing new to see day to day: ships and builds work as before, and the new message only appears if the problem comes back.

Worth keeping an eye on: in pull request mode, a ship refused for this waits for the next change to the ticket before speck run tries it again (saved as an idea). Builds and the panel still stop while the main checkout is switched off; only shipping says so (also saved as an idea).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Pull request shipping can merge after its tests make the main checkout bare.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 284,544
- Elapsed since build started: 38 min
- Changed lines: 67 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups saved to the inbox: `speck/ideas/2026-11-24-say-in-needs-you-when-the-main-checkout-isn-t-a-work-tree.md` (builds and the panel stop too while it's bare, and nothing says it needs you), `speck/ideas/2026-11-24-hold-the-pull-request-queue-while-the-main-checkout-is-bare.md` (the pull request queue counts a refusal for it as a try, so it waits for a new change once it's set back).
- Known limits, not saved as ideas: the brief doesn't mention the new refusal or the ship queue's hold. The variables the tests drop are git 2.53's `git rev-parse --local-env-vars` list, fixed in `test/support/git-env.mjs`. Only speck's own tests are kept from inheriting them: another project's tests run under `git bisect run` in a worktree can still make its main checkout bare, and its ships now refuse while it is.
- Builder's note: `speck test --related` chose every test file, as every one imports `test/support/tmp.mjs`. Its one failure, `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…`, is a known flaky test (three earlier entries in the flaky log on main's full suite) and passed when run again.

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
    "reviewed_sha": "01f0dba088cca384c2a14ec15e45256b9fa1127a",
    "session": "fresh",
    "thread_id": "01a20f4d-da88-7902-8eef-a9458ef28f88",
    "builder_response": "- Tests run: test/git-env-0740.test.mjs test/ship-bare-0740.test.mjs test/ship-0153.test.mjs test/ship-0204.test.mjs test/ship.test.mjs test/worktrees.test.mjs test/tmp-cleanup.test.mjs test/usage-limit-0622.test.mjs (with the commands.checks files `speck test --files` adds). This is the output attached: 270 tests, 0 failures.\n- Before it, `speck test --related` with this ticket's files chose all 659 test files, as every one imports test/support/tmp.mjs, which this ticket changes. It ran 6,024 tests with one failure, `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off is waited out when it starts, and holds new work too` (a race between a resume and a new launch, unrelated to git). It's in the shared flaky log three times on main's full suite, most recently at 2026-11-24T18:10, and passed when run again here with the files above. The related run's full output is kept at /tmp/speck-0740-related-run.txt.\n- AC1 (checked by review): the cause is in the ticket's Notes. In short, the 0739 build ran `git bisect run` in a worktree of this repository; git gives the script GIT_DIR naming `.git/worktrees/<name>`, and `panelRepo()`'s `git init -q -b main` in a temporary folder then reinitialised this repository, guessing it bare because that path doesn't end in `/.git`. Not a ship's tests. I reproduced it on a throwaway clone.\n- AC2: test/support/git-env.mjs takes git's repository variables (git 2.53's `git rev-parse --local-env-vars` list) out of process.env when it loads. tmp.mjs, which every test file must import first (checked by tmp-cleanup.test.mjs's AC1), now imports it before anything else, and so does the suite runner (test/support/suite.mjs). The two AC2 tests run the real quick-test runner (`node test/support/suite.mjs --quick`, as commands.test runs it) from a sandbox main checkout whose test/ folder holds a test file that loads the real tmp.mjs and makes repos with the real panelRepo(), shipRepo() and remoteMoves() plus raw `git init`/`git config`/bare `git init` with no folder, and a second test file that loads no support module, so only the runner can have cleaned its environment. One test sets GIT_DIR, GIT_WORK_TREE and GIT_INDEX_FILE to the main checkout's own, the other sets GIT_DIR as `git bisect run` does in a worktree (the incident). Both compare .git/config byte for byte. Running all 3,951 quick tests under those variables isn't practical in a test (about 3 to 6 minutes); the fixture runs the same runner and the same repo-making helpers.\n- AC3: `initBare(dir)` in git-env.mjs names the folder and gives git none of those variables (with GIT_COMMON_DIR set, git sets core.bare in the main checkout even when given a folder; with GIT_WORK_TREE set, it won't make the repository at all). Every place under test/ that made a bare repository now uses it: remoteMoves (ship.mjs), prRepo (pr.mjs), docPrRepo (doc-ship.mjs), and the helpers and tests in ship.test.mjs, ship-0153, ship-0204, worktrees.test.mjs and tmp-cleanup.test.mjs's fixture. A scan test keeps it that way.\n- AC4: scripts/bare-main.mjs reads `git worktree list --porcelain`: the main checkout is bare when its entry says `bare` and it has a .git folder. `speck ship` refuses first thing in cmdShip (both ship modes) and again after its tests, in case they made it bare, before any commit or merge. speck run's ship queue starts no ship while it's so, says it once with the `git -C … config core.bare false` command, reports it as its hold (so speck status and the panel show it), and ships again once it's set back; a ship refused while it's bare isn't counted as a try, isn't handed back or looked into, and its auto-ship record is removed so it isn't taken as the last try. scripts/ship.mjs was at its 600-line limit, so its three additions share lines with existing statements.\n- AC5: see the related run above.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 174597,
      "cached_input_tokens": 124032,
      "cache_write_input_tokens": 0,
      "output_tokens": 864,
      "reasoning_output_tokens": 65
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50565,
      "cached": 124032,
      "write": 0,
      "output": 864
    },
    "cost_usd": 0.1221732,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T20:45:18.117Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The ticket's Notes name git bisect run, the two panel tests, and panelRepo()'s git init -q -b main as the cause, explaining how inherited GIT_DIR changed the shared config."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "git-env-0740.test.mjs runs the real quick-test runner with the specified environment and real repository helpers, comparing .git/config byte for byte. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "initBare() strips repository environment variables and explicitly names the destination. All existing bare-repository creators use it; isolation, error handling and scan tests passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "cmdShip() checks initially and the local shipTicket() checks after tests. However, pr-ship.mjs runs testLanding() then calls gh pr merge without checking again. Existing PR coverage tests only an initially bare checkout."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded targeted run confirms 270 tests, zero failures and three skips, including the previously failing usage-limit test. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "Pull request shipping can merge after its tests make the main checkout bare. testLanding() returns directly to shipPrTicket(), which invokes gh pr merge without the safeguard added to local shipping. This leaves AC4 incomplete.",
        "suggested_fix": "Check refuseBareMain(repo, base) after PR landing tests and before merging. Add a PR-mode regression test whose test command sets the main checkout's core.bare=true; verify refusal, the repair instruction, and no GitHub merge or local tidying.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change isolates test repositories from inherited Git settings and blocks shipping when the main checkout is already bare. Local shipping also catches damage caused during tests. Pull request shipping misses that second check and could still merge, so that path needs fixing before approval."
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
    "reviewed_sha": "a073940f303c656bcaeda23a9571291cdfb052d1",
    "session": "continued",
    "thread_id": "01a20f4d-da88-7902-8eef-a9458ef28f88",
    "builder_response": "- Tests run: test/git-env-0740.test.mjs test/ship-bare-0740.test.mjs test/ship-0153.test.mjs test/ship-0204.test.mjs test/ship.test.mjs test/worktrees.test.mjs test/tmp-cleanup.test.mjs, and, as scripts/pr-ship.mjs changed this round, test/pr-ship-0296.test.mjs test/pr-private-0552.test.mjs test/pr-done-0315.test.mjs test/pull-request-0295.test.mjs test/pr-conflict-0323.test.mjs (with the commands.checks files `speck test --files` adds): 286 tests, 0 failures.\n- F1: fixed. testLanding() in scripts/pr-ship.mjs now calls refuseBareMain(at, base) straight after the tests run on the ticket as it would land, before it looks at their result, so shipPrTicket() never reaches `gh pr merge` or tidy() when the tests made the main checkout bare. New test in test/ship-bare-0740.test.mjs, \"0740 AC4: in pull request mode, a ship whose tests make the main checkout bare refuses before gh merges anything, changing nothing\": a pull request mode repo with its pull request open and a test command that sets the main checkout's core.bare to true. It checks the tests ran, the refusal names core.bare and gives `git -C <main checkout> config core.bare false`, gh was never asked to merge, the pull request is still open, the remote's main is unchanged, the ticket is still approved, and, once core.bare is set back, both branches and both folders are exactly as before (nothing tidied up). With the new line taken out, that test fails.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 283109,
      "cached_input_tokens": 227456,
      "cache_write_input_tokens": 0,
      "output_tokens": 1435,
      "reasoning_output_tokens": 65
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 5088,
      "cached": 103424,
      "write": 0,
      "output": 571
    },
    "cost_usd": 0.0262284,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T20:47:13.236Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The ticket's Notes identify panelRepo()'s git init -q -b main, run by the panel tests under git bisect run, and explain how inherited GIT_DIR caused the shared config to become bare."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The two passing AC2 tests in git-env-0740.test.mjs exercise the real quick-test runner and repository helpers with inherited Git variables, checking .git/config byte for byte."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "initBare() explicitly names its destination and strips Git repository variables. All bare-repository creators use it; the isolation, failure handling and scan tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdShip() refuses an initially bare main checkout; local shipping and PR testLanding() re-check after tests. Passing ship-bare-0740 tests cover both modes, queue holds and recovery, repair instructions, and unchanged branches and files."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh targeted output records 286 tests, zero failures and three skips, including PR regression coverage. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pr-ship.mjs",
        "issue": "PR shipping previously lacked a check after its tests, allowing a merge if those tests made the main checkout bare. testLanding() now checks immediately after testMerged(), before shipping can reach the GitHub merge.",
        "suggested_fix": "Implemented, with a passing regression test verifying no merge, unchanged remote main, an approved ticket, and unchanged local snapshots.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change prevents inherited Git settings from redirecting test commands into the main checkout. Both shipping modes and the automatic ship queue now refuse a bare main checkout and explain how to restore it. The missing pull request safeguard is fixed, and all reviewed tests pass."
  }
}
```

</details>
