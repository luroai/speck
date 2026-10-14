---
id: "0024"
title: "Let the Codex reviewer run the tests"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0028"]                # ticket ids that must be done first
created: 2026-10-09
cancel_reason: "Moved back to an idea: speck/ideas/2026-10-14-let-the-codex-reviewer-run-the-tests.md"
cancelled: 2026-10-14

---
# 0024 · Let the Codex reviewer run the tests

**Status:** ❌ cancelled

## Problem
The Codex reviewer runs in a read-only sandbox, so it can't run the tests: every verdict on 0012–0014 said it relied on the builder's test output. A dishonest or stale test run would get through, and the reviewer spends tokens reasoning about tests it could simply run.

## Outcome
The Codex reviewer can run the project's tests on a throwaway copy of the commit it reviews, and the round records whether it did.

## Acceptance criteria
1. `speck review` with the `codex` adapter runs the reviewer in a temporary copy of the reviewed commit where it can write, and tells it in the prompt that it may run `commands.test` there. Nothing the reviewer writes reaches the repo, its working tree or its branches.
2. The temporary copy is removed after the round, including when the reviewer fails.
3. Each round records whether the reviewer ran the test command (from the reviewer's own command events), and the review pack shows it for each round.
4. Setting `run_tests: false` under `reviewer_options.codex` keeps today's read-only behaviour, with the reviewer in the repo itself.
5. Later rounds still resume the same Codex session.

## Out of scope
- Command reviewers (0012) and `claude-subagent`.
- Installing dependencies in the copy: gitignored files such as `node_modules` aren't there, so projects that need them may see test failures in the reviewer's run. Say so in `product.md`.

## Notes
- Risk is high because it changes the reviewer's sandbox from read-only to writable, even though it only writes to a throwaway copy.
- After 0028: the throwaway copy can be a worktree, created and removed with the same code. A worktree shares the repo's `.git`, so AC1 still means the reviewer mustn't be able to write refs there. Make sure the sandbox doesn't let it, or use a copy that doesn't share `.git`.
- Checked 2026-10-09: `codex exec` (codex-cli 0.159.0) takes `--sandbox read-only|workspace-write|danger-full-access`, `-C/--cd <dir>` and `--add-dir <dir>`.
- Unverified: whether `codex exec resume <session>` keeps working when it runs from a different folder each round (it has no `--cd` option). AC5 depends on this. If it doesn't, keep one copy per ticket at a fixed path across rounds.
- Unverified: `codex exec --worktree` ("run the session in a new managed Git worktree") might provide the throwaway copy directly. Check whether it reviews the right commit and cleans up after itself before relying on it.
- On by default for `codex`, so the reviewer actually checks. The assumption is that speed and token cost don't get worse, because the reviewer stops reasoning about test output it can't verify.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
