# Use the panel from your phone

Captured: 2026-10-13 · Status: ticketed (0149)

## What
Open the panel on your phone, from anywhere, with minimal faff, while speck runs on your own machine. It behaves like an app on the home screen and tells you when your judgement is needed.

## Why
Checking progress and setting tickets ready from a phone, with a Claude chat open alongside, has been the best way to use speck on the move. Today that needs a remote browser on the box (cptr). Users running speck on their own machine have no easy way to do the same.

## Notes
- The panel must never be reachable from the public internet: it can start agents that run with permission prompts skipped. Today it listens on 127.0.0.1 and refuses any other address.
- Likely route: Tailscale. `tailscale serve` gives the panel a private `https://` address that only the user's own devices can open. A `speck panel --phone` could set that up, print the address with a QR code and accept that one extra address.
- Then: a web app manifest and icon so it opens full screen from the home screen, and notifications when a ticket is waiting to ship or blocked with a question (these need https, which `tailscale serve` gives).
- Setup could offer it and walk through installing Tailscale.
- A hosted relay (sign in on a website, see your machine) would remove the Tailscale install, but means accounts, servers and security to answer for. Not now.
- Decided 2026-10-13: keep the panel a local web app for now; this is beyond the MVP.
