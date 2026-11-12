// Generates the 8 fallback backgrounds in public/backgrounds/ as 720x1280 SVGs.
// Original procedural art: empty centre, a floor/surface around y≈880-1280 for the product.
// Run: node scripts/make-backgrounds.mjs   (re-run after edits; output is deterministic)
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 720;
const H = 1280;
const out = resolve(import.meta.dirname, '..', 'public', 'backgrounds');
mkdirSync(out, { recursive: true });

/** Deterministic PRNG so the art is stable between runs. */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** Blurred bokeh circles, kept out of the centre column. */
function bokeh(seed, n, colors, { yMin = 0, yMax = 820, rMin = 14, rMax = 46, opacity = [0.25, 0.7], avoidCentre = true } = {}) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    let x = r() * W;
    if (avoidCentre && x > 210 && x < 510) x = x < 360 ? x - 200 : x + 200;
    const y = yMin + r() * (yMax - yMin);
    const rad = rMin + r() * (rMax - rMin);
    const o = opacity[0] + r() * (opacity[1] - opacity[0]);
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}" fill="${colors[i % colors.length]}" opacity="${o.toFixed(2)}"/>`;
  }
  return `<g filter="url(#blur)">${s}</g>`;
}

const svg = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>
<radialGradient id="vignette" cx="50%" cy="55%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.35"/></radialGradient>
${defs}
</defs>
${body}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>
`;

const lg = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

const scenes = {
  // Seamless cyclorama.
  studio: svg(
    lg('wall', [[0, '#9aa1ad'], [0.62, '#d9dce2'], [0.7, '#e4e6ea'], [1, '#f1f2f4']]) +
      `<radialGradient id="glow" cx="50%" cy="58%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity="0.65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `<rect width="${W}" height="${H}" fill="url(#wall)"/><rect width="${W}" height="${H}" fill="url(#glow)"/>`,
  ),

  // White marble tabletop against a warm plaster wall.
  marble: svg(
    lg('wall', [[0, '#d8d0c6'], [1, '#efe9e2']]) + lg('top', [[0, '#f4f2ef'], [1, '#dcd8d2']]),
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>
     <ellipse cx="560" cy="300" rx="260" ry="380" fill="#fff" opacity="0.35" filter="url(#soft)"/>
     <rect y="930" width="${W}" height="${H - 930}" fill="url(#top)"/>
     <rect y="926" width="${W}" height="6" fill="#fff" opacity="0.7"/>
     <g fill="none" stroke="#a9a39b" stroke-linecap="round" opacity="0.45" filter="url(#blur)">
       <path d="M-20 1010 C 140 990, 220 1080, 380 1050 S 640 1120, 760 1060" stroke-width="3"/>
       <path d="M-20 1170 C 120 1140, 260 1210, 420 1180 S 650 1230, 760 1190" stroke-width="2"/>
       <path d="M200 940 C 240 1000, 180 1100, 260 1280" stroke-width="1.5"/>
     </g>`,
  ),

  // Golden-hour beach.
  beach: svg(
    lg('sky', [[0, '#6f9fd8'], [0.45, '#b9cde4'], [0.6, '#f5d2a8']]) + lg('sea', [[0, '#5f93b8'], [1, '#8fbcd0']]) + lg('sand', [[0, '#e9cfa5'], [1, '#d8b98a']]),
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
     <circle cx="560" cy="640" r="120" fill="#ffe1b0" opacity="0.8" filter="url(#soft)"/>
     <rect y="720" width="${W}" height="140" fill="url(#sea)"/>
     <rect y="716" width="${W}" height="5" fill="#fff" opacity="0.5"/>
     <path d="M0 860 Q 360 830 720 870 L720 1280 L0 1280 Z" fill="url(#sand)"/>
     <path d="M0 868 Q 360 842 720 878" fill="none" stroke="#fff" stroke-width="5" opacity="0.6" filter="url(#blur)"/>`,
  ),

  // Sandstone palace arches.
  palace: svg(
    lg('wall', [[0, '#b98b5c'], [1, '#e0b886']]) + lg('floor', [[0, '#caa074'], [1, '#8e6743']]) + lg('arch', [[0, '#5e3f27'], [1, '#8a603d']]),
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>
     ${[[-60, 'left'], [600, 'right']].map(([x]) => `<path d="M${x} 880 L${x} 360 Q ${x + 90} 220 ${x + 180} 360 L${x + 180} 880 Z" fill="url(#arch)"/>`).join('')}
     <path d="M250 880 L250 300 Q 360 160 470 300 L470 880 Z" fill="#f2cf9c" opacity="0.45" filter="url(#soft)"/>
     <rect y="880" width="${W}" height="${H - 880}" fill="url(#floor)"/>
     <g stroke="#6e4d31" stroke-width="2" opacity="0.35">${[-600, -300, 0, 300, 600, 900, 1200].map((x) => `<line x1="360" y1="880" x2="${x}" y2="1280"/>`).join('')}
     ${[950, 1040, 1150].map((y) => `<line x1="0" y1="${y}" x2="720" y2="${y}"/>`).join('')}</g>
     <rect y="876" width="${W}" height="6" fill="#f5d6a6" opacity="0.6"/>`,
  ),

  // Evening market: warm string-light bokeh over a wooden counter.
  market: svg(
    lg('bg', [[0, '#2a1a12'], [0.7, '#5a3420'], [1, '#3a2316']]) + lg('counter', [[0, '#8a5a35'], [1, '#4a2d1a']]),
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${bokeh(7, 46, ['#ffb347', '#ffd27a', '#ff8c42', '#fff0c2'], { yMax: 860 })}
     <rect y="900" width="${W}" height="${H - 900}" fill="url(#counter)"/>
     <rect y="896" width="${W}" height="6" fill="#ffcf8a" opacity="0.5"/>
     <g stroke="#2e1b10" stroke-width="2" opacity="0.4">${[990, 1090, 1200].map((y) => `<line x1="0" y1="${y}" x2="720" y2="${y + 8}"/>`).join('')}</g>`,
  ),

  // Wooden table, warm wall, window light.
  wood: svg(
    lg('wall', [[0, '#c9b49a'], [1, '#e6d8c4']]) + lg('table', [[0, '#a8743f'], [1, '#6d4523']]),
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>
     <path d="M520 0 L720 0 L720 900 L380 900 Z" fill="#fff6e6" opacity="0.35" filter="url(#soft)"/>
     <rect y="920" width="${W}" height="${H - 920}" fill="url(#table)"/>
     <rect y="916" width="${W}" height="6" fill="#e9c08f" opacity="0.7"/>
     <g fill="none" stroke="#4e2f17" stroke-linecap="round" opacity="0.35">${[970, 1020, 1080, 1150, 1230].map((y, i) => `<path d="M-10 ${y} C 200 ${y - 12 + i * 4}, 480 ${y + 14}, 730 ${y - 4}" stroke-width="${2 + (i % 2)}"/>`).join('')}</g>`,
  ),

  // Garden: green bokeh over a stone plinth.
  garden: svg(
    lg('bg', [[0, '#2f4a2a'], [0.6, '#6f8f52'], [1, '#4c6a3a']]) + lg('stone', [[0, '#cfc8bb'], [1, '#9c9588']]),
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${bokeh(21, 40, ['#a9d18e', '#e8f5c8', '#7fb069', '#fff8d6'], { yMax: 880, rMin: 20, rMax: 60, opacity: [0.2, 0.6] })}
     <rect y="910" width="${W}" height="${H - 910}" fill="url(#stone)"/>
     <rect y="906" width="${W}" height="6" fill="#f1ece2" opacity="0.7"/>`,
  ),

  // Night city: deep blue with light bokeh over a glossy floor.
  night: svg(
    lg('bg', [[0, '#060b1c'], [0.7, '#14244a'], [1, '#0a1226']]) + lg('floor', [[0, '#1b2a50'], [1, '#05080f']]),
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     ${bokeh(42, 50, ['#8fb6ff', '#3b74ff', '#f2f5fb', '#ffd28a'], { yMin: 300, yMax: 880, rMin: 8, rMax: 30 })}
     <rect y="900" width="${W}" height="${H - 900}" fill="url(#floor)"/>
     <rect y="896" width="${W}" height="5" fill="#8fb6ff" opacity="0.5"/>
     <g opacity="0.25" transform="translate(0 1800) scale(1 -1)">${bokeh(42, 50, ['#8fb6ff', '#3b74ff', '#f2f5fb', '#ffd28a'], { yMin: 300, yMax: 880, rMin: 8, rMax: 30 })}</g>`,
  ),
};

for (const [name, content] of Object.entries(scenes)) {
  writeFileSync(resolve(out, `${name}.svg`), content.replace(/\n\s+/g, '\n'));
  console.log('wrote', `public/backgrounds/${name}.svg`);
}
