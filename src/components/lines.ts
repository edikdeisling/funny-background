import { shallowReactive } from '@vue/reactivity';
import { fabric } from 'fabric';
import { computed, Ref, watch } from 'vue';
import { getClosestDot, getClosestDots } from './dots';

class CanvasLine extends fabric.Line {
  from: fabric.Circle;
  to: fabric.Circle;
}

function createLine(from: fabric.Circle, to: fabric.Circle) {
  const offset = to.width! / 2;
  const stroke = ['red', 'orange', 'green', 'blue', 'purple'][Math.floor(Math.random() * 5)];
  const line = new CanvasLine([from.left! + offset, from.top! + offset, to.left! + offset, to.top! + offset], {
    opacity: 0,
    stroke,
    shadow: `0 0 2px ${stroke}`,
  });

  line.from = from;
  line.to = to;

  return line;
}

/**
 * Create lines by using closestDots. Do not create line if it already exist in dotLineMap
 */
function createLines(closest: fabric.Circle, closestDots: fabric.Circle[], dotLineMap: Map<fabric.Circle, CanvasLine[]>) {
  const result: (CanvasLine | undefined)[] = [];
  const createLineSafe = (from: fabric.Circle, to: fabric.Circle) => {
    // Finding existing line between from\to
    if (dotLineMap.has(from) && dotLineMap.has(to)) {
      const fromLines = dotLineMap.get(from)!;
      const toLines = dotLineMap.get(to)!;
      const line = fromLines.find((existLine) => toLines.includes(existLine));

      if (line) {
        return line;
      }

      if (fromLines.length >= 2 && toLines.length >= 2) {
        return;
      }
    }

    return createLine(from, to);
  };

  closestDots.forEach((dot, index) => {
    if (index % 3 === 0) {
      result.push(createLineSafe(closest, dot));
    }
    if (closestDots[index + 1]) {
      result.push(createLineSafe(dot, closestDots[index + 1]));
    }
    if (index === 0 && closestDots[closestDots.length - 1] && closestDots[index] !== closestDots[closestDots.length - 1]) {
      result.push(createLineSafe(dot, closestDots[closestDots.length - 1]));
    }
  });

  return result.filter(Boolean) as CanvasLine[];
}

function useClosestLines(canvas: Ref<fabric.StaticCanvas | undefined>, dots: Ref<fabric.Circle[]>, mousePosition: Ref<[number, number]>) {
  const currentLines = shallowReactive(new Map<CanvasLine, null>());
  const removingLines = shallowReactive(new Map<CanvasLine, null>());
  const allLines = computed(() => [...currentLines.keys(), ...removingLines.keys()]);
  const dotLineMap = computed(() => {
    const result = new Map<fabric.Circle, CanvasLine[]>();

    for (const line of allLines.value) {
      result.set(line.from, [...result.get(line.from) || [], line]);
      result.set(line.to, [...result.get(line.to) || [], line]);
    }

    return result;
  });
  const closestDot = computed(() => canvas.value && getClosestDot(canvas.value, dots.value, mousePosition.value));
  const closestDots = computed(() => canvas.value && closestDot.value && getClosestDots(canvas.value, closestDot.value, dots.value));
  const newLines = computed(() => closestDot.value && closestDots.value && createLines(closestDot.value, closestDots.value, dotLineMap.value));

  watch([newLines, canvas], () => {
    if (!newLines.value || !canvas.value?.getElement()) {
      return;
    }

    // remove lines
    for (const currentLine of currentLines.keys()) {
      if (!newLines.value.includes(currentLine)) {
        removingLines.set(currentLine, null);
        currentLines.delete(currentLine);

        currentLine.animate('opacity', 0, {
          duration: 300,
          onChange: canvas.value.requestRenderAll.bind(canvas.value),
          onComplete: () => {
            removingLines.delete(currentLine);
            if (!dotLineMap.value.has(currentLine.from)) {
              currentLine.from.set('fill', 'black');
            }
            if (!dotLineMap.value.has(currentLine.to)) {
              currentLine.to.set('fill', 'black');
            }
            canvas.value?.remove(currentLine);
          },
          easing: fabric.util.ease.easeInCubic,
        });
      }
    }

    // add lines
    for (const newLine of newLines.value) {
      if (!currentLines.has(newLine)) {
        currentLines.set(newLine, null);
        canvas.value.add(newLine);
        newLine.from.set('fill', newLine.stroke);
        newLine.to.set('fill', newLine.stroke);
        newLine.animate('opacity', 1, {
          duration: 1000,
          onChange: canvas.value.requestRenderAll.bind(canvas.value),
          easing: fabric.util.ease.easeOutCirc,
        });

        if (removingLines.has(newLine)) {
          removingLines.delete(newLine);
        }
      }
    }

    for (const line of allLines.value) {
      line.set({ x1: line.from.left, y1: line.from.top, x2: line.to.left, y2: line.to.top });
    }
  });
}

export { useClosestLines, createLine };
