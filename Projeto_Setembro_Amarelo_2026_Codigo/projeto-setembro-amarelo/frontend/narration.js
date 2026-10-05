'use strict';

// This snapshot prevents an older recording from reading a changed campaign.
function narrationSnapshot(c) {
  const keys = ['name', 'color', 'theme', 'summary', 'purpose', 'history', 'evidence_note', 'care'];
  return Object.fromEntries(keys.map(key => [key, c[key] ?? null]));
}

function createNarrator(c, locale, recordings) {
  const ui = locale.ui;
  const tools = document.createElement('div');
  tools.className = 'tools';
  tools.setAttribute('role', 'group');
  tools.setAttribute('aria-label', ui.audioControls);
  const button = text => {
    const node = document.createElement('button');
    node.type = 'button'; node.textContent = text;
    return node;
  };
  const listen = button(ui.listen);
  const pause = button(ui.pause);
  const stop = button(ui.stop);
  const status = document.createElement('p');
  status.className = 'audio-status'; status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const speedLabel = document.createElement('label');
  speedLabel.className = 'audio-speed';
  speedLabel.append(document.createTextNode(ui.speed));
  const speed = document.createElement('select');
  for (const [value, text] of [[0.85, ui.slower], [1, ui.normal], [1.15, ui.faster]]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = text; option.selected = value === 1;
    speed.append(option);
  }
  speedLabel.append(speed);
  pause.disabled = true; stop.disabled = true;
  tools.append(listen, pause, stop, speedLabel, status);
  const entry = recordings?.[String(c.month)];
  let audio = null;
  let disposed = false;
  let playback = 0;
  if (entry && JSON.stringify(entry.source) === JSON.stringify(narrationSnapshot(c))) {
    audio = new Audio();
    audio.preload = 'none';
    audio.src = entry.file;
    audio.addEventListener('playing', () => {
      if (disposed || audio.paused) return;
      listen.disabled = true; pause.disabled = false; stop.disabled = false;
      pause.textContent = ui.pause; status.textContent = ui.reading;
    });
    audio.addEventListener('ended', () => {
      if (disposed) return;
      listen.disabled = false; pause.disabled = true; stop.disabled = true;
      status.textContent = ui.finished;
    });
    audio.addEventListener('error', () => {
      if (disposed) return;
      listen.disabled = false; pause.disabled = true; stop.disabled = true;
      status.textContent = ui.audioError;
    });
  }
  async function play() {
    if (!audio) { status.textContent = ui.audioUnavailable; return; }
    const attempt = ++playback;
    listen.disabled = true; stop.disabled = false;
    status.textContent = ui.audioLoading;
    audio.playbackRate = Number(speed.value);
    try { await audio.play(); }
    catch (error) {
      if (disposed || attempt !== playback) return;
      listen.disabled = false; pause.disabled = true; stop.disabled = true;
      status.textContent = ui.audioError;
    }
  }
  listen.addEventListener('click', () => {
    if (audio) audio.currentTime = 0;
    return play();
  });
  pause.addEventListener('click', () => {
    if (!audio) return;
    if (audio.paused) { play(); return; }
    audio.pause(); pause.textContent = ui.resume; status.textContent = ui.paused;
  });
  stop.addEventListener('click', () => {
    playback++;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    listen.disabled = false; pause.disabled = true; stop.disabled = true;
    pause.textContent = ui.pause; status.textContent = ui.stopped;
  });
  speed.addEventListener('change', () => {
    if (audio) audio.playbackRate = Number(speed.value);
  });
  return {
    element: tools,
    dispose() {
      disposed = true; playback++;
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    }
  };
}
