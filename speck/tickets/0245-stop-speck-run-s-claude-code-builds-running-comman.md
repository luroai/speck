---
id: "0245"
title: "Stop speck run's Claude Code builds running commands in the background"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-turn-off-background-commands-in-speck-run-builds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241","0242","0244"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:33:01.977Z"
approved: "2026-10-16T08:35:29.577Z"

---
# 0245 · Stop speck run's Claude Code builds running commands in the background

**Status:** 👍 approved

## Problem
The build skill tells a builder to wait for every command, but a builder that puts a test run or review round in the background anyway and ends its turn ends a build that `speck run` started, partway, with the ticket left `building` or `reviewing`. It's only an instruction, so nothing stops it.

## Outcome
A Claude Code build that `speck run` starts can't run commands in the background.

## Acceptance criteria
1. Every build process `speck run` starts whose command starts Claude Code (its first word is `claude`, or a path ending in `/claude`) has `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` in its environment: new builds, builds it resumes after they were killed, and builds it resumes to hand a ticket back.
2. A build whose command starts any other program gets no such variable. When `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` is already set in `speck run`'s own environment, the build keeps that value.
3. The brief's description of `speck run` says that its Claude Code builds can't run commands in the background, and why. No test that passed before this change fails.

## Out of scope
- Other builders' settings, if they have any.
- Builds started by hand with `/speck-build` in an open session.
- Changing `build_command` in `speck/config.yml` or its template.

## Notes
- Every build `speck run` starts goes through `startBuild()` in `scripts/run.mjs`, which already adds `SPECK_BUILD_SESSION` to the environment. The brief's `speck run` row is in `docs/brief.md`.
- Checked 2026-10-16: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` is in Claude Code 2.1.296, the installed version (`claude --version`). With it set to `1`, a `claude -p` session's Bash tool has no `run_in_background` parameter; without it, it has one (asked of `claude -p` both ways).
- The open question in the idea is settled as any command that starts Claude Code, not only the default `build_command`.
- Failing before this build: none
- Self-check: no changes

## In plain words
Builds that speck run starts with Claude Code can no longer leave a test run or review going in the background and then stop, which used to end the build halfway with its ticket stuck in building or reviewing. They now run every command to the end before carrying on. Nothing changes for builds you start yourself, or for builders other than Claude Code. To see it, start speck run on a ready ticket and watch the build's log: its commands all run in the foreground. If you've already set this Claude Code option yourself where speck run starts, your setting is kept, so setting it to anything other than on leaves background commands allowed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 94,046
- Elapsed since build started: 2 min
- Changed lines: 16 (limit 5000)
- Follow-ups: none. Known limit: a value already set in speck run's environment is kept as it is, including an empty one, which Claude Code may treat as off.

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
    "reviewed_sha": "e674694d200ed950bbf971fba172d6e5f4cdf2d0",
    "thread_id": "01a143d9-986a-7c01-b437-e7b672ee00b2",
    "seconds": 25,
    "usage": {
      "input_tokens": 93410,
      "cached_input_tokens": 54272,
      "cache_write_input_tokens": 0,
      "output_tokens": 636,
      "reasoning_output_tokens": 24
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:35:21.490Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs startBuild() applies buildEnv() to new, killed-resume and hand-back builds. Passing tests exercise Claude command detection, actual new and resumed processes, and the shared hand-back launch path."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "buildEnv() adds the variable only for claude or paths ending in /claude, preserving existing values with Object.hasOwn(). Passing tests cover other programs, empty and non-empty inherited values, and an actual process inheriting '0'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "docs/brief.md explains the setting and why background commands can leave builds unfinished. All seven ticket tests passed in the supplied full output. No existing tests were changed; the narrow implementation shows no apparent regression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Claude Code builds launched by speck run now disable background tasks by default, including resumed builds. Existing environment settings are preserved, and other builders are unaffected. The documentation explains why. All seven ticket tests passed; no blocking concerns found."
  }
}
```

</details>
