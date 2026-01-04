
import React, { useState, useRef, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';
import { Theme, Language } from '../types';
import { ArrowLeft, Book, Code, Server, Database, Layers, CheckSquare, AlertTriangle, FileText, ChevronRight, Play, Pause, GraduationCap, X, Eye, Image as ImageIcon, ChevronDown, ChevronUp, CheckCircle, Film, Target, TrendingUp, Cpu, CircleDashed, Circle } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface DocsPageProps {
  onNavigate: (page: 'landing' | 'dashboard' | 'docs') => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  language?: Language;
}

type DocSection = 'overview' | 'simulation' | 'themes' | 'backend' | 'api' | 'wiring' | 'media';

// Constants for Media (Non-translated for now as these represent external assets)
const REPORT_INVESTMENT = `### Investment Memorandum: EdgeKite
...`;
const REPORT_WHITEPAPER = `### Understanding the 'Missing Middle'
...`;

const DocsPage: React.FC<DocsPageProps> = ({ onNavigate, theme, setTheme, language = 'en' as Language }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('media');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [infographicError, setInfographicError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Modal State for Reports
  const [viewingReport, setViewingReport] = useState<{title: string, content: string} | null>(null);

  // Flip Card State
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // Audio Control
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Audio playback failed:", err);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused && audioRef.current.duration) {
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setAudioProgress(pct);
      } 
      else if (isPlaying) {
        setAudioProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 0.2;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  // Define Sections with Translation Keys
  const sections: { id: DocSection; labelKey: string; icon?: React.ElementType }[] = [
    { id: 'overview', labelKey: 'sec_overview' },
    { id: 'media', labelKey: 'sec_media', icon: GraduationCap },
    { id: 'simulation', labelKey: 'sec_simulation' },
    { id: 'themes', labelKey: 'sec_themes' },
    { id: 'backend', labelKey: 'sec_backend' },
    { id: 'api', labelKey: 'sec_api' },
    { id: 'wiring', labelKey: 'sec_wiring', icon: AlertTriangle },
  ];

  const currentLabelKey = sections.find(s => s.id === activeSection)?.labelKey;
  const currentLabel = currentLabelKey ? getTranslation(language, currentLabelKey as any) : '';

  // Generate Flashcards based on current language
  const getFlashcards = () => {
    return [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
      q: getTranslation(language, `card_q${i}` as any),
      a: getTranslation(language, `card_a${i}` as any)
    }));
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <section className="space-y-8 animate-fade-in">
             <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wide border border-emerald-500/20 mb-4">
                  State of the Union: v0.3.0 (Gateway Alpha)
                </div>
                <h1 className="font-heading text-4xl font-bold text-app-text mb-4">{getTranslation(language, 'sec_overview')} & Vision</h1>
                <p className="text-xl text-app-muted leading-relaxed max-w-3xl">
                   We have successfully prototyped the <strong>Contextual Gateway</strong> architecture.
                </p>
             </div>
             {/* ... Cards kept same structure ... */}
             <div className="bg-app-dark/30 rounded-xl border border-app-border p-6">
                <h3 className="font-bold text-app-text mb-4">Development Roadmap</h3>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                         <h4 className="font-medium text-app-text text-sm">Phase 1: Concept & UX (Complete)</h4>
                         <p className="text-xs text-app-muted">Defined the "Gateway" multi-tenant UI.</p>
                      </div>
                   </div>
                   {/* ... items ... */}
                </div>
             </div>
          </section>
        );
      case 'media':
        return (
          <section className="space-y-12 animate-fade-in">
             <div>
                <h2 className="font-heading text-3xl font-bold flex items-center gap-2 text-app-text mb-4">
                  <GraduationCap className="w-8 h-8 text-purple-500" />
                  {getTranslation(language, 'doc_knowledge_center')}
                </h2>
                <p className="text-app-muted">
                   {getTranslation(language, 'doc_knowledge_desc')}
                </p>
             </div>

             {/* Audio Player */}
             <div className="bg-gradient-to-br from-indigo-900 to-app-card rounded-2xl p-6 border border-app-border shadow-xl relative overflow-hidden group">
                {/* ... Audio UI Code ... */}
                <div className="absolute top-0 right-0 p-32 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                <audio 
                  ref={audioRef} 
                  src="/assets/edgekite_audio.mp3" 
                  preload="metadata" 
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                   <div 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-white text-indigo-900 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-white/10 shrink-0"
                   >
                      {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                   </div>
                   <div className="flex-1 space-y-2 text-center md:text-left w-full">
                      <h3 className="text-xl font-bold text-white">The "Missing Middle" Architecture Review</h3>
                      <p className="text-sm text-indigo-200">Audio content is currently available in English only.</p>
                      <div className="relative h-2 bg-white/20 rounded-full mt-4 overflow-hidden cursor-pointer group/bar">
                         <div 
                           className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-linear"
                           style={{ width: `${audioProgress}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Video Player Section */}
             <div className="bg-app-card border border-app-border rounded-xl p-6">
                <h3 className="text-xl font-bold text-app-text mb-4 flex items-center gap-2">
                   <Film className="w-5 h-5 text-amber-500" />
                   {getTranslation(language, 'doc_video_title')}
                </h3>
                <div className="aspect-video bg-black rounded-lg border border-app-border overflow-hidden relative group">
                   <video 
                     controls 
                     className="w-full h-full object-cover"
                     poster="/assets/video_thumbnail.png"
                   >
                      <source src="/assets/edgekite_video.mp4" type="video/mp4" />
                   </video>
                </div>
             </div>

             {/* Infographic Area */}
             <div className="bg-app-card border border-app-border rounded-xl p-6">
                <h3 className="text-xl font-bold text-app-text mb-4 flex items-center gap-2">
                   <ImageIcon className="w-5 h-5 text-emerald-500" />
                   {getTranslation(language, 'doc_infographic_title')}
                </h3>
                <div className="bg-app-base rounded-lg border-2 border-dashed border-app-border flex flex-col items-center justify-center text-app-muted relative overflow-hidden group">
                   {!infographicError ? (
                     <img 
                       src="/assets/edgekite_infographic.png" 
                       alt="EdgeKite Architecture" 
                       className="w-full h-auto object-contain min-h-[300px]"
                       onError={() => setInfographicError(true)}
                     />
                   ) : (
                     <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                        <Layers className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                        <p className="font-medium">Infographic Not Found</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Flip Cards - DYNAMIC */}
             <div>
                <h3 className="text-xl font-bold text-app-text mb-6">{getTranslation(language, 'docs_flashcards_title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {getFlashcards().map((card, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => toggleCard(idx)}
                        className="h-48 cursor-pointer group perspective-1000"
                      >
                         <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flippedCards.has(idx) ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 bg-app-card border border-app-border rounded-xl p-6 flex flex-col items-center justify-center text-center backface-hidden shadow-sm group-hover:border-app-primary/50 transition-colors">
                               <h4 className="font-heading font-bold text-lg text-app-text">{card.q}</h4>
                               <p className="text-xs text-app-muted mt-4 font-mono text-emerald-500/70 opacity-0 group-hover:opacity-100 transition-opacity">Click to flip</p>
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 bg-app-primary/10 border border-app-primary rounded-xl p-6 flex items-center justify-center text-center backface-hidden rotate-y-180">
                               <p className="text-sm font-medium text-app-text leading-snug">{card.a}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Report Library */}
             <div>
                <h3 className="text-xl font-bold text-app-text mb-6">{getTranslation(language, 'doc_reports_title')}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                   <div 
                      onClick={() => setViewingReport({title: "Investment Memo", content: REPORT_INVESTMENT})}
                      className="flex items-center justify-between p-4 bg-app-card border border-app-border rounded-lg hover:bg-app-border/30 hover:border-app-primary/30 transition-all cursor-pointer group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:text-indigo-400 transition-colors">
                            <FileText className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="font-medium text-app-text text-sm group-hover:text-indigo-400 transition-colors">Investment Memorandum</h4>
                            <p className="text-xs text-app-muted">Strategic Viability Analysis • PDF</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-2 text-app-muted hover:text-indigo-400 transition-colors" title="Read Now">
                            <Eye className="w-4 h-4" />
                         </button>
                      </div>
                   </div>

                   <div 
                      onClick={() => setViewingReport({title: "Missing Middle Whitepaper", content: REPORT_WHITEPAPER})}
                      className="flex items-center justify-between p-4 bg-app-card border border-app-border rounded-lg hover:bg-app-border/30 hover:border-app-primary/30 transition-all cursor-pointer group"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:text-emerald-400 transition-colors">
                            <Layers className="w-5 h-5" />
                         </div>
                         <div>
                            <h4 className="font-medium text-app-text text-sm group-hover:text-emerald-400 transition-colors">The Missing Middle</h4>
                            <p className="text-xs text-app-muted">Market Analysis • PDF</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-2 text-app-muted hover:text-emerald-400 transition-colors" title="Read Now">
                            <Eye className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

          </section>
        );
      default:
        return (
          <section className="space-y-6 animate-fade-in">
             <h2 className="font-heading text-3xl font-bold text-app-text">{currentLabel}</h2>
             <p className="text-app-muted">Content for {currentLabel} goes here.</p>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen bg-app-base text-app-text font-sans transition-colors duration-300 relative">
      
      {/* Report Viewer Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-app-card w-full max-w-3xl h-[80vh] rounded-xl border border-app-border flex flex-col shadow-2xl relative">
              <button 
                onClick={() => setViewingReport(null)}
                className="absolute top-4 right-4 p-2 bg-app-dark rounded-full text-app-muted hover:text-white transition-colors z-10"
              >
                 <X className="w-5 h-5" />
              </button>
              <div className="p-6 border-b border-app-border bg-app-base rounded-t-xl">
                 <h3 className="font-heading text-xl font-bold text-app-text flex items-center gap-2">
                    <FileText className="w-5 h-5 text-app-primary" />
                    {viewingReport.title}
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-8 font-serif text-app-text/90 leading-relaxed whitespace-pre-wrap">
                 {viewingReport.content}
              </div>
              <div className="p-4 border-t border-app-border bg-app-base rounded-b-xl flex justify-end">
                 <button 
                   onClick={() => setViewingReport(null)}
                   className="px-4 py-2 bg-app-card hover:bg-app-border border border-app-border rounded text-sm transition-colors"
                 >
                    Close Reader
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-app-border sticky top-0 bg-app-base/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('landing')}
              className="p-2 hover:bg-app-card rounded text-app-muted hover:text-app-text transition-colors flex items-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <div className="flex items-center gap-2 text-app-muted">
                <Book className="w-5 h-5" />
                <span>Documentation</span>
              </div>
              <ChevronRight className="w-4 h-4 text-app-border" />
              <span className="font-heading font-bold text-app-text">{currentLabel}</span>
            </div>
          </div>
          <ThemeSelector currentTheme={theme} onThemeChange={setTheme} language={language} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-[240px_1fr] gap-12">
          
          {/* Sidebar */}
          <aside className="hidden md:block space-y-8 sticky top-24 h-fit">
            <div>
              <h3 className="font-bold text-app-text mb-3 uppercase tracking-wider text-xs px-3">{getTranslation(language, 'sidebar_getting_started')}</h3>
              <ul className="space-y-1">
                {sections.slice(0, 3).map(s => (
                  <li key={s.id}>
                    <button 
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeSection === s.id ? 'bg-app-primary/10 text-app-primary font-medium' : 'text-app-muted hover:text-app-text hover:bg-app-card'}`}
                    >
                      {getTranslation(language, s.labelKey as any)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-app-text mb-3 uppercase tracking-wider text-xs px-3">{getTranslation(language, 'sidebar_integration')}</h3>
              <ul className="space-y-1">
                {sections.slice(3).map(s => (
                  <li key={s.id}>
                     <button 
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${activeSection === s.id ? 'bg-app-primary/10 text-app-primary font-medium' : 'text-app-muted hover:text-app-text hover:bg-app-card'}`}
                    >
                      {getTranslation(language, s.labelKey as any)}
                      {s.icon && <s.icon className="w-3 h-3" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-h-[500px]">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocsPage;
