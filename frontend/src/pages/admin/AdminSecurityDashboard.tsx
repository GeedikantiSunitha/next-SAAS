/**
 * Admin Security Dashboard
 *
 * Task 3.3: Security Monitoring & Alerting
 * Provides real-time security monitoring and threat visualization
 */

import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Lock,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SecurityEventTimeline from '@/components/SecurityEventTimeline';
import ThreatIndicators from '@/components/ThreatIndicators';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface SecurityStatistics {
  totalEvents: number;
  eventsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  failedLogins: number;
  bruteForceAttempts: number;
  rateLimitViolations: number;
  unauthorizedAccess: number;
  suspiciousActivity: number;
  timeRange: {
    from: Date;
    to: Date;
  };
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  ipAddress: string | null;
  resource: string | null;
  action: string | null;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'PENDING';
  details: any;
  alertSent: boolean;
}

export default function AdminSecurityDashboard() {
  const [statistics, setStatistics] = useState<SecurityStatistics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [hoursBack, setHoursBack] = useState(24);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsResponse = await api.get(`/api/security/statistics?hoursBack=${hoursBack}`);
      setStatistics(statsResponse.data.data);

      // Fetch recent events
      const eventsResponse = await api.get(`/api/security/timeline?hoursBack=${hoursBack}&limit=50`);
      setEvents(eventsResponse.data.data);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch security data',
        variant: 'destructive',
      });
      console.error('Security data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [hoursBack]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSecurityData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, hoursBack]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'destructive',
      HIGH: 'destructive',
      MEDIUM: 'warning',
      LOW: 'secondary',
      INFO: 'default',
    };
    return <Badge variant={colors[severity] as any}>{severity}</Badge>;
  };

  if (loading && !statistics) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time security monitoring and threat analysis
          </p>
        </div>

        <div className="flex gap-4">
          <select
            value={hoursBack}
            onChange={(e) => setHoursBack(Number(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={48}>Last 48 Hours</option>
            <option value={168}>Last Week</option>
          </select>

          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refreshing' : 'Auto-Refresh'}
          </Button>

          <Button onClick={fetchSecurityData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Threat Level Alert */}
      {statistics && statistics.threatLevel !== 'LOW' && (
        <Alert className={`mb-6 ${getThreatLevelColor(statistics.threatLevel)}`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            Current Threat Level: {statistics.threatLevel}
            {statistics.threatLevel === 'CRITICAL' &&
              ' - Immediate action required! Multiple security incidents detected.'}
            {statistics.threatLevel === 'HIGH' &&
              ' - Elevated security risk detected. Review recent events.'}
            {statistics.threatLevel === 'MEDIUM' &&
              ' - Moderate security activity detected.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {hoursBack} hour{hoursBack > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.failedLogins || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics?.bruteForceAttempts || 0} brute force attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.rateLimitViolations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Violations detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.suspiciousActivity || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics?.unauthorizedAccess || 0} unauthorized access
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      {statistics && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Event Severity Distribution</CardTitle>
            <CardDescription>Breakdown of security events by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              {Object.entries(statistics.eventsBySeverity).map(([severity, count]) => (
                <div key={severity} className="text-center">
                  <div className="text-2xl font-bold mb-2">{count}</div>
                  {getSeverityBadge(severity.toUpperCase())}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Timeline and Indicators */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Event Timeline</TabsTrigger>
          <TabsTrigger value="indicators">Threat Indicators</TabsTrigger>
          <TabsTrigger value="recent">Recent Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <SecurityEventTimeline events={events} />
        </TabsContent>

        <TabsContent value="indicators">
          <ThreatIndicators hoursBack={hoursBack} />
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>High severity events that triggered alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events && events.length > 0 ? events
                  .filter(e => e.alertSent && (e.severity === 'HIGH' || e.severity === 'CRITICAL'))
                  .slice(0, 10)
                  .map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(event.severity)}
                          <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.user ? `User: ${event.user.email}` : `IP: ${event.ipAddress || 'Unknown'}`}
                        </p>
                        {event.resource && (
                          <p className="text-sm text-muted-foreground">
                            Resource: {event.resource}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )) : (
                  <p className="text-center text-muted-foreground py-8">
                    No critical alerts in the selected time period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}