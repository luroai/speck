# Show each agent's usage in the panel

Captured: 2026-11-10 17:18 · Status: ticketed (0720)
Raised by: you

## What
Show where your usage is at for every agent you've connected, so you can see at a glance that Claude is getting slammed while Codex is barely used.

## Why
Usage limits now decide whether work moves (half a day was lost on 2026-11-10), and soon which agent speck switches to. Today you can't see how close any agent is to its limit until it stops.

## Notes
- Where: beside each agent in Settings → Your agents, and perhaps a compact line on the bridge or in the black bar when one is near its limit.
- Claude: its stream-json `rate_limit_event` gives the five-hour and seven-day windows' use (for example 99% and 34%) and when each resets.
- Codex and Cursor: to be checked whether their output says how much is left.
- A model provider on your own API key (such as DeepSeek) has no limit to show, but speck already records what it spent; show this week's spend instead.
- speck could also say, in its own voice, when an agent passes 90%.
- Goes with `speck/ideas/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md`.
- Checked 2026-11-11, Claude Code: every `stream-json` run has a `rate_limit_event` whose `rate_limit_info.unifiedWindows` gives `five_hour` and `seven_day`, each with `utilization` (0 to 1), `resetsAt` (epoch seconds) and `status` (`allowed` or `rejected`). speck already reads `status` and `resetsAt` (0622).
- Checked 2026-11-11, Codex 0.159.0: `codex exec --json` prints only tokens, but the session file (`~/.codex/sessions/…/rollout-*-<thread_id>.jsonl`, found by the `thread_id` speck already keeps) has `token_count` events with `rate_limits`: `primary` (300 minutes) and `secondary` (10080 minutes), each with `used_percent` and `resets_at` (epoch seconds), plus `plan_type` (`plus`) and `rate_limit_reached_type`. A refused run ends with `codex_error_info: "usage_limit_exceeded"` and "try again at 3:41 AM". So speck can read Codex's usage after every build, review round or watch run, at no extra cost.
- Checked 2026-11-11, Cursor CLI 2026.11.11: only the interactive agent's `/usage` gives usage, with no model turn: the plan (`Premium`), when it resets (`Resets 12 Nov`), Included, Auto and API each as `N% used`, and On-Demand spend (`$0`, `No monthly limit`). In print mode `/usage` goes to the model as a prompt, `agent usage` isn't a command, and `agent about --format json` gives only `subscriptionTier`. Reading it means driving the interactive screen in a pseudo-terminal and reading what it draws (done by hand with a terminal emulator), so speck would need its own way to do that with no dependencies.
