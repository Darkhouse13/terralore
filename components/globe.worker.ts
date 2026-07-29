/**
 * The globe's render thread. Receives the canvas (as an OffscreenCanvas), the
 * precomputed shape trig, and a stream of state updates; runs its own rAF loop
 * and rasterises frames with the shared pure renderer. The main thread never
 * touches a pixel — which is exactly why the globe can spin forever without
 * contributing a millisecond of main-thread blocking time.
 */
import { renderGlobe, type DrawShape, type RenderState } from "./globe-render";

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let shapes: DrawShape[] = [];
let cssW = 0;
let cssH = 0;
let dpr = 1;
let state: RenderState = {
  view: { lambda: 14, phi: 24, scale: 1 },
  hoverCode: null,
  selectedCode: null,
  fills: null,
  ringCenter: null,
  ringT0: 0,
};
let animating = false;
let rafId = 0;
let firstFrame = true;

function frame(now: number) {
  rafId = 0;
  if (!ctx || !canvas || !cssW || !cssH || shapes.length === 0) return;
  const pw = Math.round(cssW * dpr);
  const ph = Math.round(cssH * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  renderGlobe(ctx, cssW, cssH, dpr, shapes, state, now);
  if (firstFrame) {
    firstFrame = false;
    postMessage({ type: "ready" });
  }
  // Rings animate continuously while a selection is open.
  if (animating || state.selectedCode) {
    rafId = requestAnimationFrame(frame);
  }
}

function wake() {
  if (!rafId) rafId = requestAnimationFrame(frame);
}

type InMessage =
  | { type: "init"; canvas: OffscreenCanvas; shapes: DrawShape[] }
  | { type: "size"; width: number; height: number; dpr: number }
  | { type: "state"; state: RenderState; animating: boolean };

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  if (msg.type === "init") {
    canvas = msg.canvas;
    ctx = canvas.getContext("2d");
    shapes = msg.shapes;
    wake();
  } else if (msg.type === "size") {
    cssW = msg.width;
    cssH = msg.height;
    dpr = msg.dpr;
    wake();
  } else if (msg.type === "state") {
    state = msg.state;
    animating = msg.animating;
    wake();
  }
};
