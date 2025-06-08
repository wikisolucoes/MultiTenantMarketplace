import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BannerCarousel from "../BannerCarousel";

interface MinimalThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function MinimalTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: MinimalThemeProps) {
  const featuredProducts = products.slice(0, 4);
  const categories = ["Essenciais", "Novidades", "Populares", "Coleção"];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Carousel */}
      <section className="mb-20">
        <BannerCarousel 
          banners={banners}
          theme="minimal"
          height="h-64 md:h-80"
        />
      </section>

      {/* Minimalist Welcome */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h1 className="text-3xl md:text-5xl font-light text-gray-900 mb-8 tracking-wide">
            {tenant?.name}
          </h1>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Simplicidade e qualidade em cada detalhe
          </p>
        </motion.div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group cursor-pointer text-center"
            >
              <div className="border border-gray-200 hover:border-gray-400 transition-colors duration-300 p-8">
                <h3 className="text-lg font-light text-gray-900 group-hover:text-gray-600 transition-colors">
                  {category}
                </h3>
                <ArrowRight className="h-4 w-4 text-gray-400 mx-auto mt-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products - Minimal Grid */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-12 text-center tracking-wide">
            Seleção
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white">
                  <div className="relative mb-6">
                    <img
                      src={product.mainImage || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center`}
                      alt={product.name}
                      className="w-full aspect-square object-cover cursor-pointer transition-opacity duration-300 group-hover:opacity-80"
                      onClick={() => onProductClick(product)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white transition-colors"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          wishlist.includes(product.id) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <h3 
                      className="font-light text-gray-900 mb-3 cursor-pointer hover:text-gray-600 transition-colors text-lg"
                      onClick={() => onProductClick(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex text-gray-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-xl font-light text-gray-900">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => onAddToCart(product)}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 font-light transition-all duration-300"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Minimal About Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-8 tracking-wide">
              Nossa Filosofia
            </h2>
            <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
              Acreditamos que menos é mais. Cada produto é cuidadosamente selecionado 
              para oferecer a melhor experiência possível, priorizando qualidade, 
              funcionalidade e design atemporal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
              <div className="text-center">
                <h3 className="text-lg font-light text-gray-900 mb-3">Qualidade</h3>
                <p className="text-gray-600 font-light text-sm">
                  Materiais premium e acabamentos impecáveis
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-light text-gray-900 mb-3">Simplicidade</h3>
                <p className="text-gray-600 font-light text-sm">
                  Design clean e funcionalidade intuitiva
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-light text-gray-900 mb-3">Sustentabilidade</h3>
                <p className="text-gray-600 font-light text-sm">
                  Produtos duráveis e responsabilidade ambiental
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter - Minimal */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto text-center"
          >
            <h2 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
              Mantenha-se Informado
            </h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full px-4 py-3 border border-gray-300 focus:border-gray-500 focus:outline-none transition-colors font-light"
              />
              <Button
                variant="outline"
                className="w-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-light transition-all duration-300"
              >
                Inscrever-se
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}