---
id: "0378"
title: "Check Cursor's CLI in doctor for a Cursor reviewer"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-check-cursor-s-cli-in-doctor-for-a-cursor-reviewer.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:26.264Z"

---
# 0378 · Check Cursor's CLI in doctor for a Cursor reviewer

**Status:** 🔍 reviewing

## Problem
With `reviewer: cursor` and no reviewer command of your own, `speck doctor` checks nothing for the reviewer. A missing Cursor CLI only shows up when the first review fails.

## Outcome
`speck doctor` checks that Cursor's CLI is installed when Cursor reviews and no reviewer command is set.

## Acceptance criteria
1. With `reviewer: cursor` and no command under `reviewer_options.cursor`, `speck doctor` checks that `agent` or `cursor-agent` is on the PATH. When neither is, the check fails and says how to install the Cursor CLI.
2. When a command is set under `reviewer_options.cursor`, doctor checks that command's first word, as it does for any reviewer command, and does not also require `agent` or `cursor-agent`.
3. A `reviewer` of `codex` or `claude` is checked as it is today. A `builder` of `cursor` is still checked as it is today.
4. No test that passed before this change fails.

## Out of scope
- Checking that Cursor is signed in.
- The builder's check, which already looks for `agent` or `cursor-agent`.

## Notes
- Checked 2026-10-22: `doctorChecks` in `scripts/install.mjs` checks `claude` on the PATH for `reviewer: claude` with no command, and the Codex CLI for `reviewer: codex`. It has no branch for `reviewer: cursor`. `CURSOR_CLIS` is `agent` and `cursor-agent`, which the builder check already uses.
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/install.mjs`.
- Failing before this build: none
- Self-check: no changes

## In plain words
If Cursor reviews your tickets, `speck doctor` now checks that Cursor's command-line tool is installed, and tells you how to install it when it isn't, instead of you finding out when the first review fails. To see it, set the reviewer to Cursor and run `speck doctor`. If you've given Cursor a review command of your own, doctor checks that command instead, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none.

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
    "reviewed_sha": "55218b39d5ee3aadebc1dfd8af665ecd2847245a",
    "session": "fresh",
    "thread_id": "01a16607-1d08-7bf3-ad7c-133cbba67193",
    "builder_response": "- Tests run: test/doctor-cursor-reviewer-0378.test.mjs test/review-claude-0292.test.mjs test/run-cursor-0290.test.mjs test/builder-command-0211.test.mjs test/windows-0091.test.mjs test/split-0018.test.mjs (plus the commands.checks files)\n- Round 1. One branch added to doctorChecks for reviewer cursor with no command, reusing CURSOR_CLIS and the builder's install fix. The brief's speck doctor row now names the check.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 86505,
      "cached_input_tokens": 53248,
      "cache_write_input_tokens": 0,
      "output_tokens": 557,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:52:01.116Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/install.mjs: doctorChecks uses CURSOR_CLIS.some(onPath) and the existing Cursor installation advice. Passing 0378 AC1 tests cover either executable, neither executable, absent options and a blank command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doctorChecks handles a custom command before the Cursor fallback. Passing 0378 AC2 tests verify its first word is required and that agent alone cannot substitute for it."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Claude, Codex and builder branches are unchanged. Passing 0378 AC3 and existing 0290, 0292 and builder checks cover their behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0378-tests.txt confirms 158 tests: 155 passed, 3 skipped and no failures. The change is confined to the Cursor reviewer fallback, its tests and supporting documentation."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Doctor now checks for either Cursor CLI executable when Cursor is the reviewer, and gives installation advice if neither is available. Custom reviewer commands retain their existing behaviour. The reported tests pass, and I found no blocking issues."
  }
}
```

</details>
