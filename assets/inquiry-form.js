(function () {
  'use strict';

  var config = window.MEDIHIM_INQUIRY_CONFIG || {};
  var forms = Array.from(document.querySelectorAll('form[data-inquiry-type]'));
  if (!forms.length) return;

  var params = new URLSearchParams(location.search);
  var source = params.get('source') || document.documentElement.getAttribute('data-inquiry-source') || 'direct';
  var from = params.get('from') || 'direct';
  var startedAt = Date.now();
  var formStates = new WeakMap();

  function trackingContext(form) {
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

  function trackFormEvent(eventName, form, extra) {
    if (typeof window.medihimTrack !== 'function') return;
    var payload = trackingContext(form);
    Object.keys(extra || {}).forEach(function (key) {
      payload[key] = extra[key];
    });
    window.medihimTrack(eventName, payload);
  }

  function trackFormError(errorType) {
    if (typeof window.medihimTrack !== 'function') return;
    window.medihimTrack('lead_form_error', { error_type: errorType });
  }

  function trackSubmitError(errorType, form, extra) {
    var details = {
      error_type: errorType,
      transport: 'hidden_iframe'
    };
    Object.keys(extra || {}).forEach(function (key) {
      details[key] = extra[key];
    });
    trackFormEvent('lead_submit_error', form, details);
  }

  function stateFor(form) {
    var state = formStates.get(form);
    if (state) return state;

    state = {
      inFlight: false,
      frame: null,
      timeout: null,
      lastAttemptAt: 0,
      lastValidationErrorAt: 0,
      originalAction: form.getAttribute('action'),
      originalMethod: form.getAttribute('method'),
      originalTarget: form.getAttribute('target')
    };
    formStates.set(form, state);
    return state;
  }

  function restoreAttribute(element, name, value) {
    if (value == null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }

  function removeResultFrame(state) {
    var frame = state.frame;
    state.frame = null;
    if (!frame) return;
    window.setTimeout(function () {
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    }, 1000);
  }

  function finishSubmission(form) {
    var state = stateFor(form);
    window.clearTimeout(state.timeout);
    state.timeout = null;
    state.inFlight = false;
    form.removeAttribute('data-submitting');

    var submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = false;

    restoreAttribute(form, 'action', state.originalAction);
    restoreAttribute(form, 'method', state.originalMethod);
    restoreAttribute(form, 'target', state.originalTarget);
    removeResultFrame(state);
  }

  function createResultFrame(form) {
    var frame = document.createElement('iframe');
    var formId = trackingContext(form).form_id.replace(/[^a-z0-9_-]/gi, '-');
    frame.name = 'medihim-inquiry-result-' + formId + '-' + Date.now().toString(36);
    frame.title = '문의 전송 결과';
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);
    return frame;
  }

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
    strong.textContent = state === 'success' ? '문의 접수가 완료되었습니다.' : state === 'sending' ? '문의 내용을 안전하게 전송하고 있습니다.' : '문의 접수에 문제가 발생했습니다.';
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
    var canonicalSourceUrl = location.href;

    addHidden(form, 'inquiry_type', form.getAttribute('data-inquiry-type'));
    addHidden(form, 'inquiry_subtype', params.get('subtype') || (form.elements.service && form.elements.service.value) || (form.elements.type && form.elements.type.value) || '');
    addHidden(form, 'source_gnb', source);
    addHidden(form, 'source_page', from);
    addHidden(form, 'source_url', canonicalSourceUrl);
    addHidden(form, 'canonical_source_url', canonicalSourceUrl);
    addHidden(form, 'referrer', document.referrer);
    addHidden(form, 'utm_source', params.get('utm_source') || '');
    addHidden(form, 'utm_medium', params.get('utm_medium') || '');
    addHidden(form, 'utm_campaign', params.get('utm_campaign') || '');
    addHidden(form, 'form_version', config.formVersion || 'unknown');
    addHidden(form, 'privacy_version', config.privacyVersion || 'unknown');
    addHidden(form, 'client_request_id', 'WEB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase());
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
    selectPreset(form.elements.country, params.get('country'));
  }

  function inquiryMessage(form) {
    var names = ['message', 'challenge', 'proposal', 'background', 'request'];
    for (var i = 0; i < names.length; i += 1) {
      if (form.elements[names[i]] && form.elements[names[i]].value) {
        return form.elements[names[i]].value.trim();
      }
    }
    return '';
  }

  function normalizedValue(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function compactValue(value) {
    return normalizedValue(value).replace(/[\s._\-–—/\\()[\]{}]/g, '').toLowerCase();
  }

  function hasRepeatedCharacters(value) {
    return /(.)\1{4,}/i.test(compactValue(value));
  }

  function isKnownDummy(value) {
    var compact = compactValue(value);
    return /^(test|testing|tester|sample|dummy|asdf|qwer|qwerty|abc|abcd|none|null|undefined|unknown|na|no|없음|모름|테스트|샘플|문의)$/.test(compact) ||
      /^(0123456789|1234567890|0987654321)$/.test(compact);
  }

  function isRandomLatinToken(value, minimumLength) {
    var text = normalizedValue(value);
    if (text.length < minimumLength || /\s/.test(text) || /[^A-Za-z]/.test(text)) return false;

    var lower = text.toLowerCase();
    var vowelCount = (lower.match(/[aeiou]/g) || []).length;
    var vowelRatio = vowelCount / lower.length;
    var caseChanges = 0;
    for (var i = 1; i < text.length; i += 1) {
      if (/[A-Z]/.test(text[i]) !== /[A-Z]/.test(text[i - 1])) caseChanges += 1;
    }
    return vowelRatio < 0.20 || caseChanges >= 4;
  }

  function fieldValue(form, names) {
    for (var i = 0; i < names.length; i += 1) {
      if (form.elements[names[i]]) return normalizedValue(form.elements[names[i]].value);
    }
    return '';
  }

  function showValidationError(form, message, errorType, field) {
    setStatus(form, 'error', message);
    trackFormError(errorType);
    if (field && typeof field.focus === 'function') field.focus();
    return false;
  }

  function validPhone(value) {
    if (!value) return true;
    if (!/^[+()\d\s-]+$/.test(value)) return false;
    var digits = value.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    if (/^(0123456789|1234567890|0987654321)$/.test(digits)) return false;
    return true;
  }

  function validateInquiry(form) {
    var message = inquiryMessage(form);
    var contactName = fieldValue(form, ['contact_name', 'name']);
    var organization = fieldValue(form, ['organization', 'org', 'company', 'hospital']);
    var subject = fieldValue(form, ['subject']);
    var phone = fieldValue(form, ['phone']);
    var nameField = form.elements.contact_name || form.elements.name;
    var organizationField = form.elements.organization || form.elements.org || form.elements.company || form.elements.hospital;

    if (contactName.length < 2 || contactName.length > 40 ||
        !/^[A-Za-zÀ-ÖØ-öø-ÿ가-힣ㄱ-ㅎㅏ-ㅣ一-龥々\s.'’-]+$/.test(contactName) ||
        isKnownDummy(contactName) || hasRepeatedCharacters(contactName) ||
        isRandomLatinToken(contactName, 10)) {
      return showValidationError(form, '담당자명을 실제 성함으로 입력해 주세요.', 'invalid_contact_name', nameField);
    }
    if (organization && (organization.length < 2 || organization.length > 80 ||
        isKnownDummy(organization) || hasRepeatedCharacters(organization) ||
        isRandomLatinToken(organization.replace(/\s+(llc|ltd|inc|corp|co)$/i, ''), 14))) {
      return showValidationError(form, '소속 기관 또는 병원명을 다시 확인해 주세요.', 'invalid_organization', organizationField);
    }
    if (!validPhone(phone)) {
      return showValidationError(form, '연락 가능한 전화번호를 국가번호를 포함해 정확히 입력해 주세요.', 'invalid_phone', form.elements.phone);
    }
    if (subject && (subject.length < 3 || isKnownDummy(subject) ||
        hasRepeatedCharacters(subject) || isRandomLatinToken(subject, 14))) {
      return showValidationError(form, '문의 제목을 구체적으로 입력해 주세요.', 'invalid_subject', form.elements.subject);
    }
    if (message.length < 10) {
      setStatus(form, 'error', '문의 내용은 공백을 제외하고 10자 이상 입력해 주세요.');
      trackFormError('message_too_short');
      return false;
    }
    if (isKnownDummy(message) || hasRepeatedCharacters(message) ||
        isRandomLatinToken(message, 12)) {
      return showValidationError(form, '문의 내용을 문장으로 구체적으로 입력해 주세요.', 'meaningless_message', form.elements.message || form.elements.challenge || form.elements.proposal || form.elements.background || form.elements.request);
    }
    if (/(주민등록번호|여권번호|진료기록|처방전|환자명|차트번호)/i.test(message)) {
      setStatus(form, 'error', '환자 개인정보나 의료정보를 제외한 뒤 다시 제출해 주세요.');
      trackFormError('sensitive_information_detected');
      return false;
    }
    return true;
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

  function isAllowedResultOrigin(origin) {
    try {
      var hostname = new URL(origin).hostname;
      return hostname === 'script.google.com' ||
        hostname === 'script.googleusercontent.com' ||
        hostname.endsWith('.script.googleusercontent.com') ||
        hostname.endsWith('-script.googleusercontent.com');
    } catch (error) {
      return false;
    }
  }

  function isResultSourceForState(sourceWindow, state) {
    if (!sourceWindow || !state.frame) return false;

    var frameWindow = state.frame.contentWindow;
    var candidate = sourceWindow;
    var maxDepth = 4;

    try {
      for (var depth = 0; depth <= maxDepth; depth += 1) {
        if (candidate.closed) return false;
        if (candidate === frameWindow) return true;

        var parentWindow = candidate.parent;
        if (!parentWindow || parentWindow === candidate) return false;

        candidate = parentWindow;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  function formForResultSource(sourceWindow) {
    for (var i = 0; i < forms.length; i += 1) {
      var state = stateFor(forms[i]);
      if (state.inFlight && isResultSourceForState(sourceWindow, state)) {
        return forms[i];
      }
    }
    return null;
  }

  window.addEventListener('message', function (event) {
    if (!isAllowedResultOrigin(event.origin)) return;
    if (!event.data || event.data.type !== 'MEDIHIM_INQUIRY_RESULT') return;

    var form = formForResultSource(event.source);
    if (!form) return;

    if (event.data.ok) {
      trackFormEvent('generate_lead', form, {
        response_source: 'google_apps_script',
        transport: 'hidden_iframe'
      });
      finishSubmission(form);
      setStatus(form, 'success', '영업일 기준 1~3일 이내 담당자가 확인 후 연락드리겠습니다.', event.data.inquiryId);
      form.reset();
      startedAt = Date.now();
    } else {
      trackSubmitError('server_rejected', form, {
        response_source: 'google_apps_script'
      });
      finishSubmission(form);
      setStatus(form, 'error', event.data.message || '잠시 후 다시 시도하거나 대표 이메일로 문의해 주세요.');
    }
  });

  function markSubmitAttempt(form) {
    var state = stateFor(form);
    var now = Date.now();
    if (now - state.lastAttemptAt < 750) return;
    state.lastAttemptAt = now;
    trackFormEvent('lead_submit_attempt', form);
  }

  function startSubmission(form) {
    var state = stateFor(form);
    if (state.inFlight) return;

    collectMetadata(form);
    state.frame = createResultFrame(form);
    state.inFlight = true;
    form.setAttribute('data-submitting', 'true');
    form.setAttribute('action', config.endpoint);
    form.setAttribute('method', 'post');
    form.setAttribute('target', state.frame.name);

    var submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    setStatus(form, 'sending', '창을 닫지 말고 잠시 기다려 주세요.');

    state.timeout = window.setTimeout(function () {
      if (!state.inFlight) return;
      trackSubmitError('request_timeout', form, {
        response_source: 'timeout'
      });
      finishSubmission(form);
      setStatus(form, 'error', '전송 확인 시간이 초과되었습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.');
    }, 30000);

    try {
      trackFormEvent('lead_request_sent', form, {
        transport: 'hidden_iframe'
      });
      HTMLFormElement.prototype.submit.call(form);
    } catch (error) {
      trackSubmitError('request_exception', form, {
        response_source: 'browser'
      });
      finishSubmission(form);
      setStatus(form, 'error', '전송을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  forms.forEach(function (form) {
    applyPreset(form);
    setupTurnstile(form);
    stateFor(form);
    addHidden(form, 'website', '');
    form.elements.website.className = 'inquiry-honeypot';
    form.elements.website.tabIndex = -1;
    form.elements.website.autocomplete = 'off';

    form.addEventListener('click', function (event) {
      var submit = event.target.closest && event.target.closest('[type="submit"]');
      if (submit && form.contains(submit)) markSubmitAttempt(form);
    });

    form.addEventListener('invalid', function () {
      var state = stateFor(form);
      var now = Date.now();
      if (now - state.lastValidationErrorAt < 750) return;
      state.lastValidationErrorAt = now;
      trackFormError('native_validation');
    }, true);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      markSubmitAttempt(form);

      var state = stateFor(form);
      if (state.inFlight) return;

      if (!form.reportValidity()) return;
      if (!validateInquiry(form)) return;

      if (location.protocol === 'file:') {
        trackFormError('preview_protocol');
        setStatus(form, 'error', '로컬 미리보기에서는 문의를 전송할 수 없습니다. 공개 홈페이지에서 다시 접수해 주세요.');
        return;
      }

      if (!config.endpoint) {
        trackFormError('missing_endpoint');
        setStatus(form, 'error', '저장소 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }

      if (Array.isArray(config.allowedHostnames) && config.allowedHostnames.length &&
          config.allowedHostnames.indexOf(location.hostname) === -1) {
        trackFormError('disallowed_hostname');
        setStatus(form, 'error', '공식 메디힘 홈페이지에서 다시 접수해 주세요.');
        return;
      }

      if (Date.now() - startedAt < 5000) {
        trackFormError('submission_too_fast');
        setStatus(form, 'error', '입력 내용을 다시 확인한 뒤 제출해 주세요.');
        return;
      }

      startSubmission(form);
    });
  });
})();
