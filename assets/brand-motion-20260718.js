(function () {
  "use strict";

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var particleLayer = document.querySelector(".brand-hero__particles");

  if (!reducedMotion && particleLayer) {
    var palette = ["#ff66cc", "#e08fd0", "#9ab8c4", "#5fb3c2", "#16a2b5", "#16a2b5"];
    var settings = [
      [7, 37, 6, 620, 34, 8.2, -1.4], [11, 43, 5, 760, 12, 9.8, -5.1],
      [6, 49, 8, 680, -8, 7.4, -2.7], [13, 55, 4, 820, -28, 10.6, -7.6],
      [8, 61, 7, 700, -42, 8.9, -4.4], [12, 67, 5, 790, -58, 11.2, -8.8],
      [5, 72, 9, 650, -70, 7.8, -3.1], [14, 76, 4, 850, -82, 10.1, -6.2],
      [9, 40, 5, 740, 26, 9.2, -8.1], [6, 53, 6, 610, -18, 8.4, -5.8],
      [13, 63, 8, 780, -52, 10.8, -2.2], [7, 69, 4, 690, -67, 7.2, -6.9],
      [10, 47, 7, 830, 2, 11.4, -9.3], [5, 58, 5, 720, -36, 9.6, -4.9]
    ];

    settings.forEach(function (item, index) {
      var particle = document.createElement("span");
      particle.className = "brand-hero__particle";
      particle.style.setProperty("--start-x", item[0] + "%");
      particle.style.setProperty("--start-y", item[1] + "%");
      particle.style.setProperty("--size", item[2] + "px");
      particle.style.setProperty("--travel-x", item[3] + "px");
      particle.style.setProperty("--travel-y", item[4] + "px");
      particle.style.setProperty("--duration", item[5] + "s");
      particle.style.setProperty("--delay", item[6] + "s");
      particle.style.setProperty("--particle-color", palette[index % palette.length]);
      particleLayer.appendChild(particle);
    });
  }
})();
