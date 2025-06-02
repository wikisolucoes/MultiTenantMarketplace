import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeAuthToken } from "@/lib/auth";
import { AdminStats, Tenant } from "@/types/api";
import { 
  LayoutDashboard, 
  Store, 
  CreditCard, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from "lucide-react";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("merchants");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/tenants"],
  });

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = "/";
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card shadow-lg border-r border-border">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary">WikiStore Admin</h1>
          </div>
          <nav className="mt-6">
            <div className="px-6 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "dashboard" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("dashboard")}
              >
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "merchants" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("merchants")}
              >
                <Store className="mr-3 h-4 w-4" />
                Lojistas
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "transactions" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("transactions")}
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Transações
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${activeSection === "settings" ? "bg-accent" : ""}`}
                onClick={() => setActiveSection("settings")}
              >
                <Settings className="mr-3 h-4 w-4" />
                Configurações
              </Button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <header className="bg-card shadow-sm border-b border-border">
            <div className="px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                {activeSection === "merchants" ? "Gestão de Lojistas" : "Dashboard"}
              </h2>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-semibold">A</span>
                  </div>
                  <span className="text-foreground font-medium">Admin</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Lojas</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.totalStores || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Store className="text-blue-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="text-green-600 mr-1 h-3 w-3" />
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Volume de Transações</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(stats?.transactionVolume || "0")}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="text-green-600 mr-1 h-3 w-3" />
                    <span className="text-green-600">+8.2%</span>
                    <span className="text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita da Plataforma</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(stats?.platformRevenue || "0")}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <Users className="text-purple-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="text-green-600 mr-1 h-3 w-3" />
                    <span className="text-green-600">+15.1%</span>
                    <span className="text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Lojas Ativas</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.activeStores || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                      <Activity className="text-amber-600 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600">
                      {stats ? ((stats.activeStores / stats.totalStores) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="text-muted-foreground ml-1">taxa de atividade</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Merchants Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lojistas Recentes</CardTitle>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Input 
                        placeholder="Buscar lojistas..." 
                        className="pl-10 w-64"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Lojista
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lojista</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants?.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-muted-foreground font-medium">
                                {tenant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {tenant.subdomain}@wikistore.com
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tenant.subdomain}.wikistore.com
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={tenant.status === "active" ? "default" : "secondary"}
                            className={tenant.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : ""}
                          >
                            {tenant.status === "active" ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{tenant.category}</TableCell>
                        <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">Ver</Button>
                            <Button variant="ghost" size="sm">Editar</Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Suspender
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
