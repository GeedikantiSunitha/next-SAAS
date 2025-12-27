import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Activity, Database, AlertTriangle, Users } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  recentActivity: any[];
}

export const AdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['admin', 'metrics', 'system'],
    queryFn: () => adminApi.getSystemMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: databaseMetrics } = useQuery({
    queryKey: ['admin', 'metrics', 'database'],
    queryFn: () => adminApi.getDatabaseMetrics(),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.data?.stats || {
    totalUsers: 0,
    activeSessions: 0,
    recentActivity: [],
  };

  const systemData = systemMetrics?.data || {};
  const dbData = databaseMetrics?.data || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your application</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbData.users?.total || stats.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dbData.users?.active || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbData.sessions?.active || stats.activeSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {systemData.requests?.total || 0} total requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemData.requests?.errorRate?.toFixed(2) || '0.00'}%
              </div>
              <p className="text-xs text-muted-foreground">
                {systemData.requests?.errors || 0} errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemData.requests?.avgLatency?.toFixed(0) || '0'}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future content */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Dashboard features will be expanded in subsequent phases.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

