/* ==========================================================================
   AISniperOS — system layer
   A single-file desktop environment: windows, apps, status, theming, sound.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad = (value, length = 2) => String(value).padStart(length, '0');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STORAGE_KEY = 'aisniperos.settings.v1';
  const DEMO_PASSWORD = 'aisniper';
  const root = document.documentElement;
  const APPS = {
    finder: { name: '访达', window: 'window-finder', width: 922, height: 588, minWidth: 660, minHeight: 430, resizable: true },
    browser: { name: '浏览器', window: 'window-browser', width: 1120, height: 720, minWidth: 760, minHeight: 520, resizable: true },
    messages: { name: '信息', window: 'window-messages', width: 948, height: 620, minWidth: 710, minHeight: 470, resizable: true },
    agent: { name: '智能体', window: 'window-agent', width: 982, height: 656, minWidth: 720, minHeight: 520, resizable: true },
    calculator: { name: '计算器', window: 'window-calculator', width: 326, height: 512, minWidth: 326, minHeight: 512, resizable: false },
    settings: { name: '系统设置', window: 'window-settings', width: 892, height: 606, minWidth: 700, minHeight: 470, resizable: true },
    terminal: { name: '终端', window: 'window-terminal', width: 758, height: 468, minWidth: 480, minHeight: 310, resizable: true },
    ops: { name: '运维台', window: 'window-ops', width: 1080, height: 690, minWidth: 760, minHeight: 540, resizable: true },
    steam: { name: 'Steam', window: 'window-steam', width: 1128, height: 724, minWidth: 840, minHeight: 540, resizable: true },
    cs2: { name: 'Counter-Strike 2', window: 'window-cs2', width: 1060, height: 660, minWidth: 720, minHeight: 480, resizable: true },
    vrchat: { name: 'VRChat', window: 'window-vrchat', width: 1040, height: 660, minWidth: 720, minHeight: 480, resizable: true },
    steamvr: { name: 'SteamVR', window: 'window-steamvr', width: 960, height: 640, minWidth: 760, minHeight: 500, resizable: true },
    ovrtk: { name: 'OVR Toolkit', window: 'window-ovrtk', width: 900, height: 600, minWidth: 700, minHeight: 470, resizable: true },
    slimevr: { name: 'SlimeVR', window: 'window-slimevr', width: 920, height: 620, minWidth: 720, minHeight: 480, resizable: true },
    steamdemo: { name: 'Steam 游戏', window: 'window-steamdemo', width: 1080, height: 680, minWidth: 720, minHeight: 500, resizable: true },
    unity: { name: 'AISniper Unity', window: 'window-unity', width: 1160, height: 720, minWidth: 800, minHeight: 560, resizable: true },
    game: { name: '深空信号', window: 'window-game', width: 1080, height: 678, minWidth: 620, minHeight: 460, resizable: true }
  };
  const LAUNCH_APP = { finder: 'finder', browser: 'browser', messages: 'messages', agent: 'agent', calculator: 'calculator', settings: 'settings', terminal: 'terminal', ops: 'ops', steam: 'steam', unity: 'unity', game: 'game', trash: 'finder' };
  const WALLPAPERS = {
    meridian: { name: '子午线', hint: '高山黄昏' },
    ember: { name: '余烬旷野', hint: '日晕薄雾' },
    glacier: { name: '冰川空气', hint: '极地光线' },
    midnight: { name: '极夜', hint: '靛蓝星海' },
    sakura: { name: '樱雾', hint: '暮色花云' },
    dunes: { name: '沙丘', hint: '金色风脊' },
    forest: { name: '苔林', hint: '雾中针叶' },
    ocean: { name: '潮汐', hint: '深海蓝光' },
    nebula: { name: '星云', hint: '紫红星尘' },
    mono: { name: '石墨', hint: '银灰极简' },
    solaris: { name: '日冕', hint: '金色日蚀' },
    abyss: { name: '深潜', hint: '钴蓝深渊' }
  };
  const WALLPAPER_KEYS = Object.keys(WALLPAPERS);

  const defaultState = {
    appearance: 'dark',
    wallpaper: 'meridian',
    accent: 'solar',
    glass: true,
    reduceMotion: false,
    animateWallpaper: true,
    widgets: true,
    magnification: true,
    dockAutoHide: false,
    dockIndicators: true,
    dockSize: 62,
    wifi: true,
    wifiNetwork: 'AISniper-5G',
    askNetworks: true,
    brightness: 100,
    soundVolume: 65,
    interfaceSounds: true,
    alertSound: 'Signal',
    notifications: true,
    notificationSounds: true,
    notificationBadges: true,
    focusMode: 'off',
    focusReduceMotion: false,
    locationServices: true,
    cameraAccess: true,
    micAccess: true,
    analytics: false,
    firewall: true,
    clock24: true,
    showMenuDate: true,
    autoTime: true,
    autoUpdates: true,
    updateChannel: 'stable',
    autoLogin: false,
    showLoginHint: true,
    restoreWindows: true
  };

  function loadSettings() {
    const safe = { ...defaultState };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved || typeof saved !== 'object') return safe;
      if (['light', 'dark', 'auto'].includes(saved.appearance)) safe.appearance = saved.appearance;
      if (WALLPAPER_KEYS.includes(saved.wallpaper)) safe.wallpaper = saved.wallpaper;
      if (['solar', 'signal', 'iris', 'ember'].includes(saved.accent)) safe.accent = saved.accent;
      ['glass', 'reduceMotion', 'animateWallpaper', 'widgets', 'magnification', 'dockAutoHide', 'dockIndicators', 'wifi', 'askNetworks', 'interfaceSounds', 'notifications', 'notificationSounds', 'notificationBadges', 'focusReduceMotion', 'locationServices', 'cameraAccess', 'micAccess', 'analytics', 'firewall', 'clock24', 'showMenuDate', 'autoTime', 'autoUpdates', 'autoLogin', 'showLoginHint', 'restoreWindows'].forEach((key) => {
        if (typeof saved[key] === 'boolean') safe[key] = saved[key];
      });
      if (['off', 'quiet', 'orbit'].includes(saved.focusMode)) safe.focusMode = saved.focusMode;
      if (['stable', 'beta'].includes(saved.updateChannel)) safe.updateChannel = saved.updateChannel;
      if (typeof saved.dockSize === 'number') safe.dockSize = clamp(saved.dockSize, 46, 74);
      if (typeof saved.brightness === 'number') safe.brightness = clamp(saved.brightness, 40, 100);
      if (typeof saved.soundVolume === 'number') safe.soundVolume = clamp(saved.soundVolume, 0, 100);
      const legacyNetworkAliases = {
        'Meridian Private': '子午线私人网络',
        'Aperture Studio': 'Aperture 工作室',
        'Ridge Station 6E': '山脊站 6E',
        'Meridian Guest': '子午线访客'
      };
      if (typeof saved.wifiNetwork === 'string' && saved.wifiNetwork.length < 40) {
        safe.wifiNetwork = legacyNetworkAliases[saved.wifiNetwork] || saved.wifiNetwork;
      }
      if (['Signal', 'Ridge', 'Pulse'].includes(saved.alertSound)) safe.alertSound = saved.alertSound;
    } catch (error) {
      /* The desktop should still work when storage is unavailable. */
    }
    return safe;
  }

  let state = loadSettings();
  let activeApp = 'finder';
  let zCounter = 120;
  let bootFinished = false;
  let gameInstance = null;
  let browserController = null;
  let agentController = null;
  let messagesController = null;
  let opsController = null;
  let steamController = null;
  let unityController = null;
  let audioContext = null;
  let isLocked = true;
  let loginMode = 'initial';
  let loginInitialComplete = false;
  let loginHintToggleTimer = null;

  const windowStates = {};
  const networkNames = ['AISniper-5G', '子午线私人网络', 'Aperture 工作室', '山脊站 6E', '子午线访客'];
  const sleepState = { open: false };

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* no-op */ }
  }

  function resolvedTheme() {
    if (state.appearance !== 'auto') return state.appearance;
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? 'light' : 'dark';
  }

  function applyVisualState() {
    const theme = resolvedTheme();
    root.dataset.theme = theme;
    root.dataset.wallpaper = state.wallpaper;
    root.dataset.accent = state.accent;
    document.body.classList.toggle('no-glass', !state.glass);
    document.body.classList.toggle('reduce-motion', state.reduceMotion);
    document.body.classList.toggle('no-wallpaper-motion', !state.animateWallpaper);
    document.body.classList.toggle('no-widgets', !state.widgets);
    document.body.classList.toggle('focus-active', state.focusMode !== 'off');
    document.body.classList.toggle('focus-calm', state.focusMode !== 'off' && state.focusReduceMotion);
    document.body.dataset.focus = state.focusMode;
    document.body.dataset.magnification = state.magnification ? 'on' : 'off';
    document.body.dataset.dockIndicators = state.dockIndicators ? 'on' : 'off';
    root.style.setProperty('--dock-icon-size', `${effectiveDockSize()}px`);
    const veils = $$('#brightnessVeil');
    veils.forEach((veil) => { veil.style.opacity = String(((100 - state.brightness) / 100) * 0.75); });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#e3e1da' : '#070a10');
    const menuDate = $('#menuBarDate');
    if (menuDate) menuDate.hidden = !state.showMenuDate;
    syncInterfaceState();
    updateClock();
  }

  function syncInterfaceState() {
    /* Toggles */
    $$('[data-setting-toggle]').forEach((control) => {
      const key = control.dataset.settingToggle;
      if (!(key in state)) return;
      const value = Boolean(state[key]);
      control.classList.toggle('is-on', value);
      if (control.getAttribute('role') === 'switch' || control.tagName === 'BUTTON') {
        control.setAttribute('aria-checked', String(value));
      }
    });

    /* Theme + appearance */
    $$('[data-theme-choice]').forEach((choice) => {
      const selected = choice.dataset.themeChoice === state.appearance;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    const effectiveTheme = resolvedTheme();
    const themeLabel = state.appearance === 'auto'
      ? `自动 · ${effectiveTheme === 'light' ? '浅色' : '深色'}`
      : effectiveTheme === 'light' ? '浅色' : '深色';
    const controlThemeLabel = $('#controlThemeLabel');
    if (controlThemeLabel) controlThemeLabel.textContent = themeLabel;
    const controlThemeIcon = $('#controlThemeIcon use');
    if (controlThemeIcon) controlThemeIcon.setAttribute('href', effectiveTheme === 'light' ? '#i-sun' : '#i-moon');

    /* Accent + wallpaper */
    $$('[data-accent-choice]').forEach((choice) => {
      const selected = choice.dataset.accentChoice === state.accent;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    $$('[data-wallpaper-choice]').forEach((choice) => {
      const selected = choice.dataset.wallpaperChoice === state.wallpaper;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });

    /* Alert sound */
    $$('[data-alert-sound]').forEach((choice) => {
      choice.classList.toggle('is-selected', choice.dataset.alertSound === state.alertSound);
    });

    /* Focus, update channel & login hint */
    $$('[data-focus-mode]').forEach((choice) => {
      const selected = choice.dataset.focusMode === state.focusMode;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    $$('[data-update-channel]').forEach((choice) => {
      choice.classList.toggle('is-selected', choice.dataset.updateChannel === state.updateChannel);
    });
    syncFocusDisplay();
    syncLoginHint();

    /* Range fields */
    const rangeBindings = [
      ['#dockSizeRange', 'dockSize'],
      ['#brightnessRange', 'brightness'],
      ['#soundVolumeRange', 'soundVolume'],
      ['#controlBrightness', 'brightness'],
      ['#controlVolume', 'soundVolume']
    ];
    rangeBindings.forEach(([selector, key]) => {
      const input = $(selector);
      if (!input) return;
      if (input.value !== String(state[key])) input.value = String(state[key]);
      updateRangeFill(input);
    });
    const dockSizeValue = $('#dockSizeValue');
    if (dockSizeValue) dockSizeValue.textContent = `${state.dockSize} px`;
    const brightnessValue = $('#brightnessValue');
    if (brightnessValue) brightnessValue.textContent = `${state.brightness}%`;
    const soundVolumeValue = $('#soundVolumeValue');
    if (soundVolumeValue) soundVolumeValue.textContent = `${state.soundVolume}%`;
    const controlBrightnessValue = $('#controlBrightnessValue');
    if (controlBrightnessValue) controlBrightnessValue.textContent = `${state.brightness}%`;
    const controlVolumeValue = $('#controlVolumeValue');
    if (controlVolumeValue) controlVolumeValue.textContent = `${state.soundVolume}%`;

    /* Wi-Fi */
    syncWifiDisplay();
    syncDockAutoHide();
    const reducedBySystem = prefersReducedMotion.matches;
    if (reducedBySystem) document.body.classList.add('reduce-motion');
  }

  function updateRangeFill(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value);
    const ratio = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty('--range-fill', `${clamp(ratio, 0, 100)}%`);
  }

  function effectiveDockSize() {
    if (window.innerWidth <= 620) return Math.min(state.dockSize, 42);
    if (window.innerWidth <= 760) return Math.min(state.dockSize, 54);
    return clamp(state.dockSize, 46, 74);
  }

  function setState(key, value, options = {}) {
    state[key] = value;
    saveSettings();
    applyVisualState();
    if (key === 'soundVolume') {
      window.dispatchEvent(new CustomEvent('aisniper:volumechange', { detail: { volume: state.soundVolume / 100 } }));
      if (gameInstance && typeof gameInstance.setVolume === 'function') gameInstance.setVolume(state.soundVolume / 100);
    }
    if (key === 'interfaceSounds' && value) {
      playInterfaceTone('open');
    }
    if ((key === 'clock24' || key === 'showMenuDate') && typeof updateClock === 'function') updateClock();
    if (key === 'showLoginHint') syncLoginHint();
    if (key === 'notificationBadges') messagesController?.syncBadge?.();
    if (key === 'notifications' && !value) $('#toastStack')?.replaceChildren();
    if (!options.silent) {
      if (key === 'wifi') showToast({
        title: value ? 'Wi-Fi 已开启' : 'Wi-Fi 已关闭',
        message: value ? `已连接到 ${state.wifiNetwork}；有线网络保持在线。` : '有线网络保持在线，无线链路已暂停。',
        icon: 'i-wifi'
      });
      if (key === 'notifications') showToast({
        title: value ? '通知已开启' : '通知已静默',
        message: value ? '应用提醒会重新出现在右上角。' : '所有横幅提醒已关闭。',
        icon: 'i-bell'
      });
      if (key === 'autoLogin') showToast({
        title: value ? '自动登录已开启' : '自动登录已关闭',
        message: value ? '下次启动将直接进入桌面。' : '下次启动会停留在登录界面。',
        icon: 'i-user'
      });
      if (key === 'dockAutoHide') showToast({
        title: value ? '程序坞已隐藏' : '程序坞已显示',
        message: value ? '将指针移动到底部边缘即可显示。' : '程序坞将保持可见。',
        icon: 'i-desktop'
      });
      if (key === 'askNetworks') showToast({
        title: value ? '网络提示已开启' : '网络提示已关闭',
        message: value ? '当已知网络在附近时，AISniperOS 会提醒你。' : '无线网络提示已静默。',
        icon: 'i-wifi'
      });
    }
  }

  function setAppearance(mode, options = {}) {
    if (!['light', 'dark', 'auto'].includes(mode)) return;
    state.appearance = mode;
    saveSettings();
    applyVisualState();
    if (!options.silent && options.announce) {
      showToast({
        title: mode === 'auto' ? '外观已设为自动' : `${mode === 'light' ? '浅色' : '深色'}外观`,
        message: mode === 'auto' ? `当前使用${resolvedTheme() === 'light' ? '浅色' : '深色'}，将在下一个时段自动切换。` : '每一个界面都会跟随你的选择。',
        icon: mode === 'light' ? 'i-sun' : 'i-moon'
      });
    }
  }

  function toggleAppearance(options = {}) {
    const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
    setAppearance(next, { announce: options.announce !== false, silent: false });
  }

  function setWallpaper(name, options = {}) {
    if (!WALLPAPER_KEYS.includes(name)) return;
    state.wallpaper = name;
    saveSettings();
    applyVisualState();
    if (options.announce) showToast({ title: '墙纸已更换', message: `${WALLPAPERS[name].name} 已成为你的新地平线。`, icon: 'i-image' });
  }

  function setAccent(name) {
    if (!['solar', 'signal', 'iris', 'ember'].includes(name)) return;
    state.accent = name;
    saveSettings();
    applyVisualState();
  }

  function setWifi(enabled, options = {}) {
    state.wifi = Boolean(enabled);
    saveSettings();
    applyVisualState();
    if (!options.silent) {
      showToast({
        title: state.wifi ? 'Wi-Fi 已开启' : 'Wi-Fi 已关闭',
        message: state.wifi ? `已连接到 ${state.wifiNetwork}；有线网络保持在线。` : '有线网络保持在线，无线链路已暂停。',
        icon: 'i-wifi'
      });
    }
    playInterfaceTone(state.wifi ? 'connect' : 'close');
  }

  function connectNetwork(name) {
    if (!networkNames.includes(name)) return;
    if (!state.wifi) {
      state.wifiNetwork = name;
      setWifi(true, { silent: true });
    } else {
      state.wifiNetwork = name;
      saveSettings();
      applyVisualState();
    }
    showToast({ title: `已连接到 ${name}`, message: '无线安全连接已建立 · WPA3。', icon: 'i-wifi' });
    playInterfaceTone('connect');
  }

  function syncWifiDisplay() {
    const connected = state.wifiNetwork || 'AISniper-5G';
    const topButton = $('#wifiStatusBtn');
    if (topButton) {
      topButton.classList.remove('is-off');
      topButton.setAttribute('aria-label', `网络，以太网已连接${state.wifi ? `，Wi-Fi 已连接到 ${connected}` : '，Wi-Fi 已关闭'}`);
    }
    const subtitleEl = $('#wifiPopoverSubtitle');
    if (subtitleEl) subtitleEl.textContent = '以太网已连接 · 1000 Mbps';
    const popover = $('#popover-wifi');
    if (popover) popover.classList.toggle('is-wifi-off', !state.wifi);
    const stateEl = $('#settingsWifiState');
    if (stateEl) stateEl.textContent = state.wifi ? `已连接到 ${connected}` : '已关闭 · 有线网络仍在线';
    const wifiPopoverStatus = $('#wifiPopoverStatus');
    if (wifiPopoverStatus) wifiPopoverStatus.textContent = state.wifi ? `可选 · 已连接 ${connected}` : '可选 · 已关闭';
    const settingsWindow = $('#window-settings');
    if (settingsWindow) settingsWindow.classList.toggle('settings-wifi-off', !state.wifi);
    const wifiDot = $('#settingsWifiDot');
    if (wifiDot) wifiDot.classList.remove('is-off');
    const controlLabel = $('#controlWifiLabel');
    if (controlLabel) controlLabel.textContent = state.wifi ? connected : '可选 · 关闭';
    renderNetworkLists();
  }

  function syncFocusDisplay() {
    const modes = {
      off: {
        title: '关闭',
        copy: '通知与界面声音正常抵达。',
        agenda: '下一次静默专注 · 16:00',
        time: '—'
      },
      quiet: {
        title: '静默专注',
        copy: '通知横幅与界面提示已静默，直到你手动关闭。',
        agenda: '静默专注 · 通知已静默',
        time: '手动关闭'
      },
      orbit: {
        title: '轨道模式',
        copy: '深度专注，所有应用打断与提示已暂停。',
        agenda: '轨道模式 · 深度专注',
        time: '手动关闭'
      }
    };
    const mode = modes[state.focusMode] || modes.off;
    const title = $('#focusSummaryTitle');
    const copy = $('#focusSummaryCopy');
    const time = $('#focusSummaryTime');
    if (title) title.textContent = mode.title;
    if (copy) copy.textContent = mode.copy;
    if (time) time.textContent = mode.time;
    const agenda = $('#agendaFocusLabel');
    if (agenda) agenda.textContent = mode.agenda;
    const summaryCard = $('.focus-summary-card');
    if (summaryCard) summaryCard.dataset.mode = state.focusMode;
    $$('[data-focus-mode]').forEach((choice) => {
      const selected = choice.dataset.focusMode === state.focusMode;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
  }

  function setFocusMode(mode) {
    if (!['off', 'quiet', 'orbit'].includes(mode) || state.focusMode === mode) return;
    state.focusMode = mode;
    saveSettings();
    applyVisualState();
    if (mode === 'off') {
      showToast({ title: '专注模式已关闭', message: '通知与界面声音恢复正常。', icon: 'i-sun' });
    } else {
      $('#toastStack')?.replaceChildren();
    }
    playInterfaceTone(mode === 'off' ? 'open' : 'connect');
  }

  function syncLoginHint() {
    const hint = $('#loginHint');
    const code = $('#loginPasswordHint');
    if (code) code.textContent = DEMO_PASSWORD;
    if (hint) hint.hidden = !state.showLoginHint;
    const sessionNote = $('#loginSessionNote');
    if (sessionNote && !document.body.classList.contains('is-locked')) {
      sessionNote.textContent = '输入账户密码，进入你的私人工作区。';
    }
  }

  function makeNetworkRow(name, container) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'network-row';
    row.dataset.network = name;
    const isConnected = state.wifi && name === state.wifiNetwork;
    const isSecure = name !== '子午线访客';
    if (isConnected) row.classList.add('is-connected');
    const wifiIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wifiIcon.setAttribute('viewBox', '0 0 24 24');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-wifi');
    wifiIcon.appendChild(use);
    row.appendChild(wifiIcon);
    const nameEl = document.createElement('span');
    nameEl.textContent = name;
    row.appendChild(nameEl);
    if (isSecure) {
      const lock = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      lock.setAttribute('viewBox', '0 0 24 24');
      lock.classList.add('network-lock');
      const lockUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      lockUse.setAttribute('href', '#i-lock');
      lock.appendChild(lockUse);
      row.appendChild(lock);
    }
    const rowState = document.createElement('span');
    rowState.className = 'network-row-state';
    rowState.textContent = isConnected ? '已连接' : isSecure ? '安全' : '开放';
    row.appendChild(rowState);
    row.setAttribute('aria-label', `${name}${isConnected ? '，已连接' : ''}`);
    return row;
  }

  function renderNetworkLists() {
    const popover = $('#wifiNetworkList');
    if (popover) {
      popover.replaceChildren();
      networkNames.forEach((name) => popover.appendChild(makeNetworkRow(name)));
    }
    const settings = $('#settingsNetworkList');
    if (settings) {
      settings.replaceChildren();
      networkNames.forEach((name) => settings.appendChild(makeNetworkRow(name)));
    }
  }

  function handleNetworkClick(event) {
    const row = event.target.closest('[data-network]');
    if (!row) return;
    connectNetwork(row.dataset.network);
  }

  function syncDockAutoHide() {
    const shell = $('#dockShell');
    if (!shell) return;
    if (!state.dockAutoHide) {
      shell.classList.remove('is-hidden');
      return;
    }
    if (!shell.matches(':hover')) {
      clearTimeout(syncDockAutoHide.timer);
      syncDockAutoHide.timer = setTimeout(() => {
        if (state.dockAutoHide && !sleepState.open) shell.classList.add('is-hidden');
      }, 850);
    }
  }

  /* ------------------------------------------------------------------------
     Sound — restrained Web Audio cues, never autoplayed
     ------------------------------------------------------------------------ */

  function ensureAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctx();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(frequency, duration, type = 'sine', gainValue = 0.035, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.72), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function playInterfaceTone(kind = 'click', force = false) {
    if (!force && (!state.interfaceSounds || state.soundVolume === 0)) return;
    const volume = clamp(state.soundVolume / 100, 0, 1);
    if (volume === 0) return;
    if (kind === 'open') {
      playTone(590, 0.13, 'sine', 0.022 * volume);
      playTone(883, 0.17, 'sine', 0.015 * volume, 0.055);
    } else if (kind === 'close') {
      playTone(440, 0.11, 'sine', 0.016 * volume);
    } else if (kind === 'connect') {
      playTone(740, 0.1, 'sine', 0.018 * volume);
      playTone(1110, 0.16, 'sine', 0.015 * volume, 0.08);
    } else if (kind === 'alert') {
      playTone(920, 0.18, 'sine', 0.028 * volume);
      playTone(690, 0.22, 'sine', 0.02 * volume, 0.13);
    } else {
      playTone(680, 0.07, 'sine', 0.012 * volume);
    }
  }

  /* ------------------------------------------------------------------------
     Toasts
     ------------------------------------------------------------------------ */

  function showToast(options = {}) {
    const stack = $('#toastStack');
    if (!stack) return null;
    if (!options.critical && (isLocked || !state.notifications || state.focusMode !== 'off')) return null;
    const icon = options.icon || 'i-mark';
    const el = document.createElement('article');
    el.className = 'toast';
    el.innerHTML = `
      <span class="toast-icon"><svg viewBox="0 0 24 24"><use href="#${icon}"></use></svg></span>
      <div class="toast-copy"><b></b><span></span></div>
      <button class="toast-close" aria-label="关闭通知"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button>`;
    $('b', el).textContent = options.title || 'AISniperOS';
    $('.toast-copy span', el).textContent = options.message || '';
    $('.toast-copy span', el).hidden = !options.message;
    const close = () => {
      if (!el.isConnected || el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 260);
    };
    $('.toast-close', el).addEventListener('click', close);
    stack.appendChild(el);
    if (state.notificationSounds && state.interfaceSounds && state.soundVolume > 0) {
      playTone(860, 0.1, 'sine', 0.01);
      playTone(1120, 0.12, 'sine', 0.006, 0.07);
    }
    while (stack.children.length > 3) stack.firstElementChild.remove();
    const duration = options.duration === undefined ? 4600 : options.duration;
    if (duration > 0) setTimeout(close, duration);
    return el;
  }

  /* ------------------------------------------------------------------------
     Clock
     ------------------------------------------------------------------------ */

  let lastRenderedDate = '';
  let sleepOpen = false;

  function formatClockTime(now, twelveHour = !state.clock24) {
    const hours = now.getHours();
    const minutes = pad(now.getMinutes());
    if (!twelveHour) return `${pad(hours)}:${minutes}`;
    const period = hours < 12 ? '上午' : '下午';
    return `${period} ${hours % 12 || 12}:${minutes}`;
  }

  function updateClock() {
    const now = new Date();
    const weekdayShort = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    const weekdayLong = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];
    const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日`;
    const shortDate = `${dateLabel} ${weekdayShort}`;
    const time = formatClockTime(now);
    const menuDate = $('#menuBarDate');
    const menuTime = $('#menuBarTime');
    if (menuDate) {
      menuDate.textContent = shortDate;
      menuDate.hidden = !state.showMenuDate;
    }
    if (menuTime) menuTime.textContent = time;
    const longDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdayLong}`;
    const agendaDate = $('.agenda-widget .widget-heading > span:first-child');
    if (agendaDate) agendaDate.textContent = longDate;
    const sleepTime = $('#sleepTime');
    const sleepDate = $('#sleepDate');
    if (sleepTime) sleepTime.textContent = time;
    if (sleepDate) sleepDate.textContent = longDate;
    const loginTime = $('#loginTime');
    const loginDate = $('#loginDate');
    const loginTopDate = $('#loginTopDate');
    if (loginTime) loginTime.textContent = formatClockTime(now);
    if (loginDate) loginDate.textContent = longDate;
    if (loginTopDate) loginTopDate.textContent = longDate;
    const calendarBigDay = $('#calendarBigDay');
    if (calendarBigDay) calendarBigDay.textContent = String(now.getDate());
    const calendarHeading = $('#calendarHeading');
    if (calendarHeading) calendarHeading.textContent = longDate;
    const calendarDayLabel = $('#calendarDayLabel');
    if (calendarDayLabel) calendarDayLabel.textContent = dateLabel;
    const settingsClock = $('#settingsClockPreview');
    const settingsDate = $('#settingsDatePreview');
    if (settingsClock) settingsClock.textContent = time;
    if (settingsDate) settingsDate.textContent = longDate;
    const stamp = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (stamp !== lastRenderedDate) {
      lastRenderedDate = stamp;
      if ($('#popover-calendar')?.classList.contains('is-open')) renderCalendar();
      if (state.appearance === 'auto') applyVisualState();
    }
    updateUptime();
  }

  function updateUptime() {
    const elapsed = Date.now() - OS_BOOT_TIME;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const uptime = $('#settingsUptime');
    if (uptime) uptime.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  const OS_BOOT_TIME = Date.now();

  /* ------------------------------------------------------------------------
     System health
     ------------------------------------------------------------------------ */

  const health = {
    cpu: 18,
    memory: 42,
    gpu: 12,
    temperature: 36,
    score: 98,
    cpuHistory: [14, 20, 17, 23, 19, 16, 21, 18, 24, 20, 17, 19],
    memoryHistory: [39, 40, 39, 41, 42, 42, 41, 43, 42, 41, 42, 42]
  };

  function healthScore() {
    let score = 100;
    score -= Math.max(0, health.cpu - 24) * 0.09;
    score -= Math.max(0, health.memory - 56) * 0.08;
    score -= Math.max(0, health.temperature - 47) * 0.35;
    return clamp(Math.round(score), 86, 99);
  }

  function sparkPath(points, fill = false) {
    const max = 100;
    const height = 38;
    const width = 120;
    const step = width / Math.max(1, points.length - 1);
    const coords = points.map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (height - 4 - (clamp(value, 0, max) / max) * (height - 8)).toFixed(1);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    return fill ? `${coords} L120,38 L0,38 Z` : coords;
  }

  function syncHealthDisplay() {
    health.score = healthScore();
    const cpu = Math.round(health.cpu);
    const mem = Math.round(health.memory);
    const gpu = Math.round(health.gpu);
    const temp = Math.round(health.temperature);
    [
      ['#popoverCpu', `${cpu}%`], ['#popoverMem', `${mem}%`],
      ['#settingsCpu', `${cpu}%`], ['#settingsMem', `${mem}%`], ['#settingsGpu', `${gpu}%`]
    ].forEach(([selector, value]) => {
      const el = $(selector);
      if (el) el.textContent = value;
    });
    const popoverScore = $('#popoverHealthScore');
    if (popoverScore) popoverScore.textContent = String(health.score);
    const settingsScore = $('#settingsHealthScore');
    if (settingsScore) settingsScore.textContent = String(health.score);
    const ring = $('#popoverHealthRing');
    if (ring) ring.style.strokeDashoffset = String(2 * Math.PI * 41 * (1 - health.score / 100));
    const settingsRing = $('#settingsHealthRing');
    if (settingsRing) settingsRing.style.strokeDashoffset = String(2 * Math.PI * 64 * (1 - health.score / 100));
    const cpuLine = $('#cpuSparkLine');
    const cpuFill = $('#cpuSparkFill');
    if (cpuLine) cpuLine.setAttribute('d', sparkPath(health.cpuHistory, false));
    if (cpuFill) cpuFill.setAttribute('d', sparkPath(health.cpuHistory, true));
    const memLine = $('#memSparkLine');
    const memFill = $('#memSparkFill');
    if (memLine) memLine.setAttribute('d', sparkPath(health.memoryHistory, false));
    if (memFill) memFill.setAttribute('d', sparkPath(health.memoryHistory, true));
    [['#settingsCpuBar', health.cpu], ['#settingsMemBar', health.memory], ['#settingsGpuBar', health.gpu]].forEach(([selector, value]) => {
      const el = $(selector);
      if (el) el.style.width = `${value}%`;
    });
    const scoreCopy = $('.health-score-copy h3');
    if (scoreCopy) scoreCopy.textContent = health.score >= 96 ? '所有系统稳定。' : health.score >= 92 ? '运行状态正常。' : '温度略高。';
  }

  function driftHealth() {
    if (document.hidden) return;
    const drift = (value, amount, low, high) => clamp(value + (Math.random() - 0.47) * amount, low, high);
    health.cpu = drift(health.cpu, 8, 9, 52);
    health.memory = drift(health.memory, 2.5, 35, 63);
    health.gpu = drift(health.gpu, 6, 6, 34);
    health.temperature = drift(health.temperature, 0.8, 34, 42);
    health.cpuHistory.push(health.cpu);
    health.memoryHistory.push(health.memory);
    if (health.cpuHistory.length > 14) health.cpuHistory.shift();
    if (health.memoryHistory.length > 14) health.memoryHistory.shift();
    syncHealthDisplay();
  }

  /* ------------------------------------------------------------------------
     Battery (best effort, with a graceful simulated fallback)
     ------------------------------------------------------------------------ */

  async function initBattery() {
    const label = $('.battery-label');
    if (!label || !navigator.getBattery) return;
    try {
      const battery = await navigator.getBattery();
      const sync = () => {
        const level = Math.round(battery.level * 100);
        label.textContent = `${level}%`;
        const button = $('.battery-status');
        if (button) button.setAttribute('aria-label', `电池 ${level}%${battery.charging ? '，正在充电' : ''}`);
        const batteryRow = $('.health-mini-rows > div:first-child b');
        if (batteryRow) batteryRow.textContent = `${level}%${battery.charging ? ' · 正在充电' : ''}`;
      };
      sync();
      battery.addEventListener('levelchange', sync);
      battery.addEventListener('chargingchange', sync);
    } catch (error) { /* keep the simulated value */ }
  }
  /* ========================================================================
     Window manager
     ======================================================================== */

  function initWindows() {
    Object.entries(APPS).forEach(([app, config]) => {
      const el = document.getElementById(config.window);
      if (!el) return;
      const s = {
        app,
        el,
        config,
        isOpen: false,
        isMinimized: false,
        maximized: false,
        isClosing: false,
        hasRect: false,
        previousRect: null,
        lastRect: null,
        zIndex: 100
      };
      windowStates[app] = s;
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
      const maxButton = $('[data-window-action="maximize"]', el);
      if (!config.resizable && maxButton) {
        maxButton.disabled = true;
        maxButton.style.opacity = '.35';
        maxButton.setAttribute('aria-disabled', 'true');
      }
      el.addEventListener('pointerdown', () => {
        if (s.isOpen && !s.isMinimized && !s.isClosing) focusApp(app);
      }, true);
      el.addEventListener('click', (event) => {
        const action = event.target.closest('[data-window-action]');
        if (!action || action.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        if (action.dataset.windowAction === 'close') closeApp(app);
        else if (action.dataset.windowAction === 'minimize') minimizeApp(app);
        else if (action.dataset.windowAction === 'maximize') toggleMaximize(app);
      });
      const dragRegion = $('[data-drag]', el);
      if (dragRegion) {
        dragRegion.addEventListener('pointerdown', (event) => startWindowDrag(event, app));
        dragRegion.addEventListener('dblclick', (event) => {
          if (event.target.closest('button, input, a')) return;
          if (config.resizable) toggleMaximize(app);
        });
      }
      if (config.resizable) addResizeHandles(s);
    });
    if ($('#dockShell')) {
      $('#dockShell').addEventListener('mouseenter', () => {
        const shell = $('#dockShell');
        if (shell) shell.classList.remove('is-hidden');
      });
      $('#dockShell').addEventListener('mouseleave', syncDockAutoHide);
    }
    const hotzone = $('#dockHotzone');
    if (hotzone) {
      hotzone.addEventListener('mouseenter', () => {
        const shell = $('#dockShell');
        if (shell && state.dockAutoHide) shell.classList.remove('is-hidden');
      });
      hotzone.addEventListener('mouseleave', syncDockAutoHide);
    }
    window.addEventListener('resize', handleViewportResize);
    updateDockRunningState();
  }

  function addResizeHandles(s) {
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((direction) => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      handle.dataset.resize = direction;
      handle.setAttribute('aria-hidden', 'true');
      handle.addEventListener('pointerdown', (event) => startWindowResize(event, s, direction));
      s.el.appendChild(handle);
    });
  }

  function calculateInitialRect(app, config) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
    const width = clamp(config.width, 300, Math.max(300, vw - 20));
    const height = clamp(config.height, 240, Math.max(240, vh - menubar - 116));
    const maxLeft = Math.max(18, vw - width - 18);
    const maxTop = (minimum) => Math.max(minimum, vh - height - 96);
    let left;
    let top;
    if (app === 'finder') {
      left = clamp(vw * 0.045, 18, maxLeft);
      top = clamp(menubar + 27, menubar + 18, maxTop(menubar + 18));
    } else if (app === 'calculator') {
      left = clamp(vw * 0.61, 20, maxLeft);
      top = clamp(vh * 0.19, menubar + 28, maxTop(menubar + 28));
    } else if (app === 'settings') {
      left = clamp((vw - width) / 2, 18, maxLeft);
      top = clamp(menubar + 34, menubar + 20, maxTop(menubar + 20));
    } else if (app === 'terminal') {
      left = clamp(vw * 0.53 - width * 0.5, 18, maxLeft);
      top = clamp(vh * 0.29, menubar + 38, maxTop(menubar + 38));
    } else {
      left = clamp((vw - width) / 2, 18, maxLeft);
      top = clamp(menubar + 26, menubar + 16, maxTop(menubar + 16));
    }
    return { left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) };
  }

  function applyInitialRect(s) {
    const rect = calculateInitialRect(s.app, s.config);
    s.el.style.left = `${rect.left}px`;
    s.el.style.top = `${rect.top}px`;
    s.el.style.width = `${rect.width}px`;
    s.el.style.height = `${rect.height}px`;
    s.hasRect = true;
    s.lastRect = rect;
  }

  const GAME_FULLSCREEN_APPS = new Set(['cs2', 'vrchat', 'steamdemo', 'game']);
  let fullscreenGameApp = null;

  function cleanupGameFullscreen() {
    if (fullscreenGameApp) {
      const state = windowStates[fullscreenGameApp];
      if (state?.el) {
        state.el.classList.remove('game-fullscreen');
        state.el.querySelector('.game-fullscreen-exit')?.remove();
      }
    }
    document.body.classList.remove('game-fullscreen-active');
    fullscreenGameApp = null;
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function exitGameFullscreen() {
    cleanupGameFullscreen();
    try {
      const result = document.exitFullscreen
        ? document.exitFullscreen()
        : document.webkitExitFullscreen
          ? document.webkitExitFullscreen()
          : null;
      if (result && result.catch) result.catch(() => {});
    } catch (error) {
      /* Already out of fullscreen. */
    }
  }

  function enterGameFullscreen(app, state) {
    if (!state?.el || !GAME_FULLSCREEN_APPS.has(app)) return;
    if (fullscreenGameApp && fullscreenGameApp !== app) cleanupGameFullscreen();
    fullscreenGameApp = app;
    document.body.classList.add('game-fullscreen-active');
    state.el.classList.add('game-fullscreen');
    if (!state.el.querySelector('.game-fullscreen-exit')) {
      const exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'game-fullscreen-exit';
      exit.innerHTML = '退出全屏 <span>Esc</span>';
      exit.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        exitGameFullscreen();
      });
      state.el.appendChild(exit);
    }
    if (state.el.requestFullscreen || state.el.webkitRequestFullscreen) {
      try {
        const request = state.el.requestFullscreen
          ? state.el.requestFullscreen({ navigationUI: 'hide' })
          : state.el.webkitRequestFullscreen();
        if (request && request.catch) request.catch(() => {});
      } catch (error) {
        /* Fall back to the in-page fullscreen class. */
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    if (fullscreenElement()) {
      if (fullscreenGameApp) document.body.classList.add('game-fullscreen-active');
    } else if (fullscreenGameApp) {
      cleanupGameFullscreen();
    }
  });

  document.addEventListener('webkitfullscreenchange', () => {
    if (fullscreenElement()) {
      if (fullscreenGameApp) document.body.classList.add('game-fullscreen-active');
    } else if (fullscreenGameApp) {
      cleanupGameFullscreen();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !fullscreenGameApp || fullscreenElement()) return;
    event.preventDefault();
    event.stopPropagation();
    exitGameFullscreen();
  }, true);

  function openApp(app, options = {}) {
    if (isLocked) return;
    if (app === 'trash') {
      options = { ...options, location: 'trash' };
      app = 'finder';
    }
    const config = APPS[app];
    const s = windowStates[app];
    if (!config || !s) return;
    dismissOverlays();
    if (!s.hasRect) applyInitialRect(s);
    s.isClosing = false;
    s.el.classList.remove('is-closing', 'is-minimizing');
    if (!s.isOpen) {
      s.isOpen = true;
      s.el.classList.add('is-open');
      s.el.setAttribute('aria-hidden', 'false');
      if (app === 'terminal') setTimeout(() => $('#terminalInput')?.focus(), 160);
    } else if (s.isMinimized) {
      s.isMinimized = false;
      s.el.classList.add('is-open');
      s.el.setAttribute('aria-hidden', 'false');
      s.el.classList.remove('is-minimizing');
      if (app === 'terminal') setTimeout(() => $('#terminalInput')?.focus(), 160);
    }
    focusApp(app);
    if (app === 'finder' && options.location) finderGo(options.location);
    if (app === 'settings' && options.panel) showSettingsPanel(options.panel);
    if (app === 'browser') browserController?.open?.(options);
    if (app === 'agent') agentController?.open?.(options);
    if (app === 'messages') messagesController?.open?.(options);
    if (app === 'ops') opsController?.open?.(options);
    if (app === 'steam') steamController?.open?.(options);
    if (app === 'unity') unityController?.open?.(options);
    if (['cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr', 'steamdemo'].includes(app)) steamController?.openSurface?.(app, options);
    if (app === 'game') ensureGame();
    if (GAME_FULLSCREEN_APPS.has(app)) enterGameFullscreen(app, s);
    else if (fullscreenGameApp) exitGameFullscreen();
    updateDockRunningState();
    updateMaximizedDockState();
    if (!options.silent) playInterfaceTone('open');
  }

  function focusApp(app) {
    const s = windowStates[app];
    if (!s || !s.isOpen || s.isMinimized || s.isClosing) return;
    if (zCounter > 800) {
      Object.values(windowStates)
        .filter((entry) => entry.isOpen && !entry.isMinimized)
        .sort((a, b) => a.zIndex - b.zIndex)
        .forEach((entry, index) => {
          entry.zIndex = 130 + index;
          entry.el.style.zIndex = String(entry.zIndex);
        });
      zCounter = Math.max(130, ...Object.values(windowStates).map((entry) => entry.zIndex));
    }
    zCounter += 1;
    s.zIndex = zCounter;
    s.el.style.zIndex = String(zCounter);
    Object.entries(windowStates).forEach(([key, entry]) => {
      if (key !== app) entry.el.classList.remove('is-active');
    });
    s.el.classList.add('is-active');
    setActiveApp(app);
    updateDockRunningState();
  }

  function closeApp(app) {
    const s = windowStates[app];
    if (!s || !s.isOpen || s.isClosing) return;
    if (fullscreenGameApp === app) exitGameFullscreen();
    if (app === 'game') suspendGame();
    if (app === 'unity') unityController?.close?.();
    if (app === 'finder') { closeQuicklook(); closePdfViewer(); closeArchiveSheet(); }
    s.isClosing = true;
    s.el.classList.add('is-closing');
    playInterfaceTone('close');
    const finish = () => {
      s.el.classList.remove('is-open', 'is-closing', 'is-active', 'is-minimizing');
      s.el.setAttribute('aria-hidden', 'true');
      s.isOpen = false;
      s.isMinimized = false;
      s.isClosing = false;
      updateMaximizedDockState();
      updateDockRunningState();
      if (activeApp === app) focusNextWindow(app);
    };
    setTimeout(finish, 180);
  }

  function minimizeApp(app) {
    const s = windowStates[app];
    if (!s || !s.isOpen || s.isMinimized || s.isClosing) return;
    if (fullscreenGameApp === app) exitGameFullscreen();
    if (app === 'game') suspendGame();
    if (app === 'unity') unityController?.close?.();
    if (app === 'finder') { closeQuicklook(); closePdfViewer(); closeArchiveSheet(); }
    s.isMinimized = true;
    s.el.classList.add('is-minimizing');
    s.el.classList.remove('is-active');
    updateMaximizedDockState();
    playInterfaceTone('close');
    setTimeout(() => {
      if (!s.isMinimized) return;
      s.el.classList.remove('is-open', 'is-minimizing');
      s.el.setAttribute('aria-hidden', 'true');
      updateDockRunningState();
      if (activeApp === app) focusNextWindow(app);
    }, 250);
  }

  function focusNextWindow(excludeApp = null) {
    const candidates = Object.entries(windowStates)
      .filter(([app, s]) => app !== excludeApp && s.isOpen && !s.isMinimized && !s.isClosing)
      .sort(([, a], [, b]) => b.zIndex - a.zIndex);
    if (candidates.length) focusApp(candidates[0][0]);
    else setActiveApp('finder');
  }

  function toggleMaximize(app) {
    const s = windowStates[app];
    if (!s || !s.isOpen || !s.config.resizable) return;
    const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
    if (s.maximized) {
      const rect = s.previousRect;
      s.maximized = false;
      s.el.classList.remove('is-maximized');
      if (rect) {
        s.el.style.left = `${rect.left}px`;
        s.el.style.top = `${rect.top}px`;
        s.el.style.width = `${rect.width}px`;
        s.el.style.height = `${rect.height}px`;
      }
      updateMaximizedDockState();
      if (app === 'game') requestAnimationFrame(() => gameInstance?.resize?.());
      return;
    }
    s.previousRect = {
      left: s.el.offsetLeft,
      top: s.el.offsetTop,
      width: s.el.offsetWidth,
      height: s.el.offsetHeight
    };
    s.maximized = true;
    s.el.classList.add('is-maximized');
    applyMaximizedRect(s, menubar);
    updateMaximizedDockState();
    if (app === 'game') requestAnimationFrame(() => gameInstance?.resize?.());
    playInterfaceTone('click');
  }

  function applyMaximizedRect(s, menubar = null) {
    const top = (menubar ?? (parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31)) + 7;
    s.el.style.left = '8px';
    s.el.style.top = `${Math.round(top)}px`;
    s.el.style.width = `${Math.max(320, window.innerWidth - 16)}px`;
    s.el.style.height = `${Math.max(240, window.innerHeight - top - 8)}px`;
  }

  function handleViewportResize() {
    if (handleViewportResize.raf) cancelAnimationFrame(handleViewportResize.raf);
    handleViewportResize.raf = requestAnimationFrame(() => {
      root.style.setProperty('--dock-icon-size', `${effectiveDockSize()}px`);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
      Object.values(windowStates).forEach((s) => {
        if (!s.isOpen || s.isMinimized) return;
        if (s.maximized) {
          applyMaximizedRect(s, menubar);
          return;
        }
        let width = s.el.offsetWidth;
        let height = s.el.offsetHeight;
        if (width > vw - 20) width = vw - 20;
        if (height > vh - 76) height = vh - 76;
        s.el.style.width = `${Math.max(290, width)}px`;
        s.el.style.height = `${Math.max(220, height)}px`;
        let left = s.el.offsetLeft;
        let top = s.el.offsetTop;
        if (left + width > vw - 10) left = Math.max(10, vw - width - 10);
        if (top + height > vh - 40) top = Math.max(menubar + 8, vh - height - 40);
        if (top < menubar + 2) top = menubar + 2;
        s.el.style.left = `${left}px`;
        s.el.style.top = `${top}px`;
      });
      if (gameInstance?.resize) gameInstance.resize();
      repositionOpenPopover();
    });
  }

  function startWindowDrag(event, app) {
    if (event.button !== 0) return;
    if (event.target.closest('button, input, a, [data-window-action]')) return;
    const s = windowStates[app];
    if (!s || s.maximized || !s.isOpen || s.isMinimized) return;
    event.preventDefault();
    focusApp(app);
    const start = {
      x: event.clientX,
      y: event.clientY,
      left: s.el.offsetLeft,
      top: s.el.offsetTop,
      width: s.el.offsetWidth,
      height: s.el.offsetHeight
    };
    document.body.classList.add('is-dragging-window');
    const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      const nextLeft = clamp(start.left + dx, -start.width + 132, window.innerWidth - 132);
      const nextTop = clamp(start.top + dy, menubar + 2, window.innerHeight - 48);
      s.el.style.left = `${Math.round(nextLeft)}px`;
      s.el.style.top = `${Math.round(nextTop)}px`;
    };
    const up = () => {
      document.body.classList.remove('is-dragging-window');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      s.lastRect = { left: s.el.offsetLeft, top: s.el.offsetTop, width: s.el.offsetWidth, height: s.el.offsetHeight };
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  function startWindowResize(event, s, direction) {
    if (event.button !== 0 || s.maximized) return;
    event.preventDefault();
    event.stopPropagation();
    focusApp(s.app);
    const start = {
      x: event.clientX,
      y: event.clientY,
      left: s.el.offsetLeft,
      top: s.el.offsetTop,
      width: s.el.offsetWidth,
      height: s.el.offsetHeight
    };
    const minWidth = s.config.minWidth;
    const minHeight = s.config.minHeight;
    const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
    document.body.style.cursor = getComputedStyle(event.target).cursor;
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      let left = start.left;
      let top = start.top;
      let width = start.width;
      let height = start.height;
      if (direction.includes('e')) width = clamp(start.width + dx, minWidth, window.innerWidth - start.left - 10);
      if (direction.includes('s')) height = clamp(start.height + dy, minHeight, window.innerHeight - start.top - 10);
      if (direction.includes('w')) {
        width = clamp(start.width - dx, minWidth, start.left + start.width - 10);
        left = start.left + start.width - width;
      }
      if (direction.includes('n')) {
        const maxHeight = start.top + start.height - menubar - 10;
        height = clamp(start.height - dy, minHeight, maxHeight);
        top = start.top + start.height - height;
      }
      s.el.style.left = `${Math.round(left)}px`;
      s.el.style.top = `${Math.round(top)}px`;
      s.el.style.width = `${Math.round(width)}px`;
      s.el.style.height = `${Math.round(height)}px`;
    };
    const up = () => {
      document.body.style.cursor = '';
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      s.lastRect = { left: s.el.offsetLeft, top: s.el.offsetTop, width: s.el.offsetWidth, height: s.el.offsetHeight };
      if (s.app === 'game') gameInstance?.resize?.();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }

  function updateDockRunningState() {
    $$('.dock-item[data-launch]').forEach((item) => {
      const launch = item.dataset.launch;
      const app = LAUNCH_APP[launch];
      const s = windowStates[app];
      const running = Boolean(s && s.isOpen);
      item.classList.toggle('is-open', running);
    });
  }

  function updateMaximizedDockState() {
    const gameState = windowStates.game;
    const immersiveGame = Boolean(gameState && gameState.isOpen && !gameState.isMinimized && !gameState.isClosing && gameState.maximized && activeApp === 'game');
    document.body.classList.toggle('has-maximized-window', immersiveGame);
  }

  function animateDockLaunch(item) {
    if (!item) return;
    item.classList.remove('is-opening');
    void item.offsetWidth;
    item.classList.add('is-opening');
    setTimeout(() => item.classList.remove('is-opening'), 600);
  }

  /* ========================================================================
     Menu bar menus
     ======================================================================== */

  let currentMenu = null;
  let currentMenuAnchor = null;

  function setActiveApp(app) {
    if (!APPS[app]) app = 'finder';
    activeApp = app;
    document.body.dataset.app = app;
    const name = $('#activeAppName');
    if (name) name.textContent = APPS[app].name;
    document.title = `AISniperOS — ${APPS[app].name}`;
    renderMenuBar(app);
    updateMaximizedDockState();
  }

  function buildAppMenus(app) {
    if (app === 'browser') {
      const state = () => browserController?.getState?.() || { tabCount: 0, hasUrl: false, canGoBack: false, canGoForward: false };
      return [
        { key: 'file', label: '文件', items: () => {
          const current = state();
          return [
            { label: '新建标签页', action: () => browserController?.newTab?.() },
            { label: '关闭标签页', disabled: current.tabCount === 0, action: () => browserController?.closeActiveTab?.() },
            { divider: true },
            { label: '在系统浏览器中打开', disabled: !current.hasUrl || current.isInternal, action: () => browserController?.openExternal?.() },
            { divider: true },
            { label: '关闭窗口', action: () => closeApp('browser') }
          ];
        } },
        { key: 'view', label: '显示', items: () => {
          const current = state();
          return [
            { label: '后退', disabled: !current.canGoBack, action: () => browserController?.historyStep?.(-1) },
            { label: '前进', disabled: !current.canGoForward, action: () => browserController?.historyStep?.(1) },
            { label: '重新载入', disabled: !current.hasUrl, action: () => browserController?.reload?.() },
            { label: '主页', action: () => browserController?.goHome?.() }
          ];
        } },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('browser') },
          { label: '缩放', action: () => toggleMaximize('browser') }
        ] }
      ];
    }
    if (app === 'agent') {
      return [
        { key: 'file', label: '文件', items: () => [
          { label: '新建任务', shortcut: '⌘N', action: () => agentController?.newChat?.() },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('agent') }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '拷贝最后一条回复', action: () => agentController?.copyLastReply?.() },
          { label: '清空当前任务', action: () => agentController?.newChat?.() }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '智能体上下文', checked: true, action: () => $('#agentContextBtn')?.click() },
          { label: '聚焦输入框', shortcut: '⌘L', action: () => $('#agentInput')?.focus() }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('agent') },
          { label: '缩放', action: () => toggleMaximize('agent') }
        ] }
      ];
    }
    if (app === 'messages') {
      return [
        { key: 'file', label: '文件', items: () => [
          { label: '新建信息', shortcut: '⌘N', action: () => messagesController?.newMessage?.() },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('messages') }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '搜索对话', shortcut: '⌘F', action: () => $('#messagesSearch')?.focus() },
          { label: '标记全部为已读', action: () => messagesController?.markAllRead?.() }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '置顶对话', checked: true, action: () => messagesController?.focusThreadList?.() }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('messages') },
          { label: '缩放', action: () => toggleMaximize('messages') }
        ] }
      ];
    }
    if (app === 'ops') {
      return [
        { key: 'file', label: '面板', items: () => [
          { label: '刷新状态', shortcut: '⌘R', action: () => opsController?.refresh?.() },
          { label: '打开终端', action: () => openApp('terminal') },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('ops') }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '部署演示环境', action: () => opsController?.deployBaota?.({ open: true }) },
          { label: '管理容器', action: () => opsController?.showView?.('containers') }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '概览', checked: opsController?.getState?.().view === 'overview', action: () => opsController?.showView?.('overview') },
          { label: '网站', checked: opsController?.getState?.().view === 'sites', action: () => opsController?.showView?.('sites') },
          { label: '容器', checked: opsController?.getState?.().view === 'containers', action: () => opsController?.showView?.('containers') }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('ops') },
          { label: '缩放', action: () => toggleMaximize('ops') }
        ] }
      ];
    }
    if (app === 'steam') {
      const page = () => steamController?.getState?.().page || 'store';
      return [
        { key: 'file', label: 'Steam', items: () => [
          { label: '商店首页', action: () => steamController?.navigate?.('store') },
          { label: '游戏库', action: () => steamController?.navigate?.('library') },
          { label: 'Sniper 的个人资料', action: () => steamController?.navigate?.('profile') },
          { divider: true },
          { label: '关闭 Steam', shortcut: '⌘W', action: () => closeApp('steam') }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '商店', checked: page() === 'store', action: () => steamController?.navigate?.('store') },
          { label: '库', checked: page() === 'library', action: () => steamController?.navigate?.('library') },
          { label: 'VR', checked: page() === 'vr', action: () => steamController?.navigate?.('vr') },
          { label: '社区', checked: page() === 'community', action: () => steamController?.navigate?.('community') },
          { label: '下载', checked: page() === 'downloads', action: () => steamController?.navigate?.('downloads') },
          { divider: true },
          { label: '愿望单', checked: page() === 'wishlist', action: () => steamController?.navigate?.('wishlist') }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('steam') },
          { label: '缩放', action: () => toggleMaximize('steam') }
        ] }
      ];
    }
    if (app === 'unity') {
      return [
        { key: 'file', label: '文件', items: () => [
          { label: '保存场景', shortcut: '⌘S', action: () => unityController?.saveScene?.() },
          { label: '运行 / 停止', shortcut: '⌘P', action: () => unityController?.togglePlay?.() },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('unity') }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '创建立方体', action: () => unityController?.addPrimitive?.('cube') },
          { label: '创建球体', action: () => unityController?.addPrimitive?.('sphere') },
          { label: '创建灯光', action: () => unityController?.addPrimitive?.('light') },
          { label: '删除所选对象', action: () => unityController?.deleteSelected?.() }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '恢复到场景视图', action: () => unityController?.resetView?.() },
          { label: '清空 Console', action: () => unityController?.clearConsole?.() }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('unity') },
          { label: '缩放', action: () => toggleMaximize('unity') }
        ] }
      ];
    }
    if (['cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr', 'steamdemo'].includes(app)) {
      return [
        { key: 'file', label: '游戏', items: () => [
          { label: '返回 Steam 库', action: () => { openApp('steam'); setTimeout(() => steamController?.navigate?.('library'), 180); } },
          { label: '查看商店页面', action: () => { openApp('steam'); setTimeout(() => steamController?.openGameDetail?.(app === 'steamdemo' ? (steamController?.getActiveGameId?.() || 'alyx') : app), 180); } },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp(app) }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '重新载入界面', action: () => steamController?.resetSurface?.(app) },
          { label: '最大化', action: () => toggleMaximize(app) }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp(app) },
          { label: '缩放', action: () => toggleMaximize(app) }
        ] }
      ];
    }
    if (app === 'calculator') {
      return [
        { key: 'file', label: '文件', items: () => [
          { label: '新建计算', shortcut: '⌘N', action: () => calcReset() },
          { divider: true },
          { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('calculator') }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '拷贝结果', shortcut: '⌘C', action: copyCalculatorResult },
          { divider: true },
          { label: '清除历史', action: clearCalculatorHistory }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '标准', checked: true, action: () => {} },
          { label: '计算历史', checked: !$('#calcHistory')?.hidden, action: toggleCalculatorHistory }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('calculator') },
          { label: '关闭', shortcut: '⌘W', action: () => closeApp('calculator') }
        ] }
      ];
    }
    if (app === 'settings') {
      return [
        { key: 'file', label: '文件', items: () => [
          { label: '关闭系统设置', shortcut: '⌘W', action: () => closeApp('settings') }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '外观', checked: settingsPanelCurrent === 'appearance', action: () => showSettingsPanel('appearance') },
          { label: '墙纸', checked: settingsPanelCurrent === 'wallpaper', action: () => showSettingsPanel('wallpaper') },
          { label: '桌面与程序坞', checked: settingsPanelCurrent === 'dock', action: () => showSettingsPanel('dock') },
          { label: '通知', checked: settingsPanelCurrent === 'notifications', action: () => showSettingsPanel('notifications') },
          { label: '专注模式', checked: settingsPanelCurrent === 'focus', action: () => showSettingsPanel('focus') },
          { label: '网络', checked: settingsPanelCurrent === 'wifi', action: () => showSettingsPanel('wifi') },
          { label: '用户与账户', checked: settingsPanelCurrent === 'users', action: () => showSettingsPanel('users') },
          { label: '日期与时间', checked: settingsPanelCurrent === 'datetime', action: () => showSettingsPanel('datetime') },
          { label: '隐私与安全', checked: settingsPanelCurrent === 'privacy', action: () => showSettingsPanel('privacy') },
          { divider: true },
          { label: '系统健康度', checked: settingsPanelCurrent === 'health', action: () => showSettingsPanel('health') }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('settings') },
          { label: '缩放', action: () => toggleMaximize('settings') }
        ] }
      ];
    }
    if (app === 'terminal') {
      return [
        { key: 'shell', label: '命令', items: () => [
          { label: '新建终端', shortcut: '⌘N', action: () => { openApp('terminal'); $('#terminalInput')?.focus(); } },
          { divider: true },
          { label: '清空缓冲区', shortcut: '⌘K', action: () => terminalClear() },
          { label: '重置会话', action: () => { terminalResetSession(); } }
        ] },
        { key: 'edit', label: '编辑', items: () => [
          { label: '拷贝最近输出', action: copyLastTerminalOutput },
          { divider: true },
          { label: '全选输出', action: selectTerminalOutput }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: '清空回滚', shortcut: '⌘K', action: () => terminalClear() }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('terminal') },
          { label: '缩放', action: () => toggleMaximize('terminal') }
        ] }
      ];
    }
    if (app === 'game') {
      const gamePlaying = gameInstance?.isPlaying?.() || false;
      return [
        { key: 'game', label: '游戏', items: () => [
          { label: gamePlaying ? '暂停飞行' : '打开任务', shortcut: 'P', action: () => {
            openApp('game');
            if (gameInstance?.isPlaying?.()) gameInstance.pause();
          } },
          { label: '静音', action: () => gameInstance?.toggleMute?.() },
          { divider: true },
          { label: '再次出击', action: () => gameInstance?.restart?.() }
        ] },
        { key: 'view', label: '显示', items: () => [
          { label: windowStates.game?.maximized ? '还原窗口' : '进入全屏', shortcut: '⌃⌘F', action: () => toggleMaximize('game') },
          { label: '关闭', shortcut: '⌘W', action: () => closeApp('game') }
        ] },
        { key: 'window', label: '窗口', items: () => [
          { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('game') },
          { label: '关闭', shortcut: '⌘W', action: () => closeApp('game') }
        ] }
      ];
    }
    /* Finder */
    return [
      { key: 'file', label: '文件', items: () => [
        { label: '新建访达窗口', shortcut: '⌘N', action: () => { openApp('finder'); finderGo('recents'); } },
        { label: '打开', shortcut: '⌘O', disabled: finderSelectedIndex < 0, action: openFinderSelection },
        { label: '快速查看', shortcut: '空格', disabled: finderSelectedIndex < 0, action: openFinderSelection },
        { divider: true },
        { label: '关闭窗口', shortcut: '⌘W', action: () => closeApp('finder') }
      ] },
      { key: 'edit', label: '编辑', items: () => [
        { label: '拷贝名称', shortcut: '⌘C', action: copyFinderSelection },
        { label: '查找…', shortcut: '⌘F', action: () => { openApp('finder'); $('#finderSearch')?.focus(); } }
      ] },
      { key: 'view', label: '显示', items: () => [
        { label: '图标视图', checked: finderViewMode === 'icons', action: () => setFinderView('icons') },
        { label: '列表视图', checked: finderViewMode === 'list', action: () => setFinderView('list') },
        { divider: true },
        { label: '显示桌面小组件', checked: state.widgets, action: () => setState('widgets', !state.widgets, { silent: true }) }
      ] },
      { key: 'go', label: '前往', items: () => [
        { label: '最近使用', shortcut: '⇧⌘F', action: () => { openApp('finder'); finderGo('recents'); } },
        { label: '文稿', shortcut: '⇧⌘O', action: () => { openApp('finder'); finderGo('documents'); } },
        { label: '桌面', shortcut: '⇧⌘D', action: () => { openApp('finder'); finderGo('desktop'); } },
        { label: '下载', shortcut: '⌥⌘L', action: () => { openApp('finder'); finderGo('downloads'); } },
        { divider: true },
        { label: 'AISniper 云盘', action: () => { openApp('finder'); finderGo('drive'); } }
      ] },
      { key: 'window', label: '窗口', items: () => [
        { label: '最小化', shortcut: '⌘M', action: () => minimizeApp('finder') },
        { label: '缩放', action: () => toggleMaximize('finder') }
      ] }
    ];
  }

  function renderMenuBar(app) {
    const menus = buildAppMenus(app);
    const buttons = $$('#menuLinks .menu-item');
    buttons.forEach((button, index) => {
      const menu = menus[index];
      if (!menu) {
        button.hidden = true;
        return;
      }
      button.hidden = false;
      button.textContent = menu.label;
      button.dataset.menu = menu.key;
    });
  }

  function showMenu(anchor, items, position = null) {
    if (gameInstance?.isPlaying?.()) gameInstance.pause();
    closeMenu();
    closeContextMenu();
    closePopover();
    const menu = document.createElement('div');
    menu.className = 'os-dropdown';
    menu.setAttribute('role', 'menu');
    items.forEach((item) => {
      if (item.divider) {
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        menu.appendChild(divider);
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      if (item.disabled) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
      const check = document.createElement('span');
      check.className = 'menu-check';
      if (item.checked) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.width = '12px';
        svg.style.height = '12px';
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#i-check');
        svg.appendChild(use);
        check.appendChild(svg);
      }
      button.appendChild(check);
      const label = document.createElement('span');
      label.textContent = item.label;
      button.appendChild(label);
      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = 'shortcut';
        shortcut.textContent = item.shortcut;
        button.appendChild(shortcut);
      }
      if (!item.disabled) {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          closeMenu();
          if (typeof item.action === 'function') item.action();
        });
      }
      menu.appendChild(button);
    });
    document.body.appendChild(menu);
    let left;
    let top;
    if (position) {
      left = position.x;
      top = position.y;
    } else if (anchor) {
      const rect = anchor.getBoundingClientRect();
      left = rect.left;
      top = rect.bottom + 4;
    } else {
      left = 10;
      top = 40;
    }
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    left = clamp(left, 8, window.innerWidth - width - 8);
    top = clamp(top, 35, window.innerHeight - height - 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.classList.add('is-open');
    currentMenu = menu;
    currentMenuAnchor = anchor;
    if (anchor) anchor.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!currentMenu) return;
    if (currentMenuAnchor) currentMenuAnchor.setAttribute('aria-expanded', 'false');
    currentMenu.remove();
    currentMenu = null;
    currentMenuAnchor = null;
  }

  function showBrandMenu(anchor) {
    if (currentMenuAnchor === anchor) { closeMenu(); return; }
    showMenu(anchor, [
      { label: '关于 AISniperOS', action: () => openApp('settings', { panel: 'about' }) },
      { label: '系统设置…', shortcut: '⌘,', action: () => openApp('settings') },
      { divider: true },
      { label: '进入深空', action: () => openApp('game') },
      { label: '锁定屏幕', shortcut: '⌃⌘Q', action: lockOS },
      { label: '睡眠', action: sleepOS },
      { divider: true },
      { label: '重新启动 AISniperOS…', action: () => { closeMenu(); setTimeout(() => window.location.reload(), 160); } }
    ]);
  }

  function showAppMenu(anchor) {
    if (currentMenuAnchor === anchor) { closeMenu(); return; }
    const name = APPS[activeApp]?.name || '访达';
    const app = activeApp;
    const s = windowStates[app];
    showMenu(anchor, [
      { label: `关于${name}`, action: () => openApp('settings', { panel: 'about' }) },
      { label: '设置…', shortcut: '⌘,', action: () => openApp('settings') },
      { divider: true },
      { label: '最小化', shortcut: '⌘M', disabled: !(s && s.isOpen), action: () => minimizeApp(app) },
      { label: `关闭${name}`, shortcut: '⌘W', disabled: !(s && s.isOpen), action: () => closeApp(app) }
    ]);
  }
  /* ========================================================================
     Finder
     ======================================================================== */

  const fileDoc = (title, meta, paragraphs) => `<div class="quick-doc"><div class="quick-doc-meta">AISNIPER 档案 · ${meta}</div><h4>${title}</h4>${paragraphs.map((p) => `<p>${p}</p>`).join('')}</div>`;

  let finderItemSeq = 0;
  const nextFinderId = () => `fitem-${Date.now().toString(36)}-${++finderItemSeq}`;
  const mkFolder = (name, target, meta) => ({ id: nextFinderId(), name, kind: 'folder', target, meta });
  const mkFile = (name, art, meta, extra = {}) => ({ id: nextFinderId(), name, kind: 'file', art, meta, ...extra });
  const mkApp = (name, app, icon, meta = '应用程序') => ({ id: nextFinderId(), name, kind: 'app', app, icon, meta });

  const finderLocations = {
    recents: {
      title: '最近使用',
      path: 'AISniper 核心 / 最近使用',
      items: [
        mkFolder('项目', 'projects', '文件夹 · 4 个项目'),
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', {
          body: fileDoc('子午线观测笔记', '今天 08:24', [
            '太阳离开后，山脊仍会保留十一分钟的颜色。仪器在雪线处读数为 4,220 开尔文。',
            '将光圈保持在 f/2.8，让蓝调时刻承担大部分工作。信号藏在安静里，而不是光线里。',
            '下一趟：06:42。带上长焦镜头和保温杯。'
          ])
        }),
        mkFile('子午线黄昏.heic', 'ridge', 'HEIC 图片 · 8.4 MB', { art: 'ridge' }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' }),
        mkFolder('Aperture 品牌套件', 'brandkit', '文件夹 · 5 个项目'),
        mkFolder('截图', 'screenshots', '文件夹 · 3 个项目'),
        mkFile('Aperture 界面设计.fig', 'ui', 'Figma 文稿 · 12.6 MB', { art: 'ui' }),
        mkFile('山脊站.png', 'shot', 'PNG 图片 · 3.3 MB', { art: 'shot' }),
        mkFile('信号配色.pdf', 'doc', 'PDF 文档 · 3.1 MB', {
          body: fileDoc('信号配色', 'APERTURE / 色彩', [
            '暖阳琥珀 #F3A35C 承载注意力，雾青 #63D9C4 承载信息。',
            '冷墨 #070A10 是两者之间的沉默。请带着意图使用它，而不是把它当作默认。'
          ])
        }),
        mkFile('山脊延时影片.mov', 'shot', 'QuickTime 影片 · 24 MB', { art: 'shot' }),
        mkFolder('设计归档', 'core', '文件夹 · 6 个项目'),
        mkFile('团队简报.pdf', 'doc', 'PDF 文档 · 1.2 MB', {
          body: fileDoc('团队简报', '子午线 / 共享', [
            '14:00 进行试飞。界面应像一件光学仪器：平静、精确、安静地发光。',
            '保留信号，去掉噪音。'
          ])
        })
      ]
    },
    applications: {
      title: '应用程序',
      path: 'AISniper 核心 / 应用程序',
      items: [
        mkApp('访达', 'finder', 'app-finder'),
        mkApp('浏览器', 'browser', 'app-browser', '应用程序 · 网页浏览'),
        mkApp('信息', 'messages', 'app-messages', '应用程序 · 即时通讯'),
        mkApp('智能体', 'agent', 'app-agent', '应用程序 · 本地 AI'),
        mkApp('计算器', 'calculator', 'app-calculator'),
        mkApp('系统设置', 'settings', 'app-settings'),
        mkApp('终端', 'terminal', 'app-terminal'),
        mkApp('运维台', 'ops', 'app-ops', '应用程序 · 服务器面板'),
        mkApp('Steam', 'steam', 'app-steam', '应用程序 · 游戏平台'),
        mkApp('AISniper Unity', 'unity', 'app-unity', '应用程序 · 场景编辑器'),
        mkApp('深空信号', 'game', 'app-game', '应用程序 · 3D 飞行')
      ]
    },
    desktop: {
      title: '桌面',
      path: 'AISniper 核心 / 桌面',
      items: [
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', { body: fileDoc('子午线观测笔记', '桌面 · 08:24', ['太阳离开后，山脊仍会保留十一分钟的颜色。', '将光圈保持在 f/2.8。信号藏在安静里。']) }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' }),
        mkFolder('项目', 'projects', '文件夹 · 4 个项目')
      ]
    },
    documents: {
      title: '文稿',
      path: 'AISniper 核心 / 文稿',
      items: [
        mkFolder('项目', 'projects', '文件夹 · 4 个项目'),
        mkFolder('与你共享', 'shared', '文件夹 · 2 个项目'),
        mkFolder('运维脚本', 'scripts', '文件夹 · 4 个项目'),
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', { body: fileDoc('子午线观测笔记', '文稿 · 08:24', ['太阳离开后，山脊仍会保留十一分钟的颜色。', '将光圈保持在 f/2.8。']) }),
        mkFile('设计原则.pdf', 'doc', 'PDF 文档 · 1.8 MB', { body: fileDoc('设计原则', 'APERTURE 工作室 · 2026', ['让信号清晰可读，删减到只剩意图。', '玻璃应当揭示，而非遮蔽。动态应当回应触摸。安静也是构图的一部分。']) })
      ]
    },
    downloads: {
      title: '下载',
      path: 'AISniper 核心 / 下载',
      items: [
        mkFile('AISniper-墙纸包.zip', null, 'ZIP 压缩包 · 46 MB', {
          archiveKind: 'zip',
          archiveSize: '46 MB',
          archiveFiles: [
            { name: '子午线-4K.heic', size: '18.6 MB', kind: 'image' },
            { name: '余烬旷野-4K.heic', size: '15.2 MB', kind: 'image' },
            { name: '冰川空气-4K.heic', size: '11.4 MB', kind: 'image' },
            { name: '安装说明.txt', size: '4 KB', kind: 'text', body: fileDoc('安装说明', 'AISNIPER 墙纸包', ['将 HEIC 文件拖入“墙纸”设置即可使用。', '建议保留原始文件，动态墙纸会自动生成预览。']) }
          ]
        }),
        mkFile('深空信号_测试版.dmg', null, '磁盘映像 · 712 MB', {
          archiveKind: 'dmg',
          archiveSize: '712 MB',
          archiveFiles: [
            { name: '深空信号.app', size: '684 MB', kind: 'app', app: 'game', icon: 'app-game' },
            { name: '轨道作战手册.pdf', size: '3.8 MB', kind: 'pdf', body: fileDoc('轨道作战手册', 'VOID SIGNAL / 内部测试', ['使用鼠标驾驶截击机，按住左键发射脉冲。', '护盾耗尽前，保持准星轻盈。深空已经足够黑暗。']) },
            { name: '许可协议.txt', size: '12 KB', kind: 'text', body: fileDoc('许可协议', 'VOID SIGNAL TEST FLIGHT', ['本磁盘映像仅用于 AISniperOS 本地模拟测试。', '所有轨道数据均留在本机。']) },
            { name: '安装快捷方式', size: '4 KB', kind: 'link' }
          ]
        }),
        mkFile('Aperture-字体.zip', null, 'ZIP 压缩包 · 18 MB', {
          archiveKind: 'zip',
          archiveSize: '18 MB',
          archiveFiles: [
            { name: 'Aperture Sans-Regular.otf', size: '6.2 MB', kind: 'font' },
            { name: 'Aperture Sans-Semibold.otf', size: '6.1 MB', kind: 'font' },
            { name: 'Aperture Mono-Regular.otf', size: '5.2 MB', kind: 'font' },
            { name: '字体授权.txt', size: '8 KB', kind: 'text', body: fileDoc('字体授权', 'APERTURE / 字体', ['仅限在 Aperture 品牌与 AISniperOS 界面中使用。', '不得重新分发字体文件。']) }
          ]
        }),
        mkFile('山脊站.png', 'shot', 'PNG 图片 · 3.3 MB', { art: 'shot' })
      ]
    },
    drive: {
      title: 'AISniper 云盘',
      path: 'AISniper 云盘 / 我的文件',
      items: [
        mkFolder('项目', 'projects', '文件夹 · 4 个项目'),
        mkFolder('Aperture 品牌套件', 'brandkit', '文件夹 · 5 个项目'),
        mkFolder('截图', 'screenshots', '文件夹 · 3 个项目'),
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', { body: fileDoc('子午线观测笔记', '来自桌面', ['信号藏在安静里，而不是光线里。']) })
      ]
    },
    shared: {
      title: '共享',
      path: 'AISniper 云盘 / 共享',
      items: [
        mkFile('子午线团队.txt', 'doc', '文本文稿 · 6 KB', { body: fileDoc('子午线团队', '共享 · 2 位协作者', ['09:30 开会。带上联系印样和山脊地平线画面。', 'Aperture 工作室已给出最终选片。']) }),
        mkFile('品牌交接.pdf', 'doc', 'PDF 文档 · 2.4 MB', { body: fileDoc('品牌交接', '共享 · APERTURE 工作室', ['标志、字体、语气，以及精确的琥珀信号色。', '所有资产均已为轨道行动准备就绪。']) })
      ]
    },
    core: {
      title: 'AISniper 核心',
      path: 'AISniper 核心',
      items: [
        mkFolder('应用程序', 'applications', '文件夹 · 6 个项目'),
        mkFolder('文稿', 'documents', '文件夹 · 4 个项目'),
        mkFolder('桌面', 'desktop', '文件夹 · 3 个项目'),
        mkFolder('下载', 'downloads', '文件夹 · 4 个项目'),
        mkFolder('项目', 'projects', '文件夹 · 4 个项目'),
        mkFolder('运维脚本', 'scripts', '文件夹 · 4 个项目'),
        mkFile('说明.md', null, 'Markdown 文稿 · 3 KB', { body: fileDoc('说明', 'AISNIPER 核心 / 根目录', ['专注，凝练。为精确思考而生的浏览器原生环境。', '所有系统正常。所有信号都留在本机。']) })
      ]
    },
    projects: {
      title: '项目',
      path: 'AISniper 核心 / 项目',
      items: [
        mkFolder('Aperture', 'aperture', '文件夹 · 3 个项目'),
        mkFolder('子午线观测站', 'meridianobs', '文件夹 · 3 个项目'),
        mkFolder('深空信号', 'voidsignal', '文件夹 · 4 个项目'),
        mkFile('说明.md', null, 'Markdown 文稿 · 3 KB', { body: fileDoc('项目说明', 'AISNIPER / 项目', ['Aperture — 界面研究。', '子午线观测站 — 视觉识别。', '深空信号 — 三维飞行测试。']) })
      ]
    },
    brandkit: {
      title: 'Aperture 品牌套件',
      path: 'AISniper 核心 / 项目 / 品牌套件',
      items: [
        mkFile('Aperture 标记.svg', 'brand', 'SVG 图片 · 42 KB', { art: 'brand' }),
        mkFile('信号配色.pdf', 'doc', 'PDF 文档 · 3.1 MB', { body: fileDoc('信号配色', '品牌套件 · 色彩', ['暖阳琥珀 #F3A35C 承载注意力。', '雾青 #63D9C4 承载信息。', '冷墨 #070A10 是两者之间的沉默。']) }),
        mkFile('字体笔记.txt', 'doc', '文本文稿 · 5 KB', { body: fileDoc('字体笔记', '品牌套件 · 字体', ['界面使用人文无衬线字体，把编辑式斜体留给真正抵达的时刻。', '收紧标题行距，保持遥测数据舒展。']) }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' }),
        mkFile('字标.svg', 'brand', 'SVG 图片 · 28 KB', { art: 'brand' })
      ]
    },
    screenshots: {
      title: '截图',
      path: 'AISniper 核心 / 截图',
      items: [
        mkFile('山脊站.png', 'shot', 'PNG 图片 · 3.3 MB', { art: 'shot' }),
        mkFile('子午线黄昏.heic', 'ridge', 'HEIC 图片 · 8.4 MB', { art: 'ridge' }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' })
      ]
    },
    aperture: {
      title: 'Aperture',
      path: 'AISniper 核心 / 项目 / Aperture',
      items: [
        mkFile('界面研究.fig', 'ui', 'Figma 文稿 · 12.6 MB', { art: 'ui' }),
        mkFile('设计原则.pdf', 'doc', 'PDF 文档 · 1.8 MB', { body: fileDoc('设计原则', 'APERTURE / 界面', ['玻璃应当揭示，而非遮蔽。', '动态回应触摸。安静也是一种材料。']) }),
        mkFolder('品牌套件', 'brandkit', '文件夹 · 5 个项目')
      ]
    },
    meridianobs: {
      title: '子午线观测站',
      path: 'AISniper 核心 / 项目 / 子午线观测站',
      items: [
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', { body: fileDoc('子午线观测笔记', '观测站 / 现场', ['太阳离开后，山脊仍会保留十一分钟的颜色。', '下一趟：06:42。']) }),
        mkFile('子午线黄昏.heic', 'ridge', 'HEIC 图片 · 8.4 MB', { art: 'ridge' }),
        mkFolder('截图', 'screenshots', '文件夹 · 3 个项目')
      ]
    },
    voidsignal: {
      title: '深空信号',
      path: 'AISniper 核心 / 项目 / 深空信号',
      items: [
        mkFile('飞控笔记.txt', 'doc', '文本文稿 · 6 KB', { body: fileDoc('飞控笔记', '轨道截击', ['让准星保持轻盈。深空已经足够黑暗。', '脉冲驱动应像一次屏息，而不是机枪。']) }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' }),
        mkFile('深空引擎.scene', 'ui', '场景文件 · 34 MB', { art: 'ui' }),
        mkApp('启动深空信号', 'game', 'app-game', '应用程序别名')
      ]
    },
    scripts: {
      title: '运维脚本',
      path: 'AISniper 核心 / 文稿 / 运维脚本',
      items: [
        mkFile('部署宝塔面板.sh', null, 'Shell 脚本 · 2 KB', {
          scriptCommand: 'deploy baota',
          body: fileDoc('部署宝塔面板.sh', '本地运维脚本 · 可执行', ['#!/bin/zsh', '# 创建宝塔面板演示容器', 'deploy baota --port 8888 --operator sniper', 'open ops'])
        }),
        mkFile('启动Nginx容器.sh', null, 'Shell 脚本 · 1 KB', {
          scriptCommand: 'docker run nginx',
          body: fileDoc('启动Nginx容器.sh', '本地运维脚本 · 可执行', ['#!/bin/zsh', 'docker pull nginx:stable', 'docker run nginx --port 8080:80', 'echo "容器已启动"'])
        }),
        mkFile('系统巡检.sh', null, 'Shell 脚本 · 1 KB', {
          scriptCommand: 'status',
          body: fileDoc('系统巡检.sh', '本地运维脚本 · 可执行', ['#!/bin/zsh', 'echo "AISniper 节点巡检"', 'status', 'docker ps'])
        }),
        mkFile('运维说明.txt', 'doc', '文本文稿 · 3 KB', {
          body: fileDoc('运维说明', 'AISniper Cloud / 本地模拟', ['双击任意 .sh 脚本，将自动在终端中执行。', '可以在终端输入 deploy baota 部署完整演示面板，或使用 docker 命令管理容器。', '所有服务均为本地模拟，不会建立真实网络连接。'])
        })
      ]
    },
    trash: {
      title: '废纸篓',
      path: 'AISniper 核心 / 废纸篓',
      items: [
        mkFile('旧墙纸.heic', 'ridge', 'HEIC 图片 · 12.1 MB', { art: 'ridge' }),
        mkFile('废弃片头.mp4', 'shot', 'QuickTime 影片 · 86 MB', { art: 'shot' }),
        mkFile('小行星_lod3.blend', null, 'Blender 场景 · 44 MB')
      ]
    },
    'tag-solar': {
      title: '暖阳',
      path: '标签 / 暖阳',
      items: [
        mkFile('子午线观测笔记.txt', 'doc', '文本文稿 · 8 KB', { body: fileDoc('子午线观测笔记', '标签：暖阳', ['太阳离开后，山脊仍会保留十一分钟的颜色。']) }),
        mkFile('轨道海报.png', 'planet', 'PNG 图片 · 2.1 MB', { art: 'planet' }),
        mkFile('Aperture 标记.svg', 'brand', 'SVG 图片 · 42 KB', { art: 'brand' })
      ]
    },
    'tag-signal': {
      title: '信号',
      path: '标签 / 信号',
      items: [
        mkFile('设计原则.pdf', 'doc', 'PDF 文档 · 1.8 MB', { body: fileDoc('设计原则', '标签：信号', ['玻璃应当揭示，而非遮蔽。']) }),
        mkApp('深空信号', 'game', 'app-game', '应用程序 · 3D 飞行')
      ]
    },
    'tag-iris': {
      title: '鸢尾',
      path: '标签 / 鸢尾',
      items: [
        mkFile('Aperture 界面设计.fig', 'ui', 'Figma 文稿 · 12.6 MB', { art: 'ui' }),
        mkFile('字体笔记.txt', 'doc', '文本文稿 · 5 KB', { body: fileDoc('字体笔记', '标签：鸢尾', ['收紧标题行距，保持遥测数据舒展。']) })
      ]
    }
  };

  let finderCurrent = 'recents';
  let finderHistory = ['recents'];
  let finderHistoryIndex = 0;
  let finderSelectedIndex = -1;
  let finderCurrentItems = [];
  let finderViewMode = 'icons';
  let finderSearchQuery = '';
  let finderSortAscending = true;
  let draggedFinderId = null;
  let finderCustomLocationSeq = 0;
  let pdfViewerState = null;
  let archiveSheetState = null;
  let archiveProgressTimer = null;
  let archiveExtractTimer = null;
  let archiveExtracting = false;

  function finderIsPdf(item) {
    return Boolean(item && item.kind === 'file' && /\.pdf$/i.test(item.name));
  }

  function finderIsArchive(item) {
    return Boolean(item && item.kind !== 'folder' && /\.(zip|dmg|7z|rar|tar\.gz)$/i.test(item.name));
  }

  function finderIsScript(item) {
    return Boolean(item && item.kind === 'file' && (/\.sh$/i.test(item.name) || item.scriptCommand));
  }

  function finderFileIcon(item) {
    if (finderIsArchive(item)) return '#i-archive';
    if (finderIsPdf(item)) return '#i-pdf';
    if (finderIsScript(item)) return '#app-terminal';
    if (/\.(png|heic|jpg|jpeg|svg)$/i.test(item.name)) return '#i-image';
    if (/\.(fig|scene)$/i.test(item.name)) return '#i-app';
    return '#i-file';
  }

  function finderLocationFor(id) {
    for (const [key, location] of Object.entries(finderLocations)) {
      const index = location.items.findIndex((item) => item.id === id);
      if (index >= 0) return { key, location, index, item: location.items[index] };
    }
    return null;
  }

  function updateFinderFolderMetas() {
    Object.values(finderLocations).forEach((location) => {
      location.items.forEach((item) => {
        if (item.kind !== 'folder' || !finderLocations[item.target]) return;
        item.meta = `文件夹 · ${finderLocations[item.target].items.length} 个项目`;
      });
    });
  }

  function finderBaseName(name) {
    return name.replace(/\.[^.]+$/, '');
  }

  function finderArchiveFiles(item) {
    if (Array.isArray(item?.archiveFiles) && item.archiveFiles.length) return item.archiveFiles;
    return [
      { name: `${finderBaseName(item?.name || '归档')} 内容.txt`, size: '4 KB', kind: 'text', body: fileDoc('归档内容', 'AISNIPER 归档', ['此归档中包含一个说明文件。', '真实的压缩包内容不会在模拟环境中被解压。']) }
    ];
  }

  function newFinderVirtualLocation(name, path) {
    finderCustomLocationSeq += 1;
    const key = `virtual-${finderCustomLocationSeq}`;
    finderLocations[key] = { title: name, path, items: [] };
    return key;
  }

  function initFinder() {
    const grid = $('#finderGrid');
    const scroll = $('#finderScroll');
    if (!grid) return;
    updateFinderFolderMetas();
    grid.addEventListener('click', (event) => {
      const item = event.target.closest('.file-item');
      if (!item) {
        finderSelectedIndex = -1;
        updateFinderSelection();
        return;
      }
      finderSelectedIndex = Number(item.dataset.index);
      updateFinderSelection();
    });
    grid.addEventListener('dblclick', (event) => {
      const item = event.target.closest('.file-item');
      if (!item) return;
      finderSelectedIndex = Number(item.dataset.index);
      updateFinderSelection();
      openFinderSelection();
    });
    grid.addEventListener('contextmenu', (event) => {
      const itemEl = event.target.closest('.file-item');
      if (!itemEl) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number(itemEl.dataset.index);
      const item = finderCurrentItems[index];
      if (!item) return;
      finderSelectedIndex = index;
      updateFinderSelection();
      showFinderItemContextMenu(item, event.clientX, event.clientY);
    });
    scroll?.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.file-item')) return;
      event.preventDefault();
      event.stopPropagation();
      finderSelectedIndex = -1;
      updateFinderSelection();
      showFinderBlankContextMenu(event.clientX, event.clientY);
    });
    grid.addEventListener('keydown', (event) => {
      const item = event.target.closest('.file-item');
      if (!item) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        finderSelectedIndex = Number(item.dataset.index);
        updateFinderSelection();
        if (event.key === ' ') previewFinderSelection();
        else openFinderSelection();
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        finderSelectedIndex = Number(item.dataset.index);
        updateFinderSelection();
        trashFinderSelection();
      } else if (event.key === 'F2') {
        event.preventDefault();
        finderSelectedIndex = Number(item.dataset.index);
        updateFinderSelection();
        renameFinderSelection();
      }
    });
    grid.addEventListener('dragstart', (event) => {
      const itemEl = event.target.closest('.file-item');
      if (!itemEl) return;
      const item = finderCurrentItems[Number(itemEl.dataset.index)];
      if (!item) return;
      draggedFinderId = item.id;
      finderSelectedIndex = Number(itemEl.dataset.index);
      updateFinderSelection();
      itemEl.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-aisniper-file', item.id);
        event.dataTransfer.setData('text/plain', item.name);
      }
    });
    grid.addEventListener('dragend', () => {
      draggedFinderId = null;
      $$('.is-dragging', $('#window-finder')).forEach((el) => el.classList.remove('is-dragging'));
      clearFinderDropTargets();
    });
    grid.addEventListener('dragover', (event) => {
      if (!draggedFinderId) return;
      const folderEl = event.target.closest('.file-item.is-folder');
      clearFinderDropTargets();
      if (!folderEl) return;
      const target = finderCurrentItems[Number(folderEl.dataset.index)];
      if (!target || target.id === draggedFinderId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      folderEl.classList.add('is-drop-target');
    });
    grid.addEventListener('dragleave', (event) => {
      if (!event.relatedTarget || !event.relatedTarget.closest?.('.file-item.is-folder')) clearFinderDropTargets();
    });
    grid.addEventListener('drop', (event) => {
      const folderEl = event.target.closest('.file-item.is-folder');
      if (!folderEl) return;
      event.preventDefault();
      event.stopPropagation();
      const target = finderCurrentItems[Number(folderEl.dataset.index)];
      const id = getFinderDragId(event);
      clearFinderDropTargets();
      if (!target || target.kind !== 'folder' || !id) return;
      if (target.id === id) return;
      moveFinderItemToLocation(id, target.target, { targetName: target.name });
    });
    scroll?.addEventListener('click', (event) => {
      if (event.target === scroll || event.target === grid) {
        finderSelectedIndex = -1;
        updateFinderSelection();
      }
    });
    $$('.sidebar-item', $('#window-finder')).forEach((item) => {
      const locationKey = item.dataset.location;
      item.addEventListener('click', () => {
        if (locationKey && finderLocations[locationKey]) {
          finderSearchQuery = '';
          const search = $('#finderSearch');
          if (search) search.value = '';
          finderGo(locationKey);
        }
      });
      item.addEventListener('contextmenu', (event) => {
        if (!locationKey || !finderLocations[locationKey]) return;
        event.preventDefault();
        event.stopPropagation();
        showMenu(null, [
          { label: '打开', action: () => finderGo(locationKey) },
          { label: '在终端中打开', action: () => openFinderInTerminal(locationKey) },
          { divider: true },
          { label: '刷新', action: () => { updateFinderFolderMetas(); renderFinder(); } },
          { label: '显示简介', action: () => showFinderLocationInfo(locationKey) }
        ], { x: event.clientX, y: event.clientY });
      });
      if (!locationKey || locationKey.startsWith('tag-')) return;
      item.addEventListener('dragover', (event) => {
        if (!draggedFinderId || locationKey === finderCurrent) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        clearFinderDropTargets();
        item.classList.add('is-drop-target');
      });
      item.addEventListener('dragleave', (event) => {
        if (!event.relatedTarget || !event.relatedTarget.closest?.('.sidebar-item')) item.classList.remove('is-drop-target');
      });
      item.addEventListener('drop', (event) => {
        event.preventDefault();
        const id = getFinderDragId(event);
        clearFinderDropTargets();
        if (!id) return;
        if (locationKey === 'trash') {
          trashFinderItemById(id);
        } else {
          moveFinderItemToLocation(id, locationKey, { targetName: finderLocations[locationKey]?.title });
        }
      });
    });
    const trashDock = $('.trash-launcher');
    if (trashDock) {
      trashDock.addEventListener('dragover', (event) => {
        if (!draggedFinderId) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        trashDock.classList.add('is-drop-target');
      });
      trashDock.addEventListener('dragleave', () => trashDock.classList.remove('is-drop-target'));
      trashDock.addEventListener('drop', (event) => {
        event.preventDefault();
        trashDock.classList.remove('is-drop-target');
        const id = getFinderDragId(event);
        if (id) trashFinderItemById(id);
      });
    }
    $('#finderBack')?.addEventListener('click', () => finderHistoryStep(-1));
    $('#finderForward')?.addEventListener('click', () => finderHistoryStep(1));
    $('#finderSearch')?.addEventListener('input', (event) => {
      finderSearchQuery = event.target.value.trim();
      finderSelectedIndex = -1;
      renderFinder();
    });
    $('#finderSearch')?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.target.value = '';
        finderSearchQuery = '';
        renderFinder();
        event.target.blur();
      }
    });
    $('#finderSidebarSearch')?.addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      $$('.sidebar-item', $('#window-finder')).forEach((item) => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
      $$('.sidebar-group', $('#window-finder')).forEach((group) => {
        const hasVisible = $$('.sidebar-item', group).some((item) => !item.hidden);
        group.hidden = Boolean(query) && !hasVisible;
      });
    });
    $$('.view-switcher button', $('#window-finder')).forEach((button) => {
      button.addEventListener('click', () => setFinderView(button.dataset.view));
    });
    $('#finderMoreBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (currentMenuAnchor === event.currentTarget) { closeMenu(); return; }
      showMenu(event.currentTarget, [
        { label: '新建文件夹', shortcut: '⇧⌘N', action: () => createFinderFolder() },
        { label: '压缩所选项', disabled: finderSelectedIndex < 0, action: compressFinderSelection },
        { divider: true },
        { label: '图标视图', checked: finderViewMode === 'icons', action: () => setFinderView('icons') },
        { label: '列表视图', checked: finderViewMode === 'list', action: () => setFinderView('list') },
        { divider: true },
        { label: '按名称排序', action: sortFinderItems },
        { label: '刷新', action: () => { updateFinderFolderMetas(); renderFinder(); } },
        { divider: true },
        { label: '在此处打开终端', action: () => { openApp('terminal'); terminalPrint('已在 ~/项目 打开终端。'); } }
      ]);
    });
    $('#quicklookClose')?.addEventListener('click', closeQuicklook);
    $('#pdfClose')?.addEventListener('click', closePdfViewer);
    $('#pdfPrev')?.addEventListener('click', () => setPdfPage(pdfViewerState ? pdfViewerState.page - 1 : 0));
    $('#pdfNext')?.addEventListener('click', () => setPdfPage(pdfViewerState ? pdfViewerState.page + 1 : 0));
    $('#pdfZoomOut')?.addEventListener('click', () => setPdfZoom((pdfViewerState?.zoom || 1) - 0.1));
    $('#pdfZoomIn')?.addEventListener('click', () => setPdfZoom((pdfViewerState?.zoom || 1) + 0.1));
    $('#archiveClose')?.addEventListener('click', closeArchiveSheet);
    $('#archiveCancel')?.addEventListener('click', closeArchiveSheet);
    $('#archiveExtract')?.addEventListener('click', extractCurrentArchive);
    $$('#window-finder [data-window-action]').forEach((button) => {
      button.addEventListener('click', () => {
        closeQuicklook();
        closePdfViewer();
        closeArchiveSheet();
      });
    });
    renderFinder();
  }

  function clearFinderDropTargets() {
    $$('.is-drop-target', $('#window-finder')).forEach((el) => el.classList.remove('is-drop-target'));
    $('.trash-launcher')?.classList.remove('is-drop-target');
  }

  function getFinderDragId(event) {
    if (!event.dataTransfer) return draggedFinderId;
    const raw = event.dataTransfer.getData('application/x-aisniper-file') || event.dataTransfer.getData('text/plain');
    return finderLocationFor(raw) ? raw : (finderLocationFor(draggedFinderId) ? draggedFinderId : null);
  }

  function finderGo(location, options = {}) {
    if (!finderLocations[location]) return;
    if (!options.fromHistory) {
      if (finderHistory[finderHistoryIndex] !== location) {
        finderHistory = finderHistory.slice(0, finderHistoryIndex + 1);
        finderHistory.push(location);
        finderHistoryIndex = finderHistory.length - 1;
      }
    }
    finderCurrent = location;
    finderSelectedIndex = -1;
    finderSearchQuery = '';
    const search = $('#finderSearch');
    if (search) search.value = '';
    closeQuicklook();
    renderFinder();
  }

  function finderHistoryStep(direction) {
    const nextIndex = finderHistoryIndex + direction;
    if (nextIndex < 0 || nextIndex >= finderHistory.length) return;
    finderHistoryIndex = nextIndex;
    finderCurrent = finderHistory[finderHistoryIndex];
    finderSelectedIndex = -1;
    finderSearchQuery = '';
    const search = $('#finderSearch');
    if (search) search.value = '';
    closeQuicklook();
    renderFinder();
  }

  function getFinderItems() {
    const location = finderLocations[finderCurrent];
    if (!location) return [];
    let items = [...location.items];
    if (finderSearchQuery) {
      const query = finderSearchQuery.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query) || item.meta.toLowerCase().includes(query));
    }
    return items;
  }

  function clearFinderSearch() {
    finderSearchQuery = '';
    const search = $('#finderSearch');
    if (search) search.value = '';
  }

  function renderFinder() {
    if (!$('#finderGrid')) return;
    const location = finderLocations[finderCurrent];
    if (!location) return;
    finderCurrentItems = getFinderItems();
    const grid = $('#finderGrid');
    grid.replaceChildren();
    finderCurrentItems.forEach((item, index) => {
      grid.appendChild(createFinderItem(item, index));
    });
    const title = $('#finderTitle');
    if (title) title.textContent = finderSearchQuery ? '搜索' : location.title;
    const path = $('#finderPath');
    if (path) path.textContent = finderSearchQuery ? `${location.path} / 搜索` : location.path;
    const count = finderCurrentItems.length;
    const countLabel = `${count} 个项目`;
    if ($('#finderCount')) $('#finderCount').textContent = countLabel;
    if ($('#finderSelectionInfo')) $('#finderSelectionInfo').textContent = countLabel;
    const empty = $('#finderEmpty');
    if (empty) {
      empty.hidden = count > 0;
      const emptyHeading = $('h2', empty);
      const emptyCopy = $('p', empty);
      const emptyIcon = $('.empty-mark use', empty);
      if (emptyHeading) emptyHeading.textContent = finderSearchQuery ? '没有匹配项' : '这个文件夹是空的';
      if (emptyCopy) emptyCopy.textContent = finderSearchQuery ? '请尝试其他名称或位置。' : '将文件拖到这里，或右键新建文件夹。';
      if (emptyIcon) emptyIcon.setAttribute('href', finderSearchQuery ? '#i-search' : '#i-folder');
    }
    const back = $('#finderBack');
    if (back) back.disabled = finderHistoryIndex <= 0;
    const forward = $('#finderForward');
    if (forward) forward.disabled = finderHistoryIndex >= finderHistory.length - 1;
    $$('.sidebar-item', $('#window-finder')).forEach((item) => {
      item.classList.toggle('is-active', item.dataset.location === finderCurrent);
    });
    setFinderView(finderViewMode, false);
    updateFinderSelection();
  }

  function createFinderItem(item, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'file-item';
    button.dataset.index = String(index);
    button.dataset.id = item.id || '';
    button.draggable = true;
    button.setAttribute('aria-label', `${item.name}，${item.meta}`);
    const thumb = document.createElement('span');
    thumb.className = 'file-thumb';
    if (item.kind === 'folder') {
      button.classList.add('is-folder');
      thumb.classList.add('file-folder');
      const shape = document.createElement('span');
      shape.className = 'folder-shape';
      shape.innerHTML = '<svg class="folder-glyph" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-folder"></use></svg>';
      thumb.appendChild(shape);
    } else if (item.kind === 'app') {
      button.classList.add('is-app');
      const art = document.createElement('span');
      art.className = 'thumb-art appicon';
      art.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#${item.icon || 'app-finder'}"></use></svg>`;
      thumb.appendChild(art);
    } else if (finderIsArchive(item)) {
      button.classList.add('is-archive');
      const isDmg = item.archiveKind === 'dmg' || /\.dmg$/i.test(item.name);
      thumb.classList.add('file-archive');
      thumb.innerHTML = `<span class="archive-tile ${isDmg ? 'is-dmg' : 'is-zip'}"><svg viewBox="0 0 24 24"><use href="#i-archive"></use></svg><b>${isDmg ? 'DMG' : 'ZIP'}</b></span>`;
    } else if (finderIsPdf(item)) {
      button.classList.add('is-pdf');
      thumb.classList.add('file-pdf');
      thumb.innerHTML = '<span class="pdf-tile"><span>AISNIPER</span><b>PDF</b><i></i><i></i><i></i></span>';
    } else if (finderIsScript(item)) {
      button.classList.add('is-script');
      thumb.classList.add('file-script');
      thumb.innerHTML = '<span class="script-tile"><span>#!/bin/zsh</span><b>SH</b></span>';
    } else if (item.art) {
      const art = document.createElement('span');
      art.className = `thumb-art ${item.art}`;
      if (item.art === 'planet') {
        const dot = document.createElement('span');
        dot.className = 'planet-dot';
        art.appendChild(dot);
      }
      thumb.appendChild(art);
    } else {
      thumb.innerHTML = `<svg class="file-type-icon" viewBox="0 0 24 24" aria-hidden="true"><use href="${finderFileIcon(item)}"></use></svg>`;
    }
    const name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = item.name;
    const meta = document.createElement('span');
    meta.className = 'file-meta';
    meta.textContent = item.meta;
    button.append(thumb, name, meta);
    return button;
  }

  function updateFinderSelection() {
    const items = $$('.file-item', $('#finderGrid') || document);
    items.forEach((item) => {
      const selected = Number(item.dataset.index) === finderSelectedIndex;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    const countLabel = `${finderCurrentItems.length} 个项目`;
    const info = $('#finderSelectionInfo');
    if (info) info.textContent = finderSelectedIndex >= 0 ? `已选择 1 / ${countLabel}` : countLabel;
  }

  function selectedFinderItem() {
    return finderSelectedIndex >= 0 ? finderCurrentItems[finderSelectedIndex] : null;
  }

  function openFinderSelection() {
    const item = selectedFinderItem();
    if (item) openFinderItem(item);
  }

  function previewFinderSelection() {
    const item = selectedFinderItem();
    if (!item) return;
    if (item.kind === 'folder') openFinderItem(item);
    else showQuicklook(item);
  }

  function openFinderItem(item) {
    if (!item) return;
    if (item.kind === 'folder' && finderLocations[item.target]) {
      finderGo(item.target);
      return;
    }
    if (item.kind === 'app') {
      openApp(item.app);
      return;
    }
    if (finderIsPdf(item)) {
      openPdfViewer(item);
      return;
    }
    if (finderIsArchive(item)) {
      openArchiveSheet(item);
      return;
    }
    if (finderIsScript(item) && item.scriptCommand) {
      runFinderScript(item);
      return;
    }
    showQuicklook(item);
  }

  function showQuicklook(item) {
    const overlay = $('#quicklook');
    const preview = $('#quicklookPreview');
    if (!overlay || !preview) return;
    if (finderIsPdf(item)) {
      openPdfViewer(item);
      return;
    }
    if (finderIsArchive(item)) {
      openArchiveSheet(item);
      return;
    }
    preview.replaceChildren();
    if (item.art) {
      const art = document.createElement('div');
      art.className = `thumb-art ${item.art}`;
      if (item.art === 'planet') {
        const dot = document.createElement('span');
        dot.className = 'planet-dot';
        art.appendChild(dot);
      }
      preview.appendChild(art);
    } else if (item.kind === 'app') {
      const art = document.createElement('div');
      art.className = 'quick-app-preview';
      art.innerHTML = `<svg viewBox="0 0 64 64"><use href="#${item.icon || 'app-finder'}"></use></svg><span>${item.name}</span>`;
      preview.appendChild(art);
    } else {
      const doc = document.createElement('div');
      doc.className = 'quick-doc';
      doc.innerHTML = `<div class="quick-doc-meta">AISNIPER 预览</div><h4>${escapeHTML(item.name.replace(/\.[^.]+$/, ''))}</h4><p>此文件尚未建立可视化预览。双击原文件，即可用对应的应用打开。</p><p style="opacity:.55;font-size:10px;margin-top:22px">${escapeHTML(item.meta)}</p>`;
      preview.appendChild(doc);
    }
    if (item.body) {
      preview.replaceChildren();
      const body = document.createElement('div');
      body.innerHTML = item.body;
      preview.appendChild(body.firstElementChild);
    }
    const name = $('#quicklookName');
    const meta = $('#quicklookMeta');
    if (name) name.textContent = item.name;
    if (meta) meta.textContent = item.meta;
    overlay.hidden = false;
    closePdfViewer();
    closeArchiveSheet();
  }

  function closeQuicklook() {
    const overlay = $('#quicklook');
    if (overlay) overlay.hidden = true;
  }

  function showFinderItemContextMenu(item, x, y) {
    const inTrash = finderCurrent === 'trash';
    const items = [
      { label: item.kind === 'folder' ? '打开文件夹' : '打开', shortcut: '⌘O', action: () => openFinderItem(item) },
      { label: finderIsPdf(item) ? '在文稿预览中打开' : '快速查看', shortcut: '空格', disabled: item.kind === 'folder', action: () => showQuicklook(item) },
      { divider: true },
      { label: '重命名…', disabled: item.kind === 'app', action: () => renameFinderItem(item) },
      { label: '压缩为 ZIP', disabled: item.kind === 'app' || finderIsArchive(item), action: () => compressFinderItem(item) }
    ];
    if (inTrash && item.trashedFromKey && finderLocations[item.trashedFromKey]) {
      items.push({ label: '放回原处', action: () => restoreFinderItem(item) });
    }
    items.push(
      { divider: true },
      { label: inTrash ? '永久删除' : '移到废纸篓', action: () => trashFinderItem(item, { permanent: inTrash }) },
      { label: '显示简介', action: () => showFinderInfo(item) }
    );
    if (item.kind === 'folder' && finderLocations[item.target]) {
      items.splice(2, 0, { label: '在终端中打开', action: () => openFinderInTerminal(item.target) });
    }
    showMenu(null, items, { x, y });
  }

  function showFinderBlankContextMenu(x, y) {
    showMenu(null, [
      { label: '新建文件夹', shortcut: '⇧⌘N', action: () => createFinderFolder() },
      { label: '刷新', action: () => { updateFinderFolderMetas(); renderFinder(); } },
      { divider: true },
      { label: '按名称排序', action: sortFinderItems },
      { label: '在终端中打开', action: () => openFinderInTerminal(finderCurrent) },
      { divider: true },
      { label: '显示简介', action: () => showFinderLocationInfo() }
    ], { x, y });
  }

  function openFinderInTerminal(locationKey) {
    openApp('terminal');
    const location = finderLocations[locationKey];
    terminalPrint(`已在 ${location?.path || '/Users/sniper'} 打开终端。`, 'term-line term-muted');
  }

  function moveFinderItemToLocation(itemId, targetLocationKey, options = {}) {
    const found = finderLocationFor(itemId);
    const target = finderLocations[targetLocationKey];
    if (!found || !target) return false;
    if (targetLocationKey === 'trash') {
      trashFinderItem(found.item);
      return true;
    }
    if (found.key === targetLocationKey) {
      showToast({ title: '项目已在此位置', message: `${found.item.name} 已经位于${target.title}。`, icon: 'i-folder' });
      return false;
    }
    if (found.item.kind === 'folder' && finderLocations[found.item.target]) {
      const ownPath = finderLocations[found.item.target].path;
      if (target.path === ownPath || target.path.startsWith(`${ownPath}/`)) {
        showToast({ title: '无法移动文件夹', message: '不能将文件夹放入它自身或它的子文件夹中。', icon: 'i-folder' });
        return false;
      }
    }
    found.location.items.splice(found.index, 1);
    target.items.push(found.item);
    finderSelectedIndex = -1;
    draggedFinderId = null;
    updateFinderFolderMetas();
    renderFinder();
    showToast({
      title: `已移到${target.title}`,
      message: `${found.item.name} 已移动到${options.targetName || target.title}。`,
      icon: found.item.kind === 'folder' ? 'i-folder' : 'i-file'
    });
    playInterfaceTone('click');
    return true;
  }

  function trashFinderItemById(itemId) {
    const found = finderLocationFor(itemId);
    if (!found) return;
    trashFinderItem(found.item, { permanent: found.key === 'trash' });
  }

  function trashFinderItem(item, options = {}) {
    const found = finderLocationFor(item.id);
    if (!found) return;
    const permanent = options.permanent === true || found.key === 'trash';
    if (permanent) {
      found.location.items.splice(found.index, 1);
      finderSelectedIndex = -1;
      updateFinderFolderMetas();
      renderFinder();
      showToast({ title: '已永久删除', message: `${item.name} 已从废纸篓中移除。`, icon: 'i-trash' });
      playInterfaceTone('close');
      return;
    }
    if (finderLocations.trash.items.some((entry) => entry.id === item.id)) return;
    found.location.items.splice(found.index, 1);
    item.trashedFrom = finderLocations[found.key]?.title || '访达';
    item.trashedFromKey = found.key;
    finderLocations.trash.items.push(item);
    finderSelectedIndex = -1;
    draggedFinderId = null;
    updateFinderFolderMetas();
    renderFinder();
    showToast({ title: '已移到废纸篓', message: `${item.name} 可以被恢复，或永久删除。`, icon: 'i-trash' });
    playInterfaceTone('close');
  }

  function trashFinderSelection() {
    const item = selectedFinderItem();
    if (item) trashFinderItem(item, { permanent: finderCurrent === 'trash' });
  }

  function restoreFinderItem(item) {
    const found = finderLocationFor(item.id);
    if (!found || found.key !== 'trash') return;
    const target = finderLocations[item.trashedFromKey] || finderLocations.recents;
    found.location.items.splice(found.index, 1);
    target.items.push(item);
    delete item.trashedFrom;
    delete item.trashedFromKey;
    finderSelectedIndex = -1;
    updateFinderFolderMetas();
    renderFinder();
    showToast({ title: '已放回原处', message: `${item.name} 已回到${target.title}。`, icon: 'i-folder' });
    playInterfaceTone('open');
  }

  async function renameFinderItem(item) {
    if (!item || item.kind === 'app') return;
    const nextName = await showOSDialog({
      title: '重命名',
      message: '为项目输入一个新名称。',
      fieldLabel: '名称',
      value: item.name,
      confirmLabel: '重命名',
      icon: 'i-pen'
    });
    if (!nextName || nextName === item.name) return;
    if (nextName.includes('/') || nextName.includes('\\')) {
      showToast({ title: '名称无效', message: '名称中不能包含斜杠。', icon: 'i-info' });
      return;
    }
    item.name = nextName;
    if (item.kind === 'folder' && finderLocations[item.target]) {
      const folderLocation = finderLocations[item.target];
      const oldPath = folderLocation.path;
      const segments = oldPath.split('/');
      segments[segments.length - 1] = nextName;
      const newPath = segments.join('/');
      folderLocation.title = nextName;
      folderLocation.path = newPath;
      if (oldPath && newPath !== oldPath) {
        Object.values(finderLocations).forEach((location) => {
          if (location !== folderLocation && location.path.startsWith(`${oldPath}/`)) {
            location.path = `${newPath}${location.path.slice(oldPath.length)}`;
          }
          location.items.forEach((entry) => {
            if (entry.kind === 'folder' && entry.target === item.target) entry.name = nextName;
          });
        });
      }
      $$('.sidebar-item', $('#window-finder')).forEach((sidebarItem) => {
        if (sidebarItem.dataset.location !== item.target) return;
        const label = $('span:not(.tag-dot)', sidebarItem);
        if (label) label.textContent = nextName;
      });
    }
    updateFinderFolderMetas();
    renderFinder();
    showToast({ title: '已重命名', message: `项目现在名为“${nextName}”。`, icon: 'i-pen' });
    playInterfaceTone('click');
  }

  function renameFinderSelection() {
    const item = selectedFinderItem();
    if (item) renameFinderItem(item);
  }

  function compressFinderItem(item) {
    if (!item || item.kind === 'app' || finderIsArchive(item)) return;
    const source = finderLocationFor(item.id);
    if (!source) return;
    const targetLocation = finderLocations[source.key];
    const base = finderBaseName(item.name);
    let archiveFiles;
    if (item.kind === 'folder' && finderLocations[item.target]) {
      archiveFiles = finderLocations[item.target].items.map((child) => ({
        name: child.name,
        size: child.meta.replace(/^[^·]+·\s*/, '') || '—',
        kind: child.kind === 'folder' ? 'folder' : finderIsPdf(child) ? 'pdf' : 'file',
        body: child.body
      }));
    } else {
      archiveFiles = [{ name: item.name, size: item.meta.replace(/^[^·]+·\s*/, '') || '—', kind: finderIsPdf(item) ? 'pdf' : 'file', body: item.body }];
    }
    if (!archiveFiles.length) {
      archiveFiles = [{ name: '空文件夹说明.txt', size: '1 KB', kind: 'text', body: fileDoc('空文件夹', 'AISNIPER 归档', ['此文件夹为空。']) }];
    }
    const archive = mkFile(`${base}.zip`, null, 'ZIP 压缩包 · 12 MB', {
      archiveKind: 'zip',
      archiveSize: '12 MB',
      archiveFiles
    });
    targetLocation.items.push(archive);
    finderSelectedIndex = -1;
    clearFinderSearch();
    updateFinderFolderMetas();
    renderFinder();
    const index = finderCurrentItems.findIndex((entry) => entry.id === archive.id);
    if (index >= 0) {
      finderSelectedIndex = index;
      updateFinderSelection();
    }
    showToast({ title: '压缩完成', message: `${archive.name} 已创建。双击即可查看解压界面。`, icon: 'i-archive' });
    playInterfaceTone('connect');
  }

  function compressFinderSelection() {
    const item = selectedFinderItem();
    if (item) compressFinderItem(item);
  }

  async function createFinderFolder() {
    const location = finderLocations[finderCurrent];
    if (!location) return;
    const name = await showOSDialog({
      title: '新建文件夹',
      message: `在“${location.title}”中创建一个新文件夹。`,
      fieldLabel: '名称',
      value: '未命名文件夹',
      confirmLabel: '创建',
      icon: 'i-folder'
    });
    if (!name) return;
    if (location.items.some((item) => item.name === name)) {
      showToast({ title: '已存在同名项目', message: '请使用不同的名称。', icon: 'i-info' });
      return;
    }
    const target = newFinderVirtualLocation(name, `${location.path}/${name}`);
    const folder = mkFolder(name, target, '文件夹 · 0 个项目');
    location.items.push(folder);
    finderSelectedIndex = -1;
    clearFinderSearch();
    updateFinderFolderMetas();
    renderFinder();
    const index = finderCurrentItems.findIndex((entry) => entry.id === folder.id);
    if (index >= 0) {
      finderSelectedIndex = index;
      updateFinderSelection();
    }
    showToast({ title: '文件夹已创建', message: `“${name}”已准备就绪。`, icon: 'i-folder' });
    playInterfaceTone('open');
  }

  function showFinderInfo(item) {
    const location = finderLocationFor(item.id);
    const path = location ? finderLocations[location.key].path : 'AISniper 核心';
    const typeLabel = item.kind === 'folder' ? '文件夹' : item.kind === 'app' ? '应用程序' : finderIsPdf(item) ? 'PDF 文稿' : finderIsArchive(item) ? '归档文件' : finderIsScript(item) ? 'Shell 脚本' : '文稿';
    const info = `
      <div class="finder-info-hero">
        <span class="finder-info-icon"><svg viewBox="0 0 24 24"><use href="${item.kind === 'folder' ? '#i-folder' : item.kind === 'app' ? '#i-app' : finderFileIcon(item)}"></use></svg></span>
        <div><b>${escapeHTML(item.name)}</b><span>${escapeHTML(item.meta)}</span></div>
      </div>
      <div class="finder-info-grid">
        <div><span>种类</span><b>${typeLabel}</b></div>
        <div><span>位置</span><b>${escapeHTML(path)}</b></div>
        <div><span>大小</span><b>${escapeHTML(item.meta.split('·').pop().trim())}</b></div>
        <div><span>创建</span><b>今天 08:24</b></div>
        <div><span>修改</span><b>今天 ${formatClockTime(new Date())}</b></div>
        <div><span>锁定</span><b>否</b></div>
      </div>`;
    showOSDialog({
      title: '显示简介',
      message: '',
      input: false,
      info,
      confirmLabel: '完成',
      hideCancel: true,
      icon: item.kind === 'folder' ? 'i-folder' : item.kind === 'app' ? 'i-app' : finderFileIcon(item).replace('#', '')
    });
  }

  function showFinderLocationInfo(locationKey = finderCurrent) {
    const location = finderLocations[locationKey];
    if (!location) return;
    const info = `
      <div class="finder-info-hero">
        <span class="finder-info-icon"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg></span>
        <div><b>${escapeHTML(location.title)}</b><span>${location.items.length} 个项目</span></div>
      </div>
      <div class="finder-info-grid">
        <div><span>位置</span><b>${escapeHTML(location.path)}</b></div>
        <div><span>项目</span><b>${location.items.length} 个</b></div>
        <div><span>只读</span><b>否</b></div>
        <div><span>所有者</span><b>Sniper（管理员）</b></div>
      </div>`;
    showOSDialog({ title: '文件夹简介', input: false, info, confirmLabel: '完成', hideCancel: true, icon: 'i-folder' });
  }

  function runFinderScript(item) {
    if (!item?.scriptCommand) return;
    openApp('terminal');
    terminalIntro();
    setTimeout(() => {
      terminalExecute(item.scriptCommand);
      const input = $('#terminalInput');
      if (input) input.focus();
    }, 180);
    showToast({ title: '正在运行脚本', message: `${item.name} → ${item.scriptCommand}`, icon: 'app-terminal' });
  }

  /* ------------------------------------------------------------------------
     PDF viewer
     ------------------------------------------------------------------------ */

  function buildPdfPages(item) {
    const temp = document.createElement('div');
    temp.innerHTML = item.body || '';
    const paragraphs = $$('p', temp).map((p) => p.textContent.trim()).filter(Boolean);
    const title = $('h4', temp)?.textContent?.trim() || finderBaseName(item.name);
    const kicker = $('.quick-doc-meta', temp)?.textContent?.trim() || `AISNIPER 文稿 · ${item.meta}`;
    const pages = [{ cover: true, title, kicker }];
    const chunks = [];
    const body = paragraphs.length ? paragraphs : ['这份文稿由 AISniperOS 文稿预览打开。所有内容均已在本机解锁。'];
    for (let index = 0; index < body.length; index += 2) {
      chunks.push(body.slice(index, index + 2));
    }
    chunks.forEach((chunk, index) => {
      pages.push({ title, paragraphs: chunk, pageIndex: index + 1, chunkIndex: index });
    });
    return pages;
  }

  function openPdfViewer(item) {
    const overlay = $('#pdfViewer');
    if (!overlay || !item) return;
    closeQuicklook();
    closeArchiveSheet();
    const pages = buildPdfPages(item);
    pdfViewerState = { item, pages, page: 0, zoom: 1 };
    const title = $('#pdfTitle');
    const subtitle = $('#pdfSubtitle');
    const total = $('#pdfPageTotal');
    const footer = $('#pdfFooterMeta');
    if (title) title.textContent = item.name;
    if (subtitle) subtitle.textContent = item.meta;
    if (total) total.textContent = String(pages.length);
    if (footer) footer.textContent = `${item.name} · ${pages.length} 页 · AISniper 文稿预览`;
    renderPdfThumbs();
    overlay.hidden = false;
    setPdfPage(0);
    playInterfaceTone('open');
  }

  function renderPdfThumbs() {
    const container = $('#pdfThumbs');
    if (!container || !pdfViewerState) return;
    container.replaceChildren();
    pdfViewerState.pages.forEach((page, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pdf-thumb${page.cover ? ' is-cover' : ''}${index === pdfViewerState.page ? ' is-active' : ''}`;
      button.dataset.pdfPage = String(index);
      button.setAttribute('aria-label', `第 ${index + 1} 页`);
      button.innerHTML = `<span class="pdf-thumb-sheet"><i></i><i></i><i></i>${page.cover ? '<b>AISNIPER</b>' : ''}</span><small>${index + 1}</small>`;
      button.addEventListener('click', () => setPdfPage(index));
      container.appendChild(button);
    });
  }

  function setPdfPage(index) {
    if (!pdfViewerState) return;
    const total = pdfViewerState.pages.length;
    pdfViewerState.page = clamp(index, 0, Math.max(0, total - 1));
    renderPdfCurrentPage();
  }

  function renderPdfCurrentPage() {
    if (!pdfViewerState) return;
    const { pages, page, item } = pdfViewerState;
    const current = pages[page];
    const pageEl = $('#pdfPage');
    if (!pageEl || !current) return;
    if (current.cover) {
      pageEl.className = 'pdf-page pdf-page-cover';
      pageEl.innerHTML = `
        <div class="pdf-cover-top"><span>AISNIPER</span><span>DOCUMENT · 2026</span></div>
        <div class="pdf-cover-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
        <div class="pdf-cover-copy">
          <span class="pdf-cover-kicker">AISNIPER 档案 · ${escapeHTML(current.kicker.split('·').pop().trim() || '文稿')}</span>
          <h1>${escapeHTML(current.title)}</h1>
          <p>${escapeHTML(item.meta)}</p>
        </div>
        <div class="pdf-cover-bottom"><span>${escapeHTML(item.name)}</span><span>${pages.length} 页</span></div>
      `;
    } else {
      pageEl.className = 'pdf-page pdf-page-content';
      const paragraphs = current.paragraphs.map((text) => `<p>${escapeHTML(text)}</p>`).join('');
      const pageNumber = page + 1;
      pageEl.innerHTML = `
        <header class="pdf-content-head"><span>AISNIPER / 文稿</span><span>${escapeHTML(current.title)}</span></header>
        <div class="pdf-content-title"><span>章节 ${String(current.chunkIndex + 1).padStart(2, '0')}</span><h2>${escapeHTML(current.title)}</h2></div>
        <div class="pdf-content-body">${paragraphs}</div>
        <div class="pdf-content-rule"><i></i><span>PRECISION / SIGNAL / QUIET</span></div>
        <footer class="pdf-content-foot"><span>${escapeHTML(item.name)}</span><span>${pageNumber} / ${pages.length}</span></footer>
      `;
    }
    const currentLabel = $('#pdfPageCurrent');
    const totalLabel = $('#pdfPageTotal');
    if (currentLabel) currentLabel.textContent = String(page + 1);
    if (totalLabel) totalLabel.textContent = String(pages.length);
    const prev = $('#pdfPrev');
    const next = $('#pdfNext');
    if (prev) prev.disabled = page <= 0;
    if (next) next.disabled = page >= pages.length - 1;
    $$('.pdf-thumb', $('#pdfThumbs')).forEach((thumb, index) => {
      thumb.classList.toggle('is-active', index === page);
    });
    applyPdfZoom();
    const stage = $('#pdfStage');
    if (stage) stage.scrollTop = 0;
  }

  function setPdfZoom(value) {
    if (!pdfViewerState) return;
    pdfViewerState.zoom = clamp(Math.round(value * 10) / 10, 0.7, 1.5);
    applyPdfZoom();
  }

  function applyPdfZoom() {
    if (!pdfViewerState) return;
    const pageEl = $('#pdfPage');
    const label = $('#pdfZoomLabel');
    if (pageEl) pageEl.style.setProperty('--pdf-scale', String(pdfViewerState.zoom));
    if (label) label.textContent = `${Math.round(pdfViewerState.zoom * 100)}%`;
  }

  function closePdfViewer() {
    const overlay = $('#pdfViewer');
    if (overlay) overlay.hidden = true;
    pdfViewerState = null;
  }

  function openArchiveSheet(item) {
    const sheet = $('#archiveSheet');
    if (!sheet || !item) return;
    closeQuicklook();
    closePdfViewer();
    const files = finderArchiveFiles(item);
    const isDmg = Boolean(item.archiveKind === 'dmg' || /\.dmg$/i.test(item.name));
    archiveSheetState = {
      item,
      files,
      isDmg,
      destinationKey: finderCurrent,
      destinationPath: finderLocations[finderCurrent]?.path || '/Users/sniper'
    };
    archiveExtracting = false;
    clearArchiveTimers();
    const name = $('#archiveName');
    const meta = $('#archiveMeta');
    const destination = $('#archiveDestination');
    const total = $('#archiveTotal');
    const extractLabel = $('#archiveExtractLabel');
    const progress = $('#archiveProgress');
    const extractButton = $('#archiveExtract');
    if (name) name.textContent = item.name;
    if (meta) meta.textContent = item.meta;
    if (destination) destination.textContent = archiveSheetState.destinationPath;
    if (total) total.textContent = `${files.length} 个文件 · ${item.archiveSize || item.meta.split('·').pop().trim()}`;
    if (extractLabel) extractLabel.textContent = isDmg ? '装载磁盘映像' : '解压全部';
    if (extractButton) {
      extractButton.disabled = false;
      extractButton.querySelector('svg use')?.setAttribute('href', isDmg ? '#i-play' : '#i-download');
    }
    if (progress) progress.hidden = true;
    renderArchiveFileList(files);
    sheet.hidden = false;
    playInterfaceTone('open');
  }

  function renderArchiveFileList(files) {
    const list = $('#archiveFileList');
    if (!list) return;
    list.replaceChildren();
    const formatter = (file) => {
      let icon = '#i-file';
      let label = '文件';
      if (file.kind === 'image') { icon = '#i-image'; label = '图像'; }
      else if (file.kind === 'pdf') { icon = '#i-pdf'; label = 'PDF'; }
      else if (file.kind === 'app') { icon = '#app-game'; label = '应用程序'; }
      else if (file.kind === 'text') { icon = '#i-file'; label = '文本'; }
      else if (file.kind === 'font') { icon = '#i-app'; label = '字体'; }
      else if (file.kind === 'folder') { icon = '#i-folder'; label = '文件夹'; }
      else if (file.kind === 'link') { icon = '#i-app'; label = '替身'; }
      const row = document.createElement('div');
      row.className = 'archive-file-row';
      row.innerHTML = `<span class="archive-file-icon"><svg viewBox="0 0 24 24"><use href="${icon}"></use></svg></span><span class="archive-file-name">${escapeHTML(file.name)}</span><span class="archive-file-kind">${label}</span><span class="archive-file-size">${escapeHTML(file.size || '—')}</span>`;
      list.appendChild(row);
    };
    files.forEach(formatter);
  }

  function extractCurrentArchive() {
    if (!archiveSheetState || archiveExtracting) return;
    archiveExtracting = true;
    const progress = $('#archiveProgress');
    const bar = $('#archiveProgressBar');
    const value = $('#archiveProgressValue');
    const label = $('#archiveProgressLabel');
    const button = $('#archiveExtract');
    const cancel = $('#archiveCancel');
    if (progress) progress.hidden = false;
    if (button) button.disabled = true;
    if (cancel) cancel.disabled = true;
    let percent = 0;
    const phases = [
      [18, '正在校验归档完整性…'],
      [44, '正在写入文件索引…'],
      [72, archiveSheetState.isDmg ? '正在装载磁盘映像…' : '正在展开压缩数据…'],
      [94, '正在创建 Finder 项目…']
    ];
    let phaseIndex = 0;
    if (label) label.textContent = phases[0][1];
    archiveProgressTimer = setInterval(() => {
      percent = Math.min(100, percent + (percent < 70 ? 6 : 3));
      if (bar) bar.style.width = `${percent}%`;
      if (value) value.textContent = `${percent}%`;
      while (phaseIndex < phases.length - 1 && percent >= phases[phaseIndex + 1][0]) {
        phaseIndex += 1;
        if (label) label.textContent = phases[phaseIndex][1];
      }
      if (percent >= 100) {
        clearInterval(archiveProgressTimer);
        archiveProgressTimer = null;
        if (label) label.textContent = '完成';
        archiveExtractTimer = setTimeout(finalizeArchiveExtraction, 340);
      }
    }, 42);
  }

  function finalizeArchiveExtraction() {
    if (!archiveSheetState) return;
    const stateForArchive = archiveSheetState;
    const destination = finderLocations[stateForArchive.destinationKey] || finderLocations[finderCurrent];
    if (!destination) {
      closeArchiveSheet();
      return;
    }
    const base = finderBaseName(stateForArchive.item.name);
    const targetKey = newFinderVirtualLocation(base, `${destination.path}/${base}`);
    const folderItems = [];
    stateForArchive.files.forEach((file) => {
      if (file.kind === 'app') {
        folderItems.push(mkApp(file.name, file.app || 'game', file.icon || 'app-game', '应用程序 · 来自磁盘映像'));
      } else if (file.kind === 'link') {
        folderItems.push(mkApp('安装快捷方式', 'game', 'app-game', '应用程序替身'));
      } else {
        folderItems.push(mkFile(file.name, file.kind === 'image' ? 'ridge' : null, `${file.kind === 'pdf' ? 'PDF 文档' : file.kind === 'font' ? '字体文件' : file.kind === 'text' ? '文本文稿' : '文件'} · ${file.size || '—'}`, {
          body: file.body || null,
          archiveKind: file.kind === 'folder' ? undefined : undefined
        }));
      }
    });
    finderLocations[targetKey].items = folderItems;
    const folder = mkFolder(base, targetKey, `文件夹 · ${folderItems.length} 个项目`);
    destination.items.push(folder);
    updateFinderFolderMetas();
    finderSelectedIndex = -1;
    clearFinderSearch();
    renderFinder();
    const index = finderCurrentItems.findIndex((entry) => entry.id === folder.id);
    if (index >= 0) {
      finderSelectedIndex = index;
      updateFinderSelection();
    }
    closeArchiveSheet();
    showToast({
      title: stateForArchive.isDmg ? '磁盘映像已装载' : '解压完成',
      message: `“${base}”已创建，共 ${folderItems.length} 个项目。`,
      icon: stateForArchive.isDmg ? 'i-download' : 'i-folder'
    });
    playInterfaceTone('connect');
  }

  function clearArchiveTimers() {
    if (archiveProgressTimer) clearInterval(archiveProgressTimer);
    if (archiveExtractTimer) clearTimeout(archiveExtractTimer);
    archiveProgressTimer = null;
    archiveExtractTimer = null;
  }

  function closeArchiveSheet() {
    clearArchiveTimers();
    archiveExtracting = false;
    const sheet = $('#archiveSheet');
    if (sheet) sheet.hidden = true;
    const button = $('#archiveExtract');
    const cancel = $('#archiveCancel');
    if (button) button.disabled = false;
    if (cancel) cancel.disabled = false;
    const progress = $('#archiveProgress');
    if (progress) progress.hidden = true;
    const bar = $('#archiveProgressBar');
    if (bar) bar.style.width = '0%';
    const value = $('#archiveProgressValue');
    if (value) value.textContent = '0%';
    archiveSheetState = null;
  }

  function setFinderView(mode, update = true) {
    if (!['icons', 'list'].includes(mode)) return;
    finderViewMode = mode;
    const win = $('#window-finder');
    if (win) win.classList.toggle('file-list-view', mode === 'list');
    $$('.view-switcher button', $('#window-finder')).forEach((button) => {
      button.classList.toggle('is-active', button.dataset.view === mode);
    });
    if (update) {
      const current = $('#finderScroll');
      if (current) current.scrollTop = 0;
    }
  }

  function sortFinderItems() {
    const location = finderLocations[finderCurrent];
    if (!location) return;
    finderSortAscending = !finderSortAscending;
    location.items.sort((a, b) => {
      const folderA = a.kind === 'folder' ? 0 : 1;
      const folderB = b.kind === 'folder' ? 0 : 1;
      if (folderA !== folderB) return folderA - folderB;
      return a.name.localeCompare(b.name) * (finderSortAscending ? 1 : -1);
    });
    finderSelectedIndex = -1;
    renderFinder();
    showToast({ title: finderSortAscending ? '已按名称升序排列' : '已按名称降序排列', message: '此文件夹的排序已更新。', icon: 'i-list' });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      try {
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  async function copyFinderSelection() {
    const item = selectedFinderItem();
    const text = item ? item.name : finderLocations[finderCurrent]?.path || 'AISniperOS';
    const ok = await copyText(text);
    showToast({ title: ok ? '已拷贝到剪贴板' : '无法拷贝', message: ok ? text : '浏览器阻止了剪贴板访问。', icon: 'i-copy' });
  }

  /* ========================================================================
     System Settings
     ======================================================================== */

  let settingsPanelCurrent = 'appearance';

  function initSettingsApp() {
    const nav = $('#settingsNav');
    if (!nav) return;
    nav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-panel]');
      if (!button) return;
      showSettingsPanel(button.dataset.panel);
    });
    $('#settingsContent')?.addEventListener('click', (event) => {
      const theme = event.target.closest('[data-theme-choice]');
      if (theme) {
        setAppearance(theme.dataset.themeChoice);
        playInterfaceTone('click');
        return;
      }
      const accent = event.target.closest('[data-accent-choice]');
      if (accent) {
        setAccent(accent.dataset.accentChoice);
        playInterfaceTone('click');
        return;
      }
      const wallpaper = event.target.closest('[data-wallpaper-choice]');
      if (wallpaper) {
        setWallpaper(wallpaper.dataset.wallpaperChoice);
        playInterfaceTone('click');
        return;
      }
      const alert = event.target.closest('[data-alert-sound]');
      if (alert) {
        state.alertSound = alert.dataset.alertSound;
        saveSettings();
        applyVisualState();
        playTone(920, 0.18, 'sine', 0.03);
        playTone(690, 0.22, 'sine', 0.02, 0.13);
        return;
      }
      const focus = event.target.closest('[data-focus-mode]');
      if (focus) {
        setFocusMode(focus.dataset.focusMode);
        return;
      }
      const channel = event.target.closest('[data-update-channel]');
      if (channel) {
        state.updateChannel = channel.dataset.updateChannel;
        saveSettings();
        applyVisualState();
        showToast({
          title: channel.dataset.updateChannel === 'beta' ? '已加入天鹰座测试通道' : '已切换到稳定版通道',
          message: channel.dataset.updateChannel === 'beta' ? '将优先获得实验性构建。' : '系统只会接收经过验证的稳定更新。',
          icon: 'i-reload'
        });
        playInterfaceTone('click');
      }
    });
    $('#settingsSearch')?.addEventListener('input', filterSettingsSidebar);
    $('#settingsSearch')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const first = $$('.settings-nav-item').find((item) => !item.hidden);
        if (first) {
          showSettingsPanel(first.dataset.panel);
          event.target.blur();
        }
      }
    });
    bindRange('#dockSizeRange', 'dockSize', (value) => {
      $('#dockSizeValue').textContent = `${value} px`;
    });
    bindRange('#brightnessRange', 'brightness');
    bindRange('#soundVolumeRange', 'soundVolume');
    bindRange('#controlBrightness', 'brightness');
    bindRange('#controlVolume', 'soundVolume');
    $('#volumeTestBtn')?.addEventListener('click', () => {
      playTone(660, 0.16, 'sine', 0.045, 0);
      playTone(990, 0.2, 'sine', 0.025, 0.09);
    });
    $('#runDiagnosticsBtn')?.addEventListener('click', runDiagnostics);
    $('#checkUpdatesBtn')?.addEventListener('click', (event) => checkForUpdates(event.currentTarget));
    $('#checkUpdatesPanelBtn')?.addEventListener('click', (event) => checkForUpdates(event.currentTarget));
    $('#lockNowBtn')?.addEventListener('click', () => lockOS());
    $('#settingsAccountBtn')?.addEventListener('click', () => showSettingsPanel('users'));
    $('#syncTimeBtn')?.addEventListener('click', syncSystemTime);
    $('#wifiSettingsLink')?.addEventListener('click', () => {
      closePopover();
      openApp('settings', { panel: 'wifi' });
    });
    $('#healthSettingsLink')?.addEventListener('click', () => {
      closePopover();
      openApp('settings', { panel: 'health' });
    });
    $('#openSettingsFromControl')?.addEventListener('click', () => {
      closePopover();
      openApp('settings');
    });
    $('#settingsNetworkList')?.addEventListener('click', handleNetworkClick);
    showSettingsPanel('appearance', { silent: true });
  }

  function showSettingsPanel(panel, options = {}) {
    const target = $(`[data-panel-content="${panel}"]`);
    if (!target) return;
    settingsPanelCurrent = panel;
    $$('.settings-panel', $('#settingsContent')).forEach((section) => {
      section.hidden = section !== target;
    });
    $$('.settings-nav-item', $('#settingsNav')).forEach((item) => {
      item.classList.toggle('is-active', item.dataset.panel === panel);
    });
    if (!options.silent) $('#settingsContent').scrollTop = 0;
    if (activeApp === 'settings') renderMenuBar('settings');
  }

  function filterSettingsSidebar(event) {
    const query = event.target.value.trim().toLowerCase();
    const items = $$('.settings-nav-item', $('#settingsNav'));
    items.forEach((item) => {
      const haystack = `${item.textContent} ${item.dataset.settingsKeywords || ''}`.toLowerCase();
      item.hidden = Boolean(query) && !haystack.includes(query);
    });
    const children = $$('#settingsNav > *');
    children.forEach((child) => {
      if (!child.classList.contains('settings-group-label')) return;
      let next = child.nextElementSibling;
      let visible = false;
      while (next && !next.classList.contains('settings-group-label')) {
        if (next.classList.contains('settings-nav-item') && !next.hidden) visible = true;
        next = next.nextElementSibling;
      }
      child.hidden = Boolean(query) && !visible;
    });
    const empty = $('#settingsSearchEmpty');
    if (empty) empty.hidden = !query || items.some((item) => !item.hidden);
  }

  function bindRange(selector, key, onChange) {
    const input = $(selector);
    if (!input) return;
    const sync = () => {
      const value = Number(input.value);
      state[key] = value;
      saveSettings();
      applyVisualState();
      if (onChange) onChange(value);
      if (key === 'soundVolume') {
        window.dispatchEvent(new CustomEvent('aisniper:volumechange', { detail: { volume: value / 100 } }));
        gameInstance?.setVolume?.(value / 100);
      }
    };
    input.addEventListener('input', sync);
  }

  function runDiagnostics() {
    const button = $('#runDiagnosticsBtn');
    if (!button || button.disabled) return;
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = '正在校准核心…';
    setTimeout(() => {
      health.cpu = 17;
      health.memory = 42;
      health.gpu = 11;
      health.temperature = 36;
      health.cpuHistory.push(17);
      health.memoryHistory.push(42);
      syncHealthDisplay();
      button.disabled = false;
      button.innerHTML = original;
      showToast({ title: '诊断完成', message: '所有系统稳定，散热余量正常。', icon: 'i-health' });
      playInterfaceTone('connect');
    }, 950);
  }

  function checkForUpdates(button = null) {
    const target = button || $('#checkUpdatesBtn');
    if (!target || target.disabled) return;
    const original = target.innerHTML;
    target.disabled = true;
    target.textContent = '正在检查…';
    setTimeout(() => {
      target.disabled = false;
      target.innerHTML = original;
      showToast({
        title: 'AISniperOS 已是最新版本',
        message: state.updateChannel === 'beta'
          ? '天鹰座测试通道暂无新构建；当前版本 26.1.4 运行正常。'
          : '版本 26.1.4 · 天鹰座 为当前最新稳定版本。',
        icon: 'i-check'
      });
      playInterfaceTone('connect');
    }, 1250);
  }

  function syncSystemTime() {
    const button = $('#syncTimeBtn');
    if (!button || button.disabled) return;
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = '校准中…';
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = original;
      updateClock();
      showToast({ title: '时间已校准', message: '已与 AISniper 时间服务同步 · 延迟 12 ms。', icon: 'i-clock' });
      playInterfaceTone('connect');
    }, 820);
  }
  /* ========================================================================
     Calculator
     ======================================================================== */

  const calcState = {
    entry: '0',
    accumulator: null,
    operator: null,
    waiting: true,
    expression: '',
    justEvaluated: false,
    error: false
  };
  const calcHistoryItems = [];

  function displayNumber(raw) {
    if (raw === null || raw === undefined) return '0';
    const string = String(raw);
    if (string === '无法计算') return string;
    if (string.includes('e')) return string;
    const negative = string.startsWith('-');
    const unsigned = negative ? string.slice(1) : string;
    const [integer, decimal] = unsigned.split('.');
    const grouped = (integer || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${negative ? '−' : ''}${grouped}${decimal !== undefined ? `.${decimal}` : ''}`;
  }

  function calculatorNumber(raw) {
    if (!isFinite(raw)) return null;
    if (Math.abs(raw) > 999999999999 || (Math.abs(raw) < 0.000000001 && raw !== 0)) return raw.toExponential(6);
    return String(Math.round(raw * 1e12) / 1e12);
  }

  function renderCalculator() {
    const result = $('#calcResult');
    const expression = $('#calcExpression');
    if (!result) return;
    const shown = calcState.error ? '无法计算' : displayNumber(calcState.entry);
    result.textContent = shown;
    result.classList.toggle('is-error', calcState.error);
    const length = shown.length;
    result.style.fontSize = length > 14 ? '30px' : length > 10 ? '39px' : '';
    if (expression) expression.innerHTML = calcState.expression || '&nbsp;';
    renderCalculatorHistory();
  }

  function calculatorClear() {
    calcState.entry = '0';
    calcState.accumulator = null;
    calcState.operator = null;
    calcState.waiting = true;
    calcState.expression = '';
    calcState.justEvaluated = false;
    calcState.error = false;
    renderCalculator();
  }

  function calcReset() {
    calculatorClear();
    playInterfaceTone('click');
  }

  function calculatorInputDigit(digit) {
    if (calcState.error) calculatorClear();
    if (calcState.justEvaluated && calcState.operator === null) {
      calcState.entry = '0';
      calcState.justEvaluated = false;
    }
    if (calcState.justEvaluated) calcState.expression = '';
    if (calcState.waiting) {
      calcState.entry = digit;
      calcState.waiting = false;
    } else {
      const digits = calcState.entry.replace(/[-.]/g, '');
      if (digits.length >= 12) return;
      calcState.entry = calcState.entry === '0' ? digit : calcState.entry + digit;
    }
    calcState.error = false;
    renderCalculator();
  }

  function calculatorDecimal() {
    if (calcState.error) calculatorClear();
    if (calcState.justEvaluated && calcState.operator === null) {
      calcState.entry = '0';
      calcState.justEvaluated = false;
      calcState.waiting = false;
    }
    if (calcState.waiting) {
      calcState.entry = '0.';
      calcState.waiting = false;
      renderCalculator();
      return;
    }
    if (!calcState.entry.includes('.')) {
      calcState.entry += '.';
      renderCalculator();
    }
  }

  function calculatorSign() {
    if (calcState.error || calcState.entry === '0') return;
    calcState.entry = calcState.entry.startsWith('-') ? calcState.entry.slice(1) : `-${calcState.entry}`;
    renderCalculator();
  }

  function calculatorPercent() {
    if (calcState.error) return;
    const value = parseFloat(calcState.entry) || 0;
    const percentValue = calcState.accumulator !== null && (calcState.operator === '+' || calcState.operator === '-')
      ? calcState.accumulator * (value / 100)
      : value / 100;
    calcState.entry = calculatorNumber(percentValue) ?? '0';
    calcState.waiting = false;
    renderCalculator();
  }

  function applyOperator(a, b, operator) {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? null : a / b;
      default: return b;
    }
  }

  function calculatorOperator(operator) {
    if (calcState.error) return;
    const value = parseFloat(calcState.entry) || 0;
    if (calcState.operator !== null && !calcState.waiting) {
      const computed = applyOperator(calcState.accumulator, value, calcState.operator);
      if (computed === null) {
        calcState.error = true;
        calcState.expression = `${displayNumber(calcState.accumulator)} ${operatorSymbol(calcState.operator)} ${displayNumber(calcState.entry)}`;
        renderCalculator();
        return;
      }
      calcState.accumulator = computed;
      calcState.entry = calculatorNumber(computed) ?? '0';
    } else {
      calcState.accumulator = value;
    }
    calcState.operator = operator;
    calcState.waiting = true;
    calcState.justEvaluated = false;
    calcState.expression = `${displayNumber(calcState.accumulator)} ${operatorSymbol(operator)}`;
    renderCalculator();
  }

  function operatorSymbol(operator) {
    return { '+': '+', '-': '−', '*': '×', '/': '÷' }[operator] || operator;
  }

  function calculatorEquals() {
    if (calcState.error || calcState.operator === null) return;
    const first = calcState.accumulator;
    const second = calcState.waiting ? calcState.accumulator : (parseFloat(calcState.entry) || 0);
    const computed = applyOperator(first, second, calcState.operator);
    const expression = `${displayNumber(calculatorNumber(first))} ${operatorSymbol(calcState.operator)} ${displayNumber(calculatorNumber(second))} =`;
    if (computed === null) {
      calcState.error = true;
      calcState.expression = expression;
      calcState.operator = null;
      calcState.accumulator = null;
      calcState.waiting = true;
      renderCalculator();
      return;
    }
    calcState.entry = calculatorNumber(computed) ?? '0';
    calcState.expression = expression;
    calcState.accumulator = null;
    calcState.operator = null;
    calcState.waiting = true;
    calcState.justEvaluated = true;
    calcState.error = false;
    calcHistoryItems.unshift({ expression, result: displayNumber(calcState.entry) });
    if (calcHistoryItems.length > 24) calcHistoryItems.pop();
    renderCalculator();
    playInterfaceTone('click');
  }

  function calculatorBackspace() {
    if (calcState.error) { calculatorClear(); return; }
    if (calcState.waiting || calcState.justEvaluated) return;
    calcState.entry = calcState.entry.length > 1 ? calcState.entry.slice(0, -1) : '0';
    if (calcState.entry === '-' || calcState.entry === '') calcState.entry = '0';
    renderCalculator();
  }

  function handleCalculatorAction(action, value) {
    if (action === 'digit') calculatorInputDigit(value);
    else if (action === 'decimal') calculatorDecimal();
    else if (action === 'clear') calculatorClear();
    else if (action === 'sign') calculatorSign();
    else if (action === 'percent') calculatorPercent();
    else if (action === 'operator') calculatorOperator(value);
    else if (action === 'equals') calculatorEquals();
  }

  function renderCalculatorHistory() {
    const list = $('#calcHistoryList');
    if (!list) return;
    list.replaceChildren();
    if (!calcHistoryItems.length) {
      const empty = document.createElement('p');
      empty.className = 'calc-history-empty';
      empty.textContent = '计算记录将显示在这里。';
      list.appendChild(empty);
      return;
    }
    calcHistoryItems.forEach((item) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'calc-history-row';
      const expression = document.createElement('small');
      expression.textContent = item.expression;
      const result = document.createElement('b');
      result.textContent = item.result;
      row.append(expression, result);
      row.addEventListener('click', () => {
        calcState.entry = item.result.replace(/,/g, '').replace('−', '-');
        calcState.error = false;
        calcState.waiting = false;
        calcState.justEvaluated = false;
        calcState.expression = '';
        renderCalculator();
        toggleCalculatorHistory(false);
      });
      list.appendChild(row);
    });
  }

  function toggleCalculatorHistory(force) {
    const panel = $('#calcHistory');
    const toggle = $('#calcHistoryToggle');
    if (!panel) return;
    const shouldOpen = force === undefined ? panel.hidden : Boolean(force);
    panel.hidden = !shouldOpen;
    toggle?.classList.toggle('is-active', shouldOpen);
    if (shouldOpen) renderCalculatorHistory();
  }

  function clearCalculatorHistory() {
    calcHistoryItems.length = 0;
    renderCalculatorHistory();
    playInterfaceTone('click');
  }

  async function copyCalculatorResult() {
    const value = $('#calcResult')?.textContent || '0';
    const ok = await copyText(value);
    showToast({ title: ok ? '结果已拷贝' : '无法拷贝', message: ok ? value : '浏览器阻止了剪贴板访问。', icon: 'i-copy' });
  }

  function initCalculator() {
    const keys = $('#calcKeys');
    if (!keys) return;
    keys.addEventListener('click', (event) => {
      const key = event.target.closest('[data-calc]');
      if (!key) return;
      handleCalculatorAction(key.dataset.calc, key.dataset.value);
      playInterfaceTone('click');
    });
    $('#calcHistoryToggle')?.addEventListener('click', () => toggleCalculatorHistory());
    $('#clearCalcHistory')?.addEventListener('click', clearCalculatorHistory);
    renderCalculator();
  }

  function isCalculatorTypingContext(event) {
    if (activeApp !== 'calculator' || isLocked) return false;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return false;
    if ($('#spotlightLayer')?.classList.contains('is-open')) return false;
    if (document.body.classList.contains('is-booting') || sleepOpen) return false;
    if (document.querySelector('.popover.is-open, .os-dropdown.is-open, .desktop-context-menu.is-open, .sleep-screen.is-visible')) return false;
    return true;
  }

  document.addEventListener('keydown', (event) => {
    if (!isCalculatorTypingContext(event)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key;
    if (/^[0-9]$/.test(key)) {
      event.preventDefault();
      calculatorInputDigit(key);
    } else if (key === '.' || key === ',') {
      event.preventDefault();
      calculatorDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      event.preventDefault();
      calculatorOperator(key);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      calculatorEquals();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      event.preventDefault();
      calculatorClear();
    } else if (key === '%') {
      event.preventDefault();
      calculatorPercent();
    } else if (key === 'Backspace') {
      event.preventDefault();
      calculatorBackspace();
    }
  });

  /* ========================================================================
     Terminal
     ======================================================================== */

  const TERM_FS = {
    '~': {
      dirs: ['项目', '截图', '文稿', '运维脚本'],
      files: ['子午线笔记.txt', '.zshrc', '说明.md']
    },
    '~/项目': {
      dirs: ['Aperture', '子午线观测站', '深空信号'],
      files: ['笔记.md']
    },
    '~/项目/Aperture': {
      dirs: ['品牌套件'],
      files: ['界面设计.fig', '设计原则.pdf']
    },
    '~/项目/子午线观测站': {
      dirs: ['截图'],
      files: ['现场笔记.txt', '地平线.heic']
    },
    '~/项目/深空信号': {
      dirs: [],
      files: ['飞控笔记.md', '深空引擎.scene']
    },
    '~/截图': {
      dirs: [],
      files: ['山脊站.png', '子午线黄昏.heic', '轨道海报.png']
    },
    '~/文稿': {
      dirs: ['共享'],
      files: ['设计原则.pdf', '说明.md']
    },
    '~/文稿/共享': {
      dirs: [],
      files: ['子午线团队.txt', '品牌交接.pdf']
    },
    '~/运维脚本': {
      dirs: [],
      files: ['部署宝塔面板.sh', '启动Nginx容器.sh', '系统巡检.sh', '运维说明.txt']
    }
  };

  const TERM_COMMANDS = [
    'help', 'ls', 'cd', 'pwd', 'cat', 'open', 'game', 'theme', 'wifi', 'network', 'status',
    'health', 'neofetch', 'whoami', 'date', 'uptime', 'uname', 'echo', 'history',
    'clear', 'about', 'sudo', 'coffee', 'exit', 'reset', 'deploy', 'docker', 'bt', 'panel', 'scripts',
    'steam', 'cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr'
  ];
  const TERM_ALIASES = { '?': 'help', ll: 'ls', dir: 'ls', cls: 'clear', containers: 'docker' };
  const defaultTerminalCwd = '~';
  let terminalCwd = '~';
  let terminalCommandHistory = [];
  let terminalHistoryIndex = 0;
  let terminalReady = false;
  let lastOutputText = '';

  function termPromptPath() {
    return `sniper@aisniper ${terminalCwd}`;
  }

  function updateTerminalPrompt() {
    const prompt = $('#terminalPrompt');
    if (prompt) prompt.textContent = termPromptPath();
  }

  function scrollTerminal() {
    const body = $('#terminalBody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function terminalLine(element) {
    const output = $('#terminalOutput');
    if (!output) return;
    output.appendChild(element);
    scrollTerminal();
  }

  function terminalHTML(html, className = 'term-line') {
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = html;
    terminalLine(el);
    return el;
  }

  function terminalPrint(text, className = 'term-line') {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    terminalLine(el);
    return el;
  }

  function escapeHTML(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, (character) => map[character]);
  }

  function terminalEcho(command) {
    const el = document.createElement('div');
    el.className = 'term-line term-command';
    const prompt = document.createElement('span');
    prompt.className = 'term-prompt-inline';
    prompt.textContent = termPromptPath();
    const symbol = document.createElement('span');
    symbol.className = 'term-symbol';
    symbol.textContent = '%';
    el.append(prompt, symbol, document.createTextNode(command));
    terminalLine(el);
  }

  function terminalIntro(force = false) {
    if (terminalReady && !force) return;
    terminalReady = true;
    const output = $('#terminalOutput');
    if (!output) return;
    if (force) output.replaceChildren();
    const now = new Date();
    const stamp = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    terminalHTML('<span class="term-signal">AISniperOS 26.1.4</span> <span class="term-muted">（天鹰座）· 安全终端</span>');
    terminalPrint(`上次登录：${stamp} · ttys001`, 'term-line term-muted');
    terminalHTML('输入 <span class="term-key">help</span> 查看命令，输入 <span class="term-key">neofetch</span> 查看系统卡片，也可直接打开应用。');
    terminalHTML('<div class="term-rule">快速开始</div>');
    const hints = document.createElement('div');
    hints.className = 'term-hint-row';
    [['帮助', 'help'], ['文件列表', 'ls'], ['部署宝塔', 'deploy baota'], ['容器列表', 'docker ps'], ['打开 Steam', 'steam'], ['系统巡检', 'status']].forEach(([label, command]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'term-chip';
      chip.dataset.command = command;
      chip.textContent = label;
      hints.appendChild(chip);
    });
    terminalLine(hints);
    updateTerminalPrompt();
    scrollTerminal();
  }

  function terminalClear() {
    const output = $('#terminalOutput');
    if (output) output.replaceChildren();
    lastOutputText = '';
    scrollTerminal();
  }

  function terminalResetSession() {
    terminalCwd = defaultTerminalCwd;
    terminalCommandHistory = [];
    terminalHistoryIndex = 0;
    terminalReady = false;
    terminalIntro(true);
    updateTerminalPrompt();
    $('#terminalInput')?.focus();
  }

  function terminalResolvePath(input) {
    if (!input || input === '.') return terminalCwd;
    if (input === '~') return '~';
    if (input === '..') {
      if (terminalCwd === '~') return '~';
      const parts = terminalCwd.split('/');
      parts.pop();
      return parts.length ? parts.join('/') : '~';
    }
    if (input.startsWith('~/')) return input.replace(/\/+$/, '');
    if (input.startsWith('~')) return `~/${input.slice(1).replace(/^\/+/, '')}`;
    const base = terminalCwd === '~' ? '~' : terminalCwd;
    return `${base}/${input}`.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  function terminalCommandHelp() {
    terminalHTML('<div class="term-rule">系统与导航</div>');
    const rows = [
      ['help', '显示命令索引'],
      ['ls [路径]', '列出当前目录中的文件'],
      ['cd <路径>', '浏览 AISniper 文件树'],
      ['pwd', '显示当前工作目录'],
      ['cat <文件>', '在终端中显示文件内容'],
      ['open <应用>', '打开访达、浏览器、信息、智能体、设置、终端、运维台或游戏'],
      ['game', '启动《深空信号》'],
      ['deploy baota', '部署宝塔面板演示环境'],
      ['docker <ps|run|stop|rm>', '管理模拟 Docker 容器'],
      ['bt', '显示宝塔面板地址与凭证'],
      ['panel', '打开运维台'],
      ['scripts', '列出本地运维脚本'],
      ['./脚本.sh', '执行“运维脚本”文件夹中的脚本'],
      ['theme <模式>', '设置浅色、深色或自动外观'],
      ['network', '显示有线网络与 Wi-Fi 状态'],
      ['wifi <on|off>', '控制可选的无线网络连接'],
      ['status', '显示实时系统遥测'],
      ['neofetch', '显示系统身份卡片'],
      ['clear', '清空终端缓冲区'],
      ['reset', '重新开始一个终端会话'],
      ['exit', '关闭此终端']
    ];
    rows.forEach(([command, description]) => {
      terminalHTML(`<span class="term-help-command">${escapeHTML(command)}</span><span class="term-help-desc">${escapeHTML(description)}</span>`, 'term-help-row');
    });
  }

  function terminalCommandNeofetch() {
    const ascii = [
      '        .        ',
      '     .  ◉  .     ',
      '        │        ',
      '  ─── ( AISNIPER ) ───',
      '        │        ',
      '     .  ◉  .     ',
      '        .        '
    ].join('\n');
    const html = `<div class="term-neofetch"><div class="term-ascii">${escapeHTML(ascii).replace('AISNIPER', '<span class="accent-text">AISNIPER</span>')}</div><div class="term-neofetch-info"><div><b>系统</b>AISniperOS 26.1.4 天鹰座</div><div><b>主机</b>AISniper M1 · 神经核心</div><div><b>用户</b>sniper · 管理员</div><div><b>终端</b>zsh 1.0</div><div><b>显示</b>液态视网膜 · 3024 × 1964</div><div><b>主题</b>${({ light: '浅色', dark: '深色' })[resolvedTheme()]} / ${({ solar: '暖阳', signal: '信号', iris: '鸢尾', ember: '余烬' })[state.accent]}</div><div><b>内存</b>${Math.round(health.memory)}% / 24 GB</div><div><b>运行时间</b>${$('#settingsUptime')?.textContent || '00:00:00'}</div><div><b>网络</b><span class="term-success">● 以太网 1 Gbps</span> <span class="term-muted">/ Wi-Fi ${state.wifi ? '开启' : '关闭'}</span></div><div><b>服务</b>${opsController?.getState?.().deployed ? '<span class="term-success">宝塔面板在线</span>' : '<span class="term-muted">本地运维未部署</span>'}</div></div></div>`;
    terminalHTML(html);
  }

  function terminalCommandStatus() {
    terminalHTML(`<div class="term-rule">系统遥测</div><div class="term-telemetry"><div><span>CPU</span><b>${Math.round(health.cpu)}%</b><i><em style="width:${Math.round(health.cpu)}%"></em></i></div><div><span>内存</span><b>${Math.round(health.memory)}%</b><i><em style="width:${Math.round(health.memory)}%"></em></i></div><div><span>GPU</span><b>${Math.round(health.gpu)}%</b><i><em style="width:${Math.round(health.gpu)}%"></em></i></div><div><span>健康度</span><b class="term-success">${health.score} · 优秀</b></div><div><span>网络</span><b>以太网 · 1000 Mbps · DHCP</b></div><div><span>无线</span><b>${state.wifi ? `${escapeHTML(state.wifiNetwork)} · WPA3` : '可选 · 已关闭'}</b></div></div>`);
  }

  function terminalCommandLs(argument) {
    const path = terminalResolvePath(argument);
    const entry = TERM_FS[path];
    if (!entry) {
      terminalHTML(`<span class="term-error">ls：目录不存在：${escapeHTML(path)}</span>`);
      return;
    }
    const parts = [];
    entry.dirs.forEach((dir) => parts.push(`<button class="term-dir" data-command="cd ${escapeHTML(dir)}">${escapeHTML(dir)}/</button>`));
    entry.files.forEach((file) => parts.push(`<span class="term-file">${escapeHTML(file)}</span>`));
    terminalHTML(`<div class="term-ls-grid">${parts.join('')}</div>`);
    lastOutputText = [...entry.dirs.map((dir) => `${dir}/`), ...entry.files].join('  ');
  }

  function terminalCommandCd(argument) {
    const path = terminalResolvePath(argument || '~');
    if (!TERM_FS[path]) {
      terminalHTML(`<span class="term-error">cd：目录不存在：${escapeHTML(path)}</span>`);
      return;
    }
    terminalCwd = path;
    updateTerminalPrompt();
  }

  function terminalCommandCat(argument) {
    if (!argument) {
      terminalHTML('<span class="term-warn">用法：cat &lt;文件&gt;</span>');
      return;
    }
    const path = terminalResolvePath(argument);
    const dir = path.slice(0, path.lastIndexOf('/')) || '~';
    const file = path.split('/').pop();
    const entry = TERM_FS[dir];
    if (!entry || !entry.files.includes(file)) {
      terminalHTML(`<span class="term-error">cat：文件不存在：${escapeHTML(argument)}</span>`);
      return;
    }
    const text = {
      '子午线笔记.txt': '太阳离开后，山脊仍会保留十一分钟的颜色。\n将光圈保持在 f/2.8。信号藏在安静里，而不是光线里。',
      '.zshrc': '# AISniperOS 终端\nexport AISNIPER_MODE=precision\nalias focus="open game"',
      '说明.md': '# AISniperOS\n\n专注，凝练。\n为精确思考而生的浏览器原生环境。',
      '笔记.md': '# 项目\n\nAperture — 界面研究。\n子午线观测站 — 视觉识别。\n深空信号 — 三维飞行测试。',
      '现场笔记.txt': '下一趟：06:42。带上长焦镜头和保温杯。',
      '飞控笔记.md': '让准星保持轻盈。深空已经足够黑暗。',
      '子午线团队.txt': '09:30 开会。带上联系印样和山脊地平线画面。',
      '部署宝塔面板.sh': '#!/bin/zsh\n# 创建宝塔面板演示容器\ndeploy baota --port 8888 --operator sniper\nopen ops',
      '启动Nginx容器.sh': '#!/bin/zsh\ndocker run nginx --port 8080:80\necho "容器已启动"',
      '系统巡检.sh': '#!/bin/zsh\necho "AISniper 节点巡检"\nstatus\ndocker ps',
      '运维说明.txt': '双击任意 .sh 脚本即可在终端中执行。\n终端命令：deploy baota、docker ps、bt、panel。'
    }[file] || `AISniper 档案条目：${file}`;
    terminalHTML(`<pre class="term-cat">${escapeHTML(text)}</pre>`);
    lastOutputText = text;
  }

  function terminalCommandOpen(argument) {
    if (!argument) {
      terminalHTML('<span class="term-muted">用法：</span>open <span class="term-key">finder | browser | messages | agent | calculator | settings | terminal | ops | steam | unity | game</span>');
      return;
    }
    const aliases = { '访达': 'finder', '浏览器': 'browser', '计算器': 'calculator', '系统设置': 'settings', '终端': 'terminal', '深空信号': 'game', '游戏': 'game', '设置': 'settings', '信息': 'messages', '消息': 'messages', '智能体': 'agent', 'AI': 'agent', 'ai': 'agent', '运维台': 'ops', '面板': 'ops', '宝塔': 'ops', 'Steam': 'steam', 'steam': 'steam', '反恐精英': 'cs2', 'CS2': 'cs2', 'cs2': 'cs2', 'VR聊天': 'vrchat', 'VRChat': 'vrchat', 'vrchat': 'vrchat', 'SteamVR': 'steamvr', 'OVR': 'ovrtk', 'OVR Toolkit': 'ovrtk', 'ovr': 'ovrtk', '史莱姆': 'slimevr', 'SlimeVR': 'slimevr', 'slimevr': 'slimevr', 'Unity': 'unity', 'unity': 'unity', '编辑器': 'unity' };
    const target = aliases[argument] || argument.toLowerCase();
    if (target === 'game' || target === 'void' || target === 'void signal') {
      openApp('game');
      terminalHTML('<span class="term-success">正在打开《深空信号》轨道界面…</span>');
      return;
    }
    if (['finder', 'browser', 'messages', 'agent', 'calculator', 'settings', 'terminal', 'ops', 'steam', 'unity', 'cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr'].includes(target)) {
      openApp(target);
      terminalHTML(`<span class="term-success">正在打开${escapeHTML(APPS[target].name)}…</span>`);
      return;
    }
    terminalHTML(`<span class="term-error">open：未找到应用“${escapeHTML(argument)}”</span>`);
  }

  function terminalCommandTheme(argument) {
    if (!argument) {
      terminalHTML(`当前外观：<span class="term-accent">${({ light: '浅色', dark: '深色', auto: '自动' })[state.appearance]}</span> <span class="term-muted">（实际：${({ light: '浅色', dark: '深色' })[resolvedTheme()]}）</span>`);
      return;
    }
    const modeAliases = { '浅色': 'light', '深色': 'dark', '自动': 'auto' };
    const mode = modeAliases[argument] || argument;
    if (!['light', 'dark', 'auto'].includes(mode)) {
      terminalHTML('<span class="term-error">theme：请使用 light / dark / auto（或 浅色 / 深色 / 自动）</span>');
      return;
    }
    setAppearance(mode);
    terminalHTML(`<span class="term-success">外观已设为${({ light: '浅色', dark: '深色', auto: '自动' })[mode]}。</span>`);
  }

  function terminalCommandWifi(argument) {
    if (!argument || argument === 'status') {
      terminalHTML(`Wi-Fi：<span class="${state.wifi ? 'term-success' : 'term-error'}">${state.wifi ? '已开启' : '已关闭'}</span>${state.wifi ? ` · ${escapeHTML(state.wifiNetwork)} · WPA3` : ''} <span class="term-muted">/ 有线网络：</span><span class="term-success">在线 · 1000 Mbps</span>`);
      return;
    }
    const wifiAliases = { '开启': 'on', '打开': 'on', '关闭': 'off', '关': 'off' };
    const action = wifiAliases[argument] || argument;
    if (action === 'on' || action === 'off') {
      setWifi(action === 'on', { silent: true });
      terminalHTML(`<span class="term-success">无线网络已${action === 'on' ? '开启' : '关闭'}。</span> <span class="term-muted">有线网络保持在线。</span>`);
      return;
    }
    terminalHTML('<span class="term-error">wifi：请使用 on / off / status（或 开启 / 关闭）</span>');
  }

  function terminalCommandNetwork() {
    terminalHTML(`<div class="term-rule">网络状态</div><div class="term-network-card">
      <div class="term-network-primary"><span class="term-network-icon">ETH</span><div><b>以太网</b><span>已连接 · 全双工 · DHCP</span></div><em>1000 Mbps</em></div>
      <div class="term-network-grid"><div><span>IP 地址</span><b>192.168.1.24</b></div><div><span>路由器</span><b>子午线网关</b></div><div><span>DNS</span><b>1.1.1.1 · 8.8.8.8</b></div><div><span>延迟</span><b>0.8 ms</b></div></div>
      <div class="term-network-secondary"><span>Wi-Fi（可选）</span><b class="${state.wifi ? 'term-success' : 'term-muted'}">${state.wifi ? `${escapeHTML(state.wifiNetwork)} · WPA3` : '已关闭 · 不影响有线连接'}</b></div>
    </div>`);
    lastOutputText = '以太网 192.168.1.24 · 1000 Mbps · DHCP；Wi-Fi ' + (state.wifi ? state.wifiNetwork : '关闭');
  }

  const BAOTA_INFO = {
    url: 'http://panel.aisniper.local:8888',
    user: 'sniper',
    password: 'Sniper@2026'
  };

  function terminalDeploySteps() {
    const steps = [
      ['INFO', '正在连接 Meridian-01 · 10.0.4.18'],
      ['PULL', '正在拉取镜像 aapanel/baota:9.2.0'],
      ['OK', '镜像签名校验通过 · sha256:7a1f…c94e'],
      ['INFO', '正在创建容器 baota_panel'],
      ['OK', '端口映射 0.0.0.0:8888 -> 8888'],
      ['INFO', '写入 Nginx、MySQL 与 PHP 运行配置'],
      ['OK', '宝塔面板已部署 · 服务已注册为开机启动'],
      ['READY', `访问地址 ${BAOTA_INFO.url}`]
    ];
    return steps;
  }

  function terminalCommandDeploy(argument = 'baota') {
    const target = argument.trim().toLowerCase() || 'baota';
    if (!['baota', '宝塔', 'panel', 'ops', '运维台'].includes(target)) {
      terminalHTML('<span class="term-error">deploy：未知部署目标。试试 deploy baota</span>');
      return;
    }
    const existing = opsController?.getState?.();
    if (existing?.deployed) {
      terminalHTML('<span class="term-warn">宝塔面板已在运行。正在打开运维台…</span>');
      openApp('ops');
      return;
    }
    if (!opsController) {
      terminalHTML('<span class="term-error">deploy：运维模块尚未加载。</span>');
      return;
    }
    terminalHTML('<div class="term-rule">DEPLOY / BAOTA PANEL</div>');
    const steps = terminalDeploySteps();
    let index = 0;
    const runStep = () => {
      if (index >= steps.length) {
        const result = opsController.deployBaota({ open: false });
        if (result) {
          terminalHTML(`<span class="term-success">部署完成。</span> <span class="term-muted">账户：</span><span class="term-key">${BAOTA_INFO.user}</span> <span class="term-muted">密码：</span><span class="term-key">${escapeHTML(BAOTA_INFO.password)}</span>`);
          terminalHTML(`<span class="term-muted">输入</span> <button class="term-chip" data-command="open ops">open ops</button> <span class="term-muted">或</span> <button class="term-chip" data-command="docker ps">docker ps</button> <span class="term-muted">继续。</span>`);
          lastOutputText = `宝塔面板已部署：${BAOTA_INFO.url} 账户 ${BAOTA_INFO.user} 密码 ${BAOTA_INFO.password}`;
          setTimeout(() => {
            openApp('ops');
            showToast({ title: '宝塔面板已部署', message: 'Meridian-01 已上线，运维台正在打开。', icon: 'app-ops' });
          }, 280);
        } else {
          terminalHTML('<span class="term-error">部署失败：容器运行时未响应。</span>');
        }
        return;
      }
      const [level, text] = steps[index];
      const levelClass = level === 'OK' || level === 'READY' ? 'term-success' : level === 'PULL' ? 'term-accent' : 'term-muted';
      terminalHTML(`<span class="${levelClass}">[${level}]</span> ${escapeHTML(text)}`);
      index += 1;
      setTimeout(runStep, 150 + Math.random() * 170);
    };
    runStep();
  }

  function terminalCommandBt() {
    const stateNow = opsController?.getState?.();
    terminalHTML(`<div class="term-rule">宝塔 Linux 面板</div><div class="term-bt-card"><div><span>状态</span><b class="${stateNow?.deployed ? 'term-success' : 'term-warn'}">${stateNow?.deployed ? '运行中' : '未部署'}</b></div><div><span>地址</span><b>${BAOTA_INFO.url}</b></div><div><span>账户</span><b>${BAOTA_INFO.user}</b></div><div><span>密码</span><b>${BAOTA_INFO.password}</b></div><div><span>节点</span><b>Meridian-01 · 10.0.4.18</b></div></div>`);
    if (!stateNow?.deployed) {
      terminalHTML('<span class="term-muted">尚未部署。运行</span> <button class="term-chip" data-command="deploy baota">deploy baota</button> <span class="term-muted">开始。</span>');
    } else {
      terminalHTML('<button class="term-chip" data-command="open ops">打开运维台</button> <button class="term-chip" data-command="docker ps">查看容器</button>');
    }
  }

  function formatContainerRow(container) {
    return `<div class="term-docker-row"><span class="term-docker-server">${container.status === 'running' ? '<i class="is-online"></i>' : '<i></i>'}${escapeHTML(container.id)}</span><span>${escapeHTML(container.image)}</span><span>${escapeHTML(container.ports || '—')}</span><span class="${container.status === 'running' ? 'term-success' : 'term-muted'}">${container.status === 'running' ? 'Up ' + escapeHTML(container.uptime) : 'Exited'}</span></div>`;
  }

  function terminalCommandDocker(argument = '') {
    const tokens = argument.split(/\s+/).filter(Boolean);
    const sub = tokens.shift() || 'ps';
    let opsState = opsController?.getState?.();
    if (!opsState?.deployed && (sub === 'run' || sub === 'ps' || sub === 'images')) {
      if (sub === 'run') {
        terminalPrint('Docker 守护进程尚未运行，正在启动本地演示环境…', 'term-line term-muted');
        opsController?.ensureEnvironment?.();
        opsState = opsController?.getState?.();
      }
    }
    if (sub === 'ps') {
      const showAll = tokens.includes('-a') || tokens.includes('--all');
      const containers = (opsState?.containers || []).filter((container) => showAll || container.status === 'running');
      terminalHTML('<div class="term-docker-table"><div class="term-docker-row is-head"><span>CONTAINER ID</span><span>IMAGE</span><span>PORTS</span><span>STATUS</span></div>' + (containers.length ? containers.map(formatContainerRow).join('') : `<div class="term-docker-empty">${opsState?.deployed ? '没有正在运行的容器。' : 'Docker 守护进程未运行。'}</div>`) + '</div>');
      lastOutputText = containers.map((c) => `${c.id} ${c.image} ${c.ports} ${c.status}`).join('\n');
      return;
    }
    if (sub === 'images') {
      const images = opsController?.getImages?.() || [
        { repository: 'aapanel/baota', tag: '9.2.0', size: '1.12 GB' },
        { repository: 'nginx', tag: 'stable', size: '192 MB' },
        { repository: 'redis', tag: 'alpine', size: '41 MB' },
        { repository: 'mysql', tag: '8.4', size: '612 MB' }
      ];
      terminalHTML('<div class="term-docker-table"><div class="term-docker-row is-head"><span>REPOSITORY</span><span>TAG</span><span>SIZE</span><span>STATE</span></div>' + images.map((image) => `<div class="term-docker-row"><span>${escapeHTML(image.repository)}</span><span>${escapeHTML(image.tag)}</span><span>${escapeHTML(image.size)}</span><span class="term-success">已缓存</span></div>`).join('') + '</div>');
      return;
    }
    if (sub === 'run') {
      let image = 'nginx:stable';
      let port = '';
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token === '--port' || token === '-p') { port = tokens[index + 1] || ''; index += 1; }
        else if (!token.startsWith('-')) image = token;
      }
      if (!opsController) {
        terminalHTML('<span class="term-error">docker：容器运行时不可用。</span>');
        return;
      }
      const container = opsController.runContainer(image, { port, fromTerminal: true });
      if (!container) {
        terminalHTML('<span class="term-error">docker：无法启动容器。</span>');
        return;
      }
      terminalHTML(`<span class="term-success">已启动容器</span> <span class="term-key">${escapeHTML(container.name)}</span> <span class="term-muted">(${escapeHTML(container.image)})</span>`);
      terminalHTML(`<span class="term-muted">容器 ID：</span>${escapeHTML(container.id)} <span class="term-muted">端口：</span>${escapeHTML(container.ports || '自动分配')} <span class="term-muted">状态：</span><span class="term-success">running</span>`);
      terminalHTML('<span class="term-muted">输入</span> <button class="term-chip" data-command="docker ps">docker ps</button> <span class="term-muted">查看运行状态，或</span> <button class="term-chip" data-command="open ops">open ops</button> <span class="term-muted">打开运维台。</span>');
      lastOutputText = `${container.id} ${container.image} ${container.ports}`;
      return;
    }
    if (sub === 'stop' || sub === 'start' || sub === 'rm') {
      const target = tokens[0];
      if (!target) {
        terminalHTML(`<span class="term-error">docker：用法 docker ${sub} &lt;容器 ID 或名称&gt;</span>`);
        return;
      }
      if (!opsController) {
        terminalHTML('<span class="term-error">docker：容器运行时不可用。</span>');
        return;
      }
      const method = sub === 'stop' ? 'stopContainer' : sub === 'start' ? 'startContainer' : 'removeContainer';
      const result = opsController[method]?.(target);
      if (!result) {
        terminalHTML(`<span class="term-error">docker：未找到容器 ${escapeHTML(target)}</span>`);
        return;
      }
      terminalHTML(`<span class="term-success">容器 ${escapeHTML(result.name || target)} 已${sub === 'stop' ? '停止' : sub === 'start' ? '启动' : '删除'}。</span>`);
      return;
    }
    if (sub === 'logs') {
      const target = tokens[0];
      terminalHTML(`<div class="term-docker-logs"><span class="term-muted">[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 容器日志 ${escapeHTML(target || 'baota_panel')}</span><br>[notice] AISniper edge proxy ready<br>[info] upstream baota_panel:8888 healthy<br>[info] request GET / 200 2ms<br>[info] request GET /api/system 200 8ms</div>`);
      return;
    }
    terminalHTML('<span class="term-muted">docker：</span><span class="term-key">ps</span> <span class="term-muted">/</span> <span class="term-key">images</span> <span class="term-muted">/</span> <span class="term-key">run &lt;镜像&gt;</span> <span class="term-muted">/</span> <span class="term-key">stop</span> <span class="term-muted">/</span> <span class="term-key">start</span> <span class="term-muted">/</span> <span class="term-key">rm</span> <span class="term-muted">/</span> <span class="term-key">logs</span>');
  }

  function terminalCommandScripts() {
    terminalHTML('<div class="term-rule">~/运维脚本</div>');
    [
      ['部署宝塔面板.sh', './部署宝塔面板.sh', '创建宝塔面板与基础容器'],
      ['启动Nginx容器.sh', './启动Nginx容器.sh', '运行 nginx:stable 演示容器'],
      ['系统巡检.sh', './系统巡检.sh', '系统遥测与容器状态']
    ].forEach(([name, command, description]) => {
      terminalHTML(`<div class="term-script-row"><span class="term-script-icon">SH</span><button class="term-script-name" data-command="${command}">${escapeHTML(name)}</button><span class="term-script-desc">${description}</span></div>`);
    });
  }

  function terminalCommandScript(command) {
    const base = command.split('/').pop().replace(/^\.\//, '').toLowerCase();
    if (base === '部署宝塔面板.sh' || base === 'deploy-baota.sh' || base === 'deploy_baota.sh') {
      terminalCommandDeploy('baota');
    } else if (base === '启动nginx容器.sh' || base === 'start-nginx.sh') {
      terminalCommandDocker('run nginx');
    } else if (base === '系统巡检.sh' || base === 'status.sh') {
      terminalCommandStatus();
      terminalCommandDocker('ps');
    } else {
      terminalHTML(`<span class="term-error">zsh：没有找到脚本：${escapeHTML(command)}</span> <span class="term-muted">输入</span> <span class="term-key">scripts</span> <span class="term-muted">查看可用脚本。</span>`);
    }
  }

  function terminalExecute(raw) {
    const input = raw.trim();
    if (!input) return;
    terminalEcho(input);
    lastOutputText = '';
    if (terminalCommandHistory[terminalCommandHistory.length - 1] !== input) terminalCommandHistory.push(input);
    if (terminalCommandHistory.length > 60) terminalCommandHistory.shift();
    terminalHistoryIndex = terminalCommandHistory.length;
    const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((token) => token.replace(/^"|"$/g, '')) || [];
    let command = tokens.shift() || '';
    command = TERM_ALIASES[command] || command;
    const argument = tokens.join(' ');
    if (command === 'help') terminalCommandHelp();
    else if (command === 'clear') terminalClear();
    else if (command === 'ls') terminalCommandLs(argument);
    else if (command === 'cd') terminalCommandCd(argument);
    else if (command === 'pwd') terminalPrint(terminalCwd);
    else if (command === 'cat') terminalCommandCat(argument);
    else if (command === 'open') terminalCommandOpen(argument);
    else if (command === 'game' || command === 'void') { openApp('game'); terminalHTML('<span class="term-success">正在打开《深空信号》轨道界面…</span>'); }
    else if (command === 'theme') terminalCommandTheme(argument);
    else if (command === 'wifi') terminalCommandWifi(argument);
    else if (command === 'network' || command === 'ip') terminalCommandNetwork();
    else if (command === 'deploy') terminalCommandDeploy(argument);
    else if (command === 'docker') terminalCommandDocker(argument);
    else if (command === 'bt') terminalCommandBt();
    else if (command === 'panel' || command === 'ops') { openApp('ops'); terminalHTML('<span class="term-success">正在打开运维台…</span>'); }
    else if (command === 'steam') { openApp('steam'); terminalHTML('<span class="term-success">正在打开 Steam…</span>'); }
    else if (command === 'unity') { openApp('unity'); terminalHTML('<span class="term-success">正在打开 AISniper Unity…</span>'); }
    else if (['cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr'].includes(command)) { openApp(command); terminalHTML(`<span class="term-success">正在启动 ${escapeHTML(APPS[command].name)}…</span>`); }
    else if (command === 'scripts') terminalCommandScripts();
    else if (command === 'status' || command === 'health') terminalCommandStatus();
    else if (command === 'neofetch') terminalCommandNeofetch();
    else if (command === 'whoami') terminalPrint('sniper · 管理员');
    else if (command === 'date') terminalPrint(new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    else if (command === 'uptime') terminalPrint(`已运行 ${$('#settingsUptime')?.textContent || '00:00:00'}，1 位用户，负载均值：0.21 0.18 0.14`);
    else if (command === 'uname') terminalPrint('AISniperOS 26.1.4 天鹰座 arm64');
    else if (command === 'echo') terminalPrint(argument);
    else if (command === 'history') {
      terminalCommandHistory.forEach((item, index) => terminalHTML(`<span class="term-muted">${String(index + 1).padStart(3, '0')}</span>  ${escapeHTML(item)}`));
    } else if (command === 'about') {
      terminalHTML('<span class="term-accent">AISniperOS 26.1.4（天鹰座）</span> · 专注，凝练。');
      terminalPrint('一个浏览器原生桌面，为精确思考与深夜轨道而生。', 'term-line term-muted');
    } else if (command === 'sudo') {
      terminalHTML('<span class="term-warn">权限已授予——但只有操作员决定准星落在哪里。</span>');
    } else if (command === 'coffee') {
      terminalHTML('<span class="term-success">正在以 93°C 冲煮。</span> <span class="term-muted">一杯，静置四分钟。</span>');
    } else if (command === 'reset') {
      terminalResetSession();
    } else if (command === 'exit') {
      terminalHTML('<span class="term-muted">正在关闭终端…</span>');
      setTimeout(() => closeApp('terminal'), 260);
    } else if (/\.(sh|command)$/i.test(command)) {
      terminalCommandScript(command);
    } else {
      terminalHTML(`<span class="term-error">zsh：未找到命令：${escapeHTML(command)}</span> <span class="term-muted">输入</span> <span class="term-key">help</span> <span class="term-muted">查看命令。</span>`);
    }
    scrollTerminal();
  }

  function initTerminal() {
    const input = $('#terminalInput');
    const body = $('#terminalBody');
    if (!input || !body) return;
    terminalIntro();
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const value = input.value;
        input.value = '';
        terminalExecute(value);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!terminalCommandHistory.length) return;
        terminalHistoryIndex = Math.max(0, terminalHistoryIndex - 1);
        input.value = terminalCommandHistory[terminalHistoryIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        terminalHistoryIndex = Math.min(terminalCommandHistory.length, terminalHistoryIndex + 1);
        input.value = terminalCommandHistory[terminalHistoryIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const value = input.value.trim().toLowerCase();
        if (!value) return;
        const matches = TERM_COMMANDS.filter((command) => command.startsWith(value));
        if (matches.length === 1) input.value = `${matches[0]} `;
        else if (matches.length > 1) terminalHTML(matches.map((command) => `<span class="term-key">${command}</span>`).join('  '));
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        terminalClear();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        terminalClear();
      }
    });
    body.addEventListener('click', (event) => {
      const commandLink = event.target.closest('[data-command]');
      if (commandLink) {
        event.preventDefault();
        input.value = commandLink.dataset.command;
        input.focus();
        if (commandLink.classList.contains('term-chip') || commandLink.classList.contains('term-dir') || commandLink.classList.contains('term-script-name')) {
          terminalExecute(commandLink.dataset.command);
          input.value = '';
        }
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.type === 'Range' && !selection.isCollapsed) return;
      input.focus();
    });
    updateTerminalPrompt();
  }

  function terminalPrintExternal(message) {
    terminalPrint(message, 'term-line term-muted');
  }
  function copyLastTerminalOutput() {
    const last = lastOutputText || $('#terminalOutput')?.innerText || '';
    if (!last.trim()) {
      showToast({ title: '没有可拷贝的内容', message: '请先执行一个命令。', icon: 'app-terminal' });
      return;
    }
    copyText(last.trim()).then((ok) => {
      showToast({ title: ok ? '终端输出已拷贝' : '无法拷贝', message: ok ? '最近的结果已复制到剪贴板。' : '浏览器阻止了剪贴板访问。', icon: 'i-copy' });
    });
  }

  function selectTerminalOutput() {
    const output = $('#terminalOutput');
    if (!output) return;
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showToast({ title: '已选中终端输出', message: '按 Ctrl/Cmd + C 拷贝本次会话。', icon: 'app-terminal' });
  }

  /* ========================================================================
     Popovers, calendar, control centre
     ======================================================================== */

  let openPopoverName = null;
  let openPopoverTrigger = null;
  let calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  function initPopovers() {
    $$('[data-popover-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        togglePopover(trigger.dataset.popoverTrigger, trigger);
      });
    });
    $('#openCalendarBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      togglePopover('calendar', $('#clockStatusBtn') || event.currentTarget);
    });
    $('#wifiNetworkList')?.addEventListener('click', handleNetworkClick);
    $('#controlNetworkBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      const anchor = $('#wifiStatusBtn') || event.currentTarget;
      togglePopover('wifi', anchor);
    });
    $('#controlThemeBtn')?.addEventListener('click', () => {
      toggleAppearance({ announce: false });
      playInterfaceTone('click');
    });
    $('#controlSpotlightBtn')?.addEventListener('click', () => {
      closePopover();
      openSpotlight();
    });
    $('#controlSleepBtn')?.addEventListener('click', () => {
      closePopover();
      sleepOS();
    });
    $('#calendarPrev')?.addEventListener('click', () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#calendarNext')?.addEventListener('click', () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
      renderCalendar();
    });
    $('#calendarTodayBtn')?.addEventListener('click', () => {
      calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      renderCalendar();
      playInterfaceTone('click');
    });
    renderCalendar();
  }

  function togglePopover(name, trigger) {
    if (openPopoverName === name) {
      closePopover();
      return;
    }
    if (gameInstance?.isPlaying?.()) gameInstance.pause();
    closeMenu();
    closeContextMenu();
    closePopover();
    const popover = document.getElementById(`popover-${name}`);
    if (!popover) return;
    if (name === 'calendar') {
      calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      renderCalendar();
    }
    if (name === 'health') syncHealthDisplay();
    if (name === 'wifi') syncWifiDisplay();
    openPopoverName = name;
    openPopoverTrigger = trigger || null;
    popover.setAttribute('aria-hidden', 'false');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
      positionPopover(popover, trigger);
    }
    void popover.offsetWidth;
    popover.classList.add('is-open');
    playInterfaceTone('click');
  }

  function positionPopover(popover, trigger) {
    const width = popover.offsetWidth || 336;
    const rect = trigger.getBoundingClientRect();
    let left = rect.right - width;
    left = clamp(left, 8, window.innerWidth - width - 8);
    const menubar = parseFloat(getComputedStyle(root).getPropertyValue('--menubar-height')) || 31;
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(menubar + 7)}px`;
  }

  function repositionOpenPopover() {
    if (!openPopoverName) return;
    const popover = document.getElementById(`popover-${openPopoverName}`);
    if (popover && openPopoverTrigger) positionPopover(popover, openPopoverTrigger);
  }

  function closePopover() {
    if (!openPopoverName) return;
    const popover = document.getElementById(`popover-${openPopoverName}`);
    if (popover) {
      popover.classList.remove('is-open');
      popover.setAttribute('aria-hidden', 'true');
    }
    if (openPopoverTrigger) openPopoverTrigger.setAttribute('aria-expanded', 'false');
    openPopoverName = null;
    openPopoverTrigger = null;
  }

  function renderCalendar() {
    const grid = $('#calendarGrid');
    if (!grid) return;
    grid.replaceChildren();
    const month = calendarViewDate;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const today = new Date();
    const monthLabel = $('#calendarMonthLabel');
    if (monthLabel) monthLabel.textContent = `${year}年${monthIndex + 1}月`;
    const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const eventDays = new Set([5, 13, 18, 24]);
    for (let index = 0; index < firstWeekday; index += 1) {
      const blank = document.createElement('span');
      blank.className = 'calendar-day is-blank';
      grid.appendChild(blank);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement('span');
      cell.className = 'calendar-day';
      cell.textContent = String(day);
      if (day === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear()) cell.classList.add('is-today');
      if (eventDays.has(day)) cell.classList.add('has-event');
      const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][new Date(year, monthIndex, day).getDay()];
      cell.setAttribute('aria-label', `${year}年${monthIndex + 1}月${day}日 ${weekday}`);
      grid.appendChild(cell);
    }
    while (grid.children.length % 7 !== 0) {
      const blank = document.createElement('span');
      blank.className = 'calendar-day is-blank';
      grid.appendChild(blank);
    }
    const dayLabel = $('#calendarDayLabel');
    if (dayLabel) dayLabel.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;
  }

  /* ========================================================================
     Spotlight
     ======================================================================== */

  let spotlightIsOpen = false;
  let spotlightResults = [];
  let spotlightSelection = 0;
  let spotlightPreviousFocus = null;

  function spotlightCatalog() {
    const apps = [
      { title: '访达', subtitle: '浏览文件、项目与文件夹', type: '应用', icon: 'app-finder', app: true, keywords: '文件 文件夹 云盘 文稿 files folders drive documents', action: () => openApp('finder') },
      { title: '浏览器', subtitle: '搜索网页、打开网站与收藏', type: '应用', icon: 'app-browser', app: true, keywords: '浏览器 网页 搜索 网址 上网 browser web internet', action: () => openApp('browser') },
      { title: '信息', subtitle: '与团队、朋友和智能体保持联系', type: '应用', icon: 'app-messages', app: true, keywords: '消息 聊天 信息 对话 短信 messages chat imessage', action: () => openApp('messages') },
      { title: '智能体', subtitle: 'SENTRY 本地神经任务代理', type: '应用', icon: 'app-agent', app: true, keywords: 'ai 智能体 助手 agent assistant sentry 人工智能', action: () => openApp('agent') },
      { title: '计算器', subtitle: '精确的口袋计算器', type: '应用', icon: 'app-calculator', app: true, keywords: '数学 数字 计算 math numbers arithmetic', action: () => openApp('calculator') },
      { title: '系统设置', subtitle: '网络、账户、通知与系统偏好', type: '应用', icon: 'app-settings', app: true, keywords: '设置 偏好 控制面板 preferences control panel', action: () => openApp('settings') },
      { title: '终端', subtitle: '直连 AISniper 核心与服务器', type: '应用', icon: 'app-terminal', app: true, keywords: '命令 终端 命令行 shell command zsh docker deploy', action: () => openApp('terminal') },
      { title: '运维台', subtitle: '宝塔面板、网站与模拟容器', type: '应用', icon: 'app-ops', app: true, keywords: '服务器 运维 宝塔 面板 docker 容器 部署 ops server baota panel', action: () => openApp('ops') },
      { title: 'Steam', subtitle: '商店、游戏库、DLC、VR 与社交', type: '应用', icon: 'app-steam', app: true, keywords: 'steam 游戏 商店 库 dlc vr vrchat cs2 steamvr ovr slimevr 命运 全境封锁 game store library', action: () => openApp('steam') },
      { title: 'AISniper Unity', subtitle: '伪 Unity 场景编辑器与运行预览', type: '应用', icon: 'app-unity', app: true, keywords: 'unity 编辑器 游戏 场景 3d editor scene 开发', action: () => openApp('unity') },
      { title: '深空信号', subtitle: '启动 3D 轨道截击机', type: '应用', icon: 'app-game', app: true, keywords: '游戏 太空 射击 深空 game space shooter void orbital', action: () => openApp('game') }
    ];
    return apps;
  }

  function spotlightActions() {
    return [
      { title: resolvedTheme() === 'dark' ? '切换到浅色外观' : '切换到深色外观', subtitle: '切换 AISniperOS 的整体界面', type: '操作', icon: 'i-sun', keywords: '外观 主题 浅色 深色 theme appearance dark light', action: () => toggleAppearance({ announce: true }) },
      { title: '部署宝塔面板', subtitle: '启动演示服务器、网站与容器', type: '操作', icon: 'app-ops', keywords: '部署 宝塔 面板 容器 docker server deploy container baota', action: () => { const result = opsController?.deployBaota?.({ open: true }); if (!result) openApp('ops'); } },
      { title: '更换墙纸', subtitle: '子午线、余烬旷野、冰川空气等 12 套动态地平线', type: '设置', icon: 'i-image', keywords: '桌面 背景 壁纸 地平线 极夜 樱雾 沙丘 苔林 潮汐 星云 石墨 日冕 深潜 background horizon', action: () => openApp('settings', { panel: 'wallpaper' }) },
      { title: '网络', subtitle: '以太网、Wi-Fi 与网络诊断', type: '设置', icon: 'i-ethernet', keywords: '网络 有线 以太网 无线 局域网 wifi wi-fi 互联网 network ethernet wireless internet', action: () => openApp('settings', { panel: 'wifi' }) },
      { title: '通知与专注', subtitle: '横幅、声音与勿扰专注', type: '设置', icon: 'i-bell', keywords: '通知 横幅 声音 专注 勿扰 notifications focus do not disturb', action: () => openApp('settings', { panel: 'notifications' }) },
      { title: '用户与账户', subtitle: 'Sniper、登录与自动登录', type: '设置', icon: 'i-user', keywords: '用户 账户 登录 密码 account user login', action: () => openApp('settings', { panel: 'users' }) },
      { title: '隐私与安全', subtitle: '相机、麦克风、防火墙与数据', type: '设置', icon: 'i-shield', keywords: '隐私 安全 相机 麦克风 防火墙 privacy security firewall', action: () => openApp('settings', { panel: 'privacy' }) },
      { title: '日期与时间', subtitle: '时钟格式、时区与自动校准', type: '设置', icon: 'i-clock', keywords: '时间 日期 时钟 时区 clock date time zone', action: () => openApp('settings', { panel: 'datetime' }) },
      { title: '系统健康度', subtitle: 'CPU、内存、温度与诊断', type: '设置', icon: 'i-health', keywords: '电池 温度 内存 诊断 battery temperature cpu memory vitals', action: () => openApp('settings', { panel: 'health' }) },
      { title: '桌面与程序坞', subtitle: '大小、放大效果与自动隐藏', type: '设置', icon: 'i-desktop', keywords: '程序坞 大小 放大 隐藏 dock size magnification hide', action: () => openApp('settings', { panel: 'dock' }) },
      { title: '锁定屏幕', subtitle: '离开工作区，保留当前会话', type: '操作', icon: 'i-lock', keywords: '锁屏 锁定 安全 退出 lock screen', action: lockOS },
      { title: '睡眠', subtitle: '让山脊安静下来', type: '操作', icon: 'i-moon', keywords: '锁屏 休息 电源 lock screen rest power', action: sleepOS }
    ];
  }

  function openSpotlight() {
    if (spotlightIsOpen) return;
    if (gameInstance?.isPlaying?.()) gameInstance.pause();
    closeMenu();
    closeContextMenu();
    closePopover();
    spotlightPreviousFocus = document.activeElement;
    spotlightIsOpen = true;
    spotlightSelection = 0;
    const layer = $('#spotlightLayer');
    const input = $('#spotlightInput');
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    if (input) {
      input.value = '';
      renderSpotlightResults('');
      setTimeout(() => input.focus(), 70);
    }
    playInterfaceTone('click');
  }

  function closeSpotlight(options = {}) {
    if (!spotlightIsOpen) return;
    spotlightIsOpen = false;
    spotlightResults = [];
    const layer = $('#spotlightLayer');
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    if (options.restoreFocus !== false && spotlightPreviousFocus && document.contains(spotlightPreviousFocus)) {
      setTimeout(() => spotlightPreviousFocus.focus?.(), 20);
    }
  }

  function renderSpotlightResults(query) {
    const container = $('#spotlightResults');
    if (!container) return;
    const term = query.trim().toLowerCase();
    const all = [...spotlightCatalog().map((item) => ({ ...item, section: '应用程序' })), ...spotlightActions().map((item) => ({ ...item, section: '快捷操作' }))];
    spotlightResults = (term ? all.filter((item) => `${item.title} ${item.subtitle} ${item.keywords} ${item.type}`.toLowerCase().includes(term)) : all).slice(0, 12);
    spotlightSelection = clamp(spotlightSelection, 0, Math.max(0, spotlightResults.length - 1));
    container.replaceChildren();
    if (!spotlightResults.length) {
      const empty = document.createElement('div');
      empty.className = 'spotlight-empty';
      empty.innerHTML = '<b>未找到相关信号。</b>试试应用名称、设置或操作。';
      container.appendChild(empty);
      return;
    }
    let lastSection = '';
    spotlightResults.forEach((item, index) => {
      if (item.section !== lastSection) {
        lastSection = item.section;
        const label = document.createElement('div');
        label.className = 'spotlight-section-label';
        label.textContent = item.section;
        container.appendChild(label);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `spotlight-result${index === spotlightSelection ? ' is-selected' : ''}`;
      button.dataset.spotlightIndex = String(index);
      const icon = document.createElement('span');
      icon.className = `spotlight-result-icon${item.app ? '' : ' generic'}`;
      icon.innerHTML = `<svg viewBox="${item.app ? '0 0 64 64' : '0 0 24 24'}"><use href="#${item.icon}"></use></svg>`;
      const copy = document.createElement('span');
      copy.className = 'spotlight-result-copy';
      const title = document.createElement('b');
      title.textContent = item.title;
      const subtitle = document.createElement('span');
      subtitle.textContent = item.subtitle;
      copy.append(title, subtitle);
      const type = document.createElement('span');
      type.className = 'spotlight-result-type';
      type.textContent = item.type;
      button.append(icon, copy, type);
      button.addEventListener('click', () => executeSpotlightItem(index));
      container.appendChild(button);
    });
    if (container.children.length) {
      const selected = container.querySelector('.is-selected');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }

  function moveSpotlightSelection(delta) {
    if (!spotlightResults.length) return;
    spotlightSelection = (spotlightSelection + delta + spotlightResults.length) % spotlightResults.length;
    $$('.spotlight-result', $('#spotlightResults')).forEach((button) => {
      button.classList.toggle('is-selected', Number(button.dataset.spotlightIndex) === spotlightSelection);
    });
    const selected = $(`.spotlight-result[data-spotlight-index="${spotlightSelection}"]`, $('#spotlightResults'));
    selected?.scrollIntoView({ block: 'nearest' });
  }

  function executeSpotlightItem(index = spotlightSelection) {
    const item = spotlightResults[index];
    if (!item) return;
    closeSpotlight({ restoreFocus: false });
    setTimeout(() => item.action(), 30);
  }

  /* ========================================================================
     Desktop context menu & sleep
     ======================================================================== */

  let contextMenuIsOpen = false;
  let sleepTimer = null;

  function initContextMenu() {
    const menu = $('#desktopContextMenu');
    if (!menu) return;
    document.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.window, .menu-bar, .dock-shell, .popover, .spotlight-layer, .sleep-screen, .toast, .os-dropdown, .desktop-context-menu, .os-dialog-layer')) return;
      event.preventDefault();
      showContextMenu(event.clientX, event.clientY);
    });
    $$('#desktopContextMenu [data-context]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.context;
        closeContextMenu();
        if (action === 'wallpaper') openApp('settings', { panel: 'wallpaper' });
        else if (action === 'widgets') {
          setState('widgets', !state.widgets, { silent: true });
          showToast({ title: state.widgets ? '小组件已显示' : '小组件已隐藏', message: state.widgets ? '天气与日程重新回到山脊。' : '桌面安静下来了。', icon: 'i-desktop' });
        } else if (action === 'settings') openApp('settings');
        else if (action === 'spotlight') openSpotlight();
      });
    });
  }

  function showContextMenu(x, y) {
    if (gameInstance?.isPlaying?.()) gameInstance.pause();
    closeMenu();
    closePopover();
    const menu = $('#desktopContextMenu');
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = `${clamp(x, 8, window.innerWidth - width - 8)}px`;
    menu.style.top = `${clamp(y, 36, window.innerHeight - height - 8)}px`;
    contextMenuIsOpen = true;
  }

  function closeContextMenu() {
    const menu = $('#desktopContextMenu');
    if (!menu || !contextMenuIsOpen) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    contextMenuIsOpen = false;
  }

  function sleepOS() {
    closePopover();
    closeMenu();
    closeContextMenu();
    closeSpotlight({ restoreFocus: false });
    sleepOpen = true;
    sleepState.open = true;
    suspendGame();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    updateClock();
    const screen = $('#sleepScreen');
    if (screen) {
      screen.classList.add('is-visible');
      screen.setAttribute('aria-hidden', 'false');
    }
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      const wake = $('#sleepWakeBtn');
      if (wake) wake.focus();
    }, 500);
  }

  function wakeOS() {
    if (!sleepOpen) return;
    sleepOpen = false;
    sleepState.open = false;
    clearTimeout(sleepTimer);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const screen = $('#sleepScreen');
    if (screen) {
      screen.classList.remove('is-visible');
      screen.setAttribute('aria-hidden', 'true');
    }
    playInterfaceTone('open');
  }

  /* ========================================================================
     Account login & lock screen
     ======================================================================== */

  function showLoginScreen(mode = 'initial') {
    loginMode = mode;
    isLocked = true;
    document.body.classList.add('is-locked');
    closeMenu();
    closeContextMenu();
    closePopover();
    closeSpotlight({ restoreFocus: false });
    closeOSDialog(null);
    if ($('#quicklook') && !$('#quicklook').hidden) closeQuicklook();
    if ($('#pdfViewer') && !$('#pdfViewer').hidden) closePdfViewer();
    if ($('#archiveSheet') && !$('#archiveSheet').hidden) closeArchiveSheet();
    suspendGame();
    if (document.pointerLockElement) document.exitPointerLock?.();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    $('#toastStack')?.replaceChildren();
    const screen = $('#loginScreen');
    if (!screen) return;
    screen.dataset.mode = mode;
    screen.classList.add('is-visible');
    screen.setAttribute('aria-hidden', 'false');
    const error = $('#loginError');
    if (error) {
      error.hidden = true;
      error.dataset.attempts = '0';
    }
    const hint = $('#loginHint');
    if (hint) hint.classList.remove('is-emphasis');
    const input = $('#loginPassword');
    if (input) {
      input.value = '';
      input.type = 'password';
      input.classList.remove('is-visible-password');
    }
    const note = $('#loginSessionNote');
    if (note) {
      note.textContent = mode === 'unlock'
        ? '系统已锁定 · 输入账户密码继续。'
        : '输入账户密码，进入你的私人工作区。';
    }
    syncLoginHint();
    updateClock();
    clearTimeout(loginHintToggleTimer);
    loginHintToggleTimer = setTimeout(() => {
      const field = $('#loginPassword');
      if (field && isLocked) field.focus();
    }, 260);
  }

  function lockOS() {
    if (isLocked) return;
    showLoginScreen('unlock');
    playInterfaceTone('close');
  }

  function completeLogin() {
    const screen = $('#loginScreen');
    isLocked = false;
    document.body.classList.remove('is-locked');
    if (screen) {
      screen.classList.remove('is-visible');
      screen.setAttribute('aria-hidden', 'true');
    }
    const input = $('#loginPassword');
    if (input) input.value = '';
    const error = $('#loginError');
    if (error) {
      error.hidden = true;
      error.dataset.attempts = '0';
    }
    const hint = $('#loginHint');
    if (hint) hint.classList.remove('is-emphasis');
    const wasInitial = !loginInitialComplete || loginMode === 'initial';
    loginInitialComplete = true;
    if (wasInitial) {
      openApp('finder', { silent: true });
      setTimeout(() => {
        if (!sessionStorage.getItem('aisniperos.welcomed')) {
          try { sessionStorage.setItem('aisniperos.welcomed', '1'); } catch (errorStorage) { /* no-op */ }
          showToast({
            title: '欢迎回来，Sniper',
            message: '右上角可以直接搜索网页；智能体、信息与终端都在程序坞里。',
            icon: 'i-mark',
            duration: 6400
          });
        }
      }, 460);
    } else if (!state.restoreWindows) {
      Object.entries(windowStates).forEach(([app, s]) => {
        if (!s.isOpen) return;
        s.isOpen = false;
        s.isMinimized = false;
        s.isClosing = false;
        s.el.classList.remove('is-open', 'is-active', 'is-closing', 'is-minimizing');
        s.el.setAttribute('aria-hidden', 'true');
      });
      openApp('finder', { silent: true });
      showToast({ title: '欢迎回来，Sniper', message: '工作区已恢复为上次保存的状态。', icon: 'i-user' });
    } else {
      showToast({ title: '已解锁', message: '欢迎回来。你的工作区保持原样。', icon: 'i-lock' });
      const current = windowStates[activeApp];
      if (!current?.isOpen || current.isMinimized) {
        const visible = Object.entries(windowStates).find(([, s]) => s.isOpen && !s.isMinimized);
        if (visible) focusApp(visible[0]);
        else setActiveApp('finder');
      }
    }
    updateDockRunningState();
    playInterfaceTone('open');
  }

  function attemptLogin() {
    const input = $('#loginPassword');
    const error = $('#loginError');
    if (!input) return;
    const value = input.value.trim();
    if (!value) {
      if (error) {
        error.textContent = '请输入账户密码。';
        error.hidden = false;
      }
      input.focus();
      return;
    }
    if (value.toLowerCase() === DEMO_PASSWORD) {
      input.blur();
      completeLogin();
      return;
    }
    if (error) {
      error.textContent = '密码不正确，请重新输入。';
      error.hidden = false;
    }
    const panel = $('.login-panel');
    if (panel) {
      panel.classList.remove('is-shaking');
      void panel.offsetWidth;
      panel.classList.add('is-shaking');
      setTimeout(() => panel.classList.remove('is-shaking'), 480);
    }
    if (error) {
      error.dataset.attempts = String(Number(error.dataset.attempts || 0) + 1);
      if (Number(error.dataset.attempts) >= 2) {
        const hint = $('#loginHint');
        if (hint) {
          hint.hidden = false;
          hint.classList.add('is-emphasis');
        }
      }
    }
    input.select();
    playInterfaceTone('alert', true);
  }

  function initLogin() {
    const form = $('#loginForm');
    const input = $('#loginPassword');
    if (!form || !input) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      attemptLogin();
    });
    $('#loginScreen')?.addEventListener('click', (event) => {
      if (event.target.closest('button, input, form, a')) return;
      input.focus();
    });
    $('#loginScreen')?.addEventListener('contextmenu', (event) => event.preventDefault());
    syncLoginHint();
  }

  /* ========================================================================
     Native-style input dialog
     ======================================================================== */

  let osDialogResolve = null;
  let osDialogPreviousFocus = null;

  function showOSDialog(options = {}) {
    const layer = $('#osDialogLayer');
    if (!layer) return Promise.resolve(null);
    if (osDialogResolve) closeOSDialog(null);
    osDialogPreviousFocus = document.activeElement;
    const title = $('#osDialogTitle');
    const message = $('#osDialogMessage');
    const input = $('#osDialogInput');
    const field = $('#osDialogFieldWrap');
    const fieldLabel = $('#osDialogFieldLabel');
    const info = $('#osDialogInfo');
    const cancel = $('#osDialogCancel');
    const confirm = $('#osDialogConfirm');
    const iconUse = $('#osDialogIconUse');
    if (title) title.textContent = options.title || 'AISniperOS';
    if (message) {
      message.textContent = options.message || '';
      message.hidden = !options.message;
    }
    if (iconUse) iconUse.setAttribute('href', `#${options.icon || 'i-info'}`);
    const hasInput = options.input !== false;
    if (field) field.hidden = !hasInput;
    if (input) {
      input.type = options.type || 'text';
      input.value = options.value || '';
      input.placeholder = options.placeholder || '';
      input.autocomplete = 'off';
      input.spellcheck = false;
    }
    if (fieldLabel) fieldLabel.textContent = options.fieldLabel || '名称';
    if (info) {
      info.hidden = !options.info;
      info.innerHTML = options.info || '';
    }
    if (cancel) {
      cancel.textContent = options.cancelLabel || '取消';
      cancel.hidden = options.hideCancel === true;
    }
    if (confirm) confirm.textContent = options.confirmLabel || '确定';
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => layer.classList.add('is-open'));
    const promise = new Promise((resolve) => { osDialogResolve = resolve; });
    const finish = (result) => {
      if (!osDialogResolve) return;
      const resolveFn = osDialogResolve;
      osDialogResolve = null;
      layer.classList.remove('is-open');
      setTimeout(() => {
        layer.hidden = true;
        layer.setAttribute('aria-hidden', 'true');
      }, 150);
      if (osDialogPreviousFocus && document.contains(osDialogPreviousFocus)) {
        setTimeout(() => osDialogPreviousFocus.focus?.(), 160);
      }
      osDialogPreviousFocus = null;
      resolveFn(result);
    };
    const submit = () => {
      const value = hasInput ? input?.value.trim() : '';
      if (hasInput && !value) {
        if (input) {
          input.focus();
          input.classList.remove('is-shaking');
          void input.offsetWidth;
          input.classList.add('is-shaking');
          setTimeout(() => input.classList.remove('is-shaking'), 420);
        }
        return;
      }
      finish(hasInput ? value : '');
    };
    setOSDialogHandlers({ finish, submit });
    setTimeout(() => {
      if (hasInput && input) {
        input.focus();
        input.select();
      } else if (confirm) confirm.focus();
    }, 90);
    return promise;
  }

  function setOSDialogHandlers({ finish, submit }) {
    const cancel = $('#osDialogCancel');
    const confirm = $('#osDialogConfirm');
    const input = $('#osDialogInput');
    const backdrop = $('.os-dialog-backdrop');
    if (cancel) cancel.onclick = () => finish(null);
    if (confirm) confirm.onclick = submit;
    if (input) input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        submit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finish(null);
      }
    };
    if (backdrop) backdrop.onclick = () => finish(null);
  }

  function closeOSDialog(result = null) {
    if (!osDialogResolve) return;
    const resolveFn = osDialogResolve;
    osDialogResolve = null;
    const layer = $('#osDialogLayer');
    if (layer) {
      layer.classList.remove('is-open');
      setTimeout(() => {
        layer.hidden = true;
        layer.setAttribute('aria-hidden', 'true');
      }, 150);
    }
    resolveFn(result);
  }

  /* ========================================================================
     Game hand-off
     ======================================================================== */

  function initBrowserApplication() {
    if (!window.AISniperBrowser) return;
    try {
      browserController = window.AISniperBrowser.init({
        openApp,
        closeApp,
        showToast
      });
    } catch (error) {
      console.error('AISniperOS：浏览器初始化失败。', error);
    }
  }

  function initExtraApplications() {
    if (window.AISniperMessages) {
      try {
        messagesController = window.AISniperMessages.init({
          openApp,
          closeApp,
          showToast,
          getSettings: () => ({
            notificationBadges: state.notificationBadges,
            notifications: state.notifications,
            focusMode: state.focusMode,
            activeApp
          })
        });
      } catch (error) {
        console.error('AISniperOS：信息初始化失败。', error);
      }
    }
    if (window.AISniperOps) {
      try {
        opsController = window.AISniperOps.init({
          openApp,
          closeApp,
          showToast,
          openTerminal: (command = '') => {
            openApp('terminal');
            if (command) {
              setTimeout(() => {
                const terminalInput = $('#terminalInput');
                if (terminalInput) {
                  terminalInput.value = command;
                  terminalInput.focus();
                }
              }, 180);
            }
          },
          openBrowser: (url) => {
            openApp('browser');
            setTimeout(() => browserController?.openUrl?.(url), 220);
          },
          getSystem: () => ({
            clock: formatClockTime(new Date()),
            cpu: Math.round(health.cpu),
            memory: Math.round(health.memory),
            temperature: Math.round(health.temperature)
          })
        });
      } catch (error) {
        console.error('AISniperOS：运维台初始化失败。', error);
      }
    }
    if (window.AISniperSteam) {
      try {
        steamController = window.AISniperSteam.init({
          openApp,
          closeApp,
          showToast,
          getAccount: () => ({
            name: 'Sniper',
            level: 42,
            status: '在线',
            wallet: '¥ 248.00',
            statusText: '正在 Steam 中浏览'
          })
        });
      } catch (error) {
        console.error('AISniperOS：Steam 初始化失败。', error);
      }
    }
    if (window.AISniperUnity) {
      try {
        unityController = window.AISniperUnity.init({
          openApp,
          closeApp,
          showToast
        });
      } catch (error) {
        console.error('AISniperOS：AISniper Unity 初始化失败。', error);
      }
    }
    if (window.AISniperAgent) {
      try {
        agentController = window.AISniperAgent.init({          openApp,
          closeApp,
          showToast,
          getStatus: () => ({
            health: {
              cpu: Math.round(health.cpu),
              memory: Math.round(health.memory),
              gpu: Math.round(health.gpu),
              temperature: Math.round(health.temperature),
              score: health.score
            },
            appearance: state.appearance,
            resolvedTheme: resolvedTheme(),
            accent: state.accent,
            wifi: state.wifi,
            wifiNetwork: state.wifiNetwork,
            focusMode: state.focusMode,
            notifications: state.notifications,
            time: formatClockTime(new Date()),
            ops: opsController?.getState?.() || null,
            messages: messagesController?.getState?.() || null
          }),
          openFinder: (location) => openApp('finder', { location }),
          deployOps: () => {
            if (!opsController) return null;
            return opsController.deployBaota({ open: true });
          },
          openOps: (view) => {
            openApp('ops');
            if (view) setTimeout(() => opsController?.showView?.(view), 180);
          },
          setAppearance: (mode) => setAppearance(mode, { announce: false }),
          openSettings: (panel) => openApp('settings', { panel }),
          lock: () => lockOS()
        });
      } catch (error) {
        console.error('AISniperOS：智能体初始化失败。', error);
      }
    }
  }

  function ensureGame() {
    if (!window.VoidSignalGame) {
      const error = $('#gameWebglError');
      if (error) error.hidden = false;
      return;
    }
    if (!gameInstance) {
      try {
        gameInstance = new window.VoidSignalGame({
          onRequestClose: () => closeApp('game'),
          onRequestExpand: () => toggleMaximize('game')
        });
        gameInstance.setVolume?.(state.soundVolume / 100);
      } catch (error) {
        console.error('AISniperOS：无法启动《深空信号》。', error);
        const panel = $('#gameWebglError');
        if (panel) panel.hidden = false;
        return;
      }
    }
    requestAnimationFrame(() => gameInstance?.open?.());
  }

  function suspendGame() {
    gameInstance?.suspend?.();
  }

  /* ========================================================================
     Dock, menu triggers, global input
     ======================================================================== */

  function dismissOverlays() {
    closeMenu();
    closeContextMenu();
    closePopover();
    if (spotlightIsOpen) closeSpotlight({ restoreFocus: false });
  }

  function initInteractions() {
    $('#brandMenuBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      showBrandMenu(event.currentTarget);
      playInterfaceTone('click');
    });
    $('#appMenuBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      showAppMenu(event.currentTarget);
      playInterfaceTone('click');
    });
    $('#menuLinks')?.addEventListener('click', (event) => {
      const button = event.target.closest('.menu-item');
      if (!button || button.hidden) return;
      event.stopPropagation();
      if (currentMenuAnchor === button) { closeMenu(); return; }
      const menu = buildAppMenus(activeApp).find((entry) => entry.key === button.dataset.menu);
      if (!menu) return;
      showMenu(button, menu.items());
    });
    $$('.dock-item[data-launch]').forEach((item) => {
      item.addEventListener('click', () => {
        const launch = item.dataset.launch;
        animateDockLaunch(item);
        if (launch === 'trash') openApp('finder', { location: 'trash' });
        else openApp(launch);
      });
    });
    $('#spotlightBtn')?.addEventListener('click', openSpotlight);
    $('#spotlightBackdrop')?.addEventListener('click', () => closeSpotlight());
    $('#spotlightInput')?.addEventListener('input', (event) => {
      spotlightSelection = 0;
      renderSpotlightResults(event.target.value);
    });
    $('#spotlightInput')?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSpotlightSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSpotlightSelection(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        executeSpotlightItem();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeSpotlight();
      }
    });
    $('#sleepScreen')?.addEventListener('click', wakeOS);
    $('#sleepWakeBtn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      wakeOS();
    });

    document.addEventListener('click', (event) => {
      const menuTrigger = event.target.closest('#brandMenuBtn, #appMenuBtn, .menu-item, #finderMoreBtn');
      if (currentMenu && !event.target.closest('.os-dropdown') && !menuTrigger) closeMenu();
      const popoverTrigger = event.target.closest('[data-popover-trigger], #openCalendarBtn');
      if (openPopoverName && !event.target.closest('.popover') && !popoverTrigger) closePopover();
      if (contextMenuIsOpen && !event.target.closest('.desktop-context-menu')) closeContextMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (document.body.classList.contains('is-booting') || isLocked) return;
      const shortcutMod = event.metaKey || event.ctrlKey;
      if (shortcutMod && event.key.toLowerCase() === 'q' && (event.ctrlKey || event.altKey)) {
        event.preventDefault();
        lockOS();
        return;
      }
      if (event.key === 'Escape') {
        if (osDialogResolve) { event.preventDefault(); closeOSDialog(null); return; }
        if (sleepOpen) { event.preventDefault(); wakeOS(); return; }
        if (spotlightIsOpen) { event.preventDefault(); closeSpotlight(); return; }
        if (currentMenu) { event.preventDefault(); closeMenu(); return; }
        if (contextMenuIsOpen) { event.preventDefault(); closeContextMenu(); return; }
        if (openPopoverName) { event.preventDefault(); closePopover(); return; }
        if ($('#archiveSheet') && !$('#archiveSheet').hidden) { event.preventDefault(); closeArchiveSheet(); return; }
        if ($('#pdfViewer') && !$('#pdfViewer').hidden) { event.preventDefault(); closePdfViewer(); return; }
        if ($('#quicklook') && !$('#quicklook').hidden) { event.preventDefault(); closeQuicklook(); return; }
      }
      if (sleepOpen) return;
      if (event.defaultPrevented) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      const targetIsField = Boolean(event.target.closest('input, textarea, select, [contenteditable="true"]'));
      if ((key === 'k' || key === ' ') && !targetIsField) {
        event.preventDefault();
        if (spotlightIsOpen) closeSpotlight();
        else openSpotlight();
      } else if (key === 'n' && event.shiftKey && activeApp === 'finder' && windowStates.finder?.isOpen && !targetIsField) {
        event.preventDefault();
        createFinderFolder();
      } else if (key === ',' && !targetIsField) {
        event.preventDefault();
        openApp('settings');
      } else if (key === 'm' && !targetIsField) {
        event.preventDefault();
        if (windowStates[activeApp]?.isOpen) minimizeApp(activeApp);
      }
    });

    $$('.desktop').forEach((desktop) => {
      desktop.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.window, .menu-bar, .dock-shell, .popover, .widget-stack, .spotlight-layer, .toast, .os-dropdown, .desktop-context-menu, .sleep-screen, .os-dialog-layer')) return;
        Object.values(windowStates).forEach((s) => s.el.classList.remove('is-active'));
        closeMenu();
        closePopover();
        closeContextMenu();
        setActiveApp('finder');
      }, true);
    });
  }

  function wireToggleControls() {
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-setting-toggle]');
      if (!toggle) return;
      const key = toggle.dataset.settingToggle;
      if (!(key in state) || typeof state[key] !== 'boolean') return;
      event.preventDefault();
      setState(key, !state[key]);
    });
  }

  /* ========================================================================
     Boot & startup
     ======================================================================== */

  let bootTimeoutIds = [];

  function startBootSequence() {
    const screen = $('#bootScreen');
    if (!screen) return;
    const status = $('#bootStatus');
    const setStatus = (text) => { if (status) status.textContent = text; };
    bootTimeoutIds.push(setTimeout(() => setStatus('正在载入工作区'), 420));
    bootTimeoutIds.push(setTimeout(() => setStatus('让山脊进入焦点'), 880));
    bootTimeoutIds.push(setTimeout(() => setStatus('准备就绪'), 1230));
    bootTimeoutIds.push(setTimeout(() => finishBootSequence(), 1400));
    screen.addEventListener('click', () => finishBootSequence(), { once: true });
  }

  function finishBootSequence() {
    if (bootFinished) return;
    bootFinished = true;
    bootTimeoutIds.forEach((id) => clearTimeout(id));
    bootTimeoutIds = [];
    const screen = $('#bootScreen');
    const status = $('#bootStatus');
    if (status) status.textContent = '准备就绪';
    if (screen) screen.classList.add('is-ready');
    document.body.classList.remove('is-booting');
    setTimeout(() => {
      if (screen) screen.style.display = 'none';
      if (state.autoLogin) {
        loginMode = 'initial';
        completeLogin();
      } else {
        showLoginScreen('initial');
      }
    }, 620);
  }

  /* ========================================================================
     Init
     ======================================================================== */

  function init() {
    applyVisualState();
    initWindows();
    initBrowserApplication();
    initExtraApplications();
    initFinder();
    initSettingsApp();
    initCalculator();
    initTerminal();
    initPopovers();
    initContextMenu();
    initInteractions();
    initLogin();
    wireToggleControls();
    setActiveApp('finder');
    updateClock();
    syncHealthDisplay();
    initBattery();
    setInterval(updateClock, 1000);
    setInterval(driftHealth, 2450);
    setInterval(() => {
      if (state.appearance === 'auto') {
        const theme = resolvedTheme();
        if (root.dataset.theme !== theme) applyVisualState();
      }
    }, 30000);
    updateDockRunningState();
    startBootSequence();
  }

  init();
})();
