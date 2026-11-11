// 0642: Claude Code's rate_limit_event lines and Codex's session files, as each agent writes them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FIVE_RESETS = Date.parse('2026-11-11T14:30:00Z') / 1000, WEEK_RESETS = Date.parse('2026-11-15T09:00:00Z') / 1000;

// A Claude Code rate_limit_event with these utilisations (0 to 1), and the status and window it gives.
export const CLAUDE_EVENT = ({ five, seven, status = 'allowed', type = 'five_hour' }) => ({ type: 'rate_limit_event',
  rate_limit_info: { status, resetsAt: FIVE_RESETS, rateLimitType: type, overageStatus: 'rejected', isUsingOverage: false,
    unifiedWindows: { five_hour: { utilization: five, resetsAt: FIVE_RESETS }, seven_day: { utilization: seven, resetsAt: WEEK_RESETS } } },
  uuid: 'u', session_id: 's' });

export const claudeLog = events => `${events.map(e => JSON.stringify(e)).join('\n')}\n`;

// A Codex token_count event written at `at`, with these windows' used percentages.
export const codexEvent = ({ at, five, week, reached = null }) => JSON.stringify({ timestamp: at, type: 'event_msg', payload: { type: 'token_count', info: {},
  rate_limits: { limit_id: 'codex', primary: { used_percent: five, window_minutes: 300, resets_at: FIVE_RESETS },
    secondary: { used_percent: week, window_minutes: 10080, resets_at: WEEK_RESETS }, plan_type: 'plus', rate_limit_reached_type: reached } } });

// A Codex home whose sessions folder has a rollout file for `thread` with these lines.
export function codexHomeWith(thread, lines) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-usage-'));
  const dir = path.join(home, 'sessions', '2026', '11', '11');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `rollout-2026-11-11T11-00-00-${thread}.jsonl`), `${[JSON.stringify({ type: 'session_meta', payload: { id: thread } }), ...lines].join('\n')}\n`);
  return home;
}
