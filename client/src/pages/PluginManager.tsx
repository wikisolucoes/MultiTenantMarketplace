import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  FileText, 
  Globe, 
  Instagram, 
  Package, 
  CreditCard,
  Users,
  Mail,
  BarChart3,
  Upload
} from 'lucide-react';

interface Plugin {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  features: string[];
  isActive: boolean;
  icon: string;
}

interface PluginSubscription {
  id: number;
  pluginId: number;
  tenantId: number;
  isActive: boolean;
  startDate: string;
  nextBillingDate: string;
  billingPeriod: string;
  plugin: Plugin;
}

const pluginIcons = {
  'nfe': FileText,
  'marketplace': Globe,
  'social': Instagram,
  'inventory': Package,
  'payment': CreditCard,
  'loyalty': Users,
  'email': Mail,
  'analytics': BarChart3,
  'import': Upload,
  'default': ShoppingCart
};

export default function PluginManager() {
  const { toast } = useToast();
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);

  const { data: plugins = [], isLoading: pluginsLoading } = useQuery({
    queryKey: ['/api/plugins'],
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/tenant/1/plugin-subscriptions'], // Default tenant for demo
    enabled: !!selectedTenant,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ tenantId, pluginId }: { tenantId: number; pluginId: number }) => {
      return apiRequest('POST', `/api/tenant/${tenantId}/subscribe-plugin`, {
        pluginId,
        billingPeriod: 'monthly'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Plugin Subscribed',
        description: 'Plugin has been successfully activated for your store.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/1/plugin-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to subscribe to plugin',
        variant: 'destructive',
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async ({ tenantId, pluginId }: { tenantId: number; pluginId: number }) => {
      return apiRequest('DELETE', `/api/tenant/${tenantId}/unsubscribe-plugin/${pluginId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Plugin Unsubscribed',
        description: 'Plugin has been deactivated from your store.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/1/plugin-subscriptions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Unsubscription Failed',
        description: error.message || 'Failed to unsubscribe from plugin',
        variant: 'destructive',
      });
    },
  });

  const getPluginIcon = (iconName: string) => {
    const IconComponent = pluginIcons[iconName as keyof typeof pluginIcons] || pluginIcons.default;
    return <IconComponent className="h-6 w-6" />;
  };

  const isPluginSubscribed = (pluginId: number) => {
    return subscriptions.some((sub: PluginSubscription) => 
      sub.pluginId === pluginId && sub.isActive
    );
  };

  const handleSubscribe = (pluginId: number) => {
    subscribeMutation.mutate({ tenantId: 1, pluginId }); // Default tenant for demo
  };

  const handleUnsubscribe = (pluginId: number) => {
    unsubscribeMutation.mutate({ tenantId: 1, pluginId }); // Default tenant for demo
  };

  // Sample plugin data for Brazilian e-commerce
  const samplePlugins: Plugin[] = [
    {
      id: 1,
      name: 'Nota Fiscal Eletrônica (NF-e)',
      description: 'Sistema completo de emissão de notas fiscais eletrônicas em conformidade com a legislação brasileira.',
      price: '89.90',
      category: 'tax',
      features: ['Emissão automática de NF-e', 'Integração com SEFAZ', 'Cancelamento e correção', 'Relatórios fiscais'],
      isActive: true,
      icon: 'nfe'
    },
    {
      id: 2,
      name: 'Integração Mercado Livre',
      description: 'Sincronize produtos, preços e estoque automaticamente com o Mercado Livre.',
      price: '49.90',
      category: 'marketplace',
      features: ['Sincronização automática', 'Gestão de pedidos', 'Controle de estoque', 'Pricing dinâmico'],
      isActive: true,
      icon: 'marketplace'
    },
    {
      id: 3,
      name: 'Instagram Shopping',
      description: 'Conecte sua loja ao Instagram e venda diretamente nas redes sociais.',
      price: '39.90',
      category: 'social',
      features: ['Catálogo automático', 'Tags de produtos', 'Stories shopping', 'Analytics'],
      isActive: true,
      icon: 'social'
    },
    {
      id: 4,
      name: 'Importação XML',
      description: 'Importe produtos e atualize estoque através de arquivos XML de fornecedores.',
      price: '29.90',
      category: 'import',
      features: ['Upload de XML', 'Mapeamento automático', 'Validação de dados', 'Histórico de importações'],
      isActive: true,
      icon: 'import'
    },
    {
      id: 5,
      name: 'Amazon Marketplace',
      description: 'Expanda suas vendas para a Amazon com sincronização completa.',
      price: '69.90',
      category: 'marketplace',
      features: ['Sincronização FBA', 'Gestão multicanal', 'Relatórios avançados', 'Suporte FBM'],
      isActive: true,
      icon: 'marketplace'
    },
    {
      id: 6,
      name: 'Google Shopping',
      description: 'Anuncie seus produtos no Google Shopping e Google Ads.',
      price: '59.90',
      category: 'marketing',
      features: ['Feed automático', 'Campanhas inteligentes', 'Métricas de performance', 'Otimização de anúncios'],
      isActive: true,
      icon: 'analytics'
    }
  ];

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayPlugins = plugins.length > 0 ? plugins : samplePlugins;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plugin Manager</h1>
        <p className="text-muted-foreground">
          Enhance your store with powerful plugins and integrations
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Plugins</TabsTrigger>
          <TabsTrigger value="subscribed">My Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPlugins.map((plugin: Plugin) => (
              <Card key={plugin.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getPluginIcon(plugin.icon)}
                    <div>
                      <CardTitle className="text-lg">{plugin.name}</CardTitle>
                      <CardDescription>R$ {plugin.price}/mês</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4">
                    {plugin.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-sm">Recursos inclusos:</h4>
                    <ul className="space-y-1">
                      {plugin.features.map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    {isPluginSubscribed(plugin.id) ? (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="w-full justify-center">
                          Ativo
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUnsubscribe(plugin.id)}
                          disabled={unsubscribeMutation.isPending}
                        >
                          Cancelar Assinatura
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(plugin.id)}
                        disabled={subscribeMutation.isPending}
                      >
                        Assinar Plugin
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribed" className="space-y-4">
          {subscriptionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : subscriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma assinatura ativa</h3>
                <p className="text-muted-foreground text-center">
                  Você ainda não possui plugins ativos. Explore nossa galeria de plugins para expandir as funcionalidades da sua loja.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription: PluginSubscription) => (
                <Card key={subscription.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {getPluginIcon(subscription.plugin.icon)}
                      <div>
                        <CardTitle className="text-lg">{subscription.plugin.name}</CardTitle>
                        <CardDescription>
                          Próxima cobrança: {new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge variant={subscription.isActive ? "default" : "secondary"}>
                          {subscription.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Valor mensal:</span>
                        <span className="font-medium">R$ {subscription.plugin.price}</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleUnsubscribe(subscription.pluginId)}
                        disabled={unsubscribeMutation.isPending}
                      >
                        Cancelar Assinatura
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}