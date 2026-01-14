/**
 * Notifications Page
 * 
 * Main page for viewing and managing notifications
 */

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { NotificationList } from '../components/NotificationList';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { Bell, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'preferences'>('all');

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-8 w-8" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">Manage your notifications and preferences</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  All
                </div>
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'unread'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Unread
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'preferences'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Preferences
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'all' && <NotificationList unreadOnly={false} />}
            {activeTab === 'unread' && <NotificationList unreadOnly={true} />}
            {activeTab === 'preferences' && <NotificationPreferences />}
          </div>
        </div>
      </div>
    </Layout>
  );
};
