# Stop builds killing panels they didn't start

Captured: 2026-11-09 23:16 · Status: ticketed (0619)
Raised by: you

## What
A build, its tests and its picture-taking should only ever stop the speck panels they started themselves, by the process or port they recorded, never every panel on the machine by name or pattern.

## Why
On 2026-11-09 at 18:56, while clearing up after a screenshot script that hung, 0583's build ran a command that killed every speck panel on the machine. A panel running as a user service restarted itself, but one started by hand stayed down. The project menu disappeared until that panel was started again at 23:15. Builds shouldn't be able to take down the panels you're using.

## Notes
- Found by speck's watcher while looking into why 0583 ran long; captured at the user's request.
- Related, the same evening: 0565's build started a demo panel on a throwaway project without keeping it out of the user's project menu (`SPECK_PANELS_DIR`), and left it running after the build, so the user's page switched to a project that no longer existed. Builds' own panels should stay out of the user's menu and stop when the build ends.
- Open: is a rule in the build skill enough (stop only what you started, keep panels out of the menu), or should speck enforce it, for example by having `speck panel --stop` refuse panels a build didn't start, or by recording the panels each build starts?
