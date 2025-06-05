import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Home,
  Users,
  Store,
  BarChart3,
  Puzzle,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";

interface AdminHeaderProps {
  currentUser?: {
    id: number;
    email: string;
    fullName?: string;
    role: string;
  };
  onTabChange: (tab: string) => void;
  activeTab: string;
}

const navigationItems = [
  { id: "overview", label: "Visão Geral", icon: Home },
  { id: "tenants", label: "Lojas", icon: Store },
  { id: "users", label: "Usuários", icon: Users },
  { id: "plugins", label: "Plugins", icon: Puzzle },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "system", label: "Sistema", icon: Activity },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function AdminHeader({ currentUser, onTabChange, activeTab }: AdminHeaderProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleGoToHome = () => {
    setLocation("/");
  };

  const getUserInitials = () => {
    if (currentUser?.fullName) {
      return currentUser.fullName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser?.email?.[0]?.toUpperCase() || "A";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
      case "administrator":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">WikiStore</h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Navegação Desktop */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange(item.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Área do Usuário */}
        <div className="flex items-center gap-3">
          {/* Notificações */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={currentUser?.fullName || currentUser?.email} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentUser?.fullName || "Administrador"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email}
                  </p>
                  <div className="pt-1">
                    <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(currentUser?.role || "admin")}`}>
                      {currentUser?.role || "Admin"}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleGoToHome}>
                <Home className="mr-2 h-4 w-4" />
                <span>Ir para o Site</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Minha Conta</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu Mobile */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Expandido */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}