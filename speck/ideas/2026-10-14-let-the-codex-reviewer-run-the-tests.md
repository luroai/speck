# Let the Codex reviewer run the tests

Captured: 2026-10-14 · Status: idea

## What
Let the Codex reviewer run the tests itself, in a throwaway copy of the code, instead of relying on the builder's test output.

## Why
The Codex reviewer runs in a read-only sandbox, so every verdict relies on the builder's test run. A stale or wrong test run would get through, and the reviewer spends tokens reasoning about tests it could simply run.

## Notes
- Was ticket 0024 (high risk), moved back to an idea on 2026-10-14 to keep the backlog focused. Its full draft, with acceptance criteria and checked facts, is in `speck/tickets/done/0024-let-the-codex-reviewer-run-the-tests.md`.
- High risk: it changes the reviewer's sandbox from read-only to writable, even if only a throwaway copy.
- Open questions from the draft: whether `codex exec resume` works from a different folder each round, and whether `codex exec --worktree` gives the throwaway copy directly.
