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
  const SYSTEM_WIPED_KEY = 'aisniperos.system.wiped.v1';
  const LINUX = window.AISniperLinux || {};
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

  const TERM_COMMANDS = LINUX.COMMANDS || [
    'help', 'ls', 'cd', 'pwd', 'cat', 'open', 'game', 'theme', 'wifi', 'network', 'status',
    'health', 'neofetch', 'whoami', 'date', 'uptime', 'uname', 'echo', 'history',
    'clear', 'about', 'sudo', 'coffee', 'exit', 'reset', 'deploy', 'docker', 'bt', 'panel', 'scripts',
    'steam', 'cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr'
  ];
  const TERM_ALIASES = { ...(LINUX.ALIASES || { '?': 'help', ll: 'ls -la', dir: 'ls', cls: 'clear', containers: 'docker ps' }) };
  const TERM_SYSTEM_FS = LINUX.SYSTEM_FS || {};
  const TERM_SYSTEM_FILES = LINUX.SYSTEM_FILES || {};
  const TERM_FILE_TEXT = {
    '~/子午线笔记.txt': '太阳离开后，山脊仍会保留十一分钟的颜色。\n将光圈保持在 f/2.8。信号藏在安静里，而不是光线里。',
    '~/.zshrc': '# AISniperOS 终端\nexport AISNIPER_MODE=precision\nalias focus="open game"',
    '~/说明.md': '# AISniperOS\n\n专注，凝练。\n为精确思考而生的浏览器原生环境。',
    '~/项目/笔记.md': '# 项目\n\nAperture — 界面研究。\n子午线观测站 — 视觉识别。\n深空信号 — 三维飞行测试。',
    '~/项目/子午线观测站/现场笔记.txt': '下一趟：06:42。带上长焦镜头和保温杯。',
    '~/项目/深空信号/飞控笔记.md': '让准星保持轻盈。深空已经足够黑暗。',
    '~/文稿/共享/子午线团队.txt': '09:30 开会。带上联系印样和山脊地平线画面。',
    '~/运维脚本/部署宝塔面板.sh': '#!/bin/zsh\n# 创建宝塔面板演示容器\ndeploy baota --port 8888 --operator sniper\nopen ops',
    '~/运维脚本/启动Nginx容器.sh': '#!/bin/zsh\ndocker run nginx --port 8080:80\necho "容器已启动"',
    '~/运维脚本/系统巡检.sh': '#!/bin/zsh\necho "AISniper 节点巡检"\nstatus\ndocker ps',
    '~/运维脚本/运维说明.txt': '双击任意 .sh 脚本即可在终端中执行。\n终端命令：deploy baota、docker ps、bt、panel。',
    '~/截图/.keep': '',
    '~/项目/Aperture/界面设计.fig': 'AISniper Aperture 设计稿（模拟二进制文件）',
    '~/项目/Aperture/设计原则.pdf': 'AISniper 设计原则：精确、克制、清晰。',
    '~/项目/子午线观测站/地平线.heic': 'HEIC 图像数据 · 4032 × 3024 · AISniper Ridge',
    '~/项目/深空信号/深空引擎.scene': 'VOID SIGNAL scene descriptor\nengine: AISniper Orbit 2.4',
    '~/文稿/设计原则.pdf': 'AISniper 设计原则：让界面退后，让内容靠前。',
    '~/文稿/品牌交接.pdf': '品牌交接清单 · Aperture / 子午线观测站',
    '~/截图/山脊站.png': 'PNG 图像数据 · 3840 × 2160',
    '~/截图/子午线黄昏.heic': 'HEIC 图像数据 · 4032 × 3024',
    '~/截图/轨道海报.png': 'PNG 图像数据 · 2560 × 1440'
  };
  const TERM_ENV = {
    USER: 'sniper',
    HOME: '/home/sniper',
    SHELL: '/bin/bash',
    PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
    LANG: 'zh_CN.UTF-8',
    TERM: 'xterm-256color',
    HOSTNAME: 'aisniper',
    PWD: '/home/sniper',
    OLDPWD: '/home/sniper',
    EDITOR: 'vim',
    XDG_SESSION_TYPE: 'tty',
    UMASK: '0022'
  };
  const TERM_INSTALLED = new Set(['bash', 'coreutils', 'curl', 'git', 'nginx', 'openssh-server', 'python3', 'vim', 'htop']);
  const TERM_SERVICES = new Map([
    ['nginx', { active: true, description: 'AISniper edge proxy' }],
    ['ssh', { active: true, description: 'OpenBSD Secure Shell server' }],
    ['docker', { active: true, description: 'Docker Application Container Engine' }],
    ['aisniper-agent', { active: true, description: 'AISniper local agent' }],
    ['baota', { active: false, description: 'Baota panel demo container' }]
  ]);
  const defaultTerminalCwd = '~';
  let terminalCwd = '~';
  let terminalPreviousCwd = '~';
  let terminalCommandHistory = [];
  let terminalHistoryIndex = 0;
  let terminalReady = false;
  let lastOutputText = '';
  let terminalCaptureBuffer = null;
  let terminalAliases = { ...TERM_ALIASES };
  let terminalCatastropheRunning = false;
  let terminalSudoDepth = 0;
  let terminalJobs = [];

  function termPromptPath() {
    return `sniper@aisniper:${terminalCwd}`;
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
    if (terminalCaptureBuffer) {
      const text = element.textContent || element.innerHTML.replace(/<[^>]*>/g, '');
      terminalCaptureBuffer.push(String(text).replace(/\s+$/, ''));
      return;
    }
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
    symbol.textContent = '$';
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
    terminalHTML('<span class="term-signal">AISniperOS 26.1.4 LTS</span> <span class="term-muted">GNU/Linux 6.8.0-aisniper aarch64 · tty1</span>');
    terminalPrint(`上次登录：${stamp} · ttys001`, 'term-line term-muted');
    terminalHTML('输入 <span class="term-key">help</span> 查看完整命令索引，<span class="term-key">man &lt;命令&gt;</span> 查看手册，<span class="term-key">neofetch</span> 查看系统卡片。');
    terminalHTML('<div class="term-rule">快速开始</div>');
    const hints = document.createElement('div');
    hints.className = 'term-hint-row';
    [['帮助', 'help'], ['详细列表', 'ls -la'], ['手册', 'man rm'], ['部署宝塔', 'deploy baota'], ['容器列表', 'docker ps'], ['打开 Steam', 'steam'], ['系统巡检', 'status'], ['系统卡片', 'neofetch']].forEach(([label, command]) => {
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
    terminalPreviousCwd = defaultTerminalCwd;
    terminalCommandHistory = [];
    terminalHistoryIndex = 0;
    terminalReady = false;
    terminalAliases = { ...TERM_ALIASES };
    TERM_ENV.PWD = '/home/sniper';
    TERM_ENV.OLDPWD = '/home/sniper';
    terminalIntro(true);
    updateTerminalPrompt();
    $('#terminalInput')?.focus();
  }

  function termCollapsePath(path) {
    const home = path === '~' || path.startsWith('~/');
    const absolute = !home && path.startsWith('/');
    const body = home ? path.slice(1) : path;
    const stack = [];
    body.split('/').forEach((part) => {
      if (!part || part === '.') return;
      if (part === '..') {
        if (stack.length && stack[stack.length - 1] !== '..') stack.pop();
        else if (!absolute && !home) stack.push('..');
        return;
      }
      stack.push(part);
    });
    if (home) return stack.length ? `~/${stack.join('/')}` : '~';
    return `/${stack.join('/')}`;
  }

  function terminalResolvePath(input) {
    if (!input || input === '.') return terminalCwd;
    if (input === '~') return '~';
    let path;
    if (input.startsWith('~/') || input.startsWith('/')) path = input;
    else path = `${terminalCwd === '/' ? '' : terminalCwd}/${input}`;
    if (path === '/home/sniper') return '~';
    if (path.startsWith('/home/sniper/')) path = `~/${path.slice('/home/sniper/'.length)}`;
    if (input === '..' && terminalCwd === '~') return '/home';
    return termCollapsePath(path);
  }

  function termAbsolutePath(path) {
    if (path === '~') return '/home/sniper';
    if (path.startsWith('~/')) return `/home/sniper/${path.slice(2)}`;
    return path;
  }

  function termJoin(base, name) {
    return base === '/' ? `/${name}` : `${base}/${name}`;
  }

  function termBaseName(path) {
    if (path === '/' || path === '~') return path;
    return path.split('/').pop() || '/';
  }

  function termParentPath(path) {
    if (path === '~') return '/home';
    if (path === '/') return '/';
    const index = path.lastIndexOf('/');
    if (index <= 0) return '/';
    return path.slice(0, index) || '/';
  }

  function termEntry(path) {
    if (path === '~' || path.startsWith('~/')) return TERM_FS[path] || null;
    return TERM_SYSTEM_FS[path] || null;
  }

  function termFileExists(path) {
    if (path === '~' || path === '/') return false;
    const parent = termEntry(termParentPath(path));
    return Boolean(parent && parent.files.includes(termBaseName(path)));
  }

  function termCanWrite(path) {
    return path === '~' || path.startsWith('~/');
  }

  function termReadFile(path) {
    if (path === '/etc/shadow') return { error: '权限不够' };
    if (!termFileExists(path)) {
      if (termEntry(path)) return { error: '是一个目录' };
      return { error: '没有那个文件或目录' };
    }
    if (Object.prototype.hasOwnProperty.call(TERM_SYSTEM_FILES, path)) return { text: TERM_SYSTEM_FILES[path] };
    if (Object.prototype.hasOwnProperty.call(TERM_FILE_TEXT, path)) return { text: TERM_FILE_TEXT[path] };
    return { text: `AISniper 档案条目：${termBaseName(path)}` };
  }

  function termWriteFile(path, text = '') {
    if (!termCanWrite(path)) return false;
    const parentPath = termParentPath(path);
    const parent = termEntry(parentPath);
    if (!parent) return false;
    const name = termBaseName(path);
    if (!parent.files.includes(name)) parent.files.push(name);
    TERM_FILE_TEXT[path] = String(text);
    return true;
  }

  function termRemovePath(path, recursive = false) {
    if (!termCanWrite(path) || path === '~') return false;
    const parent = termEntry(termParentPath(path));
    const name = termBaseName(path);
    const entry = termEntry(path);
    if (!parent) return false;
    if (parent.dirs.includes(name)) {
      if (entry && (entry.dirs.length || entry.files.length) && !recursive) return false;
      parent.dirs = parent.dirs.filter((dir) => dir !== name);
      Object.keys(TERM_FS).forEach((key) => {
        if (key === path || key.startsWith(`${path}/`)) delete TERM_FS[key];
      });
      Object.keys(TERM_FILE_TEXT).forEach((key) => {
        if (key.startsWith(`${path}/`)) delete TERM_FILE_TEXT[key];
      });
      return true;
    }
    if (parent.files.includes(name)) {
      parent.files = parent.files.filter((file) => file !== name);
      delete TERM_FILE_TEXT[path];
      return true;
    }
    return false;
  }

  function termAllPaths() {
    const paths = [];
    Object.entries(TERM_SYSTEM_FS).forEach(([path, entry]) => {
      entry.dirs.forEach((dir) => paths.push(`${path === '/' ? '' : path}/${dir}`));
      entry.files.forEach((file) => paths.push(`${path === '/' ? '' : path}/${file}`));
    });
    Object.entries(TERM_FS).forEach(([path, entry]) => {
      entry.dirs.forEach((dir) => paths.push(`${path}/${dir}`));
      entry.files.forEach((file) => paths.push(`${path}/${file}`));
    });
    return [...new Set(paths)];
  }

  function termFindDir(path) {
    return Boolean(termEntry(path));
  }

  function termRelativePath(path) {
    if (path.startsWith('~/')) return path.slice(2);
    if (path.startsWith('/')) return path;
    return path;
  }

  function termSplit(argument) {
    if (typeof LINUX.splitCommand === 'function') return LINUX.splitCommand(argument);
    return String(argument || '').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((token) => token.replace(/^["']|["']$/g, '')) || [];
  }

  function termHumanSize(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)}K`;
    if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}M`;
    return `${(value / 1024 / 1024 / 1024).toFixed(1)}G`;
  }

  function termFileSize(path) {
    const read = termReadFile(path);
    if (!read.error) return new TextEncoder().encode(read.text).length;
    const name = termBaseName(path);
    if (/\.(heic|png|jpg|jpeg)$/i.test(name)) return 1_840_000;
    if (/\.(pdf|fig)$/i.test(name)) return 426_000;
    if (/\.(scene|zip|tar|gz)$/i.test(name)) return 2_400_000;
    return 1024;
  }

  function termPermission(path, isDir) {
    if (isDir) return 'drwxr-xr-x';
    const name = termBaseName(path);
    if (/\.(sh|command)$/i.test(name)) return '-rwxr-xr-x';
    if (name.startsWith('.')) return '-rw-------';
    return '-rw-r--r--';
  }

  function termLsLongLine(path, isDir) {
    const name = termBaseName(path);
    const command = `cd "${path}"`;
    const label = isDir
      ? `<button class="term-dir" data-command="${escapeHTML(command)}">${escapeHTML(name)}/</button>`
      : `<span class="term-file">${escapeHTML(name)}</span>`;
    return `<div><span class="perm">${termPermission(path, isDir)}</span><span class="meta">${isDir ? '2' : '1'}</span><span class="meta">sniper sniper</span><span class="size">${isDir ? '4.0K' : termHumanSize(termFileSize(path))}</span>${label}</div>`;
  }

  function termGlobToRegExp(pattern) {
    const escaped = String(pattern || '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i');
  }

  function termEnsureDir(path, parents = false) {
    if (path === '~' || path === '/') return { ok: true };
    if (!termCanWrite(path)) return { error: '只读文件系统' };
    if (termFileExists(path)) return { error: '文件已存在' };
    if (termEntry(path)) return { error: '目录已存在' };
    const parentPath = termParentPath(path);
    if (!termEntry(parentPath)) {
      if (!parents) return { error: '没有那个文件或目录' };
      const parentResult = termEnsureDir(parentPath, true);
      if (parentResult.error) return parentResult;
    }
    termEntry(parentPath).dirs.push(termBaseName(path));
    TERM_FS[path] = { dirs: [], files: [] };
    return { ok: true };
  }

  function termCopyTree(source, target, recursive = false) {
    if (target === source || target.startsWith(`${source}/`)) return { error: '无法复制到其自身内部' };
    const entry = termEntry(source);
    if (!entry) {
      const read = termReadFile(source);
      if (read.error) return { error: read.error };
      if (!termWriteFile(target, read.text)) return { error: '权限不够' };
      return { ok: true };
    }
    if (!recursive) return { error: '是一个目录' };
    const mkdir = termEnsureDir(target, true);
    if (mkdir.error && mkdir.error !== '目录已存在') return mkdir;
    let firstError = null;
    entry.dirs.forEach((dir) => {
      const result = termCopyTree(termJoin(source, dir), termJoin(target, dir), true);
      if (result.error && !firstError) firstError = result;
    });
    entry.files.forEach((file) => {
      const read = termReadFile(termJoin(source, file));
      if (!read.error) termWriteFile(termJoin(target, file), read.text);
    });
    return firstError || { ok: true };
  }

  function termPathType(path) {
    if (termEntry(path)) return 'directory';
    if (termFileExists(path)) return 'file';
    return 'missing';
  }

  function terminalCommandMan(command) {
    const name = String(command || '').trim().toLowerCase();
    if (!name) {
      terminalHTML('<span class="term-warn">用法：man &lt;命令&gt;</span> <span class="term-muted">例如 man rm、man systemctl、man apt</span>');
      return;
    }
    const page = (LINUX.MAN_PAGES || {})[name];
    const info = (LINUX.HELP_INDEX || {})[name];
    if (!page && !info) {
      terminalHTML(`<span class="term-error">没有 ${escapeHTML(name)} 的手册页。</span> <span class="term-muted">试试 apropos ${escapeHTML(name)} 或 help。</span>`);
      return;
    }
    const summary = page?.summary || info?.description || 'AISniperOS 内置命令';
    const synopsis = page?.synopsis || `${name} [参数]`;
    terminalHTML(`<div class="term-rule">${escapeHTML(name.toUpperCase())}(1) — ${escapeHTML(summary)}</div>`);
    terminalHTML(`<span class="term-muted">NAME</span><br>&nbsp;&nbsp;${escapeHTML(name)} — ${escapeHTML(summary)}`);
    terminalHTML(`<span class="term-muted">SYNOPSIS</span><pre class="term-pre">${escapeHTML(synopsis)}</pre>`);
    terminalHTML(`<span class="term-muted">DESCRIPTION</span><br>&nbsp;&nbsp;${escapeHTML(page?.description || `${info?.description || summary}。该命令属于“${info?.group || 'AISniperOS'}”分类。`)}`);
    if (page?.options?.length) {
      terminalHTML('<span class="term-muted">OPTIONS</span>');
      page.options.forEach(([flag, text]) => terminalHTML(`<span class="term-help-command">${escapeHTML(flag)}</span><span class="term-help-desc">${escapeHTML(text)}</span>`, 'term-help-row'));
    }
    terminalHTML(`<span class="term-muted">AISniperOS 26.1.4 LTS</span> <span class="term-muted">·</span> <span class="term-muted">${new Date().toLocaleDateString('zh-CN')}</span>`);
  }

  function terminalCommandHelp(argument) {
    if (argument) {
      terminalCommandMan(argument.split(/\s+/)[0]);
      return;
    }
    const groups = LINUX.HELP_GROUPS || [];
    terminalPrint('AISniperOS GNU/Linux 内置命令索引 · 输入 man <命令> 查看详细手册', 'term-line term-muted');
    groups.forEach((group) => {
      terminalHTML(`<div class="term-rule">${escapeHTML(group.title)}</div>`);
      group.items.forEach(([command, description]) => {
        terminalHTML(`<span class="term-help-command">${escapeHTML(command)}</span><span class="term-help-desc">${escapeHTML(description)}</span>`, 'term-help-row');
      });
    });
    terminalHTML('<div class="term-rule">提示</div>');
    terminalHTML('<span class="term-muted">支持别名、<span class="term-key">sudo</span>、<span class="term-key">Tab</span> 补全与命令历史。危险操作会真的删除这个模拟系统中的数据——包括全部存档。</span>');
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
    const html = `<div class="term-neofetch"><div class="term-ascii">${escapeHTML(ascii).replace('AISNIPER', '<span class="accent-text">AISNIPER</span>')}</div><div class="term-neofetch-info"><div><b>系统</b>AISniperOS 26.1.4 天鹰座</div><div><b>主机</b>AISniper M1 · 神经核心</div><div><b>用户</b>sniper · 管理员</div><div><b>终端</b>bash 5.2.37</div><div><b>内核</b>6.8.0-aisniper aarch64</div><div><b>显示</b>液态视网膜 · 3024 × 1964</div><div><b>主题</b>${({ light: '浅色', dark: '深色' })[resolvedTheme()]} / ${({ solar: '暖阳', signal: '信号', iris: '鸢尾', ember: '余烬' })[state.accent]}</div><div><b>内存</b>${Math.round(health.memory)}% / 24 GB</div><div><b>运行时间</b>${$('#settingsUptime')?.textContent || '00:00:00'}</div><div><b>网络</b><span class="term-success">● 以太网 1 Gbps</span> <span class="term-muted">/ Wi-Fi ${state.wifi ? '开启' : '关闭'}</span></div><div><b>服务</b>${opsController?.getState?.().deployed ? '<span class="term-success">宝塔面板在线</span>' : '<span class="term-muted">本地运维未部署</span>'}</div></div></div>`;
    terminalHTML(html);
  }

  function terminalCommandStatus() {
    terminalHTML(`<div class="term-rule">系统遥测</div><div class="term-telemetry"><div><span>CPU</span><b>${Math.round(health.cpu)}%</b><i><em style="width:${Math.round(health.cpu)}%"></em></i></div><div><span>内存</span><b>${Math.round(health.memory)}%</b><i><em style="width:${Math.round(health.memory)}%"></em></i></div><div><span>GPU</span><b>${Math.round(health.gpu)}%</b><i><em style="width:${Math.round(health.gpu)}%"></em></i></div><div><span>健康度</span><b class="term-success">${health.score} · 优秀</b></div><div><span>网络</span><b>以太网 · 1000 Mbps · DHCP</b></div><div><span>无线</span><b>${state.wifi ? `${escapeHTML(state.wifiNetwork)} · WPA3` : '可选 · 已关闭'}</b></div></div>`);
  }

  function terminalCommandLs(argument) {
    const tokens = termSplit(argument);
    const options = { all: false, long: false, human: false, recursive: false };
    const paths = [];
    tokens.forEach((token) => {
      if (token === '--') return;
      if (/^--/.test(token)) {
        if (token === '--all') options.all = true;
        if (token === '--long') options.long = true;
        if (token === '--human-readable') options.human = true;
        if (token === '--recursive') options.recursive = true;
        return;
      }
      if (/^-[a-zA-Z]+$/.test(token)) {
        if (token.includes('a')) options.all = true;
        if (token.includes('l')) options.long = true;
        if (token.includes('h')) options.human = true;
        if (token.includes('R')) options.recursive = true;
        return;
      }
      paths.push(token);
    });
    const requested = paths[0] || '.';
    const target = terminalResolvePath(requested);
    const entry = termEntry(target);
    if (!entry) {
      terminalHTML(`<span class="term-error">ls: 无法访问 '${escapeHTML(requested)}': 没有那个文件或目录</span>`);
      return;
    }
    if (termFileExists(target)) {
      terminalHTML(`<div class="term-ls-grid"><span class="term-file">${escapeHTML(termBaseName(target))}</span></div>`);
      lastOutputText = termBaseName(target);
      return;
    }
    const plain = [];
    const render = (dirPath, dirEntry, header = '') => {
      if (header) terminalHTML(`<div class="term-rule">${escapeHTML(header)}</div>`);
      let dirs = [...dirEntry.dirs];
      let files = [...dirEntry.files];
      if (!options.all) files = files.filter((file) => !file.startsWith('.'));
      plain.push(...dirs.map((dir) => `${dir}/`), ...files);
      if (options.long) {
        const total = files.reduce((sum, file) => sum + termFileSize(termJoin(dirPath, file)), 0);
        const rows = [`<div class="is-total">总用量 ${termHumanSize(Math.ceil(total / 1024) * 1024)}</div>`];
        dirs.forEach((dir) => rows.push(termLsLongLine(termJoin(dirPath, dir), true)));
        files.forEach((file) => rows.push(termLsLongLine(termJoin(dirPath, file), false)));
        terminalHTML(`<div class="term-ls-long">${rows.join('')}</div>`);
      } else {
        const parts = [];
        dirs.forEach((dir) => parts.push(`<button class="term-dir" data-command="cd &quot;${escapeHTML(termJoin(dirPath, dir))}&quot;">${escapeHTML(dir)}/</button>`));
        files.forEach((file) => parts.push(`<span class="term-file">${escapeHTML(file)}</span>`));
        terminalHTML(`<div class="term-ls-grid">${parts.join('')}</div>`);
      }
      if (options.recursive) {
        dirs.forEach((dir) => {
          const childPath = termJoin(dirPath, dir);
          const child = termEntry(childPath);
          if (child) render(childPath, child, childPath);
        });
      }
    };
    render(target, entry);
    lastOutputText = plain.join('  ');
  }

  function terminalCommandCd(argument) {
    const tokens = termSplit(argument);
    const requested = tokens[0] || '~';
    if (requested === '-') {
      const target = terminalPreviousCwd;
      terminalPreviousCwd = terminalCwd;
      terminalCwd = target;
      TERM_ENV.OLDPWD = TERM_ENV.PWD;
      TERM_ENV.PWD = termAbsolutePath(target);
      updateTerminalPrompt();
      terminalPrint(termAbsolutePath(target));
      return;
    }
    const path = terminalResolvePath(requested);
    if (termFileExists(path)) {
      terminalHTML(`<span class="term-error">cd: ${escapeHTML(requested)}: 不是目录</span>`);
      return;
    }
    if (!termEntry(path)) {
      terminalHTML(`<span class="term-error">cd: ${escapeHTML(requested)}: 没有那个文件或目录</span>`);
      return;
    }
    terminalPreviousCwd = terminalCwd;
    terminalCwd = path;
    TERM_ENV.OLDPWD = TERM_ENV.PWD;
    TERM_ENV.PWD = termAbsolutePath(path);
    updateTerminalPrompt();
  }

  function terminalCommandCat(argument) {
    const tokens = termSplit(argument);
    const numbered = tokens.includes('-n');
    const paths = tokens.filter((token) => token !== '-n' && !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML('<span class="term-warn">cat: 缺少文件操作数</span> <span class="term-muted">用法：cat [-n] &lt;文件&gt;...</span>');
      return;
    }
    let lineNumber = 1;
    let combined = '';
    paths.forEach((requested) => {
      const path = terminalResolvePath(requested);
      const read = termReadFile(path);
      if (read.error) {
        terminalHTML(`<span class="term-error">cat: ${escapeHTML(requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const content = read.text;
      const rendered = numbered
        ? content.split('\n').map((line, index, lines) => (index === lines.length - 1 && line === '') ? '' : `${String(lineNumber++).padStart(6, ' ')}\t${line}`).join('\n')
        : content;
      combined += rendered;
      terminalHTML(`<pre class="term-cat">${escapeHTML(rendered || ' ')}</pre>`);
    });
    lastOutputText = combined;
  }

  function terminalCommandTouch(argument) {
    const paths = termSplit(argument).filter((token) => !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML('<span class="term-warn">touch: 缺少文件操作数</span>');
      return;
    }
    paths.forEach((requested) => {
      const path = terminalResolvePath(requested);
      if (termEntry(path)) {
        terminalHTML(`<span class="term-error">touch: 无法创建 '${escapeHTML(requested)}': 是一个目录</span>`);
        return;
      }
      if (!termFileExists(path) && !termWriteFile(path, '')) {
        terminalHTML(`<span class="term-error">touch: 无法创建 '${escapeHTML(requested)}': 权限不够</span>`);
      }
    });
  }

  function terminalCommandMkdir(argument) {
    const tokens = termSplit(argument);
    const parents = tokens.includes('-p') || tokens.includes('--parents');
    const paths = tokens.filter((token) => !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML('<span class="term-warn">mkdir: 缺少操作数</span>');
      return;
    }
    paths.forEach((requested) => {
      const result = termEnsureDir(terminalResolvePath(requested), parents);
      if (result.error) terminalHTML(`<span class="term-error">mkdir: 无法创建目录 '${escapeHTML(requested)}': ${escapeHTML(result.error)}</span>`);
    });
  }

  function terminalCommandRmdir(argument) {
    const paths = termSplit(argument).filter((token) => !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML('<span class="term-warn">rmdir: 缺少操作数</span>');
      return;
    }
    paths.forEach((requested) => {
      const path = terminalResolvePath(requested);
      if (!termEntry(path)) {
        terminalHTML(`<span class="term-error">rmdir: 无法删除 '${escapeHTML(requested)}': 没有那个文件或目录</span>`);
      } else if (termRemovePath(path, false)) {
        terminalHTML(`<span class="term-muted">已删除目录 '${escapeHTML(requested)}'</span>`);
      } else {
        terminalHTML(`<span class="term-error">rmdir: 无法删除 '${escapeHTML(requested)}': 目录非空</span>`);
      }
    });
  }

  function terminalCommandRm(argument) {
    const tokens = termSplit(argument);
    let recursive = false;
    let force = false;
    let verbose = false;
    const paths = [];
    tokens.forEach((token) => {
      if (token === '--recursive') recursive = true;
      else if (token === '--force') force = true;
      else if (token === '--verbose') verbose = true;
      else if (/^-[a-zA-Z]+$/.test(token)) {
        if (token.includes('r') || token.includes('R') || token.includes('d')) recursive = true;
        if (token.includes('f')) force = true;
        if (token.includes('v')) verbose = true;
      } else paths.push(token);
    });
    if (!paths.length) {
      if (!force) terminalHTML('<span class="term-warn">rm: 缺少操作数</span>');
      return;
    }
    paths.forEach((requested) => {
      const path = terminalResolvePath(requested);
      const type = termPathType(path);
      if (type === 'missing') {
        if (!force) terminalHTML(`<span class="term-error">rm: 无法删除 '${escapeHTML(requested)}': 没有那个文件或目录</span>`);
        return;
      }
      if (!termCanWrite(path)) {
        terminalHTML(`<span class="term-error">rm: 无法删除 '${escapeHTML(requested)}': 权限不够</span>`);
        return;
      }
      if (type === 'directory' && !recursive) {
        terminalHTML(`<span class="term-error">rm: 无法删除 '${escapeHTML(requested)}': 是一个目录</span>`);
        return;
      }
      if (!termRemovePath(path, recursive)) {
        terminalHTML(`<span class="term-error">rm: 无法删除 '${escapeHTML(requested)}': 目录非空或权限不够</span>`);
        return;
      }
      if (verbose) terminalPrint(`已删除 '${requested}'`, 'term-line term-muted');
    });
  }

  function terminalCommandCp(argument) {
    const tokens = termSplit(argument);
    const recursive = tokens.some((token) => /^-[a-zA-Z]*[rR]/.test(token) || token === '--recursive');
    const paths = tokens.filter((token) => !token.startsWith('-'));
    if (paths.length < 2) {
      terminalHTML('<span class="term-warn">cp: 缺少文件操作数</span> <span class="term-muted">用法：cp [-r] &lt;源&gt; &lt;目标&gt;</span>');
      return;
    }
    const source = terminalResolvePath(paths[0]);
    let destination = terminalResolvePath(paths[1]);
    if (termEntry(destination)) destination = termJoin(destination, termBaseName(source));
    const sourceType = termPathType(source);
    if (sourceType === 'missing') {
      terminalHTML(`<span class="term-error">cp: 无法获取 '${escapeHTML(paths[0])}' 的状态: 没有那个文件或目录</span>`);
      return;
    }
    if (sourceType === 'file') {
      const read = termReadFile(source);
      if (read.error || !termWriteFile(destination, read.text)) {
        terminalHTML(`<span class="term-error">cp: 无法创建 '${escapeHTML(paths[1])}': 权限不够</span>`);
      }
      return;
    }
    const result = termCopyTree(source, destination, recursive);
    if (result.error) terminalHTML(`<span class="term-error">cp: 无法复制 '${escapeHTML(paths[0])}': ${escapeHTML(result.error)}</span>`);
  }

  function terminalCommandMv(argument) {
    const paths = termSplit(argument).filter((token) => !token.startsWith('-'));
    if (paths.length < 2) {
      terminalHTML('<span class="term-warn">mv: 缺少文件操作数</span> <span class="term-muted">用法：mv &lt;源&gt; &lt;目标&gt;</span>');
      return;
    }
    const source = terminalResolvePath(paths[0]);
    let destination = terminalResolvePath(paths[1]);
    const sourceType = termPathType(source);
    if (sourceType === 'missing') {
      terminalHTML(`<span class="term-error">mv: 无法获取 '${escapeHTML(paths[0])}' 的状态: 没有那个文件或目录</span>`);
      return;
    }
    if (!termCanWrite(source)) {
      terminalHTML(`<span class="term-error">mv: 无法移动 '${escapeHTML(paths[0])}': 权限不够</span>`);
      return;
    }
    if (termEntry(destination)) destination = termJoin(destination, termBaseName(source));
    if (sourceType === 'file') {
      const read = termReadFile(source);
      if (read.error || !termWriteFile(destination, read.text)) {
        terminalHTML(`<span class="term-error">mv: 无法创建 '${escapeHTML(paths[1])}': 权限不够</span>`);
        return;
      }
    } else {
      const result = termCopyTree(source, destination, true);
      if (result.error) {
        terminalHTML(`<span class="term-error">mv: 无法移动 '${escapeHTML(paths[0])}': ${escapeHTML(result.error)}</span>`);
        return;
      }
    }
    termRemovePath(source, true);
  }

  function terminalCommandLn(argument) {
    const tokens = termSplit(argument);
    const symbolic = tokens.some((token) => token === '-s' || token === '--symbolic');
    const paths = tokens.filter((token) => !token.startsWith('-'));
    if (paths.length < 2) {
      terminalHTML('<span class="term-warn">ln: 缺少文件操作数</span> <span class="term-muted">用法：ln -s &lt;目标&gt; &lt;链接名&gt;</span>');
      return;
    }
    const target = terminalResolvePath(paths[0]);
    const link = terminalResolvePath(paths[1]);
    if (termPathType(target) === 'missing') {
      terminalHTML(`<span class="term-error">ln: 无法创建链接 '${escapeHTML(paths[1])}': 目标不存在</span>`);
      return;
    }
    if (!termWriteFile(link, symbolic ? `symlink -> ${target}` : `hardlink -> ${target}`)) {
      terminalHTML(`<span class="term-error">ln: 无法创建链接 '${escapeHTML(paths[1])}': 权限不够</span>`);
    }
  }

  function terminalCommandFind(argument) {
    const tokens = termSplit(argument);
    let root = '.';
    let namePattern = '*';
    let type = '';
    let index = 0;
    if (tokens[0] && !tokens[0].startsWith('-')) {
      root = tokens[0];
      index = 1;
    }
    for (; index < tokens.length; index += 1) {
      if (tokens[index] === '-name' || tokens[index] === '-iname') namePattern = tokens[index + 1] || '*';
      if (tokens[index] === '-type') type = tokens[index + 1] || '';
      if (tokens[index] === '-name' || tokens[index] === '-type') index += 1;
    }
    const base = terminalResolvePath(root);
    if (!termEntry(base)) {
      terminalHTML(`<span class="term-error">find: '${escapeHTML(root)}': 没有那个文件或目录</span>`);
      return;
    }
    const matcher = termGlobToRegExp(namePattern);
    const results = termAllPaths().filter((path) => {
      const under = base === '/' ? true : path === base || path.startsWith(`${base}/`);
      if (!under) return false;
      if (type === 'f' && termEntry(path)) return false;
      if (type === 'd' && !termEntry(path)) return false;
      return matcher.test(termBaseName(path));
    });
    if (!results.length) {
      terminalPrint(`find: 未找到匹配 '${namePattern}' 的条目`, 'term-line term-muted');
      return;
    }
    results.forEach((path) => terminalPrint(path, 'term-line'));
    lastOutputText = results.join('\n');
  }

  function terminalCommandTree(argument) {
    const requested = termSplit(argument).find((token) => !token.startsWith('-')) || '.';
    const rootPath = terminalResolvePath(requested);
    const rootEntry = termEntry(rootPath);
    if (!rootEntry) {
      terminalHTML(`<span class="term-error">tree: ${escapeHTML(requested)}: 没有那个目录</span>`);
      return;
    }
    const lines = [termBaseName(rootPath) === '~' ? '~' : termBaseName(rootPath) || '/'];
    let directories = 0;
    let files = 0;
    const walk = (path, entry, prefix, depth) => {
      if (depth > 7) return;
      const dirs = [...entry.dirs].sort();
      const names = [...entry.files].sort();
      dirs.forEach((dir, index) => {
        const last = index === dirs.length - 1 && !names.length;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${dir}/`);
        directories += 1;
        const child = termEntry(termJoin(path, dir));
        if (child) walk(termJoin(path, dir), child, `${prefix}${last ? '    ' : '│   '}`, depth + 1);
      });
      names.forEach((file, index) => {
        const last = index === names.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${file}`);
        files += 1;
      });
    };
    walk(rootPath, rootEntry, '', 0);
    terminalHTML(`<pre class="term-pre term-tree-pre">${escapeHTML(lines.join('\n'))}</pre>`);
    terminalPrint(`${directories} 个目录，${files} 个文件`, 'term-line term-muted');
    lastOutputText = lines.join('\n');
  }

  function terminalCommandStat(argument) {
    const requested = termSplit(argument).find((token) => !token.startsWith('-'));
    if (!requested) {
      terminalHTML('<span class="term-warn">stat: 缺少操作数</span>');
      return;
    }
    const path = terminalResolvePath(requested);
    const type = termPathType(path);
    if (type === 'missing') {
      terminalHTML(`<span class="term-error">stat: 无法获取 '${escapeHTML(requested)}' 的状态: 没有那个文件或目录</span>`);
      return;
    }
    const isDir = type === 'directory';
    const size = isDir ? 4096 : termFileSize(path);
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const fields = [
      ['文件', `${escapeHTML(requested)}`],
      ['大小', `${size}\t块：${Math.ceil(size / 512)}\tIO 块：4096\t${isDir ? '目录' : '普通文件'}`],
      ['设备', '179,2\tInode：1844674\t硬链接：1'],
      ['权限', `${termPermission(path, isDir)} (${isDir ? '0755' : '0644'})  Uid：(1000/sniper)  Gid：(1000/sniper)`],
      ['访问时间', now],
      ['修改时间', now],
      ['更改时间', now],
      ['创建时间', now]
    ];
    terminalHTML(`<div class="term-kv">${fields.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join('')}</div>`);
  }

  function terminalCommandFileInfo(argument) {
    const paths = termSplit(argument).filter((token) => !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML('<span class="term-warn">file: 缺少操作数</span>');
      return;
    }
    paths.forEach((requested) => {
      const path = terminalResolvePath(requested);
      const type = termPathType(path);
      if (type === 'missing') {
        terminalHTML(`<span class="term-error">file: 无法打开 '${escapeHTML(requested)}' (没有那个文件或目录)</span>`);
        return;
      }
      let description;
      if (type === 'directory') description = 'directory';
      else if (/\.sh$/i.test(path)) description = 'Bourne-Again shell script, ASCII text executable';
      else if (/\.(md|txt|conf|log|passwd|hosts|release)$/i.test(path)) description = 'UTF-8 Unicode text';
      else if (/\.(png)$/i.test(path)) description = 'PNG image data, 3840 x 2160, 8-bit/color RGBA';
      else if (/\.(heic)$/i.test(path)) description = 'HEIF image data, 4032 x 3024';
      else if (/\.(pdf)$/i.test(path)) description = 'PDF document, version 1.7';
      else if (/\.(zip)$/i.test(path)) description = 'Zip archive data, at least v2.0 to extract';
      else if (/\.(gz|tgz)$/i.test(path)) description = 'gzip compressed data';
      else if (/\.(scene)$/i.test(path)) description = 'AISniper Orbit scene descriptor, UTF-8 text';
      else description = 'ASCII text';
      terminalHTML(`<span class="term-file">${escapeHTML(requested)}</span><span class="term-muted">: ${escapeHTML(description)}</span>`, 'term-line');
    });
  }

  function terminalPathSize(path) {
    const entry = termEntry(path);
    if (!entry) return termFileSize(path);
    return 4096 + entry.files.reduce((sum, file) => sum + terminalPathSize(termJoin(path, file)), 0) + entry.dirs.reduce((sum, dir) => sum + terminalPathSize(termJoin(path, dir)), 0);
  }

  function terminalCommandDu(argument) {
    const tokens = termSplit(argument);
    const summary = tokens.some((token) => /^-[a-zA-Z]*s/.test(token));
    const human = tokens.some((token) => /^-[a-zA-Z]*h/.test(token));
    const paths = tokens.filter((token) => !token.startsWith('-'));
    const targets = paths.length ? paths : ['.'];
    targets.forEach((requested) => {
      const path = terminalResolvePath(requested);
      if (termPathType(path) === 'missing') {
        terminalHTML(`<span class="term-error">du: 无法访问 '${escapeHTML(requested)}': 没有那个文件或目录</span>`);
        return;
      }
      if (summary || !termEntry(path)) {
        const size = terminalPathSize(path);
        terminalPrint(`${human ? termHumanSize(size).padStart(7) : Math.ceil(size / 1024).toString().padStart(7)}\t${path}`);
        return;
      }
      const entry = termEntry(path);
      const walk = (dirPath, dirEntry) => {
        dirEntry.dirs.forEach((dir) => {
          const childPath = termJoin(dirPath, dir);
          const child = termEntry(childPath);
          if (child) walk(childPath, child);
        });
        const size = terminalPathSize(dirPath);
        terminalPrint(`${human ? termHumanSize(size).padStart(7) : Math.ceil(size / 1024).toString().padStart(7)}\t${dirPath}`);
      };
      walk(path, entry);
    });
  }

  function terminalCommandDf() {
    const table = [
      '文件系统          容量  已用  可用 已用% 挂载点',
      '/dev/sda1         512G  187G  299G   39% /',
      'tmpfs              12G  1.2G   11G   10% /run',
      '/dev/sdb1          2.0T  1.4T  612G   70% /mnt/vault',
      'vault.local:/vol   4.0T  2.8T  1.2T   70% /mnt/vault',
      'tmpfs             6.0G     0  6.0G    0% /dev/shm'
    ];
    terminalHTML(`<pre class="term-pre">${escapeHTML(table.join('\n'))}</pre>`);
    lastOutputText = table.join('\n');
  }

  function terminalReadTextInput(tokens, flags = []) {
    const paths = tokens.filter((token) => !token.startsWith('-') && !flags.includes(token));
    if (!paths.length) return { text: lastOutputText || '', path: null, requested: '标准输入' };
    const requested = paths[0];
    const path = terminalResolvePath(requested);
    const read = termReadFile(path);
    if (read.error) return { error: read.error, requested };
    return { text: read.text, path, requested };
  }

  function terminalOutputText(text) {
    terminalHTML(`<pre class="term-cat">${escapeHTML(text || ' ')}</pre>`);
    lastOutputText = text;
  }

  function terminalCommandText(command, argument) {
    const tokens = termSplit(argument);
    if (command === 'head' || command === 'tail') {
      let count = 10;
      let index = 0;
      const paths = [];
      while (index < tokens.length) {
        const token = tokens[index];
        if (token === '-n') { count = Number(tokens[index + 1]) || 10; index += 2; continue; }
        if (/^-\d+$/.test(token)) { count = Number(token.slice(1)); index += 1; continue; }
        if (!token.startsWith('-')) paths.push(token);
        index += 1;
      }
      if (!paths.length) {
        terminalHTML(`<span class="term-warn">${command}: 缺少文件操作数</span>`);
        return;
      }
      const read = terminalReadTextInput(paths);
      if (read.error) {
        terminalHTML(`<span class="term-error">${command}: ${escapeHTML(paths[0])}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const lines = read.text.split('\n');
      const selected = command === 'head' ? lines.slice(0, count) : lines.slice(Math.max(0, lines.length - count));
      terminalOutputText(selected.join('\n'));
      return;
    }
    if (command === 'less' || command === 'more') {
      const read = terminalReadTextInput(tokens);
      if (read.error) {
        terminalHTML(`<span class="term-error">${command}: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const lines = read.text.split('\n');
      const visible = lines.slice(0, 120);
      terminalOutputText(visible.join('\n'));
      if (lines.length > visible.length) terminalPrint(`-- 更多 --（共 ${lines.length} 行，模拟分页器只显示前 120 行）`, 'term-line term-muted');
      return;
    }
    if (command === 'wc') {
      const showLines = tokens.includes('-l') || !tokens.some((token) => ['-w', '-c'].includes(token));
      const showWords = tokens.includes('-w') || !tokens.some((token) => ['-l', '-c'].includes(token));
      const showChars = tokens.includes('-c') || !tokens.some((token) => ['-l', '-w'].includes(token));
      const read = terminalReadTextInput(tokens);
      if (read.error) {
        terminalHTML(`<span class="term-error">wc: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const lines = read.text ? read.text.split('\n').length : 0;
      const words = read.text.trim() ? read.text.trim().split(/\s+/).length : 0;
      const chars = new TextEncoder().encode(read.text).length;
      const cells = [];
      if (showLines) cells.push(String(lines).padStart(7));
      if (showWords) cells.push(String(words).padStart(7));
      if (showChars) cells.push(String(chars).padStart(7));
      terminalPrint(`${cells.join('')} ${read.requested}`, 'term-line');
      lastOutputText = `${lines} ${words} ${chars}`;
      return;
    }
    if (command === 'sort') {
      const reverse = tokens.some((token) => /^-[a-zA-Z]*r/.test(token));
      const numeric = tokens.some((token) => /^-[a-zA-Z]*n/.test(token));
      const read = terminalReadTextInput(tokens);
      if (read.error) {
        terminalHTML(`<span class="term-error">sort: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const lines = read.text.split('\n').filter((line, index, all) => line !== '' || index < all.length - 1);
      lines.sort((a, b) => numeric ? (parseFloat(a) || 0) - (parseFloat(b) || 0) : a.localeCompare(b, 'zh-CN'));
      if (reverse) lines.reverse();
      terminalOutputText(lines.join('\n'));
      return;
    }
    if (command === 'uniq') {
      const counts = tokens.includes('-c');
      const read = terminalReadTextInput(tokens);
      if (read.error) {
        terminalHTML(`<span class="term-error">uniq: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const result = [];
      let previous = null;
      let count = 0;
      read.text.split('\n').forEach((line) => {
        if (line === previous) {
          count += 1;
          return;
        }
        if (previous !== null) result.push(counts ? `${String(count).padStart(4)} ${previous}` : previous);
        previous = line;
        count = 1;
      });
      if (previous !== null) result.push(counts ? `${String(count).padStart(4)} ${previous}` : previous);
      terminalOutputText(result.join('\n'));
      return;
    }
    if (command === 'cut') {
      let delimiter = '\t';
      let fields = '1';
      const paths = [];
      for (let index = 0; index < tokens.length; index += 1) {
        if (tokens[index] === '-d' || tokens[index] === '--delimiter') { delimiter = tokens[index + 1] || '\t'; index += 1; }
        else if (tokens[index] === '-f' || tokens[index] === '--fields') { fields = tokens[index + 1] || '1'; index += 1; }
        else if (!tokens[index].startsWith('-')) paths.push(tokens[index]);
      }
      const read = terminalReadTextInput(paths);
      if (read.error) {
        terminalHTML(`<span class="term-error">cut: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const selected = fields.split(',').map((value) => Number(value.split('-')[0]) - 1).filter((value) => value >= 0);
      const output = read.text.split('\n').map((line) => line.split(delimiter).filter((value, index) => selected.includes(index)).join(delimiter)).join('\n');
      terminalOutputText(output);
      return;
    }
    if (command === 'tr') {
      const values = tokens.filter((token) => !token.startsWith('-'));
      if (values.length < 2) {
        terminalHTML('<span class="term-warn">tr: 缺少操作数</span> <span class="term-muted">用法：tr &lt;源字符&gt; &lt;目标字符&gt;</span>');
        return;
      }
      const [from, to] = values;
      let text = lastOutputText;
      if (/^[a-z]-[a-z]$/i.test(from) && /^[a-z]-[a-z]$/i.test(to)) {
        const fromStart = from.charCodeAt(0);
        const fromEnd = from.charCodeAt(2);
        const toStart = to.charCodeAt(0);
        text = [...text].map((char) => {
          const code = char.charCodeAt(0);
          if (code >= fromStart && code <= fromEnd) return String.fromCharCode(toStart + (code - fromStart));
          return char;
        }).join('');
      } else {
        const map = {};
        [...from].forEach((char, index) => { map[char] = to[index] || to[to.length - 1] || ''; });
        text = [...text].map((char) => Object.prototype.hasOwnProperty.call(map, char) ? map[char] : char).join('');
      }
      lastOutputText = text;
      terminalOutputText(text);
      return;
    }
    if (command === 'sed') {
      const expression = tokens[0] || '';
      const paths = tokens.slice(1).filter((token) => !token.startsWith('-'));
      const read = terminalReadTextInput(paths);
      if (read.error) {
        terminalHTML(`<span class="term-error">sed: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const replace = expression.match(/^s\/(.*?)\/(.*?)\/([gi]*)$/);
      if (replace) {
        const [, pattern, replacement, flags] = replace;
        try {
          const regex = new RegExp(pattern, flags.includes('g') ? 'g' : '');
          terminalOutputText(read.text.split('\n').map((line) => line.replace(regex, replacement)).join('\n'));
        } catch (error) {
          terminalHTML(`<span class="term-error">sed: 正则表达式无效: ${escapeHTML(pattern)}</span>`);
        }
        return;
      }
      const printLine = expression.match(/^(\d+)p$/);
      if (printLine) {
        terminalOutputText(read.text.split('\n')[Number(printLine[1]) - 1] || '');
        return;
      }
      const deleteLine = expression.match(/^(\d+)d$/);
      if (deleteLine) {
        terminalOutputText(read.text.split('\n').filter((line, index) => index !== Number(deleteLine[1]) - 1).join('\n'));
        return;
      }
      terminalHTML('<span class="term-warn">sed: 当前模拟器支持 s/旧/新/g、N p 与 N d 表达式</span>');
      return;
    }
    if (command === 'awk') {
      const expression = tokens[0] || '{print $0}';
      const paths = tokens.slice(1).filter((token) => !token.startsWith('-'));
      const read = terminalReadTextInput(paths);
      if (read.error) {
        terminalHTML(`<span class="term-error">awk: ${escapeHTML(read.requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      const match = expression.match(/\$(\d+)/);
      const column = match ? Number(match[1]) : 0;
      const output = read.text.split('\n').map((line) => {
        const fields = line.trim().split(/\s+/);
        return column === 0 ? line : (fields[column - 1] || '');
      }).join('\n');
      terminalOutputText(output);
      return;
    }
    if (command === 'grep') {
      const ignoreCase = tokens.some((token) => /^-[a-zA-Z]*i/.test(token));
      const lineNumbers = tokens.some((token) => /^-[a-zA-Z]*n/.test(token));
      const recursive = tokens.some((token) => /^-[a-zA-Z]*r/.test(token));
      const invert = tokens.some((token) => /^-[a-zA-Z]*v/.test(token));
      const values = tokens.filter((token) => !token.startsWith('-'));
      if (!values.length) {
        terminalHTML('<span class="term-warn">用法：grep [-inrv] &lt;模式&gt; [文件或目录]</span>');
        return;
      }
      const pattern = values[0];
      const targets = values.slice(1);
      let regex;
      try {
        regex = new RegExp(pattern, ignoreCase ? 'i' : '');
      } catch (error) {
        terminalHTML(`<span class="term-error">grep: 无效的正则表达式: ${escapeHTML(pattern)}</span>`);
        return;
      }
      const sources = [];
      if (!targets.length) {
        sources.push({ label: '(标准输入)', text: lastOutputText || '', showLabel: false });
      } else {
        targets.forEach((target) => {
          const path = terminalResolvePath(target);
          const entry = termEntry(path);
          if (entry && recursive) {
            const prefix = path === '/' ? '/' : `${path}/`;
            Object.keys(TERM_SYSTEM_FILES).forEach((filePath) => {
              if (filePath.startsWith(prefix)) sources.push({ label: filePath, text: TERM_SYSTEM_FILES[filePath], showLabel: true });
            });
            termAllPaths().filter((filePath) => filePath.startsWith(prefix) && termFileExists(filePath)).forEach((filePath) => {
              const read = termReadFile(filePath);
              if (!read.error) sources.push({ label: filePath, text: read.text, showLabel: true });
            });
          } else {
            const read = termReadFile(path);
            if (read.error) {
              terminalHTML(`<span class="term-error">grep: ${escapeHTML(target)}: ${escapeHTML(read.error)}</span>`);
              return;
            }
            sources.push({ label: target, text: read.text, showLabel: targets.length > 1 });
          }
        });
      }
      const matches = [];
      sources.forEach((source) => {
        source.text.split('\n').forEach((line, index) => {
          const hit = regex.test(line);
          if (hit !== invert) matches.push(`${source.showLabel ? `${source.label}:` : ''}${lineNumbers ? `${index + 1}:` : ''}${line}`);
        });
      });
      if (!matches.length) return;
      terminalOutputText(matches.join('\n'));
      return;
    }
    if (command === 'diff') {
      const paths = tokens.filter((token) => !token.startsWith('-'));
      if (paths.length < 2) {
        terminalHTML('<span class="term-warn">diff: 缺少操作数</span>');
        return;
      }
      const left = termReadFile(terminalResolvePath(paths[0]));
      const right = termReadFile(terminalResolvePath(paths[1]));
      if (left.error || right.error) {
        terminalHTML(`<span class="term-error">diff: ${escapeHTML(left.error || right.error)}</span>`);
        return;
      }
      if (left.text === right.text) {
        terminalPrint('文件相同', 'term-line term-muted');
        return;
      }
      const leftLines = left.text.split('\n');
      const rightLines = right.text.split('\n');
      const output = [];
      const max = Math.max(leftLines.length, rightLines.length);
      for (let index = 0; index < max; index += 1) {
        if (leftLines[index] === rightLines[index]) continue;
        if (leftLines[index] !== undefined) output.push(`${index + 1}c${index + 1}`, `< ${leftLines[index]}`);
        if (rightLines[index] !== undefined) output.push('---', `> ${rightLines[index]}`);
      }
      terminalOutputText(output.join('\n'));
      return;
    }
    if (command === 'tee') {
      const paths = tokens.filter((token) => !token.startsWith('-'));
      const text = lastOutputText || '';
      paths.forEach((requested) => {
        const path = terminalResolvePath(requested);
        if (!termWriteFile(path, text)) terminalHTML(`<span class="term-error">tee: ${escapeHTML(requested)}: 权限不够</span>`);
      });
      terminalOutputText(text);
      return;
    }
    if (command === 'xargs') {
      const rest = tokens.filter((token) => !token.startsWith('-'));
      const lines = (lastOutputText || '').split('\n').filter(Boolean);
      terminalPrint(`xargs: 已接收 ${lines.length} 个参数${rest.length ? `，准备执行 ${rest.join(' ')}` : ''}`, 'term-line term-muted');
      terminalPrint('xargs: 模拟模式已阻止实际批量执行。', 'term-line term-muted');
    }
  }

  function terminalCommandSystem(command, argument) {
    const tokens = termSplit(argument);
    const now = new Date();
    if (command === 'ps') {
      const rows = [
        ['USER', 'PID', '%CPU', '%MEM', 'VSZ', 'RSS', 'TTY', 'STAT', 'START', 'TIME', 'COMMAND'],
        ['root', '1', '0.0', '0.1', '168412', '12288', '?', 'Ss', '21:40', '0:02', '/sbin/init'],
        ['root', '412', '0.1', '0.4', '84220', '38912', '?', 'Ss', '21:40', '0:04', '/usr/lib/systemd/systemd-journald'],
        ['root', '812', '0.0', '0.2', '312440', '18432', '?', 'Ssl', '21:40', '0:01', '/usr/sbin/NetworkManager --no-daemon'],
        ['www-data', '1180', '0.2', '0.8', '128840', '62440', '?', 'S', '21:41', '0:11', 'nginx: worker process'],
        ['sniper', '2841', '0.0', '0.3', '15820', '9216', 'pts/0', 'Ss', '21:41', '0:00', 'sshd: sniper@pts/0'],
        ['sniper', '3044', '1.4', '2.1', '812440', '162312', '?', 'Sl', '21:42', '0:38', 'node /opt/aisniper/agent.js'],
        ['sniper', '3388', '0.0', '0.1', '12104', '4096', 'pts/0', 'R+', '21:54', '0:00', 'ps aux']
      ];
      if (tokens.includes('aux') || tokens.includes('-ef')) {
        terminalHTML(`<pre class="term-pre">${escapeHTML(rows.map((row) => row.join('  ')).join('\n'))}</pre>`);
      } else {
        const shortRows = [['PID', 'TTY', 'TIME', 'CMD'], ...rows.slice(1).map((row) => [row[1], row[6], row[9], row[10]])];
        terminalHTML(`<pre class="term-pre">${escapeHTML(shortRows.map((row) => row.join('  ')).join('\n'))}</pre>`);
      }
      lastOutputText = rows.map((row) => row.join(' ')).join('\n');
      return;
    }
    if (command === 'top' || command === 'htop') {
      const cpu = Math.round(health.cpu);
      const memory = Math.round(health.memory);
      const lines = [
        `${command === 'top' ? 'top' : 'htop'} - ${now.toLocaleTimeString('zh-CN', { hour12: false })} up 5:07,  1 user,  load average: 0.21, 0.18, 0.14`,
        `Tasks: 184 total,   1 running, 183 sleeping,   0 stopped,   0 zombie`,
        `%Cpu(s): ${Math.max(1, Math.round(cpu / 8))}.3 us,  0.6 sy,  0.0 ni, ${100 - Math.max(1, Math.round(cpu / 8))}.1 id`,
        `MiB Mem :  24000.0 total,   ${(24000 * (100 - memory) / 100).toFixed(1)} free,   ${(24000 * memory / 100).toFixed(1)} used`,
        '',
        '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
        '    1 root      20   0  168412  12288   8192 S   0.0   0.1   0:02.14 systemd',
        ' 1180 www-data  20   0  128840  62440  18432 S   0.2   0.8   0:11.08 nginx',
        ' 2841 sniper    20   0   15820   9216   6144 S   0.0   0.3   0:00.41 sshd',
        ' 3044 sniper    20   0  812440 162312  72192 S   1.4   2.1   0:38.72 node',
        ' 3388 sniper    20   0   12104   4096   3200 R   0.3   0.1   0:00.01 ' + command
      ];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'free') {
      const lines = [
        '               total        used        free      shared  buff/cache   available',
        'Mem:            23Gi       5.4Gi       8.7Gi       412Mi       9.1Gi        17Gi',
        'Swap:          4.0Gi          0B       4.0Gi'
      ];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'vmstat') {
      terminalHTML('<pre class="term-pre">procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st\n 1  0      0 8921408 422656 9323008    0    0    12    38  284  612  4  1 95  0  0</pre>');
      return;
    }
    if (command === 'lscpu') {
      const lines = [
        '架构：                         aarch64',
        'CPU 运行模式：                 64-bit',
        '字节序：                       Little Endian',
        'CPU:                           8',
        '在线 CPU 列表：                0-7',
        '每个核的线程数：               1',
        '每个座的核数：                 8',
        '座：                           1',
        '型号名称：                     AISniper M1 Neural Core',
        'CPU 频率：                     3.20GHz',
        'BogoMIPS：                     48.00',
        'L1d 缓存：                     512 KiB',
        'L2 缓存：                      8 MiB',
        'L3 缓存：                      32 MiB',
        'NUMA 节点：                    1',
        '虚拟化：                       AISniper Hypervisor'
      ];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'lsblk') {
      terminalHTML('<pre class="term-pre">NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   512G  0 disk\n├─sda1   8:1    0   511G  0 part /\n└─sda2   8:2    0     1G  0 part /boot\nsdb      8:16   0   2.0T  0 disk\n└─sdb1   8:17   0   2.0T  0 part /mnt/vault\nsr0     11:0    1  1024M  0 rom</pre>');
      return;
    }
    if (command === 'lspci') {
      terminalHTML('<pre class="term-pre">00:00.0 Host bridge: AISniper Aquila SoC\n00:02.0 VGA compatible controller: AISniper Neural GPU (rev 04)\n01:00.0 Network controller: Meridian Wi-Fi 6E AX210\n02:00.0 Ethernet controller: AISniper 10GbE Controller\n03:00.0 Non-Volatile memory controller: AISniper NVMe SSD</pre>');
      return;
    }
    if (command === 'lsusb') {
      terminalHTML('<pre class="term-pre">Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub\nBus 001 Device 004: ID 046d:c52b Logitech USB Receiver\nBus 001 Device 003: ID 28de:2300 Valve Software SteamVR Controller\nBus 001 Device 002: ID 2109:2817 AISniper USB 2.0 Hub\nBus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub</pre>');
      return;
    }
    if (command === 'dmesg') {
      const lines = [
        '[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x410fd0c0]',
        '[    0.000000] Linux version 6.8.0-aisniper (build@aquila) #1 SMP PREEMPT_DYNAMIC aarch64',
        '[    0.000000] Machine model: AISniper M1 Neural Core',
        '[    0.284913] AISniper security monitor: root volume seal verified',
        '[    0.842110] EXT4-fs (sda1): mounted filesystem with ordered data mode',
        '[    1.027481] systemd[1]: Started Journal Service.',
        '[    2.418203] nginx[1180]: edge proxy listening on 0.0.0.0:80',
        '[   84.114092] eth0: Link is Up - 10Gbps/Full - flow control rx/tx'
      ];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'journalctl') {
      terminalHTML('<pre class="term-pre">-- Logs begin at Sun 2026-11-15 21:40:01 CST, end at Sun 2026-11-15 21:54:12 CST. --\nNov 15 21:44:02 aisniper sshd[2841]: Accepted publickey for sniper from 192.168.1.42 port 51422 ssh2\nNov 15 21:45:11 aisniper sudo[2910]: sniper : TTY=pts/0 ; PWD=/home/sniper ; USER=root ; COMMAND=/usr/bin/apt update\nNov 15 21:51:40 aisniper nginx[1180]: 192.168.1.42 - - "GET / HTTP/1.1" 200 612\n<span class="term-error">Nov 15 21:53:08 aisniper kernel: EXT4-fs warning (device sda1): ext4_dx_add_entry: Directory index full!</span>\nNov 15 21:54:01 aisniper systemd[1]: Started Daily apt download activities.</pre>');
      lastOutputText = 'journalctl: 5 entries';
      return;
    }
    if (command === 'systemctl' || command === 'service') {
      const action = command === 'service' ? (tokens[1] || 'status') : (tokens[0] || 'list-units');
      const unitName = (command === 'service' ? tokens[0] : tokens[1]) || 'nginx';
      const unit = unitName.replace(/\.service$/, '');
      const service = TERM_SERVICES.get(unit);
      if (action === 'status') {
        if (!service) {
          terminalHTML(`<span class="term-error">Unit ${escapeHTML(unit)}.service could not be found.</span>`);
          return;
        }
        const active = service.active;
        terminalHTML(`<span class="${active ? 'term-success' : 'term-error'}">●</span> ${escapeHTML(unit)}.service - ${escapeHTML(service.description)}\n     Loaded: loaded (/lib/systemd/system/${escapeHTML(unit)}.service; enabled; preset: enabled)\n     Active: <span class="${active ? 'term-success' : 'term-error'}">${active ? 'active (running)' : 'inactive (dead)'}</span> since Sun 2026-11-15 21:40:12 CST; 14min ago\n       Docs: man:${escapeHTML(unit)}(8)\n   Main PID: ${active ? '1180 (nginx)' : '—'}\n      Tasks: ${active ? '4 (limit: 18808)' : '0'}\n     Memory: ${active ? '18.4M' : '0B'}\n        CPU: ${active ? '1.284s' : '0'}`);
        return;
      }
      if (action === 'list-units') {
        terminalHTML('<pre class="term-pre">UNIT                     LOAD   ACTIVE SUB     DESCRIPTION\nnginx.service            loaded active running AISniper edge proxy\nssh.service              loaded active running OpenBSD Secure Shell server\ndocker.service           loaded active running Docker Application Container Engine\naisniper-agent.service   loaded active running AISniper local agent\nsystemd-journald.service loaded active running Journal Service\n\n5 loaded units listed.</pre>');
        return;
      }
      if (['start', 'stop', 'restart', 'enable', 'disable'].includes(action)) {
        if (!service) {
          terminalHTML(`<span class="term-error">Failed to ${escapeHTML(action)} ${escapeHTML(unit)}.service: Unit not found.</span>`);
          return;
        }
        if (action === 'start' || action === 'restart') service.active = true;
        if (action === 'stop') service.active = false;
        terminalHTML(`<span class="term-success">${escapeHTML(action)} ${escapeHTML(unit)}.service</span> <span class="term-muted">（模拟 systemd）</span>`);
        return;
      }
      terminalHTML('<span class="term-muted">systemctl：</span><span class="term-key">status</span> <span class="term-key">start</span> <span class="term-key">stop</span> <span class="term-key">restart</span> <span class="term-key">list-units</span> <span class="term-muted">[服务名]</span>');
      return;
    }
    if (command === 'kill' || command === 'pkill' || command === 'killall' || command === 'pgrep') {
      const numeric = tokens.filter((token) => /^\d+$/.test(token));
      const names = tokens.filter((token) => !token.startsWith('-') && !/^\d+$/.test(token));
      if (command === 'pgrep') {
        if (!names.length) {
          terminalHTML('<span class="term-warn">pgrep: 缺少进程名</span>');
          return;
        }
        const pid = names[0] === 'nginx' ? '1180' : names[0] === 'node' ? '3044' : '2841';
        terminalPrint(pid);
        return;
      }
      if (numeric.includes('1')) {
        terminalHTML('<span class="term-error">kill: (1): 不允许的操作</span>');
        return;
      }
      if (!numeric.length && !names.length) {
        terminalHTML(`<span class="term-warn">${command}: 缺少进程 ID 或名称</span>`);
        return;
      }
      const target = numeric[0] || names[0];
      terminalHTML(`<span class="term-muted">已向 ${escapeHTML(target)} 发送 SIGTERM。${command === 'killall' ? '匹配的进程已终止。' : ''}</span>`);
      return;
    }
    if (command === 'mount') {
      const lines = [
        '/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)',
        '/dev/sda2 on /boot type vfat (rw,relatime,fmask=0077,dmask=0077,codepage=437)',
        'tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=1228800k)',
        'vault.local:/volume1 on /mnt/vault type nfs4 (rw,relatime,vers=4.2,rsize=1048576,wsize=1048576)',
        'tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)'
      ];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'umount') {
      const target = tokens[0];
      if (!target) terminalHTML('<span class="term-warn">umount: 缺少挂载点</span>');
      else if (target === '/' || target === '/boot') terminalHTML('<span class="term-error">umount: /: target is busy.</span>');
      else terminalHTML(`<span class="term-muted">已卸载 ${escapeHTML(target)}（模拟）。</span>`);
      return;
    }
    if (command === 'crontab') {
      if (tokens.includes('-l')) {
        terminalHTML('<pre class="term-pre"># m h  dom mon dow   command\n  0 3  *   *   *     /usr/local/bin/aisniper-backup --incremental\n 30 4  *   *   0     /usr/bin/apt update && /usr/bin/apt upgrade -y\n  */10 * * * *      /usr/local/bin/healthcheck --quiet</pre>');
      } else {
        terminalHTML('<span class="term-muted">crontab: 当前仅支持查看模拟任务（crontab -l）</span>');
      }
      return;
    }
    if (command === 'date') {
      const format = tokens[0] || '';
      if (format.startsWith('+')) {
        const padValue = (value) => String(value).padStart(2, '0');
        const output = format.slice(1)
          .replace(/%Y/g, String(now.getFullYear()))
          .replace(/%m/g, padValue(now.getMonth() + 1))
          .replace(/%d/g, padValue(now.getDate()))
          .replace(/%H/g, padValue(now.getHours()))
          .replace(/%M/g, padValue(now.getMinutes()))
          .replace(/%S/g, padValue(now.getSeconds()))
          .replace(/%F/g, `${now.getFullYear()}-${padValue(now.getMonth() + 1)}-${padValue(now.getDate())}`)
          .replace(/%T/g, `${padValue(now.getHours())}:${padValue(now.getMinutes())}:${padValue(now.getSeconds())}`);
        terminalPrint(output);
      } else {
        terminalPrint(now.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      return;
    }
    if (command === 'cal') {
      const hasMonth = tokens.length >= 2;
      const year = hasMonth ? (Number(tokens[1]) || now.getFullYear()) : (Number(tokens[0]) || now.getFullYear());
      const month = hasMonth ? Math.min(11, Math.max(0, (Number(tokens[0]) || 1) - 1)) : now.getMonth();
      const first = new Date(year, month, 1);
      const days = new Date(year, month + 1, 0).getDate();
      const start = first.getDay();
      const monthName = first.toLocaleDateString('en-US', { month: 'long' });
      const lines = [`     ${monthName} ${year}`, 'Su Mo Tu We Th Fr Sa'];
      let week = '   '.repeat(start);
      for (let day = 1; day <= days; day += 1) {
        week += `${String(day).padStart(2, ' ')} `;
        if ((start + day) % 7 === 0 || day === days) {
          lines.push(week.trimEnd());
          week = '';
        }
      }
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'timedatectl') {
      terminalHTML('<pre class="term-pre">               Local time: 日 2026-11-15 21:54:12 CST\n           Universal time: 日 2026-11-15 13:54:12 UTC\n                 RTC time: 日 2026-11-15 13:54:12\n                Time zone: Asia/Shanghai (CST, +0800)\nSystem clock synchronized: yes\n              NTP service: active\n          RTC in local TZ: no</pre>');
      return;
    }
    if (command === 'hostname') { terminalPrint('aisniper'); return; }
    if (command === 'hostnamectl') {
      terminalHTML('<pre class="term-pre"> Static hostname: aisniper\n       Icon name: computer-laptop\n         Chassis: laptop\n      Machine ID: 7a1f9c2e4b8d4e11a6c05f3d2b9e8a10\n         Boot ID: 84c1d7e9a2f44b9ca1e6d8f072b34c55\nOperating System: AISniperOS 26.1.4 LTS\n          Kernel: Linux 6.8.0-aisniper\n    Architecture: arm64</pre>');
      return;
    }
    if (command === 'arch' || command === 'nproc') { terminalPrint(command === 'arch' ? 'aarch64' : '8'); return; }
    if (command === 'id') { terminalPrint('uid=1000(sniper) gid=1000(sniper) 组=1000(sniper),27(sudo),998(docker)'); return; }
    if (command === 'groups') { terminalPrint('sniper sudo docker'); return; }
    if (command === 'who') { terminalPrint('sniper   pts/0        2026-11-15 21:41 (192.168.1.42)'); return; }
    if (command === 'w') {
      terminalHTML('<pre class="term-pre"> 21:54:12 up 5:07,  1 user,  load average: 0.21, 0.18, 0.14\nUSER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nsniper   pts/0    192.168.1.42     21:41    0.00s  0.12s  0.01s w</pre>');
      return;
    }
    if (command === 'users') { terminalPrint('sniper'); return; }
    if (command === 'last') {
      terminalHTML('<pre class="term-pre">sniper   pts/0        192.168.1.42     Sun Nov 15 21:41   still logged in\nsniper   pts/0        192.168.1.42     Sun Nov 15 18:22 - 20:04  (01:42)\nreboot   system boot  6.8.0-aisniper   Sun Nov 15 21:40   still running\n\nwtmp begins Sun Nov 15 21:40:01 2026</pre>');
      return;
    }
    if (command === 'lastlog') {
      terminalHTML('<pre class="term-pre">用户名           端口     来自             最后登录时间\nroot                                       **从未登录**\nsniper           pts/0    192.168.1.42     日 11月 15 21:41:08 +0800 2026\nnginx                                      **从未登录**</pre>');
      return;
    }
    if (command === 'env' || command === 'printenv') {
      const values = { ...TERM_ENV, PWD: terminalCwd === '~' ? '/home/sniper' : terminalCwd };
      if (command === 'printenv' && tokens[0]) {
        terminalPrint(values[tokens[0]] || '');
        return;
      }
      const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      lastOutputText = lines.join('\n');
      return;
    }
    if (command === 'export') {
      if (!tokens.length) {
        terminalHTML(`<pre class="term-pre">${escapeHTML(Object.entries(TERM_ENV).map(([key, value]) => `declare -x ${key}="${value}"`).join('\n'))}</pre>`);
        return;
      }
      tokens.forEach((token) => {
        const [key, ...rest] = token.split('=');
        if (key && rest.length) TERM_ENV[key] = rest.join('=');
      });
      return;
    }
    if (command === 'unset') {
      tokens.forEach((key) => { delete TERM_ENV[key]; delete terminalAliases[key]; });
      return;
    }
    if (command === 'alias') {
      const raw = String(argument || '').trim();
      if (!raw) {
        terminalHTML(`<pre class="term-pre">${escapeHTML(Object.entries(terminalAliases).sort().map(([key, value]) => `alias ${key}='${value}'`).join('\n'))}</pre>`);
        return;
      }
      const match = raw.match(/^([\w?.-]+)=(.+)$/);
      if (match) {
        terminalAliases[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
      } else {
        terminalHTML('<span class="term-warn">alias: 用法 alias 名称=\'命令\'</span>');
      }
      return;
    }
    if (command === 'unalias') {
      if (tokens.includes('-a')) terminalAliases = { ...TERM_ALIASES };
      else tokens.forEach((name) => { delete terminalAliases[name]; });
      return;
    }
    if (command === 'source' || command === '.') {
      const requested = tokens[0];
      if (!requested) {
        terminalHTML('<span class="term-warn">source: 缺少文件名</span>');
        return;
      }
      const path = terminalResolvePath(requested);
      const read = termReadFile(path);
      if (read.error) {
        terminalHTML(`<span class="term-error">bash: ${escapeHTML(requested)}: ${escapeHTML(read.error)}</span>`);
        return;
      }
      read.text.split('\n').forEach((line) => {
        const aliasMatch = line.match(/^\s*alias\s+([\w?.-]+)=(.*)$/);
        if (aliasMatch) terminalAliases[aliasMatch[1]] = aliasMatch[2].trim().replace(/^['"]|['"]$/g, '');
        const exportMatch = line.match(/^\s*export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (exportMatch) TERM_ENV[exportMatch[1]] = exportMatch[2].trim().replace(/^['"]|['"]$/g, '');
      });
      terminalPrint(`已加载 ${requested}`, 'term-line term-muted');
      return;
    }
    if (command === 'which' || command === 'whereis' || command === 'type' || command === 'command') {
      const name = tokens.find((token) => !token.startsWith('-'));
      if (!name) {
        terminalHTML(`<span class="term-warn">${command}: 缺少参数</span>`);
        return;
      }
      const builtin = (LINUX.SHELL_BUILTINS || []).includes(name);
      if (command === 'type') {
        terminalPrint(builtin ? `${name} 是 shell 内建` : TERM_COMMANDS.includes(name) ? `${name} 是 /usr/bin/${name}` : `bash: type: ${name}: 未找到`);
        return;
      }
      if (!TERM_COMMANDS.includes(name)) {
        terminalHTML(`<span class="term-error">${command}: 未找到 ${escapeHTML(name)}</span>`);
        return;
      }
      if (command === 'whereis') terminalPrint(`${name}: /usr/bin/${name} /usr/share/man/man1/${name}.1.gz`);
      else if (builtin) terminalPrint(name);
      else terminalPrint(`/usr/bin/${name}`);
      return;
    }
    if (command === 'sleep') {
      const seconds = Number(tokens[0]) || 0;
      terminalPrint(`sleep: 已模拟等待 ${seconds}s（不会阻塞界面）`, 'term-line term-muted');
      return;
    }
    if (command === 'seq') {
      const numbers = tokens.map(Number).filter((value) => Number.isFinite(value));
      let start = 1;
      let step = 1;
      let end = 1;
      if (numbers.length === 1) end = numbers[0];
      else if (numbers.length === 2) { start = numbers[0]; end = numbers[1]; }
      else if (numbers.length >= 3) { start = numbers[0]; step = numbers[1] || 1; end = numbers[2]; }
      if (step === 0) { terminalHTML('<span class="term-error">seq: 步长不能为 0</span>'); return; }
      const values = [];
      for (let value = start; step > 0 ? value <= end : value >= end; value += step) {
        values.push(String(value));
        if (values.length > 200) break;
      }
      terminalOutputText(values.join('\n'));
      return;
    }
    if (command === 'yes') {
      const text = argument || 'y';
      terminalOutputText(Array.from({ length: 12 }, () => text).join('\n'));
      terminalPrint('yes: 已截断为 12 行，避免真的填满终端。', 'term-line term-muted');
      return;
    }
    if (command === 'true' || command === 'false') return;
    if (command === 'test') {
      let result = false;
      if (tokens[0] === '-f') result = termFileExists(terminalResolvePath(tokens[1] || ''));
      else if (tokens[0] === '-d') result = Boolean(termEntry(terminalResolvePath(tokens[1] || '')));
      else if (tokens[0] === '-e') result = termPathType(terminalResolvePath(tokens[1] || '')) !== 'missing';
      else if (tokens[0] === '-z') result = (tokens[1] || '') === '';
      else if (tokens[0] === '-n') result = (tokens[1] || '') !== '';
      else if (tokens[1] === '=' || tokens[1] === '==') result = tokens[0] === tokens[2];
      else if (tokens[1] === '!=') result = tokens[0] !== tokens[2];
      terminalPrint(result ? '[ 真 ]' : '[ 假 ]', `term-line ${result ? 'term-success' : 'term-error'}`);
      return;
    }
    if (command === 'expr' || command === 'bc') {
      const expression = argument.replace(/\^/g, '**').trim();
      if (!/^[\d\s+\-*/().%**]+$/.test(expression)) {
        terminalHTML(`<span class="term-error">${command}: 仅支持数字算术表达式</span>`);
        return;
      }
      try {
        const result = Function(`"use strict"; return (${expression || 0});`)();
        terminalPrint(String(result));
        lastOutputText = String(result);
      } catch (error) {
        terminalHTML(`<span class="term-error">${command}: 表达式无效</span>`);
      }
      return;
    }
    if (command === 'factor') {
      let value = Math.abs(parseInt(tokens[0], 10));
      if (!Number.isFinite(value) || value < 2) {
        terminalHTML('<span class="term-warn">factor: 请输入大于 1 的整数</span>');
        return;
      }
      const factors = [];
      for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
        while (value % divisor === 0) {
          factors.push(divisor);
          value /= divisor;
        }
      }
      if (value > 1) factors.push(value);
      terminalPrint(`${tokens[0]}: ${factors.join(' ')}`);
      return;
    }
    if (command === 'shuf') {
      const values = tokens.filter((token) => !token.startsWith('-'));
      const source = values.length ? values : (lastOutputText || '').split('\n').filter(Boolean);
      const shuffled = [...source].sort(() => Math.random() - 0.5);
      terminalOutputText(shuffled.join('\n'));
      return;
    }
  }

  function terminalCommandNetworkTool(command, argument) {
    const tokens = termSplit(argument);
    const value = tokens.find((token) => !token.startsWith('-')) || '';
    if (command === 'ping') {
      let count = 4;
      const countIndex = tokens.indexOf('-c');
      if (countIndex >= 0) count = Math.min(10, Math.max(1, Number(tokens[countIndex + 1]) || 4));
      const host = tokens.find((token) => !token.startsWith('-') && !/^\d+$/.test(token)) || 'aisniper.local';
      const lines = [`PING ${host} (${host.includes('.') ? host : '192.168.1.1'}) 56(84) bytes of data.`];
      const times = [];
      for (let index = 0; index < count; index += 1) {
        const latency = (host.includes('192.168.1.1') ? 0.42 : host.includes('aisniper') ? 0.18 : 8.4) + index * 0.17 + Math.random() * 0.2;
        times.push(latency);
        lines.push(`64 bytes from ${host}: icmp_seq=${index + 1} ttl=64 time=${latency.toFixed(2)} ms`);
      }
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      lines.push('', `--- ${host} ping 统计 ---`, `${count} packets transmitted, ${count} received, 0% packet loss, time ${(count * 1000).toFixed(0)}ms`, `rtt min/avg/max/mdev = ${min.toFixed(3)}/${avg.toFixed(3)}/${max.toFixed(3)}/0.061 ms`);
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      lastOutputText = lines.join('\n');
      return;
    }
    if (command === 'traceroute' || command === 'tracepath') {
      const host = value || 'aisniper.local';
      const lines = [`traceroute to ${host} (192.168.1.1), 30 hops max, 60 byte packets`, ' 1  router.local (192.168.1.1)  0.436 ms  0.412 ms  0.398 ms', ' 2  meridian-core (10.0.4.1)  1.284 ms  1.241 ms  1.302 ms', ' 3  172.16.8.1 (172.16.8.1)  3.112 ms  3.041 ms  3.288 ms', ' 4  edge-nrt1.aisniper.net (203.0.113.18)  7.841 ms  7.612 ms  7.903 ms', ` 5  ${host} (198.51.100.24)  9.214 ms  9.108 ms  9.337 ms`];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'dig') {
      const host = value || 'aisniper.local';
      const lines = ['; <<>> DiG 9.20.0 <<>> ' + host, ';; global options: +cmd', ';; Got answer:', ';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41208', ';; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1', '', ';; QUESTION SECTION:', `;${host}.IN\tA`, '', ';; ANSWER SECTION:', `${host}.\t300\tIN\tA\t192.168.1.1`, '', ';; Query time: 1 msec', ';; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)', `;; WHEN: ${new Date().toLocaleString('zh-CN', { hour12: false })}`, ';; MSG SIZE  rcvd: 58'];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
    if (command === 'nslookup' || command === 'host') {
      const host = value || 'aisniper.local';
      if (command === 'host') terminalPrint(`${host} has address 192.168.1.1`);
      else terminalHTML(`<pre class="term-pre">Server:\t\t1.1.1.1\nAddress:\t1.1.1.1#53\n\nNon-authoritative answer:\nName:\t${escapeHTML(host)}\nAddress: 192.168.1.1</pre>`);
      return;
    }
    if (command === 'curl') {
      const headOnly = tokens.includes('-I') || tokens.includes('--head');
      const url = value || 'https://aisniper.local';
      const lines = headOnly
        ? ['HTTP/2 200', 'server: nginx/1.26.2', 'content-type: text/html; charset=utf-8', 'content-length: 612', 'cache-control: max-age=60', `date: ${new Date().toUTCString()}`]
        : ['HTTP/2 200', 'server: nginx/1.26.2', 'content-type: text/html; charset=utf-8', `date: ${new Date().toUTCString()}`, '', '<!doctype html>', '<html><head><title>AISniper Node</title></head>', '<body><h1>Meridian edge node online.</h1></body></html>'];
      terminalHTML(`<pre class="term-pre">${escapeHTML(lines.join('\n'))}</pre>`);
      terminalPrint(`curl: (模拟请求) ${url}`, 'term-line term-muted');
      lastOutputText = lines.join('\n');
      return;
    }
    if (command === 'wget') {
      const url = value || 'https://aisniper.local/index.html';
      const name = url.split('/').filter(Boolean).pop()?.split('?')[0] || 'index.html';
      const destination = terminalJoinSafe(terminalCwd, name);
      const saved = destination && termWriteFile(destination, `<!-- downloaded from ${url} -->\n` + (TERM_SYSTEM_FILES['/var/www/html/index.html'] || ''));
      terminalHTML(`<pre class="term-pre">--${new Date().toISOString()}--  ${escapeHTML(url)}\n正在解析主机 aisniper.local... 192.168.1.1\n正在连接 192.168.1.1:443... 已连接。\nHTTP 请求已发送，正在等待回应... 200 OK\n长度：612 [text/html]\n正在保存至: “${escapeHTML(name)}”\n\n${escapeHTML(name)} 100%[===================>]     612  --.-KB/s    用时 0.01s\n\n${new Date().toISOString()} (2.84 MB/s) - 已保存 “${escapeHTML(name)}” [612/612]</pre>`);
      if (!saved) terminalHTML('<span class="term-error">wget: 无法写入当前目录</span>');
      return;
    }
    if (command === 'ssh') {
      const host = value || 'sniper@aisniper.local';
      terminalHTML(`<pre class="term-pre">The authenticity of host '${escapeHTML(host)}' can't be established.\nED25519 key fingerprint is SHA256:7mF1zKq9wV2y4nB8cR6pL0sT3xA5uH1jD9eG2iO4kM.\nThis key is not known by any other names.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? yes\nWarning: Permanently added '${escapeHTML(host)}' to the list of known hosts.\n${escapeHTML(host)}: Permission denied (publickey).\nConnection closed by ${escapeHTML(host.split('@').pop())} port 22</pre>`);
      return;
    }
    if (command === 'scp' || command === 'rsync') {
      const paths = tokens.filter((token) => !token.startsWith('-'));
      const source = paths[0] || '~/说明.md';
      const target = paths[1] || 'sniper@aisniper.local:/tmp/';
      terminalHTML(`<pre class="term-pre">${escapeHTML(source)}                100%  1.2KB   2.4MB/s   00:00\n${command}: ${command === 'rsync' ? 'sent 1,284 bytes  received 35 bytes  2,638.00 bytes/sec' : '文件已传输'} -> ${escapeHTML(target)}</pre>`);
      return;
    }
    if (command === 'netstat' || command === 'ss') {
      terminalHTML('<pre class="term-pre">Netid State  Local Address:Port    Peer Address:Port  Process\ntcp   LISTEN 0.0.0.0:22            0.0.0.0:*          sshd\ntcp   LISTEN 0.0.0.0:80            0.0.0.0:*          nginx\ntcp   LISTEN 0.0.0.0:443           0.0.0.0:*          nginx\ntcp   LISTEN 127.0.0.1:8888        0.0.0.0:*          baota_panel\ntcp   LISTEN 127.0.0.1:3040        0.0.0.0:*          aisniper-agent\nudp   UNCONN 0.0.0.0:68            0.0.0.0:*          dhclient</pre>');
      return;
    }
    if (command === 'ip') {
      const sub = tokens[0] || 'a';
      if (sub === 'route' || sub === 'r') {
        terminalHTML('<pre class="term-pre">default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.42 metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.42 metric 100\n10.0.4.0/24 dev docker0 proto kernel scope link src 10.0.4.1</pre>');
      } else {
        terminalHTML('<pre class="term-pre">1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000\n    link/ether 8c:85:90:2a:71:0c brd ff:ff:ff:ff:ff:ff\n    inet 192.168.1.42/24 brd 192.168.1.255 scope global dynamic eth0\n3: wlan0: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000\n    link/ether a4:83:e7:19:6b:21 brd ff:ff:ff:ff:ff:ff\n4: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default\n    link/ether 02:42:8f:31:0a:12 brd ff:ff:ff:ff:ff:ff\n    inet 10.0.4.1/24 brd 10.0.4.255 scope global docker0</pre>');
      }
      return;
    }
    if (command === 'ifconfig') {
      terminalHTML('<pre class="term-pre">eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.42  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 8c:85:90:2a:71:0c  txqueuelen 1000  (Ethernet)\n        RX packets 184203  bytes 214881204 (214.8 MB)\n        TX packets 120418  bytes 18422014 (18.4 MB)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        loop  txqueuelen 1000  (Local Loopback)</pre>');
      return;
    }
    if (command === 'route') {
      terminalHTML('<pre class="term-pre">Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0</pre>');
      return;
    }
    if (command === 'arp') {
      terminalHTML('<pre class="term-pre">Address                  HWtype  HWaddress           Flags Mask            Iface\n192.168.1.1              ether   00:11:32:7c:4d:09   C                     eth0\n192.168.1.20             ether   00:11:32:7c:4d:10   C                     eth0\n192.168.1.51             ether   a4:83:e7:19:6b:21   C                     eth0</pre>');
      return;
    }
    if (command === 'nmap') {
      const host = value || '192.168.1.1';
      terminalHTML(`<pre class="term-pre">Starting Nmap 7.95 ( https://nmap.org ) at ${new Date().toISOString()}\nNmap scan report for ${escapeHTML(host)}\nHost is up (0.00042s latency).\nNot shown: 996 closed tcp ports (reset)\nPORT     STATE SERVICE\n22/tcp   open  ssh\n80/tcp   open  http\n443/tcp  open  https\n8443/tcp open  https-alt\n\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds</pre>`);
    }
  }

  function terminalJoinSafe(base, name) {
    if (!base || base === '/') return null;
    return base === '~' ? `~/${name}` : `${base}/${name}`;
  }

  function terminalCommandTool(command, argument) {
    const tokens = termSplit(argument);
    if (['bash', 'sh', 'zsh'].includes(command)) {
      if (tokens.includes('--version') || tokens.includes('-version')) { terminalPrint(LINUX.TOOL_VERSIONS?.[command] || `${command} 5.2`); return; }
      const commandIndex = tokens.indexOf('-c');
      if (commandIndex >= 0) {
        const inner = tokens.slice(commandIndex + 1).join(' ');
        if (inner) terminalExecute(inner, { silentEcho: true, recordHistory: false });
        return;
      }
      terminalPrint(`${command}: 当前已在 AISniperOS bash 会话中（模拟子 shell）。`, 'term-line term-muted');
      return;
    }
    const managerNames = { apt: 'apt 2.9.8 (arm64)', 'apt-get': 'apt 2.9.8 (arm64)', dnf: 'dnf 4.21.1', yum: 'yum 4.21.1', pacman: 'Pacman v7.0.0 - libalpm v15.0.0', apk: 'apk-tools 2.14.4', brew: 'Homebrew 4.4.2', snap: 'snap 2.63', flatpak: 'Flatpak 1.15.10' };
    if (Object.prototype.hasOwnProperty.call(managerNames, command)) {
      const sub = tokens[0] || '';
      if (sub === '--version' || sub === '-v') { terminalPrint(managerNames[command]); return; }
      if (!sub || sub === '--help' || sub === '-h') {
        terminalHTML(`<span class="term-muted">${escapeHTML(command)}：</span><span class="term-key">update</span> <span class="term-key">upgrade</span> <span class="term-key">install &lt;包&gt;</span> <span class="term-key">remove &lt;包&gt;</span> <span class="term-key">list --installed</span>`);
        return;
      }
      if (sub === 'update' || sub === 'upgrade' || sub === '-Sy' || sub === '-Syu' || sub === 'refresh') {
        terminalHTML(`<pre class="term-pre">正在读取软件包列表... 完成\n正在分析软件包的依赖关系树... 完成\n正在读取状态信息... 完成\n所有软件包均为最新版本。${sub.includes('upgrade') || sub.includes('Syu') ? '\\n0 个软件包被升级，0 个新安装，0 个要删除。' : ''}</pre>`);
        return;
      }
      if (sub === 'install' || sub === '-S' || sub === 'add') {
        const packages = tokens.slice(1).filter((token) => !token.startsWith('-'));
        const list = packages.length ? packages : ['nginx'];
        list.forEach((name) => TERM_INSTALLED.add(name));
        terminalHTML(`<pre class="term-pre">正在读取软件包列表... 完成\n正在分析软件包的依赖关系树... 完成\n下列【新】软件包将被安装：\n  ${escapeHTML(list.join(' '))}\n正在解压缩 ${escapeHTML(list[0])} ... 完成\n正在设置 ${escapeHTML(list[0])} ... 完成\n已安装 ${list.length} 个软件包。</pre>`);
        return;
      }
      if (sub === 'remove' || sub === 'purge' || sub === '-R' || sub === 'del') {
        const packages = tokens.slice(1).filter((token) => !token.startsWith('-'));
        packages.forEach((name) => TERM_INSTALLED.delete(name));
        terminalHTML(`<span class="term-success">已移除 ${escapeHTML(packages.join(' ') || '软件包')}。</span>`);
        return;
      }
      if (sub === 'list' || sub === 'search' || sub === '-Q') {
        terminalHTML(`<pre class="term-pre">${escapeHTML([...TERM_INSTALLED].sort().join('\n'))}</pre>`);
        return;
      }
      terminalHTML(`<span class="term-error">${escapeHTML(command)}: 无法识别的操作 '${escapeHTML(sub)}'</span>`);
      return;
    }
    if (command === 'dpkg') {
      if (tokens.includes('-l') || tokens.includes('--list')) {
        const rows = [...TERM_INSTALLED].sort().map((name, index) => `ii  ${name.padEnd(24)} 1.${index + 2}.0  arm64  AISniper package`);
        terminalHTML(`<pre class="term-pre">Desired=Unknown/Install/Remove/Purge/Hold\n||/ Name                     Version      Architecture Description\n+++-========================-============-============-=========================\n${escapeHTML(rows.join('\n'))}</pre>`);
        return;
      }
      if (tokens.includes('-i')) { terminalHTML(`<span class="term-success">dpkg: 已解包并配置 ${escapeHTML(tokens[tokens.indexOf('-i') + 1] || 'local.deb')}</span>`); return; }
      terminalPrint('Debian dpkg 软件包管理器 1.22.11 (arm64)。', 'term-line term-muted');
      return;
    }
    if (command === 'pip' || command === 'pip3') {
      if (tokens.includes('--version') || tokens.includes('-V')) { terminalPrint(LINUX.TOOL_VERSIONS?.[command] || 'pip 24.3.1'); return; }
      if (tokens[0] === 'install') {
        const packages = tokens.slice(1).filter((token) => !token.startsWith('-'));
        terminalHTML(`<pre class="term-pre">Collecting ${escapeHTML(packages[0] || 'requests')}\n  Downloading ${escapeHTML(packages[0] || 'requests')}-2.32.3-py3-none-any.whl (64 kB)\nInstalling collected packages: ${escapeHTML(packages.join(', ') || 'requests')}\nSuccessfully installed ${escapeHTML(packages.join(' ') || 'requests')}</pre>`);
        return;
      }
      if (tokens[0] === 'list') {
        terminalHTML('<pre class="term-pre">Package    Version\n---------- -------\npip        24.3.1\nrequests   2.32.3\nnumpy      2.1.3\nrich       13.9.4</pre>');
        return;
      }
      if (tokens[0] === 'freeze') { terminalHTML('<pre class="term-pre">pip==24.3.1\nrequests==2.32.3\nnumpy==2.1.3\nrich==13.9.4</pre>'); return; }
      terminalHTML('<span class="term-muted">pip：</span><span class="term-key">--version</span> <span class="term-key">install &lt;包&gt;</span> <span class="term-key">list</span> <span class="term-key">freeze</span>');
      return;
    }
    if (command === 'npm') {
      if (tokens.includes('--version') || tokens.includes('-v')) { terminalPrint(LINUX.TOOL_VERSIONS?.npm || '10.9.0'); return; }
      if (tokens[0] === 'install' || tokens[0] === 'i') {
        const packages = tokens.slice(1).filter((token) => !token.startsWith('-'));
        terminalHTML(`<pre class="term-pre">added ${packages.length || 12} packages, and audited ${packages.length ? 13 : 184} packages in 1.2s\n\nfound 0 vulnerabilities</pre>`);
        return;
      }
      if (tokens[0] === 'run') { terminalHTML(`<span class="term-muted">> aisniper@26.1.4 ${escapeHTML(tokens[1] || 'build')}\n> aisniper-build --production\n\n✓ 构建完成，用时 842ms</span>`); return; }
      if (tokens[0] === 'list' || tokens[0] === 'ls') { terminalHTML('<pre class="term-pre">aisniper@26.1.4 /home/sniper\n├── vite@6.0.3\n├── three@0.170.0\n└── zod@3.23.8</pre>'); return; }
      terminalHTML('<span class="term-muted">npm：</span><span class="term-key">--version</span> <span class="term-key">install</span> <span class="term-key">run &lt;脚本&gt;</span> <span class="term-key">list</span>');
      return;
    }
    if (command === 'node') {
      if (tokens.includes('-v') || tokens.includes('--version')) { terminalPrint(LINUX.TOOL_VERSIONS?.node || 'v22.11.0'); return; }
      const evalIndex = tokens.indexOf('-e') >= 0 ? tokens.indexOf('-e') : tokens.indexOf('--eval');
      if (evalIndex >= 0) {
        const code = tokens[evalIndex + 1] || '';
        const match = code.match(/console\.log\((['"])(.*?)\1\)/);
        terminalPrint(match ? match[2] : 'undefined');
        return;
      }
      terminalPrint('Welcome to Node.js v22.11.0.', 'term-line term-muted');
      terminalPrint('输入 node -e "console.log(\'hello\')" 执行一段代码。', 'term-line term-muted');
      return;
    }
    if (command === 'python' || command === 'python3') {
      if (tokens.includes('--version') || tokens.includes('-V')) { terminalPrint(LINUX.TOOL_VERSIONS?.[command] || 'Python 3.12.7'); return; }
      const evalIndex = tokens.indexOf('-c');
      if (evalIndex >= 0) {
        const code = tokens[evalIndex + 1] || '';
        const match = code.match(/print\((['"])(.*?)\1\)/);
        terminalPrint(match ? match[2] : '');
        return;
      }
      terminalHTML('<pre class="term-pre">Python 3.12.7 (main, Nov  2 2026, 10:12:04) [GCC 13.2.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> （模拟 REPL，输入 python3 -c "print(\'hello\')" 执行代码）</pre>');
      return;
    }
    if (command === 'git') {
      if (tokens.includes('--version')) { terminalPrint(LINUX.TOOL_VERSIONS?.git || 'git version 2.47.0'); return; }
      const sub = tokens[0] || '';
      if (!sub) { terminalPrint('usage: git [--version] <command> [<args>]', 'term-line term-muted'); return; }
      if (sub === 'status') { terminalHTML('<pre class="term-pre">On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean</pre>'); return; }
      if (sub === 'log') { terminalHTML('<pre class="term-pre">84c1d7e (HEAD -> main, origin/main) polish terminal command catalogue\n2fec6d4 add wallpapers and browser embed fallback\na4a8ffa upload AISniperOS web desktop</pre>'); return; }
      if (sub === 'branch') { terminalPrint('* main'); return; }
      if (sub === 'remote') { terminalPrint('origin  https://github.com/GhostQAQ-VRC/AIsniperOSds4.1f.git (fetch)\norigin  https://github.com/GhostQAQ-VRC/AIsniperOSds4.1f.git (push)'); return; }
      if (sub === 'init') { terminalPrint('已初始化空的 Git 仓库于 /home/sniper/.git/'); return; }
      if (sub === 'add') { terminalPrint('已暂存更改。', 'term-line term-muted'); return; }
      if (sub === 'commit') { terminalHTML('<span class="term-success">[main 84c1d7e] 本地提交</span> <span class="term-muted">1 file changed, 1 insertion(+)</span>'); return; }
      if (sub === 'clone') { terminalPrint(`正克隆到 '${tokens[1] || 'repository'}'...\nremote: Enumerating objects: 128, done.\n接收对象中: 100% (128/128), 完成.`, 'term-line term-muted'); return; }
      terminalPrint(`git: '${sub}' 不是 git 命令。`, 'term-line term-error');
      return;
    }
    if (['gcc', 'make', 'java', 'go', 'rustc'].includes(command)) {
      if (tokens.includes('--version') || tokens.includes('-v') || tokens.includes('version')) { terminalPrint(LINUX.TOOL_VERSIONS?.[command] || `${command} version 1.0`); return; }
      const source = tokens.find((token) => !token.startsWith('-'));
      if (command === 'gcc') {
        if (!source) { terminalPrint('gcc: 致命错误：没有输入文件', 'term-line term-error'); return; }
        terminalPrint(`gcc: 已编译 ${source} -> a.out（模拟）`, 'term-line term-muted');
        return;
      }
      if (command === 'make') {
        if (!termFileExists(terminalResolvePath('Makefile'))) terminalHTML('<span class="term-error">make: *** 未找到 Makefile。停止。</span>');
        else terminalHTML('<pre class="term-pre">gcc -O2 -Wall -o aisniper main.c\naisniper: 构建完成。</pre>');
        return;
      }
      if (command === 'java') { terminalPrint('java: 请先编译源文件，或运行 java -version。', 'term-line term-muted'); return; }
      terminalPrint(`${command}: 已处理 ${source || '当前项目'}（模拟工具链）`, 'term-line term-muted');
    }
  }

  function termUtf8Base64(text) {
    const bytes = new TextEncoder().encode(String(text));
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  function termBase64Utf8(value) {
    const binary = atob(String(value).replace(/\s+/g, ''));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  }

  function termSimpleHash(text) {
    let hash = 2166136261;
    for (const char of String(text)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    const part = (hash >>> 0).toString(16).padStart(8, '0');
    return (part + part.split('').reverse().join('') + part + part.split('').reverse().join('')).slice(0, 64);
  }

  async function terminalChecksum(command, argument) {
    const paths = termSplit(argument).filter((token) => !token.startsWith('-'));
    if (!paths.length) {
      terminalHTML(`<span class="term-warn">${command}: 缺少文件操作数</span>`);
      return;
    }
    const path = terminalResolvePath(paths[0]);
    const read = termReadFile(path);
    if (read.error) {
      terminalHTML(`<span class="term-error">${command}: ${escapeHTML(paths[0])}: ${escapeHTML(read.error)}</span>`);
      return;
    }
    let digest = termSimpleHash(read.text);
    if (command === 'sha256sum' && window.crypto?.subtle) {
      try {
        const hash = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(read.text));
        digest = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      } catch (error) { /* keep deterministic fallback */ }
    }
    terminalPrint(`${digest}  ${paths[0]}`);
    lastOutputText = `${digest}  ${paths[0]}`;
  }

  function terminalCommandMisc(command, argument) {
    const tokens = termSplit(argument);
    if (command === 'chmod') {
      const values = tokens.filter((token) => !token.startsWith('-'));
      if (values.length < 2) {
        terminalHTML('<span class="term-warn">chmod: 缺少操作数</span> <span class="term-muted">用法：chmod [-R] 权限 文件...</span>');
        return;
      }
      const mode = values[0];
      if (!/^[0-7]{3,4}$/.test(mode) && !/^[ugoa]*[+-][rwxXst]+$/.test(mode)) {
        terminalHTML(`<span class="term-error">chmod: 无效模式: '${escapeHTML(mode)}'</span>`);
        return;
      }
      values.slice(1).forEach((requested) => {
        const path = terminalResolvePath(requested);
        if (!termCanWrite(path)) terminalHTML(`<span class="term-error">chmod: 更改 '${escapeHTML(requested)}' 的权限: 只读文件系统</span>`);
      });
      return;
    }
    if (command === 'chown' || command === 'chgrp') {
      const values = tokens.filter((token) => !token.startsWith('-'));
      if (values.length < 2) {
        terminalHTML(`<span class="term-warn">${command}: 缺少操作数</span>`);
        return;
      }
      values.slice(1).forEach((requested) => {
        const path = terminalResolvePath(requested);
        if (!termCanWrite(path)) terminalHTML(`<span class="term-error">${command}: 更改 '${escapeHTML(requested)}' 的所有者: 只读文件系统</span>`);
      });
      return;
    }
    if (command === 'umask') {
      if (tokens[0] && /^[0-7]{3,4}$/.test(tokens[0])) TERM_ENV.UMASK = tokens[0];
      terminalPrint(TERM_ENV.UMASK || '0022');
      return;
    }
    if (command === 'basename') {
      if (!tokens[0]) { terminalHTML('<span class="term-warn">basename: 缺少操作数</span>'); return; }
      let value = termBaseName(tokens[0].replace(/\/+$/, ''));
      if (tokens[1]) value = value.endsWith(tokens[1]) ? value.slice(0, -tokens[1].length) : value;
      terminalPrint(value);
      return;
    }
    if (command === 'dirname') {
      if (!tokens[0]) { terminalHTML('<span class="term-warn">dirname: 缺少操作数</span>'); return; }
      terminalPrint(tokens[0].includes('/') ? tokens[0].slice(0, tokens[0].lastIndexOf('/')) || '/' : '.');
      return;
    }
    if (command === 'realpath' || command === 'readlink') {
      if (!tokens[0]) { terminalHTML(`<span class="term-warn">${command}: 缺少操作数</span>`); return; }
      const path = terminalResolvePath(tokens[0]);
      if (command === 'readlink') {
        const read = termReadFile(path);
        const match = read.error ? null : read.text.match(/^(symlink|hardlink) -> (.+)$/);
        terminalPrint(match ? match[2] : '');
      } else {
        terminalPrint(termAbsolutePath(path));
      }
      return;
    }
    if (command === 'md5sum' || command === 'sha256sum') {
      terminalChecksum(command, argument);
      return;
    }
    if (command === 'dd') {
      const input = tokens.find((token) => token.startsWith('if='))?.slice(3) || '/dev/zero';
      const output = tokens.find((token) => token.startsWith('of='))?.slice(3);
      if (!output) { terminalHTML('<span class="term-warn">dd: 缺少 of= 输出目标</span>'); return; }
      terminalPrint(`记录了 ${input} 的输入`, 'term-line term-muted');
      terminalPrint(`记录了 ${output} 的输出`, 'term-line term-muted');
      terminalPrint('复制了 1048576 字节（1.0 MB，模拟）', 'term-line term-muted');
      return;
    }
    if (command === 'mkfs' || command.startsWith('mkfs.')) {
      const target = tokens.find((token) => !token.startsWith('-'));
      if (!target) { terminalHTML('<span class="term-warn">mkfs: 缺少设备或镜像路径</span>'); return; }
      terminalPrint(`mke2fs 1.47.1 (20-Nov-2024)`, 'term-line term-muted');
      terminalPrint(`正在创建文件系统，块大小=4096：${target}`, 'term-line term-muted');
      terminalPrint('写入超级块与 inode 表：完成（模拟）', 'term-line term-success');
      return;
    }
    if (command === 'wipefs' || command === 'shred') {
      const target = tokens.find((token) => !token.startsWith('-'));
      if (!target) { terminalHTML(`<span class="term-warn">${command}: 缺少目标</span>`); return; }
      terminalPrint(command === 'wipefs' ? `wipefs: 已擦除 ${target} 的签名（模拟）` : `shred: ${target}: 已通过 3 次覆写（模拟）`, 'term-line term-muted');
      return;
    }
    if (command === 'truncate') {
      const values = tokens.filter((token) => !token.startsWith('-'));
      const target = values[values.length - 1];
      if (!target || values.length < 2) { terminalHTML('<span class="term-warn">truncate: 缺少目标文件</span>'); return; }
      const path = terminalResolvePath(target);
      if (!termCanWrite(path) || !termWriteFile(path, '')) terminalHTML(`<span class="term-error">truncate: 无法修改 '${escapeHTML(target)}': 权限不够</span>`);
      return;
    }
    if (command === 'base64') {
      const decode = tokens.includes('-d') || tokens.includes('--decode');
      const values = tokens.filter((token) => !token.startsWith('-'));
      let text = values.length ? termReadFile(terminalResolvePath(values[0])) : { text: lastOutputText };
      if (text.error) {
        terminalHTML(`<span class="term-error">base64: ${escapeHTML(text.error)}</span>`);
        return;
      }
      try {
        terminalPrint(decode ? termBase64Utf8(text.text) : termUtf8Base64(text.text));
      } catch (error) {
        terminalHTML('<span class="term-error">base64: 输入无效</span>');
      }
      return;
    }
    if (command === 'tar' || command === 'zip' || command === 'unzip' || command === 'gzip' || command === 'gunzip') {
      if (command === 'tar') {
        const extract = tokens.some((token) => /^-[a-zA-Z]*x/.test(token));
        const archive = tokens.find((token) => /\.(tar|tgz|tar\.gz|tar\.bz2)$/i.test(token)) || 'archive.tar.gz';
        const archivePath = terminalResolvePath(archive);
        if (extract) {
          const read = termReadFile(archivePath);
          if (read.error) { terminalHTML(`<span class="term-error">tar: ${escapeHTML(archive)}: 没有那个文件或目录</span>`); return; }
          terminalHTML(`<pre class="term-pre">${escapeHTML(archive)}\n已解包：项目/\n已解包：项目/笔记.md\n已解包：说明.md</pre>`);
          return;
        }
        if (!termWriteFile(archivePath, `tar archive ${new Date().toISOString()}`)) {
          terminalHTML(`<span class="term-error">tar: 无法创建 ${escapeHTML(archive)}: 权限不够</span>`);
          return;
        }
        terminalPrint(`已创建归档 ${archive}`, 'term-line term-muted');
        return;
      }
      if (command === 'zip') {
        const values = tokens.filter((token) => !token.startsWith('-'));
        const archive = values[0] || 'archive.zip';
        const archivePath = terminalResolvePath(archive);
        if (!termWriteFile(archivePath, `zip archive: ${values.slice(1).join(' ')}`)) {
          terminalHTML(`<span class="term-error">zip: 无法创建 ${escapeHTML(archive)}</span>`);
          return;
        }
        terminalHTML(`<pre class="term-pre">  adding: ${escapeHTML(values[1] || '文件')} (deflated 42%)\n  adding: 说明.md (deflated 18%)</pre>`);
        return;
      }
      if (command === 'unzip') {
        const archive = tokens.find((token) => /\.zip$/i.test(token)) || 'archive.zip';
        const path = terminalResolvePath(archive);
        if (!termFileExists(path)) { terminalHTML(`<span class="term-error">unzip: 无法找到 ${escapeHTML(archive)}</span>`); return; }
        terminalHTML(`<pre class="term-pre">Archive:  ${escapeHTML(archive)}\n  inflating: 说明.md\n  inflating: 项目/笔记.md</pre>`);
        return;
      }
      const file = tokens.find((token) => !token.startsWith('-'));
      if (!file) { terminalHTML(`<span class="term-warn">${command}: 缺少文件操作数</span>`); return; }
      const path = terminalResolvePath(file);
      if (command === 'gzip') {
        const read = termReadFile(path);
        if (read.error) { terminalHTML(`<span class="term-error">gzip: ${escapeHTML(file)}: ${escapeHTML(read.error)}</span>`); return; }
        if (termWriteFile(`${path}.gz`, read.text)) termRemovePath(path, false);
        terminalPrint(`已压缩 ${file} -> ${file}.gz`, 'term-line term-muted');
        return;
      }
      if (!/\.gz$/i.test(path)) { terminalHTML(`<span class="term-error">gunzip: ${escapeHTML(file)}: 不是 gzip 格式</span>`); return; }
      const read = termReadFile(path);
      if (read.error) { terminalHTML(`<span class="term-error">gunzip: ${escapeHTML(file)}: ${escapeHTML(read.error)}</span>`); return; }
      termWriteFile(path.replace(/\.gz$/i, ''), read.text);
      termRemovePath(path, false);
      terminalPrint(`已解压 ${file}`, 'term-line term-muted');
      return;
    }
    if (command === 'vim' || command === 'nano' || command === 'emacs' || command === 'vi') {
      const requested = tokens.find((token) => !token.startsWith('-'));
      if (!requested) {
        terminalPrint(`${command}: 已打开模拟编辑器，未指定文件。`, 'term-line term-muted');
        return;
      }
      const path = terminalResolvePath(requested);
      const read = termReadFile(path);
      if (read.error && command === 'vim') {
        termWriteFile(path, '');
        terminalPrint(`"${requested}" [新文件]  0L, 0B`, 'term-line term-muted');
        return;
      }
      if (!read.error) {
        const preview = read.text.split('\n').slice(0, 10).map((line, index) => `${String(index + 1).padStart(3, ' ')}  ${line}`).join('\n');
        terminalHTML(`<pre class="term-pre">${escapeHTML(preview)}\n~\n~\n"${escapeHTML(requested)}" ${read.text.split('\n').length}L, ${new TextEncoder().encode(read.text).length}B</pre>`);
        terminalPrint(`${command}: 只读预览模式，按 :q 退出（模拟）。`, 'term-line term-muted');
      }
      return;
    }
    if (command === 'printf') {
      let format = tokens[0] || '';
      const values = tokens.slice(1);
      let index = 0;
      const output = format.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/%[sd]/g, () => values[index++] ?? '');
      terminalPrint(output);
      lastOutputText = output;
      return;
    }
    if (command === 'cowsay') {
      const text = argument || '专注，凝练。';
      const top = ` ${'_'.repeat(text.length + 2)}`;
      const bottom = ` ${'-'.repeat(text.length + 2)}`;
      terminalHTML(`<pre class="term-pre">${escapeHTML(`${top}\n< ${text} >\n${bottom}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`)}</pre>`);
      return;
    }
    if (command === 'fortune') {
      const fortunes = LINUX.FORTUNES || ['精准不是更多，而是更少。'];
      terminalPrint(fortunes[Math.floor(Math.random() * fortunes.length)]);
      return;
    }
    if (command === 'sl') {
      terminalHTML('<pre class="term-pre">      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|\n   |(_)---  |   H\\________/ |   |        =|___ ___|  |\n   /     |  |   H  |  |     |   |         ||_| |_||  |\n  |      |  |   H  |__--------------------| [___] |  |\n  | ________|___H__/__|_____/[][]~\\_______|       |  |\n  |/ |   |-----------I_____I [][] []  D   |=======|__|\n__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|\n |/-=|___|=O=====O=====O=====O   |_____/~\\___/        |\n  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            \\_/</pre>');
      terminalPrint('sl: 你输入的是 sl，不是 ls。', 'term-line term-muted');
      return;
    }
    if (command === 'matrix' || command === 'cmatrix') {
      const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';
      const lines = Array.from({ length: 14 }, () => Array.from({ length: 64 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(''));
      terminalHTML(`<pre class="term-pre" style="color:#7bdfbd;text-shadow:0 0 8px rgba(100,255,190,.25)">${escapeHTML(lines.join('\n'))}</pre>`);
      terminalPrint('matrix: 模拟数字雨已生成。', 'term-line term-muted');
      return;
    }
    if (command === 'banner' || command === 'figlet') {
      const text = (argument || 'AISNIPER').toUpperCase().slice(0, 18);
      const lines = [
        `╔${'═'.repeat(text.length + 2)}╗`,
        `║ ${text} ║`,
        `╚${'═'.repeat(text.length + 2)}╝`
      ];
      terminalHTML(`<pre class="term-pre" style="color:#e4d7a9">${escapeHTML(lines.join('\n'))}</pre>`);
      return;
    }
  }

  function terminalCommandOpen(argument) {
    const name = termSplit(argument)[0] || '';
    if (!name) {
      terminalHTML('<span class="term-muted">用法：</span>open <span class="term-key">finder | browser | messages | agent | calculator | settings | terminal | ops | steam | unity | game</span>');
      return;
    }
    const aliases = { '访达': 'finder', '浏览器': 'browser', '计算器': 'calculator', '系统设置': 'settings', '终端': 'terminal', '深空信号': 'game', '游戏': 'game', '设置': 'settings', '信息': 'messages', '消息': 'messages', '智能体': 'agent', 'AI': 'agent', 'ai': 'agent', '运维台': 'ops', '面板': 'ops', '宝塔': 'ops', 'Steam': 'steam', 'steam': 'steam', '反恐精英': 'cs2', 'CS2': 'cs2', 'cs2': 'cs2', 'VR聊天': 'vrchat', 'VRChat': 'vrchat', 'vrchat': 'vrchat', 'SteamVR': 'steamvr', 'OVR': 'ovrtk', 'OVR Toolkit': 'ovrtk', 'ovr': 'ovrtk', '史莱姆': 'slimevr', 'SlimeVR': 'slimevr', 'slimevr': 'slimevr', 'Unity': 'unity', 'unity': 'unity', '编辑器': 'unity' };
    const target = aliases[name] || name.toLowerCase();
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
    terminalHTML(`<span class="term-error">open：未找到应用“${escapeHTML(name)}”</span>`);
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
      terminalHTML(`<span class="term-error">bash：没有找到脚本：${escapeHTML(command)}</span> <span class="term-muted">输入</span> <span class="term-key">scripts</span> <span class="term-muted">查看可用脚本。</span>`);
    }
  }

  function systemWipeRecord() {
    try {
      const raw = localStorage.getItem(SYSTEM_WIPED_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : { command: 'rm -rf /' };
    } catch (error) {
      return { command: 'rm -rf /' };
    }
  }

  function terminalWipeStorage(command) {
    const doomed = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith('aisniper')) doomed.push(key);
      }
      doomed.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(SYSTEM_WIPED_KEY, JSON.stringify({ command, at: Date.now(), version: '26.1.4' }));
    } catch (error) { /* storage can be unavailable */ }
  }

  let kernelRecoverBound = false;

  function showKernelPanic(command, options = {}) {
    const overlay = $('#kernelPanic');
    if (!overlay) return;
    document.body.classList.remove('is-booting');
    document.body.classList.add('is-kernel-panic');
    const boot = $('#bootScreen');
    if (boot) {
      boot.classList.add('is-ready');
      boot.style.display = 'none';
    }
    const login = $('#loginScreen');
    if (login) {
      login.classList.remove('is-visible');
      login.setAttribute('aria-hidden', 'true');
    }
    const actions = $('#kernelPanicActions');
    if (actions) actions.hidden = true;
    overlay.hidden = false;
    const log = $('#kernelPanicLog');
    if (!log) return;
    log.replaceChildren();
    const lines = [
      ['AISNIPEROS 26.1.4 LTS  ·  emergency console  ·  tty1', 'kp-dim'],
      ['', ''],
      ['[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x410fd0c0]', 'kp-dim'],
      ['[    0.000000] Linux version 6.8.0-aisniper (build@aquila) #1 SMP PREEMPT_DYNAMIC aarch64', 'kp-dim'],
      ['[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.8.0-aisniper root=/dev/aisniper0 ro quiet', 'kp-dim'],
      ['[    0.284913] AISniper security monitor: integrity seal broken', 'kp-warn'],
      ['[    0.285004] AISniper security monitor: root volume signature missing', 'kp-warn'],
      ['[    0.842110] EXT4-fs (sda1): VFS: Can\'t find ext4 filesystem', 'kp-warn'],
      ['[    1.027481] systemd[1]: Failed to mount /sysroot.', 'kp-critical'],
      ['[    1.248331] systemd[1]: Emergency mode entered, but root file system is missing.', 'kp-critical'],
      [`[    1.249002] recovery: last destructive command: ${command || 'rm -rf /'}`, 'kp-critical'],
      ['[    1.250114] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)', 'kp-critical'],
      ['[    1.250337] CPU: 0 PID: 1 Comm: systemd Not tainted 6.8.0-aisniper #1', 'kp-grey'],
      ['[    1.250512] Hardware name: AISniper M1 Neural Core / AISNIPER-AQUILA', 'kp-grey'],
      ['[    1.250671] Call trace:', 'kp-grey'],
      ['[    1.250802]  dump_backtrace+0x0/0x1c0', 'kp-grey'],
      ['[    1.250941]  show_stack+0x20/0x70', 'kp-grey'],
      ['[    1.251094]  dump_stack_lvl+0x60/0x88', 'kp-grey'],
      ['[    1.251237]  panic+0x180/0x3b0', 'kp-grey'],
      ['[    1.251374]  mount_block_root+0x1a4/0x290', 'kp-grey'],
      ['[    1.251528]  prepare_namespace+0x150/0x1a0', 'kp-grey'],
      ['[    1.251694]  kernel_init+0x1d0/0x1e0', 'kp-grey'],
      ['[    1.251835]  ret_from_fork+0x10/0x20', 'kp-grey'],
      ['[    1.252004] ---[ end Kernel panic - not syncing: VFS ]---', 'kp-critical'],
      ['', ''],
      ['系统卷已丢失。所有 AISniperOS 本地数据已从 localStorage 中移除。', 'kp-dim'],
      ['救援镜像仍在浏览器静态缓存中，可执行冷重建。', 'kp-dim']
    ];
    const step = options.startup ? 0 : 42;
    lines.forEach(([text, className], index) => {
      const line = document.createElement('span');
      line.className = `kp-line ${className}`.trim();
      line.textContent = text || ' ';
      if (step === 0) {
        log.appendChild(line);
        return;
      }
      setTimeout(() => {
        log.appendChild(line);
        overlay.scrollTop = overlay.scrollHeight;
      }, index * step);
    });
    if (step === 0) overlay.scrollTop = 0;
    setTimeout(() => {
      if (actions) actions.hidden = false;
    }, lines.length * step + (options.startup ? 80 : 380));
    if (!kernelRecoverBound) {
      kernelRecoverBound = true;
      $('#kernelRecoverBtn')?.addEventListener('click', () => {
        try { localStorage.removeItem(SYSTEM_WIPED_KEY); } catch (error) { /* no-op */ }
        location.reload();
      });
    }
  }

  function terminalCatastrophe(raw) {
    if (terminalCatastropheRunning) return;
    terminalCatastropheRunning = true;
    const reason = LINUX.dangerReason ? LINUX.dangerReason(raw) : '不可逆的系统级操作';
    const steps = [
      ['term-error', `bash: 检测到 root 级不可逆操作：${raw}`],
      ['term-warn', `bash: 操作类型：${reason}`],
      ['term-error', 'rm: 正在递归删除 / ...'],
      ['term-success', "[  OK  ] Removed /bin"],
      ['term-success', "[  OK  ] Removed /boot"],
      ['term-success', "[  OK  ] Removed /etc"],
      ['term-success', "[  OK  ] Removed /home"],
      ['term-success', "[  OK  ] Removed /lib"],
      ['term-success', "[  OK  ] Removed /opt"],
      ['term-success', "[  OK  ] Removed /sbin"],
      ['term-success', "[  OK  ] Removed /usr"],
      ['term-success', "[  OK  ] Removed /var"],
      ['term-error', "rm: 无法删除 '/dev/watchdog': 设备或资源忙"],
      ['term-error', "rm: 无法删除 '/proc/kcore': 权限不够"],
      ['term-error', "rm: 无法删除 '/sys/firmware': 只读文件系统"],
      ['term-warn', '[  FAILED  ] Failed unmounting /home.'],
      ['term-error', '[    2.114] I/O error, dev sda, sector 0 op 0x1:(WRITE)'],
      ['term-error', '[    2.881] EXT4-fs error (device sda1): detected aborted journal'],
      ['term-error', '[    2.999] Kernel panic - not syncing: VFS: Unable to mount root fs'],
      ['term-error', 'Segmentation fault (core dumped)']
    ];
    terminalHTML('<div class="term-rule term-danger-rule">UNRECOVERABLE OPERATION</div>');
    steps.forEach(([className, text], index) => {
      setTimeout(() => {
        terminalPrint(text, `term-line ${className}`);
        if (index === steps.length - 1) {
          setTimeout(() => {
            terminalWipeStorage(raw);
            showKernelPanic(raw);
            terminalCatastropheRunning = false;
          }, 220);
        }
      }, index * 82);
    });
  }

  function terminalCommandSudo(argument) {
    if (!argument) {
      terminalHTML('<span class="term-warn">权限已授予——但只有操作员决定准星落在哪里。</span>');
      return;
    }
    terminalPrint('[sudo] sniper 的密码：********', 'term-line term-muted');
    terminalPrint('已获得 root 权限，正在执行。', 'term-line term-muted');
    terminalSudoDepth += 1;
    terminalExecute(argument, { silentEcho: true, recordHistory: false });
    terminalSudoDepth = Math.max(0, terminalSudoDepth - 1);
  }

  function terminalCommandUser(command, argument) {
    const target = termSplit(argument).find((token) => !token.startsWith('-')) || '';
    if (command === 'passwd') {
      terminalHTML('<pre class="term-pre">更改 sniper 的密码。\n当前密码：********\n新密码：********\n重新输入新密码：********\npasswd: 密码已更新成功</pre>');
      return;
    }
    if (command === 'su') {
      terminalHTML('<span class="term-error">su: 认证失败</span> <span class="term-muted">AISniperOS 演示账户不启用 root 登录，请使用 sudo。</span>');
      return;
    }
    if (command === 'useradd' || command === 'adduser') {
      if (!target) { terminalHTML(`<span class="term-warn">${command}: 缺少用户名</span>`); return; }
      terminalHTML(`<span class="term-success">${command}: 已创建用户 ${escapeHTML(target)}（模拟）</span>`);
      return;
    }
    if (command === 'userdel') {
      if (!target) { terminalHTML('<span class="term-warn">userdel: 缺少用户名</span>'); return; }
      terminalHTML(`<span class="term-muted">userdel: 已删除用户 ${escapeHTML(target)}（模拟）</span>`);
      return;
    }
    if (command === 'usermod') {
      terminalHTML(`<span class="term-muted">usermod: 已更新 ${escapeHTML(target || '用户')} 的属性（模拟）</span>`);
      return;
    }
    if (command === 'groupadd') {
      if (!target) { terminalHTML('<span class="term-warn">groupadd: 缺少组名</span>'); return; }
      terminalHTML(`<span class="term-muted">groupadd: 已创建组 ${escapeHTML(target)}（模拟）</span>`);
    }
  }

  function terminalCommandEcho(argument, tokens) {
    let noNewline = false;
    let interpret = false;
    const values = [];
    tokens.forEach((token) => {
      if (token === '-n') noNewline = true;
      else if (token === '-e') interpret = true;
      else values.push(token);
    });
    let text = values.join(' ');
    text = text.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (match, braced, plain) => {
      const key = braced || plain;
      return TERM_ENV[key] ?? '';
    });
    if (interpret) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\e/g, '\x1b');
    if (noNewline) terminalHTML(`<span class="term-file">${escapeHTML(text)}</span>`, 'term-line');
    else terminalPrint(text);
    lastOutputText = text;
  }

  function terminalSplitChain(input) {
    const parts = [];
    let buffer = '';
    let quote = '';
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quote) {
        buffer += char;
        if (char === quote && input[index - 1] !== '\\') quote = '';
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        buffer += char;
        continue;
      }
      if (char === ';') {
        if (buffer.trim()) parts.push(buffer.trim());
        buffer = '';
        continue;
      }
      if (char === '&' && input[index + 1] === '&') {
        if (buffer.trim()) parts.push(buffer.trim());
        buffer = '';
        index += 1;
        continue;
      }
      buffer += char;
    }
    if (buffer.trim()) parts.push(buffer.trim());
    return parts;
  }

  function terminalSplitPipes(input) {
    const parts = [];
    let buffer = '';
    let quote = '';
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quote) {
        buffer += char;
        if (char === quote && input[index - 1] !== '\\') quote = '';
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        buffer += char;
        continue;
      }
      if (char === '|' && input[index - 1] !== '|' && input[index + 1] !== '|') {
        if (buffer.trim()) parts.push(buffer.trim());
        buffer = '';
        continue;
      }
      buffer += char;
    }
    if (buffer.trim()) parts.push(buffer.trim());
    return parts;
  }

  function terminalExecute(raw, options = {}) {
    const input = String(raw || '').trim();
    if (!input || terminalCatastropheRunning) return;
    if (!options.silentEcho) terminalEcho(input);
    if (options.recordHistory !== false) {
      if (terminalCommandHistory[terminalCommandHistory.length - 1] !== input) terminalCommandHistory.push(input);
      if (terminalCommandHistory.length > 80) terminalCommandHistory.shift();
      terminalHistoryIndex = terminalCommandHistory.length;
    }
    const chain = terminalSplitChain(input);
    if (chain.length > 1) {
      chain.forEach((part) => terminalExecute(part, { silentEcho: true, recordHistory: false }));
      return;
    }
    const pipeline = terminalSplitPipes(input);
    if (pipeline.length > 1) {
      const previousCapture = terminalCaptureBuffer;
      pipeline.forEach((part, index) => {
        if (index < pipeline.length - 1) {
          terminalCaptureBuffer = [];
          terminalExecute(part, { silentEcho: true, recordHistory: false });
          lastOutputText = terminalCaptureBuffer.join('\n');
          terminalCaptureBuffer = previousCapture;
        } else {
          terminalExecute(part, { silentEcho: true, recordHistory: false });
        }
      });
      return;
    }
    const rawTokens = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    let command = (rawTokens.shift() || '').replace(/^["']|["']$/g, '').toLowerCase();
    if (!command) return;
    let argTokens = rawTokens;
    const expansion = terminalAliases[command];
    if (expansion) {
      const expanded = termSplit(expansion);
      command = (expanded.shift() || '').toLowerCase();
      argTokens = [...expanded, ...argTokens];
    }
    const argument = argTokens.join(' ');
    const dispatchInput = [command, ...argTokens].join(' ');
    if (typeof LINUX.isCatastrophic === 'function' && LINUX.isCatastrophic(dispatchInput, terminalCwd)) {
      terminalCatastrophe(dispatchInput);
      return;
    }
    const tokens = argTokens.map((token) => token.replace(/^["']|["']$/g, ''));
    const fileCommands = ['ls', 'cd', 'pwd', 'cat', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'ln', 'find', 'tree', 'stat', 'file', 'du', 'df'];
    const textCommands = ['head', 'tail', 'less', 'more', 'wc', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'grep', 'diff', 'tee', 'xargs'];
    const systemCommands = ['ps', 'top', 'htop', 'kill', 'pkill', 'killall', 'pgrep', 'free', 'vmstat', 'lscpu', 'lsblk', 'lspci', 'lsusb', 'dmesg', 'journalctl', 'systemctl', 'service', 'mount', 'umount', 'crontab', 'date', 'cal', 'timedatectl', 'hostname', 'hostnamectl', 'arch', 'nproc', 'id', 'groups', 'who', 'w', 'users', 'last', 'lastlog', 'env', 'printenv', 'export', 'unset', 'alias', 'unalias', 'source', '.', 'which', 'whereis', 'type', 'command', 'sleep', 'seq', 'yes', 'true', 'false', 'test', 'expr', 'bc', 'factor', 'shuf'];
    const networkCommands = ['ping', 'traceroute', 'tracepath', 'dig', 'nslookup', 'host', 'curl', 'wget', 'ssh', 'scp', 'rsync', 'netstat', 'ss', 'ip', 'ifconfig', 'route', 'arp', 'nmap'];
    const toolCommands = ['apt', 'apt-get', 'dpkg', 'dnf', 'yum', 'pacman', 'apk', 'brew', 'snap', 'flatpak', 'pip', 'pip3', 'npm', 'node', 'python', 'python3', 'git', 'make', 'gcc', 'java', 'go', 'rustc', 'bash', 'sh', 'zsh'];
    const miscCommands = ['chmod', 'chown', 'chgrp', 'umask', 'basename', 'dirname', 'realpath', 'readlink', 'md5sum', 'sha256sum', 'base64', 'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'vim', 'vi', 'nano', 'emacs', 'printf', 'cowsay', 'fortune', 'sl', 'matrix', 'cmatrix', 'banner', 'figlet', 'dd', 'mkfs', 'mkfs.ext4', 'wipefs', 'shred', 'truncate'];
    const userCommands = ['passwd', 'su', 'useradd', 'userdel', 'usermod', 'groupadd', 'adduser'];

    if (command === 'help') terminalCommandHelp(termSplit(argument)[0] || '');
    else if (command === 'man' || command === 'info') terminalCommandMan(termSplit(argument)[0] || '');
    else if (command === 'whatis') {
      const name = termSplit(argument)[0];
      const page = LINUX.MAN_PAGES?.[name];
      const info = LINUX.HELP_INDEX?.[name];
      if (!name || (!page && !info)) terminalHTML(`<span class="term-error">${escapeHTML(name || '')}: 没有可用描述</span>`);
      else terminalPrint(`${name} (1) - ${page?.summary || info.description}`);
    } else if (command === 'apropos') {
      const query = termSplit(argument)[0] || '';
      if (!query) terminalHTML('<span class="term-warn">apropos: 缺少搜索词</span>');
      else {
        const matches = Object.entries(LINUX.HELP_INDEX || {}).filter(([name, info]) => name.includes(query) || info.description.includes(query));
        matches.forEach(([name, info]) => terminalPrint(`${name} (1) - ${info.description}`));
        if (!matches.length) terminalPrint(`${query}: 没有匹配的手册页`, 'term-line term-muted');
      }
    } else if (command === 'clear') terminalClear();
    else if (command === 'pwd') terminalPrint(termAbsolutePath(terminalCwd));
    else if (command === 'ls') terminalCommandLs(argument);
    else if (command === 'cd') terminalCommandCd(argument);
    else if (command === 'cat') terminalCommandCat(argument);
    else if (command === 'touch') terminalCommandTouch(argument);
    else if (command === 'mkdir') terminalCommandMkdir(argument);
    else if (command === 'rmdir') terminalCommandRmdir(argument);
    else if (command === 'rm') terminalCommandRm(argument);
    else if (command === 'cp') terminalCommandCp(argument);
    else if (command === 'mv') terminalCommandMv(argument);
    else if (command === 'ln') terminalCommandLn(argument);
    else if (command === 'find') terminalCommandFind(argument);
    else if (command === 'tree') terminalCommandTree(argument);
    else if (command === 'stat') terminalCommandStat(argument);
    else if (command === 'file') terminalCommandFileInfo(argument);
    else if (command === 'du') terminalCommandDu(argument);
    else if (command === 'df') terminalCommandDf(argument);
    else if (textCommands.includes(command)) terminalCommandText(command, argument);
    else if (systemCommands.includes(command)) terminalCommandSystem(command, argument);
    else if (networkCommands.includes(command)) terminalCommandNetworkTool(command, argument);
    else if (toolCommands.includes(command)) terminalCommandTool(command, argument);
    else if (miscCommands.includes(command)) terminalCommandMisc(command, argument);
    else if (userCommands.includes(command)) terminalCommandUser(command, argument);
    else if (command === 'open') terminalCommandOpen(argument);
    else if (command === 'game' || command === 'void') { openApp('game'); terminalHTML('<span class="term-success">正在打开《深空信号》轨道界面…</span>'); }
    else if (command === 'theme') terminalCommandTheme(termSplit(argument)[0] || '');
    else if (command === 'wifi') terminalCommandWifi(termSplit(argument)[0] || '');
    else if (command === 'network') terminalCommandNetwork();
    else if (command === 'deploy') terminalCommandDeploy(termSplit(argument)[0] || 'baota');
    else if (command === 'docker') terminalCommandDocker(argument);
    else if (command === 'bt') terminalCommandBt();
    else if (command === 'panel' || command === 'ops') { openApp('ops'); terminalHTML('<span class="term-success">正在打开运维台…</span>'); }
    else if (command === 'steam') { openApp('steam'); terminalHTML('<span class="term-success">正在打开 Steam…</span>'); }
    else if (command === 'unity') { openApp('unity'); terminalHTML('<span class="term-success">正在打开 AISniper Unity…</span>'); }
    else if (['cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr'].includes(command)) { openApp(command); terminalHTML(`<span class="term-success">正在启动 ${escapeHTML(APPS[command].name)}…</span>`); }
    else if (command === 'scripts') terminalCommandScripts();
    else if (command === 'status' || command === 'health') terminalCommandStatus();
    else if (command === 'neofetch' || command === 'fastfetch') terminalCommandNeofetch();
    else if (command === 'whoami') terminalPrint('sniper');
    else if (command === 'uptime') terminalPrint(` ${new Date().toLocaleTimeString('zh-CN', { hour12: false })} up 5:07,  1 user,  load average: 0.21, 0.18, 0.14`);
    else if (command === 'uname') {
      const flag = tokens[0] || '';
      const full = 'Linux aisniper 6.8.0-aisniper #1 SMP PREEMPT_DYNAMIC Wed Nov 12 02:41:16 UTC 2026 aarch64 GNU/Linux';
      if (flag === '-a' || flag === '--all') terminalPrint(full);
      else if (flag === '-r' || flag === '--kernel-release') terminalPrint('6.8.0-aisniper');
      else if (flag === '-m' || flag === '--machine') terminalPrint('aarch64');
      else if (flag === '-s' || flag === '--kernel-name') terminalPrint('Linux');
      else if (flag === '-n' || flag === '--nodename') terminalPrint('aisniper');
      else if (flag === '-o' || flag === '--operating-system') terminalPrint('AISniperOS');
      else terminalPrint(full);
    } else if (command === 'echo') terminalCommandEcho(argument, tokens);
    else if (command === 'history') {
      if (tokens.includes('-c')) {
        terminalCommandHistory = [];
        terminalHistoryIndex = 0;
      } else {
        terminalCommandHistory.forEach((item, index) => terminalHTML(`<span class="term-muted">${String(index + 1).padStart(4, ' ')}</span>  ${escapeHTML(item)}`));
      }
    } else if (command === 'about') {
      terminalHTML('<span class="term-accent">AISniperOS 26.1.4 LTS（天鹰座）</span> · 专注，凝练。');
      terminalPrint('一个浏览器原生桌面，为精确思考与深夜轨道而生。', 'term-line term-muted');
    } else if (command === 'sudo') {
      terminalCommandSudo(argument);
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
      terminalHTML(`<span class="term-error">bash: ${escapeHTML(command)}: 未找到命令</span> <span class="term-muted">输入</span> <span class="term-key">help</span> <span class="term-muted">查看完整命令索引。</span>`);
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
      { title: '终端', subtitle: '直连 AISniper 核心与服务器', type: '应用', icon: 'app-terminal', app: true, keywords: '命令 终端 命令行 shell command bash zsh linux docker deploy', action: () => openApp('terminal') },
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
    const wipeRecord = systemWipeRecord();
    if (wipeRecord) {
      showKernelPanic(wipeRecord.command || 'rm -rf /', { startup: true });
      return;
    }
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
