import { shallowRef } from '@vue/reactivity';
import { fabric } from 'fabric';
import { Ref, triggerRef, watch } from 'vue';

type Point = [number, number];

const DOT_RADIUS = 1;

function getSearchRadius(canvas: fabric.StaticCanvas) {
  return Math.round(Math.max(600, Math.min(canvas.getHeight(), canvas.getWidth())) / 5);
}

function getClosestDot(canvas: fabric.StaticCanvas, dots: fabric.Circle[], [mouseLeft, mouseTop]: Point) {
  const searchRadius = getSearchRadius(canvas);
  let closestDot: fabric.Circle | undefined;
  let minLength = 0;

  for (const dot of dots) {
    const deltaX = Math.abs(dot.left! - mouseLeft);
    const deltaY = Math.abs(dot.top! - mouseTop);

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

function getClosestDots(canvas: fabric.StaticCanvas, closestDot: fabric.Circle, dots: fabric.Circle[]) {
  const angle = new Map<fabric.Circle, number>();
  const searchRadius = getSearchRadius(canvas);
  let result: fabric.Circle[] = [];

  for (const dot of dots) {
    if (dot === closestDot) {
      continue;
    }

    const deltaX = closestDot.left! - dot.left!;
    const deltaY = closestDot.top! - dot.top!;

    if (Math.abs(deltaX) < searchRadius && Math.abs(deltaY) < searchRadius) {
      result.push(dot);
      angle.set(dot, Math.atan2(deltaY, deltaX));
    }
  }

  result.sort((a, b) => angle.get(a)! > angle.get(b)! ? 1 : -1);

  return result;
}

function animateDots(canvas: fabric.StaticCanvas, dots: Ref<fabric.Circle[]>, width: number, height: number) {
  let frame = 0;
  const dotParams = new Map<fabric.Circle, {
    target: Readonly<Point>,
    stepX: number,
    stepY: number,
  }>();
  const setDotParams = (dot: fabric.Circle) => {
    const side = Math.floor(Math.random() * 5);
    const target = [
      side === 4 ? 0 : side === 1 ? width : Math.random() * width,
      side === 0 ? 0 : side === 3 ? height : Math.random() * height,
    ] as const;
    const deltaX = target[0] - dot.left!;
    const deltaY = target[1] - dot.top!;
    const length = (deltaX ** 2 + deltaY ** 2) ** 0.5;
    const speed = length * 2; // same speed for each dot

    dotParams.set(dot, {
      target,
      stepX: deltaX / speed,
      stepY: deltaY / speed,
    });
  };

  for (const dot of dots.value) {
    setDotParams(dot);
  }

  // animate all dots fer one frame
  const animate = () => {
    for (const dot of dots.value) {
      const params = dotParams.get(dot)!;

      if (Math.abs(dot.left! - params.target[0]) < Math.abs(params.stepX)) {
        setDotParams(dot);
        continue;
      }

      dot.set({
        left: dot.left! + params.stepX,
        top: dot.top! + params.stepY,
      });
    }

    canvas.requestRenderAll();
    triggerRef(dots);
    frame = requestAnimationFrame(animate);
  };

  frame = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(frame);
}

function useDots(canvasRef: Ref<fabric.StaticCanvas | undefined>) {
  const dots = shallowRef<fabric.Circle[]>([]);

  watch(canvasRef, (canvas, _, onInvalidate) => {
    if (!canvas) {
      return;
    }

    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const countDots = Math.round((height * width) ** 0.35);

    for (let index = 0; index < countDots; index++) {
      const dot = new fabric.Circle({
        radius: DOT_RADIUS,
        left: Math.random() * width,
        top: Math.random() * height,
      });

      dots.value.push(dot);
    }

    canvas.add(...dots.value);

    const cancelAnimation = animateDots(canvas, dots, width, height);

    canvas.requestRenderAll();

    onInvalidate(() => {
      cancelAnimation();
      canvas?.remove(...dots.value);
      dots.value = [];
    });
  });

  return dots;
}

export type { Point };
export { DOT_RADIUS, getClosestDot, getClosestDots, useDots };
