import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Sparkles, Award, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BannerCarousel from "../BannerCarousel";

interface ElegantThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function ElegantTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: ElegantThemeProps) {
  const featuredProducts = products.slice(0, 6);
  const collections = [
    { name: "Signature", icon: Diamond, description: "Peças exclusivas e atemporais" },
    { name: "Premium", icon: Award, description: "Qualidade excepcional" },
    { name: "Limited", icon: Sparkles, description: "Edições limitadas" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner Carousel */}
      <section className="mb-16">
        <BannerCarousel 
          banners={banners}
          theme="elegant"
          height="h-80 md:h-96"
        />
      </section>

      {/* Elegant Introduction */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-8 tracking-widest">
            {tenant?.name}
          </h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed tracking-wide">
            Uma experiência de compra refinada e exclusiva
          </p>
        </motion.div>
      </section>

      {/* Luxury Features */}
      <section className="bg-white py-20 mb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-wide">
              Excelência em Cada Detalhe
            </h2>
            <div className="w-24 h-px bg-gray-300 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-white to-gray-50">
                <Diamond className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4 tracking-wide">
                Curadoria Exclusiva
              </h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Cada peça é cuidadosamente selecionada por nossos especialistas, 
                garantindo autenticidade e qualidade incomparável.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-white to-gray-50">
                <Award className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4 tracking-wide">
                Atendimento Personalizado
              </h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Nossa equipe dedicada oferece consultoria especializada 
                para uma experiência de compra verdadeiramente única.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-white to-gray-50">
                <Sparkles className="h-8 w-8 text-gray-700" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-4 tracking-wide">
                Experiência Exclusiva
              </h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Desfrute de privilégios únicos, desde o primeiro contato 
                até o pós-venda, com atenção aos mínimos detalhes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-wide">
            Nossas Coleções
          </h2>
          <div className="w-24 h-px bg-gray-300 mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group cursor-pointer"
            >
              <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-500 group-hover:shadow-lg bg-white overflow-hidden">
                <CardContent className="p-12 text-center">
                  <collection.icon className="h-12 w-12 text-gray-600 mx-auto mb-6 group-hover:text-gray-800 transition-colors" />
                  <h3 className="text-2xl font-light text-gray-900 mb-4 tracking-wide">
                    {collection.name}
                  </h3>
                  <p className="text-gray-600 font-light text-sm leading-relaxed">
                    {collection.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products - Elegant Grid */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6 tracking-wide">
              Seleção Especial
            </h2>
            <div className="w-24 h-px bg-gray-300 mx-auto mb-8"></div>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Peças cuidadosamente escolhidas para compor uma coleção excepcional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-500 group-hover:shadow-xl bg-white overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.mainImage || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center`}
                      alt={product.name}
                      className="w-full h-64 object-cover cursor-pointer transition-all duration-500 group-hover:scale-105"
                      onClick={() => onProductClick(product)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          wishlist.includes(product.id) 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                    {product.compareAtPrice && (
                      <Badge className="absolute top-4 left-4 bg-gray-900 text-white font-light px-3 py-1">
                        Oferta Especial
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-8">
                    <h3 
                      className="font-light text-gray-900 mb-4 cursor-pointer hover:text-gray-700 transition-colors text-lg tracking-wide line-clamp-2"
                      onClick={() => onProductClick(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-center mb-6">
                      <div className="flex text-gray-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 ml-2 font-light">(Excepcional)</span>
                    </div>
                    
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-2xl font-light text-gray-900 tracking-wide">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-lg text-gray-400 line-through font-light">
                            R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onAddToCart(product)}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 font-light transition-all duration-300 py-3 tracking-wide"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar à Seleção
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-16 tracking-wide">
              Experiências Especiais
            </h2>
            
            <Card className="border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-12">
              <CardContent className="p-0">
                <div className="flex text-gray-400 justify-center mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl font-light text-gray-700 mb-8 leading-relaxed italic tracking-wide">
                  "Uma experiência de compra verdadeiramente excepcional. Cada detalhe 
                  foi pensado para proporcionar não apenas produtos de qualidade, 
                  mas uma jornada memorável."
                </blockquote>
                <div className="text-gray-600 font-light tracking-wide">
                  — Cliente Premium
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Newsletter - Elegant */}
      <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8 tracking-wide">
              Mantenha-se Informado
            </h2>
            <p className="text-gray-600 font-light mb-12 leading-relaxed">
              Receba em primeira mão nossas novidades exclusivas e ofertas especiais
            </p>
            <div className="space-y-6">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="w-full px-6 py-4 border border-gray-300 focus:border-gray-500 focus:outline-none transition-colors font-light bg-white rounded-none"
              />
              <Button
                variant="outline"
                className="w-full border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-light transition-all duration-500 py-4 tracking-wide rounded-none"
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