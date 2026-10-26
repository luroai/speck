---
id: "0516"
title: "Switch to another project's panel from the header"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T15:16:51.305Z"
approved: "2026-10-26T15:52:04.608Z"
finished: "2026-10-26T15:55:51.893Z"

---
# 0516 · Switch to another project's panel from the header

**Status:** ✅ done

## Problem
Each speck project has its own panel on its own web address, and the panel's home-screen app belongs to one address. Someone with several projects on speck (speck, speck-site, carbon) has to keep a separate address, or a separate app, for each, and has no way to get from one project's panel to another's.

## Outcome
From one panel, at the address it was opened at, including its home-screen app, you can switch between every speck project whose panel is running on the same machine, each still run entirely by its own panel.

## Acceptance criteria
1. While two or more speck panels are running on the same machine, each one's header has a project menu listing every running panel's project by its folder name, with the one being shown marked. With no other panel running, the header shows no menu.
2. Choosing another project shows that project's panel at the same address the page was opened at, without leaving it, including through a `--url` address, where the other project's panel needs no `--url` of its own. Everything on it works as when that panel is opened directly: its board, its live updates, its review packs and its buttons and settings, which change only that project. Its header's menu switches to any other project, including back.
3. A panel that starts joins every other panel's menu within 10 seconds, and one that stops, whether by `speck panel --stop`, Ctrl+C or being killed, leaves it within 10 seconds, without reloading the page. While the project being shown has no running panel, the page says so and its menu still switches to the others.
4. Only the running speck panels in the menu can be reached through another panel: a request through a panel for any other project, port or address is refused. A request reaching a panel through another needs that panel's own key, as a direct request does, and is refused without it.
5. No test that passed before this change fails.

## Out of scope
- One panel showing every project's tickets together, and a build limit across projects: these stay in the source idea, which isn't ticketed by this.
- Starting or stopping another project's panel or `speck run` from the menu.
- Projects whose `.speck/` copy is older than this change: they join the menu once that project updates speck.
- Keeping light, dark or system appearance separate for each project: the browser keeps it for the address, so one choice applies to every project shown there (the user's choice, 2026-10-26).

## Notes
- First step of `speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md` (its 2026-10-13 note), changed with the user, 2026-10-26: switching stays at the one address, so the phone's home-screen app (0149, `scope: "/"` in `templates/icons/manifest.webmanifest`) never opens a browser sheet, which a link to another panel's own address does. The rest of the idea stays an idea.
- No crossover between projects: each project's own panel reads its tickets, runs its commands and writes its `speck/config.yml`, through its own `.speck/` copy. The panel at the address only passes requests on to it and its answers back.
- risk: high because it changes who can reach a panel: each panel today answers only its own Host and Origin (`hosts` and `origins` in `scripts/panel.mjs`) and needs the token its page carries.
- The list of running panels lives in the user's home folder (for example `~/.config/speck/panels/`), as `~/.config/speck/private-words` does, never in a repo: it holds folder paths.
- Failing before this build: none
- Self-check: a panel with no home folder to keep its record in now still starts (alone in the menu) rather than failing; added a test for it.
- Header: `templates/panel.html`, `templates/panel-header.js` and `templates/panel-header.css`. Server: `scripts/panel.mjs` (at the 600-line limit for `scripts/`) and `scripts/panel-background.mjs`.

## In plain words
When more than one speck project has its panel running on the same computer, the top of each panel now has a small arrow next to the project's name. Tap it to list every running project and pick one. That project's panel then shows at the address you're already on, including the phone's home-screen app and a `--url` address, and everything on it works as if you'd opened it directly. The list updates by itself within a few seconds as panels start and stop. If the project you're looking at stops, a notice under the header says so, and the arrow still takes you to the others.

To see it, start `speck panel` in two projects (on different ports), open either one and use the arrow beside the project's name.

Worth keeping an eye on: the choice belongs to the address, not the tab. When you switch in one tab, other tabs at the same address reload to the newly chosen project the next time they fetch anything. Projects on an older copy of speck don't appear in the list until they update.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The project-selection cookie is shared by every tab at the address, but choosing a project reloads only the tab making the choice.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 463,568
- Elapsed since build started: 35 min
- Changed lines: 238 (limit 5000)
Follow-ups:
- Inbox: speck/ideas/2026-10-26-steady-two-browser-tests-under-a-busy-run.md (0372 AC2 and 0476 AC2 fail under a near-whole-suite run, and pass alone).
- Known limit: a tab left idle at the address keeps showing its project until its next request, then reloads to the one chosen in another tab. Telling the other tabs straight away (for example over a BroadcastChannel) would make that instant.
- Known limit: a panel stopped by Ctrl+C or killed leaves its record in ~/.config/speck/panels/ until the next panel lists them and finds its process gone.
- Tidy-up: panel.mjs is at its 600-line limit, so 0516 trimmed three comments there to fit. The next change to it will need a split.

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
    "reviewed_sha": "48a00f0f188f80fe2d57e81604ffae83431f2746",
    "session": "fresh",
    "thread_id": "01a178dc-2841-7811-a613-1c7fea32cf1a",
    "builder_response": "- Tests run: `speck test --related test/panel-0516.test.mjs` (test/support/tmp.mjs changed, so it brought in nearly every test file: 4132 tests, all passing).\n- Design: each panel writes a record of itself (pid, port, folder name, path) to ~/.config/speck/panels/<port>.json (SPECK_PANELS_DIR in tests) once serving, and deletes it on exit unless a newer process on the port wrote it (restart on new code). Dead pids are dropped from the list. The menu choice is a cookie named for the address's own port (`speck-shown-<port>`), set by POST /api/projects/<port>, which only accepts this address's Origins and only running panels. With the cookie, the panel at the address passes every request on to 127.0.0.1:<chosen port>, rewriting only Host and (when it's one of its own) Origin, adding X-Speck-Via so it is never passed on again; the chosen panel checks its own key as for a direct request. The list reaches the page in /api/state (`projects`, only while 2+ run), refreshed by a 2 s watch of the records. When the chosen panel has stopped, /api/events answers with a `gone` event plus the running list (retrying every 3 s), other requests get 502, and a reload of / shows the address's own project and clears the cookie.\n- The menu is a native select under a 44 px caret after the project's name, so the existing `.repo` markup (pinned by earlier tests) is unchanged.\n- Pictures of the header (light/dark) and the stopped notice (light/dark) are in the review pack.\n",
    "seconds": 76,
    "usage": {
      "input_tokens": 170995,
      "cached_input_tokens": 121856,
      "cache_write_input_tokens": 0,
      "output_tokens": 1574,
      "reasoning_output_tokens": 591
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T15:38:52.812Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelProjects.part() supplies the running projects; drawProjects() renders and marks them. The AC1 fake-page and real-panel tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Single-page switching is covered by passing AC2 tests, including --url and project-specific writes. However, choose() stores the selection in a shared cookie while existing pages retain their previous project's header, token and event stream. Switching in one tab breaks other tabs at that address."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelProjects watches records every two seconds and supplies stopped-project events with three-second retries. Passing AC3 tests cover menu updates, stopped notices, SIGKILL and Ctrl+C; existing background-panel tests cover --stop."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "route() restricts forwarding to registered running ports; pass() preserves the target's token checks. Passing AC4 tests cover unlisted ports, absent or incorrect keys, foreign Origins and Hosts, and forwarding loops."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test result reports 4,129 passes, three skips and no failures. The changed tests exercise behaviour without weakening existing assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel-projects.mjs",
        "issue": "The project-selection cookie is shared by every tab at the address, but choosing a project reloads only the tab making the choice. Another open tab retains its original header, token and live event stream while its subsequent board, review-pack and settings requests are routed to the newly selected project. It can therefore display another project's information under the old project's name, and its write buttons fail with the old token. The single-page tests do not exercise this.",
        "suggested_fix": "Keep each page's project selection consistent across its requests and event stream, or coordinate selection changes so every affected page reloads before fetching or displaying another project's information. Add a regression test with two pages at the same address, switching one and checking the other's board, settings, stream and writes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Switching works in one page, including through an external address, and the access-control tests pass. However, switching in one tab silently redirects other open tabs' requests while they still show the previous project's identity. This needs fixing before merge."
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
    "reviewed_sha": "7fc90e793c4527385f890a7755deb41f49055f3b",
    "session": "continued",
    "thread_id": "01a178dc-2841-7811-a613-1c7fea32cf1a",
    "builder_response": "- Tests run: test/panel-0516.test.mjs test/panel-0372.test.mjs test/panel-0476.test.mjs test/panel-0187.test.mjs test/panel-0433.test.mjs test/panel.test.mjs (all pass). I also ran `speck test --related test/panel-0516.test.mjs` (4135 tests): 0372 AC2 and 0476 AC2, two real-browser timing tests, failed under that load and pass on their own, three runs each for 0372; 0476 AC2 also failed in the round-1 related run and passes on the base code alone.\n- F1: fixed. Every answer from a panel now carries `X-Speck-Panel: <id>`, set in `route()` in scripts/panel-projects.mjs. Proxied answers carry the chosen panel's id, and the address's own answers to the menu (`choose`) and the stopped answers (`gone`) carry none. The id is a hash of the project's real path and its port, so it stays the same when that panel restarts (0187: a restarted panel's page rides it out), and differs between projects. It isn't the key. Each page carries its panel's id in `<meta name=\"speck-panel\" id=\"speck-panel\">` (the panel.js script tag is pinned by 0433). templates/panel-header.js wraps the page's `fetch`: an answer from a different panel reloads the page and is never handed to the page's code. So a second tab whose cookie now points at another project reloads on its next board, pack, settings or write answer instead of showing it. Its stream messages lead to that board fetch, and a write sent with its old key is refused 403 by the other panel and then triggers the reload. The `gone` event now names the stopped panel's port. A page whose own project (`projects.self`) isn't that port reloads rather than saying its own panel has stopped.\n- Tests added: \"0516 AC2 F1: every answer names the panel that gave it…\" (two pages at one address: board, settings, pack, script, stream and a refused write all name the panel that answered, matching each page's own id), \"0516 AC2 F1: a page answered by another panel than its own reloads rather than show the answer\" and \"0516 AC3 F1: a stopped notice for a project another tab chose reloads the page\".\n",
    "seconds": 47,
    "usage": {
      "input_tokens": 288703,
      "cached_input_tokens": 227840,
      "cache_write_input_tokens": 0,
      "output_tokens": 2296,
      "reasoning_output_tokens": 622
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T15:51:43.573Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelProjects.part() and drawProjects() supply and render the running projects, mark the current project and hide the menu when alone. Passing AC1 tests cover real-panel discovery and header rendering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover switching at the original address, --url, boards, streams, review packs, settings and project-specific writes. The new response identity checks reload another open tab before it consumes a different project's answer; regression tests cover identity headers, rejected stale writes and the reload behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The two-second registry watcher and three-second stopped-stream retries support updates within ten seconds. Passing AC3 tests cover menu changes, SIGKILL, Ctrl+C, stopped notices and recovery; existing background-panel tests cover --stop."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "route() permits forwarding only to registered running ports, while the destination retains its own token and Origin checks. Passing AC4 tests cover unlisted ports, missing and incorrect keys, foreign Origins and Hosts, and forwarding loops."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest relevant run reports 218 passes, three skips and no failures, including both browser tests reported as failing under broader concurrent load. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel-projects.mjs",
        "issue": "Shared selection cookies previously allowed another tab to consume a different project's answers under its original project identity.",
        "suggested_fix": "Implemented: responses identify their panel, and the page reloads before consuming a mismatched response. Regression tests cover server headers, stale-token refusal and client reload behaviour.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Project switching works at the original address, including through an external address, with each project's own access checks. The cross-tab issue is fixed: an affected tab reloads before showing another project's information. The relevant tests pass."
  }
}
```

</details>
