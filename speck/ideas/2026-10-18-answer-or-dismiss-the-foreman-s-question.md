# Answer or dismiss the Foreman's question

Captured: 2026-10-18 · Status: inbox
From ticket: 0287

## What
Let the user answer or dismiss a question the Foreman agent asked about a stuck ticket, from the panel or the command line, instead of it waiting until the ticket's status changes.

## Why
A Foreman question counts under Needs you until the ticket moves to another status. If the user deals with it another way (for example by fixing something on the base branch), the question stays in the Foreman's status, so the header keeps saying Needs you.

## Notes
- From 0287's own notes: `agentView` drops a question only once its ticket's status differs from when it was asked.
- Open: should an answer resume the build with it, as Go with the recommendation does?
