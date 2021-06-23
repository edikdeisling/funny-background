import { CanvasKitInit } from 'canvaskit-wasm';

declare module 'canvaskit-wasm' {
  // @ts-ignore
  export default CanvasKitInit;
}
