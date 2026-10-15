---
id: "0194"
title: "Hand every auto-ship to speck run's ship queue"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0193"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T10:10:54.829Z"

---
# 0194 · Hand every auto-ship to speck run's ship queue

**Status:** 🔍 reviewing

## Problem
Each build still ships its own ticket, holding its build slot while it merges, tests and sorts out conflicts, and ships started by different builds aren't in one ordered queue. Moving every auto-ship to one queue in `speck run` is what lets builds and shipping run separately, and later side by side, without racing for `main`.

## Outcome
Builds end at approved, `speck run`'s ship queue (0193) does every auto-ship, and it hands a ticket back to its build session only when the ship needs work on the ticket.

## Acceptance criteria
1. `/speck-build` ends at approved: its skill no longer runs `speck ship`, and its report says the ticket now waits for `speck run`'s ship queue, or for `/speck-ship` when `auto_ship` doesn't cover it.
2. When a ship that `speck run` started is refused because the merge with the base branch conflicts (exit 13), or because the tests fail on the ticket merged with the base branch while the base branch's own tests pass, `speck run` resumes that ticket's build session with a message saying which and telling it to follow the build skill's steps for it. The build skill has steps for both: merge the base branch in, fix what's needed, get a merge round, and end at approved again, after which the queue ships it as in 0193. After two such hand-backs for one ticket without it shipping, the session blocks the ticket with a plain question instead, as the build skill does today after two merges.
3. When a ship that `speck run` started exits 14, `speck run` resumes that ticket's build session once with a message to follow the build skill's "Base branch failing" steps (find or create the fix ticket and set it ready), then holds as 0193 AC3 says. A ticket handed back this way stays approved.
4. A build session that `speck run` resumes for a hand-back counts towards `max_parallel_builds` while it runs, and its output goes to the ticket's build log as a resumed build's does.
5. `docs/brief.md` section 7 says that builds end at approved and one ship queue in `speck run` ships tickets one at a time, replacing "Each build ships its own ticket: there is no separate shipping agent". No test that passed before this change fails.

## Out of scope
- Running more than one build at a time: `max_parallel_builds` stays 1.
- Showing the queue in the panel.
- `/speck-ship` and the panel's Ship button: they still run `speck ship <id>` at once for the user's own ships.

## Notes
- Asked for 2026-10-15: "those two tickets are essentially creating a separate single shipping process which handles the shipping of all things in its own queue? This was an idea we discussed a few days ago but opted to go with a single WIP limit instead. If this is correct, then start those 2 tickets."
- `speck run` already resumes a killed build's session from `build_command` (`resumeArgv` in `scripts/run.mjs`); a hand-back can resume the same way with its own message.
- "Fail together" refusals have no exit code of their own today (`testFailure` in `scripts/ship.mjs`); the builder can give them one.
- Failing before this build: none
- "Fail together" refusals, and a ticket's own failing tests with the base branch passing, exit 16, but only with `--auto` (speck run's ship queue is its only caller). `/speck-ship` and the Ship button still exit 1, as the 0099 and 0192 tests pin.
- A hand-back waits in the build's run record (`hand_back`), so a restart of speck run still carries it out. It's dropped if the ticket's branch has moved since the ship, and the conflict and failing-test hand-backs are counted in the record (`hand_backs`), so the third tells the session to block.
- AC3's "once" is read as one hand-back for each exit-14 refusal; the queue then holds, so the ticket isn't tried again until the base branch has a new commit.
- Earlier tests that pinned the build running `speck ship <id> --auto` and handling its exit codes, or the brief's "Each build ships its own ticket", now check the new behaviour instead, as AC1, AC2 and AC5 replace it: `brief-0111` AC3, `build-0116` AC1, AC3 and AC4 (a ship queue is described again), `close` 0021 AC5, `followups-0036` AC4, `ship-0048` AC4 and `ship` "auto-ship: …". Nothing they check otherwise was loosened.
- Self-check: run.mjs went over the 600-line limit for scripts, so the hand-back code moved to its own module.

## In plain words
A build now stops once the reviewer approves its ticket. It no longer ships the ticket itself. With auto-ship on, `speck run` ships approved tickets one at a time, in one queue. Otherwise the ticket waits for you to ship it, as before. A ticket built without `speck run` on now waits until you turn `speck run` on, or ship it yourself.

When a ship from the queue can't go through because of a clash with newer work on the main branch, or because the tests only fail with that newer work, `speck run` reopens that ticket's build. The build sorts it out, gets it reviewed again, and leaves the ticket approved for the queue to try again. This waits for a free build slot, like any build, and its output goes to the same build log. After two such tries the build asks you a question instead. When the main branch's own tests are failing, the build is reopened once to make sure a fix ticket exists, and shipping waits until the main branch has a new commit.

To see it: with `speck run` on, approve a low-risk ticket that clashes with a change on main. `speck run`'s output says it's handing the ticket back, and its build log carries on. Keep an eye on tickets built outside `speck run`: if one of their ships needs work, `speck run` can't reopen that build. It says so once, with what to do.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: the count of hand-backs stays in the build's run record until the next build of the ticket. If you answer a blocked question and carry the same build on, the next conflict for that ticket goes straight to the block question again.
- Known limit: a ticket built outside `speck run` has no build session that `speck run` can resume, so a ship needing work is reported once, and you resume that session by hand.
- Tidy-up: the brief's workflow diagram and review-loop step still say an approved ticket "ships straight away" with `auto_ship`; that's true only while `speck run` is on.
- Tidy-up: the panel's "Auto-ship didn't finish" wording still speaks of a build's auto-ship.

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
    "reviewed_sha": "f06f76531e1c6ba8a4ead8f48174a97d7a25cbaf",
    "thread_id": "01a13f18-f3ab-7ac3-90cb-468d51554598",
    "seconds": 38,
    "usage": {
      "input_tokens": 200142,
      "cached_input_tokens": 143360,
      "cache_write_input_tokens": 0,
      "output_tokens": 995,
      "reasoning_output_tokens": 141
    },
    "saved_at": "2026-10-15T10:26:39.710Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 ends at approved and reports queue or manual shipping. Both 0194 AC1 tests pass."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Hand-back messages, persisted counts and recovery instructions are implemented and tested, but run.mjs tick calls ships.check before handBacks.check, allowing another ship while recovery is pending (F1)."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Exit 14 messages and the queue hold have passing tests, but a new base commit can release shipping before the pending base-failure hand-back runs (F1)."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "handBackQueue uses startBuild, which tracks running builds and appends output to the build log. The passing 0194 AC2 AC4 integration test exercises session resumption, slot limits and logging."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md principle 7 describes approved builds and one ship queue. The full output in /tmp/speck-0194-tests.txt confirms 1752 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs:259; scripts/ship-queue.mjs:102",
        "issue": "Pending hand-backs do not prevent shipping. If a refusal creates a hand_back while another build occupies the slot, a subsequent base-branch commit makes that ticket eligible for shipping again. tick starts the ship before checking hand-backs; when the slot becomes free, it can also resume the build while that ship is running. This can repeat refusals before recovery or race shipping against changes in the ticket's worktree. The existing integration test keeps the base unchanged while the hand-back waits, so it misses this case.",
        "suggested_fix": "Exclude tickets with valid pending hand-backs from shipping until recovery has run, and ensure shipping and hand-back execution cannot overlap for the same ticket. Refresh eligibility after starting resumed builds. Add a regression test that queues a hand-back behind an occupied build slot, advances the base branch, and verifies no ship retry occurs before recovery finishes; cover persisted hand-backs after restart too.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Builds now stop at approval, and the queue can resume their sessions to resolve shipping problems. The reported suite passes, but a pending recovery does not stop another shipping attempt. Fix that race before merge."
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
    "reviewed_sha": "3ec72dac7d0aad0971eda8102955eee61133d80a",
    "thread_id": "01a13f18-f3ab-7ac3-90cb-468d51554598",
    "seconds": 20,
    "usage": {
      "input_tokens": 329258,
      "cached_input_tokens": 262272,
      "cache_write_input_tokens": 0,
      "output_tokens": 1616,
      "reasoning_output_tokens": 160
    },
    "saved_at": "2026-10-15T10:30:56.093Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 5 stops at approved and reports either the ship queue or /speck-ship as the next step. Both AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipQueue hands exits 13 and 16 to handBackQueue, which persists recovery requests, resumes the build session and counts hand-backs. The build skill provides merge, repair, review and blocking steps. Passing regression tests cover waiting for a slot, base changes, restart persistence and avoiding an active ship."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Exit 14 produces the Base branch failing instructions while leaving the ticket approved. shipQueue holds shipping until the base changes, and its waiting guard prevents retrying a ticket before its pending hand-back runs. AC3 message and hold tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Hand-backs use run.mjs startBuild, count in running and append to the existing build log. The passing AC2 AC4 integration test verifies slot limits, session identity, running status and log output."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md principle 7 states that builds end at approved and one queue ships tickets one at a time. The full test output confirms 1755 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/run.mjs; scripts/ship-queue.mjs; scripts/hand-back.mjs",
        "issue": "Pending hand-backs previously allowed another shipping attempt before recovery, potentially overlapping shipping and build work.",
        "suggested_fix": "Implemented: shipQueue skips persisted pending hand-backs, and handBackQueue waits while the ticket has an active ship. Regression tests cover base changes, restart persistence and active shipping.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Builds now finish at approval, and speck run handles automatic shipping and resumes builds when repairs are needed. The shipping race is fixed, regression tests cover it, and the full suite passes. Ready for the owner's merge decision."
  }
}
```

</details>
