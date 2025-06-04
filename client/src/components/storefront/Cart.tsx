import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Product } from "@/types/api";
import { ShoppingCart, Plus, Minus, X, ArrowLeft } from "lucide-react";

interface CartItem {
  id: number;
  quantity: number;
}

interface CartProps {
  cartItems: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  total: number;
}

export default function Cart({ cartItems, products, onUpdateQuantity, onRemoveItem, total }: CartProps) {
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const getCartItemsWithProduct = () => {
    return cartItems
      .map(item => {
        const product = products.find(p => p.id === item.id);
        return product ? { ...item, product } : null;
      })
      .filter(Boolean) as (CartItem & { product: Product })[];
  };

  const cartItemsWithProduct = getCartItemsWithProduct();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCost = total >= 199 ? 0 : 15.90;
  const finalTotal = total + shippingCost;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Seu carrinho está vazio
          </h1>
          <p className="text-muted-foreground mb-8">
            Adicione produtos ao seu carrinho para continuar comprando
          </p>
          <Link href="/produtos">
            <Button size="lg">
              Continuar comprando
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Carrinho de Compras
          </h1>
          <p className="text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'} no seu carrinho
          </p>
        </div>
        <Link href="/produtos">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar comprando
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItemsWithProduct.map(({ id, quantity, product }) => (
            <Card key={id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link href={`/produto/${product.id}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {product.description && product.description.substring(0, 60)}...
                    </p>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {formatCurrency(product.price)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(id, quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => onUpdateQuantity(id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                      min="1"
                      max={product.stock}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(id, quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Total Price */}
                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      {formatCurrency(parseFloat(product.price) * quantity)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    formatCurrency(shippingCost)
                  )}
                </span>
              </div>
              
              {total < 199 && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  Adicione mais {formatCurrency(199 - total)} para ganhar frete grátis!
                </div>
              )}
              
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={onCheckout}
              >
                Finalizar Compra
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Pagamento seguro com:</p>
                <div className="flex justify-center space-x-2 mt-2">
                  <span className="px-2 py-1 bg-muted rounded text-xs">PIX</span>
                  <span className="px-2 py-1 bg-muted rounded text-xs">Cartão</span>
                  <span className="px-2 py-1 bg-muted rounded text-xs">Boleto</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}