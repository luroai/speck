---
id: "0554"
title: "Say why Codex failed a review round"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-say-why-codex-failed-a-review-round.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29

---
# 0554 · Say why Codex failed a review round

**Status:** 📝 draft

## Problem
When Codex fails during a review round, `speck review` says only "codex exited 1:" with nothing after it, because with `--json` Codex writes its error to standard output as an event, and speck shows only its standard error. A builder or the user can't tell a usage limit from a broken setup or a bad prompt, so a build blocks without saying what to do: in 0540's build the reason only showed when Codex was run by hand.

## Outcome
A failed Codex review round's message gives Codex's own reason.

## Acceptance criteria
1. When `codex exec` exits non-zero during a review round and its JSON lines on standard output include an error event (`turn.failed` or `error`), `speck review`'s message gives that event's error message, for example Codex's usage-limit message with when it resets.
2. When standard output has no error event, the message gives the last lines of standard error, as today. When neither has anything, it says Codex gave no reason, rather than ending after the colon.
3. The message still starts by saying codex exited with its exit code, and no round is recorded, as today.
4. No test that passed before this change fails.

## Out of scope
- The other reviewers' failure messages (`scripts/reviewers.mjs`).
- Retrying a round after a usage limit.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0540's own note. The message is thrown in `runCodexReview` in `scripts/review.mjs`, which already parses standard output's JSON lines after a success.
- Quick test: a fake `codex` on the PATH that prints JSON lines and exits 1, as the existing review tests do.
- Checked 2026-10-29: codex-cli 0.159.0 is installed here, and its binary names a `turn.failed` event (the installed binary's strings).
- Unverified: which field holds the message in Codex's `turn.failed` and `error` events (a usage limit can't be brought on to look). The builder checks it against codex-cli's own source or docs for its `exec --json` events and records it here.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
