import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, DollarSign, Clock, CheckCircle, 
  AlertCircle, CreditCard, Activity, TrendingUp,
  Eye, User, FileIcon, MessageSquare
} from "lucide-react";
import Navigation from "@/components/navigation";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContract, setSelectedContract] = useState(null);

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const currentUser = userResponse?.user || userResponse;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !currentUser) {
      window.location.href = "/login";
    }
  }, [currentUser, userLoading]);

  // Redirect to setup if user hasn't completed profile
  useEffect(() => {
    if (currentUser && !currentUser.userType) {
      window.location.href = "/setup";
    }
  }, [currentUser]);

  // Fetch client contracts (where user is clientId or clientEmail matches)
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/client-contracts"],
    enabled: !!currentUser,
    queryFn: async () => {
      const response = await fetch("/api/client-contracts");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return [];
        }
        throw new Error("Failed to fetch contracts");
      }
      return response.json();
    }
  });

  const activeContracts = contracts.filter((contract: any) => contract.status === "active");
  const pendingContracts = contracts.filter((contract: any) => contract.status === "sent");
  const completedContracts = contracts.filter((contract: any) => contract.status === "completed");

  // Calculate client stats
  const totalSpent = completedContracts.reduce((sum: number, contract: any) => 
    sum + parseFloat(contract.totalValue || "0"), 0);
  
  const activeValue = activeContracts.reduce((sum: number, contract: any) => 
    sum + parseFloat(contract.totalValue || "0"), 0);

  if (userLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600">Manage your freelance projects and contracts</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold text-gray-900">{currentUser?.fullName}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{activeContracts.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingContracts.length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Value</p>
                  <p className="text-2xl font-bold text-gray-900">${activeValue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Projects</TabsTrigger>
            <TabsTrigger value="pending">Pending Contracts</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates on your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contracts.slice(0, 3).map((contract: any) => (
                      <div key={contract.id} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{contract.title}</p>
                          <p className="text-xs text-gray-500">
                            {contract.status === "sent" ? "Contract sent" : 
                             contract.status === "active" ? "Project in progress" : 
                             "Project completed"}
                          </p>
                        </div>
                        <Badge variant={
                          contract.status === "active" ? "default" :
                          contract.status === "sent" ? "secondary" :
                          "outline"
                        }>
                          {contract.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for clients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View All Contracts
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Active Projects Tab */}
          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6">
              {activeContracts.length > 0 ? activeContracts.map((contract: any) => (
                <Card key={contract.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{contract.title}</CardTitle>
                        <CardDescription className="mt-2">
                          Freelancer: {contract.clientName}
                        </CardDescription>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Project Value</p>
                        <p className="text-lg font-semibold">${parseFloat(contract.totalValue || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contract Type</p>
                        <p className="text-sm capitalize">{contract.contractType?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Payment Method</p>
                        <p className="text-sm capitalize">
                          {contract.paymentMethod?.replace('_', ' ') || 'Not selected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Freelancer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">No Active Projects</p>
                    <p className="text-gray-600">You don't have any active projects at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Pending Contracts Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="grid gap-6">
              {pendingContracts.length > 0 ? pendingContracts.map((contract: any) => (
                <Card key={contract.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{contract.title}</CardTitle>
                        <CardDescription className="mt-2">
                          From: {contract.clientName}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Project Value</p>
                        <p className="text-lg font-semibold">${parseFloat(contract.totalValue || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contract Type</p>
                        <p className="text-sm capitalize">{contract.contractType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Review & Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">No Pending Contracts</p>
                    <p className="text-gray-600">You don't have any contracts waiting for review.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-6">
            <div className="grid gap-6">
              {completedContracts.length > 0 ? completedContracts.map((contract: any) => (
                <Card key={contract.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{contract.title}</CardTitle>
                        <CardDescription className="mt-2">
                          Completed by: {contract.clientName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Final Amount</p>
                        <p className="text-lg font-semibold">${parseFloat(contract.totalValue || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-sm">{new Date(contract.completedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Payment Status</p>
                        <Badge className="bg-green-100 text-green-800">Paid</Badge>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">No Completed Projects</p>
                    <p className="text-gray-600">You haven't completed any projects yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}