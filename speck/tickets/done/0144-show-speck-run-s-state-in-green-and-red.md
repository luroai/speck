---
id: "0144"
title: Call the speck run switch Auto-build                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:18:10.904Z"
approved: "2026-10-13T08:22:05.918Z"
finished: "2026-10-13T08:23:13.269Z"

---
# 0144 · Call the speck run switch Auto-build

**Status:** ✅ done

## Problem
The panel header shows "speck run on" or "speck run off", with a blue or grey square and a "Turn on" or "Turn off" button. "speck run" is a command name, so it means nothing to someone who doesn't know it, the grey square reads as faded rather than off, and the button makes the user work out the state before they know what it will do.

## Outcome
The header's switch is called Auto-build: its state is plain at a glance, in green or red, and its button says what it will do.

## Acceptance criteria
1. While speck run is on, the header indicator reads "Auto-build on" with a square in the panel's green (the colour used for "lint passes"), and the button beside it reads "Pause".
2. While speck run is off, the indicator reads "Auto-build off" with a square in the panel's red (the colour used for a blocked ticket), followed by "ready tickets wait" in smaller, muted text, and the button reads "Start".
3. Hovering over the indicator shows a tooltip naming the command: "speck run". While the button's request is being answered, it reads "Starting…" or "Pausing…" and can't be clicked again.
4. The button does exactly what it does today: Start starts `speck run`, and Pause stops it the way Ctrl-C does, leaving builds already running to carry on. The connection indicator ("live · Ns ago", "disconnected") keeps its text and colours.
5. No test that passed before this change fails, except checks of the old labels ("speck run on/off", "Turn on/off", "Turning on/off…") or the old blue and grey square, which are changed to the new ones.

## Out of scope
- Renaming the `speck run` command, or its name in the docs and CLI.
- Moving the switch out of the header.
- Changing what starting or pausing does.

## Notes
- Labels are set in `templates/panel.html` (the `run` and `run-switch` elements). The speck run square and the connection square share the `.live` class: `.live` is `--run` (blue) and `.live.idle` is `--faint` (grey). The panel's green is `--ok` and its red is `--bad`.
- The phone layout (0140) keeps header labels on one line at 375 px; the new labels must too.
- Failing before this build: none
- Self-check: no changes. The README and brief still describe the switch as turning `speck run` on or off, which stays true; renaming it there is out of scope.

## In plain words
The switch at the top of the panel that builds ready tickets on its own is now called Auto-build. When it's on, it reads "Auto-build on" with a green square and a Pause button. When it's off, it reads "Auto-build off" with a red square, a small note that ready tickets wait, and a Start button. Hover over it to see the command behind it. To see it, open the panel and press Start or Pause. The switch works exactly as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 139,775
- Elapsed since build started: 4 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Tidy-up: the README and the brief still describe the header switch as turning `speck run` on or off, without the Auto-build name. Still accurate, and renaming there was out of scope. Delivery log only, no inbox note.

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
    "reviewed_sha": "95f693e577aeea3428db707e5ad62f1f0d9a49fc",
    "thread_id": "01a13459-bb51-71f2-95d2-afaa63c16899",
    "seconds": 60,
    "usage": {
      "input_tokens": 138989,
      "cached_input_tokens": 94464,
      "cache_write_input_tokens": 0,
      "output_tokens": 786,
      "reasoning_output_tokens": 22
    },
    "saved_at": "2026-10-13T08:21:58.211Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html render() displays Auto-build on, uses --ok through .live.go, and labels the button Pause. Both 0144 AC1 tests passed, including computed browser colour checks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() displays Auto-build off, a --bad square and a smaller --faint hint, with Start. The 0144 AC2 browser tests passed for colours, hint styling and single-line layout at 375 px in both states."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() sets the indicator title to speck run and disables the button while showing Starting… or Pausing…. Both 0144 AC3 tests passed; the deferred-request test verifies a second click sends no additional request."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "switchRun() and server behaviour are unchanged. The passing 0144 AC4 test checks endpoint requests and connection text; browser tests check its blue colour. Existing passing panel-0128 integration tests verify starting a real run and stopping it cleanly while its builds carry on. Existing connection recovery tests cover disconnected text; its CSS is unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0144-tests.txt: 1284 tests, 1281 passed, zero failed, three skipped. All nine 0144 tests passed. Existing test edits only update permitted label expectations; no assertions were removed or unrelated implementation changes introduced."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header now clearly calls the switch Auto-build, with green for on, red for off, and Start/Pause buttons. The tooltip, waiting labels and phone layout meet the ticket. Starting and pausing retain their existing behaviour, including leaving running builds alone. The recorded full suite has no failures. No blocking concerns found."
  }
}
```

</details>
