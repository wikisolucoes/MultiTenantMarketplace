import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Settings, 
  BarChart3, 
  Shield, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Globe
} from "lucide-react";

const credentialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  permissions: z.array(z.string()).min(1, "Selecione pelo menos uma permissão"),
  rateLimit: z.number().min(100).max(10000).default(1000),
  expiresAt: z.string().optional()
});

type CredentialFormData = z.infer<typeof credentialSchema>;

interface ApiCredential {
  id: number;
  name: string;
  apiKey: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const permissionOptions = [
  { value: "products:read", label: "Produtos - Leitura", description: "Listar e visualizar produtos" },
  { value: "products:write", label: "Produtos - Escrita", description: "Criar e editar produtos" },
  { value: "products:delete", label: "Produtos - Exclusão", description: "Deletar produtos" },
  { value: "orders:read", label: "Pedidos - Leitura", description: "Listar e visualizar pedidos" },
  { value: "orders:write", label: "Pedidos - Escrita", description: "Atualizar status de pedidos" },
  { value: "customers:read", label: "Clientes - Leitura", description: "Listar e visualizar clientes" },
  { value: "customers:write", label: "Clientes - Escrita", description: "Criar e editar clientes" },
  { value: "*", label: "Acesso Total", description: "Todas as permissões" }
];

export default function ApiCredentials() {
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [newCredential, setNewCredential] = useState<any>(null);
  const [selectedCredential, setSelectedCredential] = useState<ApiCredential | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      permissions: [],
      rateLimit: 1000
    }
  });

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["/api/merchant/credentials"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CredentialFormData) => {
      return await apiRequest("POST", "/api/merchant/credentials", data);
    },
    onSuccess: (data) => {
      setNewCredential(data);
      setShowCreateDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/credentials"] });
      toast({
        title: "Credencial criada",
        description: "API key criada com sucesso. Salve a chave secreta!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar credencial",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/merchant/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/credentials"] });
      toast({
        title: "Credencial removida",
        description: "API key removida com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover credencial",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CredentialFormData> }) => {
      return await apiRequest("PUT", `/api/merchant/credentials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/credentials"] });
      setSelectedCredential(null);
      toast({
        title: "Credencial atualizada",
        description: "API key atualizada com sucesso",
      });
    },
  });

  const onSubmit = (data: CredentialFormData) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
  };

  const getStatusBadge = (credential: ApiCredential) => {
    if (!credential.isActive) {
      return <Badge variant="destructive">Inativa</Badge>;
    }
    if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    return <Badge variant="default">Ativa</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API de Integração</h1>
          <p className="text-muted-foreground">
            Gerencie credenciais para integrar sistemas externos com sua loja
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Credencial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Credencial API</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Credencial</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sistema de Estoque" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome para identificar esta credencial
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissões</FormLabel>
                      <div className="grid grid-cols-1 gap-3">
                        {permissionOptions.map((permission) => (
                          <div key={permission.value} className="flex items-start space-x-3">
                            <Checkbox
                              checked={field.value?.includes(permission.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, permission.value]);
                                } else {
                                  field.onChange(
                                    field.value?.filter((value) => value !== permission.value)
                                  );
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {permission.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Requisições (por hora)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={10000}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Número máximo de requisições por hora (100-10000)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Expiração (opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deixe em branco para não expirar
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar Credencial"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Credential Display */}
      {newCredential && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Credencial Criada com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Importante!</span>
              </div>
              <p className="text-sm text-yellow-700">
                Esta é a única vez que a chave secreta será exibida. Salve-a em local seguro.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label>API Key (Público)</Label>
                <div className="flex items-center gap-2">
                  <Input value={newCredential.apiKey} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newCredential.apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>API Secret (Privado)</Label>
                <div className="flex items-center gap-2">
                  <Input value={newCredential.apiSecret} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(newCredential.apiSecret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setNewCredential(null)}
              className="w-full"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Documentação da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <code className="bg-muted px-2 py-1 rounded text-sm">
              https://your-domain.com/api/public/v1
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Autenticação</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use o header Authorization com Bearer token:
            </p>
            <code className="bg-muted px-2 py-1 rounded text-sm block">
              Authorization: Bearer API_KEY:API_SECRET
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Endpoints Principais</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/products</code>
                <span className="text-muted-foreground">- Listar produtos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">POST</Badge>
                <code>/products</code>
                <span className="text-muted-foreground">- Criar produto</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/orders</code>
                <span className="text-muted-foreground">- Listar pedidos</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">GET</Badge>
                <code>/customers</code>
                <span className="text-muted-foreground">- Listar clientes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials List */}
      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma credencial criada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie sua primeira credencial API para começar a integrar sistemas externos
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Credencial
              </Button>
            </CardContent>
          </Card>
        ) : (
          credentials.map((credential: ApiCredential) => (
            <Card key={credential.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5" />
                    <div>
                      <CardTitle className="text-lg">{credential.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Criado em {formatDate(credential.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(credential)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(credential.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={credential.apiKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credential.apiKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Último Uso</Label>
                    <p className="text-sm">
                      {credential.lastUsed ? formatDate(credential.lastUsed) : "Nunca usado"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Permissões</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {credential.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permissionOptions.find(p => p.value === permission)?.label || permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      <span>{credential.rateLimit}/hora</span>
                    </div>
                    {credential.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Expira em {formatDate(credential.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}