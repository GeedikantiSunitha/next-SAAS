/**
 * ConnectedAccounts Component
 * Manages OAuth and third-party account connections
 */

import React, { useState } from 'react';

interface Account {
  provider: string;
  connectedAt: string;
  email?: string;
  permissions?: string[];
  lastAccessed?: string;
  status?: string;
}

interface ConnectedAccountsProps {
  accounts: Account[];
  onDisconnect?: (provider: string) => void;
}

const ConnectedAccounts: React.FC<ConnectedAccountsProps> = ({ accounts, onDisconnect }) => {
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  const getProviderIcon = (provider: string): string => {
    // In production, these would be actual icon URLs or SVG components
    return `/icons/${provider.toLowerCase()}.svg`;
  };

  const formatProviderName = (provider: string): string => {
    const names: Record<string, string> = {
      google: 'Google',
      github: 'GitHub',
      microsoft: 'Microsoft',
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
    };
    return names[provider.toLowerCase()] || provider;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDisconnect = (provider: string) => {
    if (onDisconnect) {
      onDisconnect(provider);
    }
    setConfirmDisconnect(null);
  };

  const handleConnectNew = () => {
    // In production, this would redirect to OAuth flow
    window.location.href = '/settings/connected-accounts';
  };

  if (accounts.length === 0) {
    return (
      <div className="connected-accounts">
        <h2>Connected Accounts</h2>
        <div className="empty-state">
          <p>No accounts connected</p>
          <p>Connect accounts to enable single sign-on and data import features.</p>
          <button className="btn btn-primary" onClick={handleConnectNew}>
            Connect New Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="connected-accounts">
      <h2>Connected Accounts</h2>

      <div className="accounts-list">
        {accounts.map((account, index) => (
          <div key={`${account.provider}-${index}`} className="account-item">
            <div className="account-header">
              <div className="account-info">
                <img
                  src={getProviderIcon(account.provider)}
                  alt={`${formatProviderName(account.provider)} icon`}
                  className="provider-icon"
                />
                <div className="account-details">
                  <h3>{formatProviderName(account.provider)}</h3>
                  {account.email && <span className="account-email">{account.email}</span>}
                  <span className="connection-date">
                    Connected: {formatDate(account.connectedAt)}
                  </span>
                  {account.lastAccessed && (
                    <span className="last-accessed">
                      Last accessed: {formatDate(account.lastAccessed)}
                    </span>
                  )}
                </div>
              </div>

              <div className="account-actions">
                {account.status && (
                  <span className={`status status-${account.status.toLowerCase()}`}>
                    {account.status === 'active' ? 'Active' : 'Expired'}
                  </span>
                )}
                {account.status === 'expired' ? (
                  <button className="btn btn-primary">
                    Re-authenticate
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmDisconnect(account.provider)}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {account.permissions && account.permissions.length > 0 && (
              <div className="account-permissions">
                <span>Permissions:</span>
                <ul>
                  {account.permissions.map((permission) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              </div>
            )}

            {confirmDisconnect === account.provider && (
              <div className="confirmation-dialog inline">
                <p>Are you sure you want to disconnect {formatProviderName(account.provider)}?</p>
                <p>You will need to reconnect to use features that depend on this account.</p>
                <div className="dialog-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmDisconnect(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDisconnect(account.provider)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="connect-new">
        <button className="btn btn-primary" onClick={handleConnectNew}>
          Connect New Account
        </button>
      </div>

      <div className="accounts-info">
        <h3>Why connect accounts?</h3>
        <ul>
          <li>Sign in quickly with single sign-on</li>
          <li>Import contacts and data</li>
          <li>Share content easily</li>
          <li>Sync preferences across services</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectedAccounts;