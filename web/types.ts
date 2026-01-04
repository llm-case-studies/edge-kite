
export type EventCategory = 'web' | 'iot' | 'ops' | 'security';

export interface EdgeEvent {
  id: string;
  timestamp: string; // ISO time or HH:MM:SS for display
  category: EventCategory;
  type: string;
  detail: string;
  sourceId: string;
  isVisitor?: boolean; // Highlight for demo
  meta?: Record<string, any>; // NEW: Structured technical telemetry
}

export interface Source {
  id: string;
  type: 'browser' | 'edge_device' | 'server';
  status: 'online' | 'offline';
  eventsToday: number;
}

export interface SystemStats {
  eventsToday: number;
  activeSources: number;
  pendingSync: number;
  lastSync: string;
  cpuPercent: number;
  ramMb: number;
  dbSizeMb: number;
  syncStatus: 'Connected' | 'Syncing...' | 'Offline';
}

export type Theme = 'edge' | 'ranch' | 'legal' | 'corporate';
export type Language = 'en' | 'es' | 'pt' | 'de';

export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isRedacted?: boolean; // Visual flag for redacted messages
}

// Incident Data for the Airlock
export interface IncidentLog {
  raw: string;
  sanitized: string;
  riskLevel: 'low' | 'medium' | 'critical';
  piiFields: string[]; // List of redacted fields e.g. ["IP Address", "License Plate"]
}

export interface DeploymentManifest {
  siteName: string;
  environment: string;
  hardwareBom: string[];
  alertRules: string[];
  syncSchedule: string;
}

// Pattern Definition for Rust Rule Engine
export interface PatternDef {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'critical';
  logic: string; // Pseudo-code or JSON logic representation
  hitCount: number; // Stats for dashboard
  status: 'active' | 'learning' | 'disabled';
}
