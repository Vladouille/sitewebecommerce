// =====================================================================
// Aurore : la ville en 3D (three.js)
// =====================================================================
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as M from './models.js';
import { N, BUILDINGS, ZONES } from './data.js';
import { sizeOf, dateOf, hash01, rng, svc } from './sim.js';

const T = N * N;
const H = N / 2;
const idx = (x, y) => y * N + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const WATER_Y = -0.1;

// uniformes partagés : neige, temps, vent
const U = { snow: { value: 0 }, time: { value: 0 }, wet: { value: 0 } };

// injecte la neige (surfaces tournées vers le ciel) dans un matériau standard
function snowify(mat, { sway = false } = {}) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSnow = U.snow; sh.uniforms.uTime = U.time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vSnowY;\nuniform float uTime;')
      .replace('#include <defaultnormal_vertex>', `#include <defaultnormal_vertex>
        vec3 snN = objectNormal;
        #ifdef USE_INSTANCING
          snN = mat3(instanceMatrix) * snN;
        #endif
        vSnowY = normalize(mat3(modelMatrix) * snN).y;`)
      .replace('#include <begin_vertex>', sway ? `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
          transformed.x += sin(uTime * 1.6 + ph) * 0.05 * max(0.0, position.y - 0.12);
          transformed.z += cos(uTime * 1.3 + ph) * 0.03 * max(0.0, position.y - 0.12);
        #endif` : '#include <begin_vertex>');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vSnowY;\nuniform float uSnow;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 1.0), uSnow * smoothstep(0.45, 0.85, vSnowY));`);
  };
  mat.customProgramCacheKey = () => (sway ? 'snow-sway' : 'snow');
  return mat;
}

// ---------------------------------------------------------------------
// Particules (fumée, feu, étincelles) : un seul objet par mode de fusion
// ---------------------------------------------------------------------
class Particles {
  constructor(max, additive) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.grow = new Float32Array(max); this.base = new Float32Array(max * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    const mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 400 } },
      vertexShader: `attribute vec4 pcolor; attribute float psize; varying vec4 vC; uniform float uScale;
        void main(){ vC = pcolor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = psize * uScale / -mv.z; }`,
      fragmentShader: `varying vec4 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d); gl_FragColor = vec4(vC.rgb, vC.a * a); }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }
  emit(x, y, z, vx, vy, vz, life, size, grow, r, g, b, a) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3);
    this.life[i] = 0; this.maxLife[i] = life; this.size[i] = size; this.grow[i] = grow;
    this.base.set([r, g, b, a], i * 4);
  }
  update(dt, wind) {
    let j = 0;
    for (let i = 0; i < this.n; i++) {
      const l = this.life[i] + dt;
      if (l >= this.maxLife[i]) continue;
      if (j !== i) {
        this.pos.copyWithin(j * 3, i * 3, i * 3 + 3); this.vel.copyWithin(j * 3, i * 3, i * 3 + 3);
        this.base.copyWithin(j * 4, i * 4, i * 4 + 4);
        this.maxLife[j] = this.maxLife[i]; this.size[j] = this.size[i]; this.grow[j] = this.grow[i];
      }
      this.life[j] = l;
      const k = l / this.maxLife[j];
      this.pos[j * 3] += (this.vel[j * 3] + wind.x * k) * dt;
      this.pos[j * 3 + 1] += this.vel[j * 3 + 1] * dt;
      this.pos[j * 3 + 2] += (this.vel[j * 3 + 2] + wind.y * k) * dt;
      this.size[j] += this.grow[j] * dt;
      const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      this.col[j * 4] = this.base[j * 4]; this.col[j * 4 + 1] = this.base[j * 4 + 1]; this.col[j * 4 + 2] = this.base[j * 4 + 2];
      this.col[j * 4 + 3] = this.base[j * 4 + 3] * fade;
      j++;
    }
    this.n = j;
    this.geo.setDrawRange(0, this.n);
    for (const a of ['position', 'pcolor', 'psize']) this.geo.attributes[a].needsUpdate = true;
  }
}

// ---------------------------------------------------------------------
// La vue
// ---------------------------------------------------------------------
export class View {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.quality = opts.quality || 'haut';
    this.reduced = !!opts.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.2, 900);
    this.camera.position.set(-24, 30, 30);
    this.controls = new MapControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.09;
    this.controls.maxPolarAngle = 1.28; this.controls.minPolarAngle = 0.15;
    this.controls.minDistance = 4; this.controls.maxDistance = 75;
    this.controls.screenSpacePanning = false;
    this.controls.zoomToCursor = true;
    this.controls.target.set(-8, 0, 2);
    this.raycaster = new THREE.Raycaster();
    this.timeOfDay = 0.36; this.dayLength = 360; this.dayMode = 'cycle';
    this.weather = { kind: 'clair', rain: 0, target: 'clair', clouds: 0.3, fog: 0, next: 60 };
    this.wind = new THREE.Vector2(0.25, 0.08);
    this.overlay = null;
    this.clock = 0;
    this.tex = {};
    this.buildMaterials();
    this.buildSky();
    this.buildLights();
    this.buildStatic();
    this.setQuality(this.quality);
    this.resize();
  }

  // ---------------- Matériaux ----------------
  buildMaterials() {
    const facade = {};
    for (const st of ['res', 'house', 'com', 'ind', 'off']) {
      const t = M.makeFacade(st, st.length);
      const common = { map: t.map, vertexColors: true, roughness: st === 'off' ? 0.35 : 0.82, metalness: st === 'off' ? 0.35 : 0.02 };
      facade[st] = {
        lit: snowify(new THREE.MeshStandardMaterial({ ...common, emissiveMap: t.em, emissive: new THREE.Color('#ffd7a0'), emissiveIntensity: 0 })),
        dark: snowify(new THREE.MeshStandardMaterial({ ...common })),
      };
    }
    this.mat = {
      facade,
      plain: snowify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02 })),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      glowDark: new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.35, 0.35, 0.35) }),
      ground: snowify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 })),
      tree: snowify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { sway: true }),
      car: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.4 }),
      carLights: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      scaffold: new THREE.MeshStandardMaterial({ map: M.makeScaffoldTexture(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.8 }),
      crane: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
      lampHead: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
      tile: new THREE.MeshBasicMaterial({ map: M.makeTileTexture(), transparent: true, depthWrite: false, opacity: 0.9 }),
      ghost: new THREE.MeshStandardMaterial({ color: '#7fe08a', transparent: true, opacity: 0.55, roughness: 0.6, depthWrite: false }),
    };
    this.mat.tile.polygonOffset = true; this.mat.tile.polygonOffsetFactor = -2;
    this.waterNormal = M.makeWaterNormal();
    this.waterNormal.repeat.set(30, 30);
    this.mat.water = new THREE.MeshStandardMaterial({
      color: '#2d6f8e', roughness: 0.07, metalness: 0.15, transparent: true, opacity: 0.86,
      normalMap: this.waterNormal, normalScale: new THREE.Vector2(0.28, 0.28),
    });
    this.roadMats = [[], []];
    for (let k = 0; k < 2; k++) for (let sh = 0; sh < 6; sh++) {
      this.roadMats[k][sh] = snowify(new THREE.MeshStandardMaterial({ map: M.makeRoadTexture(sh, k === 1), roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -1 }));
    }
  }

  // ---------------- Ciel ----------------
  buildSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
        sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, night: { value: 0 }, cloud: { value: 0 },
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `varying vec3 vDir; uniform vec3 top, horizon, bottom, sunCol, sunDir; uniform float night, cloud;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
        void main(){
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 c = y > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.7, y), 0.7)) : mix(horizon, bottom, smoothstep(0.0, -0.25, y));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunCol * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.35) * (1.0 - cloud * 0.7);
          vec3 md = normalize(-sunDir);
          float m = max(dot(d, md), 0.0);
          c += vec3(0.85,0.9,1.0) * (smoothstep(0.9993, 0.9996, m) * 1.2 + pow(m, 60.0) * 0.12) * night;
          vec3 q = floor(d * 260.0);
          float st = step(0.9965, h(q)) * smoothstep(0.02, 0.3, y) * night * (1.0 - cloud);
          c += vec3(st) * (0.6 + 0.4 * h(q + 1.0));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), mat);
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog('#bcd3e6', 60, 260);
    // scène à part pour les reflets de l'eau
    this.envScene = new THREE.Scene();
    this.envScene.add(new THREE.Mesh(this.sky.geometry, mat));
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envAt = -99;
  }
  buildLights() {
    this.hemi = new THREE.HemisphereLight('#bfd9ff', '#5b6b3f', 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff2dd', 2.6);
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.025;
    this.scene.add(this.sun, this.sun.target);
  }

  setQuality(q) {
    this.quality = q;
    const r = this.renderer;
    const dpr = window.devicePixelRatio || 1;
    r.setPixelRatio(Math.min(dpr, q === 'haut' ? 2 : q === 'moyen' ? 1.5 : 1));
    r.shadowMap.enabled = q !== 'bas';
    this.sun.castShadow = q !== 'bas';
    const ms = q === 'haut' ? 4096 : 2048;
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.sun.shadow.mapSize.set(ms, ms);
    this.composer = null;
    if (q === 'haut') {
      const size = r.getDrawingBufferSize(new THREE.Vector2());
      const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
      this.composer = new EffectComposer(r, rt);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.4, 0.55, 0.86);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    this.scene.traverse((o) => { if (o.material) { const ms2 = Array.isArray(o.material) ? o.material : [o.material]; ms2.forEach((m) => { m.needsUpdate = true; }); } });
    this.resize();
  }
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) {
      const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      this.composer.setSize(w, h);
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      if (this.bloom) this.bloom.resolution.set(size.x, size.y);
    }
    this.particleScale = h * this.renderer.getPixelRatio() * 0.9;
  }

  // ---------------- Objets fixes (réutilisés d'une partie à l'autre) ----------------
  buildStatic() {
    const sc = this.scene;
    // eau
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), this.mat.water);
    this.water.rotation.x = -Math.PI / 2; this.water.position.y = WATER_Y;
    this.water.receiveShadow = true;
    sc.add(this.water);
    // routes : 6 formes x 2 types
    const plane = new THREE.PlaneGeometry(1, 1); plane.rotateX(-Math.PI / 2);
    this.roadMeshes = [[], []];
    for (let k = 0; k < 2; k++) for (let sh = 0; sh < 6; sh++) {
      const m = new THREE.InstancedMesh(plane, this.roadMats[k][sh], T);
      m.count = 0; m.receiveShadow = true; m.frustumCulled = false;
      this.roadMeshes[k][sh] = m; sc.add(m);
    }
    const deck = new THREE.BoxGeometry(1, 0.14, 1); deck.translate(0, -0.06, 0);
    this.bridges = new THREE.InstancedMesh(deck, new THREE.MeshStandardMaterial({ color: '#a8a39a', roughness: 0.8 }), T);
    this.bridges.count = 0; this.bridges.castShadow = true; this.bridges.receiveShadow = true; this.bridges.frustumCulled = false;
    sc.add(this.bridges);
    // route d'accès hors carte
    this.highway = new THREE.Group(); sc.add(this.highway);
    // lampadaires
    this.lamps = new THREE.InstancedMesh(M.lampGeometry(), this.mat.plain, T); this.lamps.count = 0; this.lamps.frustumCulled = false;
    this.lampHeads = new THREE.InstancedMesh(M.lampHeadGeometry(), this.mat.lampHead, T); this.lampHeads.count = 0; this.lampHeads.frustumCulled = false;
    sc.add(this.lamps, this.lampHeads);
    // cases colorées (zones, calques)
    const tq = new THREE.PlaneGeometry(0.96, 0.96); tq.rotateX(-Math.PI / 2);
    this.tiles = new THREE.InstancedMesh(tq, this.mat.tile, T); this.tiles.count = 0; this.tiles.frustumCulled = false; this.tiles.renderOrder = 2;
    this.preview = new THREE.InstancedMesh(tq, this.mat.tile.clone(), T); this.preview.count = 0; this.preview.frustumCulled = false; this.preview.renderOrder = 3;
    this.preview.material.opacity = 1;
    sc.add(this.tiles, this.preview);
    // curseur
    const cur = new THREE.PlaneGeometry(1, 1); cur.rotateX(-Math.PI / 2);
    this.cursor = new THREE.Mesh(cur, new THREE.MeshBasicMaterial({ map: M.makeTileTexture(), transparent: true, depthWrite: false, color: '#ffffff' }));
    this.cursor.visible = false; this.cursor.renderOrder = 4; sc.add(this.cursor);
    // rayon d'action
    this.radius = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }));
    this.radius.rotation.x = -Math.PI / 2; this.radius.visible = false; this.radius.renderOrder = 4;
    this.radiusFill = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, depthWrite: false }));
    this.radiusFill.rotation.x = -Math.PI / 2; this.radiusFill.visible = false; this.radiusFill.renderOrder = 3;
    sc.add(this.radius, this.radiusFill);
    // fantôme du bâtiment à placer
    this.ghost = new THREE.Mesh(new THREE.BufferGeometry(), this.mat.ghost); this.ghost.visible = false; this.ghost.renderOrder = 6; sc.add(this.ghost);
    // arbres
    this.treeGeos = [M.treeGeometry(0), M.treeGeometry(1), M.treeGeometry(2)];
    this.trees = this.treeGeos.map((g) => { const m = new THREE.InstancedMesh(g, this.mat.tree, T + 1400); m.count = 0; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; sc.add(m); return m; });
    // voitures, bateaux
    this.carMax = 320;
    this.cars = new THREE.InstancedMesh(M.carGeometry(), this.mat.car, this.carMax); this.cars.count = 0; this.cars.castShadow = true; this.cars.frustumCulled = false;
    this.carLights = new THREE.InstancedMesh(M.carLightsGeometry(), this.mat.carLights, this.carMax); this.carLights.count = 0; this.carLights.frustumCulled = false;
    this.boats = new THREE.InstancedMesh(M.boatGeometry(), this.mat.car, 12); this.boats.count = 0; this.boats.castShadow = true; this.boats.frustumCulled = false;
    sc.add(this.cars, this.carLights, this.boats);
    this.carList = []; this.boatList = [];
    // chantiers
    const sb = new THREE.BoxGeometry(1, 1, 1); sb.translate(0, 0.5, 0);
    this.scaffolds = new THREE.InstancedMesh(sb, this.mat.scaffold, 300); this.scaffolds.count = 0; this.scaffolds.frustumCulled = false;
    this.cranes = new THREE.InstancedMesh(M.craneGeometry(), this.mat.crane, 60); this.cranes.count = 0; this.cranes.castShadow = true; this.cranes.frustumCulled = false;
    sc.add(this.scaffolds, this.cranes);
    // particules
    this.smoke = new Particles(2400, false); this.glowP = new Particles(1200, true);
    sc.add(this.smoke.points, this.glowP.points);
    // pluie et neige
    const rainN = 2600, rp = new Float32Array(rainN * 6);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3).setUsage(THREE.DynamicDrawUsage));
    this.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#b8c8d8', transparent: true, opacity: 0.45 }));
    this.rain.frustumCulled = false; this.rain.visible = false; this.rainN = rainN;
    this.rainSeed = new Float32Array(rainN * 3);
    for (let i = 0; i < rainN * 3; i++) this.rainSeed[i] = Math.random();
    sc.add(this.rain);
    // nuages
    this.clouds = [];
    const cm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92, depthWrite: false });
    this.cloudMat = cm;
    for (let k = 0; k < 12; k++) {
      const m = new THREE.Mesh(M.cloudGeometry(k + 11), cm);
      const s = 2 + Math.random() * 2.5;
      m.scale.set(s, s * 0.8, s);
      m.position.set((Math.random() - 0.5) * 160, 30 + Math.random() * 8, (Math.random() - 0.5) * 160);
      m.castShadow = true; m.renderOrder = 7;
      this.clouds.push(m); sc.add(m);
    }
    // icônes de problèmes
    const icon = (e, bg) => new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: M.makeIcon(e, bg), size: 0.75, sizeAttenuation: true, transparent: true, depthWrite: false, alphaTest: 0.05 }));
    this.icons = { power: icon('⚡', '#e8a317'), water: icon('💧', '#2f86d6'), fire: icon('🔥', '#d8412f'), ab: icon('🏚', '#6b6b6b') };
    for (const k in this.icons) { this.icons[k].frustumCulled = false; this.icons[k].renderOrder = 8; sc.add(this.icons[k]); }
    // pales des éoliennes
    this.bladeGeo = M.bladesGeometry();
    this.blades = new THREE.InstancedMesh(this.bladeGeo, this.mat.plain, 200); this.blades.count = 0; this.blades.castShadow = true; this.blades.frustumCulled = false;
    sc.add(this.blades);
    this.archetypes = new Map();
    this.animating = new Map();
  }

  // ---------------- Nouvelle partie ----------------
  setState(s) {
    this.s = s;
    if (this.terrain) { this.scene.remove(this.terrain, this.ring); this.terrain.geometry.dispose(); this.ring.geometry.dispose(); }
    this.buildTerrain();
    this.buildRing();
    this.buildHighway();
    this.carList = []; this.boatList = [];
    this.animating.clear();
    this.lastSeason = -1;
    s.dirty.terrain = true; s.dirty.buildings = true; s.dirty.fields = true;
    this.sync(true);
  }

  // hauteur du sol à un sommet de la grille fine (pas de 1/2 case)
  buildTerrain() {
    const s = this.s, R = 2 * N + 1;
    const geo = new THREE.PlaneGeometry(N, N, 2 * N, 2 * N); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    this.tHeights = new Float32Array(R * R);
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      // tuiles qui touchent ce sommet
      let w = 0, n = 0;
      const xs = i % 2 ? [(i - 1) / 2] : [i / 2 - 1, i / 2], ys = j % 2 ? [(j - 1) / 2] : [j / 2 - 1, j / 2];
      for (const ty of ys) for (const tx of xs) {
        const cx = clamp(tx, 0, N - 1), cy = clamp(ty, 0, N - 1);
        n++; if (s.terrain[idx(cx, cy)] === 1) w++;
      }
      const f = w / n;
      const h = f === 0 ? 0 : f === 1 ? -0.55 : -0.17 - (f > 0.5 ? 0.12 : 0);
      this.tHeights[j * R + i] = h;
      const vi = j * R + i;
      p.setY(vi, h);
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(p.count * 3), 3));
    this.terrain = new THREE.Mesh(geo, this.mat.ground);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    this.colorTerrain();
  }
  colorTerrain() {
    const s = this.s, R = 2 * N + 1, col = this.terrain.geometry.attributes.color;
    const season = dateOf(s.tick).season;
    const grass = [new THREE.Color('#6da24e'), new THREE.Color('#7fa34a'), new THREE.Color('#8f9a4a'), new THREE.Color('#7c9160')][season];
    const grass2 = [new THREE.Color('#5d9444'), new THREE.Color('#6f9440'), new THREE.Color('#9a8a45'), new THREE.Color('#6d8455')][season];
    const sand = new THREE.Color('#d9c893'), bed = new THREE.Color('#5d6a4e'), mud = new THREE.Color('#8d8a62');
    const nz = rng(s.seed + 11);
    const c = new THREE.Color();
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const tx = clamp(Math.floor(i / 2), 0, N - 1), ty = clamp(Math.floor(j / 2), 0, N - 1);
      const t = s.terrain[idx(tx, ty)], h = this.tHeights[j * R + i];
      if (h <= -0.5) c.copy(bed);
      else if (h < 0) c.copy(t === 2 ? sand : mud).lerp(sand, 0.4);
      else if (t === 2) c.copy(sand);
      else { c.copy(grass).lerp(grass2, nz()); }
      const k = 0.94 + nz() * 0.1;
      col.setXYZ(j * R + i, c.r * k, c.g * k, c.b * k);
    }
    col.needsUpdate = true;
  }
  // collines et forêts autour de la carte
  buildRing() {
    const s = this.s, SZ = 200, SEG = 200; // un sommet par case : le bord tombe pile sur celui de la carte
    const geo = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    const r = rng(s.seed + 99);
    const G = 24, grid = []; for (let i = 0; i < G * G; i++) grid.push(r());
    const vn = (x, y) => {
      const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
      const g = (a, b) => grid[((b % G + G) % G) * G + ((a % G + G) % G)];
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      return lerp(lerp(g(i, j), g(i + 1, j), sx), lerp(g(i, j + 1), g(i + 1, j + 1), sx), sy);
    };
    const c = new THREE.Color();
    const low = new THREE.Color('#6a9a4c'), mid = new THREE.Color('#4f7d3e'), rock = new THREE.Color('#8a8578'), peak = new THREE.Color('#b9b6ad'), bed = new THREE.Color('#5d6a4e');
    this.ringTrees = [];
    for (let v = 0; v < p.count; v++) {
      const X = p.getX(v), Z = p.getZ(v);
      const d = Math.max(Math.abs(X), Math.abs(Z)) - H;
      let h;
      if (d < -0.01) h = -0.7;
      else {
        const hills = (vn(X / 9 + 50, Z / 9 + 50) * 0.7 + vn(X / 3.5, Z / 3.5) * 0.3) * 9 * smooth(1, 26, d) + smooth(18, 70, d) * 10 * vn(X / 20, Z / 20);
        // l'eau qui touche le bord continue au-delà
        const bx = clamp(Math.floor(X + H), 0, N - 1), bz = clamp(Math.floor(Z + H), 0, N - 1);
        let w = 0, n = 0;
        for (let k = -2; k <= 2; k++) {
          const tx = clamp(bx + (Math.abs(X) - H > Math.abs(Z) - H ? 0 : k), 0, N - 1), tz = clamp(bz + (Math.abs(X) - H > Math.abs(Z) - H ? k : 0), 0, N - 1);
          n++; if (s.terrain[idx(tx, tz)] === 1) w++;
        }
        const wf = w / n;
        h = lerp(hills, -0.6, smooth(0.2, 0.8, wf));
        if (d < 1.2) h = lerp(wf > 0.5 ? -0.55 : 0, h, smooth(0, 1.2, d));
      }
      p.setY(v, h);
      if (h < -0.3) c.copy(bed);
      else if (h < 2) c.copy(low).lerp(mid, h / 2);
      else if (h < 7) c.copy(mid).lerp(rock, smooth(4, 7, h));
      else c.copy(rock).lerp(peak, smooth(7, 12, h));
      const k = 0.92 + r() * 0.12;
      col[v * 3] = c.r * k; col[v * 3 + 1] = c.g * k; col[v * 3 + 2] = c.b * k;
      if (d > 1.5 && d < 60 && h > 0.1 && h < 6 && r() < 0.14 * (1 - h / 7)) this.ringTrees.push([X + (r() - 0.5), h, Z + (r() - 0.5), r()]);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    this.ring = new THREE.Mesh(geo, this.mat.ground);
    this.ring.receiveShadow = true;
    this.scene.add(this.ring);
  }
  buildHighway() {
    const s = this.s;
    this.highway.clear();
    const mat = this.roadMats[0][2];
    for (let y = 0; y < N; y++) {
      if (!s.road[idx(0, y)]) continue;
      const g = new THREE.PlaneGeometry(1, 60); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 60);
      const tex = mat.map.clone(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
      const m = new THREE.Mesh(g, snowify(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 })));
      m.position.set(-H - 30, 0.02, y - H + 0.5); m.receiveShadow = true;
      this.highway.add(m);
      this.highwayRow = y;
    }
  }

  // ---------------- Synchronisation avec la simulation ----------------
  sync(force) {
    const s = this.s;
    if (!s) return;
    const d = s.dirty;
    const season = dateOf(s.tick).season;
    if (season !== this.lastSeason) { this.lastSeason = season; this.colorTerrain(); d.terrain = true; }
    if (d.terrain || force) { this.syncRoads(); this.syncTrees(); }
    if (d.buildings || force) this.syncBuildings();
    if (d.terrain || d.buildings || d.fields || force) this.syncTiles();
    d.terrain = d.buildings = d.fields = false;
  }
  roadMask(x, y) {
    const s = this.s;
    const r = (tx, ty) => (inMap(tx, ty) ? s.road[idx(tx, ty)] > 0 : (tx < 0 && s.road[idx(0, ty)] > 0));
    return (r(x, y - 1) ? 1 : 0) | (r(x + 1, y) ? 2 : 0) | (r(x, y + 1) ? 4 : 0) | (r(x - 1, y) ? 8 : 0);
  }
  syncRoads() {
    const s = this.s, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
    const counts = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
    // table masque -> (forme, rotation)
    if (!this.maskTable) {
      const base = [0, 1, 5, 3, 7, 15], rot = (m) => ((m << 1) | (m >> 3)) & 15;
      this.maskTable = [];
      for (let mask = 0; mask < 16; mask++) {
        for (let sh = 0; sh < 6 && this.maskTable[mask] === undefined; sh++) {
          let m = base[sh];
          for (let k = 0; k < 4; k++) { if (m === mask) { this.maskTable[mask] = [sh, k]; break; } m = rot(m); }
        }
      }
    }
    let nb = 0, nl = 0;
    const lampM = new THREE.Matrix4();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y), k = s.road[i];
      if (!k) continue;
      const mask = this.roadMask(x, y);
      const [sh, rotk] = this.maskTable[mask];
      q.setFromAxisAngle(up, -rotk * Math.PI / 2);
      const water = s.terrain[i] === 1;
      pos.set(x - H + 0.5, water ? 0.06 : 0.012, y - H + 0.5);
      m4.compose(pos, q, one);
      const mesh = this.roadMeshes[k - 1][sh];
      mesh.setMatrixAt(counts[k - 1][sh]++, m4);
      if (water) { m4.compose(pos.clone().setY(0.06), q, one); this.bridges.setMatrixAt(nb++, m4); }
      // lampadaires sur les routes droites, une case sur deux
      if ((sh === 2) && (x + y) % 2 === 0 && !water) {
        const side = (x * 7 + y) % 2 ? 1 : -1;
        const q2 = new THREE.Quaternion().setFromAxisAngle(up, -rotk * Math.PI / 2 + (side > 0 ? Math.PI : 0));
        const off = new THREE.Vector3(side * (k === 2 ? 0.43 : 0.4), 0, 0).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(up, -rotk * Math.PI / 2));
        lampM.compose(new THREE.Vector3(x - H + 0.5 + off.x, 0.012, y - H + 0.5 + off.z), q2, one);
        this.lamps.setMatrixAt(nl, lampM); this.lampHeads.setMatrixAt(nl, lampM); nl++;
      }
    }
    for (let a = 0; a < 2; a++) for (let sh = 0; sh < 6; sh++) {
      const m = this.roadMeshes[a][sh];
      m.count = counts[a][sh]; m.instanceMatrix.needsUpdate = true; m.visible = m.count > 0;
    }
    this.bridges.count = nb; this.bridges.instanceMatrix.needsUpdate = true;
    this.lamps.count = nl; this.lampHeads.count = nl; this.lamps.instanceMatrix.needsUpdate = true; this.lampHeads.instanceMatrix.needsUpdate = true;
  }
  syncTrees() {
    const s = this.s, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pos = new THREE.Vector3(), c = new THREE.Color();
    const cnt = [0, 0, 0];
    const season = dateOf(s.tick).season;
    const leaf = [['#5d9d45', '#4f8f3e', '#6aa84c'], ['#4f8a3a', '#5a9440', '#44803a'], ['#d08a2e', '#c0572e', '#d9b03a'], ['#8a8f7a', '#7d8470', '#949886']][season];
    const pine = ['#2f6b3a', '#37753f', '#2a6034'];
    const put = (kind, x, y, z, s0, rot, colr) => {
      if (cnt[kind] >= this.trees[kind].instanceMatrix.count) return;
      q.setFromAxisAngle(up, rot); sc.set(s0, s0 * (0.9 + (rot % 0.3)), s0); pos.set(x, y, z);
      m4.compose(pos, q, sc);
      this.trees[kind].setMatrixAt(cnt[kind], m4);
      this.trees[kind].setColorAt(cnt[kind], c.set(colr));
      cnt[kind]++;
    };
    const r = rng(s.seed + 5);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const t = s.trees[idx(x, y)];
      if (!t) continue;
      const n = 1 + (hash01(idx(x, y) * 13) * 3 | 0);
      for (let k = 0; k < n; k++) {
        const hx = hash01(idx(x, y) * 31 + k * 7), hz = hash01(idx(x, y) * 17 + k * 11);
        const kind = (t + k) % 3 === 1 ? 1 : (t === 3 ? 2 : 0);
        const col = kind === 1 ? pine[k % 3] : leaf[(k + t) % 3];
        put(kind, x - H + 0.2 + hx * 0.6, 0, y - H + 0.2 + hz * 0.6, 0.8 + hash01(idx(x, y) + k) * 0.6, hx * 6.28, col);
      }
    }
    for (const [X, Y, Z, rv] of this.ringTrees) {
      const kind = rv < 0.45 ? 1 : 0;
      put(kind, X, Y - 0.05, Z, 1.1 + rv * 1.3, rv * 40, kind === 1 ? pine[(rv * 10 | 0) % 3] : leaf[(rv * 10 | 0) % 3]);
    }
    void r;
    this.trees.forEach((m, k) => { m.count = cnt[k]; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }

  // clé du modèle d'un bâtiment
  archKey(b) { return b.type === 'Z' ? `z${b.z}-${b.lvl}-${b.v % 3}` : `${b.type}-${b.lvl}`; }
  getArch(key, b) {
    let a = this.archetypes.get(key);
    if (a) return a;
    const B = b.type === 'Z' ? M.zoneModel(b.z, b.lvl, b.v % 3) : M.serviceModel(b.type, b.type === 'mairie' ? b.lvl : b.lvl, sizeOf(b));
    const geo = B.build();
    const st = B.style || 'res';
    const mk = (dark) => {
      const mats = [dark ? this.mat.facade[st].dark : this.mat.facade[st].lit, this.mat.plain, dark ? this.mat.glowDark : this.mat.glow];
      const m = new THREE.InstancedMesh(geo, mats, 16);
      m.count = 0; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.userData.ids = [];
      this.scene.add(m);
      return m;
    };
    a = { geo, meta: B.meta, lit: mk(false), dark: mk(true), height: B.meta.height };
    this.archetypes.set(key, a);
    return a;
  }
  ensureCap(a, which, n) {
    const m = a[which];
    if (m.instanceMatrix.count >= n) return m;
    const cap = Math.max(n, m.instanceMatrix.count * 2);
    const nm = new THREE.InstancedMesh(a.geo, m.material, cap);
    nm.count = 0; nm.castShadow = true; nm.receiveShadow = true; nm.frustumCulled = false; nm.userData.ids = [];
    nm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.remove(m); m.dispose();
    this.scene.add(nm);
    a[which] = nm;
    return nm;
  }
  facing(b) {
    const s = this.s, sz = sizeOf(b);
    const has = (x, y) => inMap(x, y) && s.road[idx(x, y)] > 0;
    for (let k = 0; k < sz; k++) {
      if (has(b.x + k, b.y + sz)) return 0;
    }
    for (let k = 0; k < sz; k++) if (has(b.x + sz, b.y + k)) return Math.PI / 2;
    for (let k = 0; k < sz; k++) if (has(b.x - 1, b.y + k)) return -Math.PI / 2;
    for (let k = 0; k < sz; k++) if (has(b.x + k, b.y - 1)) return Math.PI;
    return (hash01(b.id) * 4 | 0) * Math.PI / 2;
  }
  syncBuildings() {
    const s = this.s;
    const groups = new Map();
    for (const a of this.archetypes.values()) { a.lit.count = 0; a.dark.count = 0; a.lit.userData.ids = []; a.dark.userData.ids = []; }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), sc = new THREE.Vector3(), c = new THREE.Color();
    this.emitters = []; this.bladeList = []; this.iconData = { power: [], water: [], fire: [], ab: [] };
    const seen = new Set();
    // compte d'abord pour réserver la place
    const plan = [];
    for (const b of s.buildings) {
      const key = this.archKey(b), a = this.getArch(key, b);
      const dark = !!(b.ab || (b.pow === false) || b.fire);
      plan.push([b, a, dark]);
      const g = groups.get(a) || { lit: 0, dark: 0 };
      g[dark ? 'dark' : 'lit']++;
      groups.set(a, g);
    }
    for (const [a, g] of groups) { this.ensureCap(a, 'lit', g.lit); this.ensureCap(a, 'dark', g.dark); }
    const over = this.overlay;
    for (const [b, a, dark] of plan) {
      const mesh = dark ? a.dark : a.lit;
      const i = mesh.count++;
      mesh.userData.ids[i] = b.id;
      const sz = sizeOf(b), rot = this.facing(b);
      pos.set(b.x + sz / 2 - H, 0, b.y + sz / 2 - H);
      q.setFromAxisAngle(up, rot);
      let an = this.animating.get(b.id);
      if (b.cons > 0) {
        if (!an || an.lvl !== b.lvl || an.type !== b.type) { an = { p: an && an.type === b.type ? 0.35 : 0.02, start: b.cons + 1, lvl: b.lvl, type: b.type }; this.animating.set(b.id, an); }
        if (b.cons + 1 > an.start) an.start = b.cons + 1;
      }
      seen.add(b.id);
      const grow = an ? an.p : 1;
      sc.set(1, Math.max(0.02, grow), 1);
      m4.compose(pos, q, sc);
      mesh.setMatrixAt(i, m4);
      // couleur : variation, abandon, feu, calque
      const hv = hash01(b.id * 3 + 1);
      c.setRGB(0.92 + hv * 0.08, 0.92 + hash01(b.id * 5) * 0.08, 0.92 + hash01(b.id * 7) * 0.08);
      if (b.ab) c.setRGB(0.42, 0.39, 0.36);
      if (b.fire) c.multiplyScalar(Math.max(0.25, 1 - (b.burn || 0) / 30));
      if (over) this.overlayTint(b, c);
      mesh.setColorAt(i, c);
      if (an) an.ref = { a, dark, i, pos: pos.clone(), q: q.clone(), h: a.height, sz };
      // fumées, pales, icônes
      const wp = (l) => new THREE.Vector3(l[0], l[1], l[2]).applyQuaternion(q).add(pos);
      if (!b.cons && !b.ab && b.pow !== false) {
        for (const sm of a.meta.smoke) this.emitters.push({ p: wp(sm), kind: 'smoke', b });
        for (const sm of a.meta.steam) this.emitters.push({ p: wp(sm), kind: 'steam', b });
      }
      if (a.meta.blades && !b.cons) this.bladeList.push({ p: wp(a.meta.blades), rot, b });
      const top = a.height * grow + 0.35;
      if (b.fire) { this.iconData.fire.push(pos.x, top + 0.2, pos.z); this.emitters.push({ p: new THREE.Vector3(pos.x, a.height * 0.7, pos.z), kind: 'fire', b }); }
      else if (b.ab) this.iconData.ab.push(pos.x, top, pos.z);
      else if (b.pow === false && !b.cons) this.iconData.power.push(pos.x, top, pos.z);
      else if (b.wat === false && !b.cons && s.m && s.m.pop > 40) this.iconData.water.push(pos.x, top, pos.z);
    }
    for (const id of this.animating.keys()) if (!seen.has(id)) this.animating.delete(id);
    for (const a of this.archetypes.values()) {
      for (const m of [a.lit, a.dark]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.visible = m.count > 0; }
    }
    for (const k in this.icons) {
      const arr = new Float32Array(this.iconData[k]);
      this.icons[k].geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      this.icons[k].geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
      this.icons[k].userData.base = arr.slice();
    }
    this.blades.count = this.bladeList.length;
  }
  overlayTint(b, c) {
    const s = this.s, i = idx(b.x, b.y), f = s.f;
    let v = null;
    switch (this.overlay) {
      case 'happy': v = b.type === 'Z' ? (b.happy ?? 60) / 100 : null; break;
      case 'land': v = f.land[i] / 100; break;
      case 'pollution': v = 1 - Math.min(1, f.pollution[i]); break;
      case 'power': v = b.pow === false ? 0 : b.wat === false ? 0.45 : 1; break;
      default: v = null;
    }
    if (v == null) { c.multiplyScalar(0.8); return; }
    c.copy(heat(v));
  }
  syncTiles() {
    const s = this.s, m4 = new THREE.Matrix4(), c = new THREE.Color();
    let n = 0;
    const put = (x, y, col, sc = 1) => { m4.makeScale(sc, 1, sc).setPosition(x - H + 0.5, 0.03, y - H + 0.5); this.tiles.setMatrixAt(n, m4); this.tiles.setColorAt(n, col); n++; };
    const over = this.overlay, f = s.f;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = idx(x, y);
      if (s.terrain[i] === 1 && !over) continue;
      if (over && over !== 'none') {
        if (s.terrain[i] === 1) continue;
        let v = null;
        switch (over) {
          case 'land': v = f.land[i] / 100; break;
          case 'pollution': v = 1 - Math.min(1, f.pollution[i]); break;
          case 'noise': v = 1 - Math.min(1, f.noise[i]); break;
          case 'traffic': if (s.road[i]) v = 1 - Math.min(1, f.traffic[i] / 1.4); break;
          case 'police': case 'fire': case 'health': case 'edu': case 'leisure': case 'transit': v = Math.min(1, f[over][i]); break;
          case 'happy': if (s.bld[i]) { const b = s.byId.get(s.bld[i]); if (b.type === 'Z') v = (b.happy ?? 60) / 100; } break;
          case 'power': if (s.bld[i]) { const b = s.byId.get(s.bld[i]); v = b.pow === false ? 0 : b.wat === false ? 0.45 : 1; } break;
          default: break;
        }
        if (v == null) continue;
        c.copy(heat(v));
        put(x, y, c, 1.04);
      } else if (s.zone[i] && !s.bld[i]) {
        c.set(ZONES[s.zone[i]].color);
        put(x, y, c);
      }
    }
    this.tiles.count = n;
    this.tiles.instanceMatrix.needsUpdate = true;
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;
    this.tiles.material.opacity = over ? 0.62 : 0.55;
  }
  setOverlay(o) {
    this.overlay = o && o !== 'none' ? o : null;
    if (this.s) { this.s.dirty.fields = true; this.s.dirty.buildings = true; this.sync(); }
  }

  // ---------------- Outils : aperçu, fantôme, rayon ----------------
  showPreview(tiles, color) {
    const m4 = new THREE.Matrix4(), c = new THREE.Color(color);
    let n = 0;
    for (const [x, y, col] of tiles) {
      if (n >= T) break;
      m4.makeTranslation(x - H + 0.5, 0.05, y - H + 0.5);
      this.preview.setMatrixAt(n, m4);
      this.preview.setColorAt(n, col ? c.set(col) : c.set(color));
      n++;
    }
    this.preview.count = n;
    this.preview.instanceMatrix.needsUpdate = true;
    if (this.preview.instanceColor) this.preview.instanceColor.needsUpdate = true;
  }
  clearPreview() { this.preview.count = 0; }
  showGhost(type, x, y, ok) {
    const sz = BUILDINGS[type].size;
    if (this.ghostType !== type) {
      const B = M.serviceModel(type, 1, sz);
      this.ghost.geometry.dispose();
      this.ghost.geometry = B.build();
      this.ghostType = type;
    }
    this.ghost.visible = true;
    this.ghost.position.set(x + sz / 2 - H, 0.02, y + sz / 2 - H);
    const b = { x, y, type, id: 0 };
    this.ghost.rotation.y = this.facing(b);
    this.mat.ghost.color.set(ok ? '#7fe08a' : '#ff6b5b');
    const r = BUILDINGS[type].r || BUILDINGS[type].polR || 0;
    this.showRadius(r, x + sz / 2 - H, y + sz / 2 - H, ok ? '#ffffff' : '#ff6b5b');
  }
  hideGhost() { this.ghost.visible = false; this.hideRadius(); }
  showRadius(r, X, Z, color = '#ffffff') {
    if (!r) { this.hideRadius(); return; }
    for (const m of [this.radius, this.radiusFill]) { m.visible = true; m.scale.set(r, r, 1); m.position.set(X, 0.07, Z); m.material.color.set(color); }
  }
  hideRadius() { this.radius.visible = false; this.radiusFill.visible = false; }
  showSelection(b) {
    if (!b) { this.hideRadius(); this.cursorLock = null; return; }
    const sz = sizeOf(b);
    this.cursorLock = { x: b.x, y: b.y, sz };
    const r = b.type !== 'Z' ? (svc(b).r || BUILDINGS[b.type].polR || 0) : 0;
    this.showRadius(r, b.x + sz / 2 - H, b.y + sz / 2 - H, '#ffe28a');
  }
  setCursor(x, y, sz = 1, color = '#ffffff') {
    if (x == null) { this.cursor.visible = false; return; }
    this.cursor.visible = true;
    this.cursor.scale.set(sz, 1, sz);
    this.cursor.position.set(x + sz / 2 - H, 0.06, y + sz / 2 - H);
    this.cursor.material.color.set(color);
  }

  // écran -> case
  pick(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    // d'abord les bâtiments (tours vues de côté)
    const meshes = [];
    for (const a of this.archetypes.values()) { if (a.lit.count) meshes.push(a.lit); if (a.dark.count) meshes.push(a.dark); }
    const hits = this.raycaster.intersectObjects(meshes, false);
    let bid = null;
    if (hits.length && hits[0].instanceId != null) bid = hits[0].object.userData.ids[hits[0].instanceId];
    const pt = new THREE.Vector3();
    const ok = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
    if (!ok) return null;
    const x = Math.floor(pt.x + H), y = Math.floor(pt.z + H);
    return { x, y, inside: inMap(x, y), bid };
  }
  flyTo(x, y, dist) {
    const tgt = new THREE.Vector3(x - H, 0, y - H);
    this.fly = { from: this.controls.target.clone(), to: tgt, t: 0, dist };
  }
  rotateBy(a) {
    const off = this.camera.position.clone().sub(this.controls.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    this.rot = { off, t: 0, from: this.camera.position.clone().sub(this.controls.target) };
  }
  zoomBy(k) {
    const off = this.camera.position.clone().sub(this.controls.target);
    const len = clamp(off.length() * k, this.controls.minDistance, this.controls.maxDistance);
    off.setLength(len);
    this.camera.position.copy(this.controls.target).add(off);
  }
  panBy(dx, dz) {
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    const d = this.camera.position.distanceTo(this.controls.target) * 0.03;
    const mv = right.multiplyScalar(dx * d).add(fwd.multiplyScalar(dz * d));
    this.controls.target.add(mv); this.camera.position.add(mv);
  }

  // ---------------- Temps, lumière, météo ----------------
  updateSky(dt) {
    const s = this.s;
    if (this.dayMode === 'cycle') this.timeOfDay = (this.timeOfDay + dt / this.dayLength) % 1;
    else if (this.dayMode === 'jour') this.timeOfDay += (0.45 - this.timeOfDay) * Math.min(1, dt);
    else if (this.dayMode === 'nuit') this.timeOfDay += (0.97 - this.timeOfDay) * Math.min(1, dt);
    const t = this.timeOfDay;
    const ang = (t - 0.25) * Math.PI * 2;
    const el = Math.sin(ang) * 0.95, az = ang * 0.9 + 0.6;
    const sunDir = new THREE.Vector3(Math.cos(az) * Math.cos(Math.asin(el)), el, Math.sin(az) * Math.cos(Math.asin(el)) * 0.6 + 0.35).normalize();
    const day = smooth(-0.1, 0.25, el), night = 1 - smooth(-0.22, 0.05, el), dusk = Math.max(0, 1 - Math.abs(el) / 0.3) * (1 - night * 0.6);
    this.night = night; this.day = day;
    const w = this.weather, cloudK = w.clouds, rainK = w.rain;
    const season = s ? dateOf(s.tick).season : 0;
    // couleurs du ciel
    const top = new THREE.Color('#0b1426').lerp(new THREE.Color('#3f7fcf'), day).lerp(new THREE.Color('#7f8a98'), cloudK * 0.7 * day);
    const hor = new THREE.Color('#1a2440').lerp(new THREE.Color('#b8d6ee'), day).lerp(new THREE.Color('#f0a26a'), dusk * 0.8).lerp(new THREE.Color('#b9c0c8'), cloudK * 0.6 * day);
    if (season === 3) hor.lerp(new THREE.Color('#d6dde6'), 0.25 * day);
    const bottom = hor.clone().multiplyScalar(0.7);
    const u = this.sky.material.uniforms;
    u.top.value.copy(top); u.horizon.value.copy(hor); u.bottom.value.copy(bottom);
    u.sunDir.value.copy(sunDir); u.night.value = night; u.cloud.value = cloudK;
    u.sunCol.value.set('#ffe2b0').lerp(new THREE.Color('#ff9a5a'), dusk);
    // brouillard
    const fogC = hor.clone().lerp(new THREE.Color('#9aa3ad'), rainK * 0.5);
    this.scene.fog.color.copy(fogC);
    const camD = this.camera.position.distanceTo(this.controls.target);
    this.scene.fog.near = camD * (1.1 - w.fog * 0.8) + 10;
    this.scene.fog.far = camD * (3.2 - w.fog * 2) + 120 - rainK * 60;
    // soleil ou lune
    const moon = el < -0.05;
    const L = moon ? sunDir.clone().negate() : sunDir;
    const tgt = this.controls.target;
    this.sun.position.copy(tgt).addScaledVector(L, 60);
    this.sun.target.position.copy(tgt);
    this.sun.color.set(moon ? '#8fa6d6' : '#ffffff').lerp(new THREE.Color('#ffb070'), moon ? 0 : dusk * 0.9);
    this.sun.intensity = moon ? 0.35 * night : 3.0 * day * (1 - cloudK * 0.55) * (1 - rainK * 0.3);
    const ext = clamp(camD * 0.95, 12, 40);
    const sc = this.sun.shadow.camera;
    if (Math.abs(sc.right - ext) > ext * 0.08) { sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 160; sc.updateProjectionMatrix(); }
    this.hemi.color.set('#1c2a4a').lerp(new THREE.Color('#cfe3ff'), day);
    this.hemi.groundColor.set('#141a14').lerp(new THREE.Color('#6b7a4a'), day);
    this.hemi.intensity = 0.35 + day * 0.75 + cloudK * 0.2;
    this.renderer.toneMappingExposure = 1.0 + night * 0.25;
    // fenêtres, lampadaires, lumières
    const lightK = smooth(0.15, 0.85, night + dusk * 0.4 + cloudK * rainK * 0.3);
    for (const st in this.mat.facade) this.mat.facade[st].lit.emissiveIntensity = lightK * 1.35;
    const g = 0.55 + lightK * 1.6;
    this.mat.glow.color.setRGB(g, g, g);
    this.mat.lampHead.color.setRGB(0.2 + lightK * 2.2, 0.2 + lightK * 2.0, 0.2 + lightK * 1.6);
    this.carLights.visible = lightK > 0.1;
    this.mat.carLights.color.setRGB(lightK * 2, lightK * 2, lightK * 2);
    if (this.bloom) this.bloom.strength = 0.18 + lightK * 0.6;
    const tk = 1 - night * 0.62;
    this.mat.tile.color.setRGB(tk, tk, tk);
    // eau : reflets du ciel
    this.mat.water.color.set('#1c4a66').lerp(new THREE.Color('#2f7896'), day).lerp(new THREE.Color('#566b76'), cloudK * 0.4);
    if (this.quality !== 'bas' && (Math.abs(this.envAt - t) > 0.01 || this.envDirty)) {
      this.envAt = t; this.envDirty = false;
      const rt = this.pmrem.fromScene(this.envScene, 0.02);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.mat.water.envMap = rt.texture; this.mat.water.envMapIntensity = 1.1;
      this.mat.facade.off.lit.envMap = rt.texture; this.mat.facade.off.dark.envMap = rt.texture;
      this.mat.facade.off.lit.envMapIntensity = 0.8; this.mat.facade.off.dark.envMapIntensity = 0.8;
      this.mat.car.envMap = rt.texture; this.mat.car.envMapIntensity = 0.6;
    }
    // neige au sol en hiver, qui fond au printemps
    U.snow.value += (snowCover(s) * 0.85 - U.snow.value) * Math.min(1, dt * 1.5);
  }
  updateWeather(dt) {
    const w = this.weather, s = this.s;
    w.next -= dt;
    const season = s ? dateOf(s.tick).season : 0;
    if (w.next <= 0) {
      w.next = 50 + Math.random() * 90;
      const r = Math.random();
      const opts = season === 3 ? [['clair', 0.35], ['nuageux', 0.3], ['neige', 0.35]]
        : season === 1 ? [['clair', 0.6], ['nuageux', 0.25], ['orage', 0.15]]
          : [['clair', 0.4], ['nuageux', 0.3], ['pluie', 0.2], ['brume', 0.1]];
      let acc = 0;
      for (const [k, p] of opts) { acc += p; if (r <= acc) { w.target = k; break; } }
      if (this.fixedWeather) w.target = this.fixedWeather;
    }
    if (this.fixedWeather) w.target = this.fixedWeather;
    const tgt = { clair: [0.15, 0, 0], nuageux: [0.75, 0, 0.1], pluie: [0.9, 1, 0.3], orage: [1, 1, 0.35], neige: [0.8, 1, 0.4], brume: [0.5, 0, 0.9] }[w.target];
    const k = Math.min(1, dt * 0.15);
    w.clouds += (tgt[0] - w.clouds) * k; w.rain += (tgt[1] - w.rain) * k; w.fog += (tgt[2] - w.fog) * k;
    w.kind = w.target === 'neige' ? 'neige' : w.target === 'pluie' || w.target === 'orage' ? 'pluie' : w.target;
    // nuages
    const camY = this.camera.position.y;
    this.cloudMat.opacity = clamp((34 - camY) / 10, 0.12, 0.92) * (0.35 + w.clouds * 0.65);
    this.cloudMat.color.set('#ffffff').lerp(new THREE.Color('#6d7580'), w.rain * 0.7).multiplyScalar(0.4 + this.day * 0.6);
    this.clouds.forEach((c, i) => {
      c.visible = i < 3 + Math.round(w.clouds * 9);
      c.position.x += this.wind.x * dt * 1.5; c.position.z += this.wind.y * dt * 1.5;
      if (c.position.x > 90) c.position.x = -90; if (c.position.z > 90) c.position.z = -90;
    });
    // éclairs
    if (w.target === 'orage' && Math.random() < dt * 0.08) this.flash = 1;
    if (this.flash) { this.flash = Math.max(0, this.flash - dt * 4); this.hemi.intensity += this.flash * 3; }
    U.wet.value = w.rain;
    this.mat.ground.roughness = 0.96 - w.rain * 0.35;
    // pluie ou neige autour de la caméra
    const on = w.rain > 0.05 && !this.reduced;
    this.rain.visible = on;
    if (on) {
      const snow = w.kind === 'neige' || season === 3;
      const tgtP = this.controls.target, arr = this.rain.geometry.attributes.position.array, rs = this.rainSeed;
      const spanX = 44, spanY = 22, t = this.clock * (snow ? 0.08 : 0.9);
      const n = Math.floor(this.rainN * w.rain);
      for (let i = 0; i < this.rainN; i++) {
        if (i >= n) { arr.fill(0, i * 6, i * 6 + 6); continue; }
        const x = tgtP.x + (rs[i * 3] - 0.5) * spanX + (snow ? Math.sin(t * 6 + i) * 0.3 : 0);
        const z = tgtP.z + (rs[i * 3 + 2] - 0.5) * spanX;
        const y = ((rs[i * 3 + 1] - t) % 1 + 1) % 1 * spanY;
        const len = snow ? 0.12 : 0.45;
        arr[i * 6] = x; arr[i * 6 + 1] = y; arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x + this.wind.x * len * 0.3; arr[i * 6 + 4] = y - len; arr[i * 6 + 5] = z + this.wind.y * len * 0.3;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      this.rain.material.color.set(snow ? '#ffffff' : '#aebfd0');
      this.rain.material.opacity = snow ? 0.9 : 0.4;
    }
  }

  // ---------------- Voitures et bateaux ----------------
  updateTraffic(dt) {
    const s = this.s;
    if (!s || !s.m) return;
    const roads = s.m.roads;
    const want = Math.min(this.carMax, Math.round(Math.min(roads * 0.7, 6 + s.m.pop / 18 + (s.m.totalJobs || 0) / 40)) * (this.quality === 'bas' ? 0.5 : 1)) | 0;
    const roadTiles = this.roadTilesCache && this.roadTilesCache.tick === s.dirtyRoadTick ? this.roadTilesCache.list : null;
    let list = roadTiles;
    if (!list || this.roadCountSeen !== roads) {
      list = []; for (let i = 0; i < T; i++) if (s.road[i]) list.push(i);
      this.roadTilesCache = { list }; this.roadCountSeen = roads;
      this.carList = this.carList.filter((c) => s.road[c.a] && s.road[c.b]);
    }
    while (this.carList.length < want && list.length > 1) {
      const a = list[Math.floor(Math.random() * list.length)];
      const nb = this.roadNeighbors(a);
      if (!nb.length) break;
      const hue = Math.random();
      const col = new THREE.Color().setHSL(hue, 0.5 + Math.random() * 0.3, 0.35 + Math.random() * 0.3);
      if (Math.random() < 0.3) col.setRGB(0.9, 0.9, 0.9); else if (Math.random() < 0.2) col.setRGB(0.12, 0.12, 0.14);
      this.carList.push({ a, b: nb[Math.floor(Math.random() * nb.length)], t: Math.random(), v: 0.7 + Math.random() * 0.6, col });
    }
    if (this.carList.length > want) this.carList.length = want;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    let n = 0;
    const jam = (i) => 1 / (1 + Math.max(0, s.f.traffic[i] - 0.8) * 2.5);
    for (const c of this.carList) {
      c.t += dt * c.v * jam(c.b) * (s.road[c.b] === 2 ? 1.3 : 1);
      if (c.t >= 1) {
        c.t -= 1;
        const nb = this.roadNeighbors(c.b).filter((k) => k !== c.a);
        const next = nb.length ? nb[Math.floor(Math.random() * nb.length)] : c.a;
        c.a = c.b; c.b = next;
      }
      const ax = c.a % N, ay = (c.a / N) | 0, bx = c.b % N, by = (c.b / N) | 0;
      const dx = bx - ax, dy = by - ay;
      const lane = s.road[c.b] === 2 || s.road[c.a] === 2 ? 0.26 : 0.16;
      const X = ax + dx * c.t - H + 0.5 - dy * lane, Z = ay + dy * c.t - H + 0.5 + dx * lane;
      const onWater = s.terrain[c.a] === 1 || s.terrain[c.b] === 1;
      pos.set(X, onWater ? 0.068 : 0.018, Z);
      q.setFromAxisAngle(up, Math.atan2(dx, dy));
      m4.compose(pos, q, one);
      this.cars.setMatrixAt(n, m4); this.carLights.setMatrixAt(n, m4);
      this.cars.setColorAt(n, c.col);
      n++;
    }
    this.cars.count = n; this.carLights.count = n;
    this.cars.instanceMatrix.needsUpdate = true; this.carLights.instanceMatrix.needsUpdate = true;
    if (this.cars.instanceColor) this.cars.instanceColor.needsUpdate = true;
    // bateaux
    if (!this.waterTiles) { this.waterTiles = []; for (let i = 0; i < T; i++) if (s.terrain[i] === 1 && !s.road[i]) this.waterTiles.push(i); }
    const wantB = Math.min(10, Math.floor(this.waterTiles.length / 45));
    while (this.boatList.length < wantB) {
      const a = this.waterTiles[Math.floor(Math.random() * this.waterTiles.length)];
      this.boatList.push({ a, b: a, t: 1, v: 0.25 + Math.random() * 0.2, ang: 0 });
    }
    let nbt = 0;
    for (const bt of this.boatList) {
      bt.t += dt * bt.v;
      if (bt.t >= 1) {
        bt.t = 0;
        const x = bt.b % N, y = (bt.b / N) | 0, opts = [];
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!inMap(x + ddx, y + ddy)) continue;
          const j = idx(x + ddx, y + ddy);
          if (s.terrain[j] === 1 && !s.road[j] && j !== bt.a) opts.push(j);
        }
        bt.a = bt.b; bt.b = opts.length ? opts[Math.floor(Math.random() * opts.length)] : bt.a;
      }
      const ax = bt.a % N, ay = (bt.a / N) | 0, bx = bt.b % N, by = (bt.b / N) | 0;
      const e = bt.t * bt.t * (3 - 2 * bt.t);
      pos.set(lerp(ax, bx, e) - H + 0.5, WATER_Y + 0.01 + Math.sin(this.clock * 2 + ax) * 0.008, lerp(ay, by, e) - H + 0.5);
      if (bx !== ax || by !== ay) { const ta = Math.atan2(bx - ax, by - ay); bt.ang += (((ta - bt.ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 3); }
      q.setFromAxisAngle(up, bt.ang);
      m4.compose(pos, q, one);
      this.boats.setMatrixAt(nbt, m4); this.boats.setColorAt(nbt, new THREE.Color(1, 1, 1));
      nbt++;
    }
    this.boats.count = nbt; this.boats.instanceMatrix.needsUpdate = true;
  }
  roadNeighbors(i) {
    const s = this.s, x = i % N, y = (i / N) | 0, out = [];
    if (y > 0 && s.road[i - N]) out.push(i - N);
    if (x < N - 1 && s.road[i + 1]) out.push(i + 1);
    if (y < N - 1 && s.road[i + N]) out.push(i + N);
    if (x > 0 && s.road[i - 1]) out.push(i - 1);
    return out;
  }

  // ---------------- Animations des bâtiments et effets ----------------
  updateBuildings(dt) {
    const s = this.s, m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
    let ns = 0, nc = 0;
    const touched = new Set();
    for (const [id, an] of this.animating) {
      const b = s.byId.get(id);
      if (!b || !an.ref) continue;
      const target = b.cons > 0 ? 1 - b.cons / an.start : 1;
      an.p += (target - an.p) * Math.min(1, dt * 2.5);
      const { a, dark, i, pos, q, h, sz } = an.ref;
      const mesh = dark ? a.dark : a.lit;
      if (i < mesh.count) {
        sc.set(1, Math.max(0.02, an.p), 1);
        m4.compose(pos, q, sc);
        mesh.setMatrixAt(i, m4);
        touched.add(mesh);
      }
      if (an.p < 0.985 || b.cons > 0) {
        if (ns < this.scaffolds.instanceMatrix.count) {
          sc.set(sz * 0.84, Math.max(0.2, h * 1.03), sz * 0.84);
          m4.compose(pos, q, sc);
          this.scaffolds.setMatrixAt(ns++, m4);
        }
        if (h > 1.1 && nc < this.cranes.instanceMatrix.count) {
          const cq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.clock * 0.3 + id);
          const cpos = pos.clone().add(new THREE.Vector3(sz * 0.42, 0, sz * 0.42));
          sc.set(1, Math.max(1, h / 1.6), 1);
          m4.compose(cpos, cq, sc);
          this.cranes.setMatrixAt(nc++, m4);
        }
        if (Math.random() < dt * 3) this.glowP.emit(pos.x + (Math.random() - 0.5) * sz * 0.6, an.p * h, pos.z + (Math.random() - 0.5) * sz * 0.6, 0, 0.3, 0, 0.8, 0.12, 0, 1.0, 0.8, 0.4, 0.8);
      } else if (!b.cons) {
        this.animating.delete(id);
        // petite pluie d'étincelles dorées quand un chantier se termine
        if (!this.reduced) for (let k = 0; k < 16; k++) this.glowP.emit(pos.x, h * 0.6 + 0.2, pos.z, (Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, 1.1, 0.16, -0.08, 1.0, 0.85, 0.35, 1);
      }
    }
    for (const m of touched) m.instanceMatrix.needsUpdate = true;
    this.scaffolds.count = ns; this.scaffolds.instanceMatrix.needsUpdate = true;
    this.cranes.count = nc; this.cranes.instanceMatrix.needsUpdate = true;
    // pales
    let nb = 0;
    const qb = new THREE.Quaternion(), qr = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
    for (const bl of this.bladeList || []) {
      qb.setFromAxisAngle(up, bl.rot);
      qr.setFromAxisAngle(fw, this.clock * (1.5 + (bl.b.id % 5) * 0.2) * (this.reduced ? 0.3 : 1));
      qb.multiply(qr);
      m4.compose(bl.p, qb, one);
      this.blades.setMatrixAt(nb++, m4);
    }
    this.blades.count = nb; this.blades.instanceMatrix.needsUpdate = true;
    // fumées et feu
    for (const e of this.emitters || []) {
      const p = e.p;
      if (e.kind === 'smoke' && Math.random() < dt * 5) {
        const g = 0.45 + Math.random() * 0.15;
        this.smoke.emit(p.x, p.y, p.z, (Math.random() - 0.5) * 0.1, 0.45 + Math.random() * 0.2, (Math.random() - 0.5) * 0.1, 4 + Math.random() * 2, 0.25, 0.28, g, g, g * 1.02, 0.55);
      } else if (e.kind === 'steam' && Math.random() < dt * 8) {
        this.smoke.emit(p.x + (Math.random() - 0.5) * 0.5, p.y, p.z + (Math.random() - 0.5) * 0.5, 0, 0.6, 0, 5, 0.6, 0.35, 0.95, 0.96, 0.98, 0.5);
      } else if (e.kind === 'fire') {
        if (Math.random() < dt * 30) this.glowP.emit(p.x + (Math.random() - 0.5) * 0.5, p.y * Math.random() + 0.05, p.z + (Math.random() - 0.5) * 0.5, 0, 0.7 + Math.random() * 0.5, 0, 0.7, 0.3, -0.25, 1.0, 0.45 + Math.random() * 0.3, 0.1, 0.9);
        if (Math.random() < dt * 8) this.smoke.emit(p.x, p.y + 0.4, p.z, 0, 0.7, 0, 4, 0.4, 0.4, 0.12, 0.11, 0.1, 0.7);
      }
    }
    // icônes qui flottent
    for (const k in this.icons) {
      const ic = this.icons[k], base = ic.userData.base, attr = ic.geometry.attributes.position;
      if (!base || !attr) continue;
      for (let i = 1; i < base.length; i += 3) attr.array[i] = base[i] + Math.sin(this.clock * 3 + i) * 0.06;
      attr.needsUpdate = true;
    }
  }

  // ---------------- Boucle d'affichage ----------------
  render(dt) {
    this.clock += dt;
    U.time.value = this.clock;
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt * 1.8);
      const e = 1 - Math.pow(1 - this.fly.t, 3);
      const off = this.camera.position.clone().sub(this.controls.target);
      const nt = this.fly.from.clone().lerp(this.fly.to, e);
      if (this.fly.dist) off.setLength(lerp(off.length(), this.fly.dist, e * 0.2));
      this.controls.target.copy(nt); this.camera.position.copy(nt).add(off);
      if (this.fly.t >= 1) this.fly = null;
    }
    if (this.rot) {
      this.rot.t = Math.min(1, this.rot.t + dt * 2.5);
      const e = 1 - Math.pow(1 - this.rot.t, 3);
      const v = this.rot.from.clone().lerp(this.rot.off, e).setLength(this.rot.off.length());
      this.camera.position.copy(this.controls.target).add(v);
      if (this.rot.t >= 1) this.rot = null;
    }
    // la cible reste au-dessus de la ville
    const tg = this.controls.target;
    const lim = H + 6;
    if (Math.abs(tg.x) > lim || Math.abs(tg.z) > lim) {
      const nx = clamp(tg.x, -lim, lim), nz = clamp(tg.z, -lim, lim);
      this.camera.position.x += nx - tg.x; this.camera.position.z += nz - tg.z; tg.x = nx; tg.z = nz;
    }
    this.controls.update();
    if (this.autoRotate) this.rotateSlow(dt);
    this.updateWeather(dt);
    this.updateSky(dt);
    if (this.s) {
      this.updateTraffic(dt);
      this.updateBuildings(dt);
    }
    this.waterNormal.offset.x += dt * 0.012; this.waterNormal.offset.y += dt * 0.007;
    this.smoke.update(dt, this.wind); this.glowP.update(dt, this.wind);
    this.smoke.points.material.uniforms.uScale.value = this.particleScale; this.glowP.points.material.uniforms.uScale.value = this.particleScale;
    if (this.composer) this.composer.render(dt); else this.renderer.render(this.scene, this.camera);
  }
  rotateSlow(dt) {
    const off = this.camera.position.clone().sub(this.controls.target);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.08);
    this.camera.position.copy(this.controls.target).add(off);
  }
  screenshot(w = 0) {
    if (this.composer) this.composer.render(0); else this.renderer.render(this.scene, this.camera);
    const src = this.renderer.domElement;
    if (!w) return src.toDataURL('image/png');
    const c = document.createElement('canvas'); const h = Math.round(w * src.height / src.width);
    c.width = w; c.height = h; c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.72);
  }
  // l'état des outils et de la carte change : on vide les caches liés à l'ancienne carte
  resetMapCaches() { this.waterTiles = null; this.roadCountSeen = -1; this.boatList = []; }
}

// neige selon le calendrier : tombe mi-décembre, fond fin février
function snowCover(s) {
  if (!s) return 0;
  const d = dateOf(s.tick), doy = d.month * 30 + d.day;
  if (doy >= 335) return smooth(335, 352, doy);
  if (doy <= 50) return 1;
  return 1 - smooth(50, 68, doy);
}

// dégradé rouge -> jaune -> vert
function heat(v) {
  const c = new THREE.Color();
  if (v < 0.5) c.setRGB(0.9, 0.2 + v * 1.2, 0.15);
  else c.setRGB(0.9 - (v - 0.5) * 1.4, 0.8, 0.2 + (v - 0.5) * 0.3);
  return c;
}
