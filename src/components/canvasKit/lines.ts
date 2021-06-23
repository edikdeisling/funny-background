import { Canvas, Paint, Path } from 'canvaskit-wasm';
import { AppCanvas } from './canvas';
import { Dot, Dots } from './dots';

class Line {
  public paint: Paint;
  public path: Path;
  public from: Dot;
  public to: Dot;

  constructor(private canvas: AppCanvas) {
    this.setPaint();
  }

  setPaint() {
    const { canvasKit } = this.canvas;

    this.paint = new canvasKit.Paint();
    this.paint.setColor(canvasKit.Color4f(0.5, 0, 0, 1.0));
    this.paint.setStyle(canvasKit.PaintStyle.Stroke);
    this.paint.setStrokeWidth(1);
    this.paint.setAntiAlias(true);
  }

  setPath(from: Dot, to: Dot) {
    const { canvasKit } = this.canvas;

    this.from = from;
    this.to = to;
    this.path = new canvasKit.Path();
    this.path.moveTo(this.from.x, this.from.y);
    this.path.lineTo(this.to.x, this.to.y);
  }
}

class Lines {
  private searchRadius: number;
  private mousePosition: [number, number];
  private lines: Line[] = [];

  constructor(private canvas: AppCanvas, private dots: Dots) {
    this.setSearchRadius();
  }

  setSearchRadius() {
    const { width, height } = this.canvas;

    this.searchRadius = Math.round(Math.max(600, Math.min(height, width)) / 5);
  }

  setMousePosition(x: number, y: number) {
    this.mousePosition = [x, y];
    this.setLines();
  }

  setLines() {
    this.lines = this.getLines();
  }

  getLines(): Line[] {
    if (!this.mousePosition) {
      return [];
    }

    const [x, y] = this.mousePosition;
    const closestDot = this.dots.getClosestDot(x, y, this.searchRadius);

    if (!closestDot) {
      return [];
    }

    const closestDots = this.dots.getClosestDots(closestDot, this.searchRadius);

    return this.createLines(closestDot, closestDots);
  }

  createLines(closestDot: Dot, closestDots: Dot[]) {
    const result: Line[] = [];

    closestDots.forEach((dot, index) => {
      if (index % 3 === 0) {
        result.push(this.createLineSafe(closestDot, dot));
      }
      if (closestDots[index + 1]) {
        result.push(this.createLineSafe(dot, closestDots[index + 1]));
      }
      if (index === 0 && closestDots[closestDots.length - 1] && closestDots[index] !== closestDots[closestDots.length - 1]) {
        result.push(this.createLineSafe(dot, closestDots[closestDots.length - 1]));
      }
    });

    return result;
  }

  createLineSafe(from: Dot, to: Dot) {
    const line = new Line(this.canvas);

    line.setPath(from, to);

    return line;
  }

  nextStep() {
    this.setLines();
  }

  draw(canvas: Canvas) {
    for (const line of this.lines) {
      canvas.drawPath(line.path, line.paint);
    }
  }
}

export { Lines };
