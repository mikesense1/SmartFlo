import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Wallet, Shield, Zap, FileText, 
  Clock, DollarSign, Users, TrendingUp 
} from "lucide-react";
import BlockchainPayment from "@/components/blockchain-payment";
import WalletContextProvider from "@/components/wallet-provider";

// Mock contract data for demo
const mockContract = {
  id: "contract-blockchain-demo",
  title: "E-commerce Platform Development",
  clientName: "TechStartup Inc",
  clientEmail: "client@techstartup.com",
  totalValue: "8500",
  paymentMethod: "usdc",
  contractType: "milestone_based",
  status: "active",
  description: "Build a modern e-commerce platform with React, Node.js, and Solana integration",
  createdAt: "2024-01-15",
  milestoneCount: 4,
};

const mockMilestones = [
  {
    id: "milestone-1",
    title: "Frontend Setup & Design System",
    description: "Create React app with Tailwind CSS and component library",
    amount: "2000",
    dueDate: "2024-02-01",
    status: "completed",
  },
  {
    id: "milestone-2", 
    title: "Backend API Development",
    description: "Build Node.js API with authentication and database integration",
    amount: "2500",
    dueDate: "2024-02-15",
    status: "in_progress",
  },
  {
    id: "milestone-3",
    title: "Solana Payment Integration", 
    description: "Integrate USDC payments and smart contract functionality",
    amount: "2500",
    dueDate: "2024-03-01",
    status: "pending",
  },
  {
    id: "milestone-4",
    title: "Testing & Deployment",
    description: "Complete testing, optimization, and production deployment",
    amount: "1500", 
    dueDate: "2024-03-15",
    status: "pending",
  },
];

export default function BlockchainContract() {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const completedMilestones = mockMilestones.filter(m => m.status === "completed").length;
  const totalEarned = mockMilestones
    .filter(m => m.status === "completed")
    .reduce((sum, m) => sum + parseFloat(m.amount), 0);

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{mockContract.title}</h1>
                  <p className="text-sm text-slate-500">{mockContract.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-800">
                  <Wallet className="w-4 h-4 mr-1" />
                  Blockchain Contract
                </Badge>
                <Badge className={getStatusColor(mockContract.status)}>
                  {mockContract.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${parseFloat(mockContract.totalValue).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">USDC on Solana</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedMilestones}/{mockMilestones.length}</div>
                <p className="text-xs text-muted-foreground">Milestones completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarned.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Paid instantly</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">Blockchain secured</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Contract Overview</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain Integration</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Complete project scope and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-slate-600">{mockContract.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Payment Method</h4>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span>USDC (Solana Blockchain)</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Contract Type</h4>
                      <span className="capitalize">{mockContract.contractType.replace("_", " ")}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Blockchain Benefits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span>Escrow Protection</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span>Instant Payments</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Transparent Records</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain" className="space-y-6">
              <BlockchainPayment contract={mockContract} milestones={mockMilestones} />
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <div className="grid gap-6">
                {mockMilestones.map((milestone, index) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Milestone {index + 1}: {milestone.title}
                          </CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-slate-500">Payment Amount</div>
                          <div className="text-xl font-semibold">
                            ${parseFloat(milestone.amount).toLocaleString()} USDC
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Due Date</div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{milestone.dueDate}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">Status</div>
                          <div className="capitalize">{milestone.status.replace("_", " ")}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Activity</CardTitle>
                  <CardDescription>
                    All contract interactions recorded on Solana blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Milestone 1 Payment Released</div>
                        <div className="text-sm text-slate-600">$2,000 USDC transferred to freelancer</div>
                        <div className="text-xs text-slate-500">Jan 15, 2024 • Tx: 5KJh...9mNp</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Funds Deposited to Escrow</div>
                        <div className="text-sm text-slate-600">$8,500 USDC secured in smart contract</div>
                        <div className="text-xs text-slate-500">Jan 10, 2024 • Tx: 7BxT...4aLk</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Smart Contract Deployed</div>
                        <div className="text-sm text-slate-600">Escrow contract created on Solana</div>
                        <div className="text-xs text-slate-500">Jan 8, 2024 • Contract: 9Qr...8Nm</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </WalletContextProvider>
  );
}