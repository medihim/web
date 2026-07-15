(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var sectionMap = {
    company: ['company.html', 'company-overview.html', 'mission-vision.html', 'capabilities.html', 'history.html', 'leadership.html'],
    business: ['business.html', 'global-marketing.html', 'global-patient.html', 'hospital-ops.html', 'consulting-ops.html', 'crm-data.html', 'mso.html', 'public-partnership.html'],
    platform: ['platform.html', 'ippeo.html', 'patient-journey.html', 'consultation-reservation.html'],
    projects: ['projects.html', 'project-opening.html', 'project-global.html', 'project-marketing.html', 'project-acquisition.html', 'project-crm.html', 'project-public.html'],
    insights: ['insights.html', 'news.html'],
    careers: ['careers.html', 'roles.html', 'hiring-process.html', 'open-positions.html', 'work-style.html']
  };
  var section = 'home';

  Object.keys(sectionMap).some(function (key) {
    if (sectionMap[key].indexOf(page) !== -1 || page.indexOf(key + '-') === 0 || page.indexOf('role-') === 0 && key === 'careers' || page.indexOf('insight-') === 0 && key === 'insights') {
      section = key;
      return true;
    }
    return false;
  });

  function appendContext(anchor) {
    var raw = anchor.getAttribute('href');
    if (!raw || /^(https?:|mailto:|tel:|#)/i.test(raw)) return;
    if (!/(contact|consultation|inquiry|investment)\.html/i.test(raw)) return;

    try {
      var url = new URL(raw, location.href);
      if (!url.searchParams.has('source')) url.searchParams.set('source', section);
      if (!url.searchParams.has('from')) url.searchParams.set('from', page.replace(/\.html$/i, ''));
      anchor.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
    } catch (error) {
      /* Keep the original link when a legacy browser cannot parse URL. */
    }
  }

  document.querySelectorAll('a[href]').forEach(appendContext);
  document.documentElement.setAttribute('data-inquiry-source', section);
})();
