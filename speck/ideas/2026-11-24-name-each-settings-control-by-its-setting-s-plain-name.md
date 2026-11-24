# Name each Settings control by its setting's plain name

Captured: 2026-11-24 13:49 · Status: inbox
From ticket: 0729
Raised by: agent

## What
Give each list, box and tick box in Settings its setting's plain name as its accessible name, such as "Name" or "Watch", in place of its key, such as `speck_name`.

## Why
Since 0729, Settings shows each setting by a plain name, but its control is still labelled with the key. A screen reader reads the Name box out as "speck_name", and voice control can't find it by the name on the screen.

## Notes
- From the builder's own note on 0729. The keys stayed as the controls' labels there because many tests, quick and in a real browser, find a control by its key's label, so changing them is a ticket of its own.
- The key could stay findable another way, such as a data attribute, for those tests.
