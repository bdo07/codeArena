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
  Upload,
  Download,
  BarChart3,
  List,
  AlertTriangle,
  Server,
  Layers,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Challenge, AdminAnalytics } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { getDifficultyLabel } from '@/locales/challengeTranslations';

interface AdminChallengePayload {
  title: string;
  slug: string;
  description: string;
  input_description?: string;
  output_description?: string;
  constraints?: string;
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'challenges' | 'import_export' | 'analytics'>('challenges');

  // Challenge modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [outputDesc, setOutputDesc] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert'>('Easy');
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

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRawText, setImportRawText] = useState('');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Fetch admin challenges
  const { data, isLoading } = useQuery<{ data: Challenge[] }>({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      const res = await api.get('/admin/challenges');
      return res.data;
    },
    enabled: Boolean(user && user.role === 'admin'),
  });

  // Fetch admin analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics');
      return res.data;
    },
    enabled: Boolean(user && user.role === 'admin' && activeTab === 'analytics'),
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

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (importFile) {
        formData.append('file', importFile);
      } else if (importRawText.trim()) {
        if (importRawText.trim().startsWith('{') || importRawText.trim().startsWith('[')) {
          formData.append('json_data', importRawText);
        } else {
          formData.append('csv_data', importRawText);
        }
      } else {
        throw new Error('Please select a file or enter raw data.');
      }
      formData.append('overwrite_duplicates', overwriteDuplicates ? '1' : '0');

      const res = await api.post('/admin/challenges/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setImportFile(null);
      setImportRawText('');
    },
    onError: (err: any) => {
      setImportResult({
        success: false,
        message: err.response?.data?.message || err.message,
        errors: [err.response?.data?.message || err.message],
      });
    },
  });

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await api.get(`/admin/challenges/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      let blob: Blob;
      let filename = `codearena-challenges-${new Date().toISOString().slice(0, 10)}`;

      if (format === 'csv') {
        blob = new Blob([response.data], { type: 'text/csv' });
        filename += '.csv';
      } else {
        blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        filename += '.json';
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

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
    setDifficulty(ch.difficulty as any);
    setTimeLimit(ch.time_limit_ms);
    setMemoryLimit(ch.memory_limit_mb);
    setIsPublished(ch.is_published);
    setTagsInput(ch.tags?.map((tItem) => tItem.name).join(', ') || '');

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
      .map((tItem) => tItem.trim())
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

  // Authorization check
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            {t('admin.title')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('admin.subtitle')}
          </p>
        </div>

        {activeTab === 'challenges' && (
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('admin.createChallenge')}
          </Button>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'challenges'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          {t('admin.tabs.challenges', 'Challenges')}
        </button>

        <button
          onClick={() => setActiveTab('import_export')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'import_export'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {t('admin.tabs.importExport', 'Import & Export')}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {t('admin.tabs.analytics', 'Platform Analytics')}
        </button>
      </div>

      {/* TAB 1: Challenges List */}
      {activeTab === 'challenges' && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/30 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">{t('admin.table.titleSlug')}</th>
                <th className="py-3 px-4 w-28">{t('admin.table.difficulty')}</th>
                <th className="py-3 px-4 w-28 text-center">{t('admin.table.status')}</th>
                <th className="py-3 px-4 w-28 text-center">{t('admin.table.testCases')}</th>
                <th className="py-3 px-4 w-32 text-right">{t('admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-1" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/4" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-14" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-16 mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-8 mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 text-xs">
                    {t('admin.noChallenges')}
                  </td>
                </tr>
              ) : (
                data?.data?.map((ch) => (
                  <tr key={ch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{ch.title}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">/{ch.slug}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={ch.difficulty} size="sm">
                        {getDifficultyLabel(ch.difficulty, t)}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {ch.is_published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin.published')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {t('admin.draft')}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {ch.test_cases?.length || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(ch)}
                          title={t('admin.editTooltip')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                          onClick={() => {
                            if (confirm(t('admin.deleteConfirm', { title: ch.title }))) {
                              deleteMutation.mutate(ch.id);
                            }
                          }}
                          title={t('admin.deleteTooltip')}
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
      )}

      {/* TAB 2: Import & Export */}
      {activeTab === 'import_export' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Panel */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t('admin.import.title', 'Bulk Challenge Import')}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('admin.import.description', 'Upload a validated JSON or CSV file containing challenge definitions, test cases, and starter code.')}
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('admin.import.chooseFile', 'Select JSON or CSV file')}
                </label>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-600 dark:text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-50 dark:file:bg-violet-950/40 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/60 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('admin.import.pasteData', 'Or paste raw JSON / CSV data')}
                </label>
                <textarea
                  rows={5}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`[
  {
    "title": "Example Problem",
    "slug": "example-problem",
    "difficulty": "Easy",
    "description": "Problem details...",
    "test_cases": [{"input_data": "1", "expected_output": "1"}]
  }
]`}
                  className="w-full font-mono text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwrite_duplicates"
                  checked={overwriteDuplicates}
                  onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="overwrite_duplicates" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  {t('admin.import.overwriteLabel', 'Overwrite existing challenges with matching slug/title')}
                </label>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => importMutation.mutate()}
                isLoading={importMutation.isPending}
                disabled={!importFile && !importRawText.trim()}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                {t('admin.import.importBtn', 'Start Import')}
              </Button>
            </div>

            {/* Import Results Banner */}
            {importResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 mt-4 ${
                importResult.success !== false
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="font-semibold flex items-center gap-2">
                  {importResult.success !== false ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  {t('admin.import.results', 'Import Summary:')}
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>{t('admin.import.imported', { count: importResult.imported_count || 0 })}</div>
                  <div>{t('admin.import.updated', { count: importResult.updated_count || 0 })}</div>
                  <div>{t('admin.import.skipped', { count: importResult.skipped_count || 0 })}</div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-400">
                    <p className="font-semibold mb-1">{t('admin.import.errors', { count: importResult.errors.length })}</p>
                    <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto font-mono">
                      {importResult.errors.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Panel */}
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('admin.export.title', 'Export Library')}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('admin.export.description', 'Download the entire challenge library and test suites for backup or migration.')}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleExport('json')}
                  leftIcon={<Download className="w-4 h-4 text-emerald-500" />}
                >
                  {t('admin.export.exportJson', 'Export as JSON')}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleExport('csv')}
                  leftIcon={<Download className="w-4 h-4 text-violet-500" />}
                >
                  {t('admin.export.exportCsv', 'Export as CSV')}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-violet-500" />
                Format Integrity
              </div>
              <p>
                Exports contain complete test suite configurations, public and hidden inputs/outputs, points, memory and time limits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Platform Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {isAnalyticsLoading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              {t('common.loading', 'Loading analytics...')}
            </div>
          ) : analytics ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('admin.analytics.totalUsers', 'Total Users')}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {analytics.overview?.total_users ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('admin.analytics.totalChallenges', 'Total Challenges')}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {analytics.overview?.total_challenges ?? 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {analytics.overview?.published_challenges ?? 0} published
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('admin.analytics.totalSubmissions', 'Total Submissions')}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {analytics.overview?.total_submissions ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t('admin.analytics.acceptanceRate', 'Acceptance Rate')}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {analytics.overview?.acceptance_rate ?? 0}%
                  </div>
                </div>
              </div>

              {/* Evaluator Engine Health Card */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {t('admin.analytics.evaluatorStatus', 'Evaluator Engine Status')}
                    </h3>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    analytics.evaluator_health?.available
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${analytics.evaluator_health?.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {analytics.evaluator_health?.available
                      ? t('admin.analytics.judge0Online', 'Judge0 Online & Healthy')
                      : t('admin.analytics.judge0Offline', 'Safe In-Memory Fallback Active')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500">Latency:</span>{' '}
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {analytics.evaluator_health?.latency_ms ? `${analytics.evaluator_health.latency_ms} ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500">Judge0 Languages:</span>{' '}
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {analytics.evaluator_health?.language_count ?? 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500">SQL Engine:</span>{' '}
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      Isolated SQLite Sandbox
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdowns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Categories */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    {t('admin.analytics.categoryBreakdown', 'Challenges by Category')}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(analytics.category_breakdown || {}).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400 capitalize">{cat}</span>
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {t('admin.analytics.difficultyBreakdown', 'Challenges by Difficulty')}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.difficulty_breakdown || {}).map(([diff, count]) => (
                      <div key={diff} className="flex items-center justify-between text-xs">
                        <Badge variant={diff as any} size="sm">
                          {getDifficultyLabel(diff, t)}
                        </Badge>
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenge Types */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    {t('admin.analytics.typeBreakdown', 'Challenges by Type')}
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.type_breakdown || {}).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400 capitalize">{type}</span>
                        <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7-Day Activity Trend */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-500" />
                  {t('admin.analytics.activityTrend', 'Recent 7-Day Activity')}
                </h4>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {(analytics.activity_trend || []).map((day) => (
                    <div key={day.date} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[10px] text-zinc-500">{day.date.slice(5)}</div>
                      <div className="text-sm font-bold font-mono text-violet-600 dark:text-violet-400 mt-1">
                        {day.submissions}
                      </div>
                      <div className="text-[9px] text-zinc-400">submissions</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Challenge Authoring Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChallenge ? t('admin.editChallenge') : t('admin.createChallenge')}
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('admin.modal.title')}
              placeholder={t('admin.modal.titlePlaceholder')}
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
              label={t('admin.modal.slug')}
              placeholder={t('admin.modal.slugPlaceholder')}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.difficulty')}</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm rounded-lg px-3 py-2 cursor-pointer"
              >
                <option value="Beginner">{t('difficulty.Beginner')} (25 XP)</option>
                <option value="Easy">{t('difficulty.Easy')} (50 XP)</option>
                <option value="Medium">{t('difficulty.Medium')} (100 XP)</option>
                <option value="Hard">{t('difficulty.Hard')} (200 XP)</option>
                <option value="Expert">{t('difficulty.Expert')} (350 XP)</option>
              </select>
            </div>

            <Input
              label={t('admin.modal.timeLimit')}
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              required
            />

            <Input
              label={t('admin.modal.memoryLimit')}
              type="number"
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.tags')}</label>
            <Input
              placeholder={t('admin.modal.tagsPlaceholder')}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.description')}</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.modal.descPlaceholder')}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg p-3 font-sans focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.inputDesc')}</label>
              <textarea
                rows={2}
                value={inputDesc}
                onChange={(e) => setInputDesc(e.target.value)}
                placeholder={t('admin.modal.inputPlaceholder')}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg p-2 font-mono"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.outputDesc')}</label>
              <textarea
                rows={2}
                value={outputDesc}
                onChange={(e) => setOutputDesc(e.target.value)}
                placeholder={t('admin.modal.outputPlaceholder')}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{t('admin.modal.constraints')}</label>
            <textarea
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder={t('admin.modal.constraintsPlaceholder')}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs rounded-lg p-2 font-mono"
            />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-2 pt-1 text-xs text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              id="is_published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <label htmlFor="is_published" className="cursor-pointer">{t('admin.modal.publishImmediate')}</label>
          </div>

          {/* Test Cases Manager */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {t('admin.modal.testCasesTitle', { count: testCases.length })}
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTestCase(true)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                >
                  {t('admin.modal.addSample')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTestCase(false)}
                  leftIcon={<EyeOff className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />}
                >
                  {t('admin.modal.addHidden')}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      {tc.is_sample ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {t('admin.modal.publicSample', { index: idx + 1 })}
                        </span>
                      ) : (
                        <span className="text-violet-600 dark:text-violet-400 font-mono text-[11px] flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> {t('admin.modal.hiddenTest', { index: idx + 1 })}
                        </span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <textarea
                      rows={2}
                      value={tc.input_data}
                      onChange={(e) => updateTestCase(idx, 'input_data', e.target.value)}
                      placeholder={t('admin.modal.inputDataPlaceholder')}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded p-2 font-mono"
                      required
                    />
                    <textarea
                      rows={2}
                      value={tc.expected_output}
                      onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                      placeholder={t('admin.modal.expectedOutputPlaceholder')}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded p-2 font-mono"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
            >
              {editingChallenge ? t('admin.modal.saveChanges') : t('admin.modal.createBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
