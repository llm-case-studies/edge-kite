
import React, { useState, useEffect, useRef } from 'react';
import { Theme, Language, IncidentLog } from '../types';
import { geminiService } from '../services/gemini';
import { Shield, Lock, Eye, EyeOff, ScanEye, Wifi, WifiOff, FileDown, Eraser, AlertTriangle, ChevronRight, Server, ChevronLeft } from 'lucide-react';

interface ArchitectViewProps {
  onNavigate: (page: 'landing' | 'dashboard' | 'docs') => void;
  theme: Theme;
  language: Language;
}

// Mock Anomalies based on Theme
const GET_MOCK_INCIDENT = (theme: Theme): IncidentLog => {
  if (theme === 'ranch') {
    return {
      riskLevel: 'critical',
      piiFields: ['License Plate', 'Face ID', 'GPS Exact'],
      raw: `[23:14:02] MOTION_DETECT: North Gate Cam 04
[23:14:03] OBJECT_RECOG: Vehicle_Truck_FordF150
[23:14:03] LICENSE_PLATE: 4X4-8829 (Unknown)
[23:14:05] FACE_SCAN: Subj_ID_992 (Matches: 'Neighbor_Bob' 42%)
[23:14:10] GPS_LOCK: 34.0522° N, 118.2437° W
[23:14:12] ACTION: Gate Force Open detected`,
      sanitized: `[23:14:02] MOTION_DETECT: [REDACTED_CAM_ID]
[23:14:03] OBJECT_RECOG: Vehicle_Truck
[23:14:03] LICENSE_PLATE: [REDACTED_PII]
[23:14:05] FACE_SCAN: [REDACTED_FACE_DATA] (Confidence: Low)
[23:14:10] GPS_LOCK: [REDACTED_COORDS]
[23:14:12] ACTION: Gate Force Open detected`
    };
  } else if (theme === 'legal') {
    return {
      riskLevel: 'critical',
      piiFields: ['Case Name', 'User Name', 'File Path'],
      raw: `[02:15:00] BADGE_ACCESS: Door_Archives_B
[02:15:02] USER_ID: j_doe_paralegal (Suspended)
[02:15:45] USB_INSERT: Workstation_04
[02:15:46] FILE_COPY: "Smith_v_Jones_Settlement_FINAL.pdf"
[02:15:46] FILE_COPY: "Witness_List_Protected.xlsx"
[02:16:00] USB_EJECT`,
      sanitized: `[02:15:00] BADGE_ACCESS: [REDACTED_ZONE]
[02:15:02] USER_ID: [REDACTED_USER] (Status: Suspended)
[02:15:45] USB_INSERT: [REDACTED_DEVICE]
[02:15:46] FILE_COPY: [REDACTED_FILENAME_1]
[02:15:46] FILE_COPY: [REDACTED_FILENAME_2]
[02:16:00] USB_EJECT`
    };
  } else {
    // Edge/Maritime
    return {
      riskLevel: 'medium',
      piiFields: ['Crew ID', 'Cargo Manifest'],
      raw: `[14:20:11] TEMP_ALERT: Reefer_Container_9921
[14:20:15] VAL: -4.2C (Threshold: -18C)
[14:25:00] CREW_ACCESS: ID_8821 (Chief_Engineer)
[14:25:30] MANUAL_OVERRIDE: Compressor_Shutdown
[14:26:00] CARGO_ID: Pharma_Batch_X99 (Insulin)`,
      sanitized: `[14:20:11] TEMP_ALERT: [REDACTED_UNIT]
[14:20:15] VAL: -4.2C (Threshold: -18C)
[14:25:00] CREW_ACCESS: [REDACTED_ID] (Role: Engineer)
[14:25:30] MANUAL_OVERRIDE: Compressor_Shutdown
[14:26:00] CARGO_ID: [REDACTED_PAYLOAD_TYPE]`
    };
  }
};

const ArchitectView: React.FC<ArchitectViewProps> = ({ onNavigate, theme }) => {
  // State Machine: idle -> detected -> scrubbing -> analyzed
  const [stage, setStage] = useState<'idle' | 'detected' | 'scrubbing' | 'analyzed'>('idle');
  const [incident, setIncident] = useState<IncidentLog | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false); // Default to offline to simulate "Mule" need

  // Initialize context
  useEffect(() => {
    geminiService.initChat(theme);
    setIncident(GET_MOCK_INCIDENT(theme));
    // Simulate detecting an anomaly after mount
    const timer = setTimeout(() => setStage('detected'), 800);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleScrubAndUpload = async () => {
    setStage('scrubbing');
    
    // Fake processing time for "Scrubbing" animation
    await new Promise(r => setTimeout(r, 1500));
    
    if (isOnline && incident) {
      try {
        const result = await geminiService.analyzeLog(incident.sanitized);
        setAnalysis(result);
      } catch (e) {
        setAnalysis("Error reaching Cloud Analysis. Manual Review Required.");
      }
    } else {
      setAnalysis("Uplink Unavailable. Pattern matched locally against 'Suspicious_Behavior_v4.db'. Recommendation: Physical verification required.");
    }
    setStage('analyzed');
  };

  const downloadBundle = () => {
    if (!incident) return;
    const content = `ENCRYPTED BUNDLE [${theme.toUpperCase()}]\n\n${incident.raw}\n\n--HASH: 882910aa--`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_${Date.now()}_secure.enc`;
    a.click();
  };

  const getThemeColor = () => {
    if (theme === 'ranch') return 'text-amber-500 border-amber-500 bg-amber-500';
    if (theme === 'legal') return 'text-emerald-500 border-emerald-500 bg-emerald-500';
    return 'text-blue-500 border-blue-500 bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-app-base flex flex-col text-app-text">
      
      {/* Header */}
      <header className="h-16 border-b border-app-border bg-app-card/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-app-card rounded text-app-muted hover:text-app-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
             <Shield className={`w-5 h-5 ${getThemeColor().split(' ')[0]}`} />
             <h1 className="font-heading font-bold text-lg">Privacy Airlock <span className="text-xs font-mono text-app-muted font-normal">| Protocol v3.1</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${isOnline ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
          >
             {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
             {isOnline ? 'Uplink Ready' : 'Offline Mode'}
          </button>
        </div>
      </header>

      {/* Main Airlock UI */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* LEFT: The "Dirty" Room (Raw Data) */}
        <div className={`flex-1 bg-app-card border border-app-border rounded-xl flex flex-col overflow-hidden transition-all duration-500 ${stage === 'detected' ? 'ring-2 ring-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'opacity-60 grayscale'}`}>
           <div className="p-4 bg-app-dark/50 border-b border-app-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm">
                 <AlertTriangle className={`w-4 h-4 ${stage === 'detected' ? 'animate-pulse' : ''}`} />
                 <span>Raw Incident Log</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-app-muted">
                 <Lock className="w-3 h-3" /> Encrypted Local
              </div>
           </div>
           
           <div className="flex-1 p-6 font-mono text-sm relative">
              {incident ? (
                <div className="space-y-1">
                  {incident.raw.split('\n').map((line, i) => (
                    <div key={i} className={`p-1 ${line.includes('LICENSE') || line.includes('USER_ID') || line.includes('FACE') || line.includes('CREW') ? 'bg-red-500/10 text-red-300' : 'text-app-text'}`}>
                       {line}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-app-muted italic">Scanning stream...</div>
              )}

              {/* Security Overlay during scrubbing */}
              {stage === 'scrubbing' && (
                 <div className="absolute inset-0 bg-app-base/90 flex flex-col items-center justify-center z-10">
                    <Eraser className="w-12 h-12 text-app-primary animate-bounce mb-4" />
                    <div className="text-app-primary font-bold">REDACTING PII...</div>
                 </div>
              )}
           </div>
        </div>

        {/* CENTER: The Valve */}
        <div className="flex flex-col items-center justify-center gap-4 shrink-0">
           <div className={`w-1 h-full bg-app-border hidden lg:block ${stage === 'scrubbing' ? 'bg-app-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}></div>
           
           {stage === 'detected' && (
             <button 
               onClick={handleScrubAndUpload}
               className="bg-app-primary hover:bg-app-primary-hover text-white px-6 py-4 rounded-xl font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
             >
               <ScanEye className="w-5 h-5" />
               {isOnline ? 'Scrub & Uplink' : 'Scrub & Analyze'}
             </button>
           )}
           
           <div className={`w-1 h-full bg-app-border hidden lg:block ${stage === 'scrubbing' ? 'bg-app-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : ''}`}></div>
        </div>

        {/* RIGHT: The "Clean" Room (Sanitized) */}
        <div className={`flex-1 bg-app-card border border-app-border rounded-xl flex flex-col overflow-hidden transition-all duration-500 ${stage === 'analyzed' ? 'ring-2 ring-emerald-500/50' : ''}`}>
           <div className="p-4 bg-app-dark/50 border-b border-app-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-sm">
                 <Server className="w-4 h-4" />
                 <span>{isOnline ? 'Cloud Analysis' : 'Local Heuristic'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-app-muted">
                 {isOnline ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                 {isOnline ? 'Gemini 3 Flash' : 'Offline Model'}
              </div>
           </div>

           <div className="flex-1 p-6 relative">
              {stage === 'analyzed' ? (
                 <div className="space-y-6 animate-fade-in">
                    <div className="bg-app-base p-4 rounded-lg border border-app-border font-mono text-xs text-emerald-300 opacity-80">
                       <div className="text-[10px] uppercase text-app-muted mb-2 border-b border-app-border pb-1">Payload Sent</div>
                       {incident?.sanitized.split('\n').map((line, i) => (
                          <div key={i}>{line}</div>
                       ))}
                    </div>

                    <div className="space-y-2">
                       <h3 className="font-heading font-bold text-lg text-app-text">Pattern Assessment</h3>
                       <div className="p-4 bg-app-primary/10 border-l-4 border-app-primary text-app-text rounded-r-lg leading-relaxed whitespace-pre-wrap">
                          {analysis}
                       </div>
                    </div>
                    
                    {!isOnline && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex items-start gap-3">
                         <WifiOff className="w-5 h-5 text-amber-500 mt-0.5" />
                         <div>
                            <h4 className="font-bold text-amber-500 text-sm">Cloud Connection Failed</h4>
                            <p className="text-xs text-amber-200/70 mb-3">
                               Local analysis is limited. For full forensic analysis by Gemini, transport this data to a connected zone.
                            </p>
                            <button 
                              onClick={downloadBundle}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
                            >
                               <FileDown className="w-3 h-3" />
                               Download Encrypted Bundle
                            </button>
                         </div>
                      </div>
                    )}
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-app-muted opacity-50">
                    <Shield className="w-16 h-16 mb-4" />
                    <p>Awaiting Sanitized Input</p>
                 </div>
              )}
           </div>
        </div>

      </main>
    </div>
  );
};

export default ArchitectView;
