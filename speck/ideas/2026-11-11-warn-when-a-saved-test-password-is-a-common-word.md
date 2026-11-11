# Warn when a saved test password is a common word

Captured: 2026-11-11 11:34 · Status: inbox
From ticket: 0635
Raised by: agent

## What
When `speck logins set` saves a password that is short or a common word, such as `test`, `admin` or `password`, say that commits holding it anywhere will be refused, and offer to keep it anyway.

## Why
Each saved password counts as a private word in every commit, in any case. A simple test password like `test` would then refuse almost every commit that touches a test file, and the user wouldn't know why until a commit fails.

## Notes
- From the builder's own self-check on 0635: test logins often have simple passwords.
- Open question: warn only, or refuse passwords under a minimum length?
