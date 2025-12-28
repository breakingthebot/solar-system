import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'; // FIX: Direct Import

// DATA
const INITIAL_BODIES = [
  // Sagittarius A* - Positioned at 12,000 units, marked isStatic to prevent orbital rotation
  { id: 0, name: "Sagittarius A*", r: 500, dist: 12000, period: 100, color: "#ff6600", type: 'BLACK_HOLE', isStatic: false, discovery: "1974", facts: ["Supermassive black hole", "Center of Milky Way", "4 million solar masses"], trivia: "Gravity is so strong even light cannot escape." },
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
  { id: 12, name: "Halley's Comet", r: 0.4, dist: 50.4, period: 75.3, color: "#ffffff", type: 'COMET', parentId: null, eccentricity: 0.85, discovery: "1758", facts: ["Visible every 75-76 yrs", "Highly eccentric orbit"], trivia: "Next perihelion: July 2061." },
  { id: 13, name: "I.S.S.", r: 0.15, dist: 2.5, period: 0.02, color: "#ffffff", type: 'STATION', parentId: 3, discovery: "1998", facts: ["Multinational Lab"], trivia: "Circles Earth every 90 mins." },
  { id: 14, name: "Mars Transfer", r: 0.3, dist: 26, period: 1.4, color: "#00ffff", type: 'SHIP', parentId: null, eccentricity: 0.15, discovery: "2030", facts: ["Human Crew"], trivia: "Nuclear Thermal Drive." }
];

// CONSTELLATIONS - Expanded set including the Zodiac and Deep Space patterns
const CONSTELLATIONS = [
  { name: "Ursa Major", color: "#ffffff", stars: [[2000, 1000, -4000], [1900, 1100, -3900], [1800, 1050, -3700], [1700, 1200, -3600], [1600, 1400, -3500], [1750, 1500, -3550], [1900, 1100, -3900]], center: [1800, 1200, -3700] },
  { name: "Orion", color: "#aaccff", stars: [[-2500, 1500, 1500], [-2400, 1450, 1550], [-2300, 1600, 1600], [-2450, 800, 1700], [-2250, 750, 1750], [-2500, 1500, 1500], [-2450, 2000, 1400], [-2250, 1950, 1350]], center: [-2400, 1400, 1500] },
  { name: "Cassiopeia", color: "#ffccaa", stars: [[4000, 3000, -1000], [3800, 3200, -800], [3600, 2900, -900], [3400, 3100, -700], [3200, 2800, -800]], center: [3600, 3000, -850] },
  { name: "Aries", color: "#ffaa99", stars: [[6000, 1000, 2000], [5800, 1100, 2100], [5500, 900, 2300]], center: [5800, 1000, 2150] },
  { name: "Taurus", color: "#ffddaa", stars: [[5000, 2000, -3000], [4800, 2200, -2800], [4600, 1800, -2600], [4400, 2400, -2400], [4200, 1600, -2200]], center: [4600, 2000, -2600] },
  { name: "Gemini", color: "#aaffaa", stars: [[-4000, -2000, -2000], [-3800, -1800, -2200], [-4200, -2200, -1800], [-3500, -1500, -2500], [-4500, -2500, -1500]], center: [-4000, -2000, -2000] },
  { name: "Cancer", color: "#aaaaff", stars: [[-2000, 3000, 6000], [-2100, 2800, 5800], [-1900, 3200, 6200], [-2200, 2600, 5600]], center: [-2050, 2900, 5900] },
  { name: "Leo", color: "#ffaa00", stars: [[5000, -1000, 1000], [5200, -800, 1100], [5400, -1100, 1200], [5300, -1400, 1300], [5000, -1500, 1200], [4800, -1300, 1100]], center: [5100, -1200, 1150] },
  { name: "Virgo", color: "#ffffff", stars: [[-6000, 0, 1000], [-5800, 200, 1200], [-5600, -200, 1400], [-5400, 400, 1600]], center: [-5600, 0, 1400] },
  { name: "Libra", color: "#ccffaa", stars: [[0, -5000, 5000], [200, -4800, 5200], [-200, -5200, 4800]], center: [100, -4900, 5100] },
  { name: "Scorpius", color: "#ff4444", stars: [[-1000, -3000, 5000], [-1200, -3200, 5200], [-1400, -3500, 5400], [-1300, -3800, 5600]], center: [-1200, -3500, 5300] },
  { name: "Sagittarius", color: "#ffaa55", stars: [[3000, -3000, -5000], [3200, -2800, -5200], [2800, -3200, -4800]], center: [3000, -3000, -5000] },
  { name: "Capricornus", color: "#aaaaaa", stars: [[-5000, -4000, 2000], [-4800, -3800, 2200], [-5200, -4200, 1800]], center: [-4900, -3900, 2100] },
  { name: "Aquarius", color: "#77ccff", stars: [[2000, 5000, -4000], [2200, 4800, -3800], [1800, 5200, -4200]], center: [2100, 4900, -3900] },
  { name: "Pisces", color: "#ffccff", stars: [[-1000, 6000, 3000], [-800, 5800, 3200], [-1200, 6200, 2800]], center: [-900, 5900, 3100] },
  { name: "Andromeda", color: "#cc99ff", stars: [[-4000, 4000, -2000], [-3800, 4200, -1800], [-3600, 4100, -1600]], center: [-3700, 4150, -1700] }
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
  const [showGalaxy, setShowGalaxy] = useState(true);
  const [showOort, setShowOort] = useState(true); // Oort Cloud Visibility
  const [conLabels, setConLabels] = useState([]);

  const [newBody, setNewBody] = useState({ name: '', r: 0.5, dist: 5, period: 1.0, color: '#ff00ff', type: 'ROCKY', parentId: "" });

  const speedRef = useRef(1);
  const focusRef = useRef(null);
  const yearRef = useRef(2025);
  const sceneRef = useRef({ planets: [], sunUniforms: { time: { value: 0 } }, sunMesh: null, galaxyMesh: null, oortMesh: null }); 

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
        const hex = colorHex || "#000000"; // FIX: Handle undefined colorHex
        const color = hex.replace('#','');
        const r = parseInt(color.substring(0,2), 16);
        const g = parseInt(color.substring(2,4), 16);
        const b = parseInt(color.substring(4,6), 16);

        if (type === 'GALAXY') {
            c.width = 1024; c.height = 1024;
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, 1024, 1024);
            const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
            grad.addColorStop(0, 'rgba(60, 40, 110, 0.5)');
            grad.addColorStop(0.4, 'rgba(20, 10, 40, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1024, 1024);
            for(let i=0; i<3000; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(Math.random()*1024, Math.random()*1024, 1.5, 1.5);
            }
            return new THREE.CanvasTexture(c);
        }

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

        if (type === 'ROCKY' || type === 'COMET' || type === 'BLACK_HOLE') {
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
            // Draw atmospheric bands
            for(let i=0; i<256; i++) {
                const noise = Math.sin(i * 0.2) * 20; 
                ctx.fillStyle = `rgba(${r+noise},${g+noise},${b+noise}, 1)`;
                ctx.fillRect(0, i, 512, 1);
            }
            
            if (options.redSpot) {
                // Outer swirl for the storm
                const sr = 180, sg = 60, sb = 50;
                const spotX = 350, spotY = 130;
                
                // Shadow/Depth of the storm
                ctx.fillStyle = `rgba(0,0,0,0.3)`;
                ctx.beginPath(); ctx.ellipse(spotX + 5, spotY + 5, 45, 25, 0, 0, Math.PI*2); ctx.fill();

                // Main storm body
                const grad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 40);
                grad.addColorStop(0, `rgb(${sr+40}, ${sg+20}, ${sb})`);
                grad.addColorStop(1, `rgb(${sr}, ${sg}, ${sb})`);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.ellipse(spotX, spotY, 40, 22, 0, 0, Math.PI*2); ctx.fill();

                // Inner white "eye" of the storm
                ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(spotX, spotY, 20, 10, 0.2, 0, Math.PI*2); ctx.stroke();
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
        scene.fog = new THREE.FogExp2(0x020205, 0.00006); 

        // Camera - Increased FAR plane to 25,000 for galactic background
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 25000);
        camera.position.set(0, 100, 200);

        // Galaxy Sphere
        const galGeo = new THREE.SphereGeometry(15000, 64, 64);
        const galMat = new THREE.MeshBasicMaterial({ map: createTexture('GALAXY'), side: THREE.BackSide, transparent: true, opacity: 0.9 });
        const galMesh = new THREE.Mesh(galGeo, galMat);
        scene.add(galMesh);
        sceneRef.current.galaxyMesh = galMesh;

        // Oort Cloud - 15,000 Icy particles in a spherical shell
        const oortGeo = new THREE.BufferGeometry();
        const oortCount = 15000;
        const oortPos = new Float32Array(oortCount * 3);
        for(let i=0; i<oortCount; i++) {
            const u = Math.random(); const v = Math.random();
            const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
            const r = 6000 + (Math.random() * 2000); 
            oortPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            oortPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            oortPos[i*3+2] = r * Math.cos(phi);
        }
        oortGeo.setAttribute('position', new THREE.BufferAttribute(oortPos, 3));
        const oortMesh = new THREE.Points(oortGeo, new THREE.PointsMaterial({ size: 1.5, color: 0x99ccff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
        scene.add(oortMesh);
        sceneRef.current.oortMesh = oortMesh;

        // Constellation Rendering
        const conGrp = new THREE.Group();
        CONSTELLATIONS.forEach(con => {
            const starsVec = con.stars.map(s => new THREE.Vector3(...s));
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(starsVec), new THREE.LineBasicMaterial({ color: con.color, transparent: true, opacity: 0.2 }));
            conGrp.add(line);
            starsVec.forEach(p => {
                const star = new THREE.Mesh(new THREE.SphereGeometry(15, 8, 8), new THREE.MeshBasicMaterial({ color: con.color }));
                star.position.copy(p);
                conGrp.add(star);
            });
        });
        scene.add(conGrp);

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
                mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
                mesh = new THREE.Mesh(geo, mat);
                
                // Tail Geometry: Pointing along the Z axis
                const tailGeo = new THREE.ConeGeometry(data.r * 0.7, data.r * 12, 16, 1, true);
                // Rotate geometry once so the tip of the cone is the "base" at the comet
                tailGeo.translate(0, - (data.r * 6), 0); 
                tailGeo.rotateX(Math.PI / 2); 
                
                const tailMat = new THREE.MeshBasicMaterial({ 
                    color: 0xaaccff, 
                    transparent: true, 
                    opacity: 0.5, 
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending 
                });
                const tail = new THREE.Mesh(tailGeo, tailMat);
                mesh.add(tail);
            
            } else if (data.type === 'BLACK_HOLE') {
                mesh = new THREE.Group();
                const singularity = new THREE.Mesh(new THREE.SphereGeometry(data.r * 0.4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                mesh.add(singularity);
                const diskGeo = new THREE.RingGeometry(data.r * 0.5, data.r * 2.5, 128);
                const diskMat = new THREE.MeshBasicMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
                const accretion = new THREE.Mesh(diskGeo, diskMat);
                accretion.rotation.x = Math.PI / 2.2; mesh.add(accretion);
                mesh.position.set(0, 0, data.dist);
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
                const orbMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }); 
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
        for(let i=0; i<astCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 6; 
            const x = Math.cos(angle) * dist; const z = Math.sin(angle) * dist; const y = (Math.random()-0.5)*3;
            asteroidDummy.position.set(x, y, z);
            asteroidDummy.updateMatrix();
            asteroids.setMatrixAt(i, asteroidDummy.matrix);
        }

        // Voyager
        voyagerProbe = new THREE.Group();
        voyagerProbe.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshBasicMaterial({color: 0x999999})));
        voyagerProbe.position.set(130, 5, 0); scene.add(voyagerProbe);

        // Habitable Zone
        const hzMesh = new THREE.Mesh(new THREE.RingGeometry(18, 28, 64), new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
        hzMesh.rotation.x = Math.PI / 2; hzMesh.visible = false;
        sceneRef.current.habitableZone = hzMesh; scene.add(hzMesh);

        // --- ANIMATION LOOP ---
        const raycast = new THREE.Raycaster();
        const mVec = new THREE.Vector2();
        const BASE_ORBITAL_SPEED = (Math.PI * 2) / (24 * 60 * 60);

        const animate = () => {
            const dt = speedRef.current;
            const targetId = focusRef.current; 

            if (sceneRef.current.sunMesh) sceneRef.current.sunMesh.rotation.y -= 0.002 * dt;
            if (sceneRef.current.galaxyMesh) sceneRef.current.galaxyMesh.rotation.y += 0.00004 * dt;
            sceneRef.current.sunUniforms.time.value += 0.01;


// COPY START
            sceneRef.current.planets.forEach(p => {
                if (p.data.isStatic) return; // Skip orbital logic for Sagittarius A*

                // COMET TAIL FIX:
                // Only spin the mesh if it's NOT a comet. 
                // If it IS a comet, force it to look at the Sun (0,0,0)
                if (p.data.type === 'COMET') {
                    p.mesh.lookAt(0, 0, 0);
                } else {
                    p.mesh.rotation.y += 0.01 / p.data.r;
                }

                const step = (BASE_ORBITAL_SPEED / p.data.period) * dt;
                
                if (!p.data.parentId) {
                    p.angle += step;
                    let x = Math.cos(p.angle) * p.data.dist;
                    let z = Math.sin(p.angle) * p.data.dist;
                    if (p.data.eccentricity) {
                        // Math: x = a * cos(t), focus offset = a * e
                        x = Math.cos(p.angle) * p.data.dist;
                        z = Math.sin(p.angle) * p.data.dist * (1 - p.data.eccentricity);
                        
                        // Widening Fix: We add a +8 buffer so the comet clears the Sun (radius 6)
                        // This pushes the "close side" to ~8.5 units away from center
                        const buffer = p.data.type === 'COMET' ? 12 : 0;
                        x += (p.data.dist * p.data.eccentricity) + buffer;
// --- UPDATED BLOCK (COPY END) ---
                    }
                    p.mesh.position.set(x, 0, z);
                    if (p.data.name === "Earth") yearRef.current = 2025 + Math.floor(p.angle / (Math.PI * 2));
                }

                const pos = p.trailMesh.geometry.attributes.position.array;
                for (let i = pos.length - 3; i >= 3; i -= 3) { pos[i] = pos[i-3]; pos[i+1] = pos[i-2]; pos[i+2] = pos[i-1]; }
                pos[0] = p.mesh.position.x; pos[1] = p.mesh.position.y; pos[2] = p.mesh.position.z;
                p.trailMesh.geometry.attributes.position.needsUpdate = true;
            });
// COPY END

            sceneRef.current.planets.forEach(p => {
                if (p.data.parentId) {
                    const parent = sceneRef.current.planets.find(x => x.data.id === parseInt(p.data.parentId));
                    if (parent) {
                        p.angle += (BASE_ORBITAL_SPEED / p.data.period) * dt;
                        p.mesh.position.set(parent.mesh.position.x + Math.cos(p.angle)*p.data.dist, 0, parent.mesh.position.z + Math.sin(p.angle)*p.data.dist);
                        p.orbitMesh.position.copy(parent.mesh.position);
                    }
                }
            });

            let targetPlanet = sceneRef.current.planets.find(p => p.data.id === targetId);
            if (targetPlanet) {
                const off = 8 + targetPlanet.data.r * 2;
                camera.position.lerp(new THREE.Vector3(targetPlanet.mesh.position.x + off, 5, targetPlanet.mesh.position.z + off), 0.05);
                camera.lookAt(targetPlanet.mesh.position);
            } else {
                camera.position.lerp(new THREE.Vector3(orbitTarget.x + camRadius * Math.sin(camTheta) * Math.cos(camPhi), orbitTarget.y + camRadius * Math.cos(camTheta), orbitTarget.z + camRadius * Math.sin(camTheta) * Math.sin(camPhi)), 0.05);
                camera.lookAt(orbitTarget);
            }

            const nLabels = CONSTELLATIONS.map(c => {
                const v = new THREE.Vector3(...c.center);
                v.project(camera);
                return { name: c.name, x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-(v.y * 0.5 - 0.5)) * window.innerHeight, visible: v.z < 1 };
            });
            setConLabels(nLabels);

            if (asteroids) asteroids.rotation.y += 0.0005 * dt;
            if (Date.now() % 10 === 0) setSimYear(yearRef.current);
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };
        animate();

        const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
        const onMouseMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (e.buttons === 1 && !focusRef.current) { camPhi += e.movementX * 0.005; camTheta += e.movementY * 0.005; camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta)); }
            else if (e.buttons === 2 && !focusRef.current) {
                const pan = camRadius * 0.001; 
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize();
                const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); rgt.y = 0; rgt.normalize();
                orbitTarget.addScaledVector(rgt, -e.movementX * pan); orbitTarget.addScaledVector(fwd, e.movementY * pan);
            }
        };
        const onWheel = (e) => { if (!focusRef.current) { camRadius += e.deltaY * 0.05; camRadius = Math.max(20, Math.min(1000, camRadius)); } };
        const onMouseDown = (e) => {
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
        const onDblClick = (e) => {
            const mX = (e.clientX / window.innerWidth) * 2 - 1; const mY = -(e.clientY / window.innerHeight) * 2 + 1;
            raycast.setFromCamera({x: mX, y: mY}, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const target = new THREE.Vector3();
            raycast.ray.intersectPlane(plane, target); if (target) orbitTarget.copy(target);
        };
        window.addEventListener('resize', onResize); window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('wheel', onWheel); window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('dblclick', onDblClick);
        return () => { window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('wheel', onWheel); window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('dblclick', onDblClick); cancelAnimationFrame(animationId); renderer.dispose(); };
    };
    init();
  }, [bodies]); 

  useEffect(() => { if (sceneRef.current.galaxyMesh) sceneRef.current.galaxyMesh.visible = showGalaxy; }, [showGalaxy]);
  useEffect(() => { if (sceneRef.current.oortMesh) sceneRef.current.oortMesh.visible = showOort; }, [showOort]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', fontFamily: 'monospace', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', display: 'block', cursor: focusId ? 'default' : 'crosshair' }} />
      
      {conLabels.map((l, i) => l.visible && (
        <div key={i} style={{ position: 'absolute', left: l.x, top: l.y, color: '#00ffff', fontSize: '11px', fontWeight: 'bold', pointerEvents: 'none', transform: 'translate(-50%, -50%)', opacity: 0.6, textShadow: '0 0 10px #000' }}>
          [{l.name}]
        </div>
      ))}

      <div style={{ position: 'absolute', bottom: '10px', left: '10px', pointerEvents: 'none', opacity: 0.5, fontSize: '10px', color: '#00ffff', zIndex: 9999, border: '1px solid rgba(0,255,255,0.2)', padding: '2px 5px' }}>BTB_ARCHITECT</div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              EARTH YEAR: {simYear}
              <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>SECTOR: SOL // OBJECTS: {bodies.length}</div>
          </div>
          <div style={{ position: 'absolute', top: '20px', right: '20px', pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={() => setTourMode(!tourMode)} style={{ background: tourMode ? '#00ffff' : '#333', color: tourMode ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>TOUR</button>
              <button onClick={() => setShowGalaxy(!showGalaxy)} style={{ background: showGalaxy ? '#ff00ff' : '#333', color: '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>GALAXY</button>
              <button onClick={() => setShowOort(!showOort)} style={{ background: showOort ? '#99ccff' : '#333', color: showOort ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>OORT</button>
              <button onClick={() => setUiOpen(!uiOpen)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '10px 20px', cursor: 'pointer' }}>{uiOpen ? 'CLOSE' : 'OPEN'}</button>
          </div>
          {focusId && !tourMode && (
              <button onClick={() => setFocusId(null)} style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', background: 'rgba(0,255,255,0.2)', border: '1px solid #00ffff', color: '#00ffff', padding: '10px 30px', fontWeight: 'bold', cursor: 'pointer' }}>EXIT PLANET LOCK</button>
          )}
          {selectedBody && (
              <div style={{ position: 'absolute', top: '50%', left: '40px', width: '280px', transform: 'translateY(-50%)', background: 'rgba(10, 15, 30, 0.95)', borderRadius: '12px', border: `1px solid ${selectedBody.color}`, boxShadow: `0 0 50px ${selectedBody.color}66`, padding: '20px', color: 'white', pointerEvents: 'auto', zIndex: 20 }}>
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
                  <ul style={{ paddingLeft: '15px', margin: '0 0 15px 0', fontSize: '0.8rem', lineHeight: '1.4', color: '#ddd' }}>
                    {selectedBody.facts ? selectedBody.facts.map((fact, i) => <li key={i}>{fact}</li>) : <li>No data</li>}
                  </ul>
                  {selectedBody.trivia && (
                    <div style={{ background: `linear-gradient(45deg, ${selectedBody.color}22, transparent)`, padding: '12px', borderLeft: `3px solid ${selectedBody.color}`, fontSize: '0.8rem', fontStyle: 'italic', color: '#ccc' }}>
                      " {selectedBody.trivia} "
                    </div>
                  )}
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => setFocusId(selectedBody.id)} style={{ flex: 1, padding: '8px', background: selectedBody.color, border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}>RIDE ALONG</button>
                  </div>
              </div>
          )}
          {uiOpen && (
              <div style={{ position: 'absolute', top: '70px', right: '20px', width: '380px', background: 'rgba(10, 10, 20, 0.95)', border: '1px solid #333', padding: '20px', pointerEvents: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
                  <label style={{ color: '#aaa' }}>TIME WARP: {timeSpeed}x</label>
                  <input type="range" min="0" max="100" step="1" value={timeSpeed} onChange={e => setTimeSpeed(parseFloat(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} />
                  {bodies.map(b => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px' }}>
                          <span style={{ color: '#fff' }}>{b.name}</span>
                          <button onClick={() => setFocusId(b.id)} style={{ background: focusId === b.id ? '#00ffff' : '#333', cursor: 'pointer' }}>VIEW</button>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}