import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Cpu, Zap, Monitor, Wifi, Code } from "lucide-react";
import BannerCarousel from "../BannerCarousel";

interface TechThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function TechTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: TechThemeProps) {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Futuristic Header */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-cyan-500/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {tenant.name}
              </h1>
              <Badge className="bg-cyan-500 text-black font-bold">TECH</Badge>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Devices</a>
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Gaming</a>
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Accessories</a>
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors font-medium">Support</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Cyberpunk Banner Carousel */}
      {banners.length > 0 && (
        <div className="relative">
          <BannerCarousel banners={banners} />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 via-transparent to-blue-900/20 pointer-events-none" />
          <div className="absolute bottom-8 left-8 text-white">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              NEXT-GEN TECHNOLOGY
            </h2>
            <p className="text-xl text-gray-300">Experience the future today</p>
          </div>
        </div>
      )}

      {/* Tech Innovation Section */}
      <section className="py-16 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <Zap className="h-8 w-8 text-cyan-400 mr-3" />
            <h2 className="text-4xl font-bold text-white">CUTTING-EDGE INNOVATION</h2>
            <Zap className="h-8 w-8 text-cyan-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Discover the latest in technology with products designed to push the boundaries 
            of what's possible. From AI-powered devices to quantum computing solutions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-cyan-500/30">
              <Monitor className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-white mb-2">ULTRA-HD DISPLAYS</h3>
              <p className="text-gray-300">Crystal clear visuals with next-gen technology</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-blue-500/30">
              <Wifi className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-white mb-2">5G CONNECTIVITY</h3>
              <p className="text-gray-300">Lightning-fast speeds for seamless experience</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-cyan-500/30">
              <Code className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-white mb-2">AI INTEGRATION</h3>
              <p className="text-gray-300">Smart features powered by machine learning</p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Tech Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">TECH ARSENAL</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto" />
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group bg-black/60 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400 transition-all duration-500 overflow-hidden"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Tech Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold animate-pulse">
                      <Cpu className="h-3 w-3 mr-1" />
                      AI-POWERED
                    </Badge>
                  </div>

                  {/* Wishlist Button */}
                  <div className={`absolute top-4 right-4 transition-all duration-300 ${
                    hoveredProduct === product.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 text-white hover:bg-cyan-500 backdrop-blur-md border border-cyan-500/30"
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
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
                        onClick={() => onProductClick(product)}
                      >
                        ANALYZE
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-black/80 text-cyan-400 border border-cyan-500 hover:bg-cyan-500 hover:text-black font-bold"
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
                      <Star key={star} className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                    ))}
                    <span className="text-sm text-gray-400 ml-2 font-mono">5.0 | 1.2K reviews</span>
                  </div>
                  
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-cyan-400 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-cyan-400">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      Enterprise
                    </Badge>
                  </div>
                  
                  {/* Tech Specs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Performance:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1 bg-gray-700 rounded">
                          <div className="w-5/6 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded"></div>
                        </div>
                        <span className="text-cyan-400 font-mono text-xs">98%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Efficiency:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1 bg-gray-700 rounded">
                          <div className="w-4/5 h-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded"></div>
                        </div>
                        <span className="text-green-400 font-mono text-xs">94%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Futuristic Footer */}
      <footer className="bg-black/80 backdrop-blur-xl border-t border-cyan-500/30 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Cpu className="h-10 w-10 text-cyan-400 mr-3" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {tenant.name}
              </h3>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Where innovation meets excellence. Building the technology of tomorrow, today.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-black/40 p-6 rounded-xl border border-cyan-500/20">
              <h4 className="font-bold text-lg mb-4 text-cyan-400">INNOVATION</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>R&D Labs</li>
                <li>Future Tech</li>
                <li>Beta Programs</li>
              </ul>
            </div>
            <div className="bg-black/40 p-6 rounded-xl border border-blue-500/20">
              <h4 className="font-bold text-lg mb-4 text-blue-400">SOLUTIONS</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Enterprise</li>
                <li>Custom Build</li>
                <li>Integration</li>
              </ul>
            </div>
            <div className="bg-black/40 p-6 rounded-xl border border-cyan-500/20">
              <h4 className="font-bold text-lg mb-4 text-cyan-400">SUPPORT</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>24/7 Tech Support</li>
                <li>Documentation</li>
                <li>Community</li>
              </ul>
            </div>
            <div className="bg-black/40 p-6 rounded-xl border border-blue-500/20">
              <h4 className="font-bold text-lg mb-4 text-blue-400">NETWORK</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>Developer API</li>
                <li>Partner Portal</li>
                <li>Tech Events</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/20 mt-12 pt-8 text-center">
            <p className="text-gray-400 font-mono">&copy; 2024 {tenant.name}. Powered by innovation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}