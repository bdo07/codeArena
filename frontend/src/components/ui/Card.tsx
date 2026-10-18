import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg p-5 shadow-2xs transition-all duration-150 ${
        hoverable
          ? 'hover:border-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-[#16161a] hover:shadow-xs'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
