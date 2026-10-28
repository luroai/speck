---
id: "0550"
title: "Refuse a commit that adds a private word under speck/"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-28
started: "2026-10-28T13:26:41.669Z"

---
# 0550 · Refuse a commit that adds a private word under speck/

**Status:** 🔍 reviewing

## Problem
speck checks for private words and the home folder's path only when a ticket is linted (0083, 0121) or shipped (0506). Notes and tickets that an agent commits straight to the base branch, such as a capture, a ticketing or a triage commit, are never checked. On 2026-10-27 an idea note committed that way published the user's own domain, which is on their private-words list, and nobody noticed until it was on GitHub.

## Outcome
In a project set up with `speck init`, a commit that adds a private word or the home folder's path to a file under `speck/` is refused, however it's made.

## Acceptance criteria
1. After `speck init` in a git repository, `git commit` is refused, and nothing is committed, when a line it adds to a file under `speck/` contains one of the words in `~/.config/speck/private-words` (in any case) or the user's home folder's path, matched as `speck ship` matches them (0506). The message names each file and line number, without repeating the word, and says to take it out. The same holds for a commit made in any of the repository's git worktrees.
2. A commit commits as before when the lines it adds under `speck/` contain neither, when it changes only files outside `speck/`, or when the word or path is only on lines the commit doesn't add. Without a private-words file, only the home folder's path is checked.
3. When the repository already has its own pre-commit hook, or git's `core.hooksPath` is set, `speck init` leaves it unchanged and prints one line saying the private-words check for commits isn't installed, and why. Running `speck init` again neither adds the check twice nor removes it.
4. The brief's private-words section says that commits adding a private word or the home folder's path under `speck/` are refused, and that `git commit --no-verify` skips the check for one commit.
5. No test that passed before this change fails.

## Out of scope
- Checking files outside `speck/`. The repo's own private-words test covers those (0084), and a user's code can hold words they list on purpose, such as their name in a licence.
- Matching the machine's hostname by itself. A short hostname would match ordinary words, so list it in `~/.config/speck/private-words` if it's private.
- Removing words already in the history.
- Handing back a pull request refused for private words (`speck/ideas/2026-10-25-hand-back-a-pull-request-refused-for-private-words.md`).

## Notes
- Asked for 2026-10-28, after an idea note committed on `main` published the user's domain: "add that as a ticket right now to be built in the next release". Goes into 0.21.0 (0539).
- Reuse the matching in `scripts/private-words.mjs` (0506), so lint, ship and commits agree on what counts.
- speck's own automated commits (a build's, a ship's) go through the same check. They already write home paths as `~/` paths (0506), so they shouldn't be refused; if one is, its error should say why rather than fail without a reason.
- Checked 2026-10-28: git runs the pre-commit hook from `core.hooksPath` when set, otherwise from the repository's hooks folder, shared by all its worktrees, and `git commit --no-verify` skips it (`git help githooks`, git 2.53.0).
- Risk high: it changes how every commit works in a user's repository.
- Failing before this build: none
- `speck init --skip-checks` installs no hook, as it skips doctor's checks: every test fixture uses it, so their commits stay fast and aren't checked against the real home folder's words.
- Self-check: added a test that an unreadable private-words file refuses a commit under speck/ with a plain message (and lets one outside speck/ through); checked an initial commit (no HEAD) is refused too.

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
    "reviewed_sha": "4f71152d5a303a73ebdffcffee397a992b510382",
    "session": "fresh",
    "thread_id": "01a182b6-1b2d-70c2-b816-e78ff9585896",
    "builder_response": "- Tests run: `speck test --related test/commit-check-0550.test.mjs` (the ticket's own file plus every existing test file naming docs/brief.md, scripts/install.mjs or scripts/private-words.mjs, and the commands.checks files): 1158 pass, 0 fail.\n- Notes: the hook lives in the repository's shared hooks folder (`git rev-parse --git-path hooks/pre-commit`), so it covers every worktree. It runs `.speck/scripts/commit-check.mjs` from the worktree being committed in, which reuses `privateHit` (now shared with `speck ship`'s `privateLinesInSpeck`) on the lines `git diff --cached -U0` adds under speck/. `speck init --skip-checks` installs no hook, as it skips doctor's checks: every test fixture uses it, so their commits stay fast and aren't checked against the real home folder's words. AC5: the related run above passes; the whole suite runs at ship.\n",
    "seconds": 64,
    "usage": {
      "input_tokens": 180768,
      "cached_input_tokens": 138368,
      "cache_write_input_tokens": 0,
      "output_tokens": 1247,
      "reasoning_output_tokens": 276
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 42400,
      "cached": 138368,
      "write": 0,
      "output": 1247
    },
    "cost_usd": 0.1111068,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T13:33:18.821Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/commit-check.mjs: HOOK silently succeeds when the current worktree lacks commit-check.mjs; stagedPrivateLines also miscounts line numbers when diff.interHunkContext introduces context lines. Existing AC1 tests cover neither case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 integration tests exercise clean additions, files outside speck/, retained and removed private words, and a missing private-words file."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "installCommitHook preserves existing hooks and core.hooksPath. Passing AC3 tests exercise preservation, repeated installation and init's single-line explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's private-words paragraph describes refusal of added private words and home paths, and git commit --no-verify. The AC4 test checks the documented command."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related tests: 1158 passed, zero failed. No existing test was weakened in the supplied change; the whole-suite check remains for shipping."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs:15",
        "issue": "The shared hook loads its checker from the current worktree and exits successfully if it is absent. An existing worktree on a branch predating this installation therefore permits private words to be committed silently. Sharing the hook does not ensure that every worktree has the checker.",
        "suggested_fix": "Make the installed checker available independently of the current worktree's tracked version. Add an integration test committing from a worktree whose branch lacks the newly installed checker.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs:stagedDiff and stagedPrivateLines",
        "issue": "The diff inherits diff.interHunkContext. When this setting joins nearby hunks, unchanged context lines appear despite -U0. The parser advances its destination line counter only for added lines, so it reports subsequent private words at incorrect line numbers, violating AC1.",
        "suggested_fix": "Force --inter-hunk-context=0 or correctly count context lines. Test a configured inter-hunk context with separate nearby additions and assert their actual line numbers.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/commit-check-0550.test.mjs:154",
        "issue": "The documentation test requires the private-words path, pre-commit mention and bypass command to occur on the same physical line. Splitting the long paragraph while preserving every documented fact fails the test. This imposes a document layout requirement prohibited by the review rules.",
        "suggested_fix": "Check the required facts without requiring them to share a line or paragraph.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The check handles the tested everyday commits, but an older worktree can silently bypass it, and a Git setting can make reported line numbers wrong. These gaps and a layout-sensitive documentation test need fixing before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "733f720e54e48e5cbf9e0c89462c1ac9e9966d05",
    "session": "continued",
    "thread_id": "01a182b6-1b2d-70c2-b816-e78ff9585896",
    "builder_response": "- Tests run: test/commit-check-0550.test.mjs (plus the commands.checks files speck test runs itself)\n- F1: fixed. The hook now falls back to the main checkout's `.speck/scripts/commit-check.mjs` (found from `git rev-parse --path-format=absolute --git-common-dir`) when the worktree's branch has no copy, and only lets the commit through, with a warning saying so, when neither exists (speck removed). New test \"0550 AC1 F1\" commits a private word from a worktree whose branch has deleted .speck/ and is refused.\n- F2: fixed. `stagedDiff` passes `--inter-hunk-context=0`, and the parser also counts any context line it is shown. New test \"0550 AC1 F2\" sets diff.interHunkContext=10 and diff.context=5 and checks the reported lines are 2 and 6.\n- F3: fixed. The AC4 test now checks only that the brief contains `pre-commit` and `git commit --no-verify`, with no layout requirement.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 275213,
      "cached_input_tokens": 225792,
      "cache_write_input_tokens": 0,
      "output_tokens": 2032,
      "reasoning_output_tokens": 321
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7021,
      "cached": 87424,
      "write": 0,
      "output": 785
    },
    "cost_usd": 0.0306344,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T13:34:34.203Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 and F2 tests cover ordinary commits, path commits, worktrees and configured diff context. However, HOOK still bypasses checking when init was run in a linked worktree and neither the committing worktree nor the main checkout has the checker."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 integration tests cover clean additions, changes outside speck/, unchanged and removed private words, and a missing private-words file."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "installCommitHook and the passing AC3 tests preserve existing hooks and core.hooksPath, avoid duplicate installation and check init's explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md:174 describes refused commits and the one-commit --no-verify bypass. The revised AC4 test checks documented facts without constraining layout."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied round-two results report 118 passes and zero failures; the previous related run also had zero failures. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs:HOOK",
        "issue": "The fallback assumes speck was installed in the main checkout. If speck init runs in a linked worktree, its checker is installed there and the shared hook is installed successfully. A commit from another worktree lacking the checker also finds none in the main checkout, prints a warning and succeeds with private words. The new test covers installation in the main checkout only, so the every-worktree requirement remains unmet.",
        "suggested_fix": "Make the shared hook resolve a checker installed independently of the committing branch and main checkout, including when init runs in a linked worktree. Add a regression test initialising there and attempting a private-word commit from another worktree without the checker.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/commit-check.mjs:stagedDiff and stagedPrivateLines",
        "issue": "The incorrect line numbers caused by configured inter-hunk context are fixed: the diff explicitly disables it and the parser counts context lines defensively.",
        "suggested_fix": "No further change required; the passing F2 regression checks lines 2 and 6 with Git context settings enabled.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/commit-check-0550.test.mjs:AC4 test",
        "issue": "The revised documentation test checks the hook mention and bypass command without requiring a shared line or paragraph.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The line-number and documentation-test fixes work. One protection gap remains: installing speck in a linked worktree can leave other worktrees able to commit private words. That needs fixing before merge."
  }
}
```

</details>
