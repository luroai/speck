---
id: "0383"
title: "Read a reviewer's verdict after a line of prose"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-read-a-reviewer-s-verdict-after-a-line-of-prose.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:07:36.894Z"

---
# 0383 · Read a reviewer's verdict after a line of prose

**Status:** 🔨 building

## Problem
A reviewer that speck runs as a command can open its reply with a line of prose and then give an unfenced JSON verdict. Cursor on grok-4.7-high replied `I'll review ticket 0374 …{"round":1,"verdict":"approve",…}`. speck refuses such a reply with "didn't return a verdict" and records nothing, so a build can't get past review. 0374's builder recorded the verdict by hand to get through.

## Outcome
speck reads a JSON verdict that comes before, after or between prose in a reviewer's reply, and records the round.

## Acceptance criteria
1. A reviewer that speck runs as a command is Claude, Cursor or a command under `reviewer_options`. When one replies with prose before or after an unfenced JSON verdict object, or both, speck records that verdict as the round, exactly as it would the bare JSON. This holds whether the reply is its whole output or the `result` string of a JSON envelope. For example, `I'll review ticket 0374 first.{"round":1,"verdict":"approve",…}` records an approve.
2. When a reply holds more than one unfenced JSON object, speck uses the last one that has a `verdict` key. An object without a `verdict` key, such as `{"ok":true}` in the prose, is never taken as the verdict. Braces and escaped quotes inside the verdict's strings, such as code quoted in `evidence`, don't stop it being read.
3. `speck record` accepts a saved reply with prose before or after an unfenced JSON verdict in the same way.
4. Every reply speck reads today gives the same verdict as before: bare JSON, a ```` ```json ```` fence, and an envelope whose `result` is either. A reply with no JSON verdict anywhere fails with today's message, and nothing is recorded.
5. No test that passed before this change fails.

## Out of scope
- Telling the reviewer more firmly to reply with JSON only. That's a prompt change, and this ticket makes speck read the reply it gets.
- The Codex reviewer, which writes its verdict to a file against an output schema.
- 0384, which lets a review round run past the builder's 10-minute shell limit.

## Notes
- Checked 2026-10-22: `jsonIn` in `scripts/reviewers.mjs` tries only the whole text and fenced blocks, and `verdictFromOutput` applies it to an envelope's `result` too. The parser for `speck record` in `scripts/review.mjs` (near "A subagent often wraps its JSON verdict") accepts only bare JSON or a fence.
- Checked 2026-10-22: Cursor's CLI (`agent -p --mode ask --trust --output-format json --model grok-4.7-high`) printed an envelope whose `result` was two sentences of prose followed straight away by the verdict object, with no fence and no newline. Source: 0374's build log, `speck/.cache/runs/0374.log`.
- A priority 0 fix: with Cursor reviewing, no build gets past review.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
