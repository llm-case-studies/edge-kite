
import React from 'react';
import { MOCK_PATTERNS } from '../mock-data';
import { PatternDef } from '../types';
import { ScanLine, AlertCircle, Eye, BrainCircuit } from 'lucide-react';

const PatternMonitor: React.FC = () => {
  
  const getSeverityColor = (sev: PatternDef['severity']) => {
    switch(sev) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="bg-app-card border border-app-border rounded-lg p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 border-b border-app-border pb-2">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-emerald-400" />
          <h3 className="font-heading font-bold text-sm text-app-text">Active Threat Patterns</h3>
        </div>
        <button className="text-[10px] flex items-center gap-1 text-app-primary hover:text-white transition-colors bg-app-primary/10 px-2 py-1 rounded border border-app-primary/20">
           <BrainCircuit className="w-3 h-3" />
           <span>Consult AI</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {MOCK_PATTERNS.map((pattern) => (
          <div key={pattern.id} className="bg-app-base/50 border border-app-border rounded p-3 group hover:border-app-primary/50 transition-colors">
             <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-app-text">{pattern.name}</span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${getSeverityColor(pattern.severity)}`}>
                  {pattern.severity}
                </span>
             </div>
             
             <p className="text-[10px] text-app-muted mb-2 leading-relaxed">
               {pattern.description}
             </p>

             <div className="flex items-center justify-between bg-app-dark p-1.5 rounded border border-app-border/50 font-mono text-[9px]">
                <code className="text-emerald-400/80 truncate max-w-[120px]" title={pattern.logic}>
                   {pattern.logic}
                </code>
                <div className="flex items-center gap-2 pl-2 border-l border-app-border/50">
                   <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-app-muted" />
                      <span className="text-app-text font-bold">{pattern.hitCount}</span>
                   </div>
                   <div className={`w-1.5 h-1.5 rounded-full ${pattern.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} title={pattern.status}></div>
                </div>
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-app-border text-[9px] text-app-muted flex justify-between">
         <span>Engine: Rust/WASM</span>
         <span>Definitions: v4.2.1</span>
      </div>
    </div>
  );
};

export default PatternMonitor;
