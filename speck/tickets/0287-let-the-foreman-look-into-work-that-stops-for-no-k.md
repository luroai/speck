---
id: "0287"
title: "Let the Foreman look into work that stops for no known reason"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0286"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:16:47.539Z"
approved: "2026-10-18T13:36:49.168Z"

---
# 0287 · Let the Foreman look into work that stops for no known reason

**Status:** 👍 approved

## Problem
Some stops have no recipe in speck: a ship refused for a reason speck doesn't recognise, or a build that ends without being approved or blocked. Today they wait in `run.log` until the user notices and asks an agent to look.

## Outcome
With the Foreman's Fixing setting on, speck run starts a Foreman agent with a short brief when work stops for a reason speck has no recipe for, and the agent clears it or asks the user in one line.

## Acceptance criteria
1. With `foreman_fixing: fix`, speck run starts the Foreman agent when a ship is refused for a reason not handed back to the build, or a build exits without its ticket approved or blocked. Its brief names the ticket, what happened, the last lines of its log and what it may do.
2. The Foreman agent may only: resume the ticket's build with an instruction, re-run its ship once, make a draft fix ticket, or write one question for the user. It never sets a ticket ready, approves work, ships anything `auto_ship` doesn't cover, or changes code itself. (checked by review)
3. New settings `foreman`, `foreman_model` and `foreman_effort` choose the agent it runs on, its model and effort, blank for the defaults, as the reviewer's do. They're in the config template, `speck config set` accepts them, and the Settings view's Foreman group and setup offer them.
4. What the Foreman agent did, and why, is recorded in the ticket's Notes and shown in the Foreman's status detail.
5. speck run starts at most one Foreman agent at a time, and at most once for the same ticket and the same commits.

## Out of scope
- Stops that already have a recipe (hand-backs, the ship queue's hold, merging a diverged base branch).

## Notes
- From `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`, step 3. The agent's steps go in a new skill, which is the Foreman's instructions, not a user command (only Capture, Ticket, Build and Ship are user commands).
- Failing before this build: none
- Self-check: `speck foreman` now keeps the agent's text and reason to one line in the Notes, refuses a ticket with no Notes section before it makes a fix ticket, and speck run drops a waiting stop whose ticket has since finished.
- How it works: the Foreman agent's code is in `scripts/foreman-agent.mjs`. speck run keeps its record in `speck/.cache/runs/run.foreman-agent.json`; the agent's actions go in `run.foreman-did.jsonl`. Commits titled `speck(<id>): Foreman: …` don't count as new commits, for the ship queue or for looking into a ticket again. Adding settings changed the fixed setting lists in the 0257 and 0258 tests, and the new agent-only skill is left out of 0107's check that the other skills stay in the slash menu.

## In plain words
With the Foreman's Fixing setting on fix, speck run no longer leaves you to find out from its log when work stops for a reason it has no steps for: a ship refused for an unusual reason, or a build that ends without its ticket being approved or blocked. It starts a Foreman agent with a short brief: which ticket, what happened and the end of its log. The agent looks into it and does one thing: carries the build on with an instruction, has speck run try the ship once more, writes a draft fix ticket for you to shape, or asks you one question. It never sets a ticket ready, approves work, ships anything auto-ship doesn't cover or changes code.

Whatever it did, and why, is written in the ticket's notes and shown when you press the Foreman's status in the panel's header, under Looked into; a question it asks you also counts under Needs you. Only one Foreman agent runs at a time, and it looks into a ticket only once until the ticket has new work. New settings in the Settings view's Foreman group choose which agent it runs on (Claude Code or Codex), its model and its effort; blank uses the defaults.

Worth keeping an eye on: a question from the Foreman stays under Needs you until its ticket's status changes. With Codex as the Foreman's agent, only its instructions keep it from changing files, as Codex has no list of allowed commands; Claude Code is limited to reading and running speck's own commands.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 launch starts an agent before persisting its running record, then ignores whether save succeeds.; F2 The build-exit trigger is checked by searching source text for lookInto calls.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,230,814
- Elapsed since build started: 20 min
- Changed lines: 510 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- A Foreman question stays under Needs you until its ticket's status changes: saved to the inbox as `speck/ideas/2026-10-18-answer-or-dismiss-the-foreman-s-question.md`.
- A merge that wasn't pushed (0216) isn't handed to the Foreman: saved to the inbox as `speck/ideas/2026-10-18-let-the-foreman-look-into-a-merge-that-wasn-t-pushed.md`.
- Known limit: a Codex Foreman runs with the same bypass as Codex builds, so only the skill's rules keep it from changing files; a Claude Code Foreman runs in dontAsk mode with only reading, speck's CLI and read-only git allowed.
- Known limit: if the ticket's note can't be committed after `speck foreman fix` has made and committed the fix ticket, the fix ticket stays but the action isn't recorded.
- Known limit: a stop waiting for the Foreman is looked into with the brief it had when it stopped, even if the ticket has moved on since (other than finishing).

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
    "reviewed_sha": "958f5ac72ee53629c6634c7855db39d9f2baf977",
    "thread_id": "01a14f35-43c5-7640-b75a-360a90e6fc69",
    "seconds": 54,
    "usage": {
      "input_tokens": 251866,
      "cached_input_tokens": 183808,
      "cache_write_input_tokens": 0,
      "output_tokens": 1783,
      "reasoning_output_tokens": 730
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:31:46.976Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "foremanAgentQueue and shipQueue have useful unit coverage, but the build-exit test only checks buildStuck and searches run.mjs for calls to lookInto. No test exercises speck run observing an actual build exit and starting the Foreman."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-foreman/SKILL.md explicitly restricts the agent to resume, reship, fix or ask and forbids changing files, approving, setting ready or shipping directly. foremanAction validates its four actions; reship requires an approved ticket covered by auto_ship, and fix creates a draft."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/config.yml, config.mjs, settings.mjs and the setup skill expose all three settings. The AC3 tests exercise configuration validation, CLI saving, Settings metadata and agent arguments; the reported run passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "foremanAction writes the action and reason into Notes and the action record. The AC4 test exercises Notes, agentView, status lines and the panel detail; the reported run passed."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "foremanAgentQueue.launch starts the process before saving its running record and ignores save failure. A failed save leaves the persisted queue available to launch again while the first agent remains alive."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "launch starts an agent before persisting its running record, then ignores whether save succeeds. If saving fails, the next check reads the old queued stop and starts another agent. This breaks both single-agent execution and once-per-commits protection. The first agent also cannot authenticate its action without the saved token.",
        "suggested_fix": "Persist a launch reservation before spawning and handle subsequent persistence failure without allowing another launch. Add a test that forces state saving to fail and verifies repeated checks cannot start overlapping agents or repeat the same stop.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/foreman-agent-0287.test.mjs",
        "issue": "The build-exit trigger is checked by searching source text for lookInto calls. This does not exercise speck run detecting a stopped build, finding its ticket status and launching the Foreman, so a central part of AC1 remains unverified.",
        "suggested_fix": "Add a bounded integration test using a short-lived fake builder and fake Foreman executable. Verify that a build exiting with its ticket still building or reviewing starts the Foreman with the expected brief, while approved and blocked tickets do not.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The settings, permitted actions and activity display are covered well. Changes are needed because a recording failure can start multiple Foreman agents, and the actual build-exit trigger has not been tested."
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
    "reviewed_sha": "e716b2a7e73e19c21323709c54f2138fdac13426",
    "thread_id": "01a14f35-43c5-7640-b75a-360a90e6fc69",
    "seconds": 37,
    "usage": {
      "input_tokens": 403207,
      "cached_input_tokens": 325888,
      "cache_write_input_tokens": 0,
      "output_tokens": 2917,
      "reasoning_output_tokens": 1099
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:34:57.583Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The new AC1 integration test runs speck run with a real short-lived builder and fake Foreman executable, verifies the brief after a building ticket's process exits, and verifies no launch for a blocked ticket. Ship refusal and brief contents retain passing unit coverage."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The Foreman skill and foremanBrief restrict the agent to four actions. foremanAction checks the run token, ticket and single action; reship requires auto_ship coverage, and fix creates a draft."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The template, configuration validation, Settings group and setup skill expose all three settings. Passing AC3 tests cover saving values, defaults and agent arguments."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test exercises the Notes entry, recorded reason, status detail and panel rendering."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The launch reservation prevents duplicate agents within the current process, but if saving the spawned PID fails, a restarted speck run treats the persisted pid:null reservation as an ended agent even while that detached agent remains alive."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "The persistence fix still permits overlapping agents across a speck run restart. If the reservation saves but the subsequent PID save fails, the agent runs detached while the persisted record has pid:null. After restarting speck run, child is null, so check treats that reservation as ended and can launch the next queued agent while the original remains alive. The new test retains the same queue instance throughout and misses this case.",
        "suggested_fix": "Make a reservation with an unknown PID safe to recover across restarts: do not release it and launch another agent without establishing that the original process has ended. Add a test that fails the PID save, reconstructs the queue while the first agent remains alive, and verifies a second queued stop cannot launch.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/foreman-agent-0287.test.mjs",
        "issue": "The previous source-text assertion has been replaced with an integration test that exercises the actual build-exit trigger.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The build-exit behaviour is now tested properly. The recording fix prevents duplicate agents during one run, but restarting speck run after a failed process-record save can still leave two Foreman agents running together."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6ad1a1168a9cc186946b5fa1c61fe1aabbbdd33b",
    "thread_id": "01a14f35-43c5-7640-b75a-360a90e6fc69",
    "seconds": 18,
    "usage": {
      "input_tokens": 567514,
      "cached_input_tokens": 484224,
      "cache_write_input_tokens": 0,
      "output_tokens": 3527,
      "reasoning_output_tokens": 1099
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T13:36:19.361Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Passing AC1 tests exercise the real speck run build-exit trigger, blocked-ticket exclusion, ship refusal routing, fixing modes and brief contents."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The Foreman skill and brief restrict it to resume, reship, draft fix or ask. foremanAction validates its token, ticket and single action; reship requires auto_ship coverage."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The config template, config validation, Settings group and setup skill expose all three settings. Passing AC3 tests cover defaults, saving values and agent arguments."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test exercises the Notes entry, action reason, status detail and panel rendering."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "foremanAgentQueue reserves launches before spawning, retains commit keys and checks process tokens when recovering a reservation without a PID. Passing AC5 tests cover serial execution, duplicate stops, persistence failures and restart recovery."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "Launch reservations and token-based restart recovery now prevent the duplicate-agent scenarios identified in earlier rounds.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/foreman-agent-0287.test.mjs",
        "issue": "The build-exit trigger now has an integration test exercising speck run and a fake Foreman executable.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Foreman can investigate unexplained stops, take one permitted action and show its reason. Both review findings are resolved, and all reported checks pass. Ready for the product owner's merge decision."
  }
}
```

</details>
