---
id: "0667"
title: "Say what each level builds with in a ticket's Level menu"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0666"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T21:16:01.396Z"
approved: "2026-11-12T21:43:22.667Z"

---
# 0667 · Say what each level builds with in a ticket's Level menu

**Status:** 👍 approved

## Problem
A ticket's Level menu (0662) offers Quick, Balanced, Deep and "Settings" without saying what any of them builds with. "Settings" reads like a way to open the Settings page, but it takes the ticket's level off, and nothing in the menu leads to where levels are changed.

## Outcome
A ticket's Level menu says what each choice builds with and leads to where levels are set.

## Acceptance criteria
1. The choice that takes a ticket's level off is called "Default" in the menu and in the ticket's Level fact, never "Settings".
2. Each choice in the menu shows, under its name, the builder, model and effort it builds with, worked out as a build would (the level's own, else the Builder's in Settings), such as "Claude Code · Fable · high" or "Codex · default model · low". "Default" shows the Builder's own.
3. The menu ends with "Change levels", which closes the menu and opens Settings scrolled to Build levels on the Builder's card. It doesn't change the ticket's level.
4. Picking a level, refusals and done or cancelled tickets work as 0662 made them.

## Out of scope
- Setting a ticket's own builder model or effort in the panel.
- The Build levels on the Builder's card: 0666.

## Notes
- The board gives the page `levels` as names only (`scripts/panel.mjs`), so it needs each level's resolved builder, model and effort too. `ticketBuilderModel` in `scripts/build-model.mjs` and 0660's level resolution already work them out.
- Use the same "Default" word as 0666, and the Builder's agent and model names as the Builder's row shows them.
- Failing before this build: none
- Self-check: a board whose level_builds is missing or has odd entries now shows only each level's name (test added); taking pictures showed the chosen level's underline running under its builder line and Build levels landing under Settings' sticky top bar, both fixed in the CSS.
- speck (2026-11-12 21:39 UTC) told you: The build is slow, not stuck. Most of the time went on the related tests: 183 test files, over 2,100 tests, took about 8.5 minutes on a machine with a load near 50. Nine tests that start real panels or builds timed out under that load, and the build reran them alone, where they passed, which took about 2.5 more minutes. It then took light and dark screenshots, made two small style fixes and is rerunning the affected tests, where two more panels timed out while starting. Nothing points to a broken test on main. Why: The build's test output shows the related run took 505 seconds with 9 timing failures that all passed when rerun alone, and the latest failures are panel-start timeouts, the kind a load average of 45 to 57 causes.

## In plain words
A ticket's Level menu now says what each choice builds with: under Quick, Balanced, Deep and any level of your own you see its agent, model and effort, such as "Claude Code · Opus · low". The choice that leaves a ticket without a level is now called Default, in the menu and on the ticket, so it no longer reads like a way into Settings. The menu ends with "Change levels", which opens Settings at the Builder's Build levels without changing the ticket.

To see it, open any ticket that isn't done, tap its Level, and read the lines under each choice; then tap Change levels.

Worth knowing: a Codex model shows by its short name (such as gpt-6.1-sol) rather than the fuller name Settings lists, and a choice that builds with Cursor still shows an effort, though Cursor builds don't use one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 219,977
- Elapsed since build started: 27 min
- Changed lines: 76 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, in this log only, no inbox notes):
- The menu names a Codex or Cursor model by its slug, as the board knows it without asking the agent, while Settings lists Codex's own display names (such as GPT-6.1 Sol). Claude Code's and model providers' models already match Settings.
- A level that builds with Cursor shows its effort, though Cursor builds aren't given one.
- Tests that start a real panel or `speck run` timed out under the machine's load (59–66 on 16 cores) during this build, and passed when rerun alone.

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
    "reviewed_sha": "f9842fd5c48badf17b9773616ad4201fe1847998",
    "session": "fresh",
    "thread_id": "01a1d1b6-4826-79c1-a3d5-191b60009296",
    "builder_response": "- Tests run: `speck test --related test/panel-level-0667.test.mjs test/panel-level-0662.test.mjs` (the ticket's own file, 0662's file it changed, and every test file naming a changed file, with the `commands.checks` files). Then, after two CSS-only fixes found while taking pictures: test/panel-level-0667.test.mjs test/panel-level-0662.test.mjs test/panel-0417.test.mjs test/panel-0473.test.mjs test/settings-levels-0666.test.mjs test/settings-levels-0661.test.mjs.\n- About the failures in the output: every one is a real panel or `speck run` timing out (\"panel didn't start\", a build not stopping in time). The machine was at load 59–66 on 16 cores from other builds running alongside. Each failing file passed when rerun alone (the reruns are appended to the same output, marked with `===` lines), apart from the real-browser checks in the last rerun, whose panels again didn't start within the helper's 10 s; a panel started by hand from this branch on a fresh project came up in about 2 s at the same load.\n- 0662's tests change only where this ticket changes behaviour: \"Settings\" is now \"Default\" (AC1), and the menu ends with \"Change levels\" (AC3).\n- Pictures: the Level menu and the Settings view \"Change levels\" opens, in the light and dark looks.\n",
    "seconds": 41,
    "usage": {
      "input_tokens": 219037,
      "cached_input_tokens": 168576,
      "cache_write_input_tokens": 0,
      "output_tokens": 940,
      "reasoning_output_tokens": 107
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50461,
      "cached": 168576,
      "write": 0,
      "output": 940
    },
    "cost_usd": 0.1271796,
    "tests": {
      "failing": 18,
      "second_try": []
    },
    "saved_at": "2026-11-12T21:43:06.828Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js levelName() uses Default for an empty level. Passing 0667 AC1 and updated 0662 tests cover the fact, menu and full ticket view."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/level-builds.mjs levelBuilds() uses the existing build resolution functions; statusData() supplies the results and levelPicker() renders them below each name. Passing 0667 AC2 tests cover inheritance, agent changes, provider names, defaults and board data."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "levelPicker() appends Change levels, closes the menu and calls openSettings({ to: 'levels' }). loadSettings() scrolls to levelsBox. Passing 0667 AC3 tests verify the Builder's card is targeted and no level request is sent."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The existing level update and refusal paths remain intact. Passing 0667 AC4 and 0662 regression tests exercise selection, clearing, refusals and restrictions for finished tickets."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Level menu now explains each choice, calls the unset choice Default, and links to Build levels in Settings. The implementation and focused tests support all four criteria. Some broader browser checks remain limited by panel startup timeouts; I found no blocking defect in the change."
  }
}
```

</details>
