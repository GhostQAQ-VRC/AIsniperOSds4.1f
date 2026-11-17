/* ==========================================================================
   AISniperOS — shared low-poly soldier, weapon and skybox factory.
   Used by Counter-Strike 2 and The Division so both games share one model
   vocabulary: layered armor, helmets, masks, radios, backpacks and rifles.
   ========================================================================== */

(() => {
  'use strict';

  const THREE = window.THREE;
  if (!THREE) return;

  const SOLDIER_PALETTES = {
    'cs2-t': {
      cloth: 0x6d5a3d, clothDark: 0x463b29, vest: 0x252a2a, armor: 0x343b3c,
      skin: 0xc79a73, mask: 0x161817, accent: 0xb94a3a, metal: 0x25282a,
      boots: 0x1a1b1a, pack: 0x4a3c2b, visor: 0xb7d8e8
    },
    'cs2-ct': {
      cloth: 0x2f4152, clothDark: 0x1d2a35, vest: 0x1a232b, armor: 0x2e3d49,
      skin: 0xc79a73, mask: 0x20272d, accent: 0x5ba9d6, metal: 0x1f262b,
      boots: 0x151a1e, pack: 0x24323d, visor: 0x8edfff
    },
    jtf: {
      cloth: 0x344c61, clothDark: 0x223442, vest: 0x1d2d3b, armor: 0x2d4557,
      skin: 0xc79a73, mask: 0x25323c, accent: 0xe2b36b, metal: 0x263039,
      boots: 0x141b20, pack: 0x2d4355, visor: 0xb9e6ff
    },
    riker: {
      cloth: 0x4a4a39, clothDark: 0x303127, vest: 0x2b2d26, armor: 0x3b3e33,
      skin: 0xb88c69, mask: 0xd18a4c, accent: 0xd77c44, metal: 0x272a26,
      boots: 0x1b1c18, pack: 0x3b3d2d, visor: 0xffc077
    },
    cleaner: {
      cloth: 0x3b2a24, clothDark: 0x261b17, vest: 0x2b211d, armor: 0x45332b,
      skin: 0xb88c69, mask: 0x151515, accent: 0xe06d35, metal: 0x2b2723,
      boots: 0x181514, pack: 0x49342b, visor: 0xff8b4d
    },
    rogue: {
      cloth: 0x25272b, clothDark: 0x141619, vest: 0x16181b, armor: 0x2c2f34,
      skin: 0xb88c69, mask: 0x101112, accent: 0xd0a45b, metal: 0x1e2024,
      boots: 0x111315, pack: 0x1c1e22, visor: 0xffc56d
    },
    division: {
      cloth: 0x3b4436, clothDark: 0x293126, vest: 0x252c27, armor: 0x394134,
      skin: 0xc79a73, mask: 0x20231f, accent: 0xe2a85c, metal: 0x242822,
      boots: 0x171a17, pack: 0x30382c, visor: 0xffd08a
    }
  };

  const material = (color, roughness = 0.82, metalness = 0.06, emissive = null) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    if (emissive !== null) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.35;
    }
    return mat;
  };

  const box = (parent, mat, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  };

  const cylinder = (parent, mat, radiusTop, radiusBottom, height, x, y, z, rx = 0, ry = 0, rz = 0, segments = 10) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    parent.add(mesh);
    return mesh;
  };

  const sphere = (parent, mat, radius, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };

  function createGlowTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.22, color);
    gradient.addColorStop(0.55, 'rgba(255,255,255,.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  function createRifle(parent, palette, options = {}) {
    const gun = new THREE.Group();
    const metal = material(0x24272a, 0.34, 0.78);
    const metalLight = material(0x3b4247, 0.4, 0.62);
    const polymer = material(options.polymer || 0x1b1e20, 0.72, 0.2);
    const accent = material(palette.accent, 0.45, 0.35, palette.accent);
    const wood = material(options.wood || 0x5b422b, 0.86, 0.05);
    const receiver = box(gun, metal, 0.14, 0.13, 0.55, 0, 0, 0);
    box(gun, metalLight, 0.11, 0.09, 0.42, 0, 0.015, 0.43);
    box(gun, polymer, 0.105, 0.075, 0.2, 0, -0.005, 0.61);
    cylinder(gun, metal, 0.022, 0.022, 0.46, 0, 0.02, 0.86, Math.PI / 2);
    cylinder(gun, metal, 0.035, 0.035, 0.08, 0, 0.02, 1.06, Math.PI / 2);
    box(gun, polymer, 0.08, 0.2, 0.12, 0, -0.16, 0.04, 0.18);
    box(gun, metal, 0.055, 0.26, 0.11, 0, -0.13, 0.24, -0.16);
    const magazine = box(gun, metalLight, 0.075, 0.22, 0.12, 0, -0.17, 0.33, 0.16);
    magazine.rotation.z = -0.05;
    box(gun, polymer, 0.12, 0.09, 0.25, 0, 0.01, -0.31);
    box(gun, polymer, 0.07, 0.11, 0.28, 0, -0.03, -0.51, -0.06);
    box(gun, metal, 0.03, 0.06, 0.06, 0, 0.035, 1.05);
    box(gun, accent, 0.018, 0.018, 0.14, 0, 0.085, 0.35);
    box(gun, metal, 0.05, 0.05, 0.08, 0, 0.1, 0.12);
    const sight = box(gun, metalLight, 0.035, 0.035, 0.13, 0, 0.11, 0.16);
    sight.rotation.x = 0;
    const glowMat = material(palette.accent, 0.4, 0.3, palette.accent);
    box(gun, glowMat, 0.012, 0.012, 0.09, 0, 0.085, -0.14);
    gun.userData.muzzle = new THREE.Vector3(0, 0.02, 1.1);
    gun.userData.glow = glowMat;
    gun.userData.wood = wood;
    parent.add(gun);
    return gun;
  }

  function createSoldier(options = {}) {
    const variant = options.variant || 'cs2-t';
    const palette = SOLDIER_PALETTES[variant] || SOLDIER_PALETTES['cs2-t'];
    const root = new THREE.Group();
    const cloth = material(palette.cloth, 0.9, 0.02);
    const clothDark = material(palette.clothDark, 0.92, 0.02);
    const vest = material(palette.vest, 0.72, 0.2);
    const armor = material(palette.armor, 0.55, 0.42);
    const skin = material(palette.skin, 0.86, 0.02);
    const mask = material(palette.mask, 0.78, 0.12);
    const accent = material(palette.accent, 0.5, 0.3, palette.accent);
    const metal = material(palette.metal, 0.35, 0.75);
    const boot = material(palette.boots, 0.8, 0.18);
    const pack = material(palette.pack, 0.88, 0.05);
    const visor = material(palette.visor, 0.22, 0.5, palette.visor);

    const hips = new THREE.Group();
    hips.position.y = 0.96;
    root.add(hips);
    box(hips, clothDark, 0.4, 0.24, 0.26, 0, 0, 0);
    box(hips, beltMat(), 0.44, 0.07, 0.29, 0, 0.12, 0);
    function beltMat() { return material(0x20221f, 0.8, 0.2); }

    const torso = new THREE.Group();
    torso.position.y = 1.12;
    root.add(torso);
    box(torso, cloth, 0.5, 0.46, 0.3, 0, 0.22, 0);
    box(torso, vest, 0.46, 0.34, 0.34, 0, 0.25, 0.02);
    box(torso, armor, 0.36, 0.28, 0.08, 0, 0.27, 0.21);
    box(torso, accent, 0.06, 0.15, 0.09, 0.12, 0.27, 0.24);
    [-1, 1].forEach((side) => {
      box(torso, pack, 0.12, 0.14, 0.08, side * 0.12, 0.08, 0.22);
      box(torso, pack, 0.11, 0.18, 0.07, side * 0.2, 0.28, -0.05);
    });
    const backpack = box(torso, pack, 0.36, 0.42, 0.2, 0, 0.22, -0.25);
    backpack.rotation.x = 0.04;
    box(torso, armor, 0.3, 0.18, 0.05, 0, 0.28, -0.37);
    box(torso, metal, 0.025, 0.4, 0.025, 0.1, 0.47, -0.33);
    sphere(torso, accent, 0.025, 0.1, 0.67, -0.33);
    box(torso, pack, 0.16, 0.12, 0.1, -0.13, 0.02, -0.36);
    box(torso, pack, 0.13, 0.24, 0.08, 0.14, 0.06, 0.24, 0.08);

    const legs = [];
    [-1, 1].forEach((side) => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.13, 0.91, 0);
      root.add(leg);
      box(leg, cloth, 0.18, 0.42, 0.2, 0, -0.18, 0);
      box(leg, armor, 0.16, 0.16, 0.08, 0, -0.13, 0.11);
      box(leg, clothDark, 0.16, 0.38, 0.18, 0, -0.48, 0);
      box(leg, armor, 0.18, 0.12, 0.09, 0, -0.42, 0.1);
      box(leg, boot, 0.19, 0.16, 0.3, 0, -0.72, 0.05);
      box(leg, boot, 0.19, 0.06, 0.34, 0, -0.79, 0.08);
      legs.push(leg);
    });

    const arms = [];
    [-1, 1].forEach((side) => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.32, 1.55, 0);
      root.add(arm);
      box(arm, cloth, 0.15, 0.34, 0.18, 0, -0.18, 0);
      box(arm, vest, 0.17, 0.13, 0.2, 0, -0.04, 0);
      box(arm, armor, 0.14, 0.3, 0.16, 0, -0.48, 0.02);
      box(arm, clothDark, 0.13, 0.16, 0.16, 0, -0.64, 0.03);
      box(arm, mask, 0.11, 0.11, 0.13, 0, -0.74, 0.06);
      arms.push(arm);
    });
    arms[1].rotation.set(-1.15, 0, -0.06);
    arms[0].rotation.set(-0.92, 0.16, 0.18);

    const headGroup = new THREE.Group();
    headGroup.position.y = 1.68;
    root.add(headGroup);
    box(headGroup, skin, 0.23, 0.24, 0.22, 0, 0.03, 0);
    box(headGroup, mask, 0.25, 0.16, 0.08, 0, -0.03, 0.12);
    box(headGroup, mask, 0.24, 0.11, 0.06, 0, 0.06, 0.12);
    box(headGroup, visor, 0.22, 0.055, 0.02, 0, 0.1, 0.16);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.58), armor);
    helmet.position.set(0, 0.13, 0);
    helmet.scale.set(1, 0.92, 1.05);
    headGroup.add(helmet);
    box(headGroup, armor, 0.3, 0.06, 0.28, 0, 0.16, 0);
    box(headGroup, metal, 0.035, 0.08, 0.035, 0.15, 0.15, 0);
    box(headGroup, metal, 0.02, 0.24, 0.02, 0.18, 0.28, -0.04);
    box(headGroup, accent, 0.05, 0.04, 0.02, -0.06, 0.18, 0.18);
    if (variant === 'cleaner') {
      const tank = cylinder(torso, material(0xd46a34, 0.45, 0.45, 0xd46a34), 0.11, 0.11, 0.52, 0, 0.24, -0.42, 0, 0, 0, 10);
      tank.rotation.x = 0.08;
      cylinder(torso, metal, 0.03, 0.03, 0.26, 0, 0.5, -0.44);
    }
    if (variant === 'rogue') {
      box(torso, accent, 0.4, 0.04, 0.035, 0, 0.37, 0.215);
      box(headGroup, accent, 0.24, 0.035, 0.02, 0, 0.13, 0.17);
    }
    if (variant === 'jtf' || variant === 'division') {
      box(arms[0], accent, 0.09, 0.07, 0.02, 0, -0.36, 0.1);
      box(torso, accent, 0.12, 0.035, 0.02, 0.12, 0.14, 0.22);
    }

    const rifle = createRifle(root, palette, { wood: variant === 'cs2-t' || variant === 'riker' ? 0x5b422b : 0x24282b });
    rifle.position.set(0.2, 1.26, 0.25);
    rifle.rotation.y = 0;

    const hitMeshes = [];
    [torso.children[0], torso.children[1], torso.children[2], hips.children[0], headGroup.children[0], helmet].forEach((mesh) => {
      if (!mesh) return;
      mesh.userData.part = mesh === headGroup.children[0] || mesh === helmet ? 'head' : 'body';
      hitMeshes.push(mesh);
    });

    let poseTime = 0;
    const setPose = (time, moving = false, aim = 0.2) => {
      poseTime = time;
      const speed = moving ? 8.5 : 2.2;
      const swing = Math.sin(time * speed) * (moving ? 0.52 : 0.035);
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -0.92 - swing * 0.25;
      arms[1].rotation.x = -1.15 + swing * 0.12;
      arms[1].rotation.z = -0.06 + Math.sin(time * 2.2) * 0.015;
      torso.position.y = 1.12 + Math.abs(Math.sin(time * speed)) * (moving ? 0.025 : 0.008);
      headGroup.rotation.y = Math.sin(time * 1.2) * 0.03;
      rifle.rotation.x = aim * 0.08;
    };
    setPose(0, false, 0.2);

    return {
      group: root,
      parts: { hips, torso, legs, arms, head: headGroup, rifle },
      hitMeshes,
      setPose
    };
  }

  function createFirstPersonRifle(options = {}) {
    const palette = SOLDIER_PALETTES[options.variant || 'division'] || SOLDIER_PALETTES.division;
    const group = new THREE.Group();
    const metal = material(0x25292c, 0.3, 0.8);
    const metalLight = material(0x424b51, 0.36, 0.65);
    const polymer = material(options.polymer || 0x191d20, 0.66, 0.25);
    const accent = material(palette.accent, 0.4, 0.4, palette.accent);
    const rail = material(0x353b3f, 0.46, 0.62);
    const body = box(group, metal, 0.16, 0.15, 0.62, 0, 0, -0.18);
    box(group, metalLight, 0.13, 0.11, 0.46, 0, 0.005, -0.56);
    box(group, polymer, 0.115, 0.1, 0.24, 0, 0.01, -0.83);
    cylinder(group, metal, 0.035, 0.035, 0.34, 0, 0.02, -1.08, Math.PI / 2, 0, 0, 12);
    cylinder(group, metal, 0.045, 0.045, 0.08, 0, 0.02, -1.28, Math.PI / 2, 0, 0, 12);
    box(group, rail, 0.12, 0.035, 0.72, 0, 0.09, -0.44);
    box(group, polymer, 0.09, 0.26, 0.14, 0, -0.18, -0.03, 0.16);
    box(group, metal, 0.06, 0.28, 0.12, 0, -0.14, -0.24, -0.12);
    box(group, metalLight, 0.08, 0.26, 0.13, 0, -0.19, -0.36, 0.14);
    box(group, polymer, 0.14, 0.1, 0.3, 0, 0.005, 0.23);
    box(group, polymer, 0.08, 0.13, 0.24, 0, -0.02, 0.44);
    box(group, metal, 0.05, 0.04, 0.16, 0, 0.13, -0.45);
    box(group, accent, 0.025, 0.025, 0.2, 0.065, 0.06, -0.5);
    box(group, accent, 0.02, 0.02, 0.13, -0.065, 0.03, -0.68);
    const glow = material(palette.accent, 0.3, 0.3, palette.accent);
    box(group, glow, 0.015, 0.012, 0.1, 0, 0.145, -0.42);
    group.userData.muzzle = new THREE.Vector3(0, 0.02, -1.34);
    group.userData.glow = glow;
    return group;
  }

  function cloudTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, 512, 256);
    const puffs = [
      [120, 150, 95, 50], [205, 120, 115, 58], [300, 108, 96, 46],
      [370, 148, 125, 54], [250, 164, 160, 42], [165, 172, 110, 30],
      [332, 176, 108, 30], [95, 185, 66, 22], [430, 180, 62, 20]
    ];
    puffs.forEach(([x, y, rx, ry], index) => {
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, rx);
      gradient.addColorStop(0, `rgba(255,255,255,${0.32 - index * 0.012})`);
      gradient.addColorStop(0.52, `rgba(232,241,246,${0.16 - index * 0.006})`);
      gradient.addColorStop(1, 'rgba(232,241,246,0)');
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-x, -y);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function createSkyDome(options = {}) {
    const radius = options.radius || 620;
    const top = options.top || '#16212b';
    const horizon = options.horizon || '#8a7760';
    const bottom = options.bottom || '#2b2d2d';
    const sunColor = options.sun || '#ffd9a0';
    const cloudColor = options.cloudColor || 0xe6eef3;
    const sunDirection = (options.sunDirection || new THREE.Vector3(0.4, 0.3, -0.86)).clone().normalize();
    const group = new THREE.Group();

    // A shader dome has no UV seam and gives a real horizon gradient.
    const domeMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(top) },
        horizonColor: { value: new THREE.Color(horizon) },
        bottomColor: { value: new THREE.Color(bottom) },
        sunColor: { value: new THREE.Color(sunColor) },
        sunDirection: { value: sunDirection }
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunDirection;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, -0.3, 1.0);
          vec3 color = mix(horizonColor, topColor, smoothstep(0.0, 0.66, h));
          color = mix(bottomColor, color, smoothstep(-0.16, 0.03, vDir.y));
          float haze = 1.0 - smoothstep(0.0, 0.19, abs(vDir.y));
          color += horizonColor * haze * 0.13;
          float sun = max(dot(normalize(vDir), normalize(sunDirection)), 0.0);
          color += sunColor * pow(sun, 680.0) * 1.25;
          color += sunColor * pow(sun, 22.0) * 0.14;
          gl_FragColor = vec4(color, 1.0);
        }`
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 56, 30), domeMaterial);
    sphere.renderOrder = -120;
    group.add(sphere);

    // Independent cloud layers create parallax and depth instead of one painted shell.
    const texture = cloudTexture();
    const cloudGroup = new THREE.Group();
    group.add(cloudGroup);
    if (texture) {
      let seed = 4817;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 30; i += 1) {
        const angle = random() * Math.PI * 2;
        const distance = radius * (0.52 + random() * 0.36);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture,
          color: i % 8 === 0 ? 0xf1e5d3 : cloudColor,
          transparent: true,
          opacity: 0.16 + random() * 0.3,
          depthWrite: false,
          depthTest: true,
          blending: THREE.NormalBlending,
          fog: false
        }));
        sprite.position.set(
          Math.cos(angle) * distance,
          radius * (0.2 + random() * 0.38),
          Math.sin(angle) * distance
        );
        const width = radius * (0.28 + random() * 0.42);
        sprite.scale.set(width, width * (0.2 + random() * 0.16), 1);
        cloudGroup.add(sprite);
      }
      for (let i = 0; i < 9; i += 1) {
        const angle = random() * Math.PI * 2;
        const distance = radius * (0.7 + random() * 0.24);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: texture, color: 0xf5f9fa, transparent: true,
          opacity: 0.06 + random() * 0.08, depthWrite: false, depthTest: true, fog: false
        }));
        sprite.position.set(
          Math.cos(angle) * distance,
          radius * (0.55 + random() * 0.3),
          Math.sin(angle) * distance
        );
        const width = radius * (0.7 + random() * 0.45);
        sprite.scale.set(width, width * 0.12, 1);
        cloudGroup.add(sprite);
      }
    }

    const haze = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.86, radius * 0.86, radius * 0.34, 64, 1, true),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(horizon), transparent: true, opacity: 0.075,
        side: THREE.DoubleSide, depthWrite: false, fog: false
      })
    );
    haze.position.y = radius * 0.1;
    group.add(haze);
    const haze2 = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, radius * 0.18, 64, 1, true),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(top), transparent: true, opacity: 0.04,
        side: THREE.DoubleSide, depthWrite: false, fog: false
      })
    );
    haze2.position.y = radius * 0.055;
    group.add(haze2);

    const sunTexture = createGlowTexture(sunColor);
    if (sunTexture) {
      const sun = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sunTexture, color: new THREE.Color(sunColor), transparent: true,
        opacity: 0.66, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
      }));
      sun.position.copy(sunDirection).multiplyScalar(radius * 0.9);
      sun.scale.set(radius * 0.19, radius * 0.19, 1);
      group.add(sun);
    }
    return { group, sphere, cloudGroup, texture };
  }

  window.AISniperModels = {
    palettes: SOLDIER_PALETTES,
    createSoldier,
    createRifle,
    createFirstPersonRifle,
    createSkyDome,
    createGlowTexture,
    materials: { material, box, cylinder, sphere }
  };
})();
