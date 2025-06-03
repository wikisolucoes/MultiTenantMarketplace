import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StorefrontHeaderFixed from "../components/storefront/StorefrontHeaderFixed";
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

export default function StorefrontSPA() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<Array<{ id: number; quantity: number }>>([]);
  const subdomain = "demo"; // Fixed for development

  const {
    data: tenant,
    isLoading: tenantLoading,
    error: tenantError,
  } = useQuery({
    queryKey: [`/api/public/tenant/${subdomain}`],
    enabled: !!subdomain,
  });

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: [`/api/public/products/${subdomain}`],
    enabled: !!subdomain,
  });

  const addToCart = (productId: number, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: productId, quantity }];
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
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
      const product = products.find((p: Product) => p.id === item.id);
      return total + (product ? parseFloat(product.price) * item.quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleNavigation = (page: string, productId?: number) => {
    setCurrentPage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Carregando loja...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600">A loja solicitada não existe ou está indisponível.</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "produtos":
        return (
          <ProductCatalog
            tenant={tenant}
            products={products || []}
            onAddToCart={addToCart}
            onViewProduct={(productId) => handleNavigation("produto", productId)}
            isLoading={productsLoading}
          />
        );
      case "produto":
        return (
          <ProductDetail
            productId={selectedProductId || 1}
            products={products || []}
            onAddToCart={addToCart}
            onBackToCatalog={() => handleNavigation("produtos")}
            isLoading={productsLoading}
          />
        );
      case "carrinho":
        return (
          <Cart
            cartItems={cartItems}
            products={products || []}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onContinueShopping={() => handleNavigation("produtos")}
            onCheckout={() => handleNavigation("checkout")}
            total={getCartTotal()}
          />
        );
      case "checkout":
        return (
          <Checkout
            cartItems={cartItems}
            products={products || []}
            total={getCartTotal()}
            tenant={tenant}
            onOrderComplete={() => {
              clearCart();
              handleNavigation("home");
            }}
            onBackToCart={() => handleNavigation("carrinho")}
          />
        );
      case "sobre":
        return <About tenant={tenant} />;
      case "contato":
        return <Contact tenant={tenant} />;
      case "privacidade":
        return <Privacy tenant={tenant} />;
      default:
        return (
          <StorefrontHome
            tenant={tenant}
            products={products || []}
            onAddToCart={addToCart}
            onViewProduct={(productId) => handleNavigation("produto", productId)}
            onViewCatalog={() => handleNavigation("produtos")}
            isLoading={productsLoading}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeaderFixed
        tenant={tenant}
        cartItemCount={getCartItemCount()}
        onNavigate={handleNavigation}
        currentPage={currentPage}
      />
      <main className="pt-16">
        {renderCurrentPage()}
      </main>
      <StorefrontFooter tenant={tenant} onNavigate={handleNavigation} />
    </div>
  );
}