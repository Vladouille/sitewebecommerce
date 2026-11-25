// Usage : node stl-to-glb.mjs <entrée.stl> <sortie.glb> [budgetKo=580]
// STL (mm) → GLB compressé Draco. Arêtes vives conservées (normales « pliées » à 35°),
// simplification automatique si le fichier dépasse le budget.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';

const [, , input, output, budgetArg] = process.argv;
if (!input || !output) { console.error('Usage : node stl-to-glb.mjs in.stl out.glb [budgetKo]'); process.exit(1); }
const BUDGET = (Number(budgetArg) || 580) * 1024;

const raw = readFileSync(input);
let geo = new STLLoader().parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
geo.deleteAttribute('normal');
geo = toCreasedNormals(geo, THREE.MathUtils.degToRad(35));
geo.computeBoundingBox();
const bb = geo.boundingBox;
console.log(`STL : ${geo.attributes.position.count / 3} triangles, boîte x[${bb.min.x.toFixed(1)}, ${bb.max.x.toFixed(1)}] y[${bb.min.y.toFixed(1)}, ${bb.max.y.toFixed(1)}] z[${bb.min.z.toFixed(1)}, ${bb.max.z.toFixed(1)}] mm`);
if (bb.max.x - bb.min.x < 20) console.warn('⚠ Le modèle semble très petit : vérifie que le STL est bien en mm.');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

async function build(ratio) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const posAcc = doc.createAccessor('POSITION').setType('VEC3').setArray(new Float32Array(geo.attributes.position.array)).setBuffer(buffer);
  const nrmAcc = doc.createAccessor('NORMAL').setType('VEC3').setArray(new Float32Array(geo.attributes.normal.array)).setBuffer(buffer);
  const mat = doc.createMaterial('half').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.45).setMetallicFactor(0);
  const prim = doc.createPrimitive().setAttribute('POSITION', posAcc).setAttribute('NORMAL', nrmAcc).setMaterial(mat);
  const mesh = doc.createMesh('demi-pince').addPrimitive(prim);
  const node = doc.createNode('demi-pince').setMesh(mesh);
  doc.createScene('scene').addChild(node);
  await doc.transform(weld({ tolerance: 0.0001 }), dedup(), prune());
  if (ratio < 1) {
    await MeshoptSimplifier.ready;
    await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002 }), weld({ tolerance: 0.0001 }));
  }
  doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
    method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
    encodeSpeed: 3, decodeSpeed: 5,
    quantizationVolume: 'mesh',
    quantizationBits: { POSITION: 14, NORMAL: 10 },
  });
  return io.writeBinary(doc);
}

let ratio = 1, bin;
for (let i = 0; i < 8; i++) {
  bin = await build(ratio);
  console.log(`ratio ${ratio.toFixed(2)} → ${(bin.byteLength / 1024).toFixed(0)} Ko`);
  if (bin.byteLength <= BUDGET) break;
  ratio *= Math.max(0.3, (BUDGET / bin.byteLength) * 0.9);
}
writeFileSync(output, bin);
console.log(`✓ ${output} : ${(statSync(output).size / 1024).toFixed(0)} Ko${statSync(output).size > BUDGET ? '  ⚠ AU-DESSUS DU BUDGET' : ''}`);
