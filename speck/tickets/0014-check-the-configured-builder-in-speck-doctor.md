---
id: "0014"
title: "Check the configured builder in speck doctor"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0012"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:48:15.075Z"

---
# 0014 · Check the configured builder in speck doctor

**Status:** 🔍 reviewing

## Problem
`speck doctor` always checks for Claude Code, whatever `builder:` says, and the README lists Claude Code as a requirement. Someone building with Cursor, Codex or Gemini gets a failed check for a tool they don't use, and may think speck won't work for them.

## Outcome
`speck doctor` checks the builder set in `speck/config.yml`, and the docs say speck works with any agent that reads skills.

## Acceptance criteria
1. With `builder: claude`, `cursor`, `codex` or `gemini`, doctor checks that tool's CLI is installed (`claude`, `cursor-agent`, `codex`, `gemini`) under a heading naming that tool, with a plain-English install link on failure. It doesn't check for any other builder.
2. With any other `builder:` value, doctor shows one information line saying it can't check that builder, and this doesn't count as a failure.
3. The reviewer check uses the reviewer's command from config when there is one (its first word must be on the PATH), and keeps today's Codex install and sign-in checks for `reviewer: codex`.
4. The README Requirements section, `doctor`'s line in `product.md` and the "Claude Code is the only tested builder" known limit describe the builder as any agent that reads skills from `.agents/skills/` or `.claude/skills/`, naming Claude Code, Codex and Cursor.

## Out of scope
- Running or testing the builder.
- Changing where skills are installed: Cursor already reads `.agents/skills/` and `.claude/skills/`.

## Notes
- After 0012, so AC3 has a reviewer command to check.
- **Cursor's command name (checked 2026-10-08).** Cursor's install page (cursor.com/docs/cli/installation) now calls the CLI `agent`. Its installer still provides `cursor-agent` as the older name for the same binary, and guides recommend `cursor-agent` in scripts because `agent` can clash with other tools. Doctor checks `cursor-agent`, as this ticket says, and the 0012 reviewer examples stay valid. Gemini installs with `npm install -g @google/gemini-cli` and runs as `gemini`.
- Doctor finds tools on the PATH rather than running `--version`, so it never starts an agent. Codex's sign-in check is the only exception, kept as it was.
- The existing guard test 'no model name is hard-coded' matched `gemini-cli`, the npm package name in Gemini's install link. Its pattern now skips `gemini-cli` only, and every model name it caught before is still caught.

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
    "reviewed_sha": "f0dea2dea4de4c06db4d5f5c44afc7782d0a455b",
    "thread_id": "01a11d80-41dc-7791-8d0d-b54f110f4602",
    "seconds": 33,
    "usage": {
      "input_tokens": 129852,
      "cached_input_tokens": 80640,
      "cache_write_input_tokens": 0,
      "output_tokens": 800,
      "reasoning_output_tokens": 12
    },
    "saved_at": "2026-10-08T21:52:20.283Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: doctorChecks selects the configured CLI and installation link. Test '0014 AC1' exercises missing and present executables for all four builders and excludes other builder checks."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Test '0014 AC2' covers aider only. Independently calling doctorChecks with constructor, toString or __proto__ throws TypeError because BUILDERS[builder] resolves inherited properties."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "doctorChecks parses configured commands with splitCommand and checks their executable with onPath. Test '0014 AC3' covers missing/present command executables, a Codex command override, and preserved default Codex installation and sign-in checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README Requirements and product.md describe configurable builders and skill-reading agents, naming Claude Code, Codex and Cursor. Test '0014 AC4' checks these documentation changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Unknown builder names matching Object.prototype properties crash doctor instead of producing the required information line. Reproduced with constructor, toString and __proto__ in doctorChecks.",
        "suggested_fix": "Use Object.hasOwn(BUILDERS, builder), a Map, or a null-prototype lookup. Extend the unknown-builder test to cover inherited property names.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The intended behaviour is documented, but the claim that any unknown builder receives a non-failing information line is currently false for inherited property names."
    },
    "escalation_question": "",
    "summary": "The four supported builders and configured reviewer checks are implemented with meaningful tests. One edge case needs fixing: certain unknown builder names crash doctor rather than showing an information line. I verified this directly; I did not rerun the suite because its tests create files in this read-only environment."
  }
}
```

</details>
