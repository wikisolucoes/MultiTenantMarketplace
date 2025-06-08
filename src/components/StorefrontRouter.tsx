import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StorefrontHeader from "./storefront/StorefrontHeader";
import StorefrontFooter from "./storefront/StorefrontFooter";
import StorefrontHome from "./storefront/StorefrontHome";
import ProductCatalog from "./storefront/ProductCatalog";
import ProductDetail from "./storefront/ProductDetail";
import Cart from "./storefront/Cart";
import Checkout from "./storefront/Checkout";
import About from "./storefront/About";
import Contact from "./storefront/Contact";
import Privacy from "./storefront/Privacy";
import { Tenant, Product } from "../types/api";

export default function StorefrontRouter() {
  const [location] = useLocation();
  const [subdomain, setSubdomain] = useState<string>("demo");
  const [cartItems, setCartItems] = useState<
    Array<{ id: number; quantity: number }>
  >([]);

  useEffect(() => {
    // Always use 'demo' for development environment
    setSubdomain("demo");
  }, []);

  const {
    data: tenant,
    isLoading: tenantLoading,
  } = useQuery<Tenant>({
    queryKey: [`/api/public/tenant/${subdomain}`],
    enabled: !!subdomain,
  });

  const {
    data: products,
    isLoading: productsLoading,
  } = useQuery<Product[]>({
    queryKey: [`/api/public/products/${subdomain}`],
    enabled: !!subdomain,
  });

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

  // Determine current page based on URL path
  const getCurrentPage = () => {
    const path = location;
    console.log("Current location:", path);

    // Parse different route patterns
    if (path === '/storefront' || path === '/storefront/') {
      return 'home';
    }
    if (path === '/storefront/demo' || path === '/storefront/demo/') {
      return 'home';
    }
    if (path.includes('/produtos') || path.includes('/storefront/demo/produtos')) {
      return 'produtos';
    }
    if (path.includes('/sobre') || path.includes('/storefront/demo/sobre')) {
      return 'sobre';
    }
    if (path.includes('/contato') || path.includes('/storefront/demo/contato')) {
      return 'contato';
    }
    if (path.includes('/carrinho') || path.includes('/storefront/demo/carrinho')) {
      return 'carrinho';
    }
    if (path.includes('/checkout') || path.includes('/storefront/demo/checkout')) {
      return 'checkout';
    }
    if (path.includes('/privacidade') || path.includes('/storefront/demo/privacidade')) {
      return 'privacidade';
    }
    if (path.includes('/produto/')) {
      const matches = path.match(/\/produto\/(\d+)/);
      if (matches) {
        return { page: 'produto', id: parseInt(matches[1]) };
      }
    }

    return 'home';
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

  const currentPage = getCurrentPage();
  console.log("Current page:", currentPage);

  const renderPage = () => {
    if (typeof currentPage === 'object' && currentPage.page === 'produto') {
      return (
        <ProductDetail
          productId={currentPage.id}
          products={products || []}
          onAddToCart={addToCart}
          isLoading={productsLoading}
        />
      );
    }

    switch (currentPage) {
      case 'produtos':
        return (
          <ProductCatalog
            tenant={tenant}
            products={products || []}
            onAddToCart={addToCart}
            isLoading={productsLoading}
          />
        );
      case 'sobre':
        return <About tenant={tenant} />;
      case 'contato':
        return <Contact tenant={tenant} />;
      case 'carrinho':
        return (
          <Cart
            cartItems={cartItems}
            products={products || []}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            total={getCartTotal()}
          />
        );
      case 'checkout':
        return (
          <Checkout
            cartItems={cartItems}
            products={products || []}
            total={getCartTotal()}
            tenant={tenant}
            onOrderComplete={clearCart}
          />
        );
      case 'privacidade':
        return <Privacy tenant={tenant} />;
      default:
        return (
          <StorefrontHome
            tenant={tenant}
            products={products || []}
            onAddToCart={addToCart}
            isLoading={productsLoading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        tenant={tenant}
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <main className="min-h-screen">
        {renderPage()}
      </main>

      <StorefrontFooter tenant={tenant} />
    </div>
  );
}