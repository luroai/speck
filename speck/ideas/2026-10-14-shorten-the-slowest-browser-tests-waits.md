# Shorten the slowest browser tests' waits

Captured: 2026-10-14 · Status: dropped
From ticket: 0182

## What
Cut the time speck's existing real-browser tests spend waiting, such as fixed pauses for the panel's polls and refreshes, so they check the same things in less time.

## Why
After 0182, the 207 real-browser tests still take about 492 s of test time per full run, and starting Chromium was only about 10% of that. Almost all the rest is the tests' own waiting: the slowest (0050, 0060, 0040, 0159, 0142, 0168) take 10 to 18 s each. Every build runs the full suite three or four times.

## Notes
- From 0182's own measurement. 0183 covers how new tests are written; this is about the existing ones.
- Open question: which waits can become "wait until it happens, with a time limit", and which show that something doesn't happen and need a pause.
