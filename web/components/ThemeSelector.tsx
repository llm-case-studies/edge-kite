
import React from 'react';
import { Theme, Language } from '../types';
import { Palette, Tractor, Scale, Building } from 'lucide-react';
import { getTranslation } from '../utils/translations';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  language?: Language;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange, language = 'en' as Language, compact = false }) => {
  const themes: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'edge', label: 'Edge', icon: Palette },
    { id: 'ranch', label: 'Ranch', icon: Tractor },
    { id: 'legal', label: 'Legal', icon: Scale },
    { id: 'corporate', label: 'Fun-EE', icon: Building }, // New Fun Enterprise Edition
  ];

  if (compact) {
    return (
      <div className="flex bg-app-card border border-app-border rounded-lg p-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => onThemeChange(t.id)}
            className={`p-1.5 rounded transition-colors ${
              currentTheme === t.id 
                ? 'bg-app-primary text-white shadow-sm' 
                : 'text-app-muted hover:text-app-text hover:bg-white/5'
            }`}
            title={`Switch to ${t.label} theme`}
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 bg-app-dark/30 p-1 rounded-lg border border-app-border/50">
      {themes.map((t) => {
        // Safe translation retrieval
        const fullLabel = language ? getTranslation(language, `theme_${t.id}` as any) : t.label;
        const shortLabel = fullLabel && typeof fullLabel === 'string' ? fullLabel.split(' ')[0] : t.label;

        return (
          <button
            key={t.id}
            onClick={() => onThemeChange(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentTheme === t.id
                ? 'bg-app-primary text-white shadow-md'
                : 'text-app-muted hover:text-app-text hover:bg-white/5'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">
              {shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
