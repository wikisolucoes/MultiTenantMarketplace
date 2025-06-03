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
  const [subdomain] = useState<string>("demo"); // Always use demo for development
  const [cartItems, setCartItems] = useState<
    Array<{ id: number; quantity: number }>
  >([]);

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
    const path = location;
    console.log("Current location for routing:", path);
    
    // Direct path matching
    if (path.includes('/produtos')) {
      console.log("Routing to produtos page");
    } else if (path.includes('/sobre')) {
      console.log("Routing to sobre page");
    } else if (path.includes('/contato')) {
      console.log("Routing to contato page");
    } else if (path.includes('/carrinho')) {
      console.log("Routing to carrinho page");
    } else if (path.includes('/checkout')) {
      console.log("Routing to checkout page");
    } else if (path.includes('/privacidade')) {
      console.log("Routing to privacidade page");
    } else {
      console.log("Routing to home page");
    }
    
    if (path.includes('/produtos')) {
      return (
        <ProductCatalog
          tenant={tenant}
          products={products || []}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      );
    }
    
    if (path.includes('/produto/')) {
      const matches = path.match(/\/produto\/(\d+)/);
      const productId = matches ? parseInt(matches[1]) : 1;
      return (
        <ProductDetail
          productId={productId}
          products={products || []}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      );
    }
    
    if (path.includes('/carrinho')) {
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
    
    if (path.includes('/checkout')) {
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
    
    if (path.includes('/sobre')) {
      return <About tenant={tenant} />;
    }
    
    if (path.includes('/contato')) {
      return <Contact tenant={tenant} />;
    }
    
    if (path.includes('/privacidade')) {
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