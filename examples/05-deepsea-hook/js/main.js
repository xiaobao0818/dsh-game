/* 入口：创建 App，绑定启动遮罩；window.__game 供调试与自动化测试使用 */
import { App } from './app.js';
import { CONTENT } from './content.js';
import { createRule } from './rules/hook.js';

const canvas = document.getElementById('game');
const app = new App(canvas, CONTENT, createRule);
app.mount();
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
