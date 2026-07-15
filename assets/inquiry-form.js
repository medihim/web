(function () {
  'use strict';

  var config = window.MEDIHIM_INQUIRY_CONFIG || {};
  var forms = document.querySelectorAll('form[data-inquiry-type]');
  if (!forms.length) return;

  var params = new URLSearchParams(location.search);
  var source = params.get('source') || document.documentElement.getAttribute('data-inquiry-source') || 'direct';
  var from = params.get('from') || 'direct';
  var startedAt = Date.now();

  function addHidden(form, name, value) {
    var input = form.elements[name];
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value == null ? '' : String(value);
  }

  function setStatus(form, state, message, inquiryId) {
    var box = form.querySelector('[data-form-status]');
    if (!box) return;
    box.hidden = false;
    box.className = 'form-status is-' + state;
    box.innerHTML = '';

    var strong = document.createElement('strong');
    strong.textContent = state === 'success' ? '문의가 정상적으로 접수되었습니다.' : state === 'sending' ? '문의 내용을 안전하게 전송하고 있습니다.' : '문의 접수에 문제가 발생했습니다.';
    var detail = document.createElement('p');
    detail.textContent = message;
    box.appendChild(strong);
    box.appendChild(detail);

    if (inquiryId) {
      var code = document.createElement('p');
      code.className = 'receipt-code';
      code.textContent = '접수번호 ' + inquiryId;
      box.appendChild(code);
    }
    box.setAttribute('tabindex', '-1');
    box.focus();
  }

  function collectMetadata(form) {
    addHidden(form, 'inquiry_type', form.getAttribute('data-inquiry-type'));
    addHidden(form, 'source_gnb', source);
    addHidden(form, 'source_page', from);
    addHidden(form, 'source_url', location.href);
    addHidden(form, 'referrer', document.referrer);
    addHidden(form, 'utm_source', params.get('utm_source') || '');
    addHidden(form, 'utm_medium', params.get('utm_medium') || '');
    addHidden(form, 'utm_campaign', params.get('utm_campaign') || '');
    addHidden(form, 'form_version', config.formVersion || 'unknown');
    addHidden(form, 'privacy_version', config.privacyVersion || 'unknown');
    addHidden(form, 'started_at', startedAt);
    addHidden(form, 'submitted_at', Date.now());
    addHidden(form, 'timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul');
    addHidden(form, 'user_agent', navigator.userAgent.slice(0, 500));
  }

  function selectPreset(select, value) {
    if (!select || !value) return;
    Array.from(select.options).some(function (option) {
      if (option.value === value || option.textContent.indexOf(value) !== -1) {
        option.selected = true;
        return true;
      }
      return false;
    });
  }

  function applyPreset(form) {
    selectPreset(form.elements.service, params.get('service'));
    selectPreset(form.elements.type, params.get('type'));
  }

  function setupTurnstile(form) {
    if (!config.turnstileSiteKey) return;
    var submitRow = form.querySelector('.submit-row');
    if (!submitRow) return;

    var widget = document.createElement('div');
    widget.className = 'cf-turnstile';
    widget.setAttribute('data-sitekey', config.turnstileSiteKey);
    widget.setAttribute('data-theme', 'light');
    submitRow.before(widget);

    if (!document.querySelector('script[data-medihim-turnstile]')) {
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-medihim-turnstile', 'true');
      document.head.appendChild(script);
    }
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== 'https://script.googleusercontent.com' && event.origin !== 'https://script.google.com') return;
    if (!event.data || event.data.type !== 'MEDIHIM_INQUIRY_RESULT') return;
    var form = document.querySelector('form[data-submitting="true"]');
    if (!form) return;

    var submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = false;
    form.removeAttribute('data-submitting');

    if (event.data.ok) {
      setStatus(form, 'success', '영업일 기준 1~3일 이내 담당자가 확인 후 연락드리겠습니다.', event.data.inquiryId);
      form.reset();
      startedAt = Date.now();
    } else {
      setStatus(form, 'error', event.data.message || '잠시 후 다시 시도하거나 대표 이메일로 문의해 주세요.');
    }
  });

  forms.forEach(function (form, index) {
    applyPreset(form);
    setupTurnstile(form);
    addHidden(form, 'website', '');
    form.elements.website.className = 'inquiry-honeypot';
    form.elements.website.tabIndex = -1;
    form.elements.website.autocomplete = 'off';

    var iframe = document.createElement('iframe');
    iframe.name = 'inquiry-target-' + index;
    iframe.className = 'inquiry-target';
    iframe.title = '문의 제출 결과';
    form.after(iframe);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      if (!config.endpoint) {
        setStatus(form, 'error', '저장소 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      if (Date.now() - startedAt < 2000) {
        setStatus(form, 'error', '입력 내용을 다시 확인한 뒤 제출해 주세요.');
        return;
      }

      collectMetadata(form);
      form.action = config.endpoint;
      form.method = 'post';
      form.target = iframe.name;
      form.setAttribute('data-submitting', 'true');

      var submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      setStatus(form, 'sending', '창을 닫지 말고 잠시 기다려 주세요.');
      HTMLFormElement.prototype.submit.call(form);
    });
  });
})();
