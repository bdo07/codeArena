import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  User,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AccountAppeal } from '@/types';
import { ReviewAppealModal } from './modals/ReviewAppealModal';

export const AppealsQueueTab: React.FC = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<AccountAppeal | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<{
    appeals: {
      data: AccountAppeal[];
      total: number;
    };
    counts: {
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    };
  }>({
    queryKey: ['admin-appeals', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' ? '/admin/appeals' : `/admin/appeals?status=${statusFilter}`;
      const res = await api.get(url);
      return res.data;
    },
  });

  const appeals = data?.appeals?.data || [];
  const counts = data?.counts;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.appeals.pendingAppeals', 'Pending Review')}
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {counts?.pending ?? '—'}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.appeals.approvedAppeals', 'Approved')}
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {counts?.approved ?? '—'}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'rejected'
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-500/5'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.appeals.rejectedAppeals', 'Rejected')}
          </span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {counts?.rejected ?? '—'}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'border-zinc-500 ring-2 ring-zinc-500/20 bg-zinc-500/5'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.appeals.allAppeals', 'Total Appeals')}
          </span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {counts?.total ?? '—'}
          </span>
        </button>
      </div>

      {/* Appeals List Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4">{t('admin.appeals.appellant', 'Appellant User')}</th>
                <th className="py-3 px-4">{t('admin.appeals.status', 'Appeal Status')}</th>
                <th className="py-3 px-4">{t('admin.appeals.statement', 'User Statement')}</th>
                <th className="py-3 px-4">{t('admin.appeals.submittedAt', 'Submitted')}</th>
                <th className="py-3 px-4">{t('admin.appeals.reviewer', 'Reviewed By')}</th>
                <th className="py-3 px-4 text-right">{t('admin.table.actions', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    {t('common.loading', 'Loading appeals...')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-500">
                    {t('admin.appeals.errorLoading', 'Failed to load appeals queue.')}
                  </td>
                </tr>
              ) : appeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    {t('admin.appeals.queueEmpty', 'No appeals in this queue state.')}
                  </td>
                </tr>
              ) : (
                appeals.map((appeal) => (
                  <tr
                    key={appeal.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={appeal.user?.avatar_url}
                          name={appeal.user?.name || 'User'}
                          className="w-7 h-7 rounded-full"
                        />
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                            @{appeal.user?.username || 'Unknown'}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {appeal.contact_email || appeal.user?.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      {appeal.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : appeal.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* User statement */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="truncate text-zinc-700 dark:text-zinc-300 italic" title={appeal.reason}>
                        "{appeal.reason}"
                      </p>
                    </td>

                    {/* Submitted at */}
                    <td className="py-3 px-4 text-zinc-500">
                      {new Date(appeal.created_at).toLocaleDateString()}
                    </td>

                    {/* Reviewer info */}
                    <td className="py-3 px-4 text-zinc-500">
                      {appeal.reviewer ? (
                        <span>@{appeal.reviewer.username}</span>
                      ) : (
                        <span className="text-zinc-400 italic">Unreviewed</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={appeal.status === 'pending' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedAppeal(appeal);
                          setIsReviewModalOpen(true);
                        }}
                        className="h-7 px-2.5 text-xs"
                      >
                        {appeal.status === 'pending' ? 'Review Appeal' : 'View Decision'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewAppealModal
        appeal={selectedAppeal}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAppeal(null);
        }}
      />
    </div>
  );
};
