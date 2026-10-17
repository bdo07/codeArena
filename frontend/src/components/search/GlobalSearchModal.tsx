import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Code2,
  Binary,
  Hash,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchApi } from '@/services/searchApi';
import { SearchSuggestionsResponse } from '@/types/search';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavigableItem =
  | { type: 'challenge'; id: number; title: string; slug: string; difficulty: string; xp: number }
  | { type: 'language'; id: number; name: string; slug: string; category: string }
  | { type: 'topic'; id: number; name: string; slug: string; count: number }
  | { type: 'user'; id: number; name: string; username: string; avatarUrl: string | null; level: number; xp: number }
  | { type: 'see_all'; query: string };

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSuggestions(null);
    }
  }, [isOpen]);

  // Debounced search suggestions fetch
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchApi.getSuggestions(query.trim());
        setSuggestions(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Failed to load search suggestions', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, isOpen]);

  // Flattened navigable items for keyboard navigation
  const flatItems: NavigableItem[] = useMemo(() => {
    if (!suggestions) return [];
    const items: NavigableItem[] = [];

    (suggestions.challenges || []).forEach((c) => {
      items.push({
        type: 'challenge',
        id: c.id,
        title: c.title,
        slug: c.slug,
        difficulty: c.difficulty,
        xp: c.xp_reward,
      });
    });

    (suggestions.languages || []).forEach((l) => {
      items.push({
        type: 'language',
        id: l.id,
        name: l.name,
        slug: l.slug,
        category: l.category,
      });
    });

    (suggestions.topics || []).forEach((top) => {
      items.push({
        type: 'topic',
        id: top.id,
        name: top.name,
        slug: top.slug,
        count: top.challenges_count,
      });
    });

    (suggestions.users || []).forEach((u) => {
      items.push({
        type: 'user',
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatar_url,
        level: u.level,
        xp: u.xp,
      });
    });

    if (query.trim()) {
      items.push({ type: 'see_all', query: query.trim() });
    }

    return items;
  }, [suggestions, query]);

  const handleSelectItem = (item: NavigableItem) => {
    onClose();
    switch (item.type) {
      case 'challenge':
        navigate(`/challenges/${item.slug}`);
        break;
      case 'language':
        navigate(`/search?type=challenges&language=${encodeURIComponent(item.slug)}`);
        break;
      case 'topic':
        navigate(`/search?type=challenges&topic=${encodeURIComponent(item.slug)}`);
        break;
      case 'user':
        navigate(`/profile/${item.username}`);
        break;
      case 'see_all':
        navigate(`/search?q=${encodeURIComponent(item.query)}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && selectedIndex >= 0 && selectedIndex < flatItems.length) {
        handleSelectItem(flatItems[selectedIndex]);
      } else if (query.trim()) {
        onClose();
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search CodeArena"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100 divide-y divide-zinc-200 dark:divide-zinc-800"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder', 'Search challenges, languages, topics, or developers...')}
            className="w-full bg-transparent px-3 py-1 text-sm sm:text-base outline-none placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-900 dark:text-zinc-100"
          />
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Challenges Section */}
          {suggestions?.challenges && suggestions.challenges.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-violet-500" />
                {t('search.challenges', 'Challenges')}
              </div>
              <div className="mt-1 space-y-0.5">
                {suggestions.challenges.map((c) => {
                  const itemIndex = flatItems.findIndex(
                    (fi) => fi.type === 'challenge' && fi.id === c.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={`ch-${c.id}`}
                      onClick={() =>
                        handleSelectItem({
                          type: 'challenge',
                          id: c.id,
                          title: c.title,
                          slug: c.slug,
                          difficulty: c.difficulty,
                          xp: c.xp_reward,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 border border-violet-200/50 dark:border-violet-800/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Code2 className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="font-medium truncate">{c.title}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {c.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            c.difficulty === 'Easy'
                              ? 'success'
                              : c.difficulty === 'Medium'
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-[10px] px-1.5 py-0.2"
                        >
                          {c.difficulty}
                        </Badge>
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" />
                          {c.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Languages Section */}
          {suggestions?.languages && suggestions.languages.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-blue-500" />
                {t('search.languages', 'Languages')}
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {suggestions.languages.map((l) => {
                  const itemIndex = flatItems.findIndex(
                    (fi) => fi.type === 'language' && fi.id === l.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={`lang-${l.id}`}
                      onClick={() =>
                        handleSelectItem({
                          type: 'language',
                          id: l.id,
                          name: l.name,
                          slug: l.slug,
                          category: l.category,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200/50 dark:border-blue-800/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Binary className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{l.name}</span>
                      </div>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                        {l.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topics & Skills Section */}
          {suggestions?.topics && suggestions.topics.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-500" />
                {t('search.topics', 'Skills & Topics')}
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 px-3">
                {suggestions.topics.map((top) => {
                  const itemIndex = flatItems.findIndex(
                    (fi) => fi.type === 'topic' && fi.id === top.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={`top-${top.id}`}
                      type="button"
                      onClick={() =>
                        handleSelectItem({
                          type: 'topic',
                          id: top.id,
                          name: top.name,
                          slug: top.slug,
                          count: top.challenges_count,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <span>#{top.name}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        ({top.challenges_count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Section */}
          {suggestions?.users && suggestions.users.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-purple-500" />
                {t('search.users', 'Developers')}
              </div>
              <div className="mt-1 space-y-0.5">
                {suggestions.users.map((u) => {
                  const itemIndex = flatItems.findIndex(
                    (fi) => fi.type === 'user' && fi.id === u.id
                  );
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <div
                      key={`user-${u.id}`}
                      onClick={() =>
                        handleSelectItem({
                          type: 'user',
                          id: u.id,
                          name: u.name,
                          username: u.username,
                          avatarUrl: u.avatar_url,
                          level: u.level,
                          xp: u.xp,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200/50 dark:border-purple-800/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.avatar_url || undefined} size="sm" />
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-500">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-mono text-violet-600 dark:text-violet-400 font-medium">
                          {t('common.lvl')} {u.level}
                        </div>
                        <div className="text-zinc-400 dark:text-zinc-500">
                          {u.xp.toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when query provided but nothing found */}
          {query.trim() &&
            suggestions &&
            (suggestions.challenges?.length || 0) === 0 &&
            (suggestions.languages?.length || 0) === 0 &&
            (suggestions.topics?.length || 0) === 0 &&
            (suggestions.users?.length || 0) === 0 && (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">
                  {t('search.noSuggestions', 'No suggestions found for')} "{query}"
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {t('search.tryFullSearch', 'Press Enter to perform a full system search')}
                </p>
              </div>
            )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900">
                ↓
              </kbd>{' '}
              {t('search.navigate', 'Navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900">
                ↵
              </kbd>{' '}
              {t('search.select', 'Select')}
            </span>
          </div>

          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{t('search.viewAll', 'View all results')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
