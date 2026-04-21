/* =====================================================================
   scene.js — Chronicle v2: Three.js open-world scene
   Depends on: THREE (global), window.NODES, window.PALETTES, window.TWEAKS
   Exposes:    window.CHRONO (public API used by ui.js)
   ===================================================================== */
(function () {
  'use strict';

  const THREE = window.THREE;
  const canvas = document.getElementById('world');

  // ----------------------------------------------------------------
  // Device / quality detection
  // ----------------------------------------------------------------
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 720;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  let QUALITY = window.TWEAKS.quality === 'auto' ? (isMobile ? 'low' : 'high') : window.TWEAKS.quality;

  // ----------------------------------------------------------------
  // Renderer
  // ----------------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x03050a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050a, 0.006);

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 4000);
  camera.position.set(0, 6, 140);
  camera.lookAt(0, 0, 0);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  // ----------------------------------------------------------------
  // Nebula / skybox
  // ----------------------------------------------------------------
  const bgMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTime:  { value: 0 },
      uHot:   { value: new THREE.Color(0x2a4a7a) },
      uAmt:   { value: window.TWEAKS.nebula ?? 0.7 }
    },
    vertexShader: `
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
    `,
    fragmentShader: `
      varying vec3 vP;
      uniform float uTime;
      uniform vec3  uHot;
      uniform float uAmt;

      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float noise(vec3 p){
        vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(
          mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y),
          f.z);
      }
      float fbm(vec3 p){ float a=0.5,v=0.; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.02; a*=0.5;} return v; }

      void main(){
        vec3 d = normalize(vP);
        float n  = fbm(d*2.2 + vec3(uTime*0.012));
        float n2 = fbm(d*5.0 - vec3(uTime*0.02));
        float neb = smoothstep(0.4, 0.95, n*0.7 + n2*0.45);
        vec3 base = vec3(0.012, 0.016, 0.035);
        vec3 col  = mix(base, uHot*0.35, neb*uAmt);
        col += vec3(0.10,0.04,0.22) * smoothstep(0.55,1.0,n2) * uAmt * 0.8;
        float band = smoothstep(0.0,0.25,abs(d.y - sin(d.x*1.2)*0.15));
        col += (1.0 - band) * uHot * 0.12 * uAmt;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 32), bgMat));

  // ----------------------------------------------------------------
  // Stars
  // ----------------------------------------------------------------
  let starPoints = null;

  function buildStars(density) {
    if (starPoints) { scene.remove(starPoints); starPoints.geometry.dispose(); starPoints.material.dispose(); }
    const base  = QUALITY === 'low' ? 3500 : 9000;
    const count = Math.floor(base * density);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r  = 200 + Math.random() * 1500;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);

      const t = Math.random();
      let c;
      if      (t < 0.70) c = new THREE.Color(0.95, 0.97, 1.0);
      else if (t < 0.86) c = new THREE.Color(0.55, 0.85, 1.0);
      else if (t < 0.95) c = new THREE.Color(1.0,  0.78, 0.5);
      else               c = new THREE.Color(0.78, 0.58, 1.0);
      col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
      sz[i] = Math.random() < 0.05 ? 3.0 : 0.5 + Math.random() * 1.1;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    g.setAttribute('asize',    new THREE.BufferAttribute(sz,  1));

    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float asize; varying vec3 vCol; uniform float uTime;
        void main(){
          vCol = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          float tw = 0.7 + 0.3*sin(uTime*2. + position.x*0.03 + position.y*0.02);
          gl_PointSize = asize * tw * (320.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vCol;
        void main(){
          vec2 u = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0., length(u)); a *= a;
          gl_FragColor = vec4(vCol, a);
        }`
    });

    starPoints = new THREE.Points(g, m);
    scene.add(starPoints);
  }
  buildStars(window.TWEAKS.stars || 1);

  // ----------------------------------------------------------------
  // Shared shader helpers
  // ----------------------------------------------------------------
  const NOISE_GLSL = `
    float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
    float noise(vec3 p){
      vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(
        mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y),
        f.z);
    }
    float fbm(vec3 p){ float a=0.5,v=0.; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5;} return v; }
  `;

  // ----------------------------------------------------------------
  // Planet surface material — biome shader
  // ----------------------------------------------------------------
  function planetSurfaceMat(def) {
    const col1 = new THREE.Color(def.accent);
    const col2 = new THREE.Color(def.accent2);

    const biomeBody = {
      lava: `
        float n = fbm(p*2.2 + vec3(uTime*0.05));
        float cracks = smoothstep(0.42,0.48,n) - smoothstep(0.48,0.56,n);
        vec3 rock = mix(uC2, uC2*0.35, n);
        vec3 glow = uC1 * (cracks*2.5);
        col = rock + glow;`,
      ice: `
        float n = fbm(p*3.0);
        float crystal = smoothstep(0.55,0.75,n);
        col = mix(uC2, uC1, 0.3 + n*0.7);
        col += vec3(1.0)*crystal*0.4;`,
      verdant: `
        float n  = fbm(p*2.2);
        float n2 = fbm(p*6.0);
        float land = smoothstep(0.45,0.55,n);
        vec3 ocean = uC2*0.6;
        vec3 land1 = mix(uC1*0.7, uC1, n2);
        col = mix(ocean, land1, land);`,
      cyber: `
        float n = fbm(p*2.4);
        float land = smoothstep(0.5,0.55,n);
        vec3 ocean = uC2*0.6;
        vec3 cont  = mix(uC2, uC1*0.55, n);
        col = mix(ocean, cont, land);`,
      desert: `
        float n  = fbm(p*2.0);
        float n2 = fbm(p*8.0);
        col = mix(uC2*0.7, uC1, 0.4 + n*0.5);
        col *= 0.8 + n2*0.4;`
    };
    const biomeFn = biomeBody[def.biome] || `col = mix(uC2, uC1, fbm(p*2.5));`;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime:    { value: 0 },
        uC1:      { value: col1 },
        uC2:      { value: col2 },
        uLightDir:{ value: new THREE.Vector3(0.6, 0.3, 0.9).normalize() },
        uCity:    { value: def.city ? 1.0 : 0.0 },
        uLava:    { value: def.lava ? 1.0 : 0.0 }
      },
      vertexShader: `
        varying vec3 vN, vP, vW;
        void main(){
          vN = normalize(normalMatrix*normal); vP = position;
          vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        varying vec3 vN, vP, vW;
        uniform float uTime, uCity, uLava;
        uniform vec3 uC1, uC2, uLightDir;
        ${NOISE_GLSL}
        void main(){
          vec3 p = normalize(vP);
          vec3 col;
          ${biomeFn}
          float ndl   = max(dot(vN, uLightDir), 0.0);
          float night = 1.0 - ndl;
          if (uCity > 0.5){
            float c = fbm(p*28.0);
            float lights = smoothstep(0.62,0.78,c);
            float land   = smoothstep(0.5,0.55,fbm(p*2.4));
            col += uC1 * lights * land * pow(night, 1.8) * 2.2;
          }
          if (uLava > 0.5) col += uC1 * 0.15;
          vec3 lit = col * (0.25 + ndl*1.1);
          float rim = pow(1.0 - max(dot(vN, vec3(0,0,1)), 0.0), 2.2);
          lit += uC1 * rim * 0.25;
          gl_FragColor = vec4(lit, 1.0);
        }`
    });
  }

  // ----------------------------------------------------------------
  // Atmosphere shell
  // ----------------------------------------------------------------
  function atmosphereMat(color) {
    return new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(color) } },
      vertexShader: `
        varying vec3 vN;
        void main(){ vN = normalize(normalMatrix*normal);
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec3 vN; uniform vec3 uColor;
        void main(){
          float f = pow(1.0 - abs(dot(vN, vec3(0,0,1))), 3.0);
          gl_FragColor = vec4(uColor, f*0.9);
        }`
    });
  }

  // ----------------------------------------------------------------
  // Saturn rings
  // ----------------------------------------------------------------
  function addRings(group, def) {
    const ringGeo = new THREE.RingGeometry(def.size * 1.5, def.size * 2.15, 128);
    const pos = ringGeo.attributes.position;
    const uv  = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const r = Math.sqrt(x*x + y*y);
      uv.setXY(i, (r - def.size*1.5) / (def.size*0.65), 0);
    }
    const mat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: { uC: { value: new THREE.Color(def.accent) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uC;
        float hash(float x){ return fract(sin(x*43758.5)); }
        void main(){
          float t = vUv.x;
          float n  = sin(t*70.0)*0.5+0.5;
          float n2 = step(0.4, hash(floor(t*40.0)));
          float a  = n2*(0.5+n*0.5)*smoothstep(0.0,0.05,t)*smoothstep(1.0,0.85,t);
          gl_FragColor = vec4(uC, a*0.7);
        }`
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.z = 0.35;
    group.add(ring);
    group.userData.ring = ring;
  }

  // ----------------------------------------------------------------
  // Floating label sprite
  // ----------------------------------------------------------------
  function makeLabel(text, color) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 224;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
    ctx.strokeStyle = '#' + new THREE.Color(color).getHexString(); ctx.lineWidth = 4;
    const s = 30;
    ctx.beginPath();
    ctx.moveTo(14, 14+s);    ctx.lineTo(14, 14);        ctx.lineTo(14+s, 14);
    ctx.moveTo(c.width-14-s, 14); ctx.lineTo(c.width-14, 14); ctx.lineTo(c.width-14, 14+s);
    ctx.moveTo(14, c.height-14-s); ctx.lineTo(14, c.height-14); ctx.lineTo(14+s, c.height-14);
    ctx.moveTo(c.width-14-s, c.height-14); ctx.lineTo(c.width-14, c.height-14); ctx.lineTo(c.width-14, c.height-14-s);
    ctx.stroke();
    ctx.fillStyle = '#e7ecf7'; ctx.font = '600 52px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // ----------------------------------------------------------------
  // Space station geometry
  // ----------------------------------------------------------------
  function makeStation(def, group) {
    const accentColor = new THREE.Color(def.accent);
    const accent2Color = new THREE.Color(def.accent2);

    // Central hub — icosahedron
    const hubMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uC1:    { value: accentColor.clone() },
        uC2:    { value: accent2Color.clone() },
        uLightDir: { value: new THREE.Vector3(0.6, 0.3, 0.9).normalize() }
      },
      vertexShader: `
        varying vec3 vN, vP;
        void main(){
          vN = normalize(normalMatrix*normal); vP = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader: `
        varying vec3 vN, vP;
        uniform float uTime; uniform vec3 uC1, uC2, uLightDir;
        void main(){
          float ndl = max(dot(vN, uLightDir), 0.0);
          float pulse = 0.5 + 0.5*sin(uTime*2.0);
          vec3 base = mix(uC2*0.3, uC1*0.5, pulse);
          vec3 lit  = base * (0.3 + ndl*1.0);
          float rim = pow(1.0 - max(dot(vN, vec3(0,0,1)),0.0), 2.0);
          lit += uC1 * rim * 0.5 * (0.7 + 0.3*pulse);
          gl_FragColor = vec4(lit, 1.0);
        }`
    });
    const hub = new THREE.Mesh(new THREE.IcosahedronGeometry(def.size * 0.45, 2), hubMat);
    group.add(hub);
    group.userData.hub = hub;
    group.userData.hubMat = hubMat;

    // Outer rotating ring — torus
    const ringMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uC1:   { value: accentColor.clone() }
      },
      vertexShader: `
        varying vec3 vN;
        void main(){ vN = normalize(normalMatrix*normal);
          gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec3 vN; uniform float uTime; uniform vec3 uC1;
        void main(){
          float ndl = max(dot(vN, vec3(0.6,0.3,0.9)), 0.0);
          float glow = 0.4 + 0.3*sin(uTime*3.0);
          gl_FragColor = vec4(uC1*(0.3+ndl*0.7+glow*0.3), 1.0);
        }`
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(def.size * 1.1, def.size * 0.1, 16, 80),
      ringMat
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);
    group.userData.stationRing = ring;
    group.userData.ringMat = ringMat;

    // Solar panels — two flat boxes
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x2244aa,
      emissive: 0x1133ff,
      emissiveIntensity: 0.15,
      metalness: 0.8,
      roughness: 0.3
    });
    [-1, 1].forEach((side) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(def.size * 1.6, def.size * 0.04, def.size * 0.7), panelMat);
      panel.position.x = side * def.size * 1.3;
      group.add(panel);
    });

    // Blinking beacon light
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff4422 });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(def.size * 0.07, 8, 8), beaconMat);
    beacon.position.y = def.size * 0.55;
    group.add(beacon);
    group.userData.beacon = beacon;
    group.userData.beaconMat = beaconMat;

    // Atmosphere halo
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(def.size * 1.5, 32, 24),
      atmosphereMat(def.atmosphere)
    );
    group.add(atmo);
  }

  // ----------------------------------------------------------------
  // Build planet or station group
  // ----------------------------------------------------------------
  const planetGroup = new THREE.Group();
  scene.add(planetGroup);
  const planets = [];

  function makePlanet(def, idx) {
    const g = new THREE.Group();
    const segs = QUALITY === 'low' ? 48 : 96;

    if (def.isStation) {
      makeStation(def, g);
    } else {
      // Planet surface
      const surf = new THREE.Mesh(
        new THREE.SphereGeometry(def.size, segs, Math.floor(segs * 0.75)),
        planetSurfaceMat(def)
      );
      g.add(surf);
      g.userData.surf = surf;

      // Atmosphere
      g.add(new THREE.Mesh(
        new THREE.SphereGeometry(def.size * 1.08, 48, 32),
        atmosphereMat(def.atmosphere)
      ));

      // Rings
      if (def.rings) addRings(g, def);

      // Moon / satellite (skip on low-quality non-city planets)
      if (QUALITY !== 'low' || def.city) {
        const mat = new THREE.MeshStandardMaterial({
          color: def.accent, emissive: def.accent, emissiveIntensity: 0.4, roughness: 0.4
        });
        const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(def.size * 0.12, 0), mat);
        moon.userData.orbit = { r: def.size * 2.6, a: Math.random() * Math.PI * 2, s: 0.3 + Math.random() * 0.3 };
        g.add(moon);
        g.userData.moon = moon;
      }
    }

    // World position
    const n = window.NODES.length;
    const ang = (idx / n) * Math.PI * 2;
    const R = 90 + idx * 12;
    const yOff = (idx % 2 === 0 ? 6 : -5) + (idx - n / 2) * 2;
    g.position.set(Math.cos(ang) * R, yOff, Math.sin(ang) * R - 40);
    g.userData.basePos = g.position.clone();
    g.userData.def = def;
    g.userData.idx = idx;

    // Floating label
    const labelText = def.isStation
      ? 'Hire Me'
      : def.yearShort + '  ·  ' + def.title.toUpperCase();
    const tex = makeLabel(labelText, def.accent);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 }));
    sp.scale.set(def.size * 3.2, def.size * 0.8, 1);
    sp.position.set(0, def.isStation ? def.size * 2.2 : def.size * 1.8, 0);
    g.add(sp);
    g.userData.label = sp;

    planetGroup.add(g);
    planets.push(g);
    return g;
  }

  window.NODES.forEach((n, i) => makePlanet(n, i));

  // ----------------------------------------------------------------
  // Lights
  // ----------------------------------------------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(60, 30, 90);
  scene.add(sun);

  // ----------------------------------------------------------------
  // First-person camera rig
  // ----------------------------------------------------------------
  const rig = {
    active: false,
    pos: new THREE.Vector3(0, 6, 140),
    targetPos: new THREE.Vector3(0, 6, 140),
    yaw: 0, pitch: 0,
    yawVel: 0, pitchVel: 0,
    focusIdx: 0,
    approaching: false,
    lookSens: window.TWEAKS.look || 1.0
  };

  function planetPos(i) {
    return planets[i] ? planets[i].userData.basePos.clone() : new THREE.Vector3();
  }

  function updateTargetPos() {
    const p = planetPos(rig.focusIdx);
    const sizeVal = window.NODES[rig.focusIdx].size;
    const dist = rig.approaching ? sizeVal * 2.8 : sizeVal * 6.2;
    const ang = rig.focusIdx * 0.7 + 0.4;
    const off = new THREE.Vector3(
      Math.cos(ang) * dist * 0.9,
      dist * 0.32,
      Math.sin(ang) * dist * 0.9
    );
    rig.targetPos.copy(p).add(off);
    if (!isFinite(rig.targetPos.x) || !isFinite(rig.targetPos.y) || !isFinite(rig.targetPos.z)) {
      rig.targetPos.set(0, 6, 80);
    }
  }

  function tick(dt) {
    rig.pos.lerp(rig.targetPos, rig.approaching ? 0.03 : 0.018);
    camera.position.copy(rig.pos);

    rig.yaw += rig.yawVel; rig.pitch += rig.pitchVel;
    rig.yawVel *= 0.9; rig.pitchVel *= 0.9;
    rig.pitch = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, rig.pitch));

    const focusP = planetPos(rig.focusIdx);
    const basis  = new THREE.Matrix4().lookAt(camera.position, focusP, new THREE.Vector3(0, 1, 0));
    const q      = new THREE.Quaternion().setFromRotationMatrix(basis);
    const userQ  = new THREE.Quaternion().setFromEuler(new THREE.Euler(rig.pitch, rig.yaw, 0, 'YXZ'));
    q.multiply(userQ);
    camera.quaternion.slerp(q, 0.08);
  }

  // ----------------------------------------------------------------
  // Input: pointer drag, wheel, touch, tap
  // ----------------------------------------------------------------
  const ptr = { down: false, x: 0, y: 0, moved: false, startT: 0, startX: 0, startY: 0 };

  canvas.addEventListener('pointerdown', (e) => {
    ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY;
    ptr.startX = e.clientX; ptr.startY = e.clientY;
    ptr.moved = false; ptr.startT = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (ptr.down) {
      const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
      ptr.x = e.clientX; ptr.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 3) ptr.moved = true;
      rig.yawVel   += -dx * 0.0018 * rig.lookSens;
      rig.pitchVel += -dy * 0.0014 * rig.lookSens;
    }
    hoverX = (e.clientX / innerWidth)  * 2 - 1;
    hoverY = -(e.clientY / innerHeight) * 2 + 1;
  });

  canvas.addEventListener('pointerup', (e) => {
    ptr.down = false;
    if (!ptr.moved && performance.now() - ptr.startT < 400) {
      handleTap(e.clientX, e.clientY);
    }
  });

  let wheelAcc = 0, wheelLock = false;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelLock) return;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 50) {
      wheelAcc > 0 ? window.CHRONO.next() : window.CHRONO.prev();
      wheelAcc = 0; wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 600);
    }
  }, { passive: false });

  let pinchDist = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (Math.abs(d - pinchDist) > 40) {
        d < pinchDist ? window.CHRONO.next() : window.CHRONO.prev();
        pinchDist = d;
      }
    }
  }, { passive: false });

  // ----------------------------------------------------------------
  // Raycasting for hover / tap
  // ----------------------------------------------------------------
  let hoverX = 0, hoverY = 0, hoveredIdx = -1;
  const raycaster = new THREE.Raycaster();

  function raycastPlanet(clientX, clientY) {
    const p = new THREE.Vector2(
      clientX != null ? (clientX / innerWidth) * 2 - 1  : hoverX,
      clientY != null ? -(clientY / innerHeight) * 2 + 1 : hoverY
    );
    raycaster.setFromCamera(p, camera);

    // Collect hittable meshes — surf for planets, hub for station
    const targets = planets.map((g) => {
      if (g.userData.surf)  return g.userData.surf;
      if (g.userData.hub)   return g.userData.hub;
      return null;
    }).filter(Boolean);

    const hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return -1;

    let o = hits[0].object;
    while (o && !o.userData.def && o.parent) o = o.parent;
    // also walk up via parent group that holds userData.idx
    if (!o || o.userData.idx == null) {
      let g = hits[0].object.parent;
      while (g && g.userData.idx == null && g.parent) g = g.parent;
      return g ? g.userData.idx : -1;
    }
    return o.userData.idx ?? -1;
  }

  function handleTap(x, y) {
    const idx = raycastPlanet(x, y);
    if (idx >= 0) {
      window.CHRONO.goto(idx, true);
      window.UI && window.UI.dismissHints();
    } else if (rig.approaching) {
      window.CHRONO.retreat();
    }
  }

  // ----------------------------------------------------------------
  // Warp flash effect
  // ----------------------------------------------------------------
  function warp() {
    const el = document.getElementById('warp');
    if (!el) return;
    el.style.background = 'radial-gradient(ellipse at center, rgba(130,210,255,0.35), transparent 60%)';
    el.style.opacity = '1';
    setTimeout(() => {
      const e2 = document.getElementById('warp');
      if (e2) e2.style.opacity = '0';
    }, 450);
  }

  // ----------------------------------------------------------------
  // Public API — window.CHRONO
  // ----------------------------------------------------------------
  window.CHRONO = {
    begin() {
      rig.active = true;
      rig.focusIdx = 0;
      rig.approaching = false;
      updateTargetPos();
      warp();
    },
    goto(idx, approach) {
      const prev = rig.focusIdx;
      rig.focusIdx = Math.max(0, Math.min(window.NODES.length - 1, idx));
      rig.approaching = !!approach;
      if (prev !== rig.focusIdx || approach) warp();
      updateTargetPos();
      window.UI && window.UI.onNodeChange(rig.focusIdx, rig.approaching);
    },
    next() { this.goto(Math.min(rig.focusIdx + 1, window.NODES.length - 1), false); },
    prev() { this.goto(Math.max(rig.focusIdx - 1, 0), false); },
    approach() { this.goto(rig.focusIdx, true); },
    retreat() {
      rig.approaching = false;
      updateTargetPos();
      window.UI && window.UI.onNodeChange(rig.focusIdx, false);
    },
    getIdx() { return rig.focusIdx; },
    setPalette(name) {
      const p = window.PALETTES[name];
      if (!p) return;
      bgMat.uniforms.uHot.value.set(p.accent).multiplyScalar(0.8);
      document.documentElement.style.setProperty('--cyan', p.hot);
      document.documentElement.style.setProperty('--stroke-hot', p.hot);
    },
    setStars(v)   { buildStars(v); },
    setLook(v)    { rig.lookSens = v; },
    setNebula(v)  { bgMat.uniforms.uAmt.value = v; },
    setQuality(q) {
      QUALITY = q === 'auto' ? (isMobile ? 'low' : 'high') : q;
      buildStars(window.TWEAKS.stars || 1);
    }
  };

  // Apply initial palette
  window.CHRONO.setPalette(window.TWEAKS.palette);

  // ----------------------------------------------------------------
  // Render loop
  // ----------------------------------------------------------------
  const clock = new THREE.Clock();

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.066);
    const t  = clock.elapsedTime;

    bgMat.uniforms.uTime.value = t;
    if (starPoints) starPoints.material.uniforms.uTime.value = t;

    for (const g of planets) {
      const def = g.userData.def;

      if (!def.isStation) {
        // Planet: update surface time + rotation
        if (g.userData.surf) {
          g.userData.surf.material.uniforms.uTime.value = t;
          g.userData.surf.rotation.y += dt * 0.05;
        }
        if (g.userData.ring)  g.userData.ring.rotation.z += dt * 0.02;
        if (g.userData.moon) {
          const o = g.userData.moon.userData.orbit;
          o.a += dt * o.s;
          g.userData.moon.position.set(
            Math.cos(o.a) * o.r,
            Math.sin(o.a * 0.8) * o.r * 0.2,
            Math.sin(o.a) * o.r
          );
          g.userData.moon.rotation.y += dt * 0.5;
        }
      } else {
        // Station: rotate ring + hub + beacon
        if (g.userData.stationRing) g.userData.stationRing.rotation.y += dt * 0.6;
        if (g.userData.hub)         g.userData.hub.rotation.y += dt * 0.2;
        if (g.userData.hubMat)      g.userData.hubMat.uniforms.uTime.value = t;
        if (g.userData.ringMat)     g.userData.ringMat.uniforms.uTime.value = t;
        if (g.userData.beacon) {
          // blink every ~1.4 s
          g.userData.beaconMat.color.setHex(Math.sin(t * 4.5) > 0.5 ? 0xff4422 : 0x330800);
        }
      }

      // Gentle vertical drift for all objects
      g.position.y = g.userData.basePos.y + Math.sin(t * 0.3 + g.userData.idx) * 0.5;
    }

    // Hover reticle
    const idx = raycastPlanet();
    if (idx !== hoveredIdx) {
      hoveredIdx = idx;
      const ret = document.getElementById('reticle');
      const lab = document.getElementById('reticle-label');
      if (idx >= 0) {
        ret.classList.add('on');
        const n = window.NODES[idx];
        lab.textContent = n.isStation ? 'CONTACT · APPROACH' : 'APPROACH · ' + n.yearShort;
      } else {
        ret.classList.remove('on');
      }
    }

    if (rig.active) tick(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
})();
