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
    default: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/50',
    Easy: 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40',
    Medium: 'bg-amber-950/40 text-amber-400 border border-amber-800/40',
    Hard: 'bg-rose-950/40 text-rose-400 border border-rose-800/40',
    violet: 'bg-violet-950/40 text-violet-300 border border-violet-800/40',
    zinc: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
    outline: 'bg-transparent text-zinc-400 border border-zinc-800',
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
