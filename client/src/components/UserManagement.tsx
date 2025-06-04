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
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users,
  UserPlus,
  Settings,
  Shield,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";

const userPermissionSchema = z.object({
  canManageProducts: z.boolean().default(false),
  canManageOrders: z.boolean().default(false),
  canViewFinancials: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canManageSettings: z.boolean().default(false),
  canManageThemes: z.boolean().default(false),
  canManageBanners: z.boolean().default(false),
  canAccessSupport: z.boolean().default(true),
});

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  document: z.string().min(11, "Documento inválido"),
  documentType: z.enum(["cpf", "cnpj"]),
  phone: z.string().optional(),
  role: z.enum(["admin", "merchant"]).default("merchant"),
  jobTitle: z.string().optional(),
  accessLevel: z.enum(["full", "limited", "readonly"]).default("limited"),
  permissions: userPermissionSchema,
});

type CreateUserData = z.infer<typeof createUserSchema>;
type UserPermissions = z.infer<typeof userPermissionSchema>;

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  profile?: {
    accessLevel: string;
    jobTitle?: string;
    canManageProducts: boolean;
    canManageOrders: boolean;
    canViewFinancials: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
    canManageThemes: boolean;
    canManageBanners: boolean;
    canAccessSupport: boolean;
  };
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      fullName: "",
      document: "",
      documentType: "cpf",
      phone: "",
      role: "merchant",
      jobTitle: "",
      accessLevel: "limited",
      permissions: {
        canManageProducts: false,
        canManageOrders: false,
        canViewFinancials: false,
        canManageUsers: false,
        canManageSettings: false,
        canManageThemes: false,
        canManageBanners: false,
        canAccessSupport: true,
      },
    },
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateForm(false);
      createUserForm.reset();
      toast({
        title: "Usuário criado",
        description: "Usuário criado com sucesso",
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

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number; permissions: Partial<UserPermissions> }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/permissions`, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Permissões atualizadas",
        description: "Permissões do usuário foram atualizadas",
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

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("PATCH", `/api/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário desativado",
        description: "Usuário foi desativado com sucesso",
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

  const handleCreateUser = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const handlePermissionChange = (userId: number, permission: keyof UserPermissions, value: boolean) => {
    updatePermissionsMutation.mutate({
      userId,
      permissions: { [permission]: value }
    });
  };

  const handleDeactivateUser = (userId: number) => {
    if (confirm("Tem certeza que deseja desativar este usuário?")) {
      deactivateUserMutation.mutate(userId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { variant: "default" as const, label: "Administrador" },
      merchant: { variant: "secondary" as const, label: "Lojista" },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      variant: "secondary" as const,
      label: role,
    };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getAccessLevelBadge = (level: string) => {
    const levelConfig = {
      full: { variant: "default" as const, label: "Completo" },
      limited: { variant: "secondary" as const, label: "Limitado" },
      readonly: { variant: "outline" as const, label: "Somente Leitura" },
    };

    const config = levelConfig[level as keyof typeof levelConfig] || {
      variant: "secondary" as const,
      label: level,
    };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">Gerencie usuários e suas permissões</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando usuários...</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Nível de Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Login</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.profile ? getAccessLevelBadge(user.profile.accessLevel) : "-"}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Nunca"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.isActive && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeactivateUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Permissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users.map((user: User) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold">{user.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        {getRoleBadge(user.role)}
                        {user.profile && getAccessLevelBadge(user.profile.accessLevel)}
                      </div>
                    </div>
                    
                    {user.profile && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Gerenciar Produtos</label>
                          <Switch
                            checked={user.profile.canManageProducts}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageProducts", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Gerenciar Pedidos</label>
                          <Switch
                            checked={user.profile.canManageOrders}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageOrders", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Ver Financeiro</label>
                          <Switch
                            checked={user.profile.canViewFinancials}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canViewFinancials", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Gerenciar Usuários</label>
                          <Switch
                            checked={user.profile.canManageUsers}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageUsers", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Configurações</label>
                          <Switch
                            checked={user.profile.canManageSettings}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageSettings", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Gerenciar Temas</label>
                          <Switch
                            checked={user.profile.canManageThemes}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageThemes", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Gerenciar Banners</label>
                          <Switch
                            checked={user.profile.canManageBanners}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canManageBanners", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Acesso ao Suporte</label>
                          <Switch
                            checked={user.profile.canAccessSupport}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(user.id, "canAccessSupport", checked)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p>Log de atividades em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documento</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF ou CNPJ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Cargo ou função" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="merchant">Lojista</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createUserForm.control}
                  name="accessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Acesso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="limited">Limitado</SelectItem>
                          <SelectItem value="full">Completo</SelectItem>
                          <SelectItem value="readonly">Somente Leitura</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Permissões</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageProducts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Gerenciar Produtos</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageOrders"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Gerenciar Pedidos</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canViewFinancials"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Ver Financeiro</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageUsers"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Gerenciar Usuários</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageSettings"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Configurações</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageThemes"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Gerenciar Temas</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canManageBanners"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Gerenciar Banners</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="permissions.canAccessSupport"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Acesso ao Suporte</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}