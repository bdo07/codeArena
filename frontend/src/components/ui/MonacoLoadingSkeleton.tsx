import React from 'react';
import { Loader2 } from 'lucide-react';

export const MonacoLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#fafafa] dark:bg-[#0c0c0e] flex flex-col font-mono text-xs select-none overflow-hidden p-3 relative">
      {/* Code line skeletons */}
      <div className="space-y-2 opacity-50">
        {[
          'w-1/3',
          'w-1/2',
          'w-2/3',
          'w-1/4',
          'w-3/4',
          'w-2/5',
          'w-3/5',
          'w-1/2',
          'w-1/3',
          'w-4/5',
          'w-1/4',
          'w-2/3',
        ].map((width, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <span className="text-zinc-400 dark:text-zinc-600 w-5 text-right font-mono text-[11px] select-none">
              {idx + 1}
            </span>
            <div className={`h-3.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded animate-pulse ${width}`} />
          </div>
        ))}
      </div>

      {/* Floating loading indicator pill */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/95 dark:bg-[#121215]/95 border border-zinc-200 dark:border-zinc-800 shadow-md backdrop-blur-xs text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
        <span>Initializing editor environment...</span>
      </div>
    </div>
  );
};
