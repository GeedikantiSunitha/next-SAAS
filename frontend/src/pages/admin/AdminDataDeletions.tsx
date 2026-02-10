import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Play, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

type DeletionRequest = {
  id: string;
  userId: string;
  status: string;
  deletionType: string;
  requestedAt: string;
  scheduledFor: string | null;
  completedAt: string | null;
  reason: string | null;
  confirmedAt: string | null;
  user: { id: string; email: string | null; name: string | null };
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending (awaiting user email confirm)' },
  { value: 'CONFIRMED', label: 'Confirmed (ready to execute)' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' },
];

export const AdminDataDeletions = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'gdpr', 'deletion-requests', statusFilter],
    queryFn: () =>
      adminApi.getDeletionRequests(
        statusFilter ? { status: statusFilter } : undefined
      ),
  });

  const executeMutation = useMutation({
    mutationFn: (requestId: string) => adminApi.executeDeletionRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'gdpr', 'deletion-requests'] });
      toast({
        title: 'Deletion executed',
        description: 'Data deletion has been executed successfully.',
      });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error ?? err?.message ?? 'Execute failed';
      toast({
        title: 'Execute failed',
        description: String(message),
        variant: 'error',
      });
    },
  });

  const requests: DeletionRequest[] = data?.data ?? [];

  const handleExecute = (req: DeletionRequest) => {
    if (req.status !== 'CONFIRMED') return;
    if (
      !window.confirm(
        `Execute data deletion for ${req.user?.email ?? req.userId}? This will ${req.deletionType === 'HARD' ? 'permanently delete' : 'anonymize'} the user's data.`
      )
    )
      return;
    executeMutation.mutate(req.id);
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'CONFIRMED':
        return 'default';
      case 'PROCESSING':
        return 'secondary';
      case 'COMPLETED':
        return 'default';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Deletion Requests</h1>
          <p className="text-gray-600 mt-1">
            View and execute GDPR data deletion requests. Requests become executable after the user
            confirms via the link in their email.
          </p>
        </div>

        <div className="rounded-lg border bg-amber-50 border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Who approves?</strong> The user confirms their own request by clicking the link
            in the confirmation email (status becomes &quot;Confirmed&quot;). Here you execute
            confirmed requests: click &quot;Execute deletion&quot; for any request with status
            &quot;Confirmed&quot;.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Filter by status
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Deletion requests</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              Failed to load deletion requests. Please try again.
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No deletion requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Requested
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {req.user?.name ?? '—'}
                        </div>
                        <div className="text-sm text-gray-500">{req.user?.email ?? req.userId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(req.status)}>{req.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{req.deletionType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(req.requestedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {req.reason ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleExecute(req)}
                            disabled={executeMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute deletion
                          </Button>
                        )}
                        {req.status === 'PENDING' && (
                          <span className="text-xs text-gray-500">
                            Waiting for user to confirm via email
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
