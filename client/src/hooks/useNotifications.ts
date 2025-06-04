import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

interface NotificationMessage {
  type: string;
  id?: number;
  title: string;
  message: string;
  priority: string;
  actionUrl?: string;
  timestamp: string;
}

export function useNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeNotifications, setRealtimeNotifications] = useState<NotificationMessage[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  // Fetch notifications from database
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setUnreadCount(0);
    },
  });

  // Connect to WebSocket for real-time notifications
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to notification service");
      setIsConnected(true);
      
      // Authenticate the connection (in a real app, get these from auth context)
      const authData = {
        type: "auth",
        tenantId: 5, // Demo tenant
        userId: 1,   // Demo user
        userRole: "merchant"
      };
      
      ws.send(JSON.stringify(authData));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "auth_success") {
          console.log("WebSocket authentication successful");
        } else if (data.type === "notification") {
          // Add real-time notification to state
          setRealtimeNotifications(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(data.title, {
              body: data.message,
              icon: "/favicon.ico",
              badge: "/favicon.ico"
            });
          }
          
          // Refresh notifications from database
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from notification service");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [queryClient]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  // Update unread count when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      const unread = notifications.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  return {
    notifications,
    realtimeNotifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    requestNotificationPermission,
  };
}