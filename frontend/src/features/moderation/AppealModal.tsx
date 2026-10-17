import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Send, ShieldAlert, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AccountAppeal } from '@/types';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string | null;
  suspendedUntil?: string | null;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  onClose,
  reason,
  suspendedUntil,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [appealReason, setAppealReason] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if there is already an existing appeal for current user
  const { data: appealData, isLoading: isLoadingAppeal } = useQuery<{ appeal: AccountAppeal | null }>({
    queryKey: ['my-appeal'],
    queryFn: async () => {
      try {
        const res = await api.get('/appeals/my-appeal');
        return res.data;
      } catch {
        return { appeal: null };
      }
    },
    enabled: isOpen,
  });

  const existingAppeal = appealData?.appeal;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/appeals', {
        reason: appealReason,
        contact_email: contactEmail || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message || t('moderation.appealSubmittedSuccess'));
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['my-appeal'] });
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.response?.data?.message || t('moderation.appealSubmitError')
      );
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {t('moderation.appealTitle', 'Account Moderation & Appeal')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('moderation.appealSubtitle', 'Submit a formal review request to the moderation team.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Active Restriction Notice */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
            <div className="font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('moderation.restrictionDetails', 'Account Restriction Details')}</span>
            </div>
            {reason && (
              <p className="text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">{t('moderation.reasonLabel', 'Reason')}: </span>
                {reason}
              </p>
            )}
            {suspendedUntil ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">{t('moderation.expiresLabel', 'Expires')}: </span>
                {new Date(suspendedUntil).toLocaleDateString()} ({new Date(suspendedUntil).toLocaleTimeString()})
              </p>
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold">{t('moderation.durationLabel', 'Duration')}: </span>
                {t('moderation.indefinite', 'Indefinite')}
              </p>
            )}
          </div>

          {/* Existing Appeal Banner */}
          {existingAppeal && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                existingAppeal.status === 'pending'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                  : existingAppeal.status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {existingAppeal.status === 'pending' && <Clock className="w-4 h-4" />}
                {existingAppeal.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                {existingAppeal.status === 'rejected' && <AlertCircle className="w-4 h-4" />}
                <span>
                  {t('moderation.appealStatusLabel', 'Appeal Status')}:{' '}
                  <span className="uppercase font-mono">{existingAppeal.status}</span>
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300">
                {existingAppeal.status === 'pending' &&
                  t(
                    'moderation.appealPendingDesc',
                    'Your appeal has been received and is currently under review by our administrators.'
                  )}
                {existingAppeal.status === 'approved' &&
                  t('moderation.appealApprovedDesc', 'Your appeal was approved and restrictions have been lifted.')}
                {existingAppeal.status === 'rejected' &&
                  (existingAppeal.rejection_reason ||
                    t('moderation.appealRejectedDesc', 'Your appeal was reviewed and rejected.'))}
              </p>
            </div>
          )}

          {/* Appeal Form (if not pending) */}
          {(!existingAppeal || existingAppeal.status !== 'pending') && !successMessage && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('moderation.appealExplanation', 'Why should this decision be reviewed?')} *
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder={t(
                    'moderation.appealPlaceholder',
                    'Please provide details or context regarding the action, account ownership, or clarification...'
                  )}
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('moderation.contactEmailLabel', 'Contact Email for Resolution Updates (Optional)')}
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {errorMessage && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-md">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
          {(!existingAppeal || existingAppeal.status !== 'pending') && !successMessage && (
            <Button
              variant="primary"
              size="sm"
              disabled={appealReason.trim().length < 10 || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {submitMutation.isPending
                ? t('common.submitting', 'Submitting...')
                : t('moderation.submitAppealBtn', 'Submit Appeal')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
