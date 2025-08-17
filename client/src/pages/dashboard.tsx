import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, FileText, DollarSign, Clock, CheckCircle, 
  AlertCircle, Wallet, CreditCard, Activity, Target,
  TrendingUp, TrendingDown, Lock, Zap, Users, Eye, Edit, Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { paymentTriggers } from "@/lib/payments/smart-triggers";
import Navigation from "@/components/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Contract, Milestone, Payment } from "@shared/schema";

export default function Dashboard() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractDocument, setContractDocument] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [realtimeStats, setRealtimeStats] = useState({
    lifetimeEarnings: 24750,
    inEscrow: 6000,
    pendingApproval: 2800,
    avgPaymentDays: 1.2,
    activeContracts: 3,
    completedProjects: 12
  });

  // Show loading state while user data is loading
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (after loading completes)
  if (!currentUser) {
    console.log("Dashboard: No current user found, redirecting to login");
    // Use a timeout to prevent immediate redirect loops
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <p className="text-slate-600">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user contracts with proper authentication
  const { data: contracts = [], isLoading: contractsLoading, error: contractsError } = useQuery({
    queryKey: ["/api/contracts", currentUser.id],
    queryFn: async () => {
      try {
        console.log(`Fetching contracts for user: ${currentUser.fullName} (${currentUser.id})`);
        const response = await fetch('/api/contracts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          credentials: 'include' // Include authentication cookies
        });
        
        if (!response.ok) {
          console.warn(`Contract fetch returned ${response.status}, using empty data`);
          return [];
        }
        
        const data = await response.json();
        console.log("Successfully fetched user-specific contracts:", data.length);
        
        if (!Array.isArray(data)) {
          console.warn("Invalid contract data format, using empty array");
          return [];
        }
        
        return data; // API already filters by authenticated user
        
      } catch (error) {
        console.error("Contract fetch error:", error);
        return [];
      }
    },
    retry: 2, // Reduce retries to prevent connection overload
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchInterval: false, // Disable automatic polling to reduce server load
    staleTime: 60000,
    // Ensure the query doesn't cause the dashboard to go blank on errors
    throwOnError: false,
    refetchOnWindowFocus: false
  });

  // Create new contract mutation
  const createContractMutation = useMutation({
    mutationFn: (contractData: any) => 
      fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", currentUser.id] });
    }
  });

  // Function to fetch contract document
  const fetchContractDocument = async (contractId: string) => {
    setIsLoadingDocument(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/document`);
      if (response.ok) {
        const data = await response.json();
        setContractDocument(data.document);
      } else {
        setContractDocument("Contract document not available. This contract may not have been generated with AI contract generation.");
      }
    } catch (error) {
      console.error("Error fetching contract document:", error);
      setContractDocument("Error loading contract document. Please try again later.");
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    fetchContractDocument(contract.id);
  };

  const handleCreateContract = () => {
    createContractMutation.mutate({
      creatorId: currentUser.id,
      title: "Sample Web Development Project",
      clientName: "Tech Startup Inc",
      clientEmail: "client@techstartup.com",
      projectDescription: "Complete website redesign with modern UI/UX",
      totalValue: "5000.00",
      paymentMethod: "stripe",
      contractType: "milestone_based"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "disputed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const activeContracts = contracts.filter(c => c.status === "active");
  const totalEarnings = contracts.reduce((sum, c) => sum + parseFloat(c.totalValue || c.total_value || "0"), 0);
  const completedContracts = contracts.filter(c => c.status === "completed").length;

  // Setup real-time payment event listeners
  useEffect(() => {
    const handlePaymentEvent = (event: any) => {
      setRealtimeStats(prev => ({
        ...prev,
        lifetimeEarnings: prev.lifetimeEarnings + (event.amount || 0),
        pendingApproval: Math.max(0, prev.pendingApproval - (event.amount || 0))
      }));
    };

    paymentTriggers.addEventListener('milestone_approved', handlePaymentEvent);
    
    return () => {
      paymentTriggers.removeEventListener('milestone_approved', handlePaymentEvent);
    };
  }, []);

  // Show loading spinner only on initial page load
  if (contractsLoading && contracts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-slate-600">Loading your dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {currentUser.fullName}</h1>
                <p className="text-sm text-slate-500">{currentUser.userType === 'freelancer' ? 'Freelancer' : 'Client'} • Member since 2025</p>
              </div>
            </div>
            <Link href="/create-contract">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Contract
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Freelancer Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${realtimeStats.lifetimeEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
              <Lock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${realtimeStats.inEscrow.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {realtimeStats.activeContracts} active contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${realtimeStats.pendingApproval.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                2 milestones submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{realtimeStats.avgPaymentDays} days</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="w-3 h-3 mr-1 text-green-600" />
                85% faster than industry
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Contracts</CardTitle>
                    <CardDescription>Your current projects and their progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeContracts.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No active contracts yet.</p>
                        <Link href="/create-contract">
                          <Button className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Contract
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activeContracts.slice(0, 3).map((contract) => (
                          <div key={contract.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold">{contract.title}</h3>
                                <p className="text-sm text-slate-600">{contract.clientName}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">${contract.totalValue}</div>
                                <Badge className={getStatusColor(contract.status)}>
                                  {contract.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>3 of 5 milestones completed</span>
                              </div>
                              <Progress value={60} className="h-2" />
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Link href={`/milestone-tracker/${contract.id}`}>
                                <Button variant="outline" size="sm">
                                  <Target className="w-4 h-4 mr-2" />
                                  Track Progress
                                </Button>
                              </Link>
                              <Link href={`/client-payment/${contract.id}`}>
                                <Button variant="outline" size="sm">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  View Payment
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Milestones</CardTitle>
                    <CardDescription>Your next deliverables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">Backend Integration</h4>
                          <p className="text-xs text-slate-600">E-commerce Website</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Due in 3 days</span>
                            <Badge variant="secondary" className="text-xs">$2,000</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">Final Testing</h4>
                          <p className="text-xs text-slate-600">Mobile App Project</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">Due in 7 days</span>
                            <Badge variant="secondary" className="text-xs">$1,200</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">Design Review</h4>
                          <p className="text-xs text-slate-600">Brand Identity Project</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-600">Submitted</span>
                            <Badge variant="secondary" className="text-xs">$800</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/create-contract">
                      <Button className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Contract
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Browse Client Requests
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      View Performance Analytics
                    </Button>
                    <Link href="/blockchain-test">
                      <Button variant="outline" className="w-full justify-start">
                        <Zap className="w-4 h-4 mr-2" />
                        Test Blockchain APIs
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            {contractsError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-red-800">
                    Error loading contracts: {contractsError.message}
                  </div>
                </CardContent>
              </Card>
            )}
            {contractsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading contracts...</div>
              </div>
            ) : contracts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <FileText className="w-12 h-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No contracts yet</h3>
                  <p className="text-slate-500 text-center mb-4">
                    Create your first contract to start getting paid faster
                  </p>
                  <Link href="/create-contract">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Contract
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {contracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{contract.title}</CardTitle>
                          <CardDescription>
                            {contract.clientName || contract.client_name} • {contract.clientEmail || contract.client_email}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Total Value</div>
                          <div className="text-xl font-semibold">${parseFloat(contract.totalValue || contract.total_value || "0").toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Payment Method</div>
                          <div className="flex items-center gap-2">
                            {(contract.paymentMethod || contract.payment_method) === "stripe" ? (
                              <>
                                <CreditCard className="w-4 h-4" />
                                <span>Credit Card</span>
                              </>
                            ) : (
                              <>
                                <Wallet className="w-4 h-4" />
                                <span>USDC</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Type</div>
                          <div className="capitalize">{(contract.contractType || contract.contract_type || "milestone_based").replace("_", " ")}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-slate-500 mb-2">Project Description</div>
                        <p className="text-sm text-slate-700">{contract.projectDescription || contract.project_description}</p>
                      </div>
                      {(contract.contractType || contract.contract_type) === "milestone_based" && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-500">Progress</span>
                            <span className="text-sm text-slate-700">3 of 5 milestones</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                        {contract.status === 'draft' ? (
                          // Draft contract actions
                          <>
                            <Link href={`/edit-contract/${contract.id}`}>
                              <Button variant="default" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Contract
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Contract Sent!",
                                  description: `Contract sent to ${contract.clientEmail || contract.client_email}`,
                                });
                              }}
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Send Contract
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleViewContract(contract)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Preview
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Contract Preview - {selectedContract?.title}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  {isLoadingDocument ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                      <span className="ml-3 text-slate-600">Loading contract document...</span>
                                    </div>
                                  ) : contractDocument ? (
                                    <div className="bg-white border rounded-lg p-6">
                                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                        {contractDocument}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-slate-500">
                                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                      <p>No contract document available</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          // Active/completed contract actions
                          <>
                            <Link href={`/milestone-tracker/${contract.id}`}>
                              <Button variant="outline" size="sm">
                                <Target className="w-4 h-4 mr-2" />
                                Update Milestones
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Payment Requested",
                                  description: "Client will be notified to fund the next milestone.",
                                });
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Request Payment
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Contract Sent!",
                                  description: `Contract resent to ${contract.clientEmail || contract.client_email}`,
                                });
                              }}
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Send Contract
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleViewContract(contract)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Contract
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Contract Document - {selectedContract?.title}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  {isLoadingDocument ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                      <span className="ml-3 text-slate-600">Loading contract document...</span>
                                    </div>
                                  ) : contractDocument ? (
                                    <div className="bg-white border rounded-lg p-6">
                                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                        {contractDocument}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-slate-500">
                                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                      <p>No contract document available</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Your payment history and upcoming payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  No payments yet. Complete milestones to receive payments.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Timeline</CardTitle>
                  <CardDescription>Your revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-slate-500">
                    Chart will appear here once you have contract data
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Performance</CardTitle>
                  <CardDescription>Success rates and completion times</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Average Completion Time</span>
                      <span className="text-sm font-medium">15 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Client Satisfaction</span>
                      <span className="text-sm font-medium">4.8/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Payment Speed</span>
                      <span className="text-sm font-medium">Same day</span>
                    </div>
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