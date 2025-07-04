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

  const testEndpoints = [
    {
      name: "Advanced Contract Creation",
      endpoint: "/api/contracts/create-advanced",
      method: "POST",
      data: {
        title: "Blockchain Test Contract",
        client: {
          name: "Test Client",
          email: "client@test.com"
        },
        milestones: [
          {
            title: "Smart Contract Setup",
            description: "Deploy and configure blockchain contract",
            amount: 2500,
            dueDate: "2025-01-30"
          },
          {
            title: "Payment Integration",
            description: "Connect USDC payment system",
            amount: 1500,
            dueDate: "2025-02-15"
          }
        ],
        paymentMethod: "usdc",
        totalValue: 4000,
        creatorId: "user-123"
      }
    },
    {
      name: "Milestone Submission",
      endpoint: "/api/milestones/submit",
      method: "POST",
      data: {
        milestoneId: "milestone-test-123",
        contractId: "contract-test-456",
        completionNotes: "Smart contract deployed successfully with escrow functionality",
        proofUrl: "https://ipfs.io/ipfs/QmTestProof123",
        deliverables: ["Smart contract code", "Deployment documentation", "Test results"]
      }
    },
    {
      name: "Milestone Approval & Payment",
      endpoint: "/api/milestones/approve",
      method: "POST",
      data: {
        milestoneId: "milestone-test-123",
        contractId: "contract-test-456",
        approverId: "client-789",
        approvalNotes: "Work approved - releasing payment automatically"
      }
    },
    {
      name: "Contract Funding",
      endpoint: "/api/contracts/fund",
      method: "POST",
      data: {
        contractId: "contract-test-456",
        paymentMethod: "usdc",
        amount: 4000,
        paymentDetails: {
          walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
        }
      }
    },
    {
      name: "Blockchain Status Check",
      endpoint: "/api/contracts/contract-test-456/blockchain-status",
      method: "GET",
      data: null
    }
  ];

  const runTest = async (test: typeof testEndpoints[0]): Promise<BlockchainTestResult> => {
    const startTime = Date.now();
    
    try {
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (test.data) {
        options.body = JSON.stringify(test.data);
      }

      const response = await fetch(test.endpoint, options);
      const responseData = await response.json();
      const duration = Date.now() - startTime;

      return {
        endpoint: test.endpoint,
        status: response.ok ? 'success' : 'error',
        response: responseData,
        duration
      };
    } catch (error) {
      return {
        endpoint: test.endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: BlockchainTestResult[] = [];
    let createdContractId: string | null = null;

    for (let i = 0; i < testEndpoints.length; i++) {
      const test = { ...testEndpoints[i] };
      
      // Update test data with actual contract ID if available
      if (createdContractId && test.data) {
        if (test.endpoint.includes('/milestones/submit') || test.endpoint.includes('/milestones/approve')) {
          test.data = { ...test.data, contractId: createdContractId };
        } else if (test.endpoint.includes('/contracts/fund')) {
          test.data = { ...test.data, contractId: createdContractId };
        } else if (test.endpoint.includes('/blockchain-status')) {
          test.endpoint = `/api/contracts/${createdContractId}/blockchain-status`;
        }
      }

      // Add pending state
      const pendingResult: BlockchainTestResult = {
        endpoint: test.endpoint,
        status: 'pending'
      };
      
      results.push(pendingResult);
      setTestResults([...results]);

      // Run the test
      const result = await runTest(test);
      
      // Capture contract ID from first test (contract creation)
      if (i === 0 && result.status === 'success' && result.response?.contractId) {
        createdContractId = result.response.contractId;
      }
      
      // Update with actual result
      results[results.length - 1] = result;
      setTestResults([...results]);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: BlockchainTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: BlockchainTestResult['status']) => {
    const variants = {
      pending: 'secondary',
      success: 'default',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
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
        </div>

        {/* Test Results */}
        <div className="grid gap-6">
          {testResults.map((result, index) => {
            const testName = testEndpoints[index]?.name || `Test ${index + 1}`;
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-3">{testName}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {result.duration && `${result.duration}ms`}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Request</h4>
                      <div className="bg-slate-100 rounded-lg p-4 text-sm">
                        <div className="mb-2">
                          <span className="font-medium">Endpoint:</span> {result.endpoint}
                        </div>
                        <div className="mb-2">
                          <span className="font-medium">Method:</span> {testEndpoints[index]?.method}
                        </div>
                        {testEndpoints[index]?.data && (
                          <div>
                            <span className="font-medium">Payload:</span>
                            <pre className="mt-1 text-xs overflow-x-auto">
                              {JSON.stringify(testEndpoints[index].data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Response</h4>
                      <div className="bg-slate-100 rounded-lg p-4 text-sm">
                        {result.status === 'pending' ? (
                          <div className="text-yellow-600">Test running...</div>
                        ) : result.status === 'error' ? (
                          <div className="text-red-600">
                            <div className="font-medium mb-1">Error:</div>
                            <div>{result.error}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-green-600 font-medium mb-2">✓ Success</div>
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(result.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Stats */}
        {testResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Test Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-slate-600">Total Tests</div>
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