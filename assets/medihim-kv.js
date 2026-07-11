/*!
 * Medihim Key Visual — "4d" 라이트 풀페이지 배경 (의존성 없음)
 * 우측 노드 허브 + 상승 리본(1a+1b) + 성장 스파인 곡선(4b)
 * 사용법:
 *   <canvas data-medihim-kv="mix4"></canvas>
 *   <script src="medihim-kv.js"></script>
 * 옵션(캔버스 속성): data-cx / data-cy = 허브 중심 위치(0~1)
 *   motion: 'auto'(기본, prefers-reduced-motion 존중) | 'on' | 'off'
 */
(function (global) {
  'use strict';

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var motion = opts.motion || 'auto';
    var maxDpr = opts.dpr || 2;
    var cxF = opts.cx != null ? opts.cx : (canvas.dataset.cx != null ? parseFloat(canvas.dataset.cx) : 0.8);
    var cyF = opts.cy != null ? opts.cy : (canvas.dataset.cy != null ? parseFloat(canvas.dataset.cy) : 0.30);
    var W = 0, H = 0;

    // --- geometry ---
    var nodes = [];
    [{ r: 0.10, n: 6 }, { r: 0.17, n: 9 }, { r: 0.24, n: 12 }].forEach(function (row) {
      for (var i = 0; i < row.n; i++) nodes.push({ a: (i / row.n) * 6.2832 + Math.random(), r: row.r + Math.random() * 0.02, ph: Math.random(), sp: 0.1 + Math.random() * 0.16, warm: Math.random() < 0.22 });
    });
    var cols = ['27,165,184', '46,91,255', '255,107,53', '27,165,184', '90,180,255'];
    var rib = [];
    for (var i = 0; i < 6; i++) rib.push({ y0: 0.5 + Math.random() * 0.42, tilt: 0.1 + Math.random() * 0.12, amp: 0.015 + Math.random() * 0.025, wl: 3 + Math.random() * 3, ph: Math.random() * 6, sp: 0.12 + Math.random() * 0.2, col: cols[i % cols.length], w: 1.2 + Math.random() * 1.6 });
    var spines = [[0.05, 0.96, 0.42, 0.82, 0.6, 0.42, 0.99, 0.16], [0.0, 0.72, 0.34, 0.7, 0.63, 0.32, 0.96, 0.36]];

    function fit() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(global.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = r.width; H = r.height;
    }
    function bez(a, b, c, d, tt) { var u = 1 - tt; return u * u * u * a + 3 * u * u * tt * b + 3 * u * tt * tt * c + tt * tt * tt * d; }

    function draw(t) {
      if (!W) return;
      // soft light background
      var bg = ctx.createLinearGradient(0, 0, W * 0.35, H);
      bg.addColorStop(0, '#f6faff'); bg.addColorStop(0.5, '#eef5fd'); bg.addColorStop(1, '#e2edfa');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      var hl = ctx.createRadialGradient(W * cxF, H * cyF, 0, W * cxF, H * cyF, W * 0.6);
      hl.addColorStop(0, 'rgba(255,255,255,0.6)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl; ctx.fillRect(0, 0, W, H);

      // rising ribbons
      ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round';
      rib.forEach(function (rb) {
        ctx.beginPath();
        for (var x = -20; x <= W + 20; x += 8) { var nx = x / W, y = H * (rb.y0 - nx * rb.tilt) + rb.amp * H * Math.sin(nx * rb.wl + rb.ph + t * rb.sp); x <= -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(' + rb.col + ',0.16)'; ctx.lineWidth = rb.w; ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';

      // node hub
      var cx = W * cxF, cy = H * cyF, R = Math.min(W, H);
      nodes.forEach(function (n) {
        var nx = cx + Math.cos(n.a) * n.r * R * 1.5, ny = cy + Math.sin(n.a) * n.r * R;
        var col = n.warm ? '255,107,53' : '27,165,184';
        ctx.strokeStyle = 'rgba(' + col + ',0.14)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
        var p = (t * n.sp + n.ph) % 1, px = cx + (nx - cx) * p, py = cy + (ny - cy) * p;
        ctx.fillStyle = 'rgba(' + col + ',0.5)'; ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(' + col + ',0.6)'; ctx.beginPath(); ctx.arc(nx, ny, 2, 0, 7); ctx.fill();
      });
      var pr = 0.9 + 0.1 * Math.sin(t * 1.5), cr = R * 0.13 * pr;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(46,91,255,0.16)'); g.addColorStop(0.75, 'rgba(27,165,184,0.1)'); g.addColorStop(1, 'rgba(27,165,184,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(46,91,255,0.85)'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();

      // growth spines
      spines.forEach(function (sp, si) {
        var grad = ctx.createLinearGradient(sp[0] * W, sp[1] * H, sp[6] * W, sp[7] * H);
        grad.addColorStop(0, 'rgba(255,107,53,0.3)'); grad.addColorStop(0.5, 'rgba(46,91,255,0.28)'); grad.addColorStop(1, 'rgba(27,165,184,0.36)');
        ctx.strokeStyle = grad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sp[0] * W, sp[1] * H); ctx.bezierCurveTo(sp[2] * W, sp[3] * H, sp[4] * W, sp[5] * H, sp[6] * W, sp[7] * H); ctx.stroke();
        var tt = (t * 0.16 + si * 0.5) % 1, px = bez(sp[0], sp[2], sp[4], sp[6], tt) * W, py = bez(sp[1], sp[3], sp[5], sp[7], tt) * H;
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(46,91,255,0.7)';
        ctx.fillStyle = 'rgba(46,91,255,0.92)'; ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animate = motion === 'on' || (motion === 'auto' && !reduce);
    var raf = 0, start = 0;
    function frame(now) { if (!start) start = now; draw((now - start) / 1000); raf = global.requestAnimationFrame(frame); }

    fit();
    var ro = new ResizeObserver(function () { fit(); if (!animate) draw(6.2); });
    ro.observe(canvas);
    if (animate) raf = global.requestAnimationFrame(frame); else draw(6.2);

    return { destroy: function () { global.cancelAnimationFrame(raf); ro.disconnect(); }, redraw: function () { fit(); draw(6.2); } };
  }

  function auto() { var els = document.querySelectorAll('[data-medihim-kv]'); for (var i = 0; i < els.length; i++) mount(els[i], {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
  global.MedihimKV = { mount: mount };
})(window);
