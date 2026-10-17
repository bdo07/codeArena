import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Trash2,
  Clock,
  Ban,
  UserCheck,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AdminUserListItem } from '@/types';
import { SuspendUserModal } from './modals/SuspendUserModal';
import { BanUserModal } from './modals/BanUserModal';
import { DeleteUserModal } from './modals/DeleteUserModal';
import { WarnUserModal } from './modals/WarnUserModal';
import { UserDetailModal } from './modals/UserDetailModal';

export const UserManagementTab: React.FC = () => {
  const { t } = useTranslation();

  // Filters and pagination state
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'admin' | 'user'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'suspended' | 'banned' | 'deleted'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'username' | 'xp' | 'status'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Selected user and modal states
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [detailUserId, setDetailUserId] = useState<number | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Query users
  const { data, isLoading, isError, refetch } = useQuery<{
    users: {
      data: AdminUserListItem[];
      current_page: number;
      last_page: number;
      total: number;
      per_page: number;
    };
    stats: {
      total: number;
      active: number;
      suspended: number;
      banned: number;
      deleted: number;
      admins: number;
    };
  }>({
    queryKey: ['admin-users', search, role, status, sortBy, sortDir, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role !== 'all') params.append('role', role);
      if (status !== 'all') params.append('status', status);
      params.append('sort_by', sortBy);
      params.append('sort_dir', sortDir);
      params.append('page', String(page));
      params.append('per_page', '15');

      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    },
  });

  const users = data?.users?.data || [];
  const stats = data?.stats;
  const pagination = data?.users;

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.totalUsers', 'Total Users')}
          </span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats?.total ?? '—'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.activeUsers', 'Active Accounts')}
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.active ?? '—'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.suspendedUsers', 'Suspended')}
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats?.suspended ?? '—'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.bannedUsers', 'Banned')}
          </span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">
            {stats?.banned ?? '—'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.deletedUsers', 'Soft-Deleted')}
          </span>
          <span className="text-xl font-bold text-zinc-500">
            {stats?.deleted ?? '—'}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            {t('admin.stats.admins', 'Administrators')}
          </span>
          <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {stats?.admins ?? '—'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t(
              'admin.users.searchPlaceholder',
              'Search by username, full name, or email...'
            )}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="all">{t('admin.filters.allRoles', 'All Roles')}</option>
            <option value="user">{t('admin.filters.regularUsers', 'Regular Users')}</option>
            <option value="admin">{t('admin.filters.adminsOnly', 'Admins Only')}</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="all">{t('admin.filters.allStatuses', 'All Statuses')}</option>
            <option value="active">{t('admin.filters.activeOnly', 'Active')}</option>
            <option value="suspended">{t('admin.filters.suspendedOnly', 'Suspended')}</option>
            <option value="banned">{t('admin.filters.bannedOnly', 'Banned')}</option>
            <option value="deleted">{t('admin.filters.deletedOnly', 'Deleted (Recovery)')}</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="created_at">{t('admin.sort.joinedDate', 'Joined Date')}</option>
            <option value="username">{t('admin.sort.username', 'Username')}</option>
            <option value="xp">{t('admin.sort.xp', 'Verified XP')}</option>
            <option value="status">{t('admin.sort.status', 'Account Status')}</option>
          </select>

          {/* Sort Direction Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="text-xs px-2 h-8"
          >
            {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                <th className="py-3 px-4">{t('admin.table.user', 'User')}</th>
                <th className="py-3 px-4">{t('admin.table.role', 'Role')}</th>
                <th className="py-3 px-4">{t('admin.table.status', 'Account Status')}</th>
                <th className="py-3 px-4">{t('admin.table.levelXp', 'Level & XP')}</th>
                <th className="py-3 px-4">{t('admin.table.joined', 'Registration')}</th>
                <th className="py-3 px-4 text-right">{t('admin.table.actions', 'Moderation Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    {t('common.loading', 'Loading registered users...')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-red-500">
                    {t('admin.users.errorLoading', 'Failed to load users list. Please refresh.')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {t('admin.users.noUsersMatch', 'No users found matching your filters.')}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={u.avatar_url}
                          name={u.name}
                          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                        />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {u.name}
                            {u.moderation_actions_count > 0 && (
                              <span
                                title="Moderation actions recorded"
                                className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              >
                                {u.moderation_actions_count} logs
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            @{u.username} • {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          User
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.is_deleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 line-through">
                          Soft-Deleted
                        </span>
                      ) : u.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          <Ban className="w-3 h-3" />
                          Banned
                        </span>
                      ) : u.is_suspended ? (
                        <span
                          title={u.suspended_until ? `Until ${new Date(u.suspended_until).toLocaleDateString()}` : 'Indefinite'}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        >
                          <Clock className="w-3 h-3" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Level & XP */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Lvl {u.level}</span>
                      <span className="text-zinc-400 ml-1.5">({u.xp} XP)</span>
                    </td>

                    {/* Joined date */}
                    <td className="py-3 px-4 text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetailUserId(u.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px]"
                          title={t('admin.actions.viewDetails', 'View details & history')}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsWarnModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
                          title={t('admin.actions.warn', 'Issue warning')}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsSuspendModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          title={t('admin.actions.suspend', 'Suspend user')}
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsBanModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-red-600 dark:text-red-400 hover:bg-red-500/10"
                          title={t('admin.actions.ban', 'Permanently ban')}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDeleteModalOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-zinc-500 hover:text-red-600 hover:bg-red-500/10"
                          title={t('admin.actions.delete', 'Delete account')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
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

      {/* Modals */}
      <SuspendUserModal
        user={selectedUser}
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <BanUserModal
        user={selectedUser}
        isOpen={isBanModalOpen}
        onClose={() => {
          setIsBanModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <DeleteUserModal
        user={selectedUser}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <WarnUserModal
        user={selectedUser}
        isOpen={isWarnModalOpen}
        onClose={() => {
          setIsWarnModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <UserDetailModal
        userId={detailUserId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailUserId(null);
        }}
      />
    </div>
  );
};
