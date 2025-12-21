import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'; // FIX: Direct Import

// DATA
const INITIAL_BODIES = [
  { id: 1, name: "Mercury", r: 0.8, dist: 10, period: 0.24, color: "#aaaaaa", type: 'ROCKY', parentId: null, discovery: "Known by Ancients", facts: ["Smallest planet"], trivia: "Mercury has a tail!" },
  { id: 2, name: "Venus", r: 1.2, dist: 15, period: 0.61, color: "#eebb88", type: 'GAS', parentId: null, discovery: "Known by Ancients", facts: ["Hottest planet"], trivia: "Spins backwards." },
  { id: 3, name: "Earth", r: 1.3, dist: 22, period: 1.0,  color: "#2233ff", type: 'ROCKY', parentId: null, clouds: true, atmosphere: true, discovery: "N/A", facts: ["Supports Life"], trivia: "Only planet not named after a god." },
  { id: 4, name: "Mars", r: 1.0, dist: 30, period: 1.88, color: "#cc4422", type: 'ROCKY', parentId: null, atmosphere: true, discovery: "Known by Ancients", facts: ["Tallest volcano"], trivia: "Sunsets are blue." },
  { id: 5, name: "Jupiter", r: 3.5, dist: 50, period: 11.86, color: "#dcbfa7", type: 'GAS', parentId: null, redSpot: true, discovery: "Known by Ancients", facts: ["Gas Giant"], trivia: "Protects Earth from asteroids." },
  { id: 6, name: "Saturn", r: 3.0, dist: 68, period: 29.45, color: "#eaddca", type: 'GAS', parentId: null, ring: true, discovery: "Known by Ancients", facts: ["Ring System"], trivia: "Would float in a bathtub." },
  { id: 7, name: "Uranus", r: 2.2, dist: 85, period: 84.0, color: "#4fd0e7", type: 'GAS', parentId: null, ring: true, discovery: "1781", facts: ["Ice Giant"], trivia: "Spins on its side." },
  { id: 8, name: "Neptune", r: 2.1, dist: 100, period: 164.8, color: "#2d44bc", type: 'GAS', parentId: null, discovery: "1846", facts: ["High Winds"], trivia: "One orbit since discovery." },
  { id: 9, name: "Pluto", r: 0.6, dist: 115, period: 248.0, color: "#ddccaa", type: 'ROCKY', parentId: null, discovery: "1930", facts: ["Dwarf Planet"], trivia: "Hasn't finished an orbit." },
  { id: 10, name: "Luna", r: 0.4, dist: 3, period: 0.07, color: "#ffffff", type: 'ROCKY', parentId: 3, discovery: "N/A", facts: ["Tidally Locked"], trivia: "Drifting away." },
  { id: 11, name: "Titan", r: 0.7, dist: 5, period: 0.04, color: "#ffee00", type: 'ROCKY', parentId: 6, atmosphere: true, discovery: "1655", facts: ["Thick Atmosphere"], trivia: "Liquid methane lakes." },
  { id: 12, name: "Halley's Comet", r: 0.4, dist: 60, period: 75.0, color: "#ffffff", type: 'COMET', parentId: null, eccentricity: 0.6, discovery: "Prehistoric", facts: ["Visible every 75 yrs"], trivia: "Mark Twain connection." },
  { id: 13, name: "I.S.S.", r: 0.15, dist: 2.5, period: 0.02, color: "#ffffff", type: 'STATION', parentId: 3, discovery: "1998", facts: ["Multinational Lab"], trivia: "Circles Earth every 90 mins." },
  { id: 14, name: "Mars Transfer", r: 0.3, dist: 26, period: 1.4, color: "#00ffff", type: 'SHIP', parentId: null, eccentricity: 0.15, discovery: "2030", facts: ["Human Crew"], trivia: "Nuclear Thermal Drive." }
];

export default function App() {
  const mountRef = useRef(null);
  
  const [bodies, setBodies] = useState(INITIAL_BODIES);
  const [timeSpeed, setTimeSpeed] = useState(1); 
  const [uiOpen, setUiOpen] = useState(true);
  const [focusId, setFocusId] = useState(null);
  const [selectedBody, setSelectedBody] = useState(null);
  const [hiddenOrbitIds, setHiddenOrbitIds] = useState([]);
  const [showHabitable, setShowHabitable] = useState(false);
  const [tourMode, setTourMode] = useState(false);
  const [simYear, setSimYear] = useState(2025);

  const [newBody, setNewBody] = useState({ name: '', r: 0.5, dist: 5, period: 1.0, color: '#ff00ff', type: 'ROCKY', parentId: "" });

  const speedRef = useRef(1);
  const focusRef = useRef(null);
  const yearRef = useRef(2025);
  const sceneRef = useRef({ planets: [], sunUniforms: { time: { value: 0 } }, sunMesh: null }); 

  useEffect(() => { speedRef.current = timeSpeed; }, [timeSpeed]);
  useEffect(() => { focusRef.current = focusId; }, [focusId]);

  // Tour Mode
  useEffect(() => {
    let tourTimer;
    if (tourMode) {
      const cycleTour = () => {
        setFocusId(prev => {
          const currentIndex = bodies.findIndex(b => b.id === prev);
          const nextIndex = (currentIndex + 1) % bodies.length;
          const nextBody = bodies[nextIndex];
          setSelectedBody(nextBody);
          return nextBody.id;
        });
      };
      tourTimer = setInterval(cycleTour, 8000);
      if (!focusId) cycleTour();
    } else {
      clearInterval(tourTimer);
    }
    return () => clearInterval(tourTimer);
  }, [tourMode, bodies, focusId]);


  // --- MAIN INITIALIZATION (Synchronous) ---
  useEffect(() => {
    let renderer, scene, camera, sun, starField, asteroids, voyagerProbe;
    let animationId;
    let camRadius = 140, camTheta = 0.5, camPhi = 0.5;
    const mouse = { x: 0, y: 0, down: false };
    let orbitTarget;

    // Helper: Texture Gen
    const createTexture = (type, colorHex, options = {}) => {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 256;
        const ctx = c.getContext('2d');
        const color = colorHex.replace('#','');
        const r = parseInt(color.substring(0,2), 16);
        const g = parseInt(color.substring(2,4), 16);
        const b = parseInt(color.substring(4,6), 16);

        if (type === 'CLOUDS') {
            ctx.clearRect(0,0,512,256);
            for(let i=0; i<300; i++) {
                const alpha = Math.random() * 0.5;
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                const x = Math.random()*512; const y = Math.random()*256; const s = Math.random()*30 + 10;
                ctx.beginPath(); ctx.ellipse(x,y,s, s*0.5, 0, 0, Math.PI*2); ctx.fill();
            }
            return new THREE.CanvasTexture(c);
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0,0,512,256);

        if (type === 'ROCKY' || type === 'COMET') {
            for(let i=0; i<5000; i++) {
                const shade = (Math.random() - 0.5) * 50;
                ctx.fillStyle = `rgba(${r+shade},${g+shade},${b+shade}, 0.5)`;
                ctx.fillRect(Math.random()*512, Math.random()*256, 4, 4);
            }
            for(let i=0; i<30; i++) {
                ctx.fillStyle = `rgba(0,0,0,0.3)`;
                const s = Math.random()*8 + 2;
                ctx.beginPath(); ctx.arc(Math.random()*512,Math.random()*256,s,0,Math.PI*2); ctx.fill();
            }
        } else if (type === 'GAS') {
            for(let i=0; i<256; i++) {
                const shade = Math.sin(i * 0.15) * 30; 
                ctx.fillStyle = `rgba(${r+shade},${g+shade},${b+shade}, 0.5)`;
                ctx.fillRect(0, i, 512, 1);
            }
            if (options.redSpot) {
                const sr = Math.min(255, r + 60); const sg = Math.max(0, g - 40); const sb = Math.max(0, b - 40);
                ctx.fillStyle = `rgba(${sr},${sg},${sb}, 0.8)`; ctx.beginPath(); ctx.ellipse(350, 150, 50, 30, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = `rgba(${sr-20},${sg},${sb}, 0.9)`; ctx.beginPath(); ctx.ellipse(350, 150, 30, 15, 0, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = `rgba(${r+60},${g+60},${b+60}, 0.4)`; ctx.beginPath(); ctx.ellipse(350, 150, 50, 30, 0, 0, Math.PI*2); ctx.fill();
            }
        }
        return new THREE.CanvasTexture(c);
    };

    const init = () => {
        if (!mountRef.current) return;

        // Cleanup
        while (mountRef.current.firstChild) mountRef.current.removeChild(mountRef.current.firstChild);

        orbitTarget = new THREE.Vector3(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace; 
        mountRef.current.appendChild(renderer.domElement);

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020205); 
        scene.fog = new THREE.FogExp2(0x020205, 0.002);

        // Camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 100, 200);

        // --- SUN ---
        const sunGeo = new THREE.SphereGeometry(6, 64, 64);
        const sunMat = new THREE.ShaderMaterial({
            uniforms: sceneRef.current.sunUniforms,
            vertexShader: `
              varying vec2 vUv; varying vec3 vPosition;
              void main() { vUv = uv; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `,
            fragmentShader: `
              uniform float time; varying vec2 vUv; varying vec3 vPosition;
              vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
              vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
              float snoise(vec3 v) {
                const vec2  C = vec2(1.0/6.0, 1.0/3.0); const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
              }
              void main() {
                float noiseVal = snoise(vPosition * 0.8 + vec3(time * 0.5));
                float noiseVal2 = snoise(vPosition * 2.0 + vec3(time * 0.2));
                vec3 dark = vec3(0.8, 0.1, 0.0); vec3 bright = vec3(1.0, 0.8, 0.2);
                float intensity = noiseVal * 0.6 + noiseVal2 * 0.4;
                intensity = intensity * 0.5 + 0.5;
                vec3 finalColor = mix(dark, bright, intensity);
                float viewDotNormal = dot(normalize(cameraPosition - vPosition), normalize(vPosition));
                float rim = 1.0 - max(0.0, viewDotNormal);
                rim = pow(rim, 3.0);
                finalColor += vec3(0.5, 0.2, 0.0) * rim;
                gl_FragColor = vec4(finalColor, 1.0);
              }
            `
        });
        sun = new THREE.Mesh(sunGeo, sunMat);
        sceneRef.current.sunMesh = sun; 
        
        const spriteMat = new THREE.SpriteMaterial({ 
            map: new THREE.CanvasTexture((() => {
                const c=document.createElement('canvas'); c.width=128; c.height=128;
                const x=c.getContext('2d');
                const g=x.createRadialGradient(64,64,10,64,64,60);
                g.addColorStop(0,'rgba(255,200,50,1)'); g.addColorStop(0.4,'rgba(255,100,0,0.5)'); g.addColorStop(1,'rgba(0,0,0,0)');
                x.fillStyle=g; x.fillRect(0,0,128,128);
                return c;
            })()), blending: THREE.AdditiveBlending, color: 0xffaa00 
        });
        const sunGlow = new THREE.Sprite(spriteMat);
        sunGlow.scale.set(40, 40, 1);
        sun.add(sunGlow);

        const pLight = new THREE.PointLight(0xffffff, 3000, 600);
        pLight.castShadow = true;
        pLight.shadow.mapSize.width = 2048; pLight.shadow.mapSize.height = 2048;
        sun.add(pLight);
        scene.add(sun);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 3.0); 
        scene.add(ambientLight);

        // --- STARFIELD ---
        const starsGeo = new THREE.BufferGeometry();
        const sCount = 5000;
        const sPos = new Float32Array(sCount * 3);
        const sColors = new Float32Array(sCount * 3);
        const colOpts = [new THREE.Color(0xffffff), new THREE.Color(0xaaccff), new THREE.Color(0xffccaa)];
        for(let i=0; i<sCount; i++) {
            sPos[i*3] = (Math.random()-0.5)*1500; sPos[i*3+1] = (Math.random()-0.5)*1500; sPos[i*3+2] = (Math.random()-0.5)*1500;
            const c = colOpts[Math.floor(Math.random()*colOpts.length)];
            sColors[i*3] = c.r; sColors[i*3+1] = c.g; sColors[i*3+2] = c.b;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.9 });
        starField = new THREE.Points(starsGeo, starsMat);
        scene.add(starField);

        // --- PLANET GENERATION ---
        const newPlanets = [];
        bodies.forEach(data => {
            let geo, mat, mesh;
            if (data.type === 'STATION') {
                mesh = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshStandardMaterial({color:'#aaa'}));
                body.rotation.z = Math.PI/2; mesh.add(body);
                const panels = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.4), new THREE.MeshStandardMaterial({color:'#112244'}));
                mesh.add(panels);
            }
            else if (data.type === 'SHIP') {
                mesh = new THREE.Group();
                const hull = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), new THREE.MeshStandardMaterial({color:'#555'}));
                hull.rotation.x = Math.PI/2; mesh.add(hull);
                const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0, 0.4), new THREE.MeshBasicMaterial({color:'#00ffff'}));
                eng.position.z = 0.4; eng.rotation.x = Math.PI/2; mesh.add(eng);
                const light = new THREE.PointLight(0x00ffff, 50, 5); light.position.z = 0.5; mesh.add(light);
            }
            else if (data.type === 'COMET') {
                geo = new THREE.IcosahedronGeometry(data.r, 0);
                const tex = createTexture(data.type, data.color);
                mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 });
                mesh = new THREE.Mesh(geo, mat);
                const tailGeo = new THREE.ConeGeometry(data.r * 0.8, data.r * 8, 16, 1, true);
                tailGeo.rotateX(Math.PI / 2); 
                const tailMat = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
                const tail = new THREE.Mesh(tailGeo, tailMat);
                tail.position.z = -data.r * 3; tail.rotation.x = Math.PI; mesh.add(tail);
            } else {
                geo = new THREE.SphereGeometry(data.r, 64, 64);
                const tex = createTexture(data.type, data.color, { redSpot: data.redSpot });
                mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.1 });
                mesh = new THREE.Mesh(geo, mat);
            }
            mesh.userData = { id: data.id };

            if (data.clouds) {
                const cGeo = new THREE.SphereGeometry(data.r * 1.02, 64, 64);
                const cTex = createTexture('CLOUDS', '#ffffff');
                const cMat = new THREE.MeshStandardMaterial({ map: cTex, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
                mesh.add(new THREE.Mesh(cGeo, cMat));
            }
            if (data.atmosphere) {
                const aGeo = new THREE.SphereGeometry(data.r * 1.15, 32, 32);
                const aMat = new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.2, side: THREE.BackSide, blending: THREE.AdditiveBlending });
                mesh.add(new THREE.Mesh(aGeo, aMat));
            }
            if (data.ring) {
                const ringGeo = new THREE.RingGeometry(data.r + 0.5, data.r + 2.5, 64);
                const ringMat = new THREE.MeshStandardMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.8 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2; ring.receiveShadow = true; mesh.add(ring);
            }

            mesh.castShadow = true; mesh.receiveShadow = true;
            scene.add(mesh);

            // Orbit
            let orbitMesh;
            if (data.eccentricity) {
                const curve = new THREE.EllipseCurve(0, 0, data.dist + (data.dist * data.eccentricity), data.dist * (1 - data.eccentricity), 0, 2 * Math.PI, false, 0);
                const pts = curve.getPoints(100);
                const orbGeo = new THREE.BufferGeometry().setFromPoints(pts);
                const orbMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }); // Brighter
                orbitMesh = new THREE.Line(orbGeo, orbMat);
                orbitMesh.rotation.x = Math.PI / 2;
                orbitMesh.position.x = data.dist * data.eccentricity;
            } else {
                const orbitGeo = new THREE.RingGeometry(data.dist - 0.05, data.dist + 0.05, 128);
                const orbitMat = new THREE.MeshBasicMaterial({ color: 0x666666, side: THREE.DoubleSide });
                orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
                orbitMesh.rotation.x = Math.PI / 2;
            }
            scene.add(orbitMesh);

            // Trail
            const trailGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(50 * 3);
            trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const trailMat = new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.5 });
            const trailMesh = new THREE.Line(trailGeo, trailMat);
            scene.add(trailMesh);

            newPlanets.push({ mesh, orbitMesh, trailMesh, data, angle: Math.random() * Math.PI * 2 });
        });
        sceneRef.current.planets = newPlanets;

        // --- ASTEROIDS ---
        let asteroidDummy = new THREE.Object3D();
        const astCount = 2000;
        const astGeo = new THREE.DodecahedronGeometry(0.2, 0); 
        const astMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.1 });
        asteroids = new THREE.InstancedMesh(astGeo, astMat, astCount);
        asteroids.instanceMatrix.setUsage(THREE.DynamicDrawUsage); 
        scene.add(asteroids);
        let asteroidData = [];
        for(let i=0; i<astCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 6; 
            const spread = (Math.random() - 0.5) * 3;
            const x = Math.cos(angle) * dist; const z = Math.sin(angle) * dist; const y = spread;
            asteroidData.push({ x, y, z });
            asteroidDummy.position.set(x, y, z);
            asteroidDummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
            const s = 0.5 + Math.random();
            asteroidDummy.scale.set(s,s,s);
            asteroidDummy.updateMatrix();
            asteroids.setMatrixAt(i, asteroidDummy.matrix);
        }

        // Voyager
        voyagerProbe = new THREE.Group();
        voyagerProbe.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshBasicMaterial({color: 0x999999})));
        const vDish = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 16, 1, true), new THREE.MeshBasicMaterial({color: 0xcccccc, side: THREE.DoubleSide}));
        vDish.position.y = 1; vDish.rotation.x = Math.PI; voyagerProbe.add(vDish);
        const c = document.createElement('canvas'); c.width=128; c.height=64;
        const ctx = c.getContext('2d'); ctx.fillStyle='#000'; ctx.fillRect(0,0,128,64); ctx.fillStyle='#d4af37'; ctx.font='bold 24px Arial'; ctx.textAlign='center'; ctx.fillText('BTB-V1', 64, 40);
        const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c) }));
        tag.scale.set(2, 1, 1); tag.position.set(0, 0, 0.6); voyagerProbe.add(tag);
        voyagerProbe.position.set(130, 5, 0); scene.add(voyagerProbe);

        // --- HABITABLE ZONE RING ---
        const hzGeo = new THREE.RingGeometry(18, 28, 64);
        const hzMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        const hzMesh = new THREE.Mesh(hzGeo, hzMat);
        hzMesh.rotation.x = Math.PI / 2; hzMesh.visible = false;
        sceneRef.current.habitableZone = hzMesh;
        scene.add(hzMesh);

        // --- ANIMATION LOOP ---
        const raycast = new THREE.Raycaster();
        const mVec = new THREE.Vector2();
        const BASE_ORBITAL_SPEED = (Math.PI * 2) / (24 * 60 * 60);

        const animate = () => {
            const dt = speedRef.current;
            const targetId = focusRef.current; 

            if (sceneRef.current.sunMesh) sceneRef.current.sunMesh.rotation.y -= 0.002 * dt;
            sceneRef.current.sunUniforms.time.value += 0.01;

            if (sceneRef.current.planets) {
                sceneRef.current.planets.forEach(p => {
                    p.mesh.rotation.y += 0.01 / p.data.r;
                    if (p.data.type === 'COMET') p.mesh.lookAt(0,0,0);
                    if (p.data.type === 'SHIP') { p.mesh.lookAt(0,0,0); p.mesh.rotateY(Math.PI / 2); }

                    const orbitalStep = (BASE_ORBITAL_SPEED / p.data.period) * dt;

                    if (!p.data.parentId) {
                        p.angle += orbitalStep;
                        let x = Math.cos(p.angle) * p.data.dist;
                        let z = Math.sin(p.angle) * p.data.dist;
                        if (p.data.eccentricity) {
                            x = Math.cos(p.angle) * p.data.dist;
                            z = Math.sin(p.angle) * p.data.dist * (1 - p.data.eccentricity);
                            x += p.data.dist * p.data.eccentricity;
                        }
                        p.mesh.position.x = x; p.mesh.position.z = z;
                        if (!p.data.eccentricity) p.orbitMesh.position.set(0, 0, 0);
                        if (p.data.name === "Earth") yearRef.current = 2025 + Math.floor(p.angle / (Math.PI * 2));
                    }

                    if (p.trailMesh) {
                        const positions = p.trailMesh.geometry.attributes.position.array;
                        for (let i = positions.length - 3; i >= 3; i -= 3) {
                            positions[i] = positions[i - 3]; positions[i + 1] = positions[i - 2]; positions[i + 2] = positions[i - 1];
                        }
                        positions[0] = p.mesh.position.x; positions[1] = p.mesh.position.y; positions[2] = p.mesh.position.z;
                        p.trailMesh.geometry.attributes.position.needsUpdate = true;
                    }
                });

                sceneRef.current.planets.forEach(p => {
                    if (p.data.parentId) {
                        const parent = sceneRef.current.planets.find(x => x.data.id === parseInt(p.data.parentId));
                        if (parent) {
                            const orbitalStep = (BASE_ORBITAL_SPEED / p.data.period) * dt;
                            p.angle += orbitalStep;
                            p.mesh.position.x = parent.mesh.position.x + Math.cos(p.angle) * p.data.dist;
                            p.mesh.position.z = parent.mesh.position.z + Math.sin(p.angle) * p.data.dist;
                            p.orbitMesh.position.copy(parent.mesh.position);
                            if (p.trailMesh) {
                                const positions = p.trailMesh.geometry.attributes.position.array;
                                for (let i = positions.length - 3; i >= 3; i -= 3) {
                                    positions[i] = positions[i - 3]; positions[i + 1] = positions[i - 2]; positions[i + 2] = positions[i - 1];
                                }
                                positions[0] = p.mesh.position.x; positions[1] = p.mesh.position.y; positions[2] = p.mesh.position.z;
                                p.trailMesh.geometry.attributes.position.needsUpdate = true;
                            }
                        }
                    }
                });
            }

            // Camera
            let targetPlanet = null;
            if (targetId) targetPlanet = sceneRef.current.planets.find(p => p.data.id === targetId);

            if (targetPlanet) {
                const offsetDist = 8 + targetPlanet.data.r * 2;
                const camX = targetPlanet.mesh.position.x + offsetDist;
                const camZ = targetPlanet.mesh.position.z + offsetDist;
                const camY = 5 + targetPlanet.data.r;
                camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.05);
                camera.lookAt(targetPlanet.mesh.position);
            } else {
                const x = orbitTarget.x + camRadius * Math.sin(camTheta) * Math.cos(camPhi);
                const y = orbitTarget.y + camRadius * Math.cos(camTheta);
                const z = orbitTarget.z + camRadius * Math.sin(camTheta) * Math.sin(camPhi);
                camera.position.lerp(new THREE.Vector3(x, y, z), 0.05);
                camera.lookAt(orbitTarget);
            }

            if (asteroids) asteroids.rotation.y += 0.0005 * dt;
            if (voyagerProbe) voyagerProbe.rotation.y += 0.005;
            if (Date.now() % 10 === 0) setSimYear(yearRef.current);

            // Mouse
            mVec.x = mouse.x; mVec.y = mouse.y;
            raycast.setFromCamera(mVec, camera);
            const meshes = sceneRef.current.planets.map(p => p.mesh);
            const intersects = raycast.intersectObjects(meshes);
            document.body.style.cursor = intersects.length > 0 ? 'pointer' : (focusId ? 'default' : (mouse.down ? 'grabbing' : 'grab'));

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };
        animate();

        // Events
        const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
        const onMouseMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (e.buttons === 1 && !focusRef.current) { camPhi += e.movementX * 0.005; camTheta += e.movementY * 0.005; camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta)); }
            else if (e.buttons === 2 && !focusRef.current) {
                const panSpeed = camRadius * 0.001; 
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
                const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
                orbitTarget.addScaledVector(right, -e.movementX * panSpeed); orbitTarget.addScaledVector(forward, e.movementY * panSpeed);
            }
        };
        const onWheel = (e) => { if (!focusRef.current) { camRadius += e.deltaY * 0.05; camRadius = Math.max(20, Math.min(400, camRadius)); } };
        const onMouseDown = (e) => {
             mouse.down = true;
             const mX = (e.clientX / window.innerWidth) * 2 - 1; const mY = -(e.clientY / window.innerHeight) * 2 + 1;
             raycast.setFromCamera({x: mX, y: mY}, camera);
             const meshes = sceneRef.current.planets.map(p => p.mesh);
             const intersects = raycast.intersectObjects(meshes);
             if (intersects.length > 0) {
                 let hit = intersects[0].object;
                 while(!hit.userData.id && hit.parent) hit = hit.parent;
                 const pData = sceneRef.current.planets.find(p => p.data.id === hit.userData.id)?.data;
                 if (pData) setSelectedBody(pData);
             }
        };
        const onMouseUp = () => { mouse.down = false; };
        const onDblClick = (e) => {
            const mX = (e.clientX / window.innerWidth) * 2 - 1; const mY = -(e.clientY / window.innerHeight) * 2 + 1;
            raycast.setFromCamera({x: mX, y: mY}, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const target = new THREE.Vector3();
            raycast.ray.intersectPlane(plane, target);
            if (target) orbitTarget.copy(target);
        };
        const onCtx = (e) => e.preventDefault();

        window.addEventListener('resize', onResize); window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('wheel', onWheel); window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp); window.addEventListener('dblclick', onDblClick);
        window.addEventListener('contextmenu', onCtx);

        return () => {
            window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('wheel', onWheel); window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('dblclick', onDblClick);
            window.removeEventListener('contextmenu', onCtx);
            cancelAnimationFrame(animationId);
            if(renderer) { renderer.dispose(); if(mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement); }
        };
    };

    init();
  }, [bodies]); 


  // Handlers
  const toggleOrbit = (id) => setHiddenOrbitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllOrbits = () => setHiddenOrbitIds(hiddenOrbitIds.length > 0 ? [] : bodies.map(b => b.id));
  const removeBody = (id) => setBodies(bodies.filter(b => b.id !== id));
  const addBody = () => {
      const id = Date.now();
      setBodies([...bodies, { ...newBody, id, facts: ["Custom Object"], discovery: "User Created", trivia: "Generated by Architect." }]);
  };

  // Visibility effects
  useEffect(() => {
      if (sceneRef.current.planets) {
          sceneRef.current.planets.forEach(p => { if (p.orbitMesh) p.orbitMesh.visible = !hiddenOrbitIds.includes(p.data.id); });
      }
  }, [hiddenOrbitIds]);

  useEffect(() => {
      if (sceneRef.current.habitableZone) sceneRef.current.habitableZone.visible = showHabitable;
  }, [showHabitable]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', fontFamily: 'monospace' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', display: 'block', cursor: focusId ? 'default' : 'crosshair' }} />
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', pointerEvents: 'none', opacity: 0.5, fontSize: '10px', color: '#555', zIndex: 9999 }}>BTB</div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              EARTH YEAR: {simYear}
              <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>OBJECTS: {bodies.length} // MODE: {focusId ? 'TRACKING' : 'ORBIT'}</div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>R-CLICK DRAG: PAN // DBL-CLICK: RE-CENTER</div>
          </div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={() => setTourMode(!tourMode)} style={{ background: tourMode ? '#00ffff' : '#333', color: tourMode ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{tourMode ? 'STOP TOUR' : 'START TOUR'}</button>
              <button onClick={() => setShowHabitable(!showHabitable)} style={{ background: showHabitable ? '#00ff00' : '#333', color: showHabitable ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>ZONE</button>
              <button onClick={toggleAllOrbits} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '10px', cursor: 'pointer' }}>{hiddenOrbitIds.length === 0 ? '[ O ]' : '[ x ]'}</button>
              <button onClick={() => setUiOpen(!uiOpen)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '10px 20px', cursor: 'pointer' }}>{uiOpen ? 'CLOSE' : 'OPEN'}</button>
          </div>
          {focusId && !tourMode && (
              <button onClick={() => setFocusId(null)} style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', background: 'rgba(0,255,255,0.2)', border: '1px solid #00ffff', color: '#00ffff', padding: '10px 30px', fontWeight: 'bold', cursor: 'pointer' }}>EXIT PLANET LOCK</button>
          )}
          {selectedBody && (
              <div style={{ position: 'absolute', top: '50%', left: '40px', width: '280px', transform: 'translateY(-50%)', background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: `1px solid ${selectedBody.color}`, boxShadow: `0 0 50px ${selectedBody.color}66`, padding: '20px', color: 'white', pointerEvents: 'auto', zIndex: 20 }}>
                  <button onClick={() => setSelectedBody(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedBody.name}</h2>
                      <div style={{ background: selectedBody.color, width: '15px', height: '15px', borderRadius: '50%', boxShadow: `0 0 15px ${selectedBody.color}` }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '15px', fontStyle: 'italic' }}>DISCOVERED: <span style={{ color: '#fff' }}>{selectedBody.discovery || "Unknown"}</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px', fontSize: '0.7rem', color: '#aaa' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', textAlign: 'center' }}><div style={{color:'#fff', fontWeight:'bold'}}>PERIOD</div>{selectedBody.period} YR</div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', textAlign: 'center' }}><div style={{color:'#fff', fontWeight:'bold'}}>DISTANCE</div>{selectedBody.dist} AU</div>
                  </div>
                  <ul style={{ paddingLeft: '15px', margin: '0 0 15px 0', fontSize: '0.8rem', lineHeight: '1.4', color: '#ddd' }}>{selectedBody.facts ? selectedBody.facts.map((fact, i) => <li key={i}>{fact}</li>) : <li>No data</li>}</ul>
                  {selectedBody.trivia && <div style={{ background: `linear-gradient(45deg, ${selectedBody.color}22, transparent)`, padding: '12px', borderLeft: `3px solid ${selectedBody.color}`, fontSize: '0.8rem', fontStyle: 'italic', color: '#ccc' }}>" {selectedBody.trivia} "</div>}
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}><button onClick={() => setFocusId(selectedBody.id)} style={{ flex: 1, padding: '8px', background: selectedBody.color, border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}>RIDE ALONG</button></div>
              </div>
          )}
          {uiOpen && (
              <div style={{ position: 'absolute', top: '70px', right: '20px', width: '380px', background: 'rgba(10, 10, 20, 0.95)', border: '1px solid #333', padding: '20px', pointerEvents: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                      <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>TIME WARP: {timeSpeed}x</label>
                      <input type="range" min="0" max="10000" step="10" value={timeSpeed} onChange={e => setTimeSpeed(parseFloat(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
                      <h3 style={{ color: '#fff', marginTop: 0 }}>ADD BODY</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <input placeholder="Name" value={newBody.name} onChange={e => setNewBody({...newBody, name: e.target.value})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px' }} />
                          <select value={newBody.type} onChange={e => setNewBody({...newBody, type: e.target.value})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px' }}><option value="ROCKY">ROCKY</option><option value="GAS">GAS</option><option value="COMET">COMET</option><option value="STATION">STATION</option><option value="SHIP">SHIP</option></select>
                          <input type="number" placeholder="Radius" value={newBody.r} onChange={e => setNewBody({...newBody, r: parseFloat(e.target.value)})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px' }} />
                          <input type="number" placeholder="Distance" value={newBody.dist} onChange={e => setNewBody({...newBody, dist: parseFloat(e.target.value)})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px' }} />
                          <input type="number" placeholder="Period (Yrs)" value={newBody.period} onChange={e => setNewBody({...newBody, period: parseFloat(e.target.value)})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px' }} />
                          <select value={newBody.parentId} onChange={e => setNewBody({...newBody, parentId: e.target.value})} style={{ background: '#222', border: 'none', color: '#fff', padding: '5px', gridColumn: 'span 2' }}><option value="">Orbit: Sun</option>{bodies.map(b => (<option key={b.id} value={b.id}>Orbit: {b.name}</option>))}</select>
                          <input type="color" value={newBody.color} onChange={e => setNewBody({...newBody, color: e.target.value})} style={{ width: '100%', height: '30px', border: 'none' }} />
                          <button onClick={addBody} style={{ background: '#00ffff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>ADD</button>
                      </div>
                  </div>
                  <div>
                      <h3 style={{ color: '#fff', marginTop: 0 }}>SYSTEM DATA</h3>
                      {bodies.map(b => (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }}></div><div><div style={{ color: '#fff' }}>{b.name}</div>{b.parentId && <div style={{ color: '#00ffff', fontSize: '0.7rem' }}>Moon of ID:{b.parentId}</div>}</div></div>
                              <div style={{ display: 'flex', gap: '5px' }}><button onClick={() => toggleOrbit(b.id)} style={{ background: 'transparent', border: '1px solid #555', color: hiddenOrbitIds.includes(b.id) ? '#555' : '#aaa', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 5px' }}>[ o ]</button><button onClick={() => setFocusId(b.id)} style={{ background: focusId === b.id ? '#00ffff' : '#333', color: focusId === b.id ? '#000' : '#aaa', border: 'none', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 5px' }}>{focusId === b.id ? 'LOCK' : 'VIEW'}</button><button onClick={() => removeBody(b.id)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>x</button></div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}