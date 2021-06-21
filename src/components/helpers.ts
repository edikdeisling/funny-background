import { fabric } from 'fabric';
import { ref, Ref, shallowRef, triggerRef, watchEffect } from 'vue';
import { Point } from './dots';

function throttle<Fn extends (...args: any[]) => void>(fn: Fn, time = 50) {
  let timeout: number | undefined;
  let fnArgs: Parameters<Fn> | [] = [];

  return (...args: Parameters<Fn>) => {
    fnArgs = args;
    if (!timeout) {
      timeout = setTimeout(() => {
        fn(...fnArgs);
        timeout = undefined;
        fnArgs = [];
      }, time);
    }
  };
}

/**
 * Return mouse position ref
 */
function useMousePosition(canvas: Ref<fabric.StaticCanvas | undefined>) {
  const position = ref<Point>([0, 0]);

  watchEffect((onInvalidate) => {
    if (!canvas.value) {
      return;
    }

    const element = canvas.value.getElement();
    const onMouseMove = throttle((event: MouseEvent) => {
      const { x, y } = element.getBoundingClientRect();

      position.value = [event.clientX - x, event.clientY - y];
    });

    element.addEventListener('mousemove', onMouseMove);
    onInvalidate(() => element.removeEventListener('mousemove', onMouseMove));
  });

  return position;
}

interface Size {
  width: number;
  height: number;
}

/**
 * Return canvas size ref. This ref will change if canvas size has changed
 */
function useCanvasSize(canvasRef: Ref<HTMLCanvasElement | undefined>) {
  const size = ref<Size>();

  watchEffect((onInvalidate) => {
    if (!canvasRef.value) {
      return;
    }

    const setSize = throttle(([{ target }]) => {
      size.value = {
        width: target.clientWidth,
        height: target.clientHeight,
      };
    });
    const observer = new ResizeObserver(setSize);

    observer.observe(canvasRef.value!.parentElement!);

    onInvalidate(() => observer.disconnect());
  });

  return size;
}

/**
 * Return fabric object. Change size and trigger ref here as well
 */
function useFabricCanvas(canvasRef: Ref<HTMLCanvasElement | undefined>, size: Ref<Size | undefined>) {
  const canvas = shallowRef<fabric.StaticCanvas>();

  watchEffect(() => {
    if (canvas.value && size.value) {
      canvas.value!.setDimensions(size.value!);
      triggerRef(canvas);
    } else {
      if (canvas.value) {
        canvas.value!.dispose();
      }

      canvas.value = canvasRef.value && size.value && new fabric.StaticCanvas(canvasRef.value, {
        ... size.value,
        renderOnAddRemove: false,
        backgroundColor: '#fff',
      });
    }
  });

  return canvas;
}

export type { Size };
export {
  throttle,
  useFabricCanvas,
  useCanvasSize,
  useMousePosition,
};
