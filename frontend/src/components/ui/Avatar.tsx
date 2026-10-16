import React, { useState, useEffect } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
  showBorder?: boolean;
  alt?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg font-semibold' },
  xl: { container: 'w-20 h-20', text: 'text-2xl font-bold' },
  '2xl': { container: 'w-28 h-28 text-3xl font-bold', text: 'text-3xl font-bold' },
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showBorder = true,
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const { container, text } = sizeClasses[size];
  const borderStyle = showBorder
    ? 'border border-violet-200 dark:border-violet-800/50 shadow-2xs'
    : '';

  const initials = getInitials(name);

  if (src && !hasError) {
    return (
      <div
        className={`relative inline-flex shrink-0 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${container} ${borderStyle} ${className}`}
      >
        <img
          src={src}
          alt={alt || name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/80 dark:to-indigo-950/80 text-violet-700 dark:text-violet-300 font-semibold select-none ${container} ${text} ${borderStyle} ${className}`}
      aria-label={alt || name}
    >
      {initials}
    </div>
  );
};
