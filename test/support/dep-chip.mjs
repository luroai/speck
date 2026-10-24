// 0468: a closed ticket's dependency chip, at the end of its title row, and what it says (its tooltip and name), or
// null when it has none.
export const chipOf = (p, n) => p.all(n).find(x => x.className === 'dep-chip') || null;
export const chipSaid = (p, n) => { const c = chipOf(p, n); return c ? c.title : null; };
