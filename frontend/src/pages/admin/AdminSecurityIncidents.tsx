import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/admin';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, Shield, Clock, Users, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface SecurityIncident {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  affectedDataTypes: string[];
  affectedUserCount: number;
  detectedAt: string;
  icoNotificationRequired: boolean;
  icoNotifiedAt: string | null;
  icoReferenceNumber: string | null;
  containedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AdminSecurityIncidents = () => {
  const [filters, setFilters] = useState<{
    status?: string;
    severity?: string;
    type?: string;
  }>({});
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [notifyUsersDialogOpen, setNotifyUsersDialogOpen] = useState(false);
  const [reportICODialogOpen, setReportICODialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [reportForm, setReportForm] = useState({
    type: '',
    severity: '',
    title: '',
    description: '',
    affectedDataTypes: '',
    affectedUserCount: '',
  });
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    remediationSteps: '',
    lessonsLearned: '',
  });
  const [icoForm, setICOForm] = useState({
    icoReferenceNumber: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch incidents
  const { data: incidentsData, isLoading, isError } = useQuery({
    queryKey: ['securityIncidents', filters],
    queryFn: () => adminApi.getSecurityIncidents(filters),
  });

  const incidents = incidentsData?.data || [];

  // Fetch selected incident details
  const { data: incidentDetailsData } = useQuery({
    queryKey: ['securityIncident', selectedIncident?.id],
    queryFn: () => adminApi.getSecurityIncident(selectedIncident!.id),
    enabled: !!selectedIncident,
  });

  // Fetch incident deadline
  const { data: deadlineData } = useQuery({
    queryKey: ['incidentDeadline', selectedIncident?.id],
    queryFn: () => adminApi.getIncidentDeadline(selectedIncident!.id),
    enabled: !!selectedIncident?.icoNotificationRequired,
  });

  // Report new incident mutation
  const reportMutation = useMutation({
    mutationFn: (data: any) => adminApi.reportSecurityIncident(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Security incident reported successfully',
      });
      setReportDialogOpen(false);
      setReportForm({
        type: '',
        severity: '',
        title: '',
        description: '',
        affectedDataTypes: '',
        affectedUserCount: '',
      });
      queryClient.invalidateQueries({ queryKey: ['securityIncidents'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to report incident',
        variant: 'destructive',
      });
    },
  });

  // Update incident status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      adminApi.updateSecurityIncident(id, updates),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Incident status updated successfully',
      });
      setUpdateStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['securityIncidents'] });
      queryClient.invalidateQueries({ queryKey: ['securityIncident'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update incident',
        variant: 'destructive',
      });
    },
  });

  // Notify affected users mutation
  const notifyUsersMutation = useMutation({
    mutationFn: (incidentId: string) => adminApi.notifyAffectedUsers(incidentId),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `${data.data.notificationsSent} users have been notified`,
      });
      setNotifyUsersDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['securityIncident'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to notify users',
        variant: 'destructive',
      });
    },
  });

  // Report to ICO mutation
  const reportICOMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.reportToICO(id, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Incident reported to ICO successfully',
      });
      setReportICODialogOpen(false);
      setICOForm({ icoReferenceNumber: '' });
      queryClient.invalidateQueries({ queryKey: ['securityIncidents'] });
      queryClient.invalidateQueries({ queryKey: ['securityIncident'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to report to ICO',
        variant: 'destructive',
      });
    },
  });

  const handleReportIncident = () => {
    if (!reportForm.title || !reportForm.description) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    reportMutation.mutate({
      type: reportForm.type,
      severity: reportForm.severity,
      title: reportForm.title,
      description: reportForm.description,
      affectedDataTypes: reportForm.affectedDataTypes.split(',').map((t) => t.trim()),
      affectedUserCount: parseInt(reportForm.affectedUserCount) || 0,
      detectedAt: new Date().toISOString(),
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedIncident) return;

    const updates: any = {
      status: statusUpdateForm.status,
    };

    if (statusUpdateForm.status === 'CONTAINED') {
      updates.containedAt = new Date().toISOString();
      updates.remediationSteps = statusUpdateForm.remediationSteps;
    } else if (statusUpdateForm.status === 'RESOLVED') {
      updates.resolvedAt = new Date().toISOString();
      updates.lessonsLearned = statusUpdateForm.lessonsLearned;
    }

    updateStatusMutation.mutate({ id: selectedIncident.id, updates });
  };

  const handleNotifyUsers = () => {
    if (!selectedIncident) return;
    if (confirm(`${selectedIncident.affectedUserCount} users will be notified via email. Continue?`)) {
      notifyUsersMutation.mutate(selectedIncident.id);
    }
  };

  const handleReportToICO = () => {
    if (!selectedIncident) return;

    // Validate ICO reference number format
    if (!/^ICO-\d{4}-\d{6}$/.test(icoForm.icoReferenceNumber)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid format. Expected format: ICO-YYYY-XXXXXX',
        variant: 'destructive',
      });
      return;
    }

    reportICOMutation.mutate({
      id: selectedIncident.id,
      data: { icoReferenceNumber: icoForm.icoReferenceNumber },
    });
  };

  const handleIncidentClick = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setDetailsDialogOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'default';
      case 'LOW':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'destructive';
      case 'INVESTIGATING':
        return 'default';
      case 'CONTAINED':
        return 'default';
      case 'RESOLVED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Incidents</h1>
            <p className="text-muted-foreground mt-2">
              Manage GDPR-compliant security incident reporting and breach notifications
            </p>
          </div>
          <Button onClick={() => setReportDialogOpen(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPORTED">Reported</SelectItem>
                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                    <SelectItem value="CONTAINED">Contained</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity-filter">Severity</Label>
                <Select
                  value={filters.severity || ''}
                  onValueChange={(value) => setFilters({ ...filters, severity: value })}
                >
                  <SelectTrigger id="severity-filter">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                    <SelectItem value="UNAUTHORIZED_ACCESS">Unauthorized Access</SelectItem>
                    <SelectItem value="DATA_LOSS">Data Loss</SelectItem>
                    <SelectItem value="SYSTEM_COMPROMISE">System Compromise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <Card>
          <CardHeader>
            <CardTitle>Security Incidents</CardTitle>
            <CardDescription>
              Click on an incident to view details and take actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <div>Loading incidents...</div>}
            {isError && (
              <Alert variant="destructive">
                <AlertDescription>Failed to load security incidents</AlertDescription>
              </Alert>
            )}
            {!isLoading && !isError && incidents.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No security incidents found
              </div>
            )}
            {!isLoading && !isError && incidents.length > 0 && (
              <div className="space-y-4">
                {incidents.map((incident: SecurityIncident) => (
                  <div
                    key={incident.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => handleIncidentClick(incident)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{incident.title}</h3>
                          <Badge variant={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge variant={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          {incident.icoNotificationRequired && !incident.icoNotifiedAt && (
                            <Badge variant="destructive">ICO notification required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {incident.affectedUserCount} users affected
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(incident.detectedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Incident Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Security Incident</DialogTitle>
              <DialogDescription>
                Report a new security incident for GDPR compliance tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="incident-type">Incident Type</Label>
                <Select
                  value={reportForm.type}
                  onValueChange={(value) => setReportForm({ ...reportForm, type: value })}
                >
                  <SelectTrigger id="incident-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                    <SelectItem value="UNAUTHORIZED_ACCESS">Unauthorized Access</SelectItem>
                    <SelectItem value="DATA_LOSS">Data Loss</SelectItem>
                    <SelectItem value="SYSTEM_COMPROMISE">System Compromise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={reportForm.severity}
                  onValueChange={(value) => setReportForm({ ...reportForm, severity: value })}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="Brief incident title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="Detailed incident description"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="affected-data-types">Affected Data Types</Label>
                <Input
                  id="affected-data-types"
                  value={reportForm.affectedDataTypes}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, affectedDataTypes: e.target.value })
                  }
                  placeholder="email, name, phone (comma-separated)"
                />
              </div>
              <div>
                <Label htmlFor="affected-user-count">Affected User Count</Label>
                <Input
                  id="affected-user-count"
                  type="number"
                  value={reportForm.affectedUserCount}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, affectedUserCount: e.target.value })
                  }
                  placeholder="Number of affected users"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportIncident} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Incident Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedIncident?.title}</DialogTitle>
              <DialogDescription>Security Incident Details</DialogDescription>
            </DialogHeader>
            {selectedIncident && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <p className="text-sm">{selectedIncident.type}</p>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Badge variant={getSeverityColor(selectedIncident.severity)}>
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={getStatusColor(selectedIncident.status)}>
                      {selectedIncident.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Affected Users</Label>
                    <p className="text-sm">{selectedIncident.affectedUserCount}</p>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                </div>

                <div>
                  <Label>Affected Data Types</Label>
                  <p className="text-sm">{selectedIncident.affectedDataTypes.join(', ')}</p>
                </div>

                <div>
                  <Label>Detected At</Label>
                  <p className="text-sm">{new Date(selectedIncident.detectedAt).toLocaleString()}</p>
                </div>

                {selectedIncident.icoNotificationRequired && deadlineData && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      ICO Notification Deadline: {deadlineData.data.hoursRemaining} hours remaining
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setUpdateStatusDialogOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                  <Button onClick={() => setNotifyUsersDialogOpen(true)} variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Notify Users
                  </Button>
                  {selectedIncident.icoNotificationRequired && !selectedIncident.icoNotifiedAt && (
                    <Button onClick={() => setReportICODialogOpen(true)} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Report to ICO
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={updateStatusDialogOpen} onOpenChange={setUpdateStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Incident Status</DialogTitle>
              <DialogDescription>Change the status of this security incident</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select
                  value={statusUpdateForm.status}
                  onValueChange={(value) =>
                    setStatusUpdateForm({ ...statusUpdateForm, status: value })
                  }
                >
                  <SelectTrigger id="new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                    <SelectItem value="CONTAINED">Contained</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {statusUpdateForm.status === 'CONTAINED' && (
                <div>
                  <Label htmlFor="remediation">Remediation Steps</Label>
                  <Textarea
                    id="remediation"
                    value={statusUpdateForm.remediationSteps}
                    onChange={(e) =>
                      setStatusUpdateForm({
                        ...statusUpdateForm,
                        remediationSteps: e.target.value,
                      })
                    }
                    placeholder="Describe the remediation steps taken"
                  />
                </div>
              )}
              {statusUpdateForm.status === 'RESOLVED' && (
                <div>
                  <Label htmlFor="lessons">Lessons Learned</Label>
                  <Textarea
                    id="lessons"
                    value={statusUpdateForm.lessonsLearned}
                    onChange={(e) =>
                      setStatusUpdateForm({
                        ...statusUpdateForm,
                        lessonsLearned: e.target.value,
                      })
                    }
                    placeholder="Document lessons learned from this incident"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notify Users Dialog */}
        <Dialog open={notifyUsersDialogOpen} onOpenChange={setNotifyUsersDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notify Affected Users</DialogTitle>
              <DialogDescription>
                Send breach notification emails to all affected users
              </DialogDescription>
            </DialogHeader>
            {selectedIncident && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {selectedIncident.affectedUserCount} users will be notified via email about this
                  security incident as required by GDPR Article 34.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotifyUsersDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleNotifyUsers} disabled={notifyUsersMutation.isPending}>
                {notifyUsersMutation.isPending ? 'Sending...' : 'Send Notifications'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report to ICO Dialog */}
        <Dialog open={reportICODialogOpen} onOpenChange={setReportICODialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report to ICO</DialogTitle>
              <DialogDescription>
                Report this security incident to the Information Commissioner's Office (ICO)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Under GDPR Article 33, this incident must be reported to the ICO within 72 hours
                  of detection.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="ico-reference">ICO Reference Number</Label>
                <Input
                  id="ico-reference"
                  value={icoForm.icoReferenceNumber}
                  onChange={(e) => setICOForm({ icoReferenceNumber: e.target.value })}
                  placeholder="ICO-2026-123456"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: ICO-YYYY-XXXXXX
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportICODialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportToICO} disabled={reportICOMutation.isPending}>
                {reportICOMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
