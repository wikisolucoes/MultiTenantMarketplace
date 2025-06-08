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
  CreditCard,
  Package,
  TrendingUp,
  Globe,
  ShoppingCart,
  Mail,
  Phone,
  Send,
  Paperclip,
  Search,
  Filter
} from "lucide-react";

const supportTicketSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.enum(["technical", "billing", "products", "orders", "integrations", "account", "feature"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

const messageSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
});

interface SupportTicket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: number;
  senderType: string;
  senderName: string;
  message: string;
  createdAt: string;
}

const faqData = [
  {
    category: "Configuração da Loja",
    questions: [
      {
        question: "Como personalizar o tema da minha loja?",
        answer: "Acesse Configurações > Aparência e escolha entre os 10 temas disponíveis. Você pode personalizar cores, fontes e layout conforme sua marca."
      },
      {
        question: "Como configurar métodos de pagamento?",
        answer: "Vá em Configurações > Pagamentos. Integre com Celcoin para PIX, cartões de crédito/débito, boleto bancário e outras opções brasileiras."
      },
      {
        question: "Como configurar frete e entrega?",
        answer: "Em Configurações > Frete, defina suas regras de entrega, calcule frete por CEP e integre com transportadoras parceiras."
      }
    ]
  },
  {
    category: "Produtos e Estoque",
    questions: [
      {
        question: "Como importar produtos via XML?",
        answer: "Use a funcionalidade Produtos > Importar XML. Suportamos formatos padrão de fornecedores para atualização automática de estoque e preços."
      },
      {
        question: "Como configurar variações de produtos?",
        answer: "Na edição do produto, adicione variações como cor, tamanho, etc. Defina preços e estoques específicos para cada variação."
      },
      {
        question: "Como controlar estoque baixo?",
        answer: "Configure alertas em Produtos > Configurações. Receba notificações quando produtos atingirem estoque mínimo definido."
      }
    ]
  },
  {
    category: "Vendas e Pedidos",
    questions: [
      {
        question: "Como acompanhar vendas em tempo real?",
        answer: "Use o Dashboard principal para ver vendas, gráficos de performance e métricas importantes. Dados são atualizados em tempo real."
      },
      {
        question: "Como gerenciar status de pedidos?",
        answer: "Em Pedidos, atualize status como 'Processando', 'Enviado', 'Entregue'. Clientes recebem notificações automáticas por email/SMS."
      },
      {
        question: "Como emitir nota fiscal eletrônica (NF-e)?",
        answer: "Configure seus dados fiscais em Configurações > Impostos. A plataforma gera NF-e automaticamente para vendas conforme legislação brasileira."
      }
    ]
  },
  {
    category: "Marketplace e Integrações",
    questions: [
      {
        question: "Como vender no Mercado Livre?",
        answer: "Conecte sua conta em Integrações > Marketplaces. Sincronize produtos, preços e estoque automaticamente com o Mercado Livre."
      },
      {
        question: "Quais redes sociais posso integrar?",
        answer: "Integre com Instagram Shopping, Facebook Shop, Google Shopping e WhatsApp Business para vender em múltiplos canais."
      },
      {
        question: "Como funciona a sincronização de estoque?",
        answer: "O estoque é sincronizado em tempo real entre sua loja e marketplaces conectados, evitando vendas sem estoque."
      }
    ]
  },
  {
    category: "Financeiro e Relatórios",
    questions: [
      {
        question: "Como visualizar relatórios financeiros?",
        answer: "Acesse Relatórios > Financeiro para ver faturamento, comissões, impostos e análises detalhadas por período."
      },
      {
        question: "Como calcular impostos brasileiros?",
        answer: "Configure NCM, CFOP, ICMS, IPI, PIS e COFINS em Configurações > Impostos. Cálculos são automáticos conforme legislação."
      },
      {
        question: "Como receber pagamentos?",
        answer: "Pagamentos via Celcoin são processados e transferidos para sua conta bancária conforme prazos de cada método de pagamento."
      }
    ]
  }
];

export default function MerchantSupportCenter() {
  const [activeTab, setActiveTab] = useState("faq");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/support-tickets"],
    enabled: activeTab === "tickets"
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket?.id
  });

  const createTicketForm = useForm({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "technical" as const,
      priority: "medium" as const,
    },
  });

  const messageForm = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/support-tickets", data);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Criado",
        description: "Seu ticket de suporte foi criado com sucesso.",
      });
      setIsCreateTicketOpen(false);
      createTicketForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar ticket de suporte.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/support-tickets/${selectedTicket?.id}/messages`, data);
    },
    onSuccess: () => {
      messageForm.reset();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"] 
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: "destructive" as const, label: "Aberto", icon: Clock },
      in_progress: { variant: "default" as const, label: "Em Andamento", icon: MessageSquare },
      waiting_response: { variant: "secondary" as const, label: "Aguardando Resposta", icon: Clock },
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

  const getCategoryIcon = (category: string) => {
    const categoryIcons = {
      technical: Settings,
      billing: CreditCard,
      products: Package,
      orders: ShoppingCart,
      integrations: Globe,
      account: Star,
      feature: TrendingUp,
    };

    return categoryIcons[category as keyof typeof categoryIcons] || HelpCircle;
  };

  const filteredFAQ = faqData.filter(category =>
    selectedCategory === "all" || 
    category.category.toLowerCase().includes(selectedCategory.toLowerCase())
  ).map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const filteredTickets = tickets.filter((ticket: SupportTicket) =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Atendimento</h1>
          <p className="text-muted-foreground">
            Encontre respostas, abra tickets de suporte e entre em contato conosco
          </p>
        </div>
        <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Ticket de Suporte</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou dúvida detalhadamente para recebermos ajuda mais rápida.
              </DialogDescription>
            </DialogHeader>
            <Form {...createTicketForm}>
              <form onSubmit={createTicketForm.handleSubmit((data) => createTicketMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={createTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">Técnico/Funcionalidade</SelectItem>
                          <SelectItem value="billing">Financeiro/Cobrança</SelectItem>
                          <SelectItem value="products">Produtos/Estoque</SelectItem>
                          <SelectItem value="orders">Pedidos/Vendas</SelectItem>
                          <SelectItem value="integrations">Integrações/Marketplaces</SelectItem>
                          <SelectItem value="account">Conta/Perfil</SelectItem>
                          <SelectItem value="feature">Sugestão/Melhoria</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTicketForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTicketForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Resumo do problema ou dúvida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createTicketForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva detalhadamente seu problema, incluindo passos para reproduzir e comportamento esperado"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTicketMutation.isPending}>
                    Criar Ticket
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <nav className="space-y-2">
            {[
              { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle },
              { id: 'tickets', label: 'Meus Tickets', icon: MessageSquare },
              { id: 'contact', label: 'Contato Direto', icon: Mail }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nas perguntas frequentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="configuração">Configuração da Loja</SelectItem>
                    <SelectItem value="produtos">Produtos e Estoque</SelectItem>
                    <SelectItem value="vendas">Vendas e Pedidos</SelectItem>
                    <SelectItem value="marketplace">Marketplace e Integrações</SelectItem>
                    <SelectItem value="financeiro">Financeiro e Relatórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* FAQ Content */}
              <div className="space-y-6">
                {filteredFAQ.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {category.questions.map((faq, faqIndex) => (
                          <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}

                {filteredFAQ.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma pergunta encontrada</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Não encontramos perguntas que correspondam à sua busca.
                      </p>
                      <Button onClick={() => setIsCreateTicketOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Ticket de Suporte
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets pelo título ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {ticketsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Você ainda não possui tickets de suporte ou nenhum corresponde à sua busca.
                    </p>
                    <Button onClick={() => setIsCreateTicketOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket: SupportTicket) => {
                    const CategoryIcon = getCategoryIcon(ticket.category);
                    return (
                      <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedTicket(ticket)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <CategoryIcon className="h-5 w-5 text-muted-foreground mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{ticket.title}</h3>
                                  {getStatusBadge(ticket.status)}
                                  {getPriorityBadge(ticket.priority)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Ticket #{ticket.ticketNumber}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {ticket.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div>Criado em</div>
                              <div>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{selectedTicket.title}</h3>
                        <p className="text-muted-foreground">{selectedTicket.description}</p>
                      </div>

                      <Separator />

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
                                message.senderType === 'user' ? 'justify-end' : 'justify-start'
                              }`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.senderType === 'user' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}>
                                  <div className="text-xs opacity-75 mb-1">
                                    {message.senderName} • {new Date(message.createdAt).toLocaleString('pt-BR')}
                                  </div>
                                  <div className="text-sm">{message.message}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Send Message */}
                      {selectedTicket.status !== 'closed' && (
                        <Form {...messageForm}>
                          <form onSubmit={messageForm.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                            <FormField
                              control={messageForm.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nova Mensagem</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Digite sua mensagem..."
                                      rows={3}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end">
                              <Button type="submit" disabled={sendMessageMutation.isPending}>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Mensagem
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Suporte por E-mail
                    </CardTitle>
                    <CardDescription>
                      Para questões não urgentes e documentação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Horário de atendimento: Segunda a Sexta, 8h às 18h
                    </p>
                    <Button className="w-full" asChild>
                      <a href="mailto:suporte@wikistore.com.br">
                        Enviar E-mail
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Suporte Telefônico
                    </CardTitle>
                    <CardDescription>
                      Para questões urgentes e suporte imediato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>(11) 3000-1234</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Segunda a Sexta: 8h às 20h<br />
                      Sábado: 8h às 14h
                    </p>
                    <Button className="w-full" variant="outline" asChild>
                      <a href="tel:+551130001234">
                        Ligar Agora
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Níveis de Suporte</CardTitle>
                  <CardDescription>
                    Entenda nossos tempos de resposta conforme a prioridade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Baixa</Badge>
                        <span className="text-sm">Questões gerais e melhorias</span>
                      </div>
                      <span className="text-sm text-muted-foreground">até 48h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">Média</Badge>
                        <span className="text-sm">Problemas que afetam funcionalidades</span>
                      </div>
                      <span className="text-sm text-muted-foreground">até 24h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">Alta</Badge>
                        <span className="text-sm">Problemas que impedem vendas</span>
                      </div>
                      <span className="text-sm text-muted-foreground">até 8h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">Urgente</Badge>
                        <span className="text-sm">Sistema fora do ar</span>
                      </div>
                      <span className="text-sm text-muted-foreground">até 2h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}