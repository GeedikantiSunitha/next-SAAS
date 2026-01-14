/**
 * Payment Success Page
 * 
 * Displays payment confirmation after successful payment
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { getPaymentById } from '../api/payments';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      getPaymentById(paymentId)
        .then((data) => {
          setPayment(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 py-12 px-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your payment has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    {payment.currency} {Number(payment.amount / 100).toFixed(2)}
                  </span>
                </div>
                {payment.description && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <span className="text-sm">{payment.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-semibold text-green-600">{payment.status}</span>
                </div>
                {payment.providerPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Transaction ID:</span>
                    <span className="text-xs font-mono">{payment.providerPaymentId.slice(0, 20)}...</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild className="w-full">
                <Link to="/payments" className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  View Payment History
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard" className="flex items-center justify-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
