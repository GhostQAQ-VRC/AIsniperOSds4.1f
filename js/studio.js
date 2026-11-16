/* ==========================================================================
   AISniperOS — Studio apps
   Music, cinema, text, code and local runtime manager.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let host = null;
  let initialized = false;

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* no-op */ }
  }

  function formatTime(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value < 0) return '--:--';
    const total = Math.floor(value);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(value < 10240 ? 1 : 0)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
    return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function fileExtension(name) {
    const match = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : '';
  }

  const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'webm'];
  const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg', 'mkv', 'avi'];
  const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'js', 'mjs', 'ts', 'css', 'html', 'htm', 'xml', 'svg', 'py', 'c', 'cpp', 'h', 'java', 'go', 'rs', 'php', 'rb', 'yml', 'yaml', 'sh', 'ini', 'log'];

  function isAudioFile(file) {
    const ext = fileExtension(file?.name);
    return Boolean(file) && (String(file.type || '').startsWith('audio/') || AUDIO_EXTENSIONS.includes(ext));
  }

  function isVideoFile(file) {
    const ext = fileExtension(file?.name);
    return Boolean(file) && (String(file.type || '').startsWith('video/') || VIDEO_EXTENSIONS.includes(ext));
  }

  function isTextFile(file) {
    const ext = fileExtension(file?.name);
    return Boolean(file) && (String(file.type || '').startsWith('text/') || ['json', 'js', 'mjs', 'ts', 'css', 'py', 'java', 'go', 'rs', 'php', 'rb', 'sh', 'yml', 'yaml', 'xml', 'svg'].includes(ext) || TEXT_EXTENSIONS.includes(ext));
  }

  function downloadText(name, text, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'untitled.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function markdownInline(source) {
    const code = [];
    let value = String(source || '');
    value = value.replace(/`([^`]+)`/g, (match, content) => {
      code.push(content);
      return `\u0001${code.length - 1}\u0001`;
    });
    value = value.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
      const safe = /^(https?:\/\/|mailto:|#)/i.test(href) ? href : '#';
      return `<a href="${safe.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    value = value.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    value = value.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    value = value.replace(/\u0001(\d+)\u0001/g, (match, index) => `<code>${code[Number(index)] || ''}</code>`);
    return value;
  }

  function markdownToHTML(source) {
    const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let paragraph = [];
    let listType = '';
    let inCode = false;
    let codeLang = '';
    let codeLines = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      out.push(`<p>${markdownInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!listType) return;
      out.push(`</${listType}>`);
      listType = '';
    };
    const openList = (type) => {
      if (listType === type) return;
      flushList();
      listType = type;
      out.push(`<${type}>`);
    };

    lines.forEach((rawLine) => {
      const line = rawLine;
      const fence = line.match(/^```([\w-]*)\s*$/);
      if (fence) {
        if (inCode) {
          out.push(`<pre><code class="language-${escapeHTML(codeLang)}">${escapeHTML(codeLines.join('\n'))}</code></pre>`);
          inCode = false;
          codeLang = '';
          codeLines = [];
        } else {
          flushParagraph();
          flushList();
          inCode = true;
          codeLang = fence[1] || '';
        }
        return;
      }
      if (inCode) {
        codeLines.push(line);
        return;
      }
      if (!line.trim()) {
        flushParagraph();
        flushList();
        return;
      }
      if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
        flushParagraph();
        flushList();
        out.push('<hr>');
        return;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        out.push(`<h${level}>${markdownInline(escapeHTML(heading[2]))}</h${level}>`);
        return;
      }
      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        flushParagraph();
        flushList();
        out.push(`<blockquote>${markdownInline(escapeHTML(quote[1]))}</blockquote>`);
        return;
      }
      const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
      if (unordered) {
        flushParagraph();
        openList('ul');
        out.push(`<li>${markdownInline(escapeHTML(unordered[1]))}</li>`);
        return;
      }
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        openList('ol');
        out.push(`<li>${markdownInline(escapeHTML(ordered[1]))}</li>`);
        return;
      }
      flushList();
      paragraph.push(escapeHTML(line.trim()));
    });
    if (inCode) out.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
    flushParagraph();
    flushList();
    return out.join('\n') || '<p class="md-empty">空白文档</p>';
  }

  function highlightCode(code, pathOrLanguage) {
    const ext = String(pathOrLanguage || '').includes('.') ? fileExtension(pathOrLanguage) : String(pathOrLanguage || '');
    const language = ({ js: 'js', mjs: 'js', ts: 'js', jsx: 'js', tsx: 'js', py: 'python', rb: 'python', html: 'html', htm: 'html', xml: 'html', svg: 'html', css: 'css', json: 'json', md: 'markdown', markdown: 'markdown' })[ext] || ext || 'js';
    const escape = escapeHTML;
    if (language === 'html') {
      let result = '';
      let lastIndex = 0;
      const pattern = /(<!--[\s\S]*?-->)|(<\/?[A-Za-z][^>]*>)/g;
      let match;
      while ((match = pattern.exec(code))) {
        result += escape(code.slice(lastIndex, match.index));
        if (match[1]) result += `<span class="tok-comment">${escape(match[1])}</span>`;
        else {
          const tag = match[2];
          const tagMatch = tag.match(/^(<\/?)([^\s/>]+)([\s\S]*?)(\/?>)$/);
          if (tagMatch) {
            const attrs = tagMatch[3].replace(/([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*')/g, (m, name, equals, value) => `<span class="tok-attr">${escape(name)}</span>${escape(equals)}<span class="tok-string">${escape(value)}</span>`);
            result += `<span class="tok-tag">${escape(tagMatch[1])}${escape(tagMatch[2])}</span>${attrs}<span class="tok-tag">${escape(tagMatch[4])}</span>`;
          } else result += `<span class="tok-tag">${escape(tag)}</span>`;
        }
        lastIndex = pattern.lastIndex;
      }
      result += escape(code.slice(lastIndex));
      return result;
    }
    const keywords = {
      js: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return static super switch this throw try typeof var void while with yield async await of from true false null undefined',
      python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print',
      css: 'important media supports keyframes font-face import from to',
      json: 'true false null',
      markdown: ''
    }[language] || 'const let var function return if else for while class new true false null';
    const patternParts = [];
    if (language === 'python' || language === 'markdown') patternParts.push('#[^\\n]*');
    else patternParts.push('\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*');
    patternParts.push('"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`');
    if (language === 'css') patternParts.push('@[\\w-]+|\\b[a-z-]+(?=\\s*:)');
    if (keywords) patternParts.push(`\\b(?:${keywords.split(/\s+/).join('|')})\\b`);
    patternParts.push('\\b\\d+(?:\\.\\d+)?\\b');
    patternParts.push('[A-Za-z_$][\\w$]*(?=\\s*\\()');
    const pattern = new RegExp(`(${patternParts.join('|')})`, 'g');
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(code))) {
      result += escape(code.slice(lastIndex, match.index));
      const token = match[0];
      let className = 'tok-keyword';
      if (/^(\/\/|\/\*|#)/.test(token)) className = 'tok-comment';
      else if (/^["'`]/.test(token)) className = 'tok-string';
      else if (/^\d/.test(token)) className = 'tok-number';
      else if (/^[@a-z-]+(?=\s*:)/i.test(token) && language === 'css') className = 'tok-property';
      else if (/^[A-Za-z_$][\w$]*$/.test(token) && !(keywords.split(/\s+/).includes(token))) className = 'tok-function';
      result += `<span class="${className}">${escape(token)}</span>`;
      lastIndex = pattern.lastIndex;
    }
    result += escape(code.slice(lastIndex));
    return result;
  }

  function consoleBridgeSource() {
    return `<script>(function(){
      const stringify = (value) => {
        try {
          if (typeof value === 'string') return value;
          if (value instanceof Error) return value.stack || value.message;
          return JSON.stringify(value);
        } catch (error) { return String(value); }
      };
      const send = (level, args) => parent.postMessage({ source: 'aisniper-studio', kind: 'console', level, args: args.map(stringify) }, '*');
      ['log', 'info', 'warn', 'error'].forEach((level) => {
        const original = console[level];
        console[level] = function (...args) { original.apply(console, args); send(level, args); };
      });
      window.addEventListener('error', (event) => send('error', [event.message + ' @ ' + (event.filename || 'preview') + ':' + event.lineno]));
      window.addEventListener('unhandledrejection', (event) => send('error', ['Unhandled rejection: ' + stringify(event.reason)]));
    })();<\/script>`;
  }

  function buildPreviewDocument(files, entryPath) {
    const filesSafe = files || {};
    const entry = entryPath || (filesSafe['index.html'] ? 'index.html' : Object.keys(filesSafe)[0]);
    const ext = fileExtension(entry);
    const content = filesSafe[entry] ?? '';
    const bridge = consoleBridgeSource();
    if (ext === 'py') {
      return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px/1.7 monospace;background:#071018;color:#b9e6d7;padding:24px}h1{color:#72e0be}</style>${bridge}</head><body><h1>Python 模拟运行</h1><pre>${escapeHTML(content)}</pre><p style="color:#78908b">Python 3.12.7 运行时为本地模拟；请在“运行环境”中查看进程状态。浏览器内不会执行任意 Python 代码。</p></body></html>`;
    }
    if (ext === 'json') {
      let pretty = content;
      try { pretty = JSON.stringify(JSON.parse(content), null, 2); } catch (error) { /* keep raw */ }
      return `<!doctype html><html><head><meta charset="utf-8"><style>body{font:13px/1.6 monospace;background:#071018;color:#c9e6de;padding:20px;white-space:pre}</style>${bridge}</head><body>${escapeHTML(pretty)}</body></html>`;
    }
    if (ext === 'md' || ext === 'markdown') {
      return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:34px;background:#f7f3e9;color:#29302f;font:15px/1.75 -apple-system,"Segoe UI","PingFang SC",sans-serif}h1,h2,h3{font-family:Georgia,"Songti SC",serif}pre{background:#ece6d8;padding:12px;overflow:auto}code{background:#ece6d8;padding:1px 4px;border-radius:3px}a{color:#9a542c}</style>${bridge}</head><body>${markdownToHTML(content)}</body></html>`;
    }
    if (ext === 'css') {
      const baseline = 'html{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 0%,#16323a,#071018 64%);color:#e6f2ec;font:15px/1.7 -apple-system,"Segoe UI","PingFang SC",sans-serif}.preview-shell{box-sizing:border-box;width:min(560px,calc(100% - 40px));padding:36px;border:1px solid rgba(114,224,190,.22);border-radius:18px;background:rgba(8,20,24,.68);box-shadow:0 30px 80px rgba(0,0,0,.35)}.preview-shell h1{margin:0 0 8px;font-size:42px;line-height:1;letter-spacing:-.05em}.preview-shell p{color:#9eb5ae}.preview-shell button{padding:10px 15px;border:0;border-radius:8px;color:#05231b;background:#72e0be;font:inherit;font-weight:700;cursor:pointer}.preview-card{margin-top:18px;padding:12px 14px;border-radius:9px;color:#8fe4ca;background:rgba(114,224,190,.08);border:1px solid rgba(114,224,190,.16);font:12px/1.5 monospace;letter-spacing:.08em}';
      return `<!doctype html><html><head><meta charset="utf-8">${bridge}<style>${baseline}</style><style>${content}</style></head><body><div class="preview-shell"><h1>CSS Preview</h1><p>样式已应用到当前预览页面。你可以在 index.html 中组合 HTML 与 CSS。</p><button>Button</button><div class="preview-card">AISniperOS</div></div></body></html>`;
    }
    let html = content;
    if (ext !== 'html' && ext !== 'htm') {
      if (filesSafe['index.html']) {
        html = filesSafe['index.html'];
      } else {
        const script = ext === 'js' || ext === 'mjs' || ext === 'ts' ? content : '';
        return `<!doctype html><html><head><meta charset="utf-8">${bridge}<style>body{margin:0;background:#071018;color:#d9e8e1;font:13px/1.6 monospace;padding:20px}</style></head><body><div id="app"></div><script>${script}<\/script></body></html>`;
      }
    }
    Object.entries(filesSafe).forEach(([name, value]) => {
      if (!name.endsWith('.css')) return;
      const pattern = new RegExp(`<link[^>]*href=["'][^"']*${escapeRegExp(name)}["'][^>]*>`, 'gi');
      html = html.replace(pattern, `<style data-file="${escapeHTML(name)}">${value}</style>`);
    });
    Object.entries(filesSafe).forEach(([name, value]) => {
      if (!/\.(js|mjs)$/.test(name)) return;
      const pattern = new RegExp(`<script[^>]*src=["'][^"']*${escapeRegExp(name)}["'][^>]*><\\/script>`, 'gi');
      html = html.replace(pattern, `<script data-file="${escapeHTML(name)}">${value}<\/script>`);
    });
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${bridge}</head>`);
    else html = bridge + html;
    return html;
  }

  /* ========================================================================
     Music
     ======================================================================== */

  const music = {
    body: null,
    audio: null,
    tracks: [],
    currentId: null,
    repeat: 'off',
    shuffle: false,
    volume: 0.72,
    seq: 0,
    context: null,
    source: null,
    analyser: null,
    raf: 0,
    search: '',
    fileInput: null,

    init() {
      this.body = $('#musicAppBody');
      if (!this.body) return;
      this.body.innerHTML = `
        <div class="music-app">
          <aside class="music-side">
            <div class="music-brand"><span class="music-brand-mark"><svg viewBox="0 0 64 64"><use href="#app-music"></use></svg></span><div><b>AISNIPER</b><small>AUDIO LIBRARY</small></div></div>
            <nav class="music-nav" aria-label="音乐导航">
              <button class="is-active" data-music-view="now"><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg><span>正在播放</span></button>
              <button data-music-view="library"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg><span>本地曲库</span><i id="musicSideCount">0</i></button>
            </nav>
            <div class="music-side-tip">把本地音频拖进窗口<br>即可加入曲库并播放</div>
            <button class="music-add-primary" data-music-add type="button"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>添加音频文件</button>
            <div class="music-side-foot"><i></i><span>LOCAL PLAYBACK</span><b>Web Audio</b></div>
          </aside>
          <main class="music-main">
            <header class="music-head"><div><span class="studio-kicker">LOCAL AUDIO · 26.8</span><h1>音乐</h1></div><div class="music-head-actions"><label class="music-search"><svg viewBox="0 0 24 24"><use href="#i-search"></use></svg><input id="musicSearch" type="search" placeholder="搜索本地曲目" aria-label="搜索本地曲目"></label><button class="studio-icon-btn" data-music-add type="button" aria-label="添加音频"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg></button></div></header>
            <section class="music-now">
              <div class="music-cover" id="musicCover">
                <canvas id="musicSpectrum" aria-hidden="true"></canvas>
                <span class="music-cover-letter" id="musicCoverLetter">♪</span>
                <span class="music-cover-rings" aria-hidden="true"></span>
                <span class="music-cover-badge">AISNIPER AUDIO</span>
              </div>
              <div class="music-now-info">
                <span class="studio-kicker" id="musicNowLabel">等待曲目</span>
                <h2 id="musicTitle">把音乐拖进来</h2>
                <p id="musicMeta">支持 MP3、WAV、OGG、FLAC、M4A 等浏览器可解码格式</p>
                <div class="music-transport">
                  <button class="studio-icon-btn" id="musicShuffleBtn" type="button" aria-label="随机播放"><svg viewBox="0 0 24 24"><use href="#i-shuffle"></use></svg></button>
                  <button class="studio-icon-btn" id="musicPrevBtn" type="button" aria-label="上一首"><svg viewBox="0 0 24 24"><use href="#i-prev"></use></svg></button>
                  <button class="music-play-btn" id="musicPlayBtn" type="button" aria-label="播放"><svg viewBox="0 0 24 24"><use id="musicPlayIcon" href="#i-play"></use></svg></button>
                  <button class="studio-icon-btn" id="musicNextBtn" type="button" aria-label="下一首"><svg viewBox="0 0 24 24"><use href="#i-next"></use></svg></button>
                  <button class="studio-icon-btn" id="musicRepeatBtn" type="button" aria-label="循环模式"><span class="music-repeat-label" id="musicRepeatLabel">OFF</span></button>
                </div>
                <div class="music-progress"><span id="musicCurrentTime">00:00</span><input id="musicSeek" type="range" min="0" max="1000" value="0" aria-label="播放进度"><span id="musicDuration">--:--</span></div>
                <div class="music-volume"><button class="studio-icon-btn" id="musicMuteBtn" type="button" aria-label="静音"><svg viewBox="0 0 24 24"><use id="musicVolumeIcon" href="#i-sound"></use></svg></button><input id="musicVolume" type="range" min="0" max="100" value="72" aria-label="音量"><span class="music-quality">44.1 kHz</span></div>
              </div>
            </section>
            <section class="music-library">
              <div class="studio-section-head"><div><span class="studio-kicker">QUEUE</span><h3>本地曲库 <small id="musicTrackCount">0 首</small></h3></div><button class="studio-quiet-btn" id="musicClearBtn" type="button">清空曲库</button></div>
              <div class="music-track-list" id="musicTracks"></div>
            </section>
          </main>
          <div class="studio-drop-layer" id="musicDrop" hidden><div><span class="studio-drop-icon"><svg viewBox="0 0 24 24"><use href="#i-music-drop"></use></svg></span><b>松开以加入音乐</b><small>本地音频文件不会上传</small></div></div>
          <audio id="musicAudio" preload="metadata"></audio>
          <input id="musicFileInput" type="file" accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.opus" multiple hidden>
        </div>`;
      this.audio = $('#musicAudio', this.body);
      this.fileInput = $('#musicFileInput', this.body);
      this.searchInput = $('#musicSearch', this.body);
      this.tracksEl = $('#musicTracks', this.body);
      this.seek = $('#musicSeek', this.body);
      this.volumeInput = $('#musicVolume', this.body);
      const settings = loadJSON('aisniper.music.settings.v1', {});
      const savedVolume = Number(settings.volume);
      this.volume = clamp(Number.isFinite(savedVolume) ? savedVolume : 0.72, 0, 1);
      this.repeat = ['off', 'all', 'one'].includes(settings.repeat) ? settings.repeat : 'off';
      this.shuffle = Boolean(settings.shuffle);
      if (this.audio) this.audio.volume = this.volume;
      if (this.volumeInput) this.volumeInput.value = String(Math.round(this.volume * 100));
      this.bind();
      this.updateTransport();
      this.renderTracks();
    },

    bind() {
      this.body.addEventListener('click', (event) => {
        if (event.target.closest('[data-music-add]')) {
          this.fileInput?.click();
          return;
        }
        const view = event.target.closest('[data-music-view]');
        if (view) {
          $$('[data-music-view]', this.body).forEach((button) => button.classList.toggle('is-active', button === view));
          $('#musicTracks', this.body)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (event.target.closest('#musicPlayBtn')) { this.togglePlay(); return; }
        if (event.target.closest('#musicPrevBtn')) { this.previous(); return; }
        if (event.target.closest('#musicNextBtn')) { this.next(); return; }
        if (event.target.closest('#musicShuffleBtn')) { this.shuffle = !this.shuffle; this.saveSettings(); this.updateTransport(); return; }
        if (event.target.closest('#musicRepeatBtn')) { this.repeat = this.repeat === 'off' ? 'all' : this.repeat === 'all' ? 'one' : 'off'; this.saveSettings(); this.updateTransport(); return; }
        if (event.target.closest('#musicMuteBtn')) { this.audio.muted = !this.audio.muted; this.updateVolume(); return; }
        if (event.target.closest('#musicClearBtn')) { this.clearAll(); return; }
        const remove = event.target.closest('[data-music-remove]');
        if (remove) { event.stopPropagation(); this.removeTrack(remove.dataset.musicRemove); return; }
        const play = event.target.closest('[data-music-play]');
        if (play) { this.loadTrack(play.dataset.musicPlay, true); return; }
      });
      this.fileInput?.addEventListener('change', () => {
        this.addFiles(this.fileInput.files);
        this.fileInput.value = '';
      });
      this.searchInput?.addEventListener('input', () => {
        this.search = this.searchInput.value.trim().toLowerCase();
        this.renderTracks();
      });
      this.seek?.addEventListener('input', () => {
        if (!this.audio.duration || !Number.isFinite(this.audio.duration)) return;
        this.audio.currentTime = (Number(this.seek.value) / 1000) * this.audio.duration;
        this.updateProgress();
      });
      this.volumeInput?.addEventListener('input', () => {
        this.volume = clamp(Number(this.volumeInput.value) / 100, 0, 1);
        this.audio.volume = this.volume;
        this.audio.muted = false;
        this.saveSettings();
        this.updateVolume();
      });
      this.audio?.addEventListener('timeupdate', () => this.updateProgress());
      this.audio?.addEventListener('durationchange', () => {
        this.updateProgress();
        this.updateTrackDuration();
      });
      this.audio?.addEventListener('loadedmetadata', () => {
        this.updateProgress();
        this.updateTrackDuration();
        this.updateNow();
      });
      this.audio?.addEventListener('play', () => {
        this.startVisualizer();
        this.updateTransport();
        this.ensureAudioGraph();
      });
      this.audio?.addEventListener('pause', () => this.updateTransport());
      this.audio?.addEventListener('ended', () => this.handleEnded());
      this.audio?.addEventListener('error', () => {
        if (this.currentId) host?.showToast?.({ title: '无法播放音频', message: '浏览器可能不支持这个音频编码。', icon: 'app-music' });
        this.updateTransport();
      });
      this.bindDrop(this.body, $('#musicDrop', this.body), (files) => this.addFiles(files));
      document.addEventListener('keydown', (event) => {
        if (document.body.dataset.app !== 'music') return;
        if (!document.getElementById('window-music')?.classList.contains('is-active')) return;
        if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
        if (event.code === 'Space') { event.preventDefault(); this.togglePlay(); }
        else if (event.code === 'ArrowLeft') { event.preventDefault(); this.seekBy(-5); }
        else if (event.code === 'ArrowRight') { event.preventDefault(); this.seekBy(5); }
      });
    },

    bindDrop(element, overlay, handler) {
      if (!element) return;
      let depth = 0;
      element.addEventListener('dragenter', (event) => {
        event.preventDefault();
        depth += 1;
        overlay.hidden = false;
      });
      element.addEventListener('dragover', (event) => event.preventDefault());
      element.addEventListener('dragleave', () => {
        depth = Math.max(0, depth - 1);
        if (!depth) overlay.hidden = true;
      });
      element.addEventListener('drop', (event) => {
        event.preventDefault();
        depth = 0;
        overlay.hidden = true;
        handler(event.dataTransfer?.files || []);
      });
    },

    open() {
      if (!this.body) this.init();
      this.body?.classList.add('is-ready');
      this.startVisualizer();
    },

    close() {
      if (this.audio && !this.audio.paused) this.audio.pause();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    },

    addFiles(fileList) {
      const files = Array.from(fileList || []).filter(isAudioFile);
      if (!files.length) {
        host?.showToast?.({ title: '没有可播放的音频', message: '请选择 MP3、WAV、OGG、FLAC 或 M4A 文件。', icon: 'app-music' });
        return;
      }
      const firstNew = files.length;
      let newest = null;
      files.forEach((file) => {
        const track = {
          id: `track-${Date.now()}-${this.seq += 1}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type || `audio/${fileExtension(file.name)}`,
          duration: 0
        };
        this.tracks.push(track);
        newest = track;
        const probe = document.createElement('audio');
        probe.preload = 'metadata';
        probe.src = track.url;
        probe.addEventListener('loadedmetadata', () => {
          track.duration = Number.isFinite(probe.duration) ? probe.duration : 0;
          this.renderTracks();
        }, { once: true });
      });
      this.renderTracks();
      if (newest) this.loadTrack(newest.id, true);
      host?.showToast?.({ title: '已加入本地曲库', message: `${firstNew} 首音频 · 文件只在此浏览器标签页内播放。`, icon: 'app-music' });
    },

    trackById(id) {
      return this.tracks.find((track) => track.id === id) || null;
    },

    loadTrack(id, autoplay = false) {
      const track = this.trackById(id);
      if (!track || !this.audio) return;
      this.currentId = id;
      this.audio.src = track.url;
      this.audio.load();
      this.updateNow();
      this.renderTracks();
      if (autoplay) {
        this.ensureAudioGraph();
        const promise = this.audio.play();
        promise?.catch?.(() => host?.showToast?.({ title: '浏览器拦截了自动播放', message: '请再按一次播放按钮继续。', icon: 'app-music' }));
      }
      this.updateTransport();
    },

    ensureAudioGraph() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume().catch(() => {});
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        this.context = new AudioContextClass();
        this.source = this.context.createMediaElementSource(this.audio);
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.82;
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.context.resume().catch(() => {});
      } catch (error) {
        this.context = null;
        this.source = null;
        this.analyser = null;
      }
    },

    togglePlay() {
      if (!this.tracks.length) { this.fileInput?.click(); return; }
      if (!this.currentId) { this.loadTrack(this.tracks[0].id, true); return; }
      if (!this.audio.src) { this.loadTrack(this.currentId, true); return; }
      if (this.audio.paused) {
        this.ensureAudioGraph();
        this.audio.play().catch(() => host?.showToast?.({ title: '无法播放', message: '浏览器阻止了播放，请重试。', icon: 'app-music' }));
      } else {
        this.audio.pause();
      }
    },

    next(manual = false) {
      if (!this.tracks.length) return;
      const currentIndex = this.tracks.findIndex((track) => track.id === this.currentId);
      let nextIndex = currentIndex < 0 ? 0 : currentIndex + 1;
      if (this.shuffle && this.tracks.length > 1) {
        do { nextIndex = Math.floor(Math.random() * this.tracks.length); } while (nextIndex === currentIndex);
      } else if (nextIndex >= this.tracks.length) {
        if (this.repeat === 'off' && !manual) { this.audio.pause(); return; }
        nextIndex = 0;
      }
      this.loadTrack(this.tracks[nextIndex].id, true);
    },

    previous() {
      if (!this.tracks.length) return;
      const currentIndex = this.tracks.findIndex((track) => track.id === this.currentId);
      let previousIndex = currentIndex <= 0 ? this.tracks.length - 1 : currentIndex - 1;
      if (this.shuffle && this.tracks.length > 1) {
        do { previousIndex = Math.floor(Math.random() * this.tracks.length); } while (previousIndex === currentIndex);
      }
      this.loadTrack(this.tracks[previousIndex].id, true);
    },

    handleEnded() {
      if (this.repeat === 'one') {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      } else if (this.repeat === 'all' || this.shuffle) this.next();
      else this.updateTransport();
    },

    seekBy(seconds) {
      if (!this.audio.duration) return;
      this.audio.currentTime = clamp(this.audio.currentTime + seconds, 0, this.audio.duration);
    },

    removeTrack(id) {
      const index = this.tracks.findIndex((track) => track.id === id);
      if (index < 0) return;
      const [track] = this.tracks.splice(index, 1);
      URL.revokeObjectURL(track.url);
      if (this.currentId === id) {
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.currentId = null;
        if (this.tracks[index]) this.loadTrack(this.tracks[index].id, false);
        else this.updateNow();
      }
      this.renderTracks();
      this.updateTransport();
    },

    clearAll() {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.tracks.forEach((track) => URL.revokeObjectURL(track.url));
      this.tracks = [];
      this.currentId = null;
      this.renderTracks();
      this.updateTransport();
      this.updateProgress();
    },

    saveSettings() {
      saveJSON('aisniper.music.settings.v1', { volume: this.volume, repeat: this.repeat, shuffle: this.shuffle });
    },

    updateProgress() {
      const current = this.audio?.currentTime || 0;
      const duration = Number.isFinite(this.audio?.duration) ? this.audio.duration : 0;
      const currentEl = $('#musicCurrentTime', this.body);
      const durationEl = $('#musicDuration', this.body);
      if (currentEl) currentEl.textContent = formatTime(current);
      if (durationEl) durationEl.textContent = formatTime(duration);
      if (this.seek) {
        this.seek.value = duration ? String(Math.round((current / duration) * 1000)) : '0';
        this.seek.style.setProperty('--progress', `${duration ? (current / duration) * 100 : 0}%`);
      }
    },

    updateTransport() {
      const playing = Boolean(this.audio && !this.audio.paused);
      const icon = $('#musicPlayIcon', this.body);
      if (icon) icon.setAttribute('href', playing ? '#i-pause' : '#i-play');
      const playButton = $('#musicPlayBtn', this.body);
      if (playButton) playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
      $('#musicShuffleBtn', this.body)?.classList.toggle('is-active', this.shuffle);
      const repeatLabel = $('#musicRepeatLabel', this.body);
      if (repeatLabel) repeatLabel.textContent = this.repeat === 'one' ? 'ONE' : this.repeat === 'all' ? 'ALL' : 'OFF';
      $('#musicRepeatBtn', this.body)?.classList.toggle('is-active', this.repeat !== 'off');
      this.updateVolume();
      this.updateNow();
    },

    updateVolume() {
      if (!this.audio) return;
      const icon = $('#musicVolumeIcon', this.body);
      if (icon) icon.setAttribute('href', this.audio.muted || this.volume <= 0 ? '#i-sound-off' : '#i-sound');
      if (this.volumeInput && Number(this.volumeInput.value) !== Math.round(this.volume * 100)) this.volumeInput.value = String(Math.round(this.volume * 100));
      if (this.volumeInput) this.volumeInput.style.setProperty('--progress', `${this.volume * 100}%`);
    },

    updateNow() {
      const track = this.trackById(this.currentId);
      const title = $('#musicTitle', this.body);
      const meta = $('#musicMeta', this.body);
      const label = $('#musicNowLabel', this.body);
      const letter = $('#musicCoverLetter', this.body);
      const cover = $('#musicCover', this.body);
      if (!track) {
        if (title) title.textContent = this.tracks.length ? '选择一首曲目' : '把音乐拖进来';
        if (meta) meta.textContent = this.tracks.length ? '本地曲库已经准备好。' : '支持 MP3、WAV、OGG、FLAC、M4A 等浏览器可解码格式';
        if (label) label.textContent = this.tracks.length ? 'LOCAL LIBRARY' : '等待曲目';
        if (letter) letter.textContent = '♪';
        if (cover) { cover.style.setProperty('--cover-a', '#a63d69'); cover.style.setProperty('--cover-b', '#f28b5c'); }
        return;
      }
      if (title) title.textContent = track.name;
      if (meta) meta.textContent = `${track.fileName} · ${formatBytes(track.size)} · ${formatTime(track.duration)}`;
      if (label) label.textContent = this.audio && !this.audio.paused ? 'NOW PLAYING · LOCAL' : 'PAUSED · LOCAL';
      if (letter) letter.textContent = track.name.slice(0, 1).toUpperCase() || '♪';
      const hash = [...track.name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const hue = hash % 360;
      if (cover) {
        cover.style.setProperty('--cover-a', `hsl(${hue}, 52%, 36%)`);
        cover.style.setProperty('--cover-b', `hsl(${(hue + 46) % 360}, 64%, 58%)`);
      }
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({ title: track.name, artist: 'AISniper 音乐', album: '本地曲库' });
        } catch (error) { /* no-op */ }
      }
    },

    updateTrackDuration() {
      const track = this.trackById(this.currentId);
      if (!track) return;
      if (Number.isFinite(this.audio.duration)) track.duration = this.audio.duration;
      this.renderTracks();
      this.updateNow();
    },

    renderTracks() {
      if (!this.tracksEl) return;
      const count = $('#musicTrackCount', this.body);
      const sideCount = $('#musicSideCount', this.body);
      if (count) count.textContent = `${this.tracks.length} 首`;
      if (sideCount) sideCount.textContent = String(this.tracks.length);
      const visible = this.tracks.filter((track) => !this.search || track.name.toLowerCase().includes(this.search) || track.fileName.toLowerCase().includes(this.search));
      if (!visible.length) {
        this.tracksEl.innerHTML = `<div class="music-empty"><span>${this.tracks.length ? '没有匹配的曲目' : '曲库还是空的'}</span><b>${this.tracks.length ? '换个关键词试试。' : '把本地音频拖进这个窗口，音乐会立即开始。'}</b><button class="studio-quiet-btn" data-music-add type="button">选择音频文件</button></div>`;
        return;
      }
      this.tracksEl.innerHTML = visible.map((track, index) => `
        <button class="music-track${track.id === this.currentId ? ' is-active' : ''}" data-music-play="${track.id}" type="button" style="--track-index:${index}">
          <span class="music-track-index">${track.id === this.currentId && this.audio && !this.audio.paused ? '<svg viewBox="0 0 24 24"><use href="#i-pause"></use></svg>' : String(index + 1).padStart(2, '0')}</span>
          <span class="music-track-cover">${escapeHTML(track.name.slice(0, 1).toUpperCase() || '♪')}</span>
          <span class="music-track-copy"><b>${escapeHTML(track.name)}</b><small>${escapeHTML(track.fileName)} · ${escapeHTML(track.type)}</small></span>
          <span class="music-track-duration">${formatTime(track.duration)}</span>
          <span class="music-track-actions"><span class="music-track-size">${formatBytes(track.size)}</span><span class="music-track-remove" data-music-remove="${track.id}" role="button" aria-label="从曲库移除" tabindex="0"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></span></span>
        </button>`).join('');
      this.updateNow();
    },

    startVisualizer() {
      if (this.raf) return;
      const canvas = $('#musicSpectrum', this.body);
      if (!canvas) return;
      const draw = () => {
        this.raf = requestAnimationFrame(draw);
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        const bars = 42;
        const gap = 3 * dpr;
        const barWidth = Math.max(1.5 * dpr, (width - gap * (bars - 1)) / bars);
        let data = null;
        if (this.analyser) {
          data = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(data);
        }
        for (let index = 0; index < bars; index += 1) {
          const idle = (Math.sin(this.performanceNow() * 1.4 + index * 0.55) + 1) / 2;
          const value = data ? data[Math.floor(index / bars * data.length)] / 255 : idle * 0.28;
          const barHeight = Math.max(2 * dpr, value * height * 0.86);
          const x = index * (barWidth + gap);
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(242, 139, 92, .18)');
          gradient.addColorStop(0.55, 'rgba(242, 139, 92, .7)');
          gradient.addColorStop(1, 'rgba(255, 231, 207, .92)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      };
      draw();
    },

    performanceNow() {
      return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    }
  };

  /* ========================================================================
     Cinema
     ======================================================================== */

  const cinema = {
    body: null,
    video: null,
    tracks: [],
    currentId: null,
    seq: 0,
    fileInput: null,
    fullscreen: false,

    init() {
      this.body = $('#cinemaAppBody');
      if (!this.body) return;
      this.body.innerHTML = `
        <div class="cinema-app">
          <header class="cinema-head">
            <div class="cinema-brand"><span class="cinema-mark"><svg viewBox="0 0 64 64"><use href="#app-cinema"></use></svg></span><div><span class="studio-kicker">AISNIPER CINEMA · LOCAL PLAYBACK</span><h1>影院</h1></div></div>
            <div class="cinema-head-actions"><button class="studio-quiet-btn" data-cinema-add type="button"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>添加视频</button><button class="studio-icon-btn" id="cinemaPipBtn" type="button" aria-label="画中画" title="画中画"><svg viewBox="0 0 24 24"><use href="#i-video"></use></svg></button><button class="studio-icon-btn" id="cinemaFullscreenBtn" type="button" aria-label="全屏" title="全屏"><svg viewBox="0 0 24 24"><use href="#i-expand"></use></svg></button></div>
          </header>
          <div class="cinema-layout">
            <main class="cinema-stage" id="cinemaStage">
              <video id="cinemaVideo" playsinline preload="metadata"></video>
              <div class="cinema-poster" id="cinemaPoster">
                <span class="cinema-poster-icon"><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></span>
                <span class="studio-kicker">LOCAL VIDEO PLAYER</span>
                <h2>把本地视频拖到这里</h2>
                <p>支持浏览器可解码的 MP4、WebM、MOV 等格式。视频文件不会上传，播放直接使用本地文件。</p>
                <button class="cinema-pick-btn" data-cinema-add type="button">选择视频文件 <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>
              </div>
              <div class="cinema-video-meta" id="cinemaVideoMeta" hidden><span id="cinemaNowLabel">READY</span><b id="cinemaNowTitle"></b><small id="cinemaNowSpec"></small></div>
              <div class="cinema-controls" id="cinemaControls">
                <div class="cinema-scrub"><input id="cinemaSeek" type="range" min="0" max="1000" value="0" aria-label="视频进度"></div>
                <div class="cinema-control-row">
                  <button class="cinema-control-btn" id="cinemaPlayBtn" type="button" aria-label="播放"><svg viewBox="0 0 24 24"><use id="cinemaPlayIcon" href="#i-play"></use></svg></button>
                  <span class="cinema-time" id="cinemaTime">00:00 / 00:00</span>
                  <span class="cinema-spacer"></span>
                  <button class="cinema-control-btn" id="cinemaMuteBtn" type="button" aria-label="静音"><svg viewBox="0 0 24 24"><use id="cinemaVolumeIcon" href="#i-sound"></use></svg></button>
                  <input id="cinemaVolume" class="cinema-volume" type="range" min="0" max="100" value="80" aria-label="音量">
                  <label class="cinema-rate-label">速度<select id="cinemaRate" aria-label="播放速度"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
                </div>
              </div>
              <div class="studio-drop-layer cinema-drop" id="cinemaDrop" hidden><div><span class="studio-drop-icon"><svg viewBox="0 0 24 24"><use href="#i-video"></use></svg></span><b>松开以播放视频</b><small>本地文件 · 不会上传</small></div></div>
            </main>
            <aside class="cinema-playlist">
              <div class="studio-section-head"><div><span class="studio-kicker">QUEUE</span><h3>播放列表 <small id="cinemaTrackCount">0 部</small></h3></div><button class="studio-icon-btn" data-cinema-add type="button" aria-label="添加视频"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg></button></div>
              <div class="cinema-track-list" id="cinemaTracks"></div>
              <div class="cinema-side-note"><svg viewBox="0 0 24 24"><use href="#i-info"></use></svg><span>拖入本地视频会自动播放。关闭窗口会暂停当前视频。</span></div>
            </aside>
          </div>
          <input id="cinemaFileInput" type="file" accept="video/*,.mp4,.webm,.mov,.m4v,.ogv,.mkv" multiple hidden>
        </div>`;
      this.video = $('#cinemaVideo', this.body);
      this.fileInput = $('#cinemaFileInput', this.body);
      this.tracksEl = $('#cinemaTracks', this.body);
      this.seek = $('#cinemaSeek', this.body);
      this.volumeInput = $('#cinemaVolume', this.body);
      const settings = loadJSON('aisniper.cinema.settings.v1', {});
      const savedVolume = Number(settings.volume);
      this.video.volume = clamp(Number.isFinite(savedVolume) ? savedVolume : 0.8, 0, 1);
      if (this.volumeInput) this.volumeInput.value = String(Math.round(this.video.volume * 100));
      this.bind();
      this.updateControls();
      this.renderTracks();
    },

    bind() {
      this.body.addEventListener('click', (event) => {
        if (event.target.closest('[data-cinema-add]')) { this.fileInput?.click(); return; }
        if (event.target.closest('#cinemaPlayBtn')) { this.togglePlay(); return; }
        if (event.target.closest('#cinemaMuteBtn')) { this.video.muted = !this.video.muted; this.updateControls(); return; }
        if (event.target.closest('#cinemaFullscreenBtn')) { this.toggleFullscreen(); return; }
        if (event.target.closest('#cinemaPipBtn')) { this.togglePip(); return; }
        const remove = event.target.closest('[data-cinema-remove]');
        if (remove) { event.stopPropagation(); this.removeVideo(remove.dataset.cinemaRemove); return; }
        const play = event.target.closest('[data-cinema-play]');
        if (play) { this.loadVideo(play.dataset.cinemaPlay, true); return; }
      });
      this.fileInput?.addEventListener('change', () => { this.addFiles(this.fileInput.files); this.fileInput.value = ''; });
      this.seek?.addEventListener('input', () => {
        if (!Number.isFinite(this.video.duration)) return;
        this.video.currentTime = (Number(this.seek.value) / 1000) * this.video.duration;
        this.updateControls();
      });
      this.volumeInput?.addEventListener('input', () => {
        this.video.volume = clamp(Number(this.volumeInput.value) / 100, 0, 1);
        this.video.muted = false;
        saveJSON('aisniper.cinema.settings.v1', { volume: this.video.volume });
        this.updateControls();
      });
      $('#cinemaRate', this.body)?.addEventListener('change', (event) => {
        this.video.playbackRate = Number(event.target.value) || 1;
        host?.showToast?.({ title: '播放速度已调整', message: `${this.video.playbackRate}×`, icon: 'app-cinema' });
      });
      this.video.addEventListener('timeupdate', () => this.updateControls());
      this.video.addEventListener('durationchange', () => this.updateControls());
      this.video.addEventListener('loadedmetadata', () => {
        this.updateControls();
        this.updateNow();
      });
      this.video.addEventListener('click', () => this.togglePlay());
      this.video.addEventListener('play', () => { this.updateControls(); $('#cinemaPoster', this.body).classList.add('is-hidden'); });
      this.video.addEventListener('pause', () => this.updateControls());
      this.video.addEventListener('ended', () => this.next());
      this.video.addEventListener('error', () => this.showError());
      this.bindDrop(this.body, $('#cinemaDrop', this.body), (files) => this.addFiles(files));
      document.addEventListener('fullscreenchange', () => this.updateControls());
      document.addEventListener('keydown', (event) => {
        if (document.body.dataset.app !== 'cinema') return;
        if (!document.getElementById('window-cinema')?.classList.contains('is-active')) return;
        if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
        if (event.code === 'Space') { event.preventDefault(); this.togglePlay(); }
        else if (event.code === 'ArrowLeft') { event.preventDefault(); this.seekBy(-5); }
        else if (event.code === 'ArrowRight') { event.preventDefault(); this.seekBy(5); }
        else if (event.code === 'KeyM') { event.preventDefault(); this.video.muted = !this.video.muted; this.updateControls(); }
        else if (event.code === 'KeyF') { event.preventDefault(); this.toggleFullscreen(); }
      });
    },

    bindDrop(element, overlay, handler) {
      if (!element) return;
      let depth = 0;
      element.addEventListener('dragenter', (event) => { event.preventDefault(); depth += 1; overlay.hidden = false; });
      element.addEventListener('dragover', (event) => event.preventDefault());
      element.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
      element.addEventListener('drop', (event) => {
        event.preventDefault();
        depth = 0;
        overlay.hidden = true;
        handler(event.dataTransfer?.files || []);
      });
    },

    open() {
      if (!this.body) this.init();
      this.body?.classList.add('is-ready');
      this.updateControls();
    },

    close() {
      this.video?.pause();
      if (document.pictureInPictureElement) document.exitPictureInPicture?.().catch(() => {});
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    },

    addFiles(fileList) {
      const files = Array.from(fileList || []).filter(isVideoFile);
      if (!files.length) {
        host?.showToast?.({ title: '没有可播放的视频', message: '请选择 MP4、WebM、MOV 等视频文件。', icon: 'app-cinema' });
        return;
      }
      files.forEach((file) => {
        this.tracks.push({
          id: `video-${Date.now()}-${this.seq += 1}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type || `video/${fileExtension(file.name)}`,
          duration: 0
        });
      });
      this.renderTracks();
      if (files.length) {
        const newest = this.tracks[this.tracks.length - 1];
        this.loadVideo(newest.id, true);
      }
      host?.showToast?.({ title: '视频已载入', message: `${files.length} 个本地视频已加入播放列表。`, icon: 'app-cinema' });
    },

    videoById(id) {
      return this.tracks.find((track) => track.id === id) || null;
    },

    loadVideo(id, autoplay = false) {
      const track = this.videoById(id);
      if (!track) return;
      this.currentId = id;
      this.video.src = track.url;
      this.video.load();
      this.updateNow();
      this.renderTracks();
      $('#cinemaPoster', this.body)?.classList.add('is-hidden');
      if (autoplay) {
        const promise = this.video.play();
        promise?.catch?.(() => host?.showToast?.({ title: '视频已准备好', message: '浏览器阻止了自动播放，请按播放键。', icon: 'app-cinema' }));
      }
    },

    togglePlay() {
      if (!this.tracks.length) { this.fileInput?.click(); return; }
      if (!this.currentId) { this.loadVideo(this.tracks[0].id, true); return; }
      if (this.video.paused) {
        this.video.play().catch(() => host?.showToast?.({ title: '无法播放', message: '请检查视频编码或浏览器支持。', icon: 'app-cinema' }));
      } else this.video.pause();
    },

    next() {
      if (!this.tracks.length) return;
      const index = this.tracks.findIndex((track) => track.id === this.currentId);
      const next = index < 0 ? 0 : (index + 1) % this.tracks.length;
      this.loadVideo(this.tracks[next].id, true);
    },

    seekBy(seconds) {
      if (!Number.isFinite(this.video.duration)) return;
      this.video.currentTime = clamp(this.video.currentTime + seconds, 0, this.video.duration);
    },

    removeVideo(id) {
      const index = this.tracks.findIndex((track) => track.id === id);
      if (index < 0) return;
      const [track] = this.tracks.splice(index, 1);
      URL.revokeObjectURL(track.url);
      if (this.currentId === id) {
        this.video.pause();
        this.video.removeAttribute('src');
        this.currentId = null;
        if (this.tracks[index]) this.loadVideo(this.tracks[index].id, false);
        else this.updateNow();
      }
      this.renderTracks();
    },

    updateControls() {
      if (!this.video) return;
      const playing = !this.video.paused;
      const icon = $('#cinemaPlayIcon', this.body);
      if (icon) icon.setAttribute('href', playing ? '#i-pause' : '#i-play');
      const current = this.video.currentTime || 0;
      const duration = Number.isFinite(this.video.duration) ? this.video.duration : 0;
      const time = $('#cinemaTime', this.body);
      if (time) time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      if (this.seek) {
        this.seek.value = duration ? String(Math.round((current / duration) * 1000)) : '0';
        this.seek.style.setProperty('--progress', `${duration ? (current / duration) * 100 : 0}%`);
      }
      const volIcon = $('#cinemaVolumeIcon', this.body);
      if (volIcon) volIcon.setAttribute('href', this.video.muted || this.video.volume <= 0 ? '#i-sound-off' : '#i-sound');
      if (this.volumeInput) this.volumeInput.style.setProperty('--progress', `${this.video.volume * 100}%`);
      const fullscreenIcon = $('#cinemaFullscreenBtn use', this.body);
      if (fullscreenIcon) fullscreenIcon.setAttribute('href', document.fullscreenElement === $('#cinemaStage', this.body) ? '#i-collapse' : '#i-expand');
      if (this.audio) { /* music graph is separate */ }
    },

    updateNow() {
      const track = this.videoById(this.currentId);
      const meta = $('#cinemaVideoMeta', this.body);
      if (!track) {
        if (meta) meta.hidden = true;
        $('#cinemaPoster', this.body)?.classList.remove('is-hidden');
        return;
      }
      if (meta) meta.hidden = false;
      $('#cinemaNowLabel', this.body).textContent = this.video.paused ? 'READY · LOCAL FILE' : 'PLAYING · LOCAL FILE';
      $('#cinemaNowTitle', this.body).textContent = track.name;
      const resolution = this.video.videoWidth && this.video.videoHeight ? `${this.video.videoWidth} × ${this.video.videoHeight}` : '正在读取分辨率';
      $('#cinemaNowSpec', this.body).textContent = `${track.fileName} · ${resolution} · ${formatBytes(track.size)}`;
      if (track.duration) this.updateTrackDuration(track);
    },

    updateTrackDuration(track) {
      if (Number.isFinite(this.video.duration)) track.duration = this.video.duration;
      this.renderTracks();
    },

    renderTracks() {
      if (!this.tracksEl) return;
      $('#cinemaTrackCount', this.body).textContent = `${this.tracks.length} 部`;
      if (!this.tracks.length) {
        this.tracksEl.innerHTML = `<div class="cinema-empty"><span>播放列表为空</span><b>拖入本地视频即可开始。</b><button class="studio-quiet-btn" data-cinema-add type="button">选择视频</button></div>`;
        return;
      }
      this.tracksEl.innerHTML = this.tracks.map((track, index) => `
        <button class="cinema-track${track.id === this.currentId ? ' is-active' : ''}" data-cinema-play="${track.id}" type="button">
          <span class="cinema-track-thumb"><span>${String(index + 1).padStart(2, '0')}</span><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg></span>
          <span class="cinema-track-copy"><b>${escapeHTML(track.name)}</b><small>${escapeHTML(track.fileName)} · ${formatBytes(track.size)} · ${formatTime(track.duration)}</small></span>
          <span class="cinema-track-remove" data-cinema-remove="${track.id}" role="button" aria-label="移除视频" tabindex="0"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></span>
        </button>`).join('');
    },

    showError() {
      const track = this.videoById(this.currentId);
      host?.showToast?.({ title: '视频无法播放', message: track ? `浏览器不支持 ${track.fileName} 的编码，或文件已损坏。` : '浏览器不支持当前视频。', icon: 'app-cinema' });
      this.updateControls();
      this.updateNow();
    },

    async toggleFullscreen() {
      const stage = $('#cinemaStage', this.body);
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await stage.requestFullscreen?.();
      } catch (error) {
        host?.showToast?.({ title: '无法进入全屏', message: '浏览器阻止了全屏请求。', icon: 'app-cinema' });
      }
      this.updateControls();
    },

    async togglePip() {
      if (!document.pictureInPictureEnabled || !this.video.requestPictureInPicture) {
        host?.showToast?.({ title: '不支持画中画', message: '当前浏览器没有开放画中画功能。', icon: 'app-cinema' });
        return;
      }
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await this.video.requestPictureInPicture();
      } catch (error) {
        host?.showToast?.({ title: '画中画不可用', message: '请先播放视频，再试一次。', icon: 'app-cinema' });
      }
    }
  };

/* ========================================================================
     Text editor
     ======================================================================== */

  const text = {
    body: null,
    doc: { name: '欢迎.md', content: '', mode: 'edit' },
    timer: null,
    fileInput: null,

    sample() {
      return [
        '# 欢迎来到 AISniper 文本',
        '',
        '这是一个本地纯文本 / Markdown 编辑器。内容会自动保存在本机浏览器中。',
        '',
        '## 可以做什么',
        '',
        '- 拖入 `.txt`、`.md`、`.json` 或代码文件直接编辑',
        '- 使用 **粗体**、*斜体*、`行内代码` 和列表组织内容',
        '- 切换到预览，查看 Markdown 渲染结果',
        '- 保存时下载真实文本文件',
        '',
        '> 专注，凝练。光标停在哪里，思路就从哪里继续。',
        '',
        '```js',
        "const signal = 'AISNIPER';",
        "console.log(`${signal} online`);",
        '```',
        ''
      ].join('\n');
    },

    init() {
      this.body = $('#textAppBody');
      if (!this.body) return;
      this.body.innerHTML = `
        <div class="text-app">
          <header class="text-head">
            <div class="text-brand"><span class="text-mark"><svg viewBox="0 0 64 64"><use href="#app-text"></use></svg></span><div><span class="studio-kicker">AISNIPER WRITE · LOCAL DOCUMENT</span><h1>文本</h1></div></div>
            <div class="text-head-actions"><button class="studio-quiet-btn" data-text-action="new" type="button"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg>新建</button><button class="studio-quiet-btn" data-text-action="open" type="button"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>打开</button><button class="studio-quiet-btn" data-text-action="save" type="button"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>保存</button><button class="text-preview-toggle" data-text-action="preview" type="button"><svg viewBox="0 0 24 24"><use href="#i-eye"></use></svg><span id="textPreviewLabel">预览</span></button></div>
          </header>
          <div class="text-toolbar">
            <input class="text-filename" id="textFileName" value="欢迎.md" aria-label="文件名" spellcheck="false">
            <span class="text-toolbar-divider"></span>
            <button class="text-format-btn" data-text-format="bold" type="button" title="粗体"><b>B</b></button>
            <button class="text-format-btn" data-text-format="italic" type="button" title="斜体"><i>I</i></button>
            <button class="text-format-btn" data-text-format="heading" type="button" title="标题">H1</button>
            <button class="text-format-btn" data-text-format="list" type="button" title="列表">≡</button>
            <button class="text-format-btn" data-text-format="code" type="button" title="代码">&lt;/&gt;</button>
            <button class="text-format-btn" data-text-format="link" type="button" title="链接">↗</button>
            <span class="text-toolbar-spacer"></span>
            <span class="text-mode-chip" id="textModeChip">MARKDOWN</span>
          </div>
          <div class="text-workspace">
            <div class="text-editor-pane" id="textEditorPane">
              <div class="text-gutter" id="textGutter" aria-hidden="true">1</div>
              <textarea id="textEditorArea" spellcheck="false" wrap="off" aria-label="文本编辑区"></textarea>
            </div>
            <div class="text-preview-pane" id="textPreviewPane" hidden></div>
          </div>
          <footer class="text-status"><span id="textStatusName">欢迎.md</span><span id="textStats">0 字 · 0 行</span><span class="text-status-spacer"></span><span id="textSavedState"><i></i>已自动保存</span><span>UTF-8</span></footer>
          <div class="studio-drop-layer" id="textDrop" hidden><div><span class="studio-drop-icon"><svg viewBox="0 0 24 24"><use href="#i-file"></use></svg></span><b>松开以打开文本</b><small>支持 TXT、MD、JSON、代码文件</small></div></div>
          <input id="textFileInput" type="file" accept=".txt,.md,.markdown,.json,.js,.ts,.css,.html,.xml,.py,.c,.cpp,.h,.java,.go,.rs,.php,.rb,.yml,.yaml,.sh,.ini,.log,text/*" hidden>
        </div>`;
      this.area = $('#textEditorArea', this.body);
      this.gutter = $('#textGutter', this.body);
      this.previewPane = $('#textPreviewPane', this.body);
      this.editorPane = $('#textEditorPane', this.body);
      this.fileInput = $('#textFileInput', this.body);
      const saved = loadJSON('aisniper.text.doc.v1', null);
      this.doc = saved && typeof saved.content === 'string'
        ? { name: saved.name || '欢迎.md', content: saved.content, mode: saved.mode === 'preview' ? 'preview' : 'edit' }
        : { name: '欢迎.md', content: this.sample(), mode: 'edit' };
      this.bind();
      this.loadDoc(this.doc);
    },

    bind() {
      this.body.addEventListener('click', (event) => {
        const action = event.target.closest('[data-text-action]');
        if (action) {
          const name = action.dataset.textAction;
          if (name === 'new') this.newDoc();
          else if (name === 'open') this.fileInput?.click();
          else if (name === 'save') this.saveDoc();
          else if (name === 'preview') this.togglePreview();
          return;
        }
        const format = event.target.closest('[data-text-format]');
        if (format) this.format(format.dataset.textFormat);
      });
      this.fileInput?.addEventListener('change', () => {
        this.addFiles(this.fileInput.files);
        this.fileInput.value = '';
      });
      this.area?.addEventListener('input', () => {
        this.doc.content = this.area.value;
        this.doc.name = $('#textFileName', this.body)?.value.trim() || this.doc.name;
        this.refreshEditor();
        this.scheduleSave();
        if (this.doc.mode === 'preview') this.renderPreview();
      });
      this.area?.addEventListener('scroll', () => {
        if (this.gutter) this.gutter.scrollTop = this.area.scrollTop;
      });
      this.area?.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          const start = this.area.selectionStart;
          this.area.setRangeText('  ', start, this.area.selectionEnd, 'end');
          this.area.dispatchEvent(new Event('input', { bubbles: true }));
        } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault();
          this.saveDoc();
        } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
          event.preventDefault();
          this.togglePreview();
        }
      });
      $('#textFileName', this.body)?.addEventListener('change', () => {
        this.doc.name = $('#textFileName', this.body).value.trim() || '未命名.md';
        $('#textFileName', this.body).value = this.doc.name;
        this.refreshStats();
        this.scheduleSave();
        this.updateModeChip();
      });
      this.bindDrop(this.body, $('#textDrop', this.body), (files) => this.addFiles(files));
    },

    bindDrop(element, overlay, handler) {
      if (!element) return;
      let depth = 0;
      element.addEventListener('dragenter', (event) => { event.preventDefault(); depth += 1; overlay.hidden = false; });
      element.addEventListener('dragover', (event) => event.preventDefault());
      element.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
      element.addEventListener('drop', (event) => {
        event.preventDefault();
        depth = 0;
        overlay.hidden = true;
        handler(event.dataTransfer?.files || []);
      });
    },

    open() {
      if (!this.body) this.init();
      this.body?.classList.add('is-ready');
      setTimeout(() => this.area?.focus(), 100);
    },

    close() {
      this.saveLocal();
    },

    loadDoc(doc) {
      this.doc = {
        name: doc.name || '未命名.md',
        content: typeof doc.content === 'string' ? doc.content : '',
        mode: doc.mode === 'preview' ? 'preview' : 'edit'
      };
      const nameInput = $('#textFileName', this.body);
      if (nameInput) nameInput.value = this.doc.name;
      if (this.area) this.area.value = this.doc.content;
      this.refreshEditor();
      this.setMode(this.doc.mode, false);
      this.updateModeChip();
    },

    newDoc() {
      this.doc = { name: '未命名.md', content: '', mode: 'edit' };
      this.loadDoc(this.doc);
      this.saveLocal();
      this.area?.focus();
      host?.showToast?.({ title: '新建文稿', message: '空白 Markdown 文稿已创建。', icon: 'app-text' });
    },

    addFiles(fileList) {
      const files = Array.from(fileList || []).filter(isTextFile);
      if (!files.length) {
        host?.showToast?.({ title: '没有可打开的文本', message: '请选择 TXT、MD、JSON 或代码文件。', icon: 'app-text' });
        return;
      }
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.doc = { name: file.name, content: String(reader.result || ''), mode: /\.(md|markdown)$/i.test(file.name) ? 'edit' : 'edit' };
        this.loadDoc(this.doc);
        this.saveLocal();
        host?.showToast?.({ title: '文本已打开', message: `${file.name} · ${formatBytes(file.size)}`, icon: 'app-text' });
      };
      reader.onerror = () => host?.showToast?.({ title: '无法读取文件', message: file.name, icon: 'app-text' });
      reader.readAsText(file);
    },

    refreshEditor() {
      if (!this.area) return;
      const lines = Math.max(1, this.doc.content.split('\n').length);
      if (this.gutter) {
        const numbers = [];
        for (let index = 1; index <= lines; index += 1) numbers.push(index);
        this.gutter.textContent = numbers.join('\n');
        this.gutter.scrollTop = this.area.scrollTop;
      }
      this.refreshStats();
      if (this.doc.mode === 'preview') this.renderPreview();
      if (this.area) this.area.style.height = '100%';
    },

    refreshStats() {
      const content = this.doc.content || '';
      const lines = content ? content.split('\n').length : 0;
      const chinese = (content.match(/[\u3400-\u9fff]/g) || []).length;
      const words = (content.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9_'-]+/g) || []).length + chinese;
      const stats = $('#textStats', this.body);
      if (stats) stats.textContent = `${words} 字 · ${lines} 行 · ${formatBytes(new TextEncoder().encode(content).length)}`;
      const name = $('#textStatusName', this.body);
      if (name) name.textContent = this.doc.name;
    },

    updateModeChip() {
      const chip = $('#textModeChip', this.body);
      if (chip) chip.textContent = /\.(md|markdown)$/i.test(this.doc.name) ? 'MARKDOWN' : (fileExtension(this.doc.name) || 'TXT').toUpperCase();
      const label = $('#textPreviewLabel', this.body);
      if (label) label.textContent = this.doc.mode === 'preview' ? '编辑' : '预览';
    },

    setMode(mode, announce = true) {
      this.doc.mode = mode === 'preview' ? 'preview' : 'edit';
      const preview = this.doc.mode === 'preview';
      if (this.editorPane) this.editorPane.hidden = preview;
      if (this.previewPane) this.previewPane.hidden = !preview;
      if (preview) this.renderPreview();
      const button = $('[data-text-action="preview"]', this.body);
      button?.classList.toggle('is-active', preview);
      this.updateModeChip();
      if (announce) this.scheduleSave();
    },

    togglePreview() {
      this.setMode(this.doc.mode === 'preview' ? 'edit' : 'preview');
    },

    renderPreview() {
      if (!this.previewPane) return;
      if (/\.(md|markdown)$/i.test(this.doc.name)) {
        this.previewPane.innerHTML = `<div class="text-markdown">${markdownToHTML(this.doc.content)}</div>`;
      } else {
        this.previewPane.innerHTML = `<pre class="text-plain-preview">${escapeHTML(this.doc.content)}</pre>`;
      }
    },

    format(kind) {
      if (!this.area) return;
      const start = this.area.selectionStart;
      const end = this.area.selectionEnd;
      const selected = this.area.value.slice(start, end);
      let before = '';
      let after = '';
      let placeholder = selected || '文本';
      if (kind === 'bold') { before = '**'; after = '**'; }
      else if (kind === 'italic') { before = '*'; after = '*'; }
      else if (kind === 'heading') { before = '## '; after = ''; placeholder = selected || '标题'; }
      else if (kind === 'list') { before = '- '; after = ''; placeholder = selected || '列表项'; }
      else if (kind === 'code') { before = '`'; after = '`'; placeholder = selected || 'code'; }
      else if (kind === 'link') { before = '['; after = '](https://)'; placeholder = selected || '链接文字'; }
      this.area.setRangeText(`${before}${placeholder}${after}`, start, end, 'select');
      this.area.dispatchEvent(new Event('input', { bubbles: true }));
      this.area.focus();
    },

    saveDoc() {
      this.doc.content = this.area?.value ?? this.doc.content;
      this.doc.name = $('#textFileName', this.body)?.value.trim() || this.doc.name;
      this.saveLocal();
      downloadText(this.doc.name, this.doc.content, /\.(md|markdown)$/i.test(this.doc.name) ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
      host?.showToast?.({ title: '文稿已保存', message: `${this.doc.name} 已下载到本地，并保留自动保存。`, icon: 'app-text' });
    },

    scheduleSave() {
      clearTimeout(this.timer);
      const saved = $('#textSavedState', this.body);
      if (saved) saved.innerHTML = '<i></i>正在保存…';
      this.timer = setTimeout(() => {
        this.saveLocal();
        if (saved) saved.innerHTML = '<i></i>已自动保存';
      }, 320);
    },

    saveLocal() {
      saveJSON('aisniper.text.doc.v1', this.doc);
    }
  };

  /* ========================================================================
     Code editor
     ======================================================================== */

  const defaultCodeFiles = {
    'index.html': [
      '<!doctype html>',
      '<html lang="zh-CN">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>AISniper Demo</title>',
      '  <link rel="stylesheet" href="styles.css">',
      '</head>',
      '<body>',
      '  <main class="card">',
      '    <span class="eyebrow">AISNIPER / LOCAL WEB</span>',
      '    <h1>Hello, <em>operator.</em></h1>',
      '    <p>编辑左侧文件，点击“运行”查看真实预览。</p>',
      '    <button id="counter">点击计数 <b>0</b></button>',
      '  </main>',
      '  <script src="app.js"></script>',
      '</body>',
      '</html>'
    ].join('\n'),
    'styles.css': [
      ':root {',
      '  color-scheme: dark;',
      '  --accent: #72e0be;',
      '}',
      '',
      'body {',
      '  margin: 0;',
      '  min-height: 100vh;',
      '  display: grid;',
      '  place-items: center;',
      '  background: radial-gradient(circle at 50% 0%, #16323a, #071018 64%);',
      '  color: #e6f2ec;',
      '  font-family: "PingFang SC", "Segoe UI", sans-serif;',
      '}',
      '',
      '.card {',
      '  width: min(520px, calc(100% - 40px));',
      '  padding: 38px;',
      '  border: 1px solid rgba(130, 220, 200, .22);',
      '  border-radius: 18px;',
      '  background: rgba(8, 20, 24, .68);',
      '  box-shadow: 0 30px 80px rgba(0, 0, 0, .35);',
      '}',
      '',
      '.eyebrow {',
      '  color: var(--accent);',
      '  font: 11px/1.4 monospace;',
      '  letter-spacing: .16em;',
      '}',
      '',
      'h1 {',
      '  margin: 16px 0 8px;',
      '  font-size: 48px;',
      '  line-height: 1;',
      '  letter-spacing: -.05em;',
      '}',
      '',
      'h1 em { color: var(--accent); font-style: normal; }',
      'p { color: #9eb5ae; line-height: 1.7; }',
      'button {',
      '  margin-top: 14px;',
      '  padding: 11px 16px;',
      '  border: 0;',
      '  border-radius: 8px;',
      '  color: #05231b;',
      '  background: var(--accent);',
      '  font: inherit;',
      '  font-weight: 700;',
      '  cursor: pointer;',
      '}'
    ].join('\n'),
    'app.js': [
      "const button = document.querySelector('#counter');",
      'let count = 0;',
      '',
      "button.addEventListener('click', () => {",
      '  count += 1;',
      "  button.querySelector('b').textContent = String(count);",
      "  console.log('counter:', count);",
      '});',
      '',
      "console.log('AISniper local preview ready');"
    ].join('\n'),
    'README.md': [
      '# AISniper Code',
      '',
      '这是一个完全运行在浏览器里的本地代码工作区。',
      '',
      '- 编辑文件会自动保存到当前浏览器',
      '- 运行 HTML / CSS / JavaScript 时使用真实 iframe 预览',
      '- 控制台会捕获预览页面里的 console.log 和错误',
      '- Python 运行时在 Runtime Hub 中模拟',
      '',
      '> 代码只在本地 iframe 中运行，不会上传。'
    ].join('\n'),
    'main.py': [
      'def main():',
      '    print("AISniper Python runtime")',
      '    print("Python 3.12.7 · simulated")',
      '',
      'if __name__ == "__main__":',
      '    main()'
    ].join('\n')
  };

  const code = {
    body: null,
    files: {},
    activePath: 'index.html',
    tabs: ['index.html'],
    timer: null,
    consoleLines: [],
    fileInput: null,
    previewFrame: null,

    init() {
      this.body = $('#codeAppBody');
      if (!this.body) return;
      const saved = loadJSON('aisniper.code.project.v1', null);
      if (saved && saved.files && typeof saved.files === 'object') {
        this.files = { ...defaultCodeFiles, ...saved.files };
        this.activePath = this.files[saved.activePath] ? saved.activePath : 'index.html';
        this.tabs = Array.isArray(saved.tabs) ? saved.tabs.filter((path) => this.files[path]) : [this.activePath];
        if (!this.tabs.length) this.tabs = [this.activePath];
      } else {
        this.files = { ...defaultCodeFiles };
      }
      this.body.innerHTML = `
        <div class="code-app">
          <div class="code-activity">
            <button class="is-active" data-code-activity="files" type="button" aria-label="项目文件"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg></button>
            <button data-code-activity="runtimes" type="button" aria-label="运行环境"><svg viewBox="0 0 24 24"><use href="#app-runtime"></use></svg></button>
            <button data-code-activity="help" type="button" aria-label="快捷帮助"><svg viewBox="0 0 24 24"><use href="#i-info"></use></svg></button>
          </div>
          <aside class="code-sidebar">
            <div class="code-sidebar-head"><div><span class="studio-kicker">EXPLORER</span><b>LOCAL PROJECT</b></div><button class="studio-icon-btn" id="codeNewFileBtn" type="button" aria-label="新建文件"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg></button></div>
            <form class="code-new-file" id="codeNewFileForm" hidden><input id="codeNewFileName" type="text" placeholder="文件名，例如 utils.js" autocomplete="off" spellcheck="false"><button type="submit">创建</button></form>
            <div class="code-tree" id="codeFileTree"></div>
            <div class="code-sidebar-foot"><span class="code-runtime-dot"></span><div><b>Node.js 22</b><small>浏览器 JavaScript · 实时预览</small></div><button data-code-action="runtimes" type="button">管理</button></div>
          </aside>
          <main class="code-main">
            <div class="code-tabs" id="codeTabs"></div>
            <div class="code-toolbar"><span class="code-breadcrumb" id="codeBreadcrumb">local / index.html</span><span class="code-toolbar-spacer"></span><button class="studio-quiet-btn" id="codeImportBtn" type="button"><svg viewBox="0 0 24 24"><use href="#i-folder"></use></svg>导入</button><button class="studio-quiet-btn" id="codeSaveBtn" type="button"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>导出</button><button class="studio-quiet-btn" id="codeRunBtn" type="button"><svg viewBox="0 0 24 24"><use href="#i-play"></use></svg>运行</button></div>
            <div class="code-editor-area">
              <div class="code-gutter" id="codeGutter" aria-hidden="true">1</div>
              <div class="code-code-wrap">
                <pre class="code-highlight" id="codeHighlight" aria-hidden="true"></pre>
                <textarea class="code-input" id="codeInput" spellcheck="false" wrap="off" aria-label="代码编辑区"></textarea>
              </div>
            </div>
            <div class="code-lower">
              <section class="code-console-pane">
                <div class="code-pane-head"><span><i></i>输出 / CONSOLE</span><span class="code-pane-actions"><b id="codeConsoleCount">0</b><button id="codeConsoleClear" type="button">清空</button></span></div>
                <div class="code-console" id="codeConsoleLog"></div>
              </section>
              <section class="code-preview-pane">
                <div class="code-pane-head"><span><i></i>预览 / PREVIEW</span><span class="code-pane-actions"><b id="codePreviewEntry">index.html</b><button id="codePreviewReload" type="button" aria-label="重新运行预览"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg></button></span></div>
                <div class="code-preview-empty" id="codePreviewEmpty"><span>点击“运行”</span><b>真实 iframe 预览会出现在这里</b></div>
                <iframe id="codePreview" title="代码预览" sandbox="allow-scripts allow-forms allow-modals allow-popups"></iframe>
              </section>
            </div>
            <footer class="code-status"><span id="codeLangStatus">JavaScript</span><span id="codeCaretStatus">Ln 1, Col 1</span><span class="code-status-spacer"></span><span id="codeSavedStatus"><i></i>已自动保存</span><span>UTF-8 · LF</span></footer>
          </main>
          <div class="studio-drop-layer" id="codeDrop" hidden><div><span class="studio-drop-icon"><svg viewBox="0 0 24 24"><use href="#i-file"></use></svg></span><b>松开以导入文件</b><small>文本文件会加入当前项目</small></div></div>
          <input id="codeFileInput" type="file" multiple hidden>
        </div>`;
      this.fileInput = $('#codeFileInput', this.body);
      this.textarea = $('#codeInput', this.body);
      this.highlight = $('#codeHighlight', this.body);
      this.gutter = $('#codeGutter', this.body);
      this.previewFrame = $('#codePreview', this.body);
      this.bind();
      this.renderTree();
      this.renderTabs();
      this.renderEditor();
      this.bindMessage();
    },

    bind() {
      this.body.addEventListener('click', (event) => {
        const activity = event.target.closest('[data-code-activity]');
        if (activity) {
          if (activity.dataset.codeActivity === 'runtimes') host?.openApp?.('runtimes');
          else if (activity.dataset.codeActivity === 'help') host?.showToast?.({ title: 'AISniper Code', message: 'Ctrl/Cmd + S 保存，Ctrl/Cmd + Enter 运行，Tab 缩进。', icon: 'app-code' });
          else this.renderTree();
          return;
        }
        if (event.target.closest('[data-code-action="runtimes"]')) { host?.openApp?.('runtimes'); return; }
        if (event.target.closest('#codeNewFileBtn')) {
          const form = $('#codeNewFileForm', this.body);
          form.hidden = !form.hidden;
          if (!form.hidden) $('#codeNewFileName', this.body)?.focus();
          return;
        }
        if (event.target.closest('#codeImportBtn')) { this.fileInput?.click(); return; }
        if (event.target.closest('#codeSaveBtn')) { this.downloadActive(); return; }
        if (event.target.closest('#codeRunBtn')) { this.run(); return; }
        if (event.target.closest('#codeConsoleClear')) { this.clearConsole(); return; }
        if (event.target.closest('#codePreviewReload')) { this.run(); return; }
        const tabClose = event.target.closest('[data-code-tab-close]');
        if (tabClose) { this.closeTab(tabClose.dataset.codeTabClose); return; }
        const tab = event.target.closest('[data-code-tab]');
        if (tab) { this.openFile(tab.dataset.codeTab); return; }
        const remove = event.target.closest('[data-code-file-remove]');
        if (remove) { event.stopPropagation(); this.deleteFile(remove.dataset.codeFileRemove); return; }
        const file = event.target.closest('[data-code-file]');
        if (file) { this.openFile(file.dataset.codeFile); return; }
      });
      $('#codeNewFileForm', this.body)?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.createFile($('#codeNewFileName', this.body)?.value || '');
      });
      this.fileInput?.addEventListener('change', () => {
        this.importFiles(this.fileInput.files);
        this.fileInput.value = '';
      });
      this.textarea?.addEventListener('input', () => this.handleInput());
      this.textarea?.addEventListener('scroll', () => this.syncScroll());
      this.textarea?.addEventListener('keydown', (event) => this.handleKeydown(event));
      this.textarea?.addEventListener('keyup', () => this.updateCaretStatus());
      this.textarea?.addEventListener('click', () => this.updateCaretStatus());
      this.bindDrop(this.body, $('#codeDrop', this.body), (files) => this.importFiles(files));
      $('#codePreviewEntry', this.body).textContent = this.activePath;
    },

    bindDrop(element, overlay, handler) {
      if (!element) return;
      let depth = 0;
      element.addEventListener('dragenter', (event) => { event.preventDefault(); depth += 1; overlay.hidden = false; });
      element.addEventListener('dragover', (event) => event.preventDefault());
      element.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
      element.addEventListener('drop', (event) => {
        event.preventDefault();
        depth = 0;
        overlay.hidden = true;
        handler(event.dataTransfer?.files || []);
      });
    },

    bindMessage() {
      window.addEventListener('message', (event) => {
        if (!this.previewFrame || event.source !== this.previewFrame.contentWindow) return;
        const data = event.data;
        if (!data || data.source !== 'aisniper-studio' || data.kind !== 'console') return;
        this.appendConsole(data.level || 'log', data.args || []);
      });
    },

    open() {
      if (!this.body) this.init();
      this.body?.classList.add('is-ready');
      this.renderTree();
      this.renderTabs();
      this.renderEditor();
      setTimeout(() => this.textarea?.focus(), 120);
    },

    close() {
      this.persist();
    },

    activeFile() {
      return this.files[this.activePath] ?? '';
    },

    languageFor(path) {
      const ext = fileExtension(path);
      return ({
        html: 'HTML', htm: 'HTML', css: 'CSS', js: 'JavaScript', mjs: 'JavaScript', ts: 'TypeScript',
        json: 'JSON', md: 'Markdown', py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby',
        sh: 'Shell', yml: 'YAML', yaml: 'YAML', xml: 'XML', svg: 'SVG'
      })[ext] || (ext ? ext.toUpperCase() : 'Plain Text');
    },

    fileIcon(path) {
      const ext = fileExtension(path);
      if (ext === 'html' || ext === 'htm') return '<>';
      if (ext === 'css') return '#';
      if (['js', 'mjs', 'ts'].includes(ext)) return 'JS';
      if (ext === 'json') return '{}';
      if (ext === 'md') return 'M';
      if (ext === 'py') return 'PY';
      return '·';
    },

    renderTree() {
      if (!this.body) return;
      const tree = $('#codeFileTree', this.body);
      if (!tree) return;
      const paths = Object.keys(this.files).sort((a, b) => a.localeCompare(b, 'zh-CN'));
      tree.innerHTML = paths.map((path) => `
        <div class="code-file-row${path === this.activePath ? ' is-active' : ''}" data-code-file="${escapeHTML(path)}">
          <span class="code-file-icon">${escapeHTML(this.fileIcon(path))}</span>
          <span class="code-file-name">${escapeHTML(path)}</span>
          <button class="code-file-delete" data-code-file-remove="${escapeHTML(path)}" type="button" aria-label="删除 ${escapeHTML(path)}"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button>
        </div>`).join('');
      const chip = $('#codeWindowChip');
      if (chip) chip.textContent = `${this.languageFor(this.activePath)} · 可运行`;
    },

    renderTabs() {
      const tabs = $('#codeTabs', this.body);
      if (!tabs) return;
      tabs.innerHTML = this.tabs.map((path) => `
        <div class="code-tab${path === this.activePath ? ' is-active' : ''}" data-code-tab="${escapeHTML(path)}" role="tab" tabindex="0">
          <span class="code-tab-dot"></span><span>${escapeHTML(path)}</span>
          <button data-code-tab-close="${escapeHTML(path)}" type="button" aria-label="关闭 ${escapeHTML(path)}"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button>
        </div>`).join('');
    },

    renderEditor() {
      if (!this.textarea) return;
      const content = this.activeFile();
      this.textarea.value = content;
      this.highlight.textContent = '';
      this.highlight.innerHTML = highlightCode(content, this.activePath) || ' ';
      this.updateGutter();
      this.syncScroll();
      this.updateCaretStatus();
      this.renderTree();
      this.renderTabs();
      $('#codeBreadcrumb', this.body).textContent = `local / ${this.activePath}`;
      $('#codePreviewEntry', this.body).textContent = this.activePath;
      $('#codeLangStatus', this.body).textContent = this.languageFor(this.activePath);
      $('#codeWindowChip').textContent = `${this.languageFor(this.activePath)} · 可运行`;
    },

    updateGutter() {
      if (!this.gutter) return;
      const count = Math.max(1, this.activeFile().split('\n').length);
      const numbers = [];
      for (let index = 1; index <= count; index += 1) numbers.push(index);
      this.gutter.textContent = numbers.join('\n');
      this.gutter.scrollTop = this.textarea?.scrollTop || 0;
    },

    syncScroll() {
      if (!this.textarea) return;
      if (this.highlight) {
        this.highlight.scrollTop = this.textarea.scrollTop;
        this.highlight.scrollLeft = this.textarea.scrollLeft;
      }
      if (this.gutter) this.gutter.scrollTop = this.textarea.scrollTop;
    },

    handleInput() {
      if (!this.textarea) return;
      this.files[this.activePath] = this.textarea.value;
      this.highlight.innerHTML = highlightCode(this.textarea.value, this.activePath) || ' ';
      this.updateGutter();
      this.syncScroll();
      this.updateCaretStatus();
      this.scheduleSave();
    },

    handleKeydown(event) {
      const textarea = this.textarea;
      if (!textarea) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.persist();
        host?.showToast?.({ title: '代码已保存', message: `${this.activePath} 已保存到本地工作区。`, icon: 'app-code' });
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        this.run();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = textarea.selectionStart;
        textarea.setRangeText('  ', start, textarea.selectionEnd, 'end');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const start = textarea.selectionStart;
        const before = textarea.value.slice(0, start);
        const lines = before.split('\n');
        const currentLine = lines[lines.length - 1];
        const indent = (currentLine.match(/^\s*/) || [''])[0];
        const opens = /[{[(]$/.test(currentLine.trim());
        const nextChar = textarea.value.slice(start, start + 1);
        const extra = opens ? '  ' : '';
        const closing = opens && /^[}\])]$/.test(nextChar);
        const insertion = `\n${indent}${extra}${closing ? `\n${indent}` : ''}`;
        textarea.setRangeText(insertion, start, start, 'end');
        if (closing) textarea.setSelectionRange(start + 1 + indent.length + extra.length, start + 1 + indent.length + extra.length);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      const pairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'", '`': '`' };
      if (pairs[event.key]) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
          event.preventDefault();
          const selected = textarea.value.slice(start, end);
          textarea.setRangeText(`${event.key}${selected}${pairs[event.key]}`, start, end, 'select');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },

    updateCaretStatus() {
      if (!this.textarea) return;
      const before = this.textarea.value.slice(0, this.textarea.selectionStart);
      const lines = before.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      const status = $('#codeCaretStatus', this.body);
      if (status) status.textContent = `Ln ${line}, Col ${column}`;
    },

    scheduleSave() {
      clearTimeout(this.timer);
      const saved = $('#codeSavedStatus', this.body);
      if (saved) saved.innerHTML = '<i></i>正在保存…';
      this.timer = setTimeout(() => {
        this.persist();
        if (saved) saved.innerHTML = '<i></i>已自动保存';
      }, 280);
    },

    persist() {
      if (!this.textarea) return;
      this.files[this.activePath] = this.textarea.value;
      saveJSON('aisniper.code.project.v1', { files: this.files, activePath: this.activePath, tabs: this.tabs });
    },

    openFile(path) {
      if (!Object.prototype.hasOwnProperty.call(this.files, path)) return;
      this.persist();
      this.activePath = path;
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.renderEditor();
    },

    closeTab(path) {
      this.tabs = this.tabs.filter((tab) => tab !== path);
      if (!this.tabs.length) this.tabs = [path];
      if (this.activePath === path) this.activePath = this.tabs[this.tabs.length - 1];
      this.renderEditor();
    },

    createFile(rawName) {
      let name = String(rawName || '').trim().replace(/[\\/:*?"<>|]/g, '');
      if (!name) return;
      if (!fileExtension(name)) name += '.js';
      if (this.files[name]) {
        host?.showToast?.({ title: '文件已存在', message: name, icon: 'app-code' });
        return;
      }
      const ext = fileExtension(name);
      const templates = {
        js: '// New JavaScript file\n', css: '/* New stylesheet */\n', html: '<!doctype html>\n<html>\n<body>\n\n</body>\n</html>', md: '# New document\n', py: '# Python file\n', json: '{\n  \n}\n'
      };
      this.files[name] = templates[ext] || '';
      this.activePath = name;
      this.tabs.push(name);
      const form = $('#codeNewFileForm', this.body);
      if (form) form.hidden = true;
      const input = $('#codeNewFileName', this.body);
      if (input) input.value = '';
      this.renderEditor();
      this.persist();
      host?.showToast?.({ title: '文件已创建', message: name, icon: 'app-code' });
    },

    deleteFile(path) {
      if (!Object.prototype.hasOwnProperty.call(this.files, path)) return;
      if (!window.confirm(`从本地项目删除 ${path}？`)) return;
      delete this.files[path];
      this.tabs = this.tabs.filter((tab) => tab !== path);
      if (!this.tabs.length) this.tabs = [Object.keys(this.files)[0] || 'index.html'];
      if (this.activePath === path) this.activePath = this.tabs[0];
      this.renderEditor();
      this.persist();
    },

    importFiles(fileList) {
      const files = Array.from(fileList || []).filter(isTextFile);
      if (!files.length) {
        host?.showToast?.({ title: '没有可导入的文本文件', message: '请选择 TXT、MD、JS、CSS、HTML 等文件。', icon: 'app-code' });
        return;
      }
      let pending = files.length;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          let name = file.name;
          if (this.files[name]) {
            const ext = fileExtension(name);
            name = `${name.replace(new RegExp(`\\.${ext}$`), '')}-${Date.now() % 1000}.${ext}`;
          }
          this.files[name] = String(reader.result || '');
          this.activePath = name;
          if (!this.tabs.includes(name)) this.tabs.push(name);
          pending -= 1;
          if (!pending) {
            this.renderEditor();
            this.persist();
            host?.showToast?.({ title: '文件已导入', message: `${files.length} 个文本文件已加入项目。`, icon: 'app-code' });
          }
        };
        reader.readAsText(file);
      });
    },

    downloadActive() {
      this.persist();
      downloadText(this.activePath, this.activeFile(), this.activePath.endsWith('.html') ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8');
      host?.showToast?.({ title: '文件已导出', message: this.activePath, icon: 'app-code' });
    },

    appendConsole(level, args) {
      const container = $('#codeConsoleLog', this.body);
      if (!container) return;
      const line = document.createElement('div');
      line.className = `code-console-line is-${level}`;
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      line.innerHTML = `<span class="code-console-time">${time}</span><span class="code-console-message">${escapeHTML(args.join(' '))}</span>`;
      container.appendChild(line);
      container.scrollTop = container.scrollHeight;
      const count = $('#codeConsoleCount', this.body);
      if (count) count.textContent = String(container.children.length);
    },

    clearConsole() {
      const container = $('#codeConsoleLog', this.body);
      if (container) container.replaceChildren();
      const count = $('#codeConsoleCount', this.body);
      if (count) count.textContent = '0';
    },

    run() {
      this.persist();
      this.clearConsole();
      const entry = this.activePath;
      const ext = fileExtension(entry);
      if (ext === 'py') {
        this.appendConsole('info', ['Python 3.12.7 · 本地模拟运行时']);
        this.appendConsole('log', ['$ python3 ' + entry]);
        this.files[entry].split('\n').forEach((line) => {
          const match = line.match(/^\s*print\((['"])(.*?)\1\)/);
          if (match) this.appendConsole('log', [match[2]]);
        });
        this.appendConsole('warn', ['浏览器不会执行任意 Python 代码；请在运行环境中查看模拟版本。']);
      }
      let documentSource;
      try {
        documentSource = buildPreviewDocument(this.files, entry);
      } catch (error) {
        this.appendConsole('error', [error.message]);
        return;
      }
      const previewEmpty = $('#codePreviewEmpty', this.body);
      if (previewEmpty) previewEmpty.hidden = true;
      this.previewFrame.srcdoc = documentSource;
      this.appendConsole('info', [`$ run ${entry}`]);
      $('#codePreviewEntry', this.body).textContent = entry;
      $('#codePreviewEmpty', this.body).hidden = true;
    }
  };

/* ========================================================================
     Runtime hub
     ======================================================================== */

  const runtimeDefaults = [
    { id: 'node', name: 'Node.js', kind: 'language', version: '22.11.0', latest: '24.10.0', path: '/usr/local/bin/node', command: 'node --version', installed: true, running: true, memory: 412, port: '3000', color: '#78d39a', size: '48 MB', description: 'JavaScript / TypeScript 服务端运行时' },
    { id: 'python', name: 'Python', kind: 'language', version: '3.12.7', latest: '3.13.4', path: '/usr/bin/python3', command: 'python3 --version', installed: true, running: true, memory: 186, port: '8000', color: '#f2cf68', size: '96 MB', description: '通用脚本、数据与自动化运行时' },
    { id: 'java', name: 'Java', kind: 'language', version: '21.0.5 LTS', latest: '24.0.2', path: '/opt/java/bin/java', command: 'java --version', installed: true, running: false, memory: 0, port: '8080', color: '#e18768', size: '312 MB', description: 'JVM 与 Spring 服务运行时' },
    { id: 'go', name: 'Go', kind: 'language', version: '1.23.3', latest: '1.25.1', path: '/usr/local/go/bin/go', command: 'go version', installed: true, running: false, memory: 0, port: '9000', color: '#6fd7df', size: '148 MB', description: '静态编译的并发服务语言' },
    { id: 'rust', name: 'Rust', kind: 'language', version: '1.82.0', latest: '1.89.0', path: '/usr/local/bin/rustc', command: 'rustc --version', installed: false, running: false, memory: 0, port: '—', color: '#d7a181', size: '244 MB', description: '高性能系统编程工具链' },
    { id: 'dotnet', name: '.NET', kind: 'language', version: '8.0.404', latest: '9.0.301', path: '/usr/bin/dotnet', command: 'dotnet --version', installed: false, running: false, memory: 0, port: '5000', color: '#aa9bdd', size: '268 MB', description: '跨平台 CLR 与 ASP.NET Core' },
    { id: 'php', name: 'PHP', kind: 'language', version: '8.3.14', latest: '8.4.10', path: '/usr/bin/php', command: 'php --version', installed: false, running: false, memory: 0, port: '8000', color: '#9a8ed3', size: '74 MB', description: 'PHP-FPM 与传统 Web 应用' },
    { id: 'ruby', name: 'Ruby', kind: 'language', version: '3.3.6', latest: '3.4.5', path: '/usr/bin/ruby', command: 'ruby --version', installed: false, running: false, memory: 0, port: '4567', color: '#de776f', size: '66 MB', description: 'Ruby 与 Rails 运行时' },
    { id: 'deno', name: 'Deno', kind: 'language', version: '2.0.6', latest: '2.4.0', path: '/usr/local/bin/deno', command: 'deno --version', installed: false, running: false, memory: 0, port: '8000', color: '#b7d8ce', size: '58 MB', description: '安全优先的 JavaScript 运行时' },
    { id: 'bun', name: 'Bun', kind: 'language', version: '1.1.38', latest: '1.2.19', path: '/usr/local/bin/bun', command: 'bun --version', installed: false, running: false, memory: 0, port: '3000', color: '#f0d8b3', size: '52 MB', description: '快速 JavaScript 运行时与包管理器' },
    { id: 'gcc', name: 'GCC', kind: 'language', version: '13.2.0', latest: '14.3.0', path: '/usr/bin/gcc', command: 'gcc --version', installed: true, running: false, memory: 0, port: '—', color: '#b8c5d1', size: '184 MB', description: 'C / C++ 编译工具链' },
    { id: 'docker', name: 'Docker', kind: 'container', version: '27.3.1', latest: '28.1.1', path: '/usr/bin/docker', command: 'docker --version', installed: true, running: true, memory: 928, port: '2375', color: '#70b8f2', size: '412 MB', description: '本地容器运行时与镜像服务' },
    { id: 'nginx', name: 'Nginx', kind: 'server', version: '1.26.2', latest: '1.29.0', path: '/usr/sbin/nginx', command: 'nginx -v', installed: true, running: true, memory: 38, port: '80 / 443', color: '#79d2a8', size: '22 MB', description: 'AISniper edge 反向代理' },
    { id: 'redis', name: 'Redis', kind: 'server', version: '7.4.1', latest: '8.0.3', path: '/usr/bin/redis-server', command: 'redis-server --version', installed: true, running: true, memory: 112, port: '6379', color: '#ef796c', size: '18 MB', description: '内存缓存与消息中间件' },
    { id: 'mysql', name: 'MySQL', kind: 'server', version: '8.4.3', latest: '9.1.0', path: '/usr/sbin/mysqld', command: 'mysql --version', installed: false, running: false, memory: 0, port: '3306', color: '#e1b06d', size: '186 MB', description: '关系型数据库服务' },
    { id: 'postgres', name: 'PostgreSQL', kind: 'server', version: '17.1', latest: '18.0', path: '/usr/bin/postgres', command: 'psql --version', installed: false, running: false, memory: 0, port: '5432', color: '#7fa8d8', size: '142 MB', description: '关系型数据库与扩展生态' }
  ];

  const runtimes = {
    body: null,
    items: [],
    env: [],
    logs: [],
    filter: 'all',
    search: '',
    timers: new Map(),

    init() {
      this.body = $('#runtimeAppBody');
      if (!this.body) return;
      const saved = loadJSON('aisniper.runtimes.v1', {});
      const savedItems = Array.isArray(saved.items) ? saved.items : [];
      this.items = runtimeDefaults.map((base) => {
        const state = savedItems.find((item) => item.id === base.id);
        return state ? { ...base, installed: Boolean(state.installed), running: Boolean(state.running), version: state.version || base.version, memory: Number(state.memory) || 0 } : { ...base };
      });
      this.env = Array.isArray(saved.env) && saved.env.length ? saved.env : [
        { key: 'PATH', value: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' },
        { key: 'NODE_ENV', value: 'development' },
        { key: 'PYTHONPATH', value: '/workspace' },
        { key: 'JAVA_HOME', value: '/opt/java' }
      ];
      this.logs = [{ time: new Date(), level: 'info', text: 'Runtime Hub 已连接本地 AISniper 开发环境。' }];
      this.body.innerHTML = `
        <div class="runtime-app">
          <header class="runtime-head"><div><span class="studio-kicker">LOCAL STACK · SANDBOXED</span><h1>运行环境</h1><p>管理本地语言、服务器与容器运行时。所有进程都在 AISniperOS 中模拟。</p></div><div class="runtime-head-actions"><button class="studio-quiet-btn" id="runtimeCheckBtn" type="button"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>检查更新</button><button class="studio-quiet-btn" id="runtimeCodeBtn" type="button"><svg viewBox="0 0 24 24"><use href="#app-code"></use></svg>打开 Code</button><button class="studio-icon-btn" id="runtimeTerminalBtn" type="button" aria-label="打开终端"><svg viewBox="0 0 24 24"><use href="#app-terminal"></use></svg></button></div></header>
          <section class="runtime-summary" id="runtimeSummary"></section>
          <div class="runtime-toolbar"><div class="runtime-filters" role="group" aria-label="运行时分类"><button class="is-active" data-runtime-filter="all" type="button">全部</button><button data-runtime-filter="language" type="button">语言</button><button data-runtime-filter="server" type="button">服务</button><button data-runtime-filter="container" type="button">容器</button></div><label class="studio-search"><svg viewBox="0 0 24 24"><use href="#i-search"></use></svg><input id="runtimeSearch" type="search" placeholder="搜索运行时" aria-label="搜索运行时"></label></div>
          <div class="runtime-layout"><main class="runtime-grid" id="runtimeGrid"></main><aside class="runtime-aside"><section class="runtime-panel runtime-env-panel"><div class="studio-section-head"><div><span class="studio-kicker">ENVIRONMENT</span><h3>环境变量</h3></div><button class="studio-icon-btn" id="runtimeAddEnvBtn" type="button" aria-label="添加环境变量"><svg viewBox="0 0 24 24"><use href="#i-plus"></use></svg></button></div><form class="runtime-env-form" id="runtimeEnvForm" hidden><input id="runtimeEnvKey" type="text" placeholder="KEY" spellcheck="false"><input id="runtimeEnvValue" type="text" placeholder="value" spellcheck="false"><button type="submit">添加</button></form><div class="runtime-env-list" id="runtimeEnvList"></div></section><section class="runtime-panel runtime-log-panel"><div class="studio-section-head"><div><span class="studio-kicker">EVENTS</span><h3>运行日志</h3></div><button class="studio-quiet-btn" id="runtimeClearLogs" type="button">清空</button></div><div class="runtime-log-list" id="runtimeLogList"></div></section></aside></div>
          <footer class="runtime-foot"><span><i></i>本地模拟运行时</span><span>端口绑定仅在本机</span><span class="runtime-foot-spacer"></span><span>AISniper Runtime Hub 26.8</span></footer>
        </div>`;
      this.bind();
      this.render();
    },

    bind() {
      this.body.addEventListener('click', (event) => {
        const filter = event.target.closest('[data-runtime-filter]');
        if (filter) {
          this.filter = filter.dataset.runtimeFilter;
          $$('[data-runtime-filter]', this.body).forEach((button) => button.classList.toggle('is-active', button === filter));
          this.renderGrid();
          return;
        }
        if (event.target.closest('#runtimeCheckBtn')) { this.checkUpdates(); return; }
        if (event.target.closest('#runtimeCodeBtn')) { host?.openApp?.('code'); return; }
        if (event.target.closest('#runtimeTerminalBtn')) { host?.openTerminal?.('runtimes'); return; }
        if (event.target.closest('#runtimeAddEnvBtn')) {
          const form = $('#runtimeEnvForm', this.body);
          form.hidden = !form.hidden;
          if (!form.hidden) $('#runtimeEnvKey', this.body)?.focus();
          return;
        }
        if (event.target.closest('#runtimeClearLogs')) { this.logs = []; this.renderLogs(); return; }
        const removeEnv = event.target.closest('[data-runtime-env-remove]');
        if (removeEnv) {
          this.env = this.env.filter((item) => item.key !== removeEnv.dataset.runtimeEnvRemove);
          this.renderEnv();
          this.save();
          return;
        }
        const install = event.target.closest('[data-runtime-install]');
        if (install) { this.install(install.dataset.runtimeInstall); return; }
        const toggle = event.target.closest('[data-runtime-toggle]');
        if (toggle) { this.toggle(toggle.dataset.runtimeToggle); return; }
        const terminal = event.target.closest('[data-runtime-terminal]');
        if (terminal) {
          const item = this.items.find((entry) => entry.id === terminal.dataset.runtimeTerminal);
          if (item) host?.openTerminal?.(item.command);
          return;
        }
        const code = event.target.closest('[data-runtime-code]');
        if (code) host?.openApp?.('code');
      });
      $('#runtimeEnvForm', this.body)?.addEventListener('submit', (event) => {
        event.preventDefault();
        const key = $('#runtimeEnvKey', this.body)?.value.trim();
        const value = $('#runtimeEnvValue', this.body)?.value || '';
        if (!key) return;
        this.env = this.env.filter((item) => item.key !== key);
        this.env.push({ key, value });
        this.renderEnv();
        this.save();
        event.target.hidden = true;
        event.target.reset();
        this.log('info', `已设置环境变量 ${key}`);
      });
      $('#runtimeSearch', this.body)?.addEventListener('input', (event) => {
        this.search = event.target.value.trim().toLowerCase();
        this.renderGrid();
      });
    },

    open() {
      if (!this.body) this.init();
      this.body?.classList.add('is-ready');
      this.render();
    },

    close() {},

    log(level, text) {
      this.logs.unshift({ time: new Date(), level, text });
      this.logs = this.logs.slice(0, 48);
      this.renderLogs();
    },

    save() {
      saveJSON('aisniper.runtimes.v1', {
        items: this.items.map(({ id, installed, running, version, memory }) => ({ id, installed, running, version, memory })),
        env: this.env
      });
    },

    render() {
      this.renderSummary();
      this.renderGrid();
      this.renderEnv();
      this.renderLogs();
    },

    renderSummary() {
      const box = $('#runtimeSummary', this.body);
      if (!box) return;
      const installed = this.items.filter((item) => item.installed).length;
      const running = this.items.filter((item) => item.running).length;
      const memory = this.items.reduce((sum, item) => sum + (item.running ? item.memory : 0), 0);
      const packages = this.items.reduce((sum, item) => sum + (item.installed ? 1 : 0), 0) * 14 + 38;
      box.innerHTML = `
        <div><span>已安装</span><b>${installed}<small> / ${this.items.length}</small></b><i>语言、服务与容器</i></div>
        <div><span>运行中</span><b>${running}<small> 个进程</small></b><i class="is-online"><em></em>本地守护进程在线</i></div>
        <div><span>内存占用</span><b>${memory ? formatBytes(memory * 1024 * 1024) : '0 MB'}</b><i>运行时进程合计</i></div>
        <div><span>包缓存</span><b>${packages}<small> 项</small></b><i>共享 npm / pip / Maven 缓存</i></div>`;
    },

    renderGrid() {
      const grid = $('#runtimeGrid', this.body);
      if (!grid) return;
      const visible = this.items.filter((item) => (this.filter === 'all' || item.kind === this.filter) && (!this.search || `${item.name} ${item.description} ${item.path} ${item.version}`.toLowerCase().includes(this.search)));
      if (!visible.length) {
        grid.innerHTML = '<div class="runtime-empty"><b>没有匹配的运行时</b><span>换一个分类或搜索词。</span></div>';
        return;
      }
      grid.innerHTML = visible.map((item) => {
        const busy = this.timers.has(item.id);
        const status = busy ? `正在${item.installAction === '更新' ? '更新' : '安装'}… ${item.progress || 0}%` : item.running ? '运行中' : item.installed ? '已安装' : '未安装';
        return `
          <article class="runtime-card${item.running ? ' is-running' : ''}${item.installed ? '' : ' is-missing'}" style="--runtime-color:${item.color}">
            <header><span class="runtime-icon">${escapeHTML(item.name.slice(0, 2).toUpperCase())}</span><div><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.description)}</small></div><span class="runtime-status">${busy ? '<i class="is-busy"></i>' : `<i class="${item.running ? 'is-online' : ''}"></i>`}${escapeHTML(status)}</span></header>
            <div class="runtime-meta"><span>版本 <b>${escapeHTML(item.version)}</b></span><span>路径 <b>${escapeHTML(item.path)}</b></span><span>端口 <b>${escapeHTML(item.port)}</b></span><span>占用 <b>${item.running ? formatBytes(item.memory * 1024 * 1024) : '—'}</b></span></div>
            ${busy ? `<div class="runtime-progress"><i style="width:${item.progress || 0}%"></i></div>` : ''}
            <footer><button class="runtime-main-btn" data-runtime-toggle="${item.id}" type="button" ${busy ? 'disabled' : ''}>${item.running ? '停止' : item.installed ? '启动' : '安装'}</button><button class="runtime-link-btn" data-runtime-install="${item.id}" type="button" ${busy ? 'disabled' : ''}>${item.installed ? '更新' : '安装'}</button><button class="runtime-link-btn" data-runtime-terminal="${item.id}" type="button">终端</button><span class="runtime-size">${escapeHTML(item.size)}</span></footer>
          </article>`;
      }).join('');
    },

    renderEnv() {
      const list = $('#runtimeEnvList', this.body);
      if (!list) return;
      list.innerHTML = this.env.map((item) => `
        <div class="runtime-env-row"><code>${escapeHTML(item.key)}</code><span>${escapeHTML(item.value)}</span><button data-runtime-env-remove="${escapeHTML(item.key)}" type="button" aria-label="删除 ${escapeHTML(item.key)}"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></div>`).join('') || '<div class="runtime-empty-line">没有环境变量。</div>';
    },

    renderLogs() {
      const list = $('#runtimeLogList', this.body);
      if (!list) return;
      list.innerHTML = this.logs.map((entry) => `<div class="runtime-log is-${entry.level}"><time>${entry.time.toLocaleTimeString('zh-CN', { hour12: false })}</time><span>${escapeHTML(entry.text)}</span></div>`).join('') || '<div class="runtime-empty-line">暂无事件。</div>';
    },

    install(id) {
      const item = this.items.find((entry) => entry.id === id);
      if (!item || this.timers.has(id)) return;
      const action = item.installed ? '更新' : '安装';
      item.installAction = action;
      item.progress = 0;
      this.log('info', `${action} ${item.name} ${item.latest}…`);
      this.timers.set(id, true);
      this.renderGrid();
      const timer = setInterval(() => {
        item.progress = Math.min(100, (item.progress || 0) + 7 + Math.random() * 12);
        this.updateCardProgress(item);
        if (item.progress >= 100) {
          clearInterval(timer);
          this.timers.delete(id);
          item.installed = true;
          item.version = item.latest;
          item.progress = 0;
          this.log('ok', `${item.name} ${item.version} ${action}完成。`);
          this.save();
          this.renderSummary();
          this.renderGrid();
          host?.showToast?.({ title: `${item.name} 已${action}`, message: `${item.version} · ${item.path}`, icon: 'app-runtime' });
        }
      }, 90);
      this.timers.set(id, timer);
    },

    updateCardProgress(item) {
      const card = this.body?.querySelector(`[data-runtime-install="${item.id}"]`)?.closest('.runtime-card');
      if (!card) return;
      const progress = card.querySelector('.runtime-progress i');
      if (progress) progress.style.width = `${item.progress}%`;
      const status = card.querySelector('.runtime-status');
      if (status) status.innerHTML = `<i class="is-busy"></i>正在${item.installAction || '安装'}… ${Math.floor(item.progress)}%`;
    },

    toggle(id) {
      const item = this.items.find((entry) => entry.id === id);
      if (!item) return;
      if (!item.installed) { this.install(id); return; }
      item.running = !item.running;
      item.memory = item.running ? Math.round(70 + Math.random() * 280) : 0;
      this.log(item.running ? 'ok' : 'warn', `${item.name} ${item.running ? '已启动 · 端口 ' + item.port : '已停止'}`);
      this.save();
      this.renderSummary();
      this.renderGrid();
      host?.showToast?.({ title: `${item.name} ${item.running ? '已启动' : '已停止'}`, message: item.running ? `监听 ${item.port}` : '进程已退出', icon: 'app-runtime' });
    },

    checkUpdates() {
      this.log('info', '正在检查语言与运行时更新…');
      const updatable = this.items.filter((item) => item.installed && item.version !== item.latest);
      setTimeout(() => {
        this.log('ok', updatable.length ? `发现 ${updatable.length} 个可更新运行时。` : '全部运行时均为最新版本。');
        host?.showToast?.({ title: '检查完成', message: updatable.length ? `${updatable.length} 个更新可用。` : '所有运行时均为最新。', icon: 'app-runtime' });
      }, 650);
    }
  };

  /* ========================================================================
     Init
     ======================================================================== */

  const api = {
    openMusic(options = {}) { if (!music.body) music.init(); music.open(options); },
    closeMusic() { music.close(); },
    openCinema(options = {}) { if (!cinema.body) cinema.init(); cinema.open(options); },
    closeCinema() { cinema.close(); },
    openText(options = {}) { if (!text.body) text.init(); text.open(options); },
    closeText() { text.close(); },
    openCode(options = {}) { if (!code.body) code.init(); code.open(options); },
    closeCode() { code.close(); },
    openRuntimes(options = {}) { if (!runtimes.body) runtimes.init(); runtimes.open(options); },
    closeRuntimes() { runtimes.close(); }
  };

  function init(dependencies = {}) {
    if (initialized) return api;
    initialized = true;
    host = dependencies || {};
    music.init();
    cinema.init();
    text.init();
    code.init();
    runtimes.init();
    return api;
  }

  window.AISniperStudio = {
    init,
    utils: {
      formatTime,
      formatBytes,
      fileExtension,
      isAudioFile,
      isVideoFile,
      isTextFile,
      markdownToHTML,
      highlightCode,
      buildPreviewDocument
    }
  };
})();
