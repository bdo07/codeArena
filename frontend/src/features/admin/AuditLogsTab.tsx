import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  Ban,
  UserCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ModerationAuditLog } from '@/types';

export const AuditLogsTab: React.FC = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ModerationAuditLog | null>(null);

  const { data, isLoading, isError } = useQuery<{
    logs: {
      data: ModerationAuditLog[];
      current_page: number;
      last_page: number;
      total: number;
    };
    action_counts: Record<string, number>;
  }>({
    queryKey: ['admin-audit-logs', search, actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      params.append('page', String(page));
      params.append('per_page', '20');

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs = data?.logs?.data || [];
  const pagination = data?.logs;
  const actionCounts = data?.action_counts || {};

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'warn':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'suspend':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'unsuspend':
      case 'unban':
      case 'restore':
      case 'appeal_approved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'ban':
      case 'force_delete':
      case 'appeal_rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'soft_delete':
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
      default:
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-500" />
            {t('admin.audit.title', 'Immutable Moderation Audit Log')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              'admin.audit.subtitle',
              'Tamper-evident, append-only record of all administrative warnings, suspensions, bans, deletions, and role assignments.'
            )}
          </p>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          Append-Only ({pagination?.total ?? 0} events)
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.audit.searchPlaceholder', 'Search by admin, target username, or reason...')}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
        >
          <option value="all">All Moderation Actions</option>
          <option value="warn">Warnings ({actionCounts['warn'] ?? 0})</option>
          <option value="suspend">Suspensions ({actionCounts['suspend'] ?? 0})</option>
          <option value="unsuspend">Unsuspends ({actionCounts['unsuspend'] ?? 0})</option>
          <option value="ban">Bans ({actionCounts['ban'] ?? 0})</option>
          <option value="unban">Unbans ({actionCounts['unban'] ?? 0})</option>
          <option value="role_change">Role Changes ({actionCounts['role_change'] ?? 0})</option>
          <option value="soft_delete">Soft Deletions ({actionCounts['soft_delete'] ?? 0})</option>
          <option value="restore">Restorations ({actionCounts['restore'] ?? 0})</option>
          <option value="force_delete">Force Purges ({actionCounts['force_delete'] ?? 0})</option>
          <option value="appeal_approved">Appeals Approved ({actionCounts['appeal_approved'] ?? 0})</option>
          <option value="appeal_rejected">Appeals Rejected ({actionCounts['appeal_rejected'] ?? 0})</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4">{t('admin.audit.timestamp', 'Timestamp')}</th>
                <th className="py-3 px-4">{t('admin.audit.action', 'Action')}</th>
                <th className="py-3 px-4">{t('admin.audit.admin', 'Administrator')}</th>
                <th className="py-3 px-4">{t('admin.audit.targetUser', 'Target User')}</th>
                <th className="py-3 px-4">{t('admin.audit.reason', 'Public Reason & Internal Notes')}</th>
                <th className="py-3 px-4 text-right">{t('admin.table.actions', 'Details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    {t('common.loading', 'Loading audit logs...')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-500">
                    {t('admin.audit.errorLoading', 'Failed to load audit logs.')}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    {t('admin.audit.noLogsMatch', 'No audit logs found.')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Admin */}
                    <td className="py-3 px-4">
                      {log.admin ? (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          @{log.admin.username}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic font-mono">System Console</span>
                      )}
                    </td>

                    {/* Target User */}
                    <td className="py-3 px-4">
                      {log.target_user ? (
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          @{log.target_user.username}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">
                          {log.metadata?.purged_username ? `@${log.metadata.purged_username} (Purged)` : 'N/A'}
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="space-y-1">
                        <p className="truncate text-zinc-800 dark:text-zinc-200" title={log.reason}>
                          {log.reason}
                        </p>
                        {log.internal_notes && (
                          <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-mono">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Internal note attached</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Details button */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} entries)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getActionBadgeColor(
                    selectedLog.action
                  )}`}
                >
                  {selectedLog.action}
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Audit Log #{selectedLog.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <div>
                  <span className="text-zinc-500 block">Administrator:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLog.admin ? `@${selectedLog.admin.username} (${selectedLog.admin.email})` : 'System Console'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Target Account:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedLog.target_user ? `@${selectedLog.target_user.username}` : selectedLog.metadata?.purged_username || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">IP Address:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {selectedLog.ip_address || '127.0.0.1'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Logged Timestamp:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Public Justification:
                </span>
                <p className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {selectedLog.reason}
                </p>
              </div>

              {selectedLog.internal_notes && (
                <div>
                  <span className="font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    Internal Moderator Notes (Admin Eyes Only):
                  </span>
                  <p className="p-2.5 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-900 dark:text-violet-200">
                    {selectedLog.internal_notes}
                  </p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="font-semibold text-zinc-500 block mb-1">Attached Metadata:</span>
                  <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
