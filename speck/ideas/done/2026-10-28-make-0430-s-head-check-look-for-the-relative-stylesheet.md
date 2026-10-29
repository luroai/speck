# Make 0430's head check look for the relative stylesheet

Captured: 2026-10-28 · Status: ticketed (0555)
From ticket: 0543
Raised by: agent

## What
The 0430 test that checks the Settings stylesheet loads in the page's head still looks for `/panel-settings.css`. Since 0543 the page links `panel-settings.css`, so the search finds nothing and the check passes without checking anything. It should look for the relative address and fail when that's missing.

## Why
A check that can't fail would let a stylesheet slip out of the head unnoticed. Other tests cover the order today, so nothing is broken yet.

## Notes
- From the reviewer's minor finding F1 in 0543's round 1 (test/panel-0430.test.mjs, line 18).
