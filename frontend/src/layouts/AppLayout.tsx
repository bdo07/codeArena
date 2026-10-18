import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SuspensionNoticeBanner } from '@/features/moderation/SuspensionNoticeBanner';

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400 text-sm">
      <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <SuspensionNoticeBanner />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
