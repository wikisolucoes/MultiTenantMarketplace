import { motion } from "framer-motion";
import { Star, ShoppingCart, Heart, Crown, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BannerCarousel from "../BannerCarousel";

interface ClassicThemeProps {
  tenant: any;
  products: any[];
  banners: any[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
  wishlist: number[];
}

export default function ClassicTheme({
  tenant,
  products,
  banners,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: ClassicThemeProps) {
  const featuredProducts = products.slice(0, 8);
  const categories = [
    { name: "Premium", icon: Crown },
    { name: "Tradicionais", icon: Award },
    { name: "Atemporais", icon: Clock },
    { name: "Exclusivos", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero Banner Carousel */}
      <section className="mb-12">
        <BannerCarousel 
          banners={banners}
          theme="classic"
          height="h-80 md:h-96"
        />
      </section>

      {/* Welcome Section */}
      <section className="container mx-auto px-4 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-6">
            Bem-vindos à {tenant?.name}
          </h1>
          <div className="w-24 h-1 bg-amber-600 mx-auto mb-6"></div>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Tradição e qualidade em cada produto. Há mais de 50 anos oferecendo 
            o melhor para nossos clientes com atendimento personalizado e produtos únicos.
          </p>
        </motion.div>
      </section>

      {/* Heritage Features */}
      <section className="bg-white py-16 mb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Nossa Tradição
            </h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200">
                <Crown className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4">
                Qualidade Premium
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Selecionamos cuidadosamente cada produto para garantir 
                a máxima qualidade e durabilidade.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200">
                <Award className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4">
                Atendimento Personalizado
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nossa equipe especializada está sempre pronta para 
                oferecer a melhor experiência de compra.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-gray-900 mb-4">
                Tradição Familiar
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Três gerações dedicadas a manter os mais altos 
                padrões de excelência e confiabilidade.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
            Nossas Coleções
          </h2>
          <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Card className="border-2 border-amber-200 hover:border-amber-400 transition-all duration-300 group-hover:shadow-lg bg-white">
                <CardContent className="p-8 text-center">
                  <category.icon className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                  <h3 className="font-serif font-semibold text-gray-900 text-lg">{category.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Produtos Selecionados
            </h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <Card className="border-2 border-gray-200 hover:border-amber-300 transition-all duration-300 group-hover:shadow-xl bg-white overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.mainImage || `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&crop=center`}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onClick={() => onProductClick(product)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
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
                      <Badge className="absolute top-3 left-3 bg-amber-600 text-white font-serif">
                        Oferta
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 
                      className="font-serif font-semibold text-gray-900 mb-2 cursor-pointer hover:text-amber-600 transition-colors line-clamp-2"
                      onClick={() => onProductClick(product)}
                    >
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2 font-serif">(Excelente)</span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl font-bold text-gray-900 font-serif">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-500 line-through font-serif">
                            R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onAddToCart(product)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-600 hover:border-amber-700 font-serif transition-all duration-300"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              O Que Nossos Clientes Dizem
            </h2>
            <div className="w-16 h-1 bg-amber-600 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-amber-200 bg-white">
              <CardContent className="p-6">
                <div className="flex text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 font-serif italic">
                  "Atendimento excepcional e produtos de qualidade incomparável. 
                  Uma loja que realmente se preocupa com seus clientes."
                </p>
                <div className="font-serif font-semibold text-gray-900">
                  — Maria Silva, Cliente há 15 anos
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-200 bg-white">
              <CardContent className="p-6">
                <div className="flex text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 font-serif italic">
                  "Tradição familiar que se reflete em cada detalhe. 
                  Sempre encontro exatamente o que preciso aqui."
                </p>
                <div className="font-serif font-semibold text-gray-900">
                  — João Santos, Cliente há 20 anos
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}