---
id: "0124"
title: "Spot another workflow during setup"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-spot-another-workflow-during-setup.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T13:12:23.032Z"

---
# 0124 · Spot another workflow during setup

**Status:** 👍 approved

## Problem
Setting speck up in a project that already uses another workflow, such as OpenSpec, leaves both running. Agents then get conflicting instructions: work from the other workflow's specs and changes, or only from speck's tickets. The project's own agent rules can also contradict how speck works, for example by banning git worktrees or requiring every change to go through a pull request, so builds fail or break the project's rules. Today setup says nothing about either.

## Outcome
Setup spots another workflow, and rules that clash with speck, explains each in plain words and asks what to do, without removing or editing anything itself.

## Acceptance criteria
1. `speck detect` reports, under `other_workflows`, each other workflow it finds with the paths that show it: OpenSpec (an `openspec/` folder, `openspec-*` skills or `/opsx` commands), GitHub Spec Kit (a `.specify/` folder) and Kiro (a `.kiro/` folder). It's an empty list when there are none.
2. When `other_workflows` isn't empty, the setup skill explains, before changing anything, that running two workflows gives agents conflicting instructions. It recommends using speck for new work, with the other workflow's files left where they are, and asks the user to choose between that, keeping both, or stopping.
3. If the user chooses speck, setup names any work still in progress in the other workflow (for OpenSpec, each folder under `openspec/changes/` other than `archive`) and recommends finishing it, or turning it into speck tickets with `/speck-ticket`, before building with speck.
4. Setup reads the project's `AGENTS.md` and `CLAUDE.md`, and any guide they point to, and names each rule that would clash with speck as it's being set up: for example a ban on git worktrees, a requirement that changes go through pull requests or a particular reviewer, or limits on unattended agents. For each, it says what would happen and what the user could change: the rule itself, or a speck setting such as `worktrees` or `auto_ship`.
5. Setup never deletes, moves or edits the other workflow's files or the project's own rules. It changes a speck setting only after the user agrees, as for every other setting.

## Out of scope
- Moving the other workflow's specs or changes into speck automatically.
- Linking untracked files a build needs, such as `.env.local`, into each worktree (a separate follow-on in the source idea).

## Notes
- Checked 2026-10-11: OpenSpec in a real project has an `openspec/` folder (`config.yaml`, `specs/`, `changes/`, with finished changes under `changes/archive/`), `openspec-*` skills in `.claude/skills/` and `.agents/skills/`, and commands in `.claude/commands/opsx/` (a local project using OpenSpec).
- Checked 2026-10-11: GitHub Spec Kit keeps its files in `.specify/` (for example `.specify/feature.json`, per its quickstart), and Kiro in `.kiro/` (`.kiro/steering/` in the project root, per its steering docs; `~/.kiro/` is global, not the project).
- Decided 2026-10-11: spot and ask, never remove.
- Failing before this build: none
- Self-check: the setup skill said to turn `auto_ship` off, but it's off by default, so it now says to keep it off and that `worktrees` is on by default (with a test against the config template); the brief now describes `other_workflows` and setup's new check.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The combined pull-request/particular-reviewer example recommends keeping auto_ship off for both conflicts.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 357,018
- Elapsed since build started: 8 min
- Changed lines: 55 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- `speck detect` lists work in progress only for OpenSpec. For GitHub Spec Kit and Kiro, setup asks the user instead.
- Run in a home folder, `speck detect` would count the global `~/.kiro/` as a project's Kiro. Setup runs in a project folder, so this is unlikely.

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
    "reviewed_sha": "613f44e7181494c1ba2655102e9d6ce015c63bc7",
    "thread_id": "01a12b1c-ab8e-7651-bc0f-73b36233a11c",
    "seconds": 41,
    "usage": {
      "input_tokens": 133567,
      "cached_input_tokens": 94976,
      "cache_write_input_tokens": 0,
      "output_tokens": 941,
      "reasoning_output_tokens": 166
    },
    "saved_at": "2026-10-11T13:18:22.329Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs: otherWorkflows and detectFacts report all three workflows and their evidence paths. Passing 0124 AC1 tests exercise the CLI, individual OpenSpec signals, empty results and lookalikes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md: 'Other workflows and the project's rules' explains conflicts, recommends speck for new work, preserves existing files and requires a choice before project changes. Passing AC2 tests check these instructions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "otherWorkflows lists OpenSpec change folders excluding archive; the setup skill instructs naming them and recommending completion or /speck-ticket. Passing AC3 tests cover folder enumeration and the instructions."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The setup skill requires reading the rules and referenced guides, but incorrectly offers keeping auto_ship off as the setting response to a required reviewer. This does not change which reviewer reviews builds. The passing AC4 text tests do not check this distinction."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The setup skill explicitly prohibits changing other workflow files and project rules, retaining the existing speck-init section exception, and requires agreement before changing settings. Passing AC5 tests check these instructions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "The combined pull-request/particular-reviewer example recommends keeping auto_ship off for both conflicts. Disabling automatic shipping does not satisfy a required reviewer: builds still use the configured reviewer. Manual /speck-ship also still bypasses pull requests, so this setting postpones that conflict rather than resolving it.",
        "suggested_fix": "Separate these conflicts. For a required reviewer, recommend configuring the required reviewer with user agreement, or having the user change the rule. For required pull requests, explain that auto_ship off prevents automatic violations but /speck-ship remains incompatible. Update the instruction tests to check these distinctions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Detection works and setup now warns about competing workflows and unfinished work. The recorded suite has no failures. One piece of setup advice needs correction: disabling automatic shipping does not satisfy reviewer or pull-request requirements."
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
    "reviewed_sha": "aeebbbb5b8d7aafd46d1b5b36d6a983452cfd5e6",
    "thread_id": "01a12b1c-ab8e-7651-bc0f-73b36233a11c",
    "seconds": 20,
    "usage": {
      "input_tokens": 220986,
      "cached_input_tokens": 174848,
      "cache_write_input_tokens": 0,
      "output_tokens": 1524,
      "reasoning_output_tokens": 166
    },
    "saved_at": "2026-10-11T13:20:00.436Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/detect.mjs: otherWorkflows and detectFacts report OpenSpec, GitHub Spec Kit and Kiro with evidence paths, or an empty list. Passing AC1 tests exercise CLI output, individual detection signals and lookalikes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md requires explaining conflicting instructions before project changes, recommending speck for new work while preserving files, and waiting for the user's choice. Both AC2 instruction tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "otherWorkflows enumerates OpenSpec change folders excluding archive. The setup skill requires naming unfinished work and recommending completion or /speck-ticket before building. Both AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The setup skill requires reading AGENTS.md, CLAUDE.md and referenced guides, quoting clashes and explaining consequences and remedies. Separate pull-request and reviewer guidance now correctly addresses F1. AC4 tests and the new '0124 review F1' test pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The setup skill prohibits altering other workflow files and project rules, preserving the existing speck-init section exception, and requires user agreement before setting changes through speck config set. Both AC5 tests pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "The previous guidance incorrectly offered disabling automatic shipping as a remedy for required reviewers and pull requests.",
        "suggested_fix": "Completed: the guidance separates these requirements, recommends configuring the required reviewer, and explains that manual shipping still bypasses pull requests. A regression test checks the distinction.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change detects competing workflows and guides setup through unfinished work and conflicting project rules while preserving existing files. The misleading shipping and reviewer advice is corrected. All criteria pass; the recorded suite has 1,103 passing tests, three skipped and no failures."
  }
}
```

</details>
