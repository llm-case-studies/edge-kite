
import { EdgeEvent, SystemStats, EventCategory } from '../types';

// API base - relative path works with Vite proxy in dev, same-origin in prod
const API_BASE = '/api';

// Backend event format (matches edge/src/event.rs IncomingEvent)
export interface IncomingEvent {
  event_id?: string;
  observed_at?: string;
  source: {
    type: 'browser' | 'edge_device' | 'server';
    id: string;
    version?: string;
    metadata?: Record<string, any>;
  };
  event: {
    category: string;
    type: string;
    severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    data: Record<string, any>;
  };
  correlation?: {
    session_id?: string;
    parent_event_id?: string;
    trace_id?: string;
  };
  privacy?: {
    pii: boolean;
    consent_id?: string;
    retention_class?: 'ephemeral' | 'standard' | 'legal_hold';
  };
}

// Backend response types
export interface IngestResponse {
  accepted: string[];
  rejected: Array<{ event_id: string; reason: string }>;
}

export interface StatsResponse {
  total_events: number;
  pending_sync: number;
  sources: number;
}

export interface ResourcesResponse {
  cpu_percent: number;
  ram_mb: number;
  db_size_mb: number;
  sync_status: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_secs: number;
}

// Convert frontend EdgeEvent to backend IncomingEvent
export function toBackendEvent(e: EdgeEvent): IncomingEvent {
  return {
    event_id: e.id,
    source: {
      type: 'browser',
      id: e.sourceId,
      version: '0.1.0',
      metadata: e.meta || {}
    },
    event: {
      category: e.category,
      type: e.type,
      severity: 'info',
      data: {
        detail: e.detail,
        ...(e.meta || {})
      }
    },
    privacy: {
      pii: false,
      retention_class: 'standard'
    }
  };
}

// Convert backend event to frontend EdgeEvent (for recent events)
export function toFrontendEvent(e: any): EdgeEvent {
  const timestamp = e.observed_at
    ? new Date(e.observed_at).toLocaleTimeString('en-US', { hour12: false })
    : new Date().toLocaleTimeString('en-US', { hour12: false });

  return {
    id: e.event_id || e.id || Math.random().toString(36).substring(2, 11),
    timestamp,
    category: (e.event?.category || 'web') as EventCategory,
    type: e.event?.type || 'unknown',
    detail: e.event?.data?.detail || JSON.stringify(e.event?.data || {}),
    sourceId: e.source?.id || 'unknown',
    isVisitor: e.source?.type === 'browser',
    meta: e.event?.data
  };
}

class ApiService {
  private baseUrl: string;
  private online: boolean = true;
  private pendingQueue: IncomingEvent[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchSize: number = 10;
  private flushInterval: number = 5000; // 5 seconds

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;

    // Monitor online status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.online = false;
      });
    }
  }

  // Send single event
  async sendEvent(event: IncomingEvent): Promise<IngestResponse> {
    const res = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // Send batch of events
  async sendBatch(events: IncomingEvent[]): Promise<IngestResponse> {
    if (events.length === 0) {
      return { accepted: [], rejected: [] };
    }

    const res = await fetch(`${this.baseUrl}/events/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events)
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // Queue event for batched sending (more efficient)
  queueEvent(event: EdgeEvent) {
    const backendEvent = toBackendEvent(event);
    this.pendingQueue.push(backendEvent);

    // Flush immediately if batch is full
    if (this.pendingQueue.length >= this.batchSize) {
      this.flushQueue();
    } else if (!this.flushTimeout) {
      // Schedule flush
      this.flushTimeout = setTimeout(() => this.flushQueue(), this.flushInterval);
    }
  }

  // Flush pending events
  async flushQueue(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingQueue.length === 0) return;
    if (!this.online) {
      console.log('[API] Offline, keeping', this.pendingQueue.length, 'events in queue');
      return;
    }

    const batch = this.pendingQueue.splice(0, this.batchSize);

    try {
      const result = await this.sendBatch(batch);
      console.log('[API] Sent batch:', result.accepted.length, 'accepted,', result.rejected.length, 'rejected');
    } catch (err) {
      console.warn('[API] Batch failed, re-queuing:', err);
      // Put events back at front of queue
      this.pendingQueue.unshift(...batch);
    }
  }

  // Get system stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${this.baseUrl}/stats`);

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data: StatsResponse = await res.json();

    // Also fetch resources for full stats
    const resources = await this.getResources();

    return {
      eventsToday: data.total_events,
      activeSources: data.sources,
      pendingSync: data.pending_sync,
      lastSync: 'now',
      cpuPercent: resources.cpu_percent,
      ramMb: resources.ram_mb,
      dbSizeMb: resources.db_size_mb,
      syncStatus: resources.sync_status === 'connected' ? 'Connected' : 'Offline'
    };
  }

  // Get resource usage
  async getResources(): Promise<ResourcesResponse> {
    const res = await fetch(`${this.baseUrl}/resources`);

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // Get health status
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  // Get recent events (requires backend endpoint)
  async getRecentEvents(limit: number = 100): Promise<EdgeEvent[]> {
    const res = await fetch(`${this.baseUrl}/events/recent?limit=${limit}`);

    if (!res.ok) {
      // Endpoint might not exist yet
      if (res.status === 404) {
        console.warn('[API] /events/recent not implemented yet');
        return [];
      }
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.map(toFrontendEvent);
  }

  // Check if API is reachable
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        // Short timeout
        signal: AbortSignal.timeout(2000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Get pending queue size
  getPendingCount(): number {
    return this.pendingQueue.length;
  }
}

// Export singleton instance
export const api = new ApiService();
