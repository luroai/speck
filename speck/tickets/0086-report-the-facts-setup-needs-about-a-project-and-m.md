---
id: "0086"
title: Report the facts setup needs as JSON                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10

---
# 0086 · Report the facts setup needs as JSON

**Status:** 📋 ready

## Problem
To set speck up through a conversation, the agent needs to know what's already in place: Node, git, the repo's state, which coding agents are installed and how the project runs its tests. Today it would have to work each of these out with its own commands, differently every time, and speck's own checks only print ✓ and ✗ for a person to read.

## Outcome
`speck detect` prints everything setup needs to know as one JSON object, without changing anything, so the setup skill can decide what to ask.

## Acceptance criteria
1. `speck detect` prints one JSON object and exits 0 in any folder, a git repo or not, and changes nothing in the folder or in git. It also works before speck is installed, as `npx github:luroai/speck detect`.
2. The object reports the operating system and whether speck supports it (macOS and Linux do); the Node.js version and whether it's 20 or newer; whether git is installed; and, for the folder, whether it's a git repo, whether it has commits, whether its tracked files have uncommitted changes, the current branch, which of `main` or `master` exists, and whether a git name and email are set.
3. It reports whether speck is installed in the folder (`speck/config.yml` exists) and, if so, the installed version from `.speck/VERSION`.
4. It reports, for `claude`, `codex`, `cursor-agent` and `gemini`, whether each is on the PATH, and for `codex`, whether it's signed in (as `speck doctor` checks it).
5. It suggests a test command and a `worktree_setup` from the project's files, or `null` when it finds none: `npm test` when `package.json` has a real `test` script (not npm's default "no test specified"), an install command matching the lockfile (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --frozen-lockfile` or `bun install`), `pytest` for a Python project that uses pytest, and `make test` for a `Makefile` with a `test` target.

## Out of scope
- Asking questions or changing anything: that's the setup skill (0088).
- Checking whether Claude Code is signed in.

## Notes
- The CLI never asks questions; the agent does. Everything here is a fact, not a decision.
- Missing tools and unknown values are `false` or `null` in the JSON, never errors.
- Checked 2026-10-10: `npx github:<owner>/<repo>` runs the package's `speck` bin with the given arguments, and `#<tag>` pins a git ref (npm 10 `package-spec` docs).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
