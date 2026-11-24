# Let Settings swap the builder's and reviewer's families

Captured: 2026-11-24 19:52 · Status: inbox
From ticket: 0731
Raised by: agent

## What
Now that each setting saves by itself, there's no way in Settings to swap the builder and reviewer between families in one step, for example a Claude Code builder with a Codex reviewer to a Codex builder with a Claude Code reviewer. Let a swap like that save, for example by saving the builder and reviewer together when the one change would otherwise be refused, or by saying which order works.

## Why
Each half of the swap is refused on its own, because for a moment the builder and reviewer would be the same family, and might run the same model. Someone switching agents has to go through a third agent, or turn on same-model review for a moment, and the refusal doesn't say so.

## Notes
- From my own note while building 0731: the server's refusal used to say "pick it as the reviewer in the same Save", which 0731 removed, as there's no Save now.
- Open question: save the pair together, or just explain the way round in the refusal?
