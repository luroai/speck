---
id: "0089"
title: "Lead the README with a prompt to give your agent"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 👍 approved

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
- Self-check: no changes. Checked that `speck init` works in an empty folder that isn't a git repo yet, so the prompt's order (init, then the setup skill) holds for a new project too. The tag `v0.1.0` doesn't exist yet; the release (0092) creates it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 258,544
- Elapsed since build started: 6 min
- Changed lines: 27 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: the prompt pins `#v0.1.0`, which works once the release (0092) creates that tag.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5c127a54b499f2bd6607e7d77c75afc12fc633d9",
    "thread_id": "01a12678-01cd-7c92-ae2d-8ed3e7fe790c",
    "seconds": 24,
    "usage": {
      "input_tokens": 257852,
      "cached_input_tokens": 166016,
      "cache_write_input_tokens": 0,
      "output_tokens": 692,
      "reasoning_output_tokens": 76
    },
    "saved_at": "2026-10-10T15:39:45.628Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md's first section is Get started. Its Claude Code prompt includes the pinned init command, speck-setup, the Node.js installation offer and consent before machine or git changes. All three AC1 tests in test/readme-0089.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md pins v0.1.0, matching package.json. The AC2 test reads both files and compares their versions; it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md moves the unchanged npx github:luroai/speck init command into the later Without an agent section. The AC3 test passed; the diff confirms its behaviour is unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md's Requirements lists macOS or Linux, Claude Code, git, Node.js 20 or newer with agent installation, and optional Codex review. The AC4 test passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now leads with a copyable agent setup prompt and keeps manual installation further down. All four criteria are met, with no unrelated changes or blocking concerns. I independently ran all six new test assertions, omitting only temporary-folder setup to respect read-only access. The pinned release tag will be created by the separate release ticket."
  }
}
```

</details>
