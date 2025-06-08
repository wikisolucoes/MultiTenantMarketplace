import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CreditCard, 
  QrCode, 
  Receipt, 
  Wallet, 
  ArrowUpDown, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Smartphone,
  FileText,
  Building2,
  Calendar,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CelcoinBalance {
  available: number;
  blocked: number;
  total: number;
  currency: string;
  updatedAt: string;
}

interface CelcoinTransaction {
  id: string;
  correlationId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  description: string;
}

interface PaymentRequest {
  amount: string;
  tenantId: number;
  orderId: string;
  customerData?: {
    name: string;
    email: string;
    cpf: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
}

export default function CelcoinIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentData, setPaymentData] = useState<PaymentRequest>({
    amount: "",
    tenantId: 5, // Default to demo tenant
    orderId: "",
    customerData: {
      name: "",
      email: "",
      cpf: "",
      address: {
        street: "",
        number: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: ""
      }
    }
  });

  // Get Celcoin account balance
  const { data: balance, isLoading: balanceLoading } = useQuery<CelcoinBalance>({
    queryKey: ['/api/celcoin/account/balance'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get account statement
  const { data: statement, isLoading: statementLoading } = useQuery<{
    success: boolean;
    transactions: CelcoinTransaction[];
    period: { startDate: string; endDate: string };
  }>({
    queryKey: ['/api/celcoin/account/statement'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Create PIX payment mutation
  const createPixPayment = useMutation({
    mutationFn: async (data: PaymentRequest) => {
      return await apiRequest('POST', '/api/celcoin/pix/create', data);
    },
    onSuccess: (response) => {
      toast({
        title: "PIX Criado com Sucesso",
        description: "Pagamento PIX foi gerado. QR Code e chave PIX estão disponíveis.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/celcoin/account/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/celcoin/account/statement'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Criar PIX",
        description: error.message || "Falha ao gerar pagamento PIX",
        variant: "destructive",
      });
    }
  });

  // Create Boleto payment mutation
  const createBoletoPayment = useMutation({
    mutationFn: async (data: PaymentRequest) => {
      return await apiRequest('POST', '/api/celcoin/boleto/create', data);
    },
    onSuccess: (response) => {
      toast({
        title: "Boleto Criado com Sucesso",
        description: "Boleto bancário foi gerado. Linha digitável e PDF estão disponíveis.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/celcoin/account/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/celcoin/account/statement'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Criar Boleto",
        description: error.message || "Falha ao gerar boleto bancário",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
      case 'failed':
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, label: "Pago" },
      approved: { variant: "default" as const, label: "Aprovado" },
      succeeded: { variant: "default" as const, label: "Sucesso" },
      pending: { variant: "secondary" as const, label: "Pendente" },
      processing: { variant: "secondary" as const, label: "Processando" },
      cancelled: { variant: "destructive" as const, label: "Cancelado" },
      failed: { variant: "destructive" as const, label: "Falhou" },
      expired: { variant: "destructive" as const, label: "Expirado" }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || 
      { variant: "outline" as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Integração Celcoin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão completa de pagamentos e conta digital
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Conectado
          </span>
        </div>
      </div>

      {/* Account Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {balanceLoading ? "..." : formatCurrency(balance?.available || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para saque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bloqueado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {balanceLoading ? "..." : formatCurrency(balance?.blocked || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {balanceLoading ? "..." : formatCurrency(balance?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado há poucos minutos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estatísticas do Período
                </CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de Transações:</span>
                    <span className="font-semibold">
                      {statement?.transactions?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Volume Total:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        statement?.transactions?.reduce((acc, t) => acc + t.amount, 0) || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transações Aprovadas:</span>
                    <span className="font-semibold text-green-600">
                      {statement?.transactions?.filter(t => 
                        ['paid', 'approved', 'succeeded'].includes(t.status.toLowerCase())
                      ).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Últimas Transações
                </CardTitle>
                <CardDescription>Atividade recente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statement?.transactions?.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="text-sm font-medium">{transaction.type}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                  {(!statement?.transactions || statement.transactions.length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhuma transação encontrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIX Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Criar Pagamento PIX
                </CardTitle>
                <CardDescription>
                  Gerar QR Code e chave PIX para pagamento instantâneo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pix-amount">Valor (R$)</Label>
                    <Input
                      id="pix-amount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pix-order">ID do Pedido</Label>
                    <Input
                      id="pix-order"
                      placeholder="12345"
                      value={paymentData.orderId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, orderId: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customer-name">Nome do Cliente (Opcional)</Label>
                  <Input
                    id="customer-name"
                    placeholder="João Silva"
                    value={paymentData.customerData?.name || ""}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      customerData: { ...prev.customerData!, name: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="joao@email.com"
                      value={paymentData.customerData?.email || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: { ...prev.customerData!, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-cpf">CPF</Label>
                    <Input
                      id="customer-cpf"
                      placeholder="000.000.000-00"
                      value={paymentData.customerData?.cpf || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: { ...prev.customerData!, cpf: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => createPixPayment.mutate(paymentData)}
                  disabled={!paymentData.amount || !paymentData.orderId || createPixPayment.isPending}
                  className="w-full"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {createPixPayment.isPending ? "Gerando..." : "Gerar PIX"}
                </Button>
              </CardContent>
            </Card>

            {/* Boleto Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Criar Boleto Bancário
                </CardTitle>
                <CardDescription>
                  Gerar boleto bancário com vencimento em 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boleto-amount">Valor (R$)</Label>
                    <Input
                      id="boleto-amount"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boleto-order">ID do Pedido</Label>
                    <Input
                      id="boleto-order"
                      placeholder="12345"
                      value={paymentData.orderId}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, orderId: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="boleto-customer-name">Nome Completo *</Label>
                  <Input
                    id="boleto-customer-name"
                    placeholder="João Silva"
                    required
                    value={paymentData.customerData?.name || ""}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      customerData: { ...prev.customerData!, name: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boleto-customer-email">Email *</Label>
                    <Input
                      id="boleto-customer-email"
                      type="email"
                      placeholder="joao@email.com"
                      required
                      value={paymentData.customerData?.email || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: { ...prev.customerData!, email: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boleto-customer-cpf">CPF *</Label>
                    <Input
                      id="boleto-customer-cpf"
                      placeholder="000.000.000-00"
                      required
                      value={paymentData.customerData?.cpf || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: { ...prev.customerData!, cpf: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Endereço Completo *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      placeholder="Rua"
                      value={paymentData.customerData?.address?.street || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, street: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Número"
                      value={paymentData.customerData?.address?.number || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, number: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Bairro"
                      value={paymentData.customerData?.address?.neighborhood || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, neighborhood: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Cidade"
                      value={paymentData.customerData?.address?.city || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, city: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="Estado"
                      value={paymentData.customerData?.address?.state || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, state: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="CEP"
                      value={paymentData.customerData?.address?.postalCode || ""}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        customerData: {
                          ...prev.customerData!,
                          address: { ...prev.customerData!.address!, postalCode: e.target.value }
                        }
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => createBoletoPayment.mutate(paymentData)}
                  disabled={
                    !paymentData.amount || 
                    !paymentData.orderId || 
                    !paymentData.customerData?.name ||
                    !paymentData.customerData?.email ||
                    !paymentData.customerData?.cpf ||
                    !paymentData.customerData?.address?.street ||
                    createBoletoPayment.isPending
                  }
                  className="w-full"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {createBoletoPayment.isPending ? "Gerando..." : "Gerar Boleto"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                Extrato de Transações
              </CardTitle>
              <CardDescription>
                Histórico completo de transações da conta Celcoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statementLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {statement?.transactions?.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {transaction.correlationId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {formatCurrency(transaction.amount)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                  {(!statement?.transactions || statement.transactions.length === 0) && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma transação encontrada</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Solicitar Saque
              </CardTitle>
              <CardDescription>
                Transferir valores para conta bancária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Os saques são processados em até 1 dia útil. 
                    Certifique-se de que os dados bancários estão corretos.
                  </p>
                </div>
                
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Funcionalidade de saque será implementada em breve
                  </p>
                  <Button variant="outline" disabled>
                    Configurar Conta Bancária
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}