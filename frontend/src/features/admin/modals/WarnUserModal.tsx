import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Send, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AdminUserListItem } from '@/types';

interface WarnUserModalProps {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WarnUserModal: React.FC<WarnUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const warnMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await api.post(`/admin/users/${user.id}/warn`, {
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
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || t('admin.moderation.warnError', 'Failed to issue warning.'));
    },
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('admin.moderation.warnTitle', 'Issue Official Account Warning')}
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
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('admin.moderation.warningMessageLabel', 'Warning Message / Infraction Description')} *
              <span className="text-[11px] text-zinc-400 font-normal ml-1">
                ({t('admin.moderation.sentToUserNotice', 'Sent to user in-app notification')})
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                'admin.moderation.warnReasonPlaceholder',
                'Specify the violation or behavioral guideline infraction...'
              )}
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-500 focus:outline-hidden"
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
              placeholder={t('admin.moderation.internalNotesPlaceholder', 'Context for other administrators...')}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
            />
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
            disabled={reason.trim().length < 3 || warnMutation.isPending}
            onClick={() => warnMutation.mutate()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            {warnMutation.isPending ? t('common.sending', 'Issuing...') : t('admin.moderation.sendWarningBtn', 'Send Warning')}
          </Button>
        </div>
      </div>
    </div>
  );
};
