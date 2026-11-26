---
id: "0762"
title: "Leave a project out of speck serve without removing it"                # one outcome, no "and"
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
after: ["0757","0758"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0758"
started: "2026-11-26T11:49:18.267Z"

---
# 0762 · Leave a project out of speck serve without removing it

**Status:** 🔍 reviewing

## Problem
Under `speck serve`, the only way to keep a project out is `speck projects remove`, which forgets it, so bringing it back means adding it again. The user wants to keep some projects, such as a paused side project, off the factory floor and out of the service without losing them from the list.

## Outcome
A project can be turned off in the list: `speck serve` neither runs nor shows it until it's turned on again.

## Acceptance criteria
1. `speck projects off <name or folder>` keeps the project on the list but marks it off, and `speck projects on <name or folder>` turns it back on; `speck projects` shows which are off. Neither changes anything in the project.
2. While a project is off, `speck serve` doesn't start or restart its panel or its `speck run`, and within 10 seconds of it being turned off, stops the panel `speck serve` started for it. A panel or `speck run` started by hand is left running.
3. At `speck serve`'s address, All projects and the project menu leave out a project that is off, or not on the list at all, even when its panel is running, and nothing it has counts in the totals.
4. Within 10 seconds of a project being turned on again, `speck serve` starts its panel, its `speck run` if that was on, and shows it.
5. The brief's command table describes `speck projects off` and `speck projects on`. No test that passed before this change fails.

## Out of scope
- Hiding a project from a panel started by hand outside `speck serve`.

## Notes
- Asked for by the user on 2026-11-26, before building 1.7.0: "the ability to not show or to not include a project in speck serve".
- Builds on the list (0755), `speck serve` (0756), its one address and All projects (0757) and its runs (0758), so it waits for 0757 and 0758.
- A project never joins the list by itself: only `speck projects add` puts it there (0755).
- Failing before this build: not checked
- Self-check: the address reads which panels it shows afresh for each answer rather than once a second, so a panel just started can be chosen at once.
- Pictures: none, because the only visible change is that the project menu at speck serve's address lists fewer projects; the fake page tests show the menu's options.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "e9266068b03e23f289f01a96e6a0f3849cf57e2c",
    "session": "fresh",
    "thread_id": "01a217bc-1f8b-7063-84ed-47f831376c13",
    "builder_response": "- Tests run: `speck test --related test/projects-0762.test.mjs test/serve-front-0762.test.mjs test/serve-0762.test.mjs` (the ticket's own three test files, plus every existing test file that names a changed file: 5360 pass, 0 fail).\n- Design: `projects.json` entries gain `off: true`; `listedProjects` is unchanged in what it returns, `projectEntries`/`onProjects` are new. `speck serve`'s pass treats an off project like an unlisted one (stops only the panel it started, skips it for panels and for the run keeper, so turning it back on looks at it afresh like a newly listed project). The address gets an optional `shown()` (ports of on projects' panels): choices, passing on and the gone list use only those, and each answer names them in `X-Speck-Serve-Shown`, which the page's project menu filters by at speck serve's address. Without `shown` the address behaves as before, which keeps 0757's existing tests unchanged.\n- Known limit, said in the brief: a project on an older speck shows its own page, which doesn't read the header, so its menu still lists every running panel.\n- Pictures: none (see Notes).\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 227375,
      "cached_input_tokens": 161792,
      "cache_write_input_tokens": 0,
      "output_tokens": 965,
      "reasoning_output_tokens": 75
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 65583,
      "cached": 161792,
      "write": 0,
      "output": 965
    },
    "cost_usd": 0.1569952,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T12:02:44.692Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/projects.mjs turnProject preserves list membership and updates only the home settings file. The three AC1 tests passed, including project snapshots and ambiguous-name refusal."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "serve.mjs pass excludes off projects from panel starts and keeper.check, stopping only owned panels. The real-service AC2/AC3/AC4 test passed and checks the deadline and hand-started processes."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "serve-front.mjs filters choices and summaries, and current-page tests passed. However, filtering the project menu relies on the new templates/panel-header.js reading X-Speck-Serve-Shown. Older project pages still list excluded panels, as the changed brief explicitly acknowledges."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The integration test passes for a project recording its Auto-build switch. For older projects, serve-runs.mjs runKeeper.check deletes last[folder] when off; when restored, its first-check branch cannot recover that remembered run state."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's projects command row describes both commands; the AC5 test checks these command facts and passed. Reported related tests: 5360 passed, zero failed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-front.mjs",
        "issue": "At the service address, an older project's page still shows off and unlisted projects in its project menu. Criterion 3 has no older-version exception; documenting the limitation does not satisfy it.",
        "suggested_fix": "Filter the project information supplied through the service so supported older project pages also omit excluded projects, and add a compatibility test using a page that does not understand the new header.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "Turning an older project off discards its remembered run state. If its previously running process ends unexpectedly while off, turning the project on again does not restart it: check deletes last[folder] during exclusion, and the first-check legacy branch then has no was record. The new integration test covers only the recorded-switch case.",
        "suggested_fix": "Preserve the remembered run intent across off/on for older projects while continuing to respect deliberate run stops. Add a test that observes a legacy run, turns the project off, ends the run unexpectedly, then turns it on and verifies restart within 10 seconds.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The commands and current-version service behaviour are well covered, with no reported test failures. Two compatibility gaps remain for projects using older speck: excluded projects remain visible in their menus, and a previously running process may not return when the project is turned back on."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "12f9f1fa3a2e03ba3008d5230436cd2434ef84f0",
    "session": "continued",
    "thread_id": "01a217bc-1f8b-7063-84ed-47f831376c13",
    "builder_response": "- Tests run: test/projects-0762.test.mjs test/serve-front-0762.test.mjs test/serve-0762.test.mjs test/serve-runs-0762.test.mjs, plus every existing test file naming panel-projects.mjs, serve-runs.mjs or serve-front.mjs, which this round changed: test/bridge-usage-0720.test.mjs test/build-panels-0619.test.mjs test/panel-0516.test.mjs test/panel-summary-0595.test.mjs test/serve-front-0757.test.mjs test/serve-0758.test.mjs test/serve-install-0759.test.mjs test/serve-front-panel-0757.test.mjs test/serve-0757.test.mjs (267 pass, 0 fail).\n- F1: fixed. The menu is now cut down on the server, so it holds whatever speck the project's page is from. `serve-front.mjs` `stateShown`/`cutState`: every `/api/state` answer passed on to a chosen panel has `projects.list` (the menu's list since 0516) cut down to the panels the address shows, plus the address's own record (which an older page lists as \"speck serve\", so its menu still goes back to All projects) and the page's own panel. An answer that gives only what changed (0188) and leaves the list out as unchanged gets the list that panel last sent through the address put in, cut down as it is now, so turning a project on or off reaches the page with the next board even when the panel's own list hasn't changed. Until the address has seen a list from that panel, `X-Speck-Have` is dropped from the request so the panel sends the whole board. `passOn` (panel-projects.mjs) takes an optional `rewrite` for this; without it nothing changes. The page-side header and `panel-header.js` change are removed, and the brief's older-speck caveat with them. Tests: serve-front-0762 \"the project menu's list in each board passed on…\" checks the whole board, a delta with the list, a delta without it (bravo turned on), a board with no list, and that the whole board is asked for first; and that without `shown` boards pass as they came.\n- F2: fixed. `runKeeper.check(folders, off)` (serve-runs.mjs) now takes the projects that are off, and keeps their remembered run (`last`) while they're off instead of forgetting it; they're still dropped from `looked`, so turning one on looks at it afresh. On an older speck, a run that ended by itself while off is started once the project is on (\"as it was on when the project was turned off\"); one that said `speck run stopped.` while off stays off; a project taken off the list is still forgotten. `serve.mjs` passes the off projects. Tests: test/serve-runs-0762.test.mjs, all three cases.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 769287,
      "cached_input_tokens": 674304,
      "cache_write_input_tokens": 0,
      "output_tokens": 2020,
      "reasoning_output_tokens": 146
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29400,
      "cached": 512512,
      "write": 0,
      "output": 1055
    },
    "cost_usd": 0.1206012,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T12:06:17.881Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "projects.mjs turnProject preserves list membership and changes only home settings. The AC1 tests passed, including snapshots verifying neither project changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "serve.mjs pass excludes off projects from panel starts and run supervision and stops only owned panels. The real-service test passed, covering the 10-second deadline and hand-started processes."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "serve-front.mjs cutState now filters menu data for older pages, and response-filtering tests passed. However, changing the off list does not trigger a board request in an already open project page when its upstream board remains unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The real-service test checks restoration within 10 seconds. runKeeper.check now preserves last records for off projects; the three new legacy-run tests passed, covering unexpected exits, deliberate stops and removal."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's command table describes off and on, checked by the passing AC5 command-fact test. This round reports 267 passing tests and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-front.mjs",
        "issue": "The menu fix remains incomplete for an already open project page. If another project's hand-started panel stays running when that project is turned off, the upstream panel's project list and board can remain unchanged. The service only filters subsequent /api/state responses; it does not notify the page that its visibility list changed. boardFeed announces changed boards only, and panel.js handles ordinary pings by rendering existing state without fetching it. The excluded project therefore remains in the menu until some unrelated board change or a reload. The new tests manually request every board, so they miss this case.",
        "suggested_fix": "Ensure service visibility changes cause open project pages, including older pages, to fetch a filtered board even when their upstream board is unchanged. Add a test with an open event stream and an unchanged upstream board, then turn off a project whose hand-started panel remains running and verify its menu entry disappears without a reload or unrelated change.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-runs.mjs",
        "issue": "The previously reported loss of legacy run intent across off/on is fixed: excluded projects retain their remembered run records, while deliberate stops are still respected.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The run-restoration problem is fixed, and menu data is now filtered for older versions too. One gap remains: an already open project menu can keep showing a project after it is turned off, until the page reloads or something else changes."
  }
}
```

</details>
