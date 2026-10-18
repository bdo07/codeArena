import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Swords,
  Plus,
  Clock,
  Trophy,
  Check,
  X,
  Play,
  RotateCcw,
  Users,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { duelApi } from '@/services/duelApi';
import { DuelListItem } from '@/types/duel';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

export const DuelLobbyPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'active' | 'invites' | 'history'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedDuration, setSelectedDuration] = useState(900); // 15 mins default
  const [createError, setCreateError] = useState<string | null>(null);

  // Queries
  const {
    data: duelsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['duels', activeTab],
    queryFn: () => duelApi.listDuels(activeTab, 1),
    refetchInterval: activeTab === 'active' || activeTab === 'invites' ? 5000 : false,
  });

  // Query for pending invites badge count
  const { data: invitesData } = useQuery({
    queryKey: ['duels', 'invites_count'],
    queryFn: () => duelApi.listDuels('invites', 1),
    refetchInterval: 10000,
  });
  const pendingInvitesCount = invitesData?.data?.length || 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: duelApi.createDuel,
    onSuccess: (res) => {
      setIsCreateModalOpen(false);
      setOpponentUsername('');
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      navigate(`/duels/${res.duel.uuid}`);
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || t('duel.create_error', 'Failed to create duel.'));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: duelApi.acceptDuel,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
      navigate(`/duels/${res.duel.uuid}`);
    },
  });

  const declineMutation = useMutation({
    mutationFn: duelApi.declineDuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: duelApi.cancelDuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate({
      opponent_username: opponentUsername.trim() || undefined,
      difficulty: selectedDifficulty,
      language: selectedLanguage,
      duration_seconds: selectedDuration,
    });
  };

  const getStatusBadge = (status: DuelListItem['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('duel.status_active', 'Active Match')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('duel.status_pending', 'Pending Invite')}</Badge>;
      case 'completed':
        return <Badge variant="primary">{t('duel.status_completed', 'Completed')}</Badge>;
      case 'timed_out':
        return <Badge variant="secondary">{t('duel.status_timed_out', 'Time Expired')}</Badge>;
      case 'declined':
        return <Badge variant="danger">{t('duel.status_declined', 'Declined')}</Badge>;
      case 'canceled':
        return <Badge variant="secondary">{t('duel.status_canceled', 'Canceled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
      case 'Easy':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{diff}</span>;
      case 'Medium':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{diff}</span>;
      case 'Hard':
      case 'Expert':
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">{diff}</span>;
      default:
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{diff}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
              <Swords className="w-7 h-7" />
            </span>
            {t('duel.lobby_title', 'Code Duel Arena')}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            {t('duel.lobby_subtitle', 'Challenge other developers to head-to-head 1v1 live coding battles. Identical test cases, synchronized clock, real-time validation.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('duel.create_duel_button', 'New Duel')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <Play className="w-4 h-4" />
          {t('duel.tab_active', 'Active Matches')}
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTab === 'invites'
              ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('duel.tab_invites', 'Invitations')}
          {pendingInvitesCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300">
              {pendingInvitesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {t('duel.tab_history', 'Match History')}
        </button>
      </div>

      {/* Duel List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 animate-pulse space-y-4"
            >
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-10 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-medium text-rose-800 dark:text-rose-400">
            {t('duel.error_loading', 'Unable to load duels. Please try refreshing.')}
          </p>
          <Button onClick={() => refetch()} variant="secondary" size="sm">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      ) : duelsData?.data.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTab === 'invites'
                ? t('duel.empty_invites', 'No pending invitations')
                : activeTab === 'active'
                ? t('duel.empty_active', 'No active matches in progress')
                : t('duel.empty_history', 'No duel history recorded yet')}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {activeTab === 'invites'
                ? t('duel.empty_invites_desc', 'When someone challenges you to a duel, their invitation will appear here.')
                : t('duel.empty_active_desc', 'Launch a duel against a friend or an open opponent to test your speed.')}
            </p>
          </div>
          {activeTab !== 'invites' && (
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('duel.create_first', 'Start a New Duel')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duelsData?.data.map((duel) => {
            const isCreator = user?.id === duel.creator.id;
            const isOpponent = user?.id === duel.opponent?.id;
            const isWinner = duel.winner?.id === user?.id;

            return (
              <div
                key={duel.uuid}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Match Card Top */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(duel.status)}
                      {getDifficultyBadge(duel.challenge.difficulty)}
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.round(duel.duration_seconds / 60)}m
                      </span>
                    </div>

                    <span className="text-xs font-mono uppercase text-zinc-400">
                      {duel.language}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-500 transition-colors">
                      {duel.challenge.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {duel.challenge.category}
                    </p>
                  </div>

                  {/* Opponents Banner */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between">
                    {/* Creator */}
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={duel.creator.avatar_url}
                        name={duel.creator.name}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          {duel.creator.username}
                          {isCreator && (
                            <span className="text-[10px] text-violet-500 font-bold">({t('common.you', 'You')})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {duel.creator_score} pts
                        </div>
                      </div>
                    </div>

                    <div className="px-2 py-0.5 rounded text-[11px] font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-700/50">
                      VS
                    </div>

                    {/* Opponent */}
                    <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                      <Avatar
                        src={duel.opponent?.avatar_url}
                        name={duel.opponent?.name || 'Opponent'}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 justify-end">
                          {duel.opponent ? duel.opponent.username : t('duel.waiting_opponent', 'Open')}
                          {isOpponent && (
                            <span className="text-[10px] text-violet-500 font-bold">({t('common.you', 'You')})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {duel.opponent ? `${duel.opponent_score} pts` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outcome summary if completed */}
                  {duel.result_reason && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 pt-1">
                      {duel.winner ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      )}
                      <span className="line-clamp-2">{duel.result_reason}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(duel.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Invitation actions */}
                    {activeTab === 'invites' && duel.status === 'pending' && isOpponent && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => declineMutation.mutate(duel.uuid)}
                          disabled={declineMutation.isPending}
                          className="text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          {t('duel.decline', 'Decline')}
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => acceptMutation.mutate(duel.uuid)}
                          disabled={acceptMutation.isPending}
                          className="text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {t('duel.accept', 'Accept & Fight')}
                        </Button>
                      </>
                    )}

                    {/* Pending duel creator actions */}
                    {duel.status === 'pending' && isCreator && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => cancelMutation.mutate(duel.uuid)}
                        disabled={cancelMutation.isPending}
                        className="text-xs"
                      >
                        {t('duel.cancel_invite', 'Cancel')}
                      </Button>
                    )}

                    {/* Active duel button */}
                    {duel.status === 'active' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/duels/${duel.uuid}`)}
                        className="text-xs"
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        {t('duel.enter_arena', 'Enter Arena')}
                      </Button>
                    )}

                    {/* Completed / History duel button */}
                    {(duel.status === 'completed' || duel.status === 'timed_out') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/duels/${duel.uuid}`)}
                        className="text-xs"
                      >
                        {t('duel.view_results', 'View Match')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Duel Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('duel.create_modal_title', 'Create New Code Duel')}
        description={t('duel.create_modal_desc', 'Set match parameters and challenge a friend or post an open duel.')}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('duel.opponent_username_label', 'Opponent Username (Optional)')}
            </label>
            <Input
              type="text"
              placeholder={t('duel.opponent_username_placeholder', 'e.g. alexander (leave blank for open invite)')}
              value={opponentUsername}
              onChange={(e) => setOpponentUsername(e.target.value)}
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              {t('duel.opponent_username_hint', 'Leave blank to create an open match that any coder can accept.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('duel.difficulty_label', 'Difficulty')}
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              >
                <option value="Easy">{t('challenges.difficulty_easy', 'Easy')}</option>
                <option value="Medium">{t('challenges.difficulty_medium', 'Medium')}</option>
                <option value="Hard">{t('challenges.difficulty_hard', 'Hard')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('duel.language_label', 'Language')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {t('duel.duration_label', 'Match Time Limit')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '10 min', val: 600 },
                { label: '15 min', val: 900 },
                { label: '25 min', val: 1500 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelectedDuration(opt.val)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    selectedDuration === opt.val
                      ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:border-violet-500 dark:text-violet-300'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t('duel.creating', 'Setting up duel...')
                : t('duel.start_match_btn', 'Create Duel')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DuelLobbyPage;
