import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StorefrontHeader from "../components/storefront/StorefrontHeader";
import StorefrontFooter from "../components/storefront/StorefrontFooter";
import StorefrontHome from "../components/storefront/StorefrontHome";
import ProductCatalog from "../components/storefront/ProductCatalog";
import ProductDetail from "../components/storefront/ProductDetail";
import Cart from "../components/storefront/Cart";
import Checkout from "../components/storefront/Checkout";
import About from "../components/storefront/About";
import Contact from "../components/storefront/Contact";
import Privacy from "../components/storefront/Privacy";
import { Tenant, Product } from "../types/api";

export default function Storefront() {
  const [location] = useLocation();
  const [subdomain, setSubdomain] = useState<string>("");
  const [cartItems, setCartItems] = useState<
    Array<{ id: number; quantity: number }>
  >([]);

  useEffect(() => {
    // Extract subdomain from URL path or hostname
    const currentPath = location;
    console.log("Current path:", currentPath);

    if (currentPath.startsWith('/storefront/')) {
      // Extract subdomain from URL path (e.g., /storefront/demo)
      const pathParts = currentPath.split('/');
      if (pathParts.length >= 3 && pathParts[2]) {
        const urlSubdomain = pathParts[2];
        console.log("Using subdomain from URL path:", urlSubdomain);
        setSubdomain(urlSubdomain);
        return;
      }
    }

    // Fallback: detect from hostname or use default
    const hostname = window.location.hostname;
    console.log("Full URL:", window.location.href);
    console.log("Hostname:", hostname);

    if (hostname.includes("replit.dev") || hostname === "localhost") {
      // Development environment - use demo as default
      console.log("Development environment detected, using 'demo'");
      setSubdomain("demo");
    } else {
      // Production: check if it's a custom domain or extract subdomain
      if (hostname.includes(".")) {
        const potentialSubdomain = hostname.split(".")[0];
        console.log("Potential subdomain from hostname:", potentialSubdomain);
        setSubdomain(potentialSubdomain);
      } else {
        // Custom domain - try to find tenant by domain
        console.log("Custom domain detected:", hostname);
        setSubdomain(hostname);
      }
    }
  }, [location]);

  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
  } = useQuery<Tenant>({
    queryKey: [`/api/public/tenant/${subdomain}`],
    enabled: !!subdomain,
  });

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: [`/api/public/products/${subdomain}`],
    enabled: !!subdomain,
  });

  console.log("Tenant data:", tenant);

  const addToCart = (productId: number, quantity: number = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === productId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { id: productId, quantity }];
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    if (!products) return 0;
    return cartItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id);
      return total + (product ? parseFloat(product.price) * item.quantity : 0);
    }, 0);
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Loja não encontrada
          </h1>
          <p className="text-muted-foreground">
            A loja "{subdomain}" não existe ou foi desativada.
          </p>
        </div>
      </div>
    );
  }

  // Determine which page to render based on current location
  const getCurrentPage = () => {
    const path = location.replace('/storefront', '') || '/';
    
    if (path.startsWith('/produtos')) {
      return (
        <ProductCatalog
          tenant={tenant}
          products={products || []}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      );
    }
    
    if (path.startsWith('/produto/')) {
      const productId = parseInt(path.split('/')[2]);
      return (
        <ProductDetail
          productId={productId}
          products={products || []}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      );
    }
    
    if (path === '/carrinho') {
      return (
        <Cart
          cartItems={cartItems}
          products={products || []}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          total={getCartTotal()}
        />
      );
    }
    
    if (path === '/checkout') {
      return (
        <Checkout
          cartItems={cartItems}
          products={products || []}
          total={getCartTotal()}
          tenant={tenant}
          onOrderComplete={clearCart}
        />
      );
    }
    
    if (path === '/sobre') {
      return <About tenant={tenant} />;
    }
    
    if (path === '/contato') {
      return <Contact tenant={tenant} />;
    }
    
    if (path === '/privacidade') {
      return <Privacy tenant={tenant} />;
    }
    
    // Default to home page
    return (
      <StorefrontHome
        tenant={tenant}
        products={products || []}
        onAddToCart={addToCart}
        isLoading={productsLoading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        tenant={tenant}
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <main className="min-h-screen">
        {getCurrentPage()}
      </main>

      <StorefrontFooter tenant={tenant} />
    </div>
  );
}