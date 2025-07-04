import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import CreateContract from "@/pages/create-contract";
import BlockchainStatus from "@/pages/blockchain-status";
import MilestoneTracker from "@/pages/milestone-tracker";
import ClientPayment from "@/pages/client-payment";
import BlockchainTest from "@/pages/blockchain-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create-contract" component={CreateContract} />
      <Route path="/blockchain-status" component={BlockchainStatus} />
      <Route path="/blockchain-test" component={BlockchainTest} />
      <Route path="/milestone-tracker/:id?" component={MilestoneTracker} />
      <Route path="/client-payment/:id?" component={ClientPayment} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
