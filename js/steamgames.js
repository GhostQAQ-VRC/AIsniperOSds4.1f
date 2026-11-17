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
     Counter-Strike 2 — map layouts
     Coordinates are metres on a top-down radar grid. The layouts are built from
     the same callout/route vocabulary as the classic maps: T spawn, CT spawn,
     A/B sites, mid, long, tunnels, apartments and connector routes.
     ========================================================================== */

  const CS2_MAP_LAYOUTS = {
    dust2: {
      name: 'de_dust2', label: '炙热沙城 II', desc: '沙色长道、中央大门与经典 A/B 双包点。',
      palette: { bg: 0x2a2118, fog: 0x9b7e5c, floor: 0x9b7b55, wall: 0x8b6a45, trim: 0xd1a05c, crate: 0x6b4b2a, sun: 0xffd9a0, fill: 0x7fb2d6 },
      bounds: { minX: -38, maxX: 38, minZ: -36, maxZ: 36 },
      spawn: { x: -2, z: -32, yaw: Math.PI }, tSpawn: { x: 20, z: 30 },
      sites: [{ id: 'A', x: 26, z: -22 }, { id: 'B', x: -27, z: -22 }],
      walls: [
        [10, 18, 26, 18, 'sand'], [15, -1, 14, 10, 'sand'], [-26, 20, 10, 14, 'sand'],
        [-27, 0, 10, 9, 'sand'], [-8, 8, 8, 10, 'sand'], [6, 8, 8, 10, 'sand'],
        [-4, -14, 26, 6, 'plaster'], [-30, -8, 8, 8, 'sand'], [8, -22, 10, 8, 'sand'],
        [30, -30, 14, 6, 'plaster'], [-20, -30, 18, 6, 'plaster']
      ],
      crates: [
        [26, -20, 2.4, 2.4, 1.6, 'wood'], [30, -24, 3, 2.2, 1.8, 'wood'], [22, -25, 2.2, 2.2, 1.4, 'wood'],
        [-27, -22, 3, 2.4, 1.7, 'wood'], [-31, -18, 2.2, 2.2, 1.5, 'wood'], [-22, -26, 2.6, 2.6, 1.4, 'wood'],
        [0, 2, 2.6, 2.6, 1.5, 'wood'], [0, -2, 2.4, 2.4, 1.4, 'wood'], [24, 8, 3.2, 2.2, 1.6, 'metal']
      ],
      arches: [],
      callouts: [
        { x: 26, z: -22, text: 'A 点', color: '#ffbe72' }, { x: -27, z: -22, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 4, text: 'MID', color: '#e4d6bb' }, { x: 30, z: 14, text: 'LONG', color: '#e4d6bb' },
        { x: -18, z: 8, text: 'B 通道', color: '#e4d6bb' }, { x: 0, z: 30, text: 'T 出生点', color: '#e0a35c' }
      ],
      botPaths: [
        [[20, 30], [30, 22], [31, 6], [28, -8], [26, -19]],
        [[20, 30], [10, 30], [-4, 30], [-15, 24], [-18, 12], [-18, -6], [-26, -18]],
        [[20, 30], [28, 26], [28, 4], [28, -10], [20, -18], [-2, -24]]
      ]
    },
    mirage: {
      name: 'de_mirage', label: '荒漠迷城', desc: '中路窗户、宫殿、公寓与开阔双包点。',
      palette: { bg: 0x1b1711, fog: 0xa58a68, floor: 0xa88a64, wall: 0x9c7e58, trim: 0xe0b36a, crate: 0x6f5131, sun: 0xffd9a0, fill: 0x83b8d9 },
      bounds: { minX: -38, maxX: 38, minZ: -36, maxZ: 36 },
      spawn: { x: -2, z: -32, yaw: Math.PI }, tSpawn: { x: 0, z: 32 },
      sites: [{ id: 'A', x: 26, z: -22 }, { id: 'B', x: -26, z: -22 }],
      walls: [
        [8, 18, 10, 24, 'plaster'], [-16, 18, 10, 24, 'plaster'], [28, 8, 14, 14, 'plaster'],
        [16, 8, 10, 14, 'sand'], [-28, 12, 16, 16, 'plaster'], [-28, -4, 12, 10, 'sand'],
        [-8, -14, 20, 6, 'plaster'], [16, -6, 8, 8, 'sand'], [-4, 4, 6, 4, 'sand'],
        [30, -30, 14, 6, 'plaster'], [-20, -30, 18, 6, 'plaster']
      ],
      crates: [
        [26, -21, 2.6, 2.6, 1.6, 'wood'], [30, -25, 2.4, 2.4, 1.5, 'wood'], [22, -26, 2.2, 2.2, 1.4, 'wood'],
        [-26, -22, 3, 2.4, 1.7, 'wood'], [-30, -18, 2.2, 2.2, 1.4, 'wood'], [-22, -26, 2.4, 2.4, 1.3, 'wood'],
        [0, 0, 2.4, 2.4, 1.5, 'wood'], [2, 12, 2.8, 2.2, 1.4, 'metal'], [-18, 2, 2.4, 2.4, 1.4, 'wood']
      ],
      arches: [],
      callouts: [
        { x: 26, z: -22, text: 'A 点', color: '#ffbe72' }, { x: -26, z: -22, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 4, text: 'MID', color: '#e4d6bb' }, { x: 26, z: 8, text: 'PALACE', color: '#e4d6bb' },
        { x: -26, z: 12, text: '公寓', color: '#e4d6bb' }, { x: 0, z: 32, text: 'T 出生点', color: '#e0a35c' }
      ],
      botPaths: [
        [[0, 32], [0, 20], [0, 10], [0, 0], [8, -6], [16, -12], [24, -18]],
        [[0, 32], [-8, 30], [-10, 20], [-10, 10], [-10, 0], [-10, -10], [-18, -18], [-26, -18]],
        [[0, 32], [0, 20], [0, 8], [0, -6], [-4, -8], [-2, -20]]
      ]
    },
    inferno: {
      name: 'de_inferno', label: '炼狱小镇', desc: '香蕉道、公寓与狭窄巷道的近距离战场。',
      palette: { bg: 0x1b0e0b, fog: 0x8f5c45, floor: 0x7f5544, wall: 0x7a4f3d, trim: 0xd07850, crate: 0x5e3a29, sun: 0xffbd91, fill: 0xcf8061 },
      bounds: { minX: -38, maxX: 38, minZ: -36, maxZ: 36 },
      spawn: { x: 0, z: -32, yaw: Math.PI }, tSpawn: { x: 0, z: 32 },
      sites: [{ id: 'A', x: 24, z: -22 }, { id: 'B', x: -26, z: -23 }],
      walls: [
        [-20, 14, 12, 24, 'brick'], [10, 14, 12, 24, 'brick'], [-30, 10, 8, 20, 'plaster'],
        [-4, -10, 12, 6, 'plaster'], [16, -4, 10, 10, 'brick'], [-30, -8, 8, 8, 'plaster'],
        [4, -24, 12, 6, 'plaster'], [28, -30, 16, 6, 'brick'], [-20, -30, 16, 6, 'brick']
      ],
      crates: [
        [24, -21, 2.4, 2.4, 1.6, 'wood'], [28, -24, 2.4, 2.4, 1.4, 'wood'], [20, -25, 2.2, 2.2, 1.3, 'wood'],
        [-26, -22, 3, 2.4, 1.7, 'wood'], [-30, -18, 2.2, 2.2, 1.4, 'wood'], [-22, -26, 2.4, 2.4, 1.3, 'wood'],
        [-24, 6, 2.6, 2.6, 1.4, 'wood'], [0, 4, 2.4, 2.4, 1.5, 'wood'], [12, 0, 2.2, 2.2, 1.4, 'metal']
      ],
      arches: [],
      callouts: [
        { x: 24, z: -22, text: 'A 点', color: '#ffb27b' }, { x: -26, z: -23, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 2, text: 'MID', color: '#efd5be' }, { x: -26, z: 12, text: '香蕉道', color: '#efd5be' },
        { x: -16, z: 12, text: '公寓', color: '#efd5be' }, { x: 0, z: 32, text: 'T 出生点', color: '#e0a35c' }
      ],
      botPaths: [
        [[0, 32], [0, 16], [0, 6], [8, -2], [22, -4], [24, -18]],
        [[0, 32], [-10, 30], [-12, 20], [-12, 8], [-12, 0], [-12, -10], [-20, -18], [-26, -18]],
        [[0, 32], [0, 16], [0, 4], [-6, -4], [-12, -14], [-6, -22]]
      ]
    },
    ancient: {
      name: 'de_ancient', label: '远古遗迹', desc: '藤蔓石墙、洞穴与围绕中路的遗迹包点。',
      palette: { bg: 0x0d1712, fog: 0x5f7a62, floor: 0x5b6d55, wall: 0x5a6b51, trim: 0x9bc47a, crate: 0x3e5138, sun: 0xd5e8b6, fill: 0x6ac8a6 },
      bounds: { minX: -36, maxX: 36, minZ: -34, maxZ: 34 },
      spawn: { x: 0, z: -30, yaw: Math.PI }, tSpawn: { x: 0, z: 30 },
      sites: [{ id: 'A', x: 24, z: -20 }, { id: 'B', x: -24, z: -20 }],
      walls: [
        [-14, 14, 12, 20, 'stone'], [10, 14, 12, 20, 'stone'], [-28, 4, 10, 12, 'stone'],
        [-10, -12, 14, 6, 'stone'], [12, -4, 10, 10, 'stone'], [16, -24, 10, 6, 'stone'],
        [28, -28, 16, 6, 'stone'], [-24, -28, 16, 6, 'stone']
      ],
      crates: [
        [24, -19, 2.6, 2.6, 1.6, 'wood'], [28, -23, 2.4, 2.4, 1.4, 'wood'], [20, -24, 2.2, 2.2, 1.3, 'wood'],
        [-24, -19, 2.6, 2.6, 1.6, 'wood'], [-28, -23, 2.4, 2.4, 1.4, 'wood'], [-20, -24, 2.2, 2.2, 1.3, 'wood'],
        [0, 2, 2.4, 2.4, 1.5, 'wood'], [12, -8, 2.2, 2.2, 1.4, 'stone'], [-12, -4, 2.2, 2.2, 1.4, 'stone']
      ],
      arches: [],
      callouts: [
        { x: 24, z: -20, text: 'A 点', color: '#b8e59c' }, { x: -24, z: -20, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 2, text: 'MID', color: '#d7e6c8' }, { x: -24, z: 10, text: '洞穴', color: '#d7e6c8' },
        { x: 14, z: -8, text: 'DONUT', color: '#d7e6c8' }, { x: 0, z: 30, text: 'T 出生点', color: '#e0a35c' }
      ],
      botPaths: [
        [[0, 30], [0, 16], [0, 6], [6, 0], [6, -8], [18, -12], [24, -16]],
        [[0, 30], [-21, 26], [-21, 16], [-21, 8], [-21, 0], [-22, -10], [-24, -16]],
        [[0, 30], [0, 12], [0, 2], [-6, -6], [-8, -18]]
      ]
    },
    anubis: {
      name: 'de_anubis', label: '阿努比斯', desc: '运河、桥洞与神庙街区组成的中距离地图。',
      palette: { bg: 0x1b140d, fog: 0xb2936b, floor: 0xa1825c, wall: 0x947757, trim: 0xd9b46e, crate: 0x6a4f30, sun: 0xffe0ae, fill: 0x79bed8 },
      bounds: { minX: -38, maxX: 38, minZ: -36, maxZ: 36 },
      spawn: { x: -4, z: -32, yaw: Math.PI }, tSpawn: { x: 0, z: 32 },
      sites: [{ id: 'A', x: 24, z: -22 }, { id: 'B', x: -24, z: -22 }],
      walls: [
        [10, 16, 12, 24, 'sand'], [-14, 16, 12, 24, 'sand'], [-28, 4, 10, 14, 'plaster'],
        [14, 0, 10, 12, 'plaster'], [-6, -12, 16, 6, 'plaster'], [26, -28, 16, 6, 'sand'],
        [-24, -28, 16, 6, 'sand'], [-4, 6, 6, 6, 'stone']
      ],
      crates: [
        [24, -21, 2.4, 2.4, 1.5, 'wood'], [28, -24, 2.6, 2.6, 1.6, 'wood'], [20, -25, 2.2, 2.2, 1.3, 'wood'],
        [-24, -21, 2.4, 2.4, 1.5, 'wood'], [-28, -24, 2.6, 2.6, 1.6, 'wood'], [-20, -25, 2.2, 2.2, 1.3, 'wood'],
        [0, 2, 2.4, 2.4, 1.4, 'wood'], [0, 14, 3.2, 2.2, 1.5, 'metal'], [12, -8, 2.2, 2.2, 1.4, 'wood']
      ],
      arches: [],
      callouts: [
        { x: 24, z: -22, text: 'A 点', color: '#ffdc9a' }, { x: -24, z: -22, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 2, text: 'MID', color: '#efe1c8' }, { x: 0, z: 14, text: '运河', color: '#efe1c8' },
        { x: -24, z: 6, text: 'B 桥', color: '#efe1c8' }, { x: 0, z: 32, text: 'T 出生点', color: '#e0a35c' }
      ],
      botPaths: [
        [[0, 32], [0, 18], [0, 8], [2, -2], [8, -8], [18, -14], [24, -18]],
        [[0, 32], [-22, 28], [-22, 18], [-22, 8], [-22, 0], [-22, -8], [-24, -16]],
        [[0, 32], [0, 18], [0, 10], [0, 0], [-2, -8], [-4, -16]]
      ]
    },
    vertigo: {
      name: 'de_vertigo', label: '殒命大厦', desc: '高楼屋顶、通风井与施工平台的垂直战场。',
      palette: { bg: 0x0e161d, fog: 0x62798a, floor: 0x64717a, wall: 0x5b6870, trim: 0x84b4d2, crate: 0x3f4c55, sun: 0xcbe3f4, fill: 0x5e95bd },
      bounds: { minX: -34, maxX: 34, minZ: -34, maxZ: 34 },
      spawn: { x: -16, z: -28, yaw: Math.PI * 0.5 }, tSpawn: { x: 22, z: 29 },
      sites: [{ id: 'A', x: 10, z: -22 }, { id: 'B', x: -24, z: -16 }],
      walls: [
        [-6, 10, 14, 12, 'metal'], [14, 8, 12, 10, 'metal'], [-24, 6, 10, 12, 'metal'],
        [8, -8, 10, 8, 'metal'], [-12, -6, 8, 8, 'metal'], [24, -24, 12, 6, 'metal'],
        [-26, -26, 12, 6, 'metal'], [-4, 24, 14, 6, 'metal'], [20, 22, 12, 6, 'metal']
      ],
      crates: [
        [10, -21, 2.6, 2.6, 1.4, 'metal'], [14, -24, 2.4, 2.4, 1.5, 'wood'], [6, -24, 2.2, 2.2, 1.3, 'wood'],
        [-24, -15, 2.6, 2.6, 1.4, 'metal'], [-28, -19, 2.2, 2.2, 1.3, 'wood'], [-20, -19, 2.2, 2.2, 1.3, 'wood'],
        [0, 2, 2.4, 2.4, 1.4, 'metal'], [16, 2, 2.2, 2.2, 1.3, 'wood'], [-18, 20, 2.2, 2.2, 1.3, 'metal']
      ],
      arches: [],
      callouts: [
        { x: 10, z: -22, text: 'A 点', color: '#a9dbff' }, { x: -24, z: -16, text: 'B 点', color: '#8fd8ff' },
        { x: 0, z: 2, text: 'MID', color: '#dce9f3' }, { x: 22, z: 24, text: '施工区', color: '#dce9f3' },
        { x: -20, z: -28, text: 'CT 出生点', color: '#8fd8ff' }
      ],
      botPaths: [
        [[22, 29], [18, 18], [22, 8], [22, -2], [10, -14], [10, -20]],
        [[22, 29], [8, 24], [0, 20], [-8, 17], [-16, 10], [-16, 2], [-24, -12]],
        [[22, 29], [20, 8], [12, 0], [0, -8], [-16, -18]]
      ]
    }
  };

  /* ==========================================================================
     Counter-Strike 2 — low-poly training match
     ========================================================================== */
  const CS2_WEAPONS = {
    usp: { id: 'usp', name: 'USP-S', cn: 'USP 消音手枪', slot: 'secondary', category: 'pistol', price: 0, damage: 21, rate: 0.22, mag: 12, reserve: 24, spread: 0.0025, model: 'pistol', caliber: '9 × 19 mm', tone: '#7e9bad' },
    p250: { id: 'p250', name: 'P250', cn: 'P250 手枪', slot: 'secondary', category: 'pistol', price: 300, damage: 24, rate: 0.18, mag: 13, reserve: 26, spread: 0.0032, model: 'pistol', caliber: '.40 S&W', tone: '#b28b65' },
    fiveseven: { id: 'fiveseven', name: 'Five-SeveN', cn: 'FN 57 手枪', slot: 'secondary', category: 'pistol', price: 500, damage: 23, rate: 0.17, mag: 20, reserve: 40, spread: 0.0028, model: 'pistol', caliber: '5.7 × 28 mm', tone: '#7fa7b5' },
    deagle: { id: 'deagle', name: 'Desert Eagle', cn: '沙漠之鹰', slot: 'secondary', category: 'pistol', price: 700, damage: 55, rate: 0.4, mag: 7, reserve: 21, spread: 0.0045, model: 'pistol', caliber: '.50 AE', tone: '#c7a36c' },
    dualies: { id: 'dualies', name: 'Dual Berettas', cn: '双持贝瑞塔', slot: 'secondary', category: 'pistol', price: 300, damage: 18, rate: 0.12, mag: 30, reserve: 60, spread: 0.005, model: 'pistol', caliber: '9 × 19 mm', tone: '#8d8c9e' },
    m4a1s: { id: 'm4a1s', name: 'M4A1-S', cn: 'M4A1 消音版', slot: 'primary', category: 'rifle', price: 2900, damage: 30, rate: 0.095, mag: 20, reserve: 80, spread: 0.0022, model: 'rifle', caliber: '5.56 × 45 mm', tone: '#6b8ea5' },
    m4a4: { id: 'm4a4', name: 'M4A4', cn: 'M4A4 步枪', slot: 'primary', category: 'rifle', price: 3100, damage: 28, rate: 0.09, mag: 30, reserve: 90, spread: 0.0028, model: 'rifle', caliber: '5.56 × 45 mm', tone: '#7f8e96' },
    aug: { id: 'aug', name: 'AUG', cn: 'AUG 狙击步枪', slot: 'primary', category: 'rifle', price: 3300, damage: 32, rate: 0.1, mag: 30, reserve: 90, spread: 0.002, model: 'rifle', caliber: '5.56 × 45 mm', tone: '#7d9c76' },
    ssg08: { id: 'ssg08', name: 'SSG 08', cn: 'SSG 08 狙击枪', slot: 'primary', category: 'sniper', price: 1700, damage: 70, rate: 1.25, mag: 10, reserve: 30, spread: 0.0012, model: 'rifle', caliber: '.308 Win', tone: '#6b857e' },
    awp: { id: 'awp', name: 'AWP', cn: 'AWP 狙击枪', slot: 'primary', category: 'sniper', price: 4750, damage: 115, rate: 1.46, mag: 5, reserve: 20, spread: 0.0008, model: 'rifle', caliber: '.338 Lapua', tone: '#4f7f91' },
    mp9: { id: 'mp9', name: 'MP9', cn: 'MP9 冲锋枪', slot: 'primary', category: 'smg', price: 1250, damage: 18, rate: 0.07, mag: 30, reserve: 120, spread: 0.0042, model: 'rifle', caliber: '9 × 19 mm', tone: '#788e99' },
    ump45: { id: 'ump45', name: 'UMP-45', cn: 'UMP-45 冲锋枪', slot: 'primary', category: 'smg', price: 1200, damage: 25, rate: 0.11, mag: 25, reserve: 100, spread: 0.0038, model: 'rifle', caliber: '.45 ACP', tone: '#9a8f7e' },
    p90: { id: 'p90', name: 'P90', cn: 'P90 冲锋枪', slot: 'primary', category: 'smg', price: 2350, damage: 22, rate: 0.075, mag: 50, reserve: 100, spread: 0.0044, model: 'rifle', caliber: '5.7 × 28 mm', tone: '#7b8e86' },
    nova: { id: 'nova', name: 'Nova', cn: '新星霰弹枪', slot: 'primary', category: 'heavy', price: 1050, damage: 19, rate: 0.82, mag: 8, reserve: 32, spread: 0.058, pellets: 6, model: 'rifle', caliber: '12 Gauge', tone: '#9b7d5e' },
    xm1014: { id: 'xm1014', name: 'XM1014', cn: 'XM1014 霰弹枪', slot: 'primary', category: 'heavy', price: 2000, damage: 17, rate: 0.25, mag: 7, reserve: 32, spread: 0.066, pellets: 6, model: 'rifle', caliber: '12 Gauge', tone: '#8d725b' },
    negev: { id: 'negev', name: 'Negev', cn: '内格夫机枪', slot: 'primary', category: 'heavy', price: 1700, damage: 22, rate: 0.06, mag: 150, reserve: 150, spread: 0.008, model: 'rifle', caliber: '5.56 × 45 mm', tone: '#7d8d86' },
    knife: { id: 'knife', name: 'Knife', cn: '战术匕首', slot: 'knife', category: 'knife', price: 0, damage: 55, rate: 0.55, mag: 0, reserve: 0, spread: 0, model: 'knife', caliber: 'MELEE', tone: '#aab7bd' }
  };
  const CS2_BUY_CATEGORIES = [
    { id: 'pistol', label: '手枪', en: 'PISTOLS' },
    { id: 'rifle', label: '步枪', en: 'RIFLES' },
    { id: 'smg', label: '冲锋枪', en: 'SMGS' },
    { id: 'sniper', label: '狙击枪', en: 'SNIPERS' },
    { id: 'heavy', label: '霰弹 / 机枪', en: 'HEAVY' },
    { id: 'gear', label: '装备', en: 'GEAR' }
  ];
  const CS2_GEAR = [
    { id: 'kevlar', name: 'Kevlar Vest', cn: '防弹衣', price: 650, category: 'gear', slot: 'gear', armor: 100, helmet: false, tone: '#6d8996' },
    { id: 'kevlarhelmet', name: 'Kevlar + Helmet', cn: '防弹衣 + 头盔', price: 1000, category: 'gear', slot: 'gear', armor: 100, helmet: true, tone: '#7d9c9f' }
  ];


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
      this.mapData = {};
      Object.entries(CS2_MAP_LAYOUTS).forEach(([key, layout]) => {
        this.mapData[key] = { ...layout, ...layout.palette, key };
      });
      this.colliders = [];
      this.mapGroup = null;
      this.mapLayout = null;
      this.currentCallout = '';
      this.roundsWon = 0;
      this.roundsLost = 0;
      this.credits = 800;
      this.loadout = { primary: null, secondary: 'usp', knife: 'knife' };
      this.weaponAmmo = {};
      this.activeSlot = 'secondary';
      this.buyOpen = false;
      this.buyCategory = 'rifle';
      this.inspectTime = 0;
      this.armor = 0;
      this.helmet = false;
      this.lockGrace = 0;
      this.buildUI();
      this.bindUI();
      this.selectMap(this.selectedMap);
    }

    toast(message, tone = '') {
      this.host?.showToast?.({ title: 'Counter-Strike 2', message, icon: 'app-steam' });
    }

    mapCardsMarkup() {
      return Object.entries(this.mapData).map(([key, map], index) => `
        <button class="cs2-map-card${key === this.selectedMap ? ' is-active' : ''}" data-cs2-map="${key}" type="button">
          <span class="cs2-map-art">${this.mapPreview(key)}</span>
          <span class="cs2-map-card-copy"><b>${escapeHTML(map.name)}</b><small>${escapeHTML(map.label)}</small></span>
          <em class="cs2-map-card-tag">${String(index + 1).padStart(2, '0')}</em>
        </button>`).join('');
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
              <div class="cs2-wave-card"><span>回合</span><b class="cs2-wave">01</b><small class="cs2-round-score">CT 0 · T 0</small></div>
              <div class="cs2-credits-card"><span>余额</span><b class="cs2-credits">$800</b><small>BUY</small></div>
            </div>
            <div class="cs2-crosshair"><i></i><i></i><i></i><i></i><b></b></div>
            <div class="cs2-hitmarker" hidden><i></i><i></i><i></i><i></i></div>
            <div class="cs2-killfeed"></div>
            <div class="cs2-location-chip"><i></i><span class="cs2-location">CT 出生点</span><small>128 TICK</small></div>
            <div class="cs2-hud-bottom">
              <div class="cs2-health-block"><div class="cs2-hud-label"><span>生命</span><b class="cs2-health-value">100</b></div><div class="cs2-health-track"><i class="cs2-health-fill"></i></div><div class="cs2-armor-line"><span>护甲</span><b class="cs2-armor-value">0</b></div></div>
              <div class="cs2-ammo-block"><span class="cs2-weapon-name">USP-S</span><b class="cs2-ammo-value">12</b><span>/ <em class="cs2-ammo-reserve">24</em></span><small class="cs2-ammo-caliber">9 × 19 mm</small></div>
              <div class="cs2-loadout" aria-label="武器槽位">
                <span class="cs2-loadout-slot" data-cs2-slot="primary"><i>1</i><b>—</b></span>
                <span class="cs2-loadout-slot is-active" data-cs2-slot="secondary"><i>2</i><b>USP-S</b></span>
                <span class="cs2-loadout-slot" data-cs2-slot="knife"><i>3</i><b>刀</b></span>
              </div>
              <div class="cs2-kills-block"><span>淘汰</span><b class="cs2-kills">0</b></div>
            </div>
            <div class="cs2-hint-line"><span>WASD 移动</span><span>左键射击</span><span>1/2/3 武器</span><span>B 购买</span><span>F 检视</span><span>R 装填</span><span>Esc 释放鼠标</span></div>
          </div>
          <div class="cs2-overlay cs2-lobby-panel">
            <div class="cs2-lobby-backdrop" aria-hidden="true">
              <div class="cs2-lobby-gridlines"></div>
              <div class="cs2-lobby-mapmark mapmark-a">A</div>
              <div class="cs2-lobby-mapmark mapmark-b">B</div>
              <div class="cs2-lobby-haze"></div>
            </div>
            <header class="cs2-mainnav">
              <div class="cs2-mainnav-left">
                <span class="cs2-lobby-mark">2</span>
                <div><b>COUNTER-STRIKE <i>2</i></b><small>AISNIPER · PREMIER</small></div>
              </div>
              <nav class="cs2-mainnav-tabs" aria-label="CS2 主导航">
                <button class="is-active" type="button"><span>开始游戏</span><small>PLAY</small></button>
                <button type="button"><span>观战</span><small>WATCH</small></button>
                <button type="button"><span>军械库</span><small>ARMORY</small></button>
                <button type="button"><span>商店</span><small>STORE</small></button>
                <button type="button"><span>个人资料</span><small>PROFILE</small></button>
              </nav>
              <div class="cs2-mainnav-right">
                <span class="cs2-mainnav-chip"><i></i>8 ms</span>
                <span class="cs2-mainnav-level">LVL <b>42</b></span>
                <span class="cs2-mainnav-name">SNIPER</span>
              </div>
            </header>
            <div class="cs2-lobby-content">
              <section class="cs2-play-stack">
                <div class="cs2-play-card">
                  <div class="cs2-play-bg" data-play-bg aria-hidden="true"></div>
                  <span class="cs2-play-watermark">PLAY</span>
                  <div class="cs2-play-card-top">
                    <span class="cs2-play-kicker"><i></i>优先匹配 · 本地服务器</span>
                    <span class="cs2-play-season">第 4 赛季 · 黄金 3</span>
                  </div>
                  <div class="cs2-play-hero">
                    <div>
                      <h2>竞技匹配</h2>
                      <p>5v5 竞技 · 128 tick · 本地 BOT 填充</p>
                      <div class="cs2-play-modes"><button class="is-active" type="button">优先匹配</button><button type="button">竞技</button><button type="button">休闲</button></div>
                    </div>
                    <div class="cs2-play-score"><span>CT</span><b>0</b><em>:</em><b>0</b><span class="t">T</span></div>
                  </div>
                  <div class="cs2-play-maprow">
                    <div class="cs2-play-mapthumb"><span class="cs2-play-mapletter">A</span><small>SELECTED</small></div>
                    <div class="cs2-play-mapcopy">
                      <span>当前地图</span>
                      <b class="cs2-map-label">荒漠迷城</b>
                      <small class="cs2-map-desc">沙色长道、中央大门与经典 A/B 双包点。</small>
                      <em class="cs2-selected-map-name">de_mirage</em>
                    </div>
                    <div class="cs2-play-mapstats"><span>地图池</span><b>6</b><small>ACTIVE DUTY</small></div>
                  </div>
                  <div class="cs2-play-actions">
                    <button class="cs2-primary-btn cs2-start-btn"><span>开始比赛</span><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></button>
                    <button class="cs2-secondary-btn cs2-matchmaking-btn"><span>寻找竞技比赛</span><svg viewBox="0 0 24 24"><use href="#i-search"></use></svg></button>
                    <span class="cs2-play-note">本地 BOT · 无真实联网</span>
                  </div>
                </div>
                <div class="cs2-map-picker">
                  <div class="cs2-map-picker-head">
                    <div><span>地图池</span><b>选择地图</b></div>
                    <small><i></i>6 张现役地图 · 本地布局</small>
                  </div>
                  <div class="cs2-map-grid">${this.mapCardsMarkup()}</div>
                  <div class="cs2-map-picker-foot"><span><i></i>经典雷达布局 · 本地低模重构</span><em>BOT 会按 A / B 路线进攻</em></div>
                </div>
              </section>
              <aside class="cs2-lobby-side">
                <div class="cs2-party-card">
                  <div class="cs2-party-head"><span>你的队伍</span><b>1 / 5</b></div>
                  <div class="cs2-party-list">
                    <div class="cs2-party-row"><span class="cs2-party-avatar me">S</span><div><b>Sniper</b><small>队长 · 你</small></div><em>READY</em></div>
                    <div class="cs2-party-row"><span class="cs2-party-avatar">K</span><div><b>Kai</b><small>本地 BOT</small></div><em>BOT</em></div>
                    <div class="cs2-party-row"><span class="cs2-party-avatar">N</span><div><b>Nova</b><small>本地 BOT</small></div><em>BOT</em></div>
                    <div class="cs2-party-row is-empty"><span class="cs2-party-avatar">+</span><div><b>开放槽位</b><small>等待好友加入</small></div><em>+</em></div>
                  </div>
                  <button class="cs2-party-invite" type="button">邀请好友</button>
                </div>
                <div class="cs2-news-card">
                  <span class="cs2-news-kicker">本周轮换</span>
                  <b>优先匹配 · 第 4 赛季</b>
                  <p>完成回合、赢下拆包战，提升你的竞技评分。所有对局均在本地运行。</p>
                  <div class="cs2-news-tags"><span>DUST II</span><span>MIRAGE</span><span>INFERNO</span></div>
                </div>
                <div class="cs2-server-card"><span><i></i>服务器在线</span><b>128 tick</b><small>延迟 8 ms · 本地实例</small></div>
              </aside>
            </div>
            <footer class="cs2-lobby-footer">
              <span class="cs2-footer-status"><i></i>已连接 AISNIPER 竞技服务器</span>
              <span>训练赛 · 本地 BOT · 无真实联网</span>
              <span class="cs2-footer-hint">WASD 移动 · 左键射击 · R 装填 · Esc 释放鼠标</span>
            </footer>
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
          <div class="cs2-overlay cs2-buy-panel" hidden>
            <div class="cs2-buy-shell">
              <header class="cs2-buy-head">
                <div><span>BUY MENU · <b class="cs2-buy-clock">FREEZE TIME</b></span><h2>购买装备</h2></div>
                <div class="cs2-buy-balance"><span>可用资金</span><b class="cs2-buy-money">$800</b></div>
                <button class="cs2-buy-close" data-cs2-buy-close type="button" aria-label="关闭购买菜单">×</button>
              </header>
              <div class="cs2-buy-tabs">
                ${CS2_BUY_CATEGORIES.map((cat) => `<button data-cs2-buy-cat="${cat.id}" type="button" class="${cat.id === 'rifle' ? 'is-active' : ''}"><b>${cat.label}</b><small>${cat.en}</small></button>`).join('')}
              </div>
              <div class="cs2-buy-grid"></div>
              <footer class="cs2-buy-foot"><span>1 主武器 · 2 副武器 · 3 刀 · F 检视</span><span>购买后立即装备，资金会从本回合余额扣除</span><button data-cs2-buy-close type="button">完成</button></footer>
            </div>
          </div>
          <div class="cs2-overlay cs2-over-panel" hidden>
            <span class="cs2-eyebrow">比赛结束</span>
            <h2>反恐精英落败。</h2>
            <div class="cs2-result-grid">
              <div><span>淘汰</span><b class="cs2-final-kills">0</b></div>
              <div><span>命中率</span><b class="cs2-final-accuracy">0%</b></div>
              <div><span>回合</span><b class="cs2-final-wave">1</b></div>
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
        armor: $('.cs2-armor-value', this.root),
        ammo: $('.cs2-ammo-value', this.root),
        reserve: $('.cs2-ammo-reserve', this.root),
        ammoCaliber: $('.cs2-ammo-caliber', this.root),
        weaponName: $('.cs2-weapon-name', this.root),
        credits: $('.cs2-credits', this.root),
        loadout: $('.cs2-loadout', this.root),
        buyPanel: $('.cs2-buy-panel', this.root),
        buyGrid: $('.cs2-buy-grid', this.root),
        buyMoney: $('.cs2-buy-money', this.root),
        buyTabs: $('.cs2-buy-tabs', this.root),
        kills: $('.cs2-kills', this.root),
        wave: $('.cs2-wave', this.root),
        timer: $('.cs2-timer', this.root),
        killfeed: $('.cs2-killfeed', this.root),
        location: $('.cs2-location', this.root),
        roundScore: $('.cs2-round-score', this.root),
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
        playMapThumb: $('.cs2-play-mapthumb', this.root),
        playBg: $('[data-play-bg]', this.root),
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
      this.refs.buyPanel?.addEventListener('click', (event) => {
        if (event.target.closest('[data-cs2-buy-close]')) { this.toggleBuyMenu(false); return; }
        const tab = event.target.closest('[data-cs2-buy-cat]');
        if (tab) { this.buyCategory = tab.dataset.cs2BuyCat; this.renderBuyMenu(); return; }
        const item = event.target.closest('[data-cs2-buy]');
        if (item) { this.buyItem(item.dataset.cs2Buy); return; }
      });
      this.refs.loadout?.addEventListener('click', (event) => {
        const slot = event.target.closest('[data-cs2-slot]');
        if (slot) this.switchWeaponSlot(slot.dataset.cs2Slot);
      });
      $$('.cs2-play-modes button', this.root).forEach((button) => {
        button.addEventListener('click', () => {
          $$('.cs2-play-modes button', this.root).forEach((entry) => entry.classList.toggle('is-active', entry === button));
          this.toast(`模式 · ${button.textContent}`);
        });
      });
      $$('.cs2-mainnav-tabs button', this.root).forEach((button) => {
        button.addEventListener('click', () => {
          $$('.cs2-mainnav-tabs button', this.root).forEach((entry) => entry.classList.toggle('is-active', entry === button));
          const label = button.querySelector('span')?.textContent || '';
          if (label === '开始游戏') return;
          this.host?.showToast?.({ title: `CS2 · ${label}`, message: '当前版本开放优先匹配、地图池与本地训练赛。', icon: 'app-steam' });
        });
      });
      $('.cs2-party-invite', this.root)?.addEventListener('click', () => {
        this.host?.showToast?.({ title: '邀请已复制', message: '好友邀请链接已复制到剪贴板（本地模拟）。', icon: 'app-steam' });
      });
      this.refs.canvas?.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || !this.running || this.over || this.buyOpen) return;
        if (document.pointerLockElement !== this.refs.canvas) {
          this.requestLock();
          return;
        }
      });
      document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement !== this.refs.canvas) return;
        if (!this.running || this.paused || this.over || this.buyOpen) return;
        if (performance.now() < (this.lockGrace || 0)) return;
        const dx = clamp(Number(event.movementX) || 0, -110, 110);
        const dy = clamp(Number(event.movementY) || 0, -110, 110);
        if (Math.abs(dx) >= 109 || Math.abs(dy) >= 109) return;
        this.yaw -= dx * 0.0021;
        this.pitch = clamp(this.pitch - dy * 0.0018, -1.25, 1.25);
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
          this.lockGrace = performance.now() + 220;
          if (this.running && !this.over && this.paused) this.resume(false);
        } else if (this.wasLocked) {
          this.wasLocked = false;
          if (this.running && !this.over && !this.buyOpen) this.pause();
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
      if (this.buyOpen) {
        if (down && (event.code === 'KeyB' || event.code === 'Escape')) this.toggleBuyMenu(false);
        return;
      }
      const codes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyB', 'KeyF', 'Digit1', 'Digit2', 'Digit3', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
      if (codes.includes(event.code)) event.preventDefault();
      if (down) {
        this.keys.add(event.code);
        if (event.code === 'KeyR') this.reload();
        if (event.code === 'KeyB') this.toggleBuyMenu();
        if (event.code === 'KeyF') this.inspectWeapon();
        if (event.code === 'Digit1') this.switchWeaponSlot('primary');
        if (event.code === 'Digit2') this.switchWeaponSlot('secondary');
        if (event.code === 'Digit3') this.switchWeaponSlot('knife');
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
      if (this.buyOpen) return;
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
        this.camera = new THREE.PerspectiveCamera(73, 1, 0.1, 900);
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
      this.ambientLight = new THREE.AmbientLight(0x6c8099, 0.46);
      this.scene.add(this.ambientLight);
      this.scene.fog = new THREE.FogExp2(0x9b7e5c, 0.0068);
      this.buildMapGeometry(this.selectedMap, { lobby: true });
    }

    cs2GroundTexture(palette, kind = 'sand') {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      let seed = 0x2f6e2b1;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const base = new THREE.Color(palette.floor);
      ctx.fillStyle = `#${base.getHexString()}`;
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2400; i += 1) {
        const alpha = 0.025 + random() * 0.09;
        ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.4})`;
        const size = 1 + Math.floor(random() * 8);
        ctx.fillRect(random() * 512, random() * 512, size, size);
      }
      ctx.strokeStyle = 'rgba(24,20,14,.2)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      if (kind === 'sand') {
        for (let i = 0; i < 34; i += 1) {
          ctx.strokeStyle = `rgba(255,238,196,${0.03 + random() * 0.05})`;
          ctx.beginPath();
          const y = random() * 512;
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(150, y + 24, 320, y - 20, 512, y + 8);
          ctx.stroke();
        }
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(14, 14);
      return texture;
    }

    makeSiteTexture(letter, color = '#ffb45f') {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, 256, 256);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.64;
      ctx.lineWidth = 7;
      ctx.strokeRect(22, 22, 212, 212);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = color;
      ctx.font = '800 152px "Arial Narrow", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 128, 140);
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      return texture;
    }

    mapPreview(key) {
      const layout = this.mapData[key] || this.mapData.mirage;
      const b = layout.bounds;
      const W = 160;
      const H = 96;
      const pad = 8;
      const sx = (W - pad * 2) / Math.max(1, b.maxX - b.minX);
      const sz = (H - pad * 2) / Math.max(1, b.maxZ - b.minZ);
      const tx = (x) => pad + (x - b.minX) * sx;
      const tz = (z) => pad + (z - b.minZ) * sz;
      const wallColor = `#${new THREE.Color(layout.palette.wall).offsetHSL(0, 0, 0.18).getHexString()}`;
      const floorColor = `#${new THREE.Color(layout.palette.floor).offsetHSL(0, 0, -0.08).getHexString()}`;
      const accent = `#${new THREE.Color(layout.palette.trim).getHexString()}`;
      const walls = layout.walls.map(([x, z, w, d]) => (
        `<rect x="${(tx(x - w / 2)).toFixed(1)}" y="${(tz(z - d / 2)).toFixed(1)}" width="${Math.max(1, w * sx).toFixed(1)}" height="${Math.max(1, d * sz).toFixed(1)}" fill="${wallColor}" stroke="rgba(255,255,255,.14)" stroke-width=".5"/>`
      )).join('');
      const crates = layout.crates.map(([x, z, w, d]) => (
        `<rect x="${(tx(x - w / 2)).toFixed(1)}" y="${(tz(z - d / 2)).toFixed(1)}" width="${Math.max(1, w * sx).toFixed(1)}" height="${Math.max(1, d * sz).toFixed(1)}" fill="${accent}" opacity=".52"/>`
      )).join('');
      const sites = layout.sites.map((site) => (
        `<circle cx="${tx(site.x).toFixed(1)}" cy="${tz(site.z).toFixed(1)}" r="5.2" fill="${site.id === 'A' ? '#f0a050' : '#69bde0'}" opacity=".88"/><text x="${tx(site.x).toFixed(1)}" y="${(tz(site.z) + 2.4).toFixed(1)}" fill="#0b1115" font-size="5.8" font-weight="800" text-anchor="middle">${site.id}</text>`
      )).join('');
      const paths = layout.botPaths.map((path) => (
        `<polyline points="${path.map(([x, z]) => `${tx(x).toFixed(1)},${tz(z).toFixed(1)}`).join(' ')}" fill="none" stroke="${accent}" stroke-width=".8" stroke-dasharray="2 3" opacity=".42"/>`
      )).join('');
      return `<svg class="cs2-map-blueprint" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect x="0" y="0" width="${W}" height="${H}" fill="${floorColor}"/><rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2}" fill="rgba(0,0,0,.16)" stroke="rgba(255,255,255,.18)" stroke-width=".7"/>${paths}${walls}${crates}${sites}</svg>`;
    }

    cs2WallTexture(kind = 'sand') {
      if (typeof document === 'undefined') return null;
      this.cs2WallTextures = this.cs2WallTextures || {};
      if (this.cs2WallTextures[kind]) return this.cs2WallTextures[kind];
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = kind === 'metal' ? '#9aa2a4' : kind === 'plaster' ? '#c9c3b7' : kind === 'brick' ? '#b39b8e' : '#bcae96';
      ctx.fillRect(0, 0, 256, 256);
      let seed = kind === 'metal' ? 881 : kind === 'brick' ? 1921 : kind === 'plaster' ? 331 : 771;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 1800; i += 1) {
        ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${0.025 + random() * 0.08})` : `rgba(20,22,20,${0.02 + random() * 0.1})`;
        ctx.fillRect(random() * 256, random() * 256, 1 + random() * 5, 1 + random() * 3);
      }
      if (kind === 'brick') {
        ctx.strokeStyle = 'rgba(58,47,40,.34)';
        ctx.lineWidth = 2;
        for (let row = 0; row < 16; row += 1) {
          const y = row * 16;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(256, y);
          ctx.stroke();
          const offset = row % 2 ? 16 : 0;
          for (let col = 0; col < 9; col += 1) {
            ctx.beginPath();
            ctx.moveTo(offset + col * 32, y);
            ctx.lineTo(offset + col * 32, y + 16);
            ctx.stroke();
          }
        }
      } else if (kind === 'metal') {
        ctx.strokeStyle = 'rgba(36,44,47,.28)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * 52, 0);
          ctx.lineTo(i * 52, 256);
          ctx.stroke();
        }
        for (let i = 0; i < 16; i += 1) {
          ctx.fillStyle = 'rgba(232,234,230,.16)';
          ctx.beginPath();
          ctx.arc(12 + (i % 5) * 52, 12 + Math.floor(i / 5) * 52, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(66,58,48,.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i += 1) {
          let x = random() * 256;
          let y = random() * 256;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let step = 0; step < 4; step += 1) {
            x += (random() - 0.5) * 22;
            y += 8 + random() * 15;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      for (let i = 0; i < 14; i += 1) {
        const x = random() * 256;
        const y = random() * 256;
        ctx.fillStyle = `rgba(25,24,20,${0.12 + random() * 0.18})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + random() * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
      this.cs2WallTextures[kind] = texture;
      return texture;
    }

    buildMapGeometry(key = this.selectedMap, options = {}) {
      const rawLayout = this.mapData[key] || this.mapData.mirage;
      const S = rawLayout.worldScale || 1.15;
      const scalePoint = ([x, z]) => [x * S, z * S];
      const layout = {
        ...rawLayout,
        bounds: {
          minX: rawLayout.bounds.minX * S, maxX: rawLayout.bounds.maxX * S,
          minZ: rawLayout.bounds.minZ * S, maxZ: rawLayout.bounds.maxZ * S
        },
        spawn: { ...rawLayout.spawn, x: rawLayout.spawn.x * S, z: rawLayout.spawn.z * S },
        tSpawn: { ...rawLayout.tSpawn, x: rawLayout.tSpawn.x * S, z: rawLayout.tSpawn.z * S },
        sites: rawLayout.sites.map((site) => ({ ...site, x: site.x * S, z: site.z * S })),
        walls: rawLayout.walls.map(([x, z, w, d, kind]) => [x * S, z * S, w * S, d * S, kind]),
        crates: rawLayout.crates.map(([x, z, w, d, h, kind]) => [x * S, z * S, w * S, d * S, h, kind]),
        arches: (rawLayout.arches || []).map(([x, z, w, d, h]) => [x * S, z * S, w * S, d * S, h]),
        callouts: (rawLayout.callouts || []).map((callout) => ({ ...callout, x: callout.x * S, z: callout.z * S })),
        botPaths: (rawLayout.botPaths || []).map((path) => path.map(scalePoint))
      };
      this.mapLayout = layout;
      this.currentMapKey = key;
      if (this.mapGroup) {
        this.scene.remove(this.mapGroup);
        this.mapGroup.traverse((child) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
            else child.material.dispose?.();
          }
        });
      }
      const group = new THREE.Group();
      this.mapGroup = group;
      this.scene.add(group);
      const palette = layout.palette;
      if (window.AISniperModels?.createSkyDome) {
        const hex = (value) => `#${new THREE.Color(value).getHexString()}`;
        const sky = window.AISniperModels.createSkyDome({
          radius: 620,
          top: hex(palette.bg),
          horizon: hex(palette.fog),
          bottom: hex(new THREE.Color(palette.floor).offsetHSL(0, 0, -0.16)),
          cloud: key === 'vertigo' ? 'rgba(220,235,245,.13)' : 'rgba(255,248,226,.15)',
          sun: hex(palette.sun)
        });
        group.add(sky.group);
        this.cs2Sky = sky;
      }
      this.obstacles = [];
      this.colliders = [];
      const bounds = layout.bounds;
      const width = bounds.maxX - bounds.minX;
      const depth = bounds.maxZ - bounds.minZ;
      const centerX = (bounds.minX + bounds.maxX) * 0.5;
      const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
      this.mapCenter = new THREE.Vector3(centerX, 0, centerZ);
      this.scene.background = new THREE.Color(palette.bg);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(palette.fog);
        this.scene.fog.density = 0.0068;
      }
      this.sunLight.color.setHex(palette.sun);
      this.hemiLight.color.setHex(palette.sun);
      this.fillLight.color.setHex(palette.fill);

      const groundTexture = this.cs2GroundTexture(palette, key === 'dust2' || key === 'anubis' ? 'sand' : 'stone');
      const floorMat = new THREE.MeshStandardMaterial({
        map: groundTexture || null, color: groundTexture ? 0xffffff : palette.floor,
        roughness: 0.95, metalness: 0.03
      });
      this.floorMaterial = floorMat;
      const outerFloor = new THREE.Mesh(new THREE.PlaneGeometry(width + 140, depth + 140), floorMat);
      outerFloor.rotation.x = -Math.PI / 2;
      outerFloor.position.set(centerX, -0.05, centerZ);
      group.add(outerFloor);
      const playFloor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({
        map: groundTexture || null, color: groundTexture ? 0xf2e6d4 : palette.floor,
        roughness: 0.94, metalness: 0.02
      }));
      playFloor.rotation.x = -Math.PI / 2;
      playFloor.position.set(centerX, 0.01, centerZ);
      playFloor.receiveShadow = true;
      group.add(playFloor);

      const wallColor = new THREE.Color(palette.wall);
      const plasterColor = wallColor.clone().offsetHSL(0, 0, 0.1);
      const brickColor = wallColor.clone().offsetHSL(-0.01, 0.05, -0.08);
      const stoneColor = wallColor.clone().offsetHSL(0, -0.03, -0.03);
      const metalColor = new THREE.Color(palette.crate).offsetHSL(0, -0.03, 0.12);
      const materialFor = (kind) => {
        const texture = this.cs2WallTexture(kind);
        return new THREE.MeshStandardMaterial({
          color: kind === 'plaster' ? plasterColor : kind === 'brick' ? brickColor : kind === 'stone' ? stoneColor : kind === 'metal' ? metalColor : wallColor,
          map: texture || null,
          bumpMap: texture || null,
          bumpScale: 0.018,
          roughness: kind === 'metal' ? 0.58 : 0.94,
          metalness: kind === 'metal' ? 0.45 : 0.04
        });
      };
      const wallMat = materialFor('sand');
      const trimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.trim), emissive: new THREE.Color(palette.trim),
        emissiveIntensity: 0.06, roughness: 0.72
      });
      const crateMat = new THREE.MeshStandardMaterial({ color: palette.crate, roughness: 0.84, metalness: 0.08 });
      this.wallMaterial = wallMat;
      this.trimMaterial = trimMat;
      this.crateMaterial = crateMat;

      const addBox = (w, h, d, x, y, z, material, collidable = true, rotate = 0) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotate;
        group.add(mesh);
        if (collidable && h > 0.6) {
          this.obstacles.push(mesh);
          this.colliders.push({ minX: x - w * 0.5, maxX: x + w * 0.5, minZ: z - d * 0.5, maxZ: z + d * 0.5, height: h });
        }
        return mesh;
      };
      const addWall = (x, z, w, d, kind = 'sand', height = 5) => {
        const material = materialFor(kind);
        const mesh = addBox(w, height, d, x, height * 0.5, z, material);
        const cap = addBox(w + 0.22, 0.24, d + 0.22, x, height + 0.12, z, trimMat, false);
        cap.material = trimMat;
        if (w > 5.5 && d > 3) {
          const paneMat = new THREE.MeshStandardMaterial({
            color: 0x1a2329, emissive: new THREE.Color(palette.fill), emissiveIntensity: 0.16,
            roughness: 0.28, metalness: 0.35
          });
          const count = Math.min(4, Math.max(1, Math.floor(w / 6)));
          for (let i = 0; i < count; i += 1) {
            const px = x - w * 0.5 + (i + 0.5) * (w / count);
            addBox(w / count * 0.42, 0.68, 0.06, px, height * 0.62, z + d * 0.5 + 0.015, paneMat, false);
          }
        }
        return mesh;
      };

      const boundaryHeight = 7;
      addWall(centerX, bounds.minZ - 0.5, width + 2, 1.2, 'stone', boundaryHeight);
      addWall(centerX, bounds.maxZ + 0.5, width + 2, 1.2, 'stone', boundaryHeight);
      addWall(bounds.minX - 0.5, centerZ, 1.2, depth + 2, 'stone', boundaryHeight);
      addWall(bounds.maxX + 0.5, centerZ, 1.2, depth + 2, 'stone', boundaryHeight);

      layout.walls.forEach(([x, z, w, d, kind]) => addWall(x, z, w, d, kind || 'sand', 4.6));
      layout.crates.forEach(([x, z, w, d, h, kind]) => {
        const mat = kind === 'metal' ? materialFor('metal') : crateMat;
        addBox(w, h, d, x, h * 0.5, z, mat);
        addBox(w + 0.12, 0.12, d + 0.12, x, h + 0.06, z, trimMat, false);
      });
      (layout.arches || []).forEach(([x, z, w, d, h]) => {
        const pillar = 1.2;
        addWall(x - w * 0.5 + pillar * 0.5, z, pillar, d, 'stone', h);
        addWall(x + w * 0.5 - pillar * 0.5, z, pillar, d, 'stone', h);
        addBox(w, 1.1, d, x, h - 0.55, z, materialFor('stone'), false);
      });

      const accentA = new THREE.Color('#ffb15f');
      const accentB = new THREE.Color('#6cc6e8');
      layout.sites.forEach((site) => {
        const color = site.id === 'A' ? accentA : accentB;
        const padMat = new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.28), emissive: color, emissiveIntensity: 0.12,
          roughness: 0.9, metalness: 0.02, transparent: true, opacity: 0.92
        });
        addBox(9.5, 0.08, 9.5, site.x, 0.05, site.z, padMat, false);
        const texture = this.makeSiteTexture(site.id, site.id === 'A' ? '#ffbd75' : '#86dcff');
        if (texture) {
          const plane = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({
            map: texture, transparent: true, depthWrite: false, opacity: 0.9
          }));
          plane.rotation.x = -Math.PI / 2;
          plane.position.set(site.x, 0.12, site.z);
          group.add(plane);
        }
        const glow = new THREE.PointLight(color, 0.65, 18, 2);
        glow.position.set(site.x, 3, site.z);
        group.add(glow);
      });

      const spawnPad = (x, z, color) => {
        const pad = new THREE.Mesh(new THREE.CircleGeometry(4.4, 28), new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 0.16, depthWrite: false
        }));
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(x, 0.06, z);
        group.add(pad);
        const ring = new THREE.Mesh(new THREE.RingGeometry(4.1, 4.5, 28), new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false
        }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.08, z);
        group.add(ring);
      };
      spawnPad(layout.spawn.x, layout.spawn.z, 0x6cc6e8);
      spawnPad(layout.tSpawn.x, layout.tSpawn.z, 0xe09a4e);

      (layout.callouts || []).forEach((callout) => {
        if (callout.text === 'T 出生点' || callout.text === 'CT 出生点') return;
        const label = makeLabel(callout.text, callout.color || '#e9ddc7');
        label.position.set(callout.x, 2.35, callout.z);
        label.scale.set(2.9, 0.58, 1);
        group.add(label);
      });

      const skylineColor = new THREE.Color(palette.wall).offsetHSL(0, -0.06, -0.12);
      const skylineMat = new THREE.MeshStandardMaterial({ color: skylineColor, roughness: 0.96, metalness: 0.02 });
      const randomSeed = (name) => {
        let value = 0;
        for (let i = 0; i < name.length; i += 1) value = (value * 31 + name.charCodeAt(i)) >>> 0;
        return () => {
          value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
          return value / 4294967296;
        };
      };
      const random = randomSeed(key);
      for (let i = 0; i < 26; i += 1) {
        const angle = (i / 26) * Math.PI * 2 + random() * 0.12;
        const radius = Math.max(width, depth) * (0.72 + random() * 0.42);
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        const h = 7 + random() * (key === 'vertigo' ? 34 : 22);
        addBox(5 + random() * 9, h, 5 + random() * 9, x, h * 0.5 - 0.2, z, skylineMat, false, random() * 0.5);
      }
      for (let i = 0; i < 18; i += 1) {
        const x = bounds.minX + 1 + random() * (width - 2);
        const z = bounds.minZ + 1 + random() * (depth - 2);
        if (Math.hypot(x - layout.spawn.x, z - layout.spawn.z) < 5) continue;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.05, 8), new THREE.MeshStandardMaterial({
          color: i % 3 ? 0x4c3b28 : 0x40545b, roughness: 0.8, metalness: 0.22
        }));
        barrel.position.set(x, 0.53, z);
        group.add(barrel);
      }

      this.buildNavGrid();
      this.applyMapTheme(key);
      if (!options.lobby) {
        this.player.set(layout.spawn.x, 1.7, layout.spawn.z);
        this.yaw = layout.spawn.yaw || 0;
        this.pitch = 0;
      }
      return layout;
    }

    currentWeapon() {
      return CS2_WEAPONS[this.loadout?.[this.activeSlot]] || null;
    }

    saveCurrentAmmo() {
      const weapon = this.currentWeapon();
      if (!weapon || weapon.slot === 'knife') return;
      this.weaponAmmo[weapon.id] = { ammo: this.ammo, reserve: this.reserve };
    }

    equipWeaponSlot(slot, silent = false) {
      const id = this.loadout?.[slot];
      const weapon = CS2_WEAPONS[id];
      if (!weapon) return false;
      if (this.activeSlot !== slot) this.saveCurrentAmmo();
      this.activeSlot = slot;
      this.currentWeaponId = weapon.id;
      this.mag = weapon.mag;
      this.reloading = false;
      clearTimeout(this.reloadTimer);
      if (weapon.slot === 'knife') {
        this.ammo = 0;
        this.reserve = 0;
      } else {
        const state = this.weaponAmmo[weapon.id] || { ammo: weapon.mag, reserve: weapon.reserve };
        this.weaponAmmo[weapon.id] = state;
        this.ammo = state.ammo;
        this.reserve = state.reserve;
      }
      this.inspectTime = 0;
      this.buildGun(true);
      if (!silent) this.toast(`切换武器 · ${weapon.cn}`, 'success');
      this.updateHUD();
      return true;
    }

    switchWeaponSlot(slot) {
      if (this.buyOpen || this.reloading) return;
      if (!this.loadout?.[slot]) {
        this.toast(slot === 'primary' ? '还没有购买主武器 · 按 B 打开购买菜单' : '这个槽位为空');
        return;
      }
      this.equipWeaponSlot(slot);
    }

    inspectWeapon() {
      if (this.buyOpen || !this.currentWeapon()) return;
      this.inspectTime = 1.35;
      const weapon = this.currentWeapon();
      this.toast(`检视武器 · ${weapon.name} · ${weapon.cn}`);
      this.audio?.play('ui');
    }

    buyItem(id) {
      const weapon = CS2_WEAPONS[id];
      const gear = CS2_GEAR.find((entry) => entry.id === id);
      const item = weapon || gear;
      if (!item) return;
      if (weapon && this.loadout?.[weapon.slot] === id) {
        this.equipWeaponSlot(weapon.slot);
        return;
      }
      if (this.credits < item.price) {
        this.toast(`资金不足 · 还需要 $${item.price - this.credits}`, 'danger');
        return;
      }
      this.credits -= item.price;
      if (gear) {
        if (gear.armor) this.armor = Math.max(this.armor, gear.armor);
        if (gear.helmet) this.helmet = true;
        this.toast(`已购买装备 · ${gear.cn}`, 'success');
      } else {
        this.loadout[weapon.slot] = weapon.id;
        this.weaponAmmo[weapon.id] = { ammo: weapon.mag, reserve: weapon.reserve };
        this.equipWeaponSlot(weapon.slot, true);
        this.toast(`已购买 · ${weapon.name} · $${item.price}`, 'success');
      }
      this.audio?.play('loot');
      this.renderBuyMenu();
      this.updateHUD();
    }

    toggleBuyMenu(force = null) {
      const next = force === null ? !this.buyOpen : Boolean(force);
      if (next && (this.over || this.deathState)) return;
      this.buyOpen = next;
      if (this.refs?.buyPanel) this.refs.buyPanel.hidden = !next;
      if (next) {
        this.keys.clear();
        if (document.pointerLockElement === this.refs.canvas) document.exitPointerLock?.();
        this.renderBuyMenu();
      } else {
        this.requestLock();
      }
      this.updateHUD();
    }

    renderBuyMenu() {
      if (!this.refs?.buyGrid) return;
      if (this.refs.buyMoney) this.refs.buyMoney.textContent = `$${this.credits}`;
      if (this.refs.buyTabs) {
        $$('[data-cs2-buy-cat]', this.refs.buyTabs).forEach((button) => {
          button.classList.toggle('is-active', button.dataset.cs2BuyCat === this.buyCategory);
        });
      }
      const grouped = this.buyCategory === 'gear'
        ? CS2_GEAR
        : Object.values(CS2_WEAPONS).filter((item) => item.category === this.buyCategory && item.slot !== 'knife');
      const items = grouped.map((item) => {
        const isWeapon = Boolean(item.slot && item.slot !== 'gear');
        const owned = isWeapon ? this.loadout?.[item.slot] === item.id : Boolean(item.helmet ? this.helmet && this.armor > 0 : this.armor > 0);
        const equipped = isWeapon && this.loadout?.[item.slot] === item.id && this.activeSlot === item.slot;
        const canAfford = this.credits >= item.price;
        const disabled = !owned && !canAfford;
        const priceLabel = owned ? (equipped ? '已装备' : '已拥有') : `$${item.price}`;
        const stats = isWeapon
          ? `<span>伤害 ${item.damage}</span><span>弹匣 ${item.mag}</span><span>${item.caliber || ''}</span>`
          : `<span>护甲 ${item.armor || 0}</span><span>${item.helmet ? '含头盔' : '无头盔'}</span>`;
        return `<button class="cs2-buy-item${owned ? ' is-owned' : ''}${disabled ? ' is-disabled' : ''}" data-cs2-buy="${item.id}" type="button" ${disabled ? 'disabled' : ''}>
          <span class="cs2-buy-art" style="--tone:${item.tone || '#788d97'}"><i>${isWeapon ? (item.name || '').slice(0, 3).toUpperCase() : 'GEAR'}</i></span>
          <span class="cs2-buy-copy"><b>${item.name}</b><small>${item.cn || ''}</small><em>${stats}</em></span>
          <span class="cs2-buy-price">${priceLabel}</span>
        </button>`;
      }).join('');
      this.refs.buyGrid.innerHTML = items;
    }

    buildGun(force = false) {
      if (this.muzzle) {
        this.camera?.remove(this.muzzle);
        this.muzzle = null;
      }
      if (this.gun) {
        this.camera?.remove(this.gun);
        this.gun.traverse?.((child) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material && child.material.dispose) child.material.dispose();
        });
        this.gun = null;
      }
      const weapon = this.currentWeapon();
      const kind = weapon?.model || 'rifle';
      let group = null;
      if (window.AISniperModels) {
        if (kind === 'knife') group = window.AISniperModels.createFirstPersonKnife({ variant: 'cs2-ct' });
        else if (kind === 'pistol') group = window.AISniperModels.createFirstPersonPistol({ variant: 'cs2-ct' });
        else group = window.AISniperModels.createFirstPersonRifle({ variant: 'cs2' });
      }
      if (!group) {
        group = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0x1d252c, roughness: 0.34, metalness: 0.7 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.72), metal);
        body.position.set(0, 0, -0.23);
        group.add(body);
      }
      if (kind !== 'knife') {
        const glove = new THREE.MeshStandardMaterial({ color: 0x1b1f20, roughness: 0.86, metalness: 0.04 });
        const handRight = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.13), glove);
        handRight.position.set(0.02, kind === 'pistol' ? -0.2 : -0.17, -0.06);
        const handLeft = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.15), glove);
        handLeft.position.set(-0.02, -0.06, kind === 'pistol' ? -0.38 : -0.52);
        handLeft.rotation.x = 0.16;
        group.add(handRight, handLeft);
      }
      this.gun = group;
      this.gunBase = kind === 'pistol' ? { x: 0.31, y: -0.27, z: -0.48 } : kind === 'knife' ? { x: 0.36, y: -0.3, z: -0.5 } : { x: 0.3, y: -0.27, z: -0.56 };
      this.gun.position.set(this.gunBase.x, this.gunBase.y, this.gunBase.z);
      this.camera?.add(this.gun);
      this.muzzle = new THREE.PointLight(0xffc46e, 0, 6);
      this.muzzle.position.set(this.gunBase.x, this.gunBase.y + 0.08, this.gunBase.z - (kind === 'pistol' ? 0.2 : 0.55));
      this.camera?.add(this.muzzle);
      this.gunRecoil = 0;
      this.gunVisibleKind = kind;
    }

    buildNavGrid() {
      const layout = this.mapLayout;
      if (!layout) return null;
      const bounds = layout.bounds;
      const step = 1.25;
      const cols = Math.max(4, Math.floor((bounds.maxX - bounds.minX) / step));
      const rows = Math.max(4, Math.floor((bounds.maxZ - bounds.minZ) / step));
      const blocked = new Uint8Array(cols * rows);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const x = bounds.minX + (col + 0.5) * step;
          const z = bounds.minZ + (row + 0.5) * step;
          let hit = false;
          for (const box of this.colliders) {
            if (x + 0.45 > box.minX && x - 0.45 < box.maxX && z + 0.45 > box.minZ && z - 0.45 < box.maxZ) {
              hit = true;
              break;
            }
          }
          if (hit) blocked[row * cols + col] = 1;
        }
      }
      this.navGrid = { bounds, step, cols, rows, blocked };
      return this.navGrid;
    }

    navCell(x, z) {
      const grid = this.navGrid;
      if (!grid) return null;
      const col = clamp(Math.floor((x - grid.bounds.minX) / grid.step), 0, grid.cols - 1);
      const row = clamp(Math.floor((z - grid.bounds.minZ) / grid.step), 0, grid.rows - 1);
      return { col, row };
    }

    nearestFreeNavCell(cell) {
      const grid = this.navGrid;
      if (!grid || !cell) return null;
      const isFree = (col, row) => col >= 0 && row >= 0 && col < grid.cols && row < grid.rows
        && !grid.blocked[row * grid.cols + col];
      if (isFree(cell.col, cell.row)) return cell;
      for (let radius = 1; radius <= 8; radius += 1) {
        for (let dr = -radius; dr <= radius; dr += 1) {
          for (let dc = -radius; dc <= radius; dc += 1) {
            if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
            const col = cell.col + dc;
            const row = cell.row + dr;
            if (isFree(col, row)) return { col, row };
          }
        }
      }
      return null;
    }

    findNavPath(start, goal) {
      const grid = this.navGrid;
      if (!grid) return [[goal.x, goal.z]];
      const startCell = this.nearestFreeNavCell(this.navCell(start.x, start.z));
      const goalCell = this.nearestFreeNavCell(this.navCell(goal.x, goal.z));
      if (!startCell || !goalCell) return [[goal.x, goal.z]];
      const size = grid.cols * grid.rows;
      const startIndex = startCell.row * grid.cols + startCell.col;
      const goalIndex = goalCell.row * grid.cols + goalCell.col;
      const gScore = new Float32Array(size);
      gScore.fill(Infinity);
      const fScore = new Float32Array(size);
      fScore.fill(Infinity);
      const cameFrom = new Int32Array(size);
      cameFrom.fill(-1);
      const closed = new Uint8Array(size);
      const open = [startIndex];
      const inOpen = new Uint8Array(size);
      inOpen[startIndex] = 1;
      const heuristic = (index) => {
        const col = index % grid.cols;
        const row = (index / grid.cols) | 0;
        return Math.hypot(col - goalCell.col, row - goalCell.row);
      };
      gScore[startIndex] = 0;
      fScore[startIndex] = heuristic(startIndex);
      let found = false;
      while (open.length) {
        let bestAt = 0;
        for (let i = 1; i < open.length; i += 1) {
          if (fScore[open[i]] < fScore[open[bestAt]]) bestAt = i;
        }
        const current = open.splice(bestAt, 1)[0];
        inOpen[current] = 0;
        if (current === goalIndex) { found = true; break; }
        closed[current] = 1;
        const col = current % grid.cols;
        const row = (current / grid.cols) | 0;
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            if (!dc && !dr) continue;
            const nc = col + dc;
            const nr = row + dr;
            if (nc < 0 || nr < 0 || nc >= grid.cols || nr >= grid.rows) continue;
            const next = nr * grid.cols + nc;
            if (grid.blocked[next] || closed[next]) continue;
            if (dc && dr && (grid.blocked[row * grid.cols + nc] || grid.blocked[nr * grid.cols + col])) continue;
            const cost = dc && dr ? 1.414 : 1;
            const tentative = gScore[current] + cost;
            if (tentative >= gScore[next]) continue;
            cameFrom[next] = current;
            gScore[next] = tentative;
            fScore[next] = tentative + heuristic(next);
            if (!inOpen[next]) {
              open.push(next);
              inOpen[next] = 1;
            }
          }
        }
      }
      if (!found) return [[goal.x, goal.z]];
      const path = [];
      let node = goalIndex;
      while (node !== -1) {
        const col = node % grid.cols;
        const row = (node / grid.cols) | 0;
        path.push([
          grid.bounds.minX + (col + 0.5) * grid.step,
          grid.bounds.minZ + (row + 0.5) * grid.step
        ]);
        if (node === startIndex) break;
        node = cameFrom[node];
      }
      path.reverse();
      return path.length ? path : [[goal.x, goal.z]];
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
      if (this.refs.playMapThumb) {
        this.refs.playMapThumb.innerHTML = `${this.mapPreview(key)}<span class="cs2-play-mapletter">${map.sites[0].id}</span><small>SELECTED</small>`;
      }
      if (this.refs.playBg) this.refs.playBg.innerHTML = this.mapPreview(key);
      this.applyMapTheme(key);
      if (this.initialized && !this.running) this.buildMapGeometry(key, { lobby: true });
    }

    applyMapTheme(key) {
      const map = this.mapData[key] || this.mapData.mirage;
      if (!this.initialized) return;
      if (this.scene?.background) this.scene.background.setHex(map.bg);
      if (this.scene?.fog) this.scene.fog.color.setHex(map.fog);
      if (this.floorMaterial) this.floorMaterial.color.setHex(this.floorMaterial.map ? 0xffffff : map.floor);
      this.wallMaterial?.color.setHex(map.wall);
      this.trimMaterial?.color.setHex(map.trim);
      this.trimMaterial?.emissive.setHex(map.trim);
      this.crateMaterial?.color.setHex(map.crate);
      this.sunLight?.color.setHex(map.sun);
      this.fillLight?.color.setHex(map.fill);
      this.hemiLight?.color.setHex(map.sun);
      if (this.refs.hudMapLabel) this.refs.hudMapLabel.textContent = `${map.name} · 竞技模式`;
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
      if (this.refs.buyPanel) this.refs.buyPanel.hidden = true;
      this.buyOpen = false;
      this.refs.hud.hidden = true;
      this.refs.damage.hidden = true;
    }

    updateLobbyCamera(dt) {
      this.lobbyTime = (this.lobbyTime || 0) + dt;
      if (this.gun) this.gun.visible = false;
      const layout = this.mapLayout || this.mapData[this.selectedMap] || this.mapData.mirage;
      const bounds = layout.bounds;
      const centerX = (bounds.minX + bounds.maxX) * 0.5;
      const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
      const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
      const angle = -0.7 + this.lobbyTime * 0.045;
      const radius = span * (0.62 + Math.sin(this.lobbyTime * 0.13) * 0.04);
      this.camera.position.set(
        centerX + Math.sin(angle) * radius,
        21 + Math.sin(this.lobbyTime * 0.23) * 1.8,
        centerZ + Math.cos(angle) * radius
      );
      this.camera.lookAt(centerX, 1.2, centerZ);
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
        if (this.running && !this.paused && !this.over && !this.buyOpen) this.update(dt);
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
      this.kills = 0;
      this.score = 0;
      this.shots = 0;
      this.hits = 0;
      this.elapsed = 0;
      this.wave = 0;
      this.roundsWon = 0;
      this.roundsLost = 0;
      this.credits = 800;
      this.loadout = { primary: null, secondary: 'usp', knife: 'knife' };
      this.weaponAmmo = {};
      this.activeSlot = 'secondary';
      this.buyOpen = false;
      this.inspectTime = 0;
      this.armor = 0;
      this.helmet = false;
      this.lastMap = this.selectedMap;
      const layout = this.buildMapGeometry(this.selectedMap);
      this.player.set(layout.spawn.x, 1.7, layout.spawn.z);
      this.yaw = layout.spawn.yaw || 0;
      this.pitch = 0;
      this.camera.position.copy(this.player);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      this.equipWeaponSlot('secondary', true);
      this.reloading = false;
      this.nextShot = 0;
      clearTimeout(this.reloadTimer);
      this.keys.clear();
      this.refs.startPanel.hidden = true;
      this.refs.pausePanel.hidden = true;
      this.refs.overPanel.hidden = true;
      if (this.refs.buyPanel) this.refs.buyPanel.hidden = true;
      this.refs.loading.hidden = true;
      this.refs.hud.hidden = false;
      this.refs.fatal.hidden = true;
      this.refs.damage.hidden = true;
      this.refs.startBtn?.blur();
      this.refs.retryBtn?.blur();
      this.refs.resumeBtn?.blur();
      this.updateHUD();
      this.spawnWave(5);
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
      if (this.buyOpen) {
        this.buyOpen = false;
        if (this.refs.buyPanel) this.refs.buyPanel.hidden = true;
      }
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
      const layout = this.mapLayout || this.mapData[this.selectedMap] || this.mapData.mirage;
      const spawn = layout.tSpawn;
      const angle = (Math.PI * 2 * index) / Math.max(1, total);
      const radius = 1.2 + (index % 3) * 1.1;
      group.position.set(spawn.x + Math.cos(angle) * radius, 0, spawn.z + Math.sin(angle) * radius);
      const site = layout.sites[index % layout.sites.length];
      const offsetX = (Math.random() - 0.5) * 3.6;
      const offsetZ = (Math.random() - 0.5) * 3.6;
      const routes = layout.botPaths?.length ? layout.botPaths : [];
      const route = routes[index % Math.max(1, routes.length)] || [];
      const pivot = route[Math.min(route.length - 1, 2)] || [site.x, site.z];
      const firstLeg = this.findNavPath(
        { x: group.position.x, z: group.position.z },
        { x: pivot[0] + offsetX * 0.4, z: pivot[1] + offsetZ * 0.4 }
      );
      const secondLeg = this.findNavPath(
        { x: pivot[0], z: pivot[1] },
        { x: site.x + offsetX, z: site.z + offsetZ }
      );
      const navPath = firstLeg.concat(secondLeg.slice(1));
      const path = navPath.length ? navPath : [[spawn.x, spawn.z], [site.x, site.z]];
      const names = ['Astra', 'Bolt', 'Cipher', 'Drift', 'Echo', 'Frost', 'Ghost', 'Hawk', 'Ivy', 'Jinx'];
      const bot = {
        group,
        name: names[index % names.length],
        team: 'T',
        health: 100,
        armor: 28,
        alive: true,
        role: ['entry', 'support', 'flank'][index % 3],
        preferredRange: [9, 17, 12][index % 3],
        speed: 2.8 + Math.random() * 0.8,
        fireTimer: 900 + Math.random() * 1100,
        bob: Math.random() * Math.PI * 2,
        path,
        pathIndex: 0,
        site,
        offsetX,
        offsetZ,
        stuckTimer: 0,
        lastX: group.position.x,
        lastZ: group.position.z
      };
      group.userData.bot = bot;
      if (window.AISniperModels?.createSoldier) {
        const visual = window.AISniperModels.createSoldier({ variant: 'cs2-t', seed: index });
        bot.visual = visual;
        group.add(visual.group);
        visual.hitMeshes.forEach((part) => {
          part.userData.bot = bot;
          this.botHitMeshes.push(part);
        });
      } else {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9b5d34, roughness: 0.72, metalness: 0.08 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.16, 0.44), bodyMat);
        body.position.y = 1.16;
        body.userData.bot = bot;
        body.userData.part = 'body';
        group.add(body);
        this.botHitMeshes.push(body);
      }
      const label = makeLabel(bot.name, '#ffbd7f');
      label.position.y = 2.28;
      group.add(label);
      const light = new THREE.PointLight(0xff7d3e, 0.32, 3);
      light.position.set(0, 1.2, 0.35);
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
      if (this.cs2Sky) this.cs2Sky.group.rotation.y = this.elapsed * 0.0025;
      this.movePlayer(dt);
      this.updateBots(dt);
      this.updateTracers(dt);
      this.updateCallout();
      this.updateHUD();
      if (this.bots.length && this.bots.every((bot) => !bot.alive) && !this.waveTimer && !this.over) {
        this.roundsWon += 1;
        this.score += 500;
        this.credits = Math.min(16000, this.credits + 3250);
        this.addKillfeed('回合胜利 · 所有 T 已被消灭 · +$3250');
        this.updateWaveHUD();
        this.waveTimer = setTimeout(() => {
          if (!this.over) this.spawnWave(5);
        }, 1450);
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
        direction.normalize().multiplyScalar((this.keys.has('ShiftLeft') ? 7.4 : 5.4) * dt);
        this.movePlayerBy(direction.x, direction.z);
      }
      this.camera.position.copy(this.player);
      this.camera.position.y = 1.72 + Math.sin(this.elapsed * 10) * 0.012;
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }

    playerBlocked(x, z) {
      const radius = 0.38;
      for (const box of this.colliders || []) {
        if (x + radius > box.minX && x - radius < box.maxX && z + radius > box.minZ && z - radius < box.maxZ) return true;
      }
      return false;
    }

    movePlayerBy(dx, dz) {
      const bounds = this.mapLayout?.bounds || { minX: -38, maxX: 38, minZ: -36, maxZ: 36 };
      const nextX = clamp(this.player.x + dx, bounds.minX + 0.55, bounds.maxX - 0.55);
      if (!this.playerBlocked(nextX, this.player.z)) this.player.x = nextX;
      const nextZ = clamp(this.player.z + dz, bounds.minZ + 0.55, bounds.maxZ - 0.55);
      if (!this.playerBlocked(this.player.x, nextZ)) this.player.z = nextZ;
    }

    updateBots(dt) {
      const playerPos = new THREE.Vector3(this.player.x, 1.1, this.player.z);
      const bounds = this.mapLayout?.bounds || { minX: -38, maxX: 38, minZ: -36, maxZ: 36 };
      this.bots.forEach((bot) => {
        if (!bot.alive) return;
        const pos = bot.group.position;
        const toPlayer = new THREE.Vector3(this.player.x - pos.x, 0, this.player.z - pos.z);
        const distance = toPlayer.length();
        const canSeePlayer = distance < 26 && this.hasLineOfSight(bot, playerPos);
        let moving = false;
        if (canSeePlayer) {
          bot.group.rotation.y = Math.atan2(this.player.x - pos.x, this.player.z - pos.z);
          const preferred = bot.health < 40 ? 20 : bot.preferredRange || 12;
          const forwardX = toPlayer.x / Math.max(1, distance);
          const forwardZ = toPlayer.z / Math.max(1, distance);
          const strafe = Math.sin(this.elapsed * (1.2 + (bot.bob % 0.6)) + bot.bob) * 0.9;
          if (distance > preferred + 2.5) {
            moving = true;
            this.moveBotBy(bot, forwardX * bot.speed * dt, forwardZ * bot.speed * dt);
          } else if (distance < preferred - 3 || bot.health < 40) {
            moving = true;
            this.moveBotBy(bot, -forwardX * bot.speed * 0.8 * dt, -forwardZ * bot.speed * 0.8 * dt);
          } else {
            moving = true;
            this.moveBotBy(bot, -forwardZ * strafe * dt, forwardX * strafe * dt);
          }
          bot.fireTimer -= dt * 1000;
          if (bot.fireTimer <= 0 && distance < 24) {
            bot.burstLeft = bot.role === 'entry' ? 3 : 2;
            bot.burstTimer = 0;
            bot.fireTimer = (bot.role === 'support' ? 920 : 720) + Math.random() * 820;
          }
          if (bot.burstLeft > 0) {
            bot.burstTimer = (bot.burstTimer || 0) - dt;
            if (bot.burstTimer <= 0) {
              bot.burstTimer = 0.12;
              bot.burstLeft -= 1;
              this.enemyShoot(bot);
            }
          }
        } else {
          let waypoint = bot.path[Math.min(bot.pathIndex, bot.path.length - 1)];
          if (bot.pathIndex >= bot.path.length) {
            const wobble = Math.sin(this.elapsed * 0.8 + bot.bob) * (bot.role === 'support' ? 3.4 : 2.2);
            waypoint = [bot.site.x + wobble + bot.offsetX, bot.site.z + bot.offsetZ];
          }
          const tx = waypoint[0];
          const tz = waypoint[1];
          const dx = tx - pos.x;
          const dz = tz - pos.z;
          const targetDistance = Math.hypot(dx, dz);
          if (targetDistance < 1.5) {
            if (bot.pathIndex < bot.path.length) bot.pathIndex += 1;
          } else {
            const step = bot.speed * (bot.role === 'support' ? 0.84 : 1) * dt;
            moving = true;
            this.moveBotBy(bot, dx / targetDistance * step, dz / targetDistance * step);
            bot.group.rotation.y = Math.atan2(dx, dz);
          }
          bot.stuckTimer += dt;
          if (bot.stuckTimer > 1.2) {
            const moved = Math.hypot(pos.x - bot.lastX, pos.z - bot.lastZ);
            if (moved < 0.2 && bot.pathIndex < bot.path.length - 1) bot.pathIndex += 1;
            bot.stuckTimer = 0;
            bot.lastX = pos.x;
            bot.lastZ = pos.z;
          }
        }
        // Keep squad members from stacking into one target.
        this.bots.forEach((other) => {
          if (other === bot || !other.alive) return;
          const ox = pos.x - other.group.position.x;
          const oz = pos.z - other.group.position.z;
          const dist = Math.hypot(ox, oz);
          if (dist > 0.01 && dist < 2.4) {
            const push = (2.4 - dist) * 0.5;
            this.moveBotBy(bot, ox / dist * push, oz / dist * push);
          }
        });
        bot.bob += dt * 3.2;
        bot.group.position.y = Math.sin(bot.bob) * 0.025;
        if (bot.visual) bot.visual.setPose(this.elapsed + bot.bob * 0.12, moving, 0.2);
        pos.x = clamp(pos.x, bounds.minX + 0.7, bounds.maxX - 0.7);
        pos.z = clamp(pos.z, bounds.minZ + 0.7, bounds.maxZ - 0.7);
      });
    }

    moveBotBy(bot, dx, dz) {
      const pos = bot.group.position;
      const nextX = pos.x + dx;
      if (!this.playerBlocked(nextX, pos.z)) pos.x = nextX;
      const nextZ = pos.z + dz;
      if (!this.playerBlocked(pos.x, nextZ)) pos.z = nextZ;
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
      const distance = bot.group.position.distanceTo(this.player);
      const accuracy = clamp(0.72 - distance * 0.008, 0.42, 0.7);
      if (Math.random() < accuracy) {
        let damage = 7 + Math.random() * 8;
        if (this.armor > 0) {
          const absorbed = Math.min(this.armor, damage * 0.62);
          this.armor -= absorbed;
          damage -= absorbed;
        }
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
      this.inspectTime = Math.max(0, (this.inspectTime || 0) - dt);
      this.gunRecoil = Math.max(0, this.gunRecoil - dt * 8.5);
      const base = this.gunBase || { x: 0.3, y: -0.27, z: -0.56 };
      const bob = this.gunVisibleKind === 'knife' ? 0.004 : 0.008;
      const inspectProgress = this.inspectTime > 0 ? 1 - this.inspectTime / 1.35 : 0;
      const inspectArc = Math.sin(clamp(inspectProgress, 0, 1) * Math.PI);
      this.gun.position.x = base.x + Math.sin(this.gunBob || 0) * 0.012;
      this.gun.position.y = base.y + Math.abs(Math.cos(this.gunBob || 0)) * bob + inspectArc * 0.12;
      this.gun.position.z = base.z + this.gunRecoil * 0.075 + inspectArc * 0.06;
      this.gun.rotation.x = -this.gunRecoil * 0.04 - inspectArc * 0.25;
      this.gun.rotation.y = -0.06 + inspectArc * 0.9;
      this.gun.rotation.z = inspectArc * 0.18;
      if (this.muzzle) this.muzzle.intensity = Math.max(0, this.muzzle.intensity - dt * 26);
    }

    shoot() {
      if (!this.running || this.paused || this.over || this.reloading || this.buyOpen) return;
      const now = performance.now();
      if (now < this.nextShot) return;
      const weapon = this.currentWeapon();
      if (!weapon) return;
      if (weapon.slot === 'knife') {
        this.knifeAttack(now);
        return;
      }
      if (this.ammo <= 0) {
        this.reload();
        return;
      }
      this.inspectTime = 0;
      this.nextShot = now + weapon.rate * 1000;
      this.ammo -= 1;
      this.shots += 1;
      this.gunRecoil = weapon.slot === 'primary' ? 1 : 0.7;
      if (this.muzzle) this.muzzle.intensity = 2.2;
      this.updateHUD();
      const pellets = weapon.pellets || 1;
      let hitSomething = false;
      let headshotAny = false;
      for (let pellet = 0; pellet < pellets; pellet += 1) {
        const raycaster = new THREE.Raycaster();
        const spread = weapon.spread || 0;
        raycaster.setFromCamera({
          x: pellets > 1 ? (Math.random() - 0.5) * spread * 2 : (Math.random() - 0.5) * spread * 1.4,
          y: pellets > 1 ? (Math.random() - 0.5) * spread * 1.4 : (Math.random() - 0.5) * spread
        }, this.camera);
        const hits = raycaster.intersectObjects(this.botHitMeshes, false);
        const wallHit = raycaster.intersectObjects(this.obstacles, false)[0];
        const origin = this.camera.position.clone().add(new THREE.Vector3(0, -0.2, 0));
        if (hits.length && !(wallHit && wallHit.distance < hits[0].distance)) {
          const hit = hits[0];
          const bot = hit.object.userData.bot;
          if (bot && bot.alive) {
            const headshot = hit.object.userData.part === 'head';
            const damage = weapon.damage * (headshot ? 2.35 : 1) * (pellets > 1 ? 0.8 : 1);
            this.applyBotDamage(bot, damage, headshot);
            this.hits += 1;
            hitSomething = true;
            headshotAny = headshotAny || headshot;
            this.addTracer(origin, hit.point, headshot ? 0xffe0a0 : 0xffb35c, 0.85);
          }
        } else if (pellet === 0) {
          const end = origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(60));
          this.addTracer(origin, end, 0xffd18b, 0.5);
        }
      }
      if (hitSomething) this.showHitmarker(headshotAny);
      if (weapon.slot === 'primary' && weapon.category === 'sniper') this.nextShot = now + weapon.rate * 1000;
      if (this.ammo <= 0) this.startReloadTimer();
    }

    applyBotDamage(bot, damage, headshot = false) {
      if (!bot || !bot.alive) return;
      let remaining = damage;
      if (bot.armor > 0 && !headshot) {
        const absorbed = Math.min(bot.armor, remaining * 0.62);
        bot.armor -= absorbed;
        remaining -= absorbed;
      }
      bot.health -= remaining;
      bot.flash = 0.14;
      if (bot.health <= 0) this.killBot(bot, headshot);
    }

    knifeAttack(now) {
      this.nextShot = now + 550;
      this.inspectTime = 0;
      this.gunRecoil = 0.6;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
      raycaster.far = 3.8;
      const hits = raycaster.intersectObjects(this.botHitMeshes, false);
      const wallHit = raycaster.intersectObjects(this.obstacles, false)[0];
      const origin = this.camera.position.clone();
      if (hits.length && !(wallHit && wallHit.distance < hits[0].distance)) {
        const bot = hits[0].object.userData.bot;
        if (bot && bot.alive) {
          this.applyBotDamage(bot, hits[0].object.userData.part === 'head' ? 110 : 55, true);
          this.showHitmarker(true);
          this.addTracer(origin, hits[0].point, 0xdde8ec, 0.5);
        }
      } else {
        this.addTracer(origin, origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(3.6)), 0xdde8ec, 0.35);
      }
    }

    killBot(bot, headshot) {
      bot.alive = false;
      bot.group.visible = false;
      this.kills += 1;
      this.score += headshot ? 200 : 100;
      this.credits = Math.min(16000, this.credits + 300);
      this.addKillfeed(`你 ${headshot ? '⌖ 爆头' : '✕'} ${bot.name} · +$300`);
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

    startReloadTimer() {
      const weapon = this.currentWeapon();
      if (!weapon || weapon.slot === 'knife') return;
      if (this.reloading || this.ammo >= weapon.mag || this.reserve <= 0) return;
      this.reloading = true;
      if (this.refs.ammo) this.refs.ammo.textContent = '—';
      clearTimeout(this.reloadTimer);
      this.reloadTimer = setTimeout(() => {
        const active = this.currentWeapon();
        if (!active || active.slot === 'knife') { this.reloading = false; return; }
        const needed = active.mag - this.ammo;
        const take = Math.min(needed, this.reserve);
        this.ammo += take;
        this.reserve -= take;
        this.saveCurrentAmmo();
        this.reloading = false;
        this.updateHUD();
      }, 1350);
    }

    reload() {
      this.startReloadTimer();
    }

    updateCallout() {
      const layout = this.mapLayout;
      if (!layout || !this.refs.location) return;
      let nearest = null;
      let nearestDistance = Infinity;
      (layout.callouts || []).forEach((callout) => {
        const distance = Math.hypot(this.player.x - callout.x, this.player.z - callout.z);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = callout;
        }
      });
      if (!nearest || nearestDistance > 18) {
        const site = layout.sites.reduce((best, entry) => {
          const distance = Math.hypot(this.player.x - entry.x, this.player.z - entry.z);
          return distance < best.distance ? { entry, distance } : best;
        }, { entry: layout.sites[0], distance: Infinity });
        nearest = site.distance < 20 ? { text: `${site.entry.id} 点` } : { text: '战场' };
      }
      if (nearest.text !== this.currentCallout) {
        this.currentCallout = nearest.text;
        this.refs.location.textContent = nearest.text;
      }
    }

    updateHUD() {
      if (!this.refs) return;
      const weapon = this.currentWeapon();
      if (this.refs.health) this.refs.health.textContent = String(Math.max(0, Math.round(this.health)));
      if (this.refs.healthFill) this.refs.healthFill.style.width = `${clamp(this.health, 0, 100)}%`;
      if (this.refs.armor) this.refs.armor.textContent = String(Math.max(0, Math.round(this.armor || 0)));
      if (this.refs.ammo) {
        if (this.reloading) this.refs.ammo.textContent = '—';
        else this.refs.ammo.textContent = weapon?.slot === 'knife' ? '—' : String(this.ammo).padStart(2, '0');
      }
      if (this.refs.reserve) this.refs.reserve.textContent = weapon?.slot === 'knife' ? '—' : String(this.reserve);
      if (this.refs.weaponName) this.refs.weaponName.textContent = weapon ? weapon.name : '—';
      if (this.refs.ammoCaliber) this.refs.ammoCaliber.textContent = weapon ? (weapon.slot === 'knife' ? 'MELEE' : weapon.caliber) : '';
      if (this.refs.kills) this.refs.kills.textContent = String(this.kills);
      if (this.refs.credits) this.refs.credits.textContent = `$${this.credits}`;
      if (this.refs.buyMoney) this.refs.buyMoney.textContent = `$${this.credits}`;
      if (this.refs.timer) this.refs.timer.textContent = `${String(Math.floor(this.elapsed / 60)).padStart(2, '0')}:${String(Math.floor(this.elapsed % 60)).padStart(2, '0')}`;
      if (this.refs.loadout) {
        $$('[data-cs2-slot]', this.refs.loadout).forEach((slot) => {
          const id = this.loadout?.[slot.dataset.cs2Slot];
          const item = CS2_WEAPONS[id];
          slot.classList.toggle('is-active', this.activeSlot === slot.dataset.cs2Slot);
          slot.classList.toggle('is-empty', !item);
          const label = $('b', slot);
          if (label) label.textContent = item ? item.name : '—';
        });
      }
    }

    updateWaveHUD() {
      if (this.refs.wave) this.refs.wave.textContent = String(this.wave).padStart(2, '0');
      if (this.refs.roundScore) this.refs.roundScore.textContent = `CT ${this.roundsWon} · T ${Math.max(0, this.roundsLost)}`;
      if (this.refs.credits) this.refs.credits.textContent = `$${this.credits}`;
    }

    endGame() {
      if (this.over) return;
      this.over = true;
      this.roundsLost += 1;
      this.updateWaveHUD();
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
      if (this.refs.buyPanel) this.refs.buyPanel.hidden = true;
      this.buyOpen = false;
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
