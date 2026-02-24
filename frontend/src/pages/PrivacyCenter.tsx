/**
 * Privacy Center Page
 * Unified dashboard for managing all privacy-related settings
 * Uses same Layout (Header + Footer) as Dashboard/Profile for consistent navigation.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { privacyApi, PrivacyCenterOverview } from '../api/privacy';
import DataOverview from '../components/privacy/DataOverview';
import ConsentManager from '../components/privacy/ConsentManager';
import DataExport from '../components/privacy/DataExport';
import DataDeletion from '../components/privacy/DataDeletion';
import CookiePreferences from '../components/privacy/CookiePreferences';
import ConnectedAccounts from '../components/privacy/ConnectedAccounts';
import AccessLog from '../components/privacy/AccessLog';
import '../styles/PrivacyCenter.css';

const PrivacyCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Fetch privacy overview data
  const { data, isLoading, error, refetch } = useQuery<PrivacyCenterOverview>({
    queryKey: ['privacy-overview'],
    queryFn: () => privacyApi.getPrivacyOverview(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Update privacy preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: any) => privacyApi.updatePrivacyPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-overview'] });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: () => privacyApi.clearCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-overview'] });
    },
  });

  // Disconnect (unlink) an OAuth provider
  const disconnectAccountMutation = useMutation({
    mutationFn: (provider: string) => privacyApi.unlinkOAuthAccount(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-overview'] });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="privacy-center-loading">
          <div className="spinner"></div>
          <p>Loading privacy data...</p>
        </div>
      </Layout>
    );
  }

  if (error && !isLoading) {
    return (
      <Layout>
        <div className="privacy-center-error">
          <div className="error-message">
            <h2>Failed to load privacy data</h2>
            <p>{(error as Error).message}</p>
            <button onClick={() => refetch()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>No data available</div>
      </Layout>
    );
  }

  const handleDataUpdate = () => {
    refetch();
  };

  const handlePreferenceUpdate = (preferences: any) => {
    updatePreferencesMutation.mutate(preferences);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <DataOverview data={data} />;
      case 'consents':
        return <ConsentManager consents={data.consents} onUpdate={handleDataUpdate} />;
      case 'export':
        return <DataExport exports={data.dataRequests.exports} onUpdate={handleDataUpdate} />;
      case 'deletion':
        return <DataDeletion deletions={data.dataRequests.deletions} onUpdate={handleDataUpdate} />;
      case 'cookies':
        return <CookiePreferences preferences={data.cookiePreferences} onUpdate={handleDataUpdate} />;
      case 'accounts':
        return (
          <ConnectedAccounts
            accounts={data.connectedAccounts}
            onDisconnect={(provider) => disconnectAccountMutation.mutate(provider)}
          />
        );
      case 'access':
        return <AccessLog initialData={data.recentAccess} />;
      default:
        return <DataOverview data={data} />;
    }
  };

  return (
    <Layout>
    <div className="privacy-center-container mobile-view" data-testid="privacy-center-container">
      <div className="privacy-center-header">
        <h1>Privacy Center</h1>
        <p className="subtitle">
          Manage your privacy settings and personal data in one place
        </p>
      </div>

      <div className="privacy-center-nav">
        <button
          className={`nav-button ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Data Overview
        </button>
        <button
          className={`nav-button ${activeSection === 'consents' ? 'active' : ''}`}
          onClick={() => setActiveSection('consents')}
        >
          Consent Management
        </button>
        <button
          className={`nav-button ${activeSection === 'export' ? 'active' : ''}`}
          onClick={() => setActiveSection('export')}
        >
          Data Export
        </button>
        <button
          className={`nav-button ${activeSection === 'deletion' ? 'active' : ''}`}
          onClick={() => setActiveSection('deletion')}
        >
          Data Deletion
        </button>
        <button
          className={`nav-button ${activeSection === 'cookies' ? 'active' : ''}`}
          onClick={() => setActiveSection('cookies')}
        >
          Cookie Preferences
        </button>
        <button
          className={`nav-button ${activeSection === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveSection('accounts')}
        >
          Connected Accounts
        </button>
        <button
          className={`nav-button ${activeSection === 'access' ? 'active' : ''}`}
          onClick={() => setActiveSection('access')}
        >
          Access Log
        </button>
      </div>

      <div className="privacy-center-content">
        {renderSection()}
      </div>

      {/* Privacy Preferences Section - Always visible */}
      <div className="privacy-preferences-section">
        <h2>Privacy Preferences</h2>
        <div className="preference-toggles">
          <div className="preference-item">
            <label htmlFor="email-marketing">
              <span>Email Marketing</span>
              <input
                id="email-marketing"
                type="checkbox"
                role="switch"
                aria-label="Email Marketing"
                checked={data.privacyPreferences.emailMarketing}
                onChange={(e) => handlePreferenceUpdate({ emailMarketing: e.target.checked })}
              />
            </label>
          </div>
          <div className="preference-item">
            <label htmlFor="sms-marketing">
              <span>SMS Marketing</span>
              <input
                id="sms-marketing"
                type="checkbox"
                role="switch"
                aria-label="SMS Marketing"
                checked={data.privacyPreferences.smsMarketing}
                onChange={(e) => handlePreferenceUpdate({ smsMarketing: e.target.checked })}
              />
            </label>
          </div>
          <div className="preference-item">
            <label htmlFor="push-notifications">
              <span>Push Notifications</span>
              <input
                id="push-notifications"
                type="checkbox"
                role="switch"
                aria-label="Push Notifications"
                checked={data.privacyPreferences.pushNotifications}
                onChange={(e) => handlePreferenceUpdate({ pushNotifications: e.target.checked })}
              />
            </label>
          </div>
          <div className="preference-item">
            <label htmlFor="share-partners">
              <span>Share with Partners</span>
              <input
                id="share-partners"
                type="checkbox"
                role="switch"
                aria-label="Share with Partners"
                checked={data.privacyPreferences.shareWithPartners}
                onChange={(e) => handlePreferenceUpdate({ shareWithPartners: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="privacy-quick-actions">
        <button
          className="btn btn-secondary"
          onClick={() => clearCacheMutation.mutate()}
          disabled={clearCacheMutation.isPending}
        >
          {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>
    </div>
    </Layout>
  );
};

export default PrivacyCenter;