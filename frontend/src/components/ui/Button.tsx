import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    }[size];

    const variantStyles = {
      primary:
        'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-xs border border-violet-500/30',
      secondary:
        'bg-zinc-100 hover:bg-zinc-200/90 text-zinc-900 border border-zinc-200 active:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-800 dark:active:bg-zinc-800/80',
      outline:
        'bg-transparent hover:bg-zinc-100 text-zinc-700 border border-zinc-300 active:bg-zinc-200/60 dark:hover:bg-zinc-800/50 dark:text-zinc-300 dark:hover:text-white dark:border-zinc-800 dark:active:bg-zinc-800',
      ghost:
        'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 active:bg-zinc-200/60 dark:hover:bg-zinc-800/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:active:bg-zinc-800/80',
      danger:
        'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/50 dark:hover:bg-rose-900/60 dark:active:bg-rose-900',
      success:
        'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-900/60 dark:active:bg-emerald-900',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
