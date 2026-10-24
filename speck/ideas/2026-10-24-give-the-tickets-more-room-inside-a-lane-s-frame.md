# Give the tickets more room inside a lane's frame

Captured: 2026-10-24 · Status: inbox
From ticket: 0478

## What
Now each lane sits in a frame, its tickets sit 36 px in from each side of the screen: the frame's gap, its side and the list's own 16 px padding. Narrow the list's padding inside the frame so tickets get back some width on a phone.

## Why
At 320 px a ticket card is 248 px wide, 40 px narrower than before 0478, so titles and details wrap sooner on the smallest phones.

## Notes
- From the builder's own note on 0478's pictures. Out of scope there ("what each lane shows inside its card").
- Open question: how much inner padding still reads well against the frame's 4 px side.
