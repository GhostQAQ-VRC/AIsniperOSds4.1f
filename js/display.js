/* ==========================================================================
   AISniperOS — display and font scaling
   Applies independent OS and game HUD font multipliers. Canvas text is
   scaled without touching every game renderer.
   ========================================================================== */

(() => {
  'use strict';

  const UI_KEY = 'aisniperos.fontScale.v1';
  const GAME_KEY = 'aisniperos.gameFontScale.v1';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function loadScale(key, fallback) {
    try {
      const value = parseFloat(localStorage.getItem(key));
      if (Number.isFinite(value)) return clamp(value, 0.8, 2.2);
    } catch (error) { /* storage can be unavailable */ }
    return fallback;
  }

  let uiScale = loadScale(UI_KEY, 1);
  let gameScale = loadScale(GAME_KEY, 1.5);
  let canvasScale = uiScale * gameScale;

  function apply() {
    const root = document.documentElement;
    root.style.setProperty('--ui-font-scale', String(uiScale));
    root.style.setProperty('--game-font-scale', String(gameScale));
    root.dataset.fontScale = String(uiScale);
    root.dataset.gameFontScale = String(gameScale);
    (document.querySelectorAll?.('.game-window, .steam-game-window, .steam-utility-window') || []).forEach((element) => {
      element.style.setProperty('--font-scale', String(uiScale * gameScale));
    });
  }

  apply();

  /* Canvas renderers set ctx.font directly. Scale the assignment instead of
     rewriting hundreds of draw calls, so every mini game and HUD follows the
     same display setting. */
  if (window.CanvasRenderingContext2D) {
    const proto = window.CanvasRenderingContext2D.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'font');
    if (descriptor?.get && descriptor?.set && !proto.__aisniperFontScalePatched) {
      Object.defineProperty(proto, 'font', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() { return descriptor.get.call(this); },
        set(value) {
          const scaled = String(value).replace(/(\d*\.?\d+)px/, (match, size) => {
            const next = Math.max(1, parseFloat(size) * canvasScale);
            return `${next.toFixed(2)}px`;
          });
          descriptor.set.call(this, scaled);
        }
      });
      Object.defineProperty(proto, '__aisniperFontScalePatched', { value: true, configurable: true });
    }
  }

  window.AISniperDisplay = {
    getScales() { return { ui: uiScale, game: gameScale, canvas: canvasScale }; },
    setScales(nextUi, nextGame, options = {}) {
      const previousUi = uiScale;
      const previousGame = gameScale;
      if (Number.isFinite(Number(nextUi))) uiScale = clamp(Number(nextUi), 0.8, 2.2);
      if (Number.isFinite(Number(nextGame))) gameScale = clamp(Number(nextGame), 0.8, 2.2);
      canvasScale = uiScale * gameScale;
      apply();
      if (options.persist !== false) {
        try {
          if (uiScale !== previousUi) localStorage.setItem(UI_KEY, String(uiScale));
          if (gameScale !== previousGame) localStorage.setItem(GAME_KEY, String(gameScale));
        } catch (error) { /* storage can be unavailable */ }
      }
      return this.getScales();
    },
    refresh() {
      const root = document.documentElement;
      root.style.setProperty('--ui-font-scale', String(uiScale));
      root.style.setProperty('--game-font-scale', String(gameScale));
    }
  };
})();
