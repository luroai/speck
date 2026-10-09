---
id: "0028"
title: "Build each ticket in its own worktree"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0027"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T09:59:49.248Z"
finished: "2026-10-09T10:09:15.198Z"

---
# 0028 · Build each ticket in its own worktree

**Status:** ✅ done

## Problem
Sessions that share one checkout keep colliding. One session's branch switch changes files under another's feet, one session's files end up in another's commits, and untracked files from elsewhere block reviews. This keeps happening and costs rework.

## Outcome
Each build happens in its own git worktree, so a build never touches the main checkout or another build.

## Acceptance criteria
1. `speck start <id>` takes a `ready` ticket, creates its branch from the local base branch in a new worktree outside the main checkout, sets the ticket to `building` and commits it there, then prints the worktree's path. The main checkout's branch and files are unchanged.
2. If `worktree_setup` in `speck/config.yml` is set (for example `npm ci`), `speck start` runs it in the new worktree. If it fails, the worktree and branch are removed, the ticket stays `ready`, and the error says why.
3. `speck start` refuses, changing nothing, if the ticket isn't `ready` or a branch or worktree for it already exists, and prints the existing path so a build can resume there. With worktrees on, it also refuses if `.speck/` or the installed skills aren't committed, because a worktree wouldn't have them, and says to commit them first.
4. With `worktrees: false` in config, `speck start` creates the branch in the current checkout as builds do today. New projects get `worktrees: true` and a blank `worktree_setup`, and this repo turns worktrees on.
5. The build skill uses `speck start <id>` and does all of its building, testing and reviewing in the printed worktree. When resuming a ticket, it continues in that ticket's existing worktree.

## Out of scope
- Running several builds at once: still one ticket at a time.
- Showing in-progress worktrees in `speck status` (0029).

## Notes
- Self-check: with worktrees off, a failed start commit (no git identity, say) left you on the new branch with a half-changed ticket. It's now undone as in worktree mode, with a test for both. The branch is named after the ticket's file, not its title, so a retitled ticket keeps a stable branch.
- Projects without a `worktrees` key keep today's behaviour (worktrees off). Only new projects, and this repo, get them on.
- The 0026 test expected checked facts to go into the start commit. `speck start` now makes that commit, so the build skill commits checked facts straight after it, and that one assertion was updated to match.
- Pre-check: AC1's "up-to-date base branch" could have meant fetching from the remote. It now says the local base branch; the build skill's pre-flight still pulls first.
- Checked 2026-10-09: this repo tracks `.speck/` (links to `scripts/` and `templates/`) and the skills, so a worktree has the speck CLI.
- Checked 2026-10-09: `speck init` doesn't commit or ignore `.speck/` or the skills in a user's project. A worktree only has the CLI and skills if the user has committed them (AC3 makes `speck start` refuse in that case; agreed 2026-10-09).
- After 0027, because builds in worktrees need to ship from one.
- This reverses the "Worktrees rejected for now" decision in `speck/ideas/2026-10-08-speck-board.md`. The reason is isolation between sessions, not parallel builds. Update that note and `product.md`.
- Worktrees share one `.git` object store, so a new one adds only the checked-out files. Gitignored files (`node_modules`, `.env`) aren't there, which is what `worktree_setup` is for.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 run from inside an in-progress worktree, `speck start` refused on status before printing where to resume; F2 the tooling check used the index, so staged-only tooling, or tooling on another branch, passed. Round 2 (codex): approved.

## Delivery log
- Review rounds: 2 (codex, `gpt-6.1-sol`), with 523,909 reviewer tokens.
- Elapsed: about 9 minutes from start to approval (from `speck pack`).
- Changed lines: 115 (excluding tests and `speck/`), against a limit of 5,000.
- Follow-up ideas:
  - The empty `<checkout>.worktrees/speck/` folder stays after the last worktree in it is removed. Ship could tidy it.
  - `speck start` with worktrees off still needs the whole checkout clean. With worktrees on, only the ticket file needs to be committed.

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
    "reviewed_sha": "9781af6cde12ece9dbd72c6c46a889fae795a576",
    "thread_id": "01a1201f-ec3e-7f93-9c99-e39086e9ea79",
    "seconds": 42,
    "usage": {
      "input_tokens": 149275,
      "cached_input_tokens": 93440,
      "cache_write_input_tokens": 0,
      "output_tokens": 1091,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-09T10:06:07.604Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdStart creates the branch from cfg.base_branch and finishStart commits building status. The 0028 AC1 integration test checks isolation, ancestry, status, commit and printed path; builder reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStart runs setup with cwd set to the new worktree and removes the worktree and branch on non-zero exit. The passing 0028 AC2 integration test exercises successful setup and failure with an error message."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "cmdStart rejects non-ready status before looking up the existing worktree, so those refusals omit its path. Its tooling check uses git ls-files, which includes staged additions and does not establish that tooling exists on the base branch. The AC3 test misses both cases."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "loadConfig defaults worktrees to false; cmdStart implements the current-checkout mode. templates/config.yml and speck/config.yml enable worktrees with blank setup. The passing 0028 AC4 test checks these settings and current-checkout behaviour."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "skills/speck-build/SKILL.md pre-flight step 2 instructs resuming building/reviewing/blocked tickets through speck start, but cmdStart returns only a status error for these tickets. The AC5 test checks wording without exercising this interaction."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "cmdStart checks ready status before finding an existing branch/worktree. Running it from an in-progress ticket's worktree therefore prints no resume path, contrary to AC3 and the build skill's explicit resume instructions.",
        "suggested_fix": "Discover the existing ticket branch/worktree before returning the status refusal and include its path. Add integration tests for building, reviewing and blocked tickets invoked from their existing worktree.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The committed-tooling guard checks the current index with git ls-files. Staged, uncommitted tooling passes it, as does tooling committed only on the caller's branch but absent from cfg.base_branch. The resulting worktree can lack the CLI or skills. Checking any tracked file under .speck and only speck-build also does not establish that the installed tooling is present.",
        "suggested_fix": "Validate the required CLI and installed skills against the base commit used to create the worktree, including symlink targets where applicable. Refuse before creating anything when required tooling is absent or only staged. Add tests for staged tooling and tooling absent from the base branch.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The new description promises committed-tooling protection and resume-path reporting that the implementation does not fully provide."
    },
    "escalation_question": "",
    "summary": "The main worktree creation and setup flows have useful integration tests and appear sound. Two gaps need fixing: resuming an in-progress build does not print its folder as instructed, and the tooling check can allow a worktree without the CLI or skills. The reported tests pass but miss these cases. I inspected the repository read-only; I did not rerun tests because they create files."
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
    "reviewed_sha": "91af583605bed5a6b18a6fa8f598674ac76f77d7",
    "thread_id": "01a1201f-ec3e-7f93-9c99-e39086e9ea79",
    "seconds": 38,
    "usage": {
      "input_tokens": 371613,
      "cached_input_tokens": 293120,
      "cache_write_input_tokens": 0,
      "output_tokens": 1930,
      "reasoning_output_tokens": 81
    },
    "saved_at": "2026-10-09T10:08:28.476Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdStart and finishStart create the branch from the local base, commit building status and print the external worktree path. The passing 0028 AC1 integration test checks branch ancestry, commit, status and unchanged main checkout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdStart runs worktree_setup in the new worktree and rolls back on failure. The passing 0028 AC2 integration test verifies setup location, error details, branch/worktree removal and ready status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdStart now discovers existing branches before checking status; inCommit checks required tooling in the base commit. Passing AC3, AC3/AC5 (F1) and AC3 (F2) integration tests cover refusals, resume paths, staged-only tooling, tooling on another branch and committed/dangling relative symlinks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "loadConfig defaults worktrees to false; templates/config.yml and speck/config.yml enable it with blank setup. The passing 0028 AC4 test exercises current-checkout mode and checks configuration defaults."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md pre-flight requires speck start and all subsequent work in the printed folder. The passing AC5 instruction test and AC3/AC5 (F1) integration test cover the instructions and resume-path behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Non-ready tickets previously returned before discovering and printing their existing worktree.",
        "suggested_fix": "Implemented: existing branch/worktree discovery precedes status validation, with integration coverage for building, reviewing and blocked tickets.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The previous index-based tooling check could accept tooling absent from the base commit.",
        "suggested_fix": "Implemented: required CLI and installed skill paths are checked in the base commit, following committed relative symlinks. Added integration tests for staged-only and other-branch tooling and symlink targets.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated start description reflects base-commit tooling checks and resume-path reporting."
    },
    "escalation_question": "",
    "summary": "Both blocking findings are resolved. Builds are isolated in their own worktrees, setup failures roll back, and existing builds report where to resume. All five criteria pass based on code inspection and the supplied passing test results. I did not rerun the file-creating tests in this read-only review."
  }
}
```

</details>
