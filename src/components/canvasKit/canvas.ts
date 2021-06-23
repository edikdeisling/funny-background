import CanvasKitInit, { Canvas, CanvasKit, Surface } from 'canvaskit-wasm';
import wasm from 'canvaskit-wasm/bin/canvaskit.wasm?url';
import { throttle } from './helpers';

type DrawCallback = (canvas: Canvas, duration: number) => void;

class AppCanvas {
  drawCallback: DrawCallback;
  surface: Surface;
  resizeObserver: ResizeObserver;
  stopMouseMove?: () => void;
  frame: number;
  drawTime: number;

  static async init(canvasEl: HTMLCanvasElement) {
    return new AppCanvas(canvasEl, await CanvasKitInit({
      locateFile: () => wasm,
    }));
  }

  constructor(public canvasEl: HTMLCanvasElement, public canvasKit: CanvasKit) {
    this.setSize();
    this.setResizeObserver();
    this.setSurface();
  }

  get width() {
    return this.canvasEl.width;
  }

  get height() {
    return this.canvasEl.height;
  }

  setSurface() {
    this.surface = this.canvasKit.MakeCanvasSurface(this.canvasEl)!;
  }

  setSize() {
    const element = this.canvasEl.parentElement!;
    this.updateSize(element.clientWidth, element.clientHeight);
  }

  setResizeObserver() {
    const setSize = throttle(([{ target }]) => {
      this.updateSize(target.clientWidth, target.clientHeight);
      this.setSurface();
    });

    this.resizeObserver = new ResizeObserver(setSize);
    this.resizeObserver.observe(this.canvasEl.parentElement!);
  }

  updateSize(width: number, height: number) {
    this.canvasEl.width = width;
    this.canvasEl.height = height;
  }

  onMouseMove(cb: (x: number, y: number) => void) {
    const handler = throttle((event: MouseEvent) => {
      const { x, y } = this.canvasEl.getBoundingClientRect();

      cb(event.clientX - x, event.clientY - y);
    });

    this.canvasEl.addEventListener('mousemove', handler);

    this.stopMouseMove = () => this.canvasEl.removeEventListener('mousemove', handler);
  }

  draw(canvas: Canvas) {
    const now = new Date().getTime();

    canvas.clear(this.canvasKit.WHITE);
    this.drawCallback(canvas, now - this.drawTime);
    this.frame = this.surface.requestAnimationFrame(this.draw.bind(this));
  };

  runDraw(cb: DrawCallback) {
    this.drawCallback = cb;
    this.drawTime = new Date().getTime();
    this.frame = this.surface.requestAnimationFrame(this.draw.bind(this));
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    if (this.stopMouseMove) {
      this.stopMouseMove();
      this.stopMouseMove = undefined;
    }
  }
}

export { AppCanvas };
