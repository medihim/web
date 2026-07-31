(function () {
  "use strict";

  var hero = document.querySelector(".kv-hero");
  if (!hero) return;

  var stage = hero.querySelector("[data-kv-stage]");
  var waveCanvas = hero.querySelector("[data-kv-wave]");
  var networkCanvas = hero.querySelector("[data-kv-network]");
  var fallback = hero.querySelector(".kv-fallback");
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!stage || !waveCanvas || !networkCanvas || !fallback || reducedMotion) return;

  var active = true;
  var pageVisible = !document.hidden;
  var resizeCallbacks = [];
  var cleanupFns = [];
  var resizeObserver = null;

  function canAnimate() {
    return active && pageVisible;
  }

  function fitCanvas(canvas, context, cap) {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    var width = Math.max(1, rect.width);
    var height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: width, height: height };
  }

  function initWave() {
    var context = waveCanvas.getContext("2d");
    if (!context) return;

    var size = { width: 1, height: 1 };
    var image = new Image();
    var ready = false;
    var start = performance.now();
    var frame = 0;

    function resize() {
      size = fitCanvas(waveCanvas, context, 1.5);
    }

    function draw(now) {
      frame = window.requestAnimationFrame(draw);
      if (!ready || !canAnimate()) return;

      var width = size.width;
      var height = size.height;
      var mobile = width <= 700;
      var elapsed = (now - start) / 1000;
      var destinationWidth = mobile ? width * 1.46 : width * .78;
      var destinationHeight = mobile ? height * .58 : height * 1.04;
      var destinationX = mobile ? width * -.1 : width - destinationWidth;
      var destinationY = mobile ? height * .42 : (height - destinationHeight) / 2;
      var scale = Math.max(destinationWidth / image.width, destinationHeight / image.height);
      var sourceWidth = destinationWidth / scale;
      var sourceHeight = destinationHeight / scale;
      var sourceX = (image.width - sourceWidth) * (mobile ? .52 : .66);
      var sourceY = (image.height - sourceHeight) / 2;
      var slices = mobile ? 64 : 90;
      var sourceSlice = sourceHeight / slices;
      var destinationSlice = destinationHeight / slices;

      context.clearRect(0, 0, width, height);
      context.globalAlpha = .95;

      for (var index = 0; index < slices; index += 1) {
        var progress = index / slices;
        var phaseA = progress * 6.4 + elapsed * 1.15;
        var phaseB = progress * 13 + elapsed * 1.9;
        var lift = Math.sin(phaseA) * 22 + Math.sin(phaseB) * 8;
        var wave = Math.cos(phaseA) * 9 + Math.sin(progress * 3 + elapsed * .7) * 6;
        var squash = 1 + Math.cos(phaseA) * .1;

        context.drawImage(
          image,
          sourceX,
          sourceY + index * sourceSlice,
          sourceWidth,
          sourceSlice + 1.2,
          destinationX + wave,
          destinationY + index * destinationSlice + lift,
          destinationWidth,
          destinationSlice * squash + 1.6
        );
      }

      context.globalAlpha = 1;
      var band = 1 - ((elapsed * .18) % 1.4);
      var gradient = context.createLinearGradient(0, height * (band + .22), 0, height * (band - .16));
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(.5, "rgba(190,245,250,.22)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(destinationX, 0, destinationWidth, height);
    }

    image.onload = function () {
      ready = true;
      stage.classList.add("is-enhanced");
    };
    image.src = fallback.currentSrc || fallback.src;
    resize();
    resizeCallbacks.push(resize);
    frame = window.requestAnimationFrame(draw);
    cleanupFns.push(function () {
      window.cancelAnimationFrame(frame);
    });
  }

  function initNetwork() {
    var context = networkCanvas.getContext("2d");
    if (!context) return;

    var size = { width: 1, height: 1 };
    var nodeCount = window.innerWidth <= 700 ? 38 : 68;
    var nodes = [];
    var last = performance.now();
    var frame = 0;

    function createNodes() {
      nodes = [];
      for (var index = 0; index < nodeCount; index += 1) {
        nodes.push({
          x: Math.random(),
          y: .12 + Math.random() * .76,
          vx: .000035 + Math.random() * .00007,
          vy: (Math.random() - .5) * .00004,
          radius: 1.2 + Math.random() * 2.6,
          seed: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      size = fitCanvas(networkCanvas, context, 2);
    }

    function tint(value) {
      var ratio = Math.max(0, Math.min(1, value));
      return [
        Math.round(255 + (22 - 255) * ratio),
        Math.round(102 + (162 - 102) * ratio),
        Math.round(204 + (181 - 204) * ratio)
      ];
    }

    function draw(now) {
      frame = window.requestAnimationFrame(draw);
      if (!canAnimate()) {
        last = now;
        return;
      }

      var delta = Math.min(now - last, 64);
      var width = size.width;
      var height = size.height;
      last = now;
      context.clearRect(0, 0, width, height);

      nodes.forEach(function (node) {
        node.x += node.vx * delta;
        node.y += node.vy * delta + Math.sin(node.seed + now * .0004) * .00012;
        if (node.x > 1.04) {
          node.x = -.04;
          node.y = .12 + Math.random() * .76;
        }
        if (node.y < .06 || node.y > .94) node.vy *= -1;
      });

      for (var first = 0; first < nodes.length; first += 1) {
        for (var second = first + 1; second < nodes.length; second += 1) {
          var a = nodes[first];
          var b = nodes[second];
          var dx = (a.x - b.x) * width;
          var dy = (a.y - b.y) * height;
          var distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > 20000) continue;

          var alpha = (1 - Math.sqrt(distanceSquared) / 141) * .3;
          var color = tint((a.x + b.x) / 2);
          context.strokeStyle = "rgba(" + color.join(",") + "," + alpha.toFixed(3) + ")";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(a.x * width, a.y * height);
          context.lineTo(b.x * width, b.y * height);
          context.stroke();
        }
      }

      nodes.forEach(function (node) {
        var color = tint(node.x);
        var pulse = .7 + Math.sin(node.seed + now * .0016) * .3;
        context.beginPath();
        context.arc(node.x * width, node.y * height, node.radius * pulse, 0, Math.PI * 2);
        context.fillStyle = "rgba(" + color.join(",") + ",.85)";
        context.shadowBlur = 12;
        context.shadowColor = "rgba(" + color.join(",") + ",.75)";
        context.fill();
        context.shadowBlur = 0;
      });
    }

    createNodes();
    resize();
    resizeCallbacks.push(resize);
    frame = window.requestAnimationFrame(draw);
    cleanupFns.push(function () {
      window.cancelAnimationFrame(frame);
    });
  }

  function initParallax() {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    var layers = Array.prototype.slice.call(stage.querySelectorAll("[data-kv-par]"));
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var frame = 0;

    function onPointerMove(event) {
      var rect = stage.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - .5;
      targetY = (event.clientY - rect.top) / rect.height - .5;
    }

    function render() {
      frame = window.requestAnimationFrame(render);
      if (!canAnimate()) return;
      currentX += (targetX - currentX) * .06;
      currentY += (targetY - currentY) * .06;

      layers.forEach(function (layer) {
        var strength = parseFloat(layer.getAttribute("data-kv-par")) || 0;
        layer.style.marginLeft = (-currentX * strength * 260).toFixed(2) + "px";
        layer.style.marginTop = (-currentY * strength * 200).toFixed(2) + "px";
      });
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = window.requestAnimationFrame(render);
    cleanupFns.push(function () {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    });
  }

  initWave();
  initNetwork();
  initParallax();

  function resizeAll() {
    resizeCallbacks.forEach(function (callback) { callback(); });
  }

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resizeAll);
    resizeObserver.observe(stage);
  } else {
    window.addEventListener("resize", resizeAll, { passive: true });
    cleanupFns.push(function () {
      window.removeEventListener("resize", resizeAll);
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      active = entries[0] ? entries[0].isIntersecting : true;
    }, { threshold: 0 });
    observer.observe(hero);
    cleanupFns.push(function () {
      observer.disconnect();
    });
  }

  function onVisibilityChange() {
    pageVisible = !document.hidden;
  }

  function cleanup() {
    cleanupFns.forEach(function (fn) { fn(); });
    if (resizeObserver) resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", cleanup);
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", cleanup, { once: true });
})();
