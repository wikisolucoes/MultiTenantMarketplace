import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Eye, Calendar, Percent, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const createCouponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').toUpperCase(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number().min(0, 'Valor deve ser positivo'),
  minimumOrderValue: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  usageLimitPerCustomer: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
  isFirstOrderOnly: z.boolean().default(false),
  startDate: z.string(),
  endDate: z.string().optional(),
});

type CreateCouponForm = z.infer<typeof createCouponSchema>;

export default function CouponManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [viewingCoupon, setViewingCoupon] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCouponForm>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      isActive: true,
      isFirstOrderOnly: false,
      type: 'percentage',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['/api/discount-coupons'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCouponForm) => {
      const response = await fetch('/api/discount-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar cupom');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Cupom criado com sucesso!' });
      setCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/discount-coupons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao criar cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateCouponForm> }) => {
      const response = await fetch(`/api/discount-coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao atualizar cupom');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Cupom atualizado com sucesso!' });
      setEditingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ['/api/discount-coupons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/discount-coupons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir cupom');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Cupom excluído com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/discount-coupons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao excluir cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const onSubmit = (data: CreateCouponForm) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    form.reset({
      ...coupon,
      startDate: format(new Date(coupon.startDate), 'yyyy-MM-dd'),
      endDate: coupon.endDate ? format(new Date(coupon.endDate), 'yyyy-MM-dd') : undefined,
    });
    setCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCouponStatusBadge = (coupon: any) => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = coupon.endDate ? new Date(coupon.endDate) : null;

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    if (now < startDate) {
      return <Badge variant="outline">Agendado</Badge>;
    }
    if (endDate && now > endDate) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (coupon.usageLimit && coupon.currentUsageCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    return <Badge variant="default">Ativo</Badge>;
  };

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.type === 'percentage') {
      return (
        <div className="flex items-center gap-1">
          <Percent className="h-4 w-4" />
          {coupon.value}%
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <DollarSign className="h-4 w-4" />
        R$ {Number(coupon.value).toFixed(2)}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-6">Carregando cupons...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">
            Gerencie cupons de desconto para sua loja
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCoupon(null);
              form.reset({
                isActive: true,
                isFirstOrderOnly: false,
                type: 'percentage',
                startDate: new Date().toISOString().split('T')[0],
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes do cupom de desconto
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código do Cupom</FormLabel>
                        <FormControl>
                          <Input placeholder="DESCONTO10" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cupom</FormLabel>
                        <FormControl>
                          <Input placeholder="Desconto de 10%" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do cupom..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Desconto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual</SelectItem>
                            <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch('type') === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={form.watch('type') === 'percentage' ? '10' : '50.00'}
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimumOrderValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Mínimo do Pedido (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="100.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximumDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto Máximo (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="50.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite Total de Uso</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="usageLimitPerCustomer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite por Cliente</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Cupom Ativo</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFirstOrderOnly"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Apenas Primeira Compra</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {coupons.data?.map((coupon: any) => (
          <Card key={coupon.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {coupon.code}
                    {getCouponStatusBadge(coupon)}
                  </CardTitle>
                  <CardDescription>{coupon.name}</CardDescription>
                  {coupon.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {coupon.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingCoupon(coupon)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Desconto</span>
                  <div className="font-medium">
                    {getDiscountDisplay(coupon)}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Usado</span>
                  <div className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {coupon.currentUsageCount}
                    {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Válido até</span>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {coupon.endDate ? format(new Date(coupon.endDate), 'dd/MM/yyyy') : 'Sem limite'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Restrições</span>
                  <div className="text-sm">
                    {coupon.minimumOrderValue && `Min: R$ ${Number(coupon.minimumOrderValue).toFixed(2)}`}
                    {coupon.isFirstOrderOnly && (
                      <Badge variant="outline" className="ml-1">1ª compra</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coupon Details Dialog */}
      {viewingCoupon && (
        <Dialog open={!!viewingCoupon} onOpenChange={() => setViewingCoupon(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Cupom: {viewingCoupon.code}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Nome</h4>
                  <p className="text-sm text-muted-foreground">{viewingCoupon.name}</p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  {getCouponStatusBadge(viewingCoupon)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Tipo de Desconto</h4>
                  <div className="flex items-center gap-2">
                    {getDiscountDisplay(viewingCoupon)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Uso</h4>
                  <p className="text-sm">
                    {viewingCoupon.currentUsageCount} de {viewingCoupon.usageLimit || '∞'} usos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Período</h4>
                  <p className="text-sm">
                    {format(new Date(viewingCoupon.startDate), 'dd/MM/yyyy')} - {' '}
                    {viewingCoupon.endDate ? format(new Date(viewingCoupon.endDate), 'dd/MM/yyyy') : 'Sem limite'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Criado em</h4>
                  <p className="text-sm">
                    {format(new Date(viewingCoupon.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {viewingCoupon.description && (
                <div>
                  <h4 className="font-medium">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{viewingCoupon.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}