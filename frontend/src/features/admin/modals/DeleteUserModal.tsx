import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2, X, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AdminUserListItem } from '@/types';

interface DeleteUserModalProps {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'soft' | 'force'>('soft');
  const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSoftDeleted = Boolean(user?.is_deleted || user?.deleted_at);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (mode === 'force') {
        const res = await api.delete(`/admin/users/${user.id}/force`, {
          data: {
            confirm_username: confirmUsername,
            reason,
            internal_notes: internalNotes || null,
          },
        });
        return res.data;
      } else {
        const res = await api.delete(`/admin/users/${user.id}`, {
          data: {
            reason,
            internal_notes: internalNotes || null,
          },
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      onSuccess?.();
      onClose();
      setReason('');
      setInternalNotes('');
      setConfirmUsername('');
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || t('admin.moderation.deleteError', 'Failed to delete account.'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await api.post(`/admin/users/${user.id}/restore`, {
        reason: 'Restored from recovery window by administrator.',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      onSuccess?.();
      onClose();
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || t('admin.moderation.restoreError', 'Failed to restore account.'));
    },
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isSoftDeleted
                  ? t('admin.moderation.manageDeletedTitle', 'Manage Soft-Deleted User')
                  : t('admin.moderation.deleteTitle', 'Delete User Account')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                @{user.username} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4">
          {/* If already soft-deleted, offer Restore or Permanent Purge */}
          {isSoftDeleted ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">
                  {t('admin.moderation.inRecoveryWindow', 'Account is in Recovery Window')}
                </p>
                <p className="text-[11px] opacity-90">
                  {t(
                    'admin.moderation.recoveryDesc',
                    'This account is currently soft-deleted. You can restore it immediately, or permanently purge all records in accordance with GDPR/privacy retention policies.'
                  )}
                </p>
              </div>

              <div className="flex items-center justify-center p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreMutation.mutate()}
                  disabled={restoreMutation.isPending}
                  className="w-full text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {restoreMutation.isPending
                    ? t('common.restoring', 'Restoring...')
                    : t('admin.moderation.restoreAccountBtn', 'Restore User Account')}
                </Button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                <span className="shrink-0 mx-3 text-[10px] uppercase tracking-wider text-zinc-400">
                  {t('admin.moderation.orPermanentPurge', 'OR PERMANENT PURGE')}
                </span>
                <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              </div>

              {/* Force Purge Form */}
              <div className="space-y-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  {t('admin.moderation.permanentPurgeTitle', 'Irreversible Data Purge')}
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  {t(
                    'admin.moderation.typeToConfirm',
                    'To confirm permanent purging, type the username "{{username}}" below:',
                    { username: user.username }
                  )}
                </p>

                <input
                  type="text"
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  placeholder={user.username}
                  className="w-full text-xs p-2 rounded-lg border border-red-300 dark:border-red-900 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('admin.moderation.purgeReasonPlaceholder', 'Data retention policy or user deletion request reference...')}
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />

                <Button
                  variant="primary"
                  size="sm"
                  disabled={
                    confirmUsername.trim().toLowerCase() !== user.username.toLowerCase() ||
                    reason.trim().length < 3 ||
                    deleteMutation.isPending
                  }
                  onClick={() => {
                    setMode('force');
                    deleteMutation.mutate();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isPending
                    ? t('common.deleting', 'Purging Data...')
                    : t('admin.moderation.confirmPurgeBtn', 'Permanently Purge Records')}
                </Button>
              </div>
            </div>
          ) : (
            /* Normal Soft-Deletion (Reversible) */
            <div className="space-y-3.5">
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
                <p className="font-semibold flex items-center gap-1.5 mb-1 text-zinc-900 dark:text-zinc-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {t('admin.moderation.safeSoftDeleteTitle', 'Reversible Soft-Delete Policy')}
                </p>
                <p className="text-[11px] leading-relaxed">
                  {t(
                    'admin.moderation.safeSoftDeleteDesc',
                    'This moves the account to a protected recovery window. Foreign keys, submissions, and database integrity are safely retained while preventing the user from logging in or appearing publicly.'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('admin.moderation.deletionReasonLabel', 'Policy Deletion Reason')} *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t(
                    'admin.moderation.deletionReasonPlaceholder',
                    'e.g. Account deletion requested by user or policy enforcement...'
                  )}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span>{t('admin.moderation.internalNotesLabel', 'Internal Moderator Note (Optional)')}</span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-mono">
                    {t('admin.moderation.confidentialBadge', 'ADMIN ONLY')}
                  </span>
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder={t('admin.moderation.internalNotesPlaceholder', 'Internal context or ticket ID...')}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer (for soft delete) */}
        {!isSoftDeleted && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={reason.trim().length < 3 || deleteMutation.isPending}
              onClick={() => {
                setMode('soft');
                deleteMutation.mutate();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending
                ? t('common.deleting', 'Deleting...')
                : t('admin.moderation.confirmSoftDelete', 'Soft-Delete Account')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
