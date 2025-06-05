import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  FileText, Download, TrendingUp, DollarSign, Package, Users, 
  Calendar as CalendarIcon, Filter, Eye, Printer, Mail, 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  FileBarChart, Receipt, CreditCard, Truck, MapPin, Clock,
  Target, Award, AlertTriangle, CheckCircle, Activity
} from "lucide-react";
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

interface ReportFilters {
  dateRange: { from: Date; to: Date };
  period: string;
  category: string;
  status: string;
  customer: string;
  product: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: Date) => {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState("financial");
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    period: "30days",
    category: "all",
    status: "all",
    customer: "all",
    product: "all"
  });

  // Query para dados dos relatórios
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['/api/reports', filters],
    enabled: true
  });

  // Use authentic database data from API
  const financialData = (reportsData as any)?.financialData || [];
  const salesData = (reportsData as any)?.salesData || [];
  const customersData = (reportsData as any)?.customersData || [];
  const inventoryData = (reportsData as any)?.inventoryData || [];
  const summary = (reportsData as any)?.summary || { totalOrders: 0, totalRevenue: '0.00', averageOrderValue: '0.00', conversionRate: '0.0' };

  // Use authentic customer segmentation from database
  const customerSegmentData = customersData.slice(0, 3).map((customer: any, index: number) => ({
    segment: index === 0 ? 'Top Cliente' : index === 1 ? 'Cliente Ativo' : 'Cliente Regular',
    quantidade: customer.pedidos || 0,
    percentual: Math.round((customer.total / (summary.totalRevenue || 1)) * 100) || 0
  }));

  // Use authentic stock data from database
  const stockData = inventoryData.map((item: any) => ({
    product: item.product || 'Produto',
    estoque: item.estoque || 0,
    status: item.estoque < 10 ? 'critico' : item.estoque < 50 ? 'baixo' : item.estoque < 100 ? 'ok' : 'alto'
  }));

  const handlePeriodChange = (period: string) => {
    let from, to;
    const now = new Date();

    switch (period) {
      case '7days':
        from = subDays(now, 7);
        to = now;
        break;
      case '30days':
        from = subDays(now, 30);
        to = now;
        break;
      case '90days':
        from = subDays(now, 90);
        to = now;
        break;
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'lastYear':
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      default:
        from = subDays(now, 30);
        to = now;
    }

    setFilters(prev => ({
      ...prev,
      period,
      dateRange: { from, to }
    }));
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implementar exportação de relatórios
    console.log(`Exportando relatório em formato ${format}`);
  };

  const sendReport = () => {
    // Implementar envio de relatório por email
    console.log('Enviando relatório por email');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análises detalhadas e insights do seu negócio
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={sendReport}>
            <Mail className="w-4 h-4 mr-2" />
            Enviar por Email
          </Button>
          <Select onValueChange={(value) => exportReport(value as any)}>
            <SelectTrigger className="w-40">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={filters.period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="90days">Últimos 90 dias</SelectItem>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="thisYear">Este ano</SelectItem>
                  <SelectItem value="lastYear">Ano passado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="electronics">Eletrônicos</SelectItem>
                  <SelectItem value="clothing">Roupas</SelectItem>
                  <SelectItem value="accessories">Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={format(filters.dateRange.from, 'yyyy-MM-dd')}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, from: new Date(e.target.value) }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={format(filters.dateRange.to, 'yyyy-MM-dd')}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, to: new Date(e.target.value) }
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Fiscal/Contábil
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Operacional
          </TabsTrigger>
        </TabsList>

        {/* Relatórios Financeiros */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 127.435,80</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +12.5% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Lucro Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">R$ 68.500,00</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +8.3% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R$ 58.935,80</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +5.1% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Margem de Lucro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">53.8%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  -1.2% vs período anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="receita" stackId="1" stroke="#06b6d4" fill="#06b6d4" />
                  <Area type="monotone" dataKey="despesas" stackId="2" stroke="#ef4444" fill="#ef4444" />
                  <Area type="monotone" dataKey="lucro" stackId="3" stroke="#10b981" fill="#10b981" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receita" fill="#10b981" />
                    <Bar dataKey="despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Custos de Produtos</span>
                    <span className="font-bold">R$ 32.450,00 (55%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Marketing</span>
                    <span className="font-bold">R$ 12.340,00 (21%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Operacional</span>
                    <span className="font-bold">R$ 8.920,00 (15%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Logística</span>
                    <span className="font-bold">R$ 5.225,80 (9%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios de Vendas */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalOrders}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pedidos processados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.averageOrderValue))}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Valor médio por pedido
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.conversionRate}%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pedidos completados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(parseFloat(summary.totalRevenue))}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Faturamento acumulado
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.vendas} vendas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.receita)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vendas por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Loja Online', value: 65, color: '#06b6d4' },
                        { name: 'Marketplace', value: 25, color: '#8b5cf6' },
                        { name: 'Redes Sociais', value: 10, color: '#f59e0b' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {[
                        { name: 'Loja Online', value: 65, color: '#06b6d4' },
                        { name: 'Marketplace', value: 25, color: '#8b5cf6' },
                        { name: 'Redes Sociais', value: 10, color: '#f59e0b' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios de Estoque */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Produtos em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.847</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  -156 desde último mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Valor do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 184.925,00</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +3.2% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Giro de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2x</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Por ano
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Produtos Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">23</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Precisam reposição
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status do Estoque por Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'critico' ? 'bg-red-500' :
                        item.status === 'baixo' ? 'bg-orange-500' :
                        item.status === 'ok' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="font-medium">{item.product}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">{item.estoque}</span>
                      <Badge variant={
                        item.status === 'critico' ? 'destructive' :
                        item.status === 'baixo' ? 'default' :
                        item.status === 'ok' ? 'secondary' : 'outline'
                      }>
                        {item.status === 'critico' ? 'Crítico' :
                         item.status === 'baixo' ? 'Baixo' :
                         item.status === 'ok' ? 'OK' : 'Alto'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios de Clientes */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.934</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +234 novos este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Clientes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.421</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  38.3% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">LTV Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 485,60</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lifetime Value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Taxa de Retenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67.8%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +2.1% vs mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Segmentação de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="quantidade"
                      label={({ segment, percentual }) => `${segment}: ${percentual}%`}
                    >
                      {customerSegmentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "João Silva", pedidos: 45, valor: 4850.90 },
                    { name: "Maria Santos", pedidos: 38, valor: 3920.50 },
                    { name: "Carlos Oliveira", pedidos: 32, valor: 3456.80 },
                    { name: "Ana Costa", pedidos: 28, valor: 2987.30 },
                    { name: "Pedro Lima", pedidos: 24, valor: 2654.70 }
                  ].map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.pedidos} pedidos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(customer.valor)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total gasto</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios Fiscais/Contábeis */}
        <TabsContent value="tax" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">ICMS Recolhido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 12.347,80</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">PIS/COFINS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 8.924,30</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">NF-e Emitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.247</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Simples Nacional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 6.785,40</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  DAS a pagar
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impostos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>ICMS (18%)</span>
                    <span className="font-bold">R$ 12.347,80</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>PIS (1.65%)</span>
                    <span className="font-bold">R$ 4.562,30</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>COFINS (7.6%)</span>
                    <span className="font-bold">R$ 4.362,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>IPI (Variável)</span>
                    <span className="font-bold">R$ 2.890,50</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das NF-e</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Autorizadas</span>
                    </div>
                    <span className="font-bold">1.234 (99.0%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Pendentes</span>
                    </div>
                    <span className="font-bold">8 (0.6%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Rejeitadas</span>
                    </div>
                    <span className="font-bold">5 (0.4%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Relatórios Operacionais */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tempo Médio de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2 dias</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  -0.5 dias vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Taxa de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">97.8%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +1.2% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Devoluções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  -0.8% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Satisfação do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7★</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +0.2 vs mês anterior
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Transportadora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Correios", entregas: 456, prazo: 3.1, rate: 98.2 },
                    { name: "Mercado Envios", entregas: 234, prazo: 2.8, rate: 99.1 },
                    { name: "Loggi", entregas: 189, prazo: 2.3, rate: 97.4 },
                    { name: "Jadlog", entregas: 156, prazo: 3.5, rate: 96.8 }
                  ].map((carrier, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{carrier.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{carrier.entregas} entregas</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Prazo: {carrier.prazo} dias</span>
                        <span>Taxa: {carrier.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Motivos de Devolução</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Produto defeituoso', value: 35 },
                        { name: 'Não conforme', value: 28 },
                        { name: 'Arrependimento', value: 22 },
                        { name: 'Avaria no transporte', value: 15 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {[
                        { name: 'Produto defeituoso', value: 35 },
                        { name: 'Não conforme', value: 28 },
                        { name: 'Arrependimento', value: 22 },
                        { name: 'Avaria no transporte', value: 15 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}