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

function streamBrowser({pending = false, reduced = false} = {}) {
  const frames = [], videos = [], canvases = [], fetched = [], painted = [];
  class Canvas {
    constructor() { this.style = {}; this.width = this.height = 2; }
    setAttribute() {}
    remove() { this.removed = true; }
    getContext() {
      return {setTransform() {}, clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {},
        drawImage() {}, putImageData(data) { painted.push(data.data.slice()); },
        createImageData: (w, h) => ({data: new Uint8ClampedArray(w * h * 4)}),
        getImageData: (x, y, w, h) => ({data: Uint8ClampedArray.from({length: w * h * 4}, (_, i) =>
          i % 4 === 3 ? 255 : Math.floor(i / 4) % w < w / 2 ? 160 : 74)})};
    }
  }
  class Video {
    constructor() { this.events = {}; this.currentTime = 0; this.readyState = 2; videos.push(this); }
    set src(value) { this.source = value; this.playbackRate = this.defaultPlaybackRate ?? 1; }
    get src() { return this.source; }
    canPlayType() { return 'probably'; }
    addEventListener(name, fn) { this.events[name] = fn; }
    play() { return pending ? new Promise((resolve, reject) => { this.reject = reject; }) : Promise.resolve(); }
    pause() { this.paused = true; }
    load() { this.reject?.(new Error('Canceled')); }
    removeAttribute() { this.src = ''; }
  }
  const context = vm.createContext({
    matchMedia: () => ({matches: reduced, addEventListener() {}}),
    document: {hidden: false, createElement: tag => tag === 'video' ? new Video() : new Canvas(),
      body: {append: canvas => canvases.push(canvas)}, addEventListener() {}},
    window: {addEventListener() {}}, performance: {now: () => 1000},
    innerWidth: 100, innerHeight: 100, devicePixelRatio: 1,
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    cancelAnimationFrame() {}, setTimeout: () => { throw new Error('Stream must use media time'); }, clearTimeout() {},
    fetch: async url => {
      fetched.push(url);
      assert.equal(url, '/assets/smoke/manifest.json', 'Starting the stream must not download the WebP pack');
      return {ok: true, json: async () => ({width: 2, height: 2, fps: 30, frames: 375, duration: 12.5,
        stream: {file: 'folds-stream-v1.mp4', mime: 'video/mp4'}})};
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/smoke-public.js'), 'utf8') +
    '\nglobalThis.smoke = monthSmoke;', context);
  return {context, frames, videos, canvases, fetched, painted};
}

test('starts from the initial media buffer, paints both mask planes and follows media time', async () => {
  const b = streamBrowser();
  assert.equal(b.videos.length, 0, 'No animation is loaded before activation');
  await b.context.smoke.play('Amarelo', 9);
  const video = b.videos[0];
  assert.equal(video.src, '/assets/smoke/folds-stream-v1.mp4');
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.equal(video.defaultPlaybackRate, 12.5 / 12);
  assert.equal(video.playbackRate, 12.5 / 12);
  b.frames[0](999);
  assert.ok(b.painted.some(data => data[3] > 200), 'The density plane produces opaque smoke');
  assert.equal(b.canvases.length, 1);
  video.events.waiting();
  assert.equal(b.canvases[0].style.animationPlayState, 'paused');
  video.currentTime = 2;
  b.frames[1](100000);
  assert.equal(b.canvases[0].removed, undefined, 'Buffering must not truncate the animation on wall time');
  video.events.playing();
  assert.equal(b.canvases[0].style.animationPlayState, 'running');
  video.events.ended();
  assert.equal(b.canvases[0].removed, true);
  assert.equal(video.paused, true);
});

test('changing months cancels the previous media request and keeps only the current overlay', async () => {
  const b = streamBrowser();
  await b.context.smoke.play('Amarelo', 9);
  await b.context.smoke.play('Branco e roxo', 1);
  assert.equal(b.videos[0].paused, true);
  assert.equal(b.videos[0].src, '');
  assert.equal(b.canvases[0].removed, true);
  assert.equal(b.videos[1].playbackRate, 12.5 / 10);
  assert.equal(b.canvases.filter(canvas => !canvas.removed).length, 1);
  assert.equal(b.fetched.length, 1, 'The manifest is reused');
});

test('canceled initial playback never downloads all frames as a fallback', async () => {
  const b = streamBrowser({pending: true});
  const first = b.context.smoke.play('Amarelo', 9);
  await new Promise(resolve => setImmediate(resolve));
  const second = b.context.smoke.play('Branco e roxo', 1);
  await first;
  assert.equal(b.videos[0].paused, true);
  assert.equal(b.fetched.length, 1);
  await new Promise(resolve => setImmediate(resolve));
  b.videos[1].reject(new Error('Canceled'));
  await second;
  assert.equal(b.canvases.length, 0);
});

test('reduced motion prevents media requests and overlays', async () => {
  const b = streamBrowser({reduced: true});
  await b.context.smoke.play('Amarelo', 9);
  assert.equal(b.fetched.length, 0);
  assert.equal(b.videos.length, 0);
  assert.equal(b.canvases.length, 0);
});
