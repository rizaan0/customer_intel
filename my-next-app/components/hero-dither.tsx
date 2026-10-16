"use client";

import { useEffect, useRef } from "react";

const CELL = 9;
const CONTRAST = 158;
const DENSITY = 20;
const COVERAGE = 100;
const PULSE = 0.6;
const SPEED = 1;

const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((value) => value / 64));

function contrast(value: number) {
  const amount = CONTRAST / 100;
  return Math.min(1, Math.max(0, (value - 0.5) * amount + 0.5));
}

function paintSource(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#fafaf9";
  ctx.fillRect(0, 0, width, height);

  const subject = ctx.createRadialGradient(width * 0.72, height * 0.22, 0, width * 0.72, height * 0.22, width * 0.46);
  subject.addColorStop(0, "#0f766e");
  subject.addColorStop(0.42, "#99f6e4");
  subject.addColorStop(1, "#fafaf9");
  ctx.fillStyle = subject;
  ctx.fillRect(0, 0, width, height);

  const mass = ctx.createRadialGradient(width * 0.18, height * 0.78, 0, width * 0.18, height * 0.78, width * 0.34);
  mass.addColorStop(0, "#44403c");
  mass.addColorStop(0.55, "#d6d3d1");
  mass.addColorStop(1, "rgba(250,250,249,0)");
  ctx.fillStyle = mass;
  ctx.fillRect(0, 0, width, height);
}

export function HeroDither() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const view = canvas.getContext("2d", { alpha: true });
    const sample = document.createElement("canvas");
    const sourceCtx = sample.getContext("2d", { willReadFrequently: true });
    const output = document.createElement("canvas");
    const outputCtx = output.getContext("2d");
    if (!view || !sourceCtx || !outputCtx) return;
    const surface: HTMLCanvasElement = canvas;
    const host: HTMLElement = parent;
    const paint: CanvasRenderingContext2D = view;
    const pixels: CanvasRenderingContext2D = sourceCtx;
    const dotsCtx: CanvasRenderingContext2D = outputCtx;

    let cols = 0;
    let rows = 0;
    let source = new Uint8ClampedArray();
    let frame = 0;
    let last = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function layout() {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width === 0 || height === 0) return;
      surface.width = width;
      surface.height = height;
      cols = Math.max(1, Math.ceil(width / CELL));
      rows = Math.max(1, Math.ceil(height / CELL));
      sample.width = cols;
      sample.height = rows;
      output.width = cols;
      output.height = rows;
      paintSource(pixels, cols, rows);
      source = pixels.getImageData(0, 0, cols, rows).data;
    }

    function draw(time: number) {
      if (cols === 0) return;
      const pulse = reduced ? 0 : Math.sin(time * 0.001 * SPEED) * PULSE * 0.18;
      const dots = dotsCtx.createImageData(cols, rows);
      const pixels = dots.data;
      const keep = COVERAGE / 100;
      const ink = 0.45 + DENSITY / 100;

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = (y * cols + x) * 4;
          if (((x * 13 + y * 7) % 100) / 100 > keep) {
            pixels[index + 3] = 0;
            continue;
          }
          const threshold = BAYER[y & 7][x & 7] + pulse;
          const red = contrast(source[index] / 255);
          const green = contrast(source[index + 1] / 255);
          const blue = contrast(source[index + 2] / 255);
          const level = (channel: number) => {
            const scaled = channel * 3;
            const step = Math.floor(scaled);
            const frac = scaled - step;
            return Math.min(3, step + (frac > threshold ? 1 : 0)) / 3;
          };
          pixels[index] = Math.round(level(red) * 255 * ink + 250 * (1 - ink));
          pixels[index + 1] = Math.round(level(green) * 255 * ink + 250 * (1 - ink));
          pixels[index + 2] = Math.round(level(blue) * 255 * ink + 250 * (1 - ink));
          pixels[index + 3] = 255;
        }
      }

      dotsCtx.putImageData(dots, 0, 0);
      paint.imageSmoothingEnabled = false;
      paint.clearRect(0, 0, surface.width, surface.height);
      paint.drawImage(output, 0, 0, surface.width, surface.height);
    }

    function tick(now: number) {
      frame = window.requestAnimationFrame(tick);
      if (!visible || document.visibilityState !== "visible") return;
      if (now - last < 33) return;
      last = now;
      draw(reduced ? 0 : now);
    }

    layout();
    draw(0);
    frame = window.requestAnimationFrame(tick);

    const resize = new ResizeObserver(() => {
      layout();
      draw(reduced ? 0 : performance.now());
    });
    resize.observe(parent);

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(parent);

    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect();
      seen.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
    />
  );
}
