import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  CheckCircle, 
  Circle, 
  Settings, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  AlertTriangle,
  Info,
  X,
  Trash2
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState("all");
  const { 
    notifications, 
    realtimeNotifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead,
    requestNotificationPermission 
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case "stock":
        return <Package className="w-4 h-4 text-orange-600" />;
      case "system":
        return <Settings className="w-4 h-4 text-gray-600" />;
      case "promotion":
        return <Info className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "normal":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "low":
        return "bg-gray-100 border-gray-300 text-gray-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead && notification.id) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const filteredNotifications = [...realtimeNotifications, ...(Array.isArray(notifications) ? notifications : [])].filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type === activeTab;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <Card className="w-96 h-full max-h-screen m-4 shadow-2xl bg-white">
        <CardHeader className="border-b bg-gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <CardTitle className="text-lg">Notificações</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-white/20 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 mt-3">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => markAllAsRead()}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Marcar Todas
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={requestNotificationPermission}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Bell className="w-3 h-3 mr-1" />
              Ativar Browser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Não Lidas
                {unreadCount > 0 && (
                  <Badge className="ml-1 bg-red-100 text-red-600 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="order" className="text-xs">Pedidos</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-2 space-y-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Nenhuma notificação encontrada</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <div
                        key={notification.id || `realtime-${index}`}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          notification.isRead === false 
                            ? "bg-cyan-50 border-cyan-200" 
                            : "bg-white border-gray-200"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {notification.priority !== "normal" && (
                                  <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                    {notification.priority === "urgent" ? "Urgente" :
                                     notification.priority === "high" ? "Alta" :
                                     notification.priority === "low" ? "Baixa" : "Normal"}
                                  </Badge>
                                )}
                                {notification.isRead === false && (
                                  <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(
                                  new Date(notification.timestamp || notification.createdAt), 
                                  { addSuffix: true, locale: ptBR }
                                )}
                              </span>
                              
                              {notification.actionUrl && (
                                <span className="text-xs text-cyan-600 font-medium">
                                  Clique para ver →
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}