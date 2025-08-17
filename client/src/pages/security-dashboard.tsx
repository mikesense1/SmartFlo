import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Smartphone, 
  Clock, 
  Users,
  BarChart3,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueDevices: number;
  riskEvents: number;
  averageRiskScore: number;
}

interface SecurityAlert {
  id: string;
  userId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: any;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  method?: string;
  success: boolean;
  ipAddress?: string;
  deviceFingerprint?: string;
  amount?: number;
  location?: string;
  riskScore: number;
  createdAt: string;
}

export default function SecurityDashboard() {
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState('overview');

  // Security metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['security-metrics', timeframe],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/security/metrics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json() as Promise<SecurityMetrics>;
    }
  });

  // Security alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/security/alerts");
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json() as Promise<SecurityAlert[]>;
    }
  });

  // Security events (recent)
  const { data: events } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/security/events?limit=100");
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json() as Promise<SecurityEvent[]>;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case '2fa_failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case '2fa_success': return <Shield className="w-4 h-4 text-green-500" />;
      case 'new_device': return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'geographic_anomaly': return <MapPin className="w-4 h-4 text-purple-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportSecurityReport = async () => {
    try {
      const response = await apiRequest("POST", "/api/security/export-report", {
        timeframe,
        includeEvents: true,
        includeAlerts: true
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `security-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Report Exported",
          description: "Security report downloaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export security report",
        variant: "destructive"
      });
    }
  };

  const refreshData = () => {
    refetchMetrics();
    refetchAlerts();
    toast({
      title: "Data Refreshed",
      description: "Security dashboard updated with latest data"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Security Dashboard</h1>
            <p className="text-slate-600 mt-1">Monitor 2FA security and threat detection</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Timeframe:</span>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value as 'day' | 'week' | 'month')}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="day">Last 24 hours</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
            
            <Button variant="outline" onClick={refreshData} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button variant="outline" onClick={exportSecurityReport} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Attempts</p>
                  <p className="text-2xl font-bold">{metrics?.totalAttempts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={metrics ? (metrics.successfulAttempts / metrics.totalAttempts) * 100 : 0} className="h-2" />
                <p className="text-xs text-slate-500 mt-1">
                  Success Rate: {metrics && metrics.totalAttempts > 0 ? 
                    Math.round((metrics.successfulAttempts / metrics.totalAttempts) * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Failed Attempts</p>
                  <p className="text-2xl font-bold text-red-600">{metrics?.failedAttempts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600">12% decrease</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Unique Devices</p>
                  <p className="text-2xl font-bold">{metrics?.uniqueDevices || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Risk Events</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics?.riskEvents || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500">
                  Avg Risk Score: {metrics?.averageRiskScore?.toFixed(1) || '0.0'}/10
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Alerts</CardTitle>
                  <CardDescription>Last 24 hours critical and high priority alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alerts?.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.severity === 'critical' ? 'text-red-500' : 
                          alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-slate-500">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No security alerts found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis</CardTitle>
                  <CardDescription>Security threat assessment overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Failed Attempts</span>
                        <span className="text-red-600">{metrics?.failedAttempts || 0}</span>
                      </div>
                      <Progress 
                        value={metrics ? Math.min((metrics.failedAttempts / 10) * 100, 100) : 0} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Risk Score</span>
                        <span className="text-orange-600">{metrics?.averageRiskScore?.toFixed(1) || '0.0'}/10</span>
                      </div>
                      <Progress 
                        value={metrics ? (metrics.averageRiskScore * 10) : 0} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>High Risk Events</span>
                        <span className="text-purple-600">{metrics?.riskEvents || 0}</span>
                      </div>
                      <Progress 
                        value={metrics ? Math.min((metrics.riskEvents / 5) * 100, 100) : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {alerts?.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' : 
                        alert.severity === 'high' ? 'text-orange-500' : 
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <h3 className="font-semibold">{alert.message}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          User ID: {alert.userId} • Type: {alert.alertType}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                        
                        {/* Alert Metadata */}
                        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                            <p className="font-medium mb-1">Additional Details:</p>
                            {Object.entries(alert.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span>{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Security Alerts</h3>
                <p className="text-slate-500">All systems operating normally</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-3">
              {events?.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {getEventTypeIcon(event.eventType)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {event.eventType.replace(/_/g, ' ').toUpperCase()}
                            {event.method && ` via ${event.method}`}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.success ? "default" : "destructive"} className="text-xs">
                              {event.success ? 'Success' : 'Failed'}
                            </Badge>
                            {event.riskScore > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Risk: {event.riskScore}/10
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>User: {event.userId}</span>
                          {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                          {event.location && <span>Location: {event.location}</span>}
                          {event.amount && <span>Amount: ${(event.amount / 100).toFixed(2)}</span>}
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-16">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No Security Events</h3>
                  <p className="text-slate-500">No recent security events to display</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Alert>
              <BarChart3 className="w-4 h-4" />
              <AlertDescription>
                Advanced analytics dashboard with detailed insights coming soon.
                Export reports are available for detailed analysis.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Trends</CardTitle>
                  <CardDescription>Success rates and threat patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Trend analysis visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Payment attempts by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Geographic analytics visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}