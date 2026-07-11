/*!
 * Medihim Key Visual — "1a Network Nexus" 배경 애니메이션 (의존성 없음)
 * 사용법:
 *   <canvas id="kv" data-medihim-kv="nexus"></canvas>
 *   <script src="medihim-kv.js"></script>
 * 또는 수동:
 *   MedihimKV.mount(document.getElementById('kv'), { motion: 'auto' });
 *
 * 옵션:
 *   motion : 'auto'(기본, prefers-reduced-motion 존중) | 'on' | 'off'(정지 프레임)
 *   dpr    : 최대 devicePixelRatio (기본 2)
 */
(function (global) {
  'use strict';

  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var motion = opts.motion || 'auto';
    var maxDpr = opts.dpr || 2;
    var W = 0, H = 0;

    // --- 정적 지오메트리 ---
    var rf = [0.20, 0.32, 0.44, 0.54], cnt = [7, 11, 14, 18], edges = [], tw = [];
    for (var ri = 0; ri < rf.length; ri++)
      for (var i = 0; i < cnt[ri]; i++)
        edges.push({ rf: rf[ri] + Math.random() * 0.03, a: (i / cnt[ri]) * 6.2832 + ri * 0.5,
          ph: Math.random(), sp: 0.12 + Math.random() * 0.18, ring: ri });
    for (var t2 = 0; t2 < 60; t2++)
      tw.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, ph: Math.random() });

    function fit() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(global.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = r.width; H = r.height;
    }

    function draw(t) {
      if (!W) return;
      var cx = W * 0.5, cy = H * 0.5, R = Math.min(W, H) * 0.9;
      var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
      bg.addColorStop(0, '#0b2247'); bg.addColorStop(0.5, '#071630'); bg.addColorStop(1, '#03080f');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      ctx.lineWidth = 1;
      for (var i = 0; i < rf.length; i++) {
        ctx.beginPath(); ctx.arc(cx, cy, rf[i] * R, 0, 7);
        ctx.strokeStyle = 'rgba(50,190,215,' + (0.1 + 0.04 * Math.sin(t + i)) + ')'; ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      for (var e = 0; e < edges.length; e++) {
        var ed = edges[e];
        var nx = cx + Math.cos(ed.a) * ed.rf * R, ny = cy + Math.sin(ed.a) * ed.rf * R;
        var warm = ed.ring % 2;
        var g = ctx.createLinearGradient(cx, cy, nx, ny);
        g.addColorStop(0, warm ? 'rgba(255,140,60,0)' : 'rgba(45,200,220,0)');
        g.addColorStop(1, warm ? 'rgba(255,140,60,0.28)' : 'rgba(45,200,220,0.3)');
        ctx.strokeStyle = g; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.fillStyle = warm ? 'rgba(255,160,80,0.9)' : 'rgba(70,205,225,0.9)';
        ctx.beginPath(); ctx.arc(nx, ny, 1.6, 0, 7); ctx.fill();
        var p = (t * ed.sp + ed.ph) % 1, px = nx + (cx - nx) * p, py = ny + (cy - ny) * p;
        ctx.shadowBlur = 8; ctx.shadowColor = warm ? '#ff9a3c' : '#3fd0e0';
        ctx.fillStyle = warm ? '#ffbf7a' : '#8fe6f0';
        ctx.beginPath(); ctx.arc(px, py, 2.2 * (1 - p * 0.5), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      }

      for (var w = 0; w < tw.length; w++) {
        var pt = tw[w], a = 0.3 + 0.5 * Math.sin(t * 2 + pt.ph * 7);
        ctx.fillStyle = 'rgba(90,215,230,' + Math.max(0, a) * 0.5 + ')';
        ctx.beginPath(); ctx.arc(pt.x * W, pt.y * H, pt.r, 0, 7); ctx.fill();
      }

      var pr = 0.9 + 0.12 * Math.sin(t * 1.5), cr = R * 0.16 * pr;
      var core = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      core.addColorStop(0, 'rgba(255,240,220,0.95)'); core.addColorStop(0.35, 'rgba(255,150,60,0.7)');
      core.addColorStop(0.7, 'rgba(45,195,215,0.26)'); core.addColorStop(1, 'rgba(45,195,215,0)');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,90,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, 7); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var animate = motion === 'on' || (motion === 'auto' && !reduce);
    var raf = 0, start = 0;

    function frame(now) {
      if (!start) start = now;
      draw((now - start) / 1000);
      raf = global.requestAnimationFrame(frame);
    }

    fit();
    var ro = new ResizeObserver(function () { fit(); if (!animate) draw(6.2); });
    ro.observe(canvas);

    if (animate) raf = global.requestAnimationFrame(frame);
    else draw(6.2); // 정지 프레임

    return {
      destroy: function () { global.cancelAnimationFrame(raf); ro.disconnect(); },
      redraw: function () { fit(); draw(6.2); }
    };
  }

  function auto() {
    var els = document.querySelectorAll('[data-medihim-kv]');
    for (var i = 0; i < els.length; i++) mount(els[i], {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();

  global.MedihimKV = { mount: mount };
})(window);
