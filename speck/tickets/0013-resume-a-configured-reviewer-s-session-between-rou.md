---
id: "0013"
title: "Resume a configured reviewer's session between rounds"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0012"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T21:41:33.861Z"

---
# 0013 · Resume a configured reviewer's session between rounds

**Status:** 🔍 reviewing

## Problem
After 0012, a command reviewer gets the whole history resent every round. That costs tokens, and the reviewer re-reads everything instead of continuing the conversation it already had, which is what Codex does today.

## Outcome
A command reviewer that supports resuming a session continues the same session in later rounds, as the Codex reviewer does.

## Acceptance criteria
1. A reviewer's `reviewer_options` entry can set `session_id_path`, a dot path into the command's JSON output (for example `session_id`). When set, the value found there is saved with the round as `thread_id`.
2. When the entry also has `resume_command` containing `{session}`, rounds after the first run it with the latest saved `thread_id` and send only the round-2 prompt (builder response, diff since last review, test output), as Codex rounds do today.
3. If there's no saved `thread_id`, no `resume_command`, or the resume command exits non-zero, speck runs the plain `command` with the full history as in 0012 and says so in one line of output, rather than failing.
4. The review pack shows, for each round, whether it continued a session or started fresh.

## Out of scope
- Codex's existing resume logic, which stays as it is.
- Listing or cleaning up old reviewer sessions.

## Notes
- After 0012.
- **Live run (2026-10-08).** In a throwaway repo, `reviewer: claude` had `session_id_path: session_id` and `resume_command: "claude -p --output-format json --permission-mode plan --resume {session} --model {model} --effort {effort}"` on `haiku`. A two-round review of a sample ticket ran through this branch's `speck review`. Round 1 started fresh and saved Claude's `session_id`. Round 2 ran the resume command with that id and only the round-2 prompt, with no fallback line. The reviewer referred back to its round-1 findings and approved. The pack shows round 1 as `fresh session` and round 2 as `continued session`. Claude Code 2.1.294's `--help` confirms `-r, --resume <session id>` works in print mode.
- Every review history line in the pack now ends with the session label, for example `; fresh session`. Rounds recorded with `speck record` (a `claude-subagent`, for instance) show `session not recorded` after round 1, because speck can't see whether the builder resumed the same subagent.

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
    "reviewed_sha": "2511b8da89446adc79464cc8beea459124203a21",
    "thread_id": "01a11d7a-38be-7131-a908-5af5e91f86cd",
    "seconds": 40,
    "usage": {
      "input_tokens": 192719,
      "cached_input_tokens": 136448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1120,
      "reasoning_output_tokens": 141
    },
    "saved_at": "2026-10-08T21:45:51.910Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: atPath and runCommandReview extract and save thread_id. The 0013 AC1 test exercises top-level, nested, missing and unconfigured paths; builder reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCommandReview substitutes the saved session and uses reviewerPrompt for resumed rounds. The 0013 AC2 test checks actual command arguments, response, diff and absence of full history; builder reports it passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runCommandReview falls back to historyPrompt with one explanatory line. The 0013 AC3 test exercises missing configuration, missing session and non-zero resume exit; builder reports it passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "reviewPack and sessionLabel render session labels. The 0013 AC4 test checks fresh and continued labels for command and Codex rounds; builder reports it passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:610",
        "issue": "Session selection can cross a fresh-session boundary and silently lose review context. If round 1 saves S1, round 2 falls back to a fresh command whose valid verdict has no session id, and round 3 resumes successfully, the reverse search selects S1 again. That session never saw round 2, but receives only the round-3 response and diff since round 2. Findings and changes from the intervening review are omitted. A read-only check of the selection expression confirms this; the new tests stop after two rounds.",
        "suggested_fix": "For command reviewers, resume only the session associated with the latest round. Continued rounds already preserve their resumed id, so a latest fresh round without an id should force full-history fallback. Add a three-round regression test covering failed resume, fresh output without an id, and the next round. Leave Codex's existing logic unchanged.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The new capability is documented and changes stay within scope. The stale-session correctness issue is recorded separately."
    },
    "escalation_question": "",
    "summary": "Session resumption and fallback work in the tested two-round cases. One fix is needed: after starting fresh, speck can return to an older session and leave the reviewer unaware of the intervening review. Tests were inspected but not rerun because they create files and this review is read-only."
  }
}
```

</details>
