// 0283: the three facts a build records with a blocked question, each on a line of its own under `## Blocked question`:
//   Recommended: <the option it recommends>
//   Changes what you'd notice: yes | no
//   Clear winner: yes | no
// 0563: and, only on a block by the size guard, a fourth:
//   Size guard: yes
// 0589: and, beside Recommended, the options it doesn't recommend, separated by semicolons, or `none`:
//   Other options: <an option>; <another>
// 0636: and, when it asks you to check something in the running app, what to look at:
//   Check in the app: <what to look at>
// `lines` are the section's content lines. Returns the question without the lines it read, and each fact, or null when
// it's missing or can't be read. A line it can't read stays in the question, so nothing written there is lost.
const FACTS = [
  ['recommendation', /^recommended$/, v => v || null],
  ['noticeable', /^changes what you['’]d notice$/, v => yesNo(v)],
  ['clear', /^clear winner$/, v => yesNo(v)],
  ['sizeGuard', /^size guard$/, v => yesNo(v)],
  ['otherOptions', /^other options$/, v => optionList(v)],
  ['checkInApp', /^check in the app$/, v => v || null],
];
const yesNo = v => (v.toLowerCase() === 'yes' ? true : v.toLowerCase() === 'no' ? false : null);
const optionList = v => {
  const options = [...new Set(v.split(';').map(o => o.trim()).filter(Boolean))];
  return options.length === 1 && options[0].toLowerCase() === 'none' ? [] : options.length ? options : null;
};

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
