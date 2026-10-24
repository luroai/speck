---
id: "0484"
title: "Keep a closed Build card's tag whole on a phone"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-keep-a-closed-card-s-bug-or-document-tag-whole-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0483"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:44:36.293Z"
approved: "2026-10-24T19:03:12.724Z"

---
# 0484 · Keep a closed Build card's tag whole on a phone

**Status:** 👍 approved

## Problem
On a phone, a closed Build card with a long status line, such as `Foreman will answer · Review 2 · 99:59 · bug`, cuts its bug, fix or document tag off with an ellipsis, sometimes to just `…`. A lone `…` after the time looks as if the time is cut off, and the tag can't be read or tapped until the card is opened.

## Outcome
A closed Build card's bug, fix or document tag always shows whole.

## Acceptance criteria
1. On a closed Build card at every width from 320 px, a bug, fix or document tag at the end of its status line shows whole and can be tapped, as an open card's can.
2. When the status line doesn't fit, its words (such as `Foreman will answer`) are cut short with `…` first, and the stage, the time and the tag stay whole while the words have anything left to give. Checked in a real browser at 320 px and 375 px, in both looks, for a blocked bug ticket whose line is `Foreman will answer · Review 2 · 99:59 · bug` and for a finished document task.
3. A closed card whose status line fits looks as it does today, and open cards don't change. No test that passed before this change fails.

## Out of scope
- What the status line says (0443).
- Plan's cards and their tags.

## Notes
- From the inbox note, raised by the builder on 0443, whose criteria name only the words, stage and time. Decided while ticketing on 2026-10-24: the tag stays on the status line, whole, rather than moving or being dropped.
- Today: `.q:not(.open) .top .progress` and the rules round it under 0443's comment in `templates/panel-cards.css`, and the closed card's status line built in `templates/panel.js` (0443).
- Waits for 0483: both change the closed Build card's update in `templates/panel.js`.
- Failing before this build: none
- 0443's 375 px test let a tag after the time be cut off and checked the words were never cut. 0484 reverses that: a line with a tag now cuts its words short first. 0443's 0807 line (`Read the document · Ship · 20:12 · bug · document`) is 43 px too wide at 375 px with both tags whole, and only narrower gaps round the tags would make room, which would change lines that fit (AC3) and 0419's tap-area gaps. So 0443's test now lets a tagged line's words be cut short; its stage and time must still show whole.
- Handed back by the ship queue (2026-10-24): 0050, 0058 and 0156's browser tests failed. The flex row made the browser copy the status line with a line break between every part, and made each part's box 44 px tall. Replaced it: the line stays ordinary text, and the page script (fitWords in templates/panel.js, run beside 0453's wholeButtons) sets the words' width to the room the stage, time and tag leave. Added a test that every closed card's line copies as it did before 0484.
- Self-check (first build): the reviewer's model on a working card's line (by) gives up room as the words do, and the lights keep their place; added a working card with a long model and a card with no tag to the tests.

## In plain words
On a phone, a closed card in Build now always shows its bug, fix or document tag in full, and you can tap it without opening the card. When the line is too long, the status words at its start, such as "Foreman will answer", are shortened with "…" instead, and the stage and the time stay whole. The full words are still in the tooltip, and in the card once it's open. Cards whose line already fits look exactly as before. To see it, open the panel on a phone, or a narrow window, with a blocked bug ticket in Build. Worth knowing: on the narrowest phones, a card with two tags (a bug that's also a document) can cut its words down to a few letters.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 288,690
- Elapsed since build started: 19 min
- Changed lines: 25 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Changed one existing test: 0443's 375 px check now lets a tagged line's words be cut short, as this ticket asks (see Notes). The reviewer agreed.
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
    "reviewed_sha": "a4216e12d54cc2c5c91a5b1d498d6d52c271afb0",
    "session": "fresh",
    "thread_id": "01a16f42-99f2-71a0-befb-f66319eb83c4",
    "builder_response": "- Tests run: test/panel-0484.test.mjs test/panel-0443.test.mjs test/panel-0442.test.mjs test/panel-0441.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs test/panel-0434.test.mjs test/panel-0416.test.mjs, plus what `--related` brought in (test/panel-0417, 0469, 0472) and the checks.\n- The change: a closed Build card's status line is a flex row (templates/panel-cards.css, under 0443's rule). The words (`.say`, and the reviewer's model `.by` on a working card) shrink and end in …; the stage, time and tags don't shrink. A row drops whitespace text nodes, so each space is drawn as `.sep::after` (and before the part after the lights), with `white-space: pre`; tags sit at the line's top (align-self: flex-start, as 0441's vertical-align: top), and the lights are moved to where vertical-align: middle put them.\n- AC3: the 0484 AC3 test removes the 0484 rules from the live page and compares every text run and box in every card's top row (closed and one open card) at 700 px, both looks: all within 0.25 px (the largest gap is 0.22 px, a space after the lights).\n- One existing test changed, please judge it: 0443's 375 px test allowed \"a tag after the time may be cut off\" and checked the words were never cut. 0484 reverses exactly that decision. Its 0807 line (`Read the document · Ship · 20:12 · bug · document`, two tags) is 43 px too wide at 375 px with both tags whole; the only room left is 0419's wide tap-area gaps round the tags, and narrowing them would change lines that fit (AC3). So 0443's test now lets a tagged line's words be cut short, and still requires its stage and time whole and inside. Reasoning is also in the ticket's Notes.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 97196,
      "cached_input_tokens": 58496,
      "cache_write_input_tokens": 0,
      "output_tokens": 574,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T18:53:39.949Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css:426–435 makes closed status lines flex rows and prevents tags from shrinking. The passing panel-0484 AC1/AC2 browser tests check bug, fix and document tags remain whole and receive pointer hits at widths 320–480 px, with touch and mouse, in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Only .say and .by can shrink and receive an ellipsis; stage, time and tags retain their widths. Passing panel-0484 AC2 browser tests exercise the blocked bug and finished document lines at 320 px and 375 px in both looks, and explicitly verify that the blocked line's words truncate first."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The new selectors apply only to closed cards. The passing panel-0484 AC3 browser test compares text and box positions with the new rules removed, for fitting closed cards and an open card in both looks. The recorded run has 169 passes, zero failures and three skips. The panel-0443 assertion change correctly reflects this ticket's requirement that tagged lines sacrifice words first."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Closed Build cards now shorten their status words first, keeping tags readable and tappable alongside the stage and time. Browser tests cover narrow screens and both looks, and confirm fitting lines and open cards retain their layout. No blocking concerns found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "36e35b20eac1062f54eb331b4b0c09435101c516",
    "merge": true,
    "session": "continued",
    "thread_id": "01a16f42-99f2-71a0-befb-f66319eb83c4",
    "builder_response": "- Handed back by the ship queue (speck ship exit 16). main had nothing new for this branch (git merge main: already up to date), so the failures came from this ticket's change alone.\n- Failing tests: 0050 AC4 and 0058 AC3/AC4 (a selection from a card's title across its status line read back with line breaks between the parts), and 0156 AC3 to AC5 (the stage's box no longer sat beside the words' box). Cause: the flex row from round 1 made each part a block-level flex item. Copying the line then put a line break between every part, and every part's box became 44 px tall.\n- What I changed: dropped the flex row. The line is inline text again, exactly as before. Only the words (`.say`, or `.by` on a working card) are now inline-block with `overflow-x: clip; text-overflow: ellipsis` (templates/panel-cards.css). `fitWords()` in templates/panel.js sets their max-width to the room the stage, time and tag leave, measured from the line's last part (a tag's touch tap area reaches past it, so scrollWidth can't be used). It runs alongside 0453's wholeButtons: on the same MutationObserver (renders, clock ticks, lane switches), on resize and when fonts load. The fake page has no MutationObserver, so it never runs there.\n- New test: 0484 AC3 \"copies as it did before 0484\" checks every closed card's selection text and innerText against the page with 0484's rule taken out. The AC3 layout test now also checks the rule was really taken out. The AC1/AC2 measurement waits two frames after a resize, for the page's resize handler.\n- 0443's test change from round 1 stays (a line with two tags still has to cut its words at 375 px).\n- Tests run: test/panel-0484.test.mjs test/panel-0050.test.mjs test/panel-0058.test.mjs test/panel-0156.test.mjs test/panel-0443.test.mjs test/panel-0442.test.mjs test/panel-0441.test.mjs test/panel-0419.test.mjs test/panel-0427.test.mjs test/panel-0434.test.mjs test/panel-0416.test.mjs, via --related, which added test/panel-0417 and test/panel-0433, plus the checks. 215 pass, 0 fail, 3 skipped.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 189907,
      "cached_input_tokens": 140672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1013,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T19:03:08.995Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js fitWords() limits the words to the space left by the remaining status parts. Passing panel-0484 AC1/AC2 browser tests verify whole, tappable bug, fix and document tags across 320–480 px, with touch and mouse, in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fitWords() measures overflow using the last part and reduces only .say or .by; panel-cards.css applies clipping and ellipsis to those words. Passing AC2 browser tests cover the blocked bug and finished document lines at 320 and 375 px in both looks, including explicit verification that words truncate before stage, time or tag."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The revised implementation preserves inline layout and targets closed cards only. Passing AC3 tests compare fitting and open-card positions against the original rules and verify unchanged selection text. Previously failing 0050, 0058 and 0156 browser tests now pass without changes to those tests. Recorded output confirms 215 passes, zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The revised change keeps tags whole while shortening status words, and preserves the original inline layout. Tests confirm that copying text and positioning the stage work again, alongside the phone-width checks. No blocking concerns remain."
  }
}
```

</details>
