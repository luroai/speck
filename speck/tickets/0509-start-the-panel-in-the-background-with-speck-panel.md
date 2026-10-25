---
id: "0509"
title: "Start the panel in the background with speck panel --background"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-start-and-open-the-panel-when-setup-finishes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:08:49.534Z"
approved: "2026-10-25T22:17:03.896Z"

---
# 0509 · Start the panel in the background with speck panel --background

**Status:** 👍 approved

## Problem
`speck panel` runs in the foreground until Ctrl+C. An agent that starts it at the end of setup has to hold a terminal open or run it in the background by its own means, which some agents end along with their session, and nothing says how to stop a panel started that way.

## Outcome
`speck panel --background` starts the panel so it keeps running on its own, and `speck panel --stop` stops it.

## Acceptance criteria
1. `speck panel --background`, with any of `--port` and `--url`, starts the panel as `speck panel` would, detached from the terminal and from the command that started it, prints the address or addresses it serves, and exits 0 once the panel answers there. The panel keeps running after the shell that ran the command has ended, checked with a real panel.
2. When this repo's panel is already answering on that port, `--background` starts nothing, prints the same address and exits 0. When something else holds the port, it refuses as `speck panel` does today.
3. `speck panel --stop` stops this repo's panel started with `--background`, saying so, or says that none is running. A panel in the foreground still stops with Ctrl+C as today.
4. A panel started with `--background` writes what it would print to `speck/.cache/panel.log`. `speck help` and the brief's `speck panel` row name `--background` and `--stop`. No test that passed before this change fails.

## Out of scope
- Setup starting and opening it (0510).
- Starting the panel when the machine starts.

## Notes
- From the idea, ticketed with the user on 2026-10-25.
- Today: `speck panel` in `scripts/panel.mjs`, which already hands over to a new server process when its code changes (`startPanelServer`) and refuses a port in use; the usage line in `scripts/speck.mjs`. `speck run`'s switch in the panel starts `speck run` in the background, writing to `speck/.cache/runs/run.log` (0128), which this can follow.
- Failing before this build: none
- Self-check: no changes. Kept scripts/panel.mjs and scripts/speck.mjs at the 600-line limit by condensing two comments.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
You can now start the control panel so it keeps running by itself: `speck panel --background` starts it, waits until it's answering, prints its address and gives you your terminal back. Closing that terminal doesn't stop it. `speck panel --stop` stops it again. If the panel is already running on that port, starting it again does nothing and just prints where it is. To see it, run `speck panel --background`, close the terminal, open the address in your browser, then run `speck panel --stop`. What the panel would have printed goes to a log file in speck's cache folder, so look there if it seems stuck. Running it the old way, in the foreground until Ctrl+C, works as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 startAway's already-running branch reports the requested --url as a working address even when the existing panel does not serve it.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 364,836
- Elapsed since build started: 8 min
- Changed lines: 147 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "1fa89b6f5e14b5af7d29f5c4f2bb93d75507c7a5",
    "session": "fresh",
    "thread_id": "01a17521-882f-7ee3-86fd-6b7fe5af6c4a",
    "builder_response": "- Tests run: `speck test --related test/panel-background-0509.test.mjs` (the ticket's own file plus 160 related files; checks included). 1683 pass, 0 fail, 3 skipped.\n- New module scripts/panel-background.mjs holds --background and --stop; scripts/panel.mjs only dispatches to it, adds GET /api/panel (which repo's panel answers on a port) and changes the started line when in the background. panel.mjs and speck.mjs stay at the 600-line limit, so two comments were condensed.\n- Pictures: none, nothing visible in the panel changes.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 120286,
      "cached_input_tokens": 71552,
      "cache_write_input_tokens": 0,
      "output_tokens": 771,
      "reasoning_output_tokens": 77
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:15:17.919Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel-background.mjs startAway detaches the process, redirects output and polls readiness. Passed test '0509 AC1, AC3, AC4' checks a real panel after its launching shell exits, with --port and --url."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "startAway reuses an existing panel but prints addresses derived from the new command's --url, without checking which URL the existing server accepts. The passed AC2 reuse test covers only a local address."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopAway finds background records and stops their processes. Passed AC3 tests exercise stopping a real background panel, reporting none running, leaving a foreground panel alone and stopping it with SIGINT."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passed AC4 tests check panel.log output and the option names in help and docs/brief.md. Supplied related-test results report 1683 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel-background.mjs",
        "issue": "startAway's already-running branch reports the requested --url as a working address even when the existing panel does not serve it. Start a panel without --url, then repeat --background on the same port with --url https://speck.example.ts.net: the command exits successfully and advertises that address, but panelServer's existing hosts set rejects that hostname with HTTP 403. Repeating with a different URL has the same problem.",
        "suggested_fix": "Have the identity endpoint report the existing panel's configured addresses and print those when reusing it. Add a real-panel test that repeats --background with a different --url and verifies that every advertised address is accepted by the existing server.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Background starting, logging and stopping work in the tested cases. One fix is needed: reusing a running panel can advertise a tunnel address that the panel refuses to serve."
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
    "reviewed_sha": "6b7ac05078a478ae831160bd4e9361c3a3acca4d",
    "session": "continued",
    "thread_id": "01a17521-882f-7ee3-86fd-6b7fe5af6c4a",
    "builder_response": "- Tests run: test/panel-background-0509.test.mjs (with the commands.checks files). 114 pass, 0 fail.\n- F1: fixed. GET /api/panel now also gives the running panel's --url origin (scripts/panel.mjs). panelAnswers returns { url } or null, and startAway's already-running branch prints the addresses the running panel serves, plus a line saying it serves a different --url (or none) and to --stop and start again to change it (scripts/panel-background.mjs). New real-panel test '0509 AC2: --background again names the --url address the running panel serves, which it accepts' repeats --background with no --url and with a different --url against a panel started with --url, and checks the printed addresses; the existing reuse test now also repeats with a --url the panel doesn't serve and requests every printed address with its Host header, checking each answers 200. The brief's row says it prints the addresses that panel serves.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 242429,
      "cached_input_tokens": 178560,
      "cache_write_input_tokens": 0,
      "output_tokens": 1350,
      "reasoning_output_tokens": 77
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:16:53.233Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel-background.mjs startAway detaches the process, redirects output and waits for readiness. Passed real-panel test '0509 AC1, AC3, AC4' verifies addresses with --port and --url and continued serving after the launching shell exits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startAway now prints the running panel's URL from /api/panel. Passed AC2 tests verify reuse without another startup, mismatched URL handling, acceptance of advertised Host headers and refusal of an occupied port."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopAway stops recorded background panels. Passed AC3 tests verify stopping a real background panel, reporting none running, preserving a foreground panel and stopping that foreground panel with SIGINT."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passed AC4 tests verify panel.log output and option names in help and the brief. The current test log confirms 114 passed, zero failed and three skipped; the previous related-test run also had no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/panel-background.mjs",
        "issue": "Reusing a running panel previously advertised the newly requested URL even when that panel would reject it. The code now reports the existing panel's configured addresses, and real-panel regression tests cover differing URL options.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel starts independently, keeps a log and can be stopped with the new command. Reusing it now reports the addresses it actually serves. All criteria pass, with no remaining blocking findings."
  }
}
```

</details>
