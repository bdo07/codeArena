import React, { useState } from 'react';
import { Lightbulb, BookOpen, ChevronDown, ChevronRight, Code, Eye } from 'lucide-react';
import { Challenge } from '@/types';
import { Button } from '@/components/ui/Button';

interface WorkspaceEditorialTabProps {
  challenge: Challenge;
}

export const WorkspaceEditorialTab: React.FC<WorkspaceEditorialTabProps> = ({ challenge }) => {
  const hints = challenge.hints || [];
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full text-zinc-200">
      {/* Progressive Hints Section */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Progressive Hints
        </h3>

        {hints.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No hints available for this problem yet.</p>
        ) : (
          <div className="space-y-2">
            {hints.map((hint, idx) => {
              const isRevealed = revealedHints.includes(idx);
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden text-xs"
                >
                  <button
                    onClick={() => toggleHint(idx)}
                    className="w-full px-3 py-2 text-left font-medium flex items-center justify-between text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/40"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold">Hint {idx + 1}</span>
                    </span>
                    {isRevealed ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </button>
                  {isRevealed && (
                    <div className="px-3 pb-3 pt-1 text-zinc-300 border-t border-zinc-800/60 bg-zinc-950/40">
                      {hint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Explanation Section */}
      <div className="pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-violet-400" />
          Approach & Complexity Explanation
        </h3>

        {challenge.explanation ? (
          <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {challenge.explanation}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">Official editorial walkthrough in review.</p>
        )}
      </div>

      {/* Reference Solution / SQL solution */}
      {(challenge.starter_code || challenge.sql_schema) && (
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Reference Solution
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSolution(!showSolution)}
              className="text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              {showSolution ? 'Hide Solution' : 'Reveal Solution'}
            </Button>
          </div>

          {showSolution && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 overflow-x-auto">
              <pre className="text-xs font-mono text-emerald-300">
                {challenge.challenge_type === 'sql'
                  ? '-- SQL Reference Solution:\nSELECT ...'
                  : '// Check reference algorithmic approach in the explanation above.'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
