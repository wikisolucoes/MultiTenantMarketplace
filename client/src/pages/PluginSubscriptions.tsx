import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Shield, Zap, Settings, CheckCircle, XCircle, Truck, Package, MapPin } from 'lucide-react';

const configureGatewaySchema = z.object({
  gatewayType: z.enum(['mercadopago', 'pagseguro', 'cielo', 'correios', 'melhorenvio', 'jadlog']),
  environment: z.enum(['sandbox', 'production']),
  // Payment gateway fields
  accessToken: z.string().optional(),
  publicKey: z.string().optional(),
  email: z.string().optional(),
  token: z.string().optional(),
  merchantId: z.string().optional(),
  merchantKey: z.string().optional(),
  supportedMethods: z.array(z.string()).optional(),
  // Shipping gateway fields
  username: z.string().optional(),
  password: z.string().optional(),
  contractCode: z.string().optional(),
  cardNumber: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  cnpj: z.string().optional(),
  contractNumber: z.string().optional(),
});

type ConfigureGatewayForm = z.infer<typeof configureGatewaySchema>;

export default function PluginSubscriptions() {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConfigureGatewayForm>({
    resolver: zodResolver(configureGatewaySchema),
    defaultValues: {
      environment: 'sandbox',
      supportedMethods: [],
    },
  });

  const { data: paymentGateways = [], isLoading: paymentLoading } = useQuery({
    queryKey: ['/api/payment-gateways/available'],
  });

  const { data: shippingGateways = [], isLoading: shippingLoading } = useQuery({
    queryKey: ['/api/shipment-gateways/available'],
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ pluginName, pluginType }: { pluginName: string; pluginType: 'payment' | 'shipping' }) => {
      const endpoint = pluginType === 'payment' 
        ? `/api/payment-gateways/subscribe/${pluginName}`
        : `/api/shipment-gateways/subscribe/${pluginName}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao assinar plugin');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Plugin assinado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-gateways/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipment-gateways/available'] });
    },
    onError: () => {
      toast({ title: 'Erro ao assinar plugin', variant: 'destructive' });
    },
  });

  const configureGatewayMutation = useMutation({
    mutationFn: async (data: ConfigureGatewayForm) => {
      const credentials: Record<string, any> = {};
      
      if (data.gatewayType === 'mercadopago') {
        credentials.accessToken = data.accessToken;
        credentials.publicKey = data.publicKey;
      } else if (data.gatewayType === 'pagseguro') {
        credentials.email = data.email;
        credentials.token = data.token;
      } else if (data.gatewayType === 'cielo') {
        credentials.merchantId = data.merchantId;
        credentials.merchantKey = data.merchantKey;
      }

      const response = await fetch('/api/payment-gateways/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayType: data.gatewayType,
          environment: data.environment,
          credentials,
          supportedMethods: data.supportedMethods,
        }),
      });
      
      if (!response.ok) throw new Error('Erro ao configurar gateway');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Gateway configurado com sucesso!' });
      setConfigDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/payment-gateways/available'] });
    },
    onError: () => {
      toast({ title: 'Erro ao configurar gateway', variant: 'destructive' });
    },
  });

  const handleSubscribe = (pluginName: string) => {
    subscribeMutation.mutate(pluginName);
  };

  const handleConfigure = (gatewayType: string) => {
    setSelectedGateway(gatewayType);
    form.setValue('gatewayType', gatewayType as any);
    setConfigDialogOpen(true);
  };

  const onSubmit = (data: ConfigureGatewayForm) => {
    configureGatewayMutation.mutate(data);
  };

  const renderCredentialFields = (gatewayType: string) => {
    switch (gatewayType) {
      case 'mercadopago':
        return (
          <>
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input placeholder="TEST-xxxx ou APP_USR-xxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Input placeholder="TEST-xxxx ou APP_USR-xxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'pagseguro':
        return (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Token do PagSeguro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'cielo':
        return (
          <>
            <FormField
              control={form.control}
              name="merchantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant ID</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="merchantKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant Key</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  const getGatewayIcon = (gatewayType: string) => {
    switch (gatewayType) {
      case 'mercadopago':
        return <CreditCard className="h-8 w-8 text-blue-500" />;
      case 'pagseguro':
        return <Shield className="h-8 w-8 text-orange-500" />;
      case 'cielo':
        return <Zap className="h-8 w-8 text-green-500" />;
      default:
        return <CreditCard className="h-8 w-8" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plugins de Pagamento</h1>
        <p className="text-muted-foreground">
          Expanda suas opções de pagamento com nossos plugins premium
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableGateways.map((gateway: any) => (
          <Card key={gateway.name} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getGatewayIcon(gateway.name)}
                  <div>
                    <CardTitle className="text-lg">{gateway.displayName}</CardTitle>
                    <CardDescription>
                      R$ {gateway.price.toFixed(2)}/mês
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  {gateway.subscribed ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Assinado
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Não assinado
                    </Badge>
                  )}
                  {gateway.configured && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Settings className="h-3 w-3 mr-1" />
                      Configurado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Métodos suportados:</h4>
                  <div className="flex flex-wrap gap-1">
                    {gateway.supportedMethods.map((method: string) => (
                      <Badge key={method} variant="outline" className="text-xs">
                        {method === 'pix' ? 'PIX' : 
                         method === 'credit_card' ? 'Cartão de Crédito' :
                         method === 'debit_card' ? 'Cartão de Débito' :
                         method === 'boleto' ? 'Boleto' : method}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!gateway.subscribed ? (
                    <Button 
                      onClick={() => handleSubscribe(gateway.name)}
                      disabled={subscribeMutation.isPending}
                      className="flex-1"
                    >
                      {subscribeMutation.isPending ? 'Assinando...' : 'Assinar'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleConfigure(gateway.name)}
                      variant={gateway.configured ? "outline" : "default"}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {gateway.configured ? 'Reconfigurar' : 'Configurar'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Configurar {availableGateways.find((g: any) => g.name === selectedGateway)?.displayName}
            </DialogTitle>
            <DialogDescription>
              Configure suas credenciais para processar pagamentos com este gateway.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                        <SelectItem value="production">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedGateway && renderCredentialFields(selectedGateway)}

              <FormField
                control={form.control}
                name="supportedMethods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Métodos de Pagamento</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {['pix', 'credit_card', 'debit_card', 'boleto'].map((method) => {
                        const isSupported = availableGateways
                          .find((g: any) => g.name === selectedGateway)
                          ?.supportedMethods.includes(method);
                        
                        if (!isSupported) return null;

                        return (
                          <label key={method} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value.includes(method)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, method]);
                                } else {
                                  field.onChange(field.value.filter((m) => m !== method));
                                }
                              }}
                            />
                            <span className="text-sm">
                              {method === 'pix' ? 'PIX' : 
                               method === 'credit_card' ? 'Cartão de Crédito' :
                               method === 'debit_card' ? 'Cartão de Débito' :
                               method === 'boleto' ? 'Boleto' : method}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfigDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={configureGatewayMutation.isPending}
                >
                  {configureGatewayMutation.isPending ? 'Configurando...' : 'Configurar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}