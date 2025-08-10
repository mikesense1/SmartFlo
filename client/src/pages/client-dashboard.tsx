import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, FileText, DollarSign, Clock, CheckCircle, 
  AlertCircle, Wallet, CreditCard, Activity, Target,
  TrendingUp, TrendingDown, Lock, Zap, Users, Eye, Edit, Building2
} from "lucide-react";
import Navigation from "@/components/navigation";

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractDocument, setContractDocument] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  // Fetch current user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const currentUser = userResponse?.user;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !currentUser) {
      window.location.href = "/login";
    }
  }, [currentUser, userLoading]);

  // Fetch contracts for authenticated client
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/contracts"],
    enabled: !!currentUser,
    queryFn: async () => {
      console.log("Fetching authenticated client contracts...");
      const response = await fetch("/api/contracts");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return [];
        }
        throw new Error("Failed to fetch contracts");
      }
      const contracts = await response.json();
      console.log(`Successfully fetched ${contracts.length} contracts for authenticated client`);
      return contracts;
    }
  });

  const activeContracts = contracts.filter((contract: any) => contract.status === "active");
  const pendingContracts = contracts.filter((contract: any) => contract.status === "draft");

  // Calculate stats from actual user data
  const totalInvestment = contracts.reduce((sum: number, contract: any) => 
    sum + parseFloat(contract.totalValue || contract.total_value || "0"), 0);
  
  const completedProjects = contracts.filter((contract: any) => contract.status === "completed");
  const completedSpending = completedProjects.reduce((sum: number, contract: any) => 
    sum + parseFloat(contract.totalValue || contract.total_value || "0"), 0);
  
  const activeSpending = activeContracts.reduce((sum: number, contract: any) => 
    sum + parseFloat(contract.totalValue || contract.total_value || "0"), 0);

  const realtimeStats = {
    totalInvestment,
    activeProjects: activeContracts.length,
    completedProjects: completedProjects.length,
    avgDeliveryTime: contracts.length > 0 ? 14 : 0, // Show 0 if no contracts
    totalBudget: totalInvestment,
    spent: completedSpending,
    remaining: totalInvestment - completedSpending
  };

  const handleViewContract = async (contract: any) => {
    setSelectedContract(contract);
    setIsLoadingDocument(true);
    fetchContractDocument(contract.id);
  };

  const fetchContractDocument = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/document`);
      if (response.ok) {
        const data = await response.json();
        setContractDocument(data.document);
      } else {
        setContractDocument("Contract document not available");
      }
    } catch (error) {
      setContractDocument("Failed to load contract document");
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleFundContract = async (contractId: string) => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    try {
      // Update contract with payment method and activate it
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
          status: 'active',
          activatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert("Contract funded and activated successfully!");
        window.location.reload(); // Refresh to show updated status
      } else {
        alert("Failed to fund contract");
      }
    } catch (error) {
      alert("Error funding contract");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "stripe_card": return { icon: CreditCard, label: "Credit Card" };
      case "stripe_ach": return { icon: CreditCard, label: "Bank Transfer (ACH)" };
      case "usdc": return { icon: Wallet, label: "USDC Crypto" };
      default: return { icon: DollarSign, label: "Not Selected" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-600" />
                Client Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manage your projects and track progress</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realtimeStats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                {contracts.length} total contracts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${realtimeStats.totalInvestment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${realtimeStats.remaining.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Available for new projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{realtimeStats.avgDeliveryTime} days</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {contracts.length > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                    On schedule
                  </>
                ) : (
                  'No projects yet'
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
            <TabsTrigger value="pending">Pending Funding</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>Your current projects and their progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeContracts.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No active projects yet.</p>
                        <p className="text-sm mt-2">Projects will appear here once freelancers create contracts for you.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activeContracts.slice(0, 3).map((contract: any) => (
                          <div key={contract.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold">{contract.title}</h3>
                                <p className="text-sm text-slate-600">by {contract.creatorName || "Freelancer"}</p>
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
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                    <CardTitle>Budget Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Budget</span>
                      <span className="font-semibold">${realtimeStats.totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent</span>
                      <span className="font-semibold">${realtimeStats.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span className="font-semibold text-green-600">${realtimeStats.remaining.toLocaleString()}</span>
                    </div>
                    <Progress value={(realtimeStats.spent / realtimeStats.totalBudget) * 100} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Milestone
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Release Payment
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      Request Update
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>View and manage all your projects</CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No projects found.</p>
                    <p className="text-sm mt-2">Freelancers will create contracts that will appear here.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {contracts.map((contract: any) => {
                      const paymentDisplay = getPaymentMethodDisplay(contract.paymentMethod);
                      const PaymentIcon = paymentDisplay.icon;
                      
                      return (
                        <Card key={contract.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{contract.title}</CardTitle>
                                <CardDescription>
                                  by {contract.creatorName || "Freelancer"}
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
                                <div className="text-xl font-semibold">${parseFloat(contract.totalValue || "0").toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-500">Payment Method</div>
                                <div className="flex items-center gap-2">
                                  <PaymentIcon className="w-4 h-4" />
                                  <span>{paymentDisplay.label}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-slate-500">Created</div>
                                <div>{new Date(contract.createdAt || Date.now()).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="text-sm text-slate-500 mb-2">Project Description</div>
                              <p className="text-sm text-slate-700">{contract.projectDescription}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t flex gap-2">
                              {contract.status === 'draft' ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700">
                                      <DollarSign className="w-4 h-4 mr-2" />
                                      Fund & Activate
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Fund Contract - {contract.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">
                                          Select Payment Method
                                        </label>
                                        <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Choose how you'd like to pay" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="stripe_card">
                                              <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                Credit Card
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="stripe_ach">
                                              <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" />
                                                Bank Transfer (ACH)
                                              </div>
                                            </SelectItem>
                                            <SelectItem value="usdc">
                                              <div className="flex items-center gap-2">
                                                <Wallet className="w-4 h-4" />
                                                USDC Cryptocurrency
                                              </div>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="bg-slate-50 p-4 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                          <span>Contract Value:</span>
                                          <span className="font-semibold">${contract.totalValue}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Initial Escrow:</span>
                                          <span className="font-semibold">${contract.totalValue}</span>
                                        </div>
                                      </div>
                                      <Button 
                                        className="w-full"
                                        onClick={() => handleFundContract(contract.id)}
                                        disabled={!selectedPaymentMethod}
                                      >
                                        Fund Contract & Start Project
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <>
                                  <Link href={`/milestone-tracker/${contract.id}`}>
                                    <Button variant="outline" size="sm">
                                      <Target className="w-4 h-4 mr-2" />
                                      Track Progress
                                    </Button>
                                  </Link>
                                  <Button variant="outline" size="sm">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Manage Payments
                                  </Button>
                                </>
                              )}
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
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Funding</CardTitle>
                <CardDescription>Contracts waiting for your approval and funding</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingContracts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No contracts pending funding.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingContracts.map((contract: any) => (
                      <div key={contract.id} className="border rounded-lg p-4 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{contract.title}</h3>
                            <p className="text-sm text-slate-600">by {contract.creatorName || "Freelancer"}</p>
                            <p className="text-sm text-slate-500 mt-1">${contract.totalValue}</p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Fund Project
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Fund Contract - {contract.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Select Payment Method
                                    </label>
                                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose how you'd like to pay" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="stripe_card">
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            Credit Card
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="stripe_ach">
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            Bank Transfer (ACH)
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="usdc">
                                          <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4" />
                                            USDC Cryptocurrency
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                      <span>Contract Value:</span>
                                      <span className="font-semibold">${contract.totalValue}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Initial Escrow:</span>
                                      <span className="font-semibold">${contract.totalValue}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleFundContract(contract.id)}
                                    disabled={!selectedPaymentMethod}
                                  >
                                    Fund Contract & Start Project
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => handleViewContract(contract)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Contract Review - {selectedContract?.title}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                  {isLoadingDocument ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>Your project success metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>On-time Completion</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget Efficiency</span>
                      <span className="font-semibold">88%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Rating</span>
                      <span className="font-semibold">4.7/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Overview</CardTitle>
                  <CardDescription>Your spending analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Budget</span>
                      <span className="font-semibold">${realtimeStats.totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent</span>
                      <span className="font-semibold">${realtimeStats.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span className="font-semibold text-green-600">${realtimeStats.remaining.toLocaleString()}</span>
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