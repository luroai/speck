# Say how many builds run at once the same way everywhere

Captured: 2026-10-15 · Status: inbox
From ticket: 0210

## What
Make the brief's principle 7 reasons and the README's "One build at a time" point agree with `max_parallel_builds`: one build at a time by default, and more if you raise it in `speck/config.yml`.

## Why
The brief's principle 7 now says `max_parallel_builds` sets how many builds `speck run` keeps going at once, but its reasons still say tickets are built one after another and parallel builds would only come back as a designed feature. The README says speck doesn't run builds side by side at all. Someone reading both can't tell whether raising the setting is supported.

## Notes
- From the reviewer's minor finding F1 on 0210 (release 0.4.0).
- 0111's tests pin some of the current wording ("only as a deliberately designed feature", "WIP 1"), so they'd change too.
- Open question: is raising `max_parallel_builds` something speck supports, or only allows?
