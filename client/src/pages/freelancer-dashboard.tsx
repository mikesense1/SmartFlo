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
  Plus, FileText, DollarSign, Clock, CheckCircle, 
  AlertCircle, Wallet, CreditCard, Activity, Target,
  TrendingUp, TrendingDown, Lock, Zap, Users, Eye, Edit, User
} from "lucide-react";
import Navigation from "@/components/navigation";

export default function FreelancerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractDocument, setContractDocument] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Mock user ID - in production this would come from auth
  const currentUserId = "6d52e85d-2ee5-4922-a7cf-0aef6f52b8ba"; // Alex Morgan

  // Fetch contracts for current user
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      console.log("Fetching user contracts...");
      const response = await fetch("/api/contracts");
      if (!response.ok) throw new Error("Failed to fetch contracts");
      const allContracts = await response.json();
      console.log("Successfully fetched contracts:", allContracts);
      
      // Filter contracts for current user
      const userContracts = allContracts.filter((contract: any) => 
        contract.creatorId === currentUserId || contract.creator_id === currentUserId
      );
      console.log("User contracts filtered:", userContracts.length);
      
      if (userContracts.length > 0) {
        console.log("Sample contract fields:", Object.keys(userContracts[0]));
      }
      
      return userContracts;
    }
  });

  const activeContracts = contracts.filter((contract: any) => contract.status === "active");
  const draftContracts = contracts.filter((contract: any) => contract.status === "draft");

  // Calculate stats
  const realtimeStats = {
    totalEarnings: contracts.reduce((sum: number, contract: any) => 
      sum + parseFloat(contract.totalValue || contract.total_value || "0"), 0),
    activeContracts: activeContracts.length,
    completedMilestones: 12, // Mock data
    avgPaymentDays: 2,
    lifetimeEarnings: 85000,
    inEscrow: 25000,
    pendingApproval: 8500
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                Freelancer Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manage your contracts and track earnings</p>
            </div>
            <Link href="/create-contract">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Contract
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeContracts.length} active, {draftContracts.length} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${realtimeStats.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all contracts
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
                Secured payments
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
            <TabsTrigger value="contracts">All Contracts</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
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
                        {activeContracts.slice(0, 3).map((contract: any) => (
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
                      <Target className="w-4 h-4 mr-2" />
                      Submit Milestone
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Request Payment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Contracts</CardTitle>
                <CardDescription>Manage all your freelance contracts</CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No contracts found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {contracts.map((contract: any) => (
                      <Card key={contract.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{contract.title}</CardTitle>
                              <CardDescription>
                                {contract.clientName} • {contract.clientEmail}
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
                              <div className="text-sm text-slate-500">Type</div>
                              <div className="capitalize">{(contract.contractType || "milestone_based").replace("_", " ")}</div>
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
                              <>
                                <Link href={`/edit-contract/${contract.id}`}>
                                  <Button variant="default" size="sm">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Contract
                                  </Button>
                                </Link>
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
                              <>
                                <Link href={`/milestone-tracker/${contract.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Target className="w-4 h-4 mr-2" />
                                    Track Milestones
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Draft Contracts</CardTitle>
                <CardDescription>Contracts waiting to be finalized and sent to clients</CardDescription>
              </CardHeader>
              <CardContent>
                {draftContracts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No draft contracts.</p>
                    <Link href="/create-contract">
                      <Button className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Contract
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {draftContracts.map((contract: any) => (
                      <div key={contract.id} className="border rounded-lg p-4 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{contract.title}</h3>
                            <p className="text-sm text-slate-600">{contract.clientName}</p>
                            <p className="text-sm text-slate-500 mt-1">${contract.totalValue}</p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/edit-contract/${contract.id}`}>
                              <Button size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            </Link>
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
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Your revenue performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>This Month</span>
                      <span className="font-semibold">$12,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Month</span>
                      <span className="font-semibold">$8,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Growth</span>
                      <span className="font-semibold text-green-600">+52%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Performance</CardTitle>
                  <CardDescription>Project completion metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>On-time Delivery</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Satisfaction</span>
                      <span className="font-semibold">4.8/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repeat Clients</span>
                      <span className="font-semibold">68%</span>
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