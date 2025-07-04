import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, FileText, DollarSign, Clock, CheckCircle, 
  AlertCircle, Wallet, CreditCard, Activity, Target
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contract, Milestone, Payment } from "@shared/schema";

// Mock user ID for demonstration
const MOCK_USER_ID = "user-123";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("contracts");

  // Fetch user contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/users", MOCK_USER_ID, "contracts"],
    queryFn: () => fetch(`/api/users/${MOCK_USER_ID}/contracts`).then(res => res.json()) as Promise<Contract[]>
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
      queryClient.invalidateQueries({ queryKey: ["/api/users", MOCK_USER_ID, "contracts"] });
    }
  });

  const handleCreateContract = () => {
    createContractMutation.mutate({
      creatorId: MOCK_USER_ID,
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
  const totalEarnings = contracts.reduce((sum, c) => sum + parseFloat(c.totalValue || "0"), 0);
  const completedContracts = contracts.filter(c => c.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeContracts.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedContracts}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contracts.length > 0 ? Math.round((completedContracts / contracts.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Contract completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-6">
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
                          <div className="text-xl font-semibold">${parseFloat(contract.totalValue).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Payment Method</div>
                          <div className="flex items-center gap-2">
                            {contract.paymentMethod === "stripe" ? (
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
                          <div className="capitalize">{contract.contractType.replace("_", " ")}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm text-slate-500 mb-2">Project Description</div>
                        <p className="text-sm text-slate-700">{contract.projectDescription}</p>
                      </div>
                      {contract.contractType === "milestone_based" && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-500">Progress</span>
                            <span className="text-sm text-slate-700">3 of 5 milestones</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Link href={`/milestone-tracker/${contract.id}`}>
                          <Button variant="outline" size="sm">
                            <Target className="w-4 h-4 mr-2" />
                            Track Milestones
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Contract
                        </Button>
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