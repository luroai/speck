// Each look's colour tokens and the WCAG contrast between two colours, for tests that check the stylesheet's colours.
import { styles } from './panel.mjs';

const vars = block => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
// Each look's tokens: every plain :root block, and the dark look's block over them.
export function looks(text = styles()) {
  const plain = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const light = Object.assign({}, ...[...plain.matchAll(/(?:^|\n)\s*:root \{([^}]*)\}/g)].map(m => vars(m[1])));
  const dark = { ...light, ...Object.assign({}, ...[...plain.matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => vars(m[1]))) };
  return { light, dark };
}
// '#rrggbb' or '#rrggbbaa' as [r, g, b, a], each from 0 to 1.
export const rgba = hex => [1, 3, 5, 7].map(i => (hex.length > i ? parseInt(hex.slice(i, i + 2), 16) : 255) / 255);
// A colour with an alpha laid over an opaque one.
export const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
export const toHex = c => `#${c.slice(0, 3).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
// The contrast of `fg`, laid over `bg` when it has an alpha, against `bg`.
export const contrast = (fg, bg) => { const back = rgba(bg), front = over(rgba(fg), back); const [x, y] = [lum(front), lum(back)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
