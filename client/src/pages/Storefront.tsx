import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
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
  const [subdomain, setSubdomain] = useState<string>("");
  const [cartItems, setCartItems] = useState<
    Array<{ id: number; quantity: number }>
  >([]);

  useEffect(() => {
    // For development environment, always use 'demo'
    const hostname = window.location.hostname;
    console.log("Hostname:", hostname);
    
    if (hostname.includes('replit.dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      console.log("Development environment detected, using 'demo'");
      setSubdomain('demo');
    } else {
      // Production environment - extract subdomain
      const parts = hostname.split('.');
      if (parts.length > 2) {
        console.log("Subdomain found:", parts[0]);
        setSubdomain(parts[0]);
      } else {
        console.log("No subdomain found, using 'demo'");
        setSubdomain('demo');
      }
    }
  }, []);

  // Get tenant data by subdomain
  const { data: tenant, isLoading: tenantLoading } = useQuery<Tenant>({
    queryKey: ["/api/public/tenant", subdomain],
    enabled: !!subdomain,
  });

  console.log("Tenant data:", tenant);

  // Get products for this tenant
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/public/products", subdomain],
    enabled: !!subdomain,
  });

  const addToCart = (productId: number, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
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

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        tenant={tenant}
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <main className="min-h-screen">
        <Switch>
          <Route path="/">
            <StorefrontHome
              tenant={tenant}
              products={products || []}
              onAddToCart={addToCart}
              isLoading={productsLoading}
            />
          </Route>

          <Route path="/produtos">
            <ProductCatalog
              tenant={tenant}
              products={products || []}
              onAddToCart={addToCart}
              isLoading={productsLoading}
            />
          </Route>

          <Route path="/produto/:id">
            {(params) => (
              <ProductDetail
                productId={parseInt(params.id)}
                products={products || []}
                onAddToCart={addToCart}
                isLoading={productsLoading}
              />
            )}
          </Route>

          <Route path="/carrinho">
            <Cart
              cartItems={cartItems}
              products={products || []}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              total={getCartTotal()}
            />
          </Route>

          <Route path="/checkout">
            <Checkout
              cartItems={cartItems}
              products={products || []}
              total={getCartTotal()}
              tenant={tenant}
              onOrderComplete={clearCart}
            />
          </Route>

          <Route path="/sobre">
            <About tenant={tenant} />
          </Route>

          <Route path="/contato">
            <Contact tenant={tenant} />
          </Route>

          <Route path="/privacidade">
            <Privacy tenant={tenant} />
          </Route>

          <Route>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
              <p className="text-muted-foreground">
                A página que você procura não existe.
              </p>
            </div>
          </Route>
        </Switch>
      </main>

      <StorefrontFooter tenant={tenant} />
    </div>
  );
}
