(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var source = params.get('source') || 'home';
  var from = params.get('from') || (location.pathname.split('/').pop() || 'index').replace(/\.html$/i, '');
  var recommendation = {
    business: 'hospital',
    platform: 'hospital',
    projects: 'hospital',
    careers: 'recruitment',
    company: 'general',
    insights: 'general'
  }[source];

  document.querySelectorAll('[data-inquiry-card]').forEach(function (card) {
    var href = card.getAttribute('href');
    var url = new URL(href, location.href);
    url.searchParams.set('source', source);
    url.searchParams.set('from', from);
    card.setAttribute('href', url.pathname.split('/').pop() + url.search);

    if (recommendation && card.getAttribute('data-inquiry-card') === recommendation) {
      card.classList.add('is-recommended');
      var badge = document.createElement('span');
      badge.className = 'inquiry-recommendation';
      badge.textContent = '현재 페이지에서 추천';
      card.prepend(badge);
    }
  });
})();
