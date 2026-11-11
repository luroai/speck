# Keep auto-ship after a private-words fix

Captured: 2026-11-11 10:13 · Status: inbox
From ticket: 0629
Raised by: agent

## What
When a ship is refused for a private word in a ticket's latest review round, the build rewords that round by hand. Since 0629 the round then no longer matches its receipt, so the ticket waits for you at Ship. speck could do the rewording itself and keep a fresh receipt for it, so the ticket still ships by itself.

## Why
A private word in a reviewer's evidence turns an auto-ship ticket into one you have to ship by hand, for a change that only rewords a line.

## Notes
- From the builder's own note on 0629: the build skill's Private words step now says the ticket waits for the user in that case.
- Open question: whether rewording by speck (not the builder) is safe to trust as unchanged.
