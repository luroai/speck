---
id: "0667"
title: "Say what each level builds with in a ticket's Level menu"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-12T22:06:11.482Z"
finished: "2026-11-12T22:20:13.003Z"

---
# 0667 · Say what each level builds with in a ticket's Level menu

**Status:** ✅ done

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

Worth knowing: a Codex or Cursor model is named as Settings names it once speck has asked the agent for its list, which happens the first time you open a Level menu; until then, or if the agent can't be asked, it shows the model's short name (such as gpt-6.1-sol). A choice that builds with an agent that isn't given an effort, such as Cursor, shows none.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): changes requested: F1 A Cursor level can advertise low, high or max effort although Cursor builds never receive an effort setting.; F2 modelName() returns raw slugs for Codex and Cursor, whereas Settings uses model display_name when available.
Round 3 (codex, merge round): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 3 of them merge rounds
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 763,699
- Elapsed since build started: 50 min
- Changed lines: 117 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, in this log only, no inbox notes):
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

<details><summary>Round 2 · codex · changes_requested · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "4d9a962ed3576ab7aeef3ce4a46c6f85b0ad49b9",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1d1b6-4826-79c1-a3d5-191b60009296",
    "builder_response": "Merge round: ship's tests failed on the ticket merged with main. main's only new commit adds a ticket file (0670), so the merge was clean and the failures were this ticket's own.\n\n- Tests run: test/panel-level-0667.test.mjs test/panel-level-0662.test.mjs test/panel-0424.test.mjs test/panel-0462.test.mjs test/panel-0583.test.mjs test/panel-0612.test.mjs test/resume-0044.test.mjs test/status-json.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs test/panel-0434.test.mjs test/panel-0624.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs (all pass).\n- Which failed, and why:\n  - 0424 AC1, 0462 AC1, 0583 AC3 expected a ticket with no level to show \"Settings\". AC1 of this ticket renames it to \"Default\", so they now expect \"Default\". 0463, 0465, 0434, 0624 and 0419 had the same expectation (not in ship's quick suite, but in the full one) and are changed the same way.\n  - 0044 AC3 and 0030 AC1 list status --json's top-level keys exactly. They now include level_builds, which AC2 adds. 0030's whole-object check of an empty project checks level_builds' names (each level, then Default) and compares the rest as before: its values depend on the Builder's settings.\n  - 0612 AC3: the builder line under each level was 12 px text inside a button, which the panel's rules forbid. 13 px is forbidden outside rows' details too (0427 AC1), so the line now takes the menu's own size and is set apart only by its muted colour.\n- No test was weakened: each change follows the new behaviour the ticket asks for.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 425022,
      "cached_input_tokens": 353152,
      "cache_write_input_tokens": 0,
      "output_tokens": 1839,
      "reasoning_output_tokens": 190
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 21409,
      "cached": 184576,
      "write": 0,
      "output": 899
    },
    "cost_usd": 0.0702656,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T21:58:42.490Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js levelName() uses Default. Passing 0667 AC1 tests and updated panel regression tests cover the menu and ticket facts."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "levelBuilds() resolves configured values, but reports effort for Cursor even though cursorStartWords() never passes effort. modelName() also returns Codex/Cursor slugs instead of the display names used by Settings. Existing AC2 tests omit these cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "levelPicker() closes the menu and opens Settings targeting levelsBox without setting a level. Passing 0667 AC3 tests verify navigation and absence of a ticket update."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Selection, refusal and finished-ticket guards remain unchanged. The 0662 and 0667 regression tests pass; this round reports 285 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/level-builds.mjs",
        "issue": "A Cursor level can advertise low, high or max effort although Cursor builds never receive an effort setting. This misstates what the choice builds with. I missed this in round 1.",
        "suggested_fix": "Represent effort as inapplicable for Cursor and render that accurately rather than displaying the configured effort. Add coverage for a Cursor level with an explicit effort.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/level-builds.mjs",
        "issue": "modelName() returns raw slugs for Codex and Cursor, whereas Settings uses model display_name when available. This misses the ticket's explicit requirement to use the Builder row's model names.",
        "suggested_fix": "Reuse the available model catalogue/display-name resolution, retaining a slug fallback when no name is available. Test a model whose display name differs from its slug.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The regression updates and text-size fix are appropriate, and all tests run this round pass. Two details missed in my first review still need fixing: Cursor choices advertise effort they do not use, and some model names differ from Settings."
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
    "reviewed_sha": "26b247a8bdfbe5c666f540c0d26b27ed9d9bc0af",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1d1b6-4826-79c1-a3d5-191b60009296",
    "builder_response": "- Tests run: test/panel-level-0667.test.mjs test/panel-level-0662.test.mjs test/panel-0424.test.mjs test/panel-0462.test.mjs test/panel-0583.test.mjs test/panel-0612.test.mjs test/resume-0044.test.mjs test/status-json.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs test/panel-0434.test.mjs test/panel-0624.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs (all pass).\n- F1: fixed. levelBuilds() (scripts/level-builds.mjs) now gives `effort: null` when the builder isn't given one: only Claude Code is always, and Codex when speck starts it with its own command (codex-build.mjs passes model_reasoning_effort); Cursor, model providers and Codex under a hand-set build_command are not. levelBuildWords() (templates/panel.js) leaves a null effort out, so a Cursor level reads \"Cursor · composer-2\". Tests: \"0667 AC2 F1: a builder that isn't given an effort shows none…\" (server, including the build_command case) and \"…the menu leaves out an effort…\" (page).\n- F2: fixed. The board gives each level's `model_slug` beside `model`. When a Level menu opens, the page asks the panel's existing /api/agent-models (the one Settings uses) once a page for Codex's and Cursor's lists, where a level builds on one of their models, and names the model by its `display_name`, as Settings does. It keeps the slug while the list is read, or when it can't be (refused, offline, no models, or no entry for that slug). The open Plan card's key now includes how many lists have come back, so it is drawn again with the names; the full view redraws anyway. Tests: \"0667 AC2 F2: a Codex or Cursor model goes by the name its agent's list gives it, asked once\", \"…can't be read keeps the name the build is given\" (four failure shapes), \"…a queued ticket's full view names the model too\", and \"…the board gives the model as the build is given it\".\n- Ticket's In plain words and Delivery log updated: the two known limits they named are gone.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 584135,
      "cached_input_tokens": 502656,
      "cache_write_input_tokens": 0,
      "output_tokens": 2480,
      "reasoning_output_tokens": 190
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9609,
      "cached": 149504,
      "write": 0,
      "output": 641
    },
    "cost_usd": 0.0405784,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T22:01:50.153Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js levelName() renders Default for an unset level. Passing AC1 tests cover the menu and ticket facts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "levelBuilds() uses build resolution and omits inapplicable effort. levelBuildWords() uses agent model display names when available. Passing AC2 tests cover inheritance, defaults, providers, Cursor effort, model names and failed catalogue requests."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Change levels closes the menu and opens Settings at levelsBox. Passing AC3 tests verify the Builder's Build levels are targeted without changing the ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Selection, refusal and finished-ticket guards remain intact. The 0662 and 0667 regression tests pass; this round reports 291 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/level-builds.mjs",
        "issue": "Cursor choices previously advertised effort that builds do not receive.",
        "suggested_fix": "Completed: inapplicable effort is null and omitted from the menu, with server and page regression tests.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Codex and Cursor models previously used slugs instead of available Settings display names.",
        "suggested_fix": "Completed: the menu reads the existing agent-models API and uses display names, with a slug fallback and tests for both ticket views and failure cases.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both requested fixes are complete. The menu now accurately describes each choice and opens the relevant Settings section without changing the ticket. All tests run this round pass, and no blocking findings remain."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "edac4c3c18824afc92cf2c5268b362b498524622",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1d1b6-4826-79c1-a3d5-191b60009296",
    "builder_response": "- Tests run: test/panel-level-0667.test.mjs test/panel-level-0662.test.mjs test/panel-0424.test.mjs test/panel-0462.test.mjs test/panel-0583.test.mjs test/panel-0612.test.mjs test/resume-0044.test.mjs test/status-json.test.mjs test/panel-0463.test.mjs test/panel-0465.test.mjs test/panel-0434.test.mjs test/panel-0624.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs test/panel-0417.test.mjs. Six real-browser tests in that run timed out with \"panel didn't start\" at load 49 on 16 cores. Their six files, rerun on their own with `node --test`, all pass (appended to the output after an `===` line).\n- Why another round after the approval: retaking the pictures showed that, now the builder line is at the menu's own 14 px (the round-2 fix for 0612 and 0427), the menu ran off the right edge of a 420 px panel, clipping \"medium\". The only change is CSS in templates/panel-cards.css. The menu now hangs from the Level cell's right edge (the cell is its positioning box, through `:has`), sized to its lines (`width: max-content`), no wider than the screen less 32 px, and a builder line too long for that wraps. Measured in Chrome at 420 px: the menu spans 183–404 px, with every line on one line. The new pictures show it in both looks.\n- No behaviour or wording changed; no test changed.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 760620,
      "cached_input_tokens": 669696,
      "cache_write_input_tokens": 0,
      "output_tokens": 3079,
      "reasoning_output_tokens": 190
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9445,
      "cached": 167040,
      "write": 0,
      "output": 599
    },
    "cost_usd": 0.041584,
    "tests": {
      "failing": 6,
      "second_try": []
    },
    "saved_at": "2026-11-12T22:06:05.971Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js levelName() still uses Default for an unset level. The AC1 menu and ticket-fact tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Build resolution, model display names and applicable effort remain covered by passing AC2 tests. panel-cards.css now anchors the menu to the Level cell, limits its width and permits builder lines to wrap."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The navigation code is unchanged. Passing AC3 tests verify that Change levels closes the menu, opens Settings at Build levels and leaves the ticket's level unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Selection and restriction paths are unchanged. The 0662 and 0667 regression tests pass. Browser tests that initially hit panel-start timeouts passed in the isolated rerun."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/level-builds.mjs",
        "issue": "Cursor choices previously advertised effort that builds do not receive.",
        "suggested_fix": "Completed: inapplicable effort is omitted, with server and page regression coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Codex and Cursor models previously used slugs instead of available Settings display names.",
        "suggested_fix": "Completed: model display names come from the existing agent-models API, with tested fallback behaviour.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The layout adjustment addresses the narrow-panel clipping without changing behaviour. Both earlier fixes remain intact, and the affected tests pass after rerunning the panel-start timeouts. No blocking findings remain."
  }
}
```

</details>
