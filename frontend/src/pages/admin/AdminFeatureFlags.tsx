import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { FEATURE_FLAGS_HIDDEN_FROM_ADMIN } from '../../lib/constants';
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
        variant: 'error',
      });
    },
  });

  const allFlags = data?.data?.flags || [];
  const hiddenSet = new Set(FEATURE_FLAGS_HIDDEN_FROM_ADMIN);
  const flags = allFlags.filter((flag: { key: string }) => !hiddenSet.has(flag.key));

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
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No feature flags in the database</p>
              <p className="text-sm text-gray-500 mb-3">
                Seed default flags so you can toggle and test. In the backend folder run:
              </p>
              <code className="block text-left max-w-md mx-auto px-4 py-2 bg-gray-100 rounded text-sm">
                npm run seed:feature-flags
              </code>
              <p className="text-sm text-gray-500 mt-3">
                Then refresh this page. Safe to re-run if flags already exist.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flags.map((flag: any) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{flag.key}</h3>
                    {flag.description && (
                      <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                      {flag.updatedAt && (
                        <span className="ml-2">
                          • Last updated: {new Date(flag.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
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
