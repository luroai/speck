# Have doctor say whether the commit check is on

Captured: 2026-10-28 13:35 · Status: inbox
From ticket: 0550
Raised by: agent

## What
`speck doctor` could say whether the private-words check for commits is installed, and if not, why (its own pre-commit hook, `core.hooksPath`, or init not re-run since 0550).

## Why
`speck init` says so only once, when it runs. A project set up before 0550, or one whose hook was later replaced, silently has no check, and the user may think commits are protected when they aren't.

## Notes
- From the builder's own note while building 0550. Open question: a ✗ or only an info line, since a user with their own hook chose that.
