/**
 * DataExport Component
 * Handles data export requests under GDPR.
 * Download uses credentialed fetch so cookies are sent when API is on a different origin.
 */

import React, { useState } from 'react';
import { privacyApi } from '../../api/privacy';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

interface Export {
  id: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

interface DataExportProps {
  exports: Export[];
  onUpdate: () => void;
}

const DataExport: React.FC<DataExportProps> = ({ exports, onUpdate }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleExportRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      await privacyApi.requestDataExport();
      onUpdate();
      setShowConfirm(false);
    } catch (err) {
      setError('Failed to request export');
      console.error('Error requesting export:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProcessingTime = (requestedAt: string, completedAt?: string): string => {
    if (!completedAt) return '';
    const start = new Date(requestedAt).getTime();
    const end = new Date(completedAt).getTime();
    const minutes = Math.round((end - start) / (1000 * 60));
    return `Completed in ${minutes} minutes`;
  };

  const handleDownload = async (exp: Export) => {
    if (!exp.downloadUrl) return;
    const url = exp.downloadUrl.startsWith('http')
      ? exp.downloadUrl
      : `${apiBaseUrl}${exp.downloadUrl}`;
    setDownloadingId(exp.id);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(res.status === 410 ? 'Download link has expired' : text || `Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `data-export-${exp.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="data-export">
      <h2>Data Export</h2>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="export-actions">
        <button
          className="btn btn-primary"
          onClick={() => setShowConfirm(true)}
        >
          Request Data Export
        </button>
      </div>

      {showConfirm && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3>Confirm Data Export</h3>
            <p>Are you sure you want to request a data export?</p>
            <p>You will receive a copy of all your personal data we store.</p>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportRequest}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="export-history">
        <h3>Export History</h3>
        {exports.length === 0 ? (
          <p className="empty-state">No export history</p>
        ) : (
          <div className="exports-list">
            {exports.map((exp) => (
              <div key={exp.id} className="export-item">
                <div className="export-header">
                  <h4>Export #{exp.id}</h4>
                  <span className={`status status-${exp.status.toLowerCase()}`}>
                    {exp.status}
                  </span>
                </div>
                <div className="export-details">
                  <span>Requested: {formatDate(exp.requestedAt)}</span>
                  {exp.completedAt && (
                    <span>{calculateProcessingTime(exp.requestedAt, exp.completedAt)}</span>
                  )}
                </div>
                {exp.status === 'COMPLETED' && exp.downloadUrl && (
                  <div className="export-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDownload(exp)}
                      disabled={downloadingId === exp.id}
                    >
                      {downloadingId === exp.id ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                )}
                {exp.status === 'FAILED' && (
                  <div className="export-error">
                    Export failed. Please try again or contact support.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="export-info">
        <h3>What's included in the export?</h3>
        <ul>
          <li>Profile information</li>
          <li>Account settings and preferences</li>
          <li>Order history and transactions</li>
          <li>Usage data and activity logs</li>
          <li>Connected accounts and integrations</li>
        </ul>
        <p>
          <strong>Note:</strong> Data exports are available for download for 30 days after completion.
        </p>
      </div>
    </div>
  );
};

export default DataExport;