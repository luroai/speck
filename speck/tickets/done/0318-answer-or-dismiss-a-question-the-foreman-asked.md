---
id: "0318"
title: "Answer or dismiss a question the Foreman asked"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0317"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:45:08.195Z"
approved: "2026-10-19T05:54:40.460Z"
finished: "2026-10-19T05:58:17.643Z"

---
# 0318 · Answer or dismiss a question the Foreman asked

**Status:** ✅ done

## Problem
When the Foreman agent (0287) asks you a question about a stuck ticket, the question waits until the ticket's status changes. There's no way to answer it, or to say it doesn't matter, from the panel or the command line.

## Outcome
You can answer or dismiss a question the Foreman asked, from the panel or the command line.

## Acceptance criteria
1. A question the Foreman asked shows in its detail, and on the ticket's card, with an Answer box and a Dismiss button.
2. Answering resumes the stuck work with your answer, as the Foreman would with its own instruction (resuming the build, or re-running the ship), records your answer in the ticket's Notes and clears the question.
3. Dismissing clears the question, records that you dismissed it, and leaves the ticket as it is.
4. `speck foreman answer <id> "<text>"` and `speck foreman dismiss <id>` do the same from the command line.
5. A question can be answered or dismissed only once. A second try says it's already been dealt with.

## Out of scope
- Blocked questions from builds, which 0284's button and 0286 handle.

## Notes
- From `speck/ideas/2026-10-18-answer-or-dismiss-the-foreman-s-question.md` (inbox, from 0287). The Foreman's agent is in `scripts/foreman-fix.mjs` and the `speck-foreman` skill.
- Failing before this build: none
- Self-check: an answer starting with -- on the command line is kept rather than dropped, and a question whose record has no time is refused rather than left answerable for ever.

## In plain words
When the Foreman gets stuck and asks you a question, you can now reply to it straight away. The question shows on the ticket's card and in the Foreman's detail, with a box to type your answer and Answer and Dismiss buttons. The same works from the command line. An answer is written into the ticket and speck picks the work up again with it: it carries the build on, or tries an approved ticket's ship again. Dismissing it just notes that you did and leaves the ticket alone. Each question can be dealt with once: a second try says it already has been.

To see it, open the Foreman's detail or the ticket's card while the Foreman has a question waiting. Worth knowing: an answer is carried out only while speck run is on, and only if the ticket hasn't moved on since you answered.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A queued user answer can resume work after the ticket has moved on.; F2 The new documentation test requires the exact prose '`speck foreman answer` and `speck foreman dismiss` are the user's'.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 625,136
- Elapsed since build started: 10 min
- Changed lines: 280 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limits: an answer waits for speck run's next check, so with speck run off nothing happens until it's turned on. A reply interrupted between being taken and being noted (the process killed in that moment) leaves its question counted as dealt with, without a note.
- No follow-ups went to the inbox.

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
    "reviewed_sha": "9804a87d2038d0ceb38045897c4ae3a887ce90cf",
    "thread_id": "01a152b8-ab75-7c42-8bbf-0449b77b49b4",
    "seconds": 28,
    "usage": {
      "input_tokens": 238086,
      "cached_input_tokens": 170368,
      "cache_write_input_tokens": 0,
      "output_tokens": 1083,
      "reasoning_output_tokens": 93
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:53:44.266Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAskBox and queueItem in templates/panel.html display both controls; passing AC1 tests cover the card and Foreman detail."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 tests cover recording, clearing, resuming and reshipping, but foremanAgentQueue.check loses the status guard when a resume waits for capacity."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanReply records dismissal and agentView hides the question. The passing AC3 test checks unchanged status and no resumed work."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdForemanReply routes both commands through foremanReply; passing CLI tests exercise answer, dismiss and answers beginning with --."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "foremanReply exclusively creates a claim file and checks completed replies. Passing AC5 tests cover repeated replies and an existing concurrent claim."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs:268",
        "issue": "A queued user answer can resume work after the ticket has moved on. When build capacity is full, check stores the resume without its expected status and marks the answer consumed. Subsequent checks skip the original status validation and resume it whenever capacity becomes available, including after the ticket becomes approved or blocked.",
        "suggested_fix": "Keep the expected status with queued user resumes and validate it immediately before starting the build. Drop stale resumes with an explanation. Add a test that queues an answer while capacity is full, changes the ticket's status, then frees capacity.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/foreman-answer-0318.test.mjs:265",
        "issue": "The new documentation test requires the exact prose '`speck foreman answer` and `speck foreman dismiss` are the user's'. This fails on harmless rewording or reordering and violates the explicit prohibition on exact-wording document tests.",
        "suggested_fix": "Check the two command names independently. Keep the existing behavioural test that verifies the Foreman cannot answer or dismiss its own question.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Answering and dismissing work through the panel and command line in the tested cases. Before merge, fix a waiting answer that can restart work after its ticket has moved on, and remove a test's dependency on exact documentation wording."
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
    "reviewed_sha": "c8f79211b54d6099f2de008729fb366dab2db916",
    "thread_id": "01a152b8-ab75-7c42-8bbf-0449b77b49b4",
    "seconds": 17,
    "usage": {
      "input_tokens": 384171,
      "cached_input_tokens": 307712,
      "cache_write_input_tokens": 0,
      "output_tokens": 1796,
      "reasoning_output_tokens": 93
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T05:54:30.251Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html renders foremanAskBox on ticket cards and in renderForeman. Passing AC1 tests check the question, Answer box and Dismiss button in both places."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanReply records answers and clears questions; foremanAgentQueue.check resumes builds or requests reshipping. Passing AC2 tests cover both paths and now verify that answers waiting for capacity are dropped when the ticket moves on."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanReply records dismissal without changing status; agentView hides the question. The passing AC3 test verifies no build resumes or ship requests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdForemanReply uses the same foremanReply implementation as the panel. Passing CLI tests exercise answering, dismissing and answers beginning with --."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Exclusive claim-file creation and completed-reply checks prevent repeated handling. Passing AC5 tests cover all answer/dismiss combinations and an existing concurrent claim."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs:268",
        "issue": "Queued user answers previously lost their status guard while waiting for build capacity.",
        "suggested_fix": "Implemented: queued resumes retain the expected status and each check removes stale entries before starting builds. The new passing regression test covers waiting, status changes and permanent removal.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/foreman-answer-0318.test.mjs:279",
        "issue": "The documentation test previously depended on exact prose in the Foreman skill.",
        "suggested_fix": "Implemented: the test checks each command name independently; the behavioural test still verifies that the Foreman cannot reply to itself.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "All five criteria are met, and both previous findings are resolved. Users can answer or dismiss Foreman questions from the panel or command line, with replies recorded once. Waiting answers are safely discarded if the ticket moves on. The reported tests have no failures."
  }
}
```

</details>
