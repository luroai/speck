# Show all your projects in one panel

Captured: 2026-10-11 · Status: idea

## What
The `speck panel` you start from any project also shows your other speck projects on the same machine, in the same browser tab. It's the same single panel process as today, with no global install or separate app.

## Why
With several projects on speck (speck itself, the landing site, later others), each has its own panel on its own port. One panel for all of them is a step towards local speck feeling like one app: write tickets, set them ready and walk away, across every project.

## Notes
- The list of projects lives in the user's home folder (for example `~/.config/speck/projects`), not in a repo: it holds personal folder paths, and it belongs to the user rather than to any one project.
- Each project keeps its own copy of speck in `.speck/`, possibly at a different version. The panel reads each project's status, and runs its Set ready, priority, pause, play and stop, through that project's own copy (`speck status --json` and its commands), so a version difference can't misread a project.
- It should show whether each project's `speck run` is running, and perhaps start or stop it.
- Machine-wide build limit: one build at a time applies per project, so several projects can still run several builds at once. Five builds ran this machine out of memory on 10 October. The panel is the natural place to see a limit across projects, but each `speck run` would need to respect it.
- Aimed at 0.4.0, with "one thing starts everything". Not before the polish work is done.
- Possible first step (2026-10-13): a project switcher in the panel header that lists the other panels running on this machine, each on its own port, and links to them. Each project keeps its own panel process, so it's much smaller than one panel for everything. It needs to work through a tunnel too, where each panel has its own hostname rather than a port.
- Open questions: how projects get on the list (added by hand, or added when speck runs in them)? Is the limit across projects a setting in the home folder too?
