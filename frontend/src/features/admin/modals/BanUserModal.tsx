import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, Ban, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AdminUserListItem } from '@/types';

interface BanUserModalProps {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await api.post(`/admin/users/${user.id}/ban`, {
        reason,
        internal_notes: internalNotes || null,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      onSuccess?.();
      onClose();
      setReason('');
      setInternalNotes('');
      setConfirmed(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || t('admin.moderation.banError', 'Failed to ban account.'));
    },
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-red-500/30 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('admin.moderation.banTitle', 'Permanently Ban User Account')}
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

        {/* Content */}
        <div className="py-4 space-y-3.5">
          {/* Warning banner */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              {t('admin.moderation.banConsequences', 'Permanent Ban Impact:')}
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">
              {t(
                'admin.moderation.banWarningText',
                'This user will be permanently blocked from authenticating or accessing CodeArena services. An auditable record will be permanently preserved. (To grant a temporary restriction, use Account Suspension instead).'
              )}
            </p>
          </div>

          {/* Reason (required) */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('admin.moderation.banReasonLabel', 'Ban Justification & Public Reason')} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                'admin.moderation.banReasonPlaceholder',
                'Specify the serious or repeated violations justifying a permanent ban...'
              )}
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Internal notes */}
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
              placeholder={t(
                'admin.moderation.internalNotesPlaceholder',
                'Internal evidence notes, investigation details...'
              )}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500"
              />
              <span>
                {t(
                  'admin.moderation.banConfirmCheckbox',
                  'I confirm that this permanent ban is justified by serious policy violations and should be audited.'
                )}
              </span>
            </label>
          </div>

          {error && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={reason.trim().length < 3 || !confirmed || banMutation.isPending}
            onClick={() => banMutation.mutate()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {banMutation.isPending ? t('common.saving', 'Banning...') : t('admin.moderation.confirmBan', 'Confirm Permanent Ban')}
          </Button>
        </div>
      </div>
    </div>
  );
};
