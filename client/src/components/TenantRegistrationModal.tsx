import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthToken, setUser } from "@/lib/auth";
import { TenantRegistrationData, AuthResponse } from "@/types/api";
import { CheckCircle, Info, X } from "lucide-react";

const tenantRegistrationSchema = z.object({
  storeName: z.string().min(2, "Nome da loja deve ter pelo menos 2 caracteres"),
  subdomain: z.string()
    .min(3, "Subdomínio deve ter pelo menos 3 caracteres")
    .regex(/^[a-zA-Z0-9-]+$/, "Subdomínio deve conter apenas letras, números e hífens"),
  category: z.string().min(1, "Categoria é obrigatória"),
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  document: z.string().min(11, "CPF/CNPJ é obrigatório"),
  documentType: z.enum(["cpf", "cnpj"]),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  bank: z.string().min(1, "Banco é obrigatório"),
  agency: z.string().min(1, "Agência é obrigatória"),
  account: z.string().min(1, "Conta é obrigatória"),
});

interface TenantRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantRegistrationModal({ isOpen, onClose }: TenantRegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documentValidation, setDocumentValidation] = useState<{ valid?: boolean; name?: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<TenantRegistrationData>({
    resolver: zodResolver(tenantRegistrationSchema),
    defaultValues: {
      documentType: "cpf",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: TenantRegistrationData) => {
      const response = await apiRequest("POST", "/api/auth/register-tenant", data);
      return await response.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      toast({
        title: "Loja criada com sucesso!",
        description: "Conta Celcoin vinculada automaticamente.",
      });
      onClose();
      window.location.href = "/merchant";
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar loja",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const validateDocumentMutation = useMutation({
    mutationFn: async ({ document, type }: { document: string; type: "cpf" | "cnpj" }) => {
      const response = await apiRequest("POST", "/api/validation/document", { document, type });
      return await response.json();
    },
    onSuccess: (data) => {
      setDocumentValidation(data);
    },
  });

  const nextStep = () => {
    if (currentStep === 1) {
      const fields = ["storeName", "subdomain", "category"];
      form.trigger(fields as any).then((isValid) => {
        if (isValid) setCurrentStep(2);
      });
    } else if (currentStep === 2) {
      const fields = ["fullName", "document", "documentType", "email", "phone", "password"];
      form.trigger(fields as any).then((isValid) => {
        if (isValid) {
          // Validate document
          const document = form.getValues("document");
          const documentType = form.getValues("documentType");
          validateDocumentMutation.mutate({ document, type: documentType });
          setCurrentStep(3);
        }
      });
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: TenantRegistrationData) => {
    registrationMutation.mutate(data);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setDocumentValidation(null);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Cadastro de Lojista
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Store Data */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Dados da Loja</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Loja</FormLabel>
                        <FormControl>
                          <Input placeholder="Minha Loja Online" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subdomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomínio</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input placeholder="minhaloja" {...field} className="rounded-r-none" />
                            <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-lg text-sm text-muted-foreground">
                              .wikistore.com
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
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
                          <SelectItem value="fashion">Moda e Vestuário</SelectItem>
                          <SelectItem value="electronics">Eletrônicos</SelectItem>
                          <SelectItem value="home">Casa e Decoração</SelectItem>
                          <SelectItem value="sports">Esporte e Lazer</SelectItem>
                          <SelectItem value="others">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Personal/Business Data */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Dados Pessoais/Empresariais</h3>
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cpf" id="cpf" />
                            <Label htmlFor="cpf">Pessoa Física (CPF)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cnpj" id="cnpj" />
                            <Label htmlFor="cnpj">Pessoa Jurídica (CNPJ)</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo/Razão Social</FormLabel>
                        <FormControl>
                          <Input placeholder="João da Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
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
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Bank Data */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Dados Bancários</h3>
                
                {documentValidation?.valid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Documento validado com sucesso: {documentValidation.name}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="001">Banco do Brasil</SelectItem>
                            <SelectItem value="341">Itaú</SelectItem>
                            <SelectItem value="237">Bradesco</SelectItem>
                            <SelectItem value="104">Caixa Econômica</SelectItem>
                            <SelectItem value="033">Santander</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="account"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="12345-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Estes dados serão utilizados para os saques automáticos via Celcoin.
                    Certifique-se de que as informações estão corretas.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Progress Bar */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Passo {currentStep} de 3</span>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step <= currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={previousStep}
                  disabled={currentStep === 1}
                  className={currentStep === 1 ? "invisible" : ""}
                >
                  Anterior
                </Button>
                
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={registrationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {registrationMutation.isPending ? "Criando..." : "Criar Loja"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
