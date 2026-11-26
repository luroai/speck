---
id: "0757"
title: "Open every project at speck serve's one address"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25
built_on: "0756"
started: "2026-11-26T10:17:23.093Z"

---
# 0757 · Open every project at speck serve's one address

**Status:** 🔍 reviewing

## Problem
Even with `speck serve`, each project's panel is on its own port, and only one sits behind the private tunnel, so from a phone you can reach one project and see the rest only on the bridge. The user wants to open one address on any device and see every project.

## Outcome
`speck serve` answers on one port and one `--url`, opening on All projects, with every project reachable from there.

## Acceptance criteria
1. `speck serve [--port <n>] [--url https://<hostname>]` answers on 127.0.0.1 at that port (4777 by default) and at that https address, with the same Host and Origin checks a panel has today.
2. Its address opens on All projects (the bridge), listing every project on the list, and choosing one shows that project's panel at the same address; the project menu goes back to All projects or to any other project.
3. Every action in a project's panel works through the address as it does on the project's own port: set ready, priority, answer, ship, the run switch, Settings and the live updates.
4. A project whose panel isn't answering stays on the bridge as Not answering, and the rest keep working.
5. The brief describes `speck serve`'s `--port` and `--url` and that it opens on All projects. No test that passed before this change fails.

## Out of scope
- Acting on a project's tickets from the bridge itself (step 2, the factory floor).
- Logins: the address stays behind a private tunnel that makes you log in, as the panel's does today.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- The panel already shows other projects at one address through its project switcher, a cookie and a proxy to each panel's own port (`route`, `pass`, `choose` in `scripts/panel-projects.mjs`); this can reuse it.
- Each project's panel keeps its own token; the proxy passes requests on as the switcher does now.
- Failing before this build: not checked
- Self-check: at speck serve's address, a stopped project's page and its requests now say speck serve starts its panel again, rather than to start it with `speck panel`, which would want port 4777; All projects asks only the ports of panels running now, never one speck serve remembered for a project, so nothing else on that port is reached; the brief no longer says the menu always offers All projects, as a project on an older speck offers it only with two panels running. A test for each.
- speck (2026-11-26 10:59 UTC) told you: Nothing is stuck: 0757 is a big change (speck serve's address, the project menu and bridge, real-panel tests and pictures from a headless browser), its 5,354-test related run passed with no failures in about 4 minutes, review round 1 came back in under a minute and the build is now fixing its findings. Why: The build log shows steady progress with no gap longer than a few minutes, every test run after the expected failing-before check passed, and the machine's load is falling (11.7 over 15 minutes down to 1.6 now), so heavier load earlier only added a little.

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
    "reviewed_sha": "33747132665e2f4959225ba5da4574e0be60b31d",
    "session": "fresh",
    "thread_id": "01a2177f-986f-7842-9b83-105beb5df781",
    "builder_response": "- Tests run: `speck test --related test/panel-0757.test.mjs test/serve-0757.test.mjs test/serve-front-0757.test.mjs test/serve-front-panel-0757.test.mjs test/serve-0756.test.mjs`, which also ran the 569 existing test files that name a file this branch changed (5354 tests, 0 failures, 3 of 0078's long-standing skips). The attached output is that run.\n\nRound 1. What this build does, for the reviewer:\n\n- Built on 0756's approved branch (`speck start` merged it in: `built_on` 0756), which adds `speck serve`. Nothing of 0756's behaviour changes except that `speck serve` now also answers at one address.\n- `scripts/serve-front.mjs` (new) is the address. `startFront()` listens on 127.0.0.1 at `--port` (4777 by default, parsed by the panel's own `panelPort`, now exported) and serves only the Host headers a panel serves (`127.0.0.1:<port>`, `localhost:<port>`, and `--url`'s host via the panel's own `panelUrl`), answering any other Host 403 as a panel does. A choice (`POST /api/projects/<port>`) and the projects (`POST /api/projects/summary`) are taken only from a page at the address, by its Origin, as a panel's project menu does (0516).\n- With no project chosen, `/` is the panel's own `panel.html`, from speck serve's own copy, with `{{serve}}` filled as `1`, no key (`data-token=\"\"`), and the page's files served by the shared `panelFile` (below). The page, seeing `<meta name=\"speck-serve\" content=\"1\">`, opens straight on the bridge (All projects), with no Back and no stream or board of its own; Escape doesn't close it. The marker is a meta tag rather than an attribute on the panel.js script tag because tests 0432, 0433, 0473 and 0415/0470/0479 pin that tag exactly.\n- Choosing a project sets `speck-serve-<port>=<panel port>; Path=/; HttpOnly; SameSite=Strict` with no Max-Age, so it lasts the browser session and the address opens on All projects again in a new one (\"Its address opens on All projects\"). From then on every request is passed on to that panel by `passOn`, the 0516 switcher's pass, unchanged: Host and (for a page at the address) Origin rewritten to the panel's own, the page's own key passed as it is, `x-speck-via` so the panel answers it itself. Only a port with a running panel's record (`runningPanels` of your panels' folder) can be chosen, and the front's own port goes back to All projects.\n- `scripts/panel-projects.mjs`: the switcher's `summaryOf`, `pass` and `gone` closures became the exports `summaryOf`, `passOn` and `goneAnswer`, used by both. A panel's behaviour is unchanged (its tests pass); `goneAnswer` takes `{ serve: true }` at speck serve's address, where its message says speck serve starts the panel again rather than to start it with `speck panel`.\n- `scripts/panel-files.mjs` (new): the page's styles, scripts, fonts and icons, moved out of `scripts/panel.mjs` as they were (same headers, same error text), so both servers serve them. panel.mjs drops to 572 lines.\n- The summary lists every project on `speck projects`' list (serve.mjs's `shownProjects`: each listed folder with its running panel's port from `panelPorts`, or null), by name, asking each running panel's `/api/projects/own` at once with the 2-second limit. A project with no running panel, or one that doesn't answer, is `running: false` (Not answering on the bridge), and only a running panel's port is ever asked. No folder path is sent. Usage warnings (0720) use the newest reading of each agent across the listed projects (`newestUsage` in agent-usage.mjs), as their builds share the subscriptions.\n- A project's page at the address learns where it is from `X-Speck-Serve: 1` on every answer there, so its menu always offers All projects, plus this project when its panel is the only one running (a page from an older speck shows the menu only with two panels running, as before). All projects from the menu is the bridge over the project, with Back, its rows coming from the address's summary. A bridge row for a project with no panel (port null) says why it can't be shown rather than asking.\n- `scripts/serve.mjs`: `--port`/`--url` are checked before anything starts; `--stop` refuses them. speck serve takes its record, then listens; when it can't (port in use), it puts back the record it found (so a killed one's panels are still looked after) and starts nothing, with a plain message. Its record keeps `port` and `url`, so a second one says where the first answers; `--background` passes them to the process it starts. Shutdown closes the address first.\n- Tests (all new files): `serve-front-0757` (the address in-process, with stand-in panels that keep what reaches them), `panel-0757` (the page, on the fake page), `serve-0757` (speck serve itself, with 0756's stand-in projects), `serve-front-panel-0757` (one real panel behind the address: its key, set ready, priority, an answer, ship, the run switch, a Settings save and the live updates, from 127.0.0.1 and from the https address). Support changes: `test/support/serve.mjs` gives each test's speck serve a free port (`freePortNow`, `withPort`), as speck serve now listens on 4777 by default and this machine's own panel holds it; one 0756 test line that starts `speck serve --background` by its own shell now passes `--port` too, nothing else in it changed. The 0756 stand-in panel answers `/api/projects/own` and `/`. `fakePage` takes `ids`, to fill in elements the server fills before the scripts run.\n- Pictures: six, of All projects as the address opens, a project's panel there with its menu, and All projects opened from that menu, each in the light and dark looks, taken from a real `speck serve` with throwaway projects (`speck pack 0757` lists them).\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 307561,
      "cached_input_tokens": 223744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1264,
      "reasoning_output_tokens": 245
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 83817,
      "cached": 223744,
      "write": 0,
      "output": 1264
    },
    "cost_usd": 0.2026484,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:56:44.215Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "serve-front.mjs startFront uses the panel's port and URL parsers and checks Host and Origin. Passing serve-front-0757 and serve-0757 tests cover local and tunnel addresses, rejected headers, background operation and occupied ports."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The new page passes panel-0757 navigation tests, but startFront proxies each project's own page and scripts. Older supported copies hide the project menu with only one panel running, so their pages cannot return to All projects. The tests exercise only the new page code."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "passOn preserves requests and tokens while rewriting the permitted Origin and Host. Passing serve-front-panel-0757 tests exercise real panel writes, Settings and streams; stand-in tests cover request bodies, delayed replies and successive live events."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startFront summaries retains unavailable projects with running:false. Passing serve-front-0757 and panel-0757 tests cover timeouts, missing panels, Not answering rendering and continued access to another project."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's serve command row documents --port, --url and opening on All projects; serve-0757 tests check those facts. The supplied output, verified in /tmp/speck-0757-tests.txt, records 5354 tests with zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-front.mjs",
        "issue": "Returning to All projects depends on the project's copy containing this ticket's new panel-header.js. Serve explicitly supports older project copies and proxies their assets unchanged. With one older panel running—for example, while the other listed projects are unavailable—its existing drawProjects hides the menu entirely. Once chosen, that project leaves the user without the required route back to All projects, including after reloading because the selection cookie remains.",
        "suggested_fix": "Provide navigation at the shared address that also works with supported older project pages. Add a compatibility test using the previous page code with one running panel and another unavailable listed project, verifying that the user can return to All projects.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shared address, panel actions and unavailable-project handling are well covered, and the reported tests pass. One navigation gap needs fixing: opening a project on an older supported speck version can leave users unable to return to All projects."
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
    "reviewed_sha": "0cbe8e4b642820032b9b3ec7a34f54632aa79845",
    "session": "continued",
    "thread_id": "01a2177f-986f-7842-9b83-105beb5df781",
    "builder_response": "- Tests run: `speck test --files test/panel-0757.test.mjs test/serve-0757.test.mjs test/serve-front-0757.test.mjs test/serve-front-panel-0757.test.mjs test/serve-0756.test.mjs test/panel-0516.test.mjs` (209 passed, 0 failed, 3 of 0078's long-standing skips): this ticket's files, the 0756 file it changed, and 0516's, as the switcher's shared `passOn` changed.\n- F1: fixed. The way back to All projects no longer depends on the project's page code. The address's root `/`, and its own page files, are now always All projects, whatever has been chosen; a chosen project's panel is shown under `/project/` on the same address (`SHOWN` in `scripts/serve-front.mjs`). Its page there loads its files from beside it, as every supported speck's page does since 0543, and they're passed to its own panel with the `/project` taken off (`passOn` takes the `path` to ask for); its `/api/` requests still go by the cookie. `/project` redirects to `/project/`, and `/project/` with no running panel chosen redirects to `/` (forgetting a stale choice). All projects at `/` now goes to `project/` with `location.assign` after a choice (`chooseProject` in `templates/panel-header.js`), so it's a new page in the browser's history: Back from any project's page, of any version, comes back to All projects, and opening the address again does too, as the home-screen app does from its start, `./` of the root page's manifest. A page from an older speck still switches between projects with its own menu (it reloads `/project/`). The cookie lasts a year again, as the switcher's does, since the address no longer needs it to end to open on All projects. Compatibility test added (`test/serve-front-panel-0757.test.mjs`, \"a project on an older speck, its panel the only one running…\"): a project set up by speck 1.6.1's own init, from its tag, its real panel the only one running, beside a listed project that isn't answering. It checks that All projects lists both. It checks that the project's 1.6.1 page and files are served under `/project/`, and that its board has no project menu and its `panel-header.js` shows the menu only with two panels running. And it checks that the address itself is All projects with the choice still set. Tests changed to match: `serve-front-0757` (the page under `/project/`, its files from its panel, `/` and `/panel.js` staying the address's own while a project is chosen, the redirects), `panel-0757` (the choice goes to `project/`), `serve-0757` (bravo's page at `/project/`, `/` All projects with the cookie; the brief's row names `/project/`). The brief says where a chosen project shows and that Back, or opening the address again, goes back to All projects.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 634840,
      "cached_input_tokens": 521856,
      "cache_write_input_tokens": 0,
      "output_tokens": 2418,
      "reasoning_output_tokens": 559
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29167,
      "cached": 298112,
      "write": 0,
      "output": 1154
    },
    "cost_usd": 0.0996852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T11:02:28.925Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startFront retains the panel's port/URL parsing and Host/Origin checks. Passing serve-front-0757 and serve-0757 tests cover local and tunnel addresses, rejected headers and background operation."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The root now always serves All projects, and choosing a project navigates to /project/. However, the new older-speck compatibility test explicitly verifies that the project's page has no project menu when only its panel is running. Browser Back provides a workaround, but the required menu route back to All projects is still absent."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "passOn strips /project from page and asset requests while preserving API requests, tokens and permitted Origin rewriting. Passing real-panel tests cover writes, Settings and live updates; proxy tests cover bodies, delayed replies and streamed events."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing summary and page tests retain unavailable projects as Not answering, exclude them from figures and verify that another project's requests continue working."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief documents --port, --url, All projects and /project/; the documentation fact test passes. The round's output records 209 passing tests, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve-front.mjs",
        "issue": "The fix makes All projects reachable through browser history or reopening the root address, but older supported project pages still have no project menu when only one panel is running. The new compatibility test confirms this absence rather than verifying a visible return control. This leaves the explicit acceptance requirement unmet and matters especially when using the phone's home-screen app without visible browser navigation.",
        "suggested_fix": "Provide a visible All projects navigation control at the shared address independently of the project's version, including with only one panel running. Extend the compatibility test to exercise that control rather than relying on a separate request to the root.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The address now reliably opens on All projects, and panel actions still pass their tests. Older project pages still lack the required navigation back: browser Back helps, but a visible return control is needed."
  }
}
```

</details>
