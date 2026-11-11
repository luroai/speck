# Fix the 0285 Settings switch tests on main

Captured: 2026-11-11 15:50 · Status: inbox
From ticket: 0655
Raised by: agent

## What
Two tests in `test/foreman-0285.test.mjs` fail on main: "0285 AC3: Settings has a Foreman group, first, with the speck run switch…" (the switch stays Off after it's pressed) and "0285 AC3: a refused switch shows speck run's own message, as before". They should pass again.

## Why
They fail the full suite on main, so it counts under Needs you, and every build's related run that touches the panel fails on them, which makes it harder to see what a build broke.

## Notes
- From 0655's build: `speck test --related` failed on them, and they fail the same in a clean checkout of main.
- Not checked: the cause. The tests answer the page's requests in a fixed order (fakePage), so a request Settings has made since it opens, such as 0646's subscriptions' usage, may be taking the switch's answer.
