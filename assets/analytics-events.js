(function (window, document) {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  var allowedEvents = {
    cta_click: true,
    select_content: true,
    article_progress: true,
    consult_cta_click: true,
    doctor_interest: true,
    lead_form_start: true,
    lead_submit_attempt: true,
    lead_request_sent: true,
    generate_lead: true,
    lead_form_error: true,
    lead_submit_error: true,
    job_detail_view: true,
    job_apply_click: true,
    external_platform_click: true
  };

  var allowedParams = {
    cta_click: [
      'cta_name', 'cta_location', 'audience', 'content_id', 'content_version',
      'content_title', 'content_category', 'content_type', 'title_variant',
      'cta_type', 'tracking_version', 'progress_percent', 'article_completion_state'
    ],
    select_content: [
      'content_type', 'content_id', 'cta_location', 'audience', 'content_version',
      'content_title', 'content_category', 'title_variant', 'cta_type', 'tracking_version'
    ],
    article_progress: [
      'content_id',
      'content_type',
      'content_category',
      'progress_percent',
      'article_completion_state',
      'content_version',
      'content_title',
      'title_variant',
      'cta_type',
      'tracking_version'
    ],
    consult_cta_click: [
      'cta_position',
      'content_id',
      'content_type',
      'content_category',
      'progress_percent',
      'article_completion_state',
      'content_version',
      'content_title',
      'title_variant',
      'cta_type',
      'tracking_version'
    ],
    doctor_interest: ['cta_name', 'cta_location', 'audience'],
    lead_form_start: ['form_id', 'form_type', 'audience', 'cta_name', 'cta_location'],
    lead_submit_attempt: ['form_id', 'form_type', 'audience', 'cta_name', 'cta_location'],
    lead_request_sent: ['form_id', 'form_type', 'audience', 'cta_name', 'cta_location', 'transport'],
    generate_lead: ['form_id', 'form_type', 'audience', 'cta_name', 'cta_location', 'response_source', 'transport'],
    lead_form_error: ['error_type'],
    lead_submit_error: ['error_type', 'form_id', 'form_type', 'audience', 'cta_name', 'cta_location', 'response_source', 'transport'],
    job_detail_view: ['job_id', 'content_type', 'audience'],
    job_apply_click: ['job_id', 'cta_location', 'audience', 'platform'],
    external_platform_click: ['platform', 'cta_name', 'cta_location', 'audience']
  };

  var unsafeValuePattern = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?82[-.\s]?)?0?1[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|\d{6}[-\s]?[1-4]\d{6})/i;

  function normalizeValue(value) {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return undefined;

    var normalized = value.replace(/\s+/g, ' ').trim().slice(0, 100);
    if (!normalized || unsafeValuePattern.test(normalized)) return undefined;
    return normalized;
  }

  function formContext(form) {
    var formType = form.getAttribute('data-inquiry-type') || 'general';
    var submit = form.querySelector('[type="submit"]');
    return {
      form_id: form.getAttribute('data-form-id') || formType + '-inquiry',
      form_type: formType,
      audience: form.getAttribute('data-audience') || 'general',
      cta_name: submit ? submit.getAttribute('data-cta-name') || '' : '',
      cta_location: submit ? submit.getAttribute('data-cta-location') || '' : ''
    };
  }

  window.medihimTrack = function (eventName, params) {
    if (!allowedEvents[eventName]) return false;

    var source = params && typeof params === 'object' ? params : {};
    var payload = { event: eventName };
    var keys = allowedParams[eventName] || [];

    keys.forEach(function (key) {
      var value = normalizeValue(source[key]);
      if (value !== undefined) payload[key] = value;
    });

    var callback = typeof source.event_callback === 'function'
      ? source.event_callback
      : (typeof source.eventCallback === 'function' ? source.eventCallback : null);
    var timeout = Number(source.event_timeout || source.eventTimeout);

    if (callback) {
      payload.event_callback = callback;
      payload.eventCallback = callback;
      payload.event_timeout = Number.isFinite(timeout) ? timeout : 250;
      payload.eventTimeout = payload.event_timeout;
    }

    window.dataLayer.push(payload);
    return true;
  };

  function contentMetadata(element) {
    var contentElement = element && element.closest
      ? element.closest('[data-content-id]')
      : null;
    if (!contentElement) {
      contentElement = document.querySelector('main .article-layout article.prose, main article[data-article-detail]');
    }

    var body = document.body;
    var heading = document.querySelector('main h1');
    var contentType = contentElement && contentElement.getAttribute('data-content-type') ||
      body.getAttribute('data-content-type') ||
      'longform_diagnostic';

    return {
      content_id: contentElement && contentElement.getAttribute('data-content-id') ||
        body.getAttribute('data-article-id') ||
        location.pathname.split('/').pop().replace(/\.html?$/i, '') ||
        'article',
      content_version: contentElement && contentElement.getAttribute('data-content-version') || '',
      content_title: contentElement && contentElement.getAttribute('data-content-title') ||
        (heading ? heading.textContent : ''),
      content_category: contentElement && contentElement.getAttribute('data-content-category') ||
        body.getAttribute('data-content-category') ||
        body.getAttribute('data-article-category') ||
        contentType,
      content_type: contentType,
      title_variant: contentElement && contentElement.getAttribute('data-title-variant') || '',
      cta_type: contentElement && contentElement.getAttribute('data-cta-type') || '',
      tracking_version: contentElement && contentElement.getAttribute('data-tracking-version') || ''
    };
  }

  function trackingParams(element) {
    var metadata = contentMetadata(element);
    var progressContext = typeof window.medihimGetArticleProgressContext === 'function'
      ? window.medihimGetArticleProgressContext()
      : {};
    return {
      cta_name: element.getAttribute('data-cta-name') || '',
      cta_location: element.getAttribute('data-cta-location') || '',
      audience: element.getAttribute('data-audience') || '',
      content_type: element.getAttribute('data-content-type') || metadata.content_type,
      content_id: element.getAttribute('data-content-id') || metadata.content_id,
      content_version: element.getAttribute('data-content-version') || metadata.content_version,
      content_title: element.getAttribute('data-content-title') || metadata.content_title,
      content_category: element.getAttribute('data-content-category') || metadata.content_category,
      title_variant: element.getAttribute('data-title-variant') || metadata.title_variant,
      cta_type: element.getAttribute('data-cta-type') || metadata.cta_type,
      tracking_version: element.getAttribute('data-tracking-version') || metadata.tracking_version,
      progress_percent: progressContext.progress_percent,
      article_completion_state: progressContext.article_completion_state,
      job_id: element.getAttribute('data-job-id') || '',
      platform: element.getAttribute('data-platform') || ''
    };
  }

  function shouldDelayNavigation(event, link) {
    if (!link || !link.href || link.target === '_blank' || link.hasAttribute('download')) return false;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

    var href = link.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(?:javascript:|mailto:|tel:)/i.test(href)) return false;
    return true;
  }

  document.addEventListener('click', function (event) {
    var element = event.target.closest && event.target.closest('[data-track]');
    if (!element) return;

    var eventNames = (element.getAttribute('data-track') || '')
      .split(/[\s,]+/)
      .filter(function (name) { return allowedEvents[name]; });
    if (!eventNames.length) return;

    var link = element.closest('a[href]');
    var delayNavigation = shouldDelayNavigation(event, link);
    var navigated = false;
    var fallbackTimer;

    function navigate() {
      if (navigated || !link) return;
      navigated = true;
      window.clearTimeout(fallbackTimer);
      window.location.assign(link.href);
    }

    if (delayNavigation) {
      event.preventDefault();
      fallbackTimer = window.setTimeout(navigate, 180);
    }

    eventNames.forEach(function (eventName, index) {
      var params = trackingParams(element);
      if (delayNavigation && index === eventNames.length - 1) {
        params.event_callback = navigate;
        params.event_timeout = 250;
      }
      window.medihimTrack(eventName, params);
    });
  });

  function setupLeadFormStart() {
    var startedForms = new WeakSet();

    function hasValidEntry(field) {
      if (field.disabled || field.readOnly) return false;
      if (field.type === 'checkbox' || field.type === 'radio') return field.checked && field.validity.valid;
      if (field.tagName === 'SELECT') return Boolean(field.value) && field.validity.valid;
      return Boolean(String(field.value || '').trim()) && field.validity.valid;
    }

    function onFirstEntry(event) {
      var field = event.target;
      if (!field.matches || !field.matches('input:not([type="hidden"]), select, textarea')) return;

      var form = field.closest('form[data-inquiry-type]');
      if (!form || startedForms.has(form) || !hasValidEntry(field)) return;

      startedForms.add(form);
      window.medihimTrack('lead_form_start', formContext(form));
    }

    document.addEventListener('input', onFirstEntry, true);
    document.addEventListener('change', onFirstEntry, true);
  }

  function setupArticleProgress() {
    var article = document.querySelector('main .article-layout article.prose, main article[data-article-detail]');
    if (!article) return;

    var metadata = contentMetadata(article);
    var contentId = metadata.content_id;
    var contentType = metadata.content_type;
    var contentCategory = metadata.content_category;
    var maxProgressPercent = 0;
    var reached = {};
    var ticking = false;

    window.medihimGetArticleProgressContext = function () {
      return {
        content_id: contentId,
        content_version: metadata.content_version,
        content_title: metadata.content_title,
        content_category: contentCategory,
        content_type: contentType,
        title_variant: metadata.title_variant,
        cta_type: metadata.cta_type,
        tracking_version: metadata.tracking_version,
        progress_percent: Math.round(maxProgressPercent),
        article_completion_state: maxProgressPercent >= 90 ? 'completed' : 'not_completed'
      };
    };

    function checkProgress() {
      ticking = false;
      var root = document.documentElement;
      var maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      var progress = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
      maxProgressPercent = Math.max(maxProgressPercent, progress);

      [50, 90].forEach(function (threshold) {
        if (progress < threshold || reached[threshold]) return;
        reached[threshold] = true;
        window.medihimTrack('article_progress', {
          content_id: contentId,
          content_version: metadata.content_version,
          content_title: metadata.content_title,
          content_type: contentType,
          content_category: contentCategory,
          title_variant: metadata.title_variant,
          cta_type: metadata.cta_type,
          tracking_version: metadata.tracking_version,
          progress_percent: threshold,
          article_completion_state: threshold >= 90 ? 'completed' : 'in_progress'
        });
      });
    }

    function requestCheck() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkProgress);
    }

    window.addEventListener('scroll', requestCheck, { passive: true });
    window.addEventListener('resize', requestCheck);
    requestCheck();
  }

  function trackJobDetailView() {
    var jobId = document.body.getAttribute('data-job-id');
    if (!jobId && /^role-[^/]+\.html?$/i.test(location.pathname.split('/').pop())) {
      jobId = location.pathname.split('/').pop().replace(/\.html?$/i, '');
    }
    if (!jobId) return;

    window.medihimTrack('job_detail_view', {
      job_id: jobId,
      content_type: 'job_detail',
      audience: 'candidate'
    });
  }

  function initialize() {
    setupLeadFormStart();
    setupArticleProgress();
    trackJobDetailView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(window, document);
