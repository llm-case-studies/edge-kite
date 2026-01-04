
import React, { useState, useEffect } from 'react';
import { EdgeEvent, Theme, Language } from '../types';
import { generateRandomEvent } from '../mock-data';
import { Activity, User, MousePointer2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface DemoWidgetProps {
  mode: 'simulated' | 'real';
  setMode: (m: 'simulated' | 'real') => void;
  events: EdgeEvent[];
  setEvents: React.Dispatch<React.SetStateAction<EdgeEvent[]>>;
  visitorCountOverride?: number;
  theme: Theme;
  language?: Language;
}

const DemoWidget: React.FC<DemoWidgetProps> = ({ mode, setMode, events, setEvents, visitorCountOverride, theme, language = 'en' as Language }) => {
  const [simVisitorCount, setSimVisitorCount] = useState(42);

  // Use the prop override if provided (Real mode), otherwise use local sim state
  const displayedVisitorCount = visitorCountOverride !== undefined ? visitorCountOverride : simVisitorCount;

  const handleModeSwitch = (newMode: 'simulated' | 'real') => {
    if (newMode === mode) return;
    setMode(newMode);
    
    // Reset data based on mode choice
    if (newMode === 'simulated') {
      setEvents([]); // Will refill naturally
      setSimVisitorCount(42);
    } else {
      setEvents([]); // Clear for real tracking
    }
  };

  // Handle Simulation Logic (Only runs when mounted and in sim mode)
  useEffect(() => {
    if (mode === 'real') return;

    // Initial fill if empty
    if (events.length === 0) {
       setEvents(Array.from({ length: 5 }).map(() => generateRandomEvent(theme, false, language)));
    }

    const interval = setInterval(() => {
      const isVisitor = Math.random() > 0.7;
      const newEvent = generateRandomEvent(theme, isVisitor, language);
      
      setEvents(prev => [newEvent, ...prev].slice(0, 10));
      
      if (Math.random() > 0.8) {
        setSimVisitorCount(c => c + (Math.random() > 0.5 ? 1 : -1));
      }
    }, 1500);

    return () => { clearInterval(interval); };
  }, [mode, theme, language, setEvents]); // Re-run if theme or language changes

  return (
    <div className="w-full max-w-lg mx-auto bg-app-base border border-app-border rounded-xl overflow-hidden shadow-2xl font-mono text-xs md:text-sm relative group transition-colors duration-300">
      {/* Decorative glows based on mode */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 opacity-20 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${mode === 'real' ? 'bg-emerald-500' : 'bg-app-primary'}`}></div>
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${mode === 'real' ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}></div>

      {/* Header */}
      <div className="bg-app-card/90 backdrop-blur border-b border-app-border p-3 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 text-app-text">
          <Activity className={`w-4 h-4 ${mode === 'real' ? 'text-emerald-500' : 'text-app-primary'}`} />
          <span className="font-semibold">Live Telemetry</span>
          
          {/* Mode Toggle */}
          <div className="flex bg-app-dark p-0.5 rounded-lg border border-app-border ml-2">
            <button
              onClick={() => handleModeSwitch('simulated')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all ${mode === 'simulated' ? 'bg-app-primary text-white shadow-sm' : 'text-app-muted hover:text-app-text'}`}
            >
              Sim
            </button>
            <button
              onClick={() => handleModeSwitch('real')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 ${mode === 'real' ? 'bg-emerald-600 text-white shadow-sm' : 'text-app-muted hover:text-app-text'}`}
            >
              Real
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-app-dark/50 px-2 py-1 rounded text-app-muted">
          <User className="w-3 h-3" />
          <span>Active: {displayedVisitorCount}</span>
        </div>
      </div>

      {/* Event Stream */}
      <div className="h-64 overflow-hidden relative bg-app-base/50">
        
        {/* Real Mode Instructions Overlay if empty */}
        {mode === 'real' && events.length === 0 && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
              <MousePointer2 className="w-8 h-8 text-app-muted mb-2 animate-bounce" />
              <p className="text-app-text font-medium">Waiting for interaction...</p>
              <p className="text-app-muted text-xs mt-1">Click buttons, scroll, or open this page in a new tab to see events.</p>
           </div>
        )}

        <div className="absolute inset-0 p-2 space-y-1 z-10">
          {events.map((evt) => (
            <div 
              key={evt.id}
              className={`flex items-center gap-3 p-2 rounded transition-all duration-500 animate-slide-in ${
                (evt.isVisitor || mode === 'real') 
                  ? 'bg-app-primary/10 border-l-2 border-app-primary' 
                  : 'text-app-muted border-l-2 border-transparent'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${evt.isVisitor || mode === 'real' ? 'bg-app-primary animate-pulse' : 'bg-app-border'}`} />
              <span className="text-app-muted w-16 tabular-nums opacity-70">{evt.timestamp}</span>
              <span className={`w-24 font-medium truncate ${getColor(evt.category)}`}>{evt.type}</span>
              <span className="flex-1 truncate text-app-muted">{evt.detail}</span>
              {(evt.isVisitor || mode === 'real') && (
                <span className="hidden md:inline text-[10px] uppercase tracking-wider text-app-primary font-bold px-1.5 py-0.5 bg-app-primary/20 rounded">
                  {mode === 'real' ? 'LIVE' : 'YOU'}
                </span>
              )}
            </div>
          ))}
        </div>
        {/* Fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-app-base to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Footer */}
      <div className="bg-app-card/80 border-t border-app-border p-2 px-4 flex justify-between text-app-muted text-[10px] md:text-xs">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${mode === 'real' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`}></span>
          {mode === 'real' ? 'Listening to DOM' : getTranslation(language, 'demo_status')}
        </span>
        <span className="font-mono">Session: {mode === 'real' ? 'REAL_BROWSER' : 'RANDOM_SEED'}</span>
      </div>
    </div>
  );
};

function getColor(category: string) {
  switch (category) {
    case 'web': return 'text-emerald-400';
    case 'iot': return 'text-amber-400';
    case 'ops': return 'text-indigo-400';
    case 'security': return 'text-red-400';
    default: return 'text-app-muted';
  }
}

export default DemoWidget;
