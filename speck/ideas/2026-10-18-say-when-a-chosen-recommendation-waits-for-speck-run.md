# Say when a chosen recommendation waits for speck run

Captured: 2026-10-18 · Status: inbox
Triaged: 1
From ticket: 0284

## What
After you press Go with the recommendation while speck run is off, the ticket shows as building with its timer running, though nothing runs until speck run is turned on. The panel should say it's waiting for speck run, and show the server's message ("speck run is off: turn it on and it resumes …") after the press.

## Why
Someone who presses the button with speck run off sees a ticket that looks like it's being built, and may wait for a build that never starts.

## Notes
- From the builder's own note on 0284. The server already returns the message on success; the page ignores it.
- Open question: should the button turn speck run on itself, or just say so?
