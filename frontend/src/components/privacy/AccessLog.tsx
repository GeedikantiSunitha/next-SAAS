/**
 * AccessLog Component
 * Displays data access history for GDPR transparency
 */

import React, { useState, useEffect } from 'react';
import { privacyApi, AccessLogEntry } from '../../api/privacy';

interface AccessLogProps {
  initialData?: any[];
  showDetails?: boolean;
  onExport?: () => void;
}

const AccessLog: React.FC<AccessLogProps> = ({ initialData, showDetails = false, onExport }) => {
  const [entries, setEntries] = useState<AccessLogEntry[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [filters, setFilters] = useState({
    accessType: '',
    dataCategory: '',
    startDate: '',
    endDate: '',
    searchTerm: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: initialData ? initialData.length : 0,
    totalPages: initialData ? Math.ceil(initialData.length / 10) : 0,
  });

  useEffect(() => {
    if (!initialData) {
      fetchAccessLog();
    } else if (initialData.length > 0) {
      // Update pagination when using initial data
      setPagination(prev => ({
        ...prev,
        total: initialData.length,
        totalPages: Math.ceil(initialData.length / prev.pageSize),
      }));
    }
  }, []);

  const fetchAccessLog = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      if (filters.accessType) params.accessType = filters.accessType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await privacyApi.getAccessLog(params);
      setEntries(response.entries);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching access log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    if (key === 'accessType') {
      // Immediately fetch when access type changes
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        accessType: value,
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      try {
        const response = await privacyApi.getAccessLog(params);
        setEntries(response.entries);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching access log:', error);
      }
    }
  };

  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    fetchAccessLog();
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
    fetchAccessLog();
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredEntries = entries.filter(entry => {
    if (!filters.searchTerm) return true;
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      entry.accessedBy.toLowerCase().includes(searchLower) ||
      entry.dataCategory.toLowerCase().includes(searchLower) ||
      entry.purpose.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="access-log loading">
        <h2>Access Log</h2>
        <p>Loading access log...</p>
      </div>
    );
  }

  return (
    <div className="access-log">
      <h2>Access Log</h2>

      {/* Filters */}
      <div className="log-filters">
        <div className="filter-row">
          <div className="filter-item">
            <label htmlFor="accessType">Access Type</label>
            <select
              id="accessType"
              value={filters.accessType}
              onChange={(e) => handleFilterChange('accessType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="VIEW">View</option>
              <option value="EXPORT">Export</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="dataCategory">Data Category</label>
            <select
              id="dataCategory"
              value={filters.dataCategory}
              onChange={(e) => handleFilterChange('dataCategory', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="PROFILE">Profile</option>
              <option value="ORDERS">Orders</option>
              <option value="PREFERENCES">Preferences</option>
              <option value="ALL">All Data</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              aria-label="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              aria-label="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item search">
            <input
              type="text"
              placeholder="Search access log..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={handleApplyFilters}>
            Apply Filters
          </button>

          <button className="btn btn-secondary" onClick={onExport || (() => {})}>
            Export Log
          </button>
        </div>

        <label htmlFor="dateRange" style={{ display: 'none' }}>Date Range</label>
      </div>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <p className="empty-state">No access log entries</p>
      ) : (
        <div className="log-entries">
          {filteredEntries.map((entry, index) => (
            <div
              key={(entry as AccessLogEntry & { id?: string }).id ?? `access-${entry.timestamp}-${entry.accessedBy}-${index}`}
              className={`log-entry ${(entry as any).suspicious ? 'suspicious' : ''}`}
            >
              <div className="entry-header">
                <span className="accessed-by">{entry.accessedBy}</span>
                <span className={`access-type type-${entry.accessType.toLowerCase()}`}>
                  {entry.accessType}
                </span>
                <span className="data-category">{entry.dataCategory}</span>
              </div>

              <div className="entry-details">
                <span className="purpose">{entry.purpose}</span>
                <span className="timestamp">{formatTimestamp(entry.timestamp)}</span>
              </div>

              {showDetails && entry.ipAddress && (
                <div className="entry-extra">
                  <span className="ip-address">{entry.ipAddress}</span>
                </div>
              )}

              {(entry as any).suspicious && (
                <div className="suspicious-warning">
                  ⚠️ {(entry as any).suspicionReason || 'Unusual access pattern detected'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="log-pagination">
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>

          <span className="page-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AccessLog;