/**
 * EdgeKite Browser Tracker
 * Lightweight, privacy-first analytics tracker
 *
 * Usage:
 *   <script src="/tracker.js" data-endpoint="/api/events"></script>
 *
 * Or initialize manually:
 *   EdgeKite.init({ endpoint: '/api/events' });
 *   EdgeKite.track('custom_event', { key: 'value' });
 */

(function(window, document) {
  'use strict';

  var VERSION = '0.1.0';
  var BATCH_SIZE = 10;
  var BATCH_INTERVAL_MS = 2000;
  var SCROLL_THRESHOLDS = [25, 50, 75, 100];

  // State
  var config = {
    endpoint: '/api/events',
    batchEndpoint: '/api/events/batch',
    debug: false
  };
  var sessionId = null;
  var queue = [];
  var batchTimer = null;
  var scrollMarks = {};
  var pageLoadTime = Date.now();
  var maxScrollDepth = 0;
  var sourceMetadata = null;

  // ============ Utilities ============

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getSessionId() {
    if (sessionId) return sessionId;

    try {
      sessionId = sessionStorage.getItem('ek_sid');
      if (!sessionId) {
        sessionId = generateId();
        sessionStorage.setItem('ek_sid', sessionId);
      }
    } catch (e) {
      // sessionStorage not available, use memory-only
      sessionId = generateId();
    }

    return sessionId;
  }

  function getDeviceType() {
    var width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  function getBrowserFamily() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Other';
  }

  function getPlatform() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    return 'Other';
  }

  function getReferrerDomain() {
    try {
      if (!document.referrer) return null;
      var url = new URL(document.referrer);
      if (url.hostname === window.location.hostname) return null;
      return url.hostname;
    } catch (e) {
      return null;
    }
  }

  function getUTMParams() {
    var params = {};
    var search = window.location.search;
    if (!search) return null;

    var utm = ['source', 'medium', 'campaign', 'term', 'content'];
    var hasAny = false;

    utm.forEach(function(key) {
      var match = search.match(new RegExp('[?&]utm_' + key + '=([^&]+)'));
      if (match) {
        params[key] = decodeURIComponent(match[1]);
        hasAny = true;
      }
    });

    return hasAny ? params : null;
  }

  function getSourceMetadata() {
    if (sourceMetadata) return sourceMetadata;

    sourceMetadata = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      device_type: getDeviceType(),
      language: navigator.language || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      browser: getBrowserFamily(),
      platform: getPlatform()
    };

    var referrer = getReferrerDomain();
    if (referrer) sourceMetadata.referrer_domain = referrer;

    var utm = getUTMParams();
    if (utm) sourceMetadata.utm = utm;

    return sourceMetadata;
  }

  function getScrollDepth() {
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    var viewportHeight = window.innerHeight;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (docHeight <= viewportHeight) return 100;

    var scrollable = docHeight - viewportHeight;
    return Math.round((scrollTop / scrollable) * 100);
  }

  function log() {
    if (config.debug && console && console.log) {
      console.log.apply(console, ['[EdgeKite]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  // ============ Event Building ============

  function buildEvent(eventType, category, data, severity) {
    return {
      observed_at: new Date().toISOString(),
      source: {
        type: 'browser',
        id: getSessionId(),
        version: VERSION,
        metadata: getSourceMetadata()
      },
      event: {
        category: category || 'web',
        type: eventType,
        severity: severity || 'info',
        data: data || {}
      },
      privacy: {
        pii: false,
        retention_class: 'standard'
      }
    };
  }

  // ============ Sending ============

  function sendBatch() {
    if (queue.length === 0) return;

    var batch = queue.splice(0, BATCH_SIZE);
    log('Sending batch of', batch.length, 'events');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', config.batchEndpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          log('Batch sent successfully');
        } else {
          log('Batch failed, re-queuing', xhr.status);
          queue = batch.concat(queue);
        }
      }
    };
    xhr.send(JSON.stringify(batch));
  }

  function queueEvent(event) {
    queue.push(event);
    log('Queued event:', event.event.type);

    if (queue.length >= BATCH_SIZE) {
      sendBatch();
    }
  }

  function startBatchTimer() {
    if (batchTimer) return;
    batchTimer = setInterval(sendBatch, BATCH_INTERVAL_MS);
  }

  function flushBeforeUnload() {
    if (queue.length === 0) return;

    // Use sendBeacon if available for reliable delivery
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(queue)], { type: 'application/json' });
      navigator.sendBeacon(config.batchEndpoint, blob);
      queue = [];
    } else {
      // Fallback: synchronous XHR (not ideal but better than nothing)
      var xhr = new XMLHttpRequest();
      xhr.open('POST', config.batchEndpoint, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(queue));
      queue = [];
    }
  }

  // ============ Auto-tracking ============

  function trackPageView() {
    var event = buildEvent('page_view', 'web', {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer || null
    });
    queueEvent(event);
  }

  function trackPageLeave() {
    var timeOnPage = Date.now() - pageLoadTime;
    var event = buildEvent('page_leave', 'web', {
      time_on_page_ms: timeOnPage,
      scroll_depth_pct: maxScrollDepth
    });
    queue.push(event);
    flushBeforeUnload();
  }

  function trackClick(e) {
    var target = e.target;
    if (!target || !target.tagName) return;

    // Only track meaningful clicks
    var tag = target.tagName.toLowerCase();
    if (['a', 'button', 'input', 'select', 'textarea'].indexOf(tag) === -1 &&
        !target.onclick && !target.closest('a, button')) {
      return;
    }

    var data = {
      element_tag: tag,
      element_id: target.id || null,
      element_class: target.className ? target.className.split(' ')[0] : null
    };

    // Get text preview (truncated, no sensitive data)
    var text = target.innerText || target.value || '';
    if (text && text.length > 0) {
      data.text_preview = text.substring(0, 50).trim();
    }

    var event = buildEvent('click', 'web', data);
    queueEvent(event);
  }

  function trackScroll() {
    var depth = getScrollDepth();
    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;
    }

    // Track milestone thresholds
    SCROLL_THRESHOLDS.forEach(function(threshold) {
      if (depth >= threshold && !scrollMarks[threshold]) {
        scrollMarks[threshold] = true;
        var event = buildEvent('scroll', 'web', { depth_pct: threshold });
        queueEvent(event);
      }
    });
  }

  function trackPerformance() {
    if (!window.performance || !performance.getEntriesByType) return;

    // Wait for LCP to be available
    setTimeout(function() {
      var nav = performance.getEntriesByType('navigation')[0];
      var paint = performance.getEntriesByType('paint');

      var data = {};

      if (nav) {
        data.ttfb_ms = Math.round(nav.responseStart - nav.requestStart);
      }

      paint.forEach(function(entry) {
        if (entry.name === 'first-contentful-paint') {
          data.fcp_ms = Math.round(entry.startTime);
        }
      });

      // Try to get LCP from PerformanceObserver
      if (window.PerformanceObserver) {
        try {
          var lcpValue = null;
          var observer = new PerformanceObserver(function(list) {
            var entries = list.getEntries();
            if (entries.length > 0) {
              lcpValue = entries[entries.length - 1].startTime;
            }
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });

          setTimeout(function() {
            observer.disconnect();
            if (lcpValue) data.lcp_ms = Math.round(lcpValue);

            if (Object.keys(data).length > 0) {
              var event = buildEvent('performance', 'web', data);
              queueEvent(event);
            }
          }, 1000);
        } catch (e) {
          // PerformanceObserver not supported for LCP
          if (Object.keys(data).length > 0) {
            var event = buildEvent('performance', 'web', data);
            queueEvent(event);
          }
        }
      } else if (Object.keys(data).length > 0) {
        var event = buildEvent('performance', 'web', data);
        queueEvent(event);
      }
    }, 100);
  }

  function trackError(message, filename, lineno, colno) {
    var event = buildEvent('error', 'web', {
      message: String(message).substring(0, 200),
      filename: filename || null,
      lineno: lineno || null,
      colno: colno || null
    }, 'error');
    queueEvent(event);
  }

  function setupAutoTracking() {
    // Page view
    trackPageView();

    // Clicks
    document.addEventListener('click', trackClick, { passive: true });

    // Scroll (throttled)
    var scrollTimeout = null;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(function() {
        scrollTimeout = null;
        trackScroll();
      }, 200);
    }, { passive: true });

    // Page leave
    window.addEventListener('beforeunload', trackPageLeave);
    window.addEventListener('pagehide', trackPageLeave);

    // Performance metrics
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
    }

    // JS errors
    window.addEventListener('error', function(e) {
      trackError(e.message, e.filename, e.lineno, e.colno);
    });

    // Start batch timer
    startBatchTimer();
  }

  // ============ Public API ============

  var EdgeKite = {
    /**
     * Initialize the tracker
     * @param {Object} options - Configuration options
     * @param {string} options.endpoint - Event ingestion endpoint
     * @param {boolean} options.debug - Enable debug logging
     */
    init: function(options) {
      if (options) {
        if (options.endpoint) {
          config.endpoint = options.endpoint;
          config.batchEndpoint = options.endpoint + '/batch';
        }
        if (options.batchEndpoint) {
          config.batchEndpoint = options.batchEndpoint;
        }
        if (options.debug) {
          config.debug = true;
        }
      }

      log('Initialized with endpoint:', config.endpoint);
      setupAutoTracking();
    },

    /**
     * Track a custom event
     * @param {string} eventType - Event type name
     * @param {Object} data - Event data payload
     * @param {string} category - Event category (default: 'web')
     */
    track: function(eventType, data, category) {
      var event = buildEvent(eventType, category || 'web', data || {});
      queueEvent(event);
    },

    /**
     * Get the current session ID
     * @returns {string} Session ID
     */
    getSessionId: function() {
      return getSessionId();
    },

    /**
     * Flush queued events immediately
     */
    flush: function() {
      sendBatch();
    },

    /**
     * Get tracker version
     * @returns {string} Version string
     */
    version: VERSION
  };

  // Auto-initialize from script tag
  (function autoInit() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.src && script.src.indexOf('tracker.js') > -1) {
        var endpoint = script.getAttribute('data-endpoint');
        var debug = script.getAttribute('data-debug') === 'true';

        if (endpoint || debug) {
          EdgeKite.init({
            endpoint: endpoint || config.endpoint,
            debug: debug
          });
          return;
        }
      }
    }

    // Auto-init with defaults if not configured
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        EdgeKite.init({});
      });
    } else {
      EdgeKite.init({});
    }
  })();

  // Expose globally
  window.EdgeKite = EdgeKite;

})(window, document);
