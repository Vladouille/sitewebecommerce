// STL PROVISOIRE : remplace-le par le vrai fichier neve_web_demi-pince.stl.
// Même repère que le vrai : mm, pince fermée, boule Ø60 centrée à l'origine,
// plan de joint z = 0, pivot sur la droite x = -120, z = 0 (parallèle à Y).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { writeFileSync, mkdirSync } from 'node:fs';

// Diamètre de la boule (mm). Les coques s'adaptent autour.
const BALL_D = Number(process.env.BALL_D) || 80;
const RI = BALL_D / 2 + 0.4;   // rayon intérieur de la coque
const RO = RI + 2.6;           // rayon extérieur
const parts = [];
const add = (g, m) => { if (m) g.applyMatrix4(m); parts.push(g.index ? g.toNonIndexed() : g); };
const M = () => new THREE.Matrix4();

// 1. Coque hémisphérique (z >= 0)
const outer = new THREE.SphereGeometry(RO, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2);
add(outer, M().makeRotationX(Math.PI / 2));                 // pôle vers +z
const inner = new THREE.SphereGeometry(RI, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2);
inner.scale(-1, 1, 1);                                       // normales vers l'intérieur
add(inner, M().makeRotationX(Math.PI / 2));
// Collerette au plan de joint (épaisseur 2.6)
const lip = new THREE.LatheGeometry([
  new THREE.Vector2(RI, 0), new THREE.Vector2(RO + 4, 0),
  new THREE.Vector2(RO + 4, 1.6), new THREE.Vector2(RO + 2.5, 2.6), new THREE.Vector2(RO - 0.4, 2.6),
], 96);
add(lip, M().makeRotationX(Math.PI / 2));

// 2. Bras : de la coque (arrière-haut) vers le pivot
const armStart = new THREE.Vector3(-108, 0, 8);
const armEnd = new THREE.Vector3(-RO * 0.72, 0, RO * 0.72);
const len = armStart.distanceTo(armEnd);
const arm = new THREE.BoxGeometry(len, 15, 7, 24, 1, 1);
// léger galbe : le bras s'élargit vers l'avant
const p = arm.attributes.position;
for (let i = 0; i < p.count; i++) {
  const t = (p.getX(i) + len / 2) / len;
  p.setY(i, p.getY(i) * (0.8 + 0.35 * t));
}
const ang = Math.atan2(armEnd.z - armStart.z, armEnd.x - armStart.x);
const mid = armStart.clone().add(armEnd).multiplyScalar(0.5);
add(arm, M().makeTranslation(mid.x, mid.y, mid.z).multiply(M().makeRotationY(-ang)));
// stries de préhension sur le dessus du bras
for (let k = 0; k < 7; k++) {
  const t = 0.18 + k * 0.07;
  const c = armStart.clone().lerp(armEnd, t);
  const rib = new THREE.BoxGeometry(2.2, 13 * (0.8 + 0.35 * t), 1.6);
  add(rib, M().makeTranslation(c.x, 0, c.z).multiply(M().makeRotationY(-ang)).multiply(M().makeTranslation(0, 0, 4)));
}

// 3. Articulation : charnière décalée en y (1 → 12) pour s'emboîter avec la moitié B
const knuckle = new THREE.CylinderGeometry(9, 9, 11, 48);   // axe Y par défaut
add(knuckle, M().makeTranslation(-120, 6.5, 0));
const tab = new THREE.BoxGeometry(16, 11, 9);
add(tab, M().makeTranslation(-110, 6.5, 6));
// axe (goupille) visible
const pin = new THREE.CylinderGeometry(3, 3, 13, 24);
add(pin, M().makeTranslation(-120, 6.5, 0));

const geo = mergeGeometries(parts.map(g => { const n = new THREE.BufferGeometry(); n.setAttribute('position', g.attributes.position); return n; }));
const pos = geo.attributes.position;
const tris = pos.count / 3;
const buf = Buffer.alloc(84 + tris * 50);
buf.write('NEVE placeholder half-clamp, mm', 0);
buf.writeUInt32LE(tris, 80);
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
for (let t = 0; t < tris; t++) {
  a.fromBufferAttribute(pos, t * 3); b.fromBufferAttribute(pos, t * 3 + 1); c.fromBufferAttribute(pos, t * 3 + 2);
  n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
  const o = 84 + t * 50;
  [n, a, b, c].forEach((v, k) => { buf.writeFloatLE(v.x, o + k * 12); buf.writeFloatLE(v.y, o + k * 12 + 4); buf.writeFloatLE(v.z, o + k * 12 + 8); });
}
const out = new URL('../source/neve_web_demi-pince.stl', import.meta.url).pathname;
mkdirSync(new URL('../source/', import.meta.url).pathname, { recursive: true });
writeFileSync(out, buf);
console.log(`STL provisoire écrit : ${tris} triangles, ${(buf.length / 1024).toFixed(0)} Ko`);
