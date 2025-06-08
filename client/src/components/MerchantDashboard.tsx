import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { removeAuthToken, getUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FinancialStats, Product, Order } from "@/types/api";

// Add withdrawal type definition
interface Withdrawal {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  bankAccountId: number;
}
import EnhancedProductManagement from "@/pages/EnhancedProductManagement";
import ThemeManager from "@/components/storefront/ThemeManager";
import BannerManager from "@/components/storefront/BannerManager";
import UserManagement from "@/components/UserManagement";
import SupportTicketSystem from "@/components/SupportTicketSystem";
import StoreSettings from "@/components/StoreSettings";
import ReportsManagement from "@/components/ReportsManagement";
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
  Ticket,
  Printer,
  Truck,
  FileCheck,
  Mail,
  RefreshCw,
  Save,
  UserCheck,
  BarChart3,
  Shield
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

  const { data: paymentPermissions } = useQuery({
    queryKey: ["/api/payment-permissions"],
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

  // Create mutation for updating orders
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/tenant/orders/${orderId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pedido atualizado",
        description: "As informações do pedido foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/orders"] });
      setShowOrderEdit(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pedido",
        variant: "destructive",
      });
    },
  });

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

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
      confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
      processing: { label: "Processando", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" },
      shipped: { label: "Enviado", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400" },
      delivered: { label: "Entregue", className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.className}>
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
                className={`w-full justify-start ${activeSection === "reports" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("reports")}
              >
                <BarChart3 className="mr-3 h-4 w-4" />
                Relatórios
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
                className={`w-full justify-start ${activeSection === "identity-verification" ? "bg-accent" : ""}`}
                onClick={() => window.location.href = "/identity-verification"}
              >
                <Shield className={`mr-3 h-4 w-4 ${
                  paymentPermissions?.identityVerificationStatus === 'verified' 
                    ? 'text-green-600' 
                    : paymentPermissions?.requiresVerification 
                    ? 'text-red-500' 
                    : 'text-yellow-500'
                }`} />
                <span className="flex-1 text-left">Verificação de Identidade</span>
                {paymentPermissions?.identityVerificationStatus === 'verified' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {paymentPermissions?.requiresVerification && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
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
                {activeSection === "reports" && "Relatórios"}
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
                            disabled={withdrawalMutation.isPending || !paymentPermissions?.canRequestWithdrawals}
                          >
                            {withdrawalMutation.isPending ? "Processando..." : "Solicitar Saque"}
                          </Button>
                          {!paymentPermissions?.canRequestWithdrawals && (
                            <Alert className="mt-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Complete a verificação de identidade para habilitar saques.{" "}
                                <a href="/identity-verification" className="text-primary underline">
                                  Verificar agora
                                </a>
                              </AlertDescription>
                            </Alert>
                          )}
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

            {/* Reports Management Section */}
            {activeSection === "reports" && (
              <ReportsManagement />
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
              <StoreSettings />
            )}
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Pedido #{selectedOrder}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Pedido
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Fatura
                </Button>
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-2" />
                  Lista Entrega
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && orders && (
            <div className="space-y-6">
              {(() => {
                const order = orders.find(o => o.id === selectedOrder);
                if (!order) return <p>Pedido não encontrado</p>;
                
                // Parse real order items from the order.items JSON field
                const orderItems = order.items ? JSON.parse(order.items) : [];

                return (
                  <div className="space-y-6">
                    {/* Header Information */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Status do Pedido</Label>
                        <div className="mt-1">
                          {getOrderStatusBadge(order.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data do Pedido</Label>
                        <p className="font-medium">{formatDate(order.createdAt.toString())}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Valor Total</Label>
                        <p className="font-medium text-lg text-green-600">{formatCurrency(order.total || "0")}</p>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="grid grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Informações do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-sm">Nome</Label>
                            <p>{order.customerName || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Email</Label>
                            <p>{order.customerEmail || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Telefone</Label>
                            <p>{order.customerPhone || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Documento</Label>
                            <p>{order.customerDocument || "N/A"}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Pagamento e Entrega</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-sm">Método de Pagamento</Label>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(order.paymentMethod || "")}
                              <span className="capitalize">{order.paymentMethod || "N/A"}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Status do Pagamento</Label>
                            <p>{order.paymentStatus || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Código de Rastreamento</Label>
                            <p>{order.trackingCode || "Não informado"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Shipping Addresses */}
                    <div className="grid grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Endereço de Entrega</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <p>{order.customerAddress || "Endereço não informado"}</p>
                            <p>{order.customerCity || ""} - {order.customerState || ""}</p>
                            <p>CEP: {order.customerZipCode || "N/A"}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Endereço de Cobrança</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-sm">
                            <p>Mesmo endereço de entrega</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Order Items */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Produtos do Pedido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                              </div>
                              <div className="text-center min-w-[80px]">
                                <p className="font-medium">Qtd: {item.quantity}</p>
                              </div>
                              <div className="text-center min-w-[100px]">
                                <p className="text-sm text-muted-foreground">Unit: {formatCurrency(item.price)}</p>
                                <p className="font-medium">{formatCurrency(item.total)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Subtotal:</span>
                            <span>{formatCurrency(175.00)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Frete:</span>
                            <span>{formatCurrency(15.00)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Impostos:</span>
                            <span>{formatCurrency(order.taxTotal || "0")}</span>
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span className="text-green-600">{formatCurrency(order.total || "0")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* NFe and Tax Information */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Nota Fiscal Eletrônica</span>
                          <Button variant="outline" size="sm">
                            <FileCheck className="h-4 w-4 mr-2" />
                            Emitir NFe
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Chave NFe</Label>
                            <p className="font-mono text-sm">{order.nfeKey || "Não emitida"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Número NFe</Label>
                            <p>{order.nfeNumber || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Status NFe</Label>
                            <p>{order.nfeStatus || "Pendente"}</p>
                          </div>
                          <div>
                            <Label className="text-sm">Protocolo</Label>
                            <p>{order.nfeProtocol || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order History */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Histórico do Pedido</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { status: "Pedido criado", date: order.createdAt.toString(), user: "Sistema" },
                            { status: "Pagamento confirmado", date: order.createdAt.toString(), user: "Gateway" },
                            { status: "Em separação", date: order.createdAt.toString(), user: "João Silva" }
                          ].map((event, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 border-l-2 border-cyan-200 bg-muted/30">
                              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-medium">{event.status}</p>
                                <p className="text-sm text-muted-foreground">{formatDateTime(event.date)} - {event.user}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    {order.notes && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Observações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{order.notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" className="flex-1">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Comissionar Afiliado
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email Cliente
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reprocessar Pedido
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Edit Dialog */}
      <Dialog open={showOrderEdit} onOpenChange={setShowOrderEdit}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Editar Pedido #{editingOrder?.id}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline" size="sm">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Emitir NFe
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-6">
              {/* Order Status and Tracking */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status e Rastreamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status do Pedido</Label>
                      <Select defaultValue={editingOrder.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="processing">Processando</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                      <Select defaultValue={editingOrder.paymentStatus || "pending"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="failed">Falhou</SelectItem>
                          <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trackingCode">Código de Rastreamento</Label>
                      <Input
                        id="trackingCode"
                        defaultValue={editingOrder.trackingCode || ""}
                        placeholder="Digite o código de rastreamento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carrier">Transportadora</Label>
                      <Select defaultValue="">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a transportadora" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="correios">Correios</SelectItem>
                          <SelectItem value="jadlog">JadLog</SelectItem>
                          <SelectItem value="total">Total Express</SelectItem>
                          <SelectItem value="loggi">Loggi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information Edit */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nome do Cliente</Label>
                      <Input
                        id="customerName"
                        defaultValue={editingOrder.customerName || ""}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        defaultValue={editingOrder.customerEmail || ""}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerPhone">Telefone</Label>
                      <Input
                        id="customerPhone"
                        defaultValue={editingOrder.customerPhone || ""}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerDocument">Documento</Label>
                      <Input
                        id="customerDocument"
                        defaultValue={editingOrder.customerDocument || ""}
                        placeholder="CPF/CNPJ"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address Edit */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Endereço de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerAddress">Endereço Completo</Label>
                    <Input
                      id="customerAddress"
                      defaultValue={editingOrder.customerAddress || ""}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customerCity">Cidade</Label>
                      <Input
                        id="customerCity"
                        defaultValue={editingOrder.customerCity || ""}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerState">Estado</Label>
                      <Input
                        id="customerState"
                        defaultValue={editingOrder.customerState || ""}
                        placeholder="UF"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerZipCode">CEP</Label>
                      <Input
                        id="customerZipCode"
                        defaultValue={editingOrder.customerZipCode || ""}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Values */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Valores do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="subtotal">Subtotal</Label>
                      <Input
                        id="subtotal"
                        defaultValue={formatCurrency(175.00)}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingCost">Frete</Label>
                      <Input
                        id="shippingCost"
                        defaultValue="15.00"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount">Desconto</Label>
                      <Input
                        id="discount"
                        defaultValue="0.00"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxTotal">Total de Impostos</Label>
                      <Input
                        id="taxTotal"
                        defaultValue={editingOrder.taxTotal || "0.00"}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total">Valor Total</Label>
                      <Input
                        id="total"
                        defaultValue={editingOrder.total || "0"}
                        className="font-bold text-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NFe Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações da NFe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nfeNumber">Número da NFe</Label>
                      <Input
                        id="nfeNumber"
                        defaultValue={editingOrder.nfeNumber || ""}
                        placeholder="Número da nota fiscal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nfeKey">Chave da NFe</Label>
                      <Input
                        id="nfeKey"
                        defaultValue={editingOrder.nfeKey || ""}
                        placeholder="Chave de acesso de 44 dígitos"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nfeStatus">Status da NFe</Label>
                      <Select defaultValue={editingOrder.nfeStatus || "pending"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="authorized">Autorizada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                          <SelectItem value="denied">Rejeitada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nfeProtocol">Protocolo</Label>
                      <Input
                        id="nfeProtocol"
                        defaultValue={editingOrder.nfeProtocol || ""}
                        placeholder="Protocolo de autorização"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affiliate Commission */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Comissão de Afiliado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="affiliateCode">Código do Afiliado</Label>
                      <Input
                        id="affiliateCode"
                        defaultValue=""
                        placeholder="Código ou ID do afiliado"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
                      <Input
                        id="commissionRate"
                        defaultValue="5.0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commissionValue">Valor da Comissão</Label>
                      <Input
                        id="commissionValue"
                        defaultValue="0.00"
                        placeholder="0.00"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="commissionPaid"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="commissionPaid">Comissão já foi paga</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Observações Internas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      defaultValue={editingOrder.notes || ""}
                      placeholder="Adicione observações sobre o pedido..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Notificar Cliente
                  </Button>
                  <Button variant="outline">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Processar Comissão
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowOrderEdit(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Pedido atualizado",
                        description: "As informações do pedido foram atualizadas com sucesso.",
                      });
                      setShowOrderEdit(false);
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
