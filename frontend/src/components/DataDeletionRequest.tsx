/**
 * Data Deletion Request Component
 * 
 * Allows users to request data deletion (GDPR Right to be Forgotten)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { useDeletionRequests, useRequestDeletion } from '../hooks/useGdpr';
import { DeletionType } from '../api/gdpr';
import { ConfirmDialog } from './ConfirmDialog';
import { Trash2, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'PENDING':
    case 'CONFIRMED':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'PROCESSING':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'FAILED':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pending Confirmation';
    case 'CONFIRMED':
      return 'Confirmed - Processing';
    case 'PROCESSING':
      return 'Processing';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'FAILED':
      return 'Failed';
    default:
      return status;
  }
};

export const DataDeletionRequest = () => {
  const { data: deletionRequests, isLoading, error } = useDeletionRequests();
  const requestDeletionMutation = useRequestDeletion();

  const [deletionType, setDeletionType] = useState<DeletionType>('SOFT');
  const [reason, setReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check if there's a pending/confirmed/processing request
  const activeRequest = deletionRequests?.find(
    (req) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(req.status)
  );

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    requestDeletionMutation.mutate({
      deletionType,
      reason: reason || undefined,
    });
    setShowConfirmDialog(false);
    setReason('');
  };

  if (isLoading) {
    return (
      <Card data-testid="deletions-loading">
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
            <p>Error loading deletion requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <CardTitle>Data Deletion Request</CardTitle>
        </div>
        <CardDescription>
          Request deletion of your personal data (GDPR Right to be Forgotten)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeRequest ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                {getStatusIcon(activeRequest.status)}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    {getStatusLabel(activeRequest.status)}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Requested {formatDistanceToNow(new Date(activeRequest.requestedAt), { addSuffix: true })}
                  </p>
                  {activeRequest.status === 'PENDING' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Please check your email to confirm the deletion request.
                      </p>
                    </div>
                  )}
                  {activeRequest.reason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Reason:</strong> {activeRequest.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="deletion-type">Deletion Type</Label>
              <select
                id="deletion-type"
                value={deletionType}
                onChange={(e) => setDeletionType(e.target.value as DeletionType)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={requestDeletionMutation.isPending}
              >
                <option value="SOFT">Soft Delete (Anonymize data)</option>
                <option value="HARD">Hard Delete (Permanently remove)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {deletionType === 'SOFT'
                  ? 'Your data will be anonymized but kept for legal/compliance purposes'
                  : 'Your data will be permanently deleted and cannot be recovered'}
              </p>
            </div>

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you requesting data deletion?"
                rows={4}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={requestDeletionMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              disabled={requestDeletionMutation.isPending}
            >
              {requestDeletionMutation.isPending ? 'Requesting...' : 'Request Deletion'}
            </Button>
          </form>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirmDialog(false)}
          title="Confirm Data Deletion Request"
          description={`Are you sure you want to request ${deletionType === 'SOFT' ? 'soft' : 'hard'} deletion of your data? This action cannot be undone.`}
          confirmText="Confirm Request"
          cancelText="Cancel"
          variant="destructive"
          loading={requestDeletionMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};
