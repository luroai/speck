---
id: "0674"
title: "Build a ticket on an approved ticket it waits for"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0673", "0679"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:29:51.279Z"
approved: "2026-11-15T15:06:48.962Z"

---
# 0674 · Build a ticket on an approved ticket it waits for

**Status:** 👍 approved

## Problem
A ticket with `after:` can't start until every ticket it names has shipped, even when the one it waits for is approved and only waiting to ship. Where you ship by hand, that wait lasts until you next look.

## Outcome
A ticket can be started on the approved work of the one ticket it still waits for, and ships after it.

## Acceptance criteria
1. `speck start <id>` starts a ticket whose `after:` tickets are all done except one that's approved. Its branch starts from that ticket's branch, so the work it needs is there. With an `after:` ticket in any other state, or more than one not done, it refuses as today.
2. While the ticket it was built on hasn't shipped, each review round's diff and `speck diffstat` count only this ticket's own change, not that ticket's.
3. `speck ship <id>` refuses while the ticket it was built on isn't done, naming it, whether or not the `after:` link is still in the ticket. Auto-ship leaves such a ticket approved, giving that as its reason, without spending a hand-back. Once that ticket is done, it ships as any other.
4. `docs/brief.md` says, where it says each build starts from the latest base branch and where it describes `after:`, that a ticket can start from an approved ticket it waits for.
5. No test that passed before this change fails.

## Out of scope
- `speck run` starting such a ticket by itself: 0675.
- Starting on a ticket that's still building or reviewing: its code changes with each round.
- A ticket waiting on two or more tickets that haven't shipped.

## Notes
- 0094 made `speck start` refuse until every `after:` ticket has shipped. This relaxes it for one approved ticket.
- `speck ship` lands a branch with `git merge --no-ff`, so once the first ticket ships its commits are in the base branch and the second merges without repeating them.
- If the first ticket gets a merge round after the second has started, the second meets that at ship as any conflict.
- Measured 2026-11-15: in this repo, with auto-ship on, a ticket goes from approved to shipped in a median 4 minutes, so the gain here is small. It's larger where approved tickets wait for you to ship them.
- `cmdStart` in `scripts/speck.mjs` makes the branch, `reviewSince` in `scripts/review.mjs` and `scripts/diffstat.mjs` measure the change, and `autoShipWhyNot` in `scripts/ship.mjs` gives auto-ship's reasons.
- Failing before this build: none
- Self-check: starting straight from the approved ticket's branch left the new branch with that branch's older copy of its own ticket, which would clash at ship, so `speck start` now makes the branch from the base branch and merges the approved ticket's branch into it (refusing, changing nothing, if that clashes), and diffs are measured from that merge. Also: the waiting ticket must be approved in its build as well as on its branch, and a `built_on:` that isn't a ticket id counts as none.
- speck (2026-11-15 14:58 UTC) told you: Nothing is stuck: the build is on its second review round after fixing two findings from round one. The time went on a mid-build redesign to a merge-based start, a full test-suite run of nearly 5 minutes (3,285 tests) and several test reruns, all on a machine with a load average around 64. Why: The build log shows steady progress with no hung commands, and every test failure it hit was in its own new code and was fixed, so the base branch isn't broken.

## In plain words
A ticket that waits for another one no longer has to sit idle while that other ticket is approved but not yet shipped: it can now be started straight away, with the approved work already in place. Its review and its size count still look only at its own change. It won't ship until the ticket it was built on has shipped, and if you try, speck says which ticket to ship first; auto-ship simply leaves it waiting, saying why.

To see it, approve a ticket and leave it unshipped, then start a ticket that lists it under after:. Starting it now works, and it says it started on the approved work. If the approved work clashes with newer work on the main branch, the start is refused and nothing changes. `speck run` doesn't yet start such tickets by itself: that's ticket 0675.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The baseline is reconstructed from moving merge bases and discarded whenever merge-tree reports a conflict.; F2 ownBase returns a tree object, but reviewSince passes it to cleanMerge as though it were a commit.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 724,179
- Elapsed since build started: 37 min
- Changed lines: 193 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - A ticket whose `built_on:` ticket is cancelled can never ship, and its refusal says to ship the cancelled one first: inbox `speck/ideas/2026-11-15-say-what-to-do-when-a-ticket-s-base-ticket-is-cancelled.md`.
  - Known limit: `speck test --related`, ship's check for uncommitted files in the way and its private-words check read the branch against the base branch with git's three-dot diff, so while the ticket it was built on hasn't shipped they also see that ticket's files. Harmless (they check more, not less), so left as it is.
  - Known limit: if the approved ticket's branch is deleted before it ships, the diff falls back to the base branch's merge base and counts its work too.

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
    "reviewed_sha": "9af24cc9ac77f859ed808607056d94e310f7fe81",
    "session": "fresh",
    "thread_id": "01a1dfb2-1a32-77f1-9ece-b31004285f87",
    "builder_response": "- Tests run: `speck test --related test/built-on-0674.test.mjs` once (3284 passed, 1 failed: test/cli-0231.test.mjs, because my new test helper started the CLI as a process). Fixed the helper to run speck in-process, then ran `speck test --files test/built-on-0674.test.mjs test/cli-0231.test.mjs` (attached output, all pass).\n- Design: `speck start` makes the new branch from the base branch as usual, then merges the approved after: ticket's branch into it (`speck(<id>): start on <other>`), refusing and undoing everything if that merge clashes, and writes `built_on: \"<other>\"` in the start commit. Starting straight from the other ticket's branch was tried first and dropped in self-check: that branch holds an older copy of this ticket's own file (often still a draft), so the build would work from stale criteria and the ship would clash on the ticket file.\n- AC2: `ownBase` (scripts/built-on.mjs) gives the tree of git's own merge of where HEAD meets the base branch and where it meets the other ticket's branch (or, once that has shipped, the two merge bases git then finds), so `speck diffstat`, `speck diff`, `speck prompt`, each review round's diff and the rebuilt round-1 prompt count only this ticket's change, before and after the other ships.\n- AC3: `speck ship` refuses via `builtOnCheck`, reading built_on: from the ticket on its branch, so editing after: changes nothing. `autoShipWhyNot` gives the reason first, so `speck status --json` has auto_ship false (the ship queue never tries it, so no hand-back) and `speck ship --auto` exits 12.\n- startWaits moved out of scripts/speck.mjs into scripts/built-on.mjs unchanged apart from the new case, and two lines in scripts/ship.mjs were joined, to keep both files within the 600-line check.\n",
    "seconds": 68,
    "usage": {
      "input_tokens": 252223,
      "cached_input_tokens": 207232,
      "cache_write_input_tokens": 0,
      "output_tokens": 1731,
      "reasoning_output_tokens": 538
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44991,
      "cached": 207232,
      "write": 0,
      "output": 1731
    },
    "cost_usd": 0.1280152,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T14:53:41.057Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startWaits and finishStart implement the approved dependency exception. Passing AC1 tests cover worktrees on/off, refusal states, multiple dependencies and merge rollback."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Initial diff tests pass, but ownBase in scripts/built-on.mjs:48 returns null when reconstructing the baseline conflicts. Review and diffstat then fall back to the ordinary merge base, including the dependency's changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise manual refusal after removing after:, auto-ship exit 12 and status reason, and successful shipping after the dependency ships."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md describes the exception in the latest-base-branch passage and the speck start entry. The passing AC4 test checks the documented built_on: field."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The related run reported one failure, subsequently fixed through the new helper. The supplied final run reports 168 passed, zero failed and three skipped; no existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/built-on.mjs:38",
        "issue": "The baseline is reconstructed from moving merge bases and discarded whenever merge-tree reports a conflict. If the dependent build merges newer main work that conflicts with its approved parent's work, ownBase returns null. Both diffstat and review then include the parent's changes again, violating AC2.",
        "suggested_fix": "Retain a reliable baseline for the inherited work across subsequent base merges rather than silently falling back to a baseline that includes it. Add a regression test that merges conflicting newer base work into the dependent build before its parent ships.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/review.mjs:305",
        "issue": "ownBase returns a tree object, but reviewSince passes it to cleanMerge as though it were a commit. git merge-tree --write-tree requires commits. After an approved dependent build merges newer base work and its reconstructed baseline changes, cleanMerge fails and the merge round falls back to showing the entire ticket change, losing the existing merge-review behaviour.",
        "suggested_fix": "Keep commit ancestry separate from the tree used for diffing, and calculate the clean merge using commit inputs. Add a merge-round regression test for a ticket with built_on: that verifies previously approved changes are excluded.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Starting on approved work and holding shipping until that work ships are covered by passing tests. Changes are needed because later base updates can make reviews and size counts include inherited work, and can break the focused review of merge resolutions."
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
    "reviewed_sha": "d18cf63438e2838d2800c579da3457b164d72410",
    "session": "continued",
    "thread_id": "01a1dfb2-1a32-77f1-9ece-b31004285f87",
    "builder_response": "- Tests run: test/built-on-0674.test.mjs test/cli-0231.test.mjs\n- F1: fixed. `ownBase` (scripts/built-on.mjs) now keeps git's merge tree when the base branch's newer work clashes with the unshipped ticket's (merge-tree exit 1, conflict markers kept, as 0673's merge rounds already do with `cleanMerge`), instead of falling back to the plain merge base. So diffstat and the review diff count this ticket's change plus how the clash was resolved, never the other ticket's work. New test `0674 AC2 F1` merges a clashing a.txt from main into the build before 0002 ships and checks 0002's z.txt isn't counted by diffstat or the diff, and b.txt is. It fails without the fix.\n- F2: fixed. `reviewSince` (scripts/review.mjs) keeps the commit merge base (`meets`) apart from the diff start (`base`, which may be ownBase's tree), and gives `cleanMerge` the commit. New test `0674 AC2 F2` approves 0001, merges clashing main work in, and checks `speck diff` gives the merge round's diff (follows a merge) with a.txt's resolution and neither b.txt nor z.txt. It fails with only the F1 fix in place.\n- Note: in speck's own flows a build merges the base branch in only when a ship hands it back, and `speck ship` refuses a ticket whose built_on ticket hasn't shipped before it merges anything, so this case comes from a build merging the base branch by hand. It's covered anyway.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 449155,
      "cached_input_tokens": 392960,
      "cache_write_input_tokens": 0,
      "output_tokens": 2614,
      "reasoning_output_tokens": 561
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 11204,
      "cached": 185728,
      "write": 0,
      "output": 883
    },
    "cost_usd": 0.0498108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:02:02.341Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startWaits and finishStart allow one approved dependency and merge its work into the new branch. Passing AC1 tests cover both worktree modes, refusal states, multiple dependencies and rollback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ownBase retains conflict trees, and reviewSince separates commit ancestry from the diff tree. Passing AC2 tests cover diffstat, review diffs, prompts, subsequent conflicting base merges and focused merge rounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builtOnCheck reads built_on from the ticket branch; autoShipWhyNot supplies the waiting reason. Passing AC3 tests cover refusal without after:, auto-ship exit 12, status reporting and successful shipping after the dependency."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md documents the exception in the latest-base-branch passage and the speck start entry describing after:. The AC4 test checks the built_on: field."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded final test output confirms 170 passed, zero failed and three skipped. The earlier related-run failure was rechecked successfully; existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/built-on.mjs:38",
        "issue": "Conflicting baseline reconstruction previously fell back to including inherited work. ownBase now retains the conflict tree, and the passing AC2 F1 regression test checks that inherited z.txt remains excluded.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/review.mjs:305",
        "issue": "The merge-review calculation previously passed a tree where a commit was required. It now passes the commit merge base; the passing AC2 F2 regression test verifies the resolution appears without previously approved or inherited files.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "A ticket can now start using one approved dependency’s work while waiting for that dependency to ship. Reviews and size counts exclude inherited work, including after later base updates. Both earlier findings are resolved, and all acceptance criteria pass."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "bda59ede6afbccccd55a8ea30eb39e13f22f44a7",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1dfb2-1a32-77f1-9ece-b31004285f87",
    "builder_response": "Merge round: main merged into the ticket branch after speck ship hit a conflict.\n- scripts/review.mjs (added-lines): main moved the round-limit helpers into review-limit.mjs and imports them where this branch added `import { ownBase } from './built-on.mjs';`. Kept both import lines; the `export … from './review-limit.mjs'` line from main is unchanged. reviewSince still uses isMergeRound, now from review-limit.mjs.\n- docs/brief.md (logic, but two separate rows): main changed the `speck test` row and this branch changed the `speck start` row next to it. Kept this branch's `speck start` row and main's `speck test` row word for word, so the brief differs from main only in this ticket's two passages.\n- Tests run: test/built-on-0674.test.mjs test/cli-0231.test.mjs test/start-0094.test.mjs (179 passed, 0 failed).\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 720668,
      "cached_input_tokens": 640640,
      "cache_write_input_tokens": 0,
      "output_tokens": 3511,
      "reasoning_output_tokens": 588
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 23833,
      "cached": 247680,
      "write": 0,
      "output": 897
    },
    "cost_usd": 0.081404,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:06:45.311Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "startWaits and finishStart retain the approved-dependency exception. Passing AC1 tests cover starting, refusal states, multiple dependencies and rollback; test/start-0094.test.mjs also passed after the merge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ownBase and its diff integrations remain intact. review.mjs preserves both the new review-limit imports and ownBase. All AC2 tests passed, including the F1 and F2 merge regressions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "builtOnCheck, builtOnWaiting and autoShipWhyNot are unchanged since approval. Passing AC3 tests cover refusal without after:, automatic waiting and shipping after the dependency."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The resolved docs/brief.md retains both required dependency passages. Its diff against the merged main contains only those two passages, preserving main's updated speck test documentation. AC4 passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded post-merge run reports 179 passed, zero failed and three skipped. No tests were weakened by the conflict resolutions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/built-on.mjs",
        "issue": "The fix retaining conflict trees remains intact after the merge. The AC2 F1 regression test passed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "reviewSince still supplies a commit to cleanMerge, and isMergeRound is correctly imported from review-limit.mjs. The AC2 F2 regression test passed.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The conflict resolutions preserve this ticket's behaviour and the newer changes from main. Both earlier fixes remain covered by passing tests. All acceptance criteria pass, with no new blocking findings."
  }
}
```

</details>
