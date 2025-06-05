import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { removeAuthToken, getUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FinancialStats, Product, Order } from "@/types/api";
import EnhancedProductManagement from "@/pages/EnhancedProductManagement";
import ThemeManager from "@/components/storefront/ThemeManager";
import BannerManager from "@/components/storefront/BannerManager";
import UserManagement from "@/components/UserManagement";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import { 
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  ArrowDownToLine,
  Settings,
  Bell,
  TrendingUp,
  Clock,
  Box,
  Percent,
  DollarSign,
  CreditCard,
  Smartphone,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Palette,
  Image,
  Users,
  Ticket
} from "lucide-react";

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Valor é obrigatório"),
  bankAccountId: z.string().min(1, "Conta bancária é obrigatória"),
});

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório"),
  stock: z.string().min(0, "Estoque deve ser um número positivo"),
  category: z.string().min(1, "Categoria é obrigatória"),
  isActive: z.boolean().default(true),
});

type WithdrawalData = z.infer<typeof withdrawalSchema>;
type ProductData = z.infer<typeof productSchema>;

export default function MerchantDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showOrderEdit, setShowOrderEdit] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [banners, setBanners] = useState([
    {
      id: 1,
      title: "Grande Liquidação de Verão",
      description: "Até 70% de desconto em toda a coleção de verão. Ofertas limitadas!",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
      mobileImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
      linkUrl: "/promocoes",
      buttonText: "Ver Ofertas",
      isActive: true,
      position: 1,
      displayOrder: 1,
      impressions: 15420,
      clicks: 890,
      conversionRate: 5.8
    }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();

  const withdrawalForm = useForm<WithdrawalData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      bankAccountId: "1", // Default bank account
    },
  });

  const productForm = useForm<ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "0",
      category: "",
      isActive: true,
    },
  });

  // Queries
  const { data: financialStats, isLoading: statsLoading } = useQuery<FinancialStats>({
    queryKey: ["/api/tenant/financial-stats"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/tenant/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/tenant/orders"],
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/tenant/withdrawals"],
  });

  // Mutations
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalData) => {
      const response = await apiRequest("POST", "/api/tenant/withdrawals", {
        amount: data.amount,
        bankAccountId: parseInt(data.bankAccountId),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saque solicitado",
        description: "Seu saque foi solicitado e será processado em 1-2 dias úteis.",
      });
      withdrawalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/financial-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar saque",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("DELETE", `/api/tenant/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído",
        description: "Produto foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir produto",
        variant: "destructive",
      });
    },
  });

  const productMutation = useMutation({
    mutationFn: async (data: ProductData) => {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct ? `/api/tenant/products/${editingProduct.id}` : "/api/tenant/products";
      const response = await apiRequest(method, url, {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: editingProduct ? "Produto atualizado" : "Produto criado",
        description: editingProduct ? "Produto foi atualizado com sucesso." : "Produto foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/products"] });
      setShowProductForm(false);
      setEditingProduct(null);
      productForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar produto",
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: "outros", // Default category since it's not in the Product type
      isActive: product.isActive,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrder(orderId);
    setShowOrderDetails(true);
  };

  const handleEditOrder = (orderId: number) => {
    const order = orders?.find(o => o.id === orderId);
    if (order) {
      setEditingOrder(order);
      setShowOrderEdit(true);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = "/";
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      paid: { variant: "default" as const, label: "Pago" },
      shipped: { variant: "default" as const, label: "Enviado" },
      delivered: { variant: "default" as const, label: "Entregue" },
      cancelled: { variant: "destructive" as const, label: "Cancelado" },
      processing: { variant: "secondary" as const, label: "Processando" },
      completed: { variant: "default" as const, label: "Concluído" },
      failed: { variant: "destructive" as const, label: "Falhado" },
      active: { variant: "default" as const, label: "Ativa" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
    };

    return (
      <Badge variant={config.variant} className={
        config.variant === "default" && (status === "paid" || status === "completed" || status === "active") 
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
          : ""
      }>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "pix":
        return <Smartphone className="h-4 w-4" />;
      case "credit_card":
        return <CreditCard className="h-4 w-4" />;
      case "boleto":
        return <FileText className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const calculateMaxWithdrawal = () => {
    if (!financialStats) return 0;
    const availableBalance = parseFloat(financialStats.availableBalance);
    const dailyWithdrawals = parseFloat(financialStats.dailyWithdrawals);
    const dailyLimit = 10000; // R$ 10,000 daily limit
    const remainingDaily = dailyLimit - dailyWithdrawals;
    return Math.min(availableBalance, remainingDaily);
  };

  const setMaxWithdrawal = () => {
    const maxAmount = calculateMaxWithdrawal();
    withdrawalForm.setValue("amount", maxAmount.toFixed(2));
  };

  // Recent orders for overview
  const recentOrders = orders?.slice(0, 5) || [];

  // Recent withdrawals
  const recentWithdrawals = withdrawals?.slice(0, 3) || [];

  // Mock stats calculations
  const todaySales = financialStats ? (parseFloat(financialStats.grossSales) * 0.03).toFixed(2) : "0";
  const pendingOrdersCount = orders?.filter(order => order.status === "pending").length || 0;
  const activeProductsCount = products?.filter(product => product.isActive).length || 0;
  const conversionRate = "3.2"; // Mock conversion rate

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card shadow-lg border-r border-border">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary">{user?.fullName?.split(' ')[0] || 'Loja'}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email?.split('@')[0]}.wikistore.com
            </p>
          </div>
          <nav className="mt-6">
            <div className="px-6 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "overview" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("overview")}
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Visão Geral
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "products" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("products")}
              >
                <Package className="mr-3 h-4 w-4" />
                Produtos
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "orders" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("orders")}
              >
                <ShoppingCart className="mr-3 h-4 w-4" />
                Pedidos
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "financial" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("financial")}
              >
                <Wallet className="mr-3 h-4 w-4" />
                Financeiro
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "withdrawals" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("withdrawals")}
              >
                <ArrowDownToLine className="mr-3 h-4 w-4" />
                Saques
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "themes" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("themes")}
              >
                <Palette className="mr-3 h-4 w-4" />
                Temas da Loja
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "banners" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("banners")}
              >
                <Image className="mr-3 h-4 w-4" />
                Banners
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "users" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("users")}
              >
                <Users className="mr-3 h-4 w-4" />
                Usuários
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "support" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("support")}
              >
                <Ticket className="mr-3 h-4 w-4" />
                Suporte
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "settings" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("settings")}
              >
                <Settings className="mr-3 h-4 w-4" />
                Configurações
              </Button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <header className="bg-card shadow-sm border-b border-border">
            <div className="px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                {activeSection === "overview" && "Visão Geral"}
                {activeSection === "products" && "Produtos"}
                {activeSection === "orders" && "Pedidos"}
                {activeSection === "financial" && "Financeiro"}
                {activeSection === "withdrawals" && "Saques"}
                {activeSection === "themes" && "Temas da Loja"}
                {activeSection === "banners" && "Banners"}
                {activeSection === "settings" && "Configurações"}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Saldo disponível:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(financialStats?.availableBalance || "0")}
                  </span>
                </div>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">
                      {user?.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-foreground font-medium">
                    {user?.fullName?.split(' ')[0] || "Usuário"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Sections */}
          <div className="p-6">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(todaySales)}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="text-green-600 h-6 w-6" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="text-green-600 mr-1 h-3 w-3" />
                        <span className="text-green-600">+23.1%</span>
                        <span className="text-muted-foreground ml-1">vs ontem</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
                          <p className="text-2xl font-bold text-foreground">{pendingOrdersCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                          <Clock className="text-amber-600 h-6 w-6" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className="text-amber-600">Requer atenção</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                          <p className="text-2xl font-bold text-foreground">{activeProductsCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Box className="text-blue-600 h-6 w-6" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className="text-muted-foreground">
                          {products?.filter(p => p.stock === 0).length || 0} sem estoque
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                          <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Percent className="text-purple-600 h-6 w-6" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="text-green-600 mr-1 h-3 w-3" />
                        <span className="text-green-600">+0.8%</span>
                        <span className="text-muted-foreground ml-1">vs mês anterior</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Carregando pedidos...</div>
                    ) : recentOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium text-primary">#{order.id}</TableCell>
                              <TableCell>{order.customerName}</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell>{formatCurrency(order.total)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getPaymentMethodIcon(order.paymentMethod)}
                                  <span className="capitalize">{order.paymentMethod}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(order.createdAt.toString())}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financial Section */}
            {activeSection === "financial" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Available Balance */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">Saldo Disponível</h3>
                    <p className="text-3xl font-bold">
                      {formatCurrency(financialStats?.availableBalance || "0")}
                    </p>
                    <p className="text-green-100 text-sm mt-2">Atualizado agora</p>
                  </div>

                  {/* Pending Balance */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Saldo Pendente</h3>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(financialStats?.pendingBalance || "0")}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">Disponível em 1-2 dias</p>
                    </CardContent>
                  </Card>

                  {/* Monthly Withdrawals */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Total Sacado (Mês)</h3>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(financialStats?.monthlyWithdrawals || "0")}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2">Limite: R$ 300.000</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro - Últimos 30 dias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-foreground mb-4">Receitas</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendas Brutas</span>
                            <span className="font-semibold">
                              {formatCurrency(financialStats?.grossSales || "0")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa da Plataforma (2%)</span>
                            <span className="font-semibold text-red-600">
                              - {formatCurrency((parseFloat(financialStats?.grossSales || "0") * 0.02).toFixed(2))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa Celcoin</span>
                            <span className="font-semibold text-red-600">
                              - {formatCurrency((parseFloat(financialStats?.grossSales || "0") * 0.005).toFixed(2))}
                            </span>
                          </div>
                          <hr className="border-border" />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Receita Líquida</span>
                            <span className="text-green-600">
                              {formatCurrency(financialStats?.netRevenue || "0")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-foreground mb-4">Métodos de Pagamento</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PIX (67%)</span>
                            <span className="font-semibold">
                              {formatCurrency((parseFloat(financialStats?.grossSales || "0") * 0.67).toFixed(2))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cartão de Crédito (28%)</span>
                            <span className="font-semibold">
                              {formatCurrency((parseFloat(financialStats?.grossSales || "0") * 0.28).toFixed(2))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Boleto (5%)</span>
                            <span className="font-semibold">
                              {formatCurrency((parseFloat(financialStats?.grossSales || "0") * 0.05).toFixed(2))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Withdrawals Section */}
            {activeSection === "withdrawals" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Quick Withdrawal */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Solicitar Saque</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...withdrawalForm}>
                        <form onSubmit={withdrawalForm.handleSubmit((data) => withdrawalMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={withdrawalForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor a Sacar</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      placeholder="0,00" 
                                      {...field}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^\d.,]/g, '');
                                        field.onChange(value);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm"
                                      onClick={setMaxWithdrawal}
                                    >
                                      Máximo
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Conta de destino:</span>
                              <span className="font-medium">Itaú - Ag: 1234 - CC: 12345-6</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Taxa:</span>
                              <span className="font-medium">R$ 2,50</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Valor líquido:</span>
                              <span className="font-semibold text-green-600">
                                {withdrawalForm.watch("amount") 
                                  ? formatCurrency((parseFloat(withdrawalForm.watch("amount")) - 2.5).toFixed(2))
                                  : "R$ 0,00"
                                }
                              </span>
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={withdrawalMutation.isPending}
                          >
                            {withdrawalMutation.isPending ? "Processando..." : "Solicitar Saque"}
                          </Button>
                        </form>
                      </Form>

                      <div className="mt-4 text-xs text-muted-foreground space-y-1">
                        <p>• Limite diário: R$ 10.000,00</p>
                        <p>• Processamento: 1-2 dias úteis</p>
                        <p>• Sacado hoje: {formatCurrency(financialStats?.dailyWithdrawals || "0")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Withdrawals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Saques Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {withdrawalsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Carregando saques...</div>
                      ) : recentWithdrawals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nenhum saque encontrado</div>
                      ) : (
                        <div className="space-y-3">
                          {recentWithdrawals.map((withdrawal) => (
                            <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(withdrawal.amount)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(withdrawal.createdAt.toString())}
                                </p>
                              </div>
                              {getStatusBadge(withdrawal.status)}
                            </div>
                          ))}
                        </div>
                      )}
                      <Button variant="ghost" className="w-full mt-4 text-primary">
                        Ver histórico completo
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Withdrawal History Table */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Histórico de Saques</CardTitle>
                      <div className="flex space-x-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="failed">Falhado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="date" className="w-40" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {withdrawalsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
                    ) : !withdrawals || withdrawals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Nenhum saque encontrado</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Valor Bruto</TableHead>
                            <TableHead>Taxa</TableHead>
                            <TableHead>Valor Líquido</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ID Transação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                              <TableCell>{formatDateTime(withdrawal.createdAt.toString())}</TableCell>
                              <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                              <TableCell>{formatCurrency(withdrawal.fee)}</TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(withdrawal.netAmount)}
                              </TableCell>
                              <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {withdrawal.celcoinTransactionId || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Enhanced Products Section */}
            {activeSection === "products" && (
              <EnhancedProductManagement />
            )}

            {/* Orders Section */}
            {activeSection === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando pedidos...</div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p>Nenhum pedido encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium text-primary">#{order.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.customerName}</div>
                                <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell>{formatCurrency(order.total)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getPaymentMethodIcon(order.paymentMethod)}
                                <span className="capitalize">{order.paymentMethod}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(order.createdAt.toString())}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order.id)}>Ver</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order.id)}>Editar</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Theme Management Section */}
            {activeSection === "themes" && (
              <ThemeManager 
                currentTheme={currentTheme}
                onThemeChange={setCurrentTheme}
              />
            )}

            {/* Banner Management Section */}
            {activeSection === "banners" && (
              <BannerManager 
                banners={banners}
                onUpdateBanners={setBanners}
              />
            )}

            {/* User Management Section */}
            {activeSection === "users" && (
              <UserManagement />
            )}

            {/* Support Ticket Section */}
            {activeSection === "support" && (
              <SupportTicketSystem />
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações da Loja</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p>Configurações em desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit((data) => productMutation.mutate(data))} className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={productForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                        <SelectItem value="roupas">Roupas</SelectItem>
                        <SelectItem value="casa">Casa e Jardim</SelectItem>
                        <SelectItem value="esportes">Esportes</SelectItem>
                        <SelectItem value="livros">Livros</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    productForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={productMutation.isPending}
                >
                  {productMutation.isPending 
                    ? "Salvando..." 
                    : editingProduct 
                      ? "Atualizar" 
                      : "Criar"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
