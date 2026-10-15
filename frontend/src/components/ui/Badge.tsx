import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'Easy' | 'Medium' | 'Hard' | 'violet' | 'zinc' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }[size];

  const variantStyles = {
    default: 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/50',
    Easy: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    Hard: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
    violet: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40',
    zinc: 'bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800',
    outline: 'bg-transparent text-zinc-600 border border-zinc-300 dark:text-zinc-400 dark:border-zinc-800',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md tracking-wide select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
