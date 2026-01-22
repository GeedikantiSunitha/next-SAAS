/**
 * DataOverview Component
 * Displays summary of user's data categories and metrics
 */

import React, { useState } from 'react';
import { PrivacyCenterOverview } from '../../api/privacy';

interface DataOverviewProps {
  data: PrivacyCenterOverview;
}

const DataOverview: React.FC<DataOverviewProps> = ({ data }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="data-overview">
      <h2>Data Overview</h2>

      {/* Metrics Summary */}
      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Total Data Points</h3>
          <div className="metric-value">{data.metrics.totalDataPoints}</div>
        </div>
        <div className="metric-card">
          <h3>Data Retention Period</h3>
          <div className="metric-value">{data.user.dataRetentionDays} days</div>
        </div>
        <div className="metric-card">
          <h3>Active Consents</h3>
          <div className="metric-value">{data.metrics.activeConsents}</div>
        </div>
        <div className="metric-card">
          <h3>Pending Requests</h3>
          <div className="metric-value">{data.metrics.pendingRequests}</div>
        </div>
      </div>

      {/* Data Categories */}
      <div className="data-categories">
        <h3>Data Categories</h3>
        {data.dataCategories.length === 0 ? (
          <p className="empty-state">No data categories found</p>
        ) : (
          <div className="categories-list">
            {data.dataCategories.map((category) => (
              <div
                key={category.category}
                className={`category-item ${expandedCategory === category.category ? 'expanded' : ''}`}
                role="button"
              >
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category.category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleCategory(category.category);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="category-info">
                    <h4>{category.category}</h4>
                    <p className="category-description">{category.description}</p>
                    <span className="data-count">{category.count} data points</span>
                  </div>
                  <div className="category-toggle">
                    <span>{expandedCategory === category.category ? '−' : '+'}</span>
                  </div>
                </div>

                {expandedCategory === category.category && (
                  <div className="category-details">
                    {category.fields && (
                      <div className="detail-row">
                        <strong>Fields:</strong>
                        <ul>
                          {category.fields.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {category.purpose && (
                      <div className="detail-row">
                        <strong>Purpose:</strong> {category.purpose}
                      </div>
                    )}
                    {category.retention && (
                      <div className="detail-row">
                        <strong>Retention:</strong> {category.retention}
                      </div>
                    )}
                    {category.lastUpdated && (
                      <div className="detail-row">
                        <strong>Last Updated:</strong>{' '}
                        {new Date(category.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Information */}
      <div className="user-info">
        <h3>Account Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{data.user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Account Created:</span>
            <span className="info-value">
              {new Date(data.user.createdAt).toLocaleDateString()}
            </span>
          </div>
          {data.metrics.daysUntilDeletion && (
            <div className="info-item warning">
              <span className="info-label">Scheduled Deletion:</span>
              <span className="info-value">
                {data.metrics.daysUntilDeletion} days remaining
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataOverview;