/**
 * Newsletter Subscription Component
 * 
 * Allows users to subscribe/unsubscribe from newsletter
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSubscribe, useSubscription } from '../hooks/useNewsletter';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SubscribeFormData = z.infer<typeof subscribeSchema>;

export const NewsletterSubscription = () => {
  const { toast } = useToast();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const subscribe = useSubscribe();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
  });

  const onSubmit = (data: SubscribeFormData) => {
    subscribe.mutate(data.email, {
      onSuccess: () => {
        toast({
          title: 'Successfully subscribed!',
          description: 'You will receive our newsletter updates.',
        });
        reset();
      },
      onError: (error: any) => {
        toast({
          title: 'Subscription failed',
          description: error.message || 'Failed to subscribe. Please try again.',
          variant: 'error',
        });
      },
    });
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (subscription?.isActive) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">You're subscribed to our newsletter!</p>
              <p className="text-sm text-gray-600">{subscription.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Subscribe to Newsletter
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Get the latest updates and news delivered to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>


        <Button type="submit" className="w-full" disabled={subscribe.isPending}>
          {subscribe.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>
    </div>
  );
};
