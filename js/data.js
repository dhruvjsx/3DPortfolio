/* =====================================================================
   data.js — All content, palette, and settings data.
   Edit this file to update portfolio content without touching 3D code.
   ===================================================================== */

window.TWEAKS = {
  palette: 'cyan',
  stars:   1,
  look:    1,
  nebula:  0.7,
  quality: 'auto'
};

/* -------------------------------------------------------------------
   NODES — career timeline planets + contact space station.
   Fields used by scene.js (3D):
     accent / accent2  hex colors for biome shader
     size              planet radius
     rings             boolean — Saturn-style ring system
     city              boolean — city lights on dark side
     atmosphere        hex color for atmospheric glow
     lava              boolean — glowing lava cracks
     isStation         boolean — render as space station instead of planet

   Fields used by ui.js (dossier card):
     id, yearShort, year, tag, title, role, desc
     items   [{lit, text}]   bullet list
     stats   [{k, v}]        three-up stats grid
     chips   [string]        tech tag list
     contacts [{icon, label, href}]  only for isStation node
   ------------------------------------------------------------------- */
window.NODES = [
  {
    id: 'academy',
    yearShort: '2020',
    year: '2020 — 2024',
    tag: 'PLANET · 001',
    title: 'Education',
    biome: 'verdant',
    role: 'B.Tech CS/IT — IBM AI Track · SVIIT',
    desc: 'A vibrant young world, biomes still forming. Four orbits spent learning the languages of machines and the shape of thought.',
    items: [
      { lit: true,  text: 'Graduated June 2024 — CGPA 8.4 / 10' },
      { lit: true,  text: 'Specialization: IBM AI track within CS/IT' },
      { lit: true, text: 'First contact with open source, algorithms, the web' }
    ],
    stats: [{ k: 'CGPA', v: '8.4' }, { k: 'Duration', v: '4 YR' }, { k: 'Track', v: 'IBM AI' }],
    chips: ['DSA', 'AI Foundations', 'Python', 'C++', 'Web Basics'],
    accent: 0x4ef5a7, accent2: 0x7a3ad1, size: 5.6, rings: false, city: false, atmosphere: 0x9cffd0
  },
  {
    id: 'retvens',
    yearShort: '2024',
    year: 'FEB 2024 — JAN 2025',
    tag: 'PLANET · 002',
    title: 'First Job',
    biome: 'lava',
    role: 'Junior Frontend Developer · Retvens Technologies',
    desc: 'A forge-world lit from within. On-site deployment to the hospitality sector: four shipping products and a hard pivot from React into Next.js mid-mission.',
    items: [
      { lit: true,  text: 'Led development across RateX, RWorld, R-Jobs and an Admin Panel' },
      { lit: true,  text: 'Transitioned React → Next.js for SSR / SSG performance + SEO' },
      { lit: true, text: 'Owned module-level delivery, planning, and collaboration' }
    ],
    stats: [{ k: 'Products', v: '4' }, { k: 'Tenure', v: '1 Year' }, { k: 'Mode', v: 'ON-SITE' }],
    chips: ['React', 'Next.js', 'SSR/SSG', 'Redux', 'Tailwind', 'Ant Design'],
    accent: 0xff5a2b, accent2: 0xffce3a, size: 6.2, rings: true, city: false, atmosphere: 0xff9a3a, lava: true
  },
  {
    id: 'deuex',
    yearShort: '2025',
    year: 'JAN 2025 — PRESENT',
    tag: 'PLANET · 003',
    title: 'Current Company',
    biome: 'cyber',
    role: 'Frontend Engineer · Deuex Solutions',
    desc: 'A techno-city world, orbited by satellites of live data. Collate — a SaaS browser extension that surfaces insights directly on the page. 12thMen — a React Native app for real-time cricket scoring.',
    items: [
      { lit: true, text: 'Built the Collate browser extension — content scripts, contextual popups, right-click "Search on Collate"' },
      { lit: true, text: 'Redesigned Collate to cleanly split premium & free tiers' },
      { lit: true, text: 'Developed 12thMen, a React Native app for live cricket scoring' }
    ],
    stats: [{ k: 'Products', v: '2' }, { k: 'Stack', v: 'RN+EXT' }, { k: 'Mode', v: 'REMOTE' }],
    chips: ['React Native', 'Browser Extension', 'Content Scripts', 'SaaS', 'Realtime'],
    accent: 0x3ad4ff, accent2: 0xff3ad4, size: 7.0, rings: true, city: true, atmosphere: 0x8ad8ff
  },
  {
    id: 'openmeta',
    yearShort: '2025',
    year: 'FEB 2025',
    tag: 'PLANET · 004',
    title: 'Open Source ',
    biome: 'ice',
    role: 'Open Source · OpenMetadata',
    desc: 'A crystalline ice-world broadcasting on all channels. 100+ commits contributed to OpenMetadata, redesigning key modules alongside global contributors.',
    items: [
      { lit: true,  text: '100+ open-source commits shipped to core platform' },
      { lit: true,  text: 'Redesigned key modules and workflows with global contributors' },
      { lit: true, text: 'Refactored components for performance & OSS standards' }
    ],
    stats: [{ k: 'Commits', v: '100+' }, { k: 'Scope', v: 'CORE' }, { k: 'Network', v: 'GLOBAL' }],
    chips: ['Open Source', 'TypeScript', 'Metadata', 'Scalability'],
    accent: 0xf0f7ff, accent2: 0x3a7aff, size: 5.0, rings: true, city: false, atmosphere: 0xbfdfff
  },
  {
    id: 'kai',
    yearShort: '2025',
    year: 'JAN 2025',
    tag: 'PLANET · 005',
    title: 'Freelancing',
    biome: 'desert',
    role: 'Freelance · Hustle With Kai',
    desc: 'A solo expedition to an outer-rim desert colony. A full e-commerce + blog platform built end-to-end, with SEO, analytics, and direct client collaboration.',
    items: [
      { lit: true, text: 'Full e-commerce + blog platform with modern UI, seamless nav' },
      { lit: true, text: 'SEO — improved visibility, indexing, organic reach' },
      { lit: true, text: 'Microsoft Clarity integrated for heatmaps + analytics' }
    ],
    stats: [{ k: 'Scope', v: 'E-COM' }, { k: 'Role', v: 'SOLO' }, { k: 'Client', v: 'DIRECT' }],
    chips: ['Next.js', 'E-Commerce', 'SEO', 'Strapi', 'MS Clarity'],
    accent: 0xffb347, accent2: 0xd13a5a, size: 5.4, rings: false, city: false, atmosphere: 0xffa56a
  },
  {
    id: 'station',
    yearShort: 'NOW',
    year: '2026 · ACTIVE',
    tag: 'STATION · CONTACT',
    title: 'Station Alpha',
    biome: 'station',
    role: 'Mission Control · Dhruv Parmar',
    desc: 'A listening post at the edge of the timeline. Reach out for collaborations, full-time roles, freelance projects, or just to say hello.',
    items: [
      { lit: true,  text: 'Open to Frontend / Full-Stack opportunities — remote or hybrid' },
      { lit: true,  text: 'Available for freelance and contract projects' },
      { lit: true, text: 'Responds within 24 hours' }
    ],
    stats: [{ k: 'Status', v: 'OPEN' }, { k: 'Response', v: '24 H' }, { k: 'Mode', v: 'REMOTE' }],
    chips: ['React', 'Next.js', 'React Native', 'TypeScript', 'Node.js'],
    contacts: [
      { icon: 'EMAIL', label: 'dhruvdp.js@gmail.com',              href: 'mailto:dhruvdp.js@gmail.com' },
      { icon: 'GITHUB', label: 'github.com/Dhruv-Parmar',           href: 'https://github.com/Dhruv-Parmar' },
      { icon: 'RESUME', label: 'Download CV',                       href: 'assets/Dhruv_Parmar_Resume.pdf' }
    ],
    // station 3D — gold/silver palette, no biome surface
    accent: 0xffd966, accent2: 0xc8d8f0, size: 4.5,
    rings: false, city: false, atmosphere: 0xffe099,
    isStation: true
  }
];

/* -------------------------------------------------------------------
   PALETTES — global accent swatches.
   hot   = CSS oklch value for --cyan and --stroke-hot
   accent = Three.js hex for nebula tint
   ------------------------------------------------------------------- */
window.PALETTES = {
  cyan:   { hot: 'oklch(0.82 0.15 220)', accent: 0x86c7ff },
  ember:  { hot: 'oklch(0.78 0.17 55)',  accent: 0xffb176 },
  violet: { hot: 'oklch(0.68 0.22 295)', accent: 0xb388ff },
  acid:   { hot: 'oklch(0.86 0.22 140)', accent: 0x7affcf }
};
