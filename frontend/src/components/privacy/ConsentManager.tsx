/**
 * ConsentManager Component
 * Manages user consent preferences for various data processing activities
 */

import React, { useState } from 'react';
import { privacyApi } from '../../api/privacy';

interface Consent {
  type: string;
  granted: boolean;
  version: string;
  grantedAt?: string;
  expiresAt?: string;
}

interface ConsentManagerProps {
  consents: Consent[];
  onUpdate: () => void;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ consents, onUpdate }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatConsentType = (type: string): string => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w|\s\w/g, (match) => match.toUpperCase());
  };

  const isExpiringSoon = (expiresAt?: string): boolean => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const handleConsentToggle = async (consentType: string, currentValue: boolean) => {
    setLoading(consentType);
    setError(null);

    try {
      await privacyApi.updateConsent(consentType, !currentValue);
      onUpdate();
    } catch (err) {
      setError('Failed to update consent');
      console.error('Error updating consent:', err);
    } finally {
      setLoading(null);
    }
  };

  if (consents.length === 0) {
    return (
      <div className="consent-manager">
        <h2>Consent Management</h2>
        <p className="empty-state">No consents configured</p>
      </div>
    );
  }

  return (
    <div className="consent-manager">
      <h2>Consent Management</h2>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          Updating...
        </div>
      )}

      <div className="consents-list">
        {consents.map((consent) => (
          <div key={consent.type} className="consent-item">
            <div className="consent-header">
              <h3>{formatConsentType(consent.type)}</h3>
              <div className="consent-toggle">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={formatConsentType(consent.type)}
                  checked={consent.granted}
                  onChange={() => handleConsentToggle(consent.type, consent.granted)}
                  disabled={loading === consent.type}
                />
                <span className={`status ${consent.granted ? 'granted' : 'revoked'}`}>
                  {consent.granted ? 'Granted' : 'Revoked'}
                </span>
              </div>
            </div>

            <div className="consent-details">
              <span className="version">Version: {consent.version}</span>

              {consent.grantedAt && (
                <span className="granted-date">
                  Granted: {new Date(consent.grantedAt).toLocaleDateString()}
                </span>
              )}

              {consent.expiresAt && (
                <span className={`expiry-date ${isExpiringSoon(consent.expiresAt) ? 'expiring' : ''}`}>
                  Expires: {new Date(consent.expiresAt).toLocaleDateString()}
                  {isExpiringSoon(consent.expiresAt) && <span className="warning"> - Expires soon</span>}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="consent-info">
        <p>
          <strong>Note:</strong> Changing these settings will affect how we process your personal data.
          Some features may become unavailable if you revoke certain consents.
        </p>
      </div>
    </div>
  );
};

export default ConsentManager;