# Give an open Plan or Capture row room inside its fill

Captured: 2026-11-10 08:27 · Status: ticketed (0614)
From ticket: 0600
Raised by: agent

## What
An open Plan or Capture row has a raised background, and since 0600 its text runs right to that fill's edges, as the row has no side padding of its own. Give its fill some room round the text, or drop the fill, without moving the title when the row opens.

## Why
The text pressed against the fill's edge, and the highlight ring a linked id draws, look cramped on a phone.

## Notes
- From the 0600 build: letting the fill reach past the 16 px margins broke 0418's check that every row spans its list, so it was left inside them.
