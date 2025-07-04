import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Activity,
  Zap
} from "lucide-react";
import Navigation from "@/components/navigation";

interface BlockchainTestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export default function BlockchainTest() {
  const [testResults, setTestResults] = useState<BlockchainTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test endpoints with mock data
  const testEndpoints = [
    {
      name: "Create Contract",
      method: "POST",
      endpoint: "/api/contracts/create",
      data: {
        title: "Test Blockchain Contract",
        client: { name: "Test Client", email: "client@test.com" },
        milestones: [
          { title: "Design Phase", description: "Complete UI/UX design", amount: 1000, dueDate: "2025-01-15" }
        ],
        paymentMethod: "usdc",
        totalValue: 1000,
        creatorId: "test-freelancer"
      }
    },
    {
      name: "Fund Contract", 
      method: "POST",
      endpoint: "/api/contracts/fund",
      data: {
        contractId: "test-contract-123",
        paymentMethod: "usdc",
        amount: 1000,
        paymentDetails: { walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" }
      }
    },
    {
      name: "Submit Milestone",
      method: "POST", 
      endpoint: "/api/milestones/submit",
      data: {
        contractId: "test-contract-123",
        milestoneId: "milestone-1",
        deliverables: ["https://figma.com/test-design"],
        notes: "Design phase completed as per requirements"
      }
    },
    {
      name: "Approve Milestone",
      method: "POST",
      endpoint: "/api/milestones/approve", 
      data: {
        contractId: "test-contract-123",
        milestoneId: "milestone-1",
        approverId: "test-client",
        approvalNotes: "Design looks great, approved for payment"
      }
    },
    {
      name: "Check Payment Status",
      method: "GET",
      endpoint: "/api/contracts/test-contract-123/payments"
    }
  ];

  const runTest = async (test: any, index: number) => {
    const updatedResults = [...testResults];
    updatedResults[index] = { endpoint: test.endpoint, status: 'pending' };
    setTestResults(updatedResults);

    const startTime = Date.now();
    
    try {
      const options: RequestInit = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      if (test.data && test.method !== 'GET') {
        options.body = JSON.stringify(test.data);
      }

      const response = await fetch(test.endpoint, options);
      const data = await response.json();
      const duration = Date.now() - startTime;

      updatedResults[index] = {
        endpoint: test.endpoint,
        status: response.ok ? 'success' : 'error',
        response: data,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      updatedResults[index] = {
        endpoint: test.endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }

    setTestResults([...updatedResults]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(testEndpoints.map(test => ({ endpoint: test.endpoint, status: 'pending' as const })));

    for (let i = 0; i < testEndpoints.length; i++) {
      await runTest(testEndpoints[i], i);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: BlockchainTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: BlockchainTestResult['status']) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800", 
      pending: "bg-yellow-100 text-yellow-800"
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Blockchain API Integration Test
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Testing smart contract operations, payment automation, and blockchain integration
            </p>
            
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              {isRunning ? (
                <>
                  <Activity className="w-5 h-5 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Run Blockchain Tests
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          <div className="grid gap-6">
            {testResults.map((result, index) => {
              const testName = testEndpoints[index]?.name || `Test ${index + 1}`;
              
              return (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <span>{testName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(result.status)}
                        {result.duration && (
                          <Badge variant="outline">{result.duration}ms</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">{testEndpoints[index]?.method}</span>
                        <span>{result.endpoint}</span>
                      </div>
                      
                      {result.response && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Response:</h4>
                          <pre className="bg-slate-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(result.response, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {result.error && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Error:</h4>
                          <p className="text-red-600 bg-red-50 p-3 rounded">{result.error}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          {testResults.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Test Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(r => r.status === 'success').length}
                    </div>
                    <div className="text-sm text-slate-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(r => r.status === 'error').length}
                    </div>
                    <div className="text-sm text-slate-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {testResults.filter(r => r.status === 'pending').length}
                    </div>
                    <div className="text-sm text-slate-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-700">
                      {testResults.reduce((sum, r) => sum + (r.duration || 0), 0)}ms
                    </div>
                    <div className="text-sm text-slate-600">Total Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}