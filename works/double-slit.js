const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const SCREEN_X = W - 160, HIST_W = 150;   // スクリーンは右側、ヒストグラムはその右
const $ = id => document.getElementById(id);
let observe = false, count = 0, dots = [];
const bins = new Array(H).fill(0);

// 遠方場の強度。y: スクリーン上の位置(-1..1)。無次元化したパラメータを使う。
function intensity(y, d, lam, observed) {
  const k = y * 10 / lam;                      // 角度に比例する量
  const a = 1.2;                               // スリット幅
  const s = k === 0 ? 1 : Math.sin(Math.PI * a * k / 6) / (Math.PI * a * k / 6);
  const single = s * s;
  if (observed) return single;                 // 経路が分かると干渉項が消える
  const c = Math.cos(Math.PI * d * k / 6);
  return single * c * c;
}

function shoot() {
  const d = +$('d').value, lam = +$('w').value;
  // 棄却サンプリング
  for (let i = 0; i < 1000; i++) {
    const y = (Math.random() * 2 - 1);
    if (Math.random() <= intensity(y, d, lam, observe)) {
      const py = Math.round((y + 1) / 2 * (H - 1));
      bins[py]++; count++;
      dots.push({ y: py, x: SCREEN_X + Math.random() * 3, age: 0 });
      if (dots.length > 6000) dots.shift();
      return;
    }
  }
}

function draw() {
  ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, W, H);
  // 壁と2つのスリット
  const wallX = 200, d = +$('d').value, gap = d * 14;
  ctx.fillStyle = '#394264';
  const s1 = H / 2 - gap / 2, s2 = H / 2 + gap / 2, sw = 14;
  ctx.fillRect(wallX, 0, 6, s1 - sw / 2);
  ctx.fillRect(wallX, s1 + sw / 2, 6, s2 - s1 - sw);
  ctx.fillRect(wallX, s2 + sw / 2, 6, H);
  // 発射源
  ctx.fillStyle = '#5eead4'; ctx.beginPath(); ctx.arc(40, H / 2, 8, 0, 7); ctx.fill();
  // 観測器
  if (observe) {
    ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
    for (const y of [s1, s2]) { ctx.beginPath(); ctx.arc(wallX + 3, y, 14, 0, 7); ctx.stroke(); }
  }
  // スクリーン
  ctx.fillStyle = '#1b2240'; ctx.fillRect(SCREEN_X - 2, 0, 2, H);
  for (const p of dots) {
    ctx.fillStyle = 'rgba(94,234,212,.7)';
    ctx.fillRect(p.x, p.y, 3, 1.5);
  }
  // ヒストグラム
  const max = Math.max(1, ...bins);
  ctx.fillStyle = '#fbbf24';
  for (let y = 0; y < H; y++) {
    ctx.fillRect(SCREEN_X + 12, y, bins[y] / max * (HIST_W - 20), 1);
  }
}

let last = 0;
function loop(t) {
  const n = +$('r').value;
  for (let i = 0; i < n; i++) shoot();
  $('count').textContent = count;
  draw();
  requestAnimationFrame(loop);
}
function reset() { bins.fill(0); dots = []; count = 0; }

$('obs').onclick = () => {
  observe = !observe;
  $('obs').textContent = '観測: ' + (observe ? 'ON' : 'OFF');
  $('obs').classList.toggle('off', !observe);
  reset();
};
$('reset').onclick = reset;
['d', 'w'].forEach(id => $(id).oninput = reset);
requestAnimationFrame(loop);
