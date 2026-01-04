
import React from 'react';
import { DeploymentManifest, Theme } from '../types';
import { FileCode, Download, Cpu, Activity, Clock, MapPin, Trash2, Plus } from 'lucide-react';

interface SpecFormProps {
  spec: DeploymentManifest;
  setSpec: React.Dispatch<React.SetStateAction<DeploymentManifest>>;
  theme: Theme;
}

const SpecForm: React.FC<SpecFormProps> = ({ spec, setSpec, theme }) => {

  const handleChange = (field: keyof DeploymentManifest, value: string | string[]) => {
    setSpec((prev) => ({ ...prev, [field]: value }));
  };

  const handleListChange = (field: 'hardwareBom' | 'alertRules', index: number, value: string) => {
    const newList = [...spec[field]];
    newList[index] = value;
    handleChange(field, newList);
  };

  const addItem = (field: 'hardwareBom' | 'alertRules') => {
    handleChange(field, [...spec[field], '']);
  };

  const removeItem = (field: 'hardwareBom' | 'alertRules', index: number) => {
    const newList = spec[field].filter((_, i) => i !== index);
    handleChange(field, newList);
  };

  const downloadManifest = () => {
    const safeName = spec.siteName || 'site_config';
    const jsonContent = JSON.stringify(spec, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName.replace(/\s+/g, '_').toLowerCase()}_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Theme-based styling helpers
  const getIconColor = () => {
    if (theme === 'ranch') return 'text-amber-600';
    if (theme === 'legal') return 'text-emerald-600';
    return 'text-blue-600';
  };

  const getBorderColor = () => {
    if (theme === 'ranch') return 'focus:border-amber-500 focus:ring-amber-500';
    if (theme === 'legal') return 'focus:border-emerald-500 focus:ring-emerald-500';
    return 'focus:border-blue-500 focus:ring-blue-500';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2 font-heading">
          <FileCode className={`w-5 h-5 ${getIconColor()}`} />
          Deployment Manifest
        </h2>
        <button
          onClick={downloadManifest}
          className={`text-xs flex items-center gap-1 font-medium px-3 py-1.5 rounded-md transition-colors border border-slate-200 bg-white hover:bg-slate-50 text-slate-600`}
        >
          <Download className="w-3 h-3" />
          Export JSON
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Section 1: Site Identity */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Site Configuration
           </h3>
           <div className="grid gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Site / Facility Name</label>
                <input
                  type="text"
                  value={spec.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 outline-none ${getBorderColor()}`}
                  placeholder={theme === 'ranch' ? "e.g. North Pasture Pump House" : theme === 'legal' ? "e.g. Archive Room B" : "e.g. Engine Room 1"}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Environment Conditions</label>
                <input
                  type="text"
                  value={spec.environment}
                  onChange={(e) => handleChange('environment', e.target.value)}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-1 outline-none ${getBorderColor()}`}
                  placeholder="e.g. Solar powered, High humidity, No internet"
                />
              </div>
           </div>
        </div>

        <div className="border-t border-slate-100"></div>

        {/* Section 2: Hardware BOM */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> Hardware Bill of Materials
              </h3>
              <button onClick={() => addItem('hardwareBom')} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
                 <Plus className="w-3 h-3" /> Add Item
              </button>
           </div>
           <div className="space-y-2">
             {spec.hardwareBom.map((item, idx) => (
               <div key={idx} className="flex gap-2 group">
                 <div className="flex-1 relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">0{idx + 1}</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleListChange('hardwareBom', idx, e.target.value)}
                      className={`w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-mono text-slate-700 focus:ring-1 outline-none ${getBorderColor()}`}
                      placeholder="Hardware component..."
                    />
                 </div>
                 <button
                   onClick={() => removeItem('hardwareBom', idx)}
                   className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {spec.hardwareBom.length === 0 && (
               <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                  No hardware defined. Ask the consultant for suggestions.
               </div>
             )}
           </div>
        </div>

        <div className="border-t border-slate-100"></div>

        {/* Section 3: Logic & Sync */}
        <div className="space-y-4">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Alert Logic Rules
              </h3>
              <button onClick={() => addItem('alertRules')} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
                 <Plus className="w-3 h-3" /> Add Rule
              </button>
           </div>
           <div className="space-y-2">
             {spec.alertRules.map((rule, idx) => (
               <div key={idx} className="flex gap-2">
                 <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IF</span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleListChange('alertRules', idx, e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
                      placeholder="condition is met..."
                    />
                 </div>
                 <button
                   onClick={() => removeItem('alertRules', idx)}
                   className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
        </div>

        {/* Sync Schedule */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
             <Clock className="w-3 h-3" /> Sync Strategy
          </label>
          <input
            type="text"
            value={spec.syncSchedule}
            onChange={(e) => handleChange('syncSchedule', e.target.value)}
            className="w-full bg-transparent border-b border-slate-300 py-1 text-sm font-medium text-slate-700 focus:border-slate-500 outline-none transition-colors"
            placeholder="e.g. Store & Forward (Burst at 2:00 AM)"
          />
        </div>

      </div>
    </div>
  );
};

export default SpecForm;
