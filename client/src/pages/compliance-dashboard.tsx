import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Users,
  CreditCard,
  FileText,
  Download,
  RefreshCw,
  MapPin,
  DollarSign,
  Clock,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

interface PCIComplianceStatus {
  cardDataStorage: 'compliant' | 'non_compliant' | 'review_needed';
  networkSecurity: 'compliant' | 'non_compliant' | 'review_needed';
  accessControl: 'compliant' | 'non_compliant' | 'review_needed';
  monitoring: 'compliant' | 'non_compliant' | 'review_needed';
  vulnerabilityManagement: 'compliant' | 'non_compliant' | 'review_needed';
  informationSecurity: 'compliant' | 'non_compliant' | 'review_needed';
  overallScore: number;
  lastAssessment: string;
  nextAssessment: string;
}

interface AuthorizationRecord {
  id: string;
  contractId: string;
  clientId: string;
  method: 'stripe' | 'usdc';
  status: 'active' | 'revoked' | 'expired' | 'suspended';
  totalAuthorized: number;
  totalCharged: number;
  authorizedAt: string;
  lastUsedAt?: string;
}

interface DisputeRecord {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  openedAt: string;
  resolvedAt?: string;
}

interface ComplianceMetrics {
  totalEvents: number;
  authorizationEvents: number;
  paymentEvents: number;
  disputeEvents: number;
  failedPayments: number;
  revokedAuthorizations: number;
  complianceIssues: number;
}

export default function ComplianceDashboard() {
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // PCI Compliance Status
  const { data: pciStatus, refetch: refetchPCI } = useQuery({
    queryKey: ['pci-compliance'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/compliance/pci-status");
      if (!response.ok) throw new Error('Failed to fetch PCI compliance status');
      return response.json() as Promise<PCIComplianceStatus>;
    }
  });

  // Compliance Metrics
  const { data: metrics } = useQuery({
    queryKey: ['compliance-metrics', selectedPeriod],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/compliance/metrics?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch compliance metrics');
      return response.json() as Promise<ComplianceMetrics>;
    }
  });

  // Authorization Records
  const { data: authorizations } = useQuery({
    queryKey: ['authorization-records'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/compliance/authorizations");
      if (!response.ok) throw new Error('Failed to fetch authorization records');
      return response.json() as Promise<AuthorizationRecord[]>;
    }
  });

  // Dispute Records
  const { data: disputes } = useQuery({
    queryKey: ['dispute-records'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/compliance/disputes");
      if (!response.ok) throw new Error('Failed to fetch dispute records');
      return response.json() as Promise<DisputeRecord[]>;
    }
  });

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'review_needed':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'non_compliant':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'review_needed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const runComplianceJobs = async () => {
    try {
      const response = await apiRequest("POST", "/api/compliance/run-monthly-jobs");
      if (response.ok) {
        const results = await response.json();
        toast({
          title: "Compliance Jobs Completed",
          description: `Checked ${results.expiring_cards} cards, cleaned ${results.logs_cleaned} logs`
        });
        refetchPCI();
      }
    } catch (error) {
      toast({
        title: "Job Failed",
        description: "Failed to run compliance jobs",
        variant: "destructive"
      });
    }
  };

  const exportComplianceReport = async () => {
    try {
      const response = await apiRequest("POST", "/api/compliance/export-report", {
        period: selectedPeriod,
        includeAuthorizations: true,
        includeDisputes: true
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `compliance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Report Exported",
          description: "Compliance report downloaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export compliance report",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compliance Dashboard</h1>
            <p className="text-slate-600 mt-1">PCI compliance, audit trails, and regulatory reporting</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Period:</span>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            
            <Button variant="outline" onClick={runComplianceJobs} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Jobs
            </Button>
            
            <Button variant="outline" onClick={exportComplianceReport} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* PCI Compliance Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                  PCI DSS Compliance Status
                </CardTitle>
                <CardDescription>Payment Card Industry Data Security Standard</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{pciStatus?.overallScore || 0}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.cardDataStorage || 'review_needed')}
                  <span className="text-sm font-medium">Card Data Storage</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.cardDataStorage || 'review_needed')}>
                  {pciStatus?.cardDataStorage || 'Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.networkSecurity || 'review_needed')}
                  <span className="text-sm font-medium">Network Security</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.networkSecurity || 'review_needed')}>
                  {pciStatus?.networkSecurity || 'Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.accessControl || 'review_needed')}
                  <span className="text-sm font-medium">Access Control</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.accessControl || 'review_needed')}>
                  {pciStatus?.accessControl || 'Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.monitoring || 'review_needed')}
                  <span className="text-sm font-medium">Monitoring & Logging</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.monitoring || 'review_needed')}>
                  {pciStatus?.monitoring || 'Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.vulnerabilityManagement || 'review_needed')}
                  <span className="text-sm font-medium">Vulnerability Management</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.vulnerabilityManagement || 'review_needed')}>
                  {pciStatus?.vulnerabilityManagement || 'Review'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getComplianceStatusIcon(pciStatus?.informationSecurity || 'review_needed')}
                  <span className="text-sm font-medium">Information Security</span>
                </div>
                <Badge className={getStatusColor(pciStatus?.informationSecurity || 'review_needed')}>
                  {pciStatus?.informationSecurity || 'Review'}
                </Badge>
              </div>
            </div>
            
            <Progress value={pciStatus?.overallScore || 0} className="h-3" />
            
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Last Assessment: {pciStatus?.lastAssessment ? new Date(pciStatus.lastAssessment).toLocaleDateString() : 'N/A'}</span>
              <span>Next Assessment: {pciStatus?.nextAssessment ? new Date(pciStatus.nextAssessment).toLocaleDateString() : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Events</p>
                  <p className="text-2xl font-bold">{metrics?.totalEvents || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Audit events tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Authorizations</p>
                  <p className="text-2xl font-bold">{authorizations?.filter(a => a.status === 'active').length || 0}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Payment methods authorized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Disputes</p>
                  <p className="text-2xl font-bold text-red-600">{disputes?.filter(d => d.status === 'open').length || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Requiring resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Failed Payments</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics?.failedPayments || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                In selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authorization Metrics</CardTitle>
                  <CardDescription>Payment authorization overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {authorizations?.filter(a => a.status === 'active').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {authorizations?.filter(a => a.status === 'revoked').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Revoked</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stripe Authorizations</span>
                      <span>{authorizations?.filter(a => a.method === 'stripe').length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>USDC Authorizations</span>
                      <span>{authorizations?.filter(a => a.method === 'usdc').length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispute Summary</CardTitle>
                  <CardDescription>Dispute handling status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {disputes?.filter(d => d.status === 'open').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Open</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {disputes?.filter(d => d.status === 'resolved').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Resolved</div>
                    </div>
                  </div>
                  
                  {disputes?.filter(d => d.status === 'open').length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        {disputes.filter(d => d.status === 'open').length} disputes require attention
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authorizations" className="space-y-4">
            {authorizations?.map((auth) => (
              <Card key={auth.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        auth.method === 'stripe' ? 'bg-purple-100' : 'bg-orange-100'
                      }`}>
                        {auth.method === 'stripe' ? 
                          <CreditCard className="w-6 h-6 text-purple-600" /> :
                          <DollarSign className="w-6 h-6 text-orange-600" />
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {auth.method.toUpperCase()} Authorization
                        </h3>
                        <p className="text-sm text-slate-600">
                          Contract: {auth.contractId} • Client: {auth.clientId}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-500">
                          <div>
                            <span className="font-medium">Authorized:</span> ${(auth.totalAuthorized / 100).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Charged:</span> ${(auth.totalCharged / 100).toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(auth.authorizedAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Last Used:</span> {auth.lastUsedAt ? new Date(auth.lastUsedAt).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(auth.status)}>
                      {auth.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Authorization Records</h3>
                <p className="text-slate-500">No payment authorizations found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4">
            {disputes?.map((dispute) => (
              <Card key={dispute.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Dispute #{dispute.id}</h3>
                        <p className="text-sm text-slate-600 mb-2">
                          Amount: ${(dispute.amount / 100).toFixed(2)} • Payment: {dispute.paymentId}
                        </p>
                        <p className="text-sm text-slate-700 mb-2">
                          <span className="font-medium">Reason:</span> {dispute.reason}
                        </p>
                        <div className="text-xs text-slate-500">
                          <div>Opened: {new Date(dispute.openedAt).toLocaleDateString()}</div>
                          {dispute.resolvedAt && (
                            <div>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={
                      dispute.status === 'open' ? 'bg-red-100 text-red-800 border-red-200' :
                      dispute.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }>
                      {dispute.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Disputes</h3>
                <p className="text-slate-500">No payment disputes found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Alert>
              <FileText className="w-4 h-4" />
              <AlertDescription>
                Comprehensive audit trail with 7-year retention policy. All events are cryptographically hashed for integrity verification.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle>Audit Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics?.authorizationEvents || 0}</div>
                    <div className="text-sm text-gray-600">Authorization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics?.paymentEvents || 0}</div>
                    <div className="text-sm text-gray-600">Payment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{metrics?.complianceIssues || 0}</div>
                    <div className="text-sm text-gray-600">Issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}