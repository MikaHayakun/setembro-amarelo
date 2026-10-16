'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const flush = () => new Promise(resolve => setImmediate(resolve));

function createSmokeBrowser({script = 'smoke-public.js', pending = false, reduced = false,
  userAgent = 'Mozilla/5.0 Safari/605.1.15', manualImages = false,
  stream = true, onPlay = () => {}} = {}) {
  const frames = [];
  const videos = [];
  const canvases = [];
  const fetched = [];
  const painted = [];
  const images = [];
  const draws = [];
  function eventTarget(object = {}) {
    const events = new Map();
    return Object.assign(object, {
      addEventListener(name, fn) {
        if (!events.has(name)) events.set(name, new Set());
        events.get(name).add(fn);
      },
      removeEventListener(name, fn) { events.get(name)?.delete(fn); },
      dispatch(name) { for (const fn of [...(events.get(name) || [])]) fn({type: name}); },
      listeners(name) { return events.get(name)?.size || 0; }
    });
  }
  class Canvas {
    constructor() { this.style = {}; this.width = this.height = 2; }
    setAttribute() {}
    remove() { this.removed = true; }
    getContext() {
      return {setTransform() {}, clearRect() {}, save() {}, restore() {}, translate() {}, rotate() {},
        drawImage(image, x, y) { draws.push({image, x, y}); },
        putImageData(data) { painted.push(data.data.slice()); },
        createImageData: (w, h) => ({data: new Uint8ClampedArray(w * h * 4)}),
        getImageData: (x, y, w, h) => ({data: Uint8ClampedArray.from({length: w * h * 4}, (_, i) =>
          i % 4 === 3 ? 255 : w === 4 ? (Math.floor(i / 4) % w < w / 2 ? 160 : 74) :
            (i % 4 === 0 ? 160 : i % 4 === 1 ? 74 : 0))})};
    }
  }
  class Picture {
    constructor() { images.push(this); }
    set src(value) { this.source = value; if (!manualImages) queueMicrotask(() => this.onload?.()); }
    get src() { return this.source; }
    removeAttribute() { this.source = ''; }
  }
  class Video {
    constructor() {
      eventTarget(this);
      this.currentTime = 0; this.readyState = 2; this.videoWidth = this.videoHeight = 2;
      this.attributes = {}; videos.push(this);
    }
    set src(value) { this.source = value; this.playbackRate = this.defaultPlaybackRate ?? 1; }
    get src() { return this.source; }
    canPlayType() { return 'probably'; }
    setAttribute(name, value) { this.attributes[name] = value; }
    play() {
      this.played = true;
      onPlay(this, document);
      return pending ? new Promise((resolve, reject) => { this.reject = reject; }) : Promise.resolve();
    }
    pause() { this.paused = true; }
    load() { this.reject?.(new Error('Canceled')); }
    removeAttribute() { this.src = ''; }
    webkitExitFullscreen() { this.exitedFullscreen = true; this.webkitDisplayingFullscreen = false; }
    webkitSetPresentationMode(value) { this.webkitPresentationMode = value; }
  }
  const document = eventTarget({hidden: false,
    createElement: tag => tag === 'video' ? new Video() : new Canvas(),
    body: {append: canvas => canvases.push(canvas)}});
  document.exitFullscreen = async () => { document.fullscreenElement = null; };
  document.exitPictureInPicture = async () => { document.pictureInPictureElement = null; };
  const context = vm.createContext({Image: Picture, queueMicrotask, navigator: {userAgent},
    matchMedia: () => ({matches: reduced, addEventListener() {}}), document,
    window: {addEventListener() {}}, performance: {now: () => 1000},
    innerWidth: 100, innerHeight: 100, devicePixelRatio: 1,
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    cancelAnimationFrame() {}, setTimeout: () => 1, clearTimeout() {},
    fetch: async url => {
      fetched.push(url);
      assert.equal(url, '/assets/smoke/manifest.json', 'Sheets load as individual images, never as a buffered pack');
      return {ok: true, json: async () => ({width: 2, height: 2, fps: 30, frames: 375, duration: 12.5,
        framesPerSheet: 4, columns: 2,
        sheets: Array.from({length: 94}, (_, i) => `folds-${String(i).padStart(3, '0')}.webp`),
        ...(stream ? {stream: {file: 'folds-stream-v1.mp4', mime: 'video/mp4'}} : {})})};
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend', script), 'utf8') +
    '\nglobalThis.smoke = monthSmoke;', context);
  return {context, document, frames, videos, canvases, fetched, painted, images, draws};
}

test('renders when the first frame timestamp precedes the completed image load', async () => {
  const browser = createSmokeBrowser({stream: false});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.frames.length, 1);
  assert.doesNotThrow(() => browser.frames[0](999));
  assert.ok(browser.painted.some(data => data[3] > 200), 'The first sheet supplies smoke density');
  assert.equal(browser.frames.length, 2);
});

test('starts from the initial media buffer, paints both mask planes and follows media time', async () => {
  const browser = createSmokeBrowser();
  assert.equal(browser.videos.length, 0);
  await browser.context.smoke.play('Amarelo', 9);
  const video = browser.videos[0];
  assert.equal(video.src, '/assets/smoke/folds-stream-v1.mp4');
  assert.equal(video.muted, true);
  assert.equal(video.playsInline, true);
  assert.equal(video.attributes['webkit-playsinline'], '');
  assert.equal(video.disablePictureInPicture, true);
  assert.equal(video.defaultPlaybackRate, 12.5 / 12);
  assert.equal(video.playbackRate, 12.5 / 12);
  assert.equal(browser.images.length, 0, 'Normal stream playback does not download sheets');
  browser.frames[0](999);
  assert.ok(browser.painted.some(data => data[3] > 200), 'The density plane produces opaque smoke');
  video.dispatch('waiting');
  assert.equal(browser.canvases[0].style.animationPlayState, 'paused');
  video.currentTime = 2;
  browser.frames[1](100000);
  assert.equal(browser.canvases[0].removed, undefined, 'Buffering must not truncate the animation on wall time');
  video.dispatch('playing');
  assert.equal(browser.canvases[0].style.animationPlayState, 'running');
  video.dispatch('ended');
  assert.equal(browser.canvases[0].removed, true);
  assert.equal(video.paused, true);
  assert.equal(video.listeners('webkitbeginfullscreen'), 0);
  assert.equal(browser.document.listeners('fullscreenchange'), 0);
});

test('changing months cancels the previous media request and keeps only the current overlay', async () => {
  const browser = createSmokeBrowser();
  await browser.context.smoke.play('Amarelo', 9);
  await browser.context.smoke.play('Branco e roxo', 1);
  assert.equal(browser.videos[0].paused, true);
  assert.equal(browser.videos[0].src, '');
  assert.equal(browser.canvases[0].removed, true);
  assert.equal(browser.videos[1].playbackRate, 12.5 / 10);
  assert.equal(browser.canvases.filter(canvas => !canvas.removed).length, 1);
  assert.equal(browser.fetched.length, 1, 'The manifest is reused');
  browser.videos[0].dispatch('webkitbeginfullscreen');
  assert.equal(browser.canvases[1].removed, undefined, 'Obsolete events cannot restart playback');
});

test('canceled initial playback never downloads frames as a fallback', async () => {
  const browser = createSmokeBrowser({pending: true});
  const first = browser.context.smoke.play('Amarelo', 9);
  await flush();
  const second = browser.context.smoke.play('Branco e roxo', 1);
  await first;
  assert.equal(browser.videos[0].paused, true);
  await flush();
  browser.document.hidden = true;
  browser.document.dispatch('visibilitychange');
  await second;
  assert.equal(browser.fetched.length, 1);
  assert.equal(browser.images.length, 0);
  assert.equal(browser.canvases.length, 0);
});

test('reduced motion prevents media requests and overlays', async () => {
  const browser = createSmokeBrowser({reduced: true});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.fetched.length, 0);
  assert.equal(browser.videos.length, 0);
  assert.equal(browser.canvases.length, 0);
});

for (const userAgent of ['Mozilla/5.0 TikTok/37.0', 'Mozilla/5.0 musical_ly_2023703040',
  'Mozilla/5.0 BytedanceWebview aweme/370000', 'Mozilla/5.0 trill/370000']) {
  test(`uses progressive canvas sheets without creating a video in ${userAgent}`, async () => {
    const browser = createSmokeBrowser({userAgent});
    await browser.context.smoke.play('Amarelo', 9);
    assert.equal(browser.videos.length, 0, 'No auxiliary video can reach the native player');
    assert.equal(browser.images.length, 1, 'Only the first sheet is needed to start');
    browser.frames[0](1000);
    await flush();
    assert.equal(browser.images.length, 4, 'Prefetch remains bounded');
    assert.ok(browser.painted.some(data => data[3] > 200 && data[0] > data[2]), 'Smoke is tinted yellow');
  });
}

test('falls back when play resolves successfully but the video is already fullscreen', async () => {
  const browser = createSmokeBrowser({onPlay(video) { video.webkitDisplayingFullscreen = true; }});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.videos[0].played, true);
  assert.equal(browser.videos[0].paused, true);
  assert.equal(browser.videos[0].src, '');
  assert.equal(browser.videos[0].exitedFullscreen, true);
  assert.equal(browser.images.length, 1);
  browser.frames[0](1000);
  assert.ok(browser.painted.some(data => data[3] > 200 && data[0] > data[2]));
});

for (const mode of ['webkitbeginfullscreen', 'webkitpresentationmodechanged', 'fullscreenchange', 'enterpictureinpicture']) {
  test(`switches to sheets when ${mode} occurs after successful playback`, async () => {
    const browser = createSmokeBrowser();
    await browser.context.smoke.play('Amarelo', 9);
    const video = browser.videos[0];
    if (mode === 'webkitbeginfullscreen') video.webkitDisplayingFullscreen = true;
    if (mode === 'webkitpresentationmodechanged') video.webkitPresentationMode = 'fullscreen';
    if (mode === 'fullscreenchange') browser.document.fullscreenElement = video;
    if (mode === 'enterpictureinpicture') browser.document.pictureInPictureElement = video;
    (mode === 'fullscreenchange' ? browser.document : video).dispatch(mode);
    await flush();
    assert.equal(browser.videos.length, 1, 'Fallback cannot start another video');
    assert.equal(video.src, '');
    assert.equal(video.paused, true);
    assert.equal(browser.canvases[0].removed, true);
    assert.equal(browser.canvases.filter(canvas => !canvas.removed).length, 1);
    assert.equal(browser.images.length, 1);
    browser.frames.at(-1)(1000);
    assert.ok(browser.painted.some(data => data[3] > 200 && data[0] > data[2]));
  });
}

test('handles native fullscreen starting before play resolves', async () => {
  const browser = createSmokeBrowser({onPlay(video) { video.dispatch('webkitbeginfullscreen'); }});
  await browser.context.smoke.play('Amarelo', 9);
  await flush();
  assert.equal(browser.videos[0].src, '');
  assert.equal(browser.canvases.length, 1);
  assert.equal(browser.images.length, 1);
});

test('buffers missing sheets without consuming the animation or downloading the pack', async () => {
  const browser = createSmokeBrowser({stream: false, manualImages: true});
  const playing = browser.context.smoke.play('Amarelo', 9);
  await flush();
  assert.equal(browser.images.length, 1);
  browser.images[0].onload();
  await playing;
  browser.frames.at(-1)(1000);
  assert.equal(browser.images.length, 4);
  const count = browser.painted.length;
  browser.frames.at(-1)(1140); // Sheet 1 is not ready.
  assert.equal(browser.canvases[0].style.animationPlayState, 'paused');
  assert.equal(browser.painted.length, count);
  browser.frames.at(-1)(2000);
  browser.frames.at(-1)(12000);
  assert.equal(browser.canvases[0].removed, undefined, 'Waiting cannot exhaust the visible duration');
  browser.images[1].onload();
  browser.frames.at(-1)(12140);
  assert.equal(browser.canvases[0].style.animationPlayState, 'running');
  assert.ok(browser.draws.some(draw => draw.image === browser.images[1]), 'Playback resumes from the missing sheet');
  assert.ok(browser.images.length < 8);
});

test('changing months cancels a pending first sheet and ignores its late completion', async () => {
  const browser = createSmokeBrowser({stream: false, manualImages: true});
  const first = browser.context.smoke.play('Amarelo', 9);
  await flush();
  const staleLoad = browser.images[0].onload;
  const second = browser.context.smoke.play('Branco e roxo', 1);
  await first;
  await flush();
  assert.equal(browser.images[0].src, '');
  assert.equal(browser.images[0].onload, null);
  staleLoad();
  assert.equal(browser.canvases.length, 0);
  browser.images[1].onload();
  await second;
  assert.equal(browser.canvases.length, 1);
});

test('a failed sheet stops and releases loaded and pending images', async () => {
  const browser = createSmokeBrowser({stream: false, manualImages: true});
  const playing = browser.context.smoke.play('Amarelo', 9);
  await flush();
  browser.images[0].onload();
  await playing;
  browser.frames[0](1000);
  browser.images[1].onerror();
  await flush();
  assert.equal(browser.canvases[0].removed, true);
  assert.ok(browser.images.every(image => image.src === '' && image.onload === null));
});

test('releases old sheets while progressing through the animation', async () => {
  const browser = createSmokeBrowser({stream: false});
  await browser.context.smoke.play('Amarelo', 9);
  for (let sheet = 0; sheet < 12; sheet++) {
    browser.frames.at(-1)(1000 + sheet * 140);
    await flush();
  }
  assert.ok(browser.images.filter(image => image.src).length <= 5, 'Only current, previous and three upcoming sheets stay decoded');
  assert.equal(browser.images[0].src, '');
  browser.document.hidden = true;
  browser.document.dispatch('visibilitychange');
  assert.ok(browser.images.every(image => image.src === ''));
});

test('local version blocks the auxiliary video in TikTok without requesting unavailable sheets', async () => {
  const browser = createSmokeBrowser({script: 'smoke.js', userAgent: 'Mozilla/5.0 TikTok/37.0'});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.videos.length, 0);
  assert.equal(browser.images.length, 0);
  assert.equal(browser.fetched.length, 0);
  assert.equal(browser.canvases.length, 0);
});

test('local version preserves inline playback and stops if native fullscreen is requested', async () => {
  const browser = createSmokeBrowser({script: 'smoke.js'});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.videos[0].src, '/assets/pinterest-savepin-onl.mp4');
  assert.equal(browser.videos[0].playbackRate, 12.5 / 12);
  browser.frames[0](1000);
  assert.ok(browser.painted.some(data => data[3] > 200));
  browser.videos[0].webkitDisplayingFullscreen = true;
  browser.videos[0].dispatch('webkitbeginfullscreen');
  assert.equal(browser.videos[0].src, '');
  assert.equal(browser.videos[0].exitedFullscreen, true);
  assert.equal(browser.canvases[0].removed, true);
  assert.equal(browser.document.listeners('fullscreenchange'), 0);
});

test('local version detects external presentation even when play succeeds without an event', async () => {
  const browser = createSmokeBrowser({script: 'smoke.js', onPlay(video) { video.webkitDisplayingFullscreen = true; }});
  await browser.context.smoke.play('Amarelo', 9);
  assert.equal(browser.videos[0].src, '');
  assert.equal(browser.canvases.length, 0);
});
