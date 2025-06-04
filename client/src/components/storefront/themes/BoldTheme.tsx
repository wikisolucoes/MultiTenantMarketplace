import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Zap, Target, Flame, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BannerCarousel from "../BannerCarousel";

interface BoldThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function BoldTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: BoldThemeProps) {
  const featuredProducts = products.slice(0, 6);
  const categories = [
    { name: "POWER", icon: Zap, color: "from-yellow-400 to-orange-500" },
    { name: "SPEED", icon: Rocket, color: "from-blue-400 to-purple-500" },
    { name: "STYLE", icon: Flame, color: "from-pink-400 to-red-500" },
    { name: "ELITE", icon: Target, color: "from-green-400 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Banner Carousel */}
      <section className="mb-12">
        <BannerCarousel 
          banners={banners}
          theme="bold"
          height="h-96 md:h-[600px]"
        />
      </section>

      {/* Impact Statement */}
      <section className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-8xl font-black mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider">
            {tenant?.name}
          </h1>
          <p className="text-xl md:text-2xl font-bold text-gray-300 mb-8 uppercase tracking-wide">
            REVOLUCIONE SEU ESTILO
          </p>
          <div className="w-32 h-2 bg-gradient-to-r from-pink-500 to-orange-500 mx-auto"></div>
        </motion.div>
      </section>

      {/* Power Features */}
      <section className="bg-gradient-to-r from-purple-900 via-pink-900 to-orange-900 py-20 mb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-wider">
              NOSSO PODER
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-none flex items-center justify-center mx-auto mb-8 transform rotate-45">
                <Zap className="h-12 w-12 text-black transform -rotate-45" />
              </div>
              <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-wide">
                VELOCIDADE EXTREMA
              </h3>
              <p className="text-gray-300 font-bold uppercase text-sm tracking-wider">
                ENTREGA EM TEMPO RECORD
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-none flex items-center justify-center mx-auto mb-8 transform rotate-45">
                <Target className="h-12 w-12 text-black transform -rotate-45" />
              </div>
              <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-wide">
                PRECISÃO TOTAL
              </h3>
              <p className="text-gray-300 font-bold uppercase text-sm tracking-wider">
                QUALIDADE INCOMPARÁVEL
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-teal-500 rounded-none flex items-center justify-center mx-auto mb-8 transform rotate-45">
                <Flame className="h-12 w-12 text-black transform -rotate-45" />
              </div>
              <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-wide">
                ESTILO ÚNICO
              </h3>
              <p className="text-gray-300 font-bold uppercase text-sm tracking-wider">
                DESIGN REVOLUCIONÁRIO
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-wider">
            CATEGORIAS
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Card className={`border-none bg-gradient-to-br ${category.color} transform group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}>
                <CardContent className="p-8 text-center">
                  <category.icon className="h-12 w-12 text-black mx-auto mb-4" />
                  <h3 className="text-xl font-black text-black uppercase tracking-wider">{category.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products - Bold Grid */}
      <section className="bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-wider">
              PRODUTOS ÉPICOS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Card className="border-4 border-purple-500 bg-black hover:border-pink-500 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-pink-500/50 overflow-hidden transform group-hover:scale-105">
                  <div className="relative">
                    <img
                      src={product.mainImage || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center`}
                      alt={product.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      onClick={() => onProductClick(product)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-none hover:from-pink-600 hover:to-purple-600 transition-colors transform hover:scale-110"
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          wishlist.includes(product.id) 
                            ? 'text-white fill-white' 
                            : 'text-white'
                        }`} 
                      />
                    </button>
                    {product.compareAtPrice && (
                      <Badge className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-lg px-4 py-2 uppercase">
                        MEGA OFERTA
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-6 bg-gradient-to-br from-gray-900 to-black">
                    <h3 
                      className="font-black text-white mb-4 cursor-pointer hover:text-pink-400 transition-colors text-xl uppercase tracking-wide line-clamp-2"
                      onClick={() => onProductClick(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current" />
                        ))}
                      </div>
                      <span className="text-white ml-2 font-bold uppercase text-sm">(ÉPICO)</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl font-black text-white">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-lg text-gray-500 line-through font-bold">
                            R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onAddToCart(product)}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-black text-lg py-4 uppercase tracking-wider transform hover:scale-105 transition-all duration-300"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      COMPRAR AGORA
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-wider">
              JUNTE-SE À REVOLUÇÃO
            </h2>
            <p className="text-xl font-bold text-white/90 mb-12 uppercase tracking-wide">
              SEJA PARTE DA ELITE. SEJA ÚNICO. SEJA ÉPICO.
            </p>
            <div className="flex flex-col md:flex-row gap-6 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="SEU E-MAIL"
                className="flex-1 px-6 py-4 bg-black text-white border-2 border-white focus:border-yellow-400 focus:outline-none font-bold uppercase tracking-wide placeholder-gray-400"
              />
              <Button className="bg-black text-white hover:bg-gray-900 px-8 py-4 font-black uppercase tracking-wider border-2 border-black hover:border-white transition-all duration-300">
                ATIVAR PODER
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}