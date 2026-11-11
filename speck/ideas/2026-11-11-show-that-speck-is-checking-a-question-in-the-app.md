# Show that speck is checking a question in the app

Captured: 2026-11-11 11:50 · Status: inbox
From ticket: 0636
Raised by: agent

## What
While speck's agent is checking a blocked question in the running app, or waiting to, the ticket's full view and the status should say so ("speck is checking this in the app"), and it shouldn't count under Needs you until the agent has asked.

## Why
Today such a ticket says "Waiting for you" and counts under Needs you even though speck is about to check it and may carry on by itself, so you may check it by hand for nothing.

## Notes
- From the builder's own note on 0636: a question with a Check in the app line is never one speck "will take", so foreman_will stays false for it.
