import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang: 'en' | 'fr') => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors text-xs font-medium cursor-pointer select-none"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-violet-500" />
        <span className="uppercase font-mono text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400">
          {currentLang}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-38 py-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-md shadow-xl z-50 text-xs">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer ${
              currentLang === 'en'
                ? 'text-violet-600 dark:text-violet-400 font-semibold bg-violet-50/50 dark:bg-violet-950/20'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 font-semibold">
                EN
              </span>
              <span>English</span>
            </span>
            {currentLang === 'en' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => changeLanguage('fr')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer ${
              currentLang === 'fr'
                ? 'text-violet-600 dark:text-violet-400 font-semibold bg-violet-50/50 dark:bg-violet-950/20'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 font-semibold">
                FR
              </span>
              <span>Français</span>
            </span>
            {currentLang === 'fr' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
