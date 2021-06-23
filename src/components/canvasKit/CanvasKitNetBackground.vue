<template>
  <canvas class="canvas" ref="canvasRef"></canvas>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AppCanvas } from './canvas';
import { Dots } from './dots';
import { Lines } from './lines';

export default defineComponent({
  async mounted() {
    this.appCanvas = await AppCanvas.init(this.$refs.canvasRef);
    const dots = new Dots(this.appCanvas);
    const lines = new Lines(this.appCanvas, dots);
    this.appCanvas.onMouseMove(lines.setMousePosition.bind(lines));
    this.appCanvas.runDraw((canvas, duration) => {
      dots.nextStep(duration);
      dots.draw(canvas);
      lines.nextStep();
      lines.draw(canvas);
    });
  },
  beforeUnmount() {
    this.appCanvas.stop();
  },
});
</script>

<style>
.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
