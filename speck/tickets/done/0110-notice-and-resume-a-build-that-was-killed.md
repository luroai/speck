---
id: "0110"
title: Recover a build that was killed                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T22:40:12.596Z"
finished: "2026-10-10T22:59:58.557Z"

---
# 0110 · Recover a build that was killed

**Status:** ✅ done

## Problem
When a build's process is killed (here by the out-of-memory killer, which also took down `speck run`), its ticket stays `building` and the panel shows it as in progress, so on 2026-10-10 five dead builds looked busy for half an hour. Nothing restarts them: `speck run` launches only ready tickets, and someone had to resume each session by hand.

## Outcome
A build that was killed is shown plainly as stopped, and `speck run` resumes its session once by itself.

## Acceptance criteria
1. A ticket that's `building` or `reviewing` whose build record has no exit and whose process is gone shows in `speck status` and the panel as "Build stopped unexpectedly", not as in progress.
2. `speck run` resumes such a build once: it continues the same session (as `resume_command` does) with a message saying the build was stopped and to carry on, logs to the same build log and keeps the build's record, so the panel, pause and stop work as for any build.
3. If the resumed build is killed again, `speck run` doesn't resume it a second time. The ticket shows as stopped, with the command to resume it.
4. A build ended by `speck stop`, or one that exited by itself, is never resumed.

## Out of scope
- Preventing out-of-memory kills (0109).

## Notes
- 0045 flags a build that finished without shipping; this covers a build that was killed before it finished.
- On 2026-10-10 the five builds were resumed by hand with `claude --resume <session> -p …`, which carried on cleanly from each worktree.
- Failing before this build: none
- A killed build is one whose run record has no exit, whose pid has gone, that `speck stop` didn't end, whose stream-json log has no closing `result` event (so a build that ended by itself while speck run was down isn't taken for one) and whose session no running process names (so a session already resumed by hand isn't resumed twice).
- speck run resumes it by turning `build_command` into a resume: `--session-id {session}` becomes `--resume {session}` and the one word with `{id}` becomes the carry-on message. A build_command without both is left stopped, with the resume command.
- 0047 AC3's test now uses a blocked ticket: a killed build whose ticket is building is resumed instead, as AC2 asks.
- Self-check: speck run only acts on killed builds whose ticket is building or reviewing, and every other build that has gone gets its exit recorded as before (it had been recording exits for records written while it ran, which 0070 and 0072's tests caught).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 432,533
- Elapsed since build started: 17 min
- Changed lines: 164 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- Where `ps` can't be run (Windows), every session counts as in use, so a killed build there is never flagged or resumed: it shows as before.
- If a resumed build fails to start at all, the next check says speck run had already resumed it once. The resume command it prints is right, but the wording could say the resume failed to start.

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
    "reviewed_sha": "3d056ca12163f9a965463c2b4424f8259d5584ac",
    "thread_id": "01a12808-5509-7890-9f01-2c856cfb0756",
    "seconds": 27,
    "usage": {
      "input_tokens": 431721,
      "cached_input_tokens": 315008,
      "cache_write_input_tokens": 0,
      "output_tokens": 812,
      "reasoning_output_tokens": 151
    },
    "saved_at": "2026-10-10T22:57:03.893Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs buildKilled detects the stopped build; scripts/speck.mjs statusData and cmdStatus expose it; templates/panel.html panelModel displays the required label and stops progress animation. Four 0110 AC1 tests exercise these behaviours and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs resumeKilled, resumeArgv and startBuild preserve the session and record, append to the existing log, and use the normal process handling. Passing 0110 AC2 integration tests verify arguments, message, folder, session environment, record preservation, running status, pause and play."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "resumeKilled persists the resumed marker before launching; tick refuses another automatic resume. Passing 0110 AC3 tests cover a second kill, a later runner restart, stopped status and the manual resume command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "buildKilled excludes stop markers, recorded exits, closing result events and sessions already running. finished records normal exits. Passing 0110 AC4 tests cover stopped builds, completed builds with and without recorded exits, and normal exit after resumption."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Killed builds now show clearly as stopped and automatically continue their existing session once, keeping their log and build controls. A second kill leaves a manual resume command. The tests exercise real processes and cover the required exclusions. No blocking issues found. I inspected the code and supplied passing test results; I did not rerun tests in the read-only review."
  }
}
```

</details>
