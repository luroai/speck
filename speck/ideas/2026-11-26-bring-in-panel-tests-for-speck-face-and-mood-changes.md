# Bring in the panel tests when speck's face or mood script changes

Captured: 2026-11-26 23:57 · Status: inbox
From ticket: 0777
Raised by: agent

## What
A change to `templates/speck-mood.js` or `templates/speck-face.js`, both loaded by the panel's page, should bring in the tests that load the panel in `speck test --related`. Today it picks only the handful of tests that name them, because `test/support/panel.mjs` loads them through `panel.html`'s script tags and never names them.

## Why
A build that changes speck's face or mood runs too few related tests and finds what it broke only at ship. 0696's in-repo test looks as if it covers every file the page loads, but it passes only because its earlier changes stay as untracked files in the shared measured repo, so `panel.html` still counts as changed.

## Notes
- Found while building 0777: in a measured repo with the file tracked, a `speck-mood.js` change picked 5 tests, none through `test/support/panel.mjs`.
- The 0696 test likely needs each file tracked in `measuredRepo` so that one change doesn't carry over to the next.
