---
id: "0119"
title: "Send the reviewer a summary of the test output"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-spend-fewer-tokens-per-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T11:03:24.826Z"

---
# 0119 · Send the reviewer a summary of the test output

**Status:** 🔨 building

## Problem
Every review round puts the builder's full test output in the reviewer's prompt. Here that's about 245 KB, or about 60,000 tokens, nearly all of it passing tests from other tickets. The reviewer re-reads it on every model call in the round, so it's likely over half of the 280k–1.26M input tokens a ticket's review costs, and it makes each round slower.

## Outcome
The reviewer gets a short summary of the test run that keeps everything it needs, instead of the full output.

## Acceptance criteria
1. When the test output given with `--tests` (to `speck review` or `speck prompt`) is TAP, as `node --test` writes it, the prompt's test output holds only:
   - the run's totals (tests, pass, fail, skipped and any other counts it gives);
   - every failing test, with all of its details;
   - every test whose name contains the ticket's id, with whether it passed.
2. The prompt says the output was summarised and gives the path of the full output file.
3. Passing tests whose names don't contain the ticket's id aren't in the prompt.
4. Test output that isn't TAP is put in the prompt in full, as it is today.
5. The build skill tells the builder to start each new test's name with the ticket's id and criterion number (for example `0119 AC2: …`), so the reviewer sees the ticket's own tests.

## Out of scope
- Letting the reviewer run the tests itself (0024).
- Summarising other test output formats.

## Notes
- Measured 2026-10-11: `/tmp/speck-0113-tests.txt` was 247 KB for 968 tests.
- Most tests in this repo already start with their ticket's id (for example `0077 AC2: …`).
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
