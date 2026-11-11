---
id: "0629"
title: "Auto-ship only rounds that speck's own reviewer run recorded"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:03:18.551Z"
approved: "2026-11-11T10:13:49.342Z"

---
# 0629 · Auto-ship only rounds that speck's own reviewer run recorded

**Status:** 👍 approved

## Problem
Auto-ship merges and pushes a ticket because its ticket file says the reviewer approved it, and the builder writes that file: it can record a verdict with `speck record` or edit its `## Review rounds` by hand. So "no agent approves its own work" holds only while the builder follows its skill, and a ticket that ships by itself has no proof that speck's own reviewer run approved it.

## Outcome
A ticket ships by itself only when its approving round was recorded by speck's own run of the reviewer, unchanged since; anything else waits for you at Ship.

## Acceptance criteria
1. When `speck review` records a round for any reviewer speck runs itself (Codex, Claude, Cursor, a model provider or a command reviewer), it also keeps a receipt for that round in the main checkout's `speck/.cache/`, outside anything the ticket's branch carries, and a ticket approved this way ships with `speck ship <id> --auto` as it does today.
2. `speck ship <id> --auto` refuses, changing nothing and saying why in one line, when the ticket's latest round has no receipt that matches it (its round number, reviewed commit and verdict): a round saved with `speck record`, or one whose record in the ticket was edited after `speck review` saved it. `speck run`'s ship queue then leaves the ticket approved and waiting for you at Ship, with that reason, as it does for any ticket auto-ship doesn't cover.
3. `speck status --json` gives that reason as the ticket's reason not to ship by itself, so the panel shows it waiting for you and why.
4. `speck ship <id>` started by you ships such a ticket as before, and its review pack (`speck pack <id>`, and `--plain`) says which rounds have no matching receipt.
5. No test that passed before this change fails.

## Out of scope
- Sandboxing the builder: a builder that writes a receipt file itself isn't stopped. This closes the paths the skills and the ticket file offer, not a builder set on forging one.
- Reading a ticket's risk from the base branch rather than its branch.
- Any change to how `speck record` saves a round for the `claude-subagent` reviewer, apart from leaving no receipt.

## Notes
- Raised in the 2026-11-10 repo analysis: `speck record` (`scripts/review.mjs` `cmdRecord`) saves any verdict file it's given, and `shipChecks`/`autoShipWhyNot` in `scripts/ship.mjs` trust the ticket's rounds.
- Rounds are saved by `saveRound` in `scripts/review.mjs`, called from the Codex path in `scripts/review.mjs` and from `scripts/reviewers.mjs` for the others.
- Receipts belong in the shared cache every worktree sees (as `sharedCacheDir` in `scripts/results.mjs` uses), not `cacheDir`, which is per checkout.
- With `reviewer: claude-subagent`, every round is saved with `speck record`, so those tickets always wait for you at Ship. This repo reviews with Codex, so it isn't affected.
- Risk high: it changes when code merges and pushes to the base branch without you.
- Failing before this build: none
- Self-check: a receipt that can't be written now says so in one line instead of a stack trace (the round stays saved and the ticket waits at Ship); the build skill's Private words steps and the brief now say an edited latest round waits for you.
- The test fixtures that approve with `speck record` and then auto-ship keep a receipt with `test/support/receipts.mjs`, as `speck review` would.

## In plain words
A ticket now ships by itself only when speck itself ran the reviewer for its approving round, and nobody has changed that round's record since. speck keeps a private receipt for each round it runs, outside the ticket's branch, and checks it before shipping on its own. Anything else stays approved and waits for you to press Ship, and the panel says why.

To see it: the review pack says when a round has no matching receipt, and a ticket waiting for that reason shows it as its reason not to ship by itself.

Worth watching: tickets approved before this change have no receipts, so they'll wait for you at Ship once. Tickets reviewed by a Claude subagent always wait for you, and so does a ticket whose latest review round was reworded to take out a private word.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Receipt lookups call sharedCacheDir, which creates directories and may throw.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 239,753
- Elapsed since build started: 11 min
- Changed lines: 96 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): keep auto-ship after a private-words fix rewords the latest round (`speck/ideas/2026-11-11-keep-auto-ship-after-a-private-words-fix.md`).
- Known limit: tickets approved before this change have no receipts, so each waits for you at Ship once.

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
    "reviewed_sha": "970a6f6e136627fdf87ffcd005edf78241aa691a",
    "session": "fresh",
    "thread_id": "01a1ca17-a3de-7ad1-8d52-d10defa4d270",
    "builder_response": "- Tests run: `speck test --related test/receipts-0629.test.mjs test/ship.test.mjs test/worktrees.test.mjs` (the ticket's own file, the two existing test files it changed, and every existing test file naming a changed file), plus the commands.checks files.\n- Design: `scripts/receipts.mjs` keeps a receipt per round in the main checkout's `speck/.cache/receipts/<id>/<round>.json` (via `sharedCacheDir`), holding the round number, reviewed commit, verdict and a sha256 of the round's record as read back from the ticket after saving. `saveRound` takes `{ receipt: true }` only from the Codex path and the command path in `scripts/reviewers.mjs` (Claude, Cursor, providers and `command` reviewers); `speck record` passes nothing, so keeps no receipt.\n- `autoShipWhyNot` gains a last `receipt` argument (a reason or a function giving it, read only when nothing else stops the ticket), used by `speck ship --auto` (`autoShipBlocker`) and `speck status --json` (`auto_ship`/`auto_ship_why`; the ship queue reads `auto_ship`). Done and cancelled tickets skip the check in status.\n- `speck pack` and `--plain` list the rounds with no matching receipt.\n- Existing fixtures that approve with `speck record` and then auto-ship (test/support/ship.mjs, test/support/speck.mjs, test/ship.test.mjs, test/worktrees.test.mjs) now keep a receipt with `test/support/receipts.mjs`, as `speck review` would; no assertion was changed.\n- Docs: docs/brief.md and the build skill (section 5 step 3, and Private words step 3, where a hand-edited latest round now waits for the user) say so.\n- Known consequence: tickets approved before this change have no receipts, so they wait for the user at Ship.\n",
    "seconds": 44,
    "usage": {
      "input_tokens": 144524,
      "cached_input_tokens": 102912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1027,
      "reasoning_output_tokens": 166
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41612,
      "cached": 102912,
      "write": 0,
      "output": 1027
    },
    "cost_usd": 0.1037852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T10:12:32.953Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound creates receipts for the Codex and runCommandReview paths. Passing 0629 AC1 tests cover receipt creation and automatic shipping."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Normal missing and edited receipt tests pass, but receiptWhyNot calls receiptsDir outside error handling. A cache directory creation failure throws instead of returning the promised one-line refusal."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "statusData calls receiptWhyNot; failure to create the receipts directory aborts status instead of supplying auto_ship_why. The passing AC3 test covers only a missing receipt file."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Normal manual shipping and both pack formats pass their AC4 test. However, unreceiptedRounds also creates the cache directory without catching errors, so both packs fail when that directory cannot be created."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the recorded test output: 2,955 passed, zero failed and three skipped. No regression is evident in the changed assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/receipts.mjs:38",
        "issue": "Receipt lookups call sharedCacheDir, which creates directories and may throw. For example, a regular file at speck/.cache/receipts prevents creation of the ticket folder. keepReceipt catches this and promises manual shipping, but subsequent status, pack and automatic shipping checks throw on the same directory error. The existing failure test blocks only the receipt JSON file, so misses this case.",
        "suggested_fix": "Make receipt lookups tolerate unavailable cache directories and treat them as unmatched receipts, preferably without creating directories during reads. Add a regression covering a blocked receipts directory through review, status, both pack formats and the automatic shipping refusal.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The receipt checks work on normal paths and the recorded tests pass. One error-handling gap remains: when the receipt folder cannot be created, status and review packs fail instead of explaining that the ticket needs manual shipping."
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
    "reviewed_sha": "8183b7cde96f2ac61883d6467d8f8eadec44b593",
    "session": "continued",
    "thread_id": "01a1ca17-a3de-7ad1-8d52-d10defa4d270",
    "builder_response": "- Tests run: test/receipts-0629.test.mjs test/ship.test.mjs test/worktrees.test.mjs, plus the commands.checks files.\n- F1: fixed. Receipt lookups (`unreceiptedRounds`, `receiptWhyNot`) now use `readDir` in scripts/receipts.mjs, which works out the main checkout's `speck/.cache/receipts/<id>` path without creating anything; any receipt that can't be read counts as unmatched (`matches` already caught read errors). Only `keepReceipt` creates the folder, inside its try. New test \"0629 round 1 F1\" puts a regular file at `speck/.cache/receipts`, then checks review (one-line warning, round saved), `speck status --json` (auto_ship false, the reason), both pack formats (the unreceipted round named), and `speck ship --auto` (exit 12, one line, nothing changed), and that reading created nothing.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 238189,
      "cached_input_tokens": 190208,
      "cache_write_input_tokens": 0,
      "output_tokens": 1564,
      "reasoning_output_tokens": 166
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6369,
      "cached": 87296,
      "write": 0,
      "output": 537
    },
    "cost_usd": 0.0268376,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T10:13:33.034Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveRound keeps receipts for the Codex and runCommandReview paths using the shared main-checkout cache. Passing AC1 tests cover receipt creation and successful automatic shipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "receiptWhyNot checks the latest round's number, reviewed commit, verdict and record digest. Passing AC2 tests cover recorded and edited rounds, unchanged branches on refusal, one-line reasons and ship-queue exclusion. The F1 regression also covers an unavailable receipts directory."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData supplies receiptWhyNot to autoShipWhyNot. Passing AC3 and F1 tests verify auto_ship false and the explanatory auto_ship_why, including when the receipts directory is blocked."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both pack formats use unreceiptedRounds. The passing AC4 test verifies missing-round notices and successful manual shipping; the F1 test verifies both packs still work with a blocked receipts directory."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded round-two results show 167 passed, zero failed and three skipped. The broader round-one run also had zero failures; the subsequent changes are confined to the receipt lookup fix and its regression coverage."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/receipts.mjs",
        "issue": "Receipt lookups previously tried to create cache directories and could abort status, review packs and automatic shipping checks when directory creation failed.",
        "suggested_fix": "Implemented: readDir resolves the shared receipt path without writing, and matches treats unreadable receipts as unmatched. The passing F1 regression exercises the blocked-directory case across review, status, both packs and automatic shipping.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Automatic shipping now requires an unchanged receipt from speck's own reviewer run. Other approvals wait for manual shipping with an explanation. The cache error-handling gap is fixed, and all recorded tests pass."
  }
}
```

</details>
