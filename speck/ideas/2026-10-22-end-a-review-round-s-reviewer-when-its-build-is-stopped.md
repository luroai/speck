# End a review round's reviewer when its build is stopped

Captured: 2026-10-22 · Status: inbox
From ticket: 0384

## What
Since 0384, a review round runs in a process of its own, apart from the `speck review` command that started it. Pressing Ctrl-C on `speck review`, or stopping the build that ran it, should end that round's reviewer too, as it did before.

## Why
Now the reviewer carries on until it finishes or reaches `review_timeout_minutes`, using tokens on a round nobody is waiting for, and its round may be recorded on a ticket the user meant to stop.

## Notes
- From the builder's own note on 0384 (known limit given to the reviewer in round 1).
- The waiting command blocks while it waits, so it can't catch a signal to pass on; it may need to wait in a way that lets it.
- Open question: should exit 12 then a stopped build end the reviewer, or only a stop while a command is waiting?
