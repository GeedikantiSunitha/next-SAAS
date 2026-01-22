/**
 * CookiePreferences Component
 * Manages cookie consent and preferences
 */

import React, { useState } from 'react';
import { privacyApi } from '../../api/privacy';

interface CookiePreferencesProps {
  preferences: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  onUpdate: () => void;
}

const CookiePreferences: React.FC<CookiePreferencesProps> = ({ preferences, onUpdate }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const cookieCategories = [
    {
      key: 'essential',
      name: 'Essential Cookies',
      description: 'Required for the website to function properly. These cannot be disabled.',
      alwaysEnabled: true,
    },
    {
      key: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how you use our website and improve your experience.',
      alwaysEnabled: false,
    },
    {
      key: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to show relevant advertisements and track ad campaign effectiveness.',
      alwaysEnabled: false,
    },
    {
      key: 'functional',
      name: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization features.',
      alwaysEnabled: false,
    },
  ];

  const handleToggle = async (key: string, value: boolean) => {
    setLoading(key);
    setError(null);

    try {
      await privacyApi.updateCookiePreferences({ [key]: value });
      setLocalPreferences({ ...localPreferences, [key]: value });
      onUpdate();
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating cookie preferences:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleAcceptAll = async () => {
    setLoading('all');
    setError(null);

    try {
      const allEnabled = {
        essential: true,
        analytics: true,
        marketing: true,
        functional: true,
      };
      await privacyApi.updateCookiePreferences(allEnabled);
      setLocalPreferences(allEnabled);
      onUpdate();
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error accepting all cookies:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleRejectAll = async () => {
    setLoading('all');
    setError(null);

    try {
      const minimalCookies = {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      };
      await privacyApi.updateCookiePreferences(minimalCookies);
      setLocalPreferences(minimalCookies);
      onUpdate();
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error rejecting cookies:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveAll = async () => {
    setLoading('save');
    setError(null);

    try {
      await privacyApi.updateCookiePreferences(localPreferences);
      onUpdate();
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="cookie-preferences">
      <h2>Cookie Preferences</h2>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading !== null && (
        <div className="loading-indicator">
          Saving...
        </div>
      )}

      <div className="cookie-categories">
        {cookieCategories.map((category) => (
          <div key={category.key} className="cookie-category">
            <div className="category-header">
              <h3>{category.name}</h3>
              <div className="toggle-container">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={category.name}
                  checked={localPreferences[category.key as keyof typeof localPreferences]}
                  onChange={(e) => handleToggle(category.key, e.target.checked)}
                  disabled={category.alwaysEnabled || loading === category.key}
                />
                {category.alwaysEnabled && (
                  <span className="always-enabled">Always enabled</span>
                )}
              </div>
            </div>
            <p className="category-description">{category.description}</p>
          </div>
        ))}
      </div>

      <div className="cookie-actions">
        <button
          className="btn btn-secondary"
          onClick={handleRejectAll}
          disabled={loading !== null}
        >
          Reject All
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAcceptAll}
          disabled={loading !== null}
        >
          Accept All
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSaveAll}
          disabled={loading !== null}
        >
          {loading === 'save' ? 'Saving...' : 'Save All Preferences'}
        </button>
      </div>

      <div className="cookie-info">
        <p>
          For more information about how we use cookies, please read our{' '}
          <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">
            Cookie Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default CookiePreferences;