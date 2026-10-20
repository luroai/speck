# Same-model check counts models when build_command is Claude Code's own

Captured: 2026-10-20 · Status: inbox
From ticket: 0330

## What
When `build_command` is exactly Claude Code's own command, `speck run` still builds Codex and Cursor tickets with their own commands, passing `builder_model` (0324). The same-model check should count their models then too, as it does when `build_command` is blank.

## Why
Someone whose `build_command` was left at Claude Code's own (for example after switching builders by hand) is refused a Codex or Cursor builder with a reviewer on a different model, and told `builder_model` isn't passed to their builds, though it is.

## Notes
- From the builder's own note on 0330: `sameModelProblem` in `scripts/same-model.mjs` counts Codex and Cursor models only when `build_command` is blank, as 0313 and 0330's acceptance criteria ask; `buildsEachTicket` in `scripts/build-model.mjs` is what `speck run` uses.
- Open question: is that case common enough to matter, as switching builders in speck blanks `build_command`?
