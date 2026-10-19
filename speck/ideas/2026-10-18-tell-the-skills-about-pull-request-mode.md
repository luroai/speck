# Tell the skills about pull request mode

Captured: 2026-10-18 · Status: dropped
From ticket: 0296

## What
The speck-ship skill should say that with `ship_mode: pr` shipping merges the ticket's pull request on GitHub, and speck-setup should offer pull request mode instead of warning that speck can't work with a base branch that requires pull requests.

## Why
An agent following the skills explains shipping as a local merge and push, and setup steers teams with protected branches away from speck, though pull request mode now handles them.

## Notes
- From 0296's build: an older test (ship.test.mjs, "AC1: the build ends at approved, with no PR and no GitHub CLI") keeps "pull request" and `gh` out of the build, review and ship skills, so that rule needs narrowing too.
