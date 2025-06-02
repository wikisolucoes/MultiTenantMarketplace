import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/api";
import { ShoppingCart, Star, Plus, Minus, ArrowLeft, Heart, Share2 } from "lucide-react";

interface ProductDetailProps {
  productId: number;
  products: Product[];
  onAddToCart: (productId: number, quantity: number) => void;
  isLoading: boolean;
}

export default function ProductDetail({ productId, products, onAddToCart, isLoading }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("description");

  const product = products.find(p => p.id === productId);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product.id, quantity);
    }
  };

  const relatedProducts = products
    .filter(p => p.id !== productId && p.isActive)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold mb-4">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-4">
            O produto que você procura não existe ou foi removido.
          </p>
          <Link href="/produtos">
            <Button>Ver todos os produtos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/">
            <a className="hover:text-foreground">Home</a>
          </Link>
          <span>/</span>
          <Link href="/produtos">
            <a className="hover:text-foreground">Produtos</a>
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </nav>

      {/* Back button */}
      <Link href="/produtos">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos produtos
        </Button>
      </Link>

      {/* Product details */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product image */}
        <div className="aspect-square bg-muted rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <p className="text-lg font-medium">{product.name}</p>
            </div>
          </div>
          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute top-4 right-4">
              Esgotado
            </Badge>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(4.8) • 127 avaliações</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </div>
            <div className="text-sm text-muted-foreground">
              {product.stock > 0 
                ? `${product.stock} unidades em estoque` 
                : 'Produto indisponível'
              }
            </div>
          </div>

          {/* Quantity selector */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Quantidade
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao carrinho
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Product features */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Frete grátis para compras acima de R$ 199,00
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Garantia de 1 ano
            </div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              Entrega em até 7 dias úteis
            </div>
          </div>
        </div>
      </div>

      {/* Product tabs */}
      <div className="mb-12">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "description"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelectedTab("description")}
            >
              Descrição
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "specifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelectedTab("specifications")}
            >
              Especificações
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setSelectedTab("reviews")}
            >
              Avaliações
            </button>
          </nav>
        </div>

        <div className="py-6">
          {selectedTab === "description" && (
            <div className="prose max-w-none">
              <p className="text-foreground">
                {product.description || "Descrição detalhada do produto em breve."}
              </p>
            </div>
          )}
          {selectedTab === "specifications" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Categoria:</span>
                  <span className="ml-2 text-muted-foreground capitalize">Eletrônicos</span>
                </div>
                <div>
                  <span className="font-medium">Garantia:</span>
                  <span className="ml-2 text-muted-foreground">1 ano</span>
                </div>
              </div>
            </div>
          )}
          {selectedTab === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="font-medium">4.8 de 5 estrelas</span>
                <span className="text-muted-foreground">(127 avaliações)</span>
              </div>
              <p className="text-muted-foreground">
                Sistema de avaliações em desenvolvimento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Produtos relacionados
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium">{relatedProduct.name}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/produto/${relatedProduct.id}`}>
                    <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(relatedProduct.price)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => onAddToCart(relatedProduct.id, 1)}
                      disabled={relatedProduct.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}