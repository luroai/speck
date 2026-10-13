---
id: "0148"
title: "Serve the panel at a private https address"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
