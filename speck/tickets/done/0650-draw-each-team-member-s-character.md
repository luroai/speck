---
id: "0650"
title: "Draw each team member's character"                # one outcome, no "and"
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
created: 2026-11-11
started: "2026-11-11T14:17:39.273Z"
approved: "2026-11-11T14:24:17.815Z"
finished: "2026-11-11T14:28:25.987Z"

---
# 0650 · Draw each team member's character

**Status:** ✅ done

## Problem
Every member of the team will appear in the panel, and they need to be told apart at a glance. Today only Virgil has a character.

## Outcome
The panel can draw each team member's character: Virgil's as today, and the Builder's, the Reviewer's and QA's as still screens with their own sign and colour.

## Acceptance criteria
1. `SpeckFace.draw` takes a `role` of `manager` (the default, as today), `builder`, `reviewer` or `qa`, and draws the same Premium device for each.
2. The builder's screen shows an ivory prompt and cursor (`> _`), the reviewer's a cyan magnifying glass and QA's violet viewfinder corners with a short bar in the middle, each with the same soft glow as Virgil's visor; red is used only for the manager.
3. The builder, reviewer and QA characters never move, in any mood or setting: only the manager animates, as today.
4. Each draws clearly at every size from 16 px, in the light and the dark look, and has a label naming its member.
5. No test that passed before this change fails.

## Out of scope
- Where they appear: 0652.

## Notes
- Chosen 2026-11-11: option D in https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ (the Character options board), whose SVG paths can be reused.
- Colours keep clear of the panel's status colours (orange needs you, blue being worked on, green done, plum ideas): ivory `#F3E3C3`, cyan `#3FD0D4`, violet `#B08CFF` as mocked; check them on both looks.
- `templates/speck-face.js`.
- Failing before this build: none
- The Character options board couldn't be opened from the build's session, so the three signs were drawn afresh from this ticket's description and colours.
- Self-check: dropped a stylesheet rule that stopped animation on members' faces, as it sat outside the reduced-motion block; they have nothing animated to stop (unknown and built-in role names such as `constructor` and `__proto__` fall back to the manager; setMood leaves a member's face alone).

## In plain words
speck can now draw a character for each member of the team, not only Virgil. The Builder shows an ivory prompt and cursor, the Reviewer a cyan magnifying glass and QA violet viewfinder corners, each on the same small dark device as Virgil and with the same soft glow. Only Virgil moves; the other three stay still. Nothing in the panel shows them yet: placing them is ticket 0652. To see them now, look at the two pictures in this ticket's review pack, which show all four from the smallest size to the largest in the light and dark looks. Worth a look: the board of character options couldn't be opened during the build, so the three signs were drawn from the ticket's description rather than copied from it. Compare them with option D before they go into the panel.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The manager's default accessible label names its mood, such as 'watching', rather than its member.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 339,990
- Elapsed since build started: 7 min
- Changed lines: 39 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox note):
  - A manager face drawn without a role is still labelled with its mood alone, as before. 0652 should pass a label with the manager's name, as the panel's other labelled faces do, or pass `role: 'manager'`.
  - The signs were drawn afresh because the Character options board couldn't be opened. If option D's SVG paths differ, swapping them into `SIGNS` is a small change.

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
    "reviewed_sha": "35399be7ddc43c42ee4f344bbfae4dab91111911",
    "session": "fresh",
    "thread_id": "01a1cafc-a5b1-7580-b32c-210e9f103598",
    "builder_response": "- Tests run: `speck test --related test/speck-face-0650.test.mjs` (the ticket's own file plus every test file naming templates/speck-face.js, including the 0578, 0605 and 0579 face tests and the commands.checks files).\n- Round 1. The Character options board linked in the Notes could not be opened from this session, so the three signs were drawn from the ticket's description: `> _` (ivory #F3E3C3), a magnifying glass (cyan #3FD0D4), four viewfinder corners with a short bar (violet #B08CFF). Pictures of all four at 16-96 px in both looks are in the review pack.\n- Members' faces carry `data-role` and no `data-mood`, contain none of the classes the stylesheet animates, and setMood ignores them. Below 24 px their strokes thicken to 3.4 units so each is at least a pixel wide at 16 px.\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 235369,
      "cached_input_tokens": 187520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1122,
      "reasoning_output_tokens": 43
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47849,
      "cached": 187520,
      "write": 0,
      "output": 1122
    },
    "cost_usd": 0.12567,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:22:49.124Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/speck-face.js draw preserves the manager default and shares the device geometry across roles. The passing 0650 AC1 test exercises all roles and unknown-role fallbacks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "SIGNS, signOf and STYLE define the requested signs, colours and visor-style glow. The passing AC2 test checks these; light and dark screenshots confirm their appearance."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Member drawings contain no animated classes and are excluded from the faces WeakMap, so setMood ignores them. The passing AC3 test covers all moods, both looks and multiple sizes."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The AC4 test checks the three new members' labels and size bounds, and screenshots show clear signs in both looks. However, draw({ role: 'manager' }) defaults to aria-label='watching', which names a mood rather than the member. Manager labelling is omitted from AC4 coverage."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded related-test run reports 188 passed, 0 failed and 3 skipped, including existing face and mood tests. The committed change is confined to the renderer, its new tests and the ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/speck-face.js",
        "issue": "The manager's default accessible label names its mood, such as 'watching', rather than its member. This misses AC4's requirement that each character has a label naming its member.",
        "suggested_fix": "Include Virgil or Manager in the manager's default accessible label, preserve that identity when setMood updates it, and test manager labelling alongside the other roles. Continue respecting caller-supplied labels.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The three new characters have distinct signs and colours, remain still, and look clear in both themes. The related tests pass. One accessibility requirement remains: the manager is labelled by its mood instead of its name."
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
    "reviewed_sha": "86e3814016d6fe8ee0c73ce2f7992f6770a07bcd",
    "session": "continued",
    "thread_id": "01a1cafc-a5b1-7580-b32c-210e9f103598",
    "builder_response": "- Tests run: `speck test --related test/speck-face-0650.test.mjs` (the ticket's own file plus every test file naming templates/speck-face.js and the commands.checks files): 189 pass, 0 fail.\n- F1: fixed, with one limit. Drawn with `role: 'manager'`, the manager's default label is now `Manager, <mood>`, and setMood keeps it in that form (`moodLabel` in templates/speck-face.js). A label the caller passes is used and kept, as before. Without a role the default stays the bare mood, as today: AC1 says the default is \"as today\", and AC5 forbids breaking test/speck-mood-0579.test.mjs:161, which expects an unlabelled default face to be labelled `pleased`. The manager's name (Virgil) can be changed in Settings, so the face module can't know it. Every labelled caller in the panel already passes `${speckCalled()}, <mood>`. New test: \"0650 AC4: asked for by role, the manager is labelled …\".\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 338224,
      "cached_input_tokens": 285824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1766,
      "reasoning_output_tokens": 43
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4551,
      "cached": 98304,
      "write": 0,
      "output": 644
    },
    "cost_usd": 0.0253724,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:24:07.348Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/speck-face.js draw supports all four roles using the same device geometry and preserves existing behaviour when role is omitted. The passing 0650 AC1 test covers roles and unknown-role fallbacks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "SIGNS, signOf and STYLE provide the requested shapes, colours and visor-style glow. The passing AC2 test checks these properties; previously inspected screenshots confirm their appearance in both looks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Member signs contain no animated classes and are excluded from mood updates. The passing AC3 test exercises all moods, sizes and looks while checking that setMood leaves members unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 tests cover size bounds, stroke widths, screen containment and member labels. Explicit manager drawings now use 'Manager, <mood>' through mood changes. Preserving legacy labels when role is omitted is consistent with AC1's 'as today' requirement. Previously inspected screenshots demonstrate legibility in both looks."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The related-test run records 189 passed, 0 failed and 3 skipped. Existing mood-label expectations remain intact; no existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/speck-face.js",
        "issue": "Explicit manager drawings previously had a mood-only accessible label.",
        "suggested_fix": "Completed: moodLabel names the manager during drawing and mood updates; new coverage checks this and preservation of caller-supplied labels.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "All four characters meet the requirements. The new members have distinct colours and signs, remain still and read clearly in both themes. The manager label issue is fixed while preserving existing callers. All related tests pass."
  }
}
```

</details>
