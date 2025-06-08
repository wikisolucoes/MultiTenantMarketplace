import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product, Tenant } from "@/types/api";
import { ShoppingCart, CreditCard, QrCode, FileText, Truck, Check } from "lucide-react";

interface CartItem {
  id: number;
  quantity: number;
}

interface CheckoutProps {
  cartItems: CartItem[];
  products: Product[];
  total: number;
  tenant: Tenant;
  onOrderComplete: () => void;
}

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerDocument: z.string().min(11, "CPF inválido"),
  
  // Shipping Address
  zipCode: z.string().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  
  // Payment
  paymentMethod: z.enum(["pix", "credit_card", "boleto"]),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

export default function Checkout({ cartItems, products, total, tenant, onOrderComplete }: CheckoutProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      paymentMethod: "pix",
    },
  });

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
  const shippingCost = total >= 199 ? 0 : 15.90;
  const finalTotal = total + shippingCost;

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutData) => {
      const orderItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: products.find(p => p.id === item.id)?.price || "0",
      }));

      const orderData = {
        customerData: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          document: data.customerDocument,
        },
        shippingAddress: {
          zipCode: data.zipCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        },
        paymentMethod: data.paymentMethod,
        items: orderItems,
        totalAmount: finalTotal.toString(),
        shippingCost: shippingCost.toString(),
        subdomain: tenant.subdomain,
      };

      return apiRequest("/api/public/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você receberá as instruções de pagamento por email.",
      });
      onOrderComplete();
      setStep(4);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao processar pedido",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutData) => {
    createOrderMutation.mutate(data);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "pix":
        return <QrCode className="h-5 w-5" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5" />;
      case "boleto":
        return <FileText className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "pix":
        return "PIX - Aprovação imediata";
      case "credit_card":
        return "Cartão de Crédito";
      case "boleto":
        return "Boleto Bancário";
      default:
        return method;
    }
  };

  if (step === 4) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Pedido Realizado com Sucesso!
          </h1>
          <p className="text-muted-foreground mb-8">
            Você receberá as instruções de pagamento por email em alguns minutos.
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.href = "/"}>
              Voltar ao início
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/produtos"}>
              Continuar comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepNumber ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {stepNumber === 1 && "Dados"}
                  {stepNumber === 2 && "Entrega"}
                  {stepNumber === 3 && "Pagamento"}
                </span>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    step > stepNumber ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Customer Data */}
                {step === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="customerName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu nome completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="seu@email.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99999-9999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerDocument"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => setStep(2)}
                        className="w-full"
                      >
                        Continuar para entrega
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Shipping Address */}
                {step === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="h-5 w-5 mr-2" />
                        Endereço de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input placeholder="Rua, avenida, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input placeholder="Apto, sala..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input placeholder="Centro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="São Paulo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                <SelectItem value="PR">Paraná</SelectItem>
                                <SelectItem value="SC">Santa Catarina</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setStep(3)}
                          className="flex-1"
                        >
                          Continuar para pagamento
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Forma de Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                {["pix", "credit_card", "boleto"].map((method) => (
                                  <div key={method} className="flex items-center space-x-2 border border-border rounded-lg p-4">
                                    <RadioGroupItem value={method} id={method} />
                                    <Label htmlFor={method} className="flex items-center space-x-3 cursor-pointer flex-1">
                                      {getPaymentMethodIcon(method)}
                                      <span>{getPaymentMethodName(method)}</span>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setStep(2)}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1"
                          disabled={createOrderMutation.isPending}
                        >
                          {createOrderMutation.isPending ? "Processando..." : "Finalizar Pedido"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItemsWithProduct.map(({ id, quantity, product }) => (
                    <div key={id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {quantity}x {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{shippingCost === 0 ? "Grátis" : formatCurrency(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}