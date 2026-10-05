'use strict';

// The authorized reference supplies the moving folds. Its background and colors are removed.
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

  function stop() {
    if (!active) return;
    cancelAnimationFrame(active.frame);
    clearTimeout(active.timeout);
    active.video.pause();
    active.video.removeAttribute('src');
    active.video.load();
    active.canvas.remove();
    active = null;
  }

  async function play(colorLabel) {
    stop();
    if (reducedMotion.matches || document.hidden) return;
    const palette = colorLabel.toLocaleLowerCase('pt-BR').split(/,\s*|\s+e\s+/);
    if (!palette.length || palette.some(name => !colors[name])) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'month-smoke';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) return;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.playbackRate = 1.25;
    video.src = '/assets/pinterest-savepin-onl.mp4';
    const source = document.createElement('canvas');
    const sourceContext = source.getContext('2d', {willReadFrequently: true});
    const tinted = document.createElement('canvas');
    const tintContext = tinted.getContext('2d');
    const third = palette[2] ? document.createElement('canvas') : null;
    const thirdContext = third ? third.getContext('2d') : null;
    if (!sourceContext || !tintContext || (third && !thirdContext)) return;
    const sides = [colors[palette[0]], colors[palette[1] || palette[0]]];
    const state = {canvas, video, frame: 0, timeout: 0, start: null, width: 0, height: 0};
    active = state;
    video.addEventListener('error', () => { if (active === state) stop(); }, {once: true});
    // Wait for actual footage before starting the visible ten-second effect.
    try {
      await video.play();
    } catch (error) {
      if (active === state) stop();
      return;
    }
    if (active !== state) return;
    const frameHeight = source.height = tinted.height = video.videoHeight;
    const frameWidth = source.width = tinted.width = Math.round(frameHeight * video.videoWidth / video.videoHeight);
    if (third) { third.width = frameWidth; third.height = frameHeight; }
    const pixels = tintContext.createImageData(frameWidth, frameHeight);
    const thirdPixels = thirdContext ? thirdContext.createImageData(frameWidth, frameHeight) : null;
    const tones = sides.map(lighting);
    const thirdTones = third ? lighting(colors[palette[2]]) : null;
    const rowMix = Float32Array.from({length: frameHeight}, (_, y) => smooth((y / frameHeight - .44) / .12));
    state.start = performance.now();
    document.body.append(canvas);
    let lastVideoFrame = -1;
    function draw(now) {
      if (active !== state) return;
      const elapsed = (now - state.start) / 1000;
      if (elapsed >= 10) { stop(); return; }
      const width = innerWidth, height = innerHeight;
      if (state.width !== width || state.height !== height) {
        state.width = width; state.height = height;
        const ratio = Math.min(Math.max(devicePixelRatio || 1, 2), 3840 / width, 2160 / height);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      // Process only new video frames, at bounded resolution on every screen.
      const videoFrame = Math.floor(video.currentTime * 30);
      if (videoFrame !== lastVideoFrame && video.readyState >= 2) {
        lastVideoFrame = videoFrame;
        sourceContext.drawImage(video, 0, 0, frameWidth, frameHeight);
        const input = sourceContext.getImageData(0, 0, frameWidth, frameHeight).data;
        for (let y = 0; y < frameHeight; y++) {
          const mix = rowMix[y];
          const row = y * frameWidth * 4;
          const above = Math.max(0, y - 1) * frameWidth * 4;
          const below = Math.min(frameHeight - 1, y + 1) * frameWidth * 4;
          const bottomMask = 1 - smooth((y / frameHeight - .43) / .1);
          for (let x = 0; x < frameWidth; x++) {
            const offset = x * 4;
            const index = row + offset;
            const r = input[index], g = input[index + 1], b = input[index + 2];
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            const alpha = density[chroma];
            if (!alpha) {
              pixels.data[index + 3] = 0;
              if (thirdPixels) thirdPixels.data[index + 3] = 0;
              continue;
            }
            const left = input[row + Math.max(0, x - 1) * 4 + 1];
            const right = input[row + Math.min(frameWidth - 1, x + 1) * 4 + 1];
            const top = input[above + offset + 1], bottom = input[below + offset + 1];
            // Mild native-resolution unsharp masking preserves edges without fake relief.
            const sharpened = Math.max(0, Math.min(255, Math.round(g + (4 * g - left - right - top - bottom) * .16)));
            for (let channel = 0; channel < 3; channel++) {
              const toneIndex = sharpened * 3 + channel;
              pixels.data[index + channel] = (tones[0][toneIndex] * (1 - mix) + tones[1][toneIndex] * mix);
              if (thirdPixels) thirdPixels.data[index + channel] = thirdTones[toneIndex];
            }
            pixels.data[index + 3] = alpha;
            if (thirdPixels) thirdPixels.data[index + 3] = alpha * bottomMask;
          }
        }
        tintContext.putImageData(pixels, 0, 0);
        if (thirdContext) thirdContext.putImageData(thirdPixels, 0, 0);
      }
      context.clearRect(0, 0, width, height);
      const expansion = smooth((elapsed - 4) / 4);
      const length = width * (1.08 + expansion * .12);
      // Uniform scaling keeps every cloud's original proportions and avoids stretching.
      const breadth = length * frameWidth / frameHeight;
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
      if (third) {
        const travel = height * (.65 + expansion * .2);
        const bottomWidth = travel * frameWidth / (frameHeight * .54);
        context.save();
        context.translate(width * .5, height * 1.08);
        context.rotate(Math.PI);
        context.imageSmoothingQuality = 'high';
        context.drawImage(third, 0, 0, frameWidth, frameHeight * .54,
          -bottomWidth / 2, 0, bottomWidth, travel);
        context.restore();
      }
      state.frame = requestAnimationFrame(draw);
    }
    state.timeout = setTimeout(stop, 10000);
    state.frame = requestAnimationFrame(draw);
  }

  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  return {play};
})();
