import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, Tenant } from "@/types/api";
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Gift, Calendar, Award } from "lucide-react";

// SEO Meta Tags Hook
const useSEOMetaTags = (product: Product, tenant: Tenant | null) => {
  useEffect(() => {
    if (product && tenant) {
      // Update page title
      const title = product.metaTitle || `${product.name} | ${tenant.name}`;
      document.title = title;

      // Update meta description
      const description = product.metaDescription || product.description || `Compre ${product.name} na ${tenant.name}. Melhor preço e qualidade garantida.`;
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Update meta keywords
      if (product.metaKeywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', product.metaKeywords);
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.setAttribute('content', title);
      document.head.appendChild(ogTitle);

      const ogDescription = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.setAttribute('content', description);
      document.head.appendChild(ogDescription);

      const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      ogUrl.setAttribute('content', window.location.href);
      document.head.appendChild(ogUrl);

      // Clean up on unmount
      return () => {
        document.title = tenant.name;
      };
    }
  }, [product, tenant]);
};

interface ProductDetailAdvancedProps {
  product: Product;
  tenant: Tenant | null;
  onAddToCart: (productId: number, quantity: number) => void;
  onBackToCatalog: () => void;
  onAddToWishlist?: (productId: number) => void;
  customerType?: 'B2B' | 'B2C';
  isAuthenticated?: boolean;
}

export default function ProductDetailAdvanced({ 
  product, 
  tenant, 
  onAddToCart, 
  onBackToCatalog,
  onAddToWishlist,
  customerType = 'B2C',
  isAuthenticated = false
}: ProductDetailAdvancedProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [rewardPoints, setRewardPoints] = useState(0);

  // Apply SEO meta tags for this product
  useSEOMetaTags(product, tenant);

  // Product variants with different types and images
  const productVariants = [
    { type: "Cor", options: [
      { value: "Azul", priceAdjustment: 0, stock: 15, image: "https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=Azul" },
      { value: "Vermelho", priceAdjustment: 5, stock: 8, image: "https://via.placeholder.com/600x600/DC2626/FFFFFF?text=Vermelho" },
      { value: "Verde", priceAdjustment: 0, stock: 12, image: "https://via.placeholder.com/600x600/059669/FFFFFF?text=Verde" }
    ]},
    { type: "Tamanho", options: [
      { value: "P", priceAdjustment: -10, stock: 20, image: null },
      { value: "M", priceAdjustment: 0, stock: 25, image: null },
      { value: "G", priceAdjustment: 15, stock: 18, image: null },
      { value: "GG", priceAdjustment: 25, stock: 10, image: null }
    ]}
  ];

  // Product images (general or variant-specific)
  const productImages = [
    "https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=Produto+Principal",
    "https://via.placeholder.com/600x600/059669/FFFFFF?text=Vista+Lateral",
    "https://via.placeholder.com/600x600/DC2626/FFFFFF?text=Detalhes",
    "https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Embalagem"
  ];

  // Calculate current price based on customer type, promotions, and variants
  useEffect(() => {
    let basePrice = parseFloat(product.price);
    
    // Apply customer type pricing
    if (customerType === 'B2B' && product.priceB2B) {
      basePrice = parseFloat(product.priceB2B);
    } else if (customerType === 'B2C' && product.priceB2C) {
      basePrice = parseFloat(product.priceB2C);
    }
    
    // Apply promotional pricing if active
    const now = new Date();
    if (product.promotionalPrice && 
        product.promotionalStartDate && 
        product.promotionalEndDate &&
        now >= new Date(product.promotionalStartDate) && 
        now <= new Date(product.promotionalEndDate)) {
      basePrice = parseFloat(product.promotionalPrice);
    }
    
    // Apply variant price adjustments
    let variantAdjustment = 0;
    Object.entries(selectedVariants).forEach(([type, value]) => {
      const variant = productVariants.find(v => v.type === type);
      const option = variant?.options.find(o => o.value === value);
      if (option?.priceAdjustment) {
        variantAdjustment += option.priceAdjustment;
      }
    });
    
    setCurrentPrice((basePrice + variantAdjustment).toFixed(2));
    
    // Set reward points based on customer type
    if (customerType === 'B2B' && product.rewardPointsB2B) {
      setRewardPoints(product.rewardPointsB2B);
    } else if (customerType === 'B2C' && product.rewardPointsB2C) {
      setRewardPoints(product.rewardPointsB2C);
    }
  }, [product, customerType, selectedVariants]);

  // Update selected image when variant changes
  useEffect(() => {
    const colorVariant = selectedVariants["Cor"];
    if (colorVariant) {
      const variant = productVariants.find(v => v.type === "Cor");
      const option = variant?.options.find(o => o.value === colorVariant);
      if (option?.image) {
        setSelectedImage(0); // Reset to first image which will be the variant image
        // In a real implementation, you would update the productImages array
      }
    }
  }, [selectedVariants]);

  // Check if product is available
  const isAvailable = () => {
    if (product.availabilityDate && new Date(product.availabilityDate) > new Date()) {
      return false;
    }
    return product.stock > 0 || product.hasUnlimitedStock;
  };

  // Get availability date message
  const getAvailabilityMessage = () => {
    if (product.availabilityDate && new Date(product.availabilityDate) > new Date()) {
      return `Disponível a partir de ${new Date(product.availabilityDate).toLocaleDateString('pt-BR')}`;
    }
    return null;
  };

  // Check if promotional pricing is active
  const isPromotionalActive = () => {
    const now = new Date();
    return product.promotionalPrice && 
           product.promotionalStartDate && 
           product.promotionalEndDate &&
           now >= new Date(product.promotionalStartDate) && 
           now <= new Date(product.promotionalEndDate);
  };

  // Mock specifications
  const specifications = [
    { label: "Marca", value: "TechBrand" },
    { label: "Modelo", value: product.name },
    { label: "Cor", value: "Preto" },
    { label: "Dimensões", value: "15 x 10 x 5 cm" },
    { label: "Peso", value: "200g" },
    { label: "Garantia", value: "12 meses" },
    { label: "Material", value: "Plástico ABS" },
    { label: "Voltagem", value: "Bivolt" }
  ];

  // Mock reviews
  const reviews = [
    {
      id: 1,
      name: "João Silva",
      rating: 5,
      date: "2025-05-15",
      comment: "Excelente produto! Superou minhas expectativas. Muito boa qualidade e entrega rápida."
    },
    {
      id: 2,
      name: "Maria Santos",
      rating: 4,
      date: "2025-05-10",
      comment: "Bom produto, mas poderia ter mais opções de cor. No geral, estou satisfeita."
    },
    {
      id: 3,
      name: "Pedro Costa",
      rating: 5,
      date: "2025-05-05",
      comment: "Produto chegou rapidamente e exatamente como descrito. Recomendo!"
    }
  ];

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
  };

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product.id);
      setIsInWishlist(!isInWishlist);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description || 'Confira este produto incrível!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <button onClick={onBackToCatalog} className="hover:text-primary">
              Produtos
            </button>
          </li>
          <li>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={productImages[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({reviews.length} avaliações)
                </span>
              </div>
              <Badge variant="secondary">Em estoque</Badge>
            </div>
            <p className="text-muted-foreground mb-4">{product.description}</p>
          </div>

          {/* Advanced Pricing Display */}
          <div className="border-t border-b py-4 space-y-3">
            {/* Promotional Pricing */}
            {isPromotionalActive() && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="destructive" className="text-xs">
                    <Gift className="w-3 h-3 mr-1" />
                    PROMOÇÃO
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    até {new Date(product.promotionalEndDate!).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg text-muted-foreground line-through">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </span>
                  <div className="text-3xl font-bold text-red-600">
                    R$ {currentPrice}
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {Math.round(((parseFloat(product.price) - parseFloat(currentPrice)) / parseFloat(product.price)) * 100)}% OFF
                  </Badge>
                </div>
              </div>
            )}

            {/* Regular Pricing */}
            {!isPromotionalActive() && (
              <div className="space-y-2">
                {/* Customer Type Badge */}
                <div className="flex items-center space-x-2">
                  <Badge variant={customerType === 'B2B' ? "default" : "secondary"} className="text-xs">
                    {customerType === 'B2B' ? 'PREÇO EMPRESARIAL' : 'PREÇO CONSUMIDOR'}
                  </Badge>
                  {customerType === 'B2B' && product.priceB2B && parseFloat(product.priceB2B) < parseFloat(product.price) && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      DESCONTO ESPECIAL
                    </Badge>
                  )}
                </div>
                
                <div className="text-3xl font-bold text-primary">
                  R$ {currentPrice}
                </div>

                {/* Compare at Price */}
                {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(currentPrice) && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground line-through">
                      De: R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                    </span>
                    <Badge variant="outline" className="text-xs text-green-600">
                      ECONOMIZE R$ {(parseFloat(product.compareAtPrice) - parseFloat(currentPrice)).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Installments */}
            <div className="text-sm text-muted-foreground">
              ou 12x de R$ {(parseFloat(currentPrice) / 12).toFixed(2)} sem juros
            </div>

            {/* Reward Points */}
            {rewardPoints > 0 && isAuthenticated && (
              <div className="flex items-center space-x-2 text-sm">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  Ganhe <span className="font-medium text-yellow-600">{rewardPoints} pontos</span> nesta compra
                </span>
              </div>
            )}

            {/* Availability Message */}
            {getAvailabilityMessage() && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <Calendar className="w-4 h-4" />
                <span>{getAvailabilityMessage()}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Product Variants Selection */}
            {productVariants.map((variant) => (
              <div key={variant.type} className="space-y-2">
                <label className="text-sm font-medium">{variant.type}:</label>
                <Select
                  value={selectedVariants[variant.type] || ""}
                  onValueChange={(value) => 
                    setSelectedVariants(prev => ({ ...prev, [variant.type]: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Selecione ${variant.type.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variant.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.value}</span>
                          <div className="flex items-center space-x-2 ml-4">
                            {option.priceAdjustment !== 0 && (
                              <span className={`text-xs ${option.priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {option.priceAdjustment > 0 ? '+' : ''}R$ {option.priceAdjustment.toFixed(2)}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              ({option.stock} em estoque)
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {/* Quantity Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Quantidade:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={!isAvailable()}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={!isAvailable()}
                >
                  +
                </button>
              </div>
              {product.hasUnlimitedStock && (
                <Badge variant="outline" className="text-xs text-green-600">
                  ESTOQUE ILIMITADO
                </Badge>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddToCart}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao Carrinho
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToWishlist}
                className={isInWishlist ? 'text-red-500 border-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Shipping and Services */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-3 text-sm">
              <Truck className="h-5 w-5 text-green-600" />
              <span>Frete grátis para todo o Brasil</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Garantia de 12 meses</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              <span>Devolução grátis em 30 dias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="specifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specifications">Especificações</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações ({reviews.length})</TabsTrigger>
          <TabsTrigger value="shipping">Entrega e Devolução</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Especificações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-muted-foreground">{spec.label}:</span>
                    <span className="text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações dos Clientes</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= averageRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviews.length} avaliações)</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.name}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Entrega e Devolução</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Opções de Entrega</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Frete Grátis (5-7 dias úteis)</span>
                    <span className="font-semibold text-green-600">Grátis</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega Expressa (1-2 dias úteis)</span>
                    <span className="font-semibold">R$ 15,90</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega no Mesmo Dia</span>
                    <span className="font-semibold">R$ 25,90</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Política de Devolução</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Devolução grátis em até 30 dias</li>
                  <li>• Produto deve estar em condições originais</li>
                  <li>• Embalagem original deve ser mantida</li>
                  <li>• Reembolso processado em até 5 dias úteis</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Garantia</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Garantia do fabricante: 12 meses</li>
                  <li>• Defeitos de fabricação cobertos</li>
                  <li>• Suporte técnico especializado</li>
                  <li>• Reparo ou substituição gratuita</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}