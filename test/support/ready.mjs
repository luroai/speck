// 0108: the line speck run prints while a ready ticket waits to be committed before it's launched. 0337: only that
// line, not every line about the ticket that mentions a commit, such as the one for a build that never started it.
export const waitingLine = /0001[^\n]*(not committed|waiting[^\n]*commit)/i;
