'use strict';

// Public version: lossless processed masks preserve the approved moving folds.
// No original video, original colors or background are served.
const monthSmoke = (() => {
  const colors = {
    branco: [245, 245, 248], roxo: [127, 64, 177], laranja: [242, 125, 34],
    'lilás': [183, 125, 212], 'azul escuro': [35, 69, 149],
    'azul claro': [113, 191, 239], verde: [56, 156, 100],
    amarelo: [246, 196, 28], vermelho: [210, 54, 65],
    dourado: [213, 163, 43], rosa: [225, 99, 158], azul: [55, 126, 215]
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  // Keep the recorded lighting; do not smooth or manufacture the video's folds.
  const density = Float32Array.from({length: 256}, (_, chroma) => clamp((chroma - 4) / 70) * 250);
  function lighting(rgb) {
    return Float32Array.from({length: 256 * 3}, (_, index) => {
      const luminance = Math.floor(index / 3) / 255;
      const pigment = rgb[index % 3];
      const shade = .18 + luminance * .92;
      const highlight = smooth((luminance - .76) / .24) * .12;
      return pigment * shade + (255 - pigment) * highlight;
    });
  }


  let frameManifest = null;
  let frameFiles = null;
  async function openFrames() {
    frameManifest ||= fetch('/assets/smoke/manifest.json').then(response => {
      if (!response.ok) throw new Error('Animation unavailable');
      return response.json();
    }).catch(error => { frameManifest = null; throw error; });
    const info = await frameManifest;
    // Buffer compressed images before starting the timer so a slow connection cannot
    // drop frames or shorten the approved animation. Decode only nearby sheets.
    frameFiles ||= (async () => {
      const files = new Array(info.sheets.length);
      let next = 0;
      async function worker() {
        while (next < files.length) {
          const index = next++;
          const response = await fetch('/assets/smoke/' + info.sheets[index], {cache: 'force-cache'});
          if (!response.ok) throw new Error('Animation frame unavailable');
          files[index] = await response.blob();
        }
      }
      await Promise.all(Array.from({length: 6}, worker));
      return files;
    })().catch(error => { frameFiles = null; throw error; });
    const files = await frameFiles;
    const sheets = new Map();
    let disposed = false;
    function load(index) {
      if (index >= info.sheets.length || disposed) return Promise.resolve(null);
      if (sheets.has(index)) return sheets.get(index).promise;
      const image = new Image();
      const entry = {image, ready: false, promise: null, url: URL.createObjectURL(files[index])};
      entry.promise = new Promise((resolve, reject) => {
        image.onload = () => { entry.ready = true; resolve(image); };
        image.onerror = () => reject(new Error('Animation frame unavailable'));
        image.src = entry.url;
      });
      sheets.set(index, entry);
      return entry.promise;
    }
    function dispose() {
      disposed = true;
      for (const entry of sheets.values()) { entry.image.onload = entry.image.onerror = null; entry.image.removeAttribute('src'); URL.revokeObjectURL(entry.url); }
      sheets.clear();
    }
    try { await Promise.all([load(0), load(1), load(2)]); }
    catch (error) { dispose(); throw error; }
    return {...info, dispose, get(frame) {
      const index = Math.floor(frame / info.framesPerSheet), position = frame % info.framesPerSheet;
      for (let ahead = 0; ahead < 8; ahead++) load(index + ahead).catch(() => {});
      for (const [key, entry] of sheets) {
        if (key < index - 2 && entry.ready) { entry.image.removeAttribute('src'); URL.revokeObjectURL(entry.url); sheets.delete(key); }
      }
      const entry = sheets.get(index);
      return entry?.ready ? {image: entry.image, x: (position % info.columns) * info.width,
        y: Math.floor(position / info.columns) * info.height} : null;
    }};
  }

  function stop() {
    if (!active) return;
    cancelAnimationFrame(active.frame);
    clearTimeout(active.timeout);
    if (active.reader) active.reader.dispose();
    active.canvas.remove();
    active = null;
  }

  async function play(colorLabel, month) {
    stop();
    if (reducedMotion.matches || document.hidden) return;
    const corners = Number(month) === 9;
    const duration = corners ? 12 : 10;
    const palette = corners ? ['amarelo'] : colorLabel.toLocaleLowerCase('pt-BR').split(/,\s*|\s+e\s+/);
    if (!palette.length || palette.some(name => !colors[name])) return;
    const canvas = document.createElement('canvas');
    canvas.className = corners ? 'month-smoke month-smoke--september' : 'month-smoke';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) return;
    const source = document.createElement('canvas');
    const sourceContext = source.getContext('2d', {willReadFrequently: true});
    const tinted = document.createElement('canvas');
    const tintContext = tinted.getContext('2d');
    const white = document.createElement('canvas');
    const whiteContext = white.getContext('2d');
    const emitter = corners || palette[2] ? document.createElement('canvas') : null;
    const emitterContext = emitter ? emitter.getContext('2d') : null;
    if (!sourceContext || !tintContext || !whiteContext || (emitter && !emitterContext)) return;
    const sides = [colors[palette[0]], colors[palette[1] || palette[0]]];
    const state = {canvas, reader: null, frame: 0, timeout: 0, start: null, width: 0, height: 0};
    active = state;
    // Load processed images only after activation; original material stays private.
    let reader;
    try {
      reader = await openFrames();
    } catch (error) {
      if (active === state) stop();
      return;
    }
    if (active !== state) { reader.dispose(); return; }
    state.reader = reader;
    const frameHeight = source.height = tinted.height = reader.height;
    const frameWidth = source.width = tinted.width = reader.width;
    if (emitter) { emitter.width = frameWidth; emitter.height = frameHeight; }
    white.width = frameWidth; white.height = frameHeight;
    const pixels = tintContext.createImageData(frameWidth, frameHeight);
    const whitePixels = whiteContext.createImageData(frameWidth, frameHeight);
    const emitterPixels = emitterContext ? emitterContext.createImageData(frameWidth, frameHeight) : null;
    const tones = sides.map(lighting);
    const emitterTones = emitter ? lighting(colors[palette[2] || palette[0]]) : null;
    // A white plume keeps the same sharp folds, with soft gray shadows for contrast.
    const whiteTones = Float32Array.from({length: 256}, (_, light) => 164 + light * 90 / 255);
    const whiteDensity = corners ? 1.28 : 1.08;
    const rowMix = Float32Array.from({length: frameHeight}, (_, y) => smooth((y / frameHeight - .44) / .12));
    state.start = performance.now();
    document.body.append(canvas);
    let lastFrame = -1;
    function draw(now) {
      if (active !== state) return;
      const elapsed = (now - state.start) / 1000;
      if (elapsed >= duration) { stop(); return; }
      const width = innerWidth, height = innerHeight;
      if (state.width !== width || state.height !== height) {
        state.width = width; state.height = height;
        const ratio = Math.min(Math.max(devicePixelRatio || 1, 2), 3840 / width, 2160 / height);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      // Process only new lossless frames, at native resolution on every screen.
      const frameIndex = Math.min(reader.frames - 1, Math.floor(elapsed * reader.duration / duration * reader.fps));
      const picture = reader.get(frameIndex);
      if (frameIndex !== lastFrame && picture) {
        lastFrame = frameIndex;
        sourceContext.drawImage(picture.image, picture.x, picture.y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
        const input = sourceContext.getImageData(0, 0, frameWidth, frameHeight).data;
        for (let y = 0; y < frameHeight; y++) {
          const mix = rowMix[y];
          const row = y * frameWidth * 4;
          const bottomMask = 1 - smooth((y / frameHeight - .43) / .1);
          for (let x = 0; x < frameWidth; x++) {
            const offset = x * 4;
            const index = row + offset;
            // R stores the exact sharpened lighting, G stores chroma for density.
            const chroma = input[index + 1];
            const alpha = density[chroma];
            if (!alpha) {
              pixels.data[index + 3] = 0;
              if (emitterPixels) emitterPixels.data[index + 3] = 0;
              whitePixels.data[index + 3] = 0;
              continue;
            }
            const sharpened = input[index];
            for (let channel = 0; channel < 3; channel++) {
              const toneIndex = sharpened * 3 + channel;
              pixels.data[index + channel] = (tones[0][toneIndex] * (1 - mix) + tones[1][toneIndex] * mix);
              if (emitterPixels) emitterPixels.data[index + channel] = emitterTones[toneIndex];
              whitePixels.data[index + channel] = whiteTones[sharpened];
            }
            pixels.data[index + 3] = alpha;
            if (emitterPixels) emitterPixels.data[index + 3] = alpha * bottomMask;
            whitePixels.data[index + 3] = Math.min(255, alpha * whiteDensity) * bottomMask;
          }
        }
        tintContext.putImageData(pixels, 0, 0);
        if (emitterContext) emitterContext.putImageData(emitterPixels, 0, 0);
        whiteContext.putImageData(whitePixels, 0, 0);
      }
      context.clearRect(0, 0, width, height);
      const expansion = smooth((elapsed * 10 / duration - 4) / 4);
      function drawWhite(x, y, travel, sourceAnchor = .5) {
        const breadth = travel * frameWidth / (frameHeight * .54);
        context.save();
        context.translate(x, y);
        context.rotate(Math.atan2(height / 2 - y, width / 2 - x) - Math.PI / 2);
        context.imageSmoothingQuality = 'high';
        context.drawImage(white, 0, 0, frameWidth, frameHeight * .54,
          -breadth * sourceAnchor, 0, breadth, travel);
        context.restore();
      }
      if (corners) {
        // Draw the three white plumes first so the four yellow corners stay in front.
        const whiteOrigins = [[0, height * .5], [width, height * .5], [width * .5, height]];
        for (const [x, y] of whiteOrigins) {
          const distance = Math.hypot(width / 2 - x, height / 2 - y);
          drawWhite(x, y, distance * (1.3 + expansion * .3));
        }
        // The masked upper plume enters from each corner along its diagonal to the center.
        const travel = Math.hypot(width / 2, height / 2) * (1.12 + expansion * .24);
        const breadth = travel * frameWidth / (frameHeight * .54);
        const origins = [[0, 0], [width, 0], [0, height], [width, height]];
        for (const [x, y] of origins) {
          context.save();
          context.translate(x, y);
          context.rotate(Math.atan2(height / 2 - y, width / 2 - x) - Math.PI / 2);
          context.imageSmoothingQuality = 'high';
          context.drawImage(emitter, 0, 0, frameWidth, frameHeight * .54,
            -breadth / 2, 0, breadth, travel);
          context.restore();
        }
        state.frame = requestAnimationFrame(draw);
        return;
      }
      const length = width * (1.08 + expansion * .12);
      // Uniform scaling keeps every cloud's original proportions and avoids stretching.
      const breadth = length * frameWidth / frameHeight;
      // Keep white behind each month's colors, including August's third bottom stream.
      drawWhite(width * (palette[2] ? .22 : .5), height * 1.08, height * (.78 + expansion * .22));
      // The reference's upper inlet is at 27% of its width, rather than its center.
      // Anchor that inlet to the exact top-left vertex before rotating toward the center.
      drawWhite(0, 0, Math.hypot(width / 2, height / 2) * (1.3 + expansion * .3), .27);
      // Extra streams spread to the edges instead of magnifying a blurry copy.
      const positions = height > width * 1.2 ? [-.02, .28, .58, .88, 1.18] : [.08, 1.12];
      for (const position of positions) {
        if (!expansion) continue;
        context.save();
        context.globalAlpha = .5 * expansion;
        context.translate(width / 2, height * position);
        context.rotate(-Math.PI / 2);
        context.drawImage(tinted, -breadth / 2, -length / 2, breadth, length);
        context.restore();
      }
      context.save();
      context.translate(width / 2, height * .54);
      context.rotate(-Math.PI / 2);
      context.imageSmoothingQuality = 'high';
      context.drawImage(tinted, -breadth / 2, -length / 2, breadth, length);
      context.restore();
      if (emitter) {
        const travel = height * (.65 + expansion * .2);
        const bottomWidth = travel * frameWidth / (frameHeight * .54);
        context.save();
        context.translate(width * .5, height * 1.08);
        context.rotate(Math.PI);
        context.imageSmoothingQuality = 'high';
        context.drawImage(emitter, 0, 0, frameWidth, frameHeight * .54,
          -bottomWidth / 2, 0, bottomWidth, travel);
        context.restore();
      }
      state.frame = requestAnimationFrame(draw);
    }
    state.timeout = setTimeout(stop, duration * 1000);
    state.frame = requestAnimationFrame(draw);
  }

  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  return {play};
})();
