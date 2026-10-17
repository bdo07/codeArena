import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { AppealModal } from './AppealModal';

export const SuspensionNoticeBanner: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);

  if (!user || (!user.is_suspended && user.status !== 'suspended')) {
    return null;
  }

  const isIndefinite = !user.suspended_until;

  return (
    <>
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
            </span>
            <div>
              <span className="font-semibold">
                {t('moderation.accountSuspendedBanner', 'Account Access Restricted')}:{' '}
              </span>
              <span>
                {user.suspension_reason ||
                  t('moderation.defaultSuspensionReason', 'Violations of CodeArena Community Guidelines.')}
              </span>
              <span className="ml-2 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                {isIndefinite ? (
                  <span>({t('moderation.indefinite', 'Indefinite')})</span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 inline" />
                    {t('moderation.suspendedUntil', 'Until {{date}}', {
                      date: new Date(user.suspended_until!).toLocaleDateString(),
                    })}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAppealModalOpen(true)}
              className="text-xs h-7 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1" />
              {t('moderation.submitAppealBtn', 'Appeal Account Action')}
            </Button>
          </div>
        </div>
      </div>

      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        reason={user.suspension_reason}
        suspendedUntil={user.suspended_until}
      />
    </>
  );
};
