# List a stopped build under Needs you

Captured: 2026-11-09 21:20 · Status: ticketed (0616)
From ticket: 0585
Raised by: agent

## What
Show a ticket whose build stopped before finishing under Needs you, with the orange dot, rather than under Building with a grey one, when nothing is going to carry it on.

## Why
Build's groups say what each ticket needs from you, and a stopped build needs someone. Today it sits among the tickets being worked on, so it's easy to miss when the Foreman isn't watching.

## Notes
- From 0585's build: its criterion 1 names three reasons for Needs you, and a stopped build isn't one, so it stays under Building for now.
- Open question: whether it should depend on the Foreman setting, as the Foreman may restart it.
