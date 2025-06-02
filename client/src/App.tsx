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
import Storefront from "@/pages/Storefront";

function Router() {
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
      <Route path="/storefront" component={Storefront} />
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
