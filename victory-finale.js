// The full victory of the game, drawn in 2D over the final-scene screen: a night of fireworks, a
// gold medal with the player's own monster in it, the savings counted up coin by coin under a rain
// of coins, and every goal bought stamped onto the «Мастер бюджета» certificate. A tap on the sky
// launches one more rocket. main.js puts the live monster into `portrait` and calls stop() when the
// player moves on; the sounds are synthesised here and stay silent while the game is muted.

const TAU = Math.PI * 2;
const HUES = [46, 330, 192, 276, 146, 18];
const MAX_SPARKS = 1400;
const COUNT_MS = 2100;
const STAMP_GAP_MS = 460;

const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function plural(count, [one, few, many]) {
  const tens = Math.abs(count) % 100;
  const units = tens % 10;
  if (tens > 10 && tens < 20) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
}

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const formatNumber = (value) => Math.round(value).toLocaleString('ru-RU');

// Short synthesised sounds: a fanfare, the pops of the fireworks, coins and the rubber stamp.
class VictorySound {
  constructor(isMuted) {
    this.isMuted = isMuted;
    this.context = null;
    this.lastPop = 0;
    this.lastClink = 0;
  }

  ready() {
    if (this.isMuted()) return null;
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
      this.output = this.context.createGain();
      this.output.gain.value = 0.3;
      this.output.connect(this.context.destination);
      const length = this.context.sampleRate;
      this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1;
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    return this.context;
  }

  tone(frequency, start, duration, { type = 'triangle', gain = 0.2, slideTo = 0 } = {}) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(this.output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  noise(start, duration, { gain = 0.2, frequency = 800, filter = 'lowpass' } = {}) {
    const source = this.context.createBufferSource();
    const band = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    band.type = filter;
    band.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(band).connect(envelope).connect(this.output);
    source.start(start, Math.random() * 0.4);
    source.stop(start + duration + 0.05);
  }

  fanfare() {
    if (!this.ready()) return;
    const start = this.context.currentTime + 0.03;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      this.tone(frequency, start + index * 0.13, 0.24, { gain: 0.2 });
      this.tone(frequency, start + index * 0.13, 0.2, { type: 'square', gain: 0.05 });
    });
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency) => {
      this.tone(frequency, start + 0.42, 1.5, { gain: 0.11 });
      this.tone(frequency * 1.003, start + 0.42, 1.2, { type: 'sawtooth', gain: 0.02 });
    });
  }

  pop(size = 1) {
    if (!this.ready()) return;
    const now = this.context.currentTime;
    if (now - this.lastPop < 0.08) return;
    this.lastPop = now;
    this.noise(now, 0.55 * size, { gain: 0.22 * size, frequency: random(500, 1100) });
    this.tone(random(80, 110), now, 0.3, { type: 'sine', gain: 0.25 * size, slideTo: 38 });
  }

  clink() {
    if (!this.ready()) return;
    const now = this.context.currentTime;
    if (now - this.lastClink < 0.07) return;
    this.lastClink = now;
    const base = random(2300, 2900);
    this.tone(base, now, 0.12, { type: 'sine', gain: 0.05 });
    this.tone(base * 1.5, now + 0.01, 0.09, { type: 'sine', gain: 0.03 });
  }

  jackpot() {
    if (!this.ready()) return;
    const start = this.context.currentTime;
    [1318.5, 1568, 2093, 2637].forEach((frequency, index) => {
      this.tone(frequency, start + index * 0.06, 0.4, { type: 'sine', gain: 0.07 });
    });
  }

  stamp() {
    if (!this.ready()) return;
    const now = this.context.currentTime;
    this.tone(150, now, 0.2, { type: 'sine', gain: 0.4, slideTo: 50 });
    this.noise(now, 0.09, { gain: 0.3, frequency: 420, filter: 'bandpass' });
  }

  close() {
    this.context?.close().catch(() => {});
    this.context = null;
  }
}

export class VictoryFinale {
  // `stamps` are the goals bought ({ title, image }) and, when coins are left, the piggy bank
  // ({ title, icon, mark }). `total` is everything saved: the goals bought and the piggy bank.
  constructor({ screen, art, name, total, day, stamps, isMuted = () => false }) {
    this.screen = screen;
    this.art = art;
    this.total = Math.max(0, Number(total) || 0);
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.sound = new VictorySound(isMuted);
    this.timers = [];
    this.frame = 0;
    this.rockets = [];
    this.sparks = [];
    this.coins = [];
    this.confetti = [];
    this.coinRain = 0;
    this.nextLaunch = 0.6;
    this.count = null;
    this.width = 0;
    this.height = 0;

    this.fx = element('div', 'victory-fx');
    this.fx.setAttribute('aria-hidden', 'true');
    this.sparkCanvas = element('canvas', 'victory-sparks');
    this.rainCanvas = element('canvas', 'victory-rain');
    this.fx.append(this.sparkCanvas, this.rainCanvas);
    this.sparkContext = this.sparkCanvas.getContext('2d');
    this.rainContext = this.rainCanvas.getContext('2d');

    this.rays = element('div', 'victory-rays');
    this.portrait = element('div', 'victory-portrait');
    this.portrait.append(element('span', 'victory-portrait-fallback', '🏆'));
    this.crown = element('div', 'victory-crown', '👑');
    this.ribbon = element('div', 'victory-ribbon', 'ПОБЕДА!');
    this.medalParts = [this.rays, this.portrait, this.crown, this.ribbon];
    for (const part of [this.rays, this.crown, this.ribbon]) part.setAttribute('aria-hidden', 'true');

    const days = `${day} ${plural(day, ['день', 'дня', 'дней'])}`;
    this.card = element('section', 'victory-card');
    this.card.setAttribute('aria-label', `Грамота «Мастер бюджета»: ${formatNumber(this.total)} `
      + `${plural(this.total, ['монета', 'монеты', 'монет'])} накоплено за ${days}`);
    const cardKicker = element('p', 'victory-card-kicker', '✦ ГРАМОТА ✦');
    const cardTitle = element('p', 'victory-card-title', 'Мастер бюджета');
    const cardTo = element('p', 'victory-card-to', 'вручается хозяину монстрика ');
    cardTo.append(element('b', '', name));
    const totalLine = element('p', 'victory-total');
    const coin = element('span', 'victory-coin');
    this.counter = element('strong', '', this.reduced ? formatNumber(this.total) : '0');
    totalLine.append(coin, this.counter);
    this.totalLine = totalLine;
    const daysLine = element('p', 'victory-days',
      `${plural(this.total, ['монета накоплена', 'монеты накоплено', 'монет накоплено'])} за ${days}`);
    this.stampList = element('ul', 'victory-stamps');
    this.stamps = (stamps ?? []).map((stamp) => {
      const item = element('li', 'victory-stamp');
      const picture = element('span', 'victory-stamp-pic');
      if (stamp.image) {
        const image = element('img');
        image.src = stamp.image;
        image.alt = '';
        image.addEventListener('error', () => { picture.textContent = stamp.icon || '🎁'; });
        picture.append(image);
      } else picture.textContent = stamp.icon || '🎁';
      item.append(picture, element('span', 'victory-stamp-mark', stamp.mark || 'КУПЛЕНО'),
        element('span', 'victory-stamp-name', stamp.title));
      this.stampList.append(item);
      return item;
    });
    this.seal = element('span', 'victory-seal', '★');
    this.seal.setAttribute('aria-hidden', 'true');
    this.card.append(cardKicker, cardTitle, cardTo, totalLine, daysLine, this.stampList, this.seal);

    this.onPointerDown = (event) => {
      if (event.target.closest('button, a, input, label')) return;
      const box = this.screen.getBoundingClientRect();
      this.launch(event.clientX - box.left, event.clientY - box.top);
    };
    this.onFrame = (time) => this.tick(time);
  }

  start() {
    this.screen.classList.add('is-victory');
    this.screen.prepend(this.fx);
    this.art.append(...this.medalParts);
    this.art.after(this.card);
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.screen);
    this.screen.addEventListener('pointerdown', this.onPointerDown);
    this.sound.fanfare();

    if (this.reduced) {
      this.stamps.forEach((stamp) => stamp.classList.add('is-stamped'));
      this.seal.classList.add('is-stamped');
      return;
    }
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.onFrame);
    this.later(120, () => this.launch(this.width * 0.3, this.height * 0.2));
    this.later(420, () => this.launch(this.width * 0.72, this.height * 0.16));
    // The certificate slides in at 0.9 s (styles.css); the count starts once it has landed.
    this.later(1500, () => {
      this.count = { start: performance.now() };
      this.coinRain = 1;
    });
    this.later(1500 + COUNT_MS, () => this.counted());
    const stampsAt = 1500 + COUNT_MS + 350;
    this.stamps.forEach((stamp, index) => this.later(stampsAt + index * STAMP_GAP_MS, () => this.stampOn(stamp)));
    const sealAt = stampsAt + this.stamps.length * STAMP_GAP_MS + 150;
    this.later(sealAt, () => this.stampOn(this.seal, 34));
    this.later(sealAt + 450, () => this.finale());
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.observer?.disconnect();
    this.screen.removeEventListener('pointerdown', this.onPointerDown);
    this.screen.classList.remove('is-victory');
    this.fx.remove();
    this.card.remove();
    this.medalParts.forEach((part) => part.remove());
    this.sound.close();
  }

  later(ms, callback) {
    this.timers.push(setTimeout(callback, ms));
  }

  resize() {
    const width = this.screen.clientWidth;
    const height = this.screen.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    for (const [canvas, context] of [[this.sparkCanvas, this.sparkContext], [this.rainCanvas, this.rainContext]]) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  // Where an element of the screen sits on the canvases.
  centerOf(node) {
    const box = node.getBoundingClientRect();
    const screen = this.screen.getBoundingClientRect();
    return { x: box.left - screen.left + box.width / 2, y: box.top - screen.top + box.height / 2 };
  }

  counted() {
    this.count = null;
    this.coinRain = 0.25;
    this.counter.textContent = formatNumber(this.total);
    this.totalLine.classList.add('is-counted');
    this.sound.jackpot();
    const { x, y } = this.centerOf(this.counter);
    this.burst(x, y, { type: 'peony', hue: 46, count: 70, speed: 0.7 });
    this.cannons();
  }

  stampOn(node, sparks = 22) {
    node.classList.add('is-stamped');
    this.sound.stamp();
    this.later(90, () => {
      const { x, y } = this.centerOf(node);
      this.burst(x, y, { type: 'ring', hue: 46, count: sparks, speed: 0.32, life: 0.7 });
    });
  }

  finale() {
    this.coinRain = 0;
    const spots = [0.2, 0.8, 0.5, 0.35, 0.65, 0.5];
    spots.forEach((spot, index) => this.later(index * 230,
      () => this.launch(this.width * spot, this.height * random(0.12, 0.3), index === 2 ? 'heart' : undefined)));
  }

  // Confetti from both bottom corners.
  cannons() {
    const colors = ['#ffd84d', '#ff5c8a', '#4fd1ff', '#9b6bff', '#6ee7a8', '#ff9a3c', '#ffffff'];
    for (const side of [0, 1]) {
      for (let index = 0; index < 70; index += 1) {
        const angle = side ? random(-2.2, -1.75) : random(-1.4, -0.95);
        const speed = random(0.9, 1.45) * this.height;
        this.confetti.push({
          x: side ? this.width + 6 : -6,
          y: this.height * 0.92,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rotation: random(0, TAU),
          spin: random(-9, 9),
          phase: random(0, TAU),
          width: random(6, 11),
          height: random(8, 15),
          color: pick(colors),
          life: random(4.5, 6.5),
        });
      }
    }
  }

  launch(x, targetY = this.height * random(0.12, 0.34), type) {
    if (this.reduced || this.rockets.length > 6) return;
    const startX = Math.min(this.width - 20, Math.max(20, x + random(-40, 40)));
    const gravity = 260;
    const rise = Math.max(80, this.height + 10 - targetY);
    const vy = -Math.sqrt(2 * gravity * rise);
    const time = -vy / gravity;
    this.rockets.push({
      x: startX,
      y: this.height + 10,
      vx: (x - startX) / time,
      vy,
      gravity,
      hue: pick(HUES),
      type: type ?? pick(['peony', 'peony', 'ring', 'willow', 'willow', 'heart', 'double']),
    });
  }

  burst(x, y, { type = 'peony', hue = pick(HUES), count, speed = 1, life } = {}) {
    const scale = Math.min(this.width, this.height * 0.62) * speed;
    const add = (vx, vy, options = {}) => {
      if (this.sparks.length >= MAX_SPARKS) return;
      const maxLife = options.life ?? life ?? random(1.1, 1.6);
      this.sparks.push({
        x, y, vx, vy,
        life: maxLife,
        maxLife,
        hue: (options.hue ?? hue) + random(-12, 12),
        light: options.light ?? random(62, 76),
        size: options.size ?? random(1.3, 2.1),
        drag: options.drag ?? 0.955,
        gravity: options.gravity ?? 70,
        flicker: options.flicker ?? false,
      });
    };
    // The flash of the explosion.
    this.sparks.push({ x, y, vx: 0, vy: 0, life: 0.22, maxLife: 0.22, hue, light: 88, size: scale * 0.09,
      drag: 1, gravity: 0, flash: true });

    if (type === 'ring') {
      const total = count ?? 44;
      const turn = random(0, TAU);
      for (let index = 0; index < total; index += 1) {
        const angle = turn + (index / total) * TAU;
        add(Math.cos(angle) * scale * 1.1, Math.sin(angle) * scale * 0.95);
      }
      if (!count) for (let index = 0; index < 18; index += 1) {
        const angle = random(0, TAU);
        add(Math.cos(angle) * scale * 0.35, Math.sin(angle) * scale * 0.35, { hue: hue + 150 });
      }
    } else if (type === 'heart') {
      const total = count ?? 64;
      for (let index = 0; index < total; index += 1) {
        const t = (index / total) * TAU;
        const hx = 16 * Math.sin(t) ** 3;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        add(hx * scale * 0.07, hy * scale * 0.07, { hue: 342, gravity: 30, light: 70 });
      }
    } else if (type === 'willow') {
      const total = count ?? 80;
      for (let index = 0; index < total; index += 1) {
        const angle = random(0, TAU);
        const force = Math.sqrt(Math.random()) * scale;
        add(Math.cos(angle) * force, Math.sin(angle) * force,
          { hue: 42, light: random(58, 70), life: random(2.2, 3), drag: 0.965, gravity: 55, flicker: true, size: 1.4 });
      }
    } else if (type === 'double') {
      for (let index = 0; index < 50; index += 1) {
        const angle = random(0, TAU);
        add(Math.cos(angle) * scale, Math.sin(angle) * scale);
      }
      const inner = hue + 150;
      for (let index = 0; index < 30; index += 1) {
        const angle = random(0, TAU);
        add(Math.cos(angle) * scale * 0.5, Math.sin(angle) * scale * 0.5, { hue: inner, flicker: true });
      }
    } else {
      const total = count ?? 72;
      for (let index = 0; index < total; index += 1) {
        const angle = random(0, TAU);
        const force = (0.55 + 0.45 * Math.sqrt(Math.random())) * scale;
        add(Math.cos(angle) * force, Math.sin(angle) * force);
      }
    }
    this.sound.pop(type === 'willow' ? 1 : 0.8);
  }

  tick(time) {
    const delta = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    this.frame = requestAnimationFrame(this.onFrame);
    if (!this.width) return;

    this.nextLaunch -= delta;
    if (this.nextLaunch <= 0) {
      this.nextLaunch = random(0.9, 1.9);
      this.launch(this.width * random(0.15, 0.85));
    }
    if (this.count) {
      const progress = Math.min(1, (time - this.count.start) / COUNT_MS);
      const eased = 1 - (1 - progress) ** 3;
      this.counter.textContent = formatNumber(this.total * eased);
      if (progress < 1) this.sound.clink();
    }
    if (this.coinRain > 0 && Math.random() < this.coinRain * delta * 22) this.dropCoin();

    this.drawSparks(delta);
    this.drawRain(delta);
  }

  dropCoin() {
    const radius = random(7, 13);
    this.coins.push({
      x: random(10, this.width - 10),
      y: -radius * 2,
      vx: random(-25, 25),
      vy: random(60, 160),
      turn: random(0, TAU),
      spin: random(5, 11),
      tilt: random(-0.4, 0.4),
      radius,
    });
  }

  drawSparks(delta) {
    const context = this.sparkContext;
    context.globalCompositeOperation = 'destination-out';
    context.fillStyle = `rgba(0, 0, 0, ${1 - 0.8 ** (delta * 60)})`;
    context.fillRect(0, 0, this.width, this.height);
    context.globalCompositeOperation = 'lighter';

    for (let index = this.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = this.rockets[index];
      rocket.vy += rocket.gravity * delta;
      rocket.x += rocket.vx * delta;
      rocket.y += rocket.vy * delta;
      if (this.sparks.length < MAX_SPARKS) {
        this.sparks.push({ x: rocket.x, y: rocket.y, vx: random(-18, 18), vy: random(10, 50), life: 0.4, maxLife: 0.4,
          hue: 38, light: 70, size: 1.2, drag: 0.94, gravity: 40 });
      }
      context.fillStyle = 'rgba(255, 244, 214, 1)';
      context.beginPath();
      context.arc(rocket.x, rocket.y, 2.2, 0, TAU);
      context.fill();
      if (rocket.vy >= -25) {
        this.rockets.splice(index, 1);
        this.burst(rocket.x, rocket.y, { type: rocket.type, hue: rocket.hue });
      }
    }

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      spark.life -= delta;
      if (spark.life <= 0) {
        this.sparks.splice(index, 1);
        continue;
      }
      const drag = spark.drag ** (delta * 60);
      spark.vx *= drag;
      spark.vy = spark.vy * drag + spark.gravity * delta;
      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      const left = spark.life / spark.maxLife;
      let alpha = Math.min(1, left * 2.2);
      if (spark.flicker && left < 0.6) alpha *= Math.random() < 0.35 ? 0.15 : 1;
      if (spark.flash) {
        const glow = context.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, spark.size);
        glow.addColorStop(0, `hsla(${spark.hue}, 100%, 90%, ${0.55 * left})`);
        glow.addColorStop(1, `hsla(${spark.hue}, 100%, 60%, 0)`);
        context.fillStyle = glow;
        context.fillRect(spark.x - spark.size, spark.y - spark.size, spark.size * 2, spark.size * 2);
        continue;
      }
      context.fillStyle = `hsla(${spark.hue}, 100%, ${spark.light}%, ${alpha})`;
      context.beginPath();
      context.arc(spark.x, spark.y, spark.size * (0.5 + left * 0.6), 0, TAU);
      context.fill();
    }
  }

  drawRain(delta) {
    const context = this.rainContext;
    context.clearRect(0, 0, this.width, this.height);

    for (let index = this.coins.length - 1; index >= 0; index -= 1) {
      const coin = this.coins[index];
      coin.vy = Math.min(coin.vy + 420 * delta, 420);
      coin.x += coin.vx * delta;
      coin.y += coin.vy * delta;
      coin.turn += coin.spin * delta;
      if (coin.y > this.height + 30) {
        this.coins.splice(index, 1);
        continue;
      }
      const face = Math.cos(coin.turn);
      const width = Math.max(0.8, Math.abs(face) * coin.radius);
      context.save();
      context.translate(coin.x, coin.y);
      context.rotate(coin.tilt);
      context.fillStyle = '#b86a00';
      context.beginPath();
      context.ellipse(face > 0 ? 1.6 : -1.6, 0, width + 1.4, coin.radius, 0, 0, TAU);
      context.fill();
      context.fillStyle = face > 0 ? '#ffd23f' : '#f0ac1c';
      context.beginPath();
      context.ellipse(0, 0, width, coin.radius, 0, 0, TAU);
      context.fill();
      context.strokeStyle = 'rgba(170, 95, 0, 0.6)';
      context.lineWidth = 1.2;
      context.beginPath();
      context.ellipse(0, 0, width * 0.68, coin.radius * 0.68, 0, 0, TAU);
      context.stroke();
      context.fillStyle = 'rgba(255, 255, 240, 0.7)';
      context.beginPath();
      context.ellipse(-width * 0.3, -coin.radius * 0.35, width * 0.22, coin.radius * 0.2, -0.5, 0, TAU);
      context.fill();
      context.restore();
    }

    for (let index = this.confetti.length - 1; index >= 0; index -= 1) {
      const piece = this.confetti[index];
      piece.life -= delta;
      if (piece.life <= 0 || piece.y > this.height + 30) {
        this.confetti.splice(index, 1);
        continue;
      }
      const drag = 0.955 ** (delta * 60);
      piece.vx *= drag;
      piece.vy = Math.min(piece.vy * drag + 520 * delta, 85);
      piece.phase += delta * 7;
      piece.rotation += piece.spin * delta;
      piece.x += (piece.vx + Math.sin(piece.phase) * 35) * delta;
      piece.y += piece.vy * delta;
      context.save();
      context.globalAlpha = Math.min(1, piece.life);
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.scale(1, Math.cos(piece.phase));
      context.fillStyle = piece.color;
      context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      context.restore();
    }
  }
}
