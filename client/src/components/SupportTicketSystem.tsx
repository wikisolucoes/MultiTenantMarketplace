import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Send,
  Paperclip,
  Eye,
  MoreHorizontal
} from "lucide-react";

const supportTicketCreateSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.enum(["bug", "feature", "support", "billing", "technical"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const supportMessageCreateSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  attachments: z.array(z.string()).optional(),
});

const supportRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type CreateSupportTicketData = z.infer<typeof supportTicketCreateSchema>;
type CreateSupportMessageData = z.infer<typeof supportMessageCreateSchema>;
type SupportRatingData = z.infer<typeof supportRatingSchema>;

interface SupportTicket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  attachments?: string[];
  tags?: string[];
  satisfactionRating?: number;
  satisfactionComment?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicketMessage {
  id: number;
  senderType: string;
  senderName: string;
  message: string;
  attachments?: string[];
  isInternal: boolean;
  messageType: string;
  createdAt: string;
}

export default function SupportTicketSystem() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTicketForm = useForm<CreateSupportTicketData>({
    resolver: zodResolver(supportTicketCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "support",
      priority: "medium",
      attachments: [],
      tags: [],
    },
  });

  const messageForm = useForm<CreateSupportMessageData>({
    resolver: zodResolver(supportMessageCreateSchema),
    defaultValues: {
      message: "",
      attachments: [],
    },
  });

  const ratingForm = useForm<SupportRatingData>({
    resolver: zodResolver(supportRatingSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  // Fetch support tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/support-tickets"],
  });

  // Fetch ticket messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateSupportTicketData) => {
      return await apiRequest("POST", "/api/support-tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      setShowCreateForm(false);
      createTicketForm.reset();
      toast({
        title: "Ticket criado",
        description: "Seu ticket de suporte foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async (data: CreateSupportMessageData) => {
      return await apiRequest("POST", `/api/support-tickets/${selectedTicket?.id}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets", selectedTicket?.id, "messages"] });
      messageForm.reset();
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rate ticket mutation
  const rateTicketMutation = useMutation({
    mutationFn: async (data: SupportRatingData) => {
      return await apiRequest("PATCH", `/api/support-tickets/${selectedTicket?.id}/rate`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      setShowRatingForm(false);
      ratingForm.reset();
      toast({
        title: "Avaliação enviada",
        description: "Obrigado pela sua avaliação!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = (data: CreateSupportTicketData) => {
    createTicketMutation.mutate(data);
  };

  const handleSendMessage = (data: CreateSupportMessageData) => {
    createMessageMutation.mutate(data);
  };

  const handleRateTicket = (data: SupportRatingData) => {
    rateTicketMutation.mutate(data);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: "secondary" as const, label: "Aberto", icon: Clock },
      in_progress: { variant: "default" as const, label: "Em Andamento", icon: MessageSquare },
      waiting_response: { variant: "outline" as const, label: "Aguardando Resposta", icon: Clock },
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
      <Badge variant={config.variant} className={
        config.variant === "default" && status === "resolved"
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
          : ""
      }>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "outline" as const, label: "Baixa" },
      medium: { variant: "secondary" as const, label: "Média" },
      high: { variant: "default" as const, label: "Alta" },
      urgent: { variant: "destructive" as const, label: "Urgente" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      variant: "secondary" as const,
      label: priority,
    };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      bug: "Bug",
      feature: "Funcionalidade",
      support: "Suporte",
      billing: "Faturamento",
      technical: "Técnico",
    };

    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Central de Suporte</h2>
          <p className="text-muted-foreground">Gerencie seus tickets de suporte e comunicação com nossa equipe</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tickets">
            <Ticket className="mr-2 h-4 w-4" />
            Meus Tickets
          </TabsTrigger>
          <TabsTrigger value="resolved">
            <CheckCircle className="mr-2 h-4 w-4" />
            Resolvidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de Suporte</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando tickets...</div>
              ) : !tickets || tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>Nenhum ticket encontrado</p>
                  <p className="text-sm">Crie um novo ticket para entrar em contato com o suporte</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.filter((ticket: SupportTicket) => ticket.status !== "closed" && ticket.status !== "resolved").map((ticket: SupportTicket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {ticket.status === "resolved" && !ticket.satisfactionRating && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowRatingForm(true);
                                }}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Tickets Resolvidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Resolvido em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.filter((ticket: SupportTicket) => ticket.status === "closed" || ticket.status === "resolved").map((ticket: SupportTicket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.ticketNumber}</TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                      <TableCell>
                        {ticket.satisfactionRating ? (
                          renderStars(ticket.satisfactionRating)
                        ) : (
                          <span className="text-muted-foreground">Não avaliado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {ticket.resolvedAt ? formatDate(ticket.resolvedAt) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Ticket de Suporte</DialogTitle>
          </DialogHeader>
          <Form {...createTicketForm}>
            <form onSubmit={createTicketForm.handleSubmit(handleCreateTicket)} className="space-y-4">
              <FormField
                control={createTicketForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Descreva brevemente o problema" {...field} />
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
                        placeholder="Descreva detalhadamente o problema ou solicitação"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createTicketForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="support">Suporte Geral</SelectItem>
                          <SelectItem value="bug">Relatar Bug</SelectItem>
                          <SelectItem value="feature">Solicitar Funcionalidade</SelectItem>
                          <SelectItem value="technical">Problema Técnico</SelectItem>
                          <SelectItem value="billing">Faturamento</SelectItem>
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
                            <SelectValue />
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
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? "Criando..." : "Criar Ticket"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket {selectedTicket?.ticketNumber}</span>
              <div className="flex space-x-2">
                {selectedTicket && getStatusBadge(selectedTicket.status)}
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg">{selectedTicket.title}</h3>
                <p className="text-muted-foreground mt-2">{selectedTicket.description}</p>
                <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                  <span>Categoria: {getCategoryLabel(selectedTicket.category)}</span>
                  <span>Criado em: {formatDate(selectedTicket.createdAt)}</span>
                  {selectedTicket.satisfactionRating && (
                    <div className="flex items-center space-x-2">
                      <span>Avaliação:</span>
                      {renderStars(selectedTicket.satisfactionRating)}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Mensagens</h4>
                {messagesLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Carregando mensagens...</div>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {messages.map((message: SupportTicketMessage) => (
                      <div 
                        key={message.id} 
                        className={`p-3 rounded-lg ${
                          message.senderType === "user" 
                            ? "bg-primary/10 ml-8" 
                            : "bg-muted mr-8"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="border-t pt-4">
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="space-y-4">
                      <FormField
                        control={messageForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Mensagem</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Digite sua mensagem..."
                                className="min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={createMessageMutation.isPending}
                          size="sm"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {createMessageMutation.isPending ? "Enviando..." : "Enviar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Avaliar Atendimento</DialogTitle>
          </DialogHeader>
          <Form {...ratingForm}>
            <form onSubmit={ratingForm.handleSubmit(handleRateTicket)} className="space-y-4">
              <FormField
                control={ratingForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange(star)}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= field.value
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ratingForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentário (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Deixe um comentário sobre o atendimento..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRatingForm(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={rateTicketMutation.isPending}
                >
                  {rateTicketMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}