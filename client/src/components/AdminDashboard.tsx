import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Users, 
  Settings, 
  BarChart3, 
  DollarSign, 
  Package, 
  Shield,
  Plug,
  FileText,
  AlertTriangle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  RefreshCw,
  Building2,
  CreditCard,
  Globe,
  Mail,
  Phone,
  Calendar,
  Activity,
  Database,
  Zap,
  Monitor,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: string;
  monthlyRevenue: string;
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  platformFee: string;
}

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  category: string;
  monthlyRevenue: string;
  totalOrders: number;
  createdAt: string;
  contactPerson: string;
  email: string;
  phone: string;
  cnpj?: string;
}

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  tenantId: number;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface SystemMetric {
  name: string;
  value: string;
  change: string;
  status: 'up' | 'down' | 'stable';
}

interface Plugin {
  id: number;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  installations: number;
  category: string;
  developer: string;
  price: string;
}

const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['/api/admin/tenants'],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
  });

  const { data: plugins } = useQuery({
    queryKey: ['/api/admin/plugins'],
  });

  const { data: reports } = useQuery({
    queryKey: ['/api/admin/reports'],
  });

  // Mutations
  const createTenantMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setIsCreateTenantOpen(false);
      toast({ title: "Loja criada com sucesso!" });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/admin/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      setIsEditTenantOpen(false);
      toast({ title: "Loja atualizada com sucesso!" });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Loja removida com sucesso!" });
    },
  });

  const togglePluginMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest('PUT', `/api/admin/plugins/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plugins'] });
      toast({ title: "Plugin atualizado com sucesso!" });
    },
  });

  // Data processing
  const adminStats: AdminStats = stats || {
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: '0.00',
    monthlyRevenue: '0.00',
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    platformFee: '0.00'
  };

  const filteredTenants = (tenants || []).filter((tenant: Tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const revenueChartData = reports?.revenueData || [];
  const tenantGrowthData = reports?.tenantGrowthData || [];
  const categoryDistribution = reports?.categoryDistribution || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Painel Administrativo WikiStore
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestão completa da plataforma de e-commerce
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Lojas
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="plugins" className="flex items-center gap-2">
              <Plug className="w-4 h-4" />
              Plugins
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalTenants}</div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats.activeTenants} ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(adminStats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(adminStats.monthlyRevenue)} este mês
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    de {adminStats.totalUsers} totais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa da Plataforma</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(adminStats.platformFee)}</div>
                  <p className="text-xs text-muted-foreground">
                    {adminStats.totalOrders} pedidos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), 'Receita']} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(systemMetrics || []).map((metric: SystemMetric, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        metric.status === 'up' ? 'text-green-600' :
                        metric.status === 'down' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {metric.status === 'up' && <TrendingUp className="w-4 h-4" />}
                        {metric.status === 'down' && <AlertTriangle className="w-4 h-4" />}
                        {metric.status === 'stable' && <Activity className="w-4 h-4" />}
                        <span className="text-sm">{metric.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar lojas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateTenantOpen} onOpenChange={setIsCreateTenantOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Loja
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Loja</DialogTitle>
                  </DialogHeader>
                  <TenantForm 
                    onSubmit={(data) => createTenantMutation.mutate(data)}
                    isLoading={createTenantMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Loja</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Categoria</th>
                        <th className="p-4 font-medium">Receita Mensal</th>
                        <th className="p-4 font-medium">Pedidos</th>
                        <th className="p-4 font-medium">Criado em</th>
                        <th className="p-4 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((tenant: Tenant) => (
                        <tr key={tenant.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {tenant.subdomain}.wikistore.com
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              tenant.status === 'active' ? 'default' :
                              tenant.status === 'inactive' ? 'secondary' : 'destructive'
                            }>
                              {tenant.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="capitalize">{tenant.category}</span>
                          </td>
                          <td className="p-4 font-medium">
                            {formatCurrency(tenant.monthlyRevenue)}
                          </td>
                          <td className="p-4">{tenant.totalOrders}</td>
                          <td className="p-4">{formatDate(tenant.createdAt)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setIsEditTenantOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://${tenant.subdomain}.wikistore.com`, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja remover esta loja?')) {
                                    deleteTenantMutation.mutate(tenant.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Edit Tenant Dialog */}
            <Dialog open={isEditTenantOpen} onOpenChange={setIsEditTenantOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Loja</DialogTitle>
                </DialogHeader>
                {selectedTenant && (
                  <TenantForm 
                    tenant={selectedTenant}
                    onSubmit={(data) => updateTenantMutation.mutate({ id: selectedTenant.id, data })}
                    isLoading={updateTenantMutation.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Usuário</th>
                        <th className="p-4 font-medium">Função</th>
                        <th className="p-4 font-medium">Loja</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Último Login</th>
                        <th className="p-4 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(users || []).map((user: User) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {user.tenantId ? `Loja ${user.tenantId}` : 'Sistema'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {user.isActive ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </div>
                          </td>
                          <td className="p-4">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Shield className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plugins Tab */}
          <TabsContent value="plugins" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Marketplace de Plugins</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Plugin
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(plugins || []).map((plugin: Plugin) => (
                <Card key={plugin.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plugin.name}</CardTitle>
                      <Switch
                        checked={plugin.isActive}
                        onCheckedChange={(checked) => 
                          togglePluginMutation.mutate({ id: plugin.id, isActive: checked })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {plugin.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Versão:</span>
                        <span>{plugin.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Instalações:</span>
                        <span>{plugin.installations}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Categoria:</span>
                        <Badge variant="outline">{plugin.category}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Preço:</span>
                        <span className="font-medium">{plugin.price}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Por {plugin.developer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Relatórios Administrativos</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Lojas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={tenantGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Banco de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Conexões:</span>
                      <span>45/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tamanho:</span>
                      <span>2.4 GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span>23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memória:</span>
                      <span>67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span>99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Rede
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Requisições/min:</span>
                      <span>1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latência média:</span>
                      <span>45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Erros 5xx:</span>
                      <span>0.01%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Logs do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <div>[2024-06-05 15:30:01] INFO - Sistema iniciado com sucesso</div>
                  <div>[2024-06-05 15:30:15] INFO - Conexão com banco de dados estabelecida</div>
                  <div>[2024-06-05 15:31:22] WARN - Alta utilização de CPU detectada</div>
                  <div>[2024-06-05 15:32:45] INFO - Backup automático concluído</div>
                  <div>[2024-06-05 15:33:12] INFO - Plugin 'Payment Gateway' atualizado</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Plataforma</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Permitir registro de novas lojas</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Modo de manutenção</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Backup automático</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificações por email</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxas e Comissões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Taxa da plataforma (%)</Label>
                    <Input type="number" defaultValue="2.5" step="0.1" />
                  </div>
                  <div>
                    <Label>Taxa de processamento (%)</Label>
                    <Input type="number" defaultValue="3.2" step="0.1" />
                  </div>
                  <div>
                    <Label>Taxa fixa por transação (R$)</Label>
                    <Input type="number" defaultValue="0.39" step="0.01" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Servidor SMTP</Label>
                    <Input placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <Label>Porta</Label>
                    <Input type="number" defaultValue="587" />
                  </div>
                  <div>
                    <Label>Email remetente</Label>
                    <Input placeholder="noreply@wikistore.com" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integrações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Mercado Livre</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Shopee</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Amazon</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Google Shopping</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button>Salvar Configurações</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Tenant Form Component
function TenantForm({ tenant, onSubmit, isLoading }: { 
  tenant?: Tenant; 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    subdomain: tenant?.subdomain || '',
    category: tenant?.category || '',
    contactPerson: tenant?.contactPerson || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    cnpj: tenant?.cnpj || '',
    status: tenant?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nome da Loja</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Subdomínio</Label>
          <Input
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Varejo</SelectItem>
              <SelectItem value="fashion">Moda</SelectItem>
              <SelectItem value="electronics">Eletrônicos</SelectItem>
              <SelectItem value="home">Casa e Jardim</SelectItem>
              <SelectItem value="sports">Esportes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Pessoa de Contato</Label>
          <Input
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>CNPJ</Label>
          <Input
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}