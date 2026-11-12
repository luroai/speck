# Let speck set blank a ticket's level

Captured: 2026-11-12 12:42 · Status: inbox
From ticket: 0662
Raised by: agent

## What
`speck set <id> level ""` should blank a ticket's level, as the panel's Level menu does with Settings. Today it stops with the usage message, as only `priority` can be set to "".

## Why
Someone working from the terminal, or an agent, can give a ticket a level but can't take it off again without editing the file by hand, while the panel can.

## Notes
- Found while building 0662: the panel's Settings choice writes `level: ""`, but cmdSet in scripts/speck.mjs only lets `priority` take an empty value.
