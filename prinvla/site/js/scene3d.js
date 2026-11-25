// PRINVLA — scène Three.js : deux demi-pinces articulées, boule de neige et « pop ».
// Repère du STL (mm) : boule Ø60 à l'origine, joint z = 0, pivot sur x = -120, z = 0 (axe Y).
// Moitié B = moitié A tournée de 180° autour de X. Ouverture : A à +θ (l'avant monte), B à −θ.
import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '../assets/vendor/three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from '../assets/vendor/three/addons/environments/RoomEnvironment.js';

const BASE = new URL('../', import.meta.url);
const PIVOT_X = -120;
const THETA_MAX = 16;
const KAKI = '#5B6B3F';
const BORDEAUX = '#7A1F2B';
const GLACIER = '#9FE8FF';
const MAX_TILT = THREE.MathUtils.degToRad(8);
// Diamètre réel de la boule de neige (mm) : à ajuster sur ton vrai produit.
const BALL_DIAMETER = 80;

// Matériau satiné + fines couches d'impression + liseré glacier (fresnel)
function printMaterial(hex) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: hex, roughness: 0.5, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.5, envMapIntensity: 0.3,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uLayer = { value: 0.8 };
    shader.uniforms.uLayerAmp = { value: 0.22 };
    shader.uniforms.uRim = { value: new THREE.Color(GLACIER) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerCoord;\nvarying vec3 vLayerDir;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLayerCoord = position.z;\nvLayerDir = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vLayerCoord;\nvarying vec3 vLayerDir;\nuniform float uLayer;\nuniform float uLayerAmp;\nuniform vec3 uRim;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          float lz = vLayerCoord / uLayer;
          float aa = clamp(1.4 - fwidth(lz) * 2.2, 0.0, 1.0);
          normal = normalize(normal + vLayerDir * sin(lz * 6.2831853) * uLayerAmp * aa);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
          totalEmissiveRadiance += uRim * fr * 0.32;
        }`);
  };
  return mat;
}

function snowTexture() {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 170 + Math.random() * 85;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.25;
  for (let k = 0; k < 140; k++) {
    g.fillStyle = Math.random() > 0.5 ? '#fff' : '#9aa';
    g.beginPath(); g.arc(Math.random() * s, Math.random() * s, 1 + Math.random() * 5, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

function dotSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(235,248,255,.9)');
  grd.addColorStop(1, 'rgba(159,232,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/**
 * @param {HTMLElement} container
 * @param {{ halves?: 'both'|'A'|'B', theta?: number, ball?: boolean, interactive?: boolean, preserveDrawingBuffer?: boolean, dpr?: number, yaw?: number }} opts
 */
export async function createScene(container, opts = {}) {
  const o = { halves: 'both', interactive: true, preserveDrawingBuffer: false, yaw: -0.5, zoom: 1, offsetY: 0, ...opts };
  const isSmall = matchMedia('(max-width: 899px)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: o.preserveDrawingBuffer });
  renderer.setPixelRatio(o.dpr ?? Math.min(devicePixelRatio || 1, isSmall ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(26, 1, 10, 3000);

  // Éclairage froid + rim light glacier
  scene.add(new THREE.HemisphereLight('#d8f3ff', '#0b1018', 0.35));
  const key = new THREE.DirectionalLight('#eef8ff', 1.9); key.position.set(220, 380, 420); scene.add(key);
  const rim = new THREE.DirectionalLight(GLACIER, 5.5); rim.position.set(-380, 160, -420); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(GLACIER, 2.2); rim2.position.set(420, -60, -300); scene.add(rim2);

  // Chargement du GLB Draco
  // Version « fichier unique » : modèle et décodeur Draco embarqués en base64 (window.__NEVE_EMBED__)
  const EMBED = globalThis.__NEVE_EMBED__ || null;
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
  const draco = new DRACOLoader().setDecoderConfig({ type: 'wasm' });
  if (EMBED?.dracoWasm) {
    draco._loadLibrary = (name) => Promise.resolve(name.endsWith('.wasm') ? b64(EMBED.dracoWasm) : EMBED.dracoWrapper);
  } else {
    draco.setDecoderPath(EMBED?.dracoPath || new URL('assets/vendor/draco/', BASE).href);
  }
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const gltf = EMBED?.glbUrl ? await loader.loadAsync(EMBED.glbUrl)
    : EMBED?.glb ? await loader.parseAsync(b64(EMBED.glb), '')
    : await loader.loadAsync(new URL('assets/model/neve.glb', BASE).href);
  draco.dispose();
  let geometry;
  gltf.scene.traverse((n) => { if (n.isMesh && !geometry) geometry = n.geometry; });

  // Hiérarchie : rig (parallaxe) → model (repère STL, z vers le haut) → pivots
  const rig = new THREE.Group();
  const model = new THREE.Group();
  model.rotation.x = -Math.PI / 2;       // z du STL → haut de l'écran
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const spanX = bb.max.x - bb.min.x;
  model.position.x = -(bb.min.x + bb.max.x) / 2;   // recentre l'ensemble, quel que soit le STL
  rig.add(model);
  rig.rotation.y = o.yaw;
  rig.position.y = o.offsetY;
  scene.add(rig);

  const makeHalf = (mat, flip) => {
    const pivot = new THREE.Group();
    pivot.position.set(PIVOT_X, 0, 0);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(-PIVOT_X, 0, 0);
    if (flip) mesh.rotation.x = Math.PI;  // moitié B : 180° autour de X
    pivot.add(mesh);
    model.add(pivot);
    return pivot;
  };
  const pivotA = o.halves !== 'B' ? makeHalf(printMaterial(KAKI), false) : null;
  const pivotB = o.halves !== 'A' ? makeHalf(printMaterial(BORDEAUX), true) : null;

  // Boule de neige Ø60
  const snowTex = snowTexture();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_DIAMETER / 2 - 0.4, 64, 48),
    new THREE.MeshStandardMaterial({ color: '#f3f8fb', roughness: 0.92, bumpMap: snowTex, bumpScale: 2.2, emissive: '#bfe9ff', emissiveIntensity: 0.06, envMapIntensity: 0.6 }),
  );
  ball.scale.setScalar(0.0001);
  ball.visible = false;
  model.add(ball);

  // Particules du « pop »
  const N = 90;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(N * 3);
  const pVel = new Float32Array(N * 3);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ size: 4.2, map: dotSprite(), transparent: true, depthWrite: false, opacity: 0, color: '#ffffff' });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  model.add(points);
  let popT = -1;

  function pop() {
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = BALL_DIAMETER / 2 + Math.random() * 4;
      pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = Math.sin(a) * r; pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const sp = 70 + Math.random() * 120;
      pVel[i * 3] = Math.cos(a) * sp; pVel[i * 3 + 1] = Math.sin(a) * sp; pVel[i * 3 + 2] = 40 + Math.random() * 120;
    }
    pGeo.attributes.position.needsUpdate = true;
    popT = 0;
    bump = 1;
  }

  // État
  let visible = true, raf = 0, last = performance.now(), idle = 0;
  let theta = o.theta ?? THETA_MAX;
  let progress = 0;
  let closedOnce = false;
  let bump = 0;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

  function applyTheta() {
    const t = THREE.MathUtils.degToRad(theta);
    if (pivotA) pivotA.rotation.y = -t;  // avant vers le haut
    if (pivotB) pivotB.rotation.y = t;   // avant vers le bas
  }

  function setProgress(p) {
    progress = THREE.MathUtils.clamp(p, 0, 1);
    const e = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOutQuad
    theta = THETA_MAX * (1 - e);
    applyTheta();
    const s = THREE.MathUtils.smoothstep(progress, 0.62, 0.9);
    ball.visible = s > 0.001;
    ball.scale.setScalar(Math.max(0.0001, s));
    if (progress > 0.97 && !closedOnce) { closedOnce = true; pop(); }
    if (progress < 0.6) closedOnce = false;
    kick();
  }

  if (o.ball) { ball.visible = true; ball.scale.setScalar(1); }
  applyTheta();

  // Cadrage
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const fitW = (spanX * 1.13) / o.zoom, fitH = (spanX * 0.9) / o.zoom;
    const d = Math.max(fitH / 2 / Math.tan(vfov / 2), fitW / 2 / Math.tan(hfov / 2));
    camera.position.set(0, d * 0.36, d);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    kick();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Parallaxe : souris (desktop) / gyroscope (Android, sans demande d'autorisation)
  const onPointer = (e) => {
    if (e.pointerType === 'touch') return;
    tilt.ty = ((e.clientX / innerWidth) * 2 - 1) * MAX_TILT;
    tilt.tx = ((e.clientY / innerHeight) * 2 - 1) * MAX_TILT * 0.7;
    kick();
  };
  const onOrient = (e) => {
    if (e.gamma == null) return;
    tilt.ty = THREE.MathUtils.clamp(e.gamma / 30, -1, 1) * MAX_TILT;
    tilt.tx = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1) * MAX_TILT * 0.7;
    kick();
  };
  if (o.interactive) {
    addEventListener('pointermove', onPointer, { passive: true });
    // iOS exige une autorisation (popup) : on ne la déclenche pas, ça nuirait à la conversion.
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      addEventListener('deviceorientation', onOrient, { passive: true });
    }
  }

  // Boucle de rendu : uniquement quand la scène est visible et qu'il se passe quelque chose
  const clock0 = performance.now();
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let busy = false;

    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 5);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 5);
    if (Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.0005) busy = true;
    const sway = o.interactive ? Math.sin((now - clock0) / 1600) * 0.035 : 0;
    rig.rotation.set(tilt.x + sway * 0.4, o.yaw + tilt.y + sway, 0);

    if (bump > 0) {
      bump = Math.max(0, bump - dt * 3.2);
      const b = Math.sin(bump * Math.PI) * 0.035;
      rig.scale.setScalar(1 + b);
      busy = true;
    }

    if (popT >= 0) {
      popT += dt;
      for (let i = 0; i < N; i++) {
        pVel[i * 3 + 2] -= 420 * dt;  // gravité (vers -z du modèle = bas)
        pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      }
      pGeo.attributes.position.needsUpdate = true;
      pMat.opacity = Math.max(0, 1 - popT / 1.1);
      if (popT > 1.1) { popT = -1; pMat.opacity = 0; }
      busy = true;
    }

    renderer.render(scene, camera);
    idle = busy ? 0 : idle + 1;
    if (visible && o.interactive) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) kick(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  if (o.interactive) io.observe(container);

  renderer.render(scene, camera);

  return {
    canvas: renderer.domElement,
    setProgress,
    setTheta(t) { theta = t; applyTheta(); kick(); },
    setBall(on) { ball.visible = on; ball.scale.setScalar(on ? 1 : 0.0001); },
    pop,
    render() { renderer.render(scene, camera); },
    dispose() {
      ro.disconnect(); io.disconnect();
      removeEventListener('pointermove', onPointer); removeEventListener('deviceorientation', onOrient);
      if (raf) cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
