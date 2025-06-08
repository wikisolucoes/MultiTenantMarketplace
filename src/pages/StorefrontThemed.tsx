import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingCart, User, Heart, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ModernTheme from "@/components/storefront/themes/ModernTheme";
import ClassicTheme from "@/components/storefront/themes/ClassicTheme";
import MinimalTheme from "@/components/storefront/themes/MinimalTheme";
import BoldTheme from "@/components/storefront/themes/BoldTheme";
import ElegantTheme from "@/components/storefront/themes/ElegantTheme";
import LuxuryTheme from "@/components/storefront/themes/LuxuryTheme";
import SportTheme from "@/components/storefront/themes/SportTheme";
import TechTheme from "@/components/storefront/themes/TechTheme";
import VintageTheme from "@/components/storefront/themes/VintageTheme";
import NatureTheme from "@/components/storefront/themes/NatureTheme";
import ThemeManager from "@/components/storefront/ThemeManager";
import CustomerAuth from "@/components/storefront/CustomerAuth";

const themeComponents = {
  modern: ModernTheme,
  classic: ClassicTheme,
  minimal: MinimalTheme,
  bold: BoldTheme,
  elegant: ElegantTheme,
  luxury: LuxuryTheme,
  sport: SportTheme,
  tech: TechTheme,
  vintage: VintageTheme,
  nature: NatureTheme
};

// Demo banners for each theme
const demoBanners = [
  {
    id: 1,
    title: "Grande Liquidação de Verão",
    description: "Até 70% de desconto em toda a coleção de verão. Ofertas limitadas!",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop&crop=center",
    mobileImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop&crop=center",
    linkUrl: "#ofertas",
    linkText: "Ver Ofertas",
    position: 0,
    isActive: true,
    showOnThemes: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
    clickCount: 156
  },
  {
    id: 2,
    title: "Nova Coleção Outono/Inverno",
    description: "Descubra as últimas tendências da moda para a estação mais elegante do ano.",
    imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop&crop=center",
    mobileImageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=400&fit=crop&crop=center",
    linkUrl: "#colecao",
    linkText: "Explorar Coleção",
    position: 1,
    isActive: true,
    showOnThemes: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
    clickCount: 89
  },
  {
    id: 3,
    title: "Frete Grátis para Todo o Brasil",
    description: "Compras acima de R$ 199 ganham frete grátis. Aproveite esta oferta especial!",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop&crop=center",
    mobileImageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=center",
    linkUrl: "#frete-gratis",
    linkText: "Aproveitar",
    position: 2,
    isActive: true,
    showOnThemes: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
    clickCount: 234
  }
];

export default function StorefrontThemed() {
  const [currentTheme, setCurrentTheme] = useState<string>("modern");
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<Array<{ id: number; quantity: number }>>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [subdomain] = useState("demo"); // Default store for demo

  // Fetch real tenant data from backend
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['/api/storefront/tenant', subdomain],
    queryFn: async () => {
      const response = await fetch(`/api/storefront/tenant/${subdomain}`);
      if (!response.ok) throw new Error('Failed to fetch store data');
      return response.json();
    }
  });

  // Fetch real products from backend
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/storefront/products', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return { products: [], pagination: {} };
      const response = await fetch(`/api/storefront/products/${tenant.id}?limit=12`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!tenant?.id
  });

  // Fetch real banners from backend
  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ['/api/storefront/banners', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const response = await fetch(`/api/storefront/banners/${tenant.id}`);
      if (!response.ok) throw new Error('Failed to fetch banners');
      return response.json();
    },
    enabled: !!tenant?.id
  });

  // Update theme when tenant data loads
  useEffect(() => {
    if (tenant?.activeTheme) {
      setCurrentTheme(tenant.activeTheme);
    }
  }, [tenant]);

  // Loading states
  const isLoading = tenantLoading || productsLoading || bannersLoading;
  
  // Real products from backend
  const products = productsData?.products || [];
  
  // Loading component
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Loja</h2>
          <p className="text-gray-500">Buscando informações da loja...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loja não encontrada</h2>
          <p className="text-gray-500">A loja "{subdomain}" não existe ou está inativa.</p>
        </div>
      </div>
    );
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
  };

  const handleProductClick = (product: any) => {
    console.log("Product clicked:", product);
    // In a real app, this would navigate to product detail page
  };

  const handleAddToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { id: product.id, quantity: 1 }]);
    }
  };

  const handleToggleWishlist = (productId: number) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  const CurrentThemeComponent = themeComponents[currentTheme as keyof typeof themeComponents];

  if (isManagementMode) {
    return (
      <ThemeManager
        tenant={tenant}
        products={products}
        banners={banners}
        onThemeChange={handleThemeChange}
        currentTheme={currentTheme}
        wishlist={wishlist}
        onProductClick={handleProductClick}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin Controls */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        <Button
          onClick={() => setIsManagementMode(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-1" />
          Gerenciar Temas
        </Button>
        
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Tema:</span>
          <select
            value={currentTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="modern">Modern</option>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="bold">Bold</option>
            <option value="elegant">Elegant</option>
          </select>
        </div>
      </div>

      {/* Mini Header for Demo */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              Tema: {currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuth(true)}
              className="text-gray-600"
            >
              <User className="h-4 w-4 mr-1" />
              {currentCustomer ? currentCustomer.name : 'Entrar'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 relative"
            >
              <Heart className="h-4 w-4 mr-1" />
              Favoritos
              {wishlist.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {wishlist.length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 relative"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Carrinho
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Theme Content */}
      <div key={currentTheme} className="animate-in fade-in duration-500">
        <CurrentThemeComponent
          tenant={tenant}
          products={products}
          banners={banners}
          onProductClick={handleProductClick}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
        />
      </div>

      {/* Customer Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <CustomerAuth
              onLogin={(customer) => {
                setCurrentCustomer(customer);
                setShowAuth(false);
              }}
              onClose={() => setShowAuth(false)}
              storeName={tenant.name}
              subdomain={tenant.subdomain}
            />
          </div>
        </div>
      )}

      {/* Theme Info Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Sistema de Temas Dinâmicos
          </h3>
          <p className="text-gray-300 mb-4">
            Esta é uma demonstração do sistema de temas customizáveis para e-commerce.
            Experimente os diferentes temas usando o seletor acima.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-400">
            <span>🎨 5 Temas Únicos</span>
            <span>📱 Design Responsivo</span>
            <span>🎯 Banner Carousel</span>
            <span>⚡ Animações Fluidas</span>
          </div>
        </div>
      </div>
    </div>
  );
}