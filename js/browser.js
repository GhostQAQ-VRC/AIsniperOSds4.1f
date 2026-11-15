/* ==========================================================================
   AISniperOS Browser — external web tabs plus a simulated intranet.
   ========================================================================== */

(() => {
  'use strict';

  const SEARCH_ENGINES = {
    google: { label: 'Google', url: 'https://www.google.com/search?igu=1&q=' },
    baidu: { label: '百度', url: 'https://www.baidu.com/s?wd=' }
  };
  const BOOKMARKS_KEY = 'aisniperos.browser.bookmarks.v1';
  const ENGINE_KEY = 'aisniperos.browser.engine.v1';
  const MAX_TABS = 10;
  const INTERNAL_HOSTS = {
    '192.168.1.1': 'router',
    'router.local': 'router',
    'gateway.local': 'router',
    '192.168.1.20': 'nas',
    'nas.local': 'nas',
    'vault.local': 'nas',
    'aisniper.local': 'portal',
    'intranet.local': 'portal',
    'home.local': 'portal'
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const escapeAttr = (value) => escapeHTML(value).replace(/`/g, '&#96;');

  let host = null;
  let ui = null;
  let controller = null;
  let tabs = [];
  let activeId = null;
  let sequence = 0;
  let bookmarks = loadBookmarks();
  let searchEngine = loadSearchEngine();
  let recents = [];
  let loginError = '';
  let rebootTimer = null;
  let diagTimer = null;

  const router = {
    loggedIn: false,
    wifi: true,
    guest: true,
    firewall: true,
    upnp: false,
    remoteAdmin: false,
    dhcp: true,
    ssid: 'AISNIPER-5G',
    wifiPassword: 'aisniper-2026',
    band: '自动',
    channel: '自动',
    poolStart: '192.168.1.100',
    poolEnd: '192.168.1.200',
    lease: '24 小时',
    firmware: '26.4.1',
    rebooting: false,
    rebootProgress: 0,
    diagRunning: '',
    diagResults: {},
    logFilter: 'all',
    firewallRules: [
      { name: '允许局域网访问 RouterOS', target: '192.168.1.0/24', port: '8443', action: '允许' },
      { name: '阻止来自 WAN 的管理端口', target: 'WAN', port: '22 / 23', action: '拒绝' },
      { name: 'Steam 下载加速', target: '192.168.1.42', port: '27015-27050', action: '允许' }
    ],
    logs: [
      { time: '21:47:18', text: 'WAN 链路已建立 · DHCP lease renewed', type: 'info' },
      { time: '20:12:04', text: 'Wireless: AISNIPER-5G 保持连接', type: 'info' },
      { time: '19:40:22', text: 'Client Mira-Phone 加入 5 GHz 网络', type: 'info' },
      { time: '18:06:51', text: 'Firewall: blocked inbound probe from 45.61.184.9', type: 'warning' },
      { time: '17:22:13', text: 'NAS 192.168.1.20 请求了固定租约', type: 'info' },
      { time: '15:08:44', text: 'System firmware check completed · 26.4.1', type: 'info' }
    ],
    clients: [
      { id: 'sniper-mac', name: 'Sniper 的 Mac', type: '工作站', ip: '192.168.1.42', mac: '8C:85:90:2A:71:0C', band: '5 GHz', signal: 94, online: true, blocked: false, note: '这台设备 · 当前浏览会话' },
      { id: 'mira-phone', name: 'Mira 的手机', type: '手机', ip: '192.168.1.51', mac: 'A4:83:E7:19:6B:21', band: '5 GHz', signal: 86, online: true, blocked: false, note: '最近活动 · 2 分钟前' },
      { id: 'kai-pc', name: 'KAI-PC', type: '游戏主机', ip: '192.168.1.62', mac: '04:D4:C4:88:1F:90', band: '2.4 GHz', signal: 72, online: true, blocked: false, note: 'Steam 正在下载' },
      { id: 'vault-nas', name: 'AISniper Vault', type: 'NAS', ip: '192.168.1.20', mac: '00:11:32:7C:4D:09', band: '有线', signal: 100, online: true, blocked: false, note: '固定租约 · 存储池正常' },
      { id: 'living-tv', name: 'Living Room TV', type: '电视', ip: '192.168.1.73', mac: 'D8:3A:DD:92:11:44', band: '5 GHz', signal: 66, online: true, blocked: false, note: '空闲' },
      { id: 'pixel-pad', name: 'PixelPad', type: '平板', ip: '192.168.1.77', mac: 'F0:18:98:47:0B:BE', band: '5 GHz', signal: 58, online: true, blocked: false, note: '低功耗待机' },
      { id: 'guest-phone', name: 'Guest Phone', type: '访客设备', ip: '192.168.1.153', mac: '2C:54:91:33:AE:7D', band: '访客网络', signal: 44, online: true, blocked: false, note: '受访客隔离策略保护' },
      { id: 'slime-receiver', name: 'SlimeVR RX', type: '追踪器', ip: '192.168.1.88', mac: '7C:9E:BD:51:A2:10', band: '2.4 GHz', signal: 63, online: true, blocked: false, note: '六个追踪器 · 低延迟模式' }
    ]
  };

  const nas = {
    name: 'AISniper Vault',
    files: {
      '/': [
        { type: 'folder', id: 'Photos', name: '照片与截图', meta: '12,408 个文件' },
        { type: 'folder', id: 'Projects', name: '项目归档', meta: '38 个文件夹' },
        { type: 'folder', id: 'Media', name: '电影与音乐', meta: '1.8 TB · 194 个文件' },
        { type: 'folder', id: 'Backups', name: '设备备份', meta: '6 个快照' },
        { type: 'folder', id: 'Documents', name: '文稿', meta: '4,221 个文件' },
        { type: 'file', name: 'family-archive.zip', meta: '4.2 GB · 2026-11-12', kind: '归档' },
        { type: 'file', name: 'network-map.pdf', meta: '2.8 MB · 2026-11-10', kind: 'PDF' }
      ],
      '/Photos': [
        { type: 'folder', id: 'Ridge', name: '山脊与天空', meta: '124 个文件' },
        { type: 'folder', id: 'Tower', name: '塔台记录', meta: '86 个文件' },
        { type: 'file', name: 'mira-sunset.jpg', meta: '18.4 MB · 2026-11-11', kind: '图片' },
        { type: 'file', name: 'flight-07-poster.png', meta: '7.2 MB · 2026-11-09', kind: '图片' },
        { type: 'file', name: 'ridge-panorama.jpg', meta: '42.8 MB · 2026-11-03', kind: '图片' }
      ],
      '/Photos/Ridge': [
        { type: 'file', name: 'golden-hour-01.jpg', meta: '22.1 MB · 2026-11-11', kind: '图片' },
        { type: 'file', name: 'golden-hour-02.jpg', meta: '20.8 MB · 2026-11-11', kind: '图片' },
        { type: 'file', name: 'signal-map.png', meta: '1.4 MB · 2026-11-10', kind: '图片' }
      ],
      '/Projects': [
        { type: 'folder', id: 'Aperture', name: 'Aperture 视觉', meta: '18 个文件' },
        { type: 'folder', id: 'VoidSignal', name: 'VOID SIGNAL', meta: '42 个文件' },
        { type: 'file', name: 'project-index.md', meta: '8 KB · 2026-11-12', kind: '文稿' }
      ],
      '/Projects/Aperture': [
        { type: 'file', name: 'brand-guide-v7.pdf', meta: '12.4 MB · 2026-11-08', kind: 'PDF' },
        { type: 'file', name: 'signal-palette.png', meta: '3.8 MB · 2026-11-06', kind: '图片' },
        { type: 'file', name: 'type-specimens.zip', meta: '88 MB · 2026-11-02', kind: '归档' }
      ],
      '/Projects/VoidSignal': [
        { type: 'file', name: 'flight-recorder.json', meta: '1.1 MB · 2026-11-12', kind: '数据' },
        { type: 'file', name: 'crosshair-v12.png', meta: '2.2 MB · 2026-11-09', kind: '图片' },
        { type: 'file', name: 'telemetry-ui.fig', meta: '64 MB · 2026-11-05', kind: '设计稿' }
      ],
      '/Media': [
        { type: 'folder', id: 'Films', name: '电影', meta: '39 个文件' },
        { type: 'folder', id: 'Music', name: '音乐', meta: '1,402 首' },
        { type: 'file', name: 'ridge-documentary.mp4', meta: '2.8 GB · 2026-10-27', kind: '视频' }
      ],
      '/Media/Films': [
        { type: 'file', name: 'last-city-4k.mp4', meta: '18.6 GB · 2026-10-03', kind: '视频' },
        { type: 'file', name: 'orbital-silence.mp4', meta: '8.4 GB · 2026-09-11', kind: '视频' }
      ],
      '/Media/Music': [
        { type: 'file', name: 'midnight-lounge-set.flac', meta: '612 MB · 2026-11-04', kind: '音频' },
        { type: 'file', name: 'ridge-wind-loop.wav', meta: '84 MB · 2026-10-22', kind: '音频' }
      ],
      '/Backups': [
        { type: 'folder', id: 'Mac-2026-11-12', name: 'Sniper Mac · 2026-11-12', meta: '快照 · 241 GB' },
        { type: 'folder', id: 'Mac-2026-11-05', name: 'Sniper Mac · 2026-11-05', meta: '快照 · 238 GB' },
        { type: 'folder', id: 'Phone-2026-11-10', name: 'Mira Phone · 2026-11-10', meta: '快照 · 84 GB' }
      ],
      '/Backups/Mac-2026-11-12': [
        { type: 'file', name: 'manifest.json', meta: '7 KB · 2026-11-12', kind: '数据' },
        { type: 'file', name: 'snapshot-index.txt', meta: '18 KB · 2026-11-12', kind: '文稿' }
      ],
      '/Backups/Mac-2026-11-05': [{ type: 'file', name: 'manifest.json', meta: '7 KB · 2026-11-05', kind: '数据' }],
      '/Backups/Phone-2026-11-10': [{ type: 'file', name: 'manifest.json', meta: '4 KB · 2026-11-10', kind: '数据' }],
      '/Documents': [
        { type: 'folder', id: 'AISniper', name: 'AISniper 文档', meta: '18 个文件' },
        { type: 'file', name: 'network-notes.md', meta: '14 KB · 2026-11-12', kind: '文稿' },
        { type: 'file', name: 'home-inventory.csv', meta: '31 KB · 2026-11-01', kind: '表格' }
      ],
      '/Documents/AISniper': [
        { type: 'file', name: 'router-setup.md', meta: '9 KB · 2026-11-12', kind: '文稿' },
        { type: 'file', name: 'steam-library.json', meta: '88 KB · 2026-11-08', kind: '数据' }
      ]
    }
  };

  function loadBookmarks() {
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((item) => item && typeof item.url === 'string' && /^https?:\/\//i.test(item.url))
        .slice(0, 30)
        .map((item) => ({ url: item.url, title: typeof item.title === 'string' ? item.title : item.url }));
    } catch (error) {
      return [];
    }
  }

  function saveBookmarks() {
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks)); } catch (error) { /* no-op */ }
  }

  function loadSearchEngine() {
    try {
      const saved = localStorage.getItem(ENGINE_KEY);
      return saved && SEARCH_ENGINES[saved] ? saved : 'google';
    } catch (error) {
      return 'google';
    }
  }

  function saveSearchEngine() {
    try { localStorage.setItem(ENGINE_KEY, searchEngine); } catch (error) { /* no-op */ }
  }

  function updateEngineChip() {
    if (!ui?.engineChip) return;
    const config = SEARCH_ENGINES[searchEngine];
    ui.engineChip.textContent = `${config.label} ⇄`;
    ui.engineChip.setAttribute('aria-label', `切换搜索引擎，当前 ${config.label}`);
    ui.engineChip.title = `当前搜索引擎：${config.label}，点击切换`;
  }

  function searchUrl(query) {
    return `${SEARCH_ENGINES[searchEngine].url}${encodeURIComponent(query)}`;
  }

  function makeTab() {
    sequence += 1;
    return {
      id: `browser-tab-${sequence}`,
      title: '新标签页',
      url: null,
      kind: 'home',
      history: [null],
      historyIndex: 0,
      frame: null,
      loading: false,
      loadTimer: null,
      loadTimedOut: false
    };
  }

  function activeTab() {
    return tabs.find((tab) => tab.id === activeId) || null;
  }

  function ensureActiveTab() {
    if (!tabs.length) {
      const tab = makeTab();
      tabs.push(tab);
      activeId = tab.id;
    }
    if (!tabs.some((tab) => tab.id === activeId)) activeId = tabs[tabs.length - 1].id;
    return activeTab();
  }

  /* ---------------------------------------------------------------------
     URL resolution and internal site routing
     --------------------------------------------------------------------- */

  function parseInternalUrl(url) {
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) return null;
      const host = parsed.hostname.toLowerCase();
      const site = INTERNAL_HOSTS[host];
      if (!site) return null;
      let path = parsed.pathname || '/';
      try { path = decodeURIComponent(path); } catch (error) { /* keep encoded */ }
      if (!path.startsWith('/')) path = `/${path}`;
      return { site, path, host };
    } catch (error) {
      return null;
    }
  }

  function siteLabel(site) {
    if (site === 'router') return 'RouterOS';
    if (site === 'nas') return 'AISniper Vault';
    return 'AISniper 内网门户';
  }

  function internalTitle(site, path) {
    if (site === 'router') {
      if (!router.loggedIn) return 'RouterOS · 登录';
      if (path.includes('/wireless')) return 'RouterOS · 无线网络';
      if (path.includes('/clients')) return 'RouterOS · 客户端';
      if (path.includes('/dhcp')) return 'RouterOS · DHCP';
      if (path.includes('/firewall')) return 'RouterOS · 防火墙';
      if (path.includes('/system')) return 'RouterOS · 系统';
      if (path.includes('/logs')) return 'RouterOS · 日志';
      if (path.includes('/diagnostics')) return 'RouterOS · 诊断';
      return 'RouterOS · 网络概览';
    }
    if (site === 'nas') {
      if (path.includes('/files')) return 'AISniper Vault · 文件';
      if (path.includes('/media')) return 'AISniper Vault · 媒体';
      if (path.includes('/backups')) return 'AISniper Vault · 备份';
      if (path.includes('/users')) return 'AISniper Vault · 用户';
      return 'AISniper Vault · 概览';
    }
    if (path.includes('/history')) return 'AISniper 内网 · 历史';
    if (path.includes('/bookmarks')) return 'AISniper 内网 · 收藏';
    if (path.includes('/network')) return 'AISniper 内网 · 网络';
    return 'AISniper 内网门户';
  }

  function resolveInput(raw) {
    const value = String(raw || '').trim();
    if (!value) return { error: '请输入网址或搜索内容。' };
    if (/^(javascript|data|file|about|chrome|edge|blob):/i.test(value)) {
      return { error: '出于安全原因，此协议不能在浏览器中打开。' };
    }
    if (/^https?:\/\//i.test(value)) {
      try { return { url: new URL(value).href }; } catch (error) { return { error: '网址格式无效。' }; }
    }
    const localLike = /^(localhost|127(?:\.\d{1,3}){3}|(\d{1,3}\.){3}\d{1,3})(:\d+)?([/?#]|$)/i.test(value);
    const domainLike = /^[^\s/?#]+\.[^\s/?#]{2,}(?::\d+)?([/?#].*)?$/i.test(value);
    if (localLike || domainLike) {
      const candidate = `${localLike ? 'http://' : 'https://'}${value}`;
      try { return { url: new URL(candidate).href }; } catch (error) { return { error: '网址格式无效。' }; }
    }
    return { url: searchUrl(value), search: value };
  }

  function titleForUrl(url) {
    const internal = parseInternalUrl(url);
    if (internal) return internalTitle(internal.site, internal.path);
    try {
      const parsed = new URL(url);
      if (parsed.hostname.endsWith('google.com') && parsed.pathname === '/search') {
        const query = parsed.searchParams.get('q');
        if (query) return `搜索：${query}`;
      }
      return parsed.hostname.replace(/^www\./, '') || '网页';
    } catch (error) {
      return '网页';
    }
  }

  function routerUrl(path) {
    return `http://192.168.1.1${path.startsWith('/') ? path : `/${path}`}`;
  }

  function nasUrl(path) {
    return `http://192.168.1.20${path.startsWith('/') ? path : `/${path}`}`;
  }

  function portalUrl(path = '/') {
    return `http://aisniper.local${path.startsWith('/') ? path : `/${path}`}`;
  }

  /* ---------------------------------------------------------------------
     Tab lifecycle
     --------------------------------------------------------------------- */

  function createFrame(tab) {
    const frame = document.createElement('iframe');
    frame.className = 'browser-web-frame';
    frame.title = '网页内容';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-presentation');
    frame.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.addEventListener('load', () => {
      if (!tab.url || tab.kind !== 'external') return;
      tab.loading = false;
      tab.loadTimedOut = false;
      clearTimeout(tab.loadTimer);
      tab.loadTimer = null;
      if (activeTab()?.id === tab.id) syncUI();
      renderTabs();
    });
    frame.addEventListener('error', () => {
      if (!tab.url || tab.kind !== 'external') return;
      tab.loading = false;
      tab.loadTimedOut = true;
      if (activeTab()?.id === tab.id) syncUI();
      renderTabs();
    });
    ui.frames.appendChild(frame);
    tab.frame = frame;
    return frame;
  }

  function addRecent(title, url, internal) {
    const normalized = String(url || '');
    if (!normalized) return;
    recents = recents.filter((entry) => entry.url !== normalized);
    recents.unshift({
      title: title || titleForUrl(normalized),
      url: normalized,
      internal: Boolean(internal),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    recents = recents.slice(0, 9);
    renderRecents();
  }

  function beginLoad(tab, url, title) {
    if (!tab) return;
    const internal = parseInternalUrl(url);
    tab.url = url;
    tab.title = title || titleForUrl(url);
    tab.loading = true;
    tab.loadTimedOut = false;
    clearTimeout(tab.loadTimer);
    tab.loadTimer = null;
    if (internal) {
      tab.kind = 'internal';
      tab.frame?.classList.remove('is-active');
      addRecent(tab.title, tab.url, true);
      renderInternalPage(tab);
      syncUI();
      tab.loadTimer = setTimeout(() => {
        if (!tab.loading) return;
        tab.loading = false;
        if (activeTab()?.id === tab.id) syncUI();
        renderTabs();
      }, 260);
      return;
    }
    tab.kind = 'external';
    if (!tab.frame) createFrame(tab);
    addRecent(tab.title, tab.url, false);
    tab.frame.src = url;
    tab.loadTimer = setTimeout(() => {
      if (!tab.loading) return;
      tab.loading = false;
      tab.loadTimedOut = true;
      if (activeTab()?.id === tab.id) syncUI();
      renderTabs();
    }, 9000);
    syncUI();
    renderTabs();
  }

  function navigate(raw, options = {}) {
    const tab = activeTab() || ensureActiveTab();
    if (!tab) return;
    const resolved = resolveInput(raw);
    if (!resolved || resolved.error) {
      if (resolved?.error) host?.showToast?.({ title: '无法打开', message: resolved.error, icon: 'i-info' });
      return;
    }
    const url = resolved.url;
    const title = options.titleHint || (resolved.search ? `搜索：${resolved.search}` : titleForUrl(url));
    if (tab.url === url) {
      reload();
      return;
    }
    if (options.record !== false) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      if (tab.history[tab.historyIndex] !== url) {
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;
      }
    }
    beginLoad(tab, url, title);
    if (ui.address) ui.address.blur();
  }

  function showHomeForTab(tab, record = false) {
    if (!tab) return;
    if (record) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(null);
      tab.historyIndex = tab.history.length - 1;
    }
    tab.url = null;
    tab.kind = 'home';
    tab.title = '新标签页';
    tab.loading = false;
    tab.loadTimedOut = false;
    clearTimeout(tab.loadTimer);
    tab.loadTimer = null;
    tab.frame?.classList.remove('is-active');
    if (activeTab()?.id === tab.id) syncUI();
    renderTabs();
  }

  function historyStep(delta) {
    const tab = activeTab();
    if (!tab) return;
    const next = tab.historyIndex + delta;
    if (next < 0 || next >= tab.history.length) return;
    tab.historyIndex = next;
    const entry = tab.history[next];
    if (entry === null) showHomeForTab(tab, false);
    else beginLoad(tab, entry);
  }

  function reload() {
    const tab = activeTab();
    if (!tab?.url) return;
    const internal = parseInternalUrl(tab.url);
    if (internal) {
      tab.loading = true;
      renderInternalPage(tab);
      syncUI();
      clearTimeout(tab.loadTimer);
      tab.loadTimer = setTimeout(() => {
        tab.loading = false;
        if (activeTab()?.id === tab.id) syncUI();
        renderTabs();
      }, 220);
      return;
    }
    tab.loading = true;
    tab.loadTimedOut = false;
    clearTimeout(tab.loadTimer);
    if (!tab.frame) createFrame(tab);
    tab.frame.src = tab.url;
    tab.loadTimer = setTimeout(() => {
      if (!tab.loading) return;
      tab.loading = false;
      tab.loadTimedOut = true;
      syncUI();
      renderTabs();
    }, 9000);
    syncUI();
    renderTabs();
  }

  function goHome() {
    const tab = activeTab();
    if (!tab) return;
    if (!tab.url) {
      ui.homeInput?.focus();
      return;
    }
    showHomeForTab(tab, true);
    setTimeout(() => ui.homeInput?.focus(), 60);
  }

  /* ---------------------------------------------------------------------
     Browser chrome rendering
     --------------------------------------------------------------------- */

  function syncUI() {
    if (!ui) return;
    const tab = activeTab();
    if (!tab) {
      if (ui.address) ui.address.value = '';
      [ui.back, ui.forward, ui.reload, ui.bookmark, ui.external, ui.statusExternal].forEach((button) => { if (button) button.disabled = true; });
      if (ui.status) ui.status.textContent = '没有打开的页面';
      if (ui.startPage) ui.startPage.hidden = false;
      if (ui.internalPage) ui.internalPage.hidden = true;
      tabs.forEach((entry) => entry.frame?.classList.remove('is-active'));
      return;
    }
    const internal = tab.kind === 'internal';
    const internalInfo = internal ? parseInternalUrl(tab.url) : null;
    tabs.forEach((entry) => {
      entry.frame?.classList.toggle('is-active', entry.kind === 'external' && entry.id === tab.id);
    });
    if (ui.startPage) ui.startPage.hidden = tab.kind !== 'home';
    if (ui.internalPage) ui.internalPage.hidden = !internal;
    if (ui.address) ui.address.value = tab.url || '';
    const secure = Boolean(tab.url && tab.url.startsWith('https://'));
    if (ui.securityIcon) ui.securityIcon.setAttribute('href', internal ? '#i-ethernet' : tab.url ? (secure ? '#i-lock' : '#i-globe') : '#i-search');
    if (ui.addressSecurity) ui.addressSecurity.title = internal ? '内网连接' : tab.url ? (secure ? '安全连接' : '普通连接') : '搜索或输入网址';
    ui.addressForm?.classList.toggle('is-secure', secure);
    ui.addressForm?.classList.toggle('is-intranet', internal);
    if (ui.back) ui.back.disabled = tab.historyIndex <= 0;
    if (ui.forward) ui.forward.disabled = tab.historyIndex >= tab.history.length - 1;
    if (ui.reload) ui.reload.disabled = !tab.url;
    if (ui.bookmark) {
      ui.bookmark.disabled = !tab.url;
      const saved = Boolean(tab.url && bookmarks.some((item) => item.url === tab.url));
      ui.bookmark.classList.toggle('is-bookmarked', saved);
      ui.bookmark.setAttribute('aria-label', saved ? '取消收藏此页' : '收藏此页');
    }
    if (ui.external) {
      ui.external.disabled = !tab.url || internal;
      ui.external.title = internal ? '内网页面只在 AISniperOS 模拟浏览器中可用' : '在系统浏览器中打开';
    }
    if (ui.statusExternal) ui.statusExternal.disabled = !tab.url || internal;
    if (ui.securityLabel) {
      ui.securityLabel.textContent = !tab.url ? '内嵌浏览' : internal ? `内网连接 · ${internalInfo ? siteLabel(internalInfo.site) : '本地'}` : secure ? '安全连接' : '普通连接';
    }
    if (ui.sidebar) {
      const sidePath = internalInfo?.path || '';
      ui.sidebar.querySelectorAll('[data-browser-side]').forEach((button) => {
        const key = button.dataset.browserSide;
        let active = false;
        if (key === 'home') active = tab.kind === 'home';
        else if (key === 'portal') active = internalInfo?.site === 'portal' && !sidePath.includes('/history') && !sidePath.includes('/bookmarks');
        else if (key === 'history') active = internalInfo?.site === 'portal' && sidePath.includes('/history');
        else if (key === 'bookmarks') active = internalInfo?.site === 'portal' && sidePath.includes('/bookmarks');
        button.classList.toggle('is-active', active);
      });
      ui.sidebar.querySelectorAll('.browser-device-link').forEach((link) => {
        const linkInfo = parseInternalUrl(link.dataset.browserUrl);
        link.classList.toggle('is-active', Boolean(linkInfo && internalInfo && linkInfo.site === internalInfo.site));
      });
    }
    if (ui.progress) ui.progress.classList.toggle('is-loading', tab.loading);
    if (ui.statusDot) ui.statusDot.classList.toggle('is-loading', tab.loading);
    if (ui.status) {
      if (tab.loading) ui.status.textContent = `正在载入 · ${tab.title}`;
      else if (tab.loadTimedOut) ui.status.textContent = `加载较慢或页面拒绝嵌入 · ${tab.title}`;
      else if (internal) ui.status.textContent = `内网已载入 · ${tab.title}`;
      else if (tab.url) ui.status.textContent = `已载入 · ${tab.title}`;
      else ui.status.textContent = '新标签页 · 输入网址开始';
    }
    if (ui.newTab) ui.newTab.disabled = tabs.length >= MAX_TABS;
  }

  function tabIcon(tab) {
    if (tab.kind === 'internal') {
      const info = parseInternalUrl(tab.url);
      return info?.site === 'nas' ? '#i-server' : info?.site === 'router' ? '#i-wifi' : '#i-globe';
    }
    return '#i-globe';
  }

  function renderTabs() {
    if (!ui) return;
    ui.tabs.replaceChildren();
    tabs.forEach((tab) => {
      const wrap = document.createElement('div');
      wrap.className = `browser-tab${tab.id === activeId ? ' is-active' : ''}`;
      wrap.dataset.browserTab = tab.id;
      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'browser-tab-main';
      main.setAttribute('role', 'tab');
      main.setAttribute('aria-selected', String(tab.id === activeId));
      main.setAttribute('title', tab.title);
      const icon = document.createElement('span');
      icon.className = 'browser-tab-favicon';
      icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="${tabIcon(tab)}"></use></svg>`;
      const title = document.createElement('span');
      title.className = 'browser-tab-title';
      title.textContent = tab.title;
      main.append(icon, title);
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'browser-tab-close';
      close.dataset.browserClose = tab.id;
      close.setAttribute('aria-label', `关闭标签页：${tab.title}`);
      close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close"></use></svg>';
      wrap.append(main, close);
      ui.tabs.appendChild(wrap);
    });
    if (ui.newTab) ui.newTab.disabled = tabs.length >= MAX_TABS;
    const current = ui.tabs.querySelector('.browser-tab.is-active');
    if (current) requestAnimationFrame(() => current.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
    renderRecents();
  }

  function activateTab(id) {
    if (!tabs.some((tab) => tab.id === id)) return;
    activeId = id;
    const tab = activeTab();
    if (tab?.kind === 'internal') renderInternalPage(tab);
    renderTabs();
    syncUI();
  }

  function newTab(options = {}) {
    if (tabs.length >= MAX_TABS) {
      host?.showToast?.({ title: '标签页已达上限', message: '请先关闭一个标签页。', icon: 'app-browser' });
      return null;
    }
    const tab = makeTab();
    tabs.push(tab);
    activeId = tab.id;
    renderTabs();
    syncUI();
    if (options.url) navigate(options.url);
    else if (options.focus !== false) setTimeout(() => ui.homeInput?.focus(), 60);
    return tab;
  }

  function closeTab(id) {
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index < 0) return;
    const [removed] = tabs.splice(index, 1);
    if (removed.frame) removed.frame.remove();
    clearTimeout(removed.loadTimer);
    if (!tabs.length) {
      activeId = null;
      syncUI();
      renderTabs();
      host?.closeApp?.('browser');
      return;
    }
    if (!tabs.some((tab) => tab.id === activeId)) {
      activeId = tabs[Math.min(index, tabs.length - 1)].id;
    }
    const tab = activeTab();
    if (tab?.kind === 'internal') renderInternalPage(tab);
    renderTabs();
    syncUI();
  }

  function closeActiveTab() {
    if (activeId) closeTab(activeId);
  }

  function renderRecents() {
    if (!ui?.recents) return;
    ui.recentCount.textContent = String(recents.length);
    ui.recents.replaceChildren();
    if (!recents.length) {
      const empty = document.createElement('div');
      empty.className = 'browser-recents-empty';
      empty.textContent = '还没有访问记录。';
      ui.recents.appendChild(empty);
      return;
    }
    recents.slice(0, 6).forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `browser-recent${entry.internal ? ' is-local' : ''}`;
      button.dataset.browserUrl = entry.url;
      button.title = entry.url;
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="${entry.internal ? '#i-ethernet' : '#i-globe'}"></use></svg><span>${escapeHTML(entry.title)}</span>`;
      ui.recents.appendChild(button);
    });
  }

  function renderBookmarks() {
    if (!ui?.bookmarksPanel) return;
    ui.bookmarksPanel.hidden = !bookmarks.length;
    ui.bookmarksPanel.parentElement?.classList.toggle('is-single', !bookmarks.length);
    ui.bookmarksList.replaceChildren();
    bookmarks.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'browser-bookmark-chip';
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'browser-bookmark-open';
      open.dataset.bookmarkUrl = item.url;
      open.title = item.url;
      open.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"></use></svg>';
      const label = document.createElement('span');
      label.textContent = item.title || item.url;
      open.appendChild(label);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'bookmark-remove';
      remove.dataset.bookmarkRemove = item.url;
      remove.setAttribute('aria-label', `移除收藏：${item.title || item.url}`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close"></use></svg>';
      chip.append(open, remove);
      ui.bookmarksList.appendChild(chip);
    });
  }

  /* ---------------------------------------------------------------------
     Intranet page rendering
     --------------------------------------------------------------------- */

  function routerLog(text, type = 'info') {
    router.logs.unshift({ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), text, type });
    router.logs = router.logs.slice(0, 30);
  }

  function intTop(site, label, nav, status) {
    const configs = {
      router: { sub: 'AISNIPER AX-6000', mark: 'R' },
      nas: { sub: 'NAS · 192.168.1.20', mark: 'V' },
      portal: { sub: 'HOME NETWORK · PORTAL', mark: 'N' }
    };
    const config = configs[site] || configs.portal;
    return `<header class="int-top">
      <div class="int-brand"><span>${config.mark}</span><div><b>${escapeHTML(label)}</b><small>${escapeHTML(config.sub)}</small></div></div>
      <nav class="int-top-nav">${nav}</nav>
      <div class="int-top-status">${status}<span><i></i>内网在线</span><span class="int-user"><b>S</b>Sniper</span>${site === 'router' ? '<button class="int-logout" data-router-logout>退出</button>' : ''}</div>
    </header>`;
  }

  function routerShell(active, content) {
    const nav = [
      ['overview', '/overview', '网络概览', 'i-grid'],
      ['wireless', '/wireless', '无线网络', 'i-wifi'],
      ['clients', '/clients', '客户端', 'i-user'],
      ['dhcp', '/dhcp', 'DHCP 服务', 'i-server'],
      ['firewall', '/firewall', '防火墙', 'i-shield'],
      ['system', '/system', '系统', 'i-sliders'],
      ['logs', '/logs', '系统日志', 'i-list'],
      ['diagnostics', '/diagnostics', '网络诊断', 'i-health']
    ];
    return `<div class="int-page">
      ${intTop('router', 'RouterOS', `<a href="${portalUrl('/')}" data-int-url="${portalUrl('/')}">内网门户</a><a href="${nasUrl('/')}" data-int-url="${nasUrl('/')}">AISniper Vault</a>`, '<span>WAN · 1000 Mbps</span><span>延迟 8 ms</span>')}
      <div class="int-layout">
        <aside class="int-side">
          <div class="int-side-label">ROUTER MANAGEMENT</div>
          <div class="int-side-nav">${nav.map(([key, path, label, icon]) => `<button class="${active === key ? 'is-active' : ''}" data-int-url="${routerUrl(path)}"><svg viewBox="0 0 24 24"><use href="#${icon}"></use></svg>${label}</button>`).join('')}</div>
          <div class="int-side-foot">AX-6000 · 固件 ${escapeHTML(router.firmware)}<br>WAN 203.0.113.42<br>LAN 192.168.1.1/24</div>
        </aside>
        <main class="int-content">${content}</main>
      </div>
      <footer class="int-footer">RouterOS 26.4 · 本地路由器后台模拟 · 所有修改仅保存在当前会话</footer>
    </div>`;
  }

  function portalShell(active, content) {
    const nav = [
      ['home', '/', '家庭网络', 'i-home'],
      ['network', '/network', '网络设备', 'i-wifi'],
      ['history', '/history', '历史记录', 'i-clock'],
      ['bookmarks', '/bookmarks', '书签', 'i-star']
    ];
    return `<div class="int-page">
      ${intTop('portal', 'AISniper 内网', `<a href="${routerUrl('/')}" data-int-url="${routerUrl('/')}">RouterOS</a><a href="${nasUrl('/')}" data-int-url="${nasUrl('/')}">Vault NAS</a>`, '<span>192.168.1.0/24</span>')}
      <div class="int-layout">
        <aside class="int-side">
          <div class="int-side-label">HOME NETWORK</div>
          <div class="int-side-nav">${nav.map(([key, path, label, icon]) => `<a class="${active === key ? 'is-active' : ''}" href="${portalUrl(path)}" data-int-url="${portalUrl(path)}"><svg viewBox="0 0 24 24"><use href="#${icon}"></use></svg>${label}</a>`).join('')}</div>
          <div class="int-side-foot">网络名称 AISNIPER-5G<br>8 台设备在线<br>网关 192.168.1.1</div>
        </aside>
        <main class="int-content">${content}</main>
      </div>
      <footer class="int-footer">AISniper 内网门户 · 本地 HTTP 服务 · 仅可从这台设备访问</footer>
    </div>`;
  }

  function nasShell(active, content) {
    const nav = [
      ['overview', '/', '存储概览', 'i-server'],
      ['files', '/files', '文件与共享', 'i-folder'],
      ['media', '/media', '媒体库', 'i-image'],
      ['backups', '/backups', '备份', 'i-archive'],
      ['users', '/users', '用户与权限', 'i-user']
    ];
    return `<div class="int-page">
      ${intTop('nas', 'AISniper Vault', `<a href="${portalUrl('/')}" data-int-url="${portalUrl('/')}">内网门户</a><a href="${routerUrl('/')}" data-int-url="${routerUrl('/')}">RouterOS</a>`, '<span>链路聚合 · 2.5 GbE</span><span>存储池健康</span>')}
      <div class="int-layout">
        <aside class="int-side">
          <div class="int-side-label">STORAGE APPLIANCE</div>
          <div class="int-side-nav">${nav.map(([key, path, label, icon]) => `<button class="${active === key ? 'is-active' : ''}" data-int-url="${nasUrl(path)}"><svg viewBox="0 0 24 24"><use href="#${icon}"></use></svg>${label}</button>`).join('')}</div>
          <div class="int-side-foot">VN-4B · 4-Bay<br>9.8 TB / 14 TB<br>RAID 5 · 健康</div>
        </aside>
        <main class="int-content">${content}</main>
      </div>
      <footer class="int-footer">AISniper Vault · 本地 NAS 模拟 · SMB / NFS / WebDAV</footer>
    </div>`;
  }

  function routerPage(path) {
    if (!router.loggedIn) return loginPage();
    const active = path.includes('/wireless') ? 'wireless'
      : path.includes('/clients') ? 'clients'
        : path.includes('/dhcp') ? 'dhcp'
          : path.includes('/firewall') ? 'firewall'
            : path.includes('/system') ? 'system'
              : path.includes('/logs') ? 'logs'
                : path.includes('/diagnostics') ? 'diagnostics'
                  : 'overview';
    let content = '';
    if (active === 'wireless') content = routerWireless();
    else if (active === 'clients') content = routerClients(path);
    else if (active === 'dhcp') content = routerDhcp();
    else if (active === 'firewall') content = routerFirewall();
    else if (active === 'system') content = routerSystem();
    else if (active === 'logs') content = routerLogs();
    else if (active === 'diagnostics') content = routerDiagnostics();
    else content = routerOverview();
    return routerShell(active, content);
  }

  function routerOverview() {
    const online = router.clients.filter((client) => client.online && !client.blocked).length;
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / OVERVIEW</span><h1>网络概览</h1><p>AX-6000 · WAN 在线 · 固件 ${escapeHTML(router.firmware)} · 会话已加密</p></div><div class="int-page-actions"><button class="int-btn" data-int-url="${routerUrl('/diagnostics')}"><svg viewBox="0 0 24 24"><use href="#i-health"></use></svg>运行诊断</button><button class="int-btn primary" data-int-url="${routerUrl('/wireless')}"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg>无线设置</button></div></div>
      <section class="int-hero-card"><span class="int-eyebrow">SYSTEM STATUS</span><h2>网络运行正常。</h2><p>WAN 链路稳定，2.4 GHz 与 5 GHz 频段均已启用。当前有 ${online} 台设备在线，访客网络与防火墙处于保护状态。</p><div style="display:flex;gap:7px;margin-top:13px"><span class="int-badge green">● 已连接</span><span class="int-badge blue">WAN 203.0.113.42</span><span class="int-badge amber">运行时间 18d 06h</span></div></section>
      <div class="int-stat-grid" style="margin-top:10px"><div><span>下载速率</span><b class="green">24.8 MB/s</b></div><div><span>上传速率</span><b>3.2 MB/s</b></div><div><span>网络延迟</span><b class="green">8 ms</b></div><div><span>在线设备</span><b class="blue">${online} / ${router.clients.length}</b></div></div>
      <div class="int-grid two" style="margin-top:10px">
        <section class="int-card"><div class="int-card-title"><span>实时流量</span><span>过去 60 分钟</span></div><div class="int-chart"><svg viewBox="0 0 520 102" preserveAspectRatio="none"><path d="M0,76 C28,69 44,58 70,61 S113,75 141,67 S185,41 216,48 S260,56 291,43 S337,34 367,40 S409,21 438,29 S486,33 520,20"/><path class="secondary" d="M0,91 C30,87 51,81 79,84 S127,75 157,79 S203,66 236,70 S279,64 310,68 S353,55 385,60 S430,52 462,56 S500,48 520,51"/></svg></div><div style="display:flex;justify-content:space-between;margin-top:5px;color:#5d7479;font-family:var(--mono-font);font-size:5px"><span>21:00</span><span>21:30</span><span>22:00</span></div></section>
        <section class="int-card"><div class="int-card-title"><span>连接状态</span><span>WAN</span></div>
          <div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-ethernet"></use></svg><div><b>以太网 · 1 Gbps</b><small>ISP 网关 · DHCP lease</small></div><span class="int-badge green">正常</span></div>
          <div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg><div><b>${escapeHTML(router.ssid)}</b><small>${escapeHTML(router.band)} · 信道 ${escapeHTML(router.channel)}</small></div><span class="int-badge ${router.wifi ? 'green' : 'red'}">${router.wifi ? '开启' : '关闭'}</span></div>
          <div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg><div><b>防火墙</b><small>${router.firewallRules.length} 条规则 · WAN 访问保护</small></div><span class="int-badge ${router.firewall ? 'green' : 'red'}">${router.firewall ? '启用' : '关闭'}</span></div>
          <div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg><div><b>DHCP 地址池</b><small>${escapeHTML(router.poolStart)} – ${escapeHTML(router.poolEnd)}</small></div><span class="int-badge ${router.dhcp ? 'green' : 'amber'}">${router.dhcp ? '自动分配' : '已关闭'}</span></div>
        </section>
      </div>
      <div class="int-grid two" style="margin-top:10px">
        <section class="int-card"><div class="int-card-title"><span>在线客户端</span><a href="${routerUrl('/clients')}" data-int-url="${routerUrl('/clients')}" class="int-link">查看全部</a></div>${router.clients.slice(0, 4).map((client) => `<div class="int-row"><svg viewBox="0 0 24 24"><use href="#${client.type === 'NAS' ? 'i-server' : client.type === '电视' ? 'i-display' : 'i-user'}"></use></svg><div><b>${escapeHTML(client.name)}</b><small>${escapeHTML(client.ip)} · ${escapeHTML(client.band)}</small></div><span class="int-badge ${client.online && !client.blocked ? 'green' : 'amber'}">${client.blocked ? '已暂停' : client.online ? '在线' : '离线'}</span></div>`).join('')}</section>
        <section class="int-card"><div class="int-card-title"><span>最近日志</span><a href="${routerUrl('/logs')}" data-int-url="${routerUrl('/logs')}" class="int-link">打开日志</a></div><div class="int-log-list">${router.logs.slice(0, 4).map((entry) => `<div class="int-log-line ${entry.type === 'warning' ? 'is-warn' : entry.type === 'error' ? 'is-error' : ''}"><time>${escapeHTML(entry.time)}</time><span>${escapeHTML(entry.text)}</span></div>`).join('')}</div></section>
      </div>`;
  }

  function routerWireless() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / WIRELESS</span><h1>无线网络</h1><p>双频 Wi-Fi · 访客网络 · 信道与带宽控制</p></div><div class="int-page-actions"><button class="int-btn" data-router-action="refresh"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>刷新</button></div></div>
      <div class="int-settings-grid">
        <section class="int-card"><div class="int-card-title"><span>Wi-Fi 设置</span><span>2.4 GHz + 5 GHz</span></div>
          <form class="int-form" data-router-wireless>
            <div class="int-field"><label>网络名称（SSID）</label><input name="ssid" value="${escapeAttr(router.ssid)}" maxlength="32" autocomplete="off"></div>
            <div class="int-field"><label>Wi-Fi 密码</label><input name="password" value="${escapeAttr(router.wifiPassword)}" maxlength="64" autocomplete="off"></div>
            <div class="int-form-row"><div class="int-field"><label>频段</label><select name="band">${['自动', '2.4 GHz', '5 GHz'].map((band) => `<option ${router.band === band ? 'selected' : ''}>${band}</option>`).join('')}</select></div><div class="int-field"><label>信道</label><select name="channel">${['自动', '36', '44', '149', '157'].map((channel) => `<option ${router.channel === channel ? 'selected' : ''}>${channel}</option>`).join('')}</select></div></div>
            <div class="int-switch"><div><b>启用无线网络</b><small>关闭后所有 Wi-Fi 客户端将断开</small></div><button type="button" class="int-toggle ${router.wifi ? 'is-on' : ''}" data-router-toggle="wifi" aria-label="切换无线网络"></button></div>
            <div class="int-switch"><div><b>访客网络</b><small>隔离访客设备，仅允许访问互联网</small></div><button type="button" class="int-toggle ${router.guest ? 'is-on' : ''}" data-router-toggle="guest" aria-label="切换访客网络"></button></div>
            <div style="display:flex;justify-content:flex-end;margin-top:3px"><button class="int-btn primary" type="submit"><svg viewBox="0 0 24 24"><use href="#i-check"></use></svg>保存无线设置</button></div>
          </form>
        </section>
        <div>
          <section class="int-card"><div class="int-card-title"><span>信号覆盖</span><span>${router.wifi ? '广播中' : '已关闭'}</span></div><div class="int-wifi-visual"><span></span><span></span><span></span><span></span><b>${escapeHTML(router.ssid)}</b></div><div class="int-note">当前以 ${escapeHTML(router.band)} 运行，信道 ${escapeHTML(router.channel)}。附近检测到 11 个其他无线网络。</div></section>
          <section class="int-card" style="margin-top:10px"><div class="int-card-title"><span>频率使用</span><span>自动优化</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg><div><b>2.4 GHz</b><small>信道 6 · 3 台设备</small></div><span class="int-badge amber">较拥挤</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg><div><b>5 GHz</b><small>信道 36 · 5 台设备</small></div><span class="int-badge green">良好</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg><div><b>访客网络</b><small>隔离 SSID · 限速 50 Mbps</small></div><span class="int-badge ${router.guest ? 'green' : 'red'}">${router.guest ? '启用' : '关闭'}</span></div></section>
        </div>
      </div>`;
  }

  function routerClients(path) {
    const match = path.match(/^\/clients\/([^/]+)$/);
    if (match) return routerClientDetail(decodeURIComponent(match[1]));
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / CLIENTS</span><h1>客户端</h1><p>${router.clients.filter((client) => client.online).length} 台在线 · 点击设备查看详情、信号与访问控制</p></div><div class="int-page-actions"><button class="int-btn" data-router-action="refresh"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>刷新列表</button></div></div>
      <section class="int-card"><div class="int-card-title"><span>已连接设备</span><span>DHCP 租约 · 实时</span></div>
        <table class="int-table"><thead><tr><th>设备</th><th>IP 地址</th><th>MAC</th><th>频段</th><th>信号</th><th>状态</th><th></th></tr></thead><tbody>
          ${router.clients.map((client) => `<tr><td><button class="int-link" data-int-url="${routerUrl(`/clients/${encodeURIComponent(client.id)}`)}">${escapeHTML(client.name)}</button><small>${escapeHTML(client.type)} · ${escapeHTML(client.note)}</small></td><td>${escapeHTML(client.ip)}</td><td><small>${escapeHTML(client.mac)}</small></td><td>${escapeHTML(client.band)}</td><td>${client.signal}%</td><td><span class="int-badge ${client.blocked ? 'red' : client.online ? 'green' : 'amber'}">${client.blocked ? '已暂停' : client.online ? '在线' : '离线'}</span></td><td><button class="int-btn" style="height:21px;font-size:5.6px" data-router-client-block="${escapeHTML(client.id)}">${client.blocked ? '恢复' : '暂停'}</button></td></tr>`).join('')}
        </tbody></table>
      </section>
      <div class="int-note">“暂停”只会阻止该设备访问互联网，不会删除它的 DHCP 租约。所有操作都在本机演示中完成。</div>`;
  }

  function routerClientDetail(id) {
    const client = router.clients.find((entry) => entry.id === id);
    if (!client) {
      return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / CLIENT</span><h1>未找到设备</h1><p>这个客户端可能已经离开网络。</p></div></div><section class="int-card"><button class="int-btn" data-int-url="${routerUrl('/clients')}">返回客户端列表</button></section>`;
    }
    return `<div class="int-breadcrumb"><a href="${routerUrl('/clients')}" data-int-url="${routerUrl('/clients')}">客户端</a> / ${escapeHTML(client.name)}</div>
      <div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / CLIENT DETAIL</span><h1>${escapeHTML(client.name)}</h1><p>${escapeHTML(client.note)}</p></div><div class="int-page-actions"><button class="int-btn ${client.blocked ? 'primary' : 'danger'}" data-router-client-block="${escapeHTML(client.id)}">${client.blocked ? '恢复网络访问' : '暂停网络访问'}</button></div></div>
      <div class="int-device-hero"><span><svg viewBox="0 0 24 24"><use href="#${client.type === 'NAS' ? 'i-server' : client.type === '电视' ? 'i-display' : 'i-user'}"></use></svg></span><div><h2>${escapeHTML(client.name)}</h2><p>${escapeHTML(client.type)} · ${escapeHTML(client.mac)} · ${escapeHTML(client.band)}</p></div><span class="int-badge ${client.blocked ? 'red' : 'green'}">${client.blocked ? '已暂停' : '在线'}</span></div>
      <div class="int-stat-grid" style="margin-top:10px"><div><span>IPv4 地址</span><b>${escapeHTML(client.ip)}</b></div><div><span>信号强度</span><b class="${client.signal > 75 ? 'green' : 'amber'}">${client.signal}%</b></div><div><span>下行流量</span><b>${client.blocked ? '0 KB/s' : '6.4 MB/s'}</b></div><div><span>连接时长</span><b>04:12:38</b></div></div>
      <div class="int-grid two" style="margin-top:10px"><section class="int-card"><div class="int-card-title"><span>信号质量</span><span>实时</span></div><div class="int-chart"><svg viewBox="0 0 520 102" preserveAspectRatio="none"><path d="M0,39 C30,35 54,43 80,41 S127,30 153,36 S196,26 223,35 S267,25 295,29 S337,18 364,23 S410,31 440,25 S491,18 520,22"/></svg></div><div class="int-note">建议将高带宽设备连接到 5 GHz 频段；当前信道质量良好。</div></section><section class="int-card"><div class="int-card-title"><span>访问控制</span><span>本机策略</span></div><div class="int-switch"><div><b>暂停互联网访问</b><small>保留局域网访问与本机路由</small></div><button class="int-toggle ${client.blocked ? 'is-on' : ''}" data-router-client-block="${escapeHTML(client.id)}"></button></div><div class="int-switch"><div><b>固定 IP 地址</b><small>${escapeHTML(client.ip)} · 绑定 MAC</small></div><span class="int-badge blue">固定租约</span></div><div class="int-switch"><div><b>QoS 优先级</b><small>工作 / 游戏 / 访客</small></div><span class="int-badge green">${client.type === '游戏主机' ? '游戏' : '标准'}</span></div></section></div>
      <div class="int-note">最后活动时间：今天 21:43 · 设备指纹与客户端名称均来自本地模拟。</div>`;
  }

  function routerDhcp() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / DHCP</span><h1>DHCP 服务</h1><p>自动分配局域网地址、保留固定租约和管理地址池</p></div><div class="int-page-actions"><span class="int-badge green">${router.dhcp ? '服务运行中' : '服务已关闭'}</span></div></div>
      <div class="int-settings-grid"><section class="int-card"><div class="int-card-title"><span>地址池配置</span><span>IPv4</span></div><form class="int-form" data-router-dhcp><div class="int-form-row"><div class="int-field"><label>起始地址</label><input name="start" value="${escapeAttr(router.poolStart)}"></div><div class="int-field"><label>结束地址</label><input name="end" value="${escapeAttr(router.poolEnd)}"></div></div><div class="int-field"><label>租约时间</label><select name="lease">${['1 小时', '6 小时', '12 小时', '24 小时', '7 天'].map((lease) => `<option ${router.lease === lease ? 'selected' : ''}>${lease}</option>`).join('')}</select></div><div class="int-switch"><div><b>启用 DHCP 服务</b><small>向局域网设备自动分配 IP</small></div><button type="button" class="int-toggle ${router.dhcp ? 'is-on' : ''}" data-router-toggle="dhcp"></button></div><div style="display:flex;justify-content:flex-end"><button class="int-btn primary" type="submit">应用配置</button></div></form></section>
      <section class="int-card"><div class="int-card-title"><span>当前租约</span><span>${router.clients.length} 个</span></div><div class="int-log-list">${router.clients.map((client) => `<div class="int-log-line"><time>${escapeHTML(client.ip)}</time><span>${escapeHTML(client.name)} · ${escapeHTML(client.mac)}</span></div>`).join('')}</div></section></div>
      <section class="int-card" style="margin-top:10px"><div class="int-card-title"><span>保留地址</span><span>3 个固定租约</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg><div><b>192.168.1.20 → AISniper Vault</b><small>00:11:32:7C:4D:09 · 永久保留</small></div><span class="int-badge blue">NAS</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-display"></use></svg><div><b>192.168.1.73 → Living Room TV</b><small>D8:3A:DD:92:11:44 · 永久保留</small></div><span class="int-badge blue">媒体</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-user"></use></svg><div><b>192.168.1.42 → Sniper 的 Mac</b><small>8C:85:90:2A:71:0C · 工作设备</small></div><span class="int-badge green">本机</span></div></section>`;
  }

  function routerFirewall() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / FIREWALL</span><h1>防火墙</h1><p>入站保护、远程访问与本地规则</p></div><div class="int-page-actions"><button class="int-btn" data-router-action="add-rule"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>添加规则</button></div></div>
      <div class="int-grid three"><section class="int-card"><div class="int-card-title"><span>防火墙</span><span>${router.firewall ? '保护中' : '已关闭'}</span></div><p style="margin:0 0 8px;color:#758b8d;font-size:6.3px;line-height:1.5">阻止未经请求的 WAN 入站流量。</p><div class="int-switch"><div><b>启用防火墙</b><small>推荐保持开启</small></div><button class="int-toggle ${router.firewall ? 'is-on' : ''}" data-router-toggle="firewall"></button></div></section><section class="int-card"><div class="int-card-title"><span>UPnP</span><span>${router.upnp ? '开启' : '关闭'}</span></div><p style="margin:0 0 8px;color:#758b8d;font-size:6.3px;line-height:1.5">允许局域网应用自动映射端口。</p><div class="int-switch"><div><b>启用 UPnP</b><small>游戏与串流应用</small></div><button class="int-toggle ${router.upnp ? 'is-on' : ''}" data-router-toggle="upnp"></button></div></section><section class="int-card"><div class="int-card-title"><span>远程管理</span><span>${router.remoteAdmin ? '开启' : '关闭'}</span></div><p style="margin:0 0 8px;color:#758b8d;font-size:6.3px;line-height:1.5">从 WAN 访问路由器后台。</p><div class="int-switch"><div><b>WAN 管理</b><small>建议保持关闭</small></div><button class="int-toggle ${router.remoteAdmin ? 'is-on' : ''}" data-router-toggle="remoteAdmin"></button></div></section></div>
      <section class="int-card" style="margin-top:10px"><div class="int-card-title"><span>本地规则</span><span>${router.firewallRules.length} 条</span></div><table class="int-table"><thead><tr><th>规则名称</th><th>目标</th><th>端口</th><th>动作</th></tr></thead><tbody>${router.firewallRules.map((rule) => `<tr><td><b>${escapeHTML(rule.name)}</b></td><td>${escapeHTML(rule.target)}</td><td>${escapeHTML(rule.port)}</td><td><span class="int-badge ${rule.action === '允许' ? 'green' : 'red'}">${escapeHTML(rule.action)}</span></td></tr>`).join('')}</tbody></table></section>
      <div class="int-note">这只是本地模拟，不会修改真实路由器或网络策略。</div>`;
  }

  function routerSystem() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / SYSTEM</span><h1>系统</h1><p>AX-6000 · 固件 ${escapeHTML(router.firmware)} · 设备信息与维护</p></div><div class="int-page-actions"><span class="int-badge ${router.rebooting ? 'amber' : 'green'}">${router.rebooting ? '正在重启' : '运行正常'}</span></div></div>
      ${router.rebooting ? `<section class="int-card" style="margin-bottom:10px"><div class="int-card-title"><span>正在重启路由器</span><span>${Math.round(router.rebootProgress)}%</span></div><div class="int-progress"><i data-router-reboot-bar style="width:${router.rebootProgress}%"></i></div><p style="margin:8px 0 0;color:#71888b;font-size:6.4px" data-router-reboot-label>正在关闭 WAN 连接并保存配置…</p></section>` : ''}
      <div class="int-grid two"><section class="int-card"><div class="int-card-title"><span>设备信息</span><span>AX-6000</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg><div><b>AISniper AX-6000</b><small>Wi-Fi 6 · 双频 · 4 × 1 GbE</small></div><span class="int-badge blue">v${escapeHTML(router.firmware)}</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-clock"></use></svg><div><b>系统时间</b><small>${new Date().toLocaleString('zh-CN', { hour12: false })}</small></div><span class="int-badge green">NTP 同步</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-health"></use></svg><div><b>CPU / 内存</b><small>12% / 38% · 温度 41°C</small></div><span class="int-badge green">稳定</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-ethernet"></use></svg><div><b>LAN / WAN</b><small>192.168.1.1 / 203.0.113.42</small></div><span class="int-badge blue">已连接</span></div></section>
      <section class="int-card"><div class="int-card-title"><span>维护</span><span>本地操作</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg><div><b>固件更新</b><small>当前已是最新版本 ${escapeHTML(router.firmware)}</small></div><button class="int-btn" data-router-action="firmware">检查</button></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-archive"></use></svg><div><b>备份配置</b><small>导出路由器设置和 DHCP 租约</small></div><button class="int-btn" data-router-action="backup">导出</button></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg><div><b>重启路由器</b><small>保存配置并重新启动全部网络服务</small></div><button class="int-btn danger" data-router-action="reboot" ${router.rebooting ? 'disabled' : ''}>重启</button></div></section></div>
      <section class="int-card int-danger-zone" style="margin-top:10px"><div class="int-card-title"><span>恢复出厂设置</span><span>不可撤销</span></div><p style="margin:0 0 8px;color:#987f78;font-size:6.4px;line-height:1.5">这个本地演示不会真的清除设备，但会重置当前会话中的路由器设置。</p><button class="int-btn danger" data-router-action="factory">恢复演示默认值</button></section>`;
  }

  function routerLogs() {
    const filtered = router.logs.filter((entry) => router.logFilter === 'all' || entry.type === router.logFilter);
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / LOGS</span><h1>系统日志</h1><p>最近的 DHCP、客户端、防火墙与系统事件</p></div><div class="int-page-actions"><button class="int-btn" data-router-action="refresh"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>刷新</button><button class="int-btn" data-router-action="clear-logs">清空日志</button></div></div>
      <div class="int-page-actions" style="margin-bottom:10px">${[['all', '全部'], ['info', '信息'], ['warning', '警告'], ['error', '错误']].map(([key, label]) => `<button class="int-btn ${router.logFilter === key ? 'primary' : ''}" data-router-log-filter="${key}">${label}</button>`).join('')}</div>
      <section class="int-card"><div class="int-card-title"><span>事件流</span><span>${filtered.length} 条</span></div><div class="int-log-list">${filtered.map((entry) => `<div class="int-log-line ${entry.type === 'warning' ? 'is-warn' : entry.type === 'error' ? 'is-error' : ''}"><time>${escapeHTML(entry.time)}</time><span>${escapeHTML(entry.text)}</span></div>`).join('') || '<div class="int-log-line"><span>没有匹配的日志。</span></div>'}</div></section>`;
  }

  function routerDiagnostics() {
    const results = router.diagResults;
    return `<div class="int-page-head"><div><span class="int-eyebrow">ROUTEROS / DIAGNOSTICS</span><h1>网络诊断</h1><p>用本地模拟检查 WAN、DNS 和下载速度</p></div><div class="int-page-actions"><span class="int-badge green">链路在线</span></div></div>
      <div class="int-grid three">
        <section class="int-card"><div class="int-card-title"><span>Ping 测试</span><span>8.8.8.8</span></div><p style="color:#71888b;font-size:6.5px;line-height:1.5;margin:0 0 9px">${results.ping ? escapeHTML(results.ping) : '测量 WAN 往返时延。'}</p><button class="int-btn ${router.diagRunning === 'ping' ? 'primary' : ''}" data-router-diag="ping">${router.diagRunning === 'ping' ? '测试中…' : '开始 Ping'}</button></section>
        <section class="int-card"><div class="int-card-title"><span>DNS 解析</span><span>router.local</span></div><p style="color:#71888b;font-size:6.5px;line-height:1.5;margin:0 0 9px">${results.dns ? escapeHTML(results.dns) : '检查本地域名解析服务。'}</p><button class="int-btn ${router.diagRunning === 'dns' ? 'primary' : ''}" data-router-diag="dns">${router.diagRunning === 'dns' ? '解析中…' : '测试 DNS'}</button></section>
        <section class="int-card"><div class="int-card-title"><span>下载速度</span><span>本地缓存</span></div><p style="color:#71888b;font-size:6.5px;line-height:1.5;margin:0 0 9px">${results.speed ? escapeHTML(results.speed) : '模拟 1 Gbps 链路的吞吐测试。'}</p><button class="int-btn ${router.diagRunning === 'speed' ? 'primary' : ''}" data-router-diag="speed">${router.diagRunning === 'speed' ? '测速中…' : '开始测速'}</button></section>
      </div>
      <section class="int-card" style="margin-top:10px"><div class="int-card-title"><span>链路详情</span><span>WAN</span></div><div class="int-stat-grid"><div><span>运营商</span><b>AISniper Fiber</b></div><div><span>公网 IP</span><b>203.0.113.42</b></div><div><span>网关</span><b>203.0.113.1</b></div><div><span>MTU</span><b>1500</b></div></div></section>`;
  }

  function loginPage() {
    return `<div class="int-page" style="min-height:100%"><div class="int-login"><div class="int-login-card">
      <div class="int-login-mark">R</div>
      <h1>RouterOS</h1>
      <p>AISNIPER AX-6000 管理员登录<br>本地管理后台 · 192.168.1.1</p>
      <form class="int-form" data-router-login>
        <div class="int-field"><label>用户名</label><input name="username" value="admin" autocomplete="username"></div>
        <div class="int-field"><label>密码</label><input name="password" type="password" value="aisniper" autocomplete="current-password"></div>
        <button class="int-btn primary" type="submit" style="height:32px;margin-top:2px">登录 RouterOS</button>
      </form>
      ${loginError ? `<div class="int-login-error">${escapeHTML(loginError)}</div>` : ''}
      <div class="int-login-hint">演示账户：admin / aisniper<br>这是一个本地模拟后台，不会访问真实路由器。</div>
      <div class="int-note" style="margin-top:12px"><a class="int-link" href="${portalUrl('/')}" data-int-url="${portalUrl('/')}">返回内网门户</a> · <a class="int-link" href="${nasUrl('/')}" data-int-url="${nasUrl('/')}">打开 Vault NAS</a></div>
    </div></div></div>`;
  }

  /* Portal */
  function portalPage(path) {
    const content = path.includes('/history') ? portalHistory()
      : path.includes('/bookmarks') ? portalBookmarks()
        : path.includes('/network') ? portalNetwork()
          : portalHome();
    const active = path.includes('/history') ? 'history' : path.includes('/bookmarks') ? 'bookmarks' : path.includes('/network') ? 'network' : 'home';
    return portalShell(active, content);
  }

  function portalHome() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">AISNIPER INTRANET</span><h1>家庭网络中心</h1><p>一切都在本地。从这里进入路由器、NAS 和这台设备的网络世界。</p></div><div class="int-page-actions"><a class="int-btn primary" href="${routerUrl('/')}" data-int-url="${routerUrl('/')}"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg>打开 RouterOS</a></div></div>
      <section class="int-hero-card"><span class="int-eyebrow">WELCOME BACK, SNIPER</span><h2>网络运行正常。</h2><p>以太网链路稳定，8 台设备在线。路由器、NAS 和本地服务都可以从这里访问；这些页面不会离开这台设备。</p><div style="display:flex;gap:7px;margin-top:13px"><span class="int-badge green">● 内网在线</span><span class="int-badge blue">192.168.1.0/24</span><span class="int-badge amber">延迟 8 ms</span></div></section>
      <div class="int-grid two" style="margin-top:10px"><section class="int-card"><div class="int-card-title"><span>网络服务</span><span>3 个本地入口</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg><div><b>RouterOS 路由器后台</b><small>192.168.1.1 · Wi-Fi、DHCP、防火墙</small></div><a class="int-link" href="${routerUrl('/')}" data-int-url="${routerUrl('/')}">打开 →</a></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg><div><b>AISniper Vault NAS</b><small>192.168.1.20 · 文件、媒体、备份</small></div><a class="int-link" href="${nasUrl('/')}" data-int-url="${nasUrl('/')}">打开 →</a></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg><div><b>内网门户</b><small>aisniper.local · 当前页面</small></div><span class="int-badge green">你在这里</span></div></section><section class="int-card"><div class="int-card-title"><span>网络状态</span><span>实时</span></div><div class="int-stat-grid"><div><span>在线设备</span><b class="green">8</b></div><div><span>路由器</span><b>AX-6000</b></div><div><span>存储</span><b class="amber">70%</b></div><div><span>公网 IP</span><b>203.0.113.42</b></div></div><div class="int-chart"><svg viewBox="0 0 520 102" preserveAspectRatio="none"><path d="M0,81 C30,77 52,63 76,67 S116,49 151,58 S198,50 228,45 S271,41 301,49 S344,31 375,38 S421,20 454,28 S496,19 520,15"/></svg></div></section></div>
      <div class="int-grid two" style="margin-top:10px"><section class="int-card"><div class="int-card-title"><span>最近访问</span><a class="int-link" href="${portalUrl('/history')}" data-int-url="${portalUrl('/history')}">全部历史</a></div>${recents.slice(0, 4).map((entry) => `<div class="int-row"><svg viewBox="0 0 24 24"><use href="${entry.internal ? '#i-ethernet' : '#i-globe'}"></use></svg><div><b>${escapeHTML(entry.title)}</b><small>${escapeHTML(entry.time)} · ${entry.internal ? '内网页面' : '外部网站'}</small></div><button class="int-btn" data-int-url="${escapeAttr(entry.url)}">打开</button></div>`).join('') || '<div class="int-log-line"><span>还没有访问记录。</span></div>'}</section><section class="int-card"><div class="int-card-title"><span>网络公告</span><span>本机</span></div><div class="int-row"><span class="int-badge blue">维护</span><div><b>路由器固件 26.4.1 已就绪</b><small>今天 18:02 · 通过本地镜像验证</small></div></div><div class="int-row"><span class="int-badge green">新设备</span><div><b>SlimeVR RX 已加入 2.4 GHz</b><small>今天 17:48 · 六个追踪器在线</small></div></div><div class="int-row"><span class="int-badge amber">存储</span><div><b>Vault 存储池已使用 70%</b><small>建议清理旧的设备快照</small></div></div></section></div>
      <div class="int-quick-links" style="margin-top:10px"><a class="int-quick-link" href="${routerUrl('/wireless')}" data-int-url="${routerUrl('/wireless')}"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg>无线设置</a><a class="int-quick-link" href="${nasUrl('/files')}" data-int-url="${nasUrl('/files')}"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>浏览文件</a><a class="int-quick-link" href="${portalUrl('/bookmarks')}" data-int-url="${portalUrl('/bookmarks')}"><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg>打开书签</a></div>`;
  }

  function portalNetwork() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">AISNIPER INTRANET / NETWORK</span><h1>网络设备</h1><p>局域网设备、路由器状态与链路信息</p></div><div class="int-page-actions"><a class="int-btn" href="${routerUrl('/clients')}" data-int-url="${routerUrl('/clients')}">管理客户端</a></div></div>
      <div class="int-stat-grid"><div><span>在线设备</span><b class="green">8</b></div><div><span>网关</span><b>192.168.1.1</b></div><div><span>主 DNS</span><b>192.168.1.1</b></div><div><span>外网链路</span><b class="green">1000 Mbps</b></div></div>
      <div class="int-grid two" style="margin-top:10px"><section class="int-card"><div class="int-card-title"><span>局域网设备</span><span>DHCP 租约</span></div><table class="int-table"><thead><tr><th>设备</th><th>IP</th><th>类型</th><th>状态</th></tr></thead><tbody>${router.clients.map((client) => `<tr><td><b>${escapeHTML(client.name)}</b></td><td>${escapeHTML(client.ip)}</td><td>${escapeHTML(client.type)}</td><td><span class="int-badge ${client.blocked ? 'red' : 'green'}">${client.blocked ? '已暂停' : '在线'}</span></td></tr>`).join('')}</tbody></table></section><section class="int-card"><div class="int-card-title"><span>服务入口</span><span>本地</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-wifi"></use></svg><div><b>RouterOS</b><small>http://192.168.1.1</small></div><a class="int-link" href="${routerUrl('/')}" data-int-url="${routerUrl('/')}">打开 →</a></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg><div><b>AISniper Vault</b><small>http://192.168.1.20</small></div><a class="int-link" href="${nasUrl('/')}" data-int-url="${nasUrl('/')}">打开 →</a></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg><div><b>Intranet Portal</b><small>http://aisniper.local</small></div><span class="int-badge green">当前</span></div><div class="int-note">这些地址仅在 AISniperOS 的模拟浏览器中可访问，不会发送到真实网络。</div></section></div>`;
  }

  function portalHistory() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">AISNIPER INTRANET / HISTORY</span><h1>历史记录</h1><p>这台设备最近打开的内网页面与外部网站</p></div><div class="int-page-actions"><button class="int-btn danger" data-int-clear-history>清空记录</button></div></div><section class="int-card"><div class="int-card-title"><span>最近访问</span><span>${recents.length} 条</span></div>${recents.map((entry) => `<div class="int-row"><svg viewBox="0 0 24 24"><use href="${entry.internal ? '#i-ethernet' : '#i-globe'}"></use></svg><div><b>${escapeHTML(entry.title)}</b><small>${escapeHTML(entry.url)}</small></div><span class="int-badge ${entry.internal ? 'green' : 'blue'}">${entry.internal ? '内网' : '外网'}</span><button class="int-btn" data-int-url="${escapeAttr(entry.url)}">打开</button></div>`).join('') || '<div class="int-log-line"><span>历史记录为空。</span></div>'}</section>`;
  }

  function portalBookmarks() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">AISNIPER INTRANET / BOOKMARKS</span><h1>收藏夹</h1><p>内网后台和外部网站都可以加入收藏</p></div><div class="int-page-actions"><a class="int-btn" href="${portalUrl('/')}" data-int-url="${portalUrl('/')}">返回门户</a></div></div><section class="int-card"><div class="int-card-title"><span>已收藏页面</span><span>${bookmarks.length} 个</span></div>${bookmarks.map((item) => `<div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg><div><b>${escapeHTML(item.title)}</b><small>${escapeHTML(item.url)}</small></div><button class="int-btn" data-int-url="${escapeAttr(item.url)}">打开</button><button class="int-btn danger" data-int-bookmark-remove="${escapeAttr(item.url)}">移除</button></div>`).join('') || '<div class="int-log-line"><span>还没有收藏页面。</span></div>'}</section>`;
  }

  /* NAS */
  function nasPage(path) {
    let active = 'overview';
    if (path.startsWith('/files')) active = 'files';
    else if (path.startsWith('/media')) active = 'media';
    else if (path.startsWith('/backups')) active = 'backups';
    else if (path.startsWith('/users')) active = 'users';
    const content = active === 'files' ? nasFiles(path) : active === 'media' ? nasMedia() : active === 'backups' ? nasBackups() : active === 'users' ? nasUsers() : nasOverview();
    return nasShell(active, content);
  }

  function nasOverview() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">VAULT / STORAGE</span><h1>存储概览</h1><p>VN-4B · RAID 5 · 4 块 4 TB 硬盘 · 链路聚合 2.5 GbE</p></div><div class="int-page-actions"><a class="int-btn primary" href="${nasUrl('/files')}" data-int-url="${nasUrl('/files')}"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>浏览文件</a></div></div>
      <div class="int-grid two"><section class="int-card"><div class="int-card-title"><span>存储池</span><span>RAID 5 · 健康</span></div><div class="int-drive-ring"><div class="int-ring"><b>70%</b></div><div><b>9.8 TB / 14 TB 已使用</b><small>剩余 4.2 TB · 上次 scrub 3 天前</small><div class="int-progress"><i style="width:70%"></i></div></div></div><div class="int-note">自动快照策略：每天 03:00 · 保留最近 7 个快照。</div></section><section class="int-card"><div class="int-card-title"><span>系统状态</span><span>运行 42 天</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-health"></use></svg><div><b>CPU 8% · 内存 26%</b><small>温度 38°C · 风扇 16%</small></div><span class="int-badge green">良好</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-ethernet"></use></svg><div><b>2.5 GbE · 链路聚合</b><small>192.168.1.20 · 固定租约</small></div><span class="int-badge green">在线</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg><div><b>SMB / NFS / WebDAV</b><small>3 个共享 · 8 个用户</small></div><span class="int-badge blue">已启用</span></div></section></div>
      <div class="int-grid three" style="margin-top:10px"><section class="int-card"><div class="int-card-title"><span>照片与截图</span><span>Photos</span></div><div class="int-stat-grid"><div><span>文件</span><b>12,408</b></div><div><span>大小</span><b>2.1 TB</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/files/Photos')}" data-int-url="${nasUrl('/files/Photos')}">打开共享 →</a></div></section><section class="int-card"><div class="int-card-title"><span>项目归档</span><span>Projects</span></div><div class="int-stat-grid"><div><span>项目</span><b>38</b></div><div><span>大小</span><b>1.3 TB</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/files/Projects')}" data-int-url="${nasUrl('/files/Projects')}">打开共享 →</a></div></section><section class="int-card"><div class="int-card-title"><span>备份</span><span>Backups</span></div><div class="int-stat-grid"><div><span>快照</span><b>6</b></div><div><span>大小</span><b>3.4 TB</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/backups')}" data-int-url="${nasUrl('/backups')}">查看快照 →</a></div></section></div>
      <section class="int-card" style="margin-top:10px"><div class="int-card-title"><span>最近文件</span><span>本机同步</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-file"></use></svg><div><b>flight-recorder.json</b><small>Projects / VOID SIGNAL · 今天 21:31 · 1.1 MB</small></div><span class="int-badge blue">JSON</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-image"></use></svg><div><b>golden-hour-01.jpg</b><small>Photos / Ridge · 今天 20:12 · 22.1 MB</small></div><span class="int-badge green">图片</span></div><div class="int-row"><svg viewBox="0 0 24 24"><use href="#i-pdf"></use></svg><div><b>brand-guide-v7.pdf</b><small>Projects / Aperture · 昨天 18:44 · 12.4 MB</small></div><span class="int-badge amber">PDF</span></div></section>`;
  }

  function nasFiles(path) {
    const raw = path.replace(/^\/files/, '') || '/';
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch (error) { /* no-op */ }
    if (!decoded.startsWith('/')) decoded = `/${decoded}`;
    const entries = nas.files[decoded];
    const parts = decoded.split('/').filter(Boolean);
    const breadcrumb = [`<a href="${nasUrl('/files')}" data-int-url="${nasUrl('/files')}">文件</a>`].concat(parts.map((part, index) => {
      const sub = `/${parts.slice(0, index + 1).join('/')}`;
      return `<a href="${nasUrl(`/files${encodeURI(sub)}`)}" data-int-url="${nasUrl(`/files${encodeURI(sub)}`)}">${escapeHTML(part)}</a>`;
    })).join('<span>/</span>');
    return `<div class="int-breadcrumb">${breadcrumb}</div><div class="int-page-head"><div><span class="int-eyebrow">VAULT / FILES</span><h1>${escapeHTML(parts.length ? parts[parts.length - 1] : '文件与共享')}</h1><p>${entries ? entries.length : 0} 个项目 · SMB 共享 · 访问权限 Sniper</p></div><div class="int-page-actions"><button class="int-btn" data-nas-upload><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>上传</button></div></div>
      <section class="int-card"><div class="int-file-toolbar"><b>${escapeHTML(decoded === '/' ? '根目录' : decoded)}</b><span>·</span><span>可用空间 4.2 TB</span></div>
      ${entries ? `<table class="int-table"><thead><tr><th>名称</th><th>类型</th><th>大小</th><th>修改时间</th><th></th></tr></thead><tbody>${entries.map((entry) => {
        if (entry.type === 'folder') {
          const folderPath = `${decoded === '/' ? '' : decoded}/${entry.id}`;
          return `<tr><td><button class="int-link" data-int-url="${nasUrl(`/files${encodeURI(folderPath)}`)}">${escapeHTML(entry.name)}</button><small>${escapeHTML(entry.meta)}</small></td><td>文件夹</td><td>—</td><td>${escapeHTML(entry.meta.split('·')[1]?.trim() || '—')}</td><td><span class="int-badge blue">共享</span></td></tr>`;
        }
        return `<tr><td><button class="int-link" data-nas-file="${escapeAttr(entry.name)}">${escapeHTML(entry.name)}</button><small>${escapeHTML(entry.meta)}</small></td><td>${escapeHTML(entry.kind || '文件')}</td><td>${escapeHTML(entry.meta.split('·')[0].trim())}</td><td>${escapeHTML(entry.meta.split('·')[1]?.trim() || '—')}</td><td><button class="int-btn" data-nas-file="${escapeAttr(entry.name)}">打开</button></td></tr>`;
      }).join('')}</tbody></table>` : '<div class="int-log-line"><span>这个目录不存在，或已被移动。</span></div>'}
      </section><div class="int-note">文件夹路径会真实反映在浏览器地址栏；这是本地文件系统的只读模拟。</div>`;
  }

  function nasMedia() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">VAULT / MEDIA</span><h1>媒体库</h1><p>电影、音乐与家庭影像 · DLNA 就绪</p></div><div class="int-page-actions"><span class="int-badge green">DLNA 在线</span></div></div><div class="int-grid three"><section class="int-card"><div class="int-card-title"><span>电影</span><span>39 个文件</span></div><div class="int-stat-grid"><div><span>容量</span><b>1.2 TB</b></div><div><span>4K</span><b>12</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/files/Media/Films')}" data-int-url="${nasUrl('/files/Media/Films')}">浏览电影 →</a></div></section><section class="int-card"><div class="int-card-title"><span>音乐</span><span>1,402 首</span></div><div class="int-stat-grid"><div><span>容量</span><b>312 GB</b></div><div><span>专辑</span><b>86</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/files/Media/Music')}" data-int-url="${nasUrl('/files/Media/Music')}">浏览音乐 →</a></div></section><section class="int-card"><div class="int-card-title"><span>家庭影像</span><span>124 个文件</span></div><div class="int-stat-grid"><div><span>容量</span><b>488 GB</b></div><div><span>相册</span><b>18</b></div></div><div class="int-note"><a class="int-link" href="${nasUrl('/files/Photos')}" data-int-url="${nasUrl('/files/Photos')}">浏览相册 →</a></div></section></div>`;
  }

  function nasBackups() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">VAULT / BACKUPS</span><h1>备份</h1><p>设备快照 · 本地保留策略 · 自动校验</p></div><div class="int-page-actions"><button class="int-btn" data-nas-backup>创建快照</button></div></div><section class="int-card"><div class="int-card-title"><span>快照列表</span><span>6 个快照</span></div><table class="int-table"><thead><tr><th>设备</th><th>时间</th><th>大小</th><th>状态</th><th></th></tr></thead><tbody><tr><td><b>Sniper Mac</b><small>MacBook Pro · 完整备份</small></td><td>今天 03:00</td><td>241 GB</td><td><span class="int-badge green">已完成</span></td><td><button class="int-btn" data-int-url="${nasUrl('/files/Backups/Mac-2026-11-12')}">查看</button></td></tr><tr><td><b>Sniper Mac</b><small>MacBook Pro · 增量</small></td><td>11 月 5 日</td><td>238 GB</td><td><span class="int-badge green">已完成</span></td><td><button class="int-btn" data-int-url="${nasUrl('/files/Backups/Mac-2026-11-05')}">查看</button></td></tr><tr><td><b>Mira Phone</b><small>iPhone · 照片与消息</small></td><td>11 月 10 日</td><td>84 GB</td><td><span class="int-badge green">已完成</span></td><td><button class="int-btn" data-int-url="${nasUrl('/files/Backups/Phone-2026-11-10')}">查看</button></td></tr></tbody></table></section><div class="int-note">快照是本地静态演示数据，不会复制真实文件。</div>`;
  }

  function nasUsers() {
    return `<div class="int-page-head"><div><span class="int-eyebrow">VAULT / USERS</span><h1>用户与权限</h1><p>家庭共享账户 · SMB / WebDAV 访问</p></div><div class="int-page-actions"><button class="int-btn">添加用户</button></div></div><section class="int-card"><div class="int-card-title"><span>用户</span><span>4 个账户</span></div><table class="int-table"><thead><tr><th>用户</th><th>角色</th><th>可访问共享</th><th>状态</th></tr></thead><tbody><tr><td><b>Sniper</b><small>管理员 · 本机账户</small></td><td>Admin</td><td>全部</td><td><span class="int-badge green">在线</span></td></tr><tr><td><b>Mira</b><small>家庭成员</small></td><td>User</td><td>Photos / Media</td><td><span class="int-badge blue">允许</span></td></tr><tr><td><b>Kai</b><small>家庭成员</small></td><td>User</td><td>Projects / Media</td><td><span class="int-badge blue">允许</span></td></tr><tr><td><b>Guest</b><small>访客只读</small></td><td>Guest</td><td>Public</td><td><span class="int-badge amber">受限</span></td></tr></tbody></table></section>`;
  }

  function renderInternalPage(tab) {
    if (!ui?.internalPage || !tab || !tab.url) return;
    const info = parseInternalUrl(tab.url);
    if (!info) return;
    let html = '';
    if (info.site === 'router') html = routerPage(info.path);
    else if (info.site === 'nas') html = nasPage(info.path);
    else html = portalPage(info.path);
    ui.internalPage.innerHTML = html;
    tab.title = internalTitle(info.site, info.path);
    renderTabs();
    if (activeTab()?.id === tab.id) {
      if (ui.address) ui.address.value = tab.url;
      if (ui.status) ui.status.textContent = tab.loading ? `正在载入 · ${tab.title}` : `内网已载入 · ${tab.title}`;
      if (ui.securityLabel) ui.securityLabel.textContent = `内网连接 · ${siteLabel(info.site)}`;
    }
    ui.internalPage.scrollTop = 0;
  }

  /* ---------------------------------------------------------------------
     Internal interactions
     --------------------------------------------------------------------- */

  function internalToast(message, kind = 'success') {
    host?.showToast?.({ title: kind === 'error' ? '操作失败' : '设置已更新', message, icon: kind === 'error' ? 'i-info' : 'i-check' });
  }

  function isActiveRouterSystem() {
    const tab = activeTab();
    if (!tab || tab.kind !== 'internal') return false;
    const info = parseInternalUrl(tab.url);
    return Boolean(info && info.site === 'router' && info.path.includes('/system'));
  }

  function handleInternalClick(event) {
    const removeBookmark = event.target.closest('[data-int-bookmark-remove]');
    if (removeBookmark) {
      bookmarks = bookmarks.filter((item) => item.url !== removeBookmark.dataset.intBookmarkRemove);
      saveBookmarks();
      renderBookmarks();
      renderInternalPage(activeTab());
      internalToast('已从收藏夹移除。');
      return;
    }
    const clearHistory = event.target.closest('[data-int-clear-history]');
    if (clearHistory) {
      recents = [];
      renderRecents();
      renderInternalPage(activeTab());
      internalToast('历史记录已清空。');
      return;
    }
    const nasUpload = event.target.closest('[data-nas-upload]');
    if (nasUpload) {
      internalToast('上传队列已创建 · 本地模拟');
      return;
    }
    const nasFile = event.target.closest('[data-nas-file]');
    if (nasFile) {
      internalToast(`已请求打开 ${nasFile.dataset.nasFile} · 文件留在本机`);
      return;
    }
    const nasBackup = event.target.closest('[data-nas-backup]');
    if (nasBackup) {
      internalToast('新的设备快照已加入队列 · 本机模拟');
      return;
    }
    const logFilter = event.target.closest('[data-router-log-filter]');
    if (logFilter) {
      router.logFilter = logFilter.dataset.routerLogFilter;
      renderInternalPage(activeTab());
      return;
    }
    const toggle = event.target.closest('[data-router-toggle]');
    if (toggle) {
      const key = toggle.dataset.routerToggle;
      if (key === 'wifi') router.wifi = !router.wifi;
      else if (key === 'guest') router.guest = !router.guest;
      else if (key === 'firewall') router.firewall = !router.firewall;
      else if (key === 'upnp') router.upnp = !router.upnp;
      else if (key === 'remoteAdmin') router.remoteAdmin = !router.remoteAdmin;
      else if (key === 'dhcp') router.dhcp = !router.dhcp;
      routerLog(`${key} 已切换为 ${router[key] ? '开启' : '关闭'}`, 'info');
      renderInternalPage(activeTab());
      internalToast(`${key} 状态已更新。`);
      return;
    }
    const block = event.target.closest('[data-router-client-block]');
    if (block) {
      const client = router.clients.find((entry) => entry.id === block.dataset.routerClientBlock);
      if (client) {
        client.blocked = !client.blocked;
        routerLog(`${client.name} 的互联网访问已${client.blocked ? '暂停' : '恢复'}`, client.blocked ? 'warning' : 'info');
        renderInternalPage(activeTab());
        internalToast(`${client.name} 已${client.blocked ? '暂停联网' : '恢复联网'}。`);
      }
      return;
    }
    const logout = event.target.closest('[data-router-logout]');
    if (logout) {
      router.loggedIn = false;
      loginError = '';
      navigate(routerUrl('/'));
      internalToast('已退出 RouterOS。');
      return;
    }
    const action = event.target.closest('[data-router-action]');
    if (action) {
      const name = action.dataset.routerAction;
      if (name === 'refresh') {
        internalToast('状态已刷新。');
        renderInternalPage(activeTab());
      } else if (name === 'add-rule') {
        router.firewallRules.push({ name: '允许本地开发端口', target: '192.168.1.42', port: '3000 / 5173', action: '允许' });
        routerLog('新增防火墙规则：允许本地开发端口', 'info');
        renderInternalPage(activeTab());
        internalToast('防火墙规则已添加。');
      } else if (name === 'backup') {
        internalToast('配置备份已生成 · aisniper-router-backup.json');
        routerLog('管理员导出了路由器配置备份', 'info');
      } else if (name === 'firmware') {
        internalToast(`当前固件 ${router.firmware} 已是最新版本。`);
        routerLog('手动检查固件：已是最新版本', 'info');
      } else if (name === 'clear-logs') {
        router.logs = [];
        renderInternalPage(activeTab());
        internalToast('日志已清空。');
      } else if (name === 'factory') {
        router.ssid = 'AISNIPER-5G';
        router.wifi = true;
        router.guest = true;
        router.firewall = true;
        router.dhcp = true;
        router.logFilter = 'all';
        routerLog('恢复演示默认设置', 'warning');
        renderInternalPage(activeTab());
        internalToast('演示设置已恢复默认值。');
      } else if (name === 'reboot') {
        if (router.rebooting) return;
        router.rebooting = true;
        router.rebootProgress = 0;
        routerLog('管理员发起路由器重启', 'warning');
        renderInternalPage(activeTab());
        clearInterval(rebootTimer);
        rebootTimer = setInterval(() => {
          router.rebootProgress = Math.min(100, router.rebootProgress + 4.5 + Math.random() * 4);
          if (isActiveRouterSystem()) {
            const bar = $('[data-router-reboot-bar]', ui.internalPage);
            const label = $('[data-router-reboot-label]', ui.internalPage);
            const heading = $('.int-page-actions .int-badge', ui.internalPage);
            if (bar) bar.style.width = `${router.rebootProgress}%`;
            if (label) label.textContent = router.rebootProgress < 55 ? '正在关闭 WAN 连接并保存配置…' : router.rebootProgress < 90 ? '正在重启网络服务…' : '准备重新连接…';
            if (heading) heading.textContent = `正在重启 ${Math.round(router.rebootProgress)}%`;
          }
          if (router.rebootProgress >= 100) {
            clearInterval(rebootTimer);
            rebootTimer = null;
            router.rebooting = false;
            router.loggedIn = false;
            routerLog('路由器重启完成，等待管理员登录', 'info');
            loginError = '';
            internalToast('路由器已重启，请重新登录。');
            const tab = activeTab();
            if (tab && tab.kind === 'internal' && parseInternalUrl(tab.url)?.site === 'router') navigate(routerUrl('/'));
            else renderInternalPage(tab);
          }
        }, 240);
      }
      return;
    }
    const diag = event.target.closest('[data-router-diag]');
    if (diag) {
      const type = diag.dataset.routerDiag;
      if (router.diagRunning) return;
      router.diagRunning = type;
      renderInternalPage(activeTab());
      clearTimeout(diagTimer);
      diagTimer = setTimeout(() => {
        if (type === 'ping') router.diagResults.ping = 'Ping 8.8.8.8 · 8 ms · 0% packet loss';
        else if (type === 'dns') router.diagResults.dns = 'router.local → 192.168.1.1 · 2 ms';
        else router.diagResults.speed = '下载 936 Mbps · 上传 412 Mbps';
        router.diagRunning = '';
        routerLog(`网络诊断完成：${type}`, 'info');
        const tab = activeTab();
        if (tab && tab.kind === 'internal' && parseInternalUrl(tab.url)?.site === 'router') renderInternalPage(tab);
        internalToast('诊断完成。');
      }, 900);
      return;
    }
    const internalLink = event.target.closest('[data-int-url]');
    if (internalLink) {
      event.preventDefault();
      navigate(internalLink.dataset.intUrl);
    }
  }

  function handleInternalSubmit(event) {
    const loginForm = event.target.closest('[data-router-login]');
    if (loginForm) {
      event.preventDefault();
      const username = $('[name="username"]', loginForm)?.value.trim() || '';
      const password = $('[name="password"]', loginForm)?.value || '';
      if (username === 'admin' && password === 'aisniper') {
        router.loggedIn = true;
        loginError = '';
        routerLog('管理员 admin 登录成功', 'info');
        navigate(routerUrl('/overview'));
        internalToast('登录成功。');
      } else {
        loginError = '用户名或密码不正确。演示账户为 admin / aisniper。';
        renderInternalPage(activeTab());
      }
      return;
    }
    const wirelessForm = event.target.closest('[data-router-wireless]');
    if (wirelessForm) {
      event.preventDefault();
      const data = new FormData(wirelessForm);
      router.ssid = String(data.get('ssid') || 'AISNIPER-5G').trim().slice(0, 32) || 'AISNIPER-5G';
      router.wifiPassword = String(data.get('password') || '').slice(0, 64);
      router.band = String(data.get('band') || '自动');
      router.channel = String(data.get('channel') || '自动');
      routerLog(`无线设置已更新：${router.ssid}`, 'info');
      renderInternalPage(activeTab());
      internalToast('无线设置已保存。');
      return;
    }
    const dhcpForm = event.target.closest('[data-router-dhcp]');
    if (dhcpForm) {
      event.preventDefault();
      const data = new FormData(dhcpForm);
      router.poolStart = String(data.get('start') || router.poolStart);
      router.poolEnd = String(data.get('end') || router.poolEnd);
      router.lease = String(data.get('lease') || router.lease);
      routerLog(`DHCP 地址池更新：${router.poolStart} – ${router.poolEnd}`, 'info');
      renderInternalPage(activeTab());
      internalToast('DHCP 配置已应用。');
    }
  }

  /* ---------------------------------------------------------------------
     Browser events and public API
     --------------------------------------------------------------------- */

  function toggleBookmark() {
    const tab = activeTab();
    if (!tab?.url) return;
    const index = bookmarks.findIndex((item) => item.url === tab.url);
    if (index >= 0) {
      bookmarks.splice(index, 1);
      host?.showToast?.({ title: '已取消收藏', message: tab.title, icon: 'i-star' });
    } else {
      bookmarks.unshift({ url: tab.url, title: tab.title });
      bookmarks = bookmarks.slice(0, 30);
      host?.showToast?.({ title: '已收藏此页', message: tab.title, icon: 'i-star' });
    }
    saveBookmarks();
    renderBookmarks();
    syncUI();
    if (tab.kind === 'internal' && parseInternalUrl(tab.url)?.path.includes('/bookmarks')) renderInternalPage(tab);
  }

  function openExternalUrl(url) {
    if (parseInternalUrl(url)) {
      host?.showToast?.({ title: '内网页面', message: '这个地址属于本地模拟网络，只在 AISniperOS 浏览器中可用。', icon: 'i-info' });
      return;
    }
    let externalWindow = null;
    try {
      externalWindow = window.open(url, '_blank');
      if (externalWindow) {
        try { externalWindow.opener = null; } catch (error) { /* cross-origin */ }
      }
    } catch (error) {
      externalWindow = null;
    }
    if (!externalWindow) {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) { /* popup policy */ }
    }
    host?.showToast?.({ title: externalWindow ? '已交给系统浏览器' : '已请求系统浏览器打开', message: externalWindow ? '网站将在真实浏览器标签页中完整打开。' : '若页面没有出现，请允许此页面打开弹窗后重试。', icon: 'i-external' });
  }

  function openExternalCurrent() {
    const tab = activeTab();
    if (!tab?.url) {
      host?.showToast?.({ title: '还没有打开网页', message: '先输入网址，或从内网服务中选择一个页面。', icon: 'app-browser' });
      return;
    }
    if (parseInternalUrl(tab.url)) {
      host?.showToast?.({ title: '内网页面', message: '内网后台只能在本机模拟浏览器中访问。', icon: 'i-info' });
      return;
    }
    openExternalUrl(tab.url);
  }

  function bindEvents() {
    ui.newTab?.addEventListener('click', () => newTab());
    ui.back?.addEventListener('click', () => historyStep(-1));
    ui.forward?.addEventListener('click', () => historyStep(1));
    ui.reload?.addEventListener('click', reload);
    ui.home?.addEventListener('click', goHome);
    ui.addressForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      navigate(ui.address.value);
    });
    ui.homeForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      navigate(ui.homeInput.value);
    });
    ui.bookmark?.addEventListener('click', toggleBookmark);
    ui.engineChip?.addEventListener('click', () => {
      searchEngine = searchEngine === 'google' ? 'baidu' : 'google';
      saveSearchEngine();
      updateEngineChip();
    });
    ui.external?.addEventListener('click', openExternalCurrent);
    ui.statusExternal?.addEventListener('click', openExternalCurrent);
    ui.localChip?.addEventListener('click', () => navigate(portalUrl('/')));
    ui.tabs?.addEventListener('click', (event) => {
      const close = event.target.closest('[data-browser-close]');
      if (close) {
        event.preventDefault();
        event.stopPropagation();
        closeTab(close.dataset.browserClose);
        return;
      }
      const tab = event.target.closest('[data-browser-tab]');
      if (tab) activateTab(tab.dataset.browserTab);
    });
    ui.root?.addEventListener('click', (event) => {
      const side = event.target.closest('[data-browser-side]');
      if (side) {
        const target = side.dataset.browserSide;
        if (target === 'home') goHome();
        else if (target === 'portal') navigate(portalUrl('/'));
        else if (target === 'history') navigate(portalUrl('/history'));
        else if (target === 'bookmarks') navigate(portalUrl('/bookmarks'));
        return;
      }
      const link = event.target.closest('[data-browser-url]');
      if (link) {
        if (link.dataset.browserExternal === 'true') {
          openExternalUrl(link.dataset.browserUrl);
          return;
        }
        navigate(link.dataset.browserUrl, { titleHint: link.dataset.browserLabel || undefined });
      }
    });
    ui.bookmarksList?.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-bookmark-remove]');
      if (remove) {
        bookmarks = bookmarks.filter((item) => item.url !== remove.dataset.bookmarkRemove);
        saveBookmarks();
        renderBookmarks();
        syncUI();
        return;
      }
      const open = event.target.closest('[data-bookmark-url]');
      if (open) navigate(open.dataset.bookmarkUrl);
    });
    ui.internalPage?.addEventListener('click', handleInternalClick);
    ui.internalPage?.addEventListener('submit', handleInternalSubmit);
    ui.address?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        ui.address.value = activeTab()?.url || '';
        ui.address.blur();
      }
    });

    const widgetForm = $('#desktopBrowserForm');
    const widgetInput = $('#desktopBrowserInput');
    widgetForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = widgetInput?.value.trim();
      host?.openApp?.('browser', value ? { url: value } : {});
      if (value && widgetInput) widgetInput.value = '';
    });
    $('#desktopBrowserOpen')?.addEventListener('click', () => host?.openApp?.('browser'));
  }

  function open(options = {}) {
    ensureActiveTab();
    renderBookmarks();
    renderTabs();
    const raw = typeof options.url === 'string' ? options.url.trim() : '';
    if (raw) {
      const tab = activeTab();
      if (tab?.url) newTab({ focus: false });
      navigate(raw);
    } else {
      const tab = activeTab();
      if (tab?.kind === 'internal') renderInternalPage(tab);
      syncUI();
      if (!tab?.url) setTimeout(() => ui.homeInput?.focus(), 140);
    }
  }

  function openUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return;
    ensureActiveTab();
    const tab = activeTab();
    if (tab?.url) newTab({ url: raw, focus: false });
    else navigate(raw);
  }

  function init(dependencies = {}) {
    if (controller) return controller;
    host = dependencies;
    const win = document.getElementById('window-browser');
    if (!win) return null;
    ui = {
      root: win,
      win,
      tabs: document.getElementById('browserTabs'),
      newTab: document.getElementById('browserNewTabBtn'),
      back: document.getElementById('browserBackBtn'),
      forward: document.getElementById('browserForwardBtn'),
      reload: document.getElementById('browserReloadBtn'),
      home: document.getElementById('browserHomeBtn'),
      addressForm: document.getElementById('browserAddressForm'),
      address: document.getElementById('browserAddress'),
      addressSecurity: document.getElementById('browserAddressSecurity'),
      sidebar: document.getElementById('browserSidebar'),
      securityIcon: document.getElementById('browserSecurityIcon'),
      bookmark: document.getElementById('browserBookmarkBtn'),
      external: document.getElementById('browserExternalBtn'),
      localChip: document.getElementById('browserLocalChip'),
      progress: document.getElementById('browserProgress'),
      startPage: document.getElementById('browserStartPage'),
      homeForm: document.getElementById('browserHomeSearch'),
      homeInput: document.getElementById('browserHomeInput'),
      engineChip: document.getElementById('browserEngineChip'),
      bookmarksPanel: document.getElementById('browserBookmarksPanel'),
      bookmarksList: document.getElementById('browserBookmarksList'),
      internalPage: document.getElementById('browserInternalPage'),
      frames: document.getElementById('browserFrames'),
      recents: document.getElementById('browserRecents'),
      recentCount: document.getElementById('browserRecentCount'),
      status: document.getElementById('browserStatus'),
      statusDot: document.getElementById('browserStatusDot'),
      securityLabel: document.getElementById('browserSecurityLabel'),
      statusExternal: document.getElementById('browserStatusExternal')
    };
    if (!tabs.length) {
      const tab = makeTab();
      tabs.push(tab);
      activeId = tab.id;
    }
    bindEvents();
    updateEngineChip();
    renderBookmarks();
    renderRecents();
    renderTabs();
    syncUI();
    controller = {
      open,
      openUrl,
      newTab,
      closeActiveTab,
      reload,
      goHome,
      openExternal: openExternalCurrent,
      historyStep,
      getState: () => {
        const tab = activeTab();
        return {
          tabCount: tabs.length,
          hasUrl: Boolean(tab?.url),
          kind: tab?.kind || 'home',
          title: tab?.title || '新标签页',
          url: tab?.url || null,
          isInternal: tab?.kind === 'internal',
          canGoBack: Boolean(tab && tab.historyIndex > 0),
          canGoForward: Boolean(tab && tab.historyIndex < tab.history.length - 1),
          recents: recents.length,
          bookmarks: bookmarks.length
        };
      }
    };
    return controller;
  }

  window.AISniperBrowser = { init };
})();
