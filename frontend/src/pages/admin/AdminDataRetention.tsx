import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Database, Shield, Clock, Trash2, FileText, Bell, Archive } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export const AdminDataRetention = () => {
  const [enforcementResult, setEnforcementResult] = useState<any>(null);
  const { toast } = useToast();

  const enforceRetentionMutation = useMutation({
    mutationFn: () => adminApi.enforceRetentionPolicies(),
    onSuccess: (data) => {
      setEnforcementResult(data.data);
      toast({
        title: 'Success',
        description: 'Retention policies enforced successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to enforce retention policies',
        variant: 'destructive',
      });
    },
  });

  const handleEnforceRetention = () => {
    if (confirm('Are you sure you want to enforce retention policies? This will anonymize/delete data based on configured policies.')) {
      enforceRetentionMutation.mutate();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Retention</h1>
          <p className="text-muted-foreground mt-2">
            Manage GDPR-compliant data retention policies and legal holds
          </p>
        </div>

        {/* Manual Enforcement Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Manual Enforcement
            </CardTitle>
            <CardDescription>
              Manually trigger data retention policies. This will enforce all configured policies immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleEnforceRetention}
              disabled={enforceRetentionMutation.isPending}
            >
              {enforceRetentionMutation.isPending ? 'Enforcing...' : 'Enforce Retention Policies'}
            </Button>

            {enforcementResult && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Retention policies enforced successfully</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>{enforcementResult.inactiveUsersAnonymized} inactive users anonymized</li>
                      <li>{enforcementResult.deletedUsersPurged} deleted users purged</li>
                      <li>{enforcementResult.expiredSessionsDeleted} expired sessions deleted</li>
                      <li>{enforcementResult.notificationsDeleted} notifications deleted</li>
                      <li>{enforcementResult.exportRequestsDeleted} export requests deleted</li>
                      <li>{enforcementResult.auditLogsArchived} audit logs archived</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Executed at: {new Date(enforcementResult.executedAt).toLocaleString()}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Retention Policies Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Retention Policies
            </CardTitle>
            <CardDescription>
              Current data retention policies configured for the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Trash2 className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Inactive Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Anonymized after 3 years of inactivity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Deleted Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently removed after 30 days grace period
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Expired Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    Deleted 90 days after expiration
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Bell className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Read: 1 year, Unread: 2 years
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <FileText className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Export Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Deleted after 30 days
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <Archive className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    Archived after 7 years (legal requirement)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Hold Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Legal Hold
            </CardTitle>
            <CardDescription>
              Users on legal hold are exempt from automatic data retention policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Legal hold management is available through the individual user management page.
              Navigate to Admin {'>'} Users to place users on legal hold or release them.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
