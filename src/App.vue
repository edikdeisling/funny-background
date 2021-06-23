<template>
  <FabricNetBackground />
  <!--  <CanvasKitNetBackground />-->
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CanvasKitNetBackground from './components/canvasKit/CanvasKitNetBackground.vue';
import FabricNetBackground from './components/fabric/FabricNetBackground.vue';

export default defineComponent({
  name: 'App',
  components: {
    FabricNetBackground,
    CanvasKitNetBackground,
  },
});
</script>

<style>
html,
body {
  margin: 0;
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}
</style>
