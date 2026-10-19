---
id: "0318"
title: "Answer or dismiss a question the Foreman asked"                # one outcome, no "and"
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
after: ["0317"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:45:08.195Z"

---
# 0318 · Answer or dismiss a question the Foreman asked

**Status:** 🔍 reviewing

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

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
