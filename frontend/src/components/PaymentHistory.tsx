/**
 * Payment History Component
 * 
 * Displays user's payment history
 */

import { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  SUCCEEDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
};

/** API returns amount in smallest unit (cents for USD). Display in major units. */
function formatPaymentAmount(amount: number, currency: string): string {
  const major = Number(amount) / 100;
  return `${currency} ${major.toFixed(2)}`;
}

export const PaymentHistory = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const params = statusFilter ? { status: statusFilter as any } : undefined;
  const { data, isLoading, error } = usePayments(params);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">Failed to load payment history</p>
        </CardContent>
      </Card>
    );
  }

  const total = data?.totalCount ?? data?.pagination?.total ?? data?.payments?.length ?? 0;
  const hasPayments = data && data.payments.length > 0;

  if (!data || !hasPayments) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your payment transactions will appear here</CardDescription>
            </div>
            <select
              data-testid="payment-history-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">No payments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              {total} payment{total !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <select
            data-testid="payment-history-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.payments.map((payment) => (
            <div
              key={payment.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {payment.description || `Payment #${payment.id.slice(0, 8)}`}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {formatPaymentAmount(Number(payment.amount), payment.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  {payment.providerPaymentId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Provider ID: {payment.providerPaymentId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
