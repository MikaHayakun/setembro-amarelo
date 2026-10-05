'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const locale = JSON.parse(fs.readFileSync(path.join(root, 'frontend/locales/pt-BR.json')));
const campaign = {...locale.campaigns['7'], month: 7};

function setup() {
  class Node {
    constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.events = {}; }
    append(...nodes) {
      this.children.push(...nodes);
      for (const node of nodes) if (node.selected) this.value = String(node.value);
    }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, handler) { this.events[name] = handler; }
    click() { if (!this.disabled) return this.events.click(); }
  }
  class Audio {
    static instances = [];
    constructor() { this.events = {}; this.paused = true; this.currentTime = 0; Audio.instances.push(this); }
    addEventListener(name, handler) { this.events[name] = handler; }
    async play() { this.paused = false; this.events.playing(); }
    pause() { this.paused = true; }
    removeAttribute(name) { delete this[name]; }
    load() { this.loaded = true; }
  }
  const context = vm.createContext({Audio, document: {
    createElement: tag => new Node(tag), createTextNode: text => ({textContent: text})
  }});
  vm.runInContext(fs.readFileSync(path.join(root, 'frontend/narration.js'), 'utf8'), context);
  const source = context.narrationSnapshot(campaign);
  const recordings = {'7': {source, file: '/assets/audio/pt-BR/07.mp3'}};
  const create = (c = campaign) => context.createNarrator(c, locale, recordings);
  return {Audio, create};
}

test('only starts on request; pause, resume, speed, stop and replay work', async () => {
  const {Audio, create} = setup();
  const narrator = create();
  const [listen, pause, stop, speedLabel, status] = narrator.element.children;
  const audio = Audio.instances[0];
  assert.equal(audio.paused, true);
  assert.equal(audio.preload, 'none');
  assert.equal(pause.disabled, true);
  assert.equal(status.attributes.role, 'status');
  assert.equal(narrator.element.attributes['aria-label'], locale.ui.audioControls);
  await listen.click();
  assert.equal(audio.paused, false);
  assert.equal(status.textContent, locale.ui.reading);
  pause.click();
  assert.equal(audio.paused, true);
  assert.equal(pause.textContent, locale.ui.resume);
  await pause.click();
  assert.equal(audio.paused, false);
  const speed = speedLabel.children[1];
  speed.value = '0.85'; speed.events.change();
  assert.equal(audio.playbackRate, 0.85);
  audio.currentTime = 5;
  stop.click();
  assert.equal(audio.paused, true);
  assert.equal(audio.currentTime, 0);
  assert.equal(status.textContent, locale.ui.stopped);
  await listen.click();
  assert.equal(audio.playbackRate, 0.85);
  audio.events.ended();
  assert.equal(status.textContent, locale.ui.finished);
  assert.equal(listen.disabled, false);
});

test('does not read a recording after the campaign text changes', async () => {
  const {Audio, create} = setup();
  const narrator = create({...campaign, purpose: 'Texto novo.'});
  await narrator.element.children[0].click();
  assert.equal(Audio.instances.length, 0);
  assert.equal(narrator.element.children[4].textContent, locale.ui.audioUnavailable);
});

test('disposing the old month stops playback and ignores late events', async () => {
  const {Audio, create} = setup();
  const narrator = create();
  await narrator.element.children[0].click();
  const audio = Audio.instances[0];
  const status = narrator.element.children[4];
  narrator.dispose();
  assert.equal(audio.paused, true);
  assert.equal(audio.src, undefined);
  assert.equal(audio.loaded, true);
  audio.events.error(); audio.events.ended();
  assert.equal(status.textContent, locale.ui.reading);
});

test('stopping while audio loads prevents a late rejection from changing the status', async () => {
  const {Audio, create} = setup();
  const narrator = create();
  const [listen, pause, stop, , status] = narrator.element.children;
  let reject;
  Audio.instances[0].play = () => new Promise((resolve, rejectPromise) => { reject = rejectPromise; });
  const playback = listen.click();
  stop.click();
  reject(new Error('Playback cancelled'));
  await playback;
  assert.equal(status.textContent, locale.ui.stopped);
  assert.equal(listen.disabled, false);
  assert.equal(pause.disabled, true);
});

test('playback errors offer a retry through the same listen button', async () => {
  const {Audio, create} = setup();
  const narrator = create();
  const listen = narrator.element.children[0];
  Audio.instances[0].play = async () => { throw new Error('Audio unavailable'); };
  await listen.click();
  assert.equal(narrator.element.children[4].textContent, locale.ui.audioError);
  assert.equal(listen.disabled, false);
});
