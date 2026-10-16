import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Database,
  Binary,
  Layout,
  Server,
  Code,
  FileCode,
  Layers,
  Coffee,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Roadmap } from '@/types';
import { Badge } from '@/components/ui/Badge';

const iconMap: Record<string, React.ReactNode> = {
  Binary: <Binary className="w-5 h-5 text-indigo-400" />,
  Database: <Database className="w-5 h-5 text-emerald-400" />,
  Layout: <Layout className="w-5 h-5 text-blue-400" />,
  Server: <Server className="w-5 h-5 text-amber-400" />,
  Code: <Code className="w-5 h-5 text-violet-400" />,
  FileCode: <FileCode className="w-5 h-5 text-yellow-400" />,
  Layers: <Layers className="w-5 h-5 text-pink-400" />,
  Coffee: <Coffee className="w-5 h-5 text-orange-400" />,
};

export const RoadmapsPage: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<{ data: Roadmap[] }>({
    queryKey: ['roadmaps'],
    queryFn: async () => {
      const res = await api.get('/roadmaps');
      return res.data;
    },
  });

  const roadmaps = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          Structured Curriculums
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Learning Roadmaps & Skill Tracks
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-2xl">
          Follow guided, step-by-step career pathways from beginner fundamentals to advanced production mastery. Each track includes curated challenges and progress tracking.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((r) => {
            const icon = iconMap[r.icon] || <Compass className="w-5 h-5 text-violet-400" />;

            return (
              <Link
                key={r.id}
                to={`/roadmaps/${r.slug}`}
                className="group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/60 group-hover:scale-105 transition-transform">
                      {icon}
                    </div>
                    <Badge variant={r.difficulty as any} size="sm">
                      {r.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1 font-mono">
                      <span>Progress</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{r.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${r.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      {r.modules_count} modules · {r.total_challenges} problems
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      ~{r.estimated_hours}h
                    </span>
                  </div>

                  <div className="flex items-center justify-end text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                    <span>View Track</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
