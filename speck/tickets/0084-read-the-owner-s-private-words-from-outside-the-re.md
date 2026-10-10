---
id: "0084"
title: "Read the owner's private words from outside the repo in 0082's check"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:14:35.849Z"

---
# 0084 · Read the owner's private words from outside the repo in 0082's check

**Status:** 🔨 building

## Problem
0082's AC2 test checks that no tracked file names the owner, so it has to know the words to look for. It holds them in the test file, split into parts and joined at runtime. Anyone reading the file can join them too, so the repo still names the owner, and the history rewrite that follows 0082 can't remove them without breaking the test.

## Outcome
0082's check reads the words to look for from a file on the owner's machine, outside the repo, so no tracked file contains them in any form.

## Acceptance criteria
1. The check reads its words from `~/.config/speck/private-words` (the current user's home folder, as the operating system reports it): one word per line, ignoring blank lines and lines starting with `#`. Matching is case-insensitive and finds a word anywhere in a file, as today.
2. With at least one word listed, the check fails if a tracked file other than 0082's ticket file contains any of them, and its message names each such file. Otherwise it passes.
3. When the file is missing or lists no words, the check is reported as skipped, not as passed or failed, and the rest of the suite runs as normal.
4. `test/luro-0082.test.mjs` no longer contains the words, whole or in parts. Its other tests are unchanged.

## Out of scope
- A general speck feature for private words, such as a lint check. This only changes 0082's test.
- Rewriting history, which is done by hand after this ships.

## Notes
- The words are listed in 0082's ticket file (its AC2), which the reviewer can read. The history rewrite later replaces them there too, which is why 0082's ticket file stays excluded from the check for now.
- Tests should set `HOME` to a temporary folder, so they don't depend on the machine's own list.
- The owner keeps their list at that path on their machine. It's never committed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
