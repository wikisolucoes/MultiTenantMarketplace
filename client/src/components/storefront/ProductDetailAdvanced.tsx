import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, Tenant } from "@/types/api";
import { Star, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react";

interface ProductDetailAdvancedProps {
  product: Product;
  tenant: Tenant | null;
  onAddToCart: (productId: number, quantity: number) => void;
  onBackToCatalog: () => void;
  onAddToWishlist?: (productId: number) => void;
}

export default function ProductDetailAdvanced({ 
  product, 
  tenant, 
  onAddToCart, 
  onBackToCatalog,
  onAddToWishlist 
}: ProductDetailAdvancedProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Mock images for demonstration
  const productImages = [
    "https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=Produto+Principal",
    "https://via.placeholder.com/600x600/059669/FFFFFF?text=Vista+Lateral",
    "https://via.placeholder.com/600x600/DC2626/FFFFFF?text=Detalhes",
    "https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Embalagem"
  ];

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

          <div className="border-t border-b py-4">
            <div className="text-3xl font-bold text-primary mb-2">
              R$ {parseFloat(product.price).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              ou 12x de R$ {(parseFloat(product.price) / 12).toFixed(2)} sem juros
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Quantidade:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
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