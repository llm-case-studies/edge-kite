
import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import DocsPage from './components/DocsPage';
import ArchitectView from './components/ArchitectView';
import { Theme, EdgeEvent, Language } from './types';
import { tracker } from './services/tracker';
import { INITIAL_EVENTS } from './mock-data';
import { storage } from './services/storage';

const App: React.FC = () => {
  // Routing State
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'docs' | 'architect'>('landing');
  const [theme, setTheme] = useState<Theme>('edge');
  const [language, setLanguage] = useState<Language>('en');

  // Demo Widget Global State (Lifted)
  const [demoMode, setDemoMode] = useState<'simulated' | 'real'>('simulated');
  const [demoEvents, setDemoEvents] = useState<EdgeEvent[]>(INITIAL_EVENTS);
  
  // Calculate real visitors based on unique source IDs in the event stream
  const realVisitorCount = useMemo(() => {
    if (demoMode === 'simulated') return 0; // The widget handles simulated counts internally
    const uniqueSources = new Set(demoEvents.map(e => e.sourceId));
    // Always at least 1 (yourself), even if no events generated yet
    return Math.max(1, uniqueSources.size);
  }, [demoEvents, demoMode]);

  // 1. Initialize Global Auto-Tracking (once on mount)
  useEffect(() => {
    tracker.startAutoTracking();
    
    // Restore Preferences
    const savedTheme = storage.loadPref('theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    const savedLang = storage.loadPref('lang') as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);
  
  // Save preferences when changed
  useEffect(() => {
    storage.savePref('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    storage.savePref('lang', language);
  }, [language]);

  // 2. Global "Real Mode" Listener
  // This ensures we capture events even when navigating away from LandingPage (e.g. in Docs)
  useEffect(() => {
    if (demoMode === 'simulated') return;

    // When in real mode, the App root listens to the tracker constantly
    const unsubscribe = tracker.subscribe((newEvent) => {
      setDemoEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 for global state, Dashboard handles its own list
    });

    return () => { unsubscribe(); };
  }, [demoMode]);

  // Handle URL Routing
  useEffect(() => {
    try {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        setCurrentView('dashboard');
      } else if (path === '/docs') {
        setCurrentView('docs');
      } else if (path === '/architect') {
        setCurrentView('architect');
      }
    } catch (e) {
      console.warn("Could not read location pathname, defaulting to landing.");
    }
    
    window.onpopstate = () => {
       try {
         const path = window.location.pathname;
         if (path === '/dashboard') {
            setCurrentView('dashboard');
         } else if (path === '/docs') {
            setCurrentView('docs');
         } else if (path === '/architect') {
            setCurrentView('architect');
         } else {
            setCurrentView('landing');
         }
       } catch (e) {
         setCurrentView('landing');
       }
    };
  }, []);

  const navigate = (view: 'landing' | 'dashboard' | 'docs' | 'architect') => {
    setCurrentView(view);
    let path = '/';
    if (view === 'dashboard') path = '/dashboard';
    if (view === 'docs') path = '/docs';
    if (view === 'architect') path = '/architect';
    
    // Wrap pushState in try-catch to support sandboxed environments (like blob: origins)
    try {
      window.history.pushState(null, '', path);
    } catch (e) {
      console.warn("History API unavailable in this environment, falling back to state-only navigation.", e);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'edge' ? '' : `theme-${theme}`}`}>
      {currentView === 'landing' && (
        <LandingPage 
          onNavigate={navigate} 
          theme={theme} 
          setTheme={setTheme}
          language={language}
          setLanguage={setLanguage}
          // Pass Demo State down
          demoMode={demoMode}
          setDemoMode={setDemoMode}
          demoEvents={demoEvents}
          setDemoEvents={setDemoEvents}
          realVisitorCount={realVisitorCount}
        />
      )}
      {currentView === 'dashboard' && (
        <Dashboard 
          theme={theme} 
          setTheme={setTheme} 
          language={language}
          setLanguage={setLanguage}
          onNavigate={navigate}
          demoMode={demoMode}
          realEvents={demoEvents} 
        />
      )}
      {currentView === 'docs' && (
        <DocsPage 
          onNavigate={navigate} 
          theme={theme} 
          setTheme={setTheme}
          language={language}
        />
      )}
      {currentView === 'architect' && (
        <ArchitectView 
          onNavigate={navigate} 
          theme={theme} 
          language={language}
        />
      )}
    </div>
  );
};

export default App;
