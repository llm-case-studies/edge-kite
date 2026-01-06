
import { EdgeEvent, EventCategory } from '../types';
import { api } from './api';

// Generate a session ID for this specific tab/window
const SESSION_ID = 'sess_' + Math.random().toString(36).substring(2, 9);
const CHANNEL_NAME = 'edgekite_realtime_stream';

type EventHandler = (event: EdgeEvent) => void;

class TrackerService {
  private channel: BroadcastChannel;
  private listeners: Set<EventHandler>;
  private isTracking: boolean = false;
  private sendToApi: boolean = false; // Toggle for API integration
  private apiAvailable: boolean = false;

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.listeners = new Set();

    // Listen for events from OTHER tabs
    this.channel.onmessage = (msg) => {
      if (msg.data && msg.data.id) {
        this.notify(msg.data);
      }
    };

    // Check if API is available on init
    this.checkApiAvailability();
  }

  // Check if EdgeKite API is running
  private async checkApiAvailability() {
    try {
      this.apiAvailable = await api.isAvailable();
      if (this.apiAvailable) {
        console.log('[Tracker] EdgeKite API available');
      }
    } catch {
      this.apiAvailable = false;
    }
  }

  // Enable/disable sending to API
  public setApiMode(enabled: boolean) {
    this.sendToApi = enabled;
    if (enabled) {
      this.checkApiAvailability();
    }
  }

  // Check if API is available
  public isApiAvailable(): boolean {
    return this.apiAvailable;
  }

  // Generate an event object matching our schema
  private createEvent(category: EventCategory, type: string, detail: string, meta?: Record<string, any>): EdgeEvent {
    const now = new Date();
    return {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: now.toLocaleTimeString('en-US', { hour12: false }),
      category,
      type,
      detail,
      sourceId: SESSION_ID,
      isVisitor: true,
      meta
    };
  }

  // Public method to track an event
  public track(category: EventCategory, type: string, detail: string, meta?: Record<string, any>) {
    const event = this.createEvent(category, type, detail, meta);

    // 1. Notify local listeners (this tab's widget)
    this.notify(event);

    // 2. Broadcast to other tabs
    this.channel.postMessage(event);

    // 3. Send to EdgeKite API (if enabled and available)
    if (this.sendToApi && this.apiAvailable) {
      api.queueEvent(event);
    }
  }

  private notify(event: EdgeEvent) {
    this.listeners.forEach(cb => cb(event));
  }

  public subscribe(callback: EventHandler) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Auto-track DOM events
  public startAutoTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    this.trackSessionInfo();
    this.trackInteractions();
    this.trackPerformance();
    this.trackErrors();
  }

  // 1. Session & Hardware Capabilities
  private trackSessionInfo() {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    const deviceInfo = {
      userAgent: nav.userAgent,
      language: nav.language,
      platform: nav.platform,
      cores: nav.hardwareConcurrency || 'unknown',
      memory: nav.deviceMemory ? `${nav.deviceMemory}GB` : 'unknown',
      screen: `${window.screen.width}x${window.screen.height}`,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: nav.cookieEnabled,
    };

    const netInfo = connection ? {
      effectiveType: connection.effectiveType, // '4g', '3g', etc.
      rtt: connection.rtt, // Round trip time estimate
      saveData: connection.saveData, // Data saver mode
      downlink: connection.downlink // Mb/s estimate
    } : { type: 'unknown' };

    this.track('web', 'session_start', 'New Visitor Session', {
      device: deviceInfo,
      network: netInfo,
      referrer: document.referrer || 'direct'
    });
  }

  // 2. Interactions (Clicks, Visibility, Scroll)
  private trackInteractions() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const clickable = target.closest('button, a, input');
      
      if (clickable) {
        const text = clickable.textContent?.slice(0, 20).trim() || (clickable as any).name || 'element';
        const tag = clickable.tagName.toLowerCase();
        
        // Coordinates for heatmap analysis later
        const meta = {
          x: (e as MouseEvent).pageX,
          y: (e as MouseEvent).pageY,
          id: clickable.id || null,
          class: clickable.className || null
        };

        this.track('web', 'click', `${tag}: ${text}`, meta);
      }
    });

    document.addEventListener('visibilitychange', () => {
      this.track('web', 'visibility', document.hidden ? 'tab_hidden' : 'tab_active');
    });

    let scrollTimeout: any;
    document.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
          this.track('web', 'scroll', `depth: ${pct}%`);
          scrollTimeout = null;
        }, 1000);
      }
    });
  }

  // 3. Performance (Web Vitals & Timing)
  private trackPerformance() {
    window.addEventListener('load', () => {
      // Navigation Timing
      const perf = window.performance;
      const navEntry = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navEntry) {
        this.track('ops', 'page_load', `${Math.round(navEntry.loadEventEnd - navEntry.startTime)}ms`, {
          ttfb: navEntry.responseStart - navEntry.requestStart,
          domComplete: navEntry.domComplete - navEntry.startTime,
          dns: navEntry.domainLookupEnd - navEntry.domainLookupStart
        });
      }
    });

    // Observer for LCP (Largest Contentful Paint)
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
           this.track('ops', 'vital_lcp', `${Math.round(entry.startTime)}ms`);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // Observer for CLS (Layout Shift)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const val = (entry as any).value;
          if (val > 0.05) { // Only log significant shifts
             this.track('ops', 'vital_cls', `Shift: ${val.toFixed(3)}`);
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // Observers not supported in all browsers
    }
  }

  // 4. Errors (Resilience)
  private trackErrors() {
    window.addEventListener('error', (event) => {
      this.track('security', 'js_error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.track('security', 'promise_reject', 'Unhandled Promise Rejection', {
        reason: event.reason?.toString() || 'unknown'
      });
    });
  }
}

export const tracker = new TrackerService();
