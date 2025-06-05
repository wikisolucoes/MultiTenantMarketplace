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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  FileBarChart,
  ArrowUpRight,
  Info,
  Puzzle,
  MoreHorizontal,
  MoreVertical,
  Code,
  User
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
    name: plugin?.name || '',
    description: plugin?.description || '',
    version: plugin?.version || '1.0.0',
    category: plugin?.category || 'pagamento',
    price: plugin?.price || 'Gratuito',
    developer: plugin?.developer || '',
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
              <SelectItem value="pagamento">Pagamento</SelectItem>
              <SelectItem value="fiscal">Fiscal</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="integracao">Integração</SelectItem>
              <SelectItem value="relatorios">Relatórios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Preço</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="R$ 29,90 ou Gratuito"
          />
        </div>
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Informações Básicas</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Nome:</span>
              <p className="font-medium">{plugin.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Versão:</span>
              <p>{plugin.version}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Categoria:</span>
              <Badge variant="outline">{plugin.category}</Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Desenvolvedor:</span>
              <p>{plugin.developer}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Estatísticas</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Instalações:</span>
              <p className="font-medium">{plugin.installations}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Preço:</span>
              <p className="font-medium">{plugin.price}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={plugin.isActive ? 'default' : 'secondary'}>
                {plugin.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Descrição</h3>
        <p className="text-sm text-muted-foreground">{plugin.description}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Configurações</h3>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">Este plugin não possui configurações específicas disponíveis.</p>
        </div>
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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
                              <Button size="sm" variant="outline">
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