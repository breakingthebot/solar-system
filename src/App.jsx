import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'; // FIX: Direct Import

// ═══════════════════════════════════════════════════════════════════════════
// 📊 DATA CONFIGURATION BLOCK - **START HERE FOR MOST EDITS**
// ═══════════════════════════════════════════════════════════════════════════
// This array defines ALL celestial bodies in your simulation.
// EDIT THIS to add/remove/modify planets, moons, ships, etc.
//
// PARAMETERS EXPLAINED:
// - id: Unique number (used for parent-child relationships, focus targeting)
// - name: Display name (shows in UI and info panel)
// - r: Radius/size of the object in units (1 = small moon, 6 = Sun)
// - dist: Orbital distance from center (or parent) in abstract units
// - period: Orbital period in Earth years (1.0 = 1 year, 0.5 = 6 months)
// - color: Hex color string (e.g., "#ff6600" for orange)
// - type: Visual style - 'ROCKY', 'GAS', 'BLACK_HOLE', 'COMET', 'STATION', 'SHIP'
// - parentId: null for Sun-orbiting, or ID number to orbit another body
// - isStatic: true = doesn't orbit (like Sagittarius A*)
// - eccentricity: 0-1, how elliptical the orbit is (0 = circle, 0.967 = very stretched)
// - Optional flags: clouds, atmosphere, ring, redSpot
// - discovery: Year discovered (just for info display)
// - facts: Array of strings for info panel
// - trivia: Fun fact string
//
// 🎯 QUICK EDITS:
// - Change Halley's Comet orbit? Edit id:12's dist/period/eccentricity below
// - Add a new planet? Copy any object, change id/name/dist/period/color
// - Make something orbit Mars? Set parentId: 4 (Mars's id)
// - Change Sun size? Edit id:0's r value (but keep it much larger than planets)
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_BODIES = [
  // ⚫ SAGITTARIUS A* - Central black hole
  // EDIT: Change 'dist' to reposition it, 'r' for size, 'color' for accretion disk hue
  // WARNING: isStatic:true means it won't orbit. Remove this to make it move!
  { id: 0, name: "Sagittarius A*", r: 500, dist: 12000, period: 1, color: "#ff6600", type: 'BLACK_HOLE', isStatic: true, discovery: "1974", facts: ["Supermassive black hole", "Center of Milky Way", "4 million solar masses"], trivia: "Gravity is so strong even light cannot escape." },
  
  // 🪨 ROCKY PLANETS
  // EDIT: Change 'dist' to move orbit closer/farther, 'period' for speed
  { id: 1, name: "Mercury", r: 0.8, dist: 10, period: 0.24, color: "#aaaaaa", type: 'ROCKY', parentId: null, discovery: "Known by Ancients", facts: ["Smallest planet"], trivia: "Mercury has a tail!" },
  
  // EDIT: 'type' determines texture generation (ROCKY = cratered, GAS = banded)
  { id: 2, name: "Venus", r: 1.2, dist: 15, period: 0.61, color: "#eebb88", type: 'GAS', parentId: null, discovery: "Known by Ancients", facts: ["Hottest planet"], trivia: "Spins backwards." },
  
  // EDIT: 'clouds:true' adds a transparent cloud layer, 'atmosphere:true' adds glow
  { id: 3, name: "Earth", r: 1.3, dist: 22, period: 1.0,  color: "#2233ff", type: 'ROCKY', parentId: null, clouds: true, atmosphere: true, discovery: "N/A", facts: ["Supports Life"], trivia: "Only planet not named after a god." },
  
  { id: 4, name: "Mars", r: 1.0, dist: 30, period: 1.88, color: "#cc4422", type: 'ROCKY', parentId: null, atmosphere: true, discovery: "Known by Ancients", facts: ["Tallest volcano"], trivia: "Sunsets are blue." },
  
  // 🌪️ GAS GIANTS
  // EDIT: 'redSpot:true' draws Jupiter's storm. Remove it or add to other gas giants!
  { id: 5, name: "Jupiter", r: 3.5, dist: 50, period: 11.86, color: "#a3581bff", type: 'GAS', parentId: null, redSpot: true, discovery: "Known by Ancients", facts: ["Gas Giant"], trivia: "Protects Earth from asteroids." },
  
  // EDIT: 'ring:true' adds a ring system. Try adding to other planets!
  { id: 6, name: "Saturn", r: 3.0, dist: 68, period: 29.45, color: "#b48134ff", type: 'GAS', parentId: null, ring: true, discovery: "Known by Ancients", facts: ["Ring System"], trivia: "Would float in a bathtub." },
  
  { id: 7, name: "Uranus", r: 2.2, dist: 85, period: 84.0, color: "#4fd0e7", type: 'GAS', parentId: null, ring: true, discovery: "1781", facts: ["Ice Giant"], trivia: "Spins on its side." },
  
  { id: 8, name: "Neptune", r: 2.1, dist: 100, period: 164.8, color: "#2d44bc", type: 'GAS', parentId: null, discovery: "1846", facts: ["High Winds"], trivia: "One orbit since discovery." },
  
  { id: 9, name: "Pluto", r: 0.6, dist: 115, period: 248.0, color: "#ddccaa", type: 'ROCKY', parentId: null, discovery: "1930", facts: ["Dwarf Planet"], trivia: "Hasn't finished an orbit." },
  
  // 🌙 MOONS (have parentId set to orbit planets)
  // EDIT: 'parentId:3' makes Luna orbit Earth. Change to 4 to orbit Mars instead!
  // EDIT: 'dist' for moons is distance from PARENT, not Sun
  { id: 10, name: "Luna", r: 0.4, dist: 3, period: 0.07, color: "#ffffff", type: 'ROCKY', parentId: 3, discovery: "N/A", facts: ["Tidally Locked"], trivia: "Drifting away." },
  
  { id: 11, name: "Titan", r: 0.7, dist: 5, period: 0.04, color: "#267988ff", type: 'ROCKY', parentId: 6, atmosphere: true, discovery: "1655", facts: ["Thick Atmosphere"], trivia: "Liquid methane lakes." },
  
  // ☄️ COMET - Uses eccentric elliptical orbit
  // EDIT: 'eccentricity:0.967' = very stretched orbit (0=circle, 1=parabola)
  // EDIT: Increase 'dist' for wider orbit, decrease 'period' for faster
  // NOTE: Comets auto-orient their tail away from Sun - see animation code
  { id: 12, name: "Halley's Comet", r: 0.4, dist: 50.8, period: 75.3, color: "#ffffff", type: 'COMET', parentId: null, eccentricity: 0.850, discovery: "1758", facts: ["Visible every 75-76 yrs", "Highly eccentric orbit"], trivia: "Next perihelion: July 2061." },
  
  // 🛰️ SPACE STATION (orbits Earth very closely)
  { id: 13, name: "I.S.S.", r: 0.15, dist: 2.5, period: 0.02, color: "#ffffff", type: 'STATION', parentId: 3, discovery: "1998", facts: ["Multinational Lab"], trivia: "Circles Earth every 90 mins." },
  
  // 🚀 SPACESHIP (slightly elliptical orbit between Earth & Mars)
  { id: 14, name: "Mars Transfer", r: 0.3, dist: 26, period: 1.4, color: "#00ffff", type: 'SHIP', parentId: null, eccentricity: 0.15, discovery: "2030", facts: ["Human Crew"], trivia: "Nuclear Thermal Drive." }
];

// ═══════════════════════════════════════════════════════════════════════════
// ⭐ CONSTELLATION DATA - Background star patterns
// ═══════════════════════════════════════════════════════════════════════════
// EDIT: Add new constellations by copying format below
// 'stars' = array of [x, y, z] coordinates in 3D space (far from center)
// 'center' = average position for label placement
// 'color' = line color connecting stars
// TIP: Keep coordinates in range ±6000 to avoid clipping
// ═══════════════════════════════════════════════════════════════════════════

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
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎮 REACT STATE - Controls UI and simulation behavior
  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT: Change initial values to affect starting state
  // - bodies: Current array of celestial objects (starts from INITIAL_BODIES)
  // - timeSpeed: Simulation speed multiplier (1 = real-time, 1000 = fast-forward)
  // - focusId: Which body camera is locked to (null = free camera)
  // - selectedBody: Which body's info panel is showing
  // - tourMode: Auto-cycle through bodies every 8 seconds
  // ═══════════════════════════════════════════════════════════════════════════
  
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
  const [showOort, setShowOort] = useState(true);
  const [conLabels, setConLabels] = useState([]);

  const [newBody, setNewBody] = useState({ name: '', r: 0.5, dist: 5, period: 1.0, color: '#ff00ff', type: 'ROCKY', parentId: "" });

  // Refs keep values accessible in animation loop without triggering re-renders
  const speedRef = useRef(1);
  const focusRef = useRef(null);
  const yearRef = useRef(2025);
  const sceneRef = useRef({ planets: [], sunUniforms: { time: { value: 0 } }, sunMesh: null, galaxyMesh: null, oortMesh: null }); 

  useEffect(() => { speedRef.current = timeSpeed; }, [timeSpeed]);
  useEffect(() => { focusRef.current = focusId; }, [focusId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎬 TOUR MODE - Auto-cycle camera through bodies
  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT: Change 8000 to adjust seconds between camera switches (8000 = 8 sec)
  // ═══════════════════════════════════════════════════════════════════════════
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


  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 TEXTURE GENERATION HELPER - Creates procedural planet surfaces
  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT: Modify noise patterns, colors, or add new effects in switch cases
  // - Canvas size (512x256 default) affects quality vs performance
  // - 'ROCKY' adds craters via random dark circles
  // - 'GAS' creates atmospheric bands with sin wave noise
  // - 'redSpot' option draws Jupiter's storm (try adding to other gas giants!)
  // WARNING: Changing canvas dimensions affects all planets simultaneously
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let renderer, scene, camera, sun, starField, asteroids, voyagerProbe;
    let animationId;
    let camRadius = 140, camTheta = 0.5, camPhi = 0.5;
    const mouse = { x: 0, y: 0, down: false };
    let orbitTarget;

    const createTexture = (type, colorHex, options = {}) => {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 256;
        const ctx = c.getContext('2d');
        const hex = colorHex || "#000000";
        const color = hex.replace('#','');
        const r = parseInt(color.substring(0,2), 16);
        const g = parseInt(color.substring(2,4), 16);
        const b = parseInt(color.substring(4,6), 16);

        // GALAXY BACKGROUND TEXTURE
        // EDIT: Change gradient colors or star density (3000 = star count)
        if (type === 'GALAXY') {
            c.width = 1024; c.height = 1024;
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, 1024, 1024);
            const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
            grad.addColorStop(0, 'rgba(60, 40, 110, 0.5)'); // EDIT: Purple core color
            grad.addColorStop(0.4, 'rgba(20, 10, 40, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1024, 1024);
            for(let i=0; i<3000; i++) { // EDIT: Change 3000 for more/fewer stars
                ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
                ctx.fillRect(Math.random()*1024, Math.random()*1024, 1.5, 1.5);
            }
            return new THREE.CanvasTexture(c);
        }

        // CLOUD LAYER TEXTURE
        // EDIT: Change 300 for cloud density, adjust ellipse size for puffiness
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

        // BASE COLOR FILL
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0,0,512,256);

        // ROCKY/CRATERED TEXTURE
        // EDIT: Change 5000 for terrain noise density, 30 for number of craters
        if (type === 'ROCKY' || type === 'COMET' || type === 'BLACK_HOLE') {
            for(let i=0; i<10000; i++) {
                const shade = (Math.random() - 0.5) * 50; // EDIT: Change 50 for color variation
                ctx.fillStyle = `rgba(${r+shade},${g+shade},${b+shade}, 0.5)`;
                ctx.fillRect(Math.random()*512, Math.random()*256, 4, 4);
            }
            for(let i=0; i<30; i++) { // EDIT: Number of impact craters
                ctx.fillStyle = `rgba(0,0,0,0.3)`;
                const s = Math.random()*8 + 2; // EDIT: Crater size range
                ctx.beginPath(); ctx.arc(Math.random()*512,Math.random()*256,s,0,Math.PI*2); ctx.fill();
            }
        } 
        
        // GAS GIANT TEXTURE WITH ATMOSPHERIC BANDS
        // EDIT: Change 0.2 in sin() for band frequency, noise value for turbulence
        else if (type === 'GAS') {
            for(let i=0; i<256; i++) {
                const noise = Math.sin(i * 0.2) * 20; // EDIT: Band wave pattern
                ctx.fillStyle = `rgba(${r+noise},${g+noise},${b+noise}, 1)`;
                ctx.fillRect(0, i, 512, 1);
            }
            
            // JUPITER'S RED SPOT RENDERING
            // EDIT: Change spotX/spotY to reposition, ellipse sizes for storm size
            if (options.redSpot) {
                const sr = 180, sg = 60, sb = 50; // EDIT: Storm color RGB
                const spotX = 350, spotY = 130; // EDIT: Storm position on texture
                
                // Shadow/depth
                ctx.fillStyle = `rgba(0,0,0,0.3)`;
                ctx.beginPath(); ctx.ellipse(spotX, spotY, 40, 22, 0, 0, Math.PI*2); ctx.fill();

                // Main storm body
                const grad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 40);
                grad.addColorStop(0, `rgb(${sr+40}, ${sg+20}, ${sb})`);
                grad.addColorStop(1, `rgb(${sr}, ${sg}, ${sb})`);
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.ellipse(spotX, spotY, 40, 22, 0, 0, Math.PI*2); ctx.fill();

                // Inner eye highlight
                ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(spotX, spotY, 20, 10, 0.2, 0, Math.PI*2); ctx.stroke();
            }
        }
        return new THREE.CanvasTexture(c);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎬 SCENE INITIALIZATION - Sets up Three.js renderer, camera, lighting
    // ═══════════════════════════════════════════════════════════════════════════
    // EDIT: Adjust lighting, fog, background colors here
    // WARNING: Don't modify core setup unless you know Three.js fundamentals
    // ═══════════════════════════════════════════════════════════════════════════
    const init = () => {
        if (!mountRef.current) return;

        // Cleanup previous scene
        while (mountRef.current.firstChild) mountRef.current.removeChild(mountRef.current.firstChild);

        orbitTarget = new THREE.Vector3(0, 0, 0);

        // RENDERER SETUP
        // EDIT: Change antialias:false for better performance on weak GPUs
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.outputColorSpace = THREE.SRGBColorSpace; 
        mountRef.current.appendChild(renderer.domElement);

        // SCENE SETUP
        // EDIT: Change background color (0x020205 = dark blue-black)
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020205); 
        scene.fog = new THREE.FogExp2(0x020205, 0.00006); // EDIT: Fog density (higher = thicker)

        // CAMERA SETUP
        // EDIT: First number (45) = FOV, last number (25000) = far clipping plane
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 25000);
        camera.position.set(0, 100, 200);

        // ═════════════════════════════════════════════════════════════════════
        // 🌌 GALAXY SPHERE BACKGROUND
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: Change 15000 for galaxy size, opacity for visibility
        // This wraps the entire scene in a starry background sphere
        // ═════════════════════════════════════════════════════════════════════
        const galGeo = new THREE.SphereGeometry(15000, 64, 64);
        const galMat = new THREE.MeshBasicMaterial({ map: createTexture('GALAXY'), side: THREE.BackSide, transparent: true, opacity: 0.9 });
        const galMesh = new THREE.Mesh(galGeo, galMat);
        scene.add(galMesh);
        sceneRef.current.galaxyMesh = galMesh;

        // ═════════════════════════════════════════════════════════════════════
        // ☄️ OORT CLOUD - Distant icy debris field
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: Change 15000 for particle count, r range (6000-8000) for shell size
        // EDIT: color: 0x99ccff for blue ice, change to 0xffccaa for orange dust
        // ═════════════════════════════════════════════════════════════════════
        const oortGeo = new THREE.BufferGeometry();
        const oortCount = 15000; // EDIT: Particle count (affects performance!)
        const oortPos = new Float32Array(oortCount * 3);
        for(let i=0; i<oortCount; i++) {
            const u = Math.random(); const v = Math.random();
            const theta = 2 * Math.PI * u; const phi = Math.acos(2 * v - 1);
            const r = 6000 + (Math.random() * 2000); // EDIT: Shell radius range
            oortPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
            oortPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            oortPos[i*3+2] = r * Math.cos(phi);
        }
        oortGeo.setAttribute('position', new THREE.BufferAttribute(oortPos, 3));
        const oortMesh = new THREE.Points(oortGeo, new THREE.PointsMaterial({ size: 1.5, color: 0x99ccff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
        scene.add(oortMesh);
        sceneRef.current.oortMesh = oortMesh;

        // ═════════════════════════════════════════════════════════════════════
        // ⭐ CONSTELLATION LINES & STARS
        // ═════════════════════════════════════════════════════════════════════
        // Uses CONSTELLATIONS array defined at top
        // EDIT: Change line opacity (0.2), star size (15), or colors in data above
        // ═════════════════════════════════════════════════════════════════════
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

        // ═════════════════════════════════════════════════════════════════════
        // ☀️ SUN - Central star with animated shader
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: Change SphereGeometry(6...) first number for Sun size
        // EDIT: Shader colors in fragmentShader: dark/bright RGB values
        // WARNING: Don't edit shader unless familiar with GLSL
        // ═════════════════════════════════════════════════════════════════════
        const sunGeo = new THREE.SphereGeometry(6, 64, 64); // EDIT: 6 = Sun radius
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
                vec3 dark = vec3(0.8, 0.1, 0.0); // EDIT: Dark spot color
                vec3 bright = vec3(1.0, 0.8, 0.2); // EDIT: Bright plasma color
                float intensity = noiseVal * 0.6 + noiseVal2 * 0.4;
                intensity = intensity * 0.5 + 0.5;
                vec3 finalColor = mix(dark, bright, intensity);
                float viewDotNormal = dot(normalize(cameraPosition - vPosition), normalize(vPosition));
                float rim = 1.0 - max(0.0, viewDotNormal);
                rim = pow(rim, 3.0);
                finalColor += vec3(0.5, 0.2, 0.0) * rim; // EDIT: Rim glow color
                gl_FragColor = vec4(finalColor, 1.0);
              }
            `
        });
        sun = new THREE.Mesh(sunGeo, sunMat);
        sceneRef.current.sunMesh = sun; 
        
        // SUN GLOW SPRITE
        // EDIT: scale.set(40,40,1) controls glow size, color: 0xffaa00 is glow hue
        const spriteMat = new THREE.SpriteMaterial({ 
            map: new THREE.CanvasTexture((() => {
                const c=document.createElement('canvas'); c.width=128; c.height=128;
                const x=c.getContext('2d');
                const g=x.createRadialGradient(64,64,10,64,64,60);
                g.addColorStop(0,'rgba(255,200,50,1)'); // EDIT: Inner glow color
                g.addColorStop(0.4,'rgba(255,100,0,0.5)'); // EDIT: Mid glow
                g.addColorStop(1,'rgba(0,0,0,0)');
                x.fillStyle=g; x.fillRect(0,0,128,128);
                return c;
            })()), blending: THREE.AdditiveBlending, color: 0xffaa00 
        });
        const sunGlow = new THREE.Sprite(spriteMat);
        sunGlow.scale.set(40, 40, 1); // EDIT: Glow sphere size
        sun.add(sunGlow);

        // SUN POINT LIGHT (illuminates planets)
        // EDIT: (0xffffff, 3000, 600) = color, intensity, range
        const pLight = new THREE.PointLight(0xffffff, 3000, 600);
        pLight.castShadow = true;
        pLight.shadow.mapSize.width = 2048; pLight.shadow.mapSize.height = 2048;
        sun.add(pLight);
        scene.add(sun);
        
        // AMBIENT LIGHT (prevents total darkness on far side)
        // EDIT: 0x404040 = color, 3.0 = intensity
        const ambientLight = new THREE.AmbientLight(0x404040, 3.0); 
        scene.add(ambientLight);

        // ═════════════════════════════════════════════════════════════════════
        // ✨ STARFIELD - Random background stars
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: Change 5000 for star count, 1500 for field size
        // EDIT: colOpts array for star color palette
        // ═════════════════════════════════════════════════════════════════════
        const starsGeo = new THREE.BufferGeometry();
        const sCount = 5000; // EDIT: Number of stars
        const sPos = new Float32Array(sCount * 3);
        const sColors = new Float32Array(sCount * 3);
        const colOpts = [new THREE.Color(0xffffff), new THREE.Color(0xaaccff), new THREE.Color(0xffccaa)]; // EDIT: Star colors
        for(let i=0; i<sCount; i++) {
            sPos[i*3] = (Math.random()-0.5)*1500; sPos[i*3+1] = (Math.random()-0.5)*1500; sPos[i*3+2] = (Math.random()-0.5)*1500; // EDIT: 1500 = star field size
            const c = colOpts[Math.floor(Math.random()*colOpts.length)];
            sColors[i*3] = c.r; sColors[i*3+1] = c.g; sColors[i*3+2] = c.b;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(sColors, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.9 }); // EDIT: size/opacity
        starField = new THREE.Points(starsGeo, starsMat);
        scene.add(starField);

        // ═════════════════════════════════════════════════════════════════════
        // 🪐 PLANET/BODY GENERATION LOOP - Creates all objects from INITIAL_BODIES
        // ═════════════════════════════════════════════════════════════════════
        // This loop reads your INITIAL_BODIES array and creates 3D meshes
        // EDIT: Modify INITIAL_BODIES at top instead of here
        // ADVANCED: Add new 'type' cases if you want custom geometry
        // ═════════════════════════════════════════════════════════════════════
        const newPlanets = [];
        bodies.forEach(data => {
            let geo, mat, mesh;
            
            // 🛰️ SPACE STATION GEOMETRY
            if (data.type === 'STATION') {
                mesh = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshStandardMaterial({color:'#aaa'}));
                body.rotation.z = Math.PI/2; mesh.add(body);
                const panels = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.4), new THREE.MeshStandardMaterial({color:'#112244'}));
                mesh.add(panels);
            }
            
            // 🚀 SPACESHIP GEOMETRY
            else if (data.type === 'SHIP') {
                mesh = new THREE.Group();
                const hull = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), new THREE.MeshStandardMaterial({color:'#555'}));
                hull.rotation.x = Math.PI/2; mesh.add(hull);
                const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0, 0.4), new THREE.MeshBasicMaterial({color:'#00ffff'}));
                eng.position.z = 0.4; eng.rotation.x = Math.PI/2; mesh.add(eng);
                const light = new THREE.PointLight(0x00ffff, 50, 5); light.position.z = 0.5; mesh.add(light);
            }
            
            // ☄️ COMET GEOMETRY WITH TAIL
            // EDIT: Tail length = data.r * 12 (multiply 12 for longer tail)
            // EDIT: Tail color: 0xaaccff (blue), change to 0xffffaa for yellow
            else if (data.type === 'COMET') {
                geo = new THREE.IcosahedronGeometry(data.r, 0);
                const tex = createTexture(data.type, data.color);
                mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
                mesh = new THREE.Mesh(geo, mat);
                
                // Tail geometry - cone pointing backward
                const tailGeo = new THREE.ConeGeometry(data.r * 0.7, data.r * 12, 16, 1, true); // EDIT: *12 = tail length multiplier
                tailGeo.translate(0, - (data.r * 6), 0); 
                tailGeo.rotateX(Math.PI / 2); 
                
                const tailMat = new THREE.MeshBasicMaterial({ 
                    color: 0xaaccff, // EDIT: Tail color
                    transparent: true, 
                    opacity: 0.5, // EDIT: Tail transparency
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending 
                });
                const tail = new THREE.Mesh(tailGeo, tailMat);
                mesh.add(tail);
            
            } 
            
            // ⚫ BLACK HOLE GEOMETRY (singularity + accretion disk)
            // EDIT: Disk radius range: r * 0.5 to r * 2.5, change multipliers for size
            else if (data.type === 'BLACK_HOLE') {
                mesh = new THREE.Group();
                const singularity = new THREE.Mesh(new THREE.SphereGeometry(data.r * 0.4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
                mesh.add(singularity);
                const diskGeo = new THREE.RingGeometry(data.r * 0.5, data.r * 2.5, 128); // EDIT: Inner/outer ring radius
                const diskMat = new THREE.MeshBasicMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
                const accretion = new THREE.Mesh(diskGeo, diskMat);
                accretion.rotation.x = Math.PI / 2.2; // EDIT: Disk tilt angle
                mesh.add(accretion);
                mesh.position.set(0, 0, data.dist);
            } 
            
            // 🪐 DEFAULT PLANET GEOMETRY (Sphere with texture)
            else {
                geo = new THREE.SphereGeometry(data.r, 64, 64); // EDIT: 64,64 = quality (lower for performance)
                const tex = createTexture(data.type, data.color, { redSpot: data.redSpot });
                mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.1 });
                mesh = new THREE.Mesh(geo, mat);
            }
            mesh.userData = { id: data.id };

            // ☁️ CLOUD LAYER (if body has clouds:true)
            if (data.clouds) {
                const cGeo = new THREE.SphereGeometry(data.r * 1.02, 64, 64); // EDIT: 1.02 = how far above surface
                const cTex = createTexture('CLOUDS', '#ffffff');
                const cMat = new THREE.MeshStandardMaterial({ map: cTex, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
                mesh.add(new THREE.Mesh(cGeo, cMat));
            }
            
            // 🌫️ ATMOSPHERE GLOW (if body has atmosphere:true)
            if (data.atmosphere) {
                const aGeo = new THREE.SphereGeometry(data.r * 1.15, 32, 32); // EDIT: 1.15 = atmosphere height
                const aMat = new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.2, side: THREE.BackSide, blending: THREE.AdditiveBlending });
                mesh.add(new THREE.Mesh(aGeo, aMat));
            }
            
            // 💍 RING SYSTEM (if body has ring:true)
            // EDIT: data.r + 0.5 to data.r + 2.5 = inner/outer ring radius
            if (data.ring) {
                const ringGeo = new THREE.RingGeometry(data.r + 0.5, data.r + 2.5, 64);
                const ringMat = new THREE.MeshStandardMaterial({ color: data.color, side: THREE.DoubleSide, transparent: true, opacity: 0.6, roughness: 0.8 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2; ring.receiveShadow = true; mesh.add(ring);
            }

            mesh.castShadow = true; mesh.receiveShadow = true;
            scene.add(mesh);

            // ═══════════════════════════════════════════════════════════════
            // 🔵 ORBIT LINE RENDERING
            // ═══════════════════════════════════════════════════════════════
            // Creates visible orbit path around Sun
            // EDIT: Opacity 0.3 for visibility, color 0xffffff for white
            // ═══════════════════════════════════════════════════════════════
            let orbitMesh;
            if (data.eccentricity) {
                // Elliptical orbit (for comets/eccentric paths)
                const curve = new THREE.EllipseCurve(0, 0, data.dist + (data.dist * data.eccentricity), data.dist * (1 - data.eccentricity), 0, 2 * Math.PI, false, 0);
                const pts = curve.getPoints(100);
                const orbGeo = new THREE.BufferGeometry().setFromPoints(pts);
                const orbMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }); 
                orbitMesh = new THREE.Line(orbGeo, orbMat);
                orbitMesh.rotation.x = Math.PI / 2;
                orbitMesh.position.x = data.dist * data.eccentricity;
            } else {
                // Circular orbit (most planets)
                const orbitGeo = new THREE.RingGeometry(data.dist - 0.05, data.dist + 0.05, 128);
                const orbitMat = new THREE.MeshBasicMaterial({ color: 0x666666, side: THREE.DoubleSide });
                orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
                orbitMesh.rotation.x = Math.PI / 2;
            }
            scene.add(orbitMesh);

            // ═══════════════════════════════════════════════════════════════
            // 🌟 MOTION TRAIL (ghosted path behind body)
            // ═══════════════════════════════════════════════════════════════
            // EDIT: 50 * 3 = trail length (increase for longer trails)
            // EDIT: opacity: 0.5 for visibility
            // ═══════════════════════════════════════════════════════════════
            const trailGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(50 * 3); // EDIT: Trail segment count
            trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const trailMat = new THREE.LineBasicMaterial({ color: data.color, transparent: true, opacity: 0.5 });
            const trailMesh = new THREE.Line(trailGeo, trailMat);
            scene.add(trailMesh);

            newPlanets.push({ mesh, orbitMesh, trailMesh, data, angle: Math.random() * Math.PI * 2 });
        });
        sceneRef.current.planets = newPlanets;

        // ═════════════════════════════════════════════════════════════════════
        // 🌑 ASTEROID BELT - Instanced mesh for performance
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: astCount = 2000 (asteroid quantity, higher = more dense)
        // EDIT: dist range 40-46 = belt inner/outer radius
        // EDIT: y range (Math.random()-0.5)*3 = belt thickness
        // ═════════════════════════════════════════════════════════════════════
        let asteroidDummy = new THREE.Object3D();
        const astCount = 2000; // EDIT: Number of asteroids
        const astGeo = new THREE.DodecahedronGeometry(0.2, 0); 
        const astMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.1 });
        asteroids = new THREE.InstancedMesh(astGeo, astMat, astCount);
        asteroids.instanceMatrix.setUsage(THREE.DynamicDrawUsage); 
        scene.add(asteroids);
        for(let i=0; i<astCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 6; // EDIT: Belt radius range (40-46 units)
            const x = Math.cos(angle) * dist; const z = Math.sin(angle) * dist; const y = (Math.random()-0.5)*3; // EDIT: *3 = belt height
            asteroidDummy.position.set(x, y, z);
            asteroidDummy.updateMatrix();
            asteroids.setMatrixAt(i, asteroidDummy.matrix);
        }

        // 🛰️ VOYAGER PROBE (static deep space object)
        // EDIT: position.set(130,5,0) = location in space
        voyagerProbe = new THREE.Group();
        voyagerProbe.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshBasicMaterial({color: 0x999999})));
        voyagerProbe.position.set(130, 5, 0); // EDIT: Probe position
        scene.add(voyagerProbe);

        // 🟢 HABITABLE ZONE VISUALIZATION (hidden by default)
        // EDIT: RingGeometry(18, 28...) = inner/outer radius of "Goldilocks zone"
        const hzMesh = new THREE.Mesh(new THREE.RingGeometry(18, 28, 64), new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
        hzMesh.rotation.x = Math.PI / 2; hzMesh.visible = false;
        sceneRef.current.habitableZone = hzMesh; scene.add(hzMesh);

        // ═════════════════════════════════════════════════════════════════════
        // 🎬 ANIMATION LOOP - Runs every frame to update positions
        // ═════════════════════════════════════════════════════════════════════
        // This is where orbital mechanics happen
        // EDIT: BASE_ORBITAL_SPEED changes overall simulation speed
        // WARNING: Don't edit loop structure unless very comfortable with Three.js
        // ═════════════════════════════════════════════════════════════════════
        const raycast = new THREE.Raycaster();
        const mVec = new THREE.Vector2();
        const BASE_ORBITAL_SPEED = (Math.PI * 2) / (24 * 60 * 60); // EDIT: Base speed constant

        const animate = () => {
            const dt = speedRef.current; // Current time speed multiplier
            const targetId = focusRef.current; 

            // Rotate Sun
            if (sceneRef.current.sunMesh) sceneRef.current.sunMesh.rotation.y -= 0.002 * dt;
            
            // Rotate galaxy background slowly
            if (sceneRef.current.galaxyMesh) sceneRef.current.galaxyMesh.rotation.y += 0.00004 * dt;
            
            // Update shader time for Sun animation
            sceneRef.current.sunUniforms.time.value += 0.01;


            // ═════════════════════════════════════════════════════════════════
            // 🪐 PRIMARY ORBITAL MECHANICS - SUN-ORBITING BODIES
            // ═════════════════════════════════════════════════════════════════
            // This loop updates position of every body each frame
            // EDIT: Change (BASE_ORBITAL_SPEED / p.data.period) for global speed
            // IMPORTANT: Halley's Comet orbit modified here with eccentricity
            // ═════════════════════════════════════════════════════════════════
            sceneRef.current.planets.forEach(p => {
                if (p.data.isStatic) return; // Skip Sagittarius A* (doesn't move)

                // ☄️ COMET TAIL ORIENTATION FIX
                // Forces comet to always point tail away from Sun
                // EDIT: Remove this if block to let comets spin like planets
                if (p.data.type === 'COMET') {
                    p.mesh.lookAt(0, 0, 0); // Always face Sun (0,0,0)
                } else {
                    p.mesh.rotation.y += 0.01 / p.data.r; // Spin rate (smaller planets spin faster)
                }

                // Calculate orbital step based on period
                const step = (BASE_ORBITAL_SPEED / p.data.period) * dt;
                
                // Only update Sun-orbiting bodies (not moons)
                if (!p.data.parentId) {
                    p.angle += step; // Advance angle around orbit
                    
                    let x = Math.cos(p.angle) * p.data.dist;
                    let z = Math.sin(p.angle) * p.data.dist;
                    
                    // ☄️ ELLIPTICAL ORBIT MATH (for comets)
                    // EDIT: 'buffer' value (12) prevents comet from hitting Sun
                    // Eccentricity stretches orbit: 0 = circle, 0.967 = very elongated
                    if (p.data.eccentricity) {
                        x = Math.cos(p.angle) * p.data.dist;
                        z = Math.sin(p.angle) * p.data.dist * (1 - p.data.eccentricity);
                        
                        // BUFFER FIX: Pushes perihelion (closest point) away from Sun
                        const buffer = p.data.type === 'COMET' ? 12 : 0; // EDIT: Increase to push farther
                        x += (p.data.dist * p.data.eccentricity) + buffer;
                    }
                    
                    p.mesh.position.set(x, 0, z);
                    
                    // Update Earth year counter based on Earth's orbit
                    if (p.data.name === "Earth") yearRef.current = 2025 + Math.floor(p.angle / (Math.PI * 2));
                }

                // ═══════════════════════════════════════════════════════════
                // 🌟 TRAIL UPDATE - Shifts old positions back, adds new front
                // ═══════════════════════════════════════════════════════════
                const pos = p.trailMesh.geometry.attributes.position.array;
                for (let i = pos.length - 3; i >= 3; i -= 3) { 
                    pos[i] = pos[i-3]; pos[i+1] = pos[i-2]; pos[i+2] = pos[i-1]; 
                }
                pos[0] = p.mesh.position.x; pos[1] = p.mesh.position.y; pos[2] = p.mesh.position.z;
                p.trailMesh.geometry.attributes.position.needsUpdate = true;
            });

            // ═════════════════════════════════════════════════════════════════
            // 🌙 MOON ORBITAL MECHANICS - Parent-relative orbits
            // ═════════════════════════════════════════════════════════════════
            // Moons orbit their parent planet instead of the Sun
            // EDIT: Same step calculation, but position relative to parent
            // ═════════════════════════════════════════════════════════════════
            sceneRef.current.planets.forEach(p => {
                if (p.data.parentId) {
                    const parent = sceneRef.current.planets.find(x => x.data.id === parseInt(p.data.parentId));
                    if (parent) {
                        p.angle += (BASE_ORBITAL_SPEED / p.data.period) * dt;
                        p.mesh.position.set(
                            parent.mesh.position.x + Math.cos(p.angle)*p.data.dist, 
                            0, 
                            parent.mesh.position.z + Math.sin(p.angle)*p.data.dist
                        );
                        p.orbitMesh.position.copy(parent.mesh.position);
                    }
                }
            });

            // ═════════════════════════════════════════════════════════════════
            // 📷 CAMERA MOVEMENT - Follow target or free orbit
            // ═════════════════════════════════════════════════════════════════
            // EDIT: 'off = 8 + targetPlanet.data.r * 2' controls follow distance
            // EDIT: 0.05 = camera smoothing (lower = slower movement)
            // ═════════════════════════════════════════════════════════════════
            let targetPlanet = sceneRef.current.planets.find(p => p.data.id === targetId);
            if (targetPlanet) {
                // Follow mode - track selected body
                const off = 8 + targetPlanet.data.r * 2; // EDIT: Distance from body
                camera.position.lerp(new THREE.Vector3(targetPlanet.mesh.position.x + off, 5, targetPlanet.mesh.position.z + off), 0.05);
                camera.lookAt(targetPlanet.mesh.position);
            } else {
                // Free orbit mode - spherical coordinates around orbitTarget
                camera.position.lerp(new THREE.Vector3(orbitTarget.x + camRadius * Math.sin(camTheta) * Math.cos(camPhi), orbitTarget.y + camRadius * Math.cos(camTheta), orbitTarget.z + camRadius * Math.sin(camTheta) * Math.sin(camPhi)), 0.05);
                camera.lookAt(orbitTarget);
            }

            // Update constellation label positions (project 3D → 2D screen)
            const nLabels = CONSTELLATIONS.map(c => {
                const v = new THREE.Vector3(...c.center);
                v.project(camera);
                return { name: c.name, x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-(v.y * 0.5 - 0.5)) * window.innerHeight, visible: v.z < 1 };
            });
            setConLabels(nLabels);

            // Rotate asteroid belt
            if (asteroids) asteroids.rotation.y += 0.0005 * dt;
            
            // Update year display every 10 frames (performance)
            if (Date.now() % 10 === 0) setSimYear(yearRef.current);
            
            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };
        animate();

        // ═════════════════════════════════════════════════════════════════════
        // 🎮 EVENT LISTENERS - Mouse/keyboard controls
        // ═════════════════════════════════════════════════════════════════════
        // EDIT: camPhi/camTheta adjust rates for camera orbit sensitivity
        // EDIT: 0.005 = mouse rotation speed multiplier
        // ═════════════════════════════════════════════════════════════════════
        
        // ═════════════════════════════════════════════════════════════════════
        // 📱 MOBILE TOUCH CONTROLS - Enables 360° rotation on phones/tablets
        // ═════════════════════════════════════════════════════════════════════
        let touchStartX = 0, touchStartY = 0;
        let lastTouchDistance = 0;
        
        const onResize = () => { 
            camera.aspect = window.innerWidth / window.innerHeight; 
            camera.updateProjectionMatrix(); 
            renderer.setSize(window.innerWidth, window.innerHeight); 
        };
        
        const onMouseMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1; 
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Left-click drag = rotate camera
            if (e.buttons === 1 && !focusRef.current) { 
                camPhi += e.movementX * 0.005; // EDIT: Horizontal sensitivity
                camTheta += e.movementY * 0.005; // EDIT: Vertical sensitivity
                camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta)); // Clamp to avoid flip
            }
            
            // Right-click drag = pan camera target
            else if (e.buttons === 2 && !focusRef.current) {
                const pan = camRadius * 0.001; // EDIT: Pan speed multiplier
                const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize();
                const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); rgt.y = 0; rgt.normalize();
                orbitTarget.addScaledVector(rgt, -e.movementX * pan); 
                orbitTarget.addScaledVector(fwd, e.movementY * pan);
            }
        };
        
        // Mouse wheel = zoom in/out
        const onWheel = (e) => { 
            if (!focusRef.current) { 
                camRadius += e.deltaY * 0.05; // EDIT: Zoom speed
                camRadius = Math.max(20, Math.min(1000, camRadius)); // EDIT: Min/max zoom distance
            } 
        };
        
        // ═════════════════════════════════════════════════════════════════════
        // 📱 TOUCH EVENT HANDLERS FOR MOBILE
        // ═════════════════════════════════════════════════════════════════════
        // Single finger drag = rotate camera 360°
        // Two finger pinch = zoom in/out
        // EDIT: Change 0.01 multiplier for rotation sensitivity
        // EDIT: Change 0.5 multiplier for pinch zoom sensitivity
        // ═════════════════════════════════════════════════════════════════════
        
        const onTouchStart = (e) => {
            if (e.touches.length === 1) {
                // Single touch - store starting position for rotation
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Two finger touch - store distance for pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        };
        
        const onTouchMove = (e) => {
            e.preventDefault(); // Prevent page scrolling
            
            if (e.touches.length === 1 && !focusRef.current) {
                // Single finger drag = rotate camera
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                
                camPhi += deltaX * 0.01; // EDIT: Horizontal sensitivity (increase for faster rotation)
                camTheta += deltaY * 0.01; // EDIT: Vertical sensitivity
                camTheta = Math.max(0.1, Math.min(Math.PI - 0.1, camTheta)); // Clamp to avoid flip
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2 && !focusRef.current) {
                // Two finger pinch = zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const delta = lastTouchDistance - distance;
                    camRadius += delta * 0.5; // EDIT: Pinch zoom speed
                    camRadius = Math.max(20, Math.min(1000, camRadius)); // Min/max zoom limits
                }
                
                lastTouchDistance = distance;
            }
        };
        
        const onTouchEnd = (e) => {
            lastTouchDistance = 0; // Reset pinch zoom tracking
        };
        
        // Click on planet = select it (show info panel)
        const onMouseDown = (e) => {
             const mX = (e.clientX / window.innerWidth) * 2 - 1; 
             const mY = -(e.clientY / window.innerHeight) * 2 + 1;
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
        
        // Double-click empty space = set camera orbit target
        const onDblClick = (e) => {
            const mX = (e.clientX / window.innerWidth) * 2 - 1; 
            const mY = -(e.clientY / window.innerHeight) * 2 + 1;
            raycast.setFromCamera({x: mX, y: mY}, camera);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
            const target = new THREE.Vector3();
            raycast.ray.intersectPlane(plane, target); 
            if (target) orbitTarget.copy(target);
        };
        
        window.addEventListener('resize', onResize); 
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('wheel', onWheel); 
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('dblclick', onDblClick);
        
        // ═════════════════════════════════════════════════════════════════════
        // 📱 ADD TOUCH EVENT LISTENERS FOR MOBILE DEVICES
        // ═════════════════════════════════════════════════════════════════════
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });
        
        return () => { 
            window.removeEventListener('resize', onResize); 
            window.removeEventListener('mousemove', onMouseMove); 
            window.removeEventListener('wheel', onWheel); 
            window.removeEventListener('mousedown', onMouseDown); 
            window.removeEventListener('dblclick', onDblClick); 
            
            // Clean up touch listeners
            renderer.domElement.removeEventListener('touchstart', onTouchStart);
            renderer.domElement.removeEventListener('touchmove', onTouchMove);
            renderer.domElement.removeEventListener('touchend', onTouchEnd);
            
            cancelAnimationFrame(animationId); 
            renderer.dispose(); 
        };
    };
    init();
  }, [bodies]); 

  // Toggle galaxy visibility
  useEffect(() => { if (sceneRef.current.galaxyMesh) sceneRef.current.galaxyMesh.visible = showGalaxy; }, [showGalaxy]);
  
  // Toggle Oort cloud visibility
  useEffect(() => { if (sceneRef.current.oortMesh) sceneRef.current.oortMesh.visible = showOort; }, [showOort]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 UI RENDERING - React JSX for interface overlays
  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT: CSS inline styles for positioning, colors, fonts
  // EDIT: Button actions call setState functions
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', fontFamily: 'monospace', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', display: 'block', cursor: focusId ? 'default' : 'crosshair' }} />
      
      {/* Constellation Labels */}
      {conLabels.map((l, i) => l.visible && (
        <div key={i} style={{ position: 'absolute', left: l.x, top: l.y, color: '#00ffff', fontSize: '11px', fontWeight: 'bold', pointerEvents: 'none', transform: 'translate(-50%, -50%)', opacity: 0.6, textShadow: '0 0 10px #000' }}>
          [{l.name}]
        </div>
      ))}

      {/* Signature Watermark */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', pointerEvents: 'none', opacity: 0.5, fontSize: '10px', color: '#00ffff', zIndex: 9999, border: '1px solid rgba(0,255,255,0.2)', padding: '2px 5px' }}>BTB_ARCHITECT</div>

      {/* Main UI Overlays */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Year & Stats Display */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', fontWeight: 'bold' }}>
              EARTH YEAR: {simYear}
              <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>SECTOR: SOL // OBJECTS: {bodies.length}</div>
          </div>
          
          {/* Top-Right Control Buttons */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', pointerEvents: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={() => setTourMode(!tourMode)} style={{ background: tourMode ? '#00ffff' : '#333', color: tourMode ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>TOUR</button>
              <button onClick={() => setShowGalaxy(!showGalaxy)} style={{ background: showGalaxy ? '#ff00ff' : '#333', color: '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>GALAXY</button>
              <button onClick={() => setShowOort(!showOort)} style={{ background: showOort ? '#99ccff' : '#333', color: showOort ? '#000' : '#fff', border: '1px solid #555', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }}>OORT</button>
              <button onClick={() => setUiOpen(!uiOpen)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '10px 20px', cursor: 'pointer' }}>{uiOpen ? 'CLOSE' : 'OPEN'}</button>
          </div>
          
          {/* Exit Focus Button (when camera locked to body) */}
          {focusId && !tourMode && (
              <button onClick={() => setFocusId(null)} style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', background: 'rgba(0,255,255,0.2)', border: '1px solid #00ffff', color: '#00ffff', padding: '10px 30px', fontWeight: 'bold', cursor: 'pointer' }}>EXIT PLANET LOCK</button>
          )}
          
          {/* ═════════════════════════════════════════════════════════════
              📋 INFO PANEL - Shows details when body is selected
              ═════════════════════════════════════════════════════════════
              EDIT: CSS styles for panel appearance
              Facts/trivia pulled from INITIAL_BODIES array
              ═════════════════════════════════════════════════════════════
          */}
          {selectedBody && (
              <div style={{ position: 'absolute', top: '50%', left: '40px', width: '280px', transform: 'translateY(-50%)', background: 'rgba(10, 15, 30, 0.95)', borderRadius: '12px', border: `1px solid ${selectedBody.color}`, boxShadow: `0 0 50px ${selectedBody.color}66`, padding: '20px', color: 'white', pointerEvents: 'auto', zIndex: 20 }}>
                  <button onClick={() => setSelectedBody(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
                  
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedBody.name}</h2>
                      <div style={{ background: selectedBody.color, width: '15px', height: '15px', borderRadius: '50%', boxShadow: `0 0 15px ${selectedBody.color}` }} />
                  </div>
                  
                  {/* Discovery Date */}
                  <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '15px', fontStyle: 'italic' }}>DISCOVERED: <span style={{ color: '#fff' }}>{selectedBody.discovery || "Unknown"}</span></div>
                  
                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px', fontSize: '0.7rem', color: '#aaa' }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', textAlign: 'center' }}><div style={{color:'#fff', fontWeight:'bold'}}>PERIOD</div>{selectedBody.period} YR</div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', textAlign: 'center' }}><div style={{color:'#fff', fontWeight:'bold'}}>DISTANCE</div>{selectedBody.dist} AU</div>
                  </div>
                  
                  {/* Facts List */}
                  <ul style={{ paddingLeft: '15px', margin: '0 0 15px 0', fontSize: '0.8rem', lineHeight: '1.4', color: '#ddd' }}>
                    {selectedBody.facts ? selectedBody.facts.map((fact, i) => <li key={i}>{fact}</li>) : <li>No data</li>}
                  </ul>
                  
                  {/* Trivia Box */}
                  {selectedBody.trivia && (
                    <div style={{ background: `linear-gradient(45deg, ${selectedBody.color}22, transparent)`, padding: '12px', borderLeft: `3px solid ${selectedBody.color}`, fontSize: '0.8rem', fontStyle: 'italic', color: '#ccc' }}>
                      " {selectedBody.trivia} "
                    </div>
                  )}
                  
                  {/* Ride Along Button */}
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => setFocusId(selectedBody.id)} style={{ flex: 1, padding: '8px', background: selectedBody.color, border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}>RIDE ALONG</button>
                  </div>
              </div>
          )}
          
          {/* ═════════════════════════════════════════════════════════════
              ⚙️ SETTINGS PANEL - Time warp & body list
              ═════════════════════════════════════════════════════════════
              EDIT: Range slider min/max/step for time control limits
              EDIT: List styling and button actions
              ═════════════════════════════════════════════════════════════
          */}
          {uiOpen && (
              <div style={{ position: 'absolute', top: '70px', right: '20px', width: '380px', background: 'rgba(10, 10, 20, 0.95)', border: '1px solid #333', padding: '20px', pointerEvents: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
                  {/* Time Warp Slider */}
                  <label style={{ color: '#aaa' }}>TIME WARP: {timeSpeed}x</label>
                  {/* EDIT: max="10000" for max speed, step="10" for increment size */}
                  <input type="range" min="0" max="100" step="1" value={timeSpeed} onChange={e => setTimeSpeed(parseFloat(e.target.value))} style={{ width: '100%', marginBottom: '20px' }} />
                  
                  {/* Body Quick-View List */}
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