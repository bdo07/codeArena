import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Clock,
  Ban,
  AlertTriangle,
  FileText,
  User,
  CheckCircle2,
  Calendar,
  Award,
  Zap,
  RotateCcw,
  UserCheck,
  X,
  History,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ModerationAuditLog, AccountAppeal } from '@/types';

interface UserDetailModalProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, user: any) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userId,
  isOpen,
  onClose,
  onAction,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'appeals'>('overview');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    user: any;
    moderation_logs: ModerationAuditLog[];
    appeals: AccountAppeal[];
  }>({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    },
    enabled: Boolean(isOpen && userId),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const res = await api.post(`/admin/users/${userId}/unsuspend`, {
        reason: 'Suspension lifted by administrator from user details modal.',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to unsuspend user.');
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const res = await api.post(`/admin/users/${userId}/unban`, {
        reason: 'Ban revoked by administrator from user details modal.',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to unban user.');
    },
  });

  const roleMutation = useMutation({
    mutationFn: async (newRole: 'admin' | 'user') => {
      if (!userId) return;
      const res = await api.put(`/admin/users/${userId}/role`, {
        role: newRole,
        reason: `Role changed to ${newRole} by administrator.`,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setActionError(null);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to update role.');
    },
  });

  if (!isOpen || !userId) return null;

  const user = data?.user;
  const moderationLogs = data?.moderation_logs || [];
  const appeals = data?.appeals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Avatar
              src={user?.avatar_url}
              name={user?.name || 'User'}
              className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {user?.name || 'Loading user...'}
                </h3>
                {user?.role === 'admin' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    Admin
                  </span>
                )}
                {user?.is_banned && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    Banned
                  </span>
                )}
                {user?.is_suspended && !user?.is_banned && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Suspended
                  </span>
                )}
                {user?.is_deleted && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 line-through">
                    Soft-Deleted
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                @{user?.username} • {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-5 pt-3 border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {t('admin.tabs.overview', 'Overview & Profile')}
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {t('admin.tabs.moderationHistory', 'Moderation Audit Trail')} ({moderationLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'appeals'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t('admin.tabs.appeals', 'Appeals')} ({appeals.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {actionError && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {actionError}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              {t('common.loading', 'Loading details...')}
            </div>
          ) : activeTab === 'overview' ? (
            /* Overview Tab */
            <div className="space-y-4">
              {/* Quick Account Status Box */}
              {(user?.is_suspended || user?.is_banned || user?.is_deleted) && (
                <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    {t('admin.moderation.statusDetails', 'Account Moderation State')}
                  </p>
                  {user?.is_banned && (
                    <p className="text-red-600 dark:text-red-400">
                      <span className="font-semibold">Permanently Banned:</span> {user.ban_reason} (Since{' '}
                      {new Date(user.banned_at).toLocaleDateString()})
                    </p>
                  )}
                  {user?.is_suspended && !user?.is_banned && (
                    <p className="text-amber-600 dark:text-amber-400">
                      <span className="font-semibold">Suspension Reason:</span> {user.suspension_reason}
                      {user.suspended_until && ` (Until ${new Date(user.suspended_until).toLocaleDateString()})`}
                    </p>
                  )}
                  {user?.is_deleted && (
                    <p className="text-zinc-500">
                      <span className="font-semibold">Soft-Deleted At:</span>{' '}
                      {new Date(user.deleted_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Verified XP</span>
                  <span className="text-base font-bold text-violet-600 dark:text-violet-400">{user?.xp ?? 0}</span>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Calculated Level</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">{user?.level ?? 1}</span>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Solved Challenges</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {user?.stats?.solved_challenges ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">Total Submissions</span>
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.stats?.total_submissions ?? 0}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">User ID</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">#{user?.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Registration Date</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Location</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{user?.location || 'Not provided'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Bio</span>
                  <span className="text-zinc-700 dark:text-zinc-300 max-w-xs text-right truncate">
                    {user?.bio || 'None'}
                  </span>
                </div>
              </div>

              {/* Administrative Actions Quick Strip */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('admin.moderation.quickActions', 'Administrative State Actions')}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {user?.is_suspended && !user?.is_banned && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unsuspendMutation.mutate()}
                      disabled={unsuspendMutation.isPending}
                      className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      {unsuspendMutation.isPending ? 'Lifting...' : 'Lift Suspension'}
                    </Button>
                  )}
                  {user?.is_banned && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unbanMutation.mutate()}
                      disabled={unbanMutation.isPending}
                      className="text-xs border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-500/10"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      {unbanMutation.isPending ? 'Revoking...' : 'Revoke Ban'}
                    </Button>
                  )}
                  {user?.role === 'user' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => roleMutation.mutate('admin')}
                      disabled={roleMutation.isPending}
                      className="text-xs border-violet-500/30 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Promote to Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => roleMutation.mutate('user')}
                      disabled={roleMutation.isPending}
                      className="text-xs border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Demote to User
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'moderation' ? (
            /* Moderation Audit Trail Tab */
            <div className="space-y-3">
              {moderationLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {t('admin.moderation.noActionsFound', 'No moderation actions recorded for this user yet.')}
                </div>
              ) : (
                moderationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            log.action === 'warn'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                              : log.action === 'suspend'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : log.action === 'unsuspend' || log.action === 'unban'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : log.action === 'ban'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-zinc-500">
                          by @{log.admin?.username || 'System Console'}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-zinc-800 dark:text-zinc-200">
                      <span className="font-semibold text-zinc-500">Public Reason: </span>
                      {log.reason}
                    </p>

                    {log.internal_notes && (
                      <div className="p-2 rounded bg-violet-500/5 border border-violet-500/20 text-[11px] text-violet-800 dark:text-violet-300">
                        <span className="font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Internal Admin Note:
                        </span>
                        {log.internal_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Appeals Tab */
            <div className="space-y-3">
              {appeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  {t('admin.moderation.noAppealsFound', 'No appeals submitted by this user.')}
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          appeal.status === 'pending'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : appeal.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {appeal.status}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(appeal.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-zinc-800 dark:text-zinc-200">
                      <span className="font-semibold text-zinc-500">User Statement: </span>
                      {appeal.reason}
                    </p>

                    {appeal.reviewed_by && (
                      <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                        <span className="font-semibold">
                          Reviewed by @{appeal.reviewer?.username} on{' '}
                          {appeal.reviewed_at ? new Date(appeal.reviewed_at).toLocaleDateString() : ''}:
                        </span>{' '}
                        {appeal.admin_notes || appeal.rejection_reason || 'No comments recorded.'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
