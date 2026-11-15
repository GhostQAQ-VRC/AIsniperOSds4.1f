/* ==========================================================================
   AISniperOS — playable Steam surfaces
   Low-poly CS2 training match and a walkable, conversational VRChat lounge.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const pageIsInterrupted = () => Boolean(document.body.classList.contains('is-locked') || document.querySelector('.sleep-screen.is-visible'));
  const WINDOW_OPEN = (id) => {
    const win = document.getElementById(`window-${id}`);
    return Boolean(win && win.classList.contains('is-open') && !win.classList.contains('is-minimizing') && !pageIsInterrupted());
  };
  const WINDOW_ACTIVE = (id) => {
    const win = document.getElementById(`window-${id}`);
    return Boolean(win && win.classList.contains('is-open') && win.classList.contains('is-active') && !pageIsInterrupted());
  };

  function makeLabel(text, color = '#dff7ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = '600 26px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = 7;
    ctx.fillText(text, 128, 41);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.5, 0.62, 1);
    return sprite;
  }

  /* ==========================================================================
     Counter-Strike 2 — low-poly training match
     ========================================================================== */

  class CS2Game {
    constructor(root, host = {}) {
      this.root = root;
      this.host = host;
      this.win = document.getElementById('window-cs2');
      this.initialized = false;
      this.running = false;
      this.paused = false;
      this.over = false;
      this.started = false;
      this.keys = new Set();
      this.score = 0;
      this.kills = 0;
      this.wave = 0;
      this.health = 100;
      this.ammo = 30;
      this.reserve = 90;
      this.reloading = false;
      this.shots = 0;
      this.hits = 0;
      this.nextShot = 0;
      this.elapsed = 0;
      this.lastFrame = 0;
      this.bots = [];
      this.tracers = [];
      this.obstacles = [];
      this.botHitMeshes = [];
      this.waveTimer = null;
      this.hasLock = false;
      this.wasLocked = false;
      this.loadedOnce = false;
      this.loadingActive = false;
      this.loadingTimer = null;
      this.lobbyTime = 0;
      this.matchmaking = null;
      this.matchTimer = null;
      this.selectedMap = 'mirage';
      this.lastMap = 'mirage';
      this.mapData = {
        mirage: { name: 'de_mirage', label: '荒漠迷城', desc: '沙色中路与开阔包点。适合第一场热身。', fog: 0x16120e, bg: 0x0c1118, floor: 0x3a2e22, wall: 0x2b2925, trim: 0xd89a4b, crate: 0x4a3c2b, sun: 0xffd59b, fill: 0x7ab6dc },
        inferno: { name: 'de_inferno', label: '炼狱小镇', desc: '暖色石墙、狭窄巷道与近距离交火。', fog: 0x1b0f0d, bg: 0x170c0b, floor: 0x3d2820, wall: 0x33201a, trim: 0xd6673c, crate: 0x56372a, sun: 0xffb17d, fill: 0xe08052 },
        ancient: { name: 'de_ancient', label: '远古遗迹', desc: '藤蔓、石阶和湿润的绿色遗迹。', fog: 0x0b1713, bg: 0x07110e, floor: 0x26362b, wall: 0x1c2b24, trim: 0x76b35b, crate: 0x354a35, sun: 0xcbe6a6, fill: 0x4fbd9e },
        vertigo: { name: 'de_vertigo', label: '殒命大厦', desc: '高处风声、冷色混凝土与垂直空间。', fog: 0x0c1620, bg: 0x081018, floor: 0x2e4050, wall: 0x243342, trim: 0x6c9fca, crate: 0x3c5364, sun: 0xb8dcf6, fill: 0x4c8fc8 }
      };
      this.buildUI();
      this.bindUI();
    }

    buildUI() {
      this.root.innerHTML = `
        <div class="cs2-stage">
          <canvas class="cs2-canvas" aria-label="Counter-Strike 2 游戏画面"></canvas>
          <div class="cs2-scanlines"></div>
          <div class="cs2-vignette"></div>
          <div class="cs2-damage" hidden></div>
          <div class="cs2-overlay cs2-loading-screen">
            <div class="cs2-load-grid"></div>
            <div class="cs2-load-rings"><i></i><i></i><i></i></div>
            <span class="cs2-load-mark">2</span>
            <span class="cs2-load-kicker"><i></i>VALVE · AISNIPER COMPETITIVE</span>
            <h2>正在进入竞技服务器</h2>
            <p class="cs2-load-copy">正在校验比赛资源、整理地图缓存并连接本地 128 tick 服务器。</p>
            <div class="cs2-load-track"><i class="cs2-load-bar"></i></div>
            <div class="cs2-load-meta"><b class="cs2-load-percent">0%</b><span class="cs2-load-stage">正在校验本地比赛文件…</span></div>
            <div class="cs2-load-foot"><span>本地训练赛 · 无需联网</span><button type="button" class="cs2-text-btn cs2-load-skip">跳过加载</button></div>
          </div>
          <div class="cs2-hud" hidden>
            <div class="cs2-hud-top">
              <div class="cs2-team-card"><span class="cs2-team-mark">CT</span><div><b>反恐精英</b><small>训练服务器 · de_mirage</small></div></div>
              <div class="cs2-round-info"><span>比赛用时</span><b class="cs2-timer">00:00</b></div>
              <div class="cs2-wave-card"><span>波次</span><b class="cs2-wave">01</b><small>训练目标</small></div>
            </div>
            <div class="cs2-crosshair"><i></i><i></i><i></i><i></i><b></b></div>
            <div class="cs2-hitmarker" hidden><i></i><i></i><i></i><i></i></div>
            <div class="cs2-killfeed"></div>
            <div class="cs2-hud-bottom">
              <div class="cs2-health-block"><div class="cs2-hud-label"><span>生命</span><b class="cs2-health-value">100</b></div><div class="cs2-health-track"><i class="cs2-health-fill"></i></div></div>
              <div class="cs2-ammo-block"><b class="cs2-ammo-value">30</b><span>/ <em class="cs2-ammo-reserve">90</em></span><small>7.62 × 39</small></div>
              <div class="cs2-kills-block"><span>淘汰</span><b class="cs2-kills">0</b></div>
            </div>
            <div class="cs2-hint-line"><span>WASD 移动</span><span>鼠标瞄准</span><span>左键射击</span><span>R 装填</span><span>Esc 释放鼠标</span></div>
          </div>
          <div class="cs2-overlay cs2-lobby-panel">
            <div class="cs2-lobby-head">
              <div class="cs2-lobby-brand"><span class="cs2-lobby-mark">2</span><div><b>COUNTER-STRIKE <i>2</i></b><small>AISNIPER 竞技服务器</small></div></div>
              <div class="cs2-lobby-status"><span><i></i>已连接</span><b>竞技大厅</b><small>延迟 8ms · 128 tick</small></div>
            </div>
            <div class="cs2-lobby-grid">
              <section class="cs2-lobby-side">
                <span class="cs2-eyebrow">PREMIER LOBBY</span>
                <h2>先选地图，<br>再进入战场。</h2>
                <p>热身赛由本地低模 BOT 填充。挑选一张地图，准备好后再开始比赛。</p>
                <div class="cs2-lobby-teamline"><span class="cs2-lobby-team ct">CT</span><b>反恐精英</b><i>5</i><span class="cs2-lobby-team t">T</span><b class="cs2-lobby-enemy">恐怖分子</b><i>5</i></div>
                <div class="cs2-lobby-squad">
                  <div><span>S</span><b>Sniper</b><small>队长 · 你</small></div>
                  <div><span>K</span><b>Kai</b><small>BOT</small></div>
                  <div><span>N</span><b>Nova</b><small>BOT</small></div>
                  <div><span>P</span><b>Pixel</b><small>BOT</small></div>
                  <div><span class="is-empty">+</span><b>等待加入</b><small>开放槽位</small></div>
                </div>
                <div class="cs2-lobby-note"><span class="cs2-lobby-live"><i></i>服务器在线</span><span>本地训练赛 · 无真实联网</span></div>
              </section>
              <section class="cs2-map-picker">
                <div class="cs2-map-picker-head"><div><span>选择地图</span><b>地图池</b></div><small class="cs2-selected-map-name">de_mirage</small></div>
                <div class="cs2-map-grid">
                  <button class="cs2-map-card is-active" data-cs2-map="mirage"><span class="cs2-map-art map-mirage"><i></i></span><b>de_mirage</b><small>荒漠迷城 · 开阔中路</small></button>
                  <button class="cs2-map-card" data-cs2-map="inferno"><span class="cs2-map-art map-inferno"><i></i></span><b>de_inferno</b><small>炼狱小镇 · 近距离</small></button>
                  <button class="cs2-map-card" data-cs2-map="ancient"><span class="cs2-map-art map-ancient"><i></i></span><b>de_ancient</b><small>远古遗迹 · 石墙藤蔓</small></button>
                  <button class="cs2-map-card" data-cs2-map="vertigo"><span class="cs2-map-art map-vertigo"><i></i></span><b>de_vertigo</b><small>殒命大厦 · 高层冷色</small></button>
                </div>
                <div class="cs2-map-info"><span>当前选择</span><b class="cs2-map-label">荒漠迷城</b><small class="cs2-map-desc">沙色中路与开阔包点。适合第一场热身。</small></div>
                <div class="cs2-lobby-actions"><button class="cs2-primary-btn cs2-start-btn"><span>开始比赛</span><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></button><button class="cs2-secondary-btn cs2-matchmaking-btn"><span>寻找竞技比赛</span><svg viewBox="0 0 24 24"><use href="#i-search"></use></svg></button><span>本地 BOT · 假匹配</span></div>
                <small class="cs2-fallback-note">WASD 移动 · 左键射击 · R 装填 · Esc 释放鼠标。鼠标锁定失败时，可用 Q/E 转向、方向键瞄准、空格射击。</small>
              </section>
            </div>
          </div>
          <div class="cs2-overlay cs2-match-panel" hidden>
            <div class="cs2-match-shell">
              <header class="cs2-match-head"><div><span>PREMIER MATCHMAKING</span><b>寻找比赛</b></div><small><i></i>本地模拟队列</small></header>
              <div class="cs2-match-body">
                <div class="cs2-match-radar"><span class="cs2-radar-ring r1"></span><span class="cs2-radar-ring r2"></span><span class="cs2-radar-ring r3"></span><span class="cs2-radar-sweep"></span><span class="cs2-radar-blip b1"></span><span class="cs2-radar-blip b2"></span><span class="cs2-radar-blip b3"></span><b>10</b><small>PLAYERS</small></div>
                <div class="cs2-match-copy">
                  <span class="cs2-match-eyebrow">AISNIPER COMPETITIVE · 5v5</span>
                  <h2 class="cs2-match-title">正在搜索比赛</h2>
                  <p class="cs2-match-status">正在评估延迟、段位与地图偏好…</p>
                  <div class="cs2-match-map"><span>地图</span><b class="cs2-match-map-name">de_mirage</b><small class="cs2-match-map-mode">竞技 · 5v5 · 本地模拟</small></div>
                  <div class="cs2-match-roster">
                    <div class="cs2-roster-team"><span>CT</span><div class="cs2-roster-slots" data-cs2-roster="ct"></div></div>
                    <div class="cs2-roster-team t"><span>T</span><div class="cs2-roster-slots" data-cs2-roster="t"></div></div>
                  </div>
                  <div class="cs2-match-metrics"><span>排队 <b class="cs2-match-clock">00:00</b></span><span>延迟 <b class="cs2-match-ping">8 ms</b></span><span>段位 <b>黄金 3</b></span></div>
                  <div class="cs2-match-actions"><button class="cs2-text-btn cs2-match-cancel" type="button">取消匹配</button><button class="cs2-primary-btn cs2-match-accept" hidden>接受比赛</button></div>
                </div>
              </div>
            </div>
          </div>
          <div class="cs2-overlay cs2-pause-panel" hidden>
            <span class="cs2-eyebrow">比赛已暂停</span>
            <h2>准星离开战场。</h2>
            <p>点击继续并重新捕获鼠标。按 Esc 可以释放鼠标。</p>
            <button class="cs2-primary-btn cs2-resume-btn"><span>继续比赛</span><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></button>
            <button class="cs2-text-btn cs2-abandon-btn" type="button">返回大厅</button>
          </div>
          <div class="cs2-overlay cs2-over-panel" hidden>
            <span class="cs2-eyebrow">行动结束</span>
            <h2>舰体完整度归零。</h2>
            <div class="cs2-result-grid">
              <div><span>淘汰</span><b class="cs2-final-kills">0</b></div>
              <div><span>命中率</span><b class="cs2-final-accuracy">0%</b></div>
              <div><span>波次</span><b class="cs2-final-wave">1</b></div>
              <div><span>得分</span><b class="cs2-final-score">0</b></div>
            </div>
            <div class="cs2-over-actions"><button class="cs2-primary-btn cs2-retry-btn"><span>再来一局</span><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg></button><button class="cs2-text-btn cs2-back-lobby-btn" type="button">返回大厅</button></div>
          </div>
          <div class="cs2-fatal" hidden><b>3D 引擎无法启动</b><span>请确认 WebGL 已开启，然后重新打开游戏窗口。</span></div>
        </div>`;
      this.refs = {
        canvas: $('.cs2-canvas', this.root),
        hud: $('.cs2-hud', this.root),
        startPanel: $('.cs2-lobby-panel', this.root),
        pausePanel: $('.cs2-pause-panel', this.root),
        overPanel: $('.cs2-over-panel', this.root),
        fatal: $('.cs2-fatal', this.root),
        health: $('.cs2-health-value', this.root),
        healthFill: $('.cs2-health-fill', this.root),
        ammo: $('.cs2-ammo-value', this.root),
        reserve: $('.cs2-ammo-reserve', this.root),
        kills: $('.cs2-kills', this.root),
        wave: $('.cs2-wave', this.root),
        timer: $('.cs2-timer', this.root),
        killfeed: $('.cs2-killfeed', this.root),
        hitmarker: $('.cs2-hitmarker', this.root),
        damage: $('.cs2-damage', this.root),
        startBtn: $('.cs2-start-btn', this.root),
        resumeBtn: $('.cs2-resume-btn', this.root),
        abandonBtn: $('.cs2-abandon-btn', this.root),
        retryBtn: $('.cs2-retry-btn', this.root),
        backLobbyBtn: $('.cs2-back-lobby-btn', this.root),
        loading: $('.cs2-loading-screen', this.root),
        loadingBar: $('.cs2-load-bar', this.root),
        loadingPercent: $('.cs2-load-percent', this.root),
        loadingStage: $('.cs2-load-stage', this.root),
        loadingSkip: $('.cs2-load-skip', this.root),
        selectedMapName: $('.cs2-selected-map-name', this.root),
        mapLabel: $('.cs2-map-label', this.root),
        mapDesc: $('.cs2-map-desc', this.root),
        hudMapLabel: $('.cs2-team-card small', this.root),
        finalKills: $('.cs2-final-kills', this.root),
        finalAccuracy: $('.cs2-final-accuracy', this.root),
        finalWave: $('.cs2-final-wave', this.root),
        finalScore: $('.cs2-final-score', this.root),
        matchBtn: $('.cs2-matchmaking-btn', this.root),
        matchPanel: $('.cs2-match-panel', this.root),
        matchTitle: $('.cs2-match-title', this.root),
        matchStatus: $('.cs2-match-status', this.root),
        matchClock: $('.cs2-match-clock', this.root),
        matchPing: $('.cs2-match-ping', this.root),
        matchMapName: $('.cs2-match-map-name', this.root),
        matchAccept: $('.cs2-match-accept', this.root),
        matchCancel: $('.cs2-match-cancel', this.root),
        matchRosters: $$('[data-cs2-roster]', this.root)
      };
    }

    bindUI() {
      this.refs.startBtn?.addEventListener('click', () => this.start());
      this.refs.retryBtn?.addEventListener('click', () => this.start());
      this.refs.resumeBtn?.addEventListener('click', () => this.resume());
      this.refs.abandonBtn?.addEventListener('click', () => this.returnToLobby());
      this.refs.backLobbyBtn?.addEventListener('click', () => this.returnToLobby());
      this.refs.loadingSkip?.addEventListener('click', () => this.finishLoading());
      this.refs.matchBtn?.addEventListener('click', () => this.startMatchmaking());
      this.refs.matchCancel?.addEventListener('click', () => this.cancelMatchmaking());
      this.refs.matchAccept?.addEventListener('click', () => this.acceptMatch());
      $$('[data-cs2-map]', this.root).forEach((button) => {
        button.addEventListener('click', () => this.selectMap(button.dataset.cs2Map));
      });
      this.refs.canvas?.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || !this.running || this.over) return;
        if (document.pointerLockElement !== this.refs.canvas) {
          this.requestLock();
          return;
        }
      });
      document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement !== this.refs.canvas) return;
        if (!this.running || this.paused || this.over) return;
        this.yaw -= event.movementX * 0.0021;
        this.pitch = clamp(this.pitch - event.movementY * 0.0018, -1.25, 1.25);
      });
      document.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;
        if (document.pointerLockElement !== this.refs.canvas) return;
        if (!this.running || this.paused || this.over) return;
        this.shoot();
      });
      document.addEventListener('pointerlockchange', () => {
        const locked = document.pointerLockElement === this.refs.canvas;
        this.hasLock = locked;
        if (locked) {
          this.wasLocked = true;
          if (this.running && !this.over && this.paused) this.resume(false);
        } else if (this.wasLocked) {
          this.wasLocked = false;
          if (this.running && !this.over) this.pause();
        }
      });
      document.addEventListener('keydown', (event) => this.onKey(event, true));
      document.addEventListener('keyup', (event) => this.onKey(event, false));
      window.addEventListener('blur', () => this.keys.clear());
    }

    onKey(event, down) {
      if (!this.started || !this.running || this.over) return;
      if (!WINDOW_ACTIVE('cs2')) return;
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
      if (codes.includes(event.code)) event.preventDefault();
      if (down) {
        this.keys.add(event.code);
        if (event.code === 'KeyR') this.reload();
        if (event.code === 'Space') this.shoot();
        if (event.code === 'KeyQ' || event.code === 'ArrowLeft') this.yaw += 0.055;
        if (event.code === 'KeyE' || event.code === 'ArrowRight') this.yaw -= 0.055;
        if (event.code === 'ArrowUp') this.pitch = clamp(this.pitch + 0.035, -1.25, 1.25);
        if (event.code === 'ArrowDown') this.pitch = clamp(this.pitch - 0.035, -1.25, 1.25);
      } else {
        this.keys.delete(event.code);
      }
    }

    requestLock() {
      try {
        const result = this.refs.canvas?.requestPointerLock?.();
        if (result?.catch) result.catch(() => {});
      } catch (error) {
        /* Keyboard fallback remains available. */
      }
    }

    ensure() {
      if (this.initialized) return true;
      if (!window.THREE) {
        this.refs.fatal.hidden = false;
        return false;
      }
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.refs.canvas, antialias: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        if ('outputEncoding' in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070c14);
        this.scene.fog = new THREE.FogExp2(0x070c14, 0.017);
        this.camera = new THREE.PerspectiveCamera(73, 1, 0.1, 120);
        this.camera.rotation.order = 'YXZ';
        this.scene.add(this.camera);
        this.player = new THREE.Vector3(0, 1.7, 9);
        this.yaw = 0;
        this.pitch = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.camera.position.copy(this.player);
        this.camera.rotation.set(0, 0, 0, 'YXZ');
        this.buildArena();
        this.buildGun();
        this.clock = new THREE.Clock();
        this.initialized = true;
        this.startLoop();
        return true;
      } catch (error) {
        console.error('AISniperOS：CS2 渲染器启动失败。', error);
        this.refs.fatal.hidden = false;
        return false;
      }
    }

    buildArena() {
      const hemi = new THREE.HemisphereLight(0xa7c9ef, 0x251b16, 0.95);
      this.scene.add(hemi);
      this.hemiLight = hemi;
      const sun = new THREE.DirectionalLight(0xffddaa, 1.1);
      sun.position.set(8, 14, 5);
      this.scene.add(sun);
      this.sunLight = sun;
      const fill = new THREE.PointLight(0x4aa8ff, 0.8, 30);
      fill.position.set(-8, 4, -5);
      this.scene.add(fill);
      this.fillLight = fill;
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x192430, roughness: 0.92, metalness: 0.08 });
      this.floorMaterial = floorMat;
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(56, 56), floorMat);
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
      const grid = new THREE.GridHelper(56, 56, 0x38546d, 0x1c2a38);
      grid.position.y = 0.012;
      this.scene.add(grid);
      this.arenaGrid = grid;
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b2732, roughness: 0.8, metalness: 0.18 });
      this.wallMaterial = wallMat;
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xd78a39, emissive: 0x3a1b06, roughness: 0.55 });
      this.trimMaterial = trimMat;
      const addBox = (w, h, d, x, y, z, mat = wallMat, obstacle = true) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        if (obstacle) this.obstacles.push(mesh);
        return mesh;
      };
      addBox(56, 5, 1, 0, 2.5, -28);
      addBox(56, 5, 1, 0, 2.5, 28);
      addBox(1, 5, 56, -28, 2.5, 0);
      addBox(1, 5, 56, 28, 2.5, 0);
      addBox(12, 0.08, 0.3, 0, 0.09, 1.5, trimMat, false);
      addBox(0.3, 0.08, 16, -9, 0.09, -8, trimMat, false);
      addBox(0.3, 0.08, 16, 9, 0.09, -8, trimMat, false);
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x334553, roughness: 0.82, metalness: 0.12 });
      this.crateMaterial = crateMat;
      const crateTrim = new THREE.MeshStandardMaterial({ color: 0xc2823e, roughness: 0.64 });
      [
        [-7, 0.8, 1, 2.4, 1.6, 2.4], [7, 0.8, -3, 2.2, 1.6, 2.2], [-13, 1.1, -9, 3.2, 2.2, 2], [12, 0.7, 8, 1.8, 1.4, 3.4], [2, 0.55, -14, 4.4, 1.1, 1.8], [-3, 0.65, 15, 2.2, 1.3, 2.2]
      ].forEach(([x, y, z, w, h, d]) => {
        addBox(w, h, d, x, y, z, crateMat);
        addBox(w + 0.04, 0.08, d + 0.04, x, y + h / 2 - 0.06, z, crateTrim, false);
      });
      addBox(0.22, 4.2, 0.22, -18, 2.1, -18, crateTrim, false);
      addBox(0.22, 4.2, 0.22, 18, 2.1, -18, crateTrim, false);
      this.scene.add(new THREE.AmbientLight(0x6c8099, 0.46));
    }

    buildGun() {
      this.gun = new THREE.Group();
      const metal = new THREE.MeshStandardMaterial({ color: 0x1d252c, roughness: 0.34, metalness: 0.7 });
      const grip = new THREE.MeshStandardMaterial({ color: 0x11161b, roughness: 0.68 });
      const accent = new THREE.MeshStandardMaterial({ color: 0xd58b3d, emissive: 0x281303, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.72), metal);
      body.position.set(0, 0, -0.23);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.55), grip);
      barrel.position.set(0, 0.02, -0.78);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.27, 0.18), grip);
      handle.position.set(0, -0.19, -0.02);
      handle.rotation.x = -0.2;
      const sight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.16), accent);
      sight.position.set(0, 0.12, -0.23);
      this.gun.add(body, barrel, handle, sight);
      this.gun.position.set(0.3, -0.26, -0.62);
      this.camera.add(this.gun);
      this.muzzle = new THREE.PointLight(0xffc46e, 0, 6);
      this.muzzle.position.set(0.3, -0.21, -1.1);
      this.camera.add(this.muzzle);
      this.gunRecoil = 0;
    }

    selectMap(key) {
      if (!this.mapData[key]) return;
      this.selectedMap = key;
      const map = this.mapData[key];
      $$('[data-cs2-map]', this.root).forEach((button) => {
        button.classList.toggle('is-active', button.dataset.cs2Map === key);
      });
      if (this.refs.selectedMapName) this.refs.selectedMapName.textContent = map.name;
      if (this.refs.mapLabel) this.refs.mapLabel.textContent = map.label;
      if (this.refs.mapDesc) this.refs.mapDesc.textContent = map.desc;
      this.applyMapTheme(key);
    }

    applyMapTheme(key) {
      const map = this.mapData[key] || this.mapData.mirage;
      if (!this.initialized) return;
      if (this.scene?.background) this.scene.background.setHex(map.bg);
      if (this.scene?.fog) this.scene.fog.color.setHex(map.fog);
      this.floorMaterial?.color.setHex(map.floor);
      this.wallMaterial?.color.setHex(map.wall);
      this.trimMaterial?.color.setHex(map.trim);
      this.trimMaterial?.emissive.setHex(map.fog);
      this.crateMaterial?.color.setHex(map.crate);
      this.sunLight?.color.setHex(map.sun);
      this.fillLight?.color.setHex(map.fill);
      this.hemiLight?.color.setHex(map.sun);
      if (this.refs.hudMapLabel) this.refs.hudMapLabel.textContent = `${map.name} · 竞技训练`;
    }

    returnToLobby() {
      this.running = false;
      this.paused = false;
      this.over = false;
      this.started = false;
      this.clearMatchmaking();
      this.clearWaveTimer();
      this.clearBots();
      this.clearTracers();
      this.keys.clear();
      if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      this.refs.startPanel.hidden = false;
      this.refs.hud.hidden = true;
      this.refs.damage.hidden = true;
    }

    updateLobbyCamera(dt) {
      this.lobbyTime = (this.lobbyTime || 0) + dt;
      if (this.gun) this.gun.visible = false;
      const angle = this.lobbyTime * 0.09;
      const radius = 14 + Math.sin(this.lobbyTime * 0.2) * 1.4;
      this.camera.position.set(Math.sin(angle) * radius, 5.5 + Math.sin(this.lobbyTime * 0.4) * 0.45, Math.cos(angle) * radius);
      this.camera.lookAt(0, 1.15, 0);
    }

    startLoop() {
      if (this.loopStarted) return;
      this.loopStarted = true;
      const loop = () => {
        this.raf = requestAnimationFrame(loop);
        if (!this.initialized) return;
        const open = WINDOW_OPEN('cs2');
        const active = WINDOW_ACTIVE('cs2');
        if (!open || (!active && this.running && !this.over)) {
          if (this.running && !this.paused && !this.over) this.pause();
          if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
          return;
        }
        this.resizeRenderer();
        const dt = Math.min(this.clock.getDelta(), 0.048);
        if (!this.started) this.updateLobbyCamera(dt);
        else if (this.gun) this.gun.visible = true;
        if (this.running && !this.paused && !this.over) this.update(dt);
        this.updateGun(dt);
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    }

    resizeRenderer() {
      const canvas = this.refs.canvas;
      const width = Math.max(2, canvas.clientWidth || 900);
      const height = Math.max(2, canvas.clientHeight || 520);
      if (this.lastWidth === width && this.lastHeight === height) return;
      this.lastWidth = width;
      this.lastHeight = height;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    start() {
      if (!this.ensure()) return;
      if (this.loadingTimer) clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      this.loadingActive = false;
      this.loadedOnce = true;
      this.clearMatchmaking();
      this.lobbyTime = 0;
      if (this.gun) this.gun.visible = true;
      this.clearWaveTimer();
      this.clearBots();
      this.clearTracers();
      this.running = true;
      this.paused = false;
      this.over = false;
      this.started = true;
      this.health = 100;
      this.ammo = 30;
      this.reserve = 90;
      this.kills = 0;
      this.score = 0;
      this.shots = 0;
      this.hits = 0;
      this.elapsed = 0;
      this.wave = 0;
      this.lastMap = this.selectedMap;
      this.applyMapTheme(this.selectedMap);
      this.player.set(0, 1.7, 9);
      this.yaw = 0;
      this.pitch = 0;
      this.reloading = false;
      this.nextShot = 0;
      clearTimeout(this.reloadTimer);
      this.keys.clear();
      this.refs.startPanel.hidden = true;
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      this.refs.loading.hidden = true;
      this.refs.hud.hidden = false;
      this.refs.fatal.hidden = true;
      this.refs.damage.hidden = true;
      this.refs.startBtn?.blur();
      this.refs.retryBtn?.blur();
      this.refs.resumeBtn?.blur();
      this.updateHUD();
      this.spawnWave(4);
      this.clock.getDelta();
      this.requestLock();
    }

    resume(requestLock = true) {
      if (this.over) return;
      this.paused = false;
      this.refs.pausePanel.hidden = true;
      this.refs.hud.hidden = false;
      this.refs.resumeBtn?.blur();
      this.clock.getDelta();
      if (requestLock) this.requestLock();
    }

    pause() {
      if (!this.running || this.over || this.paused) return;
      this.paused = true;
      this.keys.clear();
      this.refs.pausePanel.hidden = false;
      this.refs.hud.hidden = false;
    }

    startGameOrResume() {
      if (!this.started) return this.start();
      if (this.over) return this.start();
      this.resume();
    }

    showLobby() {
      this.refs.loading.hidden = true;
      this.refs.startPanel.hidden = false;
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      this.refs.hud.hidden = true;
      this.refs.damage.hidden = true;
    }

    playLoading(onDone) {
      if (this.loadingActive) return;
      this.loadingActive = true;
      this.refs.loading.hidden = false;
      this.refs.startPanel.hidden = true;
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      this.refs.hud.hidden = true;
      const stages = [
        '正在校验本地比赛文件…',
        '正在加载地图与出生点数据…',
        '正在编译低模光照与烟雾体积…',
        '正在连接本地 128 tick 服务器…',
        '热身服务器已就绪…'
      ];
      let progress = 0;
      const renderProgress = () => {
        this.refs.loadingBar.style.width = `${progress}%`;
        this.refs.loadingPercent.textContent = `${Math.floor(progress)}%`;
        this.refs.loadingStage.textContent = stages[Math.min(stages.length - 1, Math.floor(progress / 22))];
      };
      renderProgress();
      clearInterval(this.loadingTimer);
      this.loadingTimer = setInterval(() => {
        progress = Math.min(100, progress + 2.2 + Math.random() * 3.4);
        renderProgress();
        if (progress >= 100) {
          clearInterval(this.loadingTimer);
          this.loadingTimer = null;
          setTimeout(() => this.finishLoading(onDone), 320);
        }
      }, 100);
    }

    finishLoading(onDone = null) {
      if (!this.loadingActive) return;
      this.loadingActive = false;
      this.loadedOnce = true;
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      if (onDone) onDone();
      else this.showLobby();
    }

    open() {
      this.ensure();
      if (!this.started) {
        if (!this.loadedOnce && !this.loadingActive) {
          this.playLoading(() => this.showLobby());
        } else if (!this.loadingActive) {
          this.showLobby();
        }
      } else if (this.paused) {
        this.refs.pausePanel.hidden = false;
      }
    }

    clearMatchmaking(restoreLobby = false) {
      if (this.matchTimer) clearInterval(this.matchTimer);
      this.matchTimer = null;
      this.matchmaking = null;
      if (this.refs.matchPanel) this.refs.matchPanel.hidden = true;
      if (this.refs.matchAccept) this.refs.matchAccept.hidden = true;
      if (this.refs.matchCancel) this.refs.matchCancel.textContent = '取消匹配';
      if (restoreLobby && !this.started) this.refs.startPanel.hidden = false;
    }

    renderMatchRoster(found) {
      const names = ['Sniper', 'Kai', 'Nova', 'Mira', 'Pixel', 'Iris', 'Rowan', 'Ghost', 'Slime', 'Void'];
      this.refs.matchRosters.forEach((container, teamIndex) => {
        container.replaceChildren();
        for (let index = 0; index < 5; index += 1) {
          const slotIndex = teamIndex * 5 + index;
          const filled = slotIndex < found;
          const slot = document.createElement('span');
          slot.className = `cs2-roster-slot${filled ? ' is-filled' : ''}`;
          slot.innerHTML = filled ? `<i>${escapeHTML(names[slotIndex][0])}</i><b>${escapeHTML(names[slotIndex])}</b>` : '<i>+</i><b>等待</b>';
          container.appendChild(slot);
        }
      });
    }

    startMatchmaking() {
      if (!this.ensure() || this.matchmaking) return;
      this.clearMatchmaking();
      const map = this.mapData[this.selectedMap] || this.mapData.mirage;
      this.refs.matchPanel.hidden = false;
      this.refs.matchTitle.textContent = '正在搜索比赛';
      this.refs.matchStatus.textContent = '正在评估延迟、段位与地图偏好…';
      this.refs.matchMapName.textContent = map.name;
      this.refs.matchAccept.hidden = true;
      this.refs.matchCancel.textContent = '取消匹配';
      this.refs.matchCancel.hidden = false;
      this.refs.matchClock.textContent = '00:00';
      this.refs.matchPing.textContent = '8 ms';
      this.renderMatchRoster(1);
      this.matchmaking = { elapsed: 0, found: 1, phase: 'searching', map: this.selectedMap };
      this.matchTimer = setInterval(() => {
        if (!this.matchmaking) return;
        this.matchmaking.elapsed += 0.6;
        const elapsed = this.matchmaking.elapsed;
        this.refs.matchClock.textContent = `00:${String(Math.floor(elapsed)).padStart(2, '0')}`;
        this.refs.matchPing.textContent = `${Math.round(6 + Math.random() * 9)} ms`;
        if (elapsed > 0.8 && this.matchmaking.found < 10) {
          this.matchmaking.found = Math.min(10, 1 + Math.floor(elapsed / 0.62));
          this.renderMatchRoster(this.matchmaking.found);
          this.refs.matchStatus.textContent = this.matchmaking.found < 10
            ? `已找到 ${this.matchmaking.found} / 10 名玩家 · 正在同步段位…`
            : '所有玩家已连接，正在确认服务器…';
        }
        if (this.matchmaking.found >= 10 && this.matchmaking.phase !== 'ready') {
          this.matchmaking.phase = 'ready';
          clearInterval(this.matchTimer);
          this.matchTimer = null;
          this.refs.matchTitle.textContent = '比赛已找到';
          this.refs.matchStatus.textContent = '10 名玩家已就绪 · 点击接受进入 de_' + this.matchmaking.map;
          this.refs.matchAccept.hidden = false;
          this.refs.matchCancel.textContent = '拒绝';
        }
      }, 600);
    }

    acceptMatch() {
      if (!this.matchmaking || this.matchmaking.phase !== 'ready') return;
      const mapKey = this.matchmaking.map;
      this.clearMatchmaking();
      this.host?.showToast?.({ title: '比赛已接受', message: '正在连接本地服务器…', icon: 'app-steam' });
      setTimeout(() => {
        if (mapKey && this.mapData[mapKey]) this.selectMap(mapKey);
        this.start();
      }, 450);
    }

    cancelMatchmaking() {
      const wasReady = this.matchmaking?.phase === 'ready';
      this.clearMatchmaking(true);
      this.host?.showToast?.({ title: wasReady ? '已拒绝比赛' : '已取消匹配', message: wasReady ? '已离开比赛确认窗口。' : '可以重新选择地图或开始本地比赛。', icon: 'app-steam' });
    }

    reset() {
      this.running = false;
      this.paused = false;
      this.over = false;
      this.started = false;
      this.clearWaveTimer();
      this.clearBots();
      this.clearTracers();
      if (this.loadingTimer) clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      this.loadingActive = false;
      this.clearMatchmaking();
      if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
      this.refs.startPanel.hidden = false;
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      this.refs.loading.hidden = true;
      this.refs.hud.hidden = true;
      this.refs.fatal.hidden = true;
      this.refs.damage.hidden = true;
    }

    spawnWave(count) {
      if (this.over) return;
      this.clearWaveTimer();
      this.clearBots();
      this.wave += 1;
      const total = count ?? Math.min(4 + this.wave, 9);
      for (let index = 0; index < total; index += 1) this.createBot(index, total);
      this.updateWaveHUD();
    }

    createBot(index, total) {
      const group = new THREE.Group();
      const angle = (Math.PI * 2 * index) / Math.max(1, total) + Math.random() * 0.4;
      const radius = 12 + Math.random() * 8;
      group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      const bot = {
        group,
        name: `BOT ${String(index + 1).padStart(2, '0')}`,
        health: 100,
        alive: true,
        speed: 1.15 + Math.random() * 0.55 + this.wave * 0.06,
        fireTimer: 900 + Math.random() * 1100,
        bob: Math.random() * Math.PI * 2
      };
      group.userData.bot = bot;
      const bodyMat = new THREE.MeshStandardMaterial({ color: index % 2 ? 0xb64b3a : 0x9b5d34, roughness: 0.72, metalness: 0.08 });
      const headMat = new THREE.MeshStandardMaterial({ color: 0xd0a982, roughness: 0.82 });
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x2e353d, roughness: 0.55, metalness: 0.28 });
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xffa43c, emissive: 0x8c3506, emissiveIntensity: 0.9 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.16, 0.44), bodyMat);
      body.position.y = 1.16;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.43, 0.43), headMat);
      head.position.y = 1.95;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.1, 0.05), glowMat);
      visor.position.set(0, 1.98, 0.23);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.1), armorMat);
      chest.position.set(0, 1.42, 0.24);
      const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.28), armorMat);
      legLeft.position.set(-0.2, 0.34, 0);
      const legRight = legLeft.clone();
      legRight.position.x = 0.2;
      const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.2), bodyMat);
      armLeft.position.set(-0.48, 1.22, 0);
      armLeft.rotation.z = -0.16;
      const armRight = armLeft.clone();
      armRight.position.x = 0.48;
      armRight.rotation.z = 0.16;
      [body, head, visor, chest, legLeft, legRight, armLeft, armRight].forEach((part) => {
        part.userData.bot = bot;
        group.add(part);
        if (part === head) part.userData.part = 'head';
        this.botHitMeshes.push(part);
      });
      const label = makeLabel(bot.name, '#ffbd7f');
      label.position.y = 2.52;
      group.add(label);
      const light = new THREE.PointLight(0xff7d3e, 0.35, 3);
      light.position.set(0, 1.3, 0.35);
      group.add(light);
      this.scene.add(group);
      this.bots.push(bot);
    }

    clearBots() {
      this.bots.forEach((bot) => {
        this.scene?.remove(bot.group);
        bot.group.traverse((child) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            if (child.material.map) child.material.map.dispose?.();
            child.material.dispose?.();
          }
        });
      });
      this.bots = [];
      this.botHitMeshes = [];
    }

    clearWaveTimer() {
      if (this.waveTimer) clearTimeout(this.waveTimer);
      this.waveTimer = null;
    }

    clearTracers() {
      this.tracers.forEach((tracer) => {
        this.scene?.remove(tracer.line);
        tracer.line.geometry.dispose?.();
        tracer.line.material.dispose?.();
      });
      this.tracers = [];
    }

    update(dt) {
      this.elapsed += dt;
      this.movePlayer(dt);
      this.updateBots(dt);
      this.updateTracers(dt);
      this.updateHUD();
      if (this.bots.length && this.bots.every((bot) => !bot.alive) && !this.waveTimer && !this.over) {
        this.waveTimer = setTimeout(() => this.spawnWave(this.wave + 4), 1050);
      }
    }

    movePlayer(dt) {
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const direction = new THREE.Vector3();
      if (this.keys.has('KeyW')) direction.add(forward);
      if (this.keys.has('KeyS')) direction.sub(forward);
      if (this.keys.has('KeyD')) direction.add(right);
      if (this.keys.has('KeyA')) direction.sub(right);
      if (direction.lengthSq() > 0) {
        direction.normalize().multiplyScalar((this.keys.has('ShiftLeft') ? 7.2 : 5.2) * dt);
        this.player.add(direction);
      }
      this.player.x = clamp(this.player.x, -25.5, 25.5);
      this.player.z = clamp(this.player.z, -25.5, 25.5);
      this.camera.position.copy(this.player);
      this.camera.position.y = 1.72 + Math.sin(this.elapsed * 10) * 0.012;
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    updateBots(dt) {
      const playerPos = new THREE.Vector3(this.player.x, 1.1, this.player.z);
      this.bots.forEach((bot) => {
        if (!bot.alive) return;
        const pos = bot.group.position;
        const toPlayer = new THREE.Vector3(this.player.x - pos.x, 0, this.player.z - pos.z);
        const distance = toPlayer.length();
        if (distance > 3.2) {
          toPlayer.normalize();
          pos.x += toPlayer.x * bot.speed * dt;
          pos.z += toPlayer.z * bot.speed * dt;
        }
        bot.bob += dt * 3.2;
        bot.group.position.y = Math.sin(bot.bob) * 0.025;
        bot.group.rotation.y = Math.atan2(this.player.x - pos.x, this.player.z - pos.z);
        if (distance < 15 && !this.over) {
          bot.fireTimer -= dt * 1000;
          if (bot.fireTimer <= 0 && this.hasLineOfSight(bot, playerPos)) {
            bot.fireTimer = 950 + Math.random() * 1150;
            this.enemyShoot(bot);
          }
        }
      });
    }

    hasLineOfSight(bot, playerPos) {
      const origin = new THREE.Vector3(bot.group.position.x, 1.85, bot.group.position.z);
      const dir = playerPos.clone().sub(origin);
      const distance = dir.length();
      if (distance < 0.5) return true;
      dir.normalize();
      const ray = new THREE.Raycaster(origin, dir, 0.1, distance);
      const hits = ray.intersectObjects(this.obstacles, false);
      return hits.length === 0;
    }

    enemyShoot(bot) {
      const origin = new THREE.Vector3(bot.group.position.x, 1.8, bot.group.position.z);
      const target = this.camera.position.clone();
      const spread = new THREE.Vector3((Math.random() - 0.5) * 0.65, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.65);
      target.add(spread);
      this.addTracer(origin, target, 0xff5a3c, 0.8);
      if (Math.random() < 0.69) {
        const damage = 5 + Math.floor(Math.random() * 7);
        this.health = Math.max(0, this.health - damage);
        this.flashDamage();
        if (this.health <= 0) this.endGame();
      }
    }

    addTracer(from, to, color = 0xffc56d, opacity = 0.75) {
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this.tracers.push({ line, life: 0.09 });
    }

    updateTracers(dt) {
      this.tracers.forEach((tracer) => {
        tracer.life -= dt;
        tracer.line.material.opacity = Math.max(0, tracer.life / 0.09) * 0.75;
      });
      this.tracers.filter((tracer) => tracer.life <= 0).forEach((tracer) => {
        this.scene.remove(tracer.line);
        tracer.line.geometry.dispose?.();
        tracer.line.material.dispose?.();
      });
      this.tracers = this.tracers.filter((tracer) => tracer.life > 0);
    }

    updateGun(dt) {
      if (!this.gun) return;
      this.gunRecoil = Math.max(0, this.gunRecoil - dt * 8.5);
      this.gun.position.z = -0.62 + this.gunRecoil * 0.08;
      this.gun.rotation.x = -this.gunRecoil * 0.04;
      if (this.muzzle) this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 26);
    }

    shoot() {
      if (!this.running || this.paused || this.over || this.reloading) return;
      const now = performance.now();
      if (now < this.nextShot) return;
      if (this.ammo <= 0) {
        this.reload();
        return;
      }
      this.nextShot = now + 112;
      this.ammo -= 1;
      this.shots += 1;
      this.gunRecoil = 1;
      if (this.muzzle) this.muzzle.intensity = 2.2;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
      const hits = raycaster.intersectObjects(this.botHitMeshes, false);
      const origin = this.camera.position.clone().add(new THREE.Vector3(0, -0.2, 0));
      if (hits.length) {
        const hit = hits[0];
        const bot = hit.object.userData.bot;
        if (bot && bot.alive) {
          const headshot = hit.object.userData.part === 'head';
          const damage = headshot ? 120 : 36;
          bot.health -= damage;
          this.hits += 1;
          this.showHitmarker(headshot);
          this.addTracer(origin, hit.point, headshot ? 0xffe0a0 : 0xffb35c, 0.85);
          if (bot.health <= 0) this.killBot(bot, headshot);
        }
      } else {
        const end = origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(60));
        this.addTracer(origin, end, 0xffd18b, 0.5);
      }
      this.updateHUD();
    }

    killBot(bot, headshot) {
      bot.alive = false;
      bot.group.visible = false;
      this.kills += 1;
      this.score += headshot ? 200 : 100;
      this.addKillfeed(`你 ${headshot ? '⌖ 爆头' : '✕'} ${bot.name}`);
      this.showHitmarker(headshot);
      if (this.bots.every((entry) => !entry.alive)) this.score += 250;
      this.updateHUD();
    }

    showHitmarker(headshot = false) {
      const marker = this.refs.hitmarker;
      if (!marker) return;
      marker.hidden = false;
      marker.classList.toggle('is-headshot', headshot);
      clearTimeout(this.hitmarkerTimer);
      this.hitmarkerTimer = setTimeout(() => { marker.hidden = true; marker.classList.remove('is-headshot'); }, 125);
    }

    flashDamage() {
      const flash = this.refs.damage;
      if (!flash) return;
      flash.hidden = false;
      clearTimeout(this.damageTimer);
      this.damageTimer = setTimeout(() => { flash.hidden = true; }, 130);
    }

    addKillfeed(text) {
      if (!this.refs.killfeed) return;
      const row = document.createElement('div');
      row.className = 'cs2-kill-row';
      row.innerHTML = `<span>YOU</span><b>${text.replace(/^你\s*/, '')}</b>`;
      this.refs.killfeed.prepend(row);
      while (this.refs.killfeed.children.length > 4) this.refs.killfeed.lastElementChild.remove();
      setTimeout(() => row.remove(), 5000);
    }

    reload() {
      if (this.reloading || this.ammo === 30 || this.reserve <= 0) return;
      this.reloading = true;
      this.refs.ammo.textContent = '—';
      clearTimeout(this.reloadTimer);
      this.reloadTimer = setTimeout(() => {
        const needed = 30 - this.ammo;
        const take = Math.min(needed, this.reserve);
        this.ammo += take;
        this.reserve -= take;
        this.reloading = false;
        this.updateHUD();
      }, 1350);
    }

    updateHUD() {
      if (!this.refs) return;
      this.refs.health.textContent = String(Math.max(0, Math.round(this.health)));
      if (this.refs.healthFill) this.refs.healthFill.style.width = `${clamp(this.health, 0, 100)}%`;
      if (!this.reloading) this.refs.ammo.textContent = String(this.ammo).padStart(2, '0');
      this.refs.reserve.textContent = String(this.reserve);
      this.refs.kills.textContent = String(this.kills);
      this.refs.timer.textContent = `${String(Math.floor(this.elapsed / 60)).padStart(2, '0')}:${String(Math.floor(this.elapsed % 60)).padStart(2, '0')}`;
    }

    updateWaveHUD() {
      if (this.refs.wave) this.refs.wave.textContent = String(this.wave).padStart(2, '0');
    }

    endGame() {
      if (this.over) return;
      this.over = true;
      this.running = false;
      this.paused = false;
      this.keys.clear();
      if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
      const accuracy = this.shots ? Math.round((this.hits / this.shots) * 100) : 0;
      this.refs.finalKills.textContent = String(this.kills);
      this.refs.finalAccuracy.textContent = `${accuracy}%`;
      this.refs.finalWave.textContent = String(this.wave);
      this.refs.finalScore.textContent = String(this.score);
      this.refs.overPanel.hidden = false;
      this.refs.pausePanel.hidden = true;
      this.refs.hud.hidden = true;
      this.clearWaveTimer();
    }
  }

  /* ==========================================================================
     VRChat — Midnight Lounge
     ========================================================================== */

  class VRChatGame {
    constructor(root, host = {}) {
      this.root = root;
      this.host = host;
      this.win = document.getElementById('window-vrchat');
      this.initialized = false;
      this.started = false;
      this.keys = new Set();
      this.playerColor = '#f3a35c';
      this.worldKey = 'midnight';
      this.nearestNpc = null;
      this.activeNpc = null;
      this.muted = false;
      this.dancing = false;
      this.waveTime = 0;
      this.chatHistory = {};
      this.yaw = 0;
      this.pitch = -0.02;
      this.spawnPoint = new THREE.Vector3(0, 0, 9.6);
      this.radialOpen = false;
      this.lookLocked = false;
      this.loadedOnce = false;
      this.loadingActive = false;
      this.loadingTimer = null;
      this.buildUI();
      this.bindUI();
    }

    buildUI() {
      this.root.innerHTML = `
        <div class="vrchat-stage">
          <canvas class="vrchat-canvas" aria-label="VRChat 世界画面"></canvas>
          <div class="vrchat-vignette"></div>
          <section class="vrchat-loading-screen">
            <div class="vrchat-load-aurora"></div>
            <div class="vrchat-load-grid"></div>
            <div class="vrchat-load-orb"><span>VRC</span><i></i><i></i><i></i></div>
            <span class="vrchat-load-kicker"><i></i>VRChat · LOCAL INSTANCE</span>
            <h2>正在连接世界</h2>
            <p class="vrchat-load-copy">正在读取世界清单、下载低模资源，并把你的化身放进初始出生点。</p>
            <div class="vrchat-load-track"><i class="vrchat-load-bar"></i></div>
            <div class="vrchat-load-meta"><b class="vrchat-load-percent">0%</b><span class="vrchat-load-stage">正在验证本地账户…</span></div>
            <div class="vrchat-load-foot"><span>第一人称 · 本地世界</span><button type="button" class="vrchat-secondary-btn vrchat-load-skip">跳过加载</button></div>
          </section>
          <div class="vrchat-hud" hidden>
            <div class="vrchat-top">
              <div class="vrchat-world-chip"><span>WORLD</span><b class="vrchat-world-name">Midnight Lounge</b><small class="vrchat-world-instance">公开实例 · 9 人在线</small></div>
              <div class="vrchat-actions">
                <button data-vrchat-action="world" class="vrchat-hud-btn"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg>世界</button>
                <button data-vrchat-action="avatar" class="vrchat-hud-btn"><svg viewBox="0 0 24 24"><use href="#i-user"></use></svg>装扮</button>
                <button data-vrchat-action="gesture" class="vrchat-hud-btn"><svg viewBox="0 0 24 24"><use href="#i-spark"></use></svg>手势</button>
                <button data-vrchat-action="mic" class="vrchat-hud-btn"><svg viewBox="0 0 24 24"><use href="#i-sound"></use></svg><span>麦克风</span></button>
              </div>
            </div>
            <div class="vrchat-roster">
              <div class="vrchat-roster-head"><span>世界内玩家</span><b>9</b></div>
              <div class="vrchat-player-row"><span class="vrchat-mini-avatar" style="--p:#f3a35c">S</span><div><b>Sniper</b><small>你 · 在线</small></div><i></i></div>
              <div class="vrchat-player-row"><span class="vrchat-mini-avatar" style="--p:#f3a35c">M</span><div><b>Mira</b><small>Aperture 工作室</small></div><i></i></div>
              <div class="vrchat-player-row"><span class="vrchat-mini-avatar" style="--p:#8d7dff">K</span><div><b>Kai</b><small>VOID SIGNAL</small></div><i></i></div>
              <div class="vrchat-player-row"><span class="vrchat-mini-avatar" style="--p:#63d9c4">N</span><div><b>Nova</b><small>正在跳舞</small></div><i></i></div>
              <div class="vrchat-player-row"><span class="vrchat-mini-avatar" style="--p:#ff93b6">P</span><div><b>Pixel</b><small>Midnight Lounge</small></div><i></i></div>
            </div>
            <div class="vrchat-prompt" hidden><span class="vrchat-key">E</span><div><b class="vrchat-prompt-name">Mira</b><small>按 E 或点击交谈</small></div><button data-vrchat-action="interact">交谈</button></div>
            <div class="vrchat-controls-card">
              <span>WASD 移动</span><span>鼠标环视</span><span>R 打开轮盘</span><span>E 交谈</span><span>Esc 释放鼠标</span>
            </div>
            <div class="vrchat-mic-chip"><i></i><span>麦克风开启</span></div>
          </div>
          <div class="vrchat-overlay vrchat-start-panel">
            <div class="vrchat-wordmark"><span>VRC</span><b>VRChat</b><small>Social VR</small></div>
            <div class="vrchat-world-preview">
              <span class="vrchat-preview-glow"></span><i></i><i></i><i></i>
              <div><span>推荐世界</span><h2 class="vrchat-start-world-name">Midnight Lounge</h2><p class="vrchat-start-world-copy">霓虹、音乐和低模朋友。一个适合第一次见面的小世界。</p></div>
            </div>
            <div class="vrchat-start-actions">
              <button class="vrchat-primary-btn" data-vrchat-action="enter">进入出生点</button>
              <button class="vrchat-secondary-btn" data-vrchat-action="world">选择世界</button>
            </div>
            <div class="vrchat-start-meta"><span>第一人称</span><span>出生点 · Midnight Lounge</span><span>9 人在线</span><span>R 打开轮盘</span></div>
          </div>
          <div class="vrchat-overlay vrchat-world-panel" hidden>
            <div class="vrchat-panel-head"><div><span>探索世界</span><h2>选择目的地</h2></div><button data-vrchat-action="close-world" aria-label="关闭世界选择"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></div>
            <div class="vrchat-world-grid">
              <button data-vrchat-world="midnight" class="is-active"><span class="vrchat-world-art art-midnight">ML</span><div><b>Midnight Lounge</b><small>霓虹酒馆 · 社交</small></div></button>
              <button data-vrchat-world="garden"><span class="vrchat-world-art art-garden">SG</span><div><b>Starry Garden</b><small>星空庭院 · 放松</small></div></button>
              <button data-vrchat-world="pug"><span class="vrchat-world-art art-pug">GP</span><div><b>The Great Pug</b><small>经典酒吧 · 热闹</small></div></button>
            </div>
            <p>世界切换会同步改变房间灯光、配色与氛围。</p>
          </div>
          <div class="vrchat-overlay vrchat-avatar-panel" hidden>
            <div class="vrchat-panel-head"><div><span>个人空间</span><h2>装扮</h2></div><button data-vrchat-action="close-avatar" aria-label="关闭装扮"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></div>
            <div class="vrchat-avatar-preview"><span class="vrchat-avatar-silhouette"><i></i><b></b><em></em></span><div><b>Sniper</b><span>Robo-Sniper · 本地预设</span><small>当前颜色</small></div></div>
            <div class="vrchat-color-row">
              <button data-vrchat-color="#f3a35c" style="--c:#f3a35c" class="is-active" aria-label="暖阳"></button>
              <button data-vrchat-color="#8d7dff" style="--c:#8d7dff" aria-label="鸢尾"></button>
              <button data-vrchat-color="#63d9c4" style="--c:#63d9c4" aria-label="信号"></button>
              <button data-vrchat-color="#ff93b6" style="--c:#ff93b6" aria-label="霓虹粉"></button>
            </div>
            <p>主题色会立即应用到你的低模化身。</p>
          </div>
          <div class="vrchat-overlay vrchat-gesture-panel" hidden>
            <div class="vrchat-panel-head"><div><span>快捷动作</span><h2>手势与表情</h2></div><button data-vrchat-action="close-gesture" aria-label="关闭手势"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></div>
            <div class="vrchat-gesture-grid">
              <button data-vrchat-gesture="wave"><span>👋</span><b>挥手</b></button>
              <button data-vrchat-gesture="dance"><span>🕺</span><b>跳舞</b></button>
              <button data-vrchat-gesture="bow"><span>🙇</span><b>鞠躬</b></button>
              <button data-vrchat-gesture="peace"><span>✌️</span><b>比耶</b></button>
            </div>
            <p>动作会在角色身上播放，并向附近玩家显示气泡。</p>
          </div>
          <div class="vrchat-chat" hidden>
            <header class="vrchat-chat-head"><span class="vrchat-chat-avatar">M</span><div><b class="vrchat-chat-name">Mira</b><span class="vrchat-chat-status">在线 · Aperture 工作室</span></div><button data-vrchat-action="close-chat" aria-label="关闭聊天"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></header>
            <div class="vrchat-chat-log"></div>
            <form class="vrchat-chat-form"><input type="text" placeholder="说点什么…" autocomplete="off" aria-label="聊天内容"><button type="submit" aria-label="发送"><svg viewBox="0 0 24 24"><use href="#i-arrow-up"></use></svg></button></form>
          </div>
          <div class="vrchat-lock-hint" hidden><span><svg viewBox="0 0 24 24"><use href="#i-control"></use></svg></span><b>鼠标未捕获</b><small>点击画面继续环视 · 方向键也可转向</small></div>
          <div class="vrchat-radial" hidden>
            <div class="vrchat-radial-backdrop"></div>
            <div class="vrchat-radial-wheel">
              <div class="vrchat-radial-ring"></div>
              <button class="vrchat-radial-item r-world" data-vrchat-radial="world"><span>🌐</span><b>世界</b><small>切换目的地</small></button>
              <button class="vrchat-radial-item r-avatar" data-vrchat-radial="avatar"><span>🧍</span><b>装扮</b><small>更换颜色</small></button>
              <button class="vrchat-radial-item r-gesture" data-vrchat-radial="gesture"><span>👋</span><b>手势</b><small>动作与表情</small></button>
              <button class="vrchat-radial-item r-mic" data-vrchat-radial="mic"><span>🎙</span><b>麦克风</b><small>切换静音</small></button>
              <button class="vrchat-radial-item r-respawn" data-vrchat-radial="respawn"><span>◎</span><b>重生</b><small>回到出生点</small></button>
              <button class="vrchat-radial-center" data-vrchat-radial="close"><span>R</span><small>关闭轮盘</small></button>
            </div>
            <p class="vrchat-radial-note">按 R 或点击中心关闭 · 轮盘打开时鼠标会释放</p>
          </div>
          <div class="vrchat-toast-bubble" hidden></div>
          <div class="vrchat-fatal" hidden><b>世界载入失败</b><span>请确认 WebGL 可用后重试。</span></div>
        </div>`;
      this.refs = {
        canvas: $('.vrchat-canvas', this.root),
        hud: $('.vrchat-hud', this.root),
        startPanel: $('.vrchat-start-panel', this.root),
        worldPanel: $('.vrchat-world-panel', this.root),
        avatarPanel: $('.vrchat-avatar-panel', this.root),
        gesturePanel: $('.vrchat-gesture-panel', this.root),
        chat: $('.vrchat-chat', this.root),
        chatLog: $('.vrchat-chat-log', this.root),
        chatName: $('.vrchat-chat-name', this.root),
        chatStatus: $('.vrchat-chat-status', this.root),
        chatForm: $('.vrchat-chat-form', this.root),
        chatInput: $('.vrchat-chat-form input', this.root),
        prompt: $('.vrchat-prompt', this.root),
        promptName: $('.vrchat-prompt-name', this.root),
        worldName: $('.vrchat-world-name', this.root),
        worldInstance: $('.vrchat-world-instance', this.root),
        startWorldName: $('.vrchat-start-world-name', this.root),
        startWorldCopy: $('.vrchat-start-world-copy', this.root),
        micChip: $('.vrchat-mic-chip', this.root),
        toast: $('.vrchat-toast-bubble', this.root),
        radial: $('.vrchat-radial', this.root),
        lockHint: $('.vrchat-lock-hint', this.root),
        fatal: $('.vrchat-fatal', this.root),
        loading: $('.vrchat-loading-screen', this.root),
        loadingBar: $('.vrchat-load-bar', this.root),
        loadingPercent: $('.vrchat-load-percent', this.root),
        loadingStage: $('.vrchat-load-stage', this.root),
        loadingSkip: $('.vrchat-load-skip', this.root)
      };
    }

    bindUI() {
      this.refs.loadingSkip?.addEventListener('click', () => this.finishLoading());
      this.root.addEventListener('click', (event) => {
        const world = event.target.closest('[data-vrchat-world]');
        if (world) { this.setWorld(world.dataset.vrchatWorld); return; }
        const color = event.target.closest('[data-vrchat-color]');
        if (color) { this.setPlayerColor(color.dataset.vrchatColor); return; }
        const gesture = event.target.closest('[data-vrchat-gesture]');
        if (gesture) { this.playGesture(gesture.dataset.vrchatGesture); return; }
        const radial = event.target.closest('[data-vrchat-radial]');
        if (radial) { this.handleRadial(radial.dataset.vrchatRadial); return; }
        const action = event.target.closest('[data-vrchat-action]');
        if (!action) return;
        const name = action.dataset.vrchatAction;
        if (name === 'enter') this.start();
        else if (name === 'world' || name === 'avatar' || name === 'gesture') this.openPanel(name);
        else if (name === 'mic') this.toggleMic();
        else if (name === 'interact') this.openChat(this.nearestNpc);
        else if (name === 'close-world') this.closePanel('world');
        else if (name === 'close-avatar') this.closePanel('avatar');
        else if (name === 'close-gesture') this.closePanel('gesture');
        else if (name === 'close-chat') this.closeChat();
      });
      this.refs.chatForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = this.refs.chatInput.value.trim();
        if (!value || !this.activeNpc) return;
        this.pushChatMessage('me', value);
        this.refs.chatInput.value = '';
        this.scheduleNpcReply();
      });
      this.refs.canvas?.addEventListener('pointerdown', (event) => {
        if (!this.started) return;
        if (this.anyOverlayOpen()) return;
        if (document.pointerLockElement !== this.refs.canvas) {
          this.requestLook();
        } else if (event.button === 0) {
          this.pickNpc(new THREE.Vector2(0, 0));
        }
      });
      document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement !== this.refs.canvas) return;
        if (!this.started || this.anyOverlayOpen()) return;
        this.yaw -= event.movementX * 0.0022;
        this.pitch = clamp(this.pitch - event.movementY * 0.0018, -1.18, 1.18);
      });
      document.addEventListener('pointerlockchange', () => {
        this.lookLocked = document.pointerLockElement === this.refs.canvas;
        this.updateLookHint();
      });
      document.addEventListener('keydown', (event) => {
        if (!this.started) return;
        if (!WINDOW_ACTIVE('vrchat')) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (event.code === 'KeyR') {
          event.preventDefault();
          if (!event.repeat) this.toggleRadial();
          return;
        }
        if (event.code === 'Escape') {
          if (this.radialOpen) { event.preventDefault(); this.closeRadial(true); return; }
          if (!this.refs.worldPanel.hidden) { event.preventDefault(); this.closePanel('world'); return; }
          if (!this.refs.avatarPanel.hidden) { event.preventDefault(); this.closePanel('avatar'); return; }
          if (!this.refs.gesturePanel.hidden) { event.preventDefault(); this.closePanel('gesture'); return; }
          if (!this.refs.chat.hidden) { event.preventDefault(); this.closeChat(); return; }
        }
        if (this.anyOverlayOpen()) return;
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
        if (event.code === 'KeyE') { this.openChat(this.nearestNpc); return; }
        if (event.code === 'ArrowLeft') { this.yaw += 0.04; return; }
        if (event.code === 'ArrowRight') { this.yaw -= 0.04; return; }
        if (event.code === 'ArrowUp') { this.pitch = clamp(this.pitch + 0.032, -1.18, 1.18); return; }
        if (event.code === 'ArrowDown') { this.pitch = clamp(this.pitch - 0.032, -1.18, 1.18); return; }
        this.keys.add(event.code);
      });
      document.addEventListener('keyup', (event) => this.keys.delete(event.code));
      window.addEventListener('blur', () => this.keys.clear());
    }

    anyOverlayOpen() {
      return Boolean(this.radialOpen || !this.refs.worldPanel.hidden || !this.refs.avatarPanel.hidden || !this.refs.gesturePanel.hidden || !this.refs.chat.hidden);
    }

    requestLook() {
      if (!this.started || this.anyOverlayOpen()) return;
      try {
        const result = this.refs.canvas?.requestPointerLock?.();
        if (result?.catch) result.catch(() => {});
      } catch (error) {
        /* Arrow keys remain available as a fallback. */
      }
      this.updateLookHint();
    }

    releaseLook() {
      if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
    }

    updateLookHint() {
      if (!this.refs.lockHint) return;
      const show = this.started && !this.lookLocked && !this.anyOverlayOpen() && WINDOW_OPEN('vrchat');
      this.refs.lockHint.hidden = !show;
    }

    openPanel(name) {
      if (!['world', 'avatar', 'gesture'].includes(name) || !this.started) {
        if (name !== 'world' || this.started) return;
      }
      if (this.started) this.releaseLook();
      this.radialOpen = false;
      if (this.refs.radial) this.refs.radial.hidden = true;
      this.refs.worldPanel.hidden = name !== 'world';
      this.refs.avatarPanel.hidden = name !== 'avatar';
      this.refs.gesturePanel.hidden = name !== 'gesture';
      this.refs.chat.hidden = true;
      this.refs.chatInput?.blur();
      this.refs.prompt.hidden = true;
      this.keys.clear();
      this.updateLookHint();
    }

    closePanel(name) {
      if (name === 'world') this.refs.worldPanel.hidden = true;
      else if (name === 'avatar') this.refs.avatarPanel.hidden = true;
      else if (name === 'gesture') this.refs.gesturePanel.hidden = true;
      this.updateLookHint();
      if (!this.anyOverlayOpen()) this.requestLook();
    }

    toggleRadial(force = null) {
      if (!this.started) return;
      const open = force === null ? !this.radialOpen : Boolean(force);
      if (open) {
        this.releaseLook();
        this.closeAllPanels();
        this.radialOpen = true;
        this.refs.radial.hidden = false;
        this.keys.clear();
      } else {
        this.radialOpen = false;
        this.refs.radial.hidden = true;
        this.requestLook();
      }
      this.updateLookHint();
    }

    closeRadial(resume = true) {
      this.radialOpen = false;
      if (this.refs.radial) this.refs.radial.hidden = true;
      this.updateLookHint();
      if (resume) this.requestLook();
    }

    handleRadial(action) {
      if (action === 'world' || action === 'avatar' || action === 'gesture') {
        this.radialOpen = false;
        if (this.refs.radial) this.refs.radial.hidden = true;
        this.openPanel(action);
        return;
      }
      if (action === 'mic') {
        this.toggleMic();
        this.closeRadial(true);
        return;
      }
      if (action === 'respawn') {
        this.respawn();
        this.closeRadial(true);
        return;
      }
      if (action === 'close') this.closeRadial(true);
    }

    respawn() {
      this.player.position.set(this.spawnPoint.x, 0, this.spawnPoint.z);
      this.yaw = 0;
      this.pitch = -0.02;
      this.keys.clear();
      this.showToastBubble(`已重生在 ${this.refs.worldName?.textContent || 'Midnight Lounge'} 出生点`);
      this.update(0);
    }

    closeAllPanels() {
      this.refs.worldPanel.hidden = true;
      this.refs.avatarPanel.hidden = true;
      this.refs.gesturePanel.hidden = true;
      this.refs.chat.hidden = true;
      this.refs.chatInput?.blur();
    }

    ensure() {
      if (this.initialized) return true;
      if (!window.THREE) {
        this.refs.fatal.hidden = false;
        return false;
      }
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.refs.canvas, antialias: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        if ('outputEncoding' in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c0b18);
        this.scene.fog = new THREE.FogExp2(0x0c0b18, 0.028);
        this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
        this.clock = new THREE.Clock();
        this.player = new THREE.Group();
        this.player.position.set(this.spawnPoint.x, 0, this.spawnPoint.z);
        this.scene.add(this.player);
        this.scene.add(this.camera);
        this.camera.position.set(this.spawnPoint.x, 1.65, this.spawnPoint.z);
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.buildWorld();
        this.buildAvatars();
        this.playerAvatar.visible = false;
        this.buildViewHand();
        this.initialized = true;
        this.startLoop();
        return true;
      } catch (error) {
        console.error('AISniperOS：VRChat 世界启动失败。', error);
        this.refs.fatal.hidden = false;
        return false;
      }
    }

    buildWorld() {
      this.scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x1c1024, 0.72));
      const dir = new THREE.DirectionalLight(0x8adfff, 0.72);
      dir.position.set(5, 12, 3);
      this.scene.add(dir);
      this.accentLightA = new THREE.PointLight(0x8f65ff, 2.2, 26);
      this.accentLightA.position.set(-8, 4, -7);
      this.accentLightB = new THREE.PointLight(0x32d4c0, 1.8, 22);
      this.accentLightB.position.set(8, 4, -2);
      this.scene.add(this.accentLightA, this.accentLightB);
      this.floorMat = new THREE.MeshStandardMaterial({ color: 0x19142a, roughness: 0.55, metalness: 0.28 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 26), this.floorMat);
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
      const grid = new THREE.GridHelper(32, 24, 0x7b5ce0, 0x2b2146);
      grid.position.y = 0.012;
      this.scene.add(grid);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x161422, roughness: 0.8, metalness: 0.1 });
      const neonA = new THREE.MeshStandardMaterial({ color: 0x8d63ff, emissive: 0x4a1cbc, emissiveIntensity: 1.2 });
      const neonB = new THREE.MeshStandardMaterial({ color: 0x58e4d0, emissive: 0x127c70, emissiveIntensity: 1.2 });
      const add = (w, h, d, x, y, z, mat = wallMat) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        return mesh;
      };
      add(32, 5, 0.6, 0, 2.5, -13);
      add(32, 5, 0.6, 0, 2.5, 13);
      add(0.6, 5, 26, -16, 2.5, 0);
      add(0.6, 5, 26, 16, 2.5, 0);
      add(32, 0.08, 0.16, 0, 3.4, -12.65, neonA);
      add(0.16, 3.1, 26, -15.65, 1.9, 0, neonB);
      add(0.16, 3.1, 26, 15.65, 1.9, 0, neonA);
      add(32, 0.06, 0.1, 0, 0.1, 12.65, neonB);
      this.danceFloor = add(8, 0.03, 6, -2, 0.04, -4, new THREE.MeshStandardMaterial({ color: 0x2b1a56, emissive: 0x2e135e, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 }));
      add(5.6, 1.05, 1.15, 9, 0.55, -8.5, new THREE.MeshStandardMaterial({ color: 0x3c2f3e, roughness: 0.6 }));
      add(5.8, 0.08, 1.3, 9, 1.12, -8.5, neonB);
      add(0.55, 3.4, 0.55, -12, 1.7, -5, new THREE.MeshStandardMaterial({ color: 0x24203a, roughness: 0.5, metalness: 0.4 }));
      add(0.5, 3.1, 0.5, 12.5, 1.55, 6, new THREE.MeshStandardMaterial({ color: 0x24203a, roughness: 0.5, metalness: 0.4 }));
      const mirrorFrame = new THREE.MeshStandardMaterial({ color: 0x9f84ff, emissive: 0x37187a, emissiveIntensity: 0.9 });
      const mirrorFace = new THREE.MeshStandardMaterial({ color: 0x111b28, roughness: 0.15, metalness: 0.8 });
      add(5.6, 3.1, 0.16, 0, 2.3, 12.68, mirrorFrame);
      add(5.2, 2.72, 0.12, 0, 2.3, 12.57, mirrorFace);
      const spawnRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.98, 36), new THREE.MeshBasicMaterial({ color: 0xbca4ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide }));
      spawnRing.rotation.x = -Math.PI / 2;
      spawnRing.position.set(this.spawnPoint.x, 0.022, this.spawnPoint.z);
      this.scene.add(spawnRing);
      const spawnInner = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 24), new THREE.MeshBasicMaterial({ color: 0x77eadb, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      spawnInner.rotation.x = -Math.PI / 2;
      spawnInner.position.set(this.spawnPoint.x, 0.024, this.spawnPoint.z);
      this.scene.add(spawnInner);
      const spawnLabel = makeLabel('出生点 · SPAWN', '#e5d8ff');
      spawnLabel.position.set(this.spawnPoint.x, 1.55, this.spawnPoint.z - 2.2);
      this.scene.add(spawnLabel);
      for (let i = 0; i < 6; i += 1) {
        const orb = new THREE.PointLight(i % 2 ? 0xff7ec7 : 0x73e8ff, 0.7, 5);
        orb.position.set((i - 2.5) * 4.4, 4.4, -12.2);
        this.scene.add(orb);
      }
      const stars = new THREE.BufferGeometry();
      const starPositions = [];
      for (let i = 0; i < 140; i += 1) {
        starPositions.push((Math.random() - 0.5) * 34, 4.8 + Math.random() * 4, (Math.random() - 0.5) * 26);
      }
      stars.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
      this.scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xb7e9ff, size: 0.04, transparent: true, opacity: 0.6 })));
    }

    buildAvatars() {
      this.playerAvatar = this.makeAvatar('#f3a35c', 'S');
      this.player.add(this.playerAvatar);
      this.npcs = [
        { key: 'mira', name: 'Mira', tag: 'Aperture 工作室', color: '#f3a35c', pos: [-5.2, 0, -2.8], lines: ['你终于来了。这里比上次的 Aperture 世界更安静。', '我刚刚在吧台点了一杯没有卡路里的饮料。'], replies: ['我也喜欢这里的紫光。', '要不要一起去跳舞？', '你看到镜子里的低模了吗？'] },
        { key: 'kai', name: 'Kai', tag: 'VOID SIGNAL', color: '#8d7dff', pos: [4.3, 0, -1.6], lines: ['第三波编队怎么样？我刚刚把准星调轻了一点。', '午夜酒馆的延迟只有 8ms，适合试飞。'], replies: ['下次一起开黑。', '准星手感确实更好了。', '你也来跳一段？'] },
        { key: 'nova', name: 'Nova', tag: '正在跳舞', color: '#63d9c4', pos: [-2.2, 0, -4.1], lines: ['音乐响起来之后，我的低模就开始自己动了。', '这个舞池的材质是我见过最亮的。'], replies: ['教我你的舞步。', '这个 BPM 刚刚好。', '再来一首！'] },
        { key: 'pixel', name: 'Pixel', tag: 'Midnight Lounge', color: '#ff93b6', pos: [7.4, 0, -5.8], lines: ['欢迎来到 Midnight Lounge。吧台上有免费的像素果汁。', '如果觉得人多，可以去 Starry Garden 看看。'], replies: ['这里确实很舒服。', '带我去看看花园。', '你在这里多久了？'] },
        { key: 'ghost', name: 'Ghost', tag: '隐身的访客', color: '#a8b7ff', pos: [-9.2, 0, 3.4], lines: ['嘘……我只是来看看镜子。', '镜子里的世界比外面安静。'], replies: ['你看起来很熟悉。', '我什么都没有看见。', '晚点一起逛逛。'] },
        { key: 'slime', name: 'Slime', tag: 'SlimeVR 追踪测试', color: '#b5f35e', pos: [10.4, 0, 2.1], lines: ['我的六个追踪器都在线，身体终于不会穿过地板了。', '你有没有试过在 VR 里坐下？椅子是假的，膝盖是真的。'], replies: ['追踪数据看起来不错。', '下次帮我调一下腰环。', '绿色很适合你。'] }
      ];
      this.npcs.forEach((npc) => {
        const group = this.makeAvatar(npc.color, npc.name[0]);
        group.position.set(...npc.pos);
        group.userData.npc = npc;
        const label = makeLabel(npc.name, npc.color);
        label.position.y = 2.65;
        group.add(label);
        this.player.parent.add(group);
        npc.group = group;
        npc.base = new THREE.Vector3(...npc.pos);
        npc.phase = Math.random() * Math.PI * 2;
        npc.wander = new THREE.Vector3(...npc.pos);
        npc.wanderTimer = 2 + Math.random() * 5;
      });
    }

    buildViewHand() {
      this.viewHand = new THREE.Group();
      this.handMaterial = new THREE.MeshStandardMaterial({ color: this.playerColor, roughness: 0.42, metalness: 0.25 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x252333, roughness: 0.62, metalness: 0.2 });
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.43, 0.16), this.handMaterial);
      arm.position.set(0.34, -0.34, -0.6);
      arm.rotation.set(-0.3, 0.1, -0.12);
      const glove = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.24), dark);
      glove.position.set(0.29, -0.48, -0.73);
      glove.rotation.x = -0.25;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 12), new THREE.MeshStandardMaterial({ color: 0x7ff0df, emissive: 0x1a7c73, emissiveIntensity: 0.8 }));
      ring.position.set(0.295, -0.47, -0.66);
      ring.rotation.x = 1.2;
      this.viewHand.add(arm, glove, ring);
      this.camera.add(this.viewHand);
    }

    makeAvatar(color, initial = '') {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.2 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x232333, roughness: 0.65, metalness: 0.2 });
      const visorMat = new THREE.MeshStandardMaterial({ color: 0x0d1018, emissive: new THREE.Color(color).multiplyScalar(0.18), emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.5 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.92, 8), bodyMat);
      body.position.y = 1.02;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 8), bodyMat);
      head.position.y = 1.83;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.16), visorMat);
      visor.position.set(0, 1.86, 0.26);
      const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.52, 0.18), darkMat);
      shoulderL.position.set(-0.42, 1.15, 0);
      shoulderL.rotation.z = 0.18;
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.42;
      shoulderR.rotation.z = -0.18;
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.54, 0.22), darkMat);
      legL.position.set(-0.14, 0.3, 0);
      const legR = legL.clone();
      legR.position.x = 0.14;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.44, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      group.add(body, head, visor, shoulderL, shoulderR, legL, legR, ring);
      group.userData.materials = { bodyMat, visorMat, ring };
      group.userData.initial = initial;
      return group;
    }

    startLoop() {
      if (this.loopStarted) return;
      this.loopStarted = true;
      const loop = () => {
        this.raf = requestAnimationFrame(loop);
        if (!this.initialized) return;
        if (!WINDOW_OPEN('vrchat')) {
          if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
          return;
        }
        if (!WINDOW_ACTIVE('vrchat') && document.pointerLockElement === this.refs.canvas) {
          document.exitPointerLock?.();
        }
        this.resizeRenderer();
        const dt = Math.min(this.clock.getDelta(), 0.05);
        if (this.started) this.update(dt);
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    }

    resizeRenderer() {
      const canvas = this.refs.canvas;
      const width = Math.max(2, canvas.clientWidth || 900);
      const height = Math.max(2, canvas.clientHeight || 520);
      if (this.lastWidth === width && this.lastHeight === height) return;
      this.lastWidth = width;
      this.lastHeight = height;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    start() {
      if (!this.ensure()) return;
      if (this.loadingTimer) clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      this.loadingActive = false;
      this.loadedOnce = true;
      this.started = true;
      this.refs.loading.hidden = true;
      this.refs.startPanel.hidden = true;
      this.refs.hud.hidden = false;
      this.refs.chat.hidden = true;
      this.refs.radial.hidden = true;
      this.radialOpen = false;
      this.refs.worldPanel.hidden = true;
      this.refs.avatarPanel.hidden = true;
      this.refs.gesturePanel.hidden = true;
      this.refs.startPanel.querySelector('[data-vrchat-action="enter"]')?.blur();
      this.keys.clear();
      this.player.position.set(this.spawnPoint.x, 0, this.spawnPoint.z);
      this.yaw = 0;
      this.pitch = -0.02;
      this.clock.getDelta();
      this.update(0);
      this.requestLook();
      this.showToastBubble('已进入 Midnight Lounge · 出生点');
    }

    showStart() {
      this.refs.loading.hidden = true;
      this.refs.startPanel.hidden = false;
      this.refs.hud.hidden = true;
    }

    playLoading(onDone) {
      if (this.loadingActive) return;
      this.loadingActive = true;
      this.refs.loading.hidden = false;
      this.refs.startPanel.hidden = true;
      this.refs.hud.hidden = true;
      const stages = [
        '正在验证本地账户…',
        '正在下载世界清单与缩略图…',
        '正在同步出生点与化身…',
        '正在预热低模材质…',
        '世界已准备就绪…'
      ];
      let progress = 0;
      const renderProgress = () => {
        this.refs.loadingBar.style.width = `${progress}%`;
        this.refs.loadingPercent.textContent = `${Math.floor(progress)}%`;
        this.refs.loadingStage.textContent = stages[Math.min(stages.length - 1, Math.floor(progress / 22))];
      };
      renderProgress();
      clearInterval(this.loadingTimer);
      this.loadingTimer = setInterval(() => {
        progress = Math.min(100, progress + 2.4 + Math.random() * 3.5);
        renderProgress();
        if (progress >= 100) {
          clearInterval(this.loadingTimer);
          this.loadingTimer = null;
          setTimeout(() => this.finishLoading(onDone), 320);
        }
      }, 102);
    }

    finishLoading(onDone = null) {
      if (!this.loadingActive) return;
      this.loadingActive = false;
      this.loadedOnce = true;
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      if (onDone) onDone();
      else this.showStart();
    }

    open() {
      this.ensure();
      if (!this.started) {
        if (!this.loadedOnce && !this.loadingActive) {
          this.playLoading(() => this.showStart());
        } else if (!this.loadingActive) {
          this.showStart();
        }
      } else {
        this.refs.loading.hidden = true;
        this.refs.hud.hidden = false;
        this.updateLookHint();
      }
    }

    reset() {
      this.started = false;
      this.keys.clear();
      this.releaseLook();
      this.closeAllPanels();
      if (this.loadingTimer) clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      this.loadingActive = false;
      if (this.refs.radial) this.refs.radial.hidden = true;
      this.radialOpen = false;
      this.player.position.set(this.spawnPoint.x, 0, this.spawnPoint.z);
      this.yaw = 0;
      this.pitch = -0.02;
      this.refs.hud.hidden = true;
      this.refs.loading.hidden = true;
      this.refs.startPanel.hidden = false;
      this.refs.lockHint.hidden = true;
    }

    update(dt) {
      this.waveTime += dt;
      const overlay = this.anyOverlayOpen();
      let dx = 0;
      let dz = 0;
      if (!overlay) {
        if (this.keys.has('KeyW')) dz -= 1;
        if (this.keys.has('KeyS')) dz += 1;
        if (this.keys.has('KeyA')) dx -= 1;
        if (this.keys.has('KeyD')) dx += 1;
      }
      if (dx || dz) {
        const forward = { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
        const right = { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
        const moveX = right.x * dx + forward.x * -dz;
        const moveZ = right.z * dx + forward.z * -dz;
        const length = Math.hypot(moveX, moveZ) || 1;
        this.player.position.x = clamp(this.player.position.x + (moveX / length) * 4.35 * dt, -14.7, 14.7);
        this.player.position.z = clamp(this.player.position.z + (moveZ / length) * 4.35 * dt, -11.7, 11.7);
        this.player.rotation.y = Math.atan2(moveX, moveZ);
        this.dancing = false;
      }
      this.player.position.y = Math.sin(this.waveTime * 2) * 0.008;
      const bob = (dx || dz) ? Math.sin(this.waveTime * 9) * 0.018 : Math.sin(this.waveTime * 1.7) * 0.006;
      this.camera.position.set(this.player.position.x, 1.65 + bob, this.player.position.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      if (this.dancing) this.player.rotation.y += dt * 2.2;
      let nearest = null;
      let nearestDistance = 3.3;
      this.npcs.forEach((npc) => {
        const group = npc.group;
        npc.wanderTimer -= dt;
        const distance = Math.hypot(group.position.x - this.player.position.x, group.position.z - this.player.position.z);
        if (npc.wanderTimer <= 0 && distance > 3) {
          npc.wanderTimer = 3 + Math.random() * 7;
          npc.wander.set(npc.base.x + (Math.random() - 0.5) * 3.2, 0, npc.base.z + (Math.random() - 0.5) * 3.2);
        }
        if (distance > 3) {
          group.position.x += (npc.wander.x - group.position.x) * dt * 0.35;
          group.position.z += (npc.wander.z - group.position.z) * dt * 0.35;
        }
        group.position.y = Math.sin(this.waveTime * 2 + npc.phase) * 0.035;
        if (distance < 4.2) group.lookAt(this.player.position.x, group.position.y + 1.2, this.player.position.z);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = npc;
        }
      });
      this.nearestNpc = nearest;
      if (nearest && !overlay) {
        this.refs.prompt.hidden = false;
        this.refs.promptName.textContent = nearest.name;
      } else {
        this.refs.prompt.hidden = true;
      }
      this.updateLookHint();
    }

    setWorld(key) {
      const worlds = {
        midnight: { name: 'Midnight Lounge', instance: '公开实例 · 9 人在线', fog: 0x0c0b18, floor: 0x19142a, accentA: 0x8f65ff, accentB: 0x32d4c0, lightA: 0x8f65ff, lightB: 0x32d4c0, copy: '霓虹、音乐和低模朋友。一个适合第一次见面的小世界。' },
        garden: { name: 'Starry Garden', instance: '公开实例 · 6 人在线', fog: 0x07131a, floor: 0x10252b, accentA: 0x62e0c6, accentB: 0x5f8cff, lightA: 0x62e0c6, lightB: 0x5f8cff, copy: '星星落进草地的安静庭院，适合慢慢散步。' },
        pug: { name: 'The Great Pug', instance: '公开实例 · 14 人在线', fog: 0x170d0d, floor: 0x2b1b17, accentA: 0xffa35c, accentB: 0xff6a79, lightA: 0xffa35c, lightB: 0xff6a79, copy: '经典 VRChat 酒吧，人很多，也很适合听故事。' }
      };
      const world = worlds[key] || worlds.midnight;
      this.worldKey = key;
      if (this.scene) {
        this.scene.fog.color.setHex(world.fog);
        this.scene.background.setHex(world.fog);
        this.floorMat.color.setHex(world.floor);
        if (this.accentLightA) this.accentLightA.color.setHex(world.lightA);
        if (this.accentLightB) this.accentLightB.color.setHex(world.lightB);
      }
      this.refs.worldName.textContent = world.name;
      this.refs.worldInstance.textContent = world.instance;
      if (this.refs.startWorldName) this.refs.startWorldName.textContent = world.name;
      if (this.refs.startWorldCopy) this.refs.startWorldCopy.textContent = world.copy;
      $$('[data-vrchat-world]', this.root).forEach((button) => button.classList.toggle('is-active', button.dataset.vrchatWorld === key));
      this.refs.worldPanel.hidden = true;
      this.updateLookHint();
      if (!this.anyOverlayOpen()) this.requestLook();
      this.showToastBubble(`正在前往 ${world.name}`);
    }

    setPlayerColor(color) {
      this.playerColor = color;
      if (this.playerAvatar) {
        const mats = this.playerAvatar.userData.materials;
        mats.bodyMat.color.set(color);
        mats.visorMat.emissive.set(new THREE.Color(color).multiplyScalar(0.18));
        mats.ring.color.set(color);
      }
      if (this.handMaterial) this.handMaterial.color.set(color);
      $$('.vrchat-color-row button', this.root).forEach((button) => {
        button.classList.toggle('is-active', button.dataset.vrchatColor === color);
      });
      this.showToastBubble('装扮已更新');
    }

    playGesture(gesture) {
      if (!this.playerAvatar) return;
      this.refs.gesturePanel.hidden = true;
      this.updateLookHint();
      this.requestLook();
      if (gesture === 'dance') {
        this.dancing = true;
        this.showToastBubble('正在跳舞');
      } else if (gesture === 'wave') {
        this.showToastBubble('👋 你向附近玩家挥了挥手');
        this.animateArmWave();
      } else if (gesture === 'bow') {
        this.showToastBubble('🙇 你鞠了一躬');
      } else {
        this.showToastBubble('✌️ 你比了个耶');
      }
    }

    animateArmWave() {
      if (!this.playerAvatar) return;
      const arm = this.playerAvatar.children[3];
      if (!arm) return;
      const base = arm.rotation.z;
      let frame = 0;
      const timer = setInterval(() => {
        frame += 1;
        arm.rotation.z = base + Math.sin(frame * 0.8) * 0.55;
        if (frame > 22) {
          clearInterval(timer);
          arm.rotation.z = base;
        }
      }, 38);
    }

    toggleMic() {
      this.muted = !this.muted;
      if (this.refs.micChip) {
        this.refs.micChip.classList.toggle('is-muted', this.muted);
        $('span', this.refs.micChip).textContent = this.muted ? '麦克风已静音' : '麦克风开启';
      }
      this.showToastBubble(this.muted ? '麦克风已静音' : '麦克风已开启');
    }

    showToastBubble(text) {
      if (!this.refs.toast) return;
      this.refs.toast.textContent = text;
      this.refs.toast.hidden = false;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => { this.refs.toast.hidden = true; }, 2600);
    }

    pickNpc(pointer) {
      if (!this.camera) return;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(pointer, this.camera);
      const groups = this.npcs.map((npc) => npc.group);
      const hits = ray.intersectObjects(groups, true);
      if (!hits.length) return;
      let group = hits[0].object;
      while (group && !group.userData.npc) group = group.parent;
      if (!group) return;
      const npc = group.userData.npc;
      const distance = Math.hypot(group.position.x - this.player.position.x, group.position.z - this.player.position.z);
      if (distance > 5.2) {
        this.showToastBubble(`走近一点才能和 ${npc.name} 交谈`);
        return;
      }
      this.openChat(npc);
    }

    openChat(npc) {
      if (!npc || !this.started) return;
      this.releaseLook();
      this.closeAllPanels();
      if (this.refs.radial) this.refs.radial.hidden = true;
      this.radialOpen = false;
      this.keys.clear();
      this.activeNpc = npc;
      this.refs.chat.hidden = false;
      this.updateLookHint();
      this.refs.chatName.textContent = npc.name;
      this.refs.chatStatus.textContent = `${npc.tag} · 在线`;
      const avatar = $('.vrchat-chat-avatar', this.root);
      if (avatar) { avatar.textContent = npc.name[0]; avatar.style.setProperty('--p', npc.color); }
      if (!this.chatHistory[npc.key]) {
        this.chatHistory[npc.key] = [{ from: 'them', text: npc.lines[0] }];
      }
      this.renderChatLog();
      this.refs.chatInput?.focus();
    }

    closeChat() {
      this.refs.chat.hidden = true;
      this.refs.chatInput?.blur();
      this.activeNpc = null;
      this.updateLookHint();
      this.requestLook();
    }

    pushChatMessage(from, text) {
      if (!this.activeNpc) return;
      if (!this.chatHistory[this.activeNpc.key]) this.chatHistory[this.activeNpc.key] = [];
      this.chatHistory[this.activeNpc.key].push({ from, text });
      this.renderChatLog();
    }

    scheduleNpcReply() {
      if (!this.activeNpc) return;
      const npc = this.activeNpc;
      clearTimeout(this.replyTimer);
      this.replyTimer = setTimeout(() => {
        if (!this.activeNpc || this.activeNpc.key !== npc.key) return;
        const line = npc.lines[Math.floor(Math.random() * npc.lines.length)] || '很高兴在这里见到你。';
        this.pushChatMessage('them', line);
      }, 760 + Math.random() * 500);
    }

    renderChatLog() {
      if (!this.activeNpc) return;
      const entries = this.chatHistory[this.activeNpc.key] || [];
      this.refs.chatLog.replaceChildren();
      entries.forEach((entry) => {
        const row = document.createElement('div');
        row.className = `vrchat-chat-row is-${entry.from}`;
        row.textContent = entry.text;
        this.refs.chatLog.appendChild(row);
      });
      this.refs.chatLog.scrollTop = this.refs.chatLog.scrollHeight;
      const replies = $('.vrchat-chat-replies', this.root);
      if (replies) replies.remove();
      const quick = document.createElement('div');
      quick.className = 'vrchat-chat-replies';
      this.activeNpc.replies.forEach((reply) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = reply;
        button.addEventListener('click', () => {
          this.pushChatMessage('me', reply);
          this.scheduleNpcReply();
        });
        quick.appendChild(button);
      });
      this.refs.chat.insertBefore(quick, this.refs.chatForm);
    }
  }

  window.AISniperSteamGames = { CS2Game, VRChatGame };
})();
