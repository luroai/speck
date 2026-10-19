---
id: "0328"
title: "Say what became of a question the Foreman asked in its recent actions"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T09:39:37.821Z"

---
# 0328 · Say what became of a question the Foreman asked in its recent actions

**Status:** 🔍 reviewing

## Problem
Once you answer or dismiss a question the Foreman asked, `speck status` and the panel's Foreman detail still list it among the Foreman's recent actions as "The Foreman asked you for <id>: …", with nothing to say it's been dealt with. It reads as a question still waiting for you: 0322's question showed this way after it was dismissed and after 0322 shipped.

## Outcome
Each question the Foreman asked, in its recent actions, says what became of it: still waiting for you, answered, dismissed, or no longer waiting.

## Acceptance criteria
1. In `speck status`, a question the Foreman asked that you dismissed is listed in its recent actions as asked "about" its ticket (not "for"), followed by "You dismissed it" and the time you did (`YYYY-MM-DD HH:MM UTC`).
2. In `speck status`, a question you answered is listed the same way, followed by "You answered it", the time you did and your answer.
3. In `speck status`, a question that neither you answered nor dismissed, but that no longer waits for you because its ticket's status has changed since it was asked or the Foreman has done something else about the ticket since, is followed by "No longer waiting" and why, naming the ticket's status now in the first case.
4. A question still waiting for you is listed in its recent actions as asked "about" its ticket with nothing after it, and the "The Foreman asks you about …" line with how to answer or dismiss it is unchanged.
5. The panel's Foreman detail shows the same outcome for each question as `speck status` does in criteria 1–4, and the header's "Needs you" count is unchanged by any of it.

## Out of scope
- Changing which questions count as waiting for you (0318 decides that) or how you answer or dismiss one.
- The Foreman's other actions (resume, reship, fix), which keep their wording.

## Notes
- The recent actions come from `agentView` in `.speck/scripts/foreman-agent.mjs` (its `did` list), printed by `foremanLines` in `.speck/scripts/foreman.mjs` and drawn in `templates/panel.html`. Replies are read with `readReplies`/`dealtWith` in `.speck/scripts/foreman-answer.mjs`.
- Seen 2026-10-19: 0322's dismissed question still showed as "The Foreman asked you for 0322" in `speck status` after 0322 shipped.
- Decision: keep the question in the recent actions with its outcome rather than hiding it, so the history stays readable.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: an answer with no text, a reply time that can't be read and a question with no reason still read as a sentence; a question about a ticket no longer on the board says so; the panel adds no empty line for an action with no outcome.

## In plain words
When the Foreman has asked you a question, its list of recent actions now says what became of it: that you dismissed it and when, that you answered it, when and with what, or that it no longer waits for you and why (the ticket has moved on, or the Foreman has done something else about it since). A question still waiting for you shows nothing extra, and how you answer or dismiss it is the same as before. To see it, open the Foreman's detail in the panel or run speck status after answering or dismissing one of its questions. The Needs you count in the header doesn't change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up (review F1, minor): a question the Foreman asked with no reason prints an empty "Why:" before its outcome ("Why:  You answered it."). Leave out the empty "Why:" label for such a question. Delivery log only: cosmetic, and the empty label was there before this ticket.

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
    "reviewed_sha": "ae0573f5cc6694ea46ca77b94cf635be7a2da113",
    "thread_id": "01a1538a-bf80-78c3-8531-95b18afe709d",
    "seconds": 24,
    "usage": {
      "input_tokens": 98959,
      "cached_input_tokens": 56448,
      "cache_write_input_tokens": 0,
      "output_tokens": 869,
      "reasoning_output_tokens": 26
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T09:43:07.791Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "agentView in scripts/foreman-agent.mjs adds the dismissal outcome and UTC time; foremanLines uses 'about' for questions. The AC1 test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "agentView includes the answer, reply time and 'You answered it'. The AC2 test passed, with additional coverage for blank answers and unreadable times."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "agentView explains changed ticket status, subsequent Foreman actions and tickets absent from the board. All three corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The asks filter and answer/dismiss instructions remain unchanged. Waiting questions receive an empty outcome and use 'about' in foremanLines. The AC4 test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "renderForeman in templates/panel.html displays the shared outcome only when non-empty. The AC5 fake-page test passed for dismissed, answered, moved-on and waiting questions. Needs you still derives from the unchanged asks list."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "scripts/foreman.mjs",
        "issue": "When a question has no reason, its outcome follows an empty 'Why:' label, producing 'Why:  You answered it.' The edge-case test currently expects this awkward output.",
        "suggested_fix": "For question entries without a reason, omit the empty 'Why:' label before the outcome and update the edge-case assertion.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Question history now shows whether you answered or dismissed a question, or why it no longer needs attention, in both status and the panel. Waiting counts and reply controls remain unchanged. All five criteria pass; the recorded tests report 181 passes and no failures. One minor wording issue remains when a question has no reason."
  }
}
```

</details>
