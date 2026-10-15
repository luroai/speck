---
id: "0052"
title: "Show a build's log growing as it runs"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0051"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:33:06.309Z"
finished: "2026-10-09T19:49:11.076Z"

---
# 0052 · Show a build's log growing as it runs

**Status:** ✅ done

## Problem
An open log is a snapshot from the moment the ticket was opened: the ticket file changes only at a status or a review round, so the 2-second state refresh leaves the log standing still while the build prints. Reloading the page is the only way to see the newest lines, and a build's most useful output is always its last few lines.

## Outcome
An open log keeps up with the build by itself: the newest lines slide in at the bottom and older ones move up out of view, with the reader free to scroll back through what's been shown.

## Acceptance criteria
1. While a queue ticket is open, the panel asks for its log once a second, on its own timer, separate from the 2-second state poll, and stops asking as soon as the ticket is closed. A ticket that has never been opened is never asked for.
2. The open log shows only the newest lines (the 200-line tail 0051's endpoint returns), in a box with a fixed height and its own scrollbar. The box never grows, however long the build runs: as new lines arrive they appear at the bottom and the oldest lines in the box move up out of it.
3. With the box at the bottom, it stays pinned to the bottom on every update, so the newest line is always in view: the log appears to scroll itself. After the reader scrolls up, the box stays where they left it and any text they selected there stays selected; scrolling back down to the bottom makes it follow again.
4. A request that fails (the server is down) leaves the log on screen as it was and changes nothing else, and the next successful response shows the new text.
5. A log replaced by a new build of the same ticket (a shorter file) shows the new log with no lines left over from the old one, with the box at the bottom.

## Out of scope
- Stopping the requests once a build has ended, or any other guess at when to stop.
- Faster than once a second, and pushing lines over a stream rather than asking for them.
- Keeping older lines, searching them, or letting the history outgrow the box.
- The red row's 50-line exit message for a build that has exited (0045).

## Notes
- After 0051, which adds the endpoint and the open row (fixed height, own scrollbar, and the "earlier lines aren't shown" line when the file is longer than the tail).
- Checked 2026-10-09: the log is replaced, not appended, at each launch of a build for that ticket, so a second build shows a shorter file (`fs.openSync(log, 'w')` in `scripts/speck.mjs`).
- The page already replaces text in place, character by character, so a selection survives an update (`setText`, 0050). Reuse it rather than rebuilding the log block.
- "At the bottom" is judged with a small tolerance in pixels, because a scroll box's `scrollTop` rarely lands exactly on `scrollHeight - clientHeight`.
- The update re-pins by setting `scrollTop`, with no smooth animation. A short smooth scroll is the alternative if the jump looks harsh; the user hasn't asked for one.
- Fetching the whole tail again each second is a small local request, and keeps the endpoint stateless: no byte offsets, no `Range` header.
- The log's own timer and box update must be kept out of `render()`, so a state refresh doesn't restart or duplicate it.
- The 0051 test that the `.log` rule has `max-height` still holds: the rule now has both `height` and `max-height` at 24em.
- Self-check: an open ticket that has left the queue (shipped) is no longer asked for, with a test; a request still waiting when the next is due is aborted so slow answers can't pile up; the message for a failure before any log arrived now says it's trying again, since "close and open" no longer applied.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 setLogText mistakes repeated lines for a shifted tail.
Round 2 (codex): approve.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,451,368
- Elapsed since build started: 15 min
- Changed lines: 97 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Stop asking for a log once its build has ended: `speck/ideas/2026-10-09-stop-asking-for-a-log-once-its-build-has-ended.md`.
- Keep a scrolled-up reader's place as lines drop out of the tail: `speck/ideas/2026-10-09-keep-a-scrolled-up-log-reader-s-place.md`.
- Known limit: in a cut-short log made of repeated lines, which lines dropped out is ambiguous, so a selection may stay on an identical neighbouring line.

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
    "reviewed_sha": "e968dcd497a09cd2cd718b53b62d7b25e7397eaa",
    "thread_id": "01a1222f-12a7-72c3-aff9-ca912a3f7c94",
    "seconds": 27,
    "usage": {
      "input_tokens": 225859,
      "cached_input_tokens": 148352,
      "cache_write_input_tokens": 0,
      "output_tokens": 891,
      "reasoning_output_tokens": 79
    },
    "saved_at": "2026-10-09T19:41:40.070Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: toggleLog, startLogTimer and logTick implement independent one-second polling. AC1 tests cover unopened, closed and departed tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .log CSS fixes height at 24em with overflow-y:auto. AC2 tests and the supplied passing browser test exercise tail updates and constant height."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "showLog implements bottom following, but setLogText deletes retained text for repeated lines, even on an unchanged response. Existing selection tests use unique numbered lines and miss this case."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "loadLog preserves the existing log on failure. Both AC4 tests exercise failure and subsequent recovery."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "replaced and showLog reset shorter replacement logs to the bottom. AC5 tests cover truncated, different and empty replacement logs."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:645",
        "issue": "setLogText mistakes repeated lines for a shifted tail. Verified with an unchanged 'working\\nworking' response: it deletes the first eight characters and appends them again. A browser selection in the first line consequently collapses, although that line has not left the tail. Similar ambiguity occurs when repeated lines are appended.",
        "suggested_fix": "Return immediately for identical text and handle ordinary prefix growth before attempting tail overlap detection. Add browser selection tests with repeated lines for unchanged responses and appended output.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The update otherwise describes the implementation accurately, but its selection-preservation promise is violated by F1."
    },
    "escalation_question": "",
    "summary": "The log updates automatically in a fixed scrolling box, follows the latest output and recovers from failed requests. However, repeated output can erase the reader's selection even when nothing changed. Fix that selection bug before merging."
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
    "reviewed_sha": "8a430945a83126750dd437a58d8d9d3a59ba87b4",
    "thread_id": "01a1222f-12a7-72c3-aff9-ca912a3f7c94",
    "seconds": 19,
    "usage": {
      "input_tokens": 451000,
      "cached_input_tokens": 336640,
      "cache_write_input_tokens": 0,
      "output_tokens": 1402,
      "reasoning_output_tokens": 79
    },
    "saved_at": "2026-10-09T19:43:52.898Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: toggleLog, startLogTimer and logTick provide independent one-second polling and stop requests for closed or departed tickets. Passing AC1 tests exercise these behaviours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: .log has fixed height and its own scrollbar; showLog updates the existing box. Passing AC2 and browser tests verify constant height and the 200-line tail."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "showLog and atBottom implement following with an eight-pixel tolerance. setLogText now preserves unchanged text and appends prefix growth without deletion. Passing browser tests cover selection during tail updates and repeated unchanged or growing output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "loadLog retains existing content on failure and accepts the next successful response. Both passing AC4 tests exercise failure and recovery."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "replaced and showLog replace shorter logs and reset scrolling to the bottom. Passing AC5 tests cover truncated, different and empty replacement logs."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:645",
        "issue": "Repeated unchanged or appended lines previously caused retained text to be deleted, destroying selections. The prefix-growth check now prevents those deletions, and the new browser regression test exercises both cases.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living spec accurately describes polling, fixed-height display, scrolling, selection preservation, failure recovery and replacement logs."
    },
    "escalation_question": "",
    "summary": "Approved. Open logs update automatically, follow new output while allowing readers to scroll back, recover from failures and reset for a new build. The selection bug is fixed and covered by a browser regression test. All 426 supplied tests passed."
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
    "reviewed_sha": "90e9b6aeb219642f4d411ba8c0cbaad14b847b7f",
    "thread_id": "01a1222f-12a7-72c3-aff9-ca912a3f7c94",
    "seconds": 18,
    "usage": {
      "input_tokens": 770251,
      "cached_input_tokens": 608640,
      "cache_write_input_tokens": 0,
      "output_tokens": 1965,
      "reasoning_output_tokens": 79
    },
    "saved_at": "2026-10-09T19:47:43.701Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: toggleLog, startLogTimer and logTick retain independent one-second polling. Passing test/panel-0052.test.mjs AC1 tests cover unopened, closed and departed tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .log rule retains fixed height and overflow-y:auto; showLog updates the existing box with the endpoint's tail. Passing AC2 and browser tests verify tail content and constant height."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "atBottom, showLog and setLogText retain bottom following, scroll preservation and selection-preserving updates. Passing AC3 tests include browser coverage of rolling tails and repeated unchanged or growing lines."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "loadLog preserves the existing log on failure and updates it on recovery. Both AC4 failure-and-recovery tests pass after the merge."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "replaced and showLog reset shorter replacement logs to the bottom. AC5 tests and browser replacement coverage pass after the merge."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:672",
        "issue": "The earlier repeated-line selection bug remains fixed: identical responses cause no mutation, and prefix growth only appends text. The browser regression test passes after the merge.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The conflict resolution preserves both live-log behaviour and main's worktree-path behaviour. queueItem shows the path only in open in-flight rows and still registers their log boxes. Follow-up ideas record deferred work without implementing it."
    },
    "escalation_question": "",
    "summary": "Approved after the merge. Live logs still meet all five criteria, and worktree paths remain visible only in open rows as main intended. The selection fix remains intact. The supplied post-merge suite reports 435 passing tests, with no failures or skips."
  }
}
```

</details>
