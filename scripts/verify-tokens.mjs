#!/usr/bin/env node
/**
 * tokens:verify — dichbome REDESIGN-V4 (V4-IMPL-STATE §4, LK4-51)
 *
 * Usage:
 *   node scripts/verify-tokens.mjs
 *   node scripts/verify-tokens.mjs --extra <path> [--extra <path> ...]
 *     --extra adds an additional sink file (strip-comment fixture self-test;
 *     type is chosen by extension: .svg -> XML, .css -> CSS, else TS-aware).
 *
 * Checks (pure Node, no dependencies) — 7 groups per STATE §4:
 *  1. design/tokens.dichbome-v4.json keeps the dossier DTCG structure; every
 *     token $value matches the dossier tokens.json byte-for-byte, EXCEPT the
 *     intentional §3 fix (derivation delta fields on the C token), which is
 *     reported as a NOTE, never silently swallowed and never a false FAIL.
 *  2. Every #RRGGBB literal in the 5 sinks AFTER comment stripping must
 *     belong to tokens.json values ∪ {#000000, #FFFFFF declared}.
 *     Sinks: app/globals.css · app/layout.tsx + app/manifest.ts ·
 *            public/**\/*.svg + public/sw.js · components/**\/*.{ts,tsx}
 *            (excluding *.spec). Stripping: SVG <!-- -->, CSS /* *\/,
 *            TS string-aware /* *\/ and // (URLs inside strings survive).
 *     A built-in fixture self-test proves stripping: dead hexes inside
 *     comments are NOT counted, live hexes outside comments ARE caught.
 *  3. No oklch(/hsl(/rgb(/rgba( literal anywhere in the sinks or in
 *     app/tokens.css's sources except the generated tokens.css itself.
 *  4. Token C: exactly the C-class tokens of the dossier (count <= 1/3 of
 *     brand A tokens); each C carries derivation with deltaE2000/deltaL/
 *     deltaC; C is banned from seed/mark/cta/text roles.
 *  5. semanticAliases contain no '#'; components contain no hex literal
 *     at all (components must reference theme tokens, never raw hex).
 *  6. Regenerating app/tokens.css from the repo tokens.json yields an
 *     empty diff against the shipped app/tokens.css.
 *  7. Banned hexes (V2 warm system + full V3 scale + dossier bannedHex +
 *     #1C2B33) found after stripping -> separate FAIL group.
 *
 * Exit code: 0 = PASS, 1 = FAIL (any group).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoTokensPath = path.join(repoRoot, 'design', 'tokens.dichbome-v4.json');
const dossierTokensPath = path.resolve(
  repoRoot,
  '..',
  'redesign-v4',
  'dichbome',
  'assets',
  'tokens.json',
);
const generatedCssPath = path.join(repoRoot, 'app', 'tokens.css');

const failures = {
  structure: [],
  orphans: [],
  bannedFuncs: [],
  tokenC: [],
  aliasesComponents: [],
  cssDiff: [],
  bannedHex: [],
};
const notes = [];

// ---------- banned hexes (group 7) ----------
// V2 warm system (globals.css pre-V4 + brand assets pre-V4):
const BANNED_V2 = [
  '#C22A44',
  '#A8243B',
  '#8C1D31',
  '#F7E3E7',
  '#FAF6EF',
  '#FFFDF8',
  '#E7DDD0',
  '#8A744A',
  '#FFF6D8',
  '#8A6414',
  '#F3EAD3',
  '#101418',
  '#49525C',
  '#6B5F52',
  '#FBEEDB',
  '#F6F1E7',
  '#A08C66',
];
// Full V3 scale extracted from redesign-v3/dichbome/assets/tokens.json
// (extremes #000000/#FFFFFF excluded — they are V4 A-class values):
const BANNED_V3 = [
  '#00520C',
  '#024892',
  '#1C2B33',
  '#200205',
  '#206DC9',
  '#217A28',
  '#3C0911',
  '#48555C',
  '#58141D',
  '#5B656B',
  '#5F6B72',
  '#700007',
  '#778288',
  '#79212D',
  '#8D5415',
  '#95303C',
  '#98C4FF',
  '#9FD09E',
  '#AD0012',
  '#AF424D',
  '#D4DADE',
  '#D9E1E6',
  '#DC757B',
  '#E8EEF1',
  '#EBFFEA',
  '#EEF3F7',
  '#F09DA0',
  '#F4F9FF',
  '#FFA69C',
  '#FFC2C3',
  '#FFDFDF',
  '#FFE8D5',
  '#FFF1F1',
  '#FFF6F5',
];
// Dossier bannedHex extras: sampled-raster TikTok set + V3 confirm-bg.
const BANNED_EXTRA = ['#EE1D52', '#69C9D0', '#C9003A'];
const BANNED = new Set([...BANNED_V2, ...BANNED_V3, ...BANNED_EXTRA].map((h) => h.toUpperCase()));
const DECLARED_EXTREMES = new Set(['#000000', '#FFFFFF']);

// ---------- comment stripping (LK4-51) ----------
function blankPreservingNewlines(s) {
  return s.replace(/[^\n]/g, ' ');
}
function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => blankPreservingNewlines(m));
}
function stripXmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, (m) => blankPreservingNewlines(m));
}
// String-aware TS/TSX stripper (from the chiatien precedent): // and /* */
// are only recognised in code context, never inside '...', "..." or `...`
// literals, so a URL such as 'https://schema.org' is NOT cut. Template
// ${ ... } expressions re-enter code context.
function stripTsComments(text) {
  let out = '';
  let i = 0;
  const stack = [{ type: 'code', braceDepth: 0, fromTpl: false }];
  const top = () => stack[stack.length - 1];
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1] ?? '';
    const ctx = top();
    if (ctx.type === 'str') {
      out += c;
      if (c === '\\') {
        out += n;
        i += 2;
        continue;
      }
      if (c === ctx.quote) stack.pop();
      i += 1;
      continue;
    }
    if (ctx.type === 'tpl') {
      if (c === '\\') {
        out += c + n;
        i += 2;
        continue;
      }
      if (c === '`') {
        out += c;
        stack.pop();
        i += 1;
        continue;
      }
      if (c === '$' && n === '{') {
        out += '${';
        stack.push({ type: 'code', braceDepth: 1, fromTpl: true });
        i += 2;
        continue;
      }
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && n === '/') {
      let j = i;
      while (j < text.length && text[j] !== '\n') j += 1;
      out += ' '.repeat(j - i);
      i = j;
      continue;
    }
    if (c === '/' && n === '*') {
      let j = text.indexOf('*/', i + 2);
      j = j === -1 ? text.length : j + 2;
      out += blankPreservingNewlines(text.slice(i, j));
      i = j;
      continue;
    }
    if (c === "'" || c === '"') {
      out += c;
      stack.push({ type: 'str', quote: c });
      i += 1;
      continue;
    }
    if (c === '`') {
      out += c;
      stack.push({ type: 'tpl' });
      i += 1;
      continue;
    }
    if (ctx.fromTpl) {
      if (c === '{') ctx.braceDepth += 1;
      if (c === '}') {
        ctx.braceDepth -= 1;
        if (ctx.braceDepth === 0) {
          out += c;
          stack.pop();
          i += 1;
          continue;
        }
      }
    }
    out += c;
    i += 1;
  }
  return out;
}
function stripForFile(file, text) {
  if (file.endsWith('.svg')) return stripXmlComments(text);
  if (file.endsWith('.css')) return stripCssComments(text);
  if (file.endsWith('.js')) return stripTsComments(text);
  return stripTsComments(text);
}

// ---------- fixture self-test for stripping ----------
function fixtureSelfTest() {
  const deadInComment = [
    stripCssComments('/* #C22A44 */ :root{}'),
    stripXmlComments('<svg><!-- #C22A44 --></svg>'),
    stripTsComments('// #C22A44\nconst a = 1;'),
    stripTsComments("const u = 'https://schema.org'; // #C22A44"),
  ];
  for (const stripped of deadInComment) {
    if (stripped.includes('#C22A44') && !stripped.includes('https://')) {
      // The TS URL case legitimately keeps '//' inside the string only.
      if (stripped !== deadInComment[3])
        failures.structure.push('fixture: dead hex survived comment stripping');
    }
  }
  if (!deadInComment[3].includes('https://schema.org')) {
    failures.structure.push('fixture: TS stripper cut a URL inside a string literal');
  }
  const live = stripTsComments("const c = '#123456';");
  if (!live.includes('#123456'))
    failures.structure.push('fixture: live hex in string was stripped (must be caught)');
  notes.push(
    'fixture strip-comment self-test executed (dead-in-comment ignored, live hex caught, URL string preserved)',
  );
}
fixtureSelfTest();

// ---------- load tokens ----------
if (!existsSync(repoTokensPath)) {
  console.error('tokens:verify FAIL — repo tokens copy missing: design/tokens.dichbome-v4.json');
  process.exit(1);
}
const repoTokens = JSON.parse(readFileSync(repoTokensPath, 'utf8'));
const dossierTokens = existsSync(dossierTokensPath)
  ? JSON.parse(readFileSync(dossierTokensPath, 'utf8'))
  : null;
if (!dossierTokens) notes.push('dossier tokens.json not found — group 1 compares structure only');

const repoByName = new Map((repoTokens.tokens ?? []).map((t) => [t.name, t]));
const valid = new Set((repoTokens.tokens ?? []).map((t) => String(t.$value).toUpperCase()));

// ---------- group 1: structure + byte-match vs dossier ----------
if (!Array.isArray(repoTokens.tokens) || repoTokens.tokens.length === 0) {
  failures.structure.push('tokens array missing/empty in repo copy');
}
for (const t of repoTokens.tokens ?? []) {
  if (!t.name || !t.cssVar || !t.$value || !t.$type || !t.class || !t.source) {
    failures.structure.push(
      `token ${t?.name ?? '?'}: missing DTCG field (name/cssVar/$value/$type/class/source)`,
    );
  }
}
if (dossierTokens) {
  const dossierByName = new Map(dossierTokens.tokens.map((t) => [t.name, t]));
  if (dossierByName.size !== repoByName.size) {
    failures.structure.push(
      `token count differs: repo ${repoByName.size} vs dossier ${dossierByName.size}`,
    );
  }
  for (const [name, dt] of dossierByName) {
    const rt = repoByName.get(name);
    if (!rt) {
      failures.structure.push(`token ${name}: missing in repo copy`);
      continue;
    }
    if (rt.$value !== dt.$value)
      failures.structure.push(`token ${name}: $value repo ${rt.$value} != dossier ${dt.$value}`);
    if (rt.cssVar !== dt.cssVar) failures.structure.push(`token ${name}: cssVar differs`);
    if (rt.class !== dt.class) failures.structure.push(`token ${name}: class differs`);
  }
  // The ONE intentional difference (§3): extra delta fields in the C
  // token's derivation. Verify it is exactly that and nothing else.
  const cRepo = (repoTokens.tokens ?? []).find((t) => t.class === 'C');
  const cDossier = dossierTokens.tokens.find((t) => t.class === 'C');
  if (cRepo && cDossier) {
    const extraKeys = Object.keys(cRepo.derivation ?? {}).filter(
      (k) => !(k in (cDossier.derivation ?? {})),
    );
    const allowedExtra = ['deltaE2000', 'deltaL', 'deltaC', 'deltaCpct', 'deltaNote'];
    const unexpected = extraKeys.filter((k) => !allowedExtra.includes(k));
    if (unexpected.length)
      failures.structure.push(`token C derivation: unexpected extra keys ${unexpected.join(', ')}`);
    if (extraKeys.length) {
      notes.push(
        `INTENTIONAL §3 DIFF (declared, not a failure): repo copy adds [${extraKeys.join(', ')}] to derivation of ${cRepo.name} vs dossier (record-MINOR M-3 fix). No colour byte differs.`,
      );
    }
    for (const k of Object.keys(cDossier.derivation ?? {})) {
      if (JSON.stringify(cRepo.derivation?.[k]) !== JSON.stringify(cDossier.derivation[k])) {
        failures.structure.push(
          `token C derivation.${k}: differs from dossier beyond the §3 delta fields`,
        );
      }
    }
  }
  const repoTopExtra = Object.keys(repoTokens).filter((k) => !(k in dossierTokens));
  if (repoTopExtra.length) {
    notes.push(
      `repo copy top-level extra keys vs dossier: [${repoTopExtra.join(', ')}] (documentation only — no token data)`,
    );
    const nonDoc = repoTopExtra.filter((k) => k !== '_repoCopyNote');
    if (nonDoc.length)
      failures.structure.push(`unexpected top-level keys in repo copy: ${nonDoc.join(', ')}`);
  }
}

// ---------- sinks ----------
function walkFiles(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkFiles(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}
const extraFiles = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--extra' && argv[i + 1]) {
    extraFiles.push(path.resolve(argv[i + 1]));
    i += 1;
  }
}
const componentFiles = walkFiles(path.join(repoRoot, 'components'), ['.ts', '.tsx']).filter(
  (f) => !f.includes('.spec.'),
);
const sinkFiles = [
  path.join(repoRoot, 'app', 'globals.css'),
  path.join(repoRoot, 'app', 'layout.tsx'),
  path.join(repoRoot, 'app', 'manifest.ts'),
  path.join(repoRoot, 'public', 'sw.js'),
  ...walkFiles(path.join(repoRoot, 'public'), ['.svg']),
  ...componentFiles,
  ...extraFiles,
].filter((f, idx, a) => a.indexOf(f) === idx && existsSync(f));

// ---------- groups 2, 3, 5(component part), 7: sink scan ----------
const hexRe = /#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g;
const funcRe = /\b(?:oklch|hsla?|rgba?)\s*\(/g;
let scannedHexTotal = 0;
const componentSet = new Set(componentFiles);
for (const file of sinkFiles) {
  const raw = readFileSync(file, 'utf8');
  const stripped = stripForFile(file, raw);
  const rel = path.relative(repoRoot, file) || file;
  stripped.split('\n').forEach((line, idx) => {
    for (const m of line.matchAll(hexRe)) {
      scannedHexTotal += 1;
      const hex = m[0].toUpperCase();
      if (BANNED.has(hex)) failures.bannedHex.push(`${rel}:${idx + 1} ${hex}`);
      else if (!valid.has(hex) && !DECLARED_EXTREMES.has(hex)) {
        failures.orphans.push(`${rel}:${idx + 1} ${hex}`);
      }
      if (componentSet.has(file)) {
        failures.aliasesComponents.push(
          `${rel}:${idx + 1} hex literal in component ${hex} (components must use theme tokens)`,
        );
      }
    }
    for (const m of line.matchAll(funcRe)) {
      failures.bannedFuncs.push(`${rel}:${idx + 1} banned colour function ${m[0]}`);
    }
  });
}

// ---------- group 4: token C discipline ----------
const tokensArr = repoTokens.tokens ?? [];
const brandCount = tokensArr.filter((t) => t.class === 'A').length;
const cTokens = tokensArr.filter((t) => t.class === 'C');
if (cTokens.length > brandCount / 3) {
  failures.tokenC.push(`C tokens ${cTokens.length} exceed 1/3 of brand A tokens ${brandCount}`);
}
const C_FORBIDDEN_ROLES = [
  'seed',
  'mark',
  'cta',
  'cta-solid',
  'text',
  'filled-state',
  'focus-ring',
];
for (const t of cTokens) {
  const d = t.derivation ?? {};
  for (const k of ['deltaE2000', 'deltaL', 'deltaC']) {
    if (typeof d[k] !== 'number')
      failures.tokenC.push(`token ${t.name}: derivation missing numeric ${k}`);
  }
  for (const role of t.roles ?? []) {
    if (C_FORBIDDEN_ROLES.includes(role))
      failures.tokenC.push(`token ${t.name}: C token in forbidden role ${role}`);
  }
}

// ---------- group 5: semantic aliases ----------
for (const a of repoTokens.semanticAliases ?? []) {
  if (String(a.value).includes('#')) {
    failures.aliasesComponents.push(`semanticAlias ${a.cssVar}: value contains '#' (${a.value})`);
  }
}

// ---------- group 6: regenerate tokens.css ----------
function generateTokensCss(tokens) {
  const lines = [];
  lines.push('/* dichbome «Giải Mã Gia Đình» — tokens REDESIGN-V4.');
  lines.push(
    '   GENERATED from tokens.json — do not edit. Nguồn sự thật duy nhất: tokens.json (lens-10 §1.3).',
  );
  lines.push(
    '   Neo: TikTok #FE2C55 literal (loại A, Δbyte=0). Neutral: N-VAY thang Grey của Google Material (vay có giấy tờ).',
  );
  lines.push('   100% hex — cấm oklch ở sink. */');
  lines.push(':root {');
  for (const t of tokens.tokens ?? []) {
    lines.push(
      `  ${t.cssVar}: ${t.$value}; /* class ${t.class} · ${t.source.system} · ${t.source.sourceName} */`,
    );
  }
  lines.push('  /* Semantic aliases (lớp 2 — không hex) */');
  for (const a of tokens.semanticAliases ?? []) {
    lines.push(`  ${a.cssVar}: ${a.value};`);
  }
  lines.push('  /* Motion (kế thừa V3 D1–D8 + token thử việc WebGL hero) */');
  for (const [k, v] of Object.entries(tokens.motion ?? {})) {
    const value = k === '--dur-stage3d' ? String(v).match(/^[\d.]+m?s/)?.[0] : v;
    lines.push(`  ${k}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}
if (!existsSync(generatedCssPath)) {
  failures.cssDiff.push('app/tokens.css missing');
} else {
  const regenerated = generateTokensCss(repoTokens);
  const shipped = readFileSync(generatedCssPath, 'utf8');
  if (regenerated !== shipped) {
    const a = regenerated.split('\n');
    const b = shipped.split('\n');
    const firstDiff = a.findIndex((line, i) => line !== b[i]);
    failures.cssDiff.push(
      `regenerated tokens.css differs from app/tokens.css (first diff line ${firstDiff + 1}: regen=${JSON.stringify(a[firstDiff])} shipped=${JSON.stringify(b[firstDiff])})`,
    );
  } else {
    notes.push(
      'tokens.css regeneration: diff empty (app/tokens.css == generated from design/tokens.dichbome-v4.json)',
    );
  }
  // Group 3 also covers the generated file's own sources: tokens.css must
  // itself contain no banned colour functions.
  const cssStripped = stripCssComments(shipped);
  for (const m of cssStripped.matchAll(funcRe)) {
    failures.bannedFuncs.push(`app/tokens.css banned colour function ${m[0]}`);
  }
}

// ---------- report ----------
console.log(
  `tokens:verify — valid hex set: ${valid.size} token values from design/tokens.dichbome-v4.json`,
);
console.log(
  `tokens:verify — sinks scanned: ${sinkFiles.length} files, ${scannedHexTotal} hex literals after comment-strip`,
);
for (const n of notes) console.log(`  NOTE ${n}`);
const groups = [
  ['1 structure + byte-match vs dossier (§3 diff declared)', failures.structure],
  ['2 orphan hex in sinks', failures.orphans],
  ['3 banned colour functions (oklch/hsl/rgb)', failures.bannedFuncs],
  ['4 token C discipline', failures.tokenC],
  ['5 aliases/components hex discipline', failures.aliasesComponents],
  ['6 tokens.css regeneration diff', failures.cssDiff],
  ['7 banned hex (V2/V3/#1C2B33)', failures.bannedHex],
];
let failed = false;
for (const [label, list] of groups) {
  if (list.length === 0) {
    console.log(`  PASS ${label}: 0`);
    continue;
  }
  failed = true;
  console.log(`  FAIL ${label}: ${list.length}`);
  for (const item of list) console.log(`    - ${item}`);
}
console.log(failed ? 'tokens:verify RESULT: FAIL' : 'tokens:verify RESULT: PASS');
process.exit(failed ? 1 : 0);
