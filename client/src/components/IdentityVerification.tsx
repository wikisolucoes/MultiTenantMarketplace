import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, XCircle, AlertTriangle, Upload, FileText, Shield, CreditCard } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const identityVerificationSchema = z.object({
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  documentType: z.enum(['CPF', 'CNPJ'], { required_error: 'Tipo de documento é obrigatório' }),
  documentNumber: z.string().min(11, 'Número do documento é obrigatório'),
  dateOfBirth: z.string().optional(),
  nationality: z.string().default('Brasileira'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  alternativePhone: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  businessActivity: z.string().optional(),
  monthlyRevenue: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Estado é obrigatório'),
    zipCode: z.string().min(8, 'CEP é obrigatório')
  })
});

type IdentityVerificationForm = z.infer<typeof identityVerificationSchema>;

interface VerificationStatus {
  id?: number;
  status: string;
  identity_verification_status: string;
  can_receive_payments: boolean;
  can_request_withdrawals: boolean;
  submitted_at?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
  under_review: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Em Análise' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Aprovado' },
  verified: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Verificado' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejeitado' },
  requires_additional_info: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Informações Adicionais' }
};

export default function IdentityVerification() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ['/api/identity-verification/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: paymentPermissions } = useQuery({
    queryKey: ['/api/payment-permissions']
  });

  const form = useForm<IdentityVerificationForm>({
    resolver: zodResolver(identityVerificationSchema),
    defaultValues: {
      nationality: 'Brasileira',
      documentType: 'CPF',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/identity-verification/submit', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Verificação Enviada',
        description: 'Sua solicitação de verificação de identidade foi enviada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/identity-verification/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Enviar',
        description: error.message || 'Erro ao enviar verificação de identidade.',
        variant: 'destructive'
      });
    }
  });

  const handleFileUpload = (fileType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, upload to a file storage service
      const fakeUrl = `https://storage.example.com/${fileType}/${Date.now()}.jpg`;
      setUploadedFiles(prev => ({ ...prev, [fileType]: fakeUrl }));
      toast({
        title: 'Arquivo Enviado',
        description: `${file.name} foi enviado com sucesso.`,
      });
    }
  };

  const onSubmit = (data: IdentityVerificationForm) => {
    const submissionData = {
      ...data,
      monthlyRevenue: data.monthlyRevenue ? parseFloat(data.monthlyRevenue) : null,
      documentFrontImage: uploadedFiles.documentFront,
      documentBackImage: uploadedFiles.documentBack,
      proofOfAddressImage: uploadedFiles.proofOfAddress,
      selfieWithDocumentImage: uploadedFiles.selfieWithDocument,
      businessDocumentsImages: uploadedFiles.businessDocuments ? [uploadedFiles.businessDocuments] : []
    };

    submitVerificationMutation.mutate(submissionData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStatus = verificationStatus?.status || verificationStatus?.identity_verification_status || 'pending';
  const StatusIcon = statusConfig[currentStatus as keyof typeof statusConfig]?.icon || Clock;
  const statusColor = statusConfig[currentStatus as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800';
  const statusLabel = statusConfig[currentStatus as keyof typeof statusConfig]?.label || 'Pendente';

  // If already verified
  if (currentStatus === 'verified' || currentStatus === 'approved') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-2xl">Identidade Verificada</CardTitle>
                <CardDescription>Sua identidade foi verificada com sucesso</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-5 w-5 text-green-600" />
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>
            
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Parabéns! Sua identidade foi verificada. Agora você pode receber pagamentos e solicitar saques.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Receber Pagamentos</p>
                  <p className="text-sm text-green-700">Habilitado</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <Upload className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Solicitar Saques</p>
                  <p className="text-sm text-green-700">Habilitado</p>
                </div>
              </div>
            </div>

            {verificationStatus?.reviewed_at && (
              <p className="text-sm text-gray-600">
                Verificado em: {new Date(verificationStatus.reviewed_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If pending or under review
  if (currentStatus === 'pending' || currentStatus === 'under_review') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Verificação em Andamento</CardTitle>
                <CardDescription>Sua solicitação está sendo analisada</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-5 w-5" />
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Sua documentação está sendo analisada pela nossa equipe. Este processo pode levar até 3 dias úteis.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progresso da Verificação</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            {verificationStatus?.submitted_at && (
              <p className="text-sm text-gray-600">
                Enviado em: {new Date(verificationStatus.submitted_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If rejected or requires additional info
  if (currentStatus === 'rejected' || currentStatus === 'requires_additional_info') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-2xl">
                  {currentStatus === 'rejected' ? 'Verificação Rejeitada' : 'Informações Adicionais Necessárias'}
                </CardTitle>
                <CardDescription>
                  {currentStatus === 'rejected' 
                    ? 'Sua verificação foi rejeitada' 
                    : 'Precisamos de mais informações'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-5 w-5" />
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>

            {verificationStatus?.rejection_reason && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Motivo:</strong> {verificationStatus.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus?.review_notes && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Observações:</strong> {verificationStatus.review_notes}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => setCurrentStep(1)} 
              className="w-full"
            >
              Enviar Nova Verificação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verification form
  const steps = [
    { number: 1, title: 'Informações Pessoais', description: 'Dados pessoais e de contato' },
    { number: 2, title: 'Endereço', description: 'Informações de endereço' },
    { number: 3, title: 'Informações Comerciais', description: 'Dados da empresa (se aplicável)' },
    { number: 4, title: 'Documentos', description: 'Upload de documentos' },
    { number: 5, title: 'Revisão', description: 'Confirmar informações' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Verificação de Identidade</CardTitle>
          <CardDescription>
            Complete sua verificação de identidade para habilitar pagamentos e saques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!paymentPermissions?.canReceivePayments && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Verificação Obrigatória:</strong> Para receber pagamentos e solicitar saques, você precisa completar a verificação de identidade.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      h-1 w-16 mx-2
                      ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center">
              <h3 className="font-medium">{steps[currentStep - 1].title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      {...form.register('fullName')}
                      placeholder="Seu nome completo"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="documentType">Tipo de Documento *</Label>
                    <Select onValueChange={(value) => form.setValue('documentType', value as 'CPF' | 'CNPJ')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CPF">CPF - Pessoa Física</SelectItem>
                        <SelectItem value="CNPJ">CNPJ - Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.documentType && (
                      <p className="text-sm text-red-600">{form.formState.errors.documentType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="documentNumber">
                      {form.watch('documentType') === 'CNPJ' ? 'Número do CNPJ' : 'Número do CPF'} *
                    </Label>
                    <Input
                      id="documentNumber"
                      {...form.register('documentNumber')}
                      placeholder={form.watch('documentType') === 'CNPJ' ? 'XX.XXX.XXX/XXXX-XX' : 'XXX.XXX.XXX-XX'}
                    />
                    {form.formState.errors.documentNumber && (
                      <p className="text-sm text-red-600">{form.formState.errors.documentNumber.message}</p>
                    )}
                  </div>

                  {form.watch('documentType') === 'CPF' && (
                    <div>
                      <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...form.register('dateOfBirth')}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="(11) 99999-9999"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="alternativePhone">Telefone Alternativo</Label>
                    <Input
                      id="alternativePhone"
                      {...form.register('alternativePhone')}
                      placeholder="(11) 9999-9999"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      {...form.register('address.street')}
                      placeholder="Nome da rua"
                    />
                    {form.formState.errors.address?.street && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.street.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      {...form.register('address.number')}
                      placeholder="123"
                    />
                    {form.formState.errors.address?.number && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.number.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      {...form.register('address.complement')}
                      placeholder="Apartamento, sala, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      {...form.register('address.neighborhood')}
                      placeholder="Nome do bairro"
                    />
                    {form.formState.errors.address?.neighborhood && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.neighborhood.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      {...form.register('address.city')}
                      placeholder="Nome da cidade"
                    />
                    {form.formState.errors.address?.city && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.city.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      {...form.register('address.state')}
                      placeholder="SP, RJ, MG..."
                      maxLength={2}
                    />
                    {form.formState.errors.address?.state && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.state.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      {...form.register('address.zipCode')}
                      placeholder="00000-000"
                    />
                    {form.formState.errors.address?.zipCode && (
                      <p className="text-sm text-red-600">{form.formState.errors.address.zipCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {form.watch('documentType') === 'CNPJ' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Razão Social *</Label>
                      <Input
                        id="businessName"
                        {...form.register('businessName')}
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessType">Tipo de Negócio</Label>
                      <Input
                        id="businessType"
                        {...form.register('businessType')}
                        placeholder="E-commerce, Serviços, etc."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="businessActivity">Atividade Principal</Label>
                      <Textarea
                        id="businessActivity"
                        {...form.register('businessActivity')}
                        placeholder="Descreva a atividade principal da empresa"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="monthlyRevenue">Faturamento Mensal (R$)</Label>
                      <Input
                        id="monthlyRevenue"
                        type="number"
                        {...form.register('monthlyRevenue')}
                        placeholder="10000.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Informações Comerciais Opcionais</h3>
                    <p className="text-gray-600">
                      Para CPF, as informações comerciais são opcionais. Você pode prosseguir para o próximo passo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Documento Frente *</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {form.watch('documentType') === 'CNPJ' ? 'Cartão CNPJ (frente)' : 'CPF ou RG (frente)'}
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('documentFront', e)}
                        className="mb-2"
                      />
                      {uploadedFiles.documentFront && (
                        <p className="text-sm text-green-600">✓ Arquivo enviado</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Documento Verso</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {form.watch('documentType') === 'CNPJ' ? 'Cartão CNPJ (verso)' : 'RG (verso)'}
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('documentBack', e)}
                        className="mb-2"
                      />
                      {uploadedFiles.documentBack && (
                        <p className="text-sm text-green-600">✓ Arquivo enviado</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Comprovante de Endereço *</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Conta de luz, água ou telefone (últimos 3 meses)
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('proofOfAddress', e)}
                        className="mb-2"
                      />
                      {uploadedFiles.proofOfAddress && (
                        <p className="text-sm text-green-600">✓ Arquivo enviado</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Selfie com Documento *</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Foto sua segurando o documento
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('selfieWithDocument', e)}
                        className="mb-2"
                      />
                      {uploadedFiles.selfieWithDocument && (
                        <p className="text-sm text-green-600">✓ Arquivo enviado</p>
                      )}
                    </div>
                  </Card>
                </div>

                {form.watch('documentType') === 'CNPJ' && (
                  <Card className="p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Documentos Empresariais</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Contrato social, cartão CNPJ ou outros documentos empresariais
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload('businessDocuments', e)}
                        className="mb-2"
                      />
                      {uploadedFiles.businessDocuments && (
                        <p className="text-sm text-green-600">✓ Arquivo enviado</p>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Revisar Informações</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Nome:</strong> {form.watch('fullName')}
                    </div>
                    <div>
                      <strong>Documento:</strong> {form.watch('documentType')} - {form.watch('documentNumber')}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {form.watch('phone')}
                    </div>
                    <div>
                      <strong>Endereço:</strong> {form.watch('address.street')}, {form.watch('address.number')} - {form.watch('address.city')}/{form.watch('address.state')}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <h4 className="font-medium">Documentos Enviados:</h4>
                    <ul className="text-sm space-y-1">
                      {uploadedFiles.documentFront && <li>✓ Documento (frente)</li>}
                      {uploadedFiles.documentBack && <li>✓ Documento (verso)</li>}
                      {uploadedFiles.proofOfAddress && <li>✓ Comprovante de endereço</li>}
                      {uploadedFiles.selfieWithDocument && <li>✓ Selfie com documento</li>}
                      {uploadedFiles.businessDocuments && <li>✓ Documentos empresariais</li>}
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Ao enviar esta verificação, você confirma que todas as informações são verdadeiras e que os documentos fornecidos são autênticos.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitVerificationMutation.isPending}
                  className="min-w-32"
                >
                  {submitVerificationMutation.isPending ? 'Enviando...' : 'Enviar Verificação'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}