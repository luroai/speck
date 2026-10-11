// 0122: finds the lines in a test's source that read this repo's own speck/ folder. Since 0112, a test result is
// reused while nothing outside speck/ changes, so a test that read speck/ could pass or fail on a stale result.
// It looks for the forms the tests use, whether on one line or spread over several: a path built from the repo's
// root (ROOT, REPO, HERE) starting with speck, a call to a helper that reads under the repo's root passed a path
// starting with speck, and an fs call or path.resolve given a relative path starting with speck, which the suite
// resolves against the repo it runs in. A line that reads a temporary repo's speck/ folder in a way it can't tell
// apart, such as a script a test writes and runs there, says so with the marker below.
export const MARKER = 'reads a temporary repo';
const ROOTS = '(?:ROOT|REPO|HERE)';
const START = `(['"\`])(?:\\.?/)?speck(?:/|\\1)`; // 'speck', 'speck/…', '/speck/…' or './speck/…', in any quotes

// The helpers a source defines over the repo's root, such as `const read = f => fs.readFileSync(path.join(ROOT, f))`.
const rootHelpers = src => [...src.matchAll(new RegExp(`\\b(?:const|let|var)\\s+(\\w+)\\s*=\\s*\\(?\\s*(\\w+)[^=]*=>[^;]*?path\\.(?:join|resolve)\\(\\s*${ROOTS}\\s*,\\s*\\2\\b`, 'g'))].map(m => m[1]);

export function readsRepoSpeck(src) {
  const helpers = rootHelpers(src);
  const forms = [
    `\\b${ROOTS}\\s*(?:,|\\+)\\s*${START}`,
    `\\bfs\\.\\w+\\(\\s*${START}`,
    `\\bpath\\.resolve\\(\\s*${START}`,
    ...(helpers.length ? [`(?<![\\w.])(?:${helpers.join('|')})\\(\\s*${START}`] : []),
  ];
  const lines = new Set();
  for (const form of forms) {
    for (const m of src.matchAll(new RegExp(form, 'g'))) lines.add(src.slice(0, m.index).split('\n').length);
  }
  const text = src.split('\n');
  return [...lines].sort((a, b) => a - b).filter(n => !text[n - 1].includes(MARKER)).map(n => `${n}: ${text[n - 1].trim()}`);
}
