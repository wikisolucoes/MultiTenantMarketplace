import { useState } from "react";
import { useLocation } from "wouter";
import LandingPage from "@/components/LandingPage";
import TenantRegistrationModal from "@/components/TenantRegistrationModal";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [, setLocation] = useLocation();

  const handleShowDemo = () => {
    setLocation("/storefront/demo");
  };

  return (
    <>
      <LandingPage 
        onShowRegistration={() => setShowRegistration(true)}
        onShowLogin={() => setShowLogin(true)}
        onShowDemo={handleShowDemo}
      />
      <TenantRegistrationModal 
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
      />
      <LoginModal 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
