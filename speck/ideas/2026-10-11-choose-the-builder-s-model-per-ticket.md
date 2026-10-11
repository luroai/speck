# Choose the builder's model per ticket

Captured: 2026-10-11 · Status: idea

## What
Build each ticket with a model that fits it, for example a cheaper, faster model for small, low-risk tickets and the strongest model for M or high-risk ones, instead of one model for every build.

## Why
Builder spend varies a lot between tickets ($0.50–2.18 for five tickets on 11 October), and many tickets are small docs or test changes that may not need the strongest model. The independent reviewer is the safety net either way.

## Notes
- The user has their own thoughts on this: start from those.
- Wait for builder tokens and cost to be recorded (the ticket from `speck/ideas/done/2026-10-11-spend-fewer-tokens-per-build.md`), so the choice rests on data.
- Open questions: chosen by size, risk, type or set per ticket (as `reviewer_model` already can be)? Who picks it, the ticket writer or a rule in config? Does a cheaper builder cost more review rounds, wiping out the saving?
- Today `build_command` in `speck/config.yml` sets the builder's command for every ticket; there's no per-ticket model.
