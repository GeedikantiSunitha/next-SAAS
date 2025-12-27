import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export const AdminFeatureFlags = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: () => adminApi.getFeatureFlags(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminApi.updateFeatureFlag(key, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast({
        title: 'Success',
        description: 'Feature flag updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update feature flag',
        variant: 'destructive',
      });
    },
  });

  const flags = data?.data?.flags || [];

  const handleToggle = (key: string, currentEnabled: boolean) => {
    updateMutation.mutate({ key, enabled: !currentEnabled });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-1">Manage feature toggles</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <p className="text-gray-600">No feature flags available</p>
          ) : (
            <div className="space-y-4">
              {flags.map((flag: any) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{flag.key}</h3>
                    <p className="text-sm text-gray-500">
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {flag.enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                    <Button
                      variant={flag.enabled ? 'default' : 'outline'}
                      onClick={() => handleToggle(flag.key, flag.enabled)}
                      disabled={updateMutation.isPending}
                    >
                      {flag.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
