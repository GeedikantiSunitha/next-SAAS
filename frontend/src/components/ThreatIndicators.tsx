/**
 * Threat Indicators Component
 *
 * Task 3.3: Security Monitoring & Alerting
 * Displays visual indicators of current threat levels and security metrics
 */

import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Lock,
  UserX,
  Zap,
  Eye,
  Database
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getThreatIndicators } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface ThreatIndicatorData {
  failedLogins: number;
  bruteForceAttempts: number;
  rateLimitViolations: number;
  unauthorizedAccess: number;
  suspiciousActivity: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ThreatIndicatorsProps {
  hoursBack?: number;
}

export default function ThreatIndicators({ hoursBack = 24 }: ThreatIndicatorsProps) {
  const [indicators, setIndicators] = useState<ThreatIndicatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousIndicators, setPreviousIndicators] = useState<ThreatIndicatorData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchThreatIndicators();
  }, [hoursBack]);

  const fetchThreatIndicators = async () => {
    try {
      setLoading(true);

      // Fetch current indicators
      const currentData = await getThreatIndicators(hoursBack);

      // Fetch previous period for comparison (optional, for trend analysis)
      const prevData = await getThreatIndicators(hoursBack * 2);

      setIndicators(currentData);
      setPreviousIndicators(prevData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch threat indicators',
        variant: 'destructive',
      });
      console.error('Threat indicators fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelConfig = (level: string) => {
    const configs = {
      CRITICAL: {
        color: 'bg-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-100',
        progress: 100,
        icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
        description: 'Immediate action required'
      },
      HIGH: {
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-100',
        progress: 75,
        icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
        description: 'Elevated risk detected'
      },
      MEDIUM: {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        progress: 50,
        icon: <Shield className="h-6 w-6 text-yellow-600" />,
        description: 'Moderate activity detected'
      },
      LOW: {
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-100',
        progress: 25,
        icon: <Shield className="h-6 w-6 text-green-600" />,
        description: 'Normal security status'
      }
    };
    return configs[level as keyof typeof configs] || configs.LOW;
  };

  const getIndicatorCard = (
    title: string,
    value: number,
    previousValue: number | undefined,
    icon: React.ReactNode,
    threshold: number,
    description: string
  ) => {
    const percentChange = previousValue
      ? ((value - previousValue) / (previousValue || 1)) * 100
      : 0;
    const isIncreasing = percentChange > 0;
    const isWarning = value > threshold;

    return (
      <Card className={isWarning ? 'border-orange-500' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
          </div>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {previousValue !== undefined && percentChange !== 0 && (
            <div className={`flex items-center text-xs mt-1 ${isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
              {isIncreasing ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(percentChange).toFixed(1)}% from previous period
            </div>
          )}
          {isWarning && (
            <Badge variant="destructive" className="mt-2 text-xs">
              Above threshold ({threshold})
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !indicators) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const threatConfig = getThreatLevelConfig(indicators.threatLevel);

  return (
    <div className="space-y-6">
      {/* Overall Threat Level */}
      <Card className={`${threatConfig.bgColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {threatConfig.icon}
              <div>
                <CardTitle>Overall Threat Level</CardTitle>
                <CardDescription className="text-foreground/70">
                  {threatConfig.description}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-lg px-4 py-2 ${threatConfig.textColor} ${threatConfig.bgColor} border-current`}
            >
              {indicators.threatLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={threatConfig.progress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Based on activity from the last {hoursBack} hour{hoursBack > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Individual Threat Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getIndicatorCard(
          'Failed Logins',
          indicators.failedLogins,
          previousIndicators?.failedLogins,
          <Lock className="h-5 w-5 text-muted-foreground" />,
          50,
          'Authentication failures'
        )}

        {getIndicatorCard(
          'Brute Force Attempts',
          indicators.bruteForceAttempts,
          previousIndicators?.bruteForceAttempts,
          <UserX className="h-5 w-5 text-muted-foreground" />,
          5,
          'Account lockout triggers'
        )}

        {getIndicatorCard(
          'Rate Limit Violations',
          indicators.rateLimitViolations,
          previousIndicators?.rateLimitViolations,
          <Zap className="h-5 w-5 text-muted-foreground" />,
          20,
          'API throttling events'
        )}

        {getIndicatorCard(
          'Unauthorized Access',
          indicators.unauthorizedAccess,
          previousIndicators?.unauthorizedAccess,
          <Eye className="h-5 w-5 text-muted-foreground" />,
          10,
          'Permission denied events'
        )}

        {getIndicatorCard(
          'Suspicious Activity',
          indicators.suspiciousActivity,
          previousIndicators?.suspiciousActivity,
          <Activity className="h-5 w-5 text-muted-foreground" />,
          15,
          'Anomaly detections'
        )}

        {/* Security Score Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription className="text-xs">Overall security posture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {calculateSecurityScore(indicators)}%
                </div>
                <Badge variant={getScoreBadgeVariant(calculateSecurityScore(indicators))}>
                  {getScoreLabel(calculateSecurityScore(indicators))}
                </Badge>
              </div>
              <Progress
                value={calculateSecurityScore(indicators)}
                className="mt-2 h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {indicators.threatLevel !== 'LOW' && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {indicators.bruteForceAttempts > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Review accounts with failed login attempts and consider implementing stronger password policies.</span>
                </li>
              )}
              {indicators.rateLimitViolations > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Monitor API usage patterns and consider adjusting rate limits or blocking suspicious IPs.</span>
                </li>
              )}
              {indicators.unauthorizedAccess > 5 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Review permission settings and audit user roles for potential privilege escalation attempts.</span>
                </li>
              )}
              {indicators.suspiciousActivity > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>Investigate suspicious activity patterns and consider enabling additional security monitoring.</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function calculateSecurityScore(indicators: ThreatIndicatorData): number {
  const weights = {
    failedLogins: 0.2,
    bruteForceAttempts: 0.3,
    rateLimitViolations: 0.15,
    unauthorizedAccess: 0.25,
    suspiciousActivity: 0.1
  };

  const thresholds = {
    failedLogins: 50,
    bruteForceAttempts: 5,
    rateLimitViolations: 20,
    unauthorizedAccess: 10,
    suspiciousActivity: 15
  };

  let score = 100;

  Object.keys(weights).forEach(key => {
    const k = key as keyof typeof weights;
    const value = indicators[k] as number;
    const threshold = thresholds[k];
    const weight = weights[k];

    if (value > threshold) {
      const penalty = Math.min((value / threshold) * weight * 50, weight * 50);
      score -= penalty;
    }
  });

  return Math.max(0, Math.round(score));
}

function getScoreBadgeVariant(score: number): any {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'destructive';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}