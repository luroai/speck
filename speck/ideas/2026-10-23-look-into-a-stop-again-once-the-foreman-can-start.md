# Look into a stop again once the Foreman can start

Captured: 2026-10-23 · Status: inbox
From ticket: 0392

## What
When the Foreman can't start (for example a DeepSeek Foreman with no DeepSeek key, or Claude Code missing), speck run still counts that stop as looked into. Once the key is set or Claude Code installed, it should look into the stop, rather than waiting for new commits on the ticket.

## Why
Someone who sees "the Foreman couldn't start on DeepSeek" and sets the key expects the Foreman to pick the stop up. Today it only does so after the ticket or the base branch gets a new commit, so the stop can sit unexplained.

## Notes
- From the builder's own note on 0392: the queue marks the stop as tried before it checks the agent can start, as it already did when starting the agent fails.
- Open question: retry on every check, or only when the reason it couldn't start has changed?
