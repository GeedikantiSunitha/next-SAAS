/**
 * Notification List Component
 * 
 * Displays a list of notifications with actions
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { NotificationItem } from './NotificationItem';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { CheckCircle2, Bell } from 'lucide-react';

interface NotificationListProps {
  unreadOnly?: boolean;
}

export const NotificationList = ({ unreadOnly = false }: NotificationListProps) => {
  const { data: notifications, isLoading, error } = useNotifications({ unreadOnly });
  const markAllAsReadMutation = useMarkAllAsRead();

  const hasUnread = notifications?.some((n) => n.status !== 'READ') ?? false;

  if (isLoading) {
    return (
      <Card data-testid="notifications-loading">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications</p>
            {unreadOnly && (
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {unreadOnly ? 'Unread Notifications' : 'All Notifications'}
          </CardTitle>
          {hasUnread && !unreadOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark All as Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
