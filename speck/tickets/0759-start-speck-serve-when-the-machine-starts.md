---
id: "0759"
title: "Start speck serve when the machine starts"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
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
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-26T10:20:32.303Z"
blocked_at: "2026-11-26T10:33:19.338Z"

---
# 0759 · Start speck serve when the machine starts

**Status:** ⛔ blocked

## Problem
After a restart, nothing of speck comes back until someone starts it by hand, so the panel is unreachable from a phone and no work moves.

## Outcome
`speck serve --install` makes `speck serve` start when you log in or the machine starts, and restart if it stops.

## Acceptance criteria
1. On Linux, `speck serve --install` writes a systemd user service that runs `speck serve` with the port and `--url` given, enables it to start at boot (with lingering) and starts it, then prints how to see its status and log.
2. On a Mac, `speck serve --install` writes a launchd agent that runs `speck serve` at login and keeps it running, and loads it.
3. `speck serve --uninstall` stops and removes what `--install` wrote, and nothing else.
4. Running `--install` again replaces the service with the new arguments rather than adding a second.
5. The brief's command table describes `--install` and `--uninstall`. No test that passed before this change fails.

## Out of scope
- Windows.
- Setting up the tunnel or its login.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- risk: high because it writes and enables a system service on the user's machine.
- Checked 2026-11-26: `systemctl --user` (systemd 259 on the user's Linux box, its user manager running) and `loginctl enable-linger [USER]` (loginctl(1): starts the user's manager at boot and keeps it after logout) as the ticket says. `launchctl bootstrap gui/<uid> <plist>` and `launchctl bootout gui/<uid>/<label>` are launchctl(1)'s way to load and unload a login agent on current macOS; not run here, as this machine is Linux.
- Failing before this build: none
- `speck serve` takes no `--port` or `--url` yet: 0757 adds them. `--install` checks and passes them on as given, so a service installed with them starts properly once 0757 has shipped.
- Self-check: WorkingDirectory is now `%h`, as systemd doesn't take a quoted path there (checked the unit with `systemd-analyze --user verify`); a failed install puts the old service file back and turns off lingering it turned on; the brief says `--stop` only stops an installed speck serve until the service starts it again.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
A service installed with `--port` or `--url` can't run yet, because `speck serve` itself only learns those options in 0757, which is still being built (the reviewer's round 1 finding F1). Should this ticket (a) wait for 0757 to ship, then take it in and finish its review, (b) drop `--port` and `--url` from `--install` for now, changing criterion 1, with a follow-up to add them after 0757, or (c) take 0757's handling of those two options into this ticket? I recommend (a): it keeps criterion 1 as written, doesn't duplicate 0757's work, and nothing else here is waiting on it.

Recommended: Wait for 0757 to ship, then finish this ticket's review
Other options: Drop --port and --url from --install for now and change criterion 1; Take 0757's --port and --url handling into this ticket
Changes what you'd notice: yes
Clear winner: yes

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
    "reviewed_sha": "a597979d87a85eb3d8185f34e40f241831776837",
    "session": "fresh",
    "thread_id": "01a21769-20f8-7603-b44f-eb196ce5a8ac",
    "builder_response": "- Tests run: `speck test --related test/serve-install-0759.test.mjs` (the ticket's own test file, plus every existing test file naming a changed file: 2864 tests, all passing).\n- Round 1. Notes: `speck serve` itself has no `--port`/`--url` yet (0757, in progress, adds them); `--install` validates and passes them through. The systemd unit was checked with `systemd-analyze --user verify`. No real service was installed on this machine: the tests use a stand-in runner and a temporary home folder.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 182375,
      "cached_input_tokens": 144640,
      "cache_write_input_tokens": 0,
      "output_tokens": 1103,
      "reasoning_output_tokens": 69
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37735,
      "cached": 144640,
      "write": 0,
      "output": 1103
    },
    "cost_usd": 0.100964,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T10:32:08.838Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "installLinux generates and enables the unit, covered by AC1 tests, but cmdServe (scripts/serve.mjs:414) rejects its --port/--url arguments. Running the generated command exited 1 with \"speck serve doesn't take --port\"."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "installMac writes ProgramArguments, RunAtLoad and KeepAlive and calls launchctl bootstrap. The AC2 test exercises file generation and command invocation through an injected runner."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Happy paths are covered by AC3 tests, but uninstallMac ignores every bootout failure and removes the plist regardless (scripts/serve-install.mjs:221), potentially leaving the agent running."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test exercises repeated installs on both platforms, verifying one file, updated arguments and restart or reload commands."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's command table describes both flags; the AC5 test checks these command facts. The supplied test output reports 2864 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/serve.mjs:414",
        "issue": "Services installed with --port or --url immediately exit because the current serve command rejects both arguments. The service manager will repeatedly restart a failing command. A future ticket does not make the current acceptance criterion pass.",
        "suggested_fix": "Integrate the prerequisite argument support before approval, or make this ticket depend on that support and review the combined code. Add a test exercising the generated command's argument handling.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/serve-install.mjs:221",
        "issue": "Mac uninstall treats every launchctl bootout failure as meaning the agent is absent. A permission or service-manager failure can leave it running while its file is deleted and the user is told it stopped.",
        "suggested_fix": "Distinguish an absent agent from a failed unload. Preserve the plist and report failure when the agent cannot be stopped; test that failure path.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "scripts/serve-install.mjs:165",
        "issue": "Linux install changes lingering before generating and writing the unit, outside the rollback protection. If unit generation or writing fails, lingering remains enabled without a service file recording that speck enabled it. Uninstall then cannot undo that machine-wide user setting.",
        "suggested_fix": "Validate and generate the unit before changing lingering, and protect all subsequent mutations with rollback, including file-write failures. Add coverage for a failed write after lingering was enabled.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change creates startup services on Linux and Mac, and the reported tests pass. It needs fixes before merge: custom port or URL installations cannot currently run, Mac uninstall can falsely report success, and a failed Linux installation can leave lingering enabled."
  }
}
```

</details>
