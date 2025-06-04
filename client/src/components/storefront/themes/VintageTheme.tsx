import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Coffee, Camera, Book, Flower } from "lucide-react";
import BannerCarousel from "../BannerCarousel";

interface VintageThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function VintageTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: VintageThemeProps) {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Vintage Header */}
      <header className="bg-gradient-to-r from-amber-800 via-orange-800 to-amber-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-2 rounded-full border-2 border-amber-600">
                <Coffee className="h-8 w-8 text-amber-800" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-amber-100">{tenant.name}</h1>
              <Badge className="bg-amber-200 text-amber-800 font-serif">Est. 1950</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-amber-100 hover:text-amber-200 transition-colors font-serif">Collections</a>
              <a href="#" className="text-amber-100 hover:text-amber-200 transition-colors font-serif">Antiques</a>
              <a href="#" className="text-amber-100 hover:text-amber-200 transition-colors font-serif">Handcrafted</a>
              <a href="#" className="text-amber-100 hover:text-amber-200 transition-colors font-serif">Stories</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Nostalgic Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative">
          <BannerCarousel banners={banners} />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 via-transparent to-amber-700/20 pointer-events-none" />
          <div className="absolute bottom-8 left-8 text-white">
            <h2 className="text-4xl font-serif font-bold mb-2">Timeless Treasures</h2>
            <p className="text-xl font-serif">Where memories meet craftsmanship</p>
          </div>
        </div>
      )}

      {/* Heritage Section */}
      <section className="py-16 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Camera className="h-8 w-8 text-amber-700 mr-3" />
            <h2 className="text-4xl font-serif font-bold text-amber-800">HERITAGE COLLECTION</h2>
            <Camera className="h-8 w-8 text-amber-700 ml-3" />
          </div>
          <p className="text-xl text-amber-700 max-w-3xl mx-auto mb-12 font-serif leading-relaxed">
            Each piece tells a story of bygone eras, carefully curated to bring the charm 
            and elegance of yesteryear into your modern life.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-amber-200">
              <Book className="h-12 w-12 text-amber-700 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-xl text-amber-800 mb-2">AUTHENTIC STORIES</h3>
              <p className="text-amber-700">Every item comes with its unique history</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-amber-200">
              <Flower className="h-12 w-12 text-amber-700 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-xl text-amber-800 mb-2">HANDCRAFTED BEAUTY</h3>
              <p className="text-amber-700">Traditional techniques preserved through time</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-amber-200">
              <Coffee className="h-12 w-12 text-amber-700 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-xl text-amber-800 mb-2">TIMELESS QUALITY</h3>
              <p className="text-amber-700">Built to last generations, just like before</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vintage Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-amber-800 mb-4">CURATED ANTIQUES</h2>
            <div className="w-32 h-0.5 bg-amber-600 mx-auto" />
            <div className="w-24 h-0.5 bg-amber-400 mx-auto mt-1" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border-2 border-amber-200 hover:border-amber-400 overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105 sepia-[.3] hover:sepia-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Vintage Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-amber-600 text-amber-100 font-serif border border-amber-300">
                      <Camera className="h-3 w-3 mr-1" />
                      Vintage
                    </Badge>
                  </div>

                  {/* Wishlist Button */}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/80 text-amber-700 hover:bg-amber-100 border border-amber-300"
                      onClick={() => onToggleWishlist(product.id)}
                    >
                      <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-serif"
                        onClick={() => onProductClick(product)}
                      >
                        View Story
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-white text-amber-700 border border-amber-300 hover:bg-amber-50 font-serif"
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Collect
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 bg-gradient-to-b from-white to-amber-50">
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                    <span className="text-sm text-amber-600 ml-2 font-serif">Collector's Choice</span>
                  </div>
                  
                  <h3 className="font-serif font-bold text-amber-800 text-lg mb-2 group-hover:text-amber-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-amber-700 text-sm mb-4 line-clamp-2 font-serif">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-amber-700 font-serif">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-amber-500 line-through ml-2 font-serif">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-300 font-serif">
                      Authentic
                    </Badge>
                  </div>
                  
                  {/* Vintage Details */}
                  <div className="border-t border-amber-200 pt-4">
                    <div className="grid grid-cols-2 gap-2 text-xs text-amber-600 font-serif">
                      <div>Era: 1950s-60s</div>
                      <div>Condition: Excellent</div>
                      <div>Origin: Handcrafted</div>
                      <div>Rarity: Limited</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nostalgic Footer */}
      <footer className="bg-gradient-to-r from-amber-800 via-orange-800 to-amber-700 text-amber-100 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Coffee className="h-10 w-10 text-amber-200 mr-3" />
              <h3 className="text-3xl font-serif font-bold">{tenant.name}</h3>
            </div>
            <p className="text-xl text-amber-200 max-w-2xl mx-auto font-serif leading-relaxed">
              Preserving the beauty of yesteryear for generations to come. 
              Every piece carries the soul of its era.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-600/30">
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-200">COLLECTIONS</h4>
              <ul className="space-y-2 text-amber-100 text-sm font-serif">
                <li>Victorian Era</li>
                <li>Art Deco</li>
                <li>Mid-Century</li>
              </ul>
            </div>
            <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-600/30">
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-200">SERVICES</h4>
              <ul className="space-y-2 text-amber-100 text-sm font-serif">
                <li>Authentication</li>
                <li>Restoration</li>
                <li>Appraisal</li>
              </ul>
            </div>
            <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-600/30">
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-200">HERITAGE</h4>
              <ul className="space-y-2 text-amber-100 text-sm font-serif">
                <li>Family Stories</li>
                <li>Provenance</li>
                <li>History</li>
              </ul>
            </div>
            <div className="bg-amber-900/30 p-6 rounded-lg border border-amber-600/30">
              <h4 className="font-serif font-bold text-lg mb-4 text-amber-200">COMMUNITY</h4>
              <ul className="space-y-2 text-amber-100 text-sm font-serif">
                <li>Collectors Club</li>
                <li>Events</li>
                <li>Newsletter</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-amber-600 mt-12 pt-8 text-center">
            <p className="text-amber-200 font-serif">&copy; 2024 {tenant.name}. Timeless since 1950.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}