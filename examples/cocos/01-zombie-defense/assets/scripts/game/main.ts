// @ts-nocheck
/* 入口：创建 App；HTML 下自动绑定启动遮罩，Cocos/其它宿主通过 bootGame 复用 */
import { App } from './app';
import { CONTENT } from './content';
import { createRule } from './rules/horde';

/** 创建一个游戏实例（宿主无关）。canvas 可为真实 canvas 或 Cocos 宿主的固定视口代理 */
export function bootGame(canvas, opts = {}) {
  const app = new App(canvas, CONTENT, createRule, opts);
  app.mount();
  return app;
}

/** HTML/DOM 环境入口：找 #game 画布、显示启动遮罩、暴露 window.__game */
export function bootDom() {
  if (typeof document === 'undefined') return null;
  const canvas = document.getElementById('game');
  if (!canvas) return null;
  const app = bootGame(canvas);
  window.__game = app;
  const boot = document.getElementById('boot');
  function hideBoot() {
    if (boot && boot.parentNode) {
      boot.classList.add('hide');
      setTimeout(() => { try { boot.remove(); } catch (e) {} }, 420);
    }
    app.begin();
  }
  if (boot) boot.addEventListener('pointerdown', hideBoot, { once: true });
  window.addEventListener('pointerdown', () => app.begin(), { once: true });
  return app;
}

// 仅在存在 #game 的 DOM 页面自动启动（单文件/工程版）；Cocos 内由宿主调用 bootGame
if (typeof document !== 'undefined' && document.getElementById('game')) bootDom();
