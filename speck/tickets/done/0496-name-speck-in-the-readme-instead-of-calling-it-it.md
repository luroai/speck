---
id: "0496"
title: "Name speck in the README instead of calling it It"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T10:19:06.105Z"
approved: "2026-10-25T10:20:25.301Z"
finished: "2026-10-25T10:23:54.422Z"

---
# 0496 · Name speck in the README instead of calling it It

**Status:** ✅ done

## Problem
The README keeps calling speck "It": "It isn't only code", "It raises its own fix tickets", "It asks, then moves on" and so on. A first-time reader loses track of who is doing the work, and the pitch reads flatter than it should.

## Outcome
Wherever the README says what speck does, it names speck, and where an agent does the work it says speck has your agent do it.

## Acceptance criteria
1. No sentence and no bold label in `README.md` starts with "It" or "It's" standing for speck. Each names speck instead, for example "speck raises its own fix tickets" in The clever bits. (checked by review)
2. Where the README says an agent or a build does something on speck's behalf, the sentence makes speck the one behind it, for example "If `main` breaks, speck has the build that finds it write a priority-0 fix ticket". (checked by review)
3. A sentence that starts with "It" standing for something else, such as the panel or the `init` command, names that thing instead. (checked by review)
4. Each changed sentence keeps its meaning and facts, and no section is added or removed. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- The "It fits the way you really work, in bursts" paragraph and the "speck was built by a product manager" line: 0497 rewrites them.
- The status line and the "Built with speck" figures: 0452.
- `docs/brief.md` and the other docs.

## Notes
- Write speck in lower case, as the rest of the README does, even at the start of a sentence or bold label.
- Present tense, as the README uses elsewhere ("speck raises", not "speck will raise").
- Repeating "speck" down The clever bits is fine: the user asked for speck to be named each time.
- Sentences it covers today: "It isn't only code." (opening), every bullet of The clever bits except "Ideas only become tickets in conversation" (including "It fits in your pocket"), "It runs on your machine" (The panel) and "It sets up `speck/`" (Without an agent).
- Asked for by the user on 2026-10-25.
- Failing before this build: none
- No new tests: criteria 1–4 are about how the README reads and end with (checked by review); criterion 5 is checked by running every existing test file that names the README (`speck test --related`). A reviewer can check the rest by reading the README diff.
- Self-check: no changes. The status line's "It works end to end" is left as it is, as 0452 owns the status line.
- Pictures: none, because the change is wording only and doesn't change how anything looks.

## In plain words
The README now names speck wherever it used to say "It", so a first-time reader can tell who is doing the work: "speck raises its own fix tickets", "speck has the build that finds it write a fix ticket" and so on. Where "It" meant the panel or the setup command, the sentence now names those instead. Read the opening, The clever bits, The panel and Without an agent to see it. The status line and the "in bursts" paragraph still start with "It": other tickets rewrite those.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 51,440
- Elapsed since build started: 1 min
- Changed lines: 22 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "32c38dac656417cdb46f2792d7cc7f56d9b00a7b",
    "session": "fresh",
    "thread_id": "01a17293-0edc-7642-b4d3-bfe258deae85",
    "builder_response": "- Tests run (speck test --related README.md, every existing test file that names the README, plus the repo checks): test/docs-0491.test.mjs test/install-0253.test.mjs test/readme-0089.test.mjs test/readme-0249.test.mjs test/readme-0250.test.mjs test/readme-links-0491.test.mjs test/release-0092.test.mjs test/release-0106.test.mjs test/release-0210.test.mjs test/release-0226.test.mjs test/release-0236.test.mjs test/release-0243.test.mjs test/release-0248.test.mjs test/release-0254.test.mjs test/release-0282.test.mjs test/release-0297.test.mjs test/release-0298.test.mjs test/release-0307.test.mjs test/release-0329.test.mjs test/release-0336.test.mjs test/release-0339.test.mjs test/release-0343.test.mjs test/release-0346.test.mjs test/release-0360.test.mjs test/release-0367.test.mjs test/release-0375.test.mjs test/release-0380.test.mjs test/release-0394.test.mjs test/repo-speck-0122.test.mjs test/retry-0228.test.mjs test/setup-0107.test.mjs \n- Criteria 1–4 are checked by review, so this ticket adds no tests. Criterion 5 is covered by the run above (0 failures).\n- Left as they are on purpose: the status line's \"It works end to end\" (0452 owns the status line) and the \"It fits the way you really work, in bursts\" paragraph (0497), both out of scope.\n",
    "seconds": 16,
    "usage": {
      "input_tokens": 50879,
      "cached_input_tokens": 20352,
      "cache_write_input_tokens": 0,
      "output_tokens": 561,
      "reasoning_output_tokens": 27
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T10:20:18.326Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md opening now says “speck isn't only for code”; all applicable bold labels in The clever bits name speck. The two remaining speck-related “It” openings are explicitly out of scope."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md opening says “speck has your agent do it”. The clever bits explicitly attributes fix tickets, follow-ups, stopping for questions, investigating stops and merging conflicts to speck directing its build or agent."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md The panel says “The panel runs on your machine”; Without an agent says “The `init` command sets up `speck/`”."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The README.md diff preserves the changed sentences' facts and meaning, adds or removes no sections, and leaves the explicitly excluded passages unchanged. Only README.md and the ticket's build records changed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0496-tests.txt confirms 356 tests: 353 passed, 3 skipped and 0 failed. No tests or executable code changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now names speck and explains when it directs an agent or build. The wording preserves the original meaning and respects the excluded passages. The relevant tests passed; no blocking concerns found."
  }
}
```

</details>
