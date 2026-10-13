---
id: "0148"
title: "Serve the panel at a private https address"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T20:25:43.697Z"

---
# 0148 · Serve the panel at a private https address

**Status:** 🔍 reviewing

## Problem
The panel only serves pages to, and accepts button presses from, `127.0.0.1` and `localhost`. A user who reaches it from their phone through a private tunnel (for example Cloudflare Tunnel behind Cloudflare Access, or `tailscale serve`) can't use it: the address is refused, and once the page loads, every button press is refused with 403.

## Outcome
`speck panel --url <https address>` also serves the panel at that one address and accepts its button presses, so it works through a private tunnel, and the address lives only in the command the user runs.

## Acceptance criteria
1. `speck panel --url https://<hostname>` (also as `--url=https://<hostname>`) serves the page and `/api/state` to requests whose Host is that hostname, as well as to `127.0.0.1` and `localhost` as today. Requests with any other Host are still refused with 403.
2. With `--url`, the panel's writes (Set ready, Back to Plan, priority, Stop build, Ship and the Auto-build switch) work from a page loaded at that address: a request with that exact Origin and the panel's token is accepted. Any other Origin, or a missing or wrong token, is still refused with 403 and changes nothing.
3. `--url` must be an `https://` address with a hostname and nothing after it except an optional trailing `/`. Anything else (`http://`, a path, a query, a username or a missing value) stops `speck panel` before it starts, with a message saying what's wrong and an example of a valid value.
4. On start, the panel prints the extra address alongside its usual local one, and when it restarts itself because its code changed, the new server keeps the same `--url`.
5. No test that passed before this change fails. Without `--url`, the panel behaves exactly as today.

## Out of scope
- Setting up a tunnel, Tailscale or Cloudflare Access. The README says the panel must only be reached through a private, logged-in tunnel, never exposed openly.
- More than one extra address.
- A config file or environment variable for the address.

## Notes
- Risk is high: this widens who the panel accepts requests from, and the panel can start agents with permission prompts skipped. The token and Origin checks must stay on every write.
- The address is given on the command line, so it is never written into the repo.
- The checks are the `origins` and `hosts` sets in `panelServer()` (`scripts/panel.mjs`). Arguments already reach a restarted server through `SPECK_PANEL_ARGS`.
- Behind a tunnel the Host header is usually the public hostname with no port; browsers send `Origin: https://<hostname>`.
- Failing before this build: none
- Self-check: no changes. Repeated `--url`, a port, a trailing dot or `..` in the hostname, an empty `--url=` and a following flag as the value are all refused before start; the extra Host is matched exactly (no port), case-insensitively.
- Decision: a port in `--url` is refused, reading AC3's "a hostname and nothing after it" literally; tunnels serve on 443.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0ae17f93f5a23e04720e8e22110403fef6d4430e",
    "thread_id": "01a136f4-7ba0-7110-be22-2de2f77abf5e",
    "seconds": 36,
    "usage": {
      "input_tokens": 145785,
      "cached_input_tokens": 99840,
      "cache_write_input_tokens": 0,
      "output_tokens": 994,
      "reasoning_output_tokens": 43
    },
    "saved_at": "2026-10-13T20:29:50.261Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelServer() in scripts/panel.mjs adds the extra hostname to the Host allowlist. Passing 0148 AC1 tests exercise both argument forms, page/state access, local hosts and rejected hosts."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Every write handler in panelServer() checks the shared Origin allowlist and token. Passing 0148 AC2 tests demonstrate Set ready succeeding from the extra address and all write routes rejecting invalid credentials, but do not demonstrate the other actions succeeding from that address."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelUrl() validates the address before cmdPanel() starts a server. The passing 0148 AC3 test exercises invalid schemes, paths, queries, credentials, ports, missing values and repeated arguments, checking explanatory errors and a valid example."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelServer() prints both addresses; startPanelServer() preserves args through SPECK_PANEL_ARGS. Both passing 0148 AC4 tests exercise printing and an actual code-triggered restart followed by remote-host access and a successful write."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full test log reports 1293 passed, zero failed and three skipped. The passing 0148 AC5 test verifies rejection of the extra host and Origin without --url, and the unchanged startup message. Existing tests were not modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0148.test.mjs",
        "issue": "AC2 explicitly requires every listed action to work from the extra address, but positive coverage exercises only Set ready. Back to Plan, priority, Stop build, Ship and both Auto-build switch directions are tested only with rejected credentials at that address.",
        "suggested_fix": "Add integration coverage using the configured Host, exact HTTPS Origin and page token for the remaining write actions, with suitable fixtures and assertions on their actual effects. Reuse existing action fixtures where practical.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change allows one private HTTPS address while retaining the Host, Origin and token protections. Validation, restart handling and the full suite pass. Before approval, tests need to show that all the promised buttons work from that address; currently only Set ready is demonstrated."
  }
}
```

</details>
