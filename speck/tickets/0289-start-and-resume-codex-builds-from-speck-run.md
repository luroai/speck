---
id: "0289"
title: "Start and resume Codex builds from speck run"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T10:41:59.157Z"
approved: "2026-10-18T11:05:24.684Z"

---
# 0289 · Start and resume Codex builds from speck run

**Status:** 👍 approved

## Problem
speck run can only start and resume builds with Claude Code: it gives each build a session id up front (`--session-id {session}`) and resumes it by that id. Codex chooses its own session id, so with Codex as the builder, speck run can't resume a build after a hand-back or a stop, and `builder_model` isn't passed to it.

## Outcome
With `builder: codex`, speck run starts each build with Codex, passing `builder_model`, and resumes it after a hand-back or a stop as it does Claude Code builds.

## Acceptance criteria
1. With `builder: codex` and `build_command` blank, speck run starts each build as `codex exec --json --dangerously-bypass-approvals-and-sandbox '$speck-build <id>'`, with `-m <builder_model>` when it's set. A `build_command` that's set is used as it is, as today.
2. speck run reads the build's session id from the first `thread.started` line of its log and keeps it in the build's run record as its session.
3. A hand-back, a stopped build that speck run resumes, and a resume command shown in the panel use `codex exec resume <session> --json --dangerously-bypass-approvals-and-sandbox '<message>'`, so the build carries on its own session.
4. When no session id has been read yet (the build stopped before writing one), speck run says so in one line and treats the build as it does a Claude Code build it can't resume.
5. Builds with `builder: claude` start and resume exactly as today.

## Out of scope
- Cursor: 0290. Reading Codex logs and tokens in the panel: 0291.

## Notes
- From `speck/ideas/2026-10-17-build-with-any-agent.md`. Covers `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md`.
- Checked 2026-10-17: in a scratch repo, `codex exec --json --dangerously-bypass-approvals-and-sandbox` ran shell commands with no prompts; `$<skill>` in the prompt ran a skill from `.agents/skills/`; the first `--json` line was `{"type":"thread.started","thread_id":"…"}`; and `codex exec resume <thread_id> '<message>'` carried on that session (codex-cli 0.159.0).
- Starting and resuming are in `scripts/run.mjs` and `resumeArgv` in `scripts/hand-back.mjs`.
- Failing before this build: none
- Self-check: a Codex config with no build_command at all is refused by speck run as before (only `build_command: ""` builds with Codex), so 0279's builder_model note stays as it was; a pause, stop or waiting mark written before the session id is read is given the session too, so it still matches the build.

## In plain words
If you build with Codex, `speck run` can now start and look after those builds itself. Set `builder: codex` and leave `build_command` blank (`build_command: ""`). Each ready ticket is then built by Codex, on the model you chose in `builder_model` if you set one. If a build is stopped partway, or a ship sends a ticket back for more work, speck carries on in that build's own Codex session, as it already did for Claude Code.

To see it, set those two settings, set a ticket ready and turn `speck run` on. The run's log shows the build start, and once the build is stopped or blocked, the panel offers a `codex exec resume …` command to reopen its session. Claude Code builds work exactly as before.

Worth keeping an eye on: these builds run Codex with its approvals and sandbox turned off, as Claude Code builds already skip their prompts. A build stopped in its first moments, before Codex has named its session, can't be picked up again automatically: speck says so, and you carry it on with `$speck-build <id>`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The panel selects the resume command from today's configuration rather than the build's recorded agent.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,127,471
- Elapsed since build started: 23 min
- Changed lines: 206 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The same-model check and the "only passed to Claude Code builds" wording don't yet count `builder_model` on Codex builds: `speck/ideas/2026-10-18-same-model-check-counts-builder-model-on-codex-builds.md`.
  - Known limit: only `build_command: ""` counts as blank. A bare `build_command:` line reads as an empty mapping, and a config with no `build_command` at all, are refused by `speck run` as before. With `builder: codex`, the refusal now suggests `build_command: ''`.
  - Known limit: the panel shows the Codex resume command for a build only when `resume_command` is unset or is Claude Code's. A `resume_command` of your own is used for every build.
  - Merge round F2 (minor): the setup skill still offers a blank `build_command` to Codex users who decline automatic builds, which for Codex turns them on: `speck/ideas/2026-10-18-setup-s-blank-build-command-advice-for-codex.md`.
  - The inbox idea `speck/ideas/2026-10-17-pass-builder-model-to-codex-builds.md` is covered by this ticket, as its Notes say: it can be closed when the inbox is triaged.

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
    "reviewed_sha": "95034ecd0285dac0070347fba812968df2aae2bd",
    "thread_id": "01a14ea3-032c-7681-9089-fecd6ac0cd5c",
    "seconds": 33,
    "usage": {
      "input_tokens": 210103,
      "cached_input_tokens": 150912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1044,
      "reasoning_output_tokens": 172
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T10:51:40.832Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs selects codexStartWords only for Codex with an explicitly blank build_command. AC1 tests cover command arguments and builder_model; the process test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/codex-build.mjs threadId and fillSession read the first thread.started event and persist its session. Passing AC2 tests exercise log parsing, record persistence and matching marks."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "resumeFor correctly uses the recorded agent for automatic resumes, with passing killed-build and hand-back tests. However, statusData chooses one panel resume command from current configuration, while buildSession discards the recorded agent. Existing sessions can therefore receive the wrong panel command after configuration changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "resumeFor returns a specific reason when a Codex session is absent. The passing AC4 test checks both hand-back refusal and a real speck run reporting the problem once without launching Codex."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Claude launch arguments and resumeArgv remain unchanged. The passing AC5 test checks model handling, resume arguments, messages and default hints; existing Claude process tests were also reported passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The panel selects the resume command from today's configuration rather than the build's recorded agent. For example, start a Codex build, then change builder to claude: its stopped ticket now offers claude --resume with a Codex thread id. Conversely, switching to Codex makes older Claude sessions show a Codex command. buildSession returns only id and cwd, so resumeOf cannot distinguish them. The panel test only checks a matching configuration and session.",
        "suggested_fix": "Preserve the recorded agent in ticket session data and select the default resume command per ticket, retaining explicit custom resume settings. Add coverage for existing Codex and Claude sessions after changing builder or build_command.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Codex builds start, capture their session and resume automatically as intended. The passing tests cover these paths well. One fix is needed: after builder settings change, the panel can show a resume command for the wrong agent, preventing users from reopening an existing build."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9e5a170060746736bf53643d03fdc07de9801dd4",
    "thread_id": "01a14ea3-032c-7681-9089-fecd6ac0cd5c",
    "seconds": 17,
    "usage": {
      "input_tokens": 353413,
      "cached_input_tokens": 278784,
      "cache_write_input_tokens": 0,
      "output_tokens": 1726,
      "reasoning_output_tokens": 172
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T10:53:31.469Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs uses codexStartWords for Codex with a blank build_command and otherwise preserves the configured command. Passing AC1 tests verify launch arguments and optional builder_model."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/codex-build.mjs threadId and fillSession persist the first thread.started session. Passing AC2 tests cover parsing, run records and matching marks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "resumeFor and codexResumeArgv resume the recorded Codex session for stopped builds and hand-backs. buildSession now supplies a per-session resume command, honoured by panel resumeOf. Passing AC3 tests cover automatic resumes, panel commands, builder changes and custom commands."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "resumeFor explains when no Codex session has been read. The passing AC4 test verifies a single-line report and no resume launch for both stopped builds and hand-backs."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Claude launch and resume argument handling remain unchanged. The passing AC5 test checks models, resume arguments and hints; the new panel regression test also preserves Claude commands under a changed builder configuration."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: panel resume commands now follow the build's recorded agent when it differs from the current builder configuration.",
        "suggested_fix": "Implemented through per-session resume_command data and panel support, with regression coverage for both agents and custom commands.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Codex builds now start with the selected model, retain their session and resume after interruptions or hand-backs. The panel fix correctly reopens existing builds even after builder settings change. All five criteria pass, with no outstanding blocking findings."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "294f417c1f93fec934ae15a3867aeb316295de1b",
    "merge": true,
    "thread_id": "01a14ea3-032c-7681-9089-fecd6ac0cd5c",
    "seconds": 20,
    "usage": {
      "input_tokens": 558675,
      "cached_input_tokens": 454272,
      "cache_write_input_tokens": 0,
      "output_tokens": 2510,
      "reasoning_output_tokens": 221
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T11:05:13.385Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "run.mjs selects codexStartWords only for Codex with an explicitly blank build_command. Passing AC1 tests verify the command, optional model and custom-command selection."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "codex-build.mjs threadId and fillSession retain the first thread.started session in the run record. Passing AC2 tests cover parsing, persistence and matching marks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "resumeFor uses codexResumeArgv for recorded Codex builds. buildSession and panel resumeOf retain per-build commands across configuration changes. All automatic-resume, hand-back and panel AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "resumeFor returns an explicit missing-session reason. The passing AC4 test verifies one-line reporting and no launch for stopped builds and hand-backs without a session."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Claude argument handling remains unchanged. startBuild's renamed parameters preserve the environment session and displayed session. AC5 and the previously failing run-0245 tests passed without changing existing tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Resolved: the panel uses the build's recorded agent to choose its resume command, including after builder settings change.",
        "suggested_fix": "Implemented and covered by the passing per-build panel regression test.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "The custom-command paragraph now explicitly includes Codex, but still offers blank build_command as a way to prevent automatic builds. For Codex, that starts automatic builds with approvals and sandbox disabled, contradicting the preceding paragraph.",
        "suggested_fix": "Limit the blank-command refusal advice to Cursor and Gemini; give Codex users who decline automatic builds separate advice to leave speck run off.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The merged change meets all five criteria. Both compatibility failures are fixed without weakening tests, and the panel fix remains intact. One minor setup-instruction inconsistency remains for Codex users who decline automatic builds."
  }
}
```

</details>
