import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import FreelancerDashboard from "@/pages/freelancer-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import CreateContract from "@/pages/create-contract";
import EditContract from "@/pages/edit-contract";
import SignupPage from "@/pages/signup";
import LoginPage from "@/pages/login";
import UserSetup from "@/pages/user-setup";
import Pricing from "@/pages/pricing";
import Features from "@/pages/features";
import About from "@/pages/about";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import PaymentAuthorization from "@/pages/payment-authorization";
import BlockchainStatus from "@/pages/blockchain-status";
import MilestoneTracker from "@/pages/milestone-tracker";
import ClientPayment from "@/pages/client-payment";
import BlockchainTest from "@/pages/blockchain-test";
import NotFound from "@/pages/not-found";
import ContractSign from "@/pages/contract-sign";
import ContractMilestones from "@/pages/contract-milestones";
import PaymentMethods from "@/pages/payment-methods";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/freelancer-dashboard" component={FreelancerDashboard} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/dashboard/contracts/new" component={CreateContract} />
      <Route path="/create-contract" component={CreateContract} />
      <Route path="/edit-contract/:id" component={EditContract} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/features" component={Features} />
      <Route path="/about" component={About} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/payment-authorization" component={PaymentAuthorization} />
      <Route path="/blockchain-status" component={BlockchainStatus} />
      <Route path="/blockchain-test" component={BlockchainTest} />
      <Route path="/milestone-tracker/:id?" component={MilestoneTracker} />
      <Route path="/client-payment/:id?" component={ClientPayment} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/setup" component={UserSetup} />
      <Route path="/contracts/:shareToken/sign" component={ContractSign} />
      <Route path="/dashboard/contracts/:id/milestones" component={ContractMilestones} />
      <Route path="/dashboard/payment-methods" component={PaymentMethods} />
      <Route path="/dashboard/security" component={() => import("./pages/security-dashboard")} />
      <Route path="/milestone-approval/:id" component={() => import("./pages/milestone-approval")} />
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
