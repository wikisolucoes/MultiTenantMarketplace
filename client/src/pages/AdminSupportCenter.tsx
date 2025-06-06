import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, 
  HelpCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Star,
  Settings,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Search,
  Send,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Timer,
  Target,
  Award,
  AlertCircle,
  UserCheck,
  MessageCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

const responseSchema = z.object({
  message: z.string().min(1, "Resposta é obrigatória"),
  isInternal: z.boolean().default(false),
});

const faqSchema = z.object({
  question: z.string().min(1, "Pergunta é obrigatória"),
  answer: z.string().min(1, "Resposta é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  isActive: z.boolean().default(true),
});

interface SupportTicket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: number;
  satisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
  tenantId: number;
  userId: number;
  userName?: string;
  tenantName?: string;
}

interface TicketMessage {
  id: number;
  senderType: string;
  senderName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  userId?: number;
  senderType: string;
  senderName: string;
  message: string;
  attachments?: string[];
  isInternal: boolean;
  messageType: string;
  createdAt: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
}

export default function AdminSupportCenter() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets"],
    enabled: activeTab === "tickets" || activeTab === "dashboard"
  });

  // Fetch ticket messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/admin/support-tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket?.id
  });

  // Fetch FAQ data
  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: ["/api/admin/faqs"],
    enabled: activeTab === "faq"
  });

  // Fetch support analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/support-analytics"],
    enabled: activeTab === "dashboard"
  });

  const responseForm = useForm({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      message: "",
      isInternal: false,
    },
  });

  const faqForm = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      category: "",
      isActive: true,
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/admin/support-tickets/${selectedTicket?.id}/messages`, data);
    },
    onSuccess: () => {
      toast({
        title: "Resposta Enviada",
        description: "Sua resposta foi enviada com sucesso.",
      });
      setIsResponseDialogOpen(false);
      responseForm.reset();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/support-tickets", selectedTicket?.id, "messages"] 
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta.",
        variant: "destructive",
      });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, assignedTo, priority }: any) => {
      return await apiRequest("PUT", `/api/admin/support-tickets/${ticketId}`, { status, assignedTo, priority });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Atualizado",
        description: "Status do ticket foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-analytics"] });
      setSelectedTicket(null); // Close modal after successful update
    },
    onError: (error: any) => {
      console.error("Update ticket error:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ticket no banco de dados.",
        variant: "destructive",
      });
    },
  });

  const createFAQMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/faqs", data);
    },
    onSuccess: () => {
      toast({
        title: "FAQ Criada",
        description: "Pergunta frequente criada com sucesso.",
      });
      setIsFAQDialogOpen(false);
      faqForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar FAQ.",
        variant: "destructive",
      });
    },
  });

  const updateFAQMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return await apiRequest("PUT", `/api/admin/faqs/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "FAQ Atualizada",
        description: "Pergunta frequente atualizada com sucesso.",
      });
      setIsFAQDialogOpen(false);
      setEditingFAQ(null);
      faqForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar FAQ.",
        variant: "destructive",
      });
    },
  });

  const deleteFAQMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/faqs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "FAQ Removida",
        description: "Pergunta frequente removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover FAQ.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: "destructive" as const, label: "Aberto", icon: Clock },
      in_progress: { variant: "default" as const, label: "Em Andamento", icon: MessageSquare },
      waiting_response: { variant: "secondary" as const, label: "Aguardando", icon: Clock },
      resolved: { variant: "default" as const, label: "Resolvido", icon: CheckCircle },
      closed: { variant: "outline" as const, label: "Fechado", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      icon: Clock,
    };

    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "outline" as const, label: "Baixa" },
      medium: { variant: "secondary" as const, label: "Média" },
      high: { variant: "destructive" as const, label: "Alta" },
      urgent: { variant: "destructive" as const, label: "Urgente" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      variant: "secondary" as const,
      label: priority,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTickets = tickets.filter((ticket: SupportTicket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    faqForm.reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive,
    });
    setIsFAQDialogOpen(true);
  };

  const handleFAQSubmit = (data: any) => {
    if (editingFAQ) {
      updateFAQMutation.mutate({ id: editingFAQ.id, ...data });
    } else {
      createFAQMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Suporte Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie tickets, FAQs e monitore métricas de suporte
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <MessageSquare className="mr-2 h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="mr-2 h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tickets Abertos</p>
                        <p className="text-2xl font-bold">{analytics?.openTickets || 0}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tempo Médio Resposta</p>
                        <p className="text-2xl font-bold">{analytics?.avgResponseTime || '2.5h'}</p>
                      </div>
                      <Timer className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Taxa de Resolução</p>
                        <p className="text-2xl font-bold">{analytics?.resolutionRate || '94%'}</p>
                      </div>
                      <Target className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Satisfação</p>
                        <p className="text-2xl font-bold">{analytics?.satisfaction || '4.7'}/5</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tickets Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tickets.slice(0, 5).map((ticket: SupportTicket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {ticket.tenantName} • #{ticket.ticketNumber}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { category: 'Técnico', count: 15, color: 'bg-blue-500' },
                        { category: 'Billing', count: 8, color: 'bg-green-500' },
                        { category: 'Produtos', count: 12, color: 'bg-yellow-500' },
                        { category: 'Pedidos', count: 6, color: 'bg-purple-500' },
                        { category: 'Integrações', count: 4, color: 'bg-red-500' },
                      ].map((item) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm">{item.category}</span>
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="waiting_response">Aguardando</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets List */}
          {ticketsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket: SupportTicket) => (
                <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedTicket(ticket)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{ticket.title}</h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          #{ticket.ticketNumber} • {ticket.tenantName} • {ticket.userName}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground ml-4">
                        <div>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div>{new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Ticket Detail Dialog */}
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ticket #{selectedTicket?.ticketNumber}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {selectedTicket && getStatusBadge(selectedTicket.status)}
                  {selectedTicket && getPriorityBadge(selectedTicket.priority)}
                </div>
              </DialogHeader>
              
              {selectedTicket && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Cliente:</Label>
                      <p>{selectedTicket.tenantName}</p>
                    </div>
                    <div>
                      <Label>Usuário:</Label>
                      <p>{selectedTicket.userName}</p>
                    </div>
                    <div>
                      <Label>Categoria:</Label>
                      <p className="capitalize">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <Label>Criado em:</Label>
                      <p>{new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedTicket.title}</h3>
                    <p className="text-muted-foreground">{selectedTicket.description}</p>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Select value={selectedTicket.status} 
                            onValueChange={(status) => updateTicketStatusMutation.mutate({ 
                              ticketId: selectedTicket.id, 
                              status 
                            })}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="waiting_response">Aguardando Resposta</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setIsResponseDialogOpen(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      Responder
                    </Button>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Conversação</h4>
                    {messagesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {messages.map((message: TicketMessage) => (
                          <div key={message.id} className={`flex ${
                            message.senderType === 'user' ? 'justify-start' : 'justify-end'
                          }`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderType === 'user' 
                                ? 'bg-muted' 
                                : message.isInternal
                                ? 'bg-yellow-100 border border-yellow-300'
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              <div className="text-xs opacity-75 mb-1">
                                {message.senderName} • {new Date(message.createdAt).toLocaleString('pt-BR')}
                                {message.isInternal && <span className="ml-2 text-yellow-600">Interno</span>}
                              </div>
                              <div className="text-sm">{message.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Response Dialog */}
          <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Responder Ticket</DialogTitle>
              </DialogHeader>
              <Form {...responseForm}>
                <form onSubmit={responseForm.handleSubmit((data) => sendResponseMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={responseForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Digite sua resposta..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={responseForm.control}
                    name="isInternal"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Nota interna (não visível ao cliente)</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={sendResponseMutation.isPending}>
                      Enviar Resposta
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gerenciar FAQs</h2>
            <Button onClick={() => setIsFAQDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova FAQ
            </Button>
          </div>

          {faqsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq: FAQ) => (
                <Card key={faq.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{faq.question}</h3>
                          <Badge variant={faq.isActive ? "default" : "outline"}>
                            {faq.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Categoria: {faq.category}
                        </p>
                        <p className="text-sm line-clamp-2">{faq.answer}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {faq.viewCount} visualizações
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {faq.helpfulCount} úteis
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditFAQ(faq)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteFAQMutation.mutate(faq.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* FAQ Dialog */}
          <Dialog open={isFAQDialogOpen} onOpenChange={(open) => {
            setIsFAQDialogOpen(open);
            if (!open) {
              setEditingFAQ(null);
              faqForm.reset();
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingFAQ ? "Editar FAQ" : "Nova FAQ"}</DialogTitle>
              </DialogHeader>
              <Form {...faqForm}>
                <form onSubmit={faqForm.handleSubmit(handleFAQSubmit)} className="space-y-4">
                  <FormField
                    control={faqForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Configuração da Loja" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={faqForm.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pergunta</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite a pergunta..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={faqForm.control}
                    name="answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resposta</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Digite a resposta detalhada..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={faqForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>FAQ Ativa</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsFAQDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createFAQMutation.isPending || updateFAQMutation.isPending}>
                      {editingFAQ ? "Atualizar" : "Criar"} FAQ
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipe de Suporte</CardTitle>
              <CardDescription>
                Gerencie membros da equipe e suas atribuições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Ana Silva", role: "Supervisor", tickets: 45, avgResponse: "1.2h", satisfaction: "4.9" },
                  { name: "Carlos Santos", role: "Analista Sênior", tickets: 38, avgResponse: "1.8h", satisfaction: "4.7" },
                  { name: "Maria Oliveira", role: "Analista", tickets: 42, avgResponse: "2.1h", satisfaction: "4.8" },
                  { name: "João Costa", role: "Analista", tickets: 35, avgResponse: "2.3h", satisfaction: "4.6" },
                ].map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{member.tickets}</div>
                        <div className="text-muted-foreground">Tickets</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{member.avgResponse}</div>
                        <div className="text-muted-foreground">Resposta</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{member.satisfaction}</div>
                        <div className="text-muted-foreground">Satisfação</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}