import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, Code2, LayoutDashboard, Shield, LogOut, User as UserIcon, Menu, X, Sparkles, Compass, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { NotificationBell } from '@/components/NotificationBell';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/90 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and primary links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:border-violet-500/40 group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  {t('nav.brand')}
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 rounded">
                    {t('nav.beta')}
                  </span>
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/challenges"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive('/challenges')
                    ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700/50 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                {t('nav.challenges')}
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isActive('/leaderboard')
                    ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700/50 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {t('nav.leaderboard')}
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive('/dashboard')
                      ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700/50 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  {t('nav.dashboard')}
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700/50 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  {t('nav.admin')}
                </Link>
              )}
            </div>
          </div>

          {/* Right controls: Theme, Language, and Profile / Auth */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <ThemeToggle />

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

            {user ? (
              <div className="flex items-center gap-3">
                {/* XP & Level pill */}
                <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs">
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
                    <Sparkles className="w-3 h-3" />
                    {user.xp.toLocaleString()} XP
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600">·</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                    {t('common.lvl')} {user.level}
                  </span>
                </div>

                {/* Profile menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-700/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-medium text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium max-w-[100px] truncate">
                      {user.username}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-left"
                      onMouseLeave={() => setIsProfileOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800/80">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">@{user.username}</p>
                      </div>

                      <Link
                        to={`/profile/${user.username}`}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        {t('nav.myProfile')}
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        {t('nav.dashboard')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {t('nav.adminPanel')}
                        </Link>
                      )}

                      <div className="border-t border-zinc-200 dark:border-zinc-800/80 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile controls & hamburger button */}
          <div className="md:hidden flex items-center gap-1.5">
            <LanguageSelector />
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-4 space-y-2 text-left shadow-lg">
          <Link
            to="/challenges"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {t('nav.challenges')}
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {t('nav.leaderboard')}
          </Link>
          {user && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                to={`/profile/${user.username}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {t('nav.profileWithXp', { xp: user.xp })}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  {t('nav.adminPanel')}
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-zinc-900 cursor-pointer"
              >
                {t('nav.signOut')}
              </button>
            </>
          )}
          {!user && (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  {t('nav.signIn')}
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
