# Let speck serve --stop stop the installed service

Captured: 2026-11-26 11:16 · Status: ticketed (0772)
From ticket: 0759
Raised by: agent

## What
While `speck serve --install` has made it a service, `speck serve --stop` should stop the service (or say to use `--uninstall`), rather than stopping speck serve only for the service to start it again a few seconds later.

## Why
Someone who installed the service and runs `--stop` sees it stop, then finds it running again, which looks like a bug.

## Notes
- From the builder's own note on 0759: the service restarts speck serve whenever it stops (systemd Restart=always, launchd KeepAlive). The brief says so for now.
