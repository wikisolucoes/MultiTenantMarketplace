import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tenant, Product } from "@/types/api";
import { ShoppingCart, Star, Truck, Shield, CreditCard } from "lucide-react";

interface StorefrontHomeProps {
  tenant: Tenant;
  products: Product[];
  onAddToCart: (productId: number, quantity?: number) => void;
  isLoading: boolean;
}

export default function StorefrontHome({ tenant, products, onAddToCart, isLoading }: StorefrontHomeProps) {
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const featuredProducts = products.filter(p => p.isActive).slice(0, 8);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Bem-vindo à {tenant.name}
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Descubra os melhores produtos em {tenant.category} com qualidade garantida e entrega rápida.
            </p>
            <div className="space-x-4">
              <Link href="/produtos">
                <Button size="lg" variant="secondary">
                  Ver Produtos
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-muted-foreground">
                Frete grátis para compras acima de R$ 199,00
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compra Segura</h3>
              <p className="text-muted-foreground">
                Seus dados protegidos com certificado SSL
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Múltiplas Formas</h3>
              <p className="text-muted-foreground">
                PIX, cartão de crédito e boleto bancário
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-muted-foreground">
              Confira nossa seleção especial de produtos
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium">{product.name}</p>
                      </div>
                    </div>
                    {product.stock === 0 && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        Esgotado
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/produto/${product.id}`}>
                      <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-foreground">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => onAddToCart(product.id)}
                        disabled={product.stock === 0}
                        className="shrink-0"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/produtos">
              <Button size="lg" variant="outline">
                Ver Todos os Produtos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Receba nossas ofertas
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Cadastre-se e seja o primeiro a saber sobre promoções e novidades
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>Cadastrar</Button>
          </div>
        </div>
      </section>
    </div>
  );
}