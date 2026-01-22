/**
 * DataDeletion Component
 * Handles account deletion requests under GDPR's Right to Erasure
 */

import React, { useState } from 'react';
import { privacyApi } from '../../api/privacy';

interface Deletion {
  id: string;
  status: string;
  requestedAt: string;
  scheduledFor?: string;
}

interface DataDeletionProps {
  deletions: Deletion[];
  onUpdate: () => void;
}

const DataDeletion: React.FC<DataDeletionProps> = ({ deletions, onUpdate }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPendingDeletion = deletions.some(d => d.status === 'PENDING');

  const handleDeletionRequest = async () => {
    if (confirmText !== 'DELETE') return;

    setLoading(true);
    setError(null);

    try {
      await privacyApi.requestAccountDeletion(reason || undefined);
      onUpdate();
      setShowConfirm(false);
      setConfirmText('');
      setReason('');
    } catch (err) {
      setError('Failed to request deletion');
      console.error('Error requesting deletion:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysRemaining = (scheduledFor?: string): string => {
    if (!scheduledFor) return '';
    const days = Math.ceil((new Date(scheduledFor).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `${days} days remaining`;
  };

  return (
    <div className="data-deletion">
      <h2>Data Deletion</h2>

      <div className="deletion-warning">
        <strong>⚠️ Warning:</strong> This action is irreversible. Once your account is deleted,
        all your data will be permanently removed from our systems.
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="deletion-actions">
        <button
          className="btn btn-danger"
          onClick={() => setShowConfirm(true)}
          disabled={hasPendingDeletion}
        >
          Request Account Deletion
        </button>
        {hasPendingDeletion && (
          <p className="info-message">
            You have a pending deletion request. Please wait for it to complete.
          </p>
        )}
      </div>

      {showConfirm && (
        <div className="confirmation-dialog danger">
          <div className="dialog-content">
            <h3>Are you absolutely sure?</h3>
            <p>
              <strong>This will permanently delete:</strong>
            </p>
            <ul>
              <li>Your account and profile information</li>
              <li>All your personal data</li>
              <li>Your order history and transactions</li>
              <li>All preferences and settings</li>
            </ul>
            <p>
              <strong>Type "DELETE" to confirm:</strong>
            </p>
            <input
              type="text"
              placeholder="Type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            <textarea
              placeholder="Optional: Reason for deletion"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                  setReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeletionRequest}
                disabled={confirmText !== 'DELETE' || loading}
              >
                {loading ? 'Processing...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="deletion-history">
        <h3>Deletion Requests</h3>
        {deletions.length === 0 ? (
          <p className="empty-state">No deletion requests</p>
        ) : (
          <div className="deletions-list">
            {deletions.map((deletion) => (
              <div key={deletion.id} className="deletion-item">
                <div className="deletion-header">
                  <h4>Deletion Request #{deletion.id}</h4>
                  <span className={`status status-${deletion.status.toLowerCase()}`}>
                    {deletion.status}
                  </span>
                </div>
                <div className="deletion-details">
                  <span>Requested: {formatDate(deletion.requestedAt)}</span>
                  {deletion.scheduledFor && deletion.status === 'PENDING' && (
                    <>
                      <span>Scheduled for: {formatDate(deletion.scheduledFor)}</span>
                      <span className="days-remaining">
                        {calculateDaysRemaining(deletion.scheduledFor)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="deletion-info">
        <h3>Important Information</h3>
        <ul>
          <li>Account deletion requests are processed within 30 days</li>
          <li>You can cancel the deletion request within the grace period</li>
          <li>Some data may be retained for legal compliance purposes</li>
          <li>You will receive a confirmation email once deletion is complete</li>
        </ul>
      </div>
    </div>
  );
};

export default DataDeletion;