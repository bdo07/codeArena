import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400 mb-4">
        <Terminal className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-100 font-mono">404</h1>
      <p className="text-sm text-zinc-400 mt-2 mb-6">
        The requested arena page or problem does not exist.
      </p>
      <Link to="/">
        <Button variant="primary" size="sm">
          Return to Arena
        </Button>
      </Link>
    </div>
  );
};
