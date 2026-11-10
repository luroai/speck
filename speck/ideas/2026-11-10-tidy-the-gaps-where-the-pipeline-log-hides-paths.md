# Tidy the gaps where the Pipeline log hides paths

Captured: 2026-11-10 11:16 · Status: inbox
From ticket: 0620
Raised by: agent

## What
When the Pipeline log takes a file path or a command out of a line, the sentence around it can read oddly: "Conflicting files:" with nothing after it, or "Resume its session, or run 0457, to carry on." Say something in their place, such as "two files" or "its build", or leave out a clause that's left empty.

## Why
Since 0620 every line shows whole, so these gaps are easier to see than when lines were cut to 48 characters. Someone reading the log on a phone can't tell what was meant.

## Notes
- Builder's own note while checking 0620's lines; the stripping is in runPlain in the panel's model.
- Open: should a stripped file list say how many files there were?
