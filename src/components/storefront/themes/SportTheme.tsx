import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Zap, Trophy, Target, Timer } from "lucide-react";
import BannerCarousel from "../BannerCarousel";

interface SportThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function SportTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: SportThemeProps) {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Dynamic Sports Header */}
      <header className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full">
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <Badge className="bg-yellow-400 text-black font-bold">SPORTS</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-white hover:text-yellow-300 transition-colors font-semibold">Performance</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors font-semibold">Training</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors font-semibold">Equipment</a>
              <a href="#" className="text-white hover:text-yellow-300 transition-colors font-semibold">Nutrition</a>
            </nav>
          </div>
        </div>
      </header>

      {/* High-Energy Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative">
          <BannerCarousel 
            banners={banners} 
            className="h-[70vh] sport-carousel"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-8 text-white">
            <h2 className="text-4xl font-bold mb-2">UNLEASH YOUR POTENTIAL</h2>
            <p className="text-xl">Train Hard. Play Harder. Win Everything.</p>
          </div>
        </div>
      )}

      {/* Motivational Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Zap className="h-8 w-8 text-yellow-400 mr-3" />
            <h2 className="text-4xl font-bold">GEAR UP FOR GREATNESS</h2>
            <Zap className="h-8 w-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Every champion needs the right equipment. Discover performance gear 
            designed to push your limits and achieve your personal best.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">PRECISION</h3>
              <p>Every product engineered for peak performance</p>
            </div>
            <div className="text-center">
              <Timer className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">SPEED</h3>
              <p>Fast delivery to keep you in the game</p>
            </div>
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">VICTORY</h3>
              <p>Join thousands of winning athletes</p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Performance Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">PERFORMANCE COLLECTION</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-orange-400 overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Energy Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
                      <Zap className="h-3 w-3 mr-1" />
                      POWER
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 text-white hover:bg-orange-500 backdrop-blur-md"
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
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        onClick={() => onProductClick(product)}
                      >
                        VIEW DETAILS
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        ADD
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-orange-400 text-orange-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2 font-semibold">5.0 (247)</span>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-orange-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-red-600">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
                      Pro Grade
                    </Badge>
                  </div>
                  
                  {/* Performance Indicator */}
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full w-5/6"></div>
                    </div>
                    <span className="text-xs font-bold text-orange-600">PERFORMANCE: 95%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Champion Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-red-900 to-orange-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-yellow-400 mr-3" />
              <h3 className="text-3xl font-bold">{tenant.name}</h3>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Champions are made through dedication, training, and the right equipment. 
              Join the winning team today.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h4 className="font-bold text-lg mb-4 text-orange-400">TRAINING</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Workout Plans</li>
                <li>Nutrition Guides</li>
                <li>Expert Coaching</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-red-400">EQUIPMENT</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Professional Gear</li>
                <li>Performance Testing</li>
                <li>Custom Fitting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-yellow-400">SUPPORT</h4>
              <ul className="space-y-2 text-gray-300">
                <li>24/7 Support</li>
                <li>Athlete Community</li>
                <li>Performance Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-orange-400">REWARDS</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Loyalty Points</li>
                <li>Exclusive Access</li>
                <li>Champion Status</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 {tenant.name}. Train like a champion.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}