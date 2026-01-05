/**
 * Notification Item Component
 * 
 * Displays a single notification with actions
 */

import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useMarkAsRead, useDeleteNotification } from '../hooks/useNotifications';
import { Notification } from '../api/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const markAsReadMutation = useMarkAsRead();
  const deleteMutation = useDeleteNotification();

  const isRead = notification.status === 'READ';
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleMarkAsRead = () => {
    if (!isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(notification.id);
  };

  return (
    <Card
      className={cn(
        'transition-colors',
        !isRead && 'border-primary/50 bg-primary/5'
      )}
      data-testid={`notification-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Bell
              className={cn(
                'h-5 w-5',
                !isRead ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4
                  className={cn(
                    'text-sm font-semibold mb-1',
                    !isRead && 'font-bold'
                  )}
                >
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <span className="capitalize">{notification.type.toLowerCase()}</span>
                  {notification.channel && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{notification.channel.toLowerCase().replace('_', ' ')}</span>
                    </>
                  )}
                </div>
              </div>

              {!isRead && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" data-testid="unread-indicator" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              {!isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsRead}
                  disabled={markAsReadMutation.isPending}
                  data-testid="mark-as-read-button"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid="delete-button"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
