---
id: "0198"
title: "Make the slowest test files quicker"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:17:42.080Z"
approved: "2026-10-15T14:43:20.598Z"
finished: "2026-10-15T14:47:00.823Z"

---
# 0198 · Make the slowest test files quicker

**Status:** ✅ done

## Problem
speck's full suite takes about 2.5 minutes, and longer when two builds share the machine, and a build runs it 2 to 5 times plus once more at ship. A few test files take about a minute each on their own, and a full run can't end before its slowest file does. On 2026-10-15 the tests of 0176, 0175 and 0177 took 79, 67 and 59 seconds in all.

## Outcome
The five slowest test files run quicker and still check everything they did.

## Acceptance criteria
1. At the start of the build, each test file in `test/` is timed on its own (`node --test <file>`, three times, keeping the middle time), and the five slowest are listed with their times in the ticket's Notes.
2. After the change, each of those five files, timed the same way, takes at least a quarter less time than at the start, or the Delivery log says, for that file, why it can't without dropping a check. The Delivery log gives each file's time before and after.
3. Every criterion that a changed test checked is still checked: no test is removed, skipped or marked todo, and no assertion is weakened. A wait for a fixed time is replaced by waiting for what it was waiting for, with a time limit.
4. No test that passed before this change fails.

## Out of scope
- Running fewer full suites per build (0197).
- Test files outside the five slowest.
- Changing how `npm test` runs the files.

## Notes
- Asked for 2026-10-15: "Builds take too long."
- Measured 2026-10-15 (whole suite, 1,727 tests, 146 s on 16 cores): total time of each ticket's tests: 0176 79 s, 0175 67 s, 0177 59 s, 0155 39 s, 0067 36 s, 0187 36 s, 0160 35 s. The likely files are `test/build-log-0176.test.mjs`, `test/reap-0175.test.mjs`, `test/panel-0177.test.mjs`, `test/panel-0155.test.mjs`, `test/panel-0067.test.mjs`, `test/panel-0187.test.mjs` and `test/panel-0160.test.mjs`, but AC1's own timing decides.
- Checked 2026-10-15: `node --test` runs files in name order whatever order they're given in (Node v22.23.3), so starting slow files first isn't an option.
- See the "Quick tests" section of `AGENTS.md` for what makes a test slow.
- Failing before this build: none (`speck test` reused a passing result for this commit).
- Timed at the start of the build (AC1): each of the 164 files in `test/` on its own with `node --test <file>`, three times, four files at a time, on a machine busy with other builds (load around 25 on 16 cores), so the times are higher than on a quiet one. The five slowest, middle time (and the other two):
  1. `test/reap-0175.test.mjs`: 76.9 s (76.7, 78.1)
  2. `test/build-log-0176.test.mjs`: 72.6 s (71.4, 90.6)
  3. `test/panel-0177.test.mjs`: 55.7 s (55.6, 60.1)
  4. `test/ship.test.mjs`: 52.7 s (21.4, 66.1)
  5. `test/stop-0072.test.mjs`: 46.1 s (23.3, 46.1)
  Next: `test/stall-0152.test.mjs` 41.3 s. `test/panel-0155.test.mjs` (61.3, 24.6, 24.2) and `test/panel-0160.test.mjs` (48.5, 23.4, 23.2) aren't among the five by their middle times.

- Self-check: no changes. Checked that the temporary folder is still emptied after skipped, todo, failing and timed-out tests and subtests; that no test file using shipRepo changes the environment in a way that would change the repo it builds; and that the AC3 check catches a weakened assertion.
- How AC3 is checked: `test/speed-0198.test.mjs` compares each of the five files with its version in the commit the build started from (the parent of `speck(0198): start`): the same test names, every assertion line still there, and no more uses of skip, todo or only.

## In plain words
The five slowest files of speck's own tests now finish much sooner, so every build spends less time waiting for its test runs. Together they took about five minutes of test time on a busy machine and now take about two. Nothing they check has changed: the same tests and the same checks are all still there. Most of the saving came from tests that sat waiting for nothing, or that set up the same thing again and again. Some tests now also run side by side instead of one after another.

To see it, time a full test run before and after. On a busy machine a run should end sooner, since the slowest files hold up the end of every run. One file still takes about a minute, because what it checks is how speck behaves over a whole minute.

Worth keeping an eye on: running tests side by side is new in speck's test suite. If one of those tests starts failing now and then on a busy machine, that's the first place to look.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 448,583
- Elapsed since build started: 86 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
### Times before and after (AC2)
Each file timed on its own with `node --test <file>`, three times, middle time. "At the start" is the AC1 timing in the Notes. "Paired" times the commit the build started from and this build's version one after the other in each of three rounds, so both met the same load from other builds on the machine.

| File | At the start | Paired: before | Paired: after | Less than at the start |
|---|---|---|---|---|
| `test/reap-0175.test.mjs` | 76.9 s | 78.1 s | 8.7 s | 89% |
| `test/build-log-0176.test.mjs` | 72.6 s | 82.1 s | 61.9 s | 15%: see below |
| `test/panel-0177.test.mjs` | 55.7 s | 60.8 s | 26.0 s | 53% |
| `test/ship.test.mjs` | 52.7 s | 31.5 s | 13.0 s | 75% |
| `test/stop-0072.test.mjs` | 46.1 s | 22.1 s | 9.6 s | 79% |

`test/stop-0072.test.mjs` was timed again, paired, after its last change, when the machine was quieter; its other rows are from the same paired runs as the rest.

- `test/build-log-0176.test.mjs` can't lose a quarter without dropping a check: its AC3 test watches an idle `speck run` for a whole minute, since 0176 AC3 asks for "less than 5% of one core over a minute". The file can't end sooner than that minute plus starting `speck run` with 200 builds' logs, about 61 s. Its other tests, about 11 to 30 s depending on the load, now run during that minute instead of before it.

### Follow-ups
- Sharing one panel across a browser test file whose stub answers every request: tried on `test/panel-0155.test.mjs`, 25 s to 9 s, and undone since it wasn't one of the five. In the inbox: `speck/ideas/2026-10-15-share-one-panel-across-a-browser-test-file.md`.
- `speck stop` waits about 11 s, not 5, before forcing a process that ignores SIGTERM, since each of its 50 checks lists every process. In the inbox: `speck/ideas/2026-10-15-keep-speck-stop-s-five-second-wait-to-five-seconds.md`.
- `0153 AC2: a second speck ship for the same ticket refuses…` failed once in a full run and passed on speck's retry. Not changed here: covered by ticket 0207 (and `speck/ideas/done/2026-10-15-fix-the-race-in-the-0153-second-ship-test.md`).
- Known limit: a test file's kept `shipRepo()` copies are built with the environment of its first call. No file that uses it changes the environment in a way that matters today.

### What changed
- `test/reap-0175.test.mjs`: the fake test file's `timeout` case waited 60 s for an abort that had already happened, since starting its processes takes longer than its 300 ms time limit. It now ends at once when the signal has already aborted. And the 10 s time limit in `endsWhenRemoved` is a timer that's cleared once the helper ends, so it no longer keeps the file running 10 s after its last test.
- `test/build-log-0176.test.mjs`: AC3's minute runs alongside the other tests, which still run one at a time and start once AC3's `speck run` is watching, so that their work, which blocks the test process, doesn't keep AC3 from seeing it start.
- `test/panel-0177.test.mjs`: the four AC3 tests, each on a panel of its own and each waiting about 10 s for two 5 s readings, run at the same time.
- `test/ship.test.mjs` (through `test/support/speck.mjs`): `shipRepo()` builds each kind of repo once per test file and gives each call a copy, instead of building it again each time (about 0.9 s). Every other test file that uses `shipRepo()` gets quicker too.
- `test/stop-0072.test.mjs`: the test whose process ignores SIGTERM, which waits about 10 s for `speck stop` to give up asking, runs alongside the others, which run two at a time. Its `speck stop` runs without blocking the file's other tests.
- `test/support/tmp.mjs`: the per-run temporary folder is emptied after a test only once no other test of the file is still running, so tests a file runs at the same time keep their folders. A file whose tests run one at a time is emptied after each test, as before.

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
    "reviewed_sha": "e0c6dc3b132a187dc294593f2ded44465347f002",
    "thread_id": "01a14003-28e8-7052-b866-6858386a49cd",
    "seconds": 56,
    "usage": {
      "input_tokens": 447040,
      "cached_input_tokens": 384256,
      "cache_write_input_tokens": 0,
      "output_tokens": 1543,
      "reasoning_output_tokens": 90
    },
    "saved_at": "2026-10-15T14:42:46.647Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "/tmp/t0198/pass1.txt and pass23.txt contain three measurements for each of 164 files. Their medians confirm the five slowest files and times listed in the ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "/tmp/t0198/after.txt and after-0072.txt support the reported medians. Four files exceed the 25% reduction target. The Delivery log explains the fifth file's unavoidable one-minute CPU measurement, retained in test/build-log-0176.test.mjs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The diff preserves existing tests and assertions. All ten 0198 checks pass, covering assertion preservation, concurrent temporary-folder isolation, cleanup and independent ship-repository copies. Existing behavioural checks also pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The full log records 1,863 tests with one initial failure. The configured retry passes all 15 tests in ship-0153.test.mjs, including the failed test, and reports it as flaky. No unresolved failure remains."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Four slow test files now run substantially faster while preserving their checks. The fifth remains around a minute because it must measure a full minute of CPU use. The suite passed through its configured retry; one intermittent ship test needed that retry. No blocking issues found."
  }
}
```

</details>
