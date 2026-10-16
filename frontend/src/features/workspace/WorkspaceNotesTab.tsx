import React, { useState, useEffect } from 'react';
import { Save, Check, FileEdit, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge } from '@/types';
import { Button } from '@/components/ui/Button';

interface WorkspaceNotesTabProps {
  challenge: Challenge;
  isAuthenticated: boolean;
}

export const WorkspaceNotesTab: React.FC<WorkspaceNotesTabProps> = ({ challenge, isAuthenticated }) => {
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get(`/challenges/${challenge.id}/note`)
      .then((res) => {
        setContent(res.data.content || '');
        if (res.data.updated_at) {
          setSavedAt(new Date(res.data.updated_at).toLocaleTimeString());
        }
      })
      .catch(() => {});
  }, [challenge.id, isAuthenticated]);

  const handleSave = async () => {
    if (!isAuthenticated) return;
    setIsSaving(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/note`, { content });
      setSavedAt(new Date(res.data.updated_at).toLocaleTimeString());
    } catch (err) {
      alert('Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Lock className="w-8 h-8 mb-2" />
        <p className="text-sm font-medium">Log in to create and save private notes for this challenge.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <FileEdit className="w-4 h-4 text-violet-400" />
          <span>Private Notes (Only visible to you)</span>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Saved at {savedAt}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          >
            <Save className="w-3 h-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write down personal notes, edge case observations, or alternative algorithmic complexities..."
        className="flex-1 w-full p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500 resize-none font-mono"
      />
    </div>
  );
};
