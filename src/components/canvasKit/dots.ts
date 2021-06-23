import { Canvas, Paint, RRect } from 'canvaskit-wasm';
import { AppCanvas } from './canvas';

class Dot {
  public paint: Paint;
  public rect: RRect;
  public x: number;
  public y: number;
  public startDuration = 0;
  public startX: number;
  public targetX: number;
  public startY: number;
  public targetY: number;
  public targetTime: number;

  constructor(private canvas: AppCanvas) {
    this.setPaint();
  }

  setPaint() {
    const { canvasKit } = this.canvas;

    this.paint = new canvasKit.Paint();
    this.paint.setColor(canvasKit.Color4f(0, 0, 0, 1.0));
    this.paint.setStyle(canvasKit.PaintStyle.Fill);
    this.paint.setAntiAlias(true);
  }

  setRect(x: number, y: number) {
    const { canvasKit } = this.canvas;
    const size = 2;

    this.x = x;
    this.y = y;
    this.rect = canvasKit.RRectXY(canvasKit.XYWHRect(x, y, size, size), size / 2, size / 2);

    return this;
  }

  setTargetParams(duration: number) {
    const side = Math.floor(Math.random() * 5);
    const { width, height } = this.canvas;

    this.startX = this.x;
    this.startY = this.y;
    this.startDuration = duration;
    this.targetX = side === 4 ? 0 : side === 1 ? width : Math.random() * width;
    this.targetY = side === 0 ? 0 : side === 3 ? height : Math.random() * height;

    const targetLength = ((this.targetX - this.startX) ** 2 + (this.targetY - this.startY) ** 2) ** 0.5;
    this.targetTime = targetLength * 16.7; // 1px per 16.7ms (per frame)
  }

  nextStep(duration: number) {
    if (this.targetTime === undefined || this.startDuration + this.targetTime <= duration) {
      this.setTargetParams(duration);
    }

    const timePosition = (duration - this.startDuration) / this.targetTime;
    const deltaX = (this.targetX - this.startX) * timePosition;
    const deltaY = (this.targetY - this.startY) * timePosition;

    this.setRect(this.startX + deltaX, this.startY + deltaY);
  }
}

class Dots {
  dots: Dot[];

  constructor(canvas: AppCanvas) {
    this.setDots(canvas);
  }

  setDots(canvas: AppCanvas) {
    const countDots = Math.round((canvas.height * canvas.width) ** 0.35);
    this.dots = [];

    for (let index = 0; index < countDots; index++) {
      const dot = new Dot(canvas);

      dot.setRect(Math.random() * canvas.width, Math.random() * canvas.height);

      this.dots.push(dot);
    }
  }

  getClosestDot(x: number, y: number, searchRadius: number) {
    let closestDot: Dot | undefined;
    let minLength = 0;

    for (const dot of this.dots) {
      const deltaX = Math.abs(dot.x - x);
      const deltaY = Math.abs(dot.y - y);

      if (deltaX < searchRadius && deltaY < searchRadius) {
        const length = (deltaX ** 2 + deltaY ** 2) ** 0.5;

        if (!closestDot || length < minLength) {
          closestDot = dot;
          minLength = length;
        }
      }
    }

    return closestDot;
  }

  getClosestDots(closestDot: Dot, searchRadius: number) {
    const angle = new Map<Dot, number>();
    let result: Dot[] = [];

    for (const dot of this.dots) {
      if (dot === closestDot) {
        continue;
      }

      const deltaX = closestDot.x - dot.x;
      const deltaY = closestDot.y - dot.y;

      if (Math.abs(deltaX) < searchRadius && Math.abs(deltaY) < searchRadius) {
        result.push(dot);
        angle.set(dot, Math.atan2(deltaY, deltaX));
      }
    }

    result.sort((a, b) => angle.get(a)! > angle.get(b)! ? 1 : -1);

    return result;
  }

  nextStep(duration: number) {
    for (const dot of this.dots) {
      dot.nextStep(duration);
    }
  }

  draw(canvas: Canvas) {
    for (const dot of this.dots) {
      canvas.drawRRect(dot.rect, dot.paint);
    }
  }
}

export { Dot, Dots };
