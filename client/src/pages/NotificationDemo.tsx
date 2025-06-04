import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import NotificationBell from "@/components/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Bell, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  AlertTriangle,
  Settings,
  Zap,
  CheckCircle
} from "lucide-react";

export default function NotificationDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, unreadCount } = useNotifications();

  const sendTestNotification = async (type: string, title: string, message: string, priority: string = "normal") => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/demo/notification", {
        type,
        title,
        message,
        priority
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes = [
    {
      type: "order",
      title: "Novo Pedido",
      message: "Pedido #12345 recebido no valor de R$ 299,99",
      priority: "high",
      icon: ShoppingCart,
      color: "bg-blue-500"
    },
    {
      type: "payment",
      title: "Pagamento Aprovado",
      message: "Pagamento de R$ 150,00 foi processado com sucesso",
      priority: "normal",
      icon: CreditCard,
      color: "bg-green-500"
    },
    {
      type: "stock",
      title: "Estoque Baixo",
      message: "Produto 'Tênis Nike' está com apenas 3 unidades",
      priority: "high",
      icon: Package,
      color: "bg-orange-500"
    },
    {
      type: "system",
      title: "Backup Concluído",
      message: "Backup automático dos dados foi realizado",
      priority: "low",
      icon: Settings,
      color: "bg-gray-500"
    },
    {
      type: "promotion",
      title: "Promoção Ativa",
      message: "Black Friday: 50% OFF em todos os produtos",
      priority: "normal",
      icon: AlertTriangle,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen gradient-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de Notificações em Tempo Real
            </h1>
            <p className="text-gray-600">
              Demonstração do sistema WebSocket para notificações instantâneas
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Zap className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Conexão WebSocket</h3>
                  <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Ativa e funcionando' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notificações Não Lidas</h3>
                  <p className="text-sm text-blue-600">
                    {unreadCount} notificações pendentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-purple-100">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sistema Operacional</h3>
                  <p className="text-sm text-purple-600">
                    Todos os serviços ativos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Testar Notificações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notificationTypes.map((notification, index) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${notification.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                        <IconComponent className={`w-4 h-4 ${notification.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        <Badge 
                          className={`text-xs ${
                            notification.priority === "high" ? "bg-red-100 text-red-600" :
                            notification.priority === "low" ? "bg-gray-100 text-gray-600" :
                            "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {notification.priority === "high" ? "Alta" :
                           notification.priority === "low" ? "Baixa" : "Normal"}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {notification.message}
                    </p>
                    
                    <Button
                      size="sm"
                      className="w-full gradient-primary hover:gradient-hover text-white"
                      onClick={() => sendTestNotification(
                        notification.type,
                        notification.title,
                        notification.message,
                        notification.priority
                      )}
                      disabled={isLoading || !isConnected}
                    >
                      {isLoading ? "Enviando..." : "Enviar Notificação"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">1</div>
                <div>
                  <strong>Conexão WebSocket:</strong> O sistema conecta automaticamente ao servidor WebSocket quando a página carrega.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">2</div>
                <div>
                  <strong>Sino de Notificações:</strong> Clique no sino no canto superior direito para ver todas as notificações.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">3</div>
                <div>
                  <strong>Testar Sistema:</strong> Use os botões acima para enviar diferentes tipos de notificações em tempo real.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">4</div>
                <div>
                  <strong>Notificações Browser:</strong> Clique em "Ativar Browser" no painel de notificações para receber alertas nativos do navegador.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}