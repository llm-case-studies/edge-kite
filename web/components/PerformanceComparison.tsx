import React, { useEffect, useState } from 'react';
import { HardDrive, Cookie, Zap } from 'lucide-react';

const PerformanceComparison: React.FC = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-app-card border border-app-border rounded-lg p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 border-b border-app-border pb-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="font-heading font-bold text-sm text-app-text">Resource Monitor</h3>
      </div>

      <div className="space-y-6 flex-1">
        {/* Metric 1: RAM Usage */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-app-muted">
            <span>Memory Load</span>
            <span>Live</span>
          </div>
          
          {/* EdgeKite Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
               <span className="text-emerald-400 font-bold">EdgeKite Agent</span>
               <span className="font-mono text-app-text">45 MB</span>
            </div>
            <div className="h-2 bg-app-dark rounded-full overflow-hidden border border-app-border/50">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: animate ? '15%' : '0%' }}
              ></div>
            </div>
          </div>

          {/* Competitor Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs">
               <span className="text-red-400 font-bold">Legacy Agent (Detected)</span>
               <span className="font-mono text-app-text">250 MB</span>
            </div>
            <div className="h-2 bg-app-dark rounded-full overflow-hidden border border-app-border/50">
               <div 
                className="h-full bg-slate-600 transition-all duration-1000 ease-out"
                style={{ width: animate ? '85%' : '0%' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Metric 2: Bundle Size */}
          <div className="bg-app-base/30 p-2 rounded border border-app-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <HardDrive className="w-3 h-3 text-app-primary" />
              <span className="text-[10px] font-bold text-app-muted uppercase">Bundle</span>
            </div>
            <div className="flex items-end gap-1 h-8 relative">
              <div className="w-1/2 bg-emerald-500/20 border-t border-l border-r border-emerald-500 rounded-t-sm transition-all duration-1000" style={{ height: animate ? '20%' : '0%' }}></div>
              <div className="w-1/2 bg-red-500/20 border-t border-l border-r border-red-500 rounded-t-sm transition-all duration-1000" style={{ height: animate ? '100%' : '0%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-mono">
              <span className="text-emerald-400">3kb</span>
              <span className="text-red-400">45kb</span>
            </div>
          </div>

          {/* Metric 3: Cookies */}
          <div className="bg-app-base/30 p-2 rounded border border-app-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Cookie className="w-3 h-3 text-app-primary" />
              <span className="text-[10px] font-bold text-app-muted uppercase">Cookies</span>
            </div>
             <div className="flex items-center justify-between h-8 px-1">
                <div className="text-center">
                   <div className="text-sm font-bold text-emerald-400">0</div>
                </div>
                <div className="h-6 w-px bg-app-border/50"></div>
                <div className="text-center">
                   <div className="text-sm font-bold text-red-400">12</div>
                </div>
             </div>
             <div className="flex justify-between text-[9px] mt-1 text-app-muted uppercase font-bold">
                 <span>Edge</span>
                 <span>Old</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;