/* ==========================================================================
   AISniperOS — AISniper Unity
   A local fake Unity editor with a real Three.js scene viewport.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const WINDOW_ID = 'window-unity';

  function init(host = {}) {
    const win = document.getElementById(WINDOW_ID);
    const root = document.getElementById('unityRoot');
    if (!win || !root) return null;

    const state = {
      initialized: false,
      playing: false,
      selectedId: 'player',
      objects: [],
      nextId: 1,
      sceneTime: 0,
      logs: [],
      consoleTab: 'console',
      fps: 60,
      frameCount: 0,
      fpsTimer: 0,
      dragging: false,
      dragMoved: false,
      dragStart: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
      orbit: { theta: 0.72, phi: 0.95, radius: 8.8 },
      menuOpen: false,
      renderer: null,
      scene: null,
      camera: null,
      clock: null,
      selectionBox: null
    };

    const ICONS = {
      camera: '#i-image',
      light: '#i-sun',
      ground: '#i-grid',
      player: '#i-user',
      cube: '#i-box',
      sphere: '#i-spark',
      empty: '#i-plus'
    };

    const LOG_COLORS = { info: 'is-info', success: 'is-success', warn: 'is-warn', error: 'is-error' };

    root.innerHTML = `
      <div class="unity-shell">
        <header class="unity-top">
          <div class="unity-brand">
            <svg viewBox="0 0 64 64"><use href="#app-unity"></use></svg>
            <div class="unity-brand-copy"><b>AISniper Unity</b><small>LOCAL EDITOR · 26.4</small></div>
          </div>
          <nav class="unity-menus" aria-label="编辑器菜单">
            <button type="button" data-unity-menu="file">File</button>
            <button type="button" data-unity-menu="edit">Edit</button>
            <button type="button" data-unity-menu="gameobject">GameObject</button>
            <button type="button" data-unity-menu="component">Component</button>
            <button type="button" data-unity-menu="window">Window</button>
            <button type="button" data-unity-menu="help">Help</button>
          </nav>
          <div class="unity-playbar">
            <button class="unity-play-btn" data-unity-action="play" aria-label="播放场景" title="运行 / 停止"><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></button>
            <button class="unity-step-btn" data-unity-action="step" aria-label="单步运行" title="单步"><svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>
            <span class="unity-play-state" data-unity-play-state>Stopped</span>
            <span class="unity-project-chip"><i></i>AISniper Runner</span>
          </div>
        </header>
        <div class="unity-editor">
          <aside class="unity-pane unity-hierarchy-pane">
            <div class="unity-pane-head"><span>Hierarchy</span><b data-unity-object-count>0 objects</b></div>
            <div class="unity-scene-title"><svg viewBox="0 0 24 24"><use href="#i-grid"></use></svg>Scene 01</div>
            <div class="unity-hierarchy-list" data-unity-hierarchy></div>
            <div class="unity-hierarchy-foot"><button class="unity-create-btn" data-unity-action="create-cube"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>Create Object</button></div>
          </aside>
          <main class="unity-viewport-col">
            <div class="unity-view-tabs">
              <button type="button" class="is-active" data-unity-view="scene">Scene</button>
              <button type="button" data-unity-view="game">Game</button>
              <span data-unity-view-mode>Shaded</span>
              <span>3D</span>
            </div>
            <div class="unity-scene" data-unity-scene-wrap>
              <canvas id="unitySceneCanvas" aria-label="Unity 场景视图"></canvas>
              <div class="unity-scene-stamp"><i></i>SCENE VIEW · LOCAL</div>
              <div class="unity-axis"><span class="ax"><i></i>X</span><span class="ay"><i></i>Y</span><span class="az"><i></i>Z</span></div>
              <div class="unity-scene-hint">左键拖拽旋转 · 滚轮缩放 · 点击对象选择</div>
              <span class="unity-play-badge" data-unity-play-badge hidden>● PLAY MODE</span>
              <div class="unity-loading" data-unity-loading><i></i><span>正在初始化 WebGL 场景…</span></div>
            </div>
            <section class="unity-console-pane">
              <div class="unity-console-tabs"><button type="button" class="is-active" data-unity-console="console">Console</button><button type="button" data-unity-console="project">Project</button><span data-unity-console-note>0 messages</span></div>
              <div class="unity-console-lines" data-unity-console-lines></div>
              <div class="unity-project-grid" data-unity-project-grid hidden>
                <div class="unity-project-path">Assets /</div>
                <div class="unity-project-assets">
                  <button class="unity-asset folder"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>Scenes</button>
                  <button class="unity-asset folder"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>Scripts</button>
                  <button class="unity-asset folder"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>Materials</button>
                  <button class="unity-asset folder"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>Prefabs</button>
                  <button class="unity-asset"><svg viewBox="0 0 24 24"><use href="#i-file"></use></svg>PlayerController.cs</button>
                  <button class="unity-asset"><svg viewBox="0 0 24 24"><use href="#i-file"></use></svg>DoorTrigger.cs</button>
                  <button class="unity-asset"><svg viewBox="0 0 24 24"><use href="#i-image"></use></svg>GridFloor.mat</button>
                  <button class="unity-asset"><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg>Crate.prefab</button>
                </div>
              </div>
            </section>
          </main>
          <aside class="unity-pane unity-inspector-pane">
            <div class="unity-pane-head"><span>Inspector</span><b>Selection</b></div>
            <div class="unity-inspector" data-unity-inspector></div>
          </aside>
        </div>
        <footer class="unity-statusbar" data-unity-statusbar>
          <span><i class="unity-state-dot"></i><b data-unity-status>Ready</b></span>
          <span data-unity-status-objects>0 objects</span>
          <span class="unity-status-play">PLAY MODE</span>
          <span class="unity-statusbar-right"><span data-unity-fps>60 FPS</span><span>WebGL · AISniper Engine</span></span>
        </footer>
      </div>
      <div class="unity-menu-popover" data-unity-menu-popover hidden></div>`;

    const ui = {
      hierarchy: $('[data-unity-hierarchy]', root),
      objectCount: $('[data-unity-object-count]', root),
      inspector: $('[data-unity-inspector]', root),
      consoleLines: $('[data-unity-console-lines]', root),
      consoleNote: $('[data-unity-console-note]', root),
      projectGrid: $('[data-unity-project-grid]', root),
      sceneWrap: $('[data-unity-scene-wrap]', root),
      playBadge: $('[data-unity-play-badge]', root),
      loading: $('[data-unity-loading]', root),
      playState: $('[data-unity-play-state]', root),
      playButton: $('[data-unity-action="play"]', root),
      status: $('[data-unity-status]', root),
      statusbar: $('[data-unity-statusbar]', root),
      statusObjects: $('[data-unity-status-objects]', root),
      fps: $('[data-unity-fps]', root),
      menu: $('[data-unity-menu-popover]', root),
      canvas: $('#unitySceneCanvas', root)
    };

    const MENUS = {
      file: [
        ['新建场景', 'new-scene', '⌘N'],
        ['保存场景', 'save-scene', '⌘S'],
        ['构建演示版本', 'build', '⌘B'],
        ['divider'],
        ['退出编辑器', 'exit', '⌘Q']
      ],
      edit: [
        ['撤销（演示）', 'undo', '⌘Z'],
        ['重做（演示）', 'redo', '⇧⌘Z'],
        ['divider'],
        ['删除所选对象', 'delete-selected', 'Del']
      ],
      gameobject: [
        ['创建空对象', 'create-empty'],
        ['创建立方体', 'create-cube'],
        ['创建球体', 'create-sphere'],
        ['创建灯光', 'create-light']
      ],
      component: [
        ['添加 Rigidbody', 'add-rigidbody'],
        ['添加 Box Collider', 'add-collider'],
        ['添加 Audio Source', 'add-audio']
      ],
      window: [
        ['重置场景视图', 'reset-view', 'F'],
        ['清空 Console', 'clear-console'],
        ['切换 Console / Project', 'toggle-project']
      ],
      help: [
        ['关于 AISniper Unity', 'about'],
        ['打开编辑器文档', 'docs']
      ]
    };

    function log(text, type = 'info') {
      state.logs.unshift({ text, type, time: new Date().toLocaleTimeString('zh-CN', { hour12: false }) });
      if (state.logs.length > 40) state.logs.pop();
      renderConsole();
    }

    function renderConsole() {
      ui.consoleLines.innerHTML = state.logs.map((entry) => `<div class="unity-console-line ${LOG_COLORS[entry.type] || ''}"><time>${escapeHTML(entry.time)}</time><span>${escapeHTML(entry.text)}</span></div>`).join('');
      ui.consoleNote.textContent = `${state.logs.length} messages`;
    }

    function objectById(id) {
      return state.objects.find((object) => object.id === id) || null;
    }

    function selectedObject() {
      return objectById(state.selectedId);
    }

    function iconFor(object) {
      return ICONS[object.type] || '#i-box';
    }

    function renderHierarchy() {
      ui.hierarchy.innerHTML = state.objects.map((object) => `<button class="unity-hierarchy-row${object.id === state.selectedId ? ' is-active' : ''}${object.child ? ' is-child' : ''}" data-unity-object="${escapeHTML(object.id)}"><span class="unity-hierarchy-icon"><svg viewBox="0 0 24 24"><use href="${iconFor(object)}"></use></svg></span><b>${escapeHTML(object.name)}</b></button>`).join('');
      ui.objectCount.textContent = `${state.objects.length} objects`;
      ui.statusObjects.textContent = `${state.objects.length} objects`;
    }

    function renderInspector() {
      const object = selectedObject();
      if (!object) {
        ui.inspector.innerHTML = '<div class="unity-inspector-empty">没有选中的对象。<br>在 Hierarchy 或 Scene 视图中选择一个对象。</div>';
        return;
      }
      const color = object.color || '#7d8b78';
      ui.inspector.innerHTML = `
        <div class="unity-inspector-head">
          <div class="unity-inspector-title"><span><svg viewBox="0 0 24 24"><use href="${iconFor(object)}"></use></svg></span><input value="${escapeHTML(object.name)}" data-unity-name aria-label="对象名称"></div>
          <div class="unity-inspector-sub"><span>${escapeHTML(object.type.toUpperCase())}</span><b>${object.mesh ? 'Active' : 'Virtual'}</b></div>
        </div>
        <section class="unity-component">
          <div class="unity-component-head"><span><svg viewBox="0 0 24 24"><use href="#i-sliders"></use></svg>Transform</span><button type="button" aria-label="重置变换" data-unity-action="reset-transform">↺</button></div>
          <div class="unity-prop-row"><span>Position</span><div class="unity-vec3">
            <label><i>X</i><input type="number" value="${object.position[0].toFixed(2)}" step=".1" data-unity-transform="position" data-axis="0"></label>
            <label><i>Y</i><input type="number" value="${object.position[1].toFixed(2)}" step=".1" data-unity-transform="position" data-axis="1"></label>
            <label><i>Z</i><input type="number" value="${object.position[2].toFixed(2)}" step=".1" data-unity-transform="position" data-axis="2"></label>
          </div></div>
          <div class="unity-prop-row"><span>Rotation Y</span><div class="unity-slider"><input type="range" min="-180" max="180" value="${Math.round(object.rotation[1] * 180 / Math.PI)}" data-unity-rotation><b>${Math.round(object.rotation[1] * 180 / Math.PI)}°</b></div></div>
          <div class="unity-prop-row"><span>Scale</span><div class="unity-slider"><input type="range" min="0.25" max="3" step="0.05" value="${object.scale[0].toFixed(2)}" data-unity-scale><b>${object.scale[0].toFixed(2)}×</b></div></div>
        </section>
        ${object.color ? `<section class="unity-component"><div class="unity-component-head"><span><svg viewBox="0 0 24 24"><use href="#i-palette"></use></svg>Material</span><button type="button" aria-label="材质菜单">⌄</button></div><div class="unity-prop-row"><span>Color</span><div class="unity-color-row">${['#7d8b78', '#d08c5d', '#68b7c9', '#b284d6', '#d9c47c', '#e06f62'].map((value) => `<button type="button" data-unity-color="${value}" style="background:${value}" class="${color === value ? 'is-active' : ''}" aria-label="选择颜色 ${value}"></button>`).join('')}</div></div></section>` : ''}
        <button class="unity-add-component" type="button" data-unity-action="add-component">+ Add Component</button>`;
    }

    function renderAll() {
      renderHierarchy();
      renderInspector();
      renderConsole();
    }

    function applyObjectTransform(object) {
      if (!object?.mesh) return;
      object.mesh.position.set(...object.position);
      object.mesh.rotation.set(...object.rotation);
      object.mesh.scale.set(...object.scale);
    }

    function selectObject(id) {
      if (!objectById(id)) return;
      state.selectedId = id;
      renderHierarchy();
      renderInspector();
      log(`Selected '${objectById(id).name}'.`, 'info');
    }

    function createMaterials() {
      return {
        ground: new THREE.MeshStandardMaterial({ color: 0x283236, roughness: 0.86, metalness: 0.12 }),
        crate: new THREE.MeshStandardMaterial({ color: 0x9b6b3f, roughness: 0.72, metalness: 0.14 }),
        player: new THREE.MeshStandardMaterial({ color: 0x4d6d59, roughness: 0.55, metalness: 0.18 }),
        visor: new THREE.MeshStandardMaterial({ color: 0x1c2c31, emissive: 0x2e8f79, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.5 }),
        orb: new THREE.MeshStandardMaterial({ color: 0x6dc9bd, emissive: 0x17665e, emissiveIntensity: 1.1, roughness: 0.24, metalness: 0.3 }),
        light: new THREE.MeshStandardMaterial({ color: 0xf0c067, emissive: 0x9b5b12, emissiveIntensity: 1.2 }),
        camera: new THREE.MeshStandardMaterial({ color: 0x79a8c6, roughness: 0.4, metalness: 0.35, wireframe: true })
      };
    }

    function registerObject(object) {
      state.objects.push(object);
      if (object.mesh) {
        object.mesh.userData.unityId = object.id;
        object.mesh.traverse?.((child) => { child.userData.unityId = object.id; });
        state.scene.add(object.mesh);
        applyObjectTransform(object);
      }
      return object;
    }

    function buildScene() {
      if (state.initialized) return true;
      if (!window.THREE) {
        ui.loading.innerHTML = '<b>WebGL 场景不可用</b><span>Three.js 未载入。</span>';
        return false;
      }
      try {
        const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x080d12);
        scene.fog = new THREE.Fog(0x080d12, 13, 30);
        const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
        const clock = new THREE.Clock();
        state.renderer = renderer;
        state.scene = scene;
        state.camera = camera;
        state.clock = clock;

        scene.add(new THREE.HemisphereLight(0xbadde2, 0x172223, 0.85));
        const sun = new THREE.DirectionalLight(0xffd09a, 1.4);
        sun.position.set(5, 8, 4);
        scene.add(sun);
        const rim = new THREE.PointLight(0x6bc5c0, 1.8, 18);
        rim.position.set(-5, 3, 2);
        scene.add(rim);

        const grid = new THREE.GridHelper(20, 20, 0x466261, 0x223333);
        grid.position.y = 0.01;
        scene.add(grid);
        const materials = createMaterials();

        const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), materials.ground);
        groundMesh.rotation.x = -Math.PI / 2;
        registerObject({ id: 'ground', name: 'Ground', type: 'ground', mesh: groundMesh, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: null });

        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), materials.crate);
        crate.position.set(0.6, 0.64, 0.5);
        registerObject({ id: 'crate', name: 'Crate', type: 'cube', mesh: crate, position: [0.6, 0.64, 0.5], rotation: [0, 0.42, 0], scale: [1, 1, 1], color: '#d08c5d' });

        const player = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 1.25, 8), materials.player);
        body.position.y = 0.72;
        const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.18, 0.28), materials.player);
        shoulders.position.y = 1.22;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 12, 8), materials.player);
        head.position.y = 1.65;
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.12), materials.visor);
        visor.position.set(0, 1.68, 0.26);
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.2), materials.player);
        armL.position.set(-0.48, 0.9, 0);
        armL.rotation.z = 0.15;
        const armR = armL.clone();
        armR.position.x = 0.48;
        armR.rotation.z = -0.15;
        player.add(body, shoulders, head, visor, armL, armR);
        player.position.set(-1.8, 0, 1.2);
        registerObject({ id: 'player', name: 'Player', type: 'player', mesh: player, position: [-1.8, 0, 1.2], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#7d8b78' });

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12), materials.orb);
        orb.position.set(2.2, 1.16, -0.5);
        registerObject({ id: 'orb', name: 'Energy Sphere', type: 'sphere', mesh: orb, position: [2.2, 1.16, -0.5], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#68b7c9' });

        const lightObject = new THREE.Group();
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), materials.light);
        bulb.position.y = 3.9;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.7, 8), new THREE.MeshStandardMaterial({ color: 0x39484a, roughness: 0.6, metalness: 0.3 }));
        post.position.y = 1.9;
        lightObject.add(bulb, post);
        lightObject.position.set(3.4, 0, 2.2);
        registerObject({ id: 'light', name: 'Directional Light', type: 'light', mesh: lightObject, position: [3.4, 0, 2.2], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#d9c47c' });

        const cameraObject = new THREE.Group();
        const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.55), materials.camera);
        const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 12), materials.camera);
        camLens.rotation.z = Math.PI / 2;
        camLens.position.x = 0.34;
        cameraObject.add(camBody, camLens);
        cameraObject.position.set(-3.2, 2.6, 2.8);
        cameraObject.rotation.y = -0.35;
        registerObject({ id: 'camera', name: 'Main Camera', type: 'camera', mesh: cameraObject, position: [-3.2, 2.6, 2.8], rotation: [0, -0.35, 0], scale: [1, 1, 1], color: null });

        state.selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0xf0c36d);
        state.selectionBox.visible = false;
        scene.add(state.selectionBox);
        state.initialized = true;
        ui.loading.hidden = true;
        log('AISniper Unity 26.4 ready. WebGL renderer initialized.', 'success');
        log('Loaded scene: Assets/Scenes/AISniperRunner.unity', 'info');
        log('Compilation completed in 0.42s · 0 errors', 'success');
        renderAll();
        startLoop();
        return true;
      } catch (error) {
        console.error('AISniperOS：Unity 场景初始化失败。', error);
        ui.loading.innerHTML = '<b>WebGL 场景不可用</b><span>请确认硬件加速已开启。</span>';
        log('WebGL renderer initialization failed.', 'error');
        return false;
      }
    }

    function resizeScene() {
      if (!state.renderer) return;
      const width = Math.max(2, ui.canvas.clientWidth || ui.sceneWrap.clientWidth || 700);
      const height = Math.max(2, ui.canvas.clientHeight || ui.sceneWrap.clientHeight || 360);
      if (state.renderer.domElement.width === Math.round(width * (state.renderer.getPixelRatio() || 1)) && state.renderer.domElement.height === Math.round(height * (state.renderer.getPixelRatio() || 1))) return;
      state.renderer.setSize(width, height, false);
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
    }

    function applyCamera() {
      if (!state.camera) return;
      const orbit = state.orbit;
      const x = Math.sin(orbit.theta) * Math.sin(orbit.phi) * orbit.radius;
      const y = Math.cos(orbit.phi) * orbit.radius + 1.25;
      const z = Math.cos(orbit.theta) * Math.sin(orbit.phi) * orbit.radius;
      state.camera.position.set(x, y, z);
      state.camera.lookAt(0, 1.15, 0);
    }

    function updateSelectionBox() {
      if (!state.selectionBox) return;
      const object = selectedObject();
      if (!object?.mesh) {
        state.selectionBox.visible = false;
        return;
      }
      state.selectionBox.setFromObject(object.mesh);
      state.selectionBox.visible = !(state.playing && object.id === 'player');
    }

    function startLoop() {
      if (state.loopStarted) return;
      state.loopStarted = true;
      state.clock.getDelta();
      const frame = () => {
        state.raf = requestAnimationFrame(frame);
        if (!state.initialized || !win.classList.contains('is-open')) return;
        resizeScene();
        const dt = Math.min(state.clock.getDelta(), 0.05);
        state.fpsTimer += dt;
        state.frameCount += 1;
        if (state.fpsTimer > 0.6) {
          state.fps.textContent = `${Math.round(state.frameCount / state.fpsTimer)} FPS`;
          state.fpsTimer = 0;
          state.frameCount = 0;
        }
        if (state.playing) {
          state.sceneTime += dt;
          const player = objectById('player');
          const crate = objectById('crate');
          const orb = objectById('orb');
          if (player?.mesh) {
            player.mesh.position.x = player.position[0] + Math.sin(state.sceneTime * 0.9) * 1.2;
            player.mesh.rotation.y = state.sceneTime * 0.35;
          }
          if (crate?.mesh) crate.mesh.rotation.y = crate.rotation[1] + state.sceneTime * 0.65;
          if (orb?.mesh) {
            orb.mesh.position.y = orb.position[1] + Math.sin(state.sceneTime * 1.8) * 0.22;
            orb.mesh.rotation.y = state.sceneTime * 0.45;
          }
        }
        applyCamera();
        updateSelectionBox();
        state.renderer.render(state.scene, state.camera);
      };
      frame();
    }

    function togglePlay() {
      if (!buildScene()) return;
      state.playing = !state.playing;
      state.sceneTime = 0;
      ui.playBadge.hidden = !state.playing;
      ui.playButton.classList.toggle('is-playing', state.playing);
      ui.playButton.querySelector('use').setAttribute('href', state.playing ? '#i-pause' : '#i-play');
      ui.playState.textContent = state.playing ? 'Playing' : 'Stopped';
      ui.statusbar.classList.toggle('is-playing', state.playing);
      state.sceneWrap.classList.toggle('is-playing', state.playing);
      if (!state.playing) {
        state.objects.forEach((object) => {
          applyObjectTransform(object);
        });
        log('Play mode stopped. Scene transforms restored.', 'info');
      } else {
        log('Entering Play mode. Runtime assembly loaded.', 'success');
      }
    }

    function step() {
      if (!buildScene()) return;
      state.playing = false;
      state.sceneTime += 0.24;
      const crate = objectById('crate');
      if (crate) {
        crate.rotation[1] += 0.15;
        applyObjectTransform(crate);
      }
      log('Stepped one frame in edit mode.', 'info');
    }

    function addPrimitive(kind = 'cube') {
      if (!buildScene()) return;
      const materials = createMaterials();
      const id = `object-${state.nextId++}`;
      let mesh = null;
      let name = 'GameObject';
      let type = 'cube';
      let color = '#d08c5d';
      if (kind === 'sphere') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10), materials.orb);
        mesh.position.set(0, 1, 0);
        name = 'Sphere';
        type = 'sphere';
        color = '#68b7c9';
      } else if (kind === 'light') {
        mesh = new THREE.Group();
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), materials.light);
        bulb.position.y = 2.4;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x445152, roughness: 0.55, metalness: 0.3 }));
        post.position.y = 1.2;
        mesh.add(bulb, post);
        mesh.position.set(0, 0, 0);
        name = 'Point Light';
        type = 'light';
        color = '#d9c47c';
      } else if (kind === 'empty') {
        name = 'Empty';
        type = 'empty';
        color = null;
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials.crate);
        mesh.position.set(0, 0.5, 0);
        name = 'Cube';
        type = 'cube';
        color = '#d08c5d';
      }
      const object = {
        id, name, type, mesh,
        position: mesh ? [mesh.position.x, mesh.position.y, mesh.position.z] : [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color
      };
      if (!mesh) {
        const placeholder = new THREE.Object3D();
        placeholder.position.set(0, 0, 0);
        object.mesh = placeholder;
      }
      registerObject(object);
      state.selectedId = id;
      renderHierarchy();
      renderInspector();
      log(`Created '${name}'.`, 'success');
      host.showToast?.({ title: '已创建对象', message: `${name} · ${id}`, icon: 'app-unity' });
    }

    function deleteSelected() {
      const object = selectedObject();
      if (!object) return;
      if (object.id === 'ground' || object.id === 'camera') {
        log(`'${object.name}' 是场景关键对象，演示模式不允许删除。`, 'warn');
        host.showToast?.({ title: '无法删除', message: 'Ground 与 Main Camera 为场景必备对象。', icon: 'i-info' });
        return;
      }
      if (object.mesh) state.scene.remove(object.mesh);
      state.objects = state.objects.filter((entry) => entry.id !== object.id);
      state.selectedId = state.objects[0]?.id || null;
      renderAll();
      log(`Deleted '${object.name}'.`, 'warn');
    }

    function resetTransform() {
      const object = selectedObject();
      if (!object) return;
      object.position = object.type === 'ground' ? [0, 0, 0] : [0, object.type === 'player' ? 0 : 0.5, 0];
      object.rotation = [0, 0, 0];
      object.scale = [1, 1, 1];
      applyObjectTransform(object);
      renderInspector();
      log(`Reset transform for '${object.name}'.`, 'info');
    }

    function saveScene() {
      state.playing = false;
      state.objects.forEach((object) => applyObjectTransform(object));
      ui.playBadge.hidden = true;
      ui.playButton.classList.remove('is-playing');
      ui.playButton.querySelector('use').setAttribute('href', '#i-play');
      ui.playState.textContent = 'Stopped';
      ui.statusbar.classList.remove('is-playing');
      ui.sceneWrap.classList.remove('is-playing');
      log('Scene saved to Assets/Scenes/AISniperRunner.unity', 'success');
      log('Saved 1 scene, 0 prefab changes.', 'info');
      host.showToast?.({ title: '场景已保存', message: 'AISniperRunner.unity · 本地项目', icon: 'app-unity' });
    }

    function clearConsole() {
      state.logs = [];
      renderConsole();
    }

    function addComponent(type) {
      const object = selectedObject();
      if (!object) return;
      log(`${type} added to '${object.name}'. (demo component)`, 'success');
      host.showToast?.({ title: '已添加组件', message: `${type} → ${object.name}`, icon: 'app-unity' });
    }

    function closeMenu() {
      ui.menu.hidden = true;
      $$('[data-unity-menu]', root).forEach((button) => button.classList.remove('is-open'));
      state.menuOpen = false;
    }

    function showMenu(key, anchor) {
      if (state.menuOpen) closeMenu();
      const items = MENUS[key] || [];
      ui.menu.innerHTML = items.map((item) => {
        if (item[0] === 'divider') return '<div class="divider"></div>';
        return `<button type="button" data-unity-menu-action="${item[1]}"><span>${item[0]}</span><small>${item[2] || ''}</small></button>`;
      }).join('');
      const rect = anchor.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      ui.menu.style.position = 'absolute';
      ui.menu.style.left = `${Math.round(rect.left - rootRect.left)}px`;
      ui.menu.style.top = `${Math.round(rect.bottom - rootRect.top + 3)}px`;
      ui.menu.hidden = false;
      state.menuOpen = true;
      anchor.classList.add('is-open');
    }

    function handleMenuAction(action) {
      closeMenu();
      if (action === 'save-scene') saveScene();
      else if (action === 'new-scene') { log('New scene created. Previous scene kept in memory.', 'success'); host.showToast?.({ title: '新建场景', message: 'Scene 02 · 未保存', icon: 'app-unity' }); }
      else if (action === 'build') { log('Building standalone demo… Build completed with 0 errors.', 'success'); host.showToast?.({ title: '构建完成', message: 'AISniperRunner · WebGL · 本地', icon: 'app-unity' }); }
      else if (action === 'delete-selected') deleteSelected();
      else if (action === 'create-cube') addPrimitive('cube');
      else if (action === 'create-sphere') addPrimitive('sphere');
      else if (action === 'create-light') addPrimitive('light');
      else if (action === 'create-empty') addPrimitive('empty');
      else if (action === 'add-rigidbody' || action === 'add-collider' || action === 'add-audio') addComponent(action === 'add-rigidbody' ? 'Rigidbody' : action === 'add-collider' ? 'Box Collider' : 'Audio Source');
      else if (action === 'reset-view') { state.orbit = { theta: 0.72, phi: 0.95, radius: 8.8 }; log('Scene camera reset.', 'info'); }
      else if (action === 'clear-console') clearConsole();
      else if (action === 'toggle-project') switchConsole(state.consoleTab === 'console' ? 'project' : 'console');
      else if (action === 'undo' || action === 'redo') log('Undo/redo history is disabled in the local demo.', 'warn');
      else if (action === 'about') host.showToast?.({ title: 'AISniper Unity 26.4', message: '本地伪编辑器 · Three.js 场景视图 · 无真实构建管线', icon: 'app-unity' });
      else if (action === 'docs') host.showToast?.({ title: '编辑器文档', message: '文档只存在于这个本地虚构项目里。', icon: 'i-info' });
      else if (action === 'exit') host.closeApp?.('unity');
    }

    function switchConsole(tab) {
      state.consoleTab = tab;
      $$('[data-unity-console]', root).forEach((button) => button.classList.toggle('is-active', button.dataset.unityConsole === tab));
      ui.consoleLines.hidden = tab !== 'console';
      ui.projectGrid.hidden = tab !== 'project';
    }

    function pointerToScene(event) {
      const rect = ui.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function selectFromScene(event) {
      if (!state.camera) return;
      const point = pointerToScene(event);
      const rect = ui.canvas.getBoundingClientRect();
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: (point.x / rect.width) * 2 - 1, y: -(point.y / rect.height) * 2 + 1 }, state.camera);
      const meshes = [];
      state.objects.forEach((object) => {
        if (!object.mesh || !object.mesh.visible) return;
        object.mesh.traverse?.((child) => { if (child.isMesh) meshes.push(child); });
      });
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length) {
        let node = hits[0].object;
        while (node && !node.userData.unityId) node = node.parent;
        if (node?.userData.unityId) selectObject(node.userData.unityId);
      }
    }

    function bindEvents() {
      $$('[data-unity-action]', root).forEach((button) => button.addEventListener('click', () => {
        const action = button.dataset.unityAction;
        if (action === 'play') togglePlay();
        else if (action === 'step') step();
        else if (action === 'create-cube') addPrimitive('cube');
        else if (action === 'reset-transform') resetTransform();
        else if (action === 'add-component') addComponent('Rigidbody');
      }));
      ui.hierarchy.addEventListener('click', (event) => {
        const row = event.target.closest('[data-unity-object]');
        if (row) selectObject(row.dataset.unityObject);
      });
      ui.inspector.addEventListener('input', (event) => {
        const object = selectedObject();
        if (!object) return;
        if (event.target.matches('[data-unity-name]')) {
          object.name = event.target.value || 'GameObject';
          renderHierarchy();
        } else if (event.target.matches('[data-unity-transform]')) {
          const axis = Number(event.target.dataset.axis);
          object.position[axis] = Number(event.target.value) || 0;
          applyObjectTransform(object);
        } else if (event.target.matches('[data-unity-rotation]')) {
          object.rotation[1] = (Number(event.target.value) * Math.PI) / 180;
          applyObjectTransform(object);
          const label = event.target.parentElement?.querySelector('b');
          if (label) label.textContent = `${event.target.value}°`;
        } else if (event.target.matches('[data-unity-scale]')) {
          const value = Number(event.target.value) || 1;
          object.scale = [value, value, value];
          applyObjectTransform(object);
          const label = event.target.parentElement?.querySelector('b');
          if (label) label.textContent = `${value.toFixed(2)}×`;
        }
      });
      ui.inspector.addEventListener('click', (event) => {
        const color = event.target.closest('[data-unity-color]');
        if (!color) return;
        const object = selectedObject();
        if (!object?.mesh) return;
        object.color = color.dataset.unityColor;
        object.mesh.traverse?.((child) => {
          if (child.isMesh && child.material?.color) {
            child.material = child.material.clone();
            child.material.color.set(object.color);
          }
        });
        renderInspector();
      });
      $$('[data-unity-menu]', root).forEach((button) => button.addEventListener('click', (event) => {
        event.stopPropagation();
        showMenu(button.dataset.unityMenu, button);
      }));
      ui.menu.addEventListener('click', (event) => {
        const item = event.target.closest('[data-unity-menu-action]');
        if (item) handleMenuAction(item.dataset.unityMenuAction);
      });
      document.addEventListener('click', (event) => {
        if (!state.menuOpen) return;
        if (!event.target.closest('[data-unity-menu-popover]') && !event.target.closest('[data-unity-menu]')) closeMenu();
      });
      $$('[data-unity-console]', root).forEach((button) => button.addEventListener('click', () => switchConsole(button.dataset.unityConsole)));
      $$('[data-unity-view]', root).forEach((button) => button.addEventListener('click', () => {
        $$('[data-unity-view]', root).forEach((entry) => entry.classList.toggle('is-active', entry === button));
        log(`Switched to ${button.dataset.unityView === 'game' ? 'Game' : 'Scene'} view.`, 'info');
      }));
      ui.canvas.addEventListener('pointerdown', (event) => {
        if (!state.initialized) return;
        state.dragging = true;
        state.dragMoved = false;
        state.dragStart = { x: event.clientX, y: event.clientY };
        state.last = { x: event.clientX, y: event.clientY };
        ui.canvas.setPointerCapture?.(event.pointerId);
      });
      ui.canvas.addEventListener('pointermove', (event) => {
        if (!state.dragging || !state.initialized) return;
        const dx = event.clientX - state.last.x;
        const dy = event.clientY - state.last.y;
        if (Math.abs(event.clientX - state.dragStart.x) + Math.abs(event.clientY - state.dragStart.y) > 4) state.dragMoved = true;
        state.orbit.theta -= dx * 0.008;
        state.orbit.phi = clamp(state.orbit.phi + dy * 0.006, 0.28, 1.42);
        state.last = { x: event.clientX, y: event.clientY };
      });
      ui.canvas.addEventListener('pointerup', (event) => {
        if (!state.dragging) return;
        state.dragging = false;
        if (!state.dragMoved) selectFromScene(event);
        ui.canvas.releasePointerCapture?.(event.pointerId);
      });
      ui.canvas.addEventListener('wheel', (event) => {
        if (!state.initialized) return;
        event.preventDefault();
        state.orbit.radius = clamp(state.orbit.radius + event.deltaY * 0.006, 4.5, 16);
      }, { passive: false });
      document.addEventListener('keydown', (event) => {
        if (!win.classList.contains('is-open') || !win.classList.contains('is-active')) return;
        if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (event.code === 'Delete' || event.code === 'Backspace') {
          event.preventDefault();
          deleteSelected();
        } else if (event.code === 'KeyF') {
          state.orbit = { theta: 0.72, phi: 0.95, radius: 8.8 };
        }
      });
    }

    bindEvents();
    renderAll();
    log('Local project loaded. Waiting for Scene view…', 'info');
    ui.loading.hidden = false;

    return {
      open() {
        if (!buildScene()) return;
        resizeScene();
        setTimeout(() => { applyCamera(); resizeScene(); }, 80);
      },
      close() {
        closeMenu();
      },
      saveScene,
      togglePlay,
      addPrimitive,
      deleteSelected,
      clearConsole,
      resetView() {
        state.orbit = { theta: 0.72, phi: 0.95, radius: 8.8 };
        log('Scene camera reset.', 'info');
      },
      getState() {
        return {
          playing: state.playing,
          selected: selectedObject()?.name || null,
          objects: state.objects.map((object) => ({ id: object.id, name: object.name, type: object.type })),
          logs: state.logs.length
        };
      }
    };
  }

  window.AISniperUnity = { init };
})();
