import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { Save } from 'lucide-react';

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
  });

  React.useEffect(() => {
    if (data?.data?.settings) {
      setSettings(data.data.settings);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => adminApi.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast({
        title: 'Success',
        description: 'Settings updated (server restart required)',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update settings',
        variant: 'error',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure application settings</p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-6">
          {/* App Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Application Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App Name
                </label>
                <Input
                  value={settings.app?.name || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      app: { ...settings.app, name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App URL
                </label>
                <Input
                  value={settings.app?.url || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      app: { ...settings.app, url: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Feature Flags</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Registration</label>
                <input
                  type="checkbox"
                  checked={settings.features?.registration || false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      features: {
                        ...settings.features,
                        registration: e.target.checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JWT Expiry
                </label>
                <Input
                  value={settings.security?.jwtExpiry || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, jwtExpiry: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
