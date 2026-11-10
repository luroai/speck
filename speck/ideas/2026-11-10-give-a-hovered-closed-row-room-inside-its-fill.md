# Give a hovered closed row room inside its fill

Captured: 2026-11-10 11:20 · Status: inbox
From ticket: 0614
Raised by: agent

## What
On a computer with a mouse, a closed Plan or Capture row under the pointer gets the same raised fill as an open one, but its text still runs right to the fill's edges. Give it the same 12 px of fill either side that an open row now has.

## Why
Since 0614 an open row's fill reaches past its text, so a hovered closed row now looks more cramped than an open one beside it, on desktop only.

## Notes
- Noticed while building 0614, which kept closed rows out of scope. The fill comes from `.item:hover` in `templates/panel-cards.css`; the open row's fix is a pair of side shadows on `.item.row.open`.
