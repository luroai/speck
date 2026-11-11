---
id: "0654"
title: "Keep speck run's tests from finding this machine's agents"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:39:35.306Z"

---
# 0654 · Keep speck run's tests from finding this machine's agents

**Status:** 🔨 building

## Problem
The full suite fails on `main` from `fc53908` (0647) on: `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off is waited out when it starts, and holds new work too`. The tests start a real `speck run` with this machine's own PATH and home folder, so it finds the real Cursor CLI installed and signed in, takes it as the builder's bench (0647) and starts the second ticket on it instead of holding it. The result depends on which agents the machine running the tests has.

## Outcome
Tests that start a real `speck run` see only the agents they fake, so they give the same result on any machine, and the 0622 test passes again.

## Acceptance criteria
1. A test that starts `speck run` through `test/support/run.mjs` finds no Claude Code, Codex or Cursor CLI, and none of this machine's agent settings, sign-ins or session files, except those the test puts there itself.
2. `test/usage-limit-0622.test.mjs` passes on a machine with Cursor's CLI installed and signed in, with its new work still held while Claude is limited, as no other agent is ready in the test.
3. A test shows that, with a second faked agent ready on the builder's bench, new work starts on it while Claude is limited, as 0647 intends.
4. No test that passed before this change fails.

## Out of scope
- Changing 0647's behaviour.

## Notes
- Found 2026-11-11: the full run at `fc53908` failed on it, and it fails alone every time on this machine; its log says "new builds start on Cursor, the first agent on builder_bench that's ready and free".
- `test/support/run.mjs` passes `{ ...process.env, … }` to `speck run`, so PATH and HOME are the machine's.
- The full suite failing on `main` counts under Needs you until a run on a newer commit passes (0630).
- Failing before this build: none (the recorded result, from f6827fa, passed; the 0622 test is the one this ticket fixes)
- Self-check: no changes. The related run also failed `test/foreman-0285.test.mjs`'s two 0285 AC3 tests, which fail the same way without this change (a panel test, not speck run's), and once `0549 AC4`, which passes alone each time: neither is changed here.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
