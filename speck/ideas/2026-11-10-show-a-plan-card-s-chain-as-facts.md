# Show a Plan card's chain as facts

Captured: 2026-11-10 11:18 · Status: inbox
From ticket: 0613
Raised by: agent

## What
An open Plan card still shows a chain in the old Chain box: a bordered box with five circles over ids. Show it as the full view does since 0603, as two facts (Waits for, Waiting on it).

## Why
Since 0613 a Plan card shows Waits on as plain facts, so a card with a chain and a card waiting on two or more still look different, which 0613 meant to end for Waits on.

## Notes
- From the builder's own note while building 0613; the chain was out of its scope. `chainFacts` in templates/panel.js already draws the facts, for the full view.
