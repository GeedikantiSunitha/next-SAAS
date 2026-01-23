/**
 * Security Event Timeline Component
 *
 * Task 3.3: Security Monitoring & Alerting
 * Displays a chronological timeline of security events
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Shield,
  User,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface SecurityEventTimelineProps {
  events: SecurityEvent[];
}

export default function SecurityEventTimeline({ events }: SecurityEventTimelineProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'LOW':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILURE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'BLOCKED':
        return <Ban className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string): any => {
    const colors: Record<string, string> = {
      CRITICAL: 'destructive',
      HIGH: 'destructive',
      MEDIUM: 'warning',
      LOW: 'secondary',
      INFO: 'default',
    };
    return colors[severity];
  };

  const getEventTypeLabel = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Event Timeline</CardTitle>
        <CardDescription>
          Real-time stream of security events and incidents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No security events in the selected time period</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Icon Column */}
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(event.severity)}
                  </div>

                  {/* Content Column */}
                  <div className="flex-grow space-y-2">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getEventTypeLabel(event.type)}
                          </span>
                          <Badge variant={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          {event.alertSent && (
                            <Badge variant="outline" className="text-xs">
                              Alert Sent
                            </Badge>
                          )}
                        </div>

                        {/* User/IP Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {event.user ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {event.user.name || event.user.email}
                            </span>
                          ) : event.ipAddress ? (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {event.ipAddress}
                            </span>
                          ) : null}

                          {event.resource && (
                            <span className="text-xs">
                              {event.action && `${event.action} `}
                              {event.resource}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp and Outcome */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {getOutcomeIcon(event.outcome)}
                          <span className="text-xs">{event.outcome}</span>
                        </div>
                        <span className="text-xs">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Details (if any) */}
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        <details>
                          <summary className="cursor-pointer hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 overflow-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}