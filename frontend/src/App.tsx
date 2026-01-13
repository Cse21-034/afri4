import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Register from "@/pages/register";
import Login from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import Verify2FA from "@/pages/verify-2fa";
import CheckYourEmail from "@/pages/check-your-email";
import ResendVerification from "@/pages/resend-verification";
import TruckingDashboard from "@/pages/trucking-dashboard";
import ShippingDashboard from "@/pages/shipping-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Profile from "@/pages/profile";
import SecuritySettings from "@/pages/account/security";
import SubscriptionPage from "@/pages/subscription";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import Chat from "@/pages/chat";
import Analytics from "@/pages/analytics";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import FAQ from "@/pages/faq";
import Resources from "@/pages/resources";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/check-your-email" component={CheckYourEmail} />
      <Route path="/resend-verification" component={ResendVerification} />
      
      <Route path="/verify-2fa" component={Verify2FA} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/faq" component={FAQ} />
      <Route path="/resources" component={Resources} />
      
      {/* Protected routes */}
      {user && (
        <>
          <Route path="/dashboard">
            {user.role === 'trucking_company' ? (
              <TruckingDashboard />
            ) : user.role === 'shipping_entity' ? (
              <ShippingDashboard />
            ) : (
              <AdminDashboard />
            )}
          </Route>
          <Route path="/profile" component={Profile} />
          <Route path="/chat/:jobId?" component={Chat} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/account/security" component={SecuritySettings} />
          <Route path="/subscription" component={SubscriptionPage} />
          <Route path="/subscription/success" component={SubscriptionSuccessPage} />
          {(user.role === 'super_admin' || user.role === 'customer_support') && (
            <>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin-dashboard" component={AdminDashboard} />
            </>
          )}
        </>
      )}
      
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
