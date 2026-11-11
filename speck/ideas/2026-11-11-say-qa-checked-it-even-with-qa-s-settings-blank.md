# Say QA checked it even with QA's settings blank

Captured: 2026-11-11 14:52 · Status: inbox
From ticket: 0651
Raised by: agent

## What
A check in the running app says QA did it in the ticket's Notes, speck run's log and the Pipeline log only once one of QA's settings is set. With all four blank, the lines still read as the engineering manager's, as before 0651. Say QA checked it in every case.

## Why
Once Settings shows QA as a team member of its own (0652), a check that QA ran but that reads as speck's will look wrong to you, and hide who checked what.

## Notes
- From 0651's own note: AC4 asked for checks to run as today with the QA settings blank, and 0636's tests pin today's wording word for word (AC5), so 0651 kept it. Doing this means updating those 0636 tests on purpose.
