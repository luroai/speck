// 0283: the three facts a build records with a blocked question, each on a line of its own under `## Blocked question`:
//   Recommended: <the option it recommends>
//   Changes what you'd notice: yes | no
//   Clear winner: yes | no
// `lines` are the section's content lines. Returns the question without the lines it read, and each fact, or null when
// it's missing or can't be read. A line it can't read stays in the question, so nothing written there is lost.
const FACTS = [
  ['recommendation', /^recommended$/, v => v || null],
  ['noticeable', /^changes what you['’]d notice$/, v => yesNo(v)],
  ['clear', /^clear winner$/, v => yesNo(v)],
];
const yesNo = v => (v.toLowerCase() === 'yes' ? true : v.toLowerCase() === 'no' ? false : null);

export function questionFacts(lines = []) {
  const facts = { recommendation: null, noticeable: null, clear: null };
  const question = lines.filter(line => {
    const m = line.match(/^(?:[-*]\s+)?([^:]+):\s*(.*)$/);
    if (!m) return true;
    const fact = FACTS.find(([, name]) => name.test(m[1].trim().toLowerCase()));
    const value = fact ? fact[2](m[2].trim()) : null;
    if (value === null) return true;
    facts[fact[0]] = value; // the last one counts
    return false;
  });
  return { question: question.join('\n'), ...facts };
}
