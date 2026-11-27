// @ts-nocheck
/**
 * GameRoot —— Cocos 宿主：创建 CanvasSurface（Canvas2D→Graphics/Label 桥），
 * 启动同一套游戏逻辑（bootGame），把 Cocos 的触摸/鼠标/键盘事件转发给游戏，
 * 每帧驱动 app.tickExternal(dt) 并刷新绘制。
 */
import { _decorator, Component, Node, UITransform, Vec3, input, Input, KeyCode, profiler, sys } from 'cc';
import { CanvasSurface, makeFakeCanvas } from './CanvasSurface';
import { bootGame } from './game/main';
import { CONTENT } from './game/content';

const { ccclass } = _decorator;
const PORTRAIT = (CONTENT.orientation || 'landscape') === 'portrait';
const W = PORTRAIT ? 720 : 1280;
const H = PORTRAIT ? 1280 : 720;

@ccclass('GameRoot')
export class GameRoot extends Component {
  app: any = null;
  surface: CanvasSurface | null = null;
  ready = false;
  frames = 0;
  fpsT = 0;
  fps = 0;

  onLoad() {
    try { profiler && (profiler as any).hideStats && (profiler as any).hideStats(); } catch (e) { /* release 构建无 profiler */ }
    // Cocos 原生平台没有 DOM localStorage，用引擎的 sys.localStorage 兜底
    try {
      if (typeof globalThis !== 'undefined' && !(globalThis as any).localStorage && (sys as any).localStorage) {
        (globalThis as any).localStorage = (sys as any).localStorage;
      }
    } catch (e) { /* ignore */ }
  }

  start() {
    const surface = new CanvasSurface(this.node, W, H);
    this.surface = surface;
    const canvas = makeFakeCanvas(surface, W, H);
    this.app = bootGame(canvas, { externalLoop: true, fixedViewport: true });
    // 调试/自动化接缝
    const g: any = (typeof window !== 'undefined' ? window : globalThis) as any;
    g.__game = this.app;
    g.__gs = { surface, W, H, version: 1 };
    this.bindInput();
    this.ready = true;
    console.log('[GS] ready', CONTENT.title, W + 'x' + H);
  }

  private toDesign(e: any): [number, number] {
    const ui = e.getUILocation();
    const uiT = this.node.getComponent(UITransform) as UITransform;
    const v = uiT.convertToNodeSpaceAR(new Vec3(ui.x, ui.y, 0));
    const cs = uiT.contentSize;
    return [((v.x / (cs.width || W)) + 0.5) * W, (0.5 - (v.y / (cs.height || H))) * H];
  }

  private bindInput() {
    const down = (e: any) => { if (!this.app) return; const [x, y] = this.toDesign(e); this.app.onDown(x, y); };
    const move = (e: any) => { if (!this.app) return; const [x, y] = this.toDesign(e); if (this.app.scene === 'play' && !this.app.paused && this.app.rule) this.app.rule.pointer('move', x, y); };
    const up = (e: any) => { if (!this.app) return; const [x, y] = this.toDesign(e); if (this.app.scene === 'play' && !this.app.paused && this.app.rule) this.app.rule.pointer('up', x, y); };
    this.node.on(Node.EventType.TOUCH_START, down, this);
    this.node.on(Node.EventType.TOUCH_MOVE, move, this);
    this.node.on(Node.EventType.TOUCH_END, up, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, up, this);
    this.node.on(Node.EventType.MOUSE_DOWN, down, this);
    this.node.on(Node.EventType.MOUSE_MOVE, move, this);
    this.node.on(Node.EventType.MOUSE_UP, up, this);
    input.on(Input.EventType.KEY_DOWN, (e: any) => {
      if (!this.app || !this.app.onKey) return;
      const k = e.keyCode;
      let key = '';
      if (k === KeyCode.ESCAPE) key = 'Escape';
      else if (k === KeyCode.SPACE) key = ' ';
      else if (k === KeyCode.ENTER) key = 'Enter';
      else if (k === KeyCode.BACKSPACE) key = 'Backspace';
      else if (k >= KeyCode.KEY_A && k <= KeyCode.KEY_Z) key = String.fromCharCode(k).toLowerCase();
      if (key) this.app.onKey(key);
    }, this);
  }

  update(dt: number) {
    if (!this.app || !this.surface) return;
    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { this.fps = Math.round(this.frames / this.fpsT); this.frames = 0; this.fpsT = 0; }
    this.surface.beginFrame();
    this.app.tickExternal(dt);
    this.surface.flush();
  }
}
