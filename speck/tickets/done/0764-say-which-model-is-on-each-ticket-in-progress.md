---
id: "0764"
title: "Say which model is on each ticket in progress"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T19:44:42.363Z"
approved: "2026-11-26T20:10:02.716Z"
finished: "2026-11-26T20:13:21.034Z"

---
# 0764 · Say which model is on each ticket in progress

**Status:** ✅ done

## Problem
The factory floor is to show, for every project, which ticket each team member is working on and on which agent, model and effort. A project's summary (`projectSummary`, sent to `speck serve`'s front) gives counts and what needs you, but not who is working on what or on which model.

## Outcome
Each project's summary lists the work at each station, with the agent, model and effort it runs on, and what each station would run on when idle.

## Acceptance criteria
1. A project's summary lists each ticket being built, reviewed or checked in the running app, with its id, title, station (builder, reviewer or QA), agent, model, effort, why it's on them (its level, its own fields, the settings, or a stand-in from a bench) and when it got there.
2. It gives, for each of builder, reviewer and QA, the agent, model and effort that station would use for a new ticket with no level, and whether QA is set up.
3. It gives the queue (how many tickets are ready and the next three ids by priority) and the tickets waiting at Ship, saying which wait for you.
4. A model left blank in the settings is named as the agent's default, in the same words Settings and a ticket's Builder fact use.
5. No test that passed before this change fails.

## Out of scope
- Showing any of it: the factory floor tickets after this.

## Notes
- For the factory floor's line (see the ticket that shows it). A new page at `speck serve`'s address, for a laptop or desktop window. It doesn't replace or change the panel, which stays the phone and side-panel view (decided 2026-11-26).
- `projectSummary` is in `scripts/panel-summary.mjs`; the front asks each panel through `/api/projects/own`. Builder models per ticket come from its level and fields (0662, `level_builds`); review rounds record their reviewer and model; QA has `qa_*` settings (0651).
- Failing before this build: none
- The summary's new `line` part: `work` (each ticket at the builder, reviewer or QA, with `agent`, `agent_name`, `model`, `model_slug`, `effort`, `why` (`level`, `ticket`, `settings` or `bench`), `level`, `stands_in_for` and `since`), `idle` (each station for a new ticket with no level, QA's with `set_up`), `queue` (`ready`, `next`) and `ship` (`id`, `title`, `yours`, `shipping`). Worked out in `scripts/panel-line.mjs`, from the board and what `scripts/line-facts.mjs` reads when the front asks.
- QA is set up when speck checks a build's question in the running app at all: `watch` is `fix` or `decide`. With QA's own settings blank, QA runs on the watch agent's, as 0651 does.
- A stand-in is recorded where speck starts it, so the line can say so: a build speck run starts on one keeps `stand_in: { for }` in its run record (a take-over already keeps `took_over`), and a review round on one keeps `stand_in: { name, for }` in its running record.
- AC4: Settings names Codex's and Cursor's default model by asking the agent for its list, which the summary can't do each time it's asked, so for them the line uses the Builder fact's words, "default model". Claude Code's is "its own default" in all three, and a model provider's is its default model by name.
- Self-check: the facts reader read run records for tickets at no station; it now reads only what each ticket's station needs, with a test. A failure working out the line now leaves the rest of the summary (`line` null), with a test. Narrowed a comment that said a reviewing ticket is at the reviewer only while a round runs.

## In plain words
Nothing changes on screen yet. Behind the scenes, each project now tells speck serve who is working on what: for every ticket being built, reviewed or checked in the running app, which agent, model and effort it's on, why (its level, its own choice, your settings, or a stand-in while an agent is at its usage limit) and since when. It also says what the builder, the reviewer and QA would use for a new ticket, whether QA is set up, the next tickets in the queue and which approved tickets are waiting for you to ship them.

You'll see it once the factory floor shows its line, in the tickets after this one. Until then nothing looks different, in the panel or anywhere else.

Worth knowing: a model left to an agent's own choice is described as a ticket's Builder fact describes it, "its own default" for Claude Code and "default model" for Codex and Cursor. speck now also notes when a build or a review switches to a stand-in agent, so the floor can say whom it stands in for.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 251,272
- Elapsed since build started: 25 min
- Changed lines: 217 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only):
- For the line on the floor (0766): the queue's next three are by priority, as the panel's Queued group lists them, so they can include a ticket still waiting on an after: ticket; the floor may want to mark those.
- With speck run off, Needs you counts a ticket handed back to its build as waiting for you at Ship while its build is still at work on it (0595's atShip). The line puts it with the builder, and its Ship list leaves it out.
- `line` is null when working it out fails, so the floor should show the rest of a project without it.

Skipped follow-ups (already noted):
- `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…` (test/usage-limit-0622.test.mjs) failed once in this build's related run of 229 files and passed 3 times out of 3 on its own, on the base commit's files and on this branch: named already by `speck/ideas/2026-11-11-keep-speck-run-s-tests-off-your-real-agents.md` and `speck/ideas/done/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md` (ticketed as 0689).

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
    "reviewed_sha": "b2d2a6c64a7c47da19128e8f25710a8d774ae21b",
    "session": "fresh",
    "thread_id": "01a21979-17ac-7de3-8dac-3334be5ea349",
    "builder_response": "- Tests run: test/panel-line-0764.test.mjs test/usage-limit-0622.test.mjs (with the quick checks in commands.checks, which every `speck test --files` runs)\n\nRound 1. Before this round I ran `speck test --related test/panel-line-0764.test.mjs` once: 229 test files (every one naming a file this branch changes), 2358 tests, 2354 passed, 3 skipped, 1 failed. Full output: /tmp/speck-0764-related.txt.\n\nThe one failure was `0622 AC1 AC2 AC3: a build that hit the limit while speck run was off is waited out when it starts, and holds new work too` (test/usage-limit-0622.test.mjs:487), which asserts that the first build recorded after the limit resets is 0001's resume (`--resume`) and got 0002's fresh launch (`--session-id`). Both builds are started in the same speck run check after the reset, and each fake build records itself when its process starts, so under the load of 229 files at once the order can flip. It isn't caused by this change: the only change on that path is that `launch` in scripts/run.mjs passes its existing `standIn` flag to `launchPlan`, which adds `stand_in` to the run record only when the build starts on a stand-in (not in that test), and changes nothing about which builds start or when. The test passed 3 times out of 3 on the base commit's files (extracted with `git archive`) and 3 out of 3 on this branch, run on its own, and its file passes in the run attached here. 0648's notes record the same test failing on this machine for a different reason.\n\nWhat changed, for the reviewer's orientation:\n- scripts/panel-line.mjs (new, pure): `projectLine({ board, facts })` gives `work` (each ticket at the builder, reviewer or QA, with agent, agent_name, model, model_slug, effort, why, level, stands_in_for and since), `idle` (each station for a new ticket with no level; QA with `set_up`) and `queue` (`ready`, `next`). `stationOf` follows the panel's own reading of who has a ticket (0223's review_running).\n- scripts/line-facts.mjs (new): `lineFacts(repo, board, runs)` reads the settings, the providers, and for each ticket at the builder its run record (stand-in, watch agent's resume) and last round's time, for each at the reviewer its running round's record, and QA's running check. null when the settings can't be read.\n- scripts/panel-summary.mjs: `projectSummary` takes `facts` and adds `line`, with `ship` (approved tickets not back with their builder, and those shipping), `yours` worked out by the same atShip rule Needs you uses. A failure working out the line leaves `line: null` and the rest of the summary.\n- scripts/panel.mjs: the summary the front asks for (`/api/projects/own`) is worked out with `lineFacts`, when asked.\n- Stand-ins are recorded where speck starts them: `launchPlan`'s `standIn` option (scripts/ticket-builder.mjs, passed by scripts/run.mjs) adds `stand_in: { for }` to a stand-in build's run record; `reviewRound`'s `mark` (scripts/review.mjs) keeps `stand_in: { name, for }` in a stand-in round's running record (scripts/review-running.mjs, with the reader `roundStarted`).\n- scripts/level-builds.mjs: exports `agentName` and `modelName`, so the line names agents and models as the Builder fact does.\n\nOn AC4: Settings names Codex's and Cursor's default model by asking the agent for its list; the summary is worked out each time the front asks and asks no agent, so for them the line uses the Builder fact's words, \"default model\". Claude Code's blank model is \"its own default\" in all three places, and a model provider's is its default model by name. This is in the ticket's Notes.\n\nOn AC3's \"next three ids by priority\": they're in the board's priority order (fix tickets first, then priority, then id), the same order the panel lists queued tickets in, whether or not they're waiting on an after: ticket.\n\nNo visual change, so no pictures.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 250420,
      "cached_input_tokens": 191744,
      "cache_write_input_tokens": 0,
      "output_tokens": 852,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58676,
      "cached": 191744,
      "write": 0,
      "output": 852
    },
    "cost_usd": 0.1450464,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:08:43.922Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-line.mjs projectLine/stationOf resolve work, station, model, effort, provenance and timestamps; line-facts.mjs reads running records. Passing AC1 tests cover station transitions, benches, records and the real /api/projects/own endpoint."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-line.mjs idleStations uses buildsWith, reviewerSettings and qaConfig. Passing AC2 tests cover defaults, QA overrides, watch fallback, providers and whether QA is set up."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "projectLine sorts ready tickets with byPriority; panel-summary.mjs lineOf adds Ship entries using the existing atShip rule. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "runsOn and builtWith use the Builder fact's default-model wording and provider model names. The passing AC4 test compares rendered Builder facts and checks Settings' Claude wording; the ticket notes explain Codex and Cursor's generic wording."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported round run passed 196 tests with no failures and three skips. The earlier timing failure's file passed on rerun; the changed launch path adds stand-in metadata without changing launch scheduling."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The summary now identifies work at each station, its agent, model and effort, station defaults, the ready queue and tickets awaiting shipment. Tests cover the calculations and the real summary endpoint. No blocking correctness or scope issues found."
  }
}
```

</details>
