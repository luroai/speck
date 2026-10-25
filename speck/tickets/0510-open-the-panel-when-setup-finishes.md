---
id: "0510"
title: "Open the panel when setup finishes"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0509"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:22:13.436Z"

---
# 0510 · Open the panel when setup finishes

**Status:** 🔍 reviewing

## Problem
Setup ends by running `speck doctor` and saying what to do next, but the panel isn't on screen, and someone new has to find out how to start it. In Cursor on 2026-10-20, the agent opened the panel in Cursor's own browser after setup by itself, and the user found that "awesome". Speck's own setup doesn't do it, so other agents and setups end without it.

## Outcome
Setup finishes with the panel running and open in front of the user, in the agent's own browser where it has one, and `speck run` on.

## Acceptance criteria
1. Once `speck doctor` passes, setup's Finish step starts the panel with `speck panel --background`, telling the user it's doing so, before it says what to do next.
2. It then opens the panel: in the agent's own built-in browser when it has one, such as Cursor's browser or Claude Code desktop's browser pane; otherwise in the machine's own browser when it has a desktop; otherwise it gives the address and says how to open it from another machine, pointing to the README's private tunnel section (checked by review).
3. It turns `speck run` on, as the switch at the top of Settings does, so a ticket starts building as soon as the user sets it ready, and tells the user so and that the same switch turns it off (checked by review). If `speck run` won't start, setup says why and finishes anyway.
4. If the panel doesn't start, setup says why and how to start it later with `speck panel`, and finishes anyway (checked by review).
5. The steps for what to do next mention setting a ticket ready from the panel as well as with `speck set` (checked by review). No test that passed before this change fails.

## Out of scope
- `speck panel --background` itself (0509).
- The panel's font under a proxied path (`speck/ideas/2026-10-19-load-the-panel-s-font-and-icons-from-relative-addresses.md`).

## Notes
- From the idea, ticketed with the user on 2026-10-25. Its open questions, decided with the user: setup turns `speck run` on ("Speck run should be on I think"), which builds nothing until a ticket is set ready; and in a plain terminal it opens the machine's browser when there is one, else gives the address.
- Today: section 8, "Finish", in `skills/speck-setup/SKILL.md`.
- Waits for 0509, the command this uses.
- Failing before this build: none
- Self-check: setup now says so when `speck run` was already on, rather than telling the user to turn it on later; the brief's setup row says what Finish now does; the test checks the README link against package.json rather than reading the README, which only allowed tests may.

## In plain words
When setup finishes, speck's panel is now running and open in front of you: in your agent's own browser if it has one, otherwise in your computer's browser, or, on a machine with no screen, setup gives you its address and how to reach it safely from elsewhere. Setup also turns automatic building on, so a ticket starts building as soon as you set it ready, and tells you the switch at the top of Settings turns it off. If either won't start, setup says why and finishes anyway. To see it, set speck up in a fresh project and watch the end of the conversation. Worth keeping an eye on: whether each agent opens its own browser as asked.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: a command to turn `speck run` on in the background, instead of setup's shell line (speck/ideas/2026-10-25-turn-speck-run-on-in-the-background-from-the-command-line.md).

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
    "reviewed_sha": "832da2a2bed87ff7f96d5409d90ed7fb0eb2e2dc",
    "session": "fresh",
    "thread_id": "01a1752b-37d5-7580-b5b0-15cabca78c92",
    "builder_response": "- Tests run: test/setup-0510.test.mjs, with --related (every test file naming skills/speck-setup/SKILL.md or docs/brief.md) and the commands.checks files: 938 pass, 0 fail.\n- AC2, AC3 and AC4 are about how the skill reads, checked by review; the tests check only the facts: the commands, the link and the log path.\n- speck has no CLI to turn speck run on in the background, so the skill starts it the way the panel's switch does (scripts/panel-run.mjs panelRunOn): `speck run` detached, appending to speck/.cache/runs/run.log, then reads the log for its \"watching\" line or its refusal.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 94981,
      "cached_input_tokens": 55040,
      "cache_write_input_tokens": 0,
      "output_tokens": 726,
      "reasoning_output_tokens": 104
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:25:56.835Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md §8 steps 2–3 require doctor to pass, announce the panel start and run speck panel --background before next steps. The reported AC1 test passed and checks the command."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed §8 step 4: prioritises the agent's browser, then the desktop browser, then gives the address and links to the README's private tunnel guidance."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reviewed §8 step 5: starts speck run in the background, checks its log, explains automatic builds and the Settings switch, and continues after a refusal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed §8 step 3: requires explaining panel startup failure, giving speck panel as the later recovery command and continuing setup."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reviewed §8 step 6: mentions setting ready through the panel and speck set. Reported related tests and checks: 938 passed, zero failed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/setup-0510.test.mjs",
        "issue": "The new tests enforce exact document wording. The step() helper requires titles such as “Start the panel.” and “Open it.”; AC4 also requires the prose “start it later with”. Harmless editorial changes would fail these tests, which the review rules explicitly prohibit.",
        "suggested_fix": "Remove assertions and selectors tied to exact prose or headings. Check command, path and link facts without requiring particular wording, and leave narrative requirements to document review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The setup instructions cover opening the panel, starting automatic builds and explaining failures. The reported tests pass, but several tests lock down exact wording in the instructions. Those checks must be removed or revised before approval."
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
    "reviewed_sha": "d00d0b42edf461e495d6cf2c29940faf46ffd5a3",
    "session": "continued",
    "thread_id": "01a1752b-37d5-7580-b5b0-15cabca78c92",
    "builder_response": "- Tests run: test/setup-0510.test.mjs (with the commands.checks files): 113 pass, 0 fail.\n- F1: fixed. The tests no longer pick out steps by their titles or match any prose. Each checks only a fact in the skill as a whole: `speck panel --background`, `open <address>` and `xdg-open <address>`, the README link (its repo checked against package.json, its anchor #the-panel), the speck run command with its log path (checked to be the log the panel's switch writes), `speck panel` and `speck set <id> status ready`. How the steps read is left to review.\n",
    "seconds": 16,
    "usage": {
      "input_tokens": 180194,
      "cached_input_tokens": 136064,
      "cache_write_input_tokens": 0,
      "output_tokens": 1223,
      "reasoning_output_tokens": 104
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:26:36.315Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md §8 steps 2–3 require doctor to pass, announce the panel start and run speck panel --background before giving next steps. The AC1 command test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed §8 step 4: opens the agent's built-in browser first, otherwise the desktop browser, otherwise gives the address and links to the README's private tunnel guidance."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reviewed §8 step 5: starts speck run in the background, checks its output, explains automatic builds and the Settings switch, and finishes with an explanation if startup fails."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed §8 step 3: explains panel startup failure using its message, gives speck panel for starting it later and continues setup."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reviewed §8 step 6: gives both panel and speck set options for setting tickets ready. This round reports 113 passed and zero failed; the previous related-test run also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/setup-0510.test.mjs",
        "issue": "The previous tests required exact headings and explanatory prose. Those assertions and selectors have been removed; the revised tests check commands, paths, links and installed-skill consistency.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The setup instructions now start and open the panel, turn on automatic builds and explain how to recover if startup fails. The wording-sensitive tests have been corrected, and all reported checks pass. Approved for the owner's merge decision."
  }
}
```

</details>
