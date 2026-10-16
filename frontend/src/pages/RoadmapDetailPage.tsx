import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Code2,
  Table,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RoadmapDetail } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const RoadmapDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<{ roadmap: RoadmapDetail; solved_ids: number[] }>({
    queryKey: ['roadmap', slug],
    queryFn: async () => {
      const res = await api.get(`/roadmaps/${slug}`);
      return res.data;
    },
  });

  const roadmap = data?.roadmap;
  const solvedIds = data?.solved_ids || [];

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !roadmap) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Roadmap not found</h2>
        <Link to="/roadmaps" className="inline-block mt-4">
          <Button variant="primary" size="sm">Back to Roadmaps</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Back button */}
      <div>
        <Link
          to="/roadmaps"
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to All Roadmaps
        </Link>
      </div>

      {/* Header card */}
      <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={roadmap.difficulty as any} size="sm">
            {roadmap.difficulty}
          </Badge>
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {roadmap.category}
          </span>
          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ~{roadmap.estimated_hours} Hours Estimated
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {roadmap.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          {roadmap.description}
        </p>
      </div>

      {/* Modules timeline */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
          Curriculum Modules ({roadmap.modules.length})
        </h2>

        <div className="space-y-6">
          {roadmap.modules.map((m, mIdx) => (
            <div
              key={m.id}
              className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 font-mono">
                    MODULE {mIdx + 1}
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {m.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{m.description}</p>
                </div>
              </div>

              {/* Challenges in this module */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {m.challenges.map((c) => {
                  const isSolved = solvedIds.includes(c.id);

                  return (
                    <Link
                      key={c.id}
                      to={`/challenges/${c.slug}`}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 hover:border-violet-500/60 dark:hover:border-violet-500/60 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSolved ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                        }`}>
                          {isSolved ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : c.challenge_type === 'sql' ? (
                            <Table className="w-3.5 h-3.5" />
                          ) : c.challenge_type === 'quiz' ? (
                            <HelpCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Code2 className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {c.title}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ~{c.estimated_time_min}m · {c.challenge_type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={c.difficulty as any} size="sm">
                          {c.difficulty}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
