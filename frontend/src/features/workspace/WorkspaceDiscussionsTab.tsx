import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, Pin, User as UserIcon, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge, DiscussionTopic } from '@/types';
import { Button } from '@/components/ui/Button';

interface WorkspaceDiscussionsTabProps {
  challenge: Challenge;
  isAuthenticated: boolean;
}

export const WorkspaceDiscussionsTab: React.FC<WorkspaceDiscussionsTabProps> = ({ challenge, isAuthenticated }) => {
  const [discussions, setDiscussions] = useState<DiscussionTopic[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [showNewTopicForm, setShowNewTopicForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  const fetchDiscussions = async () => {
    try {
      const res = await api.get(`/challenges/${challenge.id}/discussions`);
      setDiscussions(res.data.data || []);
      setLikedIds(res.data.liked_discussion_ids || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDiscussions();
  }, [challenge.id]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      await api.post(`/challenges/${challenge.id}/discussions`, {
        title: newTitle,
        content: newContent,
      });
      setNewTitle('');
      setNewContent('');
      setShowNewTopicForm(false);
      fetchDiscussions();
    } catch (e) {
      alert('Failed to post discussion.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (discussionId: number) => {
    if (!isAuthenticated) {
      alert('Please log in to upvote discussions.');
      return;
    }
    try {
      const res = await api.post(`/discussions/${discussionId}/like`);
      setDiscussions((prev) =>
        prev.map((d) => (d.id === discussionId ? { ...d, upvotes_count: res.data.upvotes_count } : d))
      );
      setLikedIds((prev) =>
        res.data.liked ? [...prev, discussionId] : prev.filter((id) => id !== discussionId)
      );
    } catch (e) {}
  };

  const handleSendReply = async (discussionId: number) => {
    const text = replyInputs[discussionId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/discussions/${discussionId}/replies`, { content: text });
      setReplyInputs((prev) => ({ ...prev, [discussionId]: '' }));
      fetchDiscussions();
    } catch (e) {
      alert('Failed to post reply.');
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full text-zinc-200">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          Community Discussions ({discussions.length})
        </h3>
        {isAuthenticated && (
          <Button
            size="sm"
            onClick={() => setShowNewTopicForm(!showNewTopicForm)}
            className="text-xs bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Topic
          </Button>
        )}
      </div>

      {/* New Topic Form */}
      {showNewTopicForm && (
        <form onSubmit={handleCreateTopic} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Topic title (e.g. Optimized O(N) approach question)..."
            className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Explain your approach, question, or code snippet..."
            className="w-full p-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500 h-20 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowNewTopicForm(false)}
              className="text-xs text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPosting}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white"
            >
              Post Topic
            </Button>
          </div>
        </form>
      )}

      {/* Discussion List */}
      <div className="space-y-3">
        {discussions.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-6 text-center">
            No discussions yet. Be the first to start a conversation!
          </p>
        ) : (
          discussions.map((d) => {
            const isLiked = likedIds.includes(d.id);
            return (
              <div key={d.id} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <UserIcon className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-zinc-200">{d.user?.username || 'User'}</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                    {d.is_pinned && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/40">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleLike(d.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                      isLiked
                        ? 'border-violet-500/60 bg-violet-950/60 text-violet-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{d.upvotes_count}</span>
                  </button>
                </div>

                <h4 className="font-medium text-zinc-100">{d.title}</h4>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{d.content}</p>

                {/* Replies */}
                {d.replies && d.replies.length > 0 && (
                  <div className="pt-2 pl-3 border-l-2 border-zinc-800 space-y-2 mt-2">
                    {d.replies.map((r) => (
                      <div key={r.id} className="text-xs bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                        <span className="font-semibold text-zinc-300">{r.user?.username}: </span>
                        <span className="text-zinc-400">{r.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {isAuthenticated && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={replyInputs[d.id] || ''}
                      onChange={(e) => setReplyInputs((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className="flex-1 p-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-hidden focus:border-violet-500"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSendReply(d.id)}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
