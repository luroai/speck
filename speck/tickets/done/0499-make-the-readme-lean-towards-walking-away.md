---
id: "0499"
title: "Make the README lean towards walking away"                # one outcome, no "and"
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
after: ["0498"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T12:23:10.121Z"
approved: "2026-10-25T12:24:45.940Z"
finished: "2026-10-25T12:28:17.815Z"

---
# 0499 · Make the README lean towards walking away

**Status:** ✅ done

## Problem
The README says two things at once: plan, walk away and come back to it shipped, and also that nothing ships until you say so and the judgement stays with you. A reader can't tell which speck is, and auto-ship, the thing that makes "come back to it shipped" true, isn't mentioned until How it works, and then only as a setting.

## Outcome
The README leans one way, towards walking away and coming back to finished work, and pitches auto-ship early, in a human way: ship the first few yourself, then switch it on once you're confident.

## Acceptance criteria
1. The opening, from the tagline to the picture, leans towards walking away and coming back to finished work. It no longer also says that nothing ships until you say so. (checked by review)
2. Before the picture, the README mentions auto-ship in a human way: ship the first few yourself from their review packs, and once you're confident, turn on auto-ship and speck ships approved work while you're away. (checked by review)
3. How it works, "Your second decision: what ships" and Who it's for match that lean: shipping by hand is where you start, auto-ship is where you go once you trust it, and the review pack is there to check the work whenever you want. No section says the call on every ship stays with you. (checked by review)
4. The facts stay right: auto-ship is off until you turn it on, covers low-risk tickets unless you change `auto_ship_risk`, and a task never ships by itself. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- Changing `auto_ship`'s default, or what setup recommends for it.
- The tagline, which stays "Plan in ten minutes. Come back to it shipped."
- `docs/brief.md`, which keeps describing the two gates in full.
- What 0496, 0497 and 0498 change, other than to fit this lean.

## Notes
- The user chose on 2026-10-25 to lean towards walking away, not towards "you decide what ships".
- Suggested wording for the review pack paragraph in the opening (today "You don't need to read the code… Nothing ships until you say so, or until you let speck ship low-risk work by itself."):
  > You don't need to read the code to check the work. Every ticket comes with a one-page review pack in plain English, with the reviewer's evidence for each criterion. Ship the first few yourself from their review packs. Once you're confident, turn on auto-ship, and speck ships approved work while you're away.
- Keep it human: no setting names in the opening. Setting names (`auto_ship`, `auto_ship_risk`) can stay in How it works.
- Don't start a sentence or label with "It" for speck, as 0496 sets out.
- Checked 2026-10-25: auto-ship is off by default, `auto_ship_risk` is `[low]` by default, and a task never ships by itself (`docs/brief.md`, principle 4). It can be turned on in the panel's Settings or with `speck config set auto_ship true`.
- Waits for 0498, the last of the README tickets before it: all of them change the opening paragraphs.
- Asked for by the user on 2026-10-25.
- Failing before this build: none
- No tests: every criterion but 5 is checked by review, and the change is to the README only. A reviewer can check it by reading the opening, How it works and Who it's for.
- Self-check: no changes

## In plain words
The README now tells one story: plan the work, walk away and come back to it shipped. Near the top it suggests shipping your first few tickets yourself from their review packs, then turning on auto-ship once you're confident. The section on what ships and Who it's for say the same thing, and still say that auto-ship is off until you turn it on, covers low-risk work unless you change that, and never ships a task by itself. To see it, read the README's opening, How it works and Who it's for. Nothing about how speck behaves has changed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 117,277
- Elapsed since build started: 2 min
- Changed lines: 12 (limit 5000)
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
    "reviewed_sha": "2a763e69abd82262cea2a1a9dce69ba3dc5dff5c",
    "session": "fresh",
    "thread_id": "01a17304-a060-7ce3-ad0b-9f640ab6db6d",
    "builder_response": "- Tests run: `speck test --related` with no test files of the ticket's own (every criterion but 5 is checked by review). It ran every existing test file that names README.md, plus the checks: 353 pass, 0 fail, 3 skipped.\n- The change is to README.md only: the opening's review pack paragraph (the ticket's suggested wording), How it works' intro line and diagram, \"Your second decision: what ships\", and Who it's for.\n- Pictures: none, because the README's layout doesn't change, only its wording.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 116604,
      "cached_input_tokens": 82944,
      "cache_write_input_tokens": 0,
      "output_tokens": 673,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T12:24:38.355Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md:3–11 retains the tagline, emphasises walking away and returning to shipped work, and removes the statement that nothing ships until you say so."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md:11, before the picture, says to ship the first few from their review packs, then enable auto-ship once confident. No setting names appear in the opening."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md:37–55 and 85 consistently describe manual shipping first and auto-ship once trust develops. Line 55 keeps the review pack available whenever wanted; these sections no longer reserve every shipping decision for the user."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md:55 explicitly states all three limits. These agree with docs/brief.md principle 4, the defaults in scripts/core.mjs:142, and the task exclusion in scripts/ship.mjs:395."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0499-tests.txt reports 353 passes, zero failures and three skips. The diff changes README prose and ticket bookkeeping only; no tests or executable code were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now consistently encourages shipping the first few changes yourself, then enabling auto-ship and walking away. It preserves the default restrictions and human review of task results. The relevant tests passed, and there are no blocking concerns."
  }
}
```

</details>
