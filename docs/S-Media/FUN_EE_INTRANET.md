
# 👔 Fun-EE: The "Boring App" Monitor
**"Enterprise Edition features. Start-up budget (Zero)."**

## The Problem: The Intranet Black Hole
Every company has "That App."
*   The legacy HR Portal written in PHP 5.
*   The Inventory System that "gets slow around 2 PM."
*   The Internal Wiki that nobody maintains.

You can't install a $15,000/year Datadog agent on these. It's overkill. So you fly blind.

## The Solution: EdgeKite "Fun-EE"
EdgeKite is the perfect "Flashlight for your Legacy Basement."

### 1. The Strategy
We treat your boring internal app like an IoT device. It's an asset that emits signals.
*   **Heartbeat:** Is the page loading?
*   **Temperature:** How many JS errors per minute?
*   **Vibration:** Is the API latency spiking?

### 2. Implementation
Drop this snippet into your `footer.php` or `index.html`:

```javascript
// Monitor Page Load Speed
window.addEventListener('load', () => {
  const timing = window.performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  
  // Send to local EdgeKite instance
  fetch('http://internal-tools-server:3000/api/ingest', {
    method: 'POST',
    body: JSON.stringify({
      category: 'ops',
      type: 'legacy_load_time',
      detail: `${loadTime}ms`,
      meta: { user: 'bob_accounting' }
    })
  });
});

// Monitor JS Crashes
window.onerror = (msg, url, line) => {
   fetch('http://internal-tools-server:3000/api/ingest', {
    method: 'POST',
    body: JSON.stringify({
      category: 'ops',
      type: 'legacy_js_error',
      detail: msg
    })
  });
};
```

### 3. The Dashboard (Theme: Corporate)
Switch EdgeKite to **Fun-EE (Corporate)** mode.
*   **Colors:** Beige, Grey, and Teal. Professional. Boring. Perfect.
*   **Vocabulary:**
    *   "Sources" -> "Cost Centers"
    *   "Incidents" -> "Tickets"
    *   "Uptime" -> "SLA Status"

## Why "Fun-EE"?
Because spending $0 to fix a problem that has annoyed your coworkers for 5 years is actually pretty fun.
