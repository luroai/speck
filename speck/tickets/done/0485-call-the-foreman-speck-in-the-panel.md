---
id: "0485"
title: "Call the Foreman speck in the panel"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0484"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:09:01.422Z"
approved: "2026-10-24T19:23:19.400Z"
finished: "2026-10-24T19:26:23.258Z"

---
# 0485 · Call the Foreman speck in the panel

**Status:** ✅ done

## Problem
The panel talks about "the Foreman" as if it were a second character, while the one thing watching the pipeline is speck, on its screen. Two names for one watcher make the panel harder to follow.

## Outcome
The panel calls the watcher speck everywhere, and the word "Foreman" never shows.

## Acceptance criteria
1. With a board that has every state that names the Foreman today (a blocked ticket it will take the recommendation for, a question it asks you, a recommendation it went with, a ticket it's looking into), no text, tooltip, accessible name or confirm dialog anywhere in the panel (header, Plan, Build, Shipped, an open ticket, the Pipeline log pop-up's own labels, Settings and Your agents) contains "Foreman", in any case. Excepted: lines from `speck run`'s log (0486), and the setting names `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort` (0487).
2. The wording is: `speck will answer` (a closed card), `Blocked · speck will take its recommendation`, `speck will take its recommendation: <option>`, `speck asks you: <question>`, `Your answer to speck`, `Dismiss speck's question?`, and `speck went with the recommendation: <option> · <time>`.
3. The screen's accessible name is `speck's screen`, and its tooltip starts `speck: ` before the status word where it said `The Foreman: `.
4. In Settings, the group with the `speck run` switch is titled `Watching`, and the role beside Builder and Reviewer is called `speck`, in its list, its rows and Your agents' roles. Everything works as before, and no test that passed before this change fails.

## Out of scope
- `speck run`'s messages and log lines, and the commands (0486).
- The setting names and their explanations (0487).
- Names inside the code, such as `#foreman`, `renderForeman` and the board's `by: 'foreman'`, which no one sees.

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: `templates/panel.html` (`aria-label="The Foreman"`), `templates/panel-header.js` (`The Foreman: ${word}`), `templates/panel-model.js` (the `SHORT` words), `templates/panel.js` (the blocked question, answer and dismiss texts, and the role's name), `templates/panel-settings.js` (the group's title and `ROLES`), and `rolesUsing` in `scripts/your-agents.mjs`, which names the role for Your agents.
- Failing before this build: none
- Waits for 0484, which changes the closed Build card's status line, where `Foreman will answer` shows.
- Self-check: "choose the speck's model again" read badly once the role is named speck, so that line now says "choose speck's model again".
- Pictures: Settings' Watching group in both looks. The Build cards' new wording needs a blocked ticket speck will answer, which the real board doesn't have now, so 0485's tests check it on the fake page.

## In plain words
The panel no longer talks about "the Foreman". Wherever it used to, it now says speck: a blocked ticket says speck will take its recommendation, speck's questions read "speck asks you", and a ticket it went ahead with says speck went with the recommendation. In Settings, the group that was called Foreman is now called Watching, and Your agents lists the role as speck.

To see it, open Settings and look for the Watching group, or hover over speck's screen at the top: its tooltip now starts with "speck:" and the status. A screen reader now calls that button "speck's screen" and reads the status from its tooltip.

The setting names themselves (such as foreman_fixing) still say foreman until a later ticket renames them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The screen's runtime accessible name and tooltip do not meet AC3.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 739,996
- Elapsed since build started: 14 min
- Changed lines: 32 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The 0484 copy test's 99:5x window is 10 seconds and failed twice under the related run's load: speck/ideas/2026-10-24-fix-the-0484-copy-test-that-fails-under-load.md.
- Tidy-up: test/watch-0486.test.mjs still lets the string 'Foreman' through in your-agents.mjs, which no longer has it.

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
    "reviewed_sha": "0986c19fb6a2a7941e7b3514a0926d076a766c63",
    "session": "fresh",
    "thread_id": "01a16f56-f1f9-7a30-9313-f8ba250c0c08",
    "builder_response": "- Tests run (speck test --related): test/agents-0398.test.mjs test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/foreman-answer-0318.test.mjs test/foreman-fix-0286.test.mjs test/panel-0040.test.mjs test/panel-0163.test.mjs test/panel-0368.test.mjs test/panel-0413.test.mjs test/panel-0419.test.mjs test/panel-0433.test.mjs test/panel-0443.test.mjs test/panel-0451.test.mjs test/panel-0473.test.mjs test/panel-0474.test.mjs test/panel-0484.test.mjs test/pipeline-0458.test.mjs test/settings-0396.test.mjs test/settings-0407.test.mjs test/settings-agents-0399.test.mjs test/speck-name-0485.test.mjs \n- One failure in that run, not from this change: \"0484 AC3: a closed card's line … copies as it did before 0484\" (test/panel-0484.test.mjs) gave \"speck will answer · Review 2 · 100:00 · bug\" against /99:5\\d/. Its ticket started 5990 s before the module loaded, so the 99:5x window is 10 s, and under the related run's load the real browser panel took longer than that to start. The same file passes on its own (speck test --files test/panel-0484.test.mjs: 115 pass, 0 fail). This change only edits the words in that regex. Noted as a follow-up rather than fixed, as it's outside the ticket.\n- Existing tests that asserted the old wording (\"The Foreman: \", \"Foreman will answer\", \"The Foreman asks you\", the Foreman group and role) now assert the new wording; none were weakened.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 127122,
      "cached_input_tokens": 76288,
      "cache_write_input_tokens": 0,
      "output_tokens": 781,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:15:53.415Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The 0485 AC1 fake-page test exercises the board states, tabs, full ticket, confirmation, Pipeline pop-up and Settings. The changed panel strings and rolesUsing use speck; remaining Foreman references are internal names, comments or excepted settings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-model.js and panel.js supply the requested card, question, answer and dismiss wording. The passing 0485 AC2 test checks those rendered strings and the confirmation."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "panel.html initially names the screen \"speck's screen\", but drawHeader in templates/panel-header.js:246 immediately replaces its accessible name with \"speck: <status>\". Its title remains \"The pipeline: speck run's log\", rather than starting \"speck: <status>\". The 0485 AC3 test asserts this incorrect runtime behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanGroup renders Watching, ROLES names the role speck, and rolesUsing supplies speck to Your agents. Updated settings and agent tests pass. The reported 0484 failure is consistent with its existing ten-second timing window; the file passed separately, and the change only updates its expected label."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js:246",
        "issue": "The screen's runtime accessible name and tooltip do not meet AC3. Rendering overwrites \"speck's screen\" with the status, while the tooltip does not include the requested speck status prefix. The new test checks initial markup for the name and incorrectly treats the runtime accessible name as a tooltip.",
        "suggested_fix": "Keep the runtime aria-label as \"speck's screen\" and put \"speck: <status>\" at the start of the title. Update the AC3 test and affected existing tests to check the actual runtime accessible name and title separately.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel's watcher wording and Settings role now say speck. One accessibility detail needs fixing: after rendering, the screen loses its required name, and its tooltip does not show the requested status wording."
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
    "reviewed_sha": "2e360882826a944cee6796430df07e5585fd239b",
    "session": "continued",
    "thread_id": "01a16f56-f1f9-7a30-9313-f8ba250c0c08",
    "builder_response": "- Tests run: test/speck-name-0485.test.mjs test/agents-0398.test.mjs test/foreman-0285.test.mjs test/foreman-0317.test.mjs test/foreman-answer-0318.test.mjs test/foreman-fix-0286.test.mjs test/panel-0040.test.mjs test/panel-0163.test.mjs test/panel-0368.test.mjs test/panel-0413.test.mjs test/panel-0419.test.mjs test/panel-0433.test.mjs test/panel-0443.test.mjs test/panel-0451.test.mjs test/panel-0473.test.mjs test/panel-0474.test.mjs test/panel-0484.test.mjs test/pipeline-0458.test.mjs test/settings-0396.test.mjs test/settings-0407.test.mjs test/settings-agents-0399.test.mjs  test/pipeline-0458.test.mjs\n- F1: fixed. drawHeader (templates/panel-header.js) keeps the screen's accessible name as \"speck's screen\" after every redraw and puts the word at the start of its tooltip: \"speck: <word> · The pipeline: speck run's log\" (or \"· The panel is running newer code…\" on a stale page). A screen reader reads the title as the button's description, so the word is still announced. The 0485 AC3 test now checks the runtime name and the title separately. Existing tests that read the word from the name (0163, 0285, 0040, 0317, 0413, 0433, 0451, 0473, 0474) now read it from the title. 0413 AC5's test (\"the accessible name includes the word\") is now \"the tooltip includes speck's word\", since 0485 AC3 replaces that criterion; the word is still checked for each status.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 242195,
      "cached_input_tokens": 183168,
      "cache_write_input_tokens": 0,
      "output_tokens": 1430,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:18:19.794Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0485 AC1 tests scan rendered text, tooltips, accessible attributes and confirmations across the board states, tabs, full ticket, Pipeline pop-up, Settings and Your agents. Panel wording uses speck, with internal names and excepted settings retained."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js and templates/panel.js supply the requested wording. The passing 0485 AC2 test exercises closed and open cards, recommendation history, question, answer label and dismiss confirmation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawHeader in templates/panel-header.js now preserves aria-label=\"speck's screen\" and sets the title to start \"speck: <status>\". The passing 0485 AC3 test checks both runtime attributes separately; updated stale-page tests check the reload status."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanGroup titles the group Watching; ROLES names the role speck; scripts/your-agents.mjs rolesUsing returns speck. Settings, agent and existing behaviour tests pass. The supplied round reports 308 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js:246",
        "issue": "The screen's runtime accessible name and tooltip previously did not meet AC3.",
        "suggested_fix": "Completed: preserve \"speck's screen\" as the accessible name, put \"speck: <status>\" in the tooltip, and test the two separately.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now calls the watcher speck and titles its Settings group Watching. The screen's accessible name and status tooltip are fixed. All four criteria pass, with no blocking concerns remaining."
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
    "reviewed_sha": "b8500823c83d917a21a62cf47dd9800dfb346dd0",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16f56-f1f9-7a30-9313-f8ba250c0c08",
    "builder_response": "- Tests run: test/panel-0257.test.mjs test/speck-name-0485.test.mjs\n- Ship failed on \"0257 AC2: the view shows each group in order …\" (test/panel-0257.test.mjs). main was already merged in (git merge main: already up to date), so this is the ticket's own change: 0486 left that test looking for the panel's old \"Foreman\" heading in place of the server's \"Watching\" group title, until 0485 changed the heading. 0485 now draws \"Watching\", so the test found no \"Foreman\" and failed.\n- Changed: the test now looks for each group by its own title, Watching included (line 108). It checks the same things as before: every group shows, in order. Nothing else.\n- Also checked: no other test looks for the old heading or role name (grep for 'Foreman' in test/ finds only the README check in release-0298 and 0486's own exception).\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 366419,
      "cached_input_tokens": 302720,
      "cache_write_input_tokens": 0,
      "output_tokens": 2049,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:23:15.816Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0485 AC1 tests exercise the board states, tabs, full ticket, confirmations, Pipeline pop-up, Settings and Your agents, scanning visible and accessible wording for Foreman outside the stated exceptions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js and templates/panel.js retain all requested card, recommendation, question, answer and dismiss wording. The 0485 AC2 test passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawHeader preserves the accessible name \"speck's screen\" and starts the tooltip with \"speck: <status>\". The 0485 AC3 runtime assertions pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanGroup renders Watching, ROLES names the role speck, and rolesUsing returns speck. The panel-0257 update preserves checks that every Settings group appears in order, replacing only the obsolete heading expectation. The supplied run reports 127 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js:246",
        "issue": "The screen's runtime accessible name and tooltip previously did not meet AC3.",
        "suggested_fix": "Completed: the accessible name remains \"speck's screen\", the tooltip starts with the status, and tests check both attributes separately.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel consistently calls the watcher speck. The remaining Settings test now expects Watching while preserving its original checks. All four criteria pass, with no blocking concerns."
  }
}
```

</details>
