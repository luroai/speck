// 0122: finds the lines in a test's source that read this repo's own speck/ folder. Since 0112, a test result is
// reused while nothing outside speck/ changes, so a test that read speck/ could pass or fail on a stale result.
// It looks for the forms the tests use: a path built from the repo's root (ROOT, REPO, HERE) starting with speck,
// and a call to a helper that reads under the repo's root, passed a path starting with speck.
const ROOTS = '(?:ROOT|REPO|HERE)';
const START = `(['"\`])(?:\\.?/)?speck(?:/|\\1)`; // 'speck', 'speck/…', '/speck/…' or './speck/…', in any quotes

// The helpers a source defines over the repo's root, such as `const read = f => fs.readFileSync(path.join(ROOT, f))`.
const rootHelpers = src => [...src.matchAll(new RegExp(`\\b(?:const|let|var)\\s+(\\w+)\\s*=\\s*\\(?\\s*(\\w+)[^=]*=>[^\\n]*?path\\.(?:join|resolve)\\(\\s*${ROOTS}\\s*,\\s*\\2\\b`, 'g'))].map(m => m[1]);

export function readsRepoSpeck(src) {
  const direct = new RegExp(`\\b${ROOTS}\\s*(?:,|\\+)\\s*${START}`);
  const helpers = rootHelpers(src);
  const called = helpers.length ? new RegExp(`(?<![\\w.])(?:${helpers.join('|')})\\(\\s*${START}`) : null;
  return src.split('\n').map((line, i) => [i + 1, line]).filter(([, l]) => direct.test(l) || called?.test(l))
    .map(([n, l]) => `${n}: ${l.trim()}`);
}
