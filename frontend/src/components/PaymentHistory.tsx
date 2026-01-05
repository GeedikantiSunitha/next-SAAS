/**
 * Payment History Component
 * 
 * Displays user's payment history
 */

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

export const PaymentHistory = () => {
  const { data, isLoading, error } = usePayments();

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

  if (!data || data.payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your payment transactions will appear here</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          {data.pagination.total} payment{data.pagination.total !== 1 ? 's' : ''} found
        </CardDescription>
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
                        {payment.currency} {Number(payment.amount).toFixed(2)}
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
