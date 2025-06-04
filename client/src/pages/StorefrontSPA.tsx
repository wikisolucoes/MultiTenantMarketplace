import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import StorefrontHeaderFixed from "../components/storefront/StorefrontHeaderFixed";
import StorefrontFooter from "../components/storefront/StorefrontFooter";
import StorefrontHome from "../components/storefront/StorefrontHome";
import ProductCatalogAdvanced from "../components/storefront/ProductCatalogAdvanced";
import ProductDetailAdvanced from "../components/storefront/ProductDetailAdvanced";
import Cart from "../components/storefront/Cart";
import CheckoutAdvanced from "../components/storefront/CheckoutAdvanced";
import CustomerAuth from "../components/storefront/CustomerAuth";
import CustomerAccount from "../components/storefront/CustomerAccount";
import About from "../components/storefront/About";
import Contact from "../components/storefront/Contact";
import Privacy from "../components/storefront/Privacy";
import CookieConsent from "../components/CookieConsent";
import { Tenant, Product } from "../types/api";

export default function StorefrontSPA() {
  const [match, params] = useRoute("/storefront/:subdomain*");
  
  // Don't render if route doesn't match
  if (!match) {
    return null;
  }
  
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<Array<{ id: number; quantity: number }>>([]);
  const [wishlist, setWishlist] = useState<Array<number>>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [showPromotions, setShowPromotions] = useState(false);
  const subdomain = (params as any)?.subdomain || "demo";

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

  const addToWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleLogin = (email: string, password: string) => {
    // Mock login - in real app, this would call API
    setIsAuthenticated(true);
    setCurrentCustomer({
      id: 1,
      firstName: "João",
      lastName: "Silva",
      email: email,
      phone: "(11) 99999-9999",
      cpf: "123.456.789-00"
    });
    setCurrentPage("home");
  };

  const handleRegister = (userData: any) => {
    // Mock registration - in real app, this would call API
    setIsAuthenticated(true);
    setCurrentCustomer({
      id: 1,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      cpf: userData.cpf
    });
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentCustomer(null);
    setCurrentPage("home");
  };

  const handleNavigation = (page: string, productId?: number, filters?: any) => {
    console.log("Navigating to:", page); // Debug log
    setCurrentPage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
    if (filters) {
      setCategoryFilter(filters.category || "");
      setBrandFilter(filters.brand || "");
      setShowPromotions(filters.promotion || false);
    }
    // Scroll to top when navigating
    window.scrollTo(0, 0);
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
      case "categoria":
      case "marca": 
      case "promocoes":
        return (
          <ProductCatalogAdvanced
            tenant={tenant}
            products={products || []}
            onAddToCart={addToCart}
            onViewProduct={(productId) => handleNavigation("produto", productId)}
            onAddToWishlist={addToWishlist}
            isLoading={productsLoading}
            category={categoryFilter}
            brand={brandFilter}
            promotion={showPromotions}
          />
        );
      case "produto":
        const selectedProduct = products?.find(p => p.id === selectedProductId);
        return selectedProduct ? (
          <ProductDetailAdvanced
            product={selectedProduct}
            tenant={tenant}
            onAddToCart={addToCart}
            onBackToCatalog={() => handleNavigation("produtos")}
            onAddToWishlist={addToWishlist}
            customerType={currentCustomer?.type || 'B2C'}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
            <button onClick={() => handleNavigation("produtos")} className="text-primary hover:underline">
              Voltar ao catálogo
            </button>
          </div>
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
          <CheckoutAdvanced
            cartItems={cartItems}
            products={products || []}
            total={getCartTotal()}
            tenant={tenant}
            onOrderComplete={() => {
              clearCart();
              handleNavigation("home");
            }}
            onBackToCart={() => handleNavigation("carrinho")}
            isAuthenticated={isAuthenticated}
            customerData={currentCustomer}
          />
        );
      case "login":
        return (
          <CustomerAuth
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => handleNavigation("home")}
          />
        );
      case "minha-conta":
        return isAuthenticated && currentCustomer ? (
          <CustomerAccount
            onBack={() => handleNavigation("home")}
            customerData={currentCustomer}
          />
        ) : (
          <CustomerAuth
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => handleNavigation("home")}
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
      
      {/* LGPD-compliant Cookie Consent Banner */}
      {tenant && <CookieConsent tenantId={tenant.id} />}
    </div>
  );
}