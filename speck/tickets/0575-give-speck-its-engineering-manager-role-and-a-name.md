---
id: "0575"
title: Let you name speck, your engineering manager                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T17:42:11.358Z"
approved: "2026-11-09T17:53:26.990Z"

---
# 0575 · Let you name speck, your engineering manager

**Status:** 👍 approved

## Problem
speck's watcher acts like an engineering manager (it takes the calls, unblocks builds and tells you what it did) but nothing says so: the Settings view calls its group Watching and describes its settings one by one, and the docs never say what its job is. Nor can you name it, though people who work with it daily, like the user, think of it by a name of their own.

## Outcome
speck is described everywhere as your engineering manager, with a short account of its job, and you can give it a name of your own for each project.

## Acceptance criteria
1. `speck_name` is a project setting, `speck` by default. `speck config set speck_name "Virgil"` saves it in `speck/config.yml`. A name must be 1 to 24 characters of letters, digits, spaces, hyphens and apostrophes, starting with a letter; anything else is refused with a message saying what's allowed, changing nothing.
2. In the Settings view, the group that was Watching is headed "Your engineering manager" and still sits under the speck run switch. Its first setting is `speck_name`, which can be changed and saved there like the others, and its explanation says what the engineering manager does and that it can be called anything (checked by review).
3. The explanations of `watch`, `watch_agent`, `watch_model` and `watch_effort` call the engineering manager by the name `speck_name` gives ("What Virgil does when a build stops with a question…"), and `speck` when it's unset.
4. `docs/brief.md` has a section on the engineering manager that names `speck_name` and says what the role does, how it differs from your own agent and from the builder and reviewer, and that the `watch` settings are its settings. The README says in one sentence that speck works as your engineering manager and can be renamed (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Using the name in speck's messages, `speck status` and the panel's cards (0576).
- Renaming the `watch` settings or the `speck` command.
- Giving the engineering manager new abilities, such as checking work in a browser.

## Notes
- Asked for 2026-11-09: speck is the character, your engineering manager, and you can call it whatever you like, as you can name your agents in other tools (the user's is Virgil). Its role goes in the Settings view's explanation and the docs. Builders and reviewers stay swappable underneath; your own agent (Claude, Cursor or another) stays the one you talk to.
- Suggested wording for the role, to adapt: "speck is your engineering manager. Once you set a ticket ready, getting it shipped is its job: it runs the builder and reviewer you've chosen, makes the obvious calls when a build asks, gets stuck work moving again, checks the result and tells you what it did and why. It asks you only when there's no clear answer. You decide what gets built; your own agent is who you plan it with. Call it whatever you like."
- Decided: the role is engineering manager, not tech lead (which writes the code and decides the design) or chief of staff (not an engineering role). The setting is `speck_name`, not `name`, so it can't be mistaken for the project's name.
- Today: the group is `{ title: 'Watching', ... }` in `SETTING_GROUPS` in `scripts/settings.mjs`, and `templates/panel-settings.js` finds it by that title (`g.title === 'Watching'`) to put it under the speck run switch, so both change together. Settings are validated in `scripts/config.mjs`. 0485 to 0488 renamed the Foreman to speck; this keeps speck as the default name.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: spaces at the end of a name are dropped when it's saved or read, so a name never ends up as "Virgil 's agent", with a test; the brief's sentence that placed the switch in this group now says it's the Auto-build switch, as the page draws it.

## In plain words
speck now says what it is: your engineering manager, the one that gets a ready ticket shipped and only asks you when there's no clear answer. You can give it a name of your own for each project. To see it, open Settings: the group that was called Watching is now Your engineering manager, with the name as its first setting. Type a name and save, then press the info button on watch, and the explanation uses that name. For now the name only appears in those explanations: speck's messages and the panel's cards still say speck until the next ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 159,011
- Elapsed since build started: 11 min
- Changed lines: 66 (limit 5000)
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
    "reviewed_sha": "7bc4b4b04d48f1a81e9cd5854ca9bc3b7330e038",
    "session": "fresh",
    "thread_id": "01a1c170-f371-7530-b760-edee62228205",
    "builder_response": "- Tests run: speck test --related with test/foreman-0285.test.mjs test/foreman-agent-0287.test.mjs test/foreman-cursor-0333.test.mjs test/foreman-fix-0286.test.mjs test/panel-0257.test.mjs test/panel-0258.test.mjs test/panel-0368.test.mjs test/panel-0451.test.mjs test/settings-0370.test.mjs test/settings-0381.test.mjs test/settings-0396.test.mjs test/settings-0407.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-foreman-0348.test.mjs test/settings-groups-0406.test.mjs test/settings-info-0405.test.mjs test/settings-models-0369.test.mjs test/settings-provider-0393.test.mjs test/settings-roles-0400.test.mjs test/settings-roles-0403.test.mjs test/speck-name-0485.test.mjs test/speck-name-0575.test.mjs test/watch-decide-0564.test.mjs test/watch-settings-0487.test.mjs (and every existing test file naming a changed file, as --related chose). 2346 passed, 0 failed, 3 skipped.\n- AC5 (no test that passed before fails) has no test of its own: the related run above covers it, and speck ship runs the whole suite.\n- Existing tests changed only where this ticket changes what they check: the group title 'Watching' became 'Your engineering manager' (in fixtures and assertions), and speck_name was added to the lists of settings (settings count 19 to 20, EDITABLE, group keys). No assertion was removed.\n- Also changed in docs/brief.md: the sentence saying the first group, Watching, has the speck run switch now says the Auto-build switch, as the page draws it, with the group under it.\n- speck_name's value is checked in checkConfigValue, so the CLI and the panel's Save refuse the same things. It's a project setting, not one of MACHINE_SETTINGS.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 158129,
      "cached_input_tokens": 99968,
      "cache_write_input_tokens": 0,
      "output_tokens": 882,
      "reasoning_output_tokens": 92
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58161,
      "cached": 99968,
      "write": 0,
      "output": 882
    },
    "cost_usd": 0.1351388,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T17:53:18.829Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs checkConfigValue validates and trims names; scripts/core.mjs speckNameOf supplies the default. Passing 0575 AC1 tests cover CLI persistence, allowed names and rejection without changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "SETTING_GROUPS puts speck_name first in Your engineering manager; panel templates retain its position beneath Auto-build. Passing AC2 tests cover rendering and saving. The explanation describes the role and says it can be called whatever you like."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/settings.mjs namedExplain and explainFully substitute the configured name in all four watch explanations. Passing AC3 tests cover Virgil, the speck fallback and config show."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's Your engineering manager section explains the role, distinguishes the owner, own agent, builder and reviewer, and names speck_name and all watch settings; its settings facts have a passing test. README's opening paragraph includes the requested sentence."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the recorded test output: 2346 passed, 0 failed, 3 skipped. Existing test changes track the new group title and setting without weakening assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "You can now give speck a project-specific name through the command line or Settings. Its engineering manager role is explained in Settings and the docs, and the watch settings use the chosen name. The tests pass, and I found no blocking issues or unrelated changes."
  }
}
```

</details>
