---
id: "0089"
title: "Lead the README with a prompt to give your agent"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0088"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T15:33:39.042Z"

---
# 0089 · Lead the README with a prompt to give your agent

**Status:** 🔨 building

## Problem
The README starts with requirements and a terminal command, which assumes the reader is comfortable installing tools and editing config. The people speck is for would rather tell their agent what they want, and setup is now a conversation (0088).

## Outcome
The README's first step is a short prompt to copy into your coding agent, which installs speck at this release and takes you through setup.

## Acceptance criteria
1. Right after the introduction, a "Get started" section gives a prompt in a code block to paste into Claude Code. The prompt runs `npx github:luroai/speck#v<version> init`, then follows the `speck-setup` skill, offers to install Node.js 20 or newer first if it's missing, and asks before changing anything on the machine or in git.
2. `<version>` in the prompt is the version in `package.json`. A test checks they match, so a release can't leave the prompt pointing at an old version.
3. The terminal command without an agent moves to a later section ("Without an agent"), unchanged in what it does.
4. Requirements name macOS or Linux, Claude Code, git and Node.js 20 or newer (which the agent can install), with Codex optional as the reviewer.

## Out of scope
- The release itself (0092) and the licence (0090).

## Notes
- Checked 2026-10-10: `npx` assumes `--yes` when standard input isn't a terminal, as when an agent runs it, so the prompt doesn't need `-y` (npm 10 `npm exec` docs).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
