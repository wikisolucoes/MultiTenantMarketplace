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
import EcommerceAdmin from "@/pages/EcommerceAdmin";

function AppRouter() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    if (isAdmin()) setUserRole("admin");
    else if (isMerchant()) setUserRole("merchant");
    else setUserRole(null);
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
      <Route path="/storefront*" component={StorefrontSPA} />
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
