/**
 * Consent Management Component
 * 
 * Manages GDPR consent preferences
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useConsents, useGrantConsent, useRevokeConsent } from '../hooks/useGdpr';
import { ConsentType } from '../api/gdpr';
import { Label } from './ui/label';
import { Shield, Mail, BarChart3, Share2, Cookie, FileText, Lock } from 'lucide-react';

const CONSENT_TYPES: Array<{
  type: ConsentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    type: 'MARKETING_EMAILS',
    label: 'Marketing Emails',
    description: 'Receive promotional emails and newsletters',
    icon: Mail,
  },
  {
    type: 'ANALYTICS',
    label: 'Analytics',
    description: 'Allow us to collect analytics data to improve our service',
    icon: BarChart3,
  },
  {
    type: 'THIRD_PARTY_SHARING',
    label: 'Third-Party Sharing',
    description: 'Allow sharing data with trusted third-party partners',
    icon: Share2,
  },
  {
    type: 'COOKIES',
    label: 'Cookies',
    description: 'Allow us to use cookies for enhanced functionality',
    icon: Cookie,
  },
  {
    type: 'TERMS_OF_SERVICE',
    label: 'Terms of Service',
    description: 'Acceptance of terms of service',
    icon: FileText,
  },
  {
    type: 'PRIVACY_POLICY',
    label: 'Privacy Policy',
    description: 'Acceptance of privacy policy',
    icon: Lock,
  },
];

export const ConsentManagement = () => {
  const { data: consents, isLoading, error } = useConsents();
  const grantConsentMutation = useGrantConsent();
  const revokeConsentMutation = useRevokeConsent();

  const getConsentStatus = (consentType: ConsentType): boolean => {
    if (!consents) return false;
    const consent = consents.find((c) => c.consentType === consentType);
    return consent?.granted ?? false;
  };

  const handleToggle = (consentType: ConsentType, currentStatus: boolean) => {
    if (currentStatus) {
      revokeConsentMutation.mutate(consentType);
    } else {
      grantConsentMutation.mutate(consentType);
    }
  };

  const isPending = grantConsentMutation.isPending || revokeConsentMutation.isPending;

  if (isLoading) {
    return (
      <Card data-testid="consents-loading">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error loading consents</p>
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
          <Shield className="h-5 w-5" />
          <CardTitle>Consent Management</CardTitle>
        </div>
        <CardDescription>
          Manage your privacy and data consent preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {CONSENT_TYPES.map(({ type, label, description, icon: Icon }) => {
            const isGranted = getConsentStatus(type);
            return (
              <div
                key={type}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor={`consent-${type}`} className="cursor-pointer">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <input
                  id={`consent-${type}`}
                  type="checkbox"
                  checked={isGranted}
                  onChange={() => handleToggle(type, isGranted)}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300"
                  data-testid={`consent-toggle-${type}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
