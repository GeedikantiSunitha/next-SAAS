/**
 * Notification Preferences Component
 * 
 * Manages user notification preferences
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useNotificationPreferences, useUpdatePreferences } from '../hooks/useNotifications';
import { Settings, Mail, Bell, MessageSquare } from 'lucide-react';
import { Label } from './ui/label';

export const NotificationPreferences = () => {
  const { data: preferences, isLoading, error } = useNotificationPreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  const handleToggle = (key: 'emailEnabled' | 'inAppEnabled' | 'smsEnabled') => {
    if (!preferences) return;

    updatePreferencesMutation.mutate({
      [key]: !preferences[key],
    });
  };

  if (isLoading) {
    return (
      <Card data-testid="preferences-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
            <p>Error loading preferences</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-enabled" className="cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <input
              id="email-enabled"
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
              disabled={updatePreferencesMutation.isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in-app-enabled" className="cursor-pointer">
                  In-App Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the app
                </p>
              </div>
            </div>
            <input
              id="in-app-enabled"
              type="checkbox"
              checked={preferences.inAppEnabled}
              onChange={() => handleToggle('inAppEnabled')}
              disabled={updatePreferencesMutation.isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-enabled" className="cursor-pointer">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS (coming soon)
                </p>
              </div>
            </div>
            <input
              id="sms-enabled"
              type="checkbox"
              checked={preferences.smsEnabled}
              onChange={() => handleToggle('smsEnabled')}
              disabled={updatePreferencesMutation.isPending || true} // SMS not implemented yet
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
