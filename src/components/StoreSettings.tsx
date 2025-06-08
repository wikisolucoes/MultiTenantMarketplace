import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Palette, 
  CreditCard, 
  Truck, 
  FileText, 
  Globe, 
  Shield, 
  Bell,
  Settings as SettingsIcon,
  Upload,
  Save
} from "lucide-react";

const storeInfoSchema = z.object({
  storeName: z.string().min(2, "Nome da loja deve ter pelo menos 2 caracteres"),
  storeDescription: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
  state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  zipCode: z.string().min(8, "CEP deve ter 8 dígitos"),
});

const appearanceSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  theme: z.string(),
});

const paymentSchema = z.object({
  pixEnabled: z.boolean(),
  pixKey: z.string().optional(),
  creditCardEnabled: z.boolean(),
  boletoEnabled: z.boolean(),
  installmentLimit: z.string(),
});

const shippingSchema = z.object({
  freeShippingThreshold: z.string(),
  standardShippingPrice: z.string(),
  expressShippingPrice: z.string(),
  maxShippingDays: z.string(),
  packagingWeight: z.string(),
});

const taxSchema = z.object({
  companyDocument: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  stateRegistration: z.string().min(5, "Inscrição Estadual inválida"),
  municipalRegistration: z.string().optional(),
  taxRegime: z.string(),
  defaultNcm: z.string().min(8, "NCM deve ter 8 dígitos"),
  defaultCfop: z.string().min(4, "CFOP deve ter 4 dígitos"),
});

const notificationSchema = z.object({
  emailNewOrder: z.boolean(),
  emailLowStock: z.boolean(),
  emailNewCustomer: z.boolean(),
  smsNewOrder: z.boolean(),
  smsPaymentConfirmed: z.boolean(),
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().optional(),
});

type StoreInfoData = z.infer<typeof storeInfoSchema>;
type AppearanceData = z.infer<typeof appearanceSchema>;
type PaymentData = z.infer<typeof paymentSchema>;
type ShippingData = z.infer<typeof shippingSchema>;
type TaxData = z.infer<typeof taxSchema>;
type NotificationData = z.infer<typeof notificationSchema>;

export default function StoreSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("store-info");

  const storeInfoForm = useForm<StoreInfoData>({
    resolver: zodResolver(storeInfoSchema),
    defaultValues: {
      storeName: "Loja Demo",
      storeDescription: "Uma loja completa com os melhores produtos",
      contactEmail: "contato@lojademo.com",
      contactPhone: "(11) 99999-9999",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    },
  });

  const appearanceForm = useForm<AppearanceData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      primaryColor: "#0ea5e9",
      secondaryColor: "#06b6d4",
      theme: "modern",
    },
  });

  const paymentForm = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      pixEnabled: true,
      pixKey: "contato@lojademo.com",
      creditCardEnabled: true,
      boletoEnabled: true,
      installmentLimit: "12",
    },
  });

  const shippingForm = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      freeShippingThreshold: "100.00",
      standardShippingPrice: "15.00",
      expressShippingPrice: "25.00",
      maxShippingDays: "7",
      packagingWeight: "0.5",
    },
  });

  const taxForm = useForm<TaxData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      companyDocument: "12345678000199",
      stateRegistration: "123456789",
      municipalRegistration: "",
      taxRegime: "simples_nacional",
      defaultNcm: "96081000",
      defaultCfop: "5102",
    },
  });

  const notificationForm = useForm<NotificationData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNewOrder: true,
      emailLowStock: true,
      emailNewCustomer: false,
      smsNewOrder: false,
      smsPaymentConfirmed: true,
      whatsappEnabled: true,
      whatsappNumber: "(11) 99999-9999",
    },
  });

  const handleSaveSettings = (data: any, section: string) => {
    console.log(`Saving ${section}:`, data);
    toast({
      title: "Configurações salvas",
      description: `As configurações de ${section} foram salvas com sucesso.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações da Loja</h2>
          <p className="text-muted-foreground">Gerencie todas as configurações da sua loja</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="store-info" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fiscal
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Informações da Loja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...storeInfoForm}>
                <form onSubmit={storeInfoForm.handleSubmit((data) => handleSaveSettings(data, "informações da loja"))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={storeInfoForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Loja</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da sua loja" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeInfoForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="contato@loja.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={storeInfoForm.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Loja</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva sua loja..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={storeInfoForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeInfoForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="12345-678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={storeInfoForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, complemento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={storeInfoForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={storeInfoForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SP">São Paulo</SelectItem>
                                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                                <SelectItem value="MG">Minas Gerais</SelectItem>
                                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                                <SelectItem value="PR">Paraná</SelectItem>
                                <SelectItem value="SC">Santa Catarina</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Informações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência da Loja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit((data) => handleSaveSettings(data, "aparência"))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={appearanceForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Primária</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="w-20" />
                              <Input {...field} placeholder="#0ea5e9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={appearanceForm.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor Secundária</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input type="color" {...field} className="w-20" />
                              <Input {...field} placeholder="#06b6d4" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema da Loja</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tema" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Moderno</SelectItem>
                              <SelectItem value="classic">Clássico</SelectItem>
                              <SelectItem value="minimal">Minimalista</SelectItem>
                              <SelectItem value="luxury">Luxo</SelectItem>
                              <SelectItem value="sport">Esportivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div>
                      <Label>Logo da Loja</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Clique para fazer upload ou arraste uma imagem</p>
                        <p className="text-xs text-gray-500">PNG, JPG até 2MB</p>
                      </div>
                    </div>

                    <div>
                      <Label>Favicon</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Clique para fazer upload do favicon</p>
                        <p className="text-xs text-gray-500">ICO, PNG 16x16 ou 32x32</p>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Aparência
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit((data) => handleSaveSettings(data, "pagamentos"))} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>PIX</Label>
                        <p className="text-sm text-muted-foreground">Pagamento instantâneo via PIX</p>
                      </div>
                      <FormField
                        control={paymentForm.control}
                        name="pixEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={paymentForm.control}
                      name="pixKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave PIX</FormLabel>
                          <FormControl>
                            <Input placeholder="sua@chave.pix" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cartão de Crédito</Label>
                      <p className="text-sm text-muted-foreground">Aceitar pagamentos com cartão</p>
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="creditCardEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={paymentForm.control}
                    name="installmentLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de Parcelas</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o limite" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1x</SelectItem>
                              <SelectItem value="3">3x</SelectItem>
                              <SelectItem value="6">6x</SelectItem>
                              <SelectItem value="12">12x</SelectItem>
                              <SelectItem value="18">18x</SelectItem>
                              <SelectItem value="24">24x</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Boleto Bancário</Label>
                      <p className="text-sm text-muted-foreground">Pagamento via boleto</p>
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="boletoEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações de Pagamento
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Configurações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...shippingForm}>
                <form onSubmit={shippingForm.handleSubmit((data) => handleSaveSettings(data, "entrega"))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={shippingForm.control}
                      name="freeShippingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frete Grátis a partir de (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="100.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="maxShippingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo Máximo (dias)</FormLabel>
                          <FormControl>
                            <Input placeholder="7" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={shippingForm.control}
                      name="standardShippingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frete Padrão (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="15.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shippingForm.control}
                      name="expressShippingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frete Expresso (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="25.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={shippingForm.control}
                    name="packagingWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso da Embalagem (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.5" {...field} />
                        </FormControl>
                        <FormDescription>
                          Peso adicional da embalagem para cálculo do frete
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações de Entrega
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configurações Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...taxForm}>
                <form onSubmit={taxForm.handleSubmit((data) => handleSaveSettings(data, "fiscal"))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={taxForm.control}
                      name="companyDocument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="12.345.678/0001-99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taxForm.control}
                      name="stateRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição Estadual</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={taxForm.control}
                    name="municipalRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Municipal (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taxForm.control}
                    name="taxRegime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regime Tributário</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o regime" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                              <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                              <SelectItem value="lucro_real">Lucro Real</SelectItem>
                              <SelectItem value="mei">MEI</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={taxForm.control}
                      name="defaultNcm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NCM Padrão</FormLabel>
                          <FormControl>
                            <Input placeholder="96081000" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nomenclatura Comum do Mercosul
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taxForm.control}
                      name="defaultCfop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CFOP Padrão</FormLabel>
                          <FormControl>
                            <Input placeholder="5102" {...field} />
                          </FormControl>
                          <FormDescription>
                            Código Fiscal de Operações e Prestações
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações Fiscais
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit((data) => handleSaveSettings(data, "notificações"))} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notificações por Email</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Novo Pedido</Label>
                        <p className="text-sm text-muted-foreground">Receber email quando houver novos pedidos</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="emailNewOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Estoque Baixo</Label>
                        <p className="text-sm text-muted-foreground">Receber email quando o estoque estiver baixo</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="emailLowStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Novo Cliente</Label>
                        <p className="text-sm text-muted-foreground">Receber email quando um novo cliente se cadastrar</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="emailNewCustomer"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Notificações por SMS</h4>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Novo Pedido</Label>
                        <p className="text-sm text-muted-foreground">Receber SMS quando houver novos pedidos</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="smsNewOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Pagamento Confirmado</Label>
                        <p className="text-sm text-muted-foreground">Receber SMS quando um pagamento for confirmado</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="smsPaymentConfirmed"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>WhatsApp</Label>
                        <p className="text-sm text-muted-foreground">Ativar notificações via WhatsApp</p>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="whatsappEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={notificationForm.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações de Notificações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}