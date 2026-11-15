# Move a handed-back build to another agent while its limit holds

Captured: 2026-11-15 21:40 · Status: inbox
From ticket: 0691
Raised by: agent

## What
When an approved ticket's handed-back build stops on its agent's usage limit, let speck run move it to another agent on builder_bench, as it does for a building or reviewing ticket's build, instead of only waiting for the reset.

## Why
A handed-back build now waits out the limit, which can be five hours or more, and the ticket can't ship meanwhile, even when another agent is free.

## Notes
- Out of scope in 0691, which only carries it on after the reset; the take-over (build-take-over.mjs, 0648) still skips approved tickets.
- Open question: whether a merge or test fix is safe to move mid-way to another agent's session, which starts without the first session's context.
