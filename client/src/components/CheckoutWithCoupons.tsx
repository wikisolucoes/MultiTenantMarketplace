import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingCart, Percent, Check, X, Tag } from 'lucide-react';

const applyCouponSchema = z.object({
  code: z.string().min(1, 'Digite o código do cupom'),
});

type ApplyCouponForm = z.infer<typeof applyCouponSchema>;

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  categoryId?: number;
}

interface CheckoutWithCouponsProps {
  cartItems: CartItem[];
  customerId?: number;
  onProceedToPayment: (finalAmount: number, appliedCoupon?: any) => void;
}

export default function CheckoutWithCoupons({ 
  cartItems, 
  customerId,
  onProceedToPayment 
}: CheckoutWithCouponsProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<ApplyCouponForm>({
    resolver: zodResolver(applyCouponSchema),
    defaultValues: {
      code: '',
    },
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = subtotal - discountAmount;

  const validateCouponMutation = useMutation({
    mutationFn: async (data: ApplyCouponForm) => {
      const response = await fetch('/api/discount-coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          orderTotal: subtotal,
          productIds: cartItems.map(item => item.id),
          customerId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao validar cupom');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      if (result.isValid) {
        setAppliedCoupon(result.coupon);
        setCouponError('');
        toast({ 
          title: 'Cupom aplicado com sucesso!',
          description: `Desconto de R$ ${result.coupon.discountAmount.toFixed(2)} aplicado.`
        });
        form.reset();
      } else {
        setCouponError(result.error);
        setAppliedCoupon(null);
      }
    },
    onError: (error: any) => {
      setCouponError('Erro ao validar cupom. Tente novamente.');
      setAppliedCoupon(null);
    },
  });

  const onSubmit = (data: ApplyCouponForm) => {
    setCouponError('');
    validateCouponMutation.mutate(data);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    form.reset();
  };

  const handleProceedToPayment = () => {
    onProceedToPayment(total, appliedCoupon);
  };

  return (
    <div className="space-y-6">
      {/* Cart Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Resumo do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Qtd: {item.quantity})
                  </span>
                </div>
                <span className="font-medium">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coupon Application */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Cupom de Desconto
          </CardTitle>
          <CardDescription>
            Tem um cupom? Digite o código abaixo para aplicar o desconto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!appliedCoupon ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do cupom"
                  {...form.register('code')}
                  className="flex-1"
                  disabled={validateCouponMutation.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={validateCouponMutation.isPending}
                  variant="outline"
                >
                  {validateCouponMutation.isPending ? 'Validando...' : 'Aplicar'}
                </Button>
              </div>
              
              {form.formState.errors.code && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.code.message}
                </p>
              )}
              
              {couponError && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{couponError}</AlertDescription>
                </Alert>
              )}
            </form>
          ) : (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>{appliedCoupon.code}</strong> - {appliedCoupon.name}
                      <div className="text-sm">
                        Desconto: R$ {appliedCoupon.discountAmount.toFixed(2)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-green-800 hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-between text-sm">
                <span>Tipo de desconto:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {appliedCoupon.type === 'percentage' 
                    ? `${appliedCoupon.value}%` 
                    : `R$ ${appliedCoupon.value.toFixed(2)}`
                  }
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Total */}
      <Card>
        <CardHeader>
          <CardTitle>Total do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({appliedCoupon.code}):</span>
                <span>- R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
            
            {appliedCoupon && (
              <div className="text-sm text-green-600 font-medium">
                Você economizou R$ {discountAmount.toFixed(2)}!
              </div>
            )}
          </div>
          
          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={handleProceedToPayment}
            disabled={cartItems.length === 0}
          >
            Finalizar Compra - R$ {total.toFixed(2)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}