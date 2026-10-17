import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AccountAppeal } from '@/types';

interface ReviewAppealModalProps {
  appeal: AccountAppeal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewAppealModal: React.FC<ReviewAppealModalProps> = ({
  appeal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [autoReinstate, setAutoReinstate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!appeal) return;
      const res = await api.post(`/admin/appeals/${appeal.id}/review`, {
        status: decision,
        resolution_notes: resolutionNotes,
        rejection_reason: decision === 'rejected' ? rejectionReason || resolutionNotes : null,
        auto_reinstate: autoReinstate,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appeals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      onSuccess?.();
      onClose();
      setResolutionNotes('');
      setRejectionReason('');
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to review appeal.');
    },
  });

  if (!isOpen || !appeal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t('admin.moderation.reviewAppealTitle', 'Review Account Appeal')} #{appeal.id}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                @{appeal.user?.username || 'Unknown'} ({appeal.contact_email || appeal.user?.email})
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
          {/* User Statement */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
              {t('admin.moderation.userAppealStatement', 'User Statement & Arguments:')}
            </span>
            <p className="text-zinc-800 dark:text-zinc-200 italic leading-relaxed">
              "{appeal.reason}"
            </p>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('admin.moderation.decisionLabel', 'Review Determination')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                  decision === 'approved'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('admin.moderation.approveAppeal', 'Approve Appeal')}
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                  decision === 'rejected'
                    ? 'bg-red-600 text-white border-red-700 shadow-xs'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <XCircle className="w-4 h-4" />
                {t('admin.moderation.rejectAppeal', 'Reject Appeal')}
              </button>
            </div>
          </div>

          {/* Auto-reinstate checkbox if approved */}
          {decision === 'approved' && (
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoReinstate}
                onChange={(e) => setAutoReinstate(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {t('admin.moderation.autoReinstate', 'Automatically lift suspension/ban and restore full account access')}
              </span>
            </label>
          )}

          {/* Resolution notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {t('admin.moderation.resolutionNotesLabel', 'Resolution Explanation')} *
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder={t(
                'admin.moderation.resolutionNotesPlaceholder',
                'Explain determination rationale for audit and notification...'
              )}
              rows={3}
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
            disabled={resolutionNotes.trim().length < 3 || reviewMutation.isPending}
            onClick={() => reviewMutation.mutate()}
            className={decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
          >
            {reviewMutation.isPending ? t('common.saving', 'Saving...') : t('admin.moderation.submitDecision', 'Submit Decision')}
          </Button>
        </div>
      </div>
    </div>
  );
};
