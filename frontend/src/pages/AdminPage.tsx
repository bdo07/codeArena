import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface AdminChallengePayload {
  title: string;
  slug: string;
  description: string;
  input_description?: string;
  output_description?: string;
  constraints?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_limit_ms: number;
  memory_limit_mb: number;
  is_published: boolean;
  tags: string[];
  test_cases: Array<{
    input_data: string;
    expected_output: string;
    is_sample: boolean;
    points: number;
  }>;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [outputDesc, setOutputDesc] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [isPublished, setIsPublished] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  const [testCases, setTestCases] = useState<
    Array<{ input_data: string; expected_output: string; is_sample: boolean; points: number }>
  >([
    { input_data: '', expected_output: '', is_sample: true, points: 20 },
    { input_data: '', expected_output: '', is_sample: false, points: 30 },
  ]);

  // Fetch admin challenges
  const { data, isLoading } = useQuery<{ data: Challenge[] }>({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      const res = await api.get('/admin/challenges');
      return res.data;
    },
    enabled: Boolean(user && user.role === 'admin'),
  });

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: AdminChallengePayload) => {
      if (editingChallenge) {
        return api.put(`/admin/challenges/${editingChallenge.id}`, payload);
      }
      return api.post('/admin/challenges', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/challenges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const resetForm = () => {
    setEditingChallenge(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setInputDesc('');
    setOutputDesc('');
    setConstraints('');
    setDifficulty('Easy');
    setTimeLimit(2000);
    setMemoryLimit(128);
    setIsPublished(true);
    setTagsInput('');
    setTestCases([
      { input_data: '', expected_output: '', is_sample: true, points: 20 },
      { input_data: '', expected_output: '', is_sample: false, points: 30 },
    ]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ch: Challenge) => {
    setEditingChallenge(ch);
    setTitle(ch.title);
    setSlug(ch.slug);
    setDescription(ch.description);
    setInputDesc(ch.input_description || '');
    setOutputDesc(ch.output_description || '');
    setConstraints(ch.constraints || '');
    setDifficulty(ch.difficulty);
    setTimeLimit(ch.time_limit_ms);
    setMemoryLimit(ch.memory_limit_mb);
    setIsPublished(ch.is_published);
    setTagsInput(ch.tags?.map((t) => t.name).join(', ') || '');

    if (ch.test_cases && ch.test_cases.length > 0) {
      setTestCases(
        ch.test_cases.map((tc) => ({
          input_data: tc.input_data,
          expected_output: tc.expected_output,
          is_sample: tc.is_sample ?? false,
          points: tc.points ?? 10,
        }))
      );
    } else {
      setTestCases([
        { input_data: '', expected_output: '', is_sample: true, points: 20 },
        { input_data: '', expected_output: '', is_sample: false, points: 30 },
      ]);
    }

    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    saveMutation.mutate({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      input_description: inputDesc || undefined,
      output_description: outputDesc || undefined,
      constraints: constraints || undefined,
      difficulty,
      time_limit_ms: Number(timeLimit),
      memory_limit_mb: Number(memoryLimit),
      is_published: isPublished,
      tags,
      test_cases: testCases.filter((tc) => tc.input_data && tc.expected_output),
    });
  };

  const addTestCase = (isSample: boolean) => {
    setTestCases([
      ...testCases,
      { input_data: '', expected_output: '', is_sample: isSample, points: isSample ? 20 : 30 },
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    setTestCases(
      testCases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  };

  // Authorization check after hooks
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-violet-400" />
            Admin Operations Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Author and manage coding challenges, publish status, and configure public vs hidden test cases.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Challenge
        </Button>
      </div>

      {/* Challenges Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4">Title & Slug</th>
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 w-28 text-center">Status</th>
              <th className="py-3 px-4 w-28 text-center">Test Cases</th>
              <th className="py-3 px-4 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-zinc-800 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-zinc-800/50 rounded w-1/4" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-5 bg-zinc-800 rounded w-14" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-5 bg-zinc-800 rounded w-16 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 bg-zinc-800 rounded w-8 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-6 bg-zinc-800 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                  No challenges authored yet.
                </td>
              </tr>
            ) : (
              data?.data?.map((ch) => (
                <tr key={ch.id} className="hover:bg-zinc-850/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-100">{ch.title}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">/{ch.slug}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={ch.difficulty} size="sm">
                      {ch.difficulty}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {ch.is_published ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300">
                    {ch.test_cases?.length || 0}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(ch)}
                        title="Edit challenge"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-400 hover:text-rose-300"
                        onClick={() => {
                          if (confirm(`Delete challenge "${ch.title}"?`)) {
                            deleteMutation.mutate(ch.id);
                          }
                        }}
                        title="Delete challenge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Challenge Authoring Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Challenge Title"
              placeholder="e.g. Reverse Linked List"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!editingChallenge) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }
              }}
              required
            />
            <Input
              label="URL Slug"
              placeholder="reverse-linked-list"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-2"
              >
                <option value="Easy">Easy (50 XP)</option>
                <option value="Medium">Medium (100 XP)</option>
                <option value="Hard">Hard (200 XP)</option>
              </select>
            </div>

            <Input
              label="Time Limit (ms)"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              required
            />

            <Input
              label="Memory Limit (MB)"
              type="number"
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-300">Tags (comma separated)</label>
            <Input
              placeholder="Array, Hash Table, Two Pointers"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-300">Problem Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the problem..."
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-3 font-sans focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Input Description</label>
              <textarea
                rows={2}
                value={inputDesc}
                onChange={(e) => setInputDesc(e.target.value)}
                placeholder="First line contains..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2 font-mono"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Output Description</label>
              <textarea
                rows={2}
                value={outputDesc}
                onChange={(e) => setOutputDesc(e.target.value)}
                placeholder="Return the resulting..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-300">Constraints</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="• 1 <= nums.length <= 10^4"
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2 font-mono"
            />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-2 pt-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              id="is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="is_published">Publish immediately to Problem Arena</label>
          </div>

          {/* Test Cases Manager */}
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-200">
                Test Cases ({testCases.length})
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTestCase(true)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  + Sample (Public)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTestCase(false)}
                  leftIcon={<EyeOff className="w-3.5 h-3.5 text-violet-400" />}
                >
                  + Hidden Case
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-300 flex items-center gap-2">
                      {tc.is_sample ? (
                        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Public Sample #{idx + 1}
                        </span>
                      ) : (
                        <span className="text-violet-400 font-mono text-[11px] flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Hidden Test #{idx + 1}
                        </span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <textarea
                      rows={2}
                      value={tc.input_data}
                      onChange={(e) => updateTestCase(idx, 'input_data', e.target.value)}
                      placeholder="Input data"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded p-2 font-mono"
                      required
                    />
                    <textarea
                      rows={2}
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                      placeholder="Expected output"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded p-2 font-mono"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
            >
              {editingChallenge ? 'Save Changes' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
