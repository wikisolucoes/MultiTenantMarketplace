import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Product, Tenant } from "@/types/api";
import { CreditCard, Truck, MapPin, Clock, Shield } from "lucide-react";

interface CheckoutAdvancedProps {
  cartItems: Array<{ id: number; quantity: number }>;
  products: Product[];
  total: number;
  tenant: Tenant | null;
  onOrderComplete: () => void;
  onBackToCart: () => void;
  isAuthenticated?: boolean;
  customerData?: CustomerData;
}

interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  cpf: string;
}

interface ShippingAddress {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface PaymentData {
  method: 'credit' | 'debit' | 'pix' | 'boleto';
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  installments?: number;
}

export default function CheckoutAdvanced({
  cartItems,
  products,
  total,
  tenant,
  onOrderComplete,
  onBackToCart,
  isAuthenticated = false,
  customerData
}: CheckoutAdvancedProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Customer info state
  const [guestCustomer, setGuestCustomer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    cpf: ""
  });

  // Shipping state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });

  const [shippingMethod, setShippingMethod] = useState("standard");

  // Payment state
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'credit',
    installments: 1
  });

  // Shipping options
  const shippingOptions = [
    { id: "standard", name: "Entrega Padrão", time: "5-7 dias úteis", price: 0 },
    { id: "express", name: "Entrega Expressa", time: "2-3 dias úteis", price: 15.90 },
    { id: "same-day", name: "Entrega no Mesmo Dia", time: "Até 18h", price: 25.90 }
  ];

  const selectedShipping = shippingOptions.find(opt => opt.id === shippingMethod);
  const shippingCost = selectedShipping?.price || 0;
  const finalTotal = total + shippingCost;

  const getCartItems = () => {
    return cartItems.map(item => {
      const product = products.find(p => p.id === item.id);
      return product ? { ...product, quantity: item.quantity } : null;
    }).filter(Boolean);
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinishOrder = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    onOrderComplete();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
          }`}>
            {stepNum}
          </div>
          {stepNum < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              step > stepNum ? 'bg-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderCustomerInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated && customerData ? (
          <div className="space-y-2">
            <p><strong>Nome:</strong> {customerData.firstName} {customerData.lastName}</p>
            <p><strong>Email:</strong> {customerData.email}</p>
            <p><strong>Telefone:</strong> {customerData.phone}</p>
            <p><strong>CPF:</strong> {customerData.cpf}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={guestCustomer.firstName}
                  onChange={(e) => setGuestCustomer({ ...guestCustomer, firstName: e.target.value })}
                  placeholder="João"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={guestCustomer.lastName}
                  onChange={(e) => setGuestCustomer({ ...guestCustomer, lastName: e.target.value })}
                  placeholder="Silva"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={guestCustomer.email}
                onChange={(e) => setGuestCustomer({ ...guestCustomer, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={guestCustomer.phone}
                  onChange={(e) => setGuestCustomer({ ...guestCustomer, phone: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={guestCustomer.cpf}
                  onChange={(e) => setGuestCustomer({ ...guestCustomer, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderShippingInfo = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="zipCode">CEP</Label>
            <Input
              id="zipCode"
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: formatZipCode(e.target.value) })}
              placeholder="00000-000"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                placeholder="Rua das Flores"
              />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={shippingAddress.number}
                onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={shippingAddress.complement}
              onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
              placeholder="Apto 45, Bloco B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={shippingAddress.neighborhood}
                onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                placeholder="Centro"
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Forma de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
            {shippingOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.time}</p>
                </div>
                <div className="font-semibold">
                  {option.price === 0 ? 'Grátis' : `R$ ${option.price.toFixed(2)}`}
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Forma de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={paymentData.method} onValueChange={(value) => setPaymentData({ ...paymentData, method: value as any })}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="credit" id="credit" />
            <Label htmlFor="credit" className="cursor-pointer">Cartão de Crédito</Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="debit" id="debit" />
            <Label htmlFor="debit" className="cursor-pointer">Cartão de Débito</Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="pix" id="pix" />
            <Label htmlFor="pix" className="cursor-pointer">PIX (5% de desconto)</Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <RadioGroupItem value="boleto" id="boleto" />
            <Label htmlFor="boleto" className="cursor-pointer">Boleto Bancário (5% de desconto)</Label>
          </div>
        </RadioGroup>

        {(paymentData.method === 'credit' || paymentData.method === 'debit') && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input
                id="cardNumber"
                value={paymentData.cardNumber || ''}
                onChange={(e) => setPaymentData({ ...paymentData, cardNumber: formatCardNumber(e.target.value) })}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>

            <div>
              <Label htmlFor="cardName">Nome no Cartão</Label>
              <Input
                id="cardName"
                value={paymentData.cardName || ''}
                onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                placeholder="JOÃO SILVA"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardExpiry">Validade</Label>
                <Input
                  id="cardExpiry"
                  value={paymentData.cardExpiry || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, cardExpiry: e.target.value })}
                  placeholder="MM/AA"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cardCvv">CVV</Label>
                <Input
                  id="cardCvv"
                  value={paymentData.cardCvv || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, cardCvv: e.target.value })}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>

            {paymentData.method === 'credit' && (
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <select
                  id="installments"
                  value={paymentData.installments}
                  onChange={(e) => setPaymentData({ ...paymentData, installments: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                >
                  {[1, 2, 3, 6, 12].map(num => (
                    <option key={num} value={num}>
                      {num}x de R$ {(finalTotal / num).toFixed(2)} {num === 1 ? '' : 'sem juros'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {paymentData.method === 'pix' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Após confirmar o pedido, você receberá o código PIX para pagamento.
              O pagamento deve ser realizado em até 30 minutos.
            </p>
          </div>
        )}

        {paymentData.method === 'boleto' && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              O boleto será gerado após a confirmação do pedido.
              Prazo de pagamento: até 3 dias úteis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderOrderSummary = () => {
    const cartItemsWithProducts = getCartItems();
    const discount = (paymentData.method === 'pix' || paymentData.method === 'boleto') ? finalTotal * 0.05 : 0;
    const finalTotalWithDiscount = finalTotal - discount;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItemsWithProducts.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete ({selectedShipping?.name}):</span>
                <span>{shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto (5%):</span>
                  <span>-R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {finalTotalWithDiscount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Compra 100% segura e protegida</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBackToCart}>
          ← Voltar ao Carrinho
        </Button>
        <h1 className="text-3xl font-bold text-center mt-4">Finalizar Compra</h1>
      </div>

      {renderStepIndicator()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && renderCustomerInfo()}
          {step === 2 && renderShippingInfo()}
          {step === 3 && renderPaymentInfo()}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <Clock className="h-5 w-5 mr-2" />
                  Confirmar Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Revise todas as informações antes de finalizar seu pedido.
                </p>
                <Button 
                  onClick={handleFinishOrder} 
                  className="w-full" 
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processando..." : "Confirmar Pedido"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={handlePreviousStep}>
                Voltar
              </Button>
            )}
            {step < 4 && (
              <Button onClick={handleNextStep} className="ml-auto">
                Continuar
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {renderOrderSummary()}
        </div>
      </div>
    </div>
  );
}