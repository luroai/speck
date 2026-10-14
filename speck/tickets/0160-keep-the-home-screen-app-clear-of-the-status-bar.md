---
id: "0160"
title: Keep the panel header on screen                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T12:31:12.452Z"

---
# 0160 · Keep the panel header on screen

**Status:** 🔍 reviewing

## Problem
The panel header, with the Auto-build button, scrolls away with the page, so on a phone the one control and status the user checks most is only at the top. In the home-screen app the iPhone's status bar has no background of its own, so once the page scrolls, cards and text slide underneath the clock and battery (seen 2026-10-14).

## Outcome
The header stays at the top of the screen as the page scrolls, with the panel's background behind the status bar, so nothing ever shows under it; on a phone the header slims to one row once scrolled.

## Acceptance criteria
1. The header stays fixed at the top of the screen while the page scrolls, on phone and desktop, with the panel's solid background and a line along its bottom edge, so content scrolls underneath it, never through it.
2. In the home-screen app the header extends up behind the status bar: the page uses `viewport-fit=cover`, the header's top padding includes `env(safe-area-inset-top)`, and an `apple-mobile-web-app-status-bar-style` meta tag keeps the status bar's text readable in light and dark mode. No text, card or border is ever visible behind the status bar.
3. At viewports under 700 px, once the page is scrolled down, the header slims to one row of at most 60 px plus the safe-area inset: "speck", the Auto-build button and the light/dark button, with the project name and base branch hidden. Back at the top of the page it shows both rows again. The change is a quick fade or slide, and instant with `prefers-reduced-motion: reduce`.
4. The page's last card clears the home indicator (`env(safe-area-inset-bottom)`), and the full ticket pane's close button and first line sit below the status bar.
5. Jumping to a ticket (0154) and opening the full ticket still show their target below the header, not hidden behind it. In a normal browser tab, where the insets are 0, nothing shows behind the header either. No test that passed before this change fails.

## Out of scope
- What the header shows (0163 adds the running build to the Auto-build button).
- Colours and contrast (0161).

## Notes
- Today the viewport tag is `width=device-width, initial-scale=1` and the header isn't sticky (`templates/panel.html`).
- Jumping to a ticket scrolls it into view; with a fixed header that needs `scroll-margin-top` (or equal) so the target isn't covered.
- Reported 2026-10-14 from phone screenshots of the home-screen app.
- Failing before this build: none
- Self-check: the header now measures its slim height with a margin already in place and the browser's scroll anchoring off, as the in-between layout pulled the page up (and back from the very bottom); the header itself is left out of scroll anchoring.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "197294b6e7748995c7e867b75a82479d60fb0722",
    "thread_id": "01a13a70-d183-7390-964f-72c44cb04e5b",
    "seconds": 49,
    "usage": {
      "input_tokens": 110244,
      "cached_input_tokens": 66304,
      "cache_write_input_tokens": 0,
      "output_tokens": 985,
      "reasoning_output_tokens": 83
    },
    "saved_at": "2026-10-14T12:44:43.684Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html header rule provides sticky positioning, solid background and bottom border. Passing AC1 browser tests exercise scrolling at 375 and 1280 px."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The viewport and header padding are implemented, but #full-ticket scrolls its contents through the top safe area and places its left border there. The status-bar test checks only a meta-tag string in Chromium, not iOS rendering. Light mode uses default, which Apple's documentation says positions web content below the status bar."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The phone header.slim rules and fit() implement the compact row and restoration. Passing browser tests exercise height, visibility, alignment, safe-area padding and reduced motion."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "main includes bottom safe-area padding; #full-ticket includes top padding. Passing AC4 browser tests verify the last card and initial close-button/first-line positions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "ResizeObserver maintains --head for html scroll-padding-top. Passing AC5 browser tests exercise ticket jumps and full-pane opening with zero and nonzero insets. /tmp/speck-0160-tests.txt confirms 1491 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:313",
        "issue": "The full ticket pane has top safe-area padding inside its scrolling container. Once the pane scrolls, that padding scrolls away and ticket text can appear behind the status bar. Its left border also extends through that area. The tests inspect only the newly opened pane, so they miss this violation of AC2's 'ever' requirement.",
        "suggested_fix": "Keep an opaque, stationary safe-area region above the pane's scrolling contents and keep borders below it. Add a browser test that scrolls a long full ticket and verifies the status-bar region stays clear.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:24; test/panel-0160.test.mjs",
        "issue": "The claimed light/dark status-bar behaviour is tested only by reading the meta tag's content in Chromium. This does not exercise iOS status-bar text or its response to theme switches. Moreover, light mode selects default, which positions content below the status bar rather than extending the header behind it according to Apple's Supported Meta Tags documentation: https://developer-mdn.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html.",
        "suggested_fix": "Verify the implementation in an iOS home-screen app in both themes, including theme switches, and adjust the status-bar strategy to meet AC2. Record platform evidence and make the automated test's claim accurately reflect what it exercises.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The header stays visible and compacts correctly on phones, and the suite passes. Two status-bar concerns remain: scrolling a full ticket can expose text behind the clock, and the tests do not establish the claimed iPhone behaviour in both themes."
  }
}
```

</details>
