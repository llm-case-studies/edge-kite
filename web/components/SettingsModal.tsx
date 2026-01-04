
import React, { useState } from 'react';
import { X, Save, RefreshCw, Server, HardDrive, Shield, Wifi, Globe } from 'lucide-react';
import { SystemStats, Language } from '../types';
import { getTranslation } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SystemStats;
  onManualSync: () => Promise<void>;
  language: Language;
  setLanguage: (l: Language) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, stats, onManualSync, language, setLanguage }) => {
  const [activeTab, setActiveTab] = useState<'network' | 'storage' | 'general'>('network');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Local form state
  const [hubUrl, setHubUrl] = useState('http://192.168.1.50:8000/ingest');
  const [nodeName, setNodeName] = useState('barn-pi-04');
  const [retentionDays, setRetentionDays] = useState(30);

  if (!isOpen) return null;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onManualSync();
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-app-card border border-app-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-base">
          <h2 className="font-heading text-xl font-bold text-app-text">{getTranslation(language, 'settings_title')}</h2>
          <button onClick={onClose} className="text-app-muted hover:text-app-text transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-app-base/50 border-r border-app-border p-4 space-y-2 hidden sm:block">
            {[
              { id: 'network', label: 'Connectivity', icon: Wifi },
              { id: 'storage', label: 'Storage & Data', icon: HardDrive },
              { id: 'general', label: 'Identity & Lang', icon: Server },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-app-primary/10 text-app-primary' 
                    : 'text-app-muted hover:bg-app-card hover:text-app-text'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-app-card">
            
            {activeTab === 'network' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-app-text mb-4">Upstream Connection</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-app-muted uppercase">Central Hub URL</label>
                      <input 
                        type="text" 
                        value={hubUrl}
                        onChange={(e) => setHubUrl(e.target.value)}
                        className="w-full bg-app-base border border-app-border rounded p-2 text-sm text-app-text focus:border-app-primary outline-none" 
                      />
                      <p className="text-[10px] text-app-muted">
                         This can be a cloud endpoint (e.g. <code>api.edgekite.cloud</code>) or a local server IP in your facility (e.g. <code>192.168.1.x</code>).
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-app-muted uppercase">API Key</label>
                      <input 
                        type="password" 
                        defaultValue="ek_live_******************"
                        className="w-full bg-app-base border border-app-border rounded p-2 text-sm text-app-text focus:border-app-primary outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-app-base border border-app-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-app-text">Connection Status</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${stats.syncStatus === 'Connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {stats.syncStatus}
                    </span>
                  </div>
                  <p className="text-xs text-app-muted mb-4">
                    {stats.pendingSync} events pending upload. Last sync was {stats.lastSync}.
                  </p>
                  <div className="flex gap-3">
                    <button 
                       onClick={handleSyncClick}
                       disabled={isSyncing || stats.pendingSync === 0}
                       className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold text-white transition-all ${
                         isSyncing ? 'bg-app-muted cursor-wait' : 
                         stats.pendingSync === 0 ? 'bg-app-border text-app-muted' : 'bg-app-primary hover:bg-app-primary-hover'
                       }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Force Sync Now'}
                    </button>
                    {stats.pendingSync === 0 && !isSyncing && (
                       <span className="text-xs text-emerald-500 flex items-center animate-fade-in">All synced!</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-app-text mb-4">Local Retention Policy</h3>
                  <p className="text-sm text-app-muted mb-6">
                    Edge devices often have limited storage. Configure how long events remain on this device after being synced.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                         <label className="text-xs font-bold text-app-muted uppercase">Retention Period</label>
                         <span className="text-sm font-mono text-app-primary">{retentionDays} Days</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="90" 
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-app-base rounded-lg appearance-none cursor-pointer accent-app-primary"
                      />
                      <div className="flex justify-between text-[10px] text-app-muted">
                        <span>1 Day</span>
                        <span>90 Days</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-app-border rounded bg-app-base/50">
                       <div className="flex items-center gap-3">
                          <HardDrive className="w-5 h-5 text-amber-500" />
                          <div>
                             <div className="text-sm font-bold text-app-text">Vacuum Database</div>
                             <div className="text-xs text-app-muted">Reclaim unused disk space (Current: {stats.dbSizeMb}MB)</div>
                          </div>
                       </div>
                       <button className="text-xs bg-app-card hover:bg-app-border border border-app-border text-app-text px-3 py-1.5 rounded transition-colors">
                          Run
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                 <div>
                   <h3 className="text-lg font-medium text-app-text mb-4">Identity</h3>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-app-muted uppercase">Node Alias</label>
                        <input 
                          type="text" 
                          value={nodeName}
                          onChange={(e) => setNodeName(e.target.value)}
                          className="w-full bg-app-base border border-app-border rounded p-2 text-sm text-app-text focus:border-app-primary outline-none" 
                        />
                        <p className="text-[10px] text-app-muted">This name will appear in the central dashboard source list.</p>
                      </div>
                      
                      {/* Language Selection */}
                      <div className="space-y-2 pt-4 border-t border-app-border">
                        <label className="text-xs font-bold text-app-muted uppercase flex items-center gap-2">
                           <Globe className="w-3 h-3" /> System Language
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {[
                              { code: 'en', label: 'English (US)' },
                              { code: 'es', label: 'Español (ES)' },
                              { code: 'pt', label: 'Português (BR)' },
                              { code: 'de', label: 'Deutsch (DE)' }
                           ].map((lang) => (
                              <button
                                 key={lang.code}
                                 onClick={() => setLanguage(lang.code as Language)}
                                 className={`px-3 py-2 rounded text-sm text-left border transition-all ${
                                    language === lang.code 
                                    ? 'bg-app-primary/10 border-app-primary text-app-primary' 
                                    : 'bg-app-base border-app-border text-app-muted hover:text-app-text'
                                 }`}
                              >
                                 {lang.label}
                              </button>
                           ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-app-border">
                         <h4 className="text-sm font-bold text-app-text mb-3">Privacy Defaults</h4>
                         <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="pii" className="rounded bg-app-base border-app-border text-app-primary focus:ring-0" defaultChecked />
                            <label htmlFor="pii" className="text-sm text-app-text cursor-pointer">Anonymize IP Addresses</label>
                         </div>
                         <div className="flex items-center gap-2">
                            <input type="checkbox" id="scrub" className="rounded bg-app-base border-app-border text-app-primary focus:ring-0" />
                            <label htmlFor="scrub" className="text-sm text-app-text cursor-pointer">Scrub Input Values (PII)</label>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app-border bg-app-base flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-app-primary hover:bg-app-primary-hover text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
