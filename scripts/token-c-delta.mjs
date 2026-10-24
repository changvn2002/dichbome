#!/usr/bin/env node
/**
 * §3 (V4-IMPL-STATE) — tính bộ ba số lệch cho token C duy nhất của dichbome
 * (`avatar-tint-rose` #FFE6EB) so với nguồn brand-seed #FE2C55:
 *   deltaE2000 (CIEDE2000 trên CIE Lab D65) · deltaL (OKLCH) · deltaC (OKLCH, %).
 * Thuần Node, không dependency. Chạy: node scripts/token-c-delta.mjs
 * Đầu ra được ghi vào `derivation` của token C trong design/tokens.dichbome-v4.json
 * (bản sao repo) — KHÔNG đổi bất kỳ byte màu nào.
 */
function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function rgbToXyz([r, g, b]) {
  const [R, G, B] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  return [
    R * 0.41239079926595934 + G * 0.35758433938387796 + B * 0.1804807884018343,
    R * 0.21263900587151036 + G * 0.715168678767756 + B * 0.07219231536073371,
    R * 0.01933081871559185 + G * 0.11919477979462599 + B * 0.9505321522496607,
  ];
}
function xyzToLab([x, y, z]) {
  const [xn, yn, zn] = [0.95047, 1.0, 1.08883]; // D65
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x / xn), f(y / yn), f(z / zn)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const avgCp = (C1p + C2p) / 2;
  const h = (ap, b) => {
    if (ap === 0 && b === 0) return 0;
    const deg = (Math.atan2(b, ap) * 180) / Math.PI;
    return deg >= 0 ? deg : deg + 360;
  };
  const h1p = h(a1p, b1);
  const h2p = h(a2p, b2);
  let dhp = h2p - h1p;
  if (Math.abs(dhp) > 180) dhp += dhp > 0 ? -360 : 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  let avgHp = h1p + h2p;
  if (Math.abs(h1p - h2p) > 180) avgHp += avgHp >= 360 ? -720 : 360;
  avgHp /= 2;
  const T =
    1 -
    0.17 * Math.cos(((avgHp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * avgHp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * avgHp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * avgHp - 63) * Math.PI) / 180);
  const dRo = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const Sc = 1 + 0.045 * avgCp;
  const Sh = 1 + 0.015 * avgCp * T;
  const Rt = -Math.sin((2 * dRo * Math.PI) / 180) * Rc;
  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh),
  );
}
function rgbToOklch([r, g, b]) {
  const [R, G, B] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, Bb), h: (Math.atan2(Bb, A) * 180) / Math.PI };
}

const FROM = '#FE2C55';
const TO = '#FFE6EB';
const labFrom = xyzToLab(rgbToXyz(hexToRgb(FROM)));
const labTo = xyzToLab(rgbToXyz(hexToRgb(TO)));
const okFrom = rgbToOklch(hexToRgb(FROM));
const okTo = rgbToOklch(hexToRgb(TO));
const dE = deltaE2000(labFrom, labTo);
const dL = okTo.L - okFrom.L;
const dC = okTo.C - okFrom.C;
const dCpct = (dC / okFrom.C) * 100;
// Kiểm chứng công thức mix của hồ sơ: 12% seed + 88% trắng phải cho #FFE6EB.
const mix = [0, 1, 2].map((i) =>
  Math.round(0.12 * parseInt(FROM.slice(1 + i * 2, 3 + i * 2), 16) + 0.88 * 255),
);
const mixHex = `#${mix.map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
console.log(
  JSON.stringify(
    {
      from: FROM,
      to: TO,
      mixCheck: {
        formula: '12% #FE2C55 + 88% #FFFFFF',
        resultHex: mixHex,
        matchesToken: mixHex === TO,
      },
      lab: { from: labFrom.map((v) => +v.toFixed(4)), to: labTo.map((v) => +v.toFixed(4)) },
      oklch: {
        from: { L: +okFrom.L.toFixed(6), C: +okFrom.C.toFixed(6) },
        to: { L: +okTo.L.toFixed(6), C: +okTo.C.toFixed(6) },
      },
      deltaE2000: +dE.toFixed(2),
      deltaL: +dL.toFixed(4),
      deltaC: +dC.toFixed(4),
      deltaCpct: +dCpct.toFixed(1),
    },
    null,
    2,
  ),
);
