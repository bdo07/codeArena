import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === 'dark';
  const label = isDark ? t('nav.toggleThemeLight') : t('nav.toggleThemeDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center ${className}`}
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-violet-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};
