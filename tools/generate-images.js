const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function svgToPngBuffer(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height).png().toBuffer();
}

function bgGradientSvg({ width, height, from, to, noiseOpacity = 0.06 }) {
  const id = `g${Math.random().toString(16).slice(2)}`;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <filter id="n" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 0.25 0"/>
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#${id})"/>
  <rect width="100%" height="100%" filter="url(#n)" opacity="${noiseOpacity}"/>
</svg>
  `.trim();
}

function stickerSvg({ width, height, palette, kind, title }) {
  const {
    bg1,
    bg2,
    accent,
    ink = '#1A1A1A',
    soft = '#FFFFFF'
  } = palette;

  const safeTitle = String(title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const common = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.20"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.12"/>
    </filter>
  </defs>
  `;

  const base = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${common}
  <rect width="100%" height="100%" rx="${Math.round(width * 0.12)}" fill="url(#bg)"/>
  <g opacity="0.25">
    <circle cx="${width * 0.18}" cy="${height * 0.22}" r="${width * 0.16}" fill="${soft}"/>
    <circle cx="${width * 0.82}" cy="${height * 0.18}" r="${width * 0.10}" fill="${soft}"/>
    <circle cx="${width * 0.86}" cy="${height * 0.78}" r="${width * 0.18}" fill="${soft}"/>
  </g>
`;

  const label = `
  <g filter="url(#softShadow)">
    <rect x="${width * 0.10}" y="${height * 0.08}" width="${width * 0.80}" height="${height * 0.14}" rx="${height * 0.07}" fill="${soft}" opacity="0.92"/>
    <text x="${width * 0.50}" y="${height * 0.17}" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, system-ui" font-size="${Math.round(height * 0.06)}" fill="${ink}" opacity="0.92">${safeTitle}</text>
  </g>
`;

  const footer = `
  <g opacity="0.9">
    <rect x="${width * 0.10}" y="${height * 0.80}" width="${width * 0.80}" height="${height * 0.10}" rx="${height * 0.05}" fill="${soft}" opacity="0.55"/>
    <text x="${width * 0.14}" y="${height * 0.87}" font-family="PingFang SC, Microsoft YaHei, system-ui" font-size="${Math.round(height * 0.045)}" fill="${ink}" opacity="0.75">校园流浪动物守护</text>
  </g>
`;

  let art = '';
  if (kind === 'cat-orange') {
    art = `
  <g filter="url(#shadow)">
    <path d="M ${width * 0.18} ${height * 0.62} C ${width * 0.22} ${height * 0.36}, ${width * 0.40} ${height * 0.26}, ${width * 0.52} ${height * 0.30}
             C ${width * 0.58} ${height * 0.18}, ${width * 0.70} ${height * 0.16}, ${width * 0.78} ${height * 0.26}
             C ${width * 0.86} ${height * 0.38}, ${width * 0.86} ${height * 0.58}, ${width * 0.76} ${height * 0.66}
             C ${width * 0.66} ${height * 0.74}, ${width * 0.42} ${height * 0.78}, ${width * 0.28} ${height * 0.72}
             C ${width * 0.22} ${height * 0.70}, ${width * 0.18} ${height * 0.68}, ${width * 0.18} ${height * 0.62} Z"
          fill="${accent}" opacity="0.95"/>
  </g>
  <g>
    <circle cx="${width * 0.42}" cy="${height * 0.56}" r="${width * 0.020}" fill="${ink}" opacity="0.85"/>
    <circle cx="${width * 0.58}" cy="${height * 0.56}" r="${width * 0.020}" fill="${ink}" opacity="0.85"/>
    <path d="M ${width * 0.50} ${height * 0.58} q ${width * 0.02} ${height * 0.03} 0 ${height * 0.06} q -${width * 0.02} -${height * 0.03} 0 -${height * 0.06} Z" fill="${ink}" opacity="0.65"/>
    <path d="M ${width * 0.36} ${height * 0.61} q ${width * 0.14} ${height * 0.10} ${width * 0.28} 0" stroke="${ink}" stroke-width="${Math.max(4, Math.round(width * 0.006))}" opacity="0.20" fill="none" stroke-linecap="round"/>
  </g>
    `;
  } else if (kind === 'cat-white') {
    art = `
  <g filter="url(#shadow)">
    <path d="M ${width * 0.20} ${height * 0.62} C ${width * 0.24} ${height * 0.40}, ${width * 0.36} ${height * 0.28}, ${width * 0.50} ${height * 0.30}
             C ${width * 0.64} ${height * 0.28}, ${width * 0.78} ${height * 0.40}, ${width * 0.80} ${height * 0.60}
             C ${width * 0.82} ${height * 0.76}, ${width * 0.64} ${height * 0.80}, ${width * 0.50} ${height * 0.78}
             C ${width * 0.36} ${height * 0.80}, ${width * 0.18} ${height * 0.76}, ${width * 0.20} ${height * 0.62} Z"
          fill="${soft}" opacity="0.90"/>
    <path d="M ${width * 0.44} ${height * 0.44} q ${width * 0.06} -${height * 0.06} ${width * 0.12} 0" stroke="${accent}" stroke-width="${Math.max(5, Math.round(width * 0.010))}" opacity="0.60" fill="none" stroke-linecap="round"/>
  </g>
  <g>
    <circle cx="${width * 0.42}" cy="${height * 0.56}" r="${width * 0.018}" fill="${ink}" opacity="0.85"/>
    <circle cx="${width * 0.58}" cy="${height * 0.56}" r="${width * 0.018}" fill="${ink}" opacity="0.85"/>
    <path d="M ${width * 0.50} ${height * 0.58} q ${width * 0.02} ${height * 0.03} 0 ${height * 0.06} q -${width * 0.02} -${height * 0.03} 0 -${height * 0.06} Z" fill="${ink}" opacity="0.55"/>
  </g>
    `;
  } else if (kind === 'dog-white') {
    art = `
  <g filter="url(#shadow)">
    <path d="M ${width * 0.22} ${height * 0.62} C ${width * 0.18} ${height * 0.44}, ${width * 0.24} ${height * 0.30}, ${width * 0.38} ${height * 0.34}
             C ${width * 0.46} ${height * 0.22}, ${width * 0.54} ${height * 0.22}, ${width * 0.62} ${height * 0.34}
             C ${width * 0.78} ${height * 0.30}, ${width * 0.86} ${height * 0.44}, ${width * 0.78} ${height * 0.62}
             C ${width * 0.72} ${height * 0.74}, ${width * 0.58} ${height * 0.80}, ${width * 0.50} ${height * 0.78}
             C ${width * 0.42} ${height * 0.80}, ${width * 0.28} ${height * 0.74}, ${width * 0.22} ${height * 0.62} Z"
          fill="${soft}" opacity="0.92"/>
    <path d="M ${width * 0.18} ${height * 0.54} C ${width * 0.10} ${height * 0.52}, ${width * 0.10} ${height * 0.40}, ${width * 0.18} ${height * 0.38}
             C ${width * 0.26} ${height * 0.36}, ${width * 0.28} ${height * 0.50}, ${width * 0.22} ${height * 0.58} Z"
          fill="${accent}" opacity="0.55"/>
    <path d="M ${width * 0.82} ${height * 0.54} C ${width * 0.90} ${height * 0.52}, ${width * 0.90} ${height * 0.40}, ${width * 0.82} ${height * 0.38}
             C ${width * 0.74} ${height * 0.36}, ${width * 0.72} ${height * 0.50}, ${width * 0.78} ${height * 0.58} Z"
          fill="${accent}" opacity="0.55"/>
  </g>
  <g>
    <circle cx="${width * 0.44}" cy="${height * 0.56}" r="${width * 0.020}" fill="${ink}" opacity="0.85"/>
    <circle cx="${width * 0.56}" cy="${height * 0.56}" r="${width * 0.020}" fill="${ink}" opacity="0.85"/>
    <path d="M ${width * 0.50} ${height * 0.60} q ${width * 0.03} ${height * 0.03} 0 ${height * 0.07} q -${width * 0.03} -${height * 0.03} 0 -${height * 0.07} Z" fill="${ink}" opacity="0.70"/>
    <path d="M ${width * 0.44} ${height * 0.66} q ${width * 0.06} ${height * 0.05} ${width * 0.12} 0" stroke="${ink}" stroke-width="${Math.max(4, Math.round(width * 0.006))}" opacity="0.20" fill="none" stroke-linecap="round"/>
  </g>
    `;
  } else if (kind === 'avatar') {
    art = `
  <g filter="url(#shadow)">
    <circle cx="${width * 0.50}" cy="${height * 0.56}" r="${width * 0.24}" fill="${soft}" opacity="0.92"/>
    <path d="M ${width * 0.36} ${height * 0.70} C ${width * 0.40} ${height * 0.60}, ${width * 0.60} ${height * 0.60}, ${width * 0.64} ${height * 0.70}
             C ${width * 0.60} ${height * 0.78}, ${width * 0.40} ${height * 0.78}, ${width * 0.36} ${height * 0.70} Z"
          fill="${accent}" opacity="0.85"/>
    <circle cx="${width * 0.50}" cy="${height * 0.52}" r="${width * 0.10}" fill="${accent}" opacity="0.85"/>
  </g>
  <g opacity="0.85">
    <text x="${width * 0.50}" y="${height * 0.56}" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, system-ui" font-size="${Math.round(height * 0.12)}" fill="${ink}" opacity="0.70">${safeTitle.slice(0, 2)}</text>
  </g>
    `;
  } else if (kind === 'product-bag') {
    art = `
  <g filter="url(#shadow)">
    <rect x="${width * 0.26}" y="${height * 0.34}" width="${width * 0.48}" height="${height * 0.40}" rx="${width * 0.06}" fill="${soft}" opacity="0.92"/>
    <path d="M ${width * 0.36} ${height * 0.34} C ${width * 0.36} ${height * 0.24}, ${width * 0.64} ${height * 0.24}, ${width * 0.64} ${height * 0.34}"
      stroke="${accent}" stroke-width="${Math.max(10, Math.round(width * 0.020))}" fill="none" stroke-linecap="round" opacity="0.75"/>
    <circle cx="${width * 0.40}" cy="${height * 0.48}" r="${width * 0.05}" fill="${accent}" opacity="0.85"/>
    <circle cx="${width * 0.60}" cy="${height * 0.52}" r="${width * 0.04}" fill="${accent}" opacity="0.75"/>
    <path d="M ${width * 0.34} ${height * 0.62} q ${width * 0.16} ${height * 0.10} ${width * 0.32} 0" stroke="${ink}" stroke-width="${Math.max(6, Math.round(width * 0.010))}" opacity="0.10" fill="none" stroke-linecap="round"/>
  </g>
    `;
  } else if (kind === 'product-badge') {
    art = `
  <g filter="url(#shadow)">
    <circle cx="${width * 0.44}" cy="${height * 0.56}" r="${width * 0.18}" fill="${soft}" opacity="0.92"/>
    <circle cx="${width * 0.60}" cy="${height * 0.54}" r="${width * 0.14}" fill="${soft}" opacity="0.92"/>
    <path d="M ${width * 0.42} ${height * 0.72} l ${width * 0.06} ${height * 0.16} l -${width * 0.08} 0 Z" fill="${accent}" opacity="0.70"/>
    <path d="M ${width * 0.58} ${height * 0.68} l ${width * 0.06} ${height * 0.18} l -${width * 0.08} 0 Z" fill="${accent}" opacity="0.70"/>
    <path d="M ${width * 0.44} ${height * 0.56} l ${width * 0.05} ${height * 0.03} l -${width * 0.02} ${height * 0.06} l -${width * 0.06} -${height * 0.02} l -${width * 0.01} -${height * 0.06} Z" fill="${accent}" opacity="0.85"/>
  </g>
    `;
  } else if (kind === 'product-postcard') {
    art = `
  <g filter="url(#shadow)">
    <rect x="${width * 0.22}" y="${height * 0.34}" width="${width * 0.56}" height="${height * 0.36}" rx="${width * 0.05}" fill="${soft}" opacity="0.92"/>
    <rect x="${width * 0.26}" y="${height * 0.38}" width="${width * 0.24}" height="${height * 0.20}" rx="${width * 0.03}" fill="${accent}" opacity="0.85"/>
    <rect x="${width * 0.54}" y="${height * 0.40}" width="${width * 0.20}" height="${height * 0.02}" rx="${width * 0.01}" fill="${ink}" opacity="0.12"/>
    <rect x="${width * 0.54}" y="${height * 0.46}" width="${width * 0.18}" height="${height * 0.02}" rx="${width * 0.01}" fill="${ink}" opacity="0.10"/>
    <rect x="${width * 0.54}" y="${height * 0.52}" width="${width * 0.16}" height="${height * 0.02}" rx="${width * 0.01}" fill="${ink}" opacity="0.08"/>
  </g>
    `;
  }

  return `${base}${label}${art}${footer}</svg>`;
}

async function writePng(filePath, buffer) {
  await fs.promises.writeFile(filePath, buffer);
}

async function generate() {
  const repoRoot = path.resolve(__dirname, '..');
  const outDir = path.join(repoRoot, 'image');
  ensureDir(outDir);

  const outputs = [
    {
      name: 'animal-cat-orange.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'cat-orange',
        title: '小橘 / 橘猫',
        palette: { bg1: '#FFF1D6', bg2: '#FFD2B2', accent: '#FF8A3D', ink: '#2A1B10', soft: '#FFFFFF' }
      })
    },
    {
      name: 'animal-cat-white.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'cat-white',
        title: '雪球 / 白猫',
        palette: { bg1: '#E8F3FF', bg2: '#CDE6FF', accent: '#4D9CFF', ink: '#0F1D2A', soft: '#FFFFFF' }
      })
    },
    {
      name: 'animal-dog-white.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'dog-white',
        title: '小白 / 小狗',
        palette: { bg1: '#EAFBF2', bg2: '#C9F5E1', accent: '#2CCB8E', ink: '#0D2A1F', soft: '#FFFFFF' }
      })
    },
    {
      name: 'avatar-user-01.png',
      w: 512,
      h: 512,
      svg: stickerSvg({
        width: 512,
        height: 512,
        kind: 'avatar',
        title: '爱心',
        palette: { bg1: '#F3E8FF', bg2: '#E0C9FF', accent: '#8B5CF6', ink: '#1F1B2A', soft: '#FFFFFF' }
      })
    },
    {
      name: 'avatar-user-02.png',
      w: 512,
      h: 512,
      svg: stickerSvg({
        width: 512,
        height: 512,
        kind: 'avatar',
        title: '守护',
        palette: { bg1: '#E7FFF5', bg2: '#BFF3DE', accent: '#10B981', ink: '#0C2A1F', soft: '#FFFFFF' }
      })
    },
    {
      name: 'product-canvas-bag.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'product-bag',
        title: '猫咪帆布包',
        palette: { bg1: '#FFF7E6', bg2: '#FFE0B2', accent: '#FF6B6B', ink: '#2A1B10', soft: '#FFFFFF' }
      })
    },
    {
      name: 'product-badge-set.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'product-badge',
        title: '爱心徽章套装',
        palette: { bg1: '#E6F7FF', bg2: '#B3E5FF', accent: '#06B6D4', ink: '#06202A', soft: '#FFFFFF' }
      })
    },
    {
      name: 'product-postcards.png',
      w: 960,
      h: 960,
      svg: stickerSvg({
        width: 960,
        height: 960,
        kind: 'product-postcard',
        title: '动物主题明信片',
        palette: { bg1: '#FFF0F6', bg2: '#FFD6E7', accent: '#F43F5E', ink: '#2A0F1A', soft: '#FFFFFF' }
      })
    },
    {
      name: 'bg-soft-gradient.png',
      w: 1200,
      h: 800,
      svg: bgGradientSvg({ width: 1200, height: 800, from: '#FFF7ED', to: '#E0F2FE', noiseOpacity: 0.05 })
    }
  ];

  for (const item of outputs) {
    const buffer = await svgToPngBuffer(item.svg, item.w, item.h);
    await writePng(path.join(outDir, item.name), buffer);
  }
}

generate()
  .then(() => {
    process.stdout.write('OK\n');
  })
  .catch((err) => {
    process.stderr.write((err && err.stack) ? `${err.stack}\n` : `${String(err)}\n`);
    process.exit(1);
  });

