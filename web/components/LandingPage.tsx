
import React, { useState } from 'react';
import DemoWidget from './DemoWidget';
import ThemeSelector from './ThemeSelector';
import { Theme, EdgeEvent, Language } from '../types';
import { Server, WifiOff, Shield, Layers, ChevronRight, Github, Anchor, Tractor, Building2, Headphones, ArrowRight, X, FileText, CheckCircle, Globe, Building } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'dashboard' | 'docs') => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  demoMode: 'simulated' | 'real';
  setDemoMode: (m: 'simulated' | 'real') => void;
  demoEvents: EdgeEvent[];
  setDemoEvents: React.Dispatch<React.SetStateAction<EdgeEvent[]>>;
  realVisitorCount: number;
}

const MIT_LICENSE_TEXT = `MIT License

Copyright (c) 2024 EdgeKite Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigate, 
  theme, 
  setTheme,
  language,
  setLanguage,
  demoMode,
  setDemoMode,
  demoEvents,
  setDemoEvents,
  realVisitorCount
}) => {
  
  const [showLicense, setShowLicense] = useState(false);

  return (
    <div className="min-h-screen bg-app-base text-app-text selection:bg-app-primary/30 font-sans transition-colors duration-500 relative">
      
      {/* License Modal */}
      {showLicense && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-app-card w-full max-w-2xl rounded-xl border border-app-border flex flex-col shadow-2xl relative max-h-[80vh]">
              <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-base rounded-t-xl">
                 <h3 className="font-heading text-xl font-bold text-app-text flex items-center gap-2">
                    <Github className="w-5 h-5 text-app-text" />
                    Open Source License
                 </h3>
                 <button 
                  onClick={() => setShowLicense(false)}
                  className="p-2 bg-app-dark rounded-full text-app-muted hover:text-white transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 font-mono text-sm text-app-text/80 bg-app-base">
                 <pre className="whitespace-pre-wrap leading-relaxed">{MIT_LICENSE_TEXT}</pre>
              </div>
              
              <div className="p-4 border-t border-app-border bg-app-base rounded-b-xl flex justify-between items-center">
                 <span className="text-xs text-app-muted flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Free for commercial use
                 </span>
                 <button 
                   onClick={() => setShowLicense(false)}
                   className="px-4 py-2 bg-app-primary hover:bg-app-primary-hover text-white rounded font-medium text-sm transition-colors"
                 >
                    Acknowledge
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-app-border sticky top-0 bg-app-base/80 backdrop-blur-md z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-app-primary p-1.5 rounded shadow-lg shadow-app-primary/20 transition-colors duration-500">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-app-text">EdgeKite</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <ThemeSelector currentTheme={theme} onThemeChange={setTheme} language={language} />
            <div className="h-6 w-px bg-app-border hidden md:block"></div>
            <button onClick={() => onNavigate('docs')} className="text-app-muted hover:text-app-text transition-colors hidden md:block">
               {getTranslation(language, 'nav_docs')}
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-app-card hover:bg-app-border text-app-text px-4 py-2 rounded-lg border border-app-border transition-all"
            >
              {getTranslation(language, 'nav_signin')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-app-primary opacity-20 blur-[120px] rounded-full pointer-events-none transition-colors duration-1000"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-card border border-app-border text-xs font-medium text-app-primary animate-fade-in transition-colors duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-app-primary"></span>
              </span>
              {getTranslation(language, 'hero_tagline')}
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight text-app-text transition-all duration-500">
              {getTranslation(language, 'heroTitle')}
            </h1>
            <p className="text-lg text-app-muted leading-relaxed max-w-lg transition-all duration-500">
              {getTranslation(language, 'heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="bg-app-primary hover:bg-app-primary-hover text-white px-8 py-3.5 rounded-lg font-semibold shadow-lg shadow-app-primary/20 transition-all flex items-center justify-center gap-2 group"
              >
                {getTranslation(language, 'cta_primary')} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setShowLicense(true)}
                className="bg-app-card hover:bg-app-border text-app-text px-8 py-3.5 rounded-lg font-semibold border border-app-border transition-all flex items-center justify-center gap-2 group"
              >
                <Github className="w-4 h-4" /> {getTranslation(language, 'cta_secondary')}
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-app-muted font-mono">
              <span>Rust + SQLite</span>
              <span className="w-1 h-1 bg-app-border rounded-full"></span>
              <span>&lt;50MB RAM</span>
              <span className="w-1 h-1 bg-app-border rounded-full"></span>
              <span>Docker / Single Binary</span>
            </div>
          </div>

          <div id="demo-section" className="relative space-y-6">
             <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-app-primary to-emerald-500 rounded-2xl opacity-20 blur transition-colors duration-500"></div>
                <DemoWidget 
                  mode={demoMode}
                  setMode={setDemoMode}
                  events={demoEvents}
                  setEvents={setDemoEvents}
                  visitorCountOverride={demoMode === 'real' ? realVisitorCount : undefined}
                  theme={theme}
                  language={language}
                />
             </div>
             
             <div className="text-center">
              <p className="text-sm text-app-muted">
                <span className="text-emerald-400">● Live</span> &mdash; {getTranslation(language, 'demo_status')} ({theme}).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NotebookLM Promo */}
      <section className="py-16 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-t border-b border-app-border">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-4">
               <div className="bg-app-card p-3 rounded-full border border-app-border">
                  <Headphones className="w-8 h-8 text-app-primary" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-app-text mb-1">{getTranslation(language, 'promo_audio_title')}</h3>
                  <p className="text-app-muted max-w-lg">
                     {getTranslation(language, 'promo_audio_desc')}
                  </p>
               </div>
            </div>
            <button 
              onClick={() => onNavigate('docs')} 
              className="bg-app-card hover:bg-app-border border border-app-border text-app-text px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
            >
               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
               {getTranslation(language, 'promo_audio_btn')}
            </button>
         </div>
      </section>

      {/* The Problem (Missing Middle) */}
      <section className="py-24 bg-app-base border-t border-app-border transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl font-bold text-app-text mb-4">{getTranslation(language, 'landing_why_title')}</h2>
            <p className="text-app-muted text-lg transition-all duration-500">
              {getTranslation(language, 'missing_middle')} <br/>
              {getTranslation(language, 'landing_why_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
             {/* Use Case 1: Ranch */}
             <div 
               onClick={() => setTheme('ranch')}
               className={`bg-app-card p-6 rounded-xl border relative overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'ranch' ? 'border-app-primary ring-1 ring-app-primary shadow-lg shadow-app-primary/10' : 'border-app-border hover:border-app-primary/50'}`}
             >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Tractor className="w-16 h-16 text-app-primary" />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 bg-app-dark rounded-lg flex items-center justify-center mb-4 border border-app-border">
                      <Tractor className={`w-5 h-5 ${theme === 'ranch' ? 'text-app-primary' : 'text-amber-500'}`} />
                   </div>
                   <h3 className="font-bold text-lg text-app-text mb-2 flex items-center gap-2">
                     {getTranslation(language, 'theme_ranch')}
                   </h3>
                   <p className="text-xs text-app-muted leading-relaxed line-clamp-3">
                      {getTranslation(language, 'usecase_ranch_desc')}
                   </p>
                </div>
             </div>

             {/* Use Case 2: Edge/Maritime */}
             <div 
               onClick={() => setTheme('edge')}
               className={`bg-app-card p-6 rounded-xl border relative overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'edge' ? 'border-app-primary ring-1 ring-app-primary shadow-lg shadow-app-primary/10' : 'border-app-border hover:border-app-primary/50'}`}
             >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Anchor className="w-16 h-16 text-blue-500" />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 bg-app-dark rounded-lg flex items-center justify-center mb-4 border border-app-border">
                      <Anchor className={`w-5 h-5 ${theme === 'edge' ? 'text-app-primary' : 'text-blue-500'}`} />
                   </div>
                   <h3 className="font-bold text-lg text-app-text mb-2 flex items-center gap-2">
                     {getTranslation(language, 'theme_edge')}
                   </h3>
                   <p className="text-xs text-app-muted leading-relaxed line-clamp-3">
                      {getTranslation(language, 'usecase_edge_desc')}
                   </p>
                </div>
             </div>

             {/* Use Case 3: Legal */}
             <div 
               onClick={() => setTheme('legal')}
               className={`bg-app-card p-6 rounded-xl border relative overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'legal' ? 'border-app-primary ring-1 ring-app-primary shadow-lg shadow-app-primary/10' : 'border-app-border hover:border-app-primary/50'}`}
             >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Building2 className="w-16 h-16 text-emerald-500" />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 bg-app-dark rounded-lg flex items-center justify-center mb-4 border border-app-border">
                      <Shield className={`w-5 h-5 ${theme === 'legal' ? 'text-app-primary' : 'text-emerald-500'}`} />
                   </div>
                   <h3 className="font-bold text-lg text-app-text mb-2 flex items-center gap-2">
                     {getTranslation(language, 'theme_legal')}
                   </h3>
                   <p className="text-xs text-app-muted leading-relaxed line-clamp-3">
                      {getTranslation(language, 'usecase_legal_desc')}
                   </p>
                </div>
             </div>

             {/* Use Case 4: Corporate (Fun-EE) */}
             <div 
               onClick={() => setTheme('corporate')}
               className={`bg-app-card p-6 rounded-xl border relative overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'corporate' ? 'border-app-primary ring-1 ring-app-primary shadow-lg shadow-app-primary/10' : 'border-app-border hover:border-app-primary/50'}`}
             >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Building className="w-16 h-16 text-teal-500" />
                </div>
                <div className="relative z-10">
                   <div className="w-10 h-10 bg-app-dark rounded-lg flex items-center justify-center mb-4 border border-app-border">
                      <Building className={`w-5 h-5 ${theme === 'corporate' ? 'text-app-primary' : 'text-teal-500'}`} />
                   </div>
                   <h3 className="font-bold text-lg text-app-text mb-2 flex items-center gap-2">
                     {getTranslation(language, 'theme_corporate')}
                   </h3>
                   <p className="text-xs text-app-muted leading-relaxed line-clamp-3">
                      {getTranslation(language, 'usecase_corporate_desc')}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 bg-app-dark/30 border-t border-app-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="font-heading text-3xl font-bold text-app-text mb-6">{getTranslation(language, 'landing_arch_title')}</h2>
                 <p className="text-app-muted mb-8">
                    {getTranslation(language, 'landing_arch_desc')}
                 </p>
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">1</div>
                       </div>
                       <div>
                          <h4 className="font-bold text-app-text">{getTranslation(language, 'arch_1_title')}</h4>
                          <p className="text-sm text-app-muted">{getTranslation(language, 'arch_1_desc')} <span className="text-emerald-400 font-medium">{getTranslation(language, 'arch_1_highlight')}</span></p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-app-border text-app-muted flex items-center justify-center font-bold text-sm">2</div>
                       </div>
                       <div>
                          <h4 className="font-bold text-app-text">{getTranslation(language, 'arch_2_title')}</h4>
                          <p className="text-sm text-app-muted">{getTranslation(language, 'arch_2_desc')}</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-app-primary/20 text-app-primary flex items-center justify-center font-bold text-sm">3</div>
                       </div>
                       <div>
                          <h4 className="font-bold text-app-text">{getTranslation(language, 'arch_3_title')}</h4>
                          <p className="text-sm text-app-muted">{getTranslation(language, 'arch_3_desc')} <span className="text-app-primary font-medium">{getTranslation(language, 'arch_3_highlight')}</span></p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Architecture Visual */}
              <div className="bg-app-base border border-app-border rounded-xl p-8 relative">
                 <div className="absolute top-4 right-4 text-xs font-mono text-app-muted">arch_v1.0</div>
                 
                 {/* Stack */}
                 <div className="space-y-2 font-mono text-sm">
                    <div className="p-4 bg-app-card rounded border border-app-border flex items-center justify-between">
                       <span className="text-emerald-400 font-bold">EDGE (Your Device)</span>
                       <span className="text-xs text-app-muted">SQLite (WAL Mode)</span>
                    </div>
                    <div className="h-8 border-l-2 border-dashed border-app-border ml-8"></div>
                    <div className="p-4 bg-app-card/50 rounded border border-app-border flex items-center justify-between opacity-75">
                       <span className="text-app-muted">Sync Layer (HTTP/JSON)</span>
                       <span className="text-xs text-app-muted">Batch + Retry</span>
                    </div>
                    <div className="h-8 border-l-2 border-dashed border-app-border ml-8"></div>
                    <div className="p-4 bg-app-primary/10 rounded border border-app-primary/30 flex items-center justify-between">
                       <span className="text-app-primary font-bold">HUB (Anywhere)</span>
                       <span className="text-xs text-app-muted">Postgres / ClickHouse</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-app-base to-app-dark border-t border-app-border transition-colors duration-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl font-bold text-app-text mb-6">{getTranslation(language, 'landing_own_title')}</h2>
          <p className="text-app-muted mb-10 max-w-xl mx-auto">
             {getTranslation(language, 'landing_own_desc')}
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full max-w-sm gap-2">
              <input 
                type="email" 
                placeholder={language === 'en' ? "Enter your email" : "Email"}
                className="bg-app-card border border-app-border text-app-text px-4 py-3 rounded-lg flex-1 focus:ring-2 focus:ring-app-primary outline-none"
              />
              <button className="bg-app-primary hover:bg-app-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap">
                {getTranslation(language, 'landing_get_access')}
              </button>
            </div>
            <div className="flex gap-6 mt-6 text-sm">
              <button onClick={() => setShowLicense(true)} className="text-app-muted hover:text-app-text flex items-center gap-1">
                <Github className="w-4 h-4" /> {getTranslation(language, 'landing_self_host')}
              </button>
              <button onClick={() => onNavigate('dashboard')} className="text-app-primary hover:text-app-primary-hover">
                {getTranslation(language, 'landing_view_demo')} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-app-border py-12 bg-app-dark text-app-muted text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="bg-app-card p-1 rounded">
              <Layers className="w-4 h-4 text-app-muted" />
            </div>
            <span className="font-semibold text-app-text">EdgeKite</span>
          </div>
          <div className="flex gap-4 items-center">
             {/* Simple Language Toggles for Footer */}
             <div className="flex gap-2 mr-4">
                {(['en', 'es', 'pt', 'de'] as Language[]).map(l => (
                  <button 
                     key={l}
                     onClick={() => setLanguage(l)}
                     className={`text-xs font-bold uppercase ${language === l ? 'text-app-primary' : 'text-app-muted hover:text-app-text'}`}
                  >
                     {l}
                  </button>
                ))}
             </div>
             
            <button onClick={() => onNavigate('docs')} className="hover:text-app-text">{getTranslation(language, 'nav_docs')}</button>
            <a href="#" className="hover:text-app-text">{getTranslation(language, 'footer_privacy')}</a>
            <a href="#" className="hover:text-app-text">{getTranslation(language, 'footer_status')}</a>
          </div>
          <div>
            &copy; 2024 EdgeKite Inc.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
