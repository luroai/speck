---
id: "0682"
title: "Keep an idle speck run from re-reading every ticket"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0680"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:50:32.767Z"

---
# 0682 · Keep an idle speck run from re-reading every ticket

**Status:** 🔍 reviewing

## Problem
Every 5 seconds `speck run` reads and checks every ticket in the project again, done ones included (about 680 here), and more than once within a check. Its cost grows with the project's history: this repo's run used 4 minutes 49 seconds of processor time in its first 14 minutes with two builds going, a third of one core, on a machine where tests already fail under load.

## Outcome
A check by `speck run` reads only the tickets that have changed since its last check.

## Acceptance criteria
1. When no ticket file has changed since `speck run`'s last check, the next check reads and parses no ticket file. A ticket file that has changed, appeared or gone, in the main checkout or in a build's worktree, is read on the next check.
2. Within one check, each ticket file is read at most once, however many of the check's steps need the tickets.
3. Everything `speck run` does, it does on the same check as today: a ticket set ready is started, a build that has ended is taken up, an approved ticket is shipped, and a change to `speck/config.yml` or this machine's settings takes effect, each on the first check after it.
4. No test that passed before this change fails.

## Out of scope
- How often `speck run` checks.
- `speck status` and the panel, which keep giving the answers they give today.

## Notes
- Checked 2026-11-15 with `ps` on this repo's `speck run`, 14 minutes after it started.
- `tick` and `readTickets` in `scripts/run.mjs` call `statusData` in `scripts/speck.mjs`, which reads and parses every ticket and runs the ready check on each. Other steps of the same check call it again for one ticket's status.
- Test it by counting reads, not by timing: timing tests in this suite have failed under load before.
- What a ticket's status entry says can also depend on its run record, its branch and the time, which aren't ticket files. Those are still worked out on each check.
- Failing before this build: none
- Self-check: no changes. Checked a file that can't be parsed (cached with its error until it changes, test added), a step changing the ticket it was given (each caller gets its own copy, test added), a rewrite of the same size straight after (nanosecond times and the change time, test added), and a ticket moved to done/.

## In plain words
speck run no longer reads every ticket again each time it looks at the board. It reads a ticket only when its file has changed, so an idle speck run uses less of the machine as the project's history grows. Nothing it does has changed: a ticket you set ready still starts on the next look, and a change to the settings still takes effect straight away. To see it, watch speck run's processor use with `top` while nothing is building: it should be lower than before. Keep an eye on it: speck run still reads every build's log and asks git about each ticket on every look, which is now most of what an idle run costs.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - To the inbox: speck/ideas/2026-11-15-keep-speck-run-s-checks-from-re-reading-build-logs.md (a board still costs about 1.7 s of processor time on this repo, mostly build logs and git).
  - Known limit: a ticket rewritten so that its size, inode and both of its times to the nanosecond are unchanged would be missed until it next changes. Only a filesystem with coarse times could do that.

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
    "reviewed_sha": "ddbe618c428880e957e0368c6627ae86b2d41f6b",
    "session": "fresh",
    "thread_id": "01a1dfbb-11ac-7353-9ecb-e62c12be2b38",
    "builder_response": "- Tests run: test/run-reads-0682.test.mjs test/full-suite-0630.test.mjs test/house-rules-full-0657.test.mjs (the attached output). Before it, `speck test --related test/run-reads-0682.test.mjs` ran 182 related files (1970 tests): 1965 passed, 2 failed, both under a load average of 42–52: `0630 AC3: a full run doesn't wait for the max_parallel_tests turns…` (\"it didn't wait for the held turn\") and `0657 AC3: 13 px text…` (took 95 s). Neither reads tickets. Re-run with this ticket's file, both pass.\n- The change: listTickets and findTicket in scripts/core.mjs read each ticket through readTicket, which keeps each file's parse by path, keyed on its stat (dev, inode, size, mtime and ctime to the nanosecond). A file whose stat hasn't changed isn't read or parsed again; a parse error is kept and thrown again in the same way. Each caller gets a fresh top-level copy, so a step that sets t.raw or t.file doesn't change what the next one reads. statusData, ticketShown, findTicket and every other caller in a check go through these two, so each changed file is read once per check, in the main checkout or a build's worktree.\n- Config, machine settings, run records, branches and git history aren't cached: they're worked out on every check, as the ticket's Notes say.\n- No visual change, so no pictures.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 139319,
      "cached_input_tokens": 95360,
      "cache_write_input_tokens": 0,
      "output_tokens": 1073,
      "reasoning_output_tokens": 99
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 43959,
      "cached": 95360,
      "write": 0,
      "output": 1073
    },
    "cost_usd": 0.108184,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:02:59.361Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/core.mjs readTicket clears the entire cache at 10,000 entries. With 10,001 ticket files, repeated checks in sorted order reread every unchanged ticket. The passing AC1 tests in test/run-reads-0682.test.mjs cover small repositories only."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing AC2 test covers repeated callers with two files. At more than 10,000 files, readTicket's cache clearing allows subsequent statusData calls within the same check to reread the same files."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The new AC3 integration test passes for ready tickets and config changes. scripts/run.mjs tick retains its existing scheduling; statusData still reloads configuration and recomputes run and branch information. Existing test/run-0047.test.mjs and test/run-0193.test.mjs exercise ended builds and shipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported round results: 166 passed, zero failed, three skipped. Both failures from the earlier related run passed on rerun. No existing tests were modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "readTicket clears all cached parses when the cache reaches 10,000 entries. A repository with 10,001 tickets consequently rereads every ticket on every check, including repeated board reads within one check. Historical and removed paths also count towards this limit. This defeats the acceptance criteria as project history grows.",
        "suggested_fix": "Retain cache entries for all current ticket files without wholesale eviction. If removing stale entries is needed, prune paths that have disappeared. Add a read-count regression covering more than 10,000 files and repeated callers.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change avoids repeated reads in ordinary repositories, and the reported tests pass. However, its cache limit makes large repositories repeatedly read all their tickets again. Fix that limit before approval."
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
    "reviewed_sha": "31108e9be38f22005fa722237bf79fda6e6ff24b",
    "session": "continued",
    "thread_id": "01a1dfbb-11ac-7353-9ecb-e62c12be2b38",
    "builder_response": "- Tests run: test/run-reads-0682.test.mjs (with commands.checks).\n- F1: fixed. readTicket in scripts/core.mjs no longer clears the cache. Only parses of files that have gone are dropped: listTickets drops those in the folders it lists (speck/tickets/ and speck/tickets/done/) that aren't there any more, readTicket drops one whose stat fails, and the rest (such as a removed worktree's) are swept, by checking each still exists, once the map has grown by 1000 entries since it was last swept, so live entries are never dropped. New test `0682 AC1 and AC2 (round 1 F1)`: 10,501 ticket files, listed four times, read once; then 1,500 moved to speck/tickets/ (read once each) and removed, after which repeated lists read nothing. It fails without the fix.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 234211,
      "cached_input_tokens": 185600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1657,
      "reasoning_output_tokens": 99
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4652,
      "cached": 90240,
      "write": 0,
      "output": 584
    },
    "cost_usd": 0.024168,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:05:24.558Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs readTicket retains unchanged parses using file metadata; listTickets discovers additions, removals and moves. Passing AC1 tests cover main-checkout and worktree changes, parse errors and unchanged files. The new 10,501-file regression confirms live entries survive cache maintenance."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "listTickets and findTicket share readTicket's cache. Passing AC2 tests exercise repeated statusData, ticketShown, listTickets and findTicket calls. The new large-repository regression verifies repeated lists cause no additional reads."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 integration test exercises starting newly ready tickets after idle checks and applying changed configuration. run.mjs scheduling remains unchanged; statusData still reloads configuration and recomputes runtime information. Existing run-0047 and run-0193 tests cover ended builds and shipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Round 2 reports 151 passed, zero failed and three skipped, including all eight ticket tests. Existing tests were not weakened. Previously reported failures passed on the round 1 rerun."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/core.mjs",
        "issue": "The previous wholesale cache eviction caused unchanged tickets to be reread once the cache reached 10,000 entries.",
        "suggested_fix": "Implemented: retain live entries and prune missing paths. A passing 10,501-file regression covers repeated reads, moves and removals.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Unchanged tickets now keep their cached results even in large repositories. Changed tickets are picked up promptly, and scheduling remains unchanged. The earlier cache-limit problem is fixed, all reported checks pass, and no blocking concerns remain."
  }
}
```

</details>
