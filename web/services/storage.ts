
import { EdgeEvent, SystemStats, DeploymentManifest } from '../types';

const KEYS = {
  EVENTS: 'edgekite_events_v1',
  STATS: 'edgekite_stats_v1',
  SPEC: 'edgekite_spec_v1',
  THEME: 'edgekite_theme_pref',
  LANG: 'edgekite_lang_pref'
};

class StorageService {
  
  // Events
  public saveEvents(events: EdgeEvent[]) {
    try {
      // Limit to last 1000 events to prevent QuotaExceeded
      const toSave = events.slice(0, 1000);
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }

  public loadEvents(): EdgeEvent[] | null {
    try {
      const data = localStorage.getItem(KEYS.EVENTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  // Stats
  public saveStats(stats: SystemStats) {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  }

  public loadStats(): SystemStats | null {
    const data = localStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : null;
  }

  // Spec (Architect/Configurator)
  public saveSpec(spec: DeploymentManifest) {
    localStorage.setItem(KEYS.SPEC, JSON.stringify(spec));
  }

  public loadSpec(): DeploymentManifest | null {
    const data = localStorage.getItem(KEYS.SPEC);
    return data ? JSON.parse(data) : null;
  }

  // Preferences
  public savePref(key: 'theme' | 'lang', value: string) {
    localStorage.setItem(key === 'theme' ? KEYS.THEME : KEYS.LANG, value);
  }

  public loadPref(key: 'theme' | 'lang'): string | null {
    return localStorage.getItem(key === 'theme' ? KEYS.THEME : KEYS.LANG);
  }

  public clearAll() {
    localStorage.removeItem(KEYS.EVENTS);
    localStorage.removeItem(KEYS.STATS);
    localStorage.removeItem(KEYS.SPEC);
  }
}

export const storage = new StorageService();
