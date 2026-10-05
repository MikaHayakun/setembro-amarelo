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
    const frameHeight = source.height = tinted.height = 448;
    const frameWidth = source.width = tinted.width = Math.round(frameHeight * video.videoWidth / video.videoHeight);
    if (third) { third.width = frameWidth; third.height = frameHeight; }
    const pixels = tintContext.createImageData(frameWidth, frameHeight);
    const thirdPixels = thirdContext ? thirdContext.createImageData(frameWidth, frameHeight) : null;
    const rowColors = Array.from({length: frameHeight}, (_, y) => {
      const mix = smooth((y / frameHeight - .44) / .12);
      return sides[0].map((value, channel) => value * (1 - mix) + sides[1][channel] * mix);
    });
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
        const ratio = Math.min(devicePixelRatio || 1, 1.25, 1600 / width);
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
          const rgb = rowColors[y];
          const bottomMask = 1 - smooth((y / frameHeight - .43) / .1);
          for (let x = 0; x < frameWidth; x++) {
            const index = (y * frameWidth + x) * 4;
            const r = input[index], g = input[index + 1], b = input[index + 2];
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            const alpha = smooth((chroma - 8) / 155) * 245;
            // Keep the folds' lighting, replacing the original yellow/orange pigment.
            const shade = .22 + (g / 255) ** 1.5 * .97;
            for (let channel = 0; channel < 3; channel++) {
              pixels.data[index + channel] = rgb[channel] * shade;
              if (thirdPixels) thirdPixels.data[index + channel] = colors[palette[2]][channel] * shade;
            }
            pixels.data[index + 3] = alpha;
            if (thirdPixels) thirdPixels.data[index + 3] = alpha * bottomMask;
          }
        }
        tintContext.putImageData(pixels, 0, 0);
        if (thirdContext) thirdContext.putImageData(thirdPixels, 0, 0);
      }
      context.clearRect(0, 0, width, height);
      const breadth = Math.min(height * .67, width * .68);
      context.save();
      context.translate(width / 2, height * .54);
      context.rotate(-Math.PI / 2);
      context.drawImage(tinted, -breadth / 2, -width * .54, breadth, width * 1.08);
      context.restore();
      if (third) {
        const bottomWidth = Math.min(width * .95, height * .8);
        context.save();
        context.translate(width * .5, height * 1.08);
        context.rotate(Math.PI);
        context.drawImage(third, 0, 0, frameWidth, frameHeight * .54,
          -bottomWidth / 2, 0, bottomWidth, height * .65);
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
