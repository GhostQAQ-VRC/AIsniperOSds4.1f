/* ==========================================================================
   AISniperOS — SENTRY local agent
   A deterministic, fully local task assistant. No network calls.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const pad = (value) => String(value).padStart(2, '0');
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function init(host = {}) {
    const form = $('#agentForm');
    const input = $('#agentInput');
    const conversation = $('#agentConversation');
    const welcome = $('#agentWelcome');
    if (!form || !input || !conversation) return null;

    let busy = false;
    let lastReply = '';
    let replyTimer = null;
    let activeHistory = 0;

    const nowLabel = () => {
      const now = new Date();
      return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const scrollToBottom = () => {
      conversation.scrollTop = conversation.scrollHeight;
    };

    function setBusy(value) {
      busy = value;
      const send = $('#agentSendBtn');
      if (send) {
        send.disabled = value;
        send.classList.toggle('is-busy', value);
      }
    }

    function autoSizeInput() {
      input.style.height = 'auto';
      input.style.height = `${Math.min(126, Math.max(24, input.scrollHeight))}px`;
    }

    function hideWelcome() {
      if (welcome) welcome.hidden = true;
    }

    function showWelcome() {
      if (welcome) welcome.hidden = false;
    }

    function appendMessage(role, content, options = {}) {
      const row = document.createElement('div');
      row.className = `agent-message is-${role}`;
      const avatar = document.createElement('span');
      avatar.className = 'agent-message-avatar';
      if (role === 'agent') {
        avatar.innerHTML = '<svg viewBox="0 0 64 64"><use href="#app-agent"></use></svg>';
      } else {
        avatar.textContent = 'S';
      }
      const body = document.createElement('div');
      body.className = 'agent-message-body';
      const bubble = document.createElement('div');
      bubble.className = 'agent-message-bubble';
      if (role === 'user') {
        bubble.textContent = content;
      } else {
        bubble.innerHTML = content;
      }
      body.appendChild(bubble);
      if (Array.isArray(options.tools) && options.tools.length) {
        const tools = document.createElement('div');
        tools.className = 'agent-tool-tags';
        options.tools.forEach((tool) => {
          const tag = document.createElement('span');
          tag.innerHTML = `<svg viewBox="0 0 24 24"><use href="#i-bolt"></use></svg><b></b>`;
          $('b', tag).textContent = tool;
          tools.appendChild(tag);
        });
        body.appendChild(tools);
      }
      const meta = document.createElement('div');
      meta.className = 'agent-message-meta';
      meta.textContent = `${role === 'agent' ? 'SENTRY' : 'Sniper'} · ${nowLabel()}`;
      body.appendChild(meta);
      row.append(avatar, body);
      conversation.appendChild(row);
      if (role === 'agent') lastReply = options.plain || bubble.textContent.trim();
      scrollToBottom();
      return row;
    }

    function addTyping() {
      const row = document.createElement('div');
      row.className = 'agent-message is-agent is-typing-message';
      row.dataset.typing = 'true';
      row.innerHTML = `
        <span class="agent-message-avatar"><svg viewBox="0 0 64 64"><use href="#app-agent"></use></svg></span>
        <div class="agent-message-body">
          <div class="agent-message-bubble agent-typing"><span></span><span></span><span></span><small>正在推理</small></div>
        </div>`;
      conversation.appendChild(row);
      scrollToBottom();
      return row;
    }

    function removeTyping() {
      $$('.is-typing-message', conversation).forEach((row) => row.remove());
    }

    function statusCard() {
      const status = host.getStatus?.() || {};
      const health = status.health || {};
      const network = '以太网 · 1000 Mbps';
      return `
        <div class="agent-status-card">
          <div class="agent-status-head">
            <span class="agent-status-pulse"><i></i>AISniper 核心</span>
            <b>${health.score || 98}<small>健康</small></b>
          </div>
          <div class="agent-status-grid">
            <div><span>CPU</span><b>${health.cpu ?? 18}%</b><i><em style="width:${health.cpu ?? 18}%"></em></i></div>
            <div><span>内存</span><b>${health.memory ?? 42}%</b><i><em style="width:${health.memory ?? 42}%"></em></i></div>
            <div><span>GPU</span><b>${health.gpu ?? 12}%</b><i><em style="width:${health.gpu ?? 12}%"></em></i></div>
            <div><span>温度</span><b>${health.temperature ?? 36}°C</b><i><em style="width:34%"></em></i></div>
          </div>
          <div class="agent-status-foot"><span><i></i>所有服务在线</span><span>${network}</span></div>
        </div>
        <p>系统状态稳定。CPU 与内存都留有充分余量，目前无需清理或重启。建议保持专注模式，继续当前任务。</p>`;
    }

    function responseFor(text) {
      const query = text.toLowerCase();
      const status = host.getStatus?.() || {};
      const has = (...words) => words.some((word) => query.includes(word));

      if (has('部署', '宝塔', 'baota', '服务器', '面板')) {
        const result = host.deployOps?.();
        const already = Boolean(status.ops?.deployed);
        return {
          html: already
            ? `<p>宝塔面板已经在运行。我已经为你切换到运维台，你可以直接查看概览或容器状态。</p><div class="agent-action-card"><span class="agent-action-icon"><svg viewBox="0 0 24 24"><use href="#i-server"></use></svg></span><div><b>Meridian-01</b><span>宝塔面板 · 在线</span><small>panel.aisniper.local:8888</small></div><i>运行中</i></div>`
            : `<p>部署完成。我已在 <b>Meridian-01</b> 上启动宝塔面板，并创建了边缘代理与数据库容器。面板正在运维台中打开。</p>
              <div class="agent-plan">
                <div class="is-done"><span>01</span><b>拉取镜像</b><small>aapanel/baota:9.2.0</small></div>
                <div class="is-done"><span>02</span><b>创建容器</b><small>端口映射 8888</small></div>
                <div class="is-done"><span>03</span><b>验证服务</b><small>3 项检查通过</small></div>
              </div>
              <div class="agent-action-card"><span class="agent-action-icon"><svg viewBox="0 0 24 24"><use href="#i-lock"></use></svg></span><div><b>panel.aisniper.local:8888</b><span>账户 sniper</span><small>密码 Sniper@2026</small></div><i>已上线</i></div>`,
          tools: ['写入本地服务状态', already ? '打开运维台' : '创建 3 个容器', '验证端口映射'],
          plain: already ? '宝塔面板已经在运行，运维台已打开。' : '宝塔面板已部署，Meridian-01 已上线，运维台正在打开。',
          after: () => {
            host.openOps?.('overview');
            if (!already) host.showToast?.({ title: 'SENTRY 已完成部署', message: '宝塔面板与基础容器已启动。', icon: 'app-agent' });
          }
        };
      }

      if (has('容器', 'docker')) {
        const containers = status.ops?.containers || [];
        host.openOps?.('containers');
        return {
          html: `<p>${status.ops?.deployed ? `当前有 <b>${containers.filter((c) => c.status === 'running').length}</b> 个容器正在运行。我已打开容器管理视图，你可以在其中启动、停止或删除容器。` : '当前还没有启动 Docker 演示环境。我可以先部署宝塔面板，再创建一个 Nginx 容器。'}</p>${containers.length ? `<div class="agent-container-list">${containers.slice(0, 3).map((c) => `<div><i class="${c.status === 'running' ? 'is-online' : ''}"></i><b>${escapeHTML(c.name)}</b><span>${escapeHTML(c.image)}</span><small>${escapeHTML(c.ports)}</small></div>`).join('')}</div>` : '<div class="agent-task-hint">试试在终端输入 <code>docker run nginx</code>。</div>'}`,
          tools: ['打开容器管理', '读取容器状态'],
          plain: '我已打开容器管理视图。'
        };
      }

      if (has('系统', '健康', '状态', '巡检', 'cpu', '内存', '性能')) {
        return {
          html: statusCard(),
          tools: ['读取系统遥测', '检查温度与内存'],
          plain: '系统状态稳定：CPU、内存和温度都在正常范围，所有服务在线。'
        };
      }

      if (has('网络', '网速', '以太网', 'wifi', 'wi-fi')) {
        return {
          html: `<p>当前主连接是<b>有线网络</b>：以太网 1000 Mbps，IP 192.168.1.24，路由器为子午线网关，延迟 0.8 ms。${status.wifi ? `Wi-Fi 作为可选的无线链路已连接到 ${escapeHTML(status.wifiNetwork || 'AISniper-5G')}，但不会抢占有线优先级。` : 'Wi-Fi 当前关闭，不影响任何网络服务。'}</p><div class="agent-network-strip"><span><i></i>以太网</span><b>1000 Mbps</b><small>DHCP · 全双工</small></div>`,
          tools: ['读取网络接口', '验证有线链路'],
          plain: '有线网络工作正常，以太网 1000 Mbps，延迟 0.8 ms。'
        };
      }

      if (has('浏览器', '网页', '上网', '搜索')) {
        return {
          html: '<p>已为你打开 AISniper 浏览器。地址栏可以搜索网页或直接输入网址；如果网站拒绝内嵌，工具条右上角可以把它交给系统浏览器。</p>',
          tools: ['打开浏览器'],
          plain: '已打开浏览器。',
          after: () => host.openApp?.('browser')
        };
      }

      if (has('信息', '消息', '聊天', 'mira')) {
        const unread = status.messages?.unread || 0;
        return {
          html: `<p>已打开信息。${unread ? `当前有 <b>${unread}</b> 条未读信息，最上面是 Mira 和 VOID SIGNAL 小队。` : '所有对话都已读。'}</p>`,
          tools: ['打开信息', unread ? '读取未读计数' : '检查对话'],
          plain: '已打开信息。',
          after: () => host.openApp?.('messages')
        };
      }

      if (has('steam', '蒸汽平台', 'cs2', '反恐精英', 'vrchat', 'steamvr', 'ovr', 'slimevr', '史莱姆')) {
        let app = 'steam';
        let label = 'Steam 商店与游戏库';
        let message = '<p>已完成 Steam 本地登录。商店、游戏库、VR 中心、社区和下载管理器都在左侧导航中。</p>';
        if (has('cs2', '反恐精英')) { app = 'cs2'; label = 'Counter-Strike 2 演示比赛'; message = '<p>正在启动 <b>Counter-Strike 2</b>。进入比赛后点击画面锁定鼠标，WASD 移动，左键射击，R 装填。</p>'; }
        else if (has('vrchat', 'vr 聊天')) { app = 'vrchat'; label = 'VRChat · Midnight Lounge'; message = '<p>正在进入 <b>VRChat</b> 的 Midnight Lounge。用 WASD 走动，靠近其他玩家后按 E 交谈。</p>'; }
        else if (has('steamvr')) { app = 'steamvr'; label = 'SteamVR 运行时'; message = '<p>正在启动 <b>SteamVR</b>。头显、基站与控制器状态将在窗口中同步。</p>'; }
        else if (has('ovr')) { app = 'ovrtk'; label = 'OVR Toolkit'; message = '<p>正在打开 <b>OVR Toolkit</b> 叠加层配置。</p>'; }
        else if (has('slime', '史莱姆')) { app = 'slimevr'; label = 'SlimeVR 全身追踪'; message = '<p>正在打开 <b>SlimeVR</b>。可以检测追踪器并启动校准。</p>'; }
        return {
          html: `${message}<div class="agent-action-card"><span class="agent-action-icon"><svg viewBox="0 0 24 24"><use href="#app-steam"></use></svg></span><div><b>${escapeHTML(label)}</b><span>Sniper · 在线</span><small>本机 Steam 客户端</small></div><i>就绪</i></div>`,
          tools: ['打开 Steam 界面', '读取本地游戏库'],
          plain: `正在打开 ${label}。`,
          after: () => host.openApp?.(app)
        };
      }

      if (has('深空', '游戏', '轨道', 'strike')) {
        return {
          html: '<p>正在启动《深空信号》。建议先用鼠标把准星移到敌机前方，再按住左键发射脉冲。温度低，舰体状态良好。</p>',
          tools: ['启动轨道模拟器'],
          plain: '正在启动深空信号。',
          after: () => host.openApp?.('game')
        };
      }

      if (has('下载', '整理', '归档', '文件夹')) {
        return {
          html: '<p>已打开下载文件夹。我建议先把两个 ZIP 与磁盘映像归入「安装包」，再把图片素材移动到「项目 / 截图」。</p><div class="agent-file-plan"><div><span class="agent-file-icon"><svg viewBox="0 0 24 24"><use href="#i-archive"></use></svg></span><b>AISniper-墙纸包.zip</b><small>→ 安装包</small></div><div><span class="agent-file-icon"><svg viewBox="0 0 24 24"><use href="#i-archive"></use></svg></span><b>Aperture-字体.zip</b><small>→ 安装包</small></div><div><span class="agent-file-icon"><svg viewBox="0 0 24 24"><use href="#i-image"></use></svg></span><b>山脊站.png</b><small>→ 项目 / 截图</small></div></div><p class="agent-muted">拖拽文件到文件夹即可完成移动；压缩包双击会打开解压界面。</p>',
          tools: ['打开下载文件夹', '分析文件类型'],
          plain: '已打开下载文件夹，并给出归档建议。',
          after: () => host.openFinder?.('downloads')
        };
      }

      if (has('主题', '浅色', '深色', '外观')) {
        const mode = has('浅色') ? 'light' : 'dark';
        host.setAppearance?.(mode);
        return {
          html: `<p>已切换为<b>${mode === 'light' ? '浅色' : '深色'}外观</b>。强调色、墙纸与玻璃材质都已同步更新。</p>`,
          tools: ['调整系统外观'],
          plain: `已切换为${mode === 'light' ? '浅色' : '深色'}外观。`
        };
      }

      if (has('设置', '偏好')) {
        return {
          html: '<p>已打开系统设置。你可以在「用户与账户」里开启自动登录，在「网络」中确认有线连接，或在「专注模式」里延长静默时间。</p>',
          tools: ['打开系统设置'],
          plain: '已打开系统设置。',
          after: () => host.openSettings?.()
        };
      }

      if (has('时间', '几点', '日期')) {
        return {
          html: `<p>现在是 <b>${escapeHTML(status.time || nowLabel())}</b>。系统时间已与 AISniper 时间服务同步，时区为亚洲 / 上海。</p>`,
          tools: ['读取系统时钟'],
          plain: `现在是 ${status.time || nowLabel()}。`
        };
      }

      if (has('天气')) {
        return {
          html: '<p>山脊观测站：晴空万里，体感 1°C，西北风 12 km/h。太阳落山后山脊会保留大约十一分钟的颜色，适合拍摄蓝调时刻。</p>',
          tools: ['读取山脊观测站'],
          plain: '晴空万里，体感 1°C。'
        };
      }

      if (has('你能', '能做什么', '帮助', '功能')) {
        return {
          html: '<p>我可以检查系统遥测、部署宝塔面板、管理模拟容器、打开应用、切换外观，也能帮你梳理 Finder 中的文件。</p><div class="agent-skill-row"><span>系统巡检</span><span>本地部署</span><span>容器管理</span><span>应用启动</span><span>文件建议</span></div>',
          tools: ['列出本地能力'],
          plain: '我可以检查系统、部署宝塔面板、管理容器、打开应用，并给出文件整理建议。'
        };
      }

      if (has('你是谁', '介绍', '名字', 'sentry')) {
        return {
          html: '<p>我是 <b>SENTRY</b>，AISniperOS 的本地神经任务代理。我在这台设备上运行，不会把你的会话发送到外部服务器。</p>',
          tools: ['本地身份校验'],
          plain: '我是 SENTRY，本地神经任务代理。'
        };
      }

      if (has('谢谢', '感谢', '辛苦')) {
        return { html: '<p>不客气。信号还在，我也在。</p>', plain: '不客气。' };
      }

      if (has('你好', '嗨', 'hello', 'hi', '在吗')) {
        return {
          html: '<p>在。今天想先检查系统状态，还是部署一套演示服务器？</p><div class="agent-skill-row"><span>检查系统</span><span>部署宝塔</span><span>打开深空信号</span></div>',
          tools: ['SENTRY 在线'],
          plain: '在。今天想先检查系统状态，还是部署一套演示服务器？'
        };
      }

      if (has('再见', '拜拜', '晚安')) {
        return { html: '<p>晚安。所有会话都留在本机，山脊会替你保持安静。</p>', plain: '晚安。' };
      }

      const suggestions = ['检查系统状态', '部署宝塔面板', '查看容器', '整理下载文件夹'];
      return {
        html: `<p>我理解了你的目标：“${escapeHTML(text.slice(0, 70))}”。当前本地环境没有需要立即处理的异常。你可以让我进一步执行下面这些操作。</p><div class="agent-skill-row">${suggestions.map((item) => `<button data-agent-followup="${item}">${item}</button>`).join('')}</div>`,
        tools: ['本地意图解析'],
        plain: '我理解了你的目标。需要我进一步执行系统检查、部署或文件整理吗？'
      };
    }

    function ask(text, options = {}) {
      if (busy) return;
      const prompt = String(text || '').trim();
      if (!prompt) return;
      hideWelcome();
      appendMessage('user', prompt);
      setBusy(true);
      addTyping();
      const delay = options.instant ? 280 : 720 + Math.random() * 620;
      clearTimeout(replyTimer);
      replyTimer = setTimeout(() => {
        removeTyping();
        const response = responseFor(prompt);
        appendMessage('agent', response.html, { tools: response.tools, plain: response.plain });
        setBusy(false);
        if (typeof response.after === 'function') setTimeout(response.after, 360);
        input.focus();
      }, delay);
    }

    function resetConversation(options = {}) {
      removeTyping();
      clearTimeout(replyTimer);
      setBusy(false);
      $$('.agent-message', conversation).forEach((row) => row.remove());
      if (options.keepWelcome === false) hideWelcome();
      else showWelcome();
      input.value = '';
      autoSizeInput();
      if (options.focus !== false) setTimeout(() => input.focus(), 80);
    }

    function newChat() {
      resetConversation({ focus: true });
      $$('.agent-history-item').forEach((item) => item.classList.remove('is-active'));
      const first = $('.agent-history-item');
      if (first) first.classList.add('is-active');
      activeHistory = 0;
      scrollToBottom();
      host.playTone?.('click');
    }

    function submit() {
      const value = input.value.trim();
      if (!value || busy) return;
      input.value = '';
      autoSizeInput();
      ask(value);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    });
    input.addEventListener('input', autoSizeInput);

    document.addEventListener('click', (event) => {
      const suggestion = event.target.closest('[data-agent-prompt]');
      if (suggestion) {
        ask(suggestion.dataset.agentPrompt, { instant: true });
        return;
      }
      const followup = event.target.closest('[data-agent-followup]');
      if (followup) ask(followup.dataset.agentFollowup, { instant: true });
    });

    $('#agentNewChatBtn')?.addEventListener('click', newChat);
    $('#agentNewChatSide')?.addEventListener('click', newChat);
    $('#agentAttachBtn')?.addEventListener('click', () => {
      host.showToast?.({ title: '系统上下文已附加', message: 'SENTRY 会读取健康度、网络与应用状态，数据不会离开本机。', icon: 'app-agent' });
      input.focus();
    });
    $('#agentContextBtn')?.addEventListener('click', () => {
      host.showToast?.({ title: '上下文安全', message: '会话保存在本机内存中；SENTRY-4 不发起外部网络请求。', icon: 'i-shield' });
    });
    $('#agentMoreBtn')?.addEventListener('click', () => {
      host.showToast?.({ title: 'SENTRY-4 · 本地推理', message: '8.4B 参数 · GPU 12% · 上下文 32K · 无云同步。', icon: 'app-agent' });
    });

    $$('.agent-history-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        $$('.agent-history-item').forEach((entry) => entry.classList.remove('is-active'));
        item.classList.add('is-active');
        activeHistory = index;
        resetConversation({ keepWelcome: false, focus: false });
        const historyLabel = $('span', item)?.textContent?.trim() || '历史任务';
        appendMessage('agent', `<p>已恢复任务：<b>${escapeHTML(historyLabel)}</b>。你可以继续补充要求，或直接开始新的任务。</p>`, {
          tools: ['恢复本地会话'],
          plain: '已恢复历史任务。'
        });
        input.focus();
      });
    });

    autoSizeInput();
    return {
      open() {
        setTimeout(() => {
          input.focus();
          scrollToBottom();
        }, 160);
      },
      newChat,
      copyLastReply() {
        const text = lastReply;
        if (!text) {
          host.showToast?.({ title: '没有可拷贝的内容', message: '先让 SENTRY 完成一次回复。', icon: 'app-agent' });
          return;
        }
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            host.showToast?.({ title: '已拷贝回复', message: '最近一条本地回复已复制。', icon: 'i-copy' });
          }).catch(() => host.showToast?.({ title: '无法拷贝', message: '浏览器阻止了剪贴板访问。', icon: 'i-copy' }));
        } else {
          host.showToast?.({ title: '已选中回复', message: '请使用 Ctrl/Cmd + C 复制。', icon: 'i-copy' });
        }
      },
      getState() {
        return { busy, lastReply, activeHistory };
      }
    };
  }

  window.AISniperAgent = { init };
})();
