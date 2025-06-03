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
    const currentPath = location;
    console.log("Current path:", currentPath);

    // Parse the URL structure: /storefront/demo/produtos
    const match = currentPath.match(/^\/storefront\/([^\/]+)/);
    
    if (match && match[1]) {
      const extractedSubdomain = match[1];
      console.log("Extracted subdomain from URL:", extractedSubdomain);
      setSubdomain(extractedSubdomain);
    } else {
      // Fallback for development environment
      console.log("No subdomain in URL, using 'demo' for development");
      setSubdomain("demo");
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
    let path = location;
    console.log("Original location:", path);
    
    // Parse path structure: /storefront/demo/produtos
    // Remove /storefront first
    if (path.startsWith('/storefront')) {
      path = path.substring('/storefront'.length);
    }
    
    // Remove subdomain if it exists (e.g., /demo/produtos -> /produtos)
    if (subdomain && path.startsWith('/' + subdomain)) {
      path = path.substring(('/' + subdomain).length);
    }
    
    // Default to home if no path
    if (!path || path === '/') {
      path = '/';
    }
    
    console.log("Final processed path for routing:", path);
    
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