/* ==========================================================================
   VOID SIGNAL — AISniper Orbital Division
   A self-contained Three.js rail shooter living inside AISniperOS.
   ========================================================================== */

(() => {
  'use strict';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const BEST_KEY = 'aisniperos.voidsignal.best';

  function createGlowTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(255,255,255,.8)');
    gradient.addColorStop(0.46, 'rgba(255,255,255,.18)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function segmentSphereHit(start, end, center, radius) {
    const abx = end.x - start.x;
    const aby = end.y - start.y;
    const abz = end.z - start.z;
    const acx = center.x - start.x;
    const acy = center.y - start.y;
    const acz = center.z - start.z;
    const abLengthSq = abx * abx + aby * aby + abz * abz;
    const t = abLengthSq === 0 ? 0 : clamp((acx * abx + acy * aby + acz * abz) / abLengthSq, 0, 1);
    const cx = start.x + abx * t;
    const cy = start.y + aby * t;
    const cz = start.z + abz * t;
    const dx = center.x - cx;
    const dy = center.y - cy;
    const dz = center.z - cz;
    return dx * dx + dy * dy + dz * dz <= radius * radius;
  }

  class VoidSignalGame {
    constructor(options = {}) {
      this.options = options;
      this.visible = false;
      this.initialized = false;
      this.failed = false;
      this.state = 'menu';
      this.raf = null;
      this.lastFrame = 0;
      this.elapsed = 0;
      this.playerTarget = { x: 0, y: 0.25 };
      this.pointer = { x: 0, y: 0 };
      this.firing = false;
      this.muted = false;
      this.volume = 0.65;
      this.lastShot = 0;
      this.heat = 0;
      this.overheated = false;
      this.score = 0;
      this.shield = 100;
      this.wave = 1;
      this.waveTime = 0;
      this.spawnTimer = 1.2;
      this.combo = 0;
      this.comboTimer = 0;
      this.invuln = 0;
      this.shake = 0;
      this.hintTimer = null;
      this.stateTimer = null;
      this.pickupTimer = 0;
      this.enemies = [];
      this.bullets = [];
      this.enemyBullets = [];
      this.particles = [];
      this.starFields = [];
      this.nebulae = [];
      this.asteroids = [];
      this.best = this.loadBest();
      this.audio = null;
      this.noiseBuffer = null;
      this.ui = {
        stage: document.getElementById('gameStage'),
        canvas: document.getElementById('gameCanvas'),
        hud: document.getElementById('gameHud'),
        overlay: document.getElementById('gameOverlay'),
        startPanel: document.querySelector('.game-start'),
        gameOverPanel: document.getElementById('gameGameOver'),
        pauseScreen: document.getElementById('gamePauseScreen'),
        startButton: document.getElementById('gameStartBtn'),
        restartButton: document.getElementById('gameRestartBtn'),
        resumeButton: document.getElementById('gameResumeBtn'),
        pauseButton: document.getElementById('hudPauseBtn'),
        soundButton: document.getElementById('gameSoundBtn'),
        expandButton: document.getElementById('gameExpandBtn'),
        score: document.getElementById('hudScore'),
        multiplier: document.getElementById('hudMultiplier'),
        wave: document.getElementById('hudWave'),
        shield: document.getElementById('hudShield'),
        shieldText: document.getElementById('hudShieldText'),
        heat: document.getElementById('hudHeat'),
        threats: document.getElementById('hudThreats'),
        hint: document.getElementById('hudHint'),
        reticle: document.getElementById('gameReticle'),
        reticleLabel: document.getElementById('reticleLabel'),
        best: document.getElementById('gameBest'),
        finalScore: document.getElementById('gameFinalScore'),
        finalWave: document.getElementById('gameFinalWave'),
        finalBest: document.getElementById('gameFinalBest'),
        error: document.getElementById('gameWebglError')
      };
      this.boundLoop = (time) => this.loop(time);
      this.updateStaticUI();
      this.bindUI();
      this.bindInput();
      this.updateMuteUI();
    }

    loadBest() {
      try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (error) { return 0; }
    }

    saveBest() {
      try { localStorage.setItem(BEST_KEY, String(this.best)); } catch (error) { /* no-op */ }
    }

    updateStaticUI() {
      if (this.ui.best) this.ui.best.textContent = String(this.best).padStart(6, '0');
      if (this.ui.finalBest) this.ui.finalBest.textContent = String(this.best).padStart(6, '0');
      this.updateHUD();
    }

    bindUI() {
      this.ui.startButton?.addEventListener('click', () => this.startGame());
      this.ui.restartButton?.addEventListener('click', () => this.startGame());
      this.ui.resumeButton?.addEventListener('click', () => this.resume());
      this.ui.pauseButton?.addEventListener('click', () => this.pause());
      this.ui.soundButton?.addEventListener('click', () => this.toggleMute());
      this.ui.expandButton?.addEventListener('click', () => this.options.onRequestExpand?.());
      if (this.ui.canvas) this.ui.canvas.setAttribute('tabindex', '0');
      if (window.ResizeObserver && this.ui.stage) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.ui.stage);
      }
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('blur', () => { this.firing = false; });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'playing') this.pause();
      });
      if (document.body && window.MutationObserver) {
        this.appObserver = new MutationObserver(() => {
          if (this.state === 'playing' && document.body.dataset.app !== 'game') this.pause();
        });
        this.appObserver.observe(document.body, { attributes: true, attributeFilter: ['data-app'] });
      }
    }

    bindInput() {
      const stage = this.ui.stage;
      if (!stage) return;
      stage.style.touchAction = 'none';
      stage.addEventListener('contextmenu', (event) => event.preventDefault());
      stage.addEventListener('pointermove', (event) => {
        this.updatePointer(event);
      });
      stage.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (event.target.closest('button, .game-overlay, .game-pause-screen, .hud-pause-button, .game-bar')) return;
        this.updatePointer(event);
        if (this.state !== 'playing' || !this.visible) return;
        event.preventDefault();
        this.ensureAudio();
        this.firing = true;
        this.tryFire();
        this.ui.reticle?.classList.add('is-firing');
        stage.setPointerCapture?.(event.pointerId);
      });
      const stopFiring = () => {
        this.firing = false;
        this.ui.reticle?.classList.remove('is-firing');
      };
      window.addEventListener('pointerup', stopFiring);
      window.addEventListener('pointercancel', stopFiring);
      stage.addEventListener('pointerleave', stopFiring);
      document.addEventListener('keydown', (event) => {
        if (!this.visible || document.body.dataset.app !== 'game') return;
        if (event.defaultPrevented) return;
        if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
        if (document.querySelector('.popover.is-open, .os-dropdown.is-open, .spotlight-layer.is-open, .desktop-context-menu.is-open, .sleep-screen.is-visible')) return;
        const key = event.key.toLowerCase();
        if (key === 'p' || event.key === 'Escape') {
          if (this.state === 'playing') {
            event.preventDefault();
            this.pause();
          } else if (this.state === 'paused') {
            event.preventDefault();
            this.resume();
          }
          return;
        }
        if (key === 'r' && this.state === 'gameover') {
          event.preventDefault();
          this.startGame();
          return;
        }
        if (event.code === 'Space' && this.state === 'playing') {
          event.preventDefault();
          this.ensureAudio();
          this.firing = true;
          this.tryFire();
          this.ui.reticle?.classList.add('is-firing');
          return;
        }
        if (key === 'm') this.toggleMute();
        if (key === 'f') this.options.onRequestExpand?.();
      });
      window.addEventListener('keyup', (event) => {
        if (event.code === 'Space') {
          this.firing = false;
          this.ui.reticle?.classList.remove('is-firing');
        }
      });
    }

    updatePointer(event) {
      if (!this.ui.stage) return;
      const rect = this.ui.stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const px = clamp(event.clientX - rect.left, 0, rect.width);
      const py = clamp(event.clientY - rect.top, 0, rect.height);
      this.pointer.x = (px / rect.width) * 2 - 1;
      this.pointer.y = -((py / rect.height) * 2 - 1);
      if (this.ui.reticle) {
        this.ui.reticle.style.left = `${px}px`;
        this.ui.reticle.style.top = `${py}px`;
      }
      this.playerTarget.x = this.pointer.x * 4.5;
      this.playerTarget.y = 0.25 + this.pointer.y * 1.95;
    }

    centerReticle() {
      if (!this.ui.reticle || !this.ui.stage) return;
      const rect = this.ui.stage.getBoundingClientRect();
      this.ui.reticle.style.left = `${rect.width / 2}px`;
      this.ui.reticle.style.top = `${rect.height / 2}px`;
      this.pointer.x = 0;
      this.pointer.y = 0;
      this.playerTarget.x = 0;
      this.playerTarget.y = 0.25;
    }

    open() {
      this.visible = true;
      if (!this.initialized) {
        const success = this.initScene();
        if (!success) return;
      }
      this.resize();
      this.startLoop();
    }

    suspend() {
      this.firing = false;
      if (this.state === 'playing') this.pause();
      this.visible = false;
      this.stopLoop();
    }

    resize() {
      if (!this.renderer || !this.ui.stage) return;
      const width = this.ui.stage.clientWidth;
      const height = this.ui.stage.clientHeight;
      if (!width || !height) return;
      this.viewWidth = width;
      this.viewHeight = height;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      if (this.ui.reticle) {
        this.ui.reticle.style.left = `${((this.pointer.x + 1) / 2) * width}px`;
        this.ui.reticle.style.top = `${((1 - this.pointer.y) / 2) * height}px`;
      }
    }

    startLoop() {
      if (this.raf || this.failed) return;
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.boundLoop);
    }

    stopLoop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    loop(time) {
      this.raf = null;
      if (!this.visible || this.failed) return;
      const delta = clamp((time - this.lastFrame) / 1000, 0.001, 0.045);
      this.lastFrame = time;
      this.elapsed += delta;
      this.update(delta, time);
      if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
      if (this.visible) this.raf = requestAnimationFrame(this.boundLoop);
    }

    /* ----------------------------------------------------------------------
       Scene construction
       ---------------------------------------------------------------------- */

    initScene() {
      if (!window.THREE) {
        this.showWebGLError();
        return false;
      }
      const THREE = window.THREE;
      this.THREE = THREE;
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.ui.canvas,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x020409, 1);
        if ('outputEncoding' in this.renderer && THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding;
        if ('toneMapping' in this.renderer && THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.15;
        }
      } catch (error) {
        console.error('《深空信号》：WebGL 初始化失败。', error);
        this.showWebGLError();
        return false;
      }

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x020409);
      this.scene.fog = new THREE.FogExp2(0x020409, 0.0042);
      this.camera = new THREE.PerspectiveCamera(58, 1.7, 0.1, 420);
      this.camera.position.set(0, 3.1, 11.4);
      this.camera.lookAt(0, 0.8, -18);

      this.glowTexture = createGlowTexture(THREE);
      this.pointerNdc = new THREE.Vector2(0, 0);
      this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 30);
      this.raycaster = new THREE.Raycaster();
      this.aimPoint = new THREE.Vector3();
      this.tmpVec = new THREE.Vector3();
      this.tmpVec2 = new THREE.Vector3();
      this.tmpSegmentStart = new THREE.Vector3();
      this.tmpProjection = new THREE.Vector3();
      this.cameraLook = new THREE.Vector3();
      this.segment = new THREE.Line3();

      this.createLights();
      this.createStarfield();
      this.createNebulae();
      this.createPlanet();
      this.createGate();
      this.createAsteroidField();
      this.createPlayer();
      this.createBulletAssets();
      this.createEnemyAssets();
      this.createExplosionLight();
      this.createDamageFlash();
      this.initialized = true;
      this.resize();
      this.updateHUD();
      this.updateStaticUI();
      return true;
    }

    showWebGLError() {
      this.failed = true;
      this.stopLoop();
      if (this.ui.overlay) this.ui.overlay.style.display = 'none';
      if (this.ui.error) this.ui.error.hidden = false;
      if (this.ui.hud) this.ui.hud.style.display = 'none';
    }

    createLights() {
      const THREE = this.THREE;
      this.scene.add(new THREE.AmbientLight(0x3d5363, 0.9));
      const warm = new THREE.DirectionalLight(0xffc59a, 1.7);
      warm.position.set(12, 20, 14);
      this.scene.add(warm);
      const cool = new THREE.DirectionalLight(0x648bb6, 1.2);
      cool.position.set(-18, 9, -8);
      this.scene.add(cool);
      const rim = new THREE.PointLight(0x5bc7d4, 1.1, 90, 2);
      rim.position.set(0, 8, -46);
      this.scene.add(rim);
    }

    createStarfield() {
      const THREE = this.THREE;
      const layers = [
        { count: 540, spreadX: 230, spreadY: 145, zRange: 280, speed: 5.5, color: 0xcfe6ea, size: 0.5, opacity: 0.66 },
        { count: 340, spreadX: 180, spreadY: 110, zRange: 240, speed: 10, color: 0xffe2ba, size: 0.75, opacity: 0.54 },
        { count: 130, spreadX: 120, spreadY: 80, zRange: 190, speed: 18, color: 0x88d4dd, size: 1.05, opacity: 0.44 }
      ];
      layers.forEach((layer) => {
        const positions = new Float32Array(layer.count * 3);
        for (let index = 0; index < layer.count; index += 1) {
          positions[index * 3] = (Math.random() - 0.5) * layer.spreadX;
          positions[index * 3 + 1] = (Math.random() - 0.35) * layer.spreadY;
          positions[index * 3 + 2] = 15 - Math.random() * layer.zRange;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
          color: layer.color,
          size: layer.size,
          map: this.glowTexture,
          transparent: true,
          opacity: layer.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        this.scene.add(points);
        this.starFields.push({ points, positions, layer });
      });
    }

    createNebulae() {
      const THREE = this.THREE;
      const sprites = [
        { pos: [-58, 20, -135], scale: [125, 84], color: 0x2a8d98, opacity: 0.19, rotation: 0.3 },
        { pos: [62, 15, -155], scale: [105, 72], color: 0x7a577e, opacity: 0.16, rotation: -0.4 },
        { pos: [-5, -20, -190], scale: [150, 80], color: 0xc57746, opacity: 0.11, rotation: 0.1 },
        { pos: [26, 35, -95], scale: [78, 46], color: 0x4b9aa2, opacity: 0.1, rotation: -0.2 }
      ];
      sprites.forEach((data) => {
        const material = new THREE.SpriteMaterial({
          map: this.glowTexture,
          color: data.color,
          transparent: true,
          opacity: data.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        material.rotation = data.rotation;
        const sprite = new THREE.Sprite(material);
        sprite.position.set(...data.pos);
        sprite.scale.set(data.scale[0], data.scale[1], 1);
        this.scene.add(sprite);
        this.nebulae.push({ sprite, baseOpacity: data.opacity, phase: Math.random() * Math.PI * 2 });
      });
    }

    createPlanet() {
      const THREE = this.THREE;
      const group = new THREE.Group();
      group.position.set(-43, 28, -132);
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(23, 48, 32),
        new THREE.MeshStandardMaterial({ color: 0x122b3c, roughness: 0.88, metalness: 0.08, emissive: 0x02070b, emissiveIntensity: 1 })
      );
      planet.rotation.z = 0.38;
      group.add(planet);
      const haloMaterial = new THREE.SpriteMaterial({ map: this.glowTexture, color: 0x5b9aa4, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
      const halo = new THREE.Sprite(haloMaterial);
      halo.scale.set(90, 90, 1);
      halo.position.set(0, 0, -2);
      group.add(halo);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(28, 39, 96),
        new THREE.MeshBasicMaterial({ color: 0x7ba9b0, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      ring.rotation.set(1.23, 0.08, -0.42);
      group.add(ring);
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(23.8, 48, 32),
        new THREE.MeshBasicMaterial({ color: 0x367c8d, transparent: true, opacity: 0.055, side: THREE.BackSide, depthWrite: false })
      );
      group.add(atmosphere);
      this.scene.add(group);
      this.planetGroup = group;
    }

    createGate() {
      const THREE = this.THREE;
      const group = new THREE.Group();
      group.position.set(0, 6, -148);
      const rings = [
        { radius: 15, tube: 0.12, color: 0xf4b477, opacity: 0.5, speed: 0.16 },
        { radius: 19.5, tube: 0.065, color: 0x65d7d1, opacity: 0.27, speed: -0.1 },
        { radius: 25, tube: 0.04, color: 0x9a88d2, opacity: 0.2, speed: 0.06 }
      ];
      rings.forEach((data, index) => {
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(data.radius, data.tube, 8, 160),
          new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: data.opacity, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        mesh.rotation.z = index * 0.23;
        group.add(mesh);
      });
      const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xc68a5a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.scale.set(62, 62, 1);
      group.add(core);
      const dustPositions = new Float32Array(180 * 3);
      for (let index = 0; index < 180; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 14 + Math.random() * 16;
        dustPositions[index * 3] = Math.cos(angle) * radius;
        dustPositions[index * 3 + 1] = Math.sin(angle) * radius;
        dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xffd6a1, size: 0.28, map: this.glowTexture, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false }));
      group.add(dust);
      this.scene.add(group);
      this.gate = group;
    }

    createAsteroidField() {
      const THREE = this.THREE;
      const geometries = [
        new THREE.IcosahedronGeometry(1.8, 0),
        new THREE.DodecahedronGeometry(1.3, 0),
        new THREE.IcosahedronGeometry(2.6, 0)
      ];
      const material = new THREE.MeshStandardMaterial({ color: 0x11191f, roughness: 1, metalness: 0.04, flatShading: true, emissive: 0x020405 });
      for (let index = 0; index < 17; index += 1) {
        const mesh = new THREE.Mesh(geometries[index % geometries.length], material);
        const side = index % 2 === 0 ? -1 : 1;
        mesh.position.set(side * (16 + Math.random() * 28), -5 + Math.random() * 27, -20 - Math.random() * 130);
        const scale = 0.45 + Math.random() * 1.4;
        mesh.scale.setScalar(scale);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.scene.add(mesh);
        this.asteroids.push({ mesh, speed: 0.04 + Math.random() * 0.12, drift: 0.1 + Math.random() * 0.3 });
      }
      const dustGeometry = new THREE.BufferGeometry();
      const dust = new Float32Array(220 * 3);
      for (let index = 0; index < 220; index += 1) {
        dust[index * 3] = (Math.random() - 0.5) * 45;
        dust[index * 3 + 1] = (Math.random() - 0.35) * 30;
        dust[index * 3 + 2] = -8 - Math.random() * 120;
      }
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
      const points = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0x9ec6ca, size: 0.17, transparent: true, opacity: 0.3, map: this.glowTexture, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.scene.add(points);
      this.asteroidDust = points;
    }

    createPlayer() {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const hullMaterial = new THREE.MeshStandardMaterial({ color: 0xd7e0e5, metalness: 0.76, roughness: 0.3, emissive: 0x0a161b, emissiveIntensity: 0.7 });
      const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x26333d, metalness: 0.82, roughness: 0.28, emissive: 0x050a0c });
      const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x6ff1dd, emissive: 0x2a9f93, emissiveIntensity: 1.5, metalness: 0.4, roughness: 0.25 });
      const amberMaterial = new THREE.MeshStandardMaterial({ color: 0xffb274, emissive: 0xff7d3b, emissiveIntensity: 1.2, metalness: 0.3, roughness: 0.35 });

      const hullGeometry = new THREE.ConeGeometry(0.62, 2.85, 4);
      hullGeometry.rotateX(-Math.PI / 2);
      const hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.scale.set(1.12, 0.56, 1);
      hull.rotation.z = Math.PI / 4;
      group.add(hull);

      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 2.1), darkMaterial);
      spine.position.set(0, 0.25, 0.1);
      group.add(spine);

      const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xbac8d0, metalness: 0.8, roughness: 0.26, side: THREE.DoubleSide, flatShading: true, emissive: 0x081217 });
      [-1, 1].forEach((side) => {
        const wingGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          0.28 * side, 0.03, -0.52,
          2.15 * side, -0.13, 0.48,
          0.58 * side, 0.04, 0.9,
          0.28 * side, 0.03, -0.82,
          1.15 * side, -0.05, 0.71,
          0.54 * side, 0.04, 1.04
        ]);
        wingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        wingGeometry.computeVertexNormals();
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        group.add(wing);

        const edge = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.035, 0.045), accentMaterial);
        edge.position.set(side * 1.02, 0.02, 0.45);
        edge.rotation.y = side * -0.5;
        group.add(edge);

        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 1.45, 10), darkMaterial);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(side * 0.58, -0.01, 0.46);
        group.add(pod);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 8, 24), amberMaterial);
        ring.position.set(side * 0.58, -0.01, 1.16);
        group.add(ring);

        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.46, 0.52), darkMaterial);
        fin.position.set(side * 0.72, 0.22, 0.7);
        fin.rotation.z = side * 0.18;
        group.add(fin);

        const engine = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xffa15a, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false }));
        engine.position.set(side * 0.58, -0.01, 1.34);
        engine.scale.set(0.92, 0.92, 1);
        group.add(engine);
        if (!this.playerEngines) this.playerEngines = [];
        this.playerEngines.push(engine);
      });

      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x08222a, metalness: 0.55, roughness: 0.1, emissive: 0x0d555e, emissiveIntensity: 0.8 })
      );
      canopy.scale.set(1, 0.56, 1.8);
      canopy.position.set(0, 0.27, -0.02);
      group.add(canopy);

      const stripeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 1.25), accentMaterial);
      stripeLeft.position.set(-0.44, 0.15, -0.18);
      group.add(stripeLeft);
      const stripeRight = stripeLeft.clone();
      stripeRight.position.x = 0.44;
      group.add(stripeRight);

      const engineLight = new THREE.PointLight(0xff9655, 1.4, 10, 2);
      engineLight.position.set(0, 0.1, 1.2);
      group.add(engineLight);

      group.position.set(0, 0.25, 4.4);
      group.scale.setScalar(0.98);
      this.scene.add(group);
      this.player = group;
      this.playerBaseY = 0.25;
      this.playerBank = 0;
      this.playerPitch = 0;
    }

    createBulletAssets() {
      const THREE = this.THREE;
      this.playerBulletGeometry = new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6);
      this.playerBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xb8fff1, transparent: true, opacity: 0.98, blending: THREE.AdditiveBlending, depthWrite: false });
      this.playerBulletGlowMaterial = new THREE.SpriteMaterial({ map: this.glowTexture, color: 0x6fffe3, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
      this.enemyBulletGeometry = new THREE.SphereGeometry(0.16, 8, 6);
      this.enemyBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff9277, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      this.enemyBulletGlowMaterial = new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xff5b3f, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
      this.upAxis = new THREE.Vector3(0, 1, 0);
    }

    createEnemyAssets() {
      const THREE = this.THREE;
      this.enemyAssets = {
        hull: new THREE.MeshStandardMaterial({ color: 0x24151b, metalness: 0.8, roughness: 0.28, emissive: 0x120408, emissiveIntensity: 1 }),
        dark: new THREE.MeshStandardMaterial({ color: 0x0c1116, metalness: 0.7, roughness: 0.35 }),
        crimson: new THREE.MeshBasicMaterial({ color: 0xff6f51 }),
        amber: new THREE.MeshBasicMaterial({ color: 0xffb05f }),
        rose: new THREE.MeshBasicMaterial({ color: 0xff5677 }),
        rings: {
          drone: new THREE.TorusGeometry(0.94, 0.025, 6, 32),
          striker: new THREE.TorusGeometry(0.72, 0.022, 6, 26),
          heavy: new THREE.TorusGeometry(1.7, 0.035, 8, 48)
        },
        geoms: {
          octa: new THREE.OctahedronGeometry(0.88, 0),
          cone: new THREE.ConeGeometry(0.56, 2.15, 3),
          heavy: new THREE.IcosahedronGeometry(1.32, 0),
          eye: new THREE.SphereGeometry(0.17, 10, 8),
          wing: new THREE.BoxGeometry(0.78, 0.055, 0.34),
          pod: new THREE.BoxGeometry(0.24, 0.22, 1.25)
        },
        glow: {
          crimson: new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xff4d34, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
          amber: new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xffa356, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
          rose: new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xff3c62, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
        }
      };
    }

    createExplosionLight() {
      const THREE = this.THREE;
      this.explosionLight = new THREE.PointLight(0xff985e, 0, 55, 2);
      this.scene.add(this.explosionLight);
    }

    createDamageFlash() {
      if (!this.ui.stage) return;
      this.damageFlash = document.createElement('div');
      this.damageFlash.className = 'game-damage';
      this.ui.stage.appendChild(this.damageFlash);
    }
    /* ----------------------------------------------------------------------
       Game state
       ---------------------------------------------------------------------- */

    startGame() {
      if (this.failed) return;
      if (!this.initialized && !this.initScene()) return;
      this.visible = true;
      this.resetGameplay();
      this.state = 'playing';
      this.centerReticle();
      this.ui.stage?.classList.add('is-playing');
      this.ui.stage?.classList.remove('is-paused', 'is-gameover');
      if (this.ui.pauseScreen) this.ui.pauseScreen.hidden = true;
      if (this.ui.startPanel) this.ui.startPanel.hidden = true;
      if (this.ui.gameOverPanel) this.ui.gameOverPanel.hidden = true;
      this.ui.hud?.setAttribute('aria-hidden', 'false');
      this.ensureAudio();
      this.playSound('wave');
      this.showHint('移动瞄准  ·  按住射击', 4600);
      this.updateHUD();
      this.startLoop();
      this.lastFrame = performance.now();
      this.lastShot = this.elapsed;
      this.ui.canvas?.focus?.({ preventScroll: true });
    }

    resetGameplay() {
      this.score = 0;
      this.shield = 100;
      this.wave = 1;
      this.waveTime = 0;
      this.spawnTimer = 0.9;
      this.heat = 0;
      this.overheated = false;
      this.combo = 0;
      this.comboTimer = 0;
      this.invuln = 1.4;
      this.shake = 0;
      this.firing = false;
      this.elapsedTimeInRound = 0;
      this.clearCombatObjects();
      if (this.player) {
        this.player.visible = true;
        this.player.position.set(0, 0.25, 4.4);
        this.player.rotation.set(0, 0, 0);
      }
      this.pointer.x = 0;
      this.pointer.y = 0;
      this.playerTarget.x = 0;
      this.playerTarget.y = 0.25;
      this.damageFlash?.classList.remove('is-hit');
      if (this.explosionLight) this.explosionLight.intensity = 0;
      this.updateHUD();
    }

    clearCombatObjects() {
      if (!this.scene) return;
      this.enemies.forEach((enemy) => this.scene.remove(enemy.group));
      this.bullets.forEach((bullet) => this.scene.remove(bullet.mesh));
      this.enemyBullets.forEach((bullet) => this.scene.remove(bullet.mesh));
      this.particles.forEach((particle) => {
        this.scene.remove(particle.points);
        particle.points.geometry.dispose();
        particle.points.material.dispose();
      });
      this.enemies = [];
      this.bullets = [];
      this.enemyBullets = [];
      this.particles = [];
    }

    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this.firing = false;
      this.ui.stage?.classList.add('is-paused');
      if (this.ui.pauseScreen) this.ui.pauseScreen.hidden = false;
      this.ui.reticle?.classList.remove('is-firing');
      this.playSound('pause');
    }

    resume() {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      this.visible = true;
      this.ui.stage?.classList.remove('is-paused');
      if (this.ui.pauseScreen) this.ui.pauseScreen.hidden = true;
      this.lastFrame = performance.now();
      this.startLoop();
      this.playSound('resume');
      this.ui.canvas?.focus?.({ preventScroll: true });
    }

    gameOver() {
      if (this.state !== 'playing') return;
      this.state = 'gameover';
      this.firing = false;
      this.ui.stage?.classList.remove('is-playing', 'is-paused');
      this.ui.stage?.classList.add('is-gameover');
      if (this.ui.pauseScreen) this.ui.pauseScreen.hidden = true;
      if (this.ui.startPanel) this.ui.startPanel.hidden = true;
      if (this.ui.gameOverPanel) this.ui.gameOverPanel.hidden = false;
      this.ui.hud?.setAttribute('aria-hidden', 'true');
      this.ui.reticle?.classList.remove('is-firing', 'is-locked');
      if (this.ui.finalScore) this.ui.finalScore.textContent = String(this.score).padStart(6, '0');
      if (this.ui.finalWave) this.ui.finalWave.textContent = String(this.wave).padStart(2, '0');
      if (this.score > this.best) {
        this.best = this.score;
        this.saveBest();
      }
      if (this.ui.finalBest) this.ui.finalBest.textContent = String(this.best).padStart(6, '0');
      if (this.ui.best) this.ui.best.textContent = String(this.best).padStart(6, '0');
      if (this.player) {
        this.spawnExplosion(this.player.position, 0xffa166, 40, 1.7);
        this.player.visible = false;
      }
      this.enemies.forEach((enemy) => {
        this.spawnExplosion(enemy.group.position, 0xff7451, 8, 0.9);
      });
      this.enemies.forEach((enemy) => this.scene.remove(enemy.group));
      this.enemies = [];
      this.bullets.forEach((bullet) => this.scene.remove(bullet.mesh));
      this.bullets = [];
      this.enemyBullets.forEach((bullet) => this.scene.remove(bullet.mesh));
      this.enemyBullets = [];
      this.shake = 1.1;
      this.playSound('gameover');
      this.updateHUD();
    }

    isPlaying() {
      return this.state === 'playing';
    }

    restart() {
      this.startGame();
    }

    /* ----------------------------------------------------------------------
       Player & combat
       ---------------------------------------------------------------------- */

    updatePlayer(delta) {
      if (!this.player) return;
      const targetX = clamp(this.playerTarget.x, -4.8, 4.8);
      const targetY = clamp(this.playerTarget.y, -1.55, 2.5);
      const previousX = this.player.position.x;
      const previousY = this.player.position.y;
      const smoothing = 1 - Math.exp(-8.5 * delta);
      this.player.position.x = lerp(this.player.position.x, targetX, smoothing);
      this.player.position.y = lerp(this.player.position.y, targetY, smoothing);
      this.player.position.z = 4.4;
      const velocityX = (this.player.position.x - previousX) / Math.max(delta, 0.001);
      const velocityY = (this.player.position.y - previousY) / Math.max(delta, 0.001);
      const bank = clamp(-velocityX * 0.36, -0.52, 0.52);
      const pitch = clamp(-velocityY * 0.075, -0.18, 0.18);
      this.player.rotation.z = lerp(this.player.rotation.z, bank, 1 - Math.exp(-7 * delta));
      this.player.rotation.x = lerp(this.player.rotation.x, pitch, 1 - Math.exp(-7 * delta));
      this.player.rotation.y = lerp(this.player.rotation.y, -velocityX * 0.012, 1 - Math.exp(-6 * delta));
      if (this.playerEngines) {
        const pulse = 1 + Math.sin(this.elapsed * 25) * 0.11;
        this.playerEngines.forEach((engine) => {
          engine.scale.set(0.9 * pulse, 0.9 * pulse, 1);
          engine.material.opacity = 0.72 + Math.sin(this.elapsed * 19) * 0.1;
        });
      }
    }

    updatePlayerIdle(delta) {
      if (!this.player) return;
      if (this.state === 'menu') {
        this.player.position.x = lerp(this.player.position.x, Math.sin(this.elapsed * 0.36) * 1.1, 1 - Math.exp(-2 * delta));
        this.player.position.y = 0.25 + Math.sin(this.elapsed * 0.72) * 0.055;
        this.player.rotation.z = Math.sin(this.elapsed * 0.45) * 0.05;
        this.player.rotation.x = Math.sin(this.elapsed * 0.34) * 0.02;
      }
      if (this.playerEngines) {
        const pulse = 1 + Math.sin(this.elapsed * 18) * 0.08;
        this.playerEngines.forEach((engine) => {
          engine.scale.set(0.9 * pulse, 0.9 * pulse, 1);
          engine.material.opacity = 0.8;
        });
      }
    }

    tryFire() {
      if (this.state !== 'playing' || !this.visible) return;
      if (this.elapsed - this.lastShot < 0.115) return;
      if (this.overheated || this.heat >= 100) return;
      const THREE = this.THREE;
      this.lastShot = this.elapsed;
      let assistedTarget = null;
      let bestScreenDistance = Infinity;
      this.enemies.forEach((enemy) => {
        if (!enemy || enemy.dead) return;
        this.tmpProjection.copy(enemy.group.position).project(this.camera);
        if (this.tmpProjection.z < -1 || this.tmpProjection.z > 1) return;
        const distance = Math.hypot(this.tmpProjection.x - this.pointer.x, this.tmpProjection.y - this.pointer.y);
        const assistRadius = 0.07 + Math.min(0.06, enemy.radius * 0.018);
        if (distance < assistRadius && distance < bestScreenDistance) {
          bestScreenDistance = distance;
          assistedTarget = enemy;
        }
      });
      if (assistedTarget) {
        this.aimPoint.copy(assistedTarget.group.position);
        for (let iteration = 0; iteration < 2; iteration += 1) {
          const flightTime = this.aimPoint.distanceTo(this.player.position) / 146;
          this.aimPoint.copy(assistedTarget.group.position);
          this.aimPoint.z += assistedTarget.speed * flightTime;
        }
      } else {
        this.pointerNdc.set(this.pointer.x, this.pointer.y);
        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        const hasAim = this.raycaster.ray.intersectPlane(this.aimPlane, this.aimPoint);
        if (!hasAim) {
          this.aimPoint.copy(this.player.position);
          this.aimPoint.z -= 40;
        }
      }
      const direction = this.tmpVec.set(this.aimPoint.x - this.player.position.x, this.aimPoint.y - this.player.position.y, this.aimPoint.z - this.player.position.z).normalize();
      const origin = this.tmpVec2.copy(this.player.position).addScaledVector(direction, 1.35);
      const geometry = this.playerBulletGeometry;
      const mesh = new THREE.Mesh(geometry, this.playerBulletMaterial);
      mesh.position.copy(origin);
      mesh.quaternion.setFromUnitVectors(this.upAxis, direction);
      mesh.scale.set(1, 1.3, 1);
      const glow = new THREE.Sprite(this.playerBulletGlowMaterial);
      glow.scale.set(0.62, 0.62, 1);
      mesh.add(glow);
      this.scene.add(mesh);
      this.bullets.push({
        mesh,
        velocity: direction.clone().multiplyScalar(146),
        life: 1.35,
        radius: 0.16
      });
      this.heat = Math.min(100, this.heat + 6.8);
      if (this.heat >= 100) {
        this.overheated = true;
        this.showHint('脉冲驱动过热  ·  松开扳机', 1700);
        this.playSound('overheat');
      }
      this.playSound('laser');
    }

    spawnEnemy() {
      if (!this.initialized) return;
      const roll = Math.random();
      let type = 'drone';
      if (this.wave >= 4 && roll < 0.16) type = 'heavy';
      else if (this.wave >= 2 && roll < 0.47) type = 'striker';
      const config = {
        drone: { hp: 1, speed: 10.5, radius: 1.25, points: 100, scale: 1, fire: false, color: 0xff6e4d },
        striker: { hp: 2, speed: 13.4, radius: 1.5, points: 190, scale: 1.05, fire: true, color: 0xffa35e },
        heavy: { hp: 6, speed: 7.7, radius: 2.65, points: 440, scale: 1.55, fire: true, color: 0xff4f68 }
      }[type];
      const group = this.buildEnemyModel(type, config);
      const x = (Math.random() - 0.5) * 25;
      const y = 0.4 + Math.random() * 7.4;
      const z = -64 - Math.random() * 22;
      group.position.set(x, y, z);
      group.scale.setScalar(config.scale);
      this.scene.add(group);
      this.enemies.push({
        group,
        type,
        hp: config.hp,
        maxHp: config.hp,
        speed: config.speed + (this.wave - 1) * 0.74,
        radius: config.radius,
        points: config.points,
        color: config.color,
        age: 0,
        phase: Math.random() * Math.PI * 2,
        drift: 0.3 + Math.random() * 0.8,
        fireTimer: 1.8 + Math.random() * 2.8,
        canFire: config.fire,
        dead: false
      });
    }

    buildEnemyModel(type, config) {
      const THREE = this.THREE;
      const assets = this.enemyAssets;
      const group = new THREE.Group();
      if (type === 'drone') {
        const body = new THREE.Mesh(assets.geoms.octa, assets.hull);
        body.scale.set(1.5, 0.44, 1.72);
        group.add(body);
        const eye = new THREE.Mesh(assets.geoms.eye, assets.crimson);
        eye.position.set(0, 0.02, 0.82);
        eye.scale.set(1, 0.82, 1);
        group.add(eye);
        const ring = new THREE.Mesh(assets.rings.drone, assets.crimson);
        ring.rotation.x = Math.PI / 2;
        ring.scale.set(1, 1.6, 1);
        group.add(ring);
        [-1, 1].forEach((side) => {
          const wing = new THREE.Mesh(assets.geoms.wing, assets.hull);
          wing.position.set(side * 0.94, 0, 0);
          wing.rotation.z = side * 0.2;
          wing.rotation.y = side * -0.22;
          group.add(wing);
        });
        const glow = new THREE.Sprite(assets.glow.crimson);
        glow.position.set(0, 0.02, 0.9);
        glow.scale.set(0.95, 0.95, 1);
        group.add(glow);
        const engine = new THREE.Sprite(assets.glow.crimson);
        engine.position.set(0, 0, -0.9);
        engine.scale.set(0.62, 0.62, 1);
        group.add(engine);
      } else if (type === 'striker') {
        const body = new THREE.Mesh(assets.geoms.cone, assets.hull);
        body.rotation.x = Math.PI / 2;
        body.scale.set(1.1, 1, 0.55);
        group.add(body);
        const ring = new THREE.Mesh(assets.rings.striker, assets.amber);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        [-1, 1].forEach((side) => {
          const wing = new THREE.Mesh(assets.geoms.wing, assets.hull);
          wing.position.set(side * 0.68, 0, 0.25);
          wing.rotation.z = side * 0.55;
          wing.rotation.y = side * -0.28;
          wing.scale.z = 1.35;
          group.add(wing);
          const pod = new THREE.Mesh(assets.geoms.pod, assets.dark);
          pod.position.set(side * 0.52, -0.05, -0.3);
          group.add(pod);
        });
        const eye = new THREE.Mesh(assets.geoms.eye, assets.amber);
        eye.position.set(0, 0.02, 0.92);
        eye.scale.set(1.1, 0.7, 1.4);
        group.add(eye);
        const glow = new THREE.Sprite(assets.glow.amber);
        glow.position.set(0, 0.02, 1.02);
        glow.scale.set(0.8, 0.8, 1);
        group.add(glow);
      } else {
        const body = new THREE.Mesh(assets.geoms.heavy, assets.hull);
        body.scale.set(1.26, 0.88, 1.45);
        group.add(body);
        const ringA = new THREE.Mesh(assets.rings.heavy, assets.rose);
        ringA.rotation.x = Math.PI / 2;
        group.add(ringA);
        const ringB = new THREE.Mesh(assets.rings.heavy, assets.rose);
        ringB.rotation.y = 0.8;
        ringB.scale.setScalar(0.8);
        group.add(ringB);
        [-1, 1].forEach((side) => {
          const eye = new THREE.Mesh(assets.geoms.eye, assets.rose);
          eye.position.set(side * 0.32, 0.05, 1.13);
          eye.scale.set(1.4, 0.7, 1.2);
          group.add(eye);
          const pod = new THREE.Mesh(assets.geoms.pod, assets.dark);
          pod.position.set(side * 1.18, 0, 0);
          pod.scale.set(1.4, 1.3, 1.2);
          group.add(pod);
          const glow = new THREE.Sprite(assets.glow.rose);
          glow.position.set(side * 0.44, 0.05, 1.18);
          glow.scale.set(1.1, 1.1, 1);
          group.add(glow);
        });
        const engine = new THREE.Sprite(assets.glow.rose);
        engine.position.set(0, 0, -1.45);
        engine.scale.set(1.25, 1.25, 1);
        group.add(engine);
      }
      return group;
    }

    updateEnemies(delta) {
      for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
        const enemy = this.enemies[index];
        if (!enemy || enemy.dead) continue;
        enemy.age += delta;
        enemy.group.position.z += enemy.speed * delta;
        enemy.group.position.x += Math.sin(enemy.age * 1.25 + enemy.phase) * enemy.drift * delta;
        enemy.group.position.y += Math.cos(enemy.age * 0.9 + enemy.phase) * enemy.drift * 0.36 * delta;
        enemy.group.position.x = clamp(enemy.group.position.x, -16, 16);
        enemy.group.position.y = clamp(enemy.group.position.y, -2, 13);
        enemy.group.rotation.z = Math.sin(enemy.age * 1.8 + enemy.phase) * 0.35;
        enemy.group.rotation.y = Math.sin(enemy.age * 0.74 + enemy.phase) * 0.2;
        enemy.fireTimer -= delta;
        if (enemy.canFire && enemy.fireTimer <= 0 && enemy.group.position.z > -52 && enemy.group.position.z < 1.5) {
          this.enemyFire(enemy);
          enemy.fireTimer = enemy.type === 'heavy' ? 1.45 + Math.random() * 1.5 : 2.6 + Math.random() * 2.2;
        }
        if (enemy.group.position.z > 7.1) {
          const closeX = Math.abs(enemy.group.position.x - this.player.position.x) < (enemy.type === 'heavy' ? 4.2 : 3.3);
          const closeY = Math.abs(enemy.group.position.y - this.player.position.y) < (enemy.type === 'heavy' ? 3.1 : 2.6);
          this.removeEnemy(enemy, index);
          if (closeX && closeY) this.damagePlayer(enemy.type === 'heavy' ? 20 : 11, true);
        }
      }
    }

    enemyFire(enemy) {
      const THREE = this.THREE;
      const origin = enemy.group.position.clone();
      origin.z += 0.9;
      const target = this.player.position.clone();
      target.x += (Math.random() - 0.5) * 1.1;
      target.y += (Math.random() - 0.5) * 0.8;
      const direction = target.sub(origin).normalize();
      const mesh = new THREE.Mesh(this.enemyBulletGeometry, this.enemyBulletMaterial);
      mesh.position.copy(origin);
      const glow = new THREE.Sprite(this.enemyBulletGlowMaterial);
      glow.scale.set(0.7, 0.7, 1);
      mesh.add(glow);
      this.scene.add(mesh);
      this.enemyBullets.push({
        mesh,
        velocity: direction.multiplyScalar(enemy.type === 'heavy' ? 25 : 22),
        life: 4
      });
      if (enemy.group.position.z > -38) this.playSound('enemyLaser');
    }

    updateBullets(delta) {
      for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
        const bullet = this.bullets[index];
        const start = this.tmpSegmentStart.copy(bullet.mesh.position);
        bullet.mesh.position.addScaledVector(bullet.velocity, delta);
        bullet.life -= delta;
        let hit = false;
        for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
          const enemy = this.enemies[enemyIndex];
          if (!enemy || enemy.dead) continue;
          if (segmentSphereHit(start, bullet.mesh.position, enemy.group.position, enemy.radius + 0.22)) {
            this.hitEnemy(enemy, enemyIndex);
            hit = true;
            break;
          }
        }
        if (hit || bullet.life <= 0 || Math.abs(bullet.mesh.position.z) > 220) {
          this.scene.remove(bullet.mesh);
          this.bullets.splice(index, 1);
        }
      }
      for (let index = this.enemyBullets.length - 1; index >= 0; index -= 1) {
        const bullet = this.enemyBullets[index];
        const start = this.tmpSegmentStart.copy(bullet.mesh.position);
        bullet.mesh.position.addScaledVector(bullet.velocity, delta);
        bullet.life -= delta;
        const hitPlayer = this.player.visible && segmentSphereHit(start, bullet.mesh.position, this.player.position, 1.05);
        if (hitPlayer) {
          this.damagePlayer(8, false);
          this.spawnExplosion(bullet.mesh.position, 0xff8a64, 9, 0.45);
          this.playSound('hit');
        }
        if (hitPlayer || bullet.life <= 0 || bullet.mesh.position.z > 14) {
          this.scene.remove(bullet.mesh);
          this.enemyBullets.splice(index, 1);
        }
      }
    }

    hitEnemy(enemy, index) {
      enemy.hp -= 1;
      this.spawnExplosion(enemy.group.position, 0xffd0a1, 5, 0.32);
      this.playSound('hit');
      if (enemy.hp <= 0) {
        this.destroyEnemy(enemy, index);
      } else {
        this.shake = Math.min(this.shake + 0.025, 1);
      }
    }

    destroyEnemy(enemy, index) {
      if (enemy.dead) return;
      enemy.dead = true;
      const position = enemy.group.position.clone();
      this.scene.remove(enemy.group);
      this.enemies.splice(index, 1);
      const multiplier = 1 + Math.min(2.2, this.combo * 0.08);
      this.score += Math.round(enemy.points * multiplier);
      this.combo += 1;
      this.comboTimer = 2.7;
      this.spawnExplosion(position, enemy.color, enemy.type === 'heavy' ? 34 : 20, enemy.type === 'heavy' ? 1.35 : 0.9);
      this.playSound('explosion');
      this.shake = Math.min(this.shake + (enemy.type === 'heavy' ? 0.35 : 0.14), 1.1);
      this.updateHUD();
    }

    removeEnemy(enemy, index) {
      if (!enemy || enemy.dead) return;
      enemy.dead = true;
      this.scene.remove(enemy.group);
      this.enemies.splice(index, 1);
    }

    damagePlayer(amount, comboBreak = false) {
      if (this.invuln > 0 || this.state !== 'playing') return;
      this.shield = Math.max(0, this.shield - amount);
      this.invuln = 0.9;
      this.shake = Math.min(this.shake + 0.6, 1.4);
      if (comboBreak) this.combo = 0;
      this.damageFlash?.classList.remove('is-hit');
      void this.damageFlash?.offsetWidth;
      this.damageFlash?.classList.add('is-hit');
      this.playSound('damage');
      this.updateHUD();
      if (this.shield <= 0) this.gameOver();
    }

    updateSpawning(delta) {
      this.waveTime += delta;
      if (this.waveTime >= 28) {
        this.wave += 1;
        this.waveTime = 0;
        this.shield = Math.min(100, this.shield + 7);
        this.showHint(`第 ${String(this.wave).padStart(2, '0')} 波  ·  敌群来袭`, 2600);
        this.playSound('wave');
        this.updateHUD();
      }
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0 && this.enemies.length < 17) {
        this.spawnEnemy();
        if (this.wave > 4 && Math.random() < 0.24) this.spawnEnemy();
        const base = Math.max(0.38, 1.34 - this.wave * 0.075);
        this.spawnTimer = base * (0.68 + Math.random() * 0.75);
      }
    }

    updateCombo(delta) {
      if (this.comboTimer > 0) {
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.updateHUD();
        }
      }
      this.invuln = Math.max(0, this.invuln - delta);
    }

    /* ----------------------------------------------------------------------
       Aiming, HUD, environment
       ---------------------------------------------------------------------- */

    updateLock() {
      if (!this.ui.reticle) return;
      let locked = false;
      for (let index = 0; index < this.enemies.length; index += 1) {
        const enemy = this.enemies[index];
        if (!enemy || enemy.dead) continue;
        this.tmpProjection.copy(enemy.group.position).project(this.camera);
        if (this.tmpProjection.z > -1 && this.tmpProjection.z < 1) {
          const threshold = 0.06 + Math.min(0.05, enemy.radius * 0.014);
          if (Math.abs(this.tmpProjection.x - this.pointer.x) < threshold && Math.abs(this.tmpProjection.y - this.pointer.y) < threshold) {
            locked = true;
            break;
          }
        }
      }
      this.ui.reticle.classList.toggle('is-locked', locked);
      if (this.ui.reticleLabel) this.ui.reticleLabel.textContent = locked ? '锁定' : '追踪';
    }

    updateHUD() {
      if (!this.ui) return;
      if (this.ui.score) this.ui.score.textContent = String(Math.max(0, Math.floor(this.score))).padStart(6, '0');
      if (this.ui.wave) this.ui.wave.textContent = String(this.wave).padStart(2, '0');
      if (this.ui.shield) {
        this.ui.shield.style.width = `${clamp(this.shield, 0, 100)}%`;
        this.ui.shield.classList.toggle('is-low', this.shield <= 35);
      }
      if (this.ui.shieldText) this.ui.shieldText.textContent = String(Math.round(this.shield));
      if (this.ui.threats) this.ui.threats.textContent = String(this.enemies.length).padStart(2, '0');
      if (this.ui.heat) {
        this.ui.heat.style.width = `${clamp(this.heat, 0, 100)}%`;
        this.ui.heat.classList.toggle('is-hot', this.heat >= 82);
      }
      if (this.ui.multiplier) this.ui.multiplier.textContent = `×${(1 + Math.min(2.2, this.combo * 0.08)).toFixed(1)}`;
    }

    showHint(text, duration = 2200) {
      if (!this.ui.hint) return;
      clearTimeout(this.hintTimer);
      this.ui.hint.textContent = text;
      this.ui.hint.style.opacity = '1';
      this.hintTimer = setTimeout(() => {
        if (this.ui.hint) this.ui.hint.style.opacity = '.3';
        if (this.ui.hint) this.ui.hint.textContent = this.state === 'playing' ? '移动瞄准  ·  按住射击' : '';
      }, duration);
    }

    updateEnvironment(delta) {
      const speedFactor = this.state === 'playing' ? 1 : this.state === 'menu' ? 0.46 : this.state === 'gameover' ? 0.24 : 0;
      if (speedFactor > 0) {
        this.starFields.forEach(({ points, positions, layer }) => {
          for (let index = 0; index < layer.count; index += 1) {
            positions[index * 3 + 2] += layer.speed * speedFactor * delta;
            if (positions[index * 3 + 2] > 20) {
              positions[index * 3] = (Math.random() - 0.5) * layer.spreadX;
              positions[index * 3 + 1] = (Math.random() - 0.35) * layer.spreadY;
              positions[index * 3 + 2] = -layer.zRange + Math.random() * 30;
            }
          }
          points.geometry.attributes.position.needsUpdate = true;
        });
      }
      if (this.gate && this.state !== 'paused') {
        this.gate.rotation.z += delta * 0.03 * (this.state === 'playing' ? 1 : 0.4);
        const ringChildren = this.gate.children.filter((child) => child.geometry?.type === 'TorusGeometry');
        ringChildren.forEach((ring, index) => {
          ring.rotation.z += delta * (index % 2 === 0 ? 0.045 : -0.032) * (this.state === 'playing' ? 1 : 0.4);
        });
      }
      this.nebulae.forEach(({ sprite, baseOpacity, phase }) => {
        if (this.state !== 'paused') sprite.material.opacity = baseOpacity * (0.8 + Math.sin(this.elapsed * 0.16 + phase) * 0.2);
      });
      if (this.planetGroup) this.planetGroup.rotation.y += delta * 0.003;
      this.asteroids.forEach((asteroid) => {
        if (this.state === 'paused') return;
        asteroid.mesh.rotation.x += asteroid.speed * delta;
        asteroid.mesh.rotation.y += asteroid.speed * 0.7 * delta;
        asteroid.mesh.rotation.z += asteroid.speed * 0.3 * delta;
      });
      if (this.asteroidDust && this.state !== 'paused') this.asteroidDust.rotation.z += delta * 0.002;
      if (this.explosionLight) this.explosionLight.intensity = Math.max(0, this.explosionLight.intensity - delta * 11);
    }

    updateCamera(delta) {
      const menuDrift = this.state === 'menu' || this.state === 'gameover';
      const baseX = menuDrift ? Math.sin(this.elapsed * 0.17) * 0.38 : this.player ? this.player.position.x * 0.05 : 0;
      const baseY = 3.08 + (menuDrift ? Math.sin(this.elapsed * 0.23) * 0.08 : 0);
      const baseZ = 11.35;
      let shakeX = 0;
      let shakeY = 0;
      if (this.shake > 0.001) {
        shakeX = (Math.random() - 0.5) * this.shake * 0.24;
        shakeY = (Math.random() - 0.5) * this.shake * 0.18;
        this.shake = Math.max(0, this.shake - delta * 1.65);
      }
      this.camera.position.set(baseX + shakeX, baseY + shakeY, baseZ);
      const lookX = menuDrift ? Math.sin(this.elapsed * 0.11) * 0.7 : this.player ? this.player.position.x * 0.12 : 0;
      this.cameraLook.set(lookX, 0.7, -18);
      this.camera.lookAt(this.cameraLook);
    }

    updateParticles(delta) {
      for (let index = this.particles.length - 1; index >= 0; index -= 1) {
        const particle = this.particles[index];
        particle.life -= delta;
        if (particle.life <= 0) {
          this.scene.remove(particle.points);
          particle.points.geometry.dispose();
          particle.points.material.dispose();
          this.particles.splice(index, 1);
          continue;
        }
        const positions = particle.points.geometry.attributes.position.array;
        for (let p = 0; p < particle.velocities.length; p += 1) {
          const velocity = particle.velocities[p];
          velocity.x *= 0.975;
          velocity.y *= 0.975;
          velocity.z *= 0.975;
          positions[p * 3] += velocity.x * delta;
          positions[p * 3 + 1] += velocity.y * delta;
          positions[p * 3 + 2] += velocity.z * delta;
        }
        particle.points.geometry.attributes.position.needsUpdate = true;
        particle.points.material.opacity = clamp(particle.life / particle.maxLife, 0, 1) * particle.opacity;
      }
    }

    spawnExplosion(position, color, count = 18, scale = 1) {
      if (!this.scene) return;
      const THREE = this.THREE;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      for (let index = 0; index < count; index += 1) {
        positions[index * 3] = position.x + (Math.random() - 0.5) * 0.45 * scale;
        positions[index * 3 + 1] = position.y + (Math.random() - 0.5) * 0.45 * scale;
        positions[index * 3 + 2] = position.z + (Math.random() - 0.5) * 0.45 * scale;
        velocities.push(new THREE.Vector3(
          (Math.random() - 0.5) * 14 * scale,
          (Math.random() - 0.5) * 14 * scale,
          (Math.random() - 0.5) * 17 * scale
        ));
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color,
        size: 0.6 * scale,
        map: this.glowTexture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      this.scene.add(points);
      this.particles.push({
        points,
        velocities,
        life: 0.75 + scale * 0.3,
        maxLife: 0.75 + scale * 0.3,
        opacity: 0.95
      });
      if (this.explosionLight) {
        this.explosionLight.position.copy(position);
        this.explosionLight.intensity = Math.min(8, 2 + scale * 2.4);
      }
    }

    /* ----------------------------------------------------------------------
       Master update
       ---------------------------------------------------------------------- */

    update(delta) {
      if (!this.initialized) return;
      this.updateEnvironment(delta);
      this.updateParticles(delta);
      this.updateCamera(delta);
      if (this.state === 'playing') {
        this.updatePlayer(delta);
        this.updateCombo(delta);
        this.updateSpawning(delta);
        this.updateEnemies(delta);
        if (this.firing) this.tryFire();
        this.heat = Math.max(0, this.heat - delta * 22);
        if (this.overheated && this.heat < 28) {
          this.overheated = false;
          this.showHint('脉冲驱动就绪', 1300);
        }
        this.updateBullets(delta);
        this.updateLock();
        this.updateHUD();
      } else {
        this.updatePlayerIdle(delta);
      }
    }

    /* ----------------------------------------------------------------------
       Audio
       ---------------------------------------------------------------------- */

    ensureAudio() {
      if (this.audio) {
        if (this.audio.state === 'suspended') this.audio.resume().catch(() => {});
        return;
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.audio = new Ctx();
        this.masterGain = this.audio.createGain();
        this.masterGain.gain.value = this.muted ? 0 : this.volume * 0.75;
        this.masterGain.connect(this.audio.destination);
        const sampleCount = Math.floor(this.audio.sampleRate * 0.8);
        this.noiseBuffer = this.audio.createBuffer(1, sampleCount, this.audio.sampleRate);
        const channel = this.noiseBuffer.getChannelData(0);
        for (let index = 0; index < sampleCount; index += 1) channel[index] = Math.random() * 2 - 1;
      } catch (error) {
        this.audio = null;
      }
    }

    setVolume(value) {
      this.volume = clamp(Number(value) || 0, 0, 1);
      if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.volume * 0.75;
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.volume * 0.75;
      this.updateMuteUI();
      if (!this.muted) {
        this.ensureAudio();
        this.playSound('resume');
        this.showHint('音频已开启', 1300);
      } else {
        this.showHint('音频已静音', 1300);
      }
    }

    updateMuteUI() {
      if (!this.ui.soundButton) return;
      const use = this.ui.soundButton.querySelector('use');
      if (use) use.setAttribute('href', this.muted ? '#i-sound-off' : '#i-sound');
      this.ui.soundButton.setAttribute('aria-label', this.muted ? '取消游戏静音' : '静音游戏音频');
      this.ui.soundButton.classList.toggle('is-muted', this.muted);
    }

    playSound(kind) {
      if (!this.audio || !this.masterGain || this.muted || this.volume === 0) return;
      const ctx = this.audio;
      const now = ctx.currentTime;
      if (kind === 'laser' || kind === 'enemyLaser' || kind === 'hit' || kind === 'overheat' || kind === 'pause' || kind === 'resume') {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const config = {
          laser: { type: 'triangle', start: 1450, end: 430, duration: 0.09, gain: 0.028 },
          enemyLaser: { type: 'sawtooth', start: 280, end: 130, duration: 0.16, gain: 0.012 },
          hit: { type: 'square', start: 230, end: 90, duration: 0.07, gain: 0.018 },
          overheat: { type: 'sawtooth', start: 170, end: 90, duration: 0.3, gain: 0.028 },
          pause: { type: 'sine', start: 540, end: 280, duration: 0.2, gain: 0.02 },
          resume: { type: 'sine', start: 320, end: 680, duration: 0.18, gain: 0.024 }
        }[kind];
        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.start, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.end, now + config.duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(config.gain, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
        oscillator.connect(gain).connect(this.masterGain);
        oscillator.start(now);
        oscillator.stop(now + config.duration + 0.02);
        return;
      }
      if (kind === 'explosion' || kind === 'damage') {
        if (!this.noiseBuffer) return;
        const source = ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(kind === 'explosion' ? 1200 : 650, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.5);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(kind === 'explosion' ? 0.23 : 0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'explosion' ? 0.55 : 0.38));
        source.connect(filter).connect(gain).connect(this.masterGain);
        source.start(now);
        source.stop(now + 0.65);
        if (kind === 'damage') {
          const oscillator = ctx.createOscillator();
          const lowGain = ctx.createGain();
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(122, now);
          oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.3);
          lowGain.gain.setValueAtTime(0.04, now);
          lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
          oscillator.connect(lowGain).connect(this.masterGain);
          oscillator.start(now);
          oscillator.stop(now + 0.36);
        }
        return;
      }
      if (kind === 'wave') {
        [440, 660, 880].forEach((frequency, index) => {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          const offset = now + index * 0.11;
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(frequency, offset);
          gain.gain.setValueAtTime(0.0001, offset);
          gain.gain.exponentialRampToValueAtTime(0.03, offset + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, offset + 0.4);
          oscillator.connect(gain).connect(this.masterGain);
          oscillator.start(offset);
          oscillator.stop(offset + 0.42);
        });
        return;
      }
      if (kind === 'gameover') {
        [392, 311, 233, 174].forEach((frequency, index) => {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          const offset = now + index * 0.26;
          oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
          oscillator.frequency.setValueAtTime(frequency, offset);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.94, offset + 0.5);
          gain.gain.setValueAtTime(0.0001, offset);
          gain.gain.exponentialRampToValueAtTime(0.04, offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, offset + 0.6);
          oscillator.connect(gain).connect(this.masterGain);
          oscillator.start(offset);
          oscillator.stop(offset + 0.64);
        });
      }
    }
  }

  window.VoidSignalGame = VoidSignalGame;
})();
