/**
 * Data Export Component
 *
 * Allows users to request and download their data export (GDPR Right to Access).
 * Download uses credentialed fetch so cookies are sent when API is on a different origin.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { useExportRequests, useRequestExport } from '../../hooks/useGdpr';
import { useToast } from '../../hooks/use-toast';
import { Download, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DataExportRequest, ExportsResponse } from '../../api/gdpr';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'PENDING':
    case 'PROCESSING':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'PROCESSING':
      return 'Processing';
    case 'COMPLETED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
};

export const DataExport = () => {
  const { data: exportRequests, isLoading, error } = useExportRequests();
  const requestExportMutation = useRequestExport();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (exportReq: DataExportRequest) => {
    if (!exportReq.downloadUrl) return;
    const url = exportReq.downloadUrl.startsWith('http')
      ? exportReq.downloadUrl
      : `${apiBaseUrl}${exportReq.downloadUrl}`;
    setDownloadingId(exportReq.id);
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
      a.download = `data-export-${exportReq.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast({ title: 'Download started', description: 'Your data export is downloading.', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not download export',
        variant: 'error',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="exports-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading export requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // useExportRequests returns ExportsResponse directly (hook returns response.data which is ExportsResponse)
  // ExportsResponse has structure: { success: boolean, data: DataExportRequest[] }
  // useQuery wraps it, so exportRequests is the ExportsResponse
  const exportsResponse = exportRequests as ExportsResponse | undefined;
  const exports: DataExportRequest[] = exportsResponse?.data || [];
  const latestExport = exports.length > 0 ? exports[0] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <CardTitle>Data Export</CardTitle>
        </div>
        <CardDescription>
          Request a copy of all your personal data (GDPR Right to Access)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {latestExport && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                {getStatusIcon(latestExport.status)}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    {getStatusLabel(latestExport.status)}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Requested {formatDistanceToNow(new Date(latestExport.requestedAt), { addSuffix: true })}
                  </p>
                  {latestExport.status === 'COMPLETED' && latestExport.downloadUrl && (
                    <div className="mt-3" data-testid="export-download-section">
                      <Button
                        onClick={() => handleDownload(latestExport)}
                        disabled={downloadingId === latestExport.id}
                        className="flex items-center gap-2"
                      >
                        {downloadingId === latestExport.id ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download Data Export
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Download link expires in 7 days
                      </p>
                    </div>
                  )}
                  {(latestExport.status === 'PENDING' || latestExport.status === 'PROCESSING') && (
                    <p className="text-sm text-muted-foreground">
                      Your data export is being prepared. You will receive an email when it&apos;s ready.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Button
              onClick={() => requestExportMutation.mutate()}
              disabled={requestExportMutation.isPending || (latestExport !== null && ['PENDING', 'PROCESSING'].includes(latestExport.status))}
              className="w-full sm:w-auto"
            >
              {requestExportMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Request Data Export
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can request a new export once the current one is completed or expired.
            </p>
          </div>

          {exports.length > 1 && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold mb-2">Export History</h5>
              <div className="space-y-2">
                {exports.slice(1).map((exportReq: DataExportRequest) => (
                  <div
                    key={exportReq.id}
                    className="flex items-center justify-between p-2 border rounded text-sm flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(exportReq.status)}
                      <span>{getStatusLabel(exportReq.status)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(exportReq.requestedAt), { addSuffix: true })}
                    </span>
                    {exportReq.status === 'COMPLETED' && exportReq.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(exportReq)}
                        disabled={downloadingId === exportReq.id}
                        className="flex items-center gap-1"
                      >
                        {downloadingId === exportReq.id ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
