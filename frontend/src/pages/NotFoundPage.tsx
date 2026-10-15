import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 shadow-2xs">
        <Terminal className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{t('notFound.title')}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 mb-6">
        {t('notFound.message')}
      </p>
      <Link to="/">
        <Button variant="primary" size="sm">
          {t('notFound.returnBtn')}
        </Button>
      </Link>
    </div>
  );
};
