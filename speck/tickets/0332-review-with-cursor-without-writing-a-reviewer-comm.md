---
id: "0332"
title: "Review with Cursor without writing a reviewer command"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:00:51.170Z"
approved: "2026-10-20T12:04:25.472Z"

---
# 0332 · Review with Cursor without writing a reviewer command

**Status:** 👍 approved

## Problem
Claude Code and Codex review with no setup, but a Cursor reviewer needs a command written by hand under `reviewer_options`. The README's example for it also leaves out `--trust`, so in a folder Cursor hasn't been told to trust, the review stops at Cursor's "Workspace Trust Required" prompt with nobody there to answer (found on the user's work laptop, 2026-10-20).

## Outcome
`reviewer: cursor` reviews with no command of the user's own, read-only, on `reviewer_model`, and later rounds carry on the same Cursor chat.

## Acceptance criteria
1. With `reviewer: cursor` and no `reviewer_options.cursor.command`, `speck review <id>` runs Cursor's CLI (`agent`, or `cursor-agent` when only that is installed) with `-p --mode ask --trust --output-format json`, the prompt on stdin, and `--model <reviewer_model>`, leaving `--model` out when `reviewer_model` is blank, and records the verdict it returns.
2. Round 2 and later resume the chat round 1 started, with `--resume <session_id>` from round 1's output.
3. A `reviewer_options.cursor.command` of the user's own is used instead, as today.
4. No reviewer command in the README or `docs/brief.md` runs Cursor's CLI without `--trust`.
5. No test that passed before this change fails.

## Out of scope
- `reviewer_effort` for Cursor: Cursor's model names carry the effort (`claude-opus-5-5-high`), so it isn't passed.
- Recording the Cursor reviewer's tokens.

## Notes
- The built-in reviewers are `BUILT_IN` in `scripts/reviewers.mjs` (Claude Code's is there), and `cmdReview` in `scripts/review.mjs` picks one. `CURSOR_CLIS` in `scripts/install.mjs` finds the CLI, as builds do.
- Not `--sandbox enabled`: it fails to start where the OS doesn't support Cursor's sandbox ("Sandbox mode is enabled but not available on this system", Linux with AppArmor on this machine). Ask mode alone is read-only.
- Checked 2026-10-20 (Cursor CLI on this machine): `agent -p --mode ask --trust --output-format json --model auto` reads the prompt from stdin and prints one JSON object with `result` and `session_id`; `--resume <session_id>` carries on that chat; asked in ask mode to create a file and run `touch`, it refused and nothing was written. Without `--trust`, `agent -p` in an untrusted folder prints "Workspace Trust Required" and stops (user's work laptop).
- Failing before this build: none
- AC5 has no test of its own: `speck ship` runs the whole suite.
- Self-check: the review and setup skills still said a Cursor reviewer needs a command written by hand, so `/speck-build` would not have known to run `speck review` for it; both now say speck runs Cursor itself.

## In plain words
Cursor can now review tickets with no setup of your own: choose Cursor as the reviewer and speck runs it for you, read-only, on the reviewer model you've set, or Cursor's own default when none is set. Each later review round carries on the same Cursor chat, so it remembers what it said before. It no longer stops at Cursor's "Workspace Trust Required" prompt in a folder Cursor hasn't been told to trust. If you've already written your own Cursor reviewer command, speck still uses yours. To see it, set the reviewer to Cursor and build a ticket: its review rounds are recorded as Cursor's. Worth knowing: the panel's Settings view doesn't offer Cursor as a reviewer yet, and `speck doctor` doesn't check for it yet (both are in the inbox).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 107,253
- Elapsed since build started: 4 min
- Changed lines: 26 (limit 5000)
Follow-ups:
- Inbox: `speck/ideas/2026-10-20-check-cursor-s-cli-in-doctor-for-a-cursor-reviewer.md`
- Inbox: `speck/ideas/2026-10-20-offer-cursor-as-a-reviewer-in-the-settings-view.md`
- Inbox: `speck/ideas/2026-10-20-refuse-a-reviewer-name-with-spaces-in-config-set.md`
- Note: this build changed the reviewer bullets in `skills/speck-setup/SKILL.md` section 5, which 0334 also edits; its builder should keep this build's Cursor reviewer bullet.

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
    "reviewed_sha": "7ee907464c1be8d9b9d1d6dfc48cb452d059fb6f",
    "thread_id": "01a15931-f369-7633-8e7e-29c3a48d859b",
    "seconds": 26,
    "usage": {
      "input_tokens": 106604,
      "cached_input_tokens": 61312,
      "cache_write_input_tokens": 0,
      "output_tokens": 649,
      "reasoning_output_tokens": 22
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:03:54.016Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/reviewers.mjs BUILT_IN.cursor supplies the required flags; cursorCli() selects agent or cursor-agent. Passing AC1 tests exercise CLI selection, stdin, model inclusion/omission and saved verdicts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "BUILT_IN.cursor defines resume_command and session_id_path. runCommandReview saves and reuses thread_id. Passing AC2 tests check --resume chat-7, continued-session metadata and fallback after resume failure."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewerOptions returns a user's non-blank command before selecting a built-in. The passing AC3 test verifies the custom command receives only its own arguments."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md and docs/brief.md Cursor reviewer examples include --trust, including the brief's adapter table. The passing AC4 test checks command configuration examples for that flag."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 133 passed, 0 failed and 3 skipped across 136 tests, including Cursor and existing Claude reviewer coverage. The diff shows no weakened existing tests or unrelated changes. Whole-suite verification remains with speck ship as specified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Cursor can now review without a custom command, use the selected model and continue its chat across rounds. Custom commands still take precedence. Documentation includes the trust flag needed for unattended reviews. The relevant tests passed, and I found no blocking issues."
  }
}
```

</details>
