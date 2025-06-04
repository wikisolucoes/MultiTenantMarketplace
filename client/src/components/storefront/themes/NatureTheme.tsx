import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Leaf, TreePine, Flower2, Sun } from "lucide-react";
import BannerCarousel from "../BannerCarousel";

interface NatureThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function NatureTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: NatureThemeProps) {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Organic Header */}
      <header className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full border-2 border-green-200">
                <TreePine className="h-8 w-8 text-green-700" />
              </div>
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <Badge className="bg-green-200 text-green-800 font-semibold">ECO-FRIENDLY</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-green-100 hover:text-green-200 transition-colors font-medium">Organic</a>
              <a href="#" className="text-green-100 hover:text-green-200 transition-colors font-medium">Sustainable</a>
              <a href="#" className="text-green-100 hover:text-green-200 transition-colors font-medium">Natural</a>
              <a href="#" className="text-green-100 hover:text-green-200 transition-colors font-medium">Garden</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Nature Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative">
          <BannerCarousel banners={banners} />
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-emerald-700/10 pointer-events-none" />
          <div className="absolute bottom-8 left-8 text-white">
            <h2 className="text-4xl font-bold mb-2">Nature's Bounty</h2>
            <p className="text-xl">Embrace the beauty of natural living</p>
          </div>
        </div>
      )}

      {/* Eco-Friendly Section */}
      <section className="py-16 bg-gradient-to-r from-green-100 to-emerald-100">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Leaf className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-4xl font-bold text-green-800">SUSTAINABLE LIVING</h2>
            <Leaf className="h-8 w-8 text-green-600 ml-3" />
          </div>
          <p className="text-xl text-green-700 max-w-3xl mx-auto mb-12 leading-relaxed">
            Discover products that nurture both you and the planet. Our carefully curated 
            collection celebrates the harmony between modern life and natural wisdom.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-green-200">
              <Sun className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-green-800 mb-2">SOLAR POWERED</h3>
              <p className="text-green-700">Harnessing renewable energy for a cleaner future</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-green-200">
              <Flower2 className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-green-800 mb-2">ORGANIC MATERIALS</h3>
              <p className="text-green-700">Pure, natural ingredients from earth to you</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-green-200">
              <TreePine className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-green-800 mb-2">ZERO WASTE</h3>
              <p className="text-green-700">Packaging that returns to the earth naturally</p>
            </div>
          </div>
        </div>
      </section>

      {/* Natural Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-800 mb-4">EARTH'S TREASURES</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-green-200 hover:border-green-400 overflow-hidden rounded-2xl"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Eco Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-600 text-white font-semibold border border-green-300">
                      <Leaf className="h-3 w-3 mr-1" />
                      Organic
                    </Badge>
                  </div>

                  {/* Wishlist Button */}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/90 text-green-700 hover:bg-green-100 border border-green-300 rounded-full"
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
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full"
                        onClick={() => onProductClick(product)}
                      >
                        Discover
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-white text-green-700 border border-green-300 hover:bg-green-50 font-semibold rounded-full"
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 bg-gradient-to-b from-white to-green-50">
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-green-400 text-green-500" />
                    ))}
                    <span className="text-sm text-green-600 ml-2 font-medium">Earth-Approved</span>
                  </div>
                  
                  <h3 className="font-bold text-green-800 text-lg mb-2 group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-green-700 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-green-700">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-green-500 line-through ml-2">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-700 border border-green-300">
                      Sustainable
                    </Badge>
                  </div>
                  
                  {/* Nature Certifications */}
                  <div className="border-t border-green-200 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        🌱 Organic
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        ♻️ Recyclable
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        🌿 Natural
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earth-Friendly Footer */}
      <footer className="bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 text-green-100 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <TreePine className="h-10 w-10 text-green-300 mr-3" />
              <h3 className="text-3xl font-bold">{tenant.name}</h3>
            </div>
            <p className="text-xl text-green-200 max-w-2xl mx-auto leading-relaxed">
              Together, we're growing a more sustainable tomorrow. Every purchase 
              plants seeds for a greener future.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-green-900/30 p-6 rounded-2xl border border-green-600/30">
              <h4 className="font-bold text-lg mb-4 text-green-200">ECO PRODUCTS</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li>Organic Foods</li>
                <li>Natural Beauty</li>
                <li>Eco Home</li>
              </ul>
            </div>
            <div className="bg-green-900/30 p-6 rounded-2xl border border-green-600/30">
              <h4 className="font-bold text-lg mb-4 text-green-200">SUSTAINABILITY</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li>Carbon Neutral</li>
                <li>Zero Waste</li>
                <li>Renewable Energy</li>
              </ul>
            </div>
            <div className="bg-green-900/30 p-6 rounded-2xl border border-green-600/30">
              <h4 className="font-bold text-lg mb-4 text-green-200">COMMUNITY</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li>Local Farmers</li>
                <li>Green Initiatives</li>
                <li>Education</li>
              </ul>
            </div>
            <div className="bg-green-900/30 p-6 rounded-2xl border border-green-600/30">
              <h4 className="font-bold text-lg mb-4 text-green-200">IMPACT</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li>Trees Planted</li>
                <li>Plastic Reduced</li>
                <li>Lives Changed</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-green-600 mt-12 pt-8 text-center">
            <p className="text-green-200">&copy; 2024 {tenant.name}. Growing naturally since day one.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}