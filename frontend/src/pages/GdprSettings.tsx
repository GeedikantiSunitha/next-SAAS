/**
 * GDPR Settings Page
 * 
 * Main page for GDPR compliance features:
 * - Consent Management
 * - Data Deletion Request
 * - Data Export (optional)
 */

import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ConsentManagement } from '../components/ConsentManagement';
import { DataDeletionRequest } from '../components/DataDeletionRequest';
import { Shield, CheckCircle, Trash2, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export const GdprSettings = () => {
  const [activeTab, setActiveTab] = useState<'consent' | 'deletion'>('consent');

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-8 w-8" />
                GDPR Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your privacy preferences and data rights
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('consent')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'consent'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Consent Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('deletion')}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'deletion'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Data Deletion
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'consent' && <ConsentManagement />}
            {activeTab === 'deletion' && <DataDeletionRequest />}
          </div>
        </div>
      </div>
    </Layout>
  );
};
