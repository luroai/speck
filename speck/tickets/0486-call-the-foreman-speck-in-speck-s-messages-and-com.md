---
id: "0486"
title: "Call the Foreman speck in speck's messages and commands"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:44:03.734Z"
approved: "2026-10-24T19:02:24.812Z"

---
# 0486 · Call the Foreman speck in speck's messages and commands

**Status:** 👍 approved

## Problem
`speck run`, `speck status` and the Pipeline log say "the Foreman" in about forty messages, and you answer it with `speck foreman answer`. With one speck watching the pipeline, the second name is a concept people have to learn for nothing.

## Outcome
speck's messages and commands say speck where they said the Foreman, and the old commands still work.

## Acceptance criteria
1. No message that `speck run`, `speck status` or any other speck command prints, and no line `speck run` writes to its log, contains "Foreman" in any case: each says speck instead, for example `0479: speck (Claude) is looking into it. Log: …`, `speck asks you about 0479: …` and `0479: your answer to speck wasn't carried out, as the ticket has moved on since.` Checked across every string in `scripts/` that becomes such a message, not only a sample. Setting names are excepted (0487).
2. `speck answer <id> "<answer>"` and `speck dismiss <id>` do what `speck foreman answer` and `speck foreman dismiss` do today, refusals included. The agent's own actions are `speck watch resume|reship|fix|ask <id> … --why=<why>`. The old `speck foreman …` forms still work the same, and speck's usage text lists only the new ones.
3. The commits speck's agent makes to a ticket start `speck(<id>): watch:`, and speck still treats a commit starting `speck(<id>): Foreman:` as the agent's own (0349), so tickets with old commits aren't looked into again.
4. The agent-only skill is `speck-watch`: installing speck, or installing it again over an older install, puts in `speck-watch` and takes out `speck-foreman`, as 0116 does for retired skills, and the brief `speck run` gives the agent names `speck-watch`. No test that passed before this change fails.

## Out of scope
- The panel's own wording (0485).
- The setting names (0487).
- The skill's text, the README and the brief (0488): this moves the skill's folder and changes its `name:`.
- File and function names inside `scripts/`, such as `foreman-agent.mjs`.
- CHANGELOG and `docs/releases/`, which record what each release said.

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: the messages in `scripts/foreman-agent.mjs`, `foreman.mjs`, `foreman-answer.mjs`, `foreman-took.mjs`, `foreman-fix.mjs`, `go-with.mjs`, `provider-build.mjs` and `run.mjs`; the commands in `scripts/speck.mjs`; `foremanSubject` in `scripts/build-records.mjs`; `skillPath` in `scripts/foreman-agent.mjs`; `RETIRED_SKILLS` in `scripts/install.mjs`.
- Unchained from 0485: this changes `scripts/` and the skill's folder, 0485 the panel's `templates/`.
- Failing before this build: none
- Self-check: kept reading old Notes lines ("chosen by the Foreman") and old commits (`speck(<id>): Foreman:`) as speck's own, with a test for each; renamed the agent's log file, as `speck run` prints its path; made `cmdWatch` a function declaration, as speck.mjs reads it while the modules load in a cycle.
- Scope: the Settings group's title is Watching here (and in the one line of `templates/panel-settings.js` that finds it), because `speck config show` prints it. The role's name in Your agents (`rolesUsing`) stays Foreman for 0485, which owns it; the CLI's refusal to remove an agent words it as "the agent speck watches with". The skill's own text, the README and the brief still say `speck foreman`, which still works (0488).
- Pictures: none, because nothing the panel draws changes: its Watching group heading and roles are 0485's.

## In plain words
speck's messages no longer talk about "the Foreman": `speck run`, `speck status` and the Pipeline log now say speck, for example "speck asks you about 0479". You answer its questions with `speck answer` and `speck dismiss`, and the old `speck foreman` commands still work. `speck config show` calls the group of these settings Watching.

To see it, run `speck status` or `speck help`: neither mentions the Foreman.

Worth knowing: the panel still says Foreman in a few places, and the setting names and docs still use the old word, until the three related tickets ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 319,096
- Elapsed since build started: 18 min
- Changed lines: 217 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (none sent to the inbox, as the sibling tickets cover them):
- The brief still says the agent's commits start `speck(<id>): Foreman: answer` and `dismiss`, and `test/foreman-answer-0318.test.mjs` checks that wording: 0488 changes both (its AC2).
- The skill's own text still says `speck foreman …`, which still works: 0488.
- The panel's Watching heading and the role's name in Your agents (`rolesUsing` in `scripts/your-agents.mjs`): 0485.

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
    "reviewed_sha": "c0ce2f377d67ba01878d2974526da61b5dac7297",
    "session": "fresh",
    "thread_id": "01a16f4a-5453-7de1-88dc-f4251b43e5a1",
    "builder_response": "- Tests run (speck test --related): test/watch-0486.test.mjs test/agents-0398.test.mjs test/core.test.mjs test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/foreman-agent-0287.test.mjs test/foreman-answer-0318.test.mjs test/foreman-asked-0328.test.mjs test/foreman-cursor-0333.test.mjs test/foreman-fix-0286.test.mjs test/foreman-provider-0392.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0257.test.mjs test/panel-0451.test.mjs test/panel-0483.test.mjs test/settings-0370.test.mjs test/settings-0381.test.mjs test/settings-0396.test.mjs test/settings-0407.test.mjs test/settings-agents-0399.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-foreman-0348.test.mjs test/settings-groups-0406.test.mjs test/settings-info-0405.test.mjs test/settings-models-0369.test.mjs test/settings-provider-0393.test.mjs test/settings-roles-0400.test.mjs test/settings-roles-0403.test.mjs test/setup-0107.test.mjs test/status-json.test.mjs test/worktrees.test.mjs , plus every test file naming a changed file, and the commands.checks files. 1530 pass, 0 fail.\n- AC1 is checked by test/watch-0486.test.mjs's scanner (test/support/strings.mjs), which reads every string literal in scripts/*.mjs, outside comments and regexes, and allows only setting names (0487), internal file, env and module names, the old Notes/commit wording kept for reading old tickets, and the role name 'Foreman' in your-agents.mjs, which only the panel shows (0485 owns rolesUsing per its Notes); the CLI refusal in removeAgent rewords it.\n- The Settings group's title is now Watching (speck config show prints it), with the one line of templates/panel-settings.js that finds the group by its title. Test fixtures with that title were updated; the panel's own visible heading stays 0485's.\n- The agent's log file is now run.watch.log, since speck run prints its path.\n- Old notes (\"chosen by the Foreman\") and old commits (speck(<id>): Foreman:) still count as speck's own (go-with, foreman-took, build-records, foremanOnly, codeKey).\n- The skill moved to skills/speck-watch with name: speck-watch; its text still says speck foreman, which still works, and is 0488's.\n- Existing tests that asserted the old wording were updated to the new wording; panel-text assertions were left for 0485.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 318285,
      "cached_input_tokens": 230016,
      "cache_write_input_tokens": 0,
      "output_tokens": 811,
      "reasoning_output_tokens": 78
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:02:12.641Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Reviewed remaining Foreman references across scripts/: message text now says speck; retained references serve settings, internal identifiers or compatibility. Passing 0486 AC1 tests scan script strings and exercise queue and status output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs dispatches answer, dismiss and watch to the existing handlers and retains foreman aliases. Passing 0486 AC2 tests cover replies, refusals, agent actions and usage text; existing action tests also pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/build-records.mjs emits watch: subjects and recognises both prefixes through byWatch. foremanOnly and codeKey preserve legacy recognition. Passing 0486 AC3 test verifies old and new commits against real git history."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/install.mjs retires speck-foreman; skills/speck-watch declares the new name; foremanBrief points to it. Passing 0486 AC4 tests verify installation cleanup and brief paths. Recorded related run reports 1530 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Commands and pipeline messages now call the watcher speck. The old commands and historical records remain compatible, and installation replaces the old skill. The relevant tests pass, with no blocking concerns found."
  }
}
```

</details>
