import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

const canRefund = (payment: { status?: string }) => {
  const s = (payment?.status ?? '').toLowerCase();
  return (s === 'succeeded' || s === 'completed') && s !== 'refunded' && s !== 'partially_refunded';
};

export const AdminPayments = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const limit = 20;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = { page, limit, ...(statusFilter && { status: statusFilter }) };

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin', 'payments', queryParams],
    queryFn: () => adminApi.getPayments(queryParams),
  });

  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminApi.getSubscriptions(),
  });

  const payments = paymentsData?.data?.payments || [];
  const subscriptions = subscriptionsData?.data?.subscriptions || [];
  const pagination = paymentsData?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.refundPayment(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      toast({
        title: 'Refund processed',
        description: 'The refund has been submitted to the payment provider. The list will update shortly.',
        variant: 'success',
      });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error ?? err?.message ?? 'Refund failed';
      toast({
        title: 'Refund failed',
        description: String(message),
        variant: 'error',
      });
    },
  });

  const handleRefund = (payment: { id: string; status?: string }) => {
    if (!canRefund(payment)) return;
    if (!window.confirm('Refund this payment? This will process a full refund via the payment provider.')) return;
    refundMutation.mutate({ id: payment.id, reason: 'Admin refund' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">View and manage payments and subscriptions</p>
        </div>

        {/* Subscriptions Overview */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
          {subscriptionsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : subscriptions.length === 0 ? (
            <p className="text-gray-600">No subscriptions found</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{sub.user?.email || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{sub.plan} - {sub.status}</p>
                  </div>
                  {getStatusIcon(sub.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Recent Payments</h2>
            <select
              data-testid="payment-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            </select>
          </div>
          {paymentsLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No payments found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.user?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${payment.amount || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className="text-sm text-gray-900">{payment.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {canRefund(payment) ? (
                            <button
                              type="button"
                              onClick={() => handleRefund(payment)}
                              disabled={refundMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden />
                              Refund
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} payments
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 border rounded disabled:opacity-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </button>
                    <button
                      className="px-4 py-2 border rounded disabled:opacity-50"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
