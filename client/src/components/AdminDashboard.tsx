import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminHeader from "./AdminHeader";
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
  ArrowUpRight,
  Info
} from "lucide-react";

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Fetch admin data
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
      toast({
        title: "Sucesso",
        description: "Loja criada com sucesso!"
      });
      setIsCreateTenantOpen(false);
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/admin/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Sucesso",
        description: "Loja atualizada com sucesso!"
      });
      setIsEditTenantOpen(false);
    }
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Sucesso",
        description: "Loja removida com sucesso!"
      });
    }
  });

  // Process data safely
  const adminStats: AdminStats = (stats as AdminStats) || {
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: '0.00',
    monthlyRevenue: '0.00',
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    platformFee: '0.00'
  };

  const filteredTenants = (tenants as Tenant[] || []).filter((tenant: Tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        currentUser={currentUser}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />
      
      <main className="container mx-auto p-6">
        <div className="space-y-6">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
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
                    {(systemMetrics as SystemMetric[] || []).map((metric: SystemMetric, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === "tenants" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                          <th className="p-4 font-medium">Categoria</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Receita Mensal</th>
                          <th className="p-4 font-medium">Pedidos</th>
                          <th className="p-4 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map((tenant: Tenant) => (
                          <tr key={tenant.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{tenant.name}</div>
                                <div className="text-sm text-muted-foreground">{tenant.subdomain}.wikistore.com</div>
                              </div>
                            </td>
                            <td className="p-4">{tenant.category}</td>
                            <td className="p-4">
                              <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                                {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </td>
                            <td className="p-4">{formatCurrency(tenant.monthlyRevenue)}</td>
                            <td className="p-4">{tenant.totalOrders}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Dialog open={isEditTenantOpen && selectedTenant?.id === tenant.id} 
                                       onOpenChange={(open) => {
                                         setIsEditTenantOpen(open);
                                         if (open) setSelectedTenant(tenant);
                                       }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
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
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteTenantMutation.mutate(tenant.id)}
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
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
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
                          <th className="p-4 font-medium">Role</th>
                          <th className="p-4 font-medium">Loja</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Último Login</th>
                          <th className="p-4 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(users as User[] || []).map((user: User) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{user.fullName || user.email}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{user.role}</Badge>
                            </td>
                            <td className="p-4">{user.tenantId}</td>
                            <td className="p-4">
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
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
            </div>
          )}

          {/* Plugins Tab */}
          {activeTab === "plugins" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace de Plugins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(plugins as Plugin[] || []).map((plugin: Plugin) => (
                      <Card key={plugin.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{plugin.name}</CardTitle>
                            <Badge variant={plugin.isActive ? 'default' : 'secondary'}>
                              {plugin.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span>v{plugin.version}</span>
                            <span>{plugin.installations} instalações</span>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <span className="font-medium">{plugin.price}</span>
                            <Button size="sm">
                              {plugin.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios e Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Relatórios detalhados e analytics da plataforma serão implementados aqui.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Métricas detalhadas do sistema, logs e monitoramento em tempo real.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações da Plataforma</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Taxa da Plataforma (%)</Label>
                        <Input type="number" placeholder="5.0" />
                      </div>
                      <div>
                        <Label>Moeda Padrão</Label>
                        <Select defaultValue="BRL">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">Real (BRL)</SelectItem>
                            <SelectItem value="USD">Dólar (USD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Manutenção da Plataforma</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar modo de manutenção para todas as lojas
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>Salvar Configurações</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
        </div>
      </main>
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
          <Label htmlFor="name">Nome da Loja</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="subdomain">Subdomínio</Label>
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eletronicos">Eletrônicos</SelectItem>
              <SelectItem value="roupas">Roupas e Acessórios</SelectItem>
              <SelectItem value="casa">Casa e Jardim</SelectItem>
              <SelectItem value="esportes">Esportes</SelectItem>
              <SelectItem value="livros">Livros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contactPerson">Pessoa de Contato</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (tenant ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
}