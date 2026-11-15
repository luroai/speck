# Say when a sign-in check is left rather than asked

Captured: 2026-11-15 14:15 · Status: inbox
From ticket: 0679
Raised by: agent

## What
The speck-watch skill's checks in the app say to ask the user when the agent can't sign in, while the new leave action covers a check needing an account the agent can't use. Make the ask line say that, with `watch: decide`, a check needing an account it has no login for is left, and only other sign-in trouble is asked.

## Why
The two lines overlap, so the agent may stop the build with a question where 0679 meant it to carry on, or the reverse.

## Notes
- From the reviewer's minor finding F1 in 0679's round 1.
- Open question: is a saved login that fails (wrong password) something to ask about, or to leave?
