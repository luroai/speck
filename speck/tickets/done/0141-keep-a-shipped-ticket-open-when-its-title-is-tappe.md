---
id: "0141"
title: "Keep a shipped ticket open when its title is tapped on a phone"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-13
started: "2026-10-13T07:52:43.284Z"
approved: "2026-10-13T07:59:12.233Z"
finished: "2026-10-13T08:00:18.606Z"

---
# 0141 · Keep a shipped ticket open when its title is tapped on a phone

**Status:** ✅ done

## Problem
In cptr's built-in browser on an iPhone, tapping a shipped ticket's title opens the full ticket for a moment, then the page reloads to the top and the ticket closes. The title is an `<a href="#">` link (0137), and that browser follows the link itself even though the page cancels it. The Review pack button in the same row works, because it's a button.

## Outcome
Tapping a shipped ticket's title opens the full ticket and it stays open, in any browser, because the title no longer points to an address.

## Acceptance criteria
1. A Shipped row's title has no `href` and is not an `<a>` element, so no browser can follow it to another address or reload the page.
2. Clicking or tapping the title opens that ticket in the full ticket pane, exactly as before, and the page isn't reloaded or scrolled.
3. The title still looks as it does today: accent colour, underlined on hover, pointer cursor, and the 44 px tap area at phone widths from 0140.
4. The title can be reached with Tab and opened with Enter or Space, and screen readers announce it with the ticket's title as its name.
5. No test that passed before this change fails, except checks that the title is a link (`<a>`), which are changed to check the new element.

## Out of scope
- Other links in the panel, such as links inside a ticket's text.
- Any other phone layout changes.

## Notes
- The title is made by `fullLink` in `templates/panel.html`, which sets `href = '#'` and calls `preventDefault()` on click.
- Reported 2026-10-13 on an iPhone in cptr's browser: the page reloaded to the top and the Review pack button in the same row stayed open. Not reproducible in Chromium with touch emulation, where `preventDefault()` is honoured.
- Checked 2026-10-13: why that browser follows a cancelled `href="#"` can't be confirmed here (no WebKit build installed on the build machine). The fix removes the `href`, so it doesn't depend on the cause.
- Failing before this build: none
- Self-check: Enter and Space on the title now make a click rather than opening the ticket directly, so with a priority menu open they only close the menu, as a click does (test added).
- Old tests that found the title as an `<a>` (0050, 0063, 0132, 0137, 0140) now find it by its `title-link` class; 0137's checks of `href="#"`, `preventDefault()` and the `link` role now check no address, `tabIndex` 0 and the `button` role.

## In plain words
Tapping a shipped ticket's title on a phone now opens the full ticket and keeps it open, instead of the page jumping back to the top and closing it. The title looks and behaves as before on a computer: same colour, underline on hover, and it can still be reached with Tab and opened with Enter or Space. To see it, open the panel on a phone, tap a title in the Shipped list, and check the ticket stays open. Worth watching: the fix couldn't be tried on the iPhone browser where the problem was reported, only in Chrome set to a phone screen, so it's worth one tap on the real phone to confirm.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 184,618
- Elapsed since build started: 6 min
- Changed lines: 15 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: checked only in Chromium with phone and touch emulation, as WebKit can't run on the build machine; confirm once on the iPhone browser from the report.

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
    "reviewed_sha": "d57bda62b7f7bdd2b2e61b6f33f966e91e76a8ab",
    "thread_id": "01a13444-b9cd-7f13-b598-b63b325a398e",
    "seconds": 62,
    "usage": {
      "input_tokens": 183767,
      "cached_input_tokens": 141056,
      "cache_write_input_tokens": 0,
      "output_tokens": 851,
      "reasoning_output_tokens": 25
    },
    "saved_at": "2026-10-13T07:59:03.807Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html fullLink creates a span without href. panel-0141 AC1 and the passing real-browser test verify the element and absence of an address."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullLink calls openFull on click. The passing panel-0141 phone-sized browser test dispatches touch events and verifies the correct pane stays open, unchanged scroll position and URL, and no reload."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Existing title-link CSS remains unchanged. Passing panel-0141 AC3 checks accent colour, hover underline and pointer cursor; its real-browser test measures the 44 px phone tap area."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "fullLink supplies tabIndex 0, button role and Enter/Space handlers that prevent scrolling. The passing real-browser test exercises Tab and both activation keys and checks the accessibility tree for the ticket title."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0141-tests.txt: 1257 tests, 1254 passed, zero failed, three skipped. Existing test changes adapt link selectors and semantics without removing behaviour checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped ticket titles now open the full ticket without pointing to an address, removing the reported navigation trigger. Appearance, phone tap size and keyboard accessibility are preserved. Browser tests passed and the full suite has no failures. The original iPhone browser was unavailable, but the fix removes the link behaviour it could follow."
  }
}
```

</details>
