// Copie les librairies (versions épinglées dans package.json) dans ../assets/vendor
// et les polices dans ../assets/fonts. À relancer après un changement de version.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const files = {
  'three/build/three.module.min.js': 'vendor/three/three.module.min.js',
  'three/examples/jsm/loaders/GLTFLoader.js': 'vendor/three/addons/loaders/GLTFLoader.js',
  'three/examples/jsm/loaders/DRACOLoader.js': 'vendor/three/addons/loaders/DRACOLoader.js',
  'three/examples/jsm/utils/BufferGeometryUtils.js': 'vendor/three/addons/utils/BufferGeometryUtils.js',
  'three/examples/jsm/environments/RoomEnvironment.js': 'vendor/three/addons/environments/RoomEnvironment.js',
  'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm': 'vendor/draco/draco_decoder.wasm',
  'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js': 'vendor/draco/draco_wasm_wrapper.js',
  'gsap/dist/gsap.min.js': 'vendor/gsap.min.js',
  'gsap/dist/ScrollTrigger.min.js': 'vendor/ScrollTrigger.min.js',
  'lenis/dist/lenis.mjs': 'vendor/lenis.mjs',
  '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2': 'fonts/inter-latin-wght.woff2',
  '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2': 'fonts/space-grotesk-latin-wght.woff2',
};
for (const [src, dst] of Object.entries(files)) {
  const out = new URL(`../site/assets/${dst}`, import.meta.url).pathname;
  mkdirSync(dirname(out), { recursive: true });
  cpSync(new URL(`./node_modules/${src}`, import.meta.url).pathname, out);
  console.log('✓', dst);
}
