---
id: "0755"
title: "Keep a list of your projects on this machine"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T09:32:23.220Z"

---
# 0755 · Keep a list of your projects on this machine

**Status:** 🔍 reviewing

## Problem
speck only knows a project while its panel is running, as each panel registers itself in the home folder (0516). A service that runs every project needs a list of them that lasts, whether their panels are running or not.

## Outcome
`speck projects` lists, adds and removes the projects on this machine, kept in the home folder.

## Acceptance criteria
1. `speck projects add [<folder>]` adds the speck project at that folder (or the current one) to a list in the home folder, by its real path, and says so; adding one already listed says it's there and changes nothing.
2. `speck projects add` refuses a folder that isn't a git repository with speck set up (no `speck/config.yml` and `.speck/`), saying why, and adds nothing.
3. `speck projects` lists each project with its name, folder, the speck version in its `.speck/`, and whether its panel and its `speck run` are running; a listed folder that no longer exists is shown as missing.
4. `speck projects remove <name or folder>` takes it off the list and touches nothing in the project.
5. The brief's command table describes `speck projects`, `speck projects add` and `speck projects remove`. No test that passed before this change fails.

## Out of scope
- Starting anything: the service ticket after this does that.
- The panel.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- Keep the list beside the other home-folder files (`homeSettingsDir()` in `scripts/home-settings.mjs`, `~/.config/speck/`), not in any repo: it holds personal folder paths.
- A project's name is its folder's name, as the project menu shows it today (`scripts/panel-projects.mjs`).
- Failing before this build: none
- Self-check: `speck projects add` now says git can't be run, rather than that the folder isn't a git repository, when git isn't installed.

## In plain words
speck can now keep a list of your projects on this machine that lasts whether their panels are running or not. Run `speck projects add` in a project to put it on the list, `speck projects` to see every project with its speck version and whether its panel and `speck run` are on, and `speck projects remove <name>` to take one off. The list lives in your home folder, never in a project, and adding or removing a project never changes anything inside it. Nothing starts anything yet: this is the list the coming one-service-per-machine work will read. Worth knowing: a panel started from a build's separate copy of a project, rather than the project's own folder, isn't counted as that project's panel.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none sent to the inbox):
- A panel started from one of a project's worktrees records the worktree's folder, so `speck projects` shows that project's panel as off. Match records against the project's worktrees if the service needs it.
- `speck projects` has no `--json`; the service ticket after this one will likely want `projectsState()` (already exported) behind one.

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
    "reviewed_sha": "d5e2187f452c9fba4fc852e74318c77721fdbf46",
    "session": "fresh",
    "thread_id": "01a21737-ab6a-7002-afbd-6a2e9d1e1448",
    "builder_response": "- Tests run: `speck test --related test/projects-0755.test.mjs` (the ticket's own file, the commands.checks files and every test file that names a file this branch changed): 2838 tests, 0 failed.\n- New command `speck projects` in scripts/projects.mjs, wired into scripts/speck.mjs (COMMANDS and help); a row in docs/brief.md's command table.\n- The list is ~/.config/speck/projects.json (homeSettingsDir(), so SPECK_HOME_SETTINGS_DIR moves it for tests), written atomically, mode 0600.\n- `add` resolves the folder's real path, then its git top level, then the main checkout (so a worktree or subfolder adds the project itself), and needs speck/config.yml and a .speck/ folder there.\n- The panel column reads the panel records in the home folder (not a build's own records) and matches them by their repo's real path; speck run's state comes from runState on the project's speck/.cache/runs.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 159896,
      "cached_input_tokens": 111488,
      "cache_write_input_tokens": 0,
      "output_tokens": 786,
      "reasoning_output_tokens": 47
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 48408,
      "cached": 111488,
      "write": 0,
      "output": 786
    },
    "cost_usd": 0.1158248,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T09:38:01.923Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/projects.mjs: projectAt and addProject resolve real paths, normalise to the main checkout, persist additions and leave duplicates unchanged. All three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/projects.mjs: projectAt checks git membership, speck/config.yml and .speck/ before writing. The passing AC2 test exercises missing setup, a non-repository, a missing folder and unavailable git."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/projects.mjs: projectsState and listProjects show names, folders, installed versions, panel records, run locks and missing folders. Passing AC3 tests exercise running, stopped, missing, empty and malformed-list cases."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/projects.mjs: removeProject changes only the home-folder list and rejects ambiguous names. Passing AC4 tests cover removal by name and folder, missing folders and unchanged project contents."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md's command table describes all three commands; the AC5 test checks these command facts and passed. Verified /tmp/speck-0755-tests.txt reports 2,838 tests with zero failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The command keeps a lasting project list in your home folder, shows each project's version and running status, and removes entries without changing project files. The tests exercise the requested behaviour and reported no failures. No blocking concerns found."
  }
}
```

</details>
