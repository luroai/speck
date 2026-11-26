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
