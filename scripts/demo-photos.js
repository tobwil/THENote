/**
 * Painted demo photos for the gallery screenshots (scripts/screenshots.mjs):
 * simple Lisbon scenes drawn on a canvas, so no third-party or private photos
 * end up in the repository. Runs in the page; returns a JPEG data URL by name.
 */
window.__demoPhoto = (() => {
  const cache = new Map();
  const W = 1200, H = 800;
  const sky = (g, stops) => { const grad = g.createLinearGradient(0, 0, 0, H); stops.forEach(([at, color]) => grad.addColorStop(at, color)); g.fillStyle = grad; g.fillRect(0, 0, W, H); };
  const sun = (g, x, y, r, color, glow) => { const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r * 3); grad.addColorStop(0, glow); grad.addColorStop(1, 'transparent'); g.fillStyle = grad; g.fillRect(0, 0, W, H); g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const wave = (g, y, amp, len, color, phase = 0) => { g.fillStyle = color; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x / len + phase) * amp + Math.sin(x / (len * 0.37) + phase * 2) * amp * 0.4); g.lineTo(W, H); g.fill(); };
  const scenes = {
    tejo(g) {
      sky(g, [[0, '#2d2a5a'], [0.45, '#d9663f'], [0.62, '#f6b26b']]);
      sun(g, 820, 470, 46, '#ffe3a3', 'rgba(255,200,120,.55)');
      g.fillStyle = '#3b2340'; g.fillRect(0, 520, W, 18);
      // The bridge: towers and cables.
      g.strokeStyle = '#2a1a33'; g.lineWidth = 5;
      for (const x of [260, 700]) { g.fillStyle = '#2a1a33'; g.fillRect(x - 9, 300, 18, 230); }
      g.beginPath(); g.moveTo(0, 470); g.quadraticCurveTo(260, 290, 260, 300); g.quadraticCurveTo(480, 470, 700, 300); g.quadraticCurveTo(700, 290, W, 460); g.stroke();
      g.lineWidth = 2; for (let x = 20; x < W; x += 34) { const top = x < 260 ? 470 - (x / 260) * 170 : x < 700 ? 300 + Math.sin(((x - 260) / 440) * Math.PI) * 150 : 300 + ((x - 700) / 500) * 160; g.beginPath(); g.moveTo(x, top); g.lineTo(x, 512); g.stroke(); }
      wave(g, 560, 6, 60, '#7a3e4f'); wave(g, 610, 7, 45, '#5a2d45', 1); wave(g, 680, 8, 38, '#3e2038', 2);
      g.fillStyle = 'rgba(255,220,150,.35)'; for (let i = 0; i < 9; i++) g.fillRect(780 + Math.sin(i) * 30, 560 + i * 24, 90 - i * 7, 4);
    },
    alfama(g) {
      sky(g, [[0, '#5aa7e0'], [1, '#cfe9f7']]);
      const colors = ['#f2d0a4', '#e8a87c', '#f7e1c0', '#d98b6a', '#f4c48a', '#e9dccb', '#c9775a'];
      let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let row = 0; row < 5; row++) {
        const base = 330 + row * 105;
        for (let x = -40; x < W; x += 90 + rnd() * 60) {
          const w = 100 + rnd() * 70, h = 120 + rnd() * 90, top = base - h + row * 6;
          g.fillStyle = colors[Math.floor(rnd() * colors.length)]; g.fillRect(x, top, w, h + 120);
          g.fillStyle = '#b4532a'; g.beginPath(); g.moveTo(x - 8, top); g.lineTo(x + w / 2, top - 34); g.lineTo(x + w + 8, top); g.fill();
          g.fillStyle = 'rgba(40,60,90,.55)'; for (let wy = top + 22; wy < top + h; wy += 38) for (let wx = x + 14; wx < x + w - 20; wx += 30) g.fillRect(wx, wy, 14, 20);
        }
      }
      g.fillStyle = '#f5f0e6'; g.fillRect(520, 70, 26, 150); g.beginPath(); g.arc(533, 70, 30, Math.PI, 0); g.fill();
    },
    atlantik(g) {
      sky(g, [[0, '#7cc4ea'], [0.5, '#bfe4f5']]);
      sun(g, 300, 150, 40, '#fff6d5', 'rgba(255,250,220,.6)');
      g.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y, s] of [[760, 120, 1], [980, 190, 0.7], [160, 250, 0.6]]) { g.beginPath(); g.ellipse(x, y, 90 * s, 26 * s, 0, 0, Math.PI * 2); g.ellipse(x + 50 * s, y - 16 * s, 60 * s, 30 * s, 0, 0, Math.PI * 2); g.fill(); }
      wave(g, 380, 5, 70, '#2f7fb5'); wave(g, 440, 9, 52, '#2a6fa0', 1.5); wave(g, 520, 12, 44, '#3d8fc0', 3);
      wave(g, 560, 10, 40, 'rgba(255,255,255,.75)', 3.2);
      wave(g, 600, 14, 90, '#ecd3a0', 0.4); wave(g, 690, 10, 120, '#e2c48c', 1.1);
    },
    azulejos(g) {
      g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H);
      const size = 200;
      for (let y = 0; y < H; y += size) for (let x = 0; x < W; x += size) {
        g.save(); g.translate(x + size / 2, y + size / 2);
        g.strokeStyle = '#e3ddd0'; g.strokeRect(-size / 2, -size / 2, size, size);
        g.fillStyle = '#1f4e9a';
        for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(46, -62, 0, -96); g.quadraticCurveTo(-46, -62, 0, -18); g.fill(); g.beginPath(); g.arc(70, -70, 16, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#f2b134'; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1f4e9a'; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    },
    miradouro(g) {
      sky(g, [[0, '#1d2350'], [0.5, '#6b4a8a'], [0.78, '#e48a7a']]);
      let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 70; i++) g.fillRect(rnd() * W, rnd() * 300, 2, 2);
      sun(g, 900, 120, 26, '#f4f1e0', 'rgba(255,255,230,.25)');
      wave(g, 480, 26, 170, '#3b2e5e'); wave(g, 560, 20, 120, '#2b2148', 2);
      // City lights scattered over the hills, warmer and denser towards the river.
      for (let i = 0; i < 520; i++) { const x = rnd() * W, y = 540 + Math.pow(rnd(), 0.7) * 200; g.fillStyle = rnd() > 0.2 ? '#ffd27a' : '#fff1c4'; g.fillRect(x, y, 3, 3); }
      g.fillStyle = '#16112b'; g.fillRect(0, 740, W, 60);
      g.fillStyle = 'rgba(255,210,122,.35)'; for (let i = 0; i < 40; i++) g.fillRect(rnd() * W, 752 + rnd() * 40, 30 + rnd() * 40, 2);
    },
    cabo(g) {
      sky(g, [[0, '#9fd3ee'], [1, '#e6f4fa']]);
      wave(g, 470, 6, 80, '#2c78a8'); wave(g, 540, 9, 60, '#2a6c98', 2);
      g.fillStyle = '#6f8f4e'; g.beginPath(); g.moveTo(560, H); g.lineTo(600, 420); g.lineTo(760, 360); g.lineTo(W, 330); g.lineTo(W, H); g.fill();
      g.fillStyle = '#8a6b4a'; g.beginPath(); g.moveTo(560, H); g.lineTo(600, 420); g.lineTo(640, 520); g.lineTo(610, H); g.fill();
      g.fillStyle = '#f4f1ea'; g.fillRect(900, 200, 44, 150); g.fillStyle = '#c0392b'; g.fillRect(894, 180, 56, 26); g.fillStyle = '#f9e27a'; g.fillRect(908, 160, 28, 20);
      g.fillStyle = 'rgba(255,255,255,.8)'; for (const x of [520, 600, 640]) { g.beginPath(); g.ellipse(x, 560, 40, 6, 0, 0, Math.PI * 2); g.fill(); }
    },
  };
  return name => {
    if (!scenes[name]) return null;
    if (!cache.has(name)) {
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      scenes[name](canvas.getContext('2d'));
      cache.set(name, canvas.toDataURL('image/jpeg', 0.9));
    }
    return cache.get(name);
  };
})();
