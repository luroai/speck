# Keep Shipped's figure labels whole at middle widths

Captured: 2026-11-10 10:13 · Status: inbox
From ticket: 0606
Raised by: agent

## What
Between 480 and about 760 px wide, Shipped's figures switch to four columns, which are too narrow for the longer labels ("median review rounds", "median builder tokens"), so they end in an ellipsis. Switch to four columns only once the labels fit, or let the label wrap at those widths.

## Why
A side-panel column or a small tablet often sits in that range, and cut-off labels there look as untidy as what 0606 fixed on a phone.

## Notes
- From the builder's own check during 0606: every label is whole on a phone from 375 px and at the full 720 px column; 0606's AC2 set the 480 px breakpoint.
- Open question: move the breakpoint to about 760 px, or measure the column (a container query) rather than the window?
