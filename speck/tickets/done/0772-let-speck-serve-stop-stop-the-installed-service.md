---
id: "0772"
title: "Let speck serve --stop stop the installed service"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-26-let-speck-serve-stop-stop-the-installed-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0771"]                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-27T01:44:03.990Z"
approved: "2026-11-27T01:50:28.678Z"
finished: "2026-11-27T01:55:56.704Z"

---
# 0772 · Let speck serve --stop stop the installed service

**Status:** ✅ done

## Problem
Once `speck serve --install` has made it a service, `speck serve --stop` stops `speck serve`, and the service starts it again a few seconds later, which looks like a bug.

## Outcome
`speck serve --stop` stops an installed `speck serve` and it stays stopped until it's started again.

## Acceptance criteria
1. With the service installed, `speck serve --stop` stops the service itself (systemd on Linux, launchd on a Mac), so `speck serve` stays stopped, and says how to start it again.
2. It also stops every panel `speck serve` started, and leaves each `speck run` on, as `--stop` does today.
3. The service stays installed and starts again at the next boot; `--uninstall` still removes it.
4. Without the service installed, `speck serve --stop` works as today.
5. The brief's `speck serve` row says what `--stop` does with the service installed. No test that passed before this change fails.

## Out of scope
- Restarting the service: `--install` again, or the system's own commands.

## Notes
- From 0759's own note: the service restarts `speck serve` whenever it stops (systemd `Restart=always`, launchd `KeepAlive`).
- Checked 2026-11-27: `systemctl --user stop` stops a unit without disabling it (systemctl(1): enablement is only changed by enable/disable), and `Restart=always` doesn't restart a unit stopped that way. `launchctl bootout` unloads a launch agent without marking it disabled (launchctl(1): only `launchctl disable` does that), so an agent in ~/Library/LaunchAgents is loaded again at the next login.
- speck (2026-11-27 01:36 UTC) I'll resume 0772 at 02:30 UTC: speck run launched 0772 just as 0771's ship was handed back to its build for a clash in the brief, so speck start refused to begin it; 0771 has since finished its rework and should ship within the hour, so the build should try again then rather than now. Its instruction: Run speck start 0772 again. If 0771 has shipped, or is approved and its work merges cleanly, build 0772 as normal, and check from Apple's own documentation whether launchctl bootout leaves the service set to start at the next login. If speck start still refuses because 0771 isn't done, end without changing anything.
- 2026-11-27: its first build stopped before starting, as speck run started it on 0771's approved work just as 0771 was handed back for a clash. Set ready again once 0771 shipped.
- Failing before this build: not checked
- Self-check: no changes

## In plain words
Once speck serve is installed to start by itself, stopping it with `speck serve --stop` now really stops it: before, the machine started it again a few seconds later. It also stops the panels it started, as before, and leaves each project's automatic builds running. It says how to start it again, and it still starts by itself at the next boot (or next login on a Mac). To see it, run `speck serve --stop` with the service installed and check a minute later that the All projects address no longer answers. Worth knowing: if the machine's service manager can't be reached, `--stop` now refuses and says why rather than stopping speck serve only for a moment.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 193,053
- Elapsed since build started: 6 min
- Changed lines: 45 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none to the inbox):
- The service is stopped only for a `speck serve --stop` using the service's own settings folder (~/.config/speck); one with SPECK_HOME_SETTINGS_DIR elsewhere, as the tests' are, leaves it alone, so the tests never stop a real installed service.
- With a service file present but no systemd user manager reachable, `--stop` refuses and stops nothing; `--uninstall` is the way out then.
- The ticket's tests were written just after the code rather than before it; each 0772 test fails on the code before this change (no systemctl or launchctl call was made).

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
    "reviewed_sha": "e56eb5ac545fba7cdf11ac6c4026dd95c0570e17",
    "session": "fresh",
    "thread_id": "01a21ab1-dd4d-7032-8618-41bd6bd481f8",
    "builder_response": "- Tests run: `speck test --related test/serve-stop-0772.test.mjs` (the ticket's own file, plus every existing test file naming a changed file: 1711 pass, 0 fail).\n- Design: `stopInstalledService` (scripts/serve-install.mjs) stops the installed service first (`systemctl --user stop`, or `launchctl bootout`, tolerating \"not loaded\" as --uninstall does), then serveStop carries on as before, stopping any panels the service's shutdown left and printing the usual line plus how to start the service again. Whether speck serve was running is read before the service stops it, so the message stays \"stopped (process N) and the panels…\" rather than \"isn't running\".\n- The service is only touched when the speck serve this --stop is for uses the service's settings folder (~/.config/speck): a --stop with SPECK_HOME_SETTINGS_DIR elsewhere, as every serve test's is, leaves it alone. This keeps the existing serve tests from stopping a real installed service on the machine running them (this machine has one).\n- AC1/AC2 end-to-end test runs a real speck serve with a stand-in `systemctl` on PATH that SIGTERMs it and waits, as systemd's stop does; HOME and XDG_CONFIG_HOME are a temporary folder.\n- AC4: existing 0756 --stop tests run unchanged, and a unit test checks nothing is run without a service file.\n- Facts checked: systemctl stop doesn't change enablement; launchctl bootout doesn't mark the agent disabled, so it loads again at next login.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 192230,
      "cached_input_tokens": 135936,
      "cache_write_input_tokens": 0,
      "output_tokens": 823,
      "reasoning_output_tokens": 82
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56294,
      "cached": 135936,
      "write": 0,
      "output": 823
    },
    "cost_usd": 0.1344116,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T01:50:17.929Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/serve-install.mjs stopInstalledService uses systemctl --user stop or launchctl bootout and returns restart instructions. Passing 0772 AC1 tests cover both platforms, failures and a real serve process stopped through a stand-in systemctl."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/serve.mjs serveStop retains panel cleanup after stopping the service. Passing 0772 integration test verifies panel termination; existing 0756 stop tests and 0758 real-process test verify that other panels and speck run remain running. Service definitions retain KillMode=process and detached runs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopInstalledService neither removes service files nor disables services. Passing 0772 AC3 test checks file preservation, absence of disable commands and subsequent uninstall removal. Existing installation definitions preserve boot/login startup."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "stopInstalledService returns null when no service file exists. Passing 0772 AC4 and unchanged 0756 stop tests cover this path and existing cleanup behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md serve row describes stopping the installed service, retained installation and restart instructions. Passing 0772 AC5 checks the command facts. Verified recorded test output: 1711 passed, zero failed, three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Stopping speck now stops its installed service first, preventing automatic restarts, then cleans up its panels while leaving project runs running. It explains how to start again and preserves startup at boot or login. The tests pass; no blocking issues found."
  }
}
```

</details>
