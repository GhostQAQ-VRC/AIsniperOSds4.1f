/* ==========================================================================
   AISniperOS — Ops console
   A fictional BaoTa-style server panel with local containers and demo services.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const PANEL_URL = 'panel.aisniper.local:8888';
  const PANEL_USER = 'sniper';
  const PANEL_PASSWORD = 'Sniper@2026';

  function init(host = {}) {
    const content = $('#opsContent');
    const nav = $('#opsNav');
    if (!content || !nav) return null;

    const state = {
      deployed: false,
      view: 'overview',
      containers: [],
      sites: [
        { id: 'site-aperture', name: 'aperture.design', runtime: 'PHP 8.3', root: '/www/wwwroot/aperture', port: '443', ssl: true, status: 'running', traffic: '2.4 GB' },
        { id: 'site-meridian', name: 'meridian.observer', runtime: '静态 / Nginx', root: '/www/wwwroot/meridian', port: '443', ssl: true, status: 'running', traffic: '846 MB' },
        { id: 'site-void', name: 'voidsignal.space', runtime: 'Node 22 / 反向代理', root: '/www/wwwroot/voidsignal', port: '443', ssl: true, status: 'running', traffic: '1.1 GB' }
      ],
      images: [
        { repository: 'aapanel/baota', tag: '9.2.0', size: '1.12 GB' },
        { repository: 'nginx', tag: 'stable', size: '192 MB' },
        { repository: 'redis', tag: 'alpine', size: '41 MB' },
        { repository: 'mysql', tag: '8.4', size: '612 MB' },
        { repository: 'node', tag: '22-alpine', size: '161 MB' },
        { repository: 'postgres', tag: '17', size: '431 MB' },
        { repository: 'aisniper/edge', tag: '26.1', size: '84 MB' }
      ],
      firewall: true,
      logs: [],
      logsCleared: false,
      startedAt: 0,
      containerSeq: 0
    };

    const views = ['overview', 'sites', 'containers', 'databases', 'files', 'logs', 'security'];
    const labels = {
      overview: '概览',
      sites: '网站',
      containers: '容器',
      databases: '数据库',
      files: '文件',
      logs: '日志',
      security: '安全'
    };

    function randomId() {
      const chars = '0123456789abcdef';
      let value = '';
      for (let index = 0; index < 12; index += 1) value += chars[Math.floor(Math.random() * chars.length)];
      return value;
    }

    function nowLabel() {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    function uptimeLabel() {
      if (!state.startedAt) return '刚刚';
      const minutes = Math.max(1, Math.floor((Date.now() - state.startedAt) / 60000));
      return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
    }

    function pushLog(type, message) {
      state.logs.unshift({ type, message, time: nowLabel() });
      if (state.logs.length > 20) state.logs.pop();
    }

    function initialContainers() {
      return [
        { id: 'a1b2c3d4e5f6', name: 'baota_panel', image: 'aapanel/baota:9.2.0', status: 'running', ports: '0.0.0.0:8888->8888', cpu: '1.8%', memory: '186 MB', uptime: '2 分钟', role: '面板' },
        { id: '7c8d9e0f1a2b', name: 'aisniper_edge', image: 'nginx:stable', status: 'running', ports: '0.0.0.0:80->80', cpu: '0.4%', memory: '28 MB', uptime: '2 分钟', role: '边缘代理' },
        { id: '3f4a5b6c7d8e', name: 'aisniper_mysql', image: 'mysql:8.4', status: 'running', ports: '3306/tcp', cpu: '2.1%', memory: '412 MB', uptime: '2 分钟', role: '数据库' }
      ];
    }

    function syncChrome() {
      $$('.ops-nav-item', nav).forEach((item) => {
        item.classList.toggle('is-active', item.dataset.opsView === state.view);
      });
      const count = $('#opsContainerCount');
      if (count) count.textContent = String(state.containers.length);
      const siteCount = $('[data-ops-view="sites"] i', nav);
      if (siteCount) siteCount.textContent = String(state.sites.length);
      const breadcrumb = $('#opsBreadcrumb');
      if (breadcrumb) breadcrumb.textContent = labels[state.view] || '概览';
    }

    function render() {
      syncChrome();
      if (!state.deployed) {
        content.innerHTML = deployTemplate();
        return;
      }
      if (state.view === 'overview') content.innerHTML = overviewTemplate();
      else if (state.view === 'sites') content.innerHTML = sitesTemplate();
      else if (state.view === 'containers') content.innerHTML = containersTemplate();
      else if (state.view === 'databases') content.innerHTML = databasesTemplate();
      else if (state.view === 'files') content.innerHTML = filesTemplate();
      else if (state.view === 'logs') content.innerHTML = logsTemplate();
      else if (state.view === 'security') content.innerHTML = securityTemplate();
      requestAnimationFrame(() => content.classList.remove('is-swapping'));
    }

    function swapView(view) {
      if (!views.includes(view)) return;
      state.view = view;
      content.classList.add('is-swapping');
      setTimeout(render, 80);
    }

    function deployTemplate() {
      return `
        <div class="ops-deploy">
          <div class="ops-deploy-main">
            <div class="ops-deploy-copy">
              <span class="ops-eyebrow"><i></i>BAOTA PANEL · NOT INSTALLED</span>
              <h1>把一台服务器<br><em>带到山脊。</em></h1>
              <p>在 Meridian-01 上部署一套完整的宝塔面板演示环境：网站、数据库、边缘代理与 Docker 容器，全部在本机模拟运行。</p>
              <div class="ops-deploy-actions">
                <button class="ops-primary" data-ops-action="deploy"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>立即部署</button>
                <button class="ops-secondary" data-ops-action="deploy-terminal"><svg viewBox="0 0 24 24"><use href="#app-terminal"></use></svg>在终端中部署</button>
              </div>
              <div class="ops-terminal-hint"><span>$</span><b>deploy baota</b><small>或双击「运维脚本 / 部署宝塔面板.sh」</small></div>
              <p class="ops-deploy-note">所有服务均在 Meridian-01 本地运行，数据不会离开此设备。</p>
            </div>
            <div class="ops-deploy-visual">
              <div class="ops-rack">
                <div class="ops-rack-top"><i></i><i></i><i></i><span>MERIDIAN-01</span><b>ONLINE</b></div>
                <div class="ops-rack-unit"><span class="ops-rack-led"></span><b>PANEL</b><small>aapanel / 9.2.0</small><i>8888</i></div>
                <div class="ops-rack-unit"><span class="ops-rack-led teal"></span><b>EDGE</b><small>nginx / stable</small><i>80</i></div>
                <div class="ops-rack-unit"><span class="ops-rack-led violet"></span><b>MYSQL</b><small>mysql / 8.4</small><i>3306</i></div>
                <div class="ops-rack-bottom"><span>10.0.4.18</span><span>CN · MERIDIAN</span><span>LOAD 0.21</span></div>
              </div>
              <div class="ops-deploy-log">
                <div><span class="ops-log-time">21:41:02</span><span class="ops-log-ok">ready</span> waiting for deployment</div>
                <div><span class="ops-log-time">21:41:02</span><span class="ops-log-dim">hint</span> deploy baota</div>
                <div class="ops-log-cursor"><i></i></div>
              </div>
            </div>
          </div>
          <div class="ops-deploy-capabilities">
            <div><span><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg></span><b>3 个演示站点</b><small>SSL、Nginx 与反向代理</small></div>
            <div><span><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg></span><b>本地容器</b><small>Docker 启停与端口映射</small></div>
            <div><span><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg></span><b>数据库</b><small>MySQL、Redis 与备份</small></div>
            <div><span><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg></span><b>安全面板</b><small>防火墙、Fail2ban 与 SSH</small></div>
          </div>
        </div>`;
    }

    function viewHead(title, subtitle, actions = '') {
      return `<div class="ops-view-head"><div><span class="ops-eyebrow"><i></i>MERIDIAN-01</span><h1>${title}</h1><p>${subtitle}</p></div><div class="ops-view-actions">${actions}<button class="ops-secondary" data-ops-action="refresh"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>刷新</button></div></div>`;
    }

    function overviewTemplate() {
      return `
        ${viewHead('主机概览', `10.0.4.18 · Ubuntu 24.04 LTS · 运行 ${uptimeLabel()}`)}
        <div class="ops-metric-grid">
          <div class="ops-metric"><div class="ops-gauge" style="--value:18"><span>18<small>%</small></span></div><div><span>CPU</span><b>8 核 · 3.2 GHz</b><small>负载 0.21 / 0.18 / 0.14</small></div></div>
          <div class="ops-metric"><div class="ops-gauge teal" style="--value:42"><span>42<small>%</small></span></div><div><span>内存</span><b>10.1 GB / 24 GB</b><small>缓存 3.8 GB</small></div></div>
          <div class="ops-metric"><div class="ops-gauge violet" style="--value:38"><span>38<small>%</small></span></div><div><span>磁盘</span><b>76.2 GB / 200 GB</b><small>SSD · ext4</small></div></div>
          <div class="ops-metric"><div class="ops-gauge amber" style="--value:24"><span>24<small>%</small></span></div><div><span>网络</span><b>12.4 MB/s</b><small>以太网 · 1 Gbps</small></div></div>
        </div>
        <div class="ops-overview-grid">
          <div class="ops-panel-card ops-traffic-card">
            <div class="ops-card-head"><div><span>网络流量</span><b>最近 24 小时</b></div><span class="ops-live-pill"><i></i>实时</span></div>
            <div class="ops-traffic-summary"><div><span>入站</span><b>8.6 GB</b><small>↓ 12.4 MB/s</small></div><div><span>出站</span><b>3.2 GB</b><small>↑ 4.1 MB/s</small></div><div><span>峰值</span><b>28.7 MB/s</b><small>02:14</small></div></div>
            <svg class="ops-traffic-chart" viewBox="0 0 720 140" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="opsTrafficFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".25"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
              <path class="ops-chart-area" d="M0,108 C42,96 62,112 99,92 C137,71 154,88 198,74 C244,60 268,78 309,55 C354,30 375,54 420,47 C464,40 489,66 532,49 C574,33 599,60 642,37 C675,20 699,35 720,24 L720,140 L0,140 Z" fill="url(#opsTrafficFill)"/>
              <path class="ops-chart-line" d="M0,108 C42,96 62,112 99,92 C137,71 154,88 198,74 C244,60 268,78 309,55 C354,30 375,54 420,47 C464,40 489,66 532,49 C574,33 599,60 642,37 C675,20 699,35 720,24"/>
            </svg>
            <div class="ops-chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>现在</span></div>
          </div>
          <div class="ops-panel-card ops-system-card">
            <div class="ops-card-head"><div><span>系统信息</span><b>MERIDIAN-01</b></div></div>
            <div class="ops-system-rows">
              <div><span>操作系统</span><b>Ubuntu 24.04 LTS</b></div>
              <div><span>内核</span><b>6.8.0-45-generic</b></div>
              <div><span>公网 IP</span><b>10.0.4.18</b></div>
              <div><span>运行时间</span><b>${uptimeLabel()}</b></div>
              <div><span>架构</span><b>x86_64 · KVM</b></div>
              <div><span>面板版本</span><b>9.2.0</b></div>
            </div>
            <div class="ops-chart-legend"><span><i class="teal"></i>正常</span><span><i class="amber"></i>负载</span><span><i class="violet"></i>缓存</span></div>
          </div>
          <div class="ops-panel-card ops-services-card">
            <div class="ops-card-head"><div><span>服务状态</span><b>核心服务</b></div><span class="ops-live-pill"><i></i>4 / 4 在线</span></div>
            <div class="ops-service-list">
              <div><span class="ops-service-icon"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg></span><div><b>Nginx</b><small>1.26.2 · 端口 80 / 443</small></div><i class="is-online"></i></div>
              <div><span class="ops-service-icon"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg></span><div><b>MySQL</b><small>8.4.3 · 端口 3306</small></div><i class="is-online"></i></div>
              <div><span class="ops-service-icon"><svg viewBox="0 0 24 24"><use href="#i-bolt"></use></svg></span><div><b>Redis</b><small>7.2.5 · 端口 6379</small></div><i class="is-online"></i></div>
              <div><span class="ops-service-icon"><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg></span><div><b>Docker</b><small>27.3.1 · ${state.containers.length} 个容器</small></div><i class="is-online"></i></div>
            </div>
          </div>
          <div class="ops-panel-card ops-recent-card">
            <div class="ops-card-head"><div><span>最近操作</span><b>本地审计</b></div><button class="ops-text-button" data-ops-action="logs">查看全部</button></div>
            <div class="ops-recent-list">${state.logs.slice(0, 4).map((log) => `<div><span class="ops-log-time">${log.time}</span><span class="ops-log-${log.type.toLowerCase()}">${log.type}</span><b>${escapeHTML(log.message)}</b></div>`).join('') || '<div class="ops-empty-inline">部署操作会显示在这里。</div>'}</div>
          </div>
        </div>`;
    }

    function sitesTemplate() {
      return `
        ${viewHead('网站', `${state.sites.length} 个站点 · SSL 自动续期已开启`, '<button class="ops-primary small" data-ops-action="new-site"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>添加站点</button>')}
        <div class="ops-site-summary">
          <div><span>今日请求</span><b>48,271</b><small>+12.4%</small></div>
          <div><span>带宽使用</span><b>4.3 GB</b><small>峰值 18.2 MB/s</small></div>
          <div><span>SSL 证书</span><b>3 / 3</b><small>全部有效</small></div>
          <div><span>平均响应</span><b>38 ms</b><small>P95 96 ms</small></div>
        </div>
        <div class="ops-site-list">
          ${state.sites.map((site) => `
            <div class="ops-site-row">
              <div class="ops-site-main">
                <span class="ops-site-icon"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg></span>
                <div><b>${escapeHTML(site.name)}</b><small>${escapeHTML(site.runtime)} · ${escapeHTML(site.root)}</small></div>
              </div>
              <div class="ops-site-meta"><span>端口 ${site.port}</span><span class="ops-ssl-pill"><svg viewBox="0 0 24 24"><use href="#i-lock"></use></svg>SSL</span><span>${site.traffic}</span></div>
              <div class="ops-site-actions"><button data-ops-action="check-site" data-id="${site.id}">检查</button><button data-ops-action="manage-site" data-id="${site.id}"><svg viewBox="0 0 24 24"><use href="#i-sliders"></use></svg></button></div>
            </div>`).join('')}
        </div>
        <div class="ops-wide-note"><span><svg viewBox="0 0 24 24"><use href="#i-info"></use></svg></span><p>站点均由本地 Nginx 配置生成。点击站点右侧的检查按钮，会模拟一次 200 响应与证书验证。</p></div>`;
    }

    function containersTemplate() {
      return `
        ${viewHead('容器', `Docker 27.3.1 · ${state.containers.filter((container) => container.status === 'running').length} 个正在运行`, '<button class="ops-primary small" data-ops-action="new-container"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>新建容器</button>')}
        <div class="ops-container-toolbar">
          <div class="ops-chip-row"><button class="is-active">全部 ${state.containers.length}</button><button>运行中 ${state.containers.filter((container) => container.status === 'running').length}</button><button>已停止 ${state.containers.filter((container) => container.status === 'stopped').length}</button></div>
          <span class="ops-toolbar-hint">终端：<code>docker run nginx</code></span>
        </div>
        <div class="ops-container-list">
          ${state.containers.length ? state.containers.map((container) => `
            <div class="ops-container-row is-${container.status}">
              <span class="ops-container-cube"><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg></span>
              <div class="ops-container-identity"><b>${escapeHTML(container.name)}</b><small>${escapeHTML(container.image)}</small></div>
              <span class="ops-container-ports">${escapeHTML(container.ports || '—')}</span>
              <div class="ops-container-usage"><span>CPU <b>${escapeHTML(container.cpu)}</b></span><span>内存 <b>${escapeHTML(container.memory)}</b></span></div>
              <span class="ops-container-state"><i class="${container.status === 'running' ? 'is-online' : ''}"></i>${container.status === 'running' ? `运行 ${container.uptime}` : '已停止'}</span>
              <div class="ops-container-actions">
                <button data-ops-action="${container.status === 'running' ? 'stop-container' : 'start-container'}" data-id="${container.id}" title="${container.status === 'running' ? '停止容器' : '启动容器'}"><svg viewBox="0 0 24 24"><use href="#${container.status === 'running' ? 'i-pause' : 'i-play'}"></use></svg></button>
                <button data-ops-action="remove-container" data-id="${container.id}" title="删除容器"><svg viewBox="0 0 24 24"><use href="#i-trash"></use></svg></button>
              </div>
            </div>`).join('') : `<div class="ops-empty"><span><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg></span><h2>还没有容器。</h2><p>在终端运行 <code>docker run nginx</code>，或点击“新建容器”。</p></div>`}
        </div>
        <div class="ops-container-foot"><span>镜像缓存 ${state.images.length} 个</span><button data-ops-action="open-terminal">打开终端</button><button data-ops-action="refresh">刷新状态</button></div>`;
    }

    function databasesTemplate() {
      return `
        ${viewHead('数据库', '本地面板 · 2 个服务在线', '<button class="ops-secondary" data-ops-action="backup-db"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>备份全部</button>')}
        <div class="ops-db-grid">
          <div class="ops-db-card is-running"><div class="ops-db-head"><span class="ops-db-icon mysql">MY</span><div><b>MySQL</b><small>8.4.3 · 端口 3306</small></div><span class="ops-live-pill"><i></i>运行中</span></div><div class="ops-db-metrics"><div><span>数据库</span><b>4</b></div><div><span>表</span><b>38</b></div><div><span>大小</span><b>1.8 GB</b></div></div><div class="ops-db-bar"><i style="width:54%"></i></div><div class="ops-db-foot"><span>最后备份：今天 02:00</span><button data-ops-action="backup-db">立即备份</button></div></div>
          <div class="ops-db-card is-running"><div class="ops-db-head"><span class="ops-db-icon redis">RD</span><div><b>Redis</b><small>7.2.5 · 端口 6379</small></div><span class="ops-live-pill"><i></i>运行中</span></div><div class="ops-db-metrics"><div><span>键</span><b>12,842</b></div><div><span>命中率</span><b>98.4%</b></div><div><span>内存</span><b>84 MB</b></div></div><div class="ops-db-bar"><i style="width:22%"></i></div><div class="ops-db-foot"><span>最大内存：512 MB</span><button data-ops-action="flush-cache">清理缓存</button></div></div>
          <div class="ops-db-card"><div class="ops-db-head"><span class="ops-db-icon pg">PG</span><div><b>PostgreSQL</b><small>17 · 未启动</small></div><span class="ops-db-state">已停止</span></div><div class="ops-db-metrics"><div><span>数据库</span><b>—</b></div><div><span>连接</span><b>0</b></div><div><span>大小</span><b>—</b></div></div><div class="ops-db-bar"><i style="width:0%"></i></div><div class="ops-db-foot"><span>按需启动，节省内存</span><button data-ops-action="start-postgres">启动</button></div></div>
        </div>
        <div class="ops-wide-note"><span><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg></span><p>数据库连接仅在本机可用。账号密码不会显示，也不会发送到 Meridian-01 之外。</p></div>`;
    }

    function filesTemplate() {
      return `
        ${viewHead('文件', '/www/wwwroot · 本地演示卷')}
        <div class="ops-file-browser">
          <div class="ops-file-toolbar"><div class="ops-file-path"><button data-ops-action="files-up">…</button><span>/</span><b>/www/wwwroot</b></div><div class="ops-file-actions"><button data-ops-action="files-upload"><svg viewBox="0 0 24 24"><use href="#i-arrow-up"></use></svg>上传</button><button data-ops-action="open-terminal"><svg viewBox="0 0 24 24"><use href="#app-terminal"></use></svg>终端</button></div></div>
          <div class="ops-file-table">
            <div class="ops-file-row is-head"><span>名称</span><span>大小</span><span>权限</span><span>修改时间</span></div>
            ${[
              ['aperture.design', '文件夹', 'drwxr-xr-x', '今天 18:24', 'folder'],
              ['meridian.observer', '文件夹', 'drwxr-xr-x', '今天 16:08', 'folder'],
              ['voidsignal.space', '文件夹', 'drwxr-xr-x', '今天 14:42', 'folder'],
              ['backup', '文件夹', 'drwx------', '今天 02:00', 'folder'],
              ['panel-backup.tar.gz', '42.8 MB', '-rw-r--r--', '昨天 02:00', 'archive'],
              ['.user.ini', '4 KB', '-rw-r--r--', '10月 28日', 'file'],
              ['nginx-error.log', '1.2 MB', '-rw-r--r--', '现在', 'file']
            ].map(([name, size, permission, time, type]) => `<div class="ops-file-row"><span class="ops-file-name"><svg viewBox="0 0 24 24"><use href="#${type === 'folder' ? 'i-folder' : type === 'archive' ? 'i-archive' : 'i-file'}"></use></svg><b>${escapeHTML(name)}</b></span><span>${escapeHTML(size)}</span><span><code>${permission}</code></span><span>${time}</span></div>`).join('')}
          </div>
          <div class="ops-file-foot"><span>7 个项目 · 卷使用 38%</span><span>SFTP 已启用 · 仅本机</span></div>
        </div>`;
    }

    function logsTemplate() {
      const lines = [
        ['21:42:08', 'INFO', 'panel', 'GET /api/overview 200 4ms'],
        ['21:41:55', 'INFO', 'edge', 'upstream baota_panel:8888 healthy'],
        ['21:41:32', 'OK', 'docker', 'container aisniper_edge started'],
        ['21:41:12', 'OK', 'docker', 'container baota_panel started'],
        ['21:40:58', 'WARN', 'auth', 'operator session opened from localhost'],
        ['21:40:44', 'INFO', 'mysql', 'ready for connections · port 3306'],
        ['21:40:31', 'OK', 'panel', 'bootstrap completed · 3 services online'],
        ['21:40:12', 'INFO', 'system', 'Meridian-01 linked to AISniper Cloud'],
        ['21:39:58', 'INFO', 'edge', 'TLS certificate loaded · panel.aisniper.local']
      ];
      return `
        ${viewHead('日志', '实时审计与容器输出', '<button class="ops-secondary" data-ops-action="clear-logs"><svg viewBox="0 0 24 24"><use href="#i-trash"></use></svg>清空</button>')}
        <div class="ops-log-viewer">
          <div class="ops-log-toolbar"><div><button class="is-active">全部</button><button>面板</button><button>Docker</button><button>错误</button></div><span class="ops-live-pill"><i></i>跟随</span></div>
          <div class="ops-log-lines">${state.logsCleared ? '<div class="ops-log-empty">回滚缓冲区已清空。新的操作会继续写入本地审计。</div>' : lines.map(([time, type, service, message]) => `<div><span>${time}</span><b class="ops-log-${type.toLowerCase()}">${type}</b><i>${service}</i><code>${escapeHTML(message)}</code></div>`).join('')}</div>
          <div class="ops-log-tail"><span>— 日志结束 —</span><span>本地审计 · 保留 24 小时</span></div>
        </div>`;
    }

    function securityTemplate() {
      return `
        ${viewHead('安全', '防火墙、SSH 与入侵防护', '<button class="ops-primary small" data-ops-action="security-scan"><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg>安全扫描</button>')}
        <div class="ops-security-grid">
          <div class="ops-security-hero">
            <div class="ops-security-ring"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="56" class="track"></circle><circle cx="70" cy="70" r="56" class="value"></circle></svg><span><b>92</b><small>安全评分</small></span></div>
            <div><span class="ops-eyebrow"><i></i>LAST SCAN · 18 分钟前</span><h2>没有发现高危风险。</h2><p>防火墙规则、SSH 密钥与面板 SSL 均已生效。建议继续保持自动更新。</p><div class="ops-security-pills"><span>面板 SSL</span><span>Fail2ban</span><span>SSH 密钥</span></div></div>
          </div>
          <div class="ops-security-list">
            <div><span class="ops-security-icon"><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg></span><div><b>防火墙</b><small>${state.firewall ? '已启用 · 24 条规则' : '已停用'}</small></div><button class="ops-switch ${state.firewall ? 'is-on' : ''}" data-ops-action="toggle-firewall" aria-label="切换防火墙"><i></i></button></div>
            <div><span class="ops-security-icon"><svg viewBox="0 0 24 24"><use href="#i-lock"></use></svg></span><div><b>SSH 访问</b><small>端口 22 · 仅密钥登录</small></div><span class="ops-security-state">受保护</span></div>
            <div><span class="ops-security-icon"><svg viewBox="0 0 24 24"><use href="#i-eye"></use></svg></span><div><b>Fail2ban</b><small>3 个 IP 已拦截 · 12 次尝试</small></div><span class="ops-security-state">运行中</span></div>
            <div><span class="ops-security-icon"><svg viewBox="0 0 24 24"><use href="#i-globe"></use></svg></span><div><b>面板 SSL</b><small>Let’s Encrypt · 83 天后到期</small></div><span class="ops-security-state">已启用</span></div>
          </div>
        </div>
        <div class="ops-wide-note"><span><svg viewBox="0 0 24 24"><use href="#i-info"></use></svg></span><p>安全扫描结果来自本机节点。真实服务器仍需独立的安全审计与备份策略。</p></div>`;
    }

    function deployBaota(options = {}) {
      const already = state.deployed;
      if (!state.deployed) {
        state.deployed = true;
        state.startedAt = Date.now();
        state.containers = initialContainers();
        pushLog('OK', 'baota panel deployed');
        pushLog('OK', 'container baota_panel started');
        pushLog('OK', 'container aisniper_edge started');
        pushLog('OK', 'container aisniper_mysql started');
        pushLog('INFO', 'panel session opened by sniper');
      }
      if (options.open) {
        host.openApp?.('ops');
        setTimeout(render, 120);
      } else if ($('#window-ops')?.classList.contains('is-open')) {
        render();
      } else {
        syncChrome();
      }
      return {
        deployed: true,
        already,
        url: PANEL_URL,
        user: PANEL_USER,
        password: PANEL_PASSWORD,
        containers: state.containers.length,
        view: state.view
      };
    }

    function ensureEnvironment() {
      if (!state.deployed) deployBaota({ open: false });
      return state.deployed;
    }

    function portForContainer(index) {
      return `0.0.0.0:${8080 + index}->80`;
    }

    function normalizePort(port, index) {
      if (!port) return portForContainer(index);
      if (port.includes('->')) return `0.0.0.0:${port}`;
      if (port.includes(':')) {
        const [hostPort, containerPort] = port.split(':');
        return `0.0.0.0:${hostPort}->${containerPort || '80'}`;
      }
      if (/^\d+$/.test(port)) return `0.0.0.0:${port}->80`;
      return port;
    }

    function runContainer(image = 'nginx:latest', options = {}) {
      ensureEnvironment();
      const normalized = String(image || 'nginx:latest').trim() || 'nginx:latest';
      const imageName = normalized.includes(':') ? normalized : `${normalized}:latest`;
      const base = normalized.split('/').pop().split(':')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'container';
      state.containerSeq += 1;
      const container = {
        id: randomId(),
        name: `${base}_${state.containerSeq}`,
        image: imageName,
        status: 'running',
        ports: normalizePort(options.port, state.containerSeq),
        cpu: '0.4%',
        memory: '32 MB',
        uptime: '刚刚',
        role: '自定义'
      };
      state.containers.push(container);
      pushLog('OK', `container ${container.name} started`);
      if (state.view === 'containers' && $('#window-ops')?.classList.contains('is-open')) render();
      else syncChrome();
      if (!options.fromTerminal) {
        host.showToast?.({ title: '容器已启动', message: `${container.name} · ${container.image}`, icon: 'i-box' });
      }
      return container;
    }

    function findContainer(target) {
      if (!target) return null;
      return state.containers.find((container) => container.id === target || container.name === target) || null;
    }

    function stopContainer(target) {
      const container = findContainer(target);
      if (!container) return null;
      container.status = 'stopped';
      container.uptime = '—';
      pushLog('WARN', `container ${container.name} stopped`);
      render();
      host.showToast?.({ title: '容器已停止', message: `${container.name} 已安全停止。`, icon: 'i-pause' });
      return container;
    }

    function startContainer(target) {
      const container = findContainer(target);
      if (!container) return null;
      container.status = 'running';
      container.uptime = '刚刚';
      container.cpu = '0.3%';
      pushLog('OK', `container ${container.name} started`);
      render();
      host.showToast?.({ title: '容器已启动', message: `${container.name} 已重新加入运行队列。`, icon: 'i-play' });
      return container;
    }

    function removeContainer(target) {
      const container = findContainer(target);
      if (!container) return null;
      state.containers = state.containers.filter((entry) => entry.id !== container.id);
      pushLog('WARN', `container ${container.name} removed`);
      render();
      host.showToast?.({ title: '容器已删除', message: `${container.name} 已从本机移除。`, icon: 'i-trash' });
      return container;
    }

    function addSite() {
      const index = state.sites.length + 1;
      state.sites.push({
        id: `site-demo-${Date.now()}`,
        name: `demo-${index}.aisniper.local`,
        runtime: '静态 / Nginx',
        root: `/www/wwwroot/demo-${index}`,
        port: '80',
        ssl: false,
        status: 'running',
        traffic: '12 MB'
      });
      pushLog('INFO', `site demo-${index}.aisniper.local created`);
      render();
      host.showToast?.({ title: '站点已创建', message: `demo-${index}.aisniper.local · 本地目录已生成。`, icon: 'i-globe' });
    }

    function securityScan() {
      pushLog('INFO', 'security scan completed · no critical findings');
      host.showToast?.({ title: '安全扫描完成', message: '未发现高危风险。3 项建议已自动处理。', icon: 'i-shield' });
      render();
    }

    function handleAction(action, target) {
      const id = target?.dataset.id;
      if (action === 'deploy') {
        deployBaota({ open: false });
        host.showToast?.({ title: '宝塔面板已部署', message: 'Meridian-01 已上线，3 个容器正在运行。', icon: 'app-ops' });
        render();
        return;
      }
      if (action === 'open-terminal') { host.openTerminal?.(); return; }
      if (action === 'deploy-terminal') { host.openTerminal?.('deploy baota'); return; }
      if (action === 'refresh') {
        render();
        host.showToast?.({ title: '面板已刷新', message: '主机遥测与容器状态已更新。', icon: 'i-reload' });
        return;
      }
      if (action === 'new-container') {
        runContainer('nginx:stable', { fromTerminal: false });
        return;
      }
      if (action === 'stop-container') { stopContainer(id); return; }
      if (action === 'start-container') { startContainer(id); return; }
      if (action === 'remove-container') { removeContainer(id); return; }
      if (action === 'new-site') { addSite(); return; }
      if (action === 'check-site') {
        const site = state.sites.find((entry) => entry.id === id);
        if (!site) return;
        host.showToast?.({ title: `${site.name} · 200 OK`, message: 'TLS 有效 · 本地响应 18 ms。', icon: 'i-globe' });
        pushLog('INFO', `GET https://${site.name} 200 18ms`);
        return;
      }
      if (action === 'manage-site') {
        host.showToast?.({ title: '站点管理', message: '站点配置已在本机加载，修改会写入演示卷。', icon: 'i-sliders' });
        return;
      }
      if (action === 'backup-db') {
        host.showToast?.({ title: '备份完成', message: 'MySQL 与 Redis 快照已写入 /www/backup。', icon: 'i-download' });
        pushLog('OK', 'database snapshot written to /www/backup');
        return;
      }
      if (action === 'flush-cache') {
        host.showToast?.({ title: '缓存已清理', message: 'Redis 演示缓存已重置。', icon: 'i-bolt' });
        pushLog('INFO', 'redis cache flushed');
        return;
      }
      if (action === 'start-postgres') {
        host.showToast?.({ title: 'PostgreSQL 已启动', message: '端口 5432 已在 Meridian-01 上开放。', icon: 'i-server' });
        return;
      }
      if (action === 'toggle-firewall') {
        state.firewall = !state.firewall;
        pushLog(state.firewall ? 'OK' : 'WARN', `firewall ${state.firewall ? 'enabled' : 'disabled'}`);
        render();
        host.showToast?.({ title: state.firewall ? '防火墙已启用' : '防火墙已停用', message: state.firewall ? '24 条规则正在保护 Meridian-01。' : '演示环境已暂时关闭防火墙。', icon: 'i-shield' });
        return;
      }
      if (action === 'security-scan') { securityScan(); return; }
      if (action === 'files-upload') {
        host.showToast?.({ title: '上传已模拟', message: '本地演示卷不会接收真实文件。', icon: 'i-arrow-up' });
        return;
      }
      if (action === 'files-up') {
        host.showToast?.({ title: '/www/wwwroot', message: '已位于网站根目录。', icon: 'i-folder' });
        return;
      }
      if (action === 'logs') { swapView('logs'); return; }
      if (action === 'clear-logs') {
        state.logsCleared = true;
        render();
        host.showToast?.({ title: '日志已清空', message: '本地回滚缓冲区已重置。', icon: 'i-trash' });
        return;
      }
      if (action === 'open-browser') {
        host.openBrowser?.('https://example.com');
      }
    }

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ops-view]');
      if (!button) return;
      swapView(button.dataset.opsView);
    });
    content.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-ops-action]');
      if (!trigger) return;
      event.preventDefault();
      handleAction(trigger.dataset.opsAction, trigger);
    });
    $('#opsRefreshBtn')?.addEventListener('click', () => {
      render();
      host.showToast?.({ title: '面板已刷新', message: '节点遥测已同步。', icon: 'i-reload' });
    });
    $('#opsTerminalBtn')?.addEventListener('click', () => host.openTerminal?.());
    $('#opsTopSettingsBtn')?.addEventListener('click', () => {
      host.showToast?.({ title: '面板设置', message: '当前面板绑定 0.0.0.0:8888，仅限本机演示。', icon: 'i-sliders' });
    });

    render();

    return {
      open(options = {}) {
        if (options.view && views.includes(options.view)) state.view = options.view;
        render();
        if (state.deployed && options.view === 'containers') {
          setTimeout(() => content.classList.remove('is-swapping'), 160);
        }
      },
      showView(view) {
        if (views.includes(view)) swapView(view);
      },
      deployBaota,
      ensureEnvironment,
      runContainer,
      stopContainer,
      startContainer,
      removeContainer,
      refresh() {
        render();
      },
      getImages() {
        return state.images.map((image) => ({ ...image }));
      },
      getState() {
        return {
          deployed: state.deployed,
          view: state.view,
          containers: state.containers.map((container) => ({ ...container })),
          sites: state.sites.map((site) => ({ ...site })),
          firewall: state.firewall,
          startedAt: state.startedAt
        };
      }
    };
  }

  window.AISniperOps = { init };
})();
