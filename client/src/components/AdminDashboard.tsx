import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminHeader from "./AdminHeader";
import AdminSupportCenter from "@/pages/AdminSupportCenter";
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
  RotateCcw,
  Wallet,
  Repeat,
  Receipt,
  Smartphone,
  Target,
  XCircle,
  FileBarChart,
  Bell,
  Save,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  Info,
  Puzzle,
  MoreHorizontal,
  MoreVertical,
  Code,
  User,
  PlayCircle,
  PauseCircle,
  Calculator,
  Link,
  Wrench,
  Key,
  History,
  ShieldCheck,
  Camera
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
  document?: string;
  documentType?: string;
  phone?: string;
  role: string;
  tenantId?: number;
  profileImage?: string;
  isActive: boolean;
  permissions?: string[];
  lastLoginAt?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
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

interface UserEditFormProps {
  user: User;
  onClose: () => void;
}

interface CreateUserFormProps {
  onClose: () => void;
}

interface NotificationFormProps {
  onClose: () => void;
  tenants: any[];
}

// Plugin Form Component
function PluginFormComponent({ onClose, plugin }: { onClose: () => void; plugin?: any }) {
  const [formData, setFormData] = useState({
    name: plugin?.displayName || plugin?.name || '',
    description: plugin?.description || '',
    version: plugin?.version || '1.0.0',
    category: plugin?.category || 'pagamento',
    price: plugin?.price || plugin?.monthlyPrice || 'Gratuito',
    monthlyPrice: plugin?.monthlyPrice || '',
    yearlyPrice: plugin?.yearlyPrice || '',
    developer: plugin?.developer || 'WikiStore Team',
    icon: plugin?.icon || 'package',
    slug: plugin?.slug || '',
    isActive: plugin?.isActive || false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = plugin ? `/api/admin/plugins/${plugin.id}` : '/api/admin/plugins';
      const method = plugin ? 'PATCH' : 'POST';
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      toast({
        title: plugin ? "Plugin atualizado" : "Plugin criado",
        description: plugin ? "Plugin foi atualizado com sucesso." : "Plugin foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Erro",
        description: "Nome e descrição são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Plugin *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do plugin"
          />
        </div>
        <div>
          <Label htmlFor="version">Versão</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do plugin..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nfe">NF-e / Fiscal</SelectItem>
              <SelectItem value="pagamento">Pagamento</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="social">Social / Marketing</SelectItem>
              <SelectItem value="inventory">Estoque</SelectItem>
              <SelectItem value="loyalty">Fidelidade</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="import">Importação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="slug-do-plugin"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Preço Único</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="29.90"
          />
        </div>
        <div>
          <Label htmlFor="monthlyPrice">Preço Mensal</Label>
          <Input
            id="monthlyPrice"
            value={formData.monthlyPrice}
            onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
            placeholder="29.90"
          />
        </div>
        <div>
          <Label htmlFor="yearlyPrice">Preço Anual</Label>
          <Input
            id="yearlyPrice"
            value={formData.yearlyPrice}
            onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
            placeholder="299.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="icon">Ícone</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="file-text"
          />
        </div>
        <div>
          <Label htmlFor="developer">Desenvolvedor</Label>
          <Input
            id="developer"
            value={formData.developer}
            onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
            placeholder="Nome do desenvolvedor"
          />
        </div>
      </div>



      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label>Plugin ativo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : (plugin ? "Atualizar" : "Criar")}
        </Button>
      </div>
    </div>
  );
}

// Plugin Details Component
function PluginDetailsView({ plugin }: { plugin: any }) {
  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'nfe': 'NF-e / Fiscal',
      'pagamento': 'Pagamento',
      'marketplace': 'Marketplace',
      'social': 'Social / Marketing',
      'inventory': 'Estoque',
      'loyalty': 'Fidelidade',
      'email': 'Email',
      'analytics': 'Analytics',
      'import': 'Importação'
    };
    return categories[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Informações Básicas</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Nome:</span>
              <p className="font-medium">{plugin.displayName || plugin.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Slug:</span>
              <p className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">{plugin.slug}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Categoria:</span>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                {getCategoryLabel(plugin.category)}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ícone:</span>
              <p className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{plugin.icon}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Desenvolvedor:</span>
              <p>{plugin.developer || 'WikiStore Team'}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Preços e Status</h3>
          <div className="space-y-2">
            {plugin.price && (
              <div>
                <span className="text-sm text-muted-foreground">Preço Único:</span>
                <p className="font-medium text-green-600">R$ {plugin.price}</p>
              </div>
            )}
            {plugin.monthlyPrice && (
              <div>
                <span className="text-sm text-muted-foreground">Preço Mensal:</span>
                <p className="font-medium text-blue-600">R$ {plugin.monthlyPrice}/mês</p>
              </div>
            )}
            {plugin.yearlyPrice && (
              <div>
                <span className="text-sm text-muted-foreground">Preço Anual:</span>
                <p className="font-medium text-purple-600">R$ {plugin.yearlyPrice}/ano</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Instalações:</span>
              <p className="font-medium">{plugin.installations || 0}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={plugin.isActive ? 'default' : 'secondary'} 
                     className={plugin.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                {plugin.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Descrição</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{plugin.description}</p>
      </div>

      {plugin.features && Array.isArray(plugin.features) && plugin.features.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Funcionalidades</h3>
          <div className="grid grid-cols-2 gap-2">
            {plugin.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Informações Técnicas</h3>
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Criado em:</span>
            <p>{plugin.createdAt ? new Date(plugin.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Atualizado em:</span>
            <p>{plugin.updatedAt ? new Date(plugin.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subscription Management Component
function SubscriptionManagement() {
  const [activeSubTab, setActiveSubTab] = useState("plans");
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // Subscription management states
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isViewSubscriptionOpen, setIsViewSubscriptionOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch plans and subscriptions
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/plugin-plans"],
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ["/api/admin/plugin-subscriptions"],
  });

  // Subscription management mutations
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return await apiRequest("PATCH", `/api/admin/plugin-subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-subscriptions"] });
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/plugin-subscriptions/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-subscriptions"] });
      toast({
        title: "Assinatura atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      setIsEditSubscriptionOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar assinatura",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = (updatedSubscription: any) => {
    updateSubscriptionMutation.mutate(updatedSubscription);
  };

  // Test plan activation function
  const testPlanActivation = async () => {
    try {
      const result = await apiRequest('POST', '/api/admin/activate-plan-plugins', {
        tenantId: 5, // Loja Demo
        planId: 1   // Plano Básico
      });
      
      toast({
        title: "Teste de Ativação Concluído",
        description: `${result.activatedPlugins?.length || 0} plugins foram ativados automaticamente para a Loja Demo`,
      });
      
      // Refresh subscriptions
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-subscriptions"] });
    } catch (error: any) {
      toast({
        title: "Erro no Teste",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Toggle plan status function
  const togglePlanStatus = async (planId: number, newStatus: boolean) => {
    try {
      await apiRequest('PATCH', `/api/admin/plugin-plans/${planId}/toggle-status`, {
        isActive: newStatus
      });
      
      toast({
        title: "Status Atualizado",
        description: `Plano ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
      });
      
      // Refresh plans
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-plans"] });
    } catch (error: any) {
      toast({
        title: "Erro ao Atualizar Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete plan function
  const deletePlan = async (planId: number) => {
    if (!confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await apiRequest('DELETE', `/api/admin/plugin-plans/${planId}`);
      
      toast({
        title: "Plano Excluído",
        description: "Plano excluído com sucesso",
      });
      
      // Refresh plans
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-plans"] });
    } catch (error: any) {
      toast({
        title: "Erro ao Excluir Plano",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planos & Assinaturas</h2>
          <p className="text-muted-foreground">Gerencie planos da plataforma e assinaturas ativas</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'plans'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Planos Disponíveis
          </button>
          <button
            onClick={() => setActiveSubTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'subscriptions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Assinaturas Ativas
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Plans Tab */}
      {activeSubTab === "plans" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Planos da Plataforma</h3>
            <Button onClick={() => setIsCreatePlanOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(plans as any[] || []).map((plan: any) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsEditPlanOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deletePlan(plan.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {Number(plan.monthly_price || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">por mês</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-blue-600">
                        R$ {Number(plan.yearly_price || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">por ano</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Máximo de lojas:</span>
                      <Badge variant="outline">{plan.max_tenants}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Assinaturas ativas:</span>
                      <Badge variant="outline">{plan.activeSubscriptions || 0}</Badge>
                    </div>
                  </div>

                  {plan.features && Array.isArray(plan.features) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recursos inclusos:</p>
                      <div className="space-y-1">
                        {plan.features.slice(0, 3).map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} recursos adicionais
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {plan.plugins && plan.plugins.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Plugins inclusos:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.plugins.slice(0, 4).map((pluginId: number) => (
                          <Badge key={pluginId} variant="secondary" className="text-xs">
                            🔌 Plugin ID {pluginId}
                          </Badge>
                        ))}
                        {plan.plugins.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.plugins.length - 4} plugins
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => togglePlanStatus(plan.id, !plan.is_active)}
                      variant={plan.is_active ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                    >
                      {plan.is_active ? (
                        <>
                          <PauseCircle className="w-4 h-4 mr-2" />
                          Desativar Plano
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Ativar Plano
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!plans || (plans as any[]).length === 0) && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum plano encontrado</h3>
              <p className="text-muted-foreground mb-4">Crie o primeiro plano da plataforma</p>
              <Button onClick={() => setIsCreatePlanOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeSubTab === "subscriptions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Assinaturas Ativas</h3>
            <Button 
              onClick={() => testPlanActivation()}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Testar Ativação de Plano
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Loja</th>
                      <th className="text-left p-4 font-medium">Plano</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Ciclo</th>
                      <th className="text-left p-4 font-medium">Próx. Cobrança</th>
                      <th className="text-left p-4 font-medium">Valor</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(subscriptions as any[] || []).map((subscription: any) => (
                      <tr key={subscription.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{subscription.tenant_name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">ID: {subscription.tenant_id}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{subscription.plan_name || 'Individual'}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                        </td>
                        <td className="p-4">{subscription.billing_cycle}</td>
                        <td className="p-4">
                          {subscription.next_billing_date ? 
                            new Date(subscription.next_billing_date).toLocaleDateString('pt-BR') : 
                            'N/A'
                          }
                        </td>
                        <td className="p-4">R$ {Number(subscription.current_price || 0).toFixed(2)}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedSubscription(subscription);
                                setIsViewSubscriptionOpen(true);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedSubscription(subscription);
                                setIsEditSubscriptionOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja cancelar a assinatura de ${subscription.tenant_name}?`)) {
                                    cancelSubscriptionMutation.mutate(subscription.id);
                                  }
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {(!subscriptions || (subscriptions as any[]).length === 0) && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma assinatura encontrada</h3>
                  <p className="text-muted-foreground">As assinaturas ativas aparecerão aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Analytics de Assinaturas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
                <p className="text-xs text-muted-foreground">Receita recorrente</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(subscriptions as any[] || []).length}</div>
                <p className="text-xs text-muted-foreground">Total de assinantes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plano Popular</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Básico</div>
                <p className="text-xs text-muted-foreground">Mais assinado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}



      {/* Create Plan Modal */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
          </DialogHeader>
          <PlanFormComponent onClose={() => setIsCreatePlanOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Plano - {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PlanFormComponent 
              plan={selectedPlan}
              onClose={() => setIsEditPlanOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal 
        subscription={selectedSubscription}
        isOpen={isViewSubscriptionOpen}
        onClose={() => setIsViewSubscriptionOpen(false)}
      />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal 
        subscription={selectedSubscription}
        isOpen={isEditSubscriptionOpen}
        onClose={() => setIsEditSubscriptionOpen(false)}
        onSave={handleUpdateSubscription}
      />
    </div>
  );
}

// Plan Form Component
function PlanFormComponent({ onClose, plan }: { onClose: () => void; plan?: any }) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    monthlyPrice: plan?.monthlyPrice || '',
    yearlyPrice: plan?.yearlyPrice || '',
    maxTenants: plan?.maxTenants || 1,
    features: plan?.features ? (Array.isArray(plan.features) ? plan.features.join('\n') : '') : '',
    isActive: plan?.isActive ?? true,
    selectedPlugins: plan?.plugins || []
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available plugins
  const { data: plugins } = useQuery({
    queryKey: ["/api/admin/plugins"],
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = plan ? `/api/admin/plugin-plans/${plan.id}` : '/api/admin/plugin-plans';
      const method = plan ? 'PATCH' : 'POST';
      return await apiRequest(method, endpoint, {
        ...data,
        features: data.features.split('\n').filter((f: string) => f.trim()),
        selectedPlugins: data.selectedPlugins
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-plans"] });
      toast({
        title: plan ? "Plano atualizado" : "Plano criado",
        description: plan ? "Plano foi atualizado com sucesso." : "Plano foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.monthlyPrice) {
      toast({
        title: "Erro",
        description: "Nome, descrição e preço mensal são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Plano *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Plano Básico"
          />
        </div>
        <div>
          <Label htmlFor="maxTenants">Máximo de Lojas</Label>
          <Input
            id="maxTenants"
            type="number"
            value={formData.maxTenants}
            onChange={(e) => setFormData({ ...formData, maxTenants: parseInt(e.target.value) || 1 })}
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do plano..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyPrice">Preço Mensal (R$) *</Label>
          <Input
            id="monthlyPrice"
            value={formData.monthlyPrice}
            onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
            placeholder="29.90"
          />
        </div>
        <div>
          <Label htmlFor="yearlyPrice">Preço Anual (R$)</Label>
          <Input
            id="yearlyPrice"
            value={formData.yearlyPrice}
            onChange={(e) => setFormData({ ...formData, yearlyPrice: e.target.value })}
            placeholder="299.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Recursos (um por linha)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="nfe-eletronica&#10;gateway-pagamento&#10;analytics-basico"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="plugins">Plugins Inclusos no Plano</Label>
        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
          {(plugins as any[] || []).map((plugin: any) => (
            <div key={plugin.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`plugin-${plugin.id}`}
                checked={formData.selectedPlugins.includes(plugin.id)}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setFormData({
                    ...formData,
                    selectedPlugins: isChecked
                      ? [...formData.selectedPlugins, plugin.id]
                      : formData.selectedPlugins.filter((id: number) => id !== plugin.id)
                  });
                }}
                className="rounded"
              />
              <Label htmlFor={`plugin-${plugin.id}`} className="flex items-center gap-2 cursor-pointer">
                <span className="text-2xl">{plugin.icon}</span>
                <div>
                  <span className="font-medium">{plugin.displayName}</span>
                  <p className="text-sm text-muted-foreground">{plugin.description}</p>
                </div>
              </Label>
            </div>
          ))}
          {(!plugins || (plugins as any[]).length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum plugin disponível
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Plugins selecionados serão ativados automaticamente quando um lojista contratar este plano
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label>Plano ativo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : (plan ? "Atualizar" : "Criar")}
        </Button>
      </div>
    </div>
  );
}

function NotificationFormComponent({ onClose, tenants }: NotificationFormProps) {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    recipientIds: [] as number[],
    buttonText: '',
    buttonUrl: ''
  });
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableUsers } = useQuery({
    queryKey: ['/api/admin/notification-recipients', notification.recipientType, selectedTenant],
    enabled: notification.recipientType === 'specific' || notification.recipientType === 'tenant'
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/notifications", data);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Informativo enviado",
        description: `Informativo enviado para ${response.recipientCount} destinatários`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!notification.title || !notification.message) {
      toast({
        title: "Erro",
        description: "Título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    let recipientIds: number[] = [];
    if (notification.recipientType === 'specific') {
      recipientIds = selectedUsers;
    } else if (notification.recipientType === 'tenant' && selectedTenant) {
      recipientIds = [selectedTenant];
    }

    createNotificationMutation.mutate({
      ...notification,
      recipientIds
    });
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informações do Informativo */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Informações do Informativo</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={notification.title}
              onChange={(e) => setNotification({ ...notification, title: e.target.value })}
              placeholder="Título do informativo"
            />
          </div>
          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={notification.message}
              onChange={(e) => setNotification({ ...notification, message: e.target.value })}
              placeholder="Conteúdo da mensagem..."
              rows={5}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buttonText">Texto do Botão (Opcional)</Label>
              <Input
                id="buttonText"
                value={notification.buttonText}
                onChange={(e) => setNotification({ ...notification, buttonText: e.target.value })}
                placeholder="Ex: Acessar Plataforma"
              />
            </div>
            <div>
              <Label htmlFor="buttonUrl">URL do Botão (Opcional)</Label>
              <Input
                id="buttonUrl"
                value={notification.buttonUrl}
                onChange={(e) => setNotification({ ...notification, buttonUrl: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Destinatários */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Destinatários</h3>
        <div className="space-y-4">
          <div>
            <Label>Tipo de Destinatário</Label>
            <Select 
              value={notification.recipientType} 
              onValueChange={(value) => {
                setNotification({ ...notification, recipientType: value });
                setSelectedUsers([]);
                setSelectedTenant(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="tenant">Usuários de uma loja específica</SelectItem>
                <SelectItem value="specific">Usuários específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {notification.recipientType === 'tenant' && (
            <div>
              <Label>Selecionar Loja</Label>
              <Select 
                value={selectedTenant?.toString() || ''} 
                onValueChange={(value) => setSelectedTenant(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {(tenants as any[])?.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {notification.recipientType === 'specific' && (
            <div>
              <Label>Selecionar Usuários</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {(availableUsers as any[])?.map((user: any) => (
                  <div key={user.id} className="flex items-center space-x-2 py-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        {user.tenantName && (
                          <div className="text-xs text-muted-foreground">Loja: {user.tenantName}</div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notification.recipientType === 'all' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Este informativo será enviado para todos os usuários ativos da plataforma.
              </p>
            </div>
          )}

          {notification.recipientType === 'tenant' && selectedTenant && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Este informativo será enviado para todos os usuários da loja selecionada.
              </p>
            </div>
          )}

          {notification.recipientType === 'specific' && selectedUsers.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                Este informativo será enviado para {selectedUsers.length} usuário(s) selecionado(s).
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={
            createNotificationMutation.isPending || 
            !notification.title || 
            !notification.message ||
            (notification.recipientType === 'specific' && selectedUsers.length === 0) ||
            (notification.recipientType === 'tenant' && !selectedTenant)
          }
        >
          {createNotificationMutation.isPending ? "Enviando..." : "Enviar Informativo"}
        </Button>
      </div>
    </div>
  );
}

function CreateUserFormComponent({ onClose }: CreateUserFormProps) {
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    document: '',
    documentType: 'cpf',
    phone: '',
    role: 'merchant',
    tenantId: undefined as number | undefined,
    profileImage: '',
    isActive: true,
    permissions: [] as string[],
    password: '',
    adminNotes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", `/api/admin/users`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário criado",
        description: "Usuário foi criado com sucesso",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({ ...newUser, password });
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informações Básicas */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              placeholder="Nome completo do usuário"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
            <Input
              id="document"
              value={newUser.document}
              onChange={(e) => setNewUser({ ...newUser, document: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select 
              value={newUser.documentType} 
              onValueChange={(value) => setNewUser({ ...newUser, documentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      {/* Acesso e Segurança */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Acesso e Segurança</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Senha *</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Senha do usuário"
              />
              <Button type="button" variant="outline" onClick={generatePassword}>
                Gerar
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="role">Função/Role *</Label>
            <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="merchant">Comerciante</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tenantId">ID da Loja</Label>
            <Input
              id="tenantId"
              type="number"
              value={newUser.tenantId || ''}
              onChange={(e) => setNewUser({ ...newUser, tenantId: parseInt(e.target.value) || undefined })}
              placeholder="ID da loja (opcional)"
            />
          </div>
          <div>
            <Label htmlFor="profileImage">URL da Imagem de Perfil</Label>
            <Input
              id="profileImage"
              value={newUser.profileImage}
              onChange={(e) => setNewUser({ ...newUser, profileImage: e.target.value })}
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>
        </div>
      </div>

      {/* Permissões */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Permissões</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageProducts"
                checked={newUser.permissions.includes('manage_products')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'manage_products']
                    : newUser.permissions.filter(p => p !== 'manage_products');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canManageProducts">Gerenciar Produtos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageOrders"
                checked={newUser.permissions.includes('manage_orders')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'manage_orders']
                    : newUser.permissions.filter(p => p !== 'manage_orders');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canManageOrders">Gerenciar Pedidos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canViewFinancials"
                checked={newUser.permissions.includes('view_financials')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'view_financials']
                    : newUser.permissions.filter(p => p !== 'view_financials');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canViewFinancials">Ver Financeiro</Label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageUsers"
                checked={newUser.permissions.includes('manage_users')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'manage_users']
                    : newUser.permissions.filter(p => p !== 'manage_users');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canManageUsers">Gerenciar Usuários</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageSettings"
                checked={newUser.permissions.includes('manage_settings')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'manage_settings']
                    : newUser.permissions.filter(p => p !== 'manage_settings');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canManageSettings">Gerenciar Configurações</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageThemes"
                checked={newUser.permissions.includes('manage_themes')}
                onCheckedChange={(checked) => {
                  const permissions = checked 
                    ? [...newUser.permissions, 'manage_themes']
                    : newUser.permissions.filter(p => p !== 'manage_themes');
                  setNewUser({ ...newUser, permissions });
                }}
              />
              <Label htmlFor="canManageThemes">Gerenciar Temas</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Observações</h3>
        <div>
          <Label htmlFor="adminNotes">Notas do Administrador</Label>
          <Textarea
            id="adminNotes"
            value={newUser.adminNotes}
            onChange={(e) => setNewUser({ ...newUser, adminNotes: e.target.value })}
            placeholder="Observações internas sobre este usuário..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => createUserMutation.mutate(newUser)}
          disabled={createUserMutation.isPending || !newUser.email || !newUser.fullName || !newUser.password}
        >
          {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
        </Button>
      </div>
    </div>
  );
}

function UserEditFormComponent({ user, onClose }: UserEditFormProps) {
  const [editingUser, setEditingUser] = useState(user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number; userData: Partial<User> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Informações Básicas */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              value={editingUser.fullName || ''}
              onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
            <Input
              id="document"
              value={editingUser.document || ''}
              onChange={(e) => setEditingUser({ ...editingUser, document: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select 
              value={editingUser.documentType || 'cpf'} 
              onValueChange={(value) => setEditingUser({ ...editingUser, documentType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={editingUser.phone || ''}
              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      {/* Perfil e Acesso */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Perfil e Acesso</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Função/Role *</Label>
            <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="merchant">Comerciante</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tenantId">ID da Loja</Label>
            <Input
              id="tenantId"
              type="number"
              value={editingUser.tenantId || ''}
              onChange={(e) => setEditingUser({ ...editingUser, tenantId: parseInt(e.target.value) || undefined })}
            />
          </div>
          <div>
            <Label htmlFor="isActive">Status da Conta</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="isActive"
                checked={editingUser.isActive}
                onCheckedChange={(checked) => setEditingUser({ ...editingUser, isActive: checked })}
              />
              <Label htmlFor="isActive">{editingUser.isActive ? 'Ativo' : 'Inativo'}</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="profileImage">URL da Imagem de Perfil</Label>
            <Input
              id="profileImage"
              value={editingUser.profileImage || ''}
              onChange={(e) => setEditingUser({ ...editingUser, profileImage: e.target.value })}
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>
        </div>
      </div>

      {/* Permissões Administrativas */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Permissões Administrativas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageProducts"
                checked={editingUser.permissions?.includes('manage_products') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'manage_products']
                    : permissions.filter(p => p !== 'manage_products');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canManageProducts">Gerenciar Produtos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageOrders"
                checked={editingUser.permissions?.includes('manage_orders') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'manage_orders']
                    : permissions.filter(p => p !== 'manage_orders');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canManageOrders">Gerenciar Pedidos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canViewFinancials"
                checked={editingUser.permissions?.includes('view_financials') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'view_financials']
                    : permissions.filter(p => p !== 'view_financials');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canViewFinancials">Ver Financeiro</Label>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageUsers"
                checked={editingUser.permissions?.includes('manage_users') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'manage_users']
                    : permissions.filter(p => p !== 'manage_users');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canManageUsers">Gerenciar Usuários</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageSettings"
                checked={editingUser.permissions?.includes('manage_settings') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'manage_settings']
                    : permissions.filter(p => p !== 'manage_settings');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canManageSettings">Gerenciar Configurações</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="canManageThemes"
                checked={editingUser.permissions?.includes('manage_themes') || false}
                onCheckedChange={(checked) => {
                  const permissions = editingUser.permissions || [];
                  const newPermissions = checked 
                    ? [...permissions, 'manage_themes']
                    : permissions.filter(p => p !== 'manage_themes');
                  setEditingUser({ ...editingUser, permissions: newPermissions });
                }}
              />
              <Label htmlFor="canManageThemes">Gerenciar Temas</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Observações Administrativas */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Observações</h3>
        <div>
          <Label htmlFor="adminNotes">Notas do Administrador</Label>
          <Textarea
            id="adminNotes"
            value={editingUser.adminNotes || ''}
            onChange={(e) => setEditingUser({ ...editingUser, adminNotes: e.target.value })}
            placeholder="Observações internas sobre este usuário..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={() => {
            updateUserMutation.mutate({
              userId: editingUser.id,
              userData: editingUser
            });
          }}
          disabled={updateUserMutation.isPending}
        >
          {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

function FinancialManagement() {
  const [activeFinancialTab, setActiveFinancialTab] = useState('overview');
  const [ledgerFilters, setLedgerFilters] = useState({
    tenant_id: '',
    transaction_type: '',
    start_date: '',
    end_date: ''
  });
  const { toast } = useToast();

  // Financial data queries
  const { data: platformRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/admin/financial/platform-revenue'],
  });

  const { data: subscriptionAnalytics, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/admin/financial/subscription-analytics'],
  });

  const { data: transactionHistory, isLoading: transactionLoading } = useQuery({
    queryKey: ['/api/admin/financial/transaction-history'],
  });

  const { data: celcoinIntegration, isLoading: celcoinLoading } = useQuery({
    queryKey: ['/api/admin/financial/celcoin-integration'],
  });

  const { data: ledgerData, isLoading: ledgerLoading, refetch: refetchLedger } = useQuery({
    queryKey: ['/api/admin/financial/ledger', ledgerFilters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(ledgerFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return fetch(`/api/admin/financial/ledger?${params}`).then(res => res.json());
    },
    enabled: activeFinancialTab === 'ledger'
  });

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const handleFilterChange = (key: string, value: string) => {
    setLedgerFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const exportToCSV = () => {
    if (!ledgerData?.entries?.length) {
      toast({
        title: "Erro",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = [
      'Data/Hora',
      'Loja',
      'Tipo',
      'Descrição',
      'Valor',
      'Saldo',
      'Ref. Celcoin'
    ];

    const csvData = ledgerData.entries.map((entry: any) => [
      new Date(entry.createdAt).toLocaleString('pt-BR'),
      entry.tenantName,
      entry.transactionType === 'credit' ? 'Crédito' : 'Débito',
      entry.description,
      formatCurrency(entry.amount),
      formatCurrency(entry.runningBalance),
      entry.celcoinTransactionId || '—'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `extrato-celcoin-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Extrato exportado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão Financeira</h2>
          <p className="text-muted-foreground">
            Controle completo das finanças da plataforma e integrações financeiras
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveFinancialTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Receita da Plataforma
          </button>
          <button
            onClick={() => setActiveFinancialTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'subscriptions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Analytics de Assinaturas
          </button>
          <button
            onClick={() => setActiveFinancialTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'transactions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Histórico de Transações
          </button>
          <button
            onClick={() => setActiveFinancialTab('ledger')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'ledger'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Extrato Celcoin
          </button>
          <button
            onClick={() => setActiveFinancialTab('celcoin')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'celcoin'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Integração Celcoin
          </button>
          <button
            onClick={() => setActiveFinancialTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Métodos de Pagamento
          </button>
          <button
            onClick={() => setActiveFinancialTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeFinancialTab === 'reports'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Relatórios Financeiros
          </button>
        </nav>
      </div>

      {/* Platform Revenue Overview */}
      {activeFinancialTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total da Plataforma</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(platformRevenue?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {platformRevenue?.totalTransactions || 0} transações processadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita de Assinaturas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(platformRevenue?.subscriptionRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Receita mensal recorrente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Transações</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(platformRevenue?.transactionFees || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {platformRevenue?.totalTransactions || 0} transações processadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(platformRevenue?.availableBalance || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Pronto para saque
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>Evolução da receita nos últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {revenueLoading ? (
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(platformRevenue?.totalRevenue || 0)}</p>
                      <p className="text-muted-foreground">Receita Total da Plataforma</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Receita</CardTitle>
                <CardDescription>Breakdown por fonte de receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {subscriptionLoading ? (
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <div className="space-y-4 w-full p-4">
                      <div className="flex justify-between">
                        <span>Receita de Assinaturas:</span>
                        <span className="font-bold">{formatCurrency(platformRevenue?.subscriptionRevenue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Transações:</span>
                        <span className="font-bold">{formatCurrency(platformRevenue?.transactionFees || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saldo Disponível:</span>
                        <span className="font-bold">{formatCurrency(platformRevenue?.availableBalance || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Subscription Analytics */}
      {activeFinancialTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionAnalytics?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{subscriptionAnalytics?.newSubscriptionsThisMonth || 0} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscriptionAnalytics?.churnRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {subscriptionAnalytics?.cancelledThisMonth || 0} cancelamentos este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(subscriptionAnalytics?.averageLTV || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Valor vitalício do cliente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(subscriptionAnalytics?.mrr || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Receita mensal recorrente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes das Assinaturas</CardTitle>
              <CardDescription>Lista completa de assinaturas de plugins e planos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Tenant</th>
                      <th className="text-left p-4">Tipo</th>
                      <th className="text-left p-4">Produto</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Valor</th>
                      <th className="text-left p-4">Próxima Cobrança</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                          <p className="mt-2 text-muted-foreground">Carregando assinaturas...</p>
                        </td>
                      </tr>
                    ) : subscriptionAnalytics?.subscriptions?.length ? (
                      subscriptionAnalytics.subscriptions.map((sub: any) => (
                        <tr key={sub.id} className="border-b">
                          <td className="p-4">{sub.tenantName}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {sub.subscriptionType === 'plugin' ? 'Plugin' : 'Plano'}
                            </Badge>
                          </td>
                          <td className="p-4">{sub.productName}</td>
                          <td className="p-4">
                            <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {sub.status === 'active' ? 'Ativo' : 'Cancelado'}
                            </Badge>
                          </td>
                          <td className="p-4">{formatCurrency(sub.currentPrice)}</td>
                          <td className="p-4">{new Date(sub.nextBillingDate).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">
                            <Button variant="outline" size="sm">
                              Gerenciar
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Nenhuma assinatura encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History */}
      {activeFinancialTab === 'transactions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>Todas as transações financeiras da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="succeeded">Aprovado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="subscription">Assinatura</SelectItem>
                      <SelectItem value="order">Pedido</SelectItem>
                      <SelectItem value="withdrawal">Saque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">ID Transação</th>
                        <th className="text-left p-4">Data</th>
                        <th className="text-left p-4">Tenant</th>
                        <th className="text-left p-4">Tipo</th>
                        <th className="text-left p-4">Valor</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                            <p className="mt-2 text-muted-foreground">Carregando histórico de transações...</p>
                          </td>
                        </tr>
                      ) : transactionHistory?.length ? (
                        transactionHistory.map((transaction: any) => (
                          <tr key={transaction.id} className="border-b">
                            <td className="p-4 font-mono text-sm">{transaction.id}</td>
                            <td className="p-4">{new Date(transaction.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4">{transaction.tenantName}</td>
                            <td className="p-4">
                              <Badge variant="outline">{transaction.type}</Badge>
                            </td>
                            <td className="p-4">{formatCurrency(transaction.amount)}</td>
                            <td className="p-4">
                              <Badge className={
                                transaction.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {transaction.status === 'succeeded' ? 'Aprovado' :
                                 transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                              </Badge>
                            </td>
                            <td className="p-4">{transaction.paymentMethod}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            Nenhuma transação encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Celcoin Integration */}
      {activeFinancialTab === 'celcoin' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração Celcoin</CardTitle>
              <CardDescription>Status e configurações da integração com Celcoin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Status da Conexão</p>
                      <p className="text-sm text-muted-foreground">Conectado e funcionando</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>

                {/* API Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Transações Processadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{celcoinIntegration?.totalTransactions || 0}</div>
                      <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Volume Processado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(celcoinIntegration?.totalVolume || 0)}</div>
                      <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Taxa de Sucesso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{celcoinIntegration?.successRate || 0}%</div>
                      <p className="text-xs text-muted-foreground">Transações aprovadas</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Methods Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Métodos de Pagamento</CardTitle>
                    <CardDescription>Distribuição e performance dos métodos de pagamento (últimos 30 dias)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {celcoinIntegration?.paymentMethods?.length ? (
                        <div className="space-y-4">
                          {celcoinIntegration.paymentMethods.map((method: any) => (
                            <div key={method.method} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {method.methodName.substring(0, 3).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{method.methodName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {method.count} transações ({method.percentage}%)
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(method.volume)}</div>
                                <div className="text-sm text-muted-foreground">
                                  Taxa de sucesso: {method.successRate}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum método de pagamento encontrado
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Client ID</Label>
                          <Input value="****-****-****-****" disabled />
                        </div>
                        <div>
                          <Label>Environment</Label>
                          <Select defaultValue="production">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="production">Produção</SelectItem>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button>Salvar Configurações</Button>
                        <Button variant="outline">Testar Conexão</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ledger - Extrato Celcoin */}
      {activeFinancialTab === 'ledger' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extrato da Conta Celcoin</CardTitle>
              <CardDescription>Visualize todas as movimentações financeiras dos lojistas na conta Celcoin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Cards */}
                {ledgerLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total de Créditos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(ledgerData?.summary?.totalCredits || 0)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total de Débitos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(ledgerData?.summary?.totalDebits || 0)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${
                            (ledgerData?.summary?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(ledgerData?.summary?.netBalance || 0)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {ledgerData?.summary?.transactionCount || 0}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 flex-wrap">
                      <Select 
                        value={ledgerFilters.tenant_id || "all"} 
                        onValueChange={(value) => handleFilterChange('tenant_id', value === 'all' ? '' : value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrar por Loja" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Lojas</SelectItem>
                          <SelectItem value="1">Loja Demo</SelectItem>
                          <SelectItem value="2">Shopping das Makess</SelectItem>
                          <SelectItem value="5">Boutique Virtual</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={ledgerFilters.transaction_type || "all"} 
                        onValueChange={(value) => handleFilterChange('transaction_type', value === 'all' ? '' : value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="credit">Créditos</SelectItem>
                          <SelectItem value="debit">Débitos</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={ledgerFilters.start_date}
                          onChange={(e) => handleFilterChange('start_date', e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm"
                          placeholder="Data inicial"
                        />
                        <span className="text-muted-foreground">até</span>
                        <input
                          type="date"
                          value={ledgerFilters.end_date}
                          onChange={(e) => handleFilterChange('end_date', e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm"
                          placeholder="Data final"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportToCSV}>
                          Exportar CSV
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setLedgerFilters({
                              tenant_id: '',
                              transaction_type: '',
                              start_date: '',
                              end_date: ''
                            });
                          }}
                        >
                          Limpar Filtros
                        </Button>
                      </div>
                    </div>

                    {/* Ledger Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4">Data/Hora</th>
                            <th className="text-left p-4">Loja</th>
                            <th className="text-left p-4">Tipo</th>
                            <th className="text-left p-4">Descrição</th>
                            <th className="text-left p-4">Valor</th>
                            <th className="text-left p-4">Saldo</th>
                            <th className="text-left p-4">Ref. Celcoin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerData?.entries?.length ? (
                            ledgerData.entries.map((entry: any) => (
                              <tr key={entry.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-sm">
                                  {new Date(entry.createdAt).toLocaleString('pt-BR')}
                                </td>
                                <td className="p-4">
                                  <div className="font-medium">{entry.tenantName}</div>
                                  <div className="text-sm text-muted-foreground">ID: {entry.tenantId}</div>
                                </td>
                                <td className="p-4">
                                  <Badge className={
                                    entry.transactionType === 'credit' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }>
                                    {entry.transactionType === 'credit' ? 'Crédito' : 'Débito'}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium">{entry.description}</div>
                                  {entry.referenceType && (
                                    <div className="text-sm text-muted-foreground">
                                      {entry.referenceType}: {entry.referenceId}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`font-medium ${
                                    entry.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {entry.transactionType === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                                  </span>
                                </td>
                                <td className="p-4 font-mono text-sm">
                                  {formatCurrency(entry.runningBalance)}
                                </td>
                                <td className="p-4">
                                  {entry.celcoinTransactionId ? (
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                      {entry.celcoinTransactionId}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                Nenhuma movimentação encontrada
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Methods */}
      {activeFinancialTab === 'payments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Configurações dos métodos de pagamento aceitos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payment Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {celcoinLoading ? (
                    <div className="col-span-full flex justify-center items-center h-32">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <>
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Cartão de Crédito
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Status:</span>
                              <Badge className={celcoinIntegration?.successRate > 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {celcoinIntegration?.successRate > 90 ? "Ativo" : "Degradado"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Taxa de Sucesso:</span>
                              <span className="text-sm">{celcoinIntegration?.successRate || 0}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            PIX
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Volume Total:</span>
                              <span className="text-sm">{formatCurrency(celcoinIntegration?.totalVolume || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Transações:</span>
                              <span className="text-sm">{celcoinIntegration?.totalTransactions || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Configurações
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Button className="w-full" variant="outline">
                              Configurar Métodos
                            </Button>
                            <Button className="w-full" variant="outline">
                              Logs de Integração
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Payment Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Taxa Padrão da Plataforma (%)</Label>
                          <Input type="number" defaultValue="5.0" />
                        </div>
                        <div>
                          <Label>Prazo de Repasse (dias)</Label>
                          <Input type="number" defaultValue="30" />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="auto-transfer" />
                        <Label htmlFor="auto-transfer">Repasse automático</Label>
                      </div>
                      
                      <Button>Salvar Configurações</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Reports */}
      {activeFinancialTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>Análise completa baseada em dados reais da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Chart */}
                {reportsData && reportsData.revenueData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução da Receita (12 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 w-full">
                        <div className="flex items-end justify-between h-full space-x-2">
                          {reportsData.revenueData.map((data: any, index: number) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                              <div 
                                className="bg-blue-500 w-full rounded-t"
                                style={{ 
                                  height: `${Math.max((data.revenue / Math.max(...reportsData.revenueData.map((d: any) => d.revenue))) * 200, 10)}px` 
                                }}
                              />
                              <div className="text-xs mt-2 text-center">
                                <div className="font-medium">{data.month}</div>
                                <div className="text-muted-foreground">{formatCurrency(data.revenue)}</div>
                                <div className="text-xs text-muted-foreground">{data.orderCount} pedidos</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tenant Performance */}
                {reportsData && reportsData.tenantPerformanceData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 10 Lojas por Receita</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportsData.tenantPerformanceData.map((tenant: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{tenant.tenantName}</p>
                                <p className="text-sm text-muted-foreground">{tenant.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(tenant.totalRevenue)}</div>
                              <div className="text-sm text-muted-foreground">
                                {tenant.totalOrders} pedidos • {tenant.conversionRate}% conversão
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Distribution */}
                {reportsData && reportsData.categoryDistribution && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportsData.categoryDistribution.map((category: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {category.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{category.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {category.tenantCount} lojas • {category.orderCount} pedidos
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(category.revenue)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Methods Analysis */}
                {reportsData && reportsData.paymentMethodData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Análise de Métodos de Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportsData.paymentMethodData.map((method: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{method.method}</h4>
                              <Badge variant="outline">{method.successRate}% sucesso</Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Volume:</span>
                                <span className="font-medium">{formatCurrency(method.volume)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Transações:</span>
                                <span className="font-medium">{method.transactionCount}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Exportar Relatório Completo
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Relatório Fiscal
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Dashboard Executivo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Platform Settings Content Component
function PlatformSettingsContent({ activeTab }: { activeTab: string }) {
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/admin/platform/settings", activeTab],
  });

  const { data: features, isLoading: featuresLoading, refetch: refetchFeatures } = useQuery({
    queryKey: ["/api/admin/platform/features"],
    enabled: activeTab === 'features'
  });

  const { data: maintenance, isLoading: maintenanceLoading, refetch: refetchMaintenance } = useQuery({
    queryKey: ["/api/admin/platform/maintenance"],
    enabled: activeTab === 'maintenance'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: any }) => {
      return await apiRequest('PUT', `/api/admin/platform/settings/${id}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform/settings"] });
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi salva com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/admin/platform/features/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform/features"] });
      toast({
        title: "Recurso atualizado",
        description: "O recurso foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/admin/platform/maintenance', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform/maintenance"] });
      toast({
        title: "Manutenção agendada",
        description: "A manutenção foi agendada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (setting: any, newValue: any) => {
    updateSettingMutation.mutate({ id: setting.id, value: newValue });
  };

  const handleFeatureToggle = (feature: any, isEnabled: boolean) => {
    updateFeatureMutation.mutate({ 
      id: feature.id, 
      data: { 
        isEnabled,
        rolloutPercentage: feature.rollout_percentage,
        targetTenants: feature.target_tenants,
        metadata: feature.metadata
      }
    });
  };

  if (settingsLoading && activeTab !== 'features' && activeTab !== 'maintenance') {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (activeTab === 'features') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Recursos</CardTitle>
          <CardDescription>
            Configure recursos da plataforma e controle o rollout para tenants específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuresLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {features?.map((feature: any) => (
                <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{feature.name}</h4>
                      <Badge variant={feature.is_enabled ? 'default' : 'secondary'}>
                        {feature.is_enabled ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Rollout: {feature.rollout_percentage}%</span>
                      {feature.created_by_name && (
                        <span>Criado por: {feature.created_by_name}</span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={feature.is_enabled}
                    onCheckedChange={(checked) => handleFeatureToggle(feature, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'maintenance') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Manutenção</CardTitle>
            <CardDescription>
              Agende e gerencie manutenções da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {maintenance?.length > 0 ? (
                  maintenance.map((item: any) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant={item.severity === 'critical' ? 'destructive' : 'default'}>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Tipo: {item.maintenance_type}</span>
                        <span>Status: {item.status}</span>
                        {item.scheduled_start && (
                          <span>Início: {new Date(item.scheduled_start).toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma manutenção agendada</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const categorySettings = settings?.[activeTab] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Configurações de {activeTab === 'general' ? 'Geral' : 
                           activeTab === 'email' ? 'E-mail' :
                           activeTab === 'payment' ? 'Pagamentos' :
                           activeTab === 'security' ? 'Segurança' :
                           activeTab === 'tax' ? 'Impostos' :
                           activeTab === 'integrations' ? 'Integrações' :
                           activeTab === 'notifications' ? 'Notificações' : activeTab}
        </CardTitle>
        <CardDescription>
          Configure as opções para esta categoria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categorySettings.map((setting: any) => (
            <div key={setting.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Label>
                  {setting.description && (
                    <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                  )}
                </div>
                {setting.data_type === 'boolean' ? (
                  <Switch
                    checked={setting.value === true || setting.value === 'true'}
                    onCheckedChange={(checked) => handleSettingChange(setting, checked)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type={setting.data_type === 'number' ? 'number' : 'text'}
                      value={setting.value || ''}
                      onChange={(e) => {
                        const value = setting.data_type === 'number' ? 
                          Number(e.target.value) : e.target.value;
                        handleSettingChange(setting, value);
                      }}
                      className="w-48"
                    />
                    {setting.last_modified_by_name && (
                      <span className="text-xs text-muted-foreground">
                        por {setting.last_modified_by_name}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Separator />
            </div>
          ))}
          
          {categorySettings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma configuração disponível para esta categoria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// User Profile Management Component
function UserProfileManagement({ currentUser }: { currentUser: any }) {
  const [activeProfileTab, setActiveProfileTab] = useState('personal');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/user-activity", currentUser?.id],
    enabled: !!currentUser?.id && activeProfileTab === 'activity'
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/admin/user-profile/${currentUser?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil Atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/current-user"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/admin/change-password`, data);
    },
    onSuccess: () => {
      toast({
        title: "Senha Alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setIsPasswordDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao alterar senha.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de segurança
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Profile Navigation - Vertical Sidebar */}
        <div className="w-64 shrink-0">
          <nav className="space-y-2">
            {[
              { id: 'personal', label: 'Informações Pessoais', icon: User },
              { id: 'security', label: 'Segurança', icon: ShieldCheck },
              { id: 'activity', label: 'Atividade Recente', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg font-medium text-sm transition-colors ${
                    activeProfileTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Content */}
        <div className="flex-1">
          {/* Personal Information Tab */}
          {activeProfileTab === 'personal' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações básicas e dados de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {currentUser?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || currentUser?.email?.[0] || 'A'}
                    </div>
                    <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0">
                      <Camera className="w-3 h-3" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{currentUser?.fullName || 'Administrador'}</h3>
                    <p className="text-muted-foreground">{currentUser?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {currentUser?.role || 'Admin'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input 
                      id="firstName" 
                      defaultValue={currentUser?.fullName?.split(' ')[0] || ''} 
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input 
                      id="lastName" 
                      defaultValue={currentUser?.fullName?.split(' ').slice(1).join(' ') || ''} 
                      placeholder="Seu sobrenome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={currentUser?.email || ''} 
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea 
                      id="bio" 
                      placeholder="Conte um pouco sobre você..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancelar</Button>
                  <Button onClick={() => updateProfileMutation.mutate({})}>
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeProfileTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Segurança da Conta
                  </CardTitle>
                  <CardDescription>
                    Gerencie sua senha e configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Senha</h4>
                        <p className="text-sm text-muted-foreground">
                          Última alteração: há 30 dias
                        </p>
                      </div>
                      <Button onClick={() => setIsPasswordDialogOpen(true)}>
                        Alterar Senha
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                        <p className="text-sm text-muted-foreground">
                          Adicione uma camada extra de segurança
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Sessões Ativas</h4>
                        <p className="text-sm text-muted-foreground">
                          Gerencie onde você está logado
                        </p>
                      </div>
                      <Button variant="outline">
                        Ver Sessões
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change Dialog */}
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={() => changePasswordMutation.mutate({})}>
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Activity Tab */}
          {activeProfileTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  Visualize suas ações recentes na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { action: 'Login realizado', time: '2 horas atrás', ip: '192.168.1.1' },
                      { action: 'Configurações atualizadas', time: '1 dia atrás', ip: '192.168.1.1' },
                      { action: 'Usuário criado', time: '2 dias atrás', ip: '192.168.1.1' },
                      { action: 'Login realizado', time: '3 dias atrás', ip: '192.168.1.2' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.time} • IP: {activity.ip}
                          </div>
                        </div>
                        <Badge variant="outline">
                          Sucesso
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activePlatformTab, setActivePlatformTab] = useState('general');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [isEditTenantOpen, setIsEditTenantOpen] = useState(false);
  const [isViewTenantOpen, setIsViewTenantOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false);
  
  // Plugin management states
  const [isCreatePluginOpen, setIsCreatePluginOpen] = useState(false);
  const [isViewPluginOpen, setIsViewPluginOpen] = useState(false);
  const [isEditPluginOpen, setIsEditPluginOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
  const [pluginSearchTerm, setPluginSearchTerm] = useState('');
  const [pluginCategoryFilter, setPluginCategoryFilter] = useState('all');
  const [pluginStatusFilter, setPluginStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Subscription management states
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isViewSubscriptionOpen, setIsViewSubscriptionOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Plugin management mutation
  const togglePluginMutation = useMutation({
    mutationFn: async ({ pluginId, isActive }: { pluginId: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/plugins/${pluginId}`, { isActive });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugins"] });
      toast({
        title: "Plugin atualizado",
        description: `Plugin ${variables.isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar plugin",
        variant: "destructive",
      });
    },
  });

  const togglePluginStatus = (pluginId: number, isActive: boolean) => {
    togglePluginMutation.mutate({ pluginId, isActive });
  };

  // Subscription management mutations
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      return await apiRequest("PATCH", `/api/admin/plugin-subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-subscriptions"] });
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  // Subscription handlers
  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsViewSubscriptionOpen(true);
  };

  const handleEditSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsEditSubscriptionOpen(true);
  };

  const handleCancelSubscription = (subscription: any) => {
    if (confirm(`Tem certeza que deseja cancelar a assinatura de ${subscription.tenant_name}?`)) {
      cancelSubscriptionMutation.mutate(subscription.id);
    }
  };

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/plugin-subscriptions/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plugin-subscriptions"] });
      toast({
        title: "Assinatura atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar assinatura",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSubscription = (updatedSubscription: any) => {
    updateSubscriptionMutation.mutate(updatedSubscription);
  };

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
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: systemStatus } = useQuery({
    queryKey: ['/api/admin/system/status'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const { data: databasePerformance } = useQuery({
    queryKey: ['/api/admin/system/database-performance'],
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: apiAnalytics } = useQuery({
    queryKey: ['/api/admin/system/api-analytics'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: securityLogs } = useQuery({
    queryKey: ['/api/admin/system/security-logs'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: plugins } = useQuery({
    queryKey: ['/api/admin/plugins'],
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/admin/notifications'],
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
                    {systemMetrics && (
                      <>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">CPU Usage</p>
                            <p className="text-2xl font-bold">{systemMetrics.cpuUsage}%</p>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm">Normal</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">Memory Usage</p>
                            <p className="text-2xl font-bold">{systemMetrics.memoryUsage}%</p>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Good</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">Disk Usage</p>
                            <p className="text-2xl font-bold">{systemMetrics.diskUsage}%</p>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm">Normal</span>
                          </div>
                        </div>
                      </>
                    )}
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
                                <Dialog open={isViewTenantOpen && selectedTenant?.id === tenant.id} 
                                       onOpenChange={(open) => {
                                         setIsViewTenantOpen(open);
                                         if (open) setSelectedTenant(tenant);
                                       }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Detalhes da Loja - {tenant.name}</DialogTitle>
                                    </DialogHeader>
                                    {selectedTenant && (
                                      <TenantDetailsView 
                                        tenant={selectedTenant}
                                        setSelectedTenant={setSelectedTenant}
                                        setActiveTab={setActiveTab}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                      </DialogHeader>
                      <CreateUserFormComponent onClose={() => setIsCreateUserOpen(false)} />
                    </DialogContent>
                  </Dialog>
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
                                <Dialog open={isViewUserOpen && selectedUser?.id === user.id} 
                                       onOpenChange={(open) => {
                                         setIsViewUserOpen(open);
                                         if (open) setSelectedUser(user);
                                       }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Detalhes do Usuário</DialogTitle>
                                    </DialogHeader>
                                    {selectedUser && (
                                      <div className="space-y-6">
                                        {/* Informações Básicas */}
                                        <div>
                                          <h3 className="text-lg font-semibold mb-3">Informações Básicas</h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Nome Completo</Label>
                                              <p className="text-sm text-muted-foreground">{selectedUser.fullName || 'Não informado'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Email</Label>
                                              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Documento</Label>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedUser.document ? `${selectedUser.document} (${selectedUser.documentType?.toUpperCase()})` : 'Não informado'}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Telefone</Label>
                                              <p className="text-sm text-muted-foreground">{selectedUser.phone || 'Não informado'}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Perfil e Acesso */}
                                        <div>
                                          <h3 className="text-lg font-semibold mb-3">Perfil e Acesso</h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Role</Label>
                                              <Badge variant="outline">{selectedUser.role}</Badge>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Status</Label>
                                              <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                                                {selectedUser.isActive ? 'Ativo' : 'Inativo'}
                                              </Badge>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Loja ID</Label>
                                              <p className="text-sm text-muted-foreground">{selectedUser.tenantId || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Criado por</Label>
                                              <p className="text-sm text-muted-foreground">{selectedUser.createdBy || 'Sistema'}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Atividade e Logs */}
                                        <div>
                                          <h3 className="text-lg font-semibold mb-3">Atividade e Logs</h3>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Último Login</Label>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Data de Criação</Label>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Última Atualização</Label>
                                              <p className="text-sm text-muted-foreground">
                                                {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Permissões */}
                                        {selectedUser.permissions && (
                                          <div>
                                            <h3 className="text-lg font-semibold mb-3">Permissões</h3>
                                            <div className="flex flex-wrap gap-2">
                                              {Array.isArray(selectedUser.permissions) ? selectedUser.permissions.map((permission: string, index: number) => (
                                                <Badge key={index} variant="secondary">{permission}</Badge>
                                              )) : (
                                                <p className="text-sm text-muted-foreground">Nenhuma permissão especial</p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <Dialog open={isEditUserOpen && selectedUser?.id === user.id} 
                                       onOpenChange={(open) => {
                                         setIsEditUserOpen(open);
                                         if (open) setSelectedUser(user);
                                       }}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Editar Usuário</DialogTitle>
                                    </DialogHeader>
                                    {selectedUser && (
                                      <UserEditFormComponent 
                                        user={selectedUser}
                                        onClose={() => setIsEditUserOpen(false)}
                                      />
                                    )}
                                  </DialogContent>
                                </Dialog>
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
              {/* Plugin Management Header */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Marketplace de Plugins</h2>
                  <p className="text-muted-foreground">Gerencie plugins disponíveis na plataforma</p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isCreatePluginOpen} onOpenChange={setIsCreatePluginOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Plugin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Adicionar Novo Plugin</DialogTitle>
                      </DialogHeader>
                      <PluginFormComponent onClose={() => setIsCreatePluginOpen(false)} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                </div>
              </div>

              {/* Plugin Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar plugins..."
                        value={pluginSearchTerm}
                        onChange={(e) => setPluginSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={pluginCategoryFilter} onValueChange={setPluginCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as Categorias</SelectItem>
                          <SelectItem value="pagamento">Pagamento</SelectItem>
                          <SelectItem value="fiscal">Fiscal</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="integracao">Integração</SelectItem>
                          <SelectItem value="relatorios">Relatórios</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={pluginStatusFilter} onValueChange={setPluginStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativos</SelectItem>
                          <SelectItem value="inactive">Inativos</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plugin Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Puzzle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total de Plugins</p>
                        <p className="text-2xl font-bold">{(plugins as any[])?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Plugins Ativos</p>
                        <p className="text-2xl font-bold">
                          {(plugins as any[])?.filter(p => p.isActive).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Download className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total de Instalações</p>
                        <p className="text-2xl font-bold">
                          {(plugins as any[])?.reduce((acc, p) => acc + (p.installations || 0), 0) || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <DollarSign className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                        <p className="text-2xl font-bold">R$ 15.400</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Plugin List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plugins Disponíveis</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros Avançados
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {((plugins as any[]) || [])
                      .filter((plugin: any) => {
                        const matchesSearch = plugin.name.toLowerCase().includes(pluginSearchTerm.toLowerCase()) ||
                                            plugin.description.toLowerCase().includes(pluginSearchTerm.toLowerCase());
                        const matchesCategory = pluginCategoryFilter === 'all' || plugin.category === pluginCategoryFilter;
                        const matchesStatus = pluginStatusFilter === 'all' || 
                                            (pluginStatusFilter === 'active' && plugin.isActive) ||
                                            (pluginStatusFilter === 'inactive' && !plugin.isActive);
                        return matchesSearch && matchesCategory && matchesStatus;
                      })
                      .map((plugin: any) => (
                      <Card key={plugin.id} className="relative group hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{plugin.name}</CardTitle>
                                <Badge variant={plugin.isActive ? 'default' : 'secondary'}>
                                  {plugin.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{plugin.category}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPlugin(plugin);
                                  setIsViewPluginOpen(true);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPlugin(plugin);
                                  setIsEditPluginOpen(true);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Configurações
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{plugin.description}</p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Code className="w-4 h-4" />
                                v{plugin.version}
                              </span>
                              <span className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                {plugin.installations} instalações
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {plugin.developer}
                              </span>
                              <span className="font-medium text-lg">{plugin.price}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant={plugin.isActive ? "outline" : "default"}
                                className="flex-1"
                                onClick={() => togglePluginStatus(plugin.id, !plugin.isActive)}
                              >
                                {plugin.isActive ? 'Desativar' : 'Ativar'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedPlugin(plugin);
                                  setIsEditPluginOpen(true);
                                }}
                                title="Configurar Plugin"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {((plugins as any[]) || []).length === 0 && (
                    <div className="text-center py-12">
                      <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum plugin encontrado</h3>
                      <p className="text-muted-foreground mb-4">Comece adicionando plugins ao marketplace</p>
                      <Button onClick={() => setIsCreatePluginOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Plugin
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plugin Details Modal */}
              <Dialog open={isViewPluginOpen} onOpenChange={setIsViewPluginOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detalhes do Plugin - {selectedPlugin?.name}</DialogTitle>
                  </DialogHeader>
                  {selectedPlugin && (
                    <PluginDetailsView plugin={selectedPlugin} />
                  )}
                </DialogContent>
              </Dialog>

              {/* Edit Plugin Modal */}
              <Dialog open={isEditPluginOpen} onOpenChange={setIsEditPluginOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Plugin - {selectedPlugin?.name}</DialogTitle>
                  </DialogHeader>
                  {selectedPlugin && (
                    <PluginFormComponent 
                      plugin={selectedPlugin}
                      onClose={() => setIsEditPluginOpen(false)} 
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <SubscriptionManagement />
            </div>
          )}

          {/* Support Center Tab */}
          {activeTab === "support" && (
            <div className="space-y-6">
              <AdminSupportCenter />
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Reports Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Relatórios e Analytics</h2>
                  <p className="text-muted-foreground">Análise completa da performance da plataforma</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Dashboard
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(adminStats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {(reportsData as any)?.revenueData ? 
                        `${(reportsData as any).revenueData.length} meses de dados` : 
                        'Dados atualizados'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats.activeTenants}</div>
                    <p className="text-xs text-muted-foreground">
                      de {adminStats.totalTenants} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{adminStats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {(reportsData as any)?.paymentMethodData ? 
                        `${(reportsData as any).paymentMethodData.length} métodos` : 
                        'Pedidos totais'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa Plataforma</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(adminStats.platformFee)}</div>
                    <p className="text-xs text-muted-foreground">
                      5% sobre vendas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analysis */}
              {(reportsData as any)?.revenueData && Array.isArray((reportsData as any).revenueData) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Análise de Receita (12 meses)
                    </CardTitle>
                    <CardDescription>Evolução da receita e número de pedidos por mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <div className="flex items-end justify-between h-full space-x-2">
                        {(reportsData as any).revenueData.map((data: any, index: number) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                              className="bg-gradient-to-t from-blue-500 to-blue-300 w-full rounded-t relative"
                              style={{ 
                                height: `${Math.max((data.revenue / Math.max(...(reportsData as any).revenueData.map((d: any) => d.revenue))) * 250, 15)}px` 
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center">
                                {formatCurrency(data.revenue)}
                              </div>
                            </div>
                            <div className="text-xs mt-3 text-center">
                              <div className="font-medium">{data.month}</div>
                              <div className="text-muted-foreground">{data.orderCount} pedidos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Performing Stores */}
              {(reportsData as any)?.tenantPerformanceData && Array.isArray((reportsData as any).tenantPerformanceData) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Top 10 Lojas por Performance
                    </CardTitle>
                    <CardDescription>Ranking das lojas com melhor desempenho em receita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(reportsData as any).tenantPerformanceData.map((tenant: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{tenant.tenantName}</p>
                              <p className="text-sm text-muted-foreground">{tenant.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(tenant.totalRevenue)}</div>
                            <div className="text-sm text-muted-foreground">
                              {tenant.totalOrders} pedidos • {tenant.conversionRate}% conversão
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                {(reportsData as any)?.categoryDistribution && Array.isArray((reportsData as any).categoryDistribution) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileBarChart className="w-5 h-5" />
                        Distribuição por Categoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(reportsData as any).categoryDistribution.map((category: any, index: number) => {
                          const total = (reportsData as any).categoryDistribution.reduce((sum: number, cat: any) => sum + cat.revenue, 0);
                          const percentage = total > 0 ? ((category.revenue / total) * 100).toFixed(1) : '0';
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{category.name}</span>
                                <span className="text-sm text-muted-foreground">{percentage}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{category.tenantCount} lojas</span>
                                <span>{formatCurrency(category.revenue)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Methods Analysis */}
                {(reportsData as any)?.paymentMethodData && Array.isArray((reportsData as any).paymentMethodData) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Análise de Métodos de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(reportsData as any).paymentMethodData.map((method: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                method.successRate >= 90 ? 'bg-green-500' : 
                                method.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <p className="font-medium">{method.method}</p>
                                <p className="text-sm text-muted-foreground">
                                  {method.transactionCount} transações
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(method.volume)}</div>
                              <div className="text-sm text-muted-foreground">
                                {method.successRate}% sucesso
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Atividade dos Usuários
                  </CardTitle>
                  <CardDescription>Análise da base de usuários da plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{adminStats.totalUsers}</div>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{adminStats.activeUsers}</div>
                      <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {adminStats.totalUsers > 0 ? ((adminStats.activeUsers / adminStats.totalUsers) * 100).toFixed(1) : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Taxa de Ativação</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {adminStats.totalOrders > 0 && adminStats.activeUsers > 0 ? 
                          (adminStats.totalOrders / adminStats.activeUsers).toFixed(1) : 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Pedidos por Usuário</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="flex items-center gap-2 h-16">
                      <FileText className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Relatório Mensal</div>
                        <div className="text-xs text-muted-foreground">Gerar PDF</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 h-16">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Exportar Dados</div>
                        <div className="text-xs text-muted-foreground">CSV/Excel</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 h-16">
                      <BarChart3 className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Dashboard Executivo</div>
                        <div className="text-xs text-muted-foreground">Visualização</div>
                      </div>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 h-16">
                      <Mail className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Enviar Relatório</div>
                        <div className="text-xs text-muted-foreground">Por email</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Métricas de Performance do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {systemMetrics && (
                      <>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">CPU Usage</h4>
                            <div className="flex items-center gap-1 text-blue-600">
                              <Activity className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold mb-1">{systemMetrics.cpuUsage}%</div>
                          <div className="text-sm text-muted-foreground">Normal operation</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Memory Usage</h4>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold mb-1">{systemMetrics.memoryUsage}%</div>
                          <div className="text-sm text-muted-foreground">Good performance</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Response Time</h4>
                            <div className="flex items-center gap-1 text-blue-600">
                              <Activity className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="text-2xl font-bold mb-1">{systemMetrics.responseTime}ms</div>
                          <div className="text-sm text-muted-foreground">Server response</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === "communications" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Central de Comunicação</CardTitle>
                  <Dialog open={isCreateNotificationOpen} onOpenChange={setIsCreateNotificationOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Informativo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Enviar Informativo por E-mail</DialogTitle>
                      </DialogHeader>
                      <NotificationFormComponent 
                        onClose={() => setIsCreateNotificationOpen(false)} 
                        tenants={tenants as any[]} 
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Envie informativos e comunicados importantes para usuários da plataforma por e-mail.
                    </div>
                    
                    {/* Recent Notifications */}
                    <div className="border rounded-lg">
                      <div className="bg-muted/50 px-4 py-2 border-b">
                        <h3 className="font-medium">Informativos Recentes</h3>
                      </div>
                      <div className="p-4">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        ) : notifications && (notifications as any[]).length > 0 ? (
                          <div className="space-y-3">
                            {(notifications as any[]).slice(0, 5).map((notification: any) => (
                              <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{notification.title}</h4>
                                    <Badge 
                                      variant={
                                        notification.status === 'completed' ? 'default' :
                                        notification.status === 'sending' ? 'secondary' :
                                        notification.status === 'failed' ? 'destructive' : 'outline'
                                      }
                                    >
                                      {notification.status === 'completed' ? 'Enviado' :
                                       notification.status === 'sending' ? 'Enviando' :
                                       notification.status === 'failed' ? 'Falha' : 'Pendente'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message.length > 100 
                                      ? `${notification.message.substring(0, 100)}...` 
                                      : notification.message}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Tipo: {
                                      notification.recipientType === 'all' ? 'Todos os usuários' :
                                      notification.recipientType === 'specific' ? 'Usuários específicos' :
                                      notification.recipientType === 'tenant' ? 'Usuários de loja específica' : 
                                      notification.recipientType
                                    }</span>
                                    {notification.sentCount > 0 && (
                                      <span>Enviados: {notification.sentCount}</span>
                                    )}
                                    {notification.failedCount > 0 && (
                                      <span className="text-red-600">Falhas: {notification.failedCount}</span>
                                    )}
                                    <span>Criado: {new Date(notification.createdAt).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Nenhum informativo enviado ainda
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Platform Settings Tab */}
          {activeTab === "platform-settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Configurações da Plataforma</h1>
                  <p className="text-muted-foreground">
                    Configure recursos, manutenção e configurações globais da plataforma
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                {/* Platform Settings Navigation - Vertical Sidebar */}
                <div className="w-64 shrink-0">
                  <nav className="space-y-2">
                    {[
                      { id: 'general', label: 'Geral', icon: Settings },
                      { id: 'email', label: 'E-mail', icon: Mail },
                      { id: 'payment', label: 'Pagamentos', icon: CreditCard },
                      { id: 'security', label: 'Segurança', icon: Shield },
                      { id: 'tax', label: 'Impostos', icon: Calculator },
                      { id: 'integrations', label: 'Integrações', icon: Link },
                      { id: 'notifications', label: 'Notificações', icon: Bell },
                      { id: 'features', label: 'Recursos', icon: Zap },
                      { id: 'maintenance', label: 'Manutenção', icon: Wrench }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActivePlatformTab(tab.id)}
                          className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg font-medium text-sm transition-colors ${
                            activePlatformTab === tab.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Platform Settings Content */}
                <div className="flex-1">
                  <PlatformSettingsContent activeTab={activePlatformTab} />
                </div>
              </div>
            </div>
          )}

          {/* User Profile Tab */}
          {activeTab === "user-profile" && (
            <div className="space-y-6">
              <UserProfileManagement currentUser={currentUser} />
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              {/* System Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemStatus?.services?.map((service: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'operational' ? 'bg-green-500' :
                        service.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${
                        service.status === 'operational' ? 'text-green-600' :
                        service.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {service.status === 'operational' ? 'Online' :
                         service.status === 'maintenance' ? 'Manutenção' : 'Offline'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {service.uptime} - {service.responseTime}
                      </p>
                    </CardContent>
                  </Card>
                )) || Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-400">---</div>
                      <p className="text-xs text-muted-foreground">Aguardando dados</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Métricas em Tempo Real
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">CPU</span>
                            <span className="text-sm text-muted-foreground">
                              {systemMetrics?.cpuUsage ? `${systemMetrics.cpuUsage}%` : '---'}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: systemMetrics?.cpuUsage ? `${systemMetrics.cpuUsage}%` : '0%'
                              }} 
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Memória</span>
                            <span className="text-sm text-muted-foreground">
                              {systemMetrics?.memoryUsage ? `${systemMetrics.memoryUsage}%` : '---'}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: systemMetrics?.memoryUsage ? `${systemMetrics.memoryUsage}%` : '0%'
                              }} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Disco</span>
                            <span className="text-sm text-muted-foreground">45%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Rede</span>
                            <span className="text-sm text-muted-foreground">12%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '12%' }} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-muted-foreground">Requests/min</div>
                            <div className="text-2xl font-bold">847</div>
                          </div>
                          <div>
                            <div className="font-medium text-muted-foreground">Latência média</div>
                            <div className="text-2xl font-bold">89ms</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Status dos Serviços
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: 'API Gateway', status: 'online', uptime: '99.9%', lastCheck: '30s' },
                        { name: 'Database PostgreSQL', status: 'online', uptime: '99.8%', lastCheck: '45s' },
                        { name: 'Email Service', status: 'online', uptime: '98.5%', lastCheck: '60s' },
                        { name: 'File Storage', status: 'online', uptime: '99.7%', lastCheck: '25s' },
                        { name: 'Cache Redis', status: 'online', uptime: '99.9%', lastCheck: '15s' },
                        { name: 'WebSocket Server', status: 'online', uptime: '99.6%', lastCheck: '20s' }
                      ].map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              service.status === 'online' ? 'bg-green-500' : 
                              service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Uptime: {service.uptime} • Último check: {service.lastCheck}
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            service.status === 'online' ? 'default' : 
                            service.status === 'warning' ? 'secondary' : 'destructive'
                          }>
                            {service.status === 'online' ? 'Online' : 
                             service.status === 'warning' ? 'Atenção' : 'Offline'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Database Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Métricas do Banco de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{adminStats.totalTenants}</div>
                      <p className="text-sm text-muted-foreground">Total de Lojas</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{adminStats.totalUsers}</div>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{adminStats.totalOrders}</div>
                      <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">2.1GB</div>
                      <p className="text-sm text-muted-foreground">Tamanho do DB</p>
                    </div>
                  </div>
                  
                  {databasePerformance && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Conexões Ativas</span>
                            <span className="text-2xl font-bold">
                              {databasePerformance.connectionStats?.reduce((sum: number, stat: any) => sum + stat.connection_count, 0) || 0}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">Estado das conexões</div>
                        </div>
                        
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Queries Lentas</span>
                            <span className="text-2xl font-bold">
                              {databasePerformance.queryPerformance?.length || 0}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">Últimas 24h</div>
                        </div>
                        
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Tamanho DB</span>
                            <span className="text-2xl font-bold">
                              {databasePerformance.totalSize || '---'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">Espaço utilizado</div>
                        </div>
                      </div>

                      {databasePerformance.queryPerformance?.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-3">Top Queries (Tempo de Execução)</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {databasePerformance.queryPerformance.slice(0, 5).map((query: any, index: number) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">
                                    Query #{index + 1}
                                  </span>
                                  <Badge variant="outline">
                                    {Math.round(query.mean_exec_time)}ms avg
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                  {query.query?.substring(0, 80)}...
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Calls: {query.calls} | Total: {Math.round(query.total_exec_time)}ms
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Logs do Sistema em Tempo Real
                  </CardTitle>
                  <CardDescription>
                    Últimas atividades e eventos do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {securityLogs?.map((log: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          log.event_type === 'login_success' ? 'bg-green-500' :
                          log.event_type === 'login_failed' ? 'bg-red-500' :
                          log.event_type === 'suspicious_activity' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                            </span>
                            <Badge variant={
                              log.event_type === 'login_success' ? 'default' :
                              log.event_type === 'login_failed' ? 'destructive' :
                              log.event_type === 'suspicious_activity' ? 'secondary' : 'outline'
                            }>
                              {log.event_type?.toUpperCase().replace('_', ' ') || 'INFO'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {log.ip_address || 'Sistema'}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{log.description || 'Evento de segurança detectado'}</p>
                          {log.user_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Usuário ID: {log.user_id}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Atualizando em tempo real • Última atualização: {new Date().toLocaleTimeString()}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Logs
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance da Plataforma (Últimas 24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Tempo de Resposta da API</h4>
                      <div className="h-32 flex items-end justify-between space-x-1">
                        {Array.from({ length: 24 }, (_, i) => {
                          const height = Math.random() * 80 + 20;
                          return (
                            <div key={i} className="bg-blue-500 rounded-t flex-1 relative group">
                              <div 
                                className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                                style={{ height: `${height}px` }}
                              />
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {Math.round(height + 50)}ms
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:59</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Uso de CPU (%)</h4>
                      <div className="h-32 flex items-end justify-between space-x-1">
                        {Array.from({ length: 24 }, (_, i) => {
                          const height = Math.random() * 70 + 10;
                          return (
                            <div key={i} className="bg-green-500 rounded-t flex-1 relative group">
                              <div 
                                className="bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                                style={{ height: `${height}px` }}
                              />
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {Math.round(height)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:59</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="font-medium">Cache Redis com alta utilização</div>
                        <div className="text-sm text-muted-foreground">85% de uso de memória • Considere aumentar o limite</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
                      <Info className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Backup automático agendado</div>
                        <div className="text-sm text-muted-foreground">Próximo backup em 2 horas • Backup diário às 02:00</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium">Todos os serviços operacionais</div>
                        <div className="text-sm text-muted-foreground">Sistema funcionando perfeitamente • SLA de 99.9% mantido</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              <FinancialManagement />
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
      
      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal 
        subscription={selectedSubscription}
        isOpen={isViewSubscriptionOpen}
        onClose={() => setIsViewSubscriptionOpen(false)}
      />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal 
        subscription={selectedSubscription}
        isOpen={isEditSubscriptionOpen}
        onClose={() => setIsEditSubscriptionOpen(false)}
        onSave={handleUpdateSubscription}
      />
    </div>
  );
}

// Tenant Details View Component
function TenantDetailsView({ 
  tenant, 
  setSelectedTenant, 
  setActiveTab 
}: { 
  tenant: Tenant;
  setSelectedTenant: (tenant: Tenant | null) => void;
  setActiveTab: (tab: string) => void;
}) {
  const [activeStoreTab, setActiveStoreTab] = useState('overview');
  const { data: tenantDetails, isLoading } = useQuery({
    queryKey: [`/api/admin/tenants/${tenant.id}/details`],
    enabled: !!tenant.id,
  });

  // Use real data from API or fallback to tenant data
  const metrics = (tenantDetails as any)?.metrics || {
    totalRevenue: tenant.monthlyRevenue || '0.00',
    monthlyRevenue: tenant.monthlyRevenue || '0.00',
    totalOrders: tenant.totalOrders || 0,
    activeProducts: 0,
    customers: 0,
    averageOrderValue: '0.00',
    conversionRate: '0.0%',
    lastActivity: new Date().toLocaleDateString('pt-BR')
  };

  const recentOrders = (tenantDetails as any)?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveStoreTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeStoreTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveStoreTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeStoreTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Configurações da Loja
          </button>
          <button
            onClick={() => setActiveStoreTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeStoreTab === 'reports'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Relatórios Detalhados
          </button>
          <button
            onClick={() => setActiveStoreTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeStoreTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Gerenciar Produtos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeStoreTab === 'overview' && (
        <div className="space-y-6">
      {/* Store Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informações da Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Subdomínio</Label>
                <p className="font-medium">{tenant.subdomain}.wikistore.com</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                <p className="font-medium">{tenant.category}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Pessoa de Contato</Label>
                <p className="font-medium">{tenant.contactPerson}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{tenant.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{tenant.phone}</span>
              </div>
              {tenant.cnpj && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>CNPJ: {tenant.cnpj}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Criado em: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`https://${tenant.subdomain}.wikistore.com`} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Visitar Loja
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Configurações da Loja
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatórios Detalhados
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Gerenciar Produtos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-lg font-bold">{formatCurrency(metrics.monthlyRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-lg font-bold">{metrics.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-lg font-bold">{metrics.customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-bold">R$ {metrics.averageOrderValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">{metrics.activeProducts}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Última Atividade</p>
                <p className="text-2xl font-bold text-sm">{new Date(metrics.lastActivity).toLocaleDateString('pt-BR')}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.length > 0 ? recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">#{order.id} • {order.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.value}</p>
                  <Badge variant={
                    order.status === 'Entregue' ? 'default' :
                    order.status === 'Enviado' ? 'secondary' : 'outline'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center p-6 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado para esta loja</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full">
              Ver Todos os Pedidos
            </Button>
          </div>
        </CardContent>
      </Card>

        </div>
      )}

      {/* Store Settings Tab */}
      {activeStoreTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Loja</Label>
                  <Input value={tenant.name} readOnly />
                </div>
                <div>
                  <Label>Subdomínio</Label>
                  <Input value={tenant.subdomain} readOnly />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input value={tenant.category || 'Não definida'} readOnly />
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
                    {tenant.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tema Ativo</Label>
                  <Input value={tenant.activeTheme || 'Padrão'} readOnly />
                </div>
                <div>
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: tenant.primaryColor || '#0ea5e9' }}
                    />
                    <Input value={tenant.primaryColor || '#0ea5e9'} readOnly />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store Reports Tab */}
      {activeStoreTab === 'reports' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios da Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Métricas de Performance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Receita Total:</span>
                      <span className="font-bold">R$ {metrics.totalRevenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de Pedidos:</span>
                      <span className="font-bold">{metrics.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produtos Ativos:</span>
                      <span className="font-bold">{metrics.activeProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes:</span>
                      <span className="font-bold">{metrics.customers}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Análise de Conversão</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ticket Médio:</span>
                      <span className="font-bold">R$ {metrics.averageOrderValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Conversão:</span>
                      <span className="font-bold">{metrics.conversionRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última Atividade:</span>
                      <span className="font-bold">{new Date(metrics.lastActivity).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Store Products Tab */}
      {activeStoreTab === 'products' && (
        <StoreProductsTab tenantId={tenant.id} activeProducts={metrics.activeProducts} />
      )}
    </div>
  );
}

// Store Products Tab Component
function StoreProductsTab({ tenantId, activeProducts }: { tenantId: number; activeProducts: number }) {
  const { data: products, isLoading } = useQuery({
    queryKey: [`/api/products/${tenantId}`],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Carregando produtos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Produtos da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Produtos Ativos: {activeProducts}</h3>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
            
            {products && (products as any[]).length > 0 ? (
              <div className="space-y-4">
                {(products as any[]).slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque: {product.stock} • Preço: R$ {parseFloat(product.price || '0').toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Ver Todos os Produtos
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado para esta loja</p>
                <p className="text-sm">Adicione produtos para começar a vender</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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

// Subscription Details Modal Component
function SubscriptionDetailsModal({ 
  subscription, 
  isOpen, 
  onClose 
}: { 
  subscription: any; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Assinatura</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Loja</Label>
              <p className="text-sm">{subscription.tenant_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">ID do Tenant</Label>
              <p className="text-sm">{subscription.tenant_id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Plano</Label>
              <p className="text-sm">{subscription.plan_name || 'Plugin Individual'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Ciclo de Cobrança</Label>
              <p className="text-sm">{subscription.billing_cycle}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Atual</Label>
              <p className="text-sm">R$ {Number(subscription.current_price || 0).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Próxima Cobrança</Label>
              <p className="text-sm">
                {subscription.next_billing_date ? 
                  new Date(subscription.next_billing_date).toLocaleDateString('pt-BR') : 
                  'N/A'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Auto Renovar</Label>
              <p className="text-sm">{subscription.auto_renew ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          {subscription.notes && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
              <p className="text-sm bg-muted p-3 rounded">{subscription.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Subscription Modal Component
function EditSubscriptionModal({ 
  subscription, 
  isOpen, 
  onClose,
  onSave
}: { 
  subscription: any; 
  isOpen: boolean; 
  onClose: () => void;
  onSave: (updatedSubscription: any) => void;
}) {
  const [editData, setEditData] = useState({
    status: subscription?.status || 'active',
    auto_renew: subscription?.auto_renew || false,
    notes: subscription?.notes || ''
  });

  useEffect(() => {
    if (subscription) {
      setEditData({
        status: subscription.status || 'active',
        auto_renew: subscription.auto_renew || false,
        notes: subscription.notes || ''
      });
    }
  }, [subscription]);

  const handleSave = () => {
    onSave({ ...subscription, ...editData });
    onClose();
  };

  if (!subscription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Assinatura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="subscription-status">Status</Label>
            <Select 
              value={editData.status} 
              onValueChange={(value) => setEditData({...editData, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="auto-renew">Auto Renovar</Label>
            <Select 
              value={editData.auto_renew ? 'true' : 'false'} 
              onValueChange={(value) => setEditData({...editData, auto_renew: value === 'true'})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subscription-notes">Observações</Label>
            <textarea 
              id="subscription-notes"
              className="w-full p-2 border rounded"
              rows={3}
              value={editData.notes}
              onChange={(e) => setEditData({...editData, notes: e.target.value})}
              placeholder="Adicione observações sobre esta assinatura..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}