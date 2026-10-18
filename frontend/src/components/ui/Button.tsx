import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
      'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 active:scale-[0.98]';

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs h-8 px-2.5 gap-1.5',
      md: 'text-sm h-9 px-3.5 gap-2',
      lg: 'text-base h-10 px-5 gap-2.5',
      icon: 'h-9 w-9 p-0 shrink-0',
      'icon-sm': 'h-8 w-8 p-0 shrink-0 text-xs',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-xs border border-violet-500/40 dark:bg-violet-600 dark:hover:bg-violet-500 dark:border-violet-400/30',
      secondary:
        'bg-white text-zinc-900 border border-zinc-200/90 hover:bg-zinc-100/80 hover:border-zinc-300 active:bg-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/80 dark:hover:border-zinc-700 shadow-2xs',
      tertiary:
        'bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900 active:bg-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 border border-transparent',
      outline:
        'bg-transparent text-zinc-700 border border-zinc-300/90 hover:bg-zinc-100/70 hover:border-zinc-400 hover:text-zinc-900 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-900/80 dark:hover:border-zinc-700 dark:hover:text-zinc-100',
      ghost:
        'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60',
      danger:
        'bg-rose-50 text-rose-700 border border-rose-200/90 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 dark:hover:bg-rose-900/50',
      success:
        'bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 dark:hover:bg-emerald-900/50',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
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
