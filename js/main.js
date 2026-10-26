const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const style = getComputedStyle(root);
const colors = {
  rgb: style.getPropertyValue('--particle').trim(),
  glow: style.getPropertyValue('--particle-glow').trim(),
  accent: style.getPropertyValue('--accent').trim(),
  accent2: style.getPropertyValue('--accent-2').trim(),
  text: style.getPropertyValue('--text').trim(),
};

const rotator = document.querySelector('.rotator');
const rotatorLines = [...document.querySelectorAll('.rotator__lines li')].map((li) => li.textContent);
let rotatorIndex = 0;
const showNextLine = () => {
  const line = document.createElement('span');
  line.className = 'rotator__line';
  rotatorLines[rotatorIndex].split(' ').forEach((text, i) => {
    const word = document.createElement('span');
    word.className = 'rotator__word';
    word.textContent = text;
    word.style.setProperty('--i', i);
    line.append(word, ' ');
  });
  const previous = rotator.querySelector('.rotator__line:not(.out)');
  if (previous) {
    previous.classList.add('out');
    setTimeout(() => previous.remove(), 700);
  }
  rotator.append(line);
  rotatorIndex = (rotatorIndex + 1) % rotatorLines.length;
};
showNextLine();
setInterval(showNextLine, 3800);

const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  io.unobserve(e.target);
}), { threshold: .1 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

if (!reduced) {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  const resize = () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  };
  resize();
  addEventListener('resize', resize);

  const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
  const glowSprite = (core) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const g = sprite.getContext('2d');
    const glow = toRgb(colors.glow);
    const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${core}, 1)`);
    gradient.addColorStop(.18, `rgba(${core}, 1)`);
    gradient.addColorStop(.3, `rgba(${glow}, .45)`);
    gradient.addColorStop(1, `rgba(${glow}, 0)`);
    g.fillStyle = gradient;
    g.fillRect(0, 0, 64, 64);
    return sprite;
  };
  const emberSprite = glowSprite(colors.rgb);
  const hotSprite = glowSprite(toRgb(colors.accent2));
  const coolSprite = glowSprite(toRgb(colors.accent));
  const drawGlow = (sprite, x, y, r) => {
    const size = Math.max(r / .09, 12);
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  };

  const embers = Array.from({ length: 46 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + .4, v: Math.random() * .4 + .15, d: Math.random() * 6.28 }));
  const drawEmbers = () => {
    for (const p of embers) {
      p.y -= p.v;
      p.d += .01;
      p.x += Math.sin(p.d) * .3;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      ctx.globalAlpha = Math.min(1, p.y / h) * .75;
      drawGlow(emberSprite, p.x, p.y, p.r);
    }
    ctx.globalAlpha = 1;
  };

  const sparks = [];
  const burst = (x, y, count, power) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.28;
      const s = Math.random() * power;
      sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - power * .5, life: 1, r: Math.random() * 1.4 + .6 });
    }
  };
  const drawSparks = () => {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy += .07;
      s.vx *= .985;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= .02;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      drawGlow(s.life > .55 ? hotSprite : coolSprite, s.x, s.y, s.r);
    }
    ctx.globalAlpha = 1;
  };

  const title = document.querySelector('.hero h1');
  title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
  let index = 0;
  title.querySelectorAll(':scope > span').forEach((word) => {
    const text = word.textContent.normalize('NFC');
    word.textContent = '';
    word.setAttribute('aria-hidden', 'true');
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = ch;
      span.dataset.ch = ch;
      span.style.setProperty('--i', index++);
      word.append(span);
    }
  });

  const dust = [];
  let dustPhase = 'idle';
  let dustStart = 0;
  const dissolve = () => {
    if (dustPhase !== 'idle') return;
    const box = title.getBoundingClientRect();
    const off = document.createElement('canvas');
    off.width = Math.ceil(box.width);
    off.height = Math.ceil(box.height);
    const o = off.getContext('2d', { willReadFrequently: true });
    const cs = getComputedStyle(title);
    o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    o.textBaseline = 'alphabetic';
    title.querySelectorAll(':scope > span').forEach((word, i) => {
      const r = word.getBoundingClientRect();
      const m = o.measureText(word.textContent);
      o.fillStyle = i ? '#f00' : '#00f';
      o.fillText(word.textContent, r.left - box.left, r.top - box.top + (r.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent);
    });
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const gap = Math.max(2, Math.round(parseFloat(cs.fontSize) / 45));
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    dust.length = 0;
    for (let y = 0; y < off.height; y += gap) {
      for (let x = 0; x < off.width; x += gap) {
        const k = (y * off.width + x) * 4;
        if (data[k + 3] < 140) continue;
        const angle = Math.atan2(box.top + y - cy, box.left + x - cx) + (Math.random() - .5) * 1.4;
        const speed = 5 + Math.random() * 11;
        dust.push({
          tx: box.left + x,
          ty: box.top + scrollY + y,
          x: box.left + x,
          y: box.top + scrollY + y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2,
          accent: data[k] > data[k + 2],
          size: gap * .75,
        });
      }
    }
    title.classList.add('dissolved');
    for (let i = 0; i < 6; i++) burst(box.left + Math.random() * box.width, box.top + box.height * (.3 + Math.random() * .5), 8, 4);
    dustPhase = 'scatter';
    dustStart = performance.now();
  };
  title.addEventListener('click', dissolve);
  const drawDust = () => {
    if (dustPhase === 'idle') return;
    const now = performance.now();
    if (dustPhase === 'scatter' && now - dustStart > 320) {
      dustPhase = 'gather';
      dustStart = now;
    }
    let settled = true;
    for (const d of dust) {
      if (dustPhase === 'scatter') {
        d.vx *= .86;
        d.vy *= .86;
      } else {
        d.vx = (d.vx + (d.tx - d.x) * .11) * .7;
        d.vy = (d.vy + (d.ty - d.y) * .11) * .7;
        if (Math.abs(d.tx - d.x) + Math.abs(d.ty - d.y) > 1) settled = false;
      }
      d.x += d.vx;
      d.y += d.vy;
    }
    if (dustPhase === 'gather' && (settled || now - dustStart > 900)) {
      dustPhase = 'fade';
      dustStart = now;
      title.classList.remove('dissolved');
    }
    const alpha = dustPhase === 'fade' ? Math.max(0, 1 - (now - dustStart) / 180) : 1;
    if (alpha === 0) {
      dustPhase = 'idle';
      dust.length = 0;
      return;
    }
    ctx.globalAlpha = alpha;
    for (const accent of [false, true]) {
      ctx.fillStyle = accent ? colors.accent : colors.text;
      ctx.beginPath();
      for (const d of dust) {
        if (d.accent !== accent) continue;
        ctx.rect(d.x - d.size / 2, d.y - scrollY - d.size / 2, d.size, d.size);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const labels = ['TypeScript', 'Ruby on Rails', 'C++', 'React', 'Spring Boot', 'C#', 'Angular', 'FastAPI', 'Unity'];
  const rings = [{ k: .62, tilt: -.16, speed: .0016 }, { k: .82, tilt: .1, speed: -.0011 }, { k: 1, tilt: -.04, speed: .0008 }];
  const nodes = labels.map((label, i) => ({ label, ring: rings[i % 3], a: Math.floor(i / 3) * 2.094 + (i % 3) * .7 }));
  const center = { x: 0, y: 0 };
  const measure = () => {
    const box = title.getBoundingClientRect();
    center.x = box.left + box.width / 2;
    center.y = box.top + scrollY + box.height / 2;
  };
  measure();
  addEventListener('resize', measure);
  document.fonts.ready.then(measure);
  const drawOrbit = () => {
    const top = center.y - scrollY;
    if (top < -600 || top > h + 600) return;
    const cx = center.x;
    const cy = top;
    const base = Math.min(w * .46, 560);
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.accent;
    ctx.globalAlpha = .16;
    for (const r of rings) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, base * r.k, base * r.k * .42, r.tilt, 0, 6.28);
      ctx.stroke();
    }
    ctx.font = '11px "JetBrains Mono", monospace';
    for (const n of nodes) {
      n.a += n.ring.speed;
      const rx = base * n.ring.k;
      const ry = rx * .42;
      const ex = Math.cos(n.a) * rx;
      const ey = Math.sin(n.a) * ry;
      const x = cx + ex * Math.cos(n.ring.tilt) - ey * Math.sin(n.ring.tilt);
      const y = cy + ex * Math.sin(n.ring.tilt) + ey * Math.cos(n.ring.tilt);
      const front = (Math.sin(n.a) + 1) / 2;
      ctx.globalAlpha = .25 + front * .65;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(x, y, 2 + front * 1.5, 0, 6.28);
      ctx.fill();
      if (w < 640) continue;
      ctx.globalAlpha = .18 + front * .5;
      ctx.fillStyle = colors.text;
      ctx.fillText(n.label, x + 8, y + 4);
    }
    ctx.globalAlpha = 1;
  };

  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    drawEmbers();
    drawOrbit();
    drawDust();
    drawSparks();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const sections = [...document.querySelectorAll('[data-label]')].map((el) => ({
  el,
  numeral: el.querySelector('.mono').textContent.trim(),
  label: el.dataset.label,
}));
const updateRail = (() => {
  const wrap = document.querySelector('.wrap');
  const rail = document.createElement('nav');
  rail.className = 'rail';
  rail.setAttribute('aria-label', 'Sections');
  rail.innerHTML = '<span class="rail__fill"></span>';
  const marks = sections.map((s) => {
    const a = document.createElement('a');
    a.className = 'rail__mark';
    a.href = `#${s.el.id}`;
    a.textContent = s.numeral;
    a.setAttribute('aria-label', s.label);
    rail.append(a);
    return a;
  });
  wrap.append(rail);
  let stops = [0];
  const place = () => {
    stops = sections.map((s) => {
      const box = s.el.getBoundingClientRect();
      const numeral = s.el.querySelector('.mono').getBoundingClientRect();
      return s.el.offsetTop + numeral.top - box.top + numeral.height / 2;
    });
    rail.style.top = `${stops[0]}px`;
    rail.style.height = `${stops[stops.length - 1] - stops[0]}px`;
    marks.forEach((m, i) => { m.style.top = `${stops[i] - stops[0]}px`; });
  };
  place();
  addEventListener('resize', place);
  addEventListener('load', place);
  document.fonts.ready.then(place);
  return () => {
    const length = stops[stops.length - 1] - stops[0];
    const atEnd = scrollY >= root.scrollHeight - innerHeight - 2;
    const reading = innerHeight * .5 - wrap.getBoundingClientRect().top - stops[0];
    const filled = atEnd ? length : Math.min(length, Math.max(0, reading));
    rail.style.setProperty('--fill', `${filled}px`);
    marks.forEach((m, i) => m.classList.toggle('on', filled >= stops[i] - stops[0] - 1));
  };
})();
let railQueued = false;
addEventListener('scroll', () => {
  if (railQueued) return;
  railQueued = true;
  requestAnimationFrame(() => {
    railQueued = false;
    updateRail();
  });
}, { passive: true });
addEventListener('resize', updateRail);
updateRail();

const backdrop = document.createElement('div');
backdrop.className = 'bg';
backdrop.setAttribute('aria-hidden', 'true');
document.body.prepend(backdrop);

const updateBackground = (() => {
  const field = document.createElement('canvas');
  backdrop.append(field);
  const g = field.getContext('2d');
  let fw = 0;
  let fh = 0;
  const nodes = [];
  const seed = () => {
    fw = field.width = innerWidth;
    fh = field.height = innerHeight;
    nodes.length = 0;
    const count = Math.min(90, Math.round(fw * fh / 16000));
    for (let i = 0; i < count; i++) nodes.push({ x: Math.random() * fw, y: Math.random() * fh, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, z: .3 + Math.random() * .7 });
  };
  seed();
  addEventListener('resize', seed);
  const mouse = { x: -9999, y: -9999 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  let on = 0;
  let lastY = scrollY;
  const draw = () => {
    g.clearRect(0, 0, fw, fh);
    if (on > 0) {
      g.strokeStyle = colors.accent;
      g.fillStyle = colors.accent;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x += fw;
        if (n.x > fw) n.x -= fw;
        if (n.y < 0) n.y += fh;
        if (n.y > fh) n.y -= fh;
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 130) continue;
          g.globalAlpha = (1 - d / 130) * .22;
          g.beginPath();
          g.moveTo(a.x, a.y);
          g.lineTo(b.x, b.y);
          g.stroke();
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 180) {
          g.globalAlpha = (1 - dm / 180) * .45;
          g.beginPath();
          g.moveTo(a.x, a.y);
          g.lineTo(mouse.x, mouse.y);
          g.stroke();
        }
        g.globalAlpha = .35 + a.z * .4;
        g.fillRect(a.x - a.z, a.y - a.z, a.z * 2, a.z * 2);
      }
      g.globalAlpha = 1;
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
  return (y, visible) => {
    on = visible;
    const delta = y - lastY;
    lastY = y;
    for (const n of nodes) n.y -= delta * n.z * .2;
    if (reduced) draw();
  };
})();
let bgQueued = false;
const backgroundScroll = () => {
  bgQueued = false;
  const visible = Math.min(1, Math.max(0, (scrollY - innerHeight * .35) / (innerHeight * .5)));
  backdrop.style.opacity = String(visible);
  backdrop.style.setProperty('--bg-on', visible);
  updateBackground(scrollY, visible);
};
addEventListener('scroll', () => {
  if (bgQueued) return;
  bgQueued = true;
  requestAnimationFrame(backgroundScroll);
}, { passive: true });
backgroundScroll();

document.querySelectorAll('.skills .tag').forEach((tag, i) => tag.style.setProperty('--t', i));
