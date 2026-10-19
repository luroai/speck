# speck status counts dropped ideas as waiting

Captured: 2026-10-09 · Status: ticketed (0325)
Triaged: 1
From ticket: 0037

## What
`speck status` should count `dropped` ideas (and probably `inbox` ones) apart from waiting ideas, or leave dropped ones out, in its `IDEAS (…)` line.

## Why
Triage (0037) sets notes to `dropped`, but `speck status` counts every idea that isn't `ticketed` as waiting, so the count grows with ideas nobody wants and misleads anyone deciding what to shape next.

## Notes
- From the builder's own note on 0037; recorded as a known limit in `speck/product.md`.
- The panel's Ideas list already leaves out `inbox` and `dropped` under 0038; this is the CLI count only.
