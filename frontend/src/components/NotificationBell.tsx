/**
 * Notification Bell Component
 * 
 * Shows notification bell icon with unread count badge
 * Opens dropdown with recent notifications
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useUnreadCount, useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications({ limit: 5 });

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs',
              'flex items-center justify-center font-bold',
              unreadCount > 99 && 'text-[10px] px-1'
            )}
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                  {unreadCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[400px]">
                {notificationsLoading ? (
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-3 hover:bg-muted/50 transition-colors">
                        <NotificationItem notification={notification} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/notifications">View All Notifications</Link>
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
