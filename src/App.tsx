import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { isAuthenticated, isAdmin, isMerchant } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Merchant from "@/pages/Merchant";
import StorefrontSPA from "@/pages/StorefrontSPA";
import StorefrontThemed from "@/pages/StorefrontThemed";
import EcommerceAdmin from "@/pages/EcommerceAdmin";
import TaxConfiguration from "@/pages/TaxConfiguration";
import PluginSubscriptions from "@/pages/PluginSubscriptions";
import EnhancedProductManagement from "@/pages/EnhancedProductManagement";
import NotificationDemo from "@/pages/NotificationDemo";
import MerchantSupportCenter from "@/pages/MerchantSupportCenter";
import AdminSupportCenter from "@/pages/AdminSupportCenter";
import CelcoinIntegration from "@/pages/CelcoinIntegration";
import ApiDocumentation from "@/pages/ApiDocumentation";
import ApiCredentials from "@/pages/ApiCredentials";
import IdentityVerificationPage from "@/pages/IdentityVerification";

function AppRouter() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(isAuthenticated());
      if (isAdmin()) setUserRole("admin");
      else if (isMerchant()) setUserRole("merchant");
      else setUserRole(null);
    };

    checkAuth();
    
    // Listen for storage changes to detect login/logout
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab changes
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin">
        {isAuth && userRole === "admin" ? <Admin /> : <Home />}
      </Route>
      <Route path="/merchant">
        {isAuth && userRole === "merchant" ? <Merchant /> : <Home />}
      </Route>
      <Route path="/ecommerce-admin">
        {isAuth && userRole === "merchant" ? <EcommerceAdmin /> : <Home />}
      </Route>
      <Route path="/tax-config">
        {isAuth && userRole === "merchant" ? <TaxConfiguration /> : <Home />}
      </Route>
      <Route path="/plugins">
        {isAuth && userRole === "merchant" ? <PluginSubscriptions /> : <Home />}
      </Route>
      <Route path="/products">
        {isAuth && userRole === "merchant" ? <EnhancedProductManagement /> : <Home />}
      </Route>
      <Route path="/notifications-demo">
        {isAuth && userRole === "merchant" ? <NotificationDemo /> : <Home />}
      </Route>
      <Route path="/support">
        {isAuth && userRole === "merchant" ? <MerchantSupportCenter /> : <Home />}
      </Route>
      <Route path="/admin-support">
        {isAuth && userRole === "admin" ? <AdminSupportCenter /> : <Home />}
      </Route>
      <Route path="/celcoin">
        {isAuth && (userRole === "admin" || userRole === "merchant") ? <CelcoinIntegration /> : <Home />}
      </Route>
      <Route path="/api-docs">
        {isAuth && userRole === "admin" ? <ApiDocumentation /> : <Home />}
      </Route>
      <Route path="/api-credentials">
        {isAuth && userRole === "merchant" ? <ApiCredentials /> : <Home />}
      </Route>
      <Route path="/identity-verification">
        {isAuth && userRole === "merchant" ? <IdentityVerificationPage /> : <Home />}
      </Route>
      <Route path="/storefront/*" component={StorefrontSPA} />
      <Route path="/themes" component={StorefrontThemed} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
