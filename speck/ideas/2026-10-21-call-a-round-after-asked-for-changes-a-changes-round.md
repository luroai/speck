# Call a round after asked-for changes a changes round

Captured: 2026-10-21 · Status: dropped
From ticket: 0356

## What
A review round that checks changes the user asked for with `speck changes` is labelled "merge round" in the Review log, the review pack and the panel, as any round after an approval is. Label it as a round for the user's changes instead.

## Why
With `speck changes`, rounds after an approval become common, and most have nothing to do with merging. Reading "merge round" on them is confusing for someone checking what happened to their note.

## Notes
- From the builder's own note on 0356. 0241 left renaming merge rounds out of scope and listed it as a known limit.
- Open question: keep `max_merge_rounds` as their limit, or give changes rounds their own?
