---
id: "0088"
title: "Set up speck through a conversation with your agent"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0086", "0087"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T15:19:34.126Z"
finished: "2026-10-10T15:33:30.330Z"

---
# 0088 · Set up speck through a conversation with your agent

**Status:** ✅ done

## Problem
Getting speck working needs Node, git, a clean repo, a test command, a builder and a reviewer, and choices most people can't make alone, like which reviewer to trust or whether builds may skip permission prompts. `speck init` sets up the files and `speck doctor` lists what's missing, but someone without a technical background still has to fix each gap themselves.

## Outcome
A `speck-setup` skill lets your agent take you through setting speck up in a conversation: it checks what's there, explains each choice, asks before changing anything, and leaves speck ready to build your first ticket.

## Acceptance criteria
1. `speck init` installs a `speck-setup` skill in both skill folders, like the other speck skills.
2. The skill starts from `speck detect` (0086) and asks before each change to the machine or to git: installing Node, `git init`, setting a git name and email, and making a commit. It records every setting choice with `speck config set` (0087), never by editing `speck/config.yml` directly.
3. In an existing project, it stops while tracked files have uncommitted changes until the user has dealt with them, confirms the base branch, warns that shipping pushes straight to that branch, so a branch that requires pull requests will refuse it, and confirms the test command by running it once.
4. In a new project, it makes the first commit, then creates a draft ticket to scaffold the app with a test runner, explaining that speck can't ship until a test command passes.
5. It proposes a builder and a reviewer from the agents found, preferring a reviewer from another model family; if only Claude is available, it explains same-model review and turns it on only if the user agrees. It explains that `speck run` builds skip permission prompts and asks before keeping that. It finishes once `speck doctor` passes, saying what to do next.

## Out of scope
- Windows (0091).
- Choosing reviewer models by name: blank (the reviewer's default) unless the user asks for one.

## Notes
- The skill is the conversation; `speck detect` and `speck config set` are the facts and the writes. The CLI never asks questions.
- Decided 2026-10-10: assume Claude Code is installed; support new and existing projects; macOS and Linux only.
- A skill can't be fully tested automatically. Tests should cover AC1 and that the skill names each step; the reviewer checks the rest by reading it.
- Self-check: an existing project with code but no commits had no first commit, so speck couldn't branch from it. The skill now asks for one (checking `.gitignore` first) before the base branch is set, with a test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The first ticket is created before builder/reviewer selection.; F2 For an empty folder where git has already been initialised but speck is absent, step 1 invokes section 3's base-branch configuration before step 2 installs speck.; F3 Reviewer selection unconditionally proposes Codex whenever it is installed, including when the user has just selected Codex as builder.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,109,358
- Elapsed since build started: 12 min
- Changed lines: 96 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- `build_command` stays Claude-specific when setup picks a Codex, Cursor or Gemini builder. Saved to the inbox: `speck/ideas/2026-10-10-match-build-command-to-the-chosen-builder.md`.
- Known limit: `git init -b main` needs git 2.28 or newer. Older systems would need `git init` then `git symbolic-ref HEAD refs/heads/main`.

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
    "reviewed_sha": "d754d328f6f8ea1ced843e600149113121f60d84",
    "thread_id": "01a1266d-4c3b-71b0-b5b3-22f3061a1f64",
    "seconds": 56,
    "usage": {
      "input_tokens": 382537,
      "cached_input_tokens": 278272,
      "cache_write_input_tokens": 0,
      "output_tokens": 1383,
      "reasoning_output_tokens": 119
    },
    "saved_at": "2026-10-10T15:28:35.614Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/setup-0088.test.mjs exercises init and checks the installed skill contents in both folders. The repository links and installation mechanism match."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md sections 1–2 and Rules require detect, explicit consent for machine/git changes, and config set for settings. AC2 text tests cover these instructions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "SKILL.md section 3 requires stopping on tracked changes, confirming the base branch, warning about direct pushes, and running the test command. Corresponding AC3 tests check each instruction."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Section 4 names and tests the commit/draft-ticket steps, but creates the ticket before agent selection and attempts base-branch configuration before installation for an already initialised empty repository."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Section 5 always proposes installed Codex even when Codex was selected as builder. Section 4 also creates the first ticket with the previous agent settings. AC5 text tests do not catch these contradictions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md:59",
        "issue": "The first ticket is created before builder/reviewer selection. scripts/speck.mjs cmdNew copies cfg.builder and cfg.reviewer into the ticket. On the Claude-only path, setup subsequently selects claude-subagent in config, but the first ticket still explicitly requires Codex. Doctor can pass while the instructed first build cannot use the agreed reviewer.",
        "suggested_fix": "Choose and record the agents before creating the scaffold ticket, or explicitly synchronise its agent fields afterwards. Add a regression check for this ordering.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md:56",
        "issue": "For an empty folder where git has already been initialised but speck is absent, step 1 invokes section 3's base-branch configuration before step 2 installs speck. config set requires speck/config.yml, so this supported new-project path fails immediately.",
        "suggested_fix": "Confirm the branch early if desired, but write base_branch after init and before creating the first ticket. Cover an empty repository on a non-main branch.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md:70",
        "issue": "Reviewer selection unconditionally proposes Codex whenever it is installed, including when the user has just selected Codex as builder. This contradicts the cross-family preference and produces a same-model pair without consent; scripts/core.mjs lintTicket rejects that pair with the default settings.",
        "suggested_fix": "Select the reviewer relative to the chosen builder's model family, and require explicit consent before any same-family pairing. Add a check covering a Codex builder.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The conversational setup guide is installed correctly and covers the requested explanations and permission checks. Three sequencing and agent-selection problems can leave users with a failing setup or an unusable first ticket. The reported tests pass, but their text checks miss these paths."
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
    "reviewed_sha": "b7bdbd3232650c17260d9cc2e8feb22871a6341d",
    "thread_id": "01a1266d-4c3b-71b0-b5b3-22f3061a1f64",
    "seconds": 28,
    "usage": {
      "input_tokens": 723197,
      "cached_input_tokens": 549760,
      "cache_write_input_tokens": 0,
      "output_tokens": 2241,
      "reasoning_output_tokens": 164
    },
    "saved_at": "2026-10-10T15:31:33.688Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/setup-0088.test.mjs AC1 tests exercise init, verify identical skill contents in both folders, and check repository symlinks. All pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "SKILL.md Rules and sections 1–2 require starting with detect, consent before machine/git changes, and config set for settings. The corresponding AC2 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "SKILL.md section 3 stops on tracked changes, confirms the base branch, warns about direct pushes and pull-request protection, and runs the proposed test command once. AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "SKILL.md section 4 installs speck before recording the branch, makes the first commit, chooses agents before creating the draft scaffold ticket, and explains the passing-test requirement. AC4 and review F1/F2 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "SKILL.md sections 5–7 select reviewers relative to the builder, require consent for same-family review, explain skipped permission prompts, and finish with doctor and next steps. AC5 and review F3 tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "Previously, the first ticket copied agent settings before the user chose them. Section 4 now completes sections 5–6 before speck new, matching cmdNew's copying behaviour.",
        "suggested_fix": "Implemented; retain the review F1 ordering check.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "Previously, an already initialised empty repository attempted branch configuration before installation. Section 4 now explicitly defers that write until after init.",
        "suggested_fix": "Implemented; retain the review F2 ordering check.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "Previously, a Codex builder was automatically paired with Codex. Section 5 now provides a separate Codex-builder path and explicitly requires agreement for every same-family pairing.",
        "suggested_fix": "Implemented; retain the review F3 consent check.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The setup guide now meets all five criteria, and all three previous blockers are resolved. The supplied suite reports 784 passing tests and no failures. Conversation behaviour was checked by reading the instructions, as the ticket requires. Ready for the product owner to consider merging."
  }
}
```

</details>
