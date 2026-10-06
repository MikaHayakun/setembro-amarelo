'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('renders when the first frame timestamp precedes the completed image load', async () => {
  const frames = [];
  let draws = 0;
  class Canvas {
    constructor() { this.width = this.height = 2; }
    setAttribute() {}
    remove() {}
    getContext() {
      return {setTransform() {}, clearRect() {}, save() {}, restore() {},
        translate() {}, rotate() {}, putImageData() {},
        createImageData: (w, h) => ({data: new Uint8ClampedArray(w * h * 4)}),
        getImageData: () => ({data: Uint8ClampedArray.from([160,74,0,255,160,74,0,255,160,74,0,255,160,74,0,255])}),
        drawImage() { draws++; }};
    }
  }
  class Picture {
    set src(value) { queueMicrotask(() => this.onload?.()); }
    removeAttribute() {}
  }
  const context = vm.createContext({Blob, Image: Picture, queueMicrotask,
    URL: {createObjectURL(blob) { assert.ok(blob instanceof Blob); return 'blob:mask'; }, revokeObjectURL() {}},
    matchMedia: () => ({matches: false, addEventListener() {}}),
    document: {hidden: false, createElement: () => new Canvas(), body: {append() {}}, addEventListener() {}},
    window: {addEventListener() {}}, performance: {now: () => 1000},
    innerWidth: 100, innerHeight: 100, devicePixelRatio: 1,
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
    fetch: async () => ({ok: true, json: async () => ({width: 2, height: 2, frames: 1,
      fps: 30, duration: 12.5, framesPerSheet: 4, columns: 2, sheets: ['folds-000.webp']}),
      blob: async () => new Blob(['processed mask'])})
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/smoke-public.js'), 'utf8') +
    '\nglobalThis.smoke = monthSmoke;', context);
  await context.smoke.play('Amarelo', 9);
  assert.equal(frames.length, 1);
  assert.doesNotThrow(() => frames[0](999));
  assert.ok(draws > 0, 'The real first image is drawn');
  assert.equal(frames.length, 2, 'Animation continues after the first frame');
});
