/**
 * Tests for DataOverview Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DataOverview from '../../../components/privacy/DataOverview';
import { PrivacyCenterOverview } from '../../../api/privacy';

describe('DataOverview Component', () => {
  const mockData: PrivacyCenterOverview = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      createdAt: '2024-01-01',
      dataRetentionDays: 365,
    },
    dataCategories: [
      {
        category: 'PROFILE',
        description: 'Personal profile information',
        count: 15,
        lastUpdated: '2024-01-15',
        fields: ['name', 'email', 'phone'],
        purpose: 'Account management',
        retention: '365 days',
      },
      {
        category: 'USAGE',
        description: 'Application usage data',
        count: 125,
        lastUpdated: '2024-01-20',
      },
    ],
    consents: [],
    privacyPreferences: {
      emailMarketing: false,
      smsMarketing: false,
      pushNotifications: true,
      shareWithPartners: false,
      profileVisibility: 'PRIVATE',
    },
    dataRequests: { exports: [], deletions: [] },
    cookiePreferences: {
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    },
    connectedAccounts: [],
    recentAccess: [],
    metrics: {
      totalDataPoints: 140,
      activeConsents: 2,
      pendingRequests: 0,
    },
  };

  it('should render section title', () => {
    render(<DataOverview data={mockData} />);
    expect(screen.getByText('Data Overview')).toBeInTheDocument();
  });

  it('should display total data points', () => {
    render(<DataOverview data={mockData} />);
    expect(screen.getByText('Total Data Points')).toBeInTheDocument();
    expect(screen.getByText('140')).toBeInTheDocument();
  });

  it('should display data categories', () => {
    render(<DataOverview data={mockData} />);

    expect(screen.getByText('PROFILE')).toBeInTheDocument();
    expect(screen.getByText('Personal profile information')).toBeInTheDocument();
    expect(screen.getByText('15 data points')).toBeInTheDocument();

    expect(screen.getByText('USAGE')).toBeInTheDocument();
    expect(screen.getByText('Application usage data')).toBeInTheDocument();
    expect(screen.getByText('125 data points')).toBeInTheDocument();
  });

  it('should display data retention period', () => {
    render(<DataOverview data={mockData} />);
    expect(screen.getByText('Data Retention Period')).toBeInTheDocument();
    expect(screen.getByText('365 days')).toBeInTheDocument();
  });

  it('should show expandable details for categories', () => {
    render(<DataOverview data={mockData} />);

    // The parent div.category-item has the role="button" attribute
    const profileCategory = screen.getByText('PROFILE').closest('.category-item');
    expect(profileCategory).toHaveAttribute('role', 'button');
  });

  it('should handle empty data categories', () => {
    const emptyData = { ...mockData, dataCategories: [] };
    render(<DataOverview data={emptyData} />);
    expect(screen.getByText('No data categories found')).toBeInTheDocument();
  });
});