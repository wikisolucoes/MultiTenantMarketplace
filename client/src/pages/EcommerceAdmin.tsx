import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Ticket, 
  Users, 
  TrendingUp, 
  Upload, 
  Truck, 
  BarChart3,
  Mail,
  Star,
  FileText
} from "lucide-react";

// Schemas for form validation
const couponSchema = z.object({
  code: z.string().min(3, "Código deve ter pelo menos 3 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.string().min(1, "Valor é obrigatório"),
  minimumOrder: z.string().optional(),
  maxDiscount: z.string().optional(),
  usageLimit: z.string().optional(),
  validFrom: z.string(),
  validUntil: z.string(),
});

const giftCardSchema = z.object({
  initialValue: z.string().min(1, "Valor é obrigatório"),
  recipientEmail: z.string().email("Email inválido").optional(),
  recipientName: z.string().optional(),
  message: z.string().optional(),
  validUntil: z.string().optional(),
});

const affiliateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  commissionRate: z.string().min(1, "Taxa de comissão é obrigatória"),
});

const shippingMethodSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["fixed", "free", "weight_based", "item_based", "store_pickup", "melhor_envio"]),
  cost: z.string().optional(),
  freeThreshold: z.string().optional(),
  estimatedDays: z.string().optional(),
});

export default function EcommerceAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch overview stats
  const { data: overviewStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/tenant/stats/overview"],
  });

  // Fetch coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ["/api/tenant/coupons"],
  });

  // Fetch gift cards
  const { data: giftCards, isLoading: giftCardsLoading } = useQuery({
    queryKey: ["/api/tenant/gift-cards"],
  });

  // Fetch affiliates
  const { data: affiliates, isLoading: affiliatesLoading } = useQuery({
    queryKey: ["/api/tenant/affiliates"],
  });

  // Fetch shipping methods
  const { data: shippingMethods, isLoading: shippingLoading } = useQuery({
    queryKey: ["/api/tenant/shipping-methods"],
  });

  // Forms
  const couponForm = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: "percentage",
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const giftCardForm = useForm({
    resolver: zodResolver(giftCardSchema),
  });

  const affiliateForm = useForm({
    resolver: zodResolver(affiliateSchema),
  });

  const shippingForm = useForm({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      type: "fixed",
    },
  });

  // Mutations
  const createCouponMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tenant/coupons", data),
    onSuccess: () => {
      toast({ title: "Cupom criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/coupons"] });
      couponForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar cupom", variant: "destructive" });
    },
  });

  const createGiftCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tenant/gift-cards", data),
    onSuccess: () => {
      toast({ title: "Vale presente criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/gift-cards"] });
      giftCardForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar vale presente", variant: "destructive" });
    },
  });

  const createAffiliateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tenant/affiliates", data),
    onSuccess: () => {
      toast({ title: "Afiliado criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/affiliates"] });
      affiliateForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar afiliado", variant: "destructive" });
    },
  });

  const createShippingMethodMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tenant/shipping-methods", data),
    onSuccess: () => {
      toast({ title: "Método de envio criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/shipping-methods"] });
      shippingForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar método de envio", variant: "destructive" });
    },
  });

  // CSV Import handler
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'products' | 'stock') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      // Simple CSV parsing (in production, use a proper CSV library)
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      const endpoint = type === 'products' ? '/api/tenant/import/products' : '/api/tenant/import/stock';
      const result = await apiRequest("POST", endpoint, {
        fileName: file.name,
        csvData: data,
      });

      toast({
        title: `Importação ${type === 'products' ? 'de produtos' : 'de estoque'} iniciada`,
        description: `${result.successRows} registros processados com sucesso`,
      });

      if (result.errors.length > 0) {
        console.log("Erros de importação:", result.errors);
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Verifique o formato do arquivo CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administração E-commerce</h1>
        <p className="text-muted-foreground">Gerencie todas as funcionalidades avançadas da sua loja</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="giftcards">Vales</TabsTrigger>
          <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          <TabsTrigger value="shipping">Envio</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Afiliados Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewStats?.affiliates?.activeAffiliates || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {overviewStats?.affiliates?.totalAffiliates || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {overviewStats?.affiliates?.totalCommissionsPending?.toFixed(2) || "0,00"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pago: R$ {overviewStats?.affiliates?.totalCommissionsPaid?.toFixed(2) || "0,00"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Fidelidade</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewStats?.loyalty?.totalCustomersWithPoints || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pontos emitidos: {overviewStats?.loyalty?.totalPointsIssued || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI Marketing</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overviewStats?.marketing?.totalROI?.toFixed(1) || "0"}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita: R$ {overviewStats?.marketing?.totalRevenue?.toFixed(2) || "0,00"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Criar Cupom de Desconto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...couponForm}>
                  <form onSubmit={couponForm.handleSubmit((data) => createCouponMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={couponForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código do Cupom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="DESCONTO10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={couponForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Desconto de 10%" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={couponForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentagem</SelectItem>
                              <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                              <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={couponForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={couponForm.control}
                        name="validFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Válido de</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={couponForm.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Válido até</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={createCouponMutation.isPending} className="w-full">
                      {createCouponMutation.isPending ? "Criando..." : "Criar Cupom"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cupons Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {couponsLoading ? (
                    <div>Carregando cupons...</div>
                  ) : (
                    coupons?.map((coupon: any) => (
                      <div key={coupon.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{coupon.code}</div>
                          <div className="text-sm text-muted-foreground">{coupon.name}</div>
                          <Badge variant={coupon.isActive ? "default" : "secondary"}>
                            {coupon.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {coupon.type === "percentage" && `${coupon.value}%`}
                            {coupon.type === "fixed_amount" && `R$ ${coupon.value}`}
                            {coupon.type === "free_shipping" && "Frete Grátis"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Usado: {coupon.usageCount || 0}x
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gift Cards Tab */}
        <TabsContent value="giftcards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Criar Vale Presente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...giftCardForm}>
                  <form onSubmit={giftCardForm.handleSubmit((data) => createGiftCardMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={giftCardForm.control}
                      name="initialValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="100.00" type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={giftCardForm.control}
                      name="recipientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email do Destinatário</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="destinatario@email.com" type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={giftCardForm.control}
                      name="recipientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Destinatário</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do destinatário" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={giftCardForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Mensagem personalizada..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createGiftCardMutation.isPending} className="w-full">
                      {createGiftCardMutation.isPending ? "Criando..." : "Criar Vale Presente"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vales Presentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {giftCardsLoading ? (
                    <div>Carregando vales presentes...</div>
                  ) : (
                    giftCards?.map((giftCard: any) => (
                      <div key={giftCard.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{giftCard.code}</div>
                          <div className="text-sm text-muted-foreground">{giftCard.recipientName || giftCard.recipientEmail}</div>
                          <Badge variant={giftCard.isActive ? "default" : "secondary"}>
                            {giftCard.isActive ? "Ativo" : "Usado"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">R$ {parseFloat(giftCard.currentBalance).toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            de R$ {parseFloat(giftCard.initialValue).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cadastrar Afiliado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...affiliateForm}>
                  <form onSubmit={affiliateForm.handleSubmit((data) => createAffiliateMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={affiliateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do afiliado" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={affiliateForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="email@exemplo.com" type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={affiliateForm.control}
                      name="commissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxa de Comissão (%)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="5" type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createAffiliateMutation.isPending} className="w-full">
                      {createAffiliateMutation.isPending ? "Criando..." : "Cadastrar Afiliado"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Afiliados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {affiliatesLoading ? (
                    <div>Carregando afiliados...</div>
                  ) : (
                    affiliates?.map((affiliate: any) => (
                      <div key={affiliate.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{affiliate.name}</div>
                          <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                          <div className="text-sm font-mono text-blue-600">{affiliate.affiliateCode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{affiliate.commissionRate}%</div>
                          <div className="text-sm text-muted-foreground">
                            Vendas: {affiliate.totalSales}
                          </div>
                          <div className="text-sm text-green-600">
                            R$ {parseFloat(affiliate.totalEarnings).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Criar Método de Envio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...shippingForm}>
                  <form onSubmit={shippingForm.handleSubmit((data) => createShippingMethodMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={shippingForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Frete Expresso" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fixed">Frete Fixo</SelectItem>
                              <SelectItem value="free">Frete Grátis</SelectItem>
                              <SelectItem value="weight_based">Por Peso</SelectItem>
                              <SelectItem value="item_based">Por Item</SelectItem>
                              <SelectItem value="store_pickup">Retirar na Loja</SelectItem>
                              <SelectItem value="melhor_envio">Melhor Envio</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo (R$)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="15.00" type="number" step="0.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="estimatedDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo (dias)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="3" type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createShippingMethodMutation.isPending} className="w-full">
                      {createShippingMethodMutation.isPending ? "Criando..." : "Criar Método"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Envio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shippingLoading ? (
                    <div>Carregando métodos de envio...</div>
                  ) : (
                    shippingMethods?.map((method: any) => (
                      <div key={method.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{method.type.replace('_', ' ')}</div>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {method.cost ? `R$ ${parseFloat(method.cost).toFixed(2)}` : 'Grátis'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {method.estimatedDays} dias
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Arquivo CSV de Produtos
                    </label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, 'products')}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Formato: name,description,price,stock,sku,category,brand,active
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Arquivo CSV de Estoque
                    </label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCSVUpload(e, 'stock')}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Formato: sku,stock,price
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instruções de Importação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium">Produtos CSV:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>name: Nome do produto (obrigatório)</li>
                      <li>price: Preço (obrigatório)</li>
                      <li>description: Descrição (opcional)</li>
                      <li>stock: Quantidade em estoque (opcional)</li>
                      <li>sku: Código do produto (opcional)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Estoque CSV:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>sku: Código do produto (obrigatório)</li>
                      <li>stock: Nova quantidade (obrigatório)</li>
                      <li>price: Novo preço (opcional)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border">
                    <p className="text-xs text-yellow-800">
                      <strong>Atenção:</strong> Produtos com SKU existente serão atualizados. 
                      Produtos sem SKU ou com SKU novo serão criados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campanhas de Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Funcionalidades de marketing em desenvolvimento
                </p>
                <Button variant="outline" className="mt-4">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Relatórios de Marketing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Programa de Fidelidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Gerenciamento de pontos de fidelidade em desenvolvimento
                </p>
                <Button variant="outline" className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Relatórios de Fidelidade
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}