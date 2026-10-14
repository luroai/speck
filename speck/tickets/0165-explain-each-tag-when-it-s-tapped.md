---
id: "0165"
title: "Explain each tag when it's tapped"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0161"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T18:10:45.412Z"

---
# 0165 · Explain each tag when it's tapped

**Status:** 🔍 reviewing

## Problem
On a draft ticket the priority tag opens the priority menu, so on a phone it needs a 44 px tap area, which makes it look bigger and spaced differently from the size, risk and type tags beside it. The other tags can't be tapped at all, and their short codes (P3, M, low, fix) don't explain themselves to someone new to speck.

## Outcome
Every tag looks the same size and can be tapped: the priority tag on a draft still opens its menu, and every other tag shows a short explanation of what it means.

## Acceptance criteria
1. All tags (priority, size, risk, bug and fix), wherever they appear (Plan, the Build queue and the full ticket pane), have the same visible size, and every one has a tap area at least 44 × 44 px at viewports under 700 px, extended invisibly so the visible boxes stay equal and evenly spaced.
2. Tapping, clicking or pressing Enter or Space on a tag that doesn't open a menu shows a small tip next to it, saying what it means: priority ("Priority 3: built after P0 to P2 tickets"), size ("S: a small, contained change" or "M: several files or one new component"), risk ("Low risk: ships by itself once approved" or "High risk: waits for you to ship it", following `auto_ship` and `auto_ship_risk` in `speck/config.yml`), "Bug: fixes a defect" and "Fix: fixes a broken main, built before anything else". With a mouse, the tip also shows on hover.
3. Only one tip is open at a time. It closes when the user taps or clicks anywhere else, presses Escape or scrolls, and it never opens or closes the ticket it belongs to. It stays on screen at a viewport 375 px wide.
4. On a draft in Plan, the priority tag still opens the priority menu, as today, instead of a tip. Elsewhere it shows its tip.
5. Each tag is announced by screen readers with its meaning (for example "Size M: several files or one new component"), and no test that passed before this change fails.

## Out of scope
- What the tags' values are or how they're set.
- Tag colours and text size (0161).

## Notes
- Builds after 0161, which sets the tags' size and colours.
- Tags are built by `tags()` and `typeTag()` in `templates/panel.html`; the priority menu is `priorityPicker()`. The 44 px tap area on the priority tag alone comes from 0140's `.tag.pick` rule.
- The size wording follows `/speck-ticket`'s size rules.
- Failing before this build: none
- The risk tip uses each ticket's `auto_ship` from `speck status --json` (0167), which follows `auto_ship` and `auto_ship_risk`. A board-wide field would have broken 0030, 0031 and 0044, which pin the top-level keys and require `/api/state` to match `status --json`.
- Older tests that pinned tags as unclickable, which AC2 and AC3 change on purpose, now expect the tip instead, as 0039 already did for 0077: 0039 AC1 skips tags (as it skips the priority tag), 0051 AC2 checks a tag's click goes no further, 0077 AC1 and 0143 AC4 press the tag and check it opens no menu. 0161 AC4 presses Tab up to 60 times instead of 25, since each tag is now a Tab stop. Nothing else in them changed.
- 0128 AC3 and 0148 AC2 (speck run timing, draft fix ticket 0173) fail now and then in a full run and pass alone. This build doesn't touch them.
- Self-check: the Plan priority tag's pointer was overridden by the new help pointer; it now applies only to tags that show a tip, with a test.

## In plain words
Every tag on a ticket (its priority, size, risk, and bug or fix) now explains itself. Tap or click one, or hover over it with a mouse, and a small note next to it says what it means, for example "M: several files or one new component" or "Low risk: ships by itself once approved". The risk note follows your auto-ship settings. On a draft in Plan, the priority tag still opens the menu that sets it. On a phone, every tag is now as easy to hit as the priority tag, and the tags are evenly spaced. To see it, open the panel and tap any tag. Worth a look: the gaps between tags are wider on a phone so the larger tap areas don't overlap, and keyboard users now pass through each tag when they press Tab.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Opening the Plan priority menu with Enter rebuilds the row, so keyboard focus drops back to the page and the menu's buttons aren't focused. Skipped as a new note: covered by speck/ideas/2026-10-14-reach-the-priority-tag-and-a-ticket-s-top-row-with-the-keyboard.md.
- Known limit: on a phone, a Shipped card's bug or fix tag's tap area reaches about 4 px into the title line above it.
- Known limit: hovering one tag with a mouse replaces a tip opened by clicking another, and both close when the pointer leaves.
- 0128 AC3 and 0148 AC2 still fail now and then in a full run (draft fix ticket 0173).

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
    "reviewed_sha": "320bbcc238b2e2f17072c3961a76d4795d10e911",
    "thread_id": "01a13bbe-a5cf-7802-948b-998c8df08c60",
    "seconds": 53,
    "usage": {
      "input_tokens": 559167,
      "cached_input_tokens": 503936,
      "cache_write_input_tokens": 0,
      "output_tokens": 1905,
      "reasoning_output_tokens": 168
    },
    "saved_at": "2026-10-14T18:49:25.431Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Mobile CSS gives tags invisible tap areas and equal gaps. Both 0165 AC1 browser tests passed, including hit testing at 375 px."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "explained(), priorityMeaning() and riskMeaning() implement the required interactions and wording; AC2 tests passed. However, renderFull() retains stale risk wording after auto_ship changes because tagData() omits auto_ship. Independently reproduced with fakePage: Plan updates to 'waits for you to ship it', while the open pane still says 'ships by itself once approved'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The shared tooltip, document click/Escape/scroll handlers and showTip() positioning cover dismissal and containment. Both 0165 AC3 browser tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fieldTags() preserves priorityPicker() for Plan drafts and uses explained() elsewhere. AC4 browser and fake-page tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Tags receive meaningful aria-labels, button roles and keyboard access; both AC5 tests passed. Verified /tmp/speck-0165-tests.txt reports 1625 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:1433",
        "issue": "The open full ticket pane does not refresh its risk explanation or accessible label when a configuration change changes the ticket's auto_ship value. tagData() tracks risk but omits auto_ship, leaving users with incorrect shipping guidance until they reopen the pane.",
        "suggested_fix": "Include auto_ship in tagData() and add a refresh regression test that changes only auto_ship while the pane remains open, checking both tooltip wording and aria-label.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The tags have consistent styling, larger phone tap areas and explanations accessible by touch, mouse and keyboard. The recorded suite passes, but an open ticket can show outdated shipping guidance after auto-ship settings change. Fix that refresh bug before merge."
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
    "reviewed_sha": "d2b9a986dcd444eef6906e6fffb073ada60d2000",
    "thread_id": "01a13bbe-a5cf-7802-948b-998c8df08c60",
    "seconds": 23,
    "usage": {
      "input_tokens": 674351,
      "cached_input_tokens": 613632,
      "cache_write_input_tokens": 0,
      "output_tokens": 2717,
      "reasoning_output_tokens": 168
    },
    "saved_at": "2026-10-14T18:52:10.973Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html mobile tag rules preserve equal visible styling and extend tap areas invisibly. Both 0165 AC1 browser tests passed, checking spacing and 44 × 44 px hit areas across Plan, Build and the full pane."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "explained(), pressWithKeys(), priorityMeaning() and riskMeaning() provide the required interactions and explanations. AC2 tests passed, including configuration integration and the new refresh regression. Independently verified that changing only auto_ship updates the open pane's risk label and tooltip."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "showTip() positions the shared tooltip within the viewport; document click, Escape and scroll handlers dismiss it. Both AC3 browser tests passed, covering ticket isolation and containment at 375 px."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fieldTags() retains priorityPicker() for Plan drafts and uses explained() elsewhere. AC4 browser and fake-page tests passed, including the priority cursor check."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "explained() and priorityPicker() supply meaningful aria-labels and keyboard access. Both AC5 tests passed. The full recorded output reports 1626 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:1433",
        "issue": "The open full ticket pane previously retained outdated risk explanations when only auto_ship changed.",
        "suggested_fix": "Include auto_ship in tagData() and cover label and tooltip updates with a refresh regression test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The tags now provide explanations by touch, mouse and keyboard, with consistent styling and larger phone tap areas. The outdated shipping guidance bug is fixed and covered by a regression test. All acceptance criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
