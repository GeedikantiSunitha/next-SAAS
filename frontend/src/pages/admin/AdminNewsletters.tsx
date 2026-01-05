/**
 * Admin Newsletters Page
 * 
 * Admin page for managing newsletters
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useNewsletters, useCreateNewsletter, useSendNewsletter, useScheduleNewsletter, useSubscriptions } from '../../hooks/useNewsletter';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Mail, Plus, Send, Loader2, Calendar, Users } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Newsletter } from '../../api/newsletter';

const createNewsletterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
});

type CreateNewsletterFormData = z.infer<typeof createNewsletterSchema>;

export const AdminNewsletters = () => {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'newsletters' | 'subscriptions'>('newsletters');
  const [selectedNewsletterForSchedule, setSelectedNewsletterForSchedule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const { data: newsletters, isLoading } = useNewsletters();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const createNewsletter = useCreateNewsletter();
  const sendNewsletter = useSendNewsletter();
  const scheduleNewsletter = useScheduleNewsletter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateNewsletterFormData>({
    resolver: zodResolver(createNewsletterSchema),
  });

  const onSubmit = (data: CreateNewsletterFormData) => {
    createNewsletter.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Newsletter created!',
          description: 'The newsletter has been created successfully.',
        });
        reset();
        setShowCreateForm(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to create newsletter',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSend = (newsletterId: string) => {
    sendNewsletter.mutate(newsletterId, {
      onSuccess: (data) => {
        toast({
          title: 'Newsletter sent!',
          description: `Sent to ${data.sentCount} subscribers.`,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to send newsletter',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSchedule = (newsletterId: string) => {
    if (!scheduleDate) {
      toast({
        title: 'Date required',
        description: 'Please select a date and time for scheduling.',
        variant: 'destructive',
      });
      return;
    }

    scheduleNewsletter.mutate(
      { id: newsletterId, scheduledAt: new Date(scheduleDate) },
      {
        onSuccess: () => {
          toast({
            title: 'Newsletter scheduled!',
            description: 'The newsletter has been scheduled successfully.',
          });
          setSelectedNewsletterForSchedule(null);
          setScheduleDate('');
        },
        onError: (error: any) => {
          toast({
            title: 'Failed to schedule newsletter',
            description: error.message || 'Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'text-green-600';
      case 'SCHEDULED':
        return 'text-blue-600';
      case 'DRAFT':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter Management</h1>
            <p className="text-gray-600 mt-1">Create and manage newsletters</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Newsletter
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('newsletters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'newsletters'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Newsletters
              </div>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subscriptions ({subscriptions?.length || 0})
              </div>
            </button>
          </nav>
        </div>

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Newsletter</CardTitle>
              <CardDescription>Fill in the details to create a new newsletter</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    error={errors.title?.message}
                    placeholder="Newsletter Title"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    {...register('subject')}
                    error={errors.subject?.message}
                    placeholder="Email Subject"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content (HTML)</Label>
                  <textarea
                    id="content"
                    {...register('content')}
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="<p>Newsletter content...</p>"
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createNewsletter.isPending}>
                    {createNewsletter.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Newsletter'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'newsletters' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Newsletters</CardTitle>
                <CardDescription>All newsletters</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : newsletters && newsletters.length > 0 ? (
                  <div className="space-y-4">
                    {newsletters.map((newsletter: Newsletter) => (
                      <div
                        key={newsletter.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <h3 className="font-semibold">{newsletter.title}</h3>
                            <span className={`text-sm ${getStatusColor(newsletter.status)}`}>
                              {newsletter.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{newsletter.subject}</p>
                          {newsletter.scheduledAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Scheduled: {new Date(newsletter.scheduledAt).toLocaleString()}
                            </p>
                          )}
                          {newsletter.status === 'SENT' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Sent to {newsletter.sentCount} subscribers
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {newsletter.status === 'DRAFT' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedNewsletterForSchedule(newsletter.id)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSend(newsletter.id)}
                                disabled={sendNewsletter.isPending}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send Now
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No newsletters found</p>
                )}
              </CardContent>
            </Card>

            {/* Schedule Modal */}
            {selectedNewsletterForSchedule && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Newsletter</CardTitle>
                  <CardDescription>Select date and time to schedule the newsletter</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="schedule-date">Schedule Date & Time</Label>
                      <Input
                        id="schedule-date"
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSchedule(selectedNewsletterForSchedule)}
                        disabled={scheduleNewsletter.isPending || !scheduleDate}
                      >
                        {scheduleNewsletter.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedNewsletterForSchedule(null);
                          setScheduleDate('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'subscriptions' && (
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>All newsletter subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-2">
                  {subscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{subscription.email}</p>
                          {subscription.isActive ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Subscribed: {new Date(subscription.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No subscriptions found</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
