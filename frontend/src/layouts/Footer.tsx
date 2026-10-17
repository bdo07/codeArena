import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-300 font-medium">
            <Terminal className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            {t('footer.brand')}
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-zinc-500 dark:text-zinc-400">{t('footer.tagline')}</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link to="/challenges" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('footer.challenges')}
          </Link>
          <Link to="/quest" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('nav.quest')}
          </Link>
          <Link to="/git-playground" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('nav.gitPlayground', 'Git Playground')}
          </Link>
          <Link to="/interview" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('nav.interview', 'Mock Interview')}
          </Link>
          <Link to="/reports" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('nav.reports', 'Learning Reports')}
          </Link>
          <Link to="/leaderboard" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            {t('footer.leaderboard')}
          </Link>
          <a
            href="https://github.com/bdo07"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            {t('footer.github')}
          </a>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            {t('footer.judge0Ready')}
            <span className="text-zinc-300 dark:text-zinc-700">v/1.2.2</span>

          </span>
        </div>
      </div>
    </footer>
  );
};
