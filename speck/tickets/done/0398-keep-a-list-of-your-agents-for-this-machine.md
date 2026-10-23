---
id: "0398"
title: "Keep a list of your agents for this machine"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:00:15.944Z"
approved: "2026-10-23T10:07:19.648Z"
finished: "2026-10-23T10:10:10.400Z"

---
# 0398 · Keep a list of your agents for this machine

**Status:** ✅ done

## Problem
Settings offers every agent speck knows, whether or not it's set up here. DeepSeek appears as a choice before any API key is added, and Claude Code, Codex and Cursor appear whether or not they're installed.

## Outcome
speck keeps a list of the agents you've set up on this machine, and setup fills it with what it finds.

## Acceptance criteria
1. speck keeps the list of your agents for this machine, without a commit. Each can be Claude Code, Codex, Cursor or an API provider speck knows, such as DeepSeek. `speck agents` shows every agent speck knows, whether it's one of yours, whether it's installed and signed in (or, for a provider, whether its key is set), and its models.
2. `speck agents add <agent>` and `speck agents remove <agent>` change the list. Adding a provider whose key isn't set, or an agent that isn't installed, is refused, saying how to fix it. Removing an agent that the builder, reviewer or Foreman uses is refused, naming the role.
3. `speck init`, and the setup skill, add every agent they find installed and signed in, and every provider whose key is set, when this machine has no list yet, and say which they added. An existing list is left as it is.
4. Until this machine has a list, speck treats every agent that's installed and signed in, and every provider whose key is set, as yours. Nothing changes for someone who never sets one up.
5. The README describes your agents and these commands (checked by review). No test that passed before this change fails.

## Out of scope
- Settings: 0399 and 0400.

## Notes
- Checked 2026-10-23: `speck agents` (0288, `scripts/agents.mjs`) already reports whether Claude Code, Codex and Cursor are installed and signed in, and their models. API providers and their keys are in `scripts/providers.mjs` and `scripts/keys.mjs` (0389).
- Keep the list beside this machine's settings from 0386.
- Folds in `speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md`, as the user chose on 2026-10-23.
- Failing before this build: none
- Self-check: `speck agents add` now always keeps a list, even for an agent that already counted as yours; init reports an unreadable list instead of stopping; init writes no list when nothing is ready, so an agent set up later still counts as yours.

## In plain words
speck now remembers which agents you've set up on this computer: Claude Code, Codex, Cursor and DeepSeek. Setting speck up fills the list with whichever are installed and signed in, or have a key saved, and tells you which it added. An existing list is never touched.

To see it, run `speck agents`: each agent now says whether it's yours, and DeepSeek appears with whether its key is set. You can add or take one off the list yourself; speck won't add one that isn't installed or has no key, and won't take off the one doing your building, reviewing or Foreman work.

Nothing changes yet in the Settings view: that comes with the next two tickets. If you never make a list, everything that's ready counts as yours, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Setup does not create the list for an existing speck installation on a machine without one.; F2 cmdAgents now unconditionally calls findRepoRoot, so listing agents fails before speck is initialised.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 558,470
- Elapsed since build started: 7 min
- Changed lines: 174 (limit 5000)
- Follow-ups (no inbox notes; known limits only):
  - `speck init --skip-checks` doesn't make the list, as it skips the other checks; setup fills it from `speck agents --json` instead.
  - An agent that's installed but signed out can be added, with a note on how to sign in: the criteria refuse only agents that aren't installed.
  - The list isn't used anywhere yet: Settings takes it up in 0399 and 0400.

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
    "reviewed_sha": "772f4c734f8c89f4b8446d151595950f08fa6b40",
    "session": "fresh",
    "thread_id": "01a16838-d62a-73f0-9e39-4fafdf6dc498",
    "builder_response": "- Tests run: test/agents-0398.test.mjs test/agents-0288.test.mjs test/agents-0388.test.mjs test/agents-0123.test.mjs test/keys-0389.test.mjs test/detect-0086.test.mjs test/windows-0091.test.mjs test/setup-0088.test.mjs (plus the commands.checks files speck test runs itself)\n- Notes: `speck agents --json` keeps `agents` as Claude Code, Codex and Cursor (0288's tests read it) and adds `providers` and `list`, with `yours` on each entry. init fills the list only when it runs its checks (`--skip-checks` skips it, as it skips doctor). Adding an agent that is installed but signed out is allowed, with a note on how to sign in: the criterion refuses only agents that aren't installed.\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 220426,
      "cached_input_tokens": 167296,
      "cache_write_input_tokens": 0,
      "output_tokens": 980,
      "reasoning_output_tokens": 63
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:06:05.469Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/your-agents.mjs stores agents.json beside machine settings and reports CLI agents and providers. Passing AC1 tests cover persistence, ignored git state, readiness, membership and models."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "addAgent, removeAgent and rolesUsing implement changes and refusals. Passing AC2 tests exercise missing installations, missing keys and protected roles."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "cmdInit calls fillLine, with passing tests for initial discovery and preserving an existing list. However, skills/speck-setup/SKILL.md skips init when speck is already installed and never explicitly fills a missing list in that path."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "yourAgents and agentsReport fall back to readyIds without persisting. The passing AC4 test exercises discovery before a list exists and later availability."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README's 'Your agents' paragraph explains membership, storage, discovery and add/remove commands. Reported tests: 207 passed, zero failed, three skipped. Added documentation assertions check command and file names only."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "Setup does not create the list for an existing speck installation on a machine without one. Section 2 runs init only when speck is absent; section 5 merely describes what init previously did. Existing ready agents therefore remain an implicit fallback rather than being saved as criterion 3 requires.",
        "suggested_fix": "Add an explicit setup step that detects a missing list, saves every ready agent and keyed provider, and reports those added, while preserving an existing list. Add coverage for the existing-installation path.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/your-agents.mjs",
        "issue": "cmdAgents now unconditionally calls findRepoRoot, so listing agents fails before speck is initialised. Previously this worked without a speck config, and the setup skill still explicitly offers the npx agents --json command before installation.",
        "suggested_fix": "Preserve agent discovery outside an initialised speck project, with sensible membership and provider-key reporting when no project exists. Test listing from a directory without speck/config.yml.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The list, commands and initial discovery are implemented and the reported tests pass. Two setup gaps remain: an existing installation does not save its first list, and listing agents before installation now fails."
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
    "reviewed_sha": "03340279eccf99ffc632093f7a94d4e0fb775cd2",
    "session": "continued",
    "thread_id": "01a16838-d62a-73f0-9e39-4fafdf6dc498",
    "builder_response": "- Tests run: test/agents-0398.test.mjs test/agents-0288.test.mjs test/agents-0388.test.mjs test/agents-0123.test.mjs test/keys-0389.test.mjs test/detect-0086.test.mjs test/windows-0091.test.mjs test/setup-0088.test.mjs (plus the commands.checks files)\n- F1: fixed. skills/speck-setup/SKILL.md section 5 now has setup read `list` from `speck agents --json` once speck is installed; when it's false, as in a project that already had speck, it runs `speck agents add <id>` for each entry whose `yours` is true and tells the user which it added, and leaves an existing list alone. New test \"0398 AC3 F1\" checks the skill names these and that running those adds saves every ready agent and keyed provider.\n- F2: fixed. cmdAgents only needs a speck project for add and remove. Listing outside one reports every agent with no list (`list: false`) and no provider keys, so `npx … agents --json` before install works as before. New test \"0398 AC1 F2\" lists from a folder without speck/config.yml, and checks add there gives speck's usual \"run speck init first\" message.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 335476,
      "cached_input_tokens": 275584,
      "cache_write_input_tokens": 0,
      "output_tokens": 1588,
      "reasoning_output_tokens": 63
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T10:07:09.286Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/your-agents.mjs persists membership beside machine settings and reports readiness, membership and models. Passing AC1 tests cover reporting, ignored storage and listing before installation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "addAgent, removeAgent and rolesUsing implement membership changes and required refusals. Passing AC2 tests cover missing installations, missing provider keys and builder, reviewer and Foreman protection."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdInit calls fillLine to discover and save ready agents while preserving existing lists. Setup section 5 now explicitly saves ready entries when list is false. Passing AC3 tests cover initialisation, providers, existing lists and the setup command sequence."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "yourAgents and agentsReport use readyIds when no list exists. The passing AC4 test verifies fallback discovery without writing a list, including agents becoming available later."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README's 'Your agents' paragraph describes discovery, membership, storage and add/remove commands. Reported checks passed: 209 tests, zero failures and three skips. Documentation tests assert command and file names rather than prose wording."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "skills/speck-setup/SKILL.md",
        "issue": "Setup previously omitted initialising a missing list in an existing installation.",
        "suggested_fix": "Implemented: section 5 now adds every entry marked yours when list is false, reports the additions and preserves existing lists. The new AC3 F1 test exercises those commands.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/your-agents.mjs",
        "issue": "Listing agents previously required an initialised speck project.",
        "suggested_fix": "Implemented: listing accepts a null repository and reports discovery without saved membership or keys; add/remove still require a project. The new AC1 F2 test covers both paths.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both setup gaps are fixed. speck now keeps and manages this machine's agent list, setup saves discovered agents, and discovery still works before installation. All criteria pass, with no remaining blocking findings."
  }
}
```

</details>
