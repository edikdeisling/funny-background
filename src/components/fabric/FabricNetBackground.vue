<template>
  <canvas class="canvas" ref="canvasRef"></canvas>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useDots } from './dots';
import { useCanvasSize, useFabricCanvas, useMousePosition } from './helpers';
import { useClosestLines } from './lines';

export default defineComponent({
  setup() {
    const canvasRef = ref<HTMLCanvasElement>();
    const size = useCanvasSize(canvasRef);
    const canvas = useFabricCanvas(canvasRef, size);
    const mousePosition = useMousePosition(canvas);
    const dots = useDots(canvas);
    useClosestLines(canvas, dots, mousePosition);

    return { canvasRef };
  },
});
</script>
