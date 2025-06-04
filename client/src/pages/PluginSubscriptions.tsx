import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ShoppingCart, 
  FileText, 
  Upload, 
  Package, 
  Instagram, 
  Search, 
  Store,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

interface Plugin {
  id: number;
  name: string;
  slug?: string;
  displayName?: string;
  description: string;
  category: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  icon: string;
  isActive: boolean;
}

interface PluginSubscription {
  id: number;
  pluginId: number;
  plugin: Plugin;
  status: 'active' | 'cancelled' | 'suspended' | 'trial';
  billingCycle: 'monthly' | 'yearly';
  subscribedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
}

const getPluginIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    'file-text': FileText,
    'upload': Upload,
    'shopping-cart': ShoppingCart,
    'store': Store,
    'package': Package,
    'instagram': Instagram,
    'search': Search,
  };
  return icons[iconName] || Package;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'nfe': 'bg-blue-100 text-blue-800',
    'import': 'bg-green-100 text-green-800',
    'marketplace': 'bg-purple-100 text-purple-800',
    'analytics': 'bg-orange-100 text-orange-800',
    'marketing': 'bg-pink-100 text-pink-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
    case 'trial':
      return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
    case 'suspended':
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Suspenso</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function PluginSubscriptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Fetch available plugins
  const { data: plugins, isLoading: pluginsLoading } = useQuery<Plugin[]>({
    queryKey: ['/api/plugins'],
  });

  // Fetch tenant subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<PluginSubscription[]>({
    queryKey: ['/api/tenant/plugin-subscriptions'],
  });

  // Subscribe to plugin
  const subscribeMutation = useMutation({
    mutationFn: async ({ pluginId, billingCycle }: { pluginId: number; billingCycle: string }) => {
      const response = await apiRequest("POST", "/api/tenant/subscribe-plugin", {
        pluginId,
        billingCycle,
      });
      if (!response.ok) throw new Error("Failed to subscribe to plugin");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plugin contratado",
        description: "Plugin ativado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/plugin-subscriptions'] });
      setSelectedPlugin(null);
      setIsSubscribing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao contratar plugin",
        variant: "destructive",
      });
      setIsSubscribing(false);
    },
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiRequest("DELETE", `/api/tenant/plugin-subscriptions/${subscriptionId}`);
      if (!response.ok) throw new Error("Failed to cancel subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assinatura cancelada",
        description: "Plugin será desativado no final do período",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/plugin-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    if (!selectedPlugin) return;
    
    setIsSubscribing(true);
    subscribeMutation.mutate({
      pluginId: selectedPlugin.id,
      billingCycle,
    });
  };

  const subscribedPluginIds = subscriptions?.map(sub => sub.pluginId) || [];
  const availablePlugins = plugins?.filter(plugin => 
    plugin.isActive && !subscribedPluginIds.includes(plugin.id)
  ) || [];

  if (pluginsLoading || subscriptionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <ShoppingCart className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Plugins e Integrações</h1>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscriptions">Minhas Assinaturas</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugins Ativos</CardTitle>
              <CardDescription>
                Gerencie suas assinaturas de plugins e integrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions && subscriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscriptions.map((subscription) => {
                    const IconComponent = getPluginIcon(subscription.plugin.icon);
                    return (
                      <Card key={subscription.id} className="relative">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <IconComponent className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{subscription.plugin.displayName || subscription.plugin.name}</h3>
                                <Badge className={getCategoryColor(subscription.plugin.category)}>
                                  {subscription.plugin.category}
                                </Badge>
                              </div>
                            </div>
                            {getStatusBadge(subscription.status)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-4">
                            {subscription.plugin.description}
                          </p>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ciclo:</span>
                              <span className="capitalize">{subscription.billingCycle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Próximo pagamento:</span>
                              <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valor:</span>
                              <span className="font-medium">
                                R$ {subscription.billingCycle === 'monthly' 
                                  ? subscription.plugin.monthlyPrice?.toFixed(2) 
                                  : subscription.plugin.yearlyPrice?.toFixed(2)}/
                                {subscription.billingCycle === 'monthly' ? 'mês' : 'ano'}
                              </span>
                            </div>
                          </div>

                          {subscription.status === 'active' && (
                            <div className="mt-4 pt-4 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-red-600 hover:text-red-700"
                                onClick={() => cancelMutation.mutate(subscription.id)}
                                disabled={cancelMutation.isPending}
                              >
                                {cancelMutation.isPending ? "Cancelando..." : "Cancelar Assinatura"}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum plugin ativo</h3>
                  <p className="text-muted-foreground mb-4">
                    Contrate plugins para expandir as funcionalidades da sua loja
                  </p>
                  <Button onClick={() => document.querySelector('[data-state="inactive"]')?.click()}>
                    Explorar Marketplace
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketplace de Plugins</CardTitle>
              <CardDescription>
                Explore e contrate novos plugins para sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlugins.map((plugin) => {
                  const IconComponent = getPluginIcon(plugin.icon);
                  return (
                    <Card key={plugin.id} className="relative overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{plugin.displayName || plugin.name}</h3>
                            <Badge className={getCategoryColor(plugin.category)}>
                              {plugin.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {plugin.description}
                        </p>

                        {plugin.features && Array.isArray(plugin.features) && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Recursos:</h4>
                            <ul className="text-xs space-y-1">
                              {plugin.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                              {plugin.features.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{plugin.features.length - 3} recursos adicionais
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Mensal:</span>
                            <span className="font-semibold">R$ {plugin.monthlyPrice?.toFixed(2)}/mês</span>
                          </div>
                          {plugin.yearlyPrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Anual:</span>
                              <div className="text-right">
                                <span className="font-semibold">R$ {plugin.yearlyPrice?.toFixed(2)}/ano</span>
                                <div className="text-xs text-green-600">
                                  Economia de {Math.round((1 - (plugin.yearlyPrice / (plugin.monthlyPrice * 12))) * 100)}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full" 
                              onClick={() => setSelectedPlugin(plugin)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Contratar Plugin
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Contratar {selectedPlugin?.displayName || selectedPlugin?.name}</DialogTitle>
                              <DialogDescription>
                                Escolha o ciclo de cobrança para sua assinatura
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedPlugin && (
                              <div className="space-y-4">
                                <div className="text-center p-4 bg-muted rounded-lg">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <IconComponent className="h-6 w-6 text-primary" />
                                    <h3 className="font-semibold">{selectedPlugin.displayName || selectedPlugin.name}</h3>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{selectedPlugin.description}</p>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium">Ciclo de cobrança:</label>
                                    <Select value={billingCycle} onValueChange={(value: 'monthly' | 'yearly') => setBillingCycle(value)}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="monthly">
                                          Mensal - R$ {selectedPlugin.monthlyPrice?.toFixed(2)}/mês
                                        </SelectItem>
                                        {selectedPlugin.yearlyPrice && (
                                          <SelectItem value="yearly">
                                            Anual - R$ {selectedPlugin.yearlyPrice?.toFixed(2)}/ano 
                                            <span className="text-green-600 ml-2">
                                              ({Math.round((1 - (selectedPlugin.yearlyPrice / (selectedPlugin.monthlyPrice * 12))) * 100)}% desconto)
                                            </span>
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">Trial de 7 dias grátis</span>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                      Teste o plugin por 7 dias antes de ser cobrado. Cancele a qualquer momento.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <DialogFooter className="flex gap-2">
                              <Button variant="outline" onClick={() => setSelectedPlugin(null)}>
                                Cancelar
                              </Button>
                              <Button 
                                onClick={handleSubscribe}
                                disabled={isSubscribing || subscribeMutation.isPending}
                              >
                                {isSubscribing || subscribeMutation.isPending ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                    Contratando...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Iniciar Trial
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {availablePlugins.length === 0 && (
                <div className="text-center py-12">
                  <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Todos os plugins já contratados</h3>
                  <p className="text-muted-foreground">
                    Você já possui todos os plugins disponíveis para sua loja
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}