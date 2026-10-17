import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, Lock, ShieldAlert, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AdminUserListItem } from '@/types';

interface SuspendUserModalProps {
  user: AdminUserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [durationDays, setDurationDays] = useState<number | 0>(7); // 0 = indefinite
  const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const suspendMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const res = await api.post(`/admin/users/${user.id}/suspend`, {
        reason,
        duration_days: durationDays === 0 ? null : durationDays,
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
      setError(err?.response?.data?.message || t('admin.moderation.suspendError', 'Failed to suspend account.'));
    },
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('admin.moderation.suspendTitle', 'Suspend User Account')}
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

        {/* Form Body */}
        <div className="py-4 space-y-3.5">
          {/* Warning summary */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {t('admin.moderation.suspensionConsequences', 'Enforced Consequences:')}
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
              <li>{t('admin.moderation.consequenceSubmissions', 'Blocked from challenge submissions and quizzes')}</li>
              <li>{t('admin.moderation.consequenceDiscussions', 'Blocked from posting in discussions & replies')}</li>
              <li>{t('admin.moderation.consequenceXp', 'Prevented from claiming quest rewards or gaining XP')}</li>
              <li>{t('admin.moderation.consequenceSessions', 'Active login tokens revoked immediately')}</li>
            </ul>
          </div>

          {/* Duration selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('admin.moderation.durationLabel', 'Suspension Duration')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '24 Hours', days: 1 },
                { label: '3 Days', days: 3 },
                { label: '7 Days', days: 7 },
                { label: '14 Days', days: 14 },
                { label: '30 Days', days: 30 },
                { label: 'Indefinite', days: 0 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setDurationDays(opt.days)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md border text-center transition-colors ${
                    durationDays === opt.days
                      ? 'bg-amber-500 text-white border-amber-600 font-semibold shadow-xs'
                      : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason (required & user-facing) */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('admin.moderation.publicReasonLabel', 'Suspension Reason')} *
              <span className="text-[11px] text-zinc-400 font-normal ml-1">
                ({t('admin.moderation.visibleToUser', 'Visible to user on their restriction notice')})
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                'admin.moderation.suspendReasonPlaceholder',
                'e.g. Repeated violation of community code of conduct in discussion forums.'
              )}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Internal notes (private & admin-only) */}
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
                'Internal context, evidence links, or support ticket reference...'
              )}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
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
            disabled={reason.trim().length < 3 || suspendMutation.isPending}
            onClick={() => suspendMutation.mutate()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {suspendMutation.isPending ? t('common.saving', 'Suspending...') : t('admin.moderation.confirmSuspend', 'Confirm Suspension')}
          </Button>
        </div>
      </div>
    </div>
  );
};
