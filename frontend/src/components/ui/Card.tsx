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
      className={`bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 ${
        hoverable
          ? 'transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/80'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
