---
id: "0756"
title: "Run every listed project from one speck service"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0755"]                # ticket ids that must be done first
created: 2026-11-25
built_on: "0755"
started: "2026-11-26T09:39:22.799Z"
approved: "2026-11-26T10:17:00.126Z"
finished: "2026-11-26T10:20:21.642Z"

---
# 0756 · Run every listed project from one speck service

**Status:** ✅ done

## Problem
Each project needs its own `speck panel`, on its own port, started by hand in its own folder; a panel that stops stays stopped until someone notices. There's no one thing to start that brings up every project on the machine.

## Outcome
`speck serve` starts and looks after a panel for every listed project, each on its own copy of speck, from one command.

## Acceptance criteria
1. `speck serve` starts a panel for every project on `speck projects`' list that has none running, each with that project's own `.speck/` copy, on its own free port on 127.0.0.1, and prints the address of each; a project whose panel is already running is left as it is.
2. While `speck serve` runs, a panel it started that exits is started again within 10 seconds, and a project added to or removed from the list is started or stopped within 10 seconds.
3. `speck serve --background` keeps it running after the shell ends, writing its output to a log in the home folder, and `speck serve --stop` stops it and every panel it started, and nothing else.
4. A project on an older speck, from 1.5.0 on, runs on its own copy and is listed and switched to like any other.
5. The brief's command table describes `speck serve`, `--background` and `--stop`. No test that passed before this change fails.

## Out of scope
- One address in front of them all: the ticket after this.
- Starting each project's `speck run`: a ticket of its own.
- Starting at boot: a ticket of its own.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- Each project keeps its own panel process and `.speck/` version; this supervises them rather than running them in one process. `speck panel --background` (`scripts/panel-background.mjs`) and the panels registry (`scripts/panel-projects.mjs`) can be reused.
- Only one `speck serve` may run per machine at a time; a second says where the first is and exits.
- Failing before this build: not checked
- Self-check: a restart no longer takes its own panel's server, still going away, for one started by hand; a home folder it can't write to gives a plain message rather than a stack trace; the record is written only when it changes, and a failed write is said once rather than ending speck serve; `--stop` also stops a panel started after it read the record; a process counts as speck's only when `ps` says so; a panel that won't start is tried again when that's due rather than at the next 2-second check; tests added for each panel's `speck/.cache/panel.log`, restarting on the same port and a panel that won't start.
- Pictures: none, because nothing anyone sees in the panel changes: `speck serve` is a command, and the panels it starts are the projects' own.

## In plain words
There's now one command that brings up every project on this machine. `speck serve` starts a panel for each project on your list (the one `speck projects` keeps), each on that project's own version of speck, and prints each one's address. A project whose panel you already have running is left as it is. It then keeps them going: a panel that stops is started again within seconds, and adding a project to the list, or taking one off, starts or stops its panel within 10 seconds. `speck serve --background` keeps it running after you close the terminal, with what it says kept in a log in your home folder. `speck serve --stop` stops it and the panels it started, and leaves any panel you started yourself alone. Only one runs on a machine at a time: a second one says where the first is.

To see it, add two projects with `speck projects add`, run `speck serve` and open the addresses it prints. Then stop one of those panels and watch it come back.

Worth keeping an eye on: each project gets a new address whenever `speck serve` starts, until the next ticket puts every project behind one address.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 When a panel exits during startup, exited() schedules a retry but leaves p.state as 'starting'.; F2 Panels adopted from a killed service have no child handle.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 392,268
- Elapsed since build started: 38 min
- Changed lines: 425 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none sent to the inbox):
- Each project gets a new port whenever `speck serve` starts, so its own address changes. Skipped: 0757 puts every project behind `speck serve`'s one address.
- `speck panel --stop` in a project doesn't stop the panel `speck serve` started for it, and `speck serve` would start it again. Skipped: 0762 lets a project be left out of `speck serve`.
- Where `ps` can't be run, `speck serve` can't confirm which processes are its own, so it signals none of them: a second one could start, and `--stop` leaves a killed one's panels running. speck run's lock relies on `ps` in the same way.
- A `serve.json.recover` left by a `speck serve` killed while taking over a stale record has to be deleted by hand, as speck run's `run.lock.recover` does; the message says so.
- With `SPECK_SERVE_START_MS` at 1000, as a test sets it, the message says "within 1 seconds".
- Each project's `speck/.cache/panel.log` and `~/.config/speck/serve.log` grow without limit, as the logs of `speck panel --background` and speck run do.

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
    "reviewed_sha": "5efd17337a824c8bb48564156a330953fe2d571d",
    "session": "fresh",
    "thread_id": "01a21755-ee6b-7e53-9e86-89984cd9975d",
    "builder_response": "- Tests run: `speck test --related test/serve-0756.test.mjs test/serve-0756-old.test.mjs`, which also ran the 248 existing test files that name `docs/brief.md` or `scripts/speck.mjs` (2851 tests, 1 failure: `0231 AC3: no shared helper starts the speck CLI as a process, except for panel and run`, caused by this ticket's new shared helper). After the fix below, the line that run ended with plus 0755's tests: test/serve-0756.test.mjs test/serve-0756-old.test.mjs test/cli-0231.test.mjs test/projects-0755.test.mjs (179 tests, 0 failures, 3 of 0078's long-standing skips). The attached output is that last run.\n\nRound 1. What this build does, for the reviewer:\n\n- The ticket is built on 0755's approved branch (`built_on: \"0755\"`), which adds `speck projects` and `scripts/projects.mjs`. The only change to 0755's file is exporting `panelPorts`, so `speck serve` counts a project's panel as already running exactly when `speck projects` says its panel is running.\n- `scripts/serve.mjs` is new. `speck serve` takes its record in the home folder (`~/.config/speck/serve.json`) as a lock, linked into place as `speck run`'s `run.lock` is, so only one runs per machine and a second says which process it is and exits 1. It then reads the list every 2 seconds. For each listed project with no panel running, it starts that project's own `.speck/scripts/speck.mjs panel --port <n>` in its own process group, from the project's folder, on a port the OS gave as free on 127.0.0.1, with its output in the project's `speck/.cache/panel.log`. It prints each address, and leaves a project whose panel is already running as it is. A panel of its own that exits is started again at once, on the same port while that's free. A project taken off the list has the panel serve started for it stopped. A panel that won't start is tried again after 2, 5, 10, 30, then 60 seconds, with why said once per reason.\n- The record names the panels it started (folder, port, pid). So `--stop` stops serve, which stops its panels, and then stops any of those panels still running, as when serve was killed. A new serve that finds a dead serve's record looks after that serve's panels again. Every process serve signals other than its own children is first checked with `ps` to be that project's own speck running `panel --port <that port>`, or speck serve itself. Nothing else is ever signalled.\n- `--background` starts it detached, in its own process group and session, with its output added to `~/.config/speck/serve.log`. It returns once serve has done its first look at the list, printing what serve said (the addresses).\n- `BUILD_ENV` is removed from each panel's environment, so the panels serve starts register where `speck projects` looks, even when a build starts speck serve.\n- Tests: `test/serve-0756.test.mjs` is quick. Each project's own speck is a stand-in panel (`test/support/stand-in-panel.mjs`) that does what serve relies on a panel for: it serves `/api/panel` on 127.0.0.1 and registers itself where real panels do. `test/serve-0756-old.test.mjs` is the real check for AC4. It sets up a project with speck 1.5.0's own `init`, taken from the `v1.5.0` tag. serve starts that project's real 1.5.0 panel, and the test checks the panel's process runs the project's own copy. It checks `speck projects` lists the project on 1.5.0 with that panel running. Then a panel on this speck, started by hand, lists the project in its menu and switches to it. That file is heavy, as it calls `startPanel`.\n- 0231's rule: 0231's AC3 says the shared helpers run commands in-process \"except for commands that keep running (such as `panel` and `run`) and tests about the command as a process (signals, being killed or its process tree)\". `speck serve` is both, so `test/support/serve.mjs` starts it as a process. I extended the check's exception from `panel|run` to `panel|run|serve` and added `serve` to `OWN_PROCESS` in `test/support/cli.mjs`, so `speck()` never runs it inside a test's process. That last part matters because `cmdServe` returns a promise and installs signal handlers.\n- No visual change: the panels serve starts are the projects' own, unchanged. Notes say so (`Pictures: none`).\n",
    "seconds": 37,
    "usage": {
      "input_tokens": 232578,
      "cached_input_tokens": 166016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1244,
      "reasoning_output_tokens": 262
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 66562,
      "cached": 166016,
      "write": 0,
      "output": 1244
    },
    "cost_usd": 0.1621656,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:11:14.469Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/serve.mjs pass() and start() launch each project's own script and preserve existing panels. The three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The restart and list-change tests passed, but exited() leaves failed attempts marked starting, allowing their outstanding start() calls to overwrite later retry state."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Background and stop tests passed for their covered cases. However, stopOne() signals adopted processes without rechecking their identity, so a reused PID can cause an unrelated process to be stopped."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "serve-0756-old.test.mjs exercises a real speck 1.5.0 installation, verifies its own script runs, and checks listing and switching. Reported passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md's command table describes serve and both options. The AC5 test checks command and option names. The final reported run passed 176 tests with three skips; the earlier helper failure was addressed within scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve.mjs:190",
        "issue": "When a panel exits during startup, exited() schedules a retry but leaves p.state as 'starting'. Its original start() continues polling for 15 seconds, then calls failed() again. Multiple obsolete attempts therefore overwrite current retry state, report spurious timeout failures and disrupt the intended retry schedule, even after a later attempt succeeds. The existing broken-panel test ends before this stale timeout occurs.",
        "suggested_fix": "Mark exited or errored attempts terminal and cancel their startup polling. Ensure only the current attempt can update retry state. Add coverage that waits beyond the original startup timeout after a failed attempt and subsequent successful retry.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve.mjs:235",
        "issue": "Panels adopted from a killed service have no child handle. pass() checks only pidAlive(), and stopOne() passes their saved PID directly to stopPanel(). If an adopted panel exits and its PID is reused, removing the project or stopping serve sends SIGTERM to the unrelated replacement process. The identity check performed during adoption does not protect later signals.",
        "suggested_fix": "Revalidate adopted process identity before signalling it and during supervision; discard ownership when the PID no longer identifies that project's panel. Add a stale adopted-record regression test proving an unrelated replacement process remains alive.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The main start, background and older-version flows have passing coverage. Two lifecycle defects need fixing: failed starts can later corrupt retry tracking, and stopping an adopted panel can signal an unrelated process after its PID is reused."
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
    "reviewed_sha": "4e366af38cdcdebac4d7a4386c754886d228570c",
    "session": "continued",
    "thread_id": "01a21755-ee6b-7e53-9e86-89984cd9975d",
    "builder_response": "- Tests run: test/serve-0756.test.mjs test/serve-0756-old.test.mjs test/cli-0231.test.mjs test/projects-0755.test.mjs (181 tests, 0 failures, 3 of 0078's long-standing skips).\n- F1: fixed. Each start attempt now ends for good when its panel exits or fails to spawn: `exited()` and the child's `error` handler set `p.state = 'gone'` before doing anything else, and branch on the state it had. Because `start()` polls only while `p.state === 'starting'`, a failed attempt's polling stops at once. It never reaches the timeout branch, so it can't call `failed()` again or change `retry` after a later attempt. Only the current attempt is in `owned` and can reach `failed()`, and `stopOne()` does nothing for a `gone` attempt. For the test, `SPECK_SERVE_START_MS` sets how long a start has to answer, as `SPECK_RUN_POLL_MS` and `SPECK_STALL_MS` do for their waits, so the test can wait past a failed start's own time limit. New test, `0756 AC2: a start that failed changes nothing once a later one has worked, even after its own time to answer has passed`. Each start gets 1 second. The first start fails, and its fixed copy starts on the 2-second retry. The test waits until 3 seconds after serve started, then checks: no \"didn't answer\" was said, the failure was said once, the panel that started is still the one serving, and the record names only it. I checked the test against the round-1 logic with only that timing setting added. It fails there with the spurious \"didn't answer at … within 1 seconds\" and the retry pushed back to 5 seconds, as you described. It passes now.\n- F2: fixed. A panel taken over from a killed speck serve is no longer judged by `pidAlive()`. A new `alive(p)` holds while its child hasn't exited (Node's own record, for the panels it started) or, for one it took over, while `ps` still shows that project's own `speck.mjs panel --port <its port>` (`isOurPanel`). `pass()` re-checks a taken-over panel with it on every look at the list. Once that fails, the panel is forgotten without being signalled, and the project gets a panel again. `stopOne()` stops a panel only while `alive(p)`. `stopPanel(p, ours)` now takes that check: it sends SIGTERM only while `ours(p)`, counts the panel gone once `!ours(p)` and its port no longer answers for the project, and signals the process group only while the panel's first process or a part of it still answering on its port keeps the group's id its. `--stop` passes `isOurPanel`. The same kind of hole was in `--stop`'s wait for speck serve itself, which used `pidAlive` and then SIGKILLed the pid. It now waits for `!isServe(pid)` and sends SIGKILL only while `ps` still shows speck serve. When an attempt's panel exits unexpectedly, the group kill now happens only while something still answers on its port. New test, `0756 AC3: a panel taken over from a killed speck serve is never signalled once its pid is another program's`. The stand-in panel's SIGUSR2 makes it \"another program with the same pid\": it stops serving, takes its record away and renames itself with `process.title`, which `ps` then shows. The test starts a speck serve, kills it and starts another, which takes the panel over. The test then turns the panel's pid into that other program. It checks that the project gets a new panel and the project can be taken off the list, which stops the new panel. After speck serve itself has stopped, the program with the old pid is still running. Against the round-1 code it fails, as the project never gets a panel again and removing it would SIGTERM that pid. It passes now.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 390275,
      "cached_input_tokens": 308352,
      "cache_write_input_tokens": 0,
      "output_tokens": 1993,
      "reasoning_output_tokens": 319
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 15361,
      "cached": 142336,
      "write": 0,
      "output": 749
    },
    "cost_usd": 0.0524456,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:16:10.509Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/serve.mjs pass() and start() launch each project's own .speck script on a free loopback port, print addresses and preserve existing panels. All three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests passed for restart timing, list additions and removals, failed-start retries and obsolete startup attempts. exited() and the spawn-error handler now mark attempts gone, ending their startup polling."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "serveBackground() detaches the service and logs its output. alive(), stopOne() and stopPanel() now check process ownership before signalling adopted panels. The background, shutdown, recovery and replacement-process tests all passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "serve-0756-old.test.mjs passed using a real speck 1.5.0 installation, verifying its own script runs and that the project can be listed and switched to."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's command table describes serve, --background and --stop; the AC5 test passed. The reported round ran 181 tests with 178 passing, three existing skips and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve.mjs",
        "issue": "Failed startup attempts previously remained active and could overwrite later retry state.",
        "suggested_fix": "Completed: exit and spawn-error handlers mark attempts gone, terminating their polling. A passing regression test checks beyond the failed attempt's timeout.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve.mjs",
        "issue": "Adopted panel PIDs previously lacked identity checks during supervision and shutdown.",
        "suggested_fix": "Completed: adopted processes are revalidated during supervision and before signalling. A passing regression test verifies a replacement program remains running.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both lifecycle defects are fixed and have meaningful regression coverage. The service starts and supervises listed projects, supports older installations, and preserves panels started separately. All criteria pass; the change is ready for the owner's merge decision."
  }
}
```

</details>
