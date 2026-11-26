# Steady the 0761 AC2 wide-block swipe test

Captured: 2026-11-26 20:59 · Status: inbox
From ticket: 0769
Raised by: agent

## What
Make the real-browser test "0761 AC2: with something in Plan's list wider than it, a sideways swipe on the list changes lane, as it does with nothing wider" pass reliably when many test files run at once.

## Why
It failed once in 0769's related-tests run (533 files, about 8 minutes), then passed on its own with no code change. A test that fails only under load can fail `speck ship` or the full suite for a ticket that didn't touch it.

## Notes
- Seen in 0769's build: "timed out waiting for a swipe that starts on the wide block to change lane to Build" (test/panel-0761.test.mjs:103, after about 14 s). 0769 changes neither Plan's list nor swiping.
- Its wait may need a longer limit under load, or the swipe may be sent before the page is ready for it.
