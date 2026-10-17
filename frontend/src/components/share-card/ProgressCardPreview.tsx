import React from 'react';
import {
  Terminal,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import {
  CardTemplate,
  CardTheme,
  CardLayout,
  CardField,
  ShareableCardStats,
} from '@/services/shareCardApi';

export interface ProgressCardPreviewProps {
  user: {
    name: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    level: number;
  };
  stats: ShareableCardStats;
  template: CardTemplate;
  cardTheme: CardTheme;
  layout: CardLayout;
  selectedFields: CardField[];
  customTagline?: string | null;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export const ProgressCardPreview: React.FC<ProgressCardPreviewProps> = ({
  user,
  stats,
  template,
  cardTheme,
  layout,
  selectedFields,
  customTagline,
  cardRef,
  className = '',
}) => {
  const isFieldSelected = (field: CardField) => selectedFields.includes(field);

  // Theme styling definitions
  const themeClasses: Record<CardTheme, { bg: string; text: string; subtext: string; border: string; cardInner: string; accent: string }> = {
    dark: {
      bg: 'bg-zinc-950',
      text: 'text-zinc-50',
      subtext: 'text-zinc-400',
      border: 'border-zinc-800',
      cardInner: 'bg-zinc-900/60 border-zinc-800/80',
      accent: 'text-violet-400',
    },
    light: {
      bg: 'bg-white',
      text: 'text-zinc-900',
      subtext: 'text-zinc-600',
      border: 'border-zinc-200',
      cardInner: 'bg-zinc-50 border-zinc-200',
      accent: 'text-violet-600',
    },
    obsidian: {
      bg: 'bg-black',
      text: 'text-zinc-100',
      subtext: 'text-zinc-500',
      border: 'border-emerald-500/30',
      cardInner: 'bg-zinc-950/80 border-zinc-900',
      accent: 'text-emerald-400',
    },
    violet: {
      bg: 'bg-gradient-to-br from-zinc-950 via-purple-950/40 to-zinc-950',
      text: 'text-white',
      subtext: 'text-purple-200/70',
      border: 'border-purple-500/30',
      cardInner: 'bg-purple-900/20 border-purple-500/20',
      accent: 'text-purple-300',
    },
  };

  const themeConfig = themeClasses[cardTheme] || themeClasses.dark;

  // Aspect ratio & layout sizing
  const isHorizontal = layout === 'horizontal';
  const containerClasses = isHorizontal
    ? 'w-full max-w-[680px] min-h-[380px] p-7'
    : 'w-full max-w-[500px] aspect-square p-7';

  // Get initial for fallback avatar
  const initials = (user.name || user.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const tagline = customTagline || 'Software Engineer & CodeArena Competitor';

  return (
    <div
      ref={cardRef}
      className={`rounded-3xl border ${themeConfig.border} ${themeConfig.bg} ${themeConfig.text} ${containerClasses} flex flex-col justify-between shadow-2xl relative overflow-hidden select-none font-sans ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background ambient decorative glow */}
      {cardTheme === 'violet' && (
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {cardTheme === 'obsidian' && (
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* ========================================================= */}
      {/* 1. CARD HEADER */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-4 border-b pb-4 relative z-10" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
        {/* User Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          {isFieldSelected('avatar') && (
            <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 border border-zinc-700/50 flex items-center justify-center bg-violet-600 text-white font-bold text-lg shadow-sm">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to text initials if image fails
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          )}

          <div className="truncate space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg tracking-tight truncate">
                {user.name}
              </h2>
              {isFieldSelected('xp_level') && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  Lvl {user.level}
                </span>
              )}
            </div>
            <p className={`text-xs font-mono ${themeConfig.subtext}`}>@{user.username}</p>
          </div>
        </div>

        {/* CodeArena Brand Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/40 bg-zinc-900/40 text-xs font-semibold shrink-0">
          <Terminal className="w-4 h-4 text-violet-400" />
          <span className="tracking-tight font-bold">CodeArena</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. OPTIONAL TAGLINE */}
      {/* ========================================================= */}
      {isFieldSelected('tagline') && (
        <div className="my-3 relative z-10">
          <p className={`text-xs ${themeConfig.subtext} italic line-clamp-1`}>
            &ldquo;{tagline}&rdquo;
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CORE STATISTICS GRID */}
      {/* ========================================================= */}
      <div className={`grid ${isHorizontal ? 'grid-cols-4' : 'grid-cols-2'} gap-2.5 my-3 relative z-10`}>
        {/* Solved Challenges */}
        {isFieldSelected('solved') && (
          <div className={`p-3 rounded-2xl border ${themeConfig.cardInner} flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-75">
              <span>Solved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1">
              {stats.solved_challenges}
            </div>
            <div className={`text-[10px] font-mono ${themeConfig.subtext} mt-0.5`}>
              {stats.success_rate}% success
            </div>
          </div>
        )}

        {/* Total XP & Ranking */}
        {isFieldSelected('xp_level') && (
          <div className={`p-3 rounded-2xl border ${themeConfig.cardInner} flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-75">
              <span>Experience</span>
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1 text-violet-400">
              {user.xp} <span className="text-xs font-normal opacity-70">XP</span>
            </div>
            <div className={`text-[10px] font-mono ${themeConfig.subtext} mt-0.5`}>
              Level {user.level} Dev
            </div>
          </div>
        )}

        {/* Streak */}
        {isFieldSelected('streak') && (
          <div className={`p-3 rounded-2xl border ${themeConfig.cardInner} flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-75">
              <span>Streak</span>
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1 text-amber-500">
              {stats.current_streak} <span className="text-xs font-normal opacity-70">days</span>
            </div>
            <div className={`text-[10px] font-mono ${themeConfig.subtext} mt-0.5`}>
              Best: {stats.best_streak}d
            </div>
          </div>
        )}

        {/* Git or Interview Milestone */}
        {isFieldSelected('git') && (
          <div className={`p-3 rounded-2xl border ${themeConfig.cardInner} flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-75">
              <span>Git Missions</span>
              <GitBranch className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1 text-teal-400">
              {stats.git_scenarios_completed} <span className="text-xs font-normal opacity-70">/ 10</span>
            </div>
            <div className={`text-[10px] font-mono ${themeConfig.subtext} mt-0.5`}>
              Mastered
            </div>
          </div>
        )}

        {isFieldSelected('interviews') && !isFieldSelected('git') && (
          <div className={`p-3 rounded-2xl border ${themeConfig.cardInner} flex flex-col justify-between`}>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase opacity-75">
              <span>Interviews</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold mt-1 text-indigo-400">
              {stats.interviews_passed} <span className="text-xs font-normal opacity-70">Passed</span>
            </div>
            <div className={`text-[10px] font-mono ${themeConfig.subtext} mt-0.5`}>
              Technical Ready
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. SKILLS & BADGES SHOWCASE */}
      {/* ========================================================= */}
      <div className="space-y-2.5 my-2 relative z-10">
        {/* Favorite languages / skills */}
        {isFieldSelected('skills') && stats.skills.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${themeConfig.subtext} mr-1 flex items-center gap-1`}>
              <Code2 className="w-3 h-3" /> Stack:
            </span>
            {stats.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 capitalize"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Badges spotlight */}
        {isFieldSelected('badges') && stats.badges.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${themeConfig.subtext} mr-1 flex items-center gap-1`}>
              <Award className="w-3 h-3 text-amber-500" /> Badges:
            </span>
            {stats.badges.slice(0, 4).map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium"
              >
                <span>{badge.icon || '🏅'}</span>
                <span>{badge.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. CARD FOOTER / VERIFICATION WATERMARK */}
      {/* ========================================================= */}
      <div className="pt-3 border-t flex items-center justify-between text-[11px] font-mono relative z-10" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
        <span className={themeConfig.subtext}>
          codearena.dev/@{user.username}
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px] uppercase tracking-wide">
          <CheckCircle2 className="w-3 h-3" />
          Verified CodeArena Profile
        </span>
      </div>
    </div>
  );
};
