import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Eye, Crown, Sparkles } from "lucide-react";
import BannerCarousel from "../BannerCarousel";

interface LuxuryThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function LuxuryTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: LuxuryThemeProps) {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Luxury Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-yellow-400/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-400" />
              <h1 className="text-2xl font-serif font-bold text-white">{tenant.name}</h1>
              <Badge className="bg-yellow-400 text-black font-semibold">LUXURY</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-white hover:text-yellow-400 transition-colors font-medium">Collections</a>
              <a href="#" className="text-white hover:text-yellow-400 transition-colors font-medium">Exclusive</a>
              <a href="#" className="text-white hover:text-yellow-400 transition-colors font-medium">Heritage</a>
              <a href="#" className="text-white hover:text-yellow-400 transition-colors font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Premium Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative">
          <BannerCarousel 
            banners={banners} 
            className="h-[60vh] luxury-carousel"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Luxury Welcome Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-6 w-6 text-yellow-400 mr-2" />
            <h2 className="text-4xl font-serif font-bold text-white">Exclusive Collection</h2>
            <Sparkles className="h-6 w-6 text-yellow-400 ml-2" />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Discover our meticulously curated selection of premium products, 
            crafted for those who appreciate the finest things in life.
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto" />
        </div>
      </section>

      {/* Premium Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group bg-black/40 backdrop-blur-md border border-yellow-400/20 hover:border-yellow-400/60 transition-all duration-500 overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Luxury Product Actions */}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 text-white hover:bg-yellow-400 hover:text-black backdrop-blur-md"
                      onClick={() => onToggleWishlist(product.id)}
                    >
                      <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>

                  <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
                        onClick={() => onProductClick(product)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-white text-black hover:bg-gray-100 font-semibold"
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-400 ml-2">5.0</span>
                  </div>
                  
                  <h3 className="font-serif font-bold text-white text-lg mb-2 group-hover:text-yellow-400 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-yellow-400">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/40">
                      Premium
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Footer */}
      <footer className="bg-black/60 backdrop-blur-md border-t border-yellow-400/20 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-yellow-400 mr-3" />
              <h3 className="text-2xl font-serif font-bold text-white">{tenant.name}</h3>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience luxury redefined. Every product in our collection represents 
              the pinnacle of craftsmanship and exclusive design.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h4 className="font-semibold text-white mb-4">Exclusive Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Personal Shopping</li>
                <li>White Glove Delivery</li>
                <li>VIP Customer Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Luxury Guarantee</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Authenticity Certified</li>
                <li>Lifetime Warranty</li>
                <li>Premium Returns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Exclusive Events</li>
                <li>Private Previews</li>
                <li>VIP Newsletter</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-yellow-400/20 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 {tenant.name}. Luxury redefined.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}