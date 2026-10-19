---
id: "0324"
title: "Build each ticket with its own builder after switching to Claude Code"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-19-build-codex-tickets-with-codex-after-switching-to-claude.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:08:29.241Z"

---
# 0324 · Build each ticket with its own builder after switching to Claude Code

**Status:** 🔍 reviewing

## Problem
`speck run` builds each ticket with the builder it records only when `build_command` is blank (0312). Switching the builder to Claude Code sets `build_command` to Claude Code's own command, because a blank one means "don't start builds" for Claude Code. So after switching back to Claude Code, tickets made with Codex or Cursor are built by Claude Code, though the Settings view says tickets keep the builder they were made with.

## Outcome
With Claude Code's own build command, tickets made with Codex or Cursor are still built by Codex or Cursor.

## Acceptance criteria
1. When `build_command` is exactly speck's own command for Claude Code, a ticket whose `builder:` is `codex` or `cursor` is built with that builder's own command, as with a blank `build_command`.
2. A `build_command` that's anything else, a command you've written yourself, is used for every ticket, as today.
3. A blank `build_command` with `builder: claude` still means speck run starts no builds, as today.
4. What the Settings view says about tickets keeping their builder is true in each of these cases, and it says so when a `build_command` you've written yourself means they won't. (checked by review)

## Out of scope
- Builders other than Claude Code, Codex and Cursor.

## Notes
- From `speck/ideas/2026-10-19-build-codex-tickets-with-codex-after-switching-to-claude.md`. Each ticket's builder is chosen in `scripts/ticket-builder.mjs`; Claude Code's own command is `DEFAULT_BUILD_COMMAND` in `scripts/build-model.mjs` and `OWN_BUILD_COMMANDS` in `scripts/builder-switch.mjs`.
- Failing before this build: none
- Self-check: no changes. Checked that resumed and handed-back builds carry on with the agent their run record names, that `speck run` still refuses a Codex builder with Claude Code's command, and that a Claude Code ticket now checks Claude Code is installed before starting, as Codex and Cursor tickets already did.

## In plain words
If you switch your builder back to Claude Code, tickets you made while using Codex or Cursor are now still built by Codex or Cursor, as the Settings view promises. Before, Claude Code built them all.

To see it, switch the builder to Codex, make a ticket, switch back to Claude Code, set the ticket ready and start speck run: its build starts with Codex.

If you've written your own build command, it's still used for every ticket. The Settings view now says so under the builder, and tells you how to go back to each ticket keeping its builder.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "d9a9dcb43a0d1c43320a81e92a98447c5e0df157",
    "thread_id": "01a15301-96df-7a60-8a15-2e5d368c91a0",
    "seconds": 32,
    "usage": {
      "input_tokens": 214836,
      "cached_input_tokens": 165632,
      "cache_write_input_tokens": 0,
      "output_tokens": 823,
      "reasoning_output_tokens": 105
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T07:13:27.089Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ticket-builder.mjs launchPlan routes Claude Code's default command through buildPlan, which selects the ticket's builder. Passing test '0324 AC1' exercises Codex, Cursor and Claude plans."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "launchPlan preserves supplied command words for custom commands. Passing test '0324 AC2' checks all three builders, including commands differing slightly from Claude Code's default."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/run.mjs runOn retains its startup refusal for a blank command with builder claude. Passing test '0324 AC3' exercises the CLI refusal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html builderSwitchLine explains that a custom build_command builds every ticket regardless of its recorded builder, and recommends restoring the builder's own command. The switching message correctly says existing tickets keep their builder; saving restores the selected builder's own command."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tickets now use their recorded builder after switching back to Claude Code. Custom commands still apply to every ticket, and Settings explains that exception. The reported tests pass, and I found no blocking issues."
  }
}
```

</details>
