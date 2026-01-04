import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, RefreshCw, Filter, Search, CheckCircle, Database, ShieldAlert, Code2 } from 'lucide-react';
import { EdgeEvent, SystemStats, Theme, Language } from '../types';
import { MOCK_SOURCES, generateRandomEvent, generateMockStats, INITIAL_EVENTS } from '../mock-data';
import ThemeSelector from './ThemeSelector';
import PatternMonitor from './PatternMonitor';
import SettingsModal from './SettingsModal';
import Sparkline from './Sparkline';
import { storage } from '../services/storage';
import { getTranslation } from '../utils/translations';

interface DashboardProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'architect') => void;
  demoMode?: 'simulated' | 'real';
  realEvents?: EdgeEvent[];
}

const Dashboard: React.FC<DashboardProps> = ({ theme, setTheme, language, setLanguage, onNavigate, demoMode = 'simulated', realEvents = [] }) => {
  const [events, setEvents] = useState<EdgeEvent[]>(INITIAL_EVENTS);
  const [stats, setStats] = useState<SystemStats>(generateMockStats());
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  
  // Chart Data State
  const [eventTrend, setEventTrend] = useState<number[]>([10, 15, 12, 20, 25, 18, 22, 30, 28, 35]);
  const [cpuTrend, setCpuTrend] = useState<number[]>([40, 42, 45, 38, 35, 42, 48, 50, 45, 40]);
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize from Storage (Real Mode Persistence)
  useEffect(() => {
    if (demoMode === 'real') {
       const savedEvents = storage.loadEvents();
       if (savedEvents && savedEvents.length > 0) {
         setEvents(savedEvents);
       }
       const savedStats = storage.loadStats();
       if (savedStats) setStats(savedStats);
    }
  }, []); // Run once on mount

  // Sync with real events prop & Persist
  useEffect(() => {
    if (demoMode === 'real') {
      if (realEvents.length > events.length || (realEvents.length > 0 && events.length === 0)) {
         setEvents(realEvents);
         storage.saveEvents(realEvents);
         setEventTrend(prev => [...prev.slice(1), prev[prev.length-1] + Math.floor(Math.random() * 5)]);
      }

      setStats(prev => {
          const newStats = {
            ...prev,
            eventsToday: realEvents.length,
            activeSources: 1,
            pendingSync: prev.pendingSync + (realEvents.length > prev.eventsToday ? 1 : 0)
          };
          storage.saveStats(newStats);
          return newStats;
      });
    }
  }, [realEvents, demoMode]);

  // Simulation Logic
  useEffect(() => {
    if (demoMode === 'real') return;

    const interval = setInterval(() => {
      // Add new events
      if (Math.random() > 0.4) {
        setEvents(prev => [generateRandomEvent(theme, false, language), ...prev].slice(0, 50));
        setEventTrend(prev => [...prev.slice(1), Math.floor(Math.random() * 40) + 10]);
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        eventsToday: prev.eventsToday + 1,
        cpuPercent: Math.max(0.1, Math.min(100, prev.cpuPercent + (Math.random() * 10 - 5))),
        pendingSync: Math.max(0, prev.pendingSync + (Math.random() > 0.6 ? 1 : -2)),
      }));

      // CPU Trend
      setCpuTrend(prev => [...prev.slice(1), stats.cpuPercent]);

    }, 2000);
    return () => clearInterval(interval);
  }, [demoMode, theme, language, stats.cpuPercent]);

  // Manual Sync Action
  const handleManualSync = async () => {
    setStats(prev => ({ ...prev, syncStatus: 'Syncing...' }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStats(prev => ({
      ...prev,
      pendingSync: 0,
      lastSync: 'Just now',
      syncStatus: 'Connected'
    }));
  };

  const filteredEvents = events.filter(e => {
    if (selectedSource !== 'all' && e.sourceId !== selectedSource) return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-app-base text-app-text font-sans flex flex-col h-screen overflow-hidden transition-colors duration-300">
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        stats={stats}
        onManualSync={handleManualSync}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Top Bar */}
      <header className="h-14 bg-app-dark border-b border-app-border flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate && onNavigate('landing')}
            className="w-8 h-8 bg-app-primary rounded flex items-center justify-center font-bold text-white shadow-lg shadow-app-primary/20 cursor-pointer"
          >
            E
          </div>
          <span className="font-heading font-semibold text-app-text cursor-default">EdgeKite Dashboard</span>
          {demoMode === 'real' && (
             <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">Live Connection</span>
          )}
        </div>
        <div className="flex items-center gap-3">
           <button
            onClick={() => onNavigate && onNavigate('architect')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase tracking-wide transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Privacy Airlock
          </button>
          <div className="h-6 w-px bg-app-border mx-1 hidden md:block"></div>
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} language={language} compact />
          <div className="h-6 w-px bg-app-border mx-1"></div>
          <button 
            onClick={() => onNavigate && onNavigate('docs')}
            className="p-2 hover:bg-app-card rounded text-app-muted hover:text-app-text transition-colors"
            title="Documentation"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-app-card rounded text-app-muted hover:text-app-text transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-app-card rounded-full border border-app-border flex items-center justify-center text-xs font-bold text-app-muted">
            JD
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-app-base border-r border-app-border flex flex-col overflow-y-auto shrink-0 hidden md:flex">
          <div className="p-4">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-4">
               {getTranslation(language, `sidebar_label_${theme}` as any)}
            </h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedSource('all')}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${selectedSource === 'all' ? 'bg-app-card text-app-text border border-app-border' : 'text-app-muted hover:bg-app-card/50'}`}
              >
                <span>{getTranslation(language, `all_sources_${theme}` as any)}</span>
                <span className="text-xs bg-app-border px-1.5 rounded-full">{demoMode === 'real' ? 1 : MOCK_SOURCES.length}</span>
              </button>
              {demoMode === 'simulated' ? MOCK_SOURCES.map(source => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between group transition-colors ${selectedSource === source.id ? 'bg-app-card text-app-text border border-app-border' : 'text-app-muted hover:bg-app-card/50'}`}
                >
                  <span className="truncate">{source.id}</span>
                  <span className={`w-2 h-2 rounded-full ${source.status === 'online' ? 'bg-emerald-500' : 'bg-app-border'}`} />
                </button>
              )) : (
                <button
                   className="w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between group bg-app-card text-app-text border border-app-border"
                >
                   <span className="truncate">current-browser</span>
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-app-border">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-4">{getTranslation(language, 'col_category')}</h3>
            <div className="space-y-1">
              {['all', 'web', 'iot', 'ops', 'security'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded text-sm capitalize flex items-center gap-2 transition-colors ${selectedCategory === cat ? 'bg-app-card text-app-text border border-app-border' : 'text-app-muted hover:bg-app-card/50'}`}
                >
                  <div className={`w-2 h-2 rounded-sm ${getCategoryColor(cat)}`} />
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Theme Indicator in Sidebar */}
           <div className="mt-auto p-4 border-t border-app-border">
             <div className="bg-app-card p-3 rounded-lg border border-app-border">
                <div className="text-xs font-bold text-app-muted uppercase mb-1">Context</div>
                <div className="font-heading font-bold text-app-primary flex items-center gap-2 text-sm">
                   <Database className="w-4 h-4" />
                   {getTranslation(language, `theme_${theme}` as any)}
                </div>
             </div>
           </div>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-app-base/50 relative">
          
          {/* Stats & Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-app-border bg-app-base h-auto">
            
            {/* Standard Stats with Sparklines */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:col-span-3">
               <StatCard 
                 title={getTranslation(language, 'stat_events')} 
                 value={stats.eventsToday.toLocaleString()} 
                 chart={<Sparkline data={eventTrend} color="#3b82f6" fill />}
               />
               <StatCard 
                 title={getTranslation(language, `stat_active_${theme}` as any)} 
                 value={demoMode === 'real' ? "1/1" : `${stats.activeSources}/${MOCK_SOURCES.length}`} 
                 sub="1 offline" highlight="warning" 
               />
               <StatCard 
                 title="CPU Load" 
                 value={`${stats.cpuPercent.toFixed(1)}%`} 
                 chart={<Sparkline data={cpuTrend} color={stats.cpuPercent > 80 ? "#ef4444" : "#10b981"} />}
               />
               <StatCard 
                 title={getTranslation(language, 'stat_sync')} 
                 value={stats.lastSync} 
                 sub="Central Hub" 
               />
            </div>

            {/* Pattern Monitor */}
            <div className="md:col-span-1 h-full">
              <PatternMonitor />
            </div>
          </div>

          {/* Event Stream Toolbar */}
          <div className="px-6 py-3 border-b border-app-border flex items-center justify-between bg-app-base">
            <h2 className="font-heading font-semibold text-app-text">Event Stream</h2>
            <div className="flex gap-2">
              <button className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-card rounded">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-card rounded">
                <Filter className="w-4 h-4" />
              </button>
              <button 
                 onClick={handleManualSync}
                 className="p-1.5 text-app-muted hover:text-app-text hover:bg-app-card rounded"
                 title="Quick Sync"
              >
                <RefreshCw className={`w-4 h-4 ${stats.syncStatus === 'Syncing...' ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Event List */}
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth bg-app-dark/20">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-app-base/95 sticky top-0 backdrop-blur-sm z-10 text-app-muted text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3 border-b border-app-border">{getTranslation(language, 'col_time')}</th>
                  <th className="px-6 py-3 border-b border-app-border">{getTranslation(language, 'col_source')}</th>
                  <th className="px-6 py-3 border-b border-app-border">{getTranslation(language, 'col_category')}</th>
                  <th className="px-6 py-3 border-b border-app-border">{getTranslation(language, 'col_type')}</th>
                  <th className="px-6 py-3 w-full border-b border-app-border">{getTranslation(language, 'col_detail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredEvents.map(evt => (
                  <React.Fragment key={evt.id}>
                    <tr 
                      onClick={() => setExpandedEventId(expandedEventId === evt.id ? null : evt.id)}
                      className={`hover:bg-app-card/40 cursor-pointer transition-colors ${expandedEventId === evt.id ? 'bg-app-card' : ''}`}
                    >
                      <td className="px-6 py-3 font-mono text-app-muted whitespace-nowrap">{evt.timestamp}</td>
                      <td className="px-6 py-3 text-app-text opacity-90">{evt.sourceId}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide bg-opacity-20 ${getCategoryBadge(evt.category)}`}>
                          {evt.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-app-text">{evt.type}</td>
                      <td className="px-6 py-3 text-app-muted truncate max-w-xs">{evt.detail}</td>
                    </tr>
                    {expandedEventId === evt.id && (
                      <tr className="bg-app-dark/50 animate-fade-in">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="bg-app-dark p-4 rounded border border-app-border shadow-inner">
                            <div className="flex items-center gap-2 mb-2 text-app-muted text-xs uppercase font-bold tracking-wider border-b border-app-border/50 pb-2">
                               <Code2 className="w-4 h-4" />
                               <span>Event Payload</span>
                            </div>
                            <pre className="font-mono text-xs text-app-text/80 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify({
  event_id: evt.id,
  observed_at: `${new Date().toISOString().split('T')[0]}T${evt.timestamp}Z`,
  source: { id: evt.sourceId, type: "browser" },
  event: {
    category: evt.category,
    type: evt.type,
    payload: {
      detail: evt.detail,
      ...(evt.meta ? { meta: evt.meta } : {})
    }
  }
}, null, 2)}
                            </pre>
                            {evt.meta && (
                              <div className="mt-3 pt-3 border-t border-app-border/50">
                                 <div className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Captured Telemetry</div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(evt.meta).slice(0, 4).map(([k, v]) => (
                                       <div key={k} className="bg-app-base p-1.5 rounded border border-app-border/30">
                                          <div className="text-[9px] text-app-muted uppercase">{k}</div>
                                          <div className="text-xs font-mono text-app-text truncate" title={String(v)}>{typeof v === 'object' ? 'Object' : String(v)}</div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            {/* Empty State */}
            {filteredEvents.length === 0 && (
               <div className="flex flex-col items-center justify-center h-48 text-app-muted">
                 <p>No events found for this filter.</p>
                 {demoMode === 'real' && <p className="text-xs mt-2">Interact with the app to generate events.</p>}
               </div>
            )}
          </div>
          
          {/* Status Footer */}
          <footer className="bg-app-dark border-t border-app-border px-4 py-1.5 text-[10px] md:text-xs text-app-muted flex justify-between items-center shrink-0 font-mono">
            <div className="flex gap-4">
               <span>CPU: {stats.cpuPercent.toFixed(1)}%</span>
               <span>RAM: {stats.ramMb.toFixed(0)}MB</span>
               <span>DB: {stats.dbSizeMb.toFixed(1)}MB</span>
            </div>
            <div className="flex items-center gap-2">
               <span className={`w-1.5 h-1.5 rounded-full ${stats.syncStatus === 'Connected' ? 'bg-emerald-500' : stats.syncStatus === 'Syncing...' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></span>
               {stats.syncStatus}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

// Sub-components & Helpers

const StatCard: React.FC<{title: string, value: string | number, sub?: string, highlight?: string, chart?: React.ReactNode}> = ({title, value, sub, highlight, chart}) => (
  <div className="bg-app-card rounded-lg p-3 border border-app-border shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
    <div>
      <div className="text-xs text-app-muted font-medium mb-1 z-10 relative">{title}</div>
      <div className="text-2xl font-semibold text-app-text tracking-tight z-10 relative">{value}</div>
      {sub && <div className={`text-xs mt-1 z-10 relative ${highlight === 'warning' ? 'text-amber-400' : 'text-app-muted'}`}>{sub}</div>}
    </div>
    {chart && (
      <div className="absolute bottom-0 right-0 left-0 h-12 opacity-50 z-0 pointer-events-none">
        {chart}
      </div>
    )}
  </div>
);

function getCategoryColor(cat: string) {
  switch (cat) {
    case 'web': return 'bg-emerald-500';
    case 'iot': return 'bg-amber-500';
    case 'ops': return 'bg-indigo-500';
    case 'security': return 'bg-red-500';
    default: return 'bg-app-muted';
  }
}

function getCategoryBadge(cat: string) {
   switch (cat) {
    case 'web': return 'bg-emerald-500 text-emerald-400';
    case 'iot': return 'bg-amber-500 text-amber-400';
    case 'ops': return 'bg-indigo-500 text-indigo-400';
    case 'security': return 'bg-red-500 text-red-400';
    default: return 'bg-app-border text-app-muted';
  }
}

export default Dashboard;