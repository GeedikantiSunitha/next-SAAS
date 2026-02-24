/**
 * Checkout Component
 * 
 * Payment checkout form with Stripe integration
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCreatePayment, useCapturePayment } from '../hooks/usePayments';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
// Currency type imported but not used directly in this file

const checkoutSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['USD', 'INR', 'EUR', 'GBP']),
  description: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Stripe Elements requires amount > 0 or it throws IntegrationError on mount.
// Use a nonzero default; the real amount is set when the user submits.
export const DEFAULT_STRIPE_ELEMENTS_AMOUNT = 100;

// Initialize Stripe with publishable key
// Note: VITE_STRIPE_PUBLISHABLE_KEY must be set in environment variables
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

const CheckoutForm = () => {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const createPayment = useCreatePayment();
  const capturePayment = useCapturePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      currency: 'USD',
    },
  });

  const amount = watch('amount');

  const onSubmit = async (data: CheckoutFormData) => {
    if (!stripe || !elements) {
      toast({
        title: 'Stripe not loaded',
        description: 'Please wait for Stripe to initialize.',
        variant: 'error',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent on backend
      // Stripe expects amount in smallest currency unit (cents for USD, paise for INR, etc.)
      const amountInCents = Math.round(data.amount * 100);
      const payment = await createPayment.mutateAsync({
        amount: amountInCents,
        currency: data.currency,
        description: data.description,
        provider: 'STRIPE',
      });

      if (!payment.clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(payment.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast({
          title: 'Payment failed',
          description: error.message || 'Payment could not be processed.',
          variant: 'error',
        });
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
        // With manual capture, Stripe returns requires_capture; call backend to capture so DB shows SUCCEEDED
        try {
          await capturePayment.mutateAsync({ id: payment.id });
        } catch (captureErr: any) {
          const errMsg = String(captureErr?.response?.data?.error || captureErr?.response?.data?.message || '').toLowerCase();
          if (captureErr?.response?.status !== 400 || !errMsg.includes('already captured')) {
            toast({
              title: 'Capture failed',
              description: captureErr?.message || 'Payment confirmed but capture failed.',
              variant: 'error',
            });
            return;
          }
        }
        toast({
          title: 'Payment successful!',
          description: `Your payment of ${data.currency} ${data.amount} has been processed.`,
        });
        window.location.href = `/payments/success?payment_id=${payment.id}`;
      }
    } catch (error: any) {
      toast({
        title: 'Payment failed',
        description: error.message || 'An error occurred during payment.',
        variant: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />
      </div>

      <div>
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          {...register('currency')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="USD">USD ($)</option>
          <option value="INR">INR (₹)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          placeholder="Payment description"
          {...register('description')}
          error={errors.description?.message}
        />
      </div>

      <div>
        <Label>Card Details</Label>
        <div className="mt-2 p-4 border rounded-md bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing || createPayment.isPending}
      >
        {isProcessing || createPayment.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {amount ? `${watch('currency')} ${amount.toFixed(2)}` : ''}
          </>
        )}
      </Button>
    </form>
  );
};

export const Checkout = () => {
  const options: StripeElementsOptions = {
    mode: 'payment',
    currency: 'usd',
    amount: DEFAULT_STRIPE_ELEMENTS_AMOUNT,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Checkout
        </CardTitle>
        <CardDescription>Enter your payment details to complete the transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      </CardContent>
    </Card>
  );
};
