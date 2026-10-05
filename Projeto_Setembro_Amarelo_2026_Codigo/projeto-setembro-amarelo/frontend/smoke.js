'use strict';

// Local, procedural smoke: no frames, images or lettering from the reference video.
const monthSmoke = (() => {
  const colors = {
    branco: [245, 245, 248], roxo: [127, 64, 177], laranja: [242, 125, 34],
    'lilás': [183, 125, 212], 'azul escuro': [35, 69, 149],
    'azul claro': [113, 191, 239], verde: [56, 156, 100],
    amarelo: [246, 196, 28], vermelho: [210, 54, 65],
    dourado: [213, 163, 43], rosa: [225, 99, 158], azul: [55, 126, 215]
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const textures = new Map();
  let active = null;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function noise(x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const hash = (a, b) => {
      let n = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ seed;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    const a = hash(ix, iy), b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }

  function texture(name, variant) {
    const key = `${name}:${variant}`;
    if (textures.has(key)) return textures.get(key);
    const canvas = document.createElement('canvas');
    const size = canvas.width = canvas.height = 144;
    const context = canvas.getContext('2d');
    const pixels = context.createImageData(size, size);
    const seed = 7301 + variant * 101;
    const rng = random(seed);
    const lobes = Array.from({length: 10}, () => ({
      x: (rng() - .5) * 1.1, y: (rng() - .5) * .95,
      radius: .12 + rng() * .23, weight: .45 + rng() * .6
    }));
    const rgb = colors[name];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size * 2 - 1, v = y / size * 2 - 1;
        const coarse = noise(u * 4 + 10, v * 4 + 10, seed);
        const detail = noise(u * 15 + coarse * 3, v * 15 + coarse * 3, seed);
        const fine = noise(u * 40, v * 40, seed);
        const warpedU = u + (coarse - .5) * .25;
        const warpedV = v + (detail - .5) * .18;
        let density = 0;
        for (const lobe of lobes) {
          const dx = warpedU - lobe.x, dy = warpedV - lobe.y;
          density += Math.exp(-(dx * dx + dy * dy) / (2 * lobe.radius ** 2)) * lobe.weight;
        }
        const edge = smooth((1 - Math.max(Math.abs(u), Math.abs(v))) * 5);
        const alpha = clamp((density * .55 + detail * .32 + fine * .12 - .27) * 1.3) * edge;
        const shade = .77 + coarse * .21 + detail * .12;
        const index = (y * size + x) * 4;
        for (let channel = 0; channel < 3; channel++) pixels.data[index + channel] = rgb[channel] * shade;
        pixels.data[index + 3] = alpha * 220;
      }
    }
    context.putImageData(pixels, 0, 0);
    textures.set(key, canvas);
    return canvas;
  }

  function stop() {
    if (!active) return;
    cancelAnimationFrame(active.frame);
    clearTimeout(active.timeout);
    active.canvas.remove();
    active = null;
  }

  function play(colorLabel) {
    stop();
    if (reducedMotion.matches || document.hidden) return;
    const palette = colorLabel.toLocaleLowerCase('pt-BR').split(/,\s*|\s+e\s+/);
    if (!palette.length || palette.some(name => !colors[name])) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'month-smoke';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) return;
    const sides = [palette[0], palette[1] || palette[0]];
    if (palette[2]) sides.push(palette[2]);
    const rng = random(2917);
    const particles = sides.flatMap((name, side) => {
      const sprites = [0, 1, 2].map(variant => texture(name, variant));
      return Array.from({length: 26}, (_, i) => ({
        side, sprite: sprites[i % sprites.length], birth: i / 26 * 2.3,
        spread: rng() * 2 - 1, sway: rng() * 2 - 1,
        size: .75 + rng() * .65, angle: rng() * Math.PI * 2,
        spin: (rng() - .5) * .15
      }));
    });
    // Clock starts when the prepared smoke can actually be drawn.
    const state = {canvas, frame: 0, timeout: 0, start: performance.now(), width: 0, height: 0};
    active = state;
    document.body.append(canvas);
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
      context.clearRect(0, 0, width, height);
      const fade = 1 - smooth((elapsed - 6) / 4);
      const scale = Math.min(width, height);
      for (const particle of particles) {
        const age = elapsed - particle.birth;
        if (age < 0) continue;
        const progress = smooth(age / 4.7);
        const drift = Math.max(0, elapsed - 5.8);
        const turbulence = Math.sin(age * 1.25 + particle.angle);
        let x, y;
        if (particle.side === 2) {
          x = width * (.5 + particle.spread * .07 * progress) + turbulence * scale * .035;
          y = height * (1.13 - .59 * progress);
        } else {
          const direction = particle.side === 0 ? 1 : -1;
          x = width * (.5 + direction * (-.63 + .63 * progress));
          y = height * (.54 + particle.spread * (.035 + progress * .065));
          y += turbulence * scale * .03 * progress;
        }
        x += particle.sway * scale * .025 * progress * drift;
        y -= drift * scale * (.014 + particle.size * .007);
        const radius = scale * (.09 + progress * .12 + drift * .016) * particle.size;
        context.save();
        context.globalAlpha = smooth(age / .7) * fade * .38;
        context.translate(x, y);
        context.rotate(particle.angle + age * particle.spin);
        context.drawImage(particle.sprite, -radius, -radius, radius * 2, radius * 2);
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
