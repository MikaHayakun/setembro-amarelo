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
  // Small lookup tables keep directional relief and lighting out of the pixel loop.
  const relief = Float32Array.from({length: 65 * 65}, (_, index) => {
    const nx = -(index % 65 - 32) / 32;
    const ny = -(Math.floor(index / 65) - 32) / 32;
    const light = Math.max(0, (nx * -.55 + ny * -.45 + .7) / Math.hypot(nx, ny, 1));
    return .8 + light * .28;
  });
  const density = Float32Array.from({length: 256}, (_, chroma) =>
    smooth((chroma - 6) / 90) * (.27 + .68 * chroma / 255) * 255);

  function lighting(rgb) {
    return Float32Array.from({length: 256 * 3}, (_, index) => {
      const luminance = Math.floor(index / 3) / 255;
      const pigment = rgb[index % 3];
      const shade = .3 + luminance ** 1.7 * .7;
      const highlight = smooth((luminance - .6) / .35) * .25;
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
    const frameHeight = source.height = tinted.height = Math.min(video.videoHeight, innerWidth > 900 ? 992 : 640);
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
        const ratio = Math.min(devicePixelRatio || 1, 1.5, 2000 / width);
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
          const above = Math.max(0, y - 2) * frameWidth * 4;
          const below = Math.min(frameHeight - 1, y + 2) * frameWidth * 4;
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
            const lo = Math.max(0, x - 2) * 4 + 1;
            const hi = Math.min(frameWidth - 1, x + 2) * 4 + 1;
            // Smoothed normals reveal large folds without amplifying video grain.
            const left = (input[above + lo] + input[row + lo] * 2 + input[below + lo]) / 4;
            const right = (input[above + hi] + input[row + hi] * 2 + input[below + hi]) / 4;
            const top = (input[above + lo] + input[above + offset + 1] * 2 + input[above + hi]) / 4;
            const bottom = (input[below + lo] + input[below + offset + 1] * 2 + input[below + hi]) / 4;
            const sharpened = Math.max(0, Math.min(255, Math.round(g + (4 * g - left - right - top - bottom) * .08)));
            const dx = Math.max(-32, Math.min(32, Math.round(right - left))) + 32;
            const dy = Math.max(-32, Math.min(32, Math.round(bottom - top))) + 32;
            const light = relief[dy * 65 + dx];
            for (let channel = 0; channel < 3; channel++) {
              const toneIndex = sharpened * 3 + channel;
              pixels.data[index + channel] = (tones[0][toneIndex] * (1 - mix) + tones[1][toneIndex] * mix) * light;
              if (thirdPixels) thirdPixels.data[index + channel] = thirdTones[toneIndex] * light;
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
      const initialBreadth = Math.min(height * .78, width * .8);
      const breadth = initialBreadth * (1 - expansion) + height * 1.8 * expansion;
      const length = width * (1.08 + expansion * .6);
      // Translucent drifting layers spread above and below the detailed folds.
      for (const [position, alpha] of [[.46 - expansion * .32, .24], [.54 + expansion * .32, .24 * expansion]]) {
        if (!alpha) continue;
        context.save();
        context.globalAlpha = alpha;
        context.translate(width / 2, height * position);
        context.rotate(-Math.PI / 2 + Math.sin(elapsed * .4) * .035);
        context.drawImage(tinted, -breadth * .65, -length * .57, breadth * 1.3, length * 1.14);
        context.restore();
      }
      context.save();
      context.globalAlpha = .9;
      context.translate(width / 2, height * .54);
      context.rotate(-Math.PI / 2);
      context.drawImage(tinted, -breadth / 2, -length / 2, breadth, length);
      context.restore();
      if (third) {
        const bottomWidth = Math.min(width * .95, height * .8) * (1 + expansion * 1.2);
        context.save();
        context.globalAlpha = .8;
        context.translate(width * .5, height * 1.08);
        context.rotate(Math.PI);
        context.drawImage(third, 0, 0, frameWidth, frameHeight * .54,
          -bottomWidth / 2, 0, bottomWidth, height * (.65 + expansion * .85));
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
