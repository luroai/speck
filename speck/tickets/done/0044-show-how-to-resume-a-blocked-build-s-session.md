---
id: "0044"
title: "Show how to resume a blocked build's session"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0042", "0043"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:28:07.226Z"
finished: "2026-10-09T18:30:46.665Z"

---
# 0044 · Show how to resume a blocked build's session

**Status:** ✅ done

## Problem
When a build started by `speck run` gets blocked, its session has ended and nobody is in it. To answer the question with the agent's full context, you need to know which session to reopen and which folder to reopen it from.

## Outcome
A blocked ticket in the panel shows the exact command to reopen its build session, with a button that copies it.

## Acceptance criteria
1. `speck status --json` adds `session` to each ticket: `{"id": …, "cwd": …}` from `speck/.cache/runs/<id>.json`, or `null` when there's no such file or it can't be read. Every existing field is unchanged.
2. In the queue, a `blocked` ticket with a `session` shows, under its blocked question, the command `cd <cwd> && <resume_command>` as text, with `{session}` in `resume_command` replaced by the session id. `<cwd>` is quoted for a POSIX shell when it contains anything other than letters, digits, `/`, `.`, `_` and `-`.
3. `resume_command` is a new setting in `speck/config.yml`, `claude --resume {session}` in the config template. When it's blank, the panel shows only "session <id>" instead of a command.
4. A Copy button next to the command copies the command's exact text to the clipboard and says "Copied" for 2 seconds.
5. A blocked ticket with no `session` (built in an ordinary session) shows nothing extra.

## Out of scope
- Opening a terminal from the panel.
- Showing runs, logs or sessions for tickets that aren't blocked.

## Notes
- Builds after 0043, which writes the run records, and 0042, which changes the same page.
- Claude Code keeps sessions by the folder they started in, so the command must `cd` to the folder `speck run` launched from (the main checkout), not the ticket's worktree.
- Checked 2026-10-09: `claude --resume <session-id>` resumes that conversation (`claude --help`, Claude Code 2.1.294), and sessions are stored per starting folder under `~/.claude/projects/` (seen on this machine).
- Checked 2026-10-09: the Clipboard API needs a secure context, and `http://127.0.0.1` and `http://localhost` count as one (W3C Secure Contexts).
- The panel gets `resume_command` from a new top-level field in `status --json` (and so `/api/state`), so the 0030 test that pinned the top-level keys to `tickets` and `ideas` now expects `resume_command` too. A config without the setting gets the default; a blank one shows only the session id.
- Self-check: quoted the session id the same way as the folder (a UUID is unchanged), trimmed `resume_command`, treated a run record with no `session` or `cwd` as no session, and made a refused clipboard say "Couldn't copy" instead of "Copied"; a second copy within 2 seconds no longer gets cut short by the first one's timer.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 276,030
- Elapsed since build started: 9 min
- Changed lines: 59 (limit 5000)
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
    "reviewed_sha": "cfb2b417f13eab9b11d3fe5f21f2c88760ba5f11",
    "thread_id": "01a121bc-e94d-75d3-b70a-d9db965f12b3",
    "seconds": 36,
    "usage": {
      "input_tokens": 275189,
      "cached_input_tokens": 201088,
      "cache_write_input_tokens": 0,
      "output_tokens": 841,
      "reasoning_output_tokens": 81
    },
    "saved_at": "2026-10-09T17:37:07.252Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: buildSession and statusData add session from the main checkout's run records without altering existing fields. Three AC1 tests in test/resume-0044.test.mjs cover valid, absent, malformed, unreadable and incomplete records, plus worktree lookup; all passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: resumeOf, shellWord and queueItem produce the substituted command immediately below the question. AC2 tests exercise rendered placement, repeated substitution and POSIX quoting, including apostrophes and shell metacharacters; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/config.yml defines the default; statusData handles missing, blank and trimmed settings; resumeLine omits Copy for the session-only display. Both AC3 tests exercise these behaviours and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: resumeLine and copy send the displayed text to navigator.clipboard.writeText and reset feedback after 2000 ms. AC4 tests execute the actual page handlers with clipboard and timer substitutes, covering exact text, repeat clicks and refusal; all passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "templates/panel.html: resumeOf returns null without a valid session or outside blocked status. The AC5 test checks model output and rendered rows for absent sessions and other statuses; passed."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated spec accurately describes session data, configuration defaults, quoting, clipboard feedback and blocked-only display. Changes on main to unrelated tickets are absent from this branch's changes against its merge base."
    },
    "escalation_question": "",
    "summary": "Blocked builds now show a command to reopen their original session, with working copy feedback and a session-only fallback. All five criteria have meaningful passing tests. Repository inspection found no blocking issues. Tests were inspected alongside the supplied results; they were not rerun in the read-only environment."
  }
}
```

</details>
