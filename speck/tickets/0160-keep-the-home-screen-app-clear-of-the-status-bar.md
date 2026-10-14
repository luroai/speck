---
id: "0160"
title: Keep the panel header on screen                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** ⛔ blocked

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
- Answer 2026-10-14 (blocked question, round 2): ship it and defer the iPhone check. The user will check the status bar in the home-screen app, in both looks, once it is live.

## In plain words
The panel's header, with the Auto-build button, now stays at the top of the screen as you scroll, on a phone and on a computer. On a phone it slims to one row (speck, Auto-build and the light/dark button) once you scroll down, and shows both rows again back at the top. In the app on your iPhone's home screen, the header now fills the space behind the clock and battery, so cards no longer slide underneath them. The last card stays clear of the bar at the bottom of the screen, and the full ticket starts below the clock.

To see it, open the panel on your phone and scroll down. Worth a look: whether the clock stays readable in the light look and in the dark look. No automated test can check how the iPhone draws it. After switching between light and dark, you may need to close and reopen the app before the clock's colour changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Deferred by the user: check the status bar in the iPhone home-screen app in both looks, and after switching each way, once this is live.
- Known limit: iOS has no status bar style with dark text over the page, so with the light look chosen while the phone itself is set to dark, the clock's text may be light on a light header. iOS also reads the style as the app opens, so a switch of look may only reach the status bar after reopening. Not saved to the inbox: it is unconfirmed until the device check.

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

<details><summary>Round 2 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "74008978cce30333220c3b001eb0b15cbed06e16",
    "thread_id": "01a13a70-d183-7390-964f-72c44cb04e5b",
    "seconds": 38,
    "usage": {
      "input_tokens": 211516,
      "cached_input_tokens": 158848,
      "cache_write_input_tokens": 0,
      "output_tokens": 1773,
      "reasoning_output_tokens": 180
    },
    "saved_at": "2026-10-14T12:48:49.019Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html header rule retains sticky positioning, opaque background and bottom border. Passing AC1 browser tests exercise phone and desktop scrolling."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Viewport coverage and safe-area padding are implemented and exercised. The new long-ticket scrolling test verifies the pane and border remain below the inset. However, Chromium tests cannot establish iOS status-bar readability or whether changing the meta tag updates its rendered appearance during theme switches."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "header.slim and fit() retain compact layout and restoration. Passing AC3 browser tests exercise height, controls, hidden project details, animation and reduced motion."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "main retains bottom safe-area padding. #full-ticket now starts at the top inset. Passing AC4 tests verify last-card clearance and initial close-button/first-line positions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The --head measurement and scroll-padding remain intact. Passing AC5 tests exercise ticket jumps and pane opening with zero and nonzero insets. Verified test output reports 1492 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:315",
        "issue": "Previously, the full ticket's scrolling contents and border could enter the status-bar region. Moving the pane itself below the inset fixes this; the new test genuinely scrolls a long ticket and checks that region.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:24; test/panel-0160.test.mjs",
        "issue": "The test now accurately describes checking the meta-tag value. The builder's strategy plausibly protects content with either zero or nonzero insets, but actual iOS readability remains unverified, especially after switching themes while the app is open. Lack of device access explains the evidence gap; it does not establish AC2. Whether to accept that gap requires the owner.",
        "suggested_fix": "Obtain an iPhone home-screen check in both themes, including switches in both directions, or have the owner explicitly accept this platform verification as deferred.",
        "state": "dispute_rejected"
      }
    ],
    "escalation_question": "Will you verify status-bar readability and content coverage in the iPhone home-screen app, including switching themes in both directions, before approval, or accept that device check as deferred?",
    "summary": "The scrolling ticket pane is fixed, and all automated tests pass. The remaining uncertainty is specific to the iPhone: the tests check layout and meta-tag values, but cannot confirm the clock stays readable when themes change. The owner needs to decide whether device verification is required before approval."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6755b5292dcc0631b2127222d0465153e1bbed11",
    "thread_id": "01a13a70-d183-7390-964f-72c44cb04e5b",
    "seconds": 30,
    "usage": {
      "input_tokens": 323406,
      "cached_input_tokens": 265984,
      "cache_write_input_tokens": 0,
      "output_tokens": 2386,
      "reasoning_output_tokens": 180
    },
    "saved_at": "2026-10-14T13:20:20.973Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The header retains sticky positioning, solid background and bottom border. Passing AC1 browser tests exercise phone and desktop scrolling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Viewport coverage, header safe-area padding and theme-dependent status-bar metadata are implemented. Passing AC2 tests exercise emulated insets and scrolling a long full ticket. Accepted with the owner's recorded decision to defer actual iPhone rendering verification; that behaviour remains unverified on device."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 browser tests exercise the compact row, maximum height, hidden project details, restoration, quick animation and reduced motion."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Bottom safe-area padding and the pane's top inset remain implemented. Passing AC4 browser tests verify last-card clearance and close-button/first-line placement."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests exercise ticket jumps and full-ticket opening with zero and nonzero insets. Fresh full-suite output confirms 1492 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:315",
        "issue": "The pane now starts below the safe-area inset, keeping scrolling text and its border out of the status-bar region. The long-ticket regression test covers the original defect.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0160-keep-the-home-screen-app-clear-of-the-status-bar.md:46",
        "issue": "Actual iPhone status-bar rendering remains unverified. The owner explicitly accepted deferring that check until the change is live, resolving the approval gate raised in round 2.",
        "suggested_fix": "Complete the deferred iPhone home-screen check in both themes, including switching in both directions.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "Approved under the owner's decision to defer the iPhone check. The header stays visible, compacts on phones, and keeps scrolling ticket content clear of the status bar. All automated tests pass; actual iPhone status-bar readability still needs the agreed check after shipping."
  }
}
```

</details>
