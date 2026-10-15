# Keep an auto-shipping ticket's sentence out of purple

Captured: 2026-10-14 · Status: dropped
From ticket: 0168

## What
An approved ticket that auto-ship is about to ship still says "Approved · waiting for you to ship it" in purple, with its stage name in purple, though its card and its builder badge aren't purple. Its sentence should say it's about to ship, in the normal text colour, and only a ticket that really waits for you should be purple.

## Why
Purple means "waiting for you" since 0167. For the moment between approval and auto-ship starting, the card tells you two different things, and it can look as if you need to act when you don't.

## Notes
- Found while building 0168: the badge follows 0167's rule (waiting only when auto-ship doesn't cover it), the sentence follows 0156's (any approved ticket).
- Open question: what the sentence should say in that moment, for example "Approved · shipping it next".
