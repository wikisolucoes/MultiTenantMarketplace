import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Package, Settings, AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  ncm?: string;
  cest?: string;
  cfop?: string;
  icmsOrigin?: string;
  icmsCst?: string;
  icmsRate?: string;
  ipiCst?: string;
  ipiRate?: string;
  pisCst?: string;
  pisRate?: string;
  cofinsCst?: string;
  cofinsRate?: string;
  productUnit?: string;
  grossWeight?: string;
  netWeight?: string;
}

interface NfeConfig {
  id?: number;
  tenantId: number;
  environment: string;
  serie: number;
  nextNumber: number;
  isActive: boolean;
}

export default function TaxConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nfeConfig, setNfeConfig] = useState<NfeConfig>({
    tenantId: 1,
    environment: 'homologacao',
    serie: 1,
    nextNumber: 1,
    isActive: false,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/tenant/products'],
  });

  // Fetch NF-e configuration
  const { data: nfeConfiguration } = useQuery<NfeConfig>({
    queryKey: ['/api/tenant/nfe-config'],
  });

  useEffect(() => {
    if (nfeConfiguration) {
      setNfeConfig(nfeConfiguration);
    }
  }, [nfeConfiguration]);

  // Update product tax configuration
  const updateProductMutation = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const response = await apiRequest("PUT", `/api/tenant/products/${selectedProduct?.id}`, productData);
      if (!response.ok) throw new Error("Failed to update product");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto atualizado",
        description: "Configurações tributárias salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/products'] });
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar produto",
        variant: "destructive",
      });
    },
  });

  // Update NF-e configuration
  const updateNfeConfigMutation = useMutation({
    mutationFn: async (configData: Partial<NfeConfig>) => {
      const response = await apiRequest("PUT", "/api/tenant/nfe-config", configData);
      if (!response.ok) throw new Error("Failed to update NF-e config");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuração NF-e atualizada",
        description: "Configurações salvas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/nfe-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar configuração NF-e",
        variant: "destructive",
      });
    },
  });

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const productData = {
      ncm: formData.get('ncm') as string,
      cest: formData.get('cest') as string,
      cfop: formData.get('cfop') as string,
      icmsOrigin: formData.get('icmsOrigin') as string,
      icmsCst: formData.get('icmsCst') as string,
      icmsRate: formData.get('icmsRate') as string,
      ipiCst: formData.get('ipiCst') as string,
      ipiRate: formData.get('ipiRate') as string,
      pisCst: formData.get('pisCst') as string,
      pisRate: formData.get('pisRate') as string,
      cofinsCst: formData.get('cofinsCst') as string,
      cofinsRate: formData.get('cofinsRate') as string,
      productUnit: formData.get('productUnit') as string,
      grossWeight: formData.get('grossWeight') as string,
      netWeight: formData.get('netWeight') as string,
    };

    updateProductMutation.mutate(productData);
  };

  const handleNfeConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNfeConfigMutation.mutate(nfeConfig);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações Tributárias</h1>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="nfe">Configuração NF-e</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Tributária dos Produtos</CardTitle>
              <CardDescription>
                Configure as informações tributárias necessárias para emissão de NF-e
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Products List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produtos
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {products?.map((product) => (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                R$ {product.price} • Estoque: {product.stock}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              {product.ncm ? (
                                <Badge variant="secondary" className="text-xs">NCM: {product.ncm}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Sem NCM
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Tax Configuration Form */}
                <div className="space-y-4">
                  {selectedProduct ? (
                    <>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuração: {selectedProduct.name}
                      </h3>
                      <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="ncm">NCM</Label>
                            <Input
                              id="ncm"
                              name="ncm"
                              placeholder="00000000"
                              defaultValue={selectedProduct.ncm || ''}
                              maxLength={8}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cest">CEST</Label>
                            <Input
                              id="cest"
                              name="cest"
                              placeholder="0000000"
                              defaultValue={selectedProduct.cest || ''}
                              maxLength={7}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cfop">CFOP</Label>
                            <Select name="cfop" defaultValue={selectedProduct.cfop || ''}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione CFOP" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5102">5102 - Venda de mercadoria</SelectItem>
                                <SelectItem value="5403">5403 - Venda de mercadoria sujeita ao regime de substituição tributária</SelectItem>
                                <SelectItem value="6102">6102 - Venda de mercadoria para outro estado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="icmsOrigin">Origem ICMS</Label>
                            <Select name="icmsOrigin" defaultValue={selectedProduct.icmsOrigin || ''}>
                              <SelectTrigger>
                                <SelectValue placeholder="Origem" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0 - Nacional</SelectItem>
                                <SelectItem value="1">1 - Estrangeira (importação direta)</SelectItem>
                                <SelectItem value="2">2 - Estrangeira (adquirida no mercado interno)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">ICMS</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="icmsCst">CST ICMS</Label>
                              <Select name="icmsCst" defaultValue={selectedProduct.icmsCst || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="CST" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="00">00 - Tributada integralmente</SelectItem>
                                  <SelectItem value="10">10 - Tributada e com cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="20">20 - Com redução de base de cálculo</SelectItem>
                                  <SelectItem value="30">30 - Isenta ou não tributada e com cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="40">40 - Isenta</SelectItem>
                                  <SelectItem value="41">41 - Não tributada</SelectItem>
                                  <SelectItem value="50">50 - Suspensão</SelectItem>
                                  <SelectItem value="51">51 - Diferimento</SelectItem>
                                  <SelectItem value="60">60 - ICMS cobrado anteriormente por substituição tributária</SelectItem>
                                  <SelectItem value="70">70 - Com redução de base de cálculo e cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="90">90 - Outras</SelectItem>
                                  <SelectItem value="101">101 - Tributada pelo Simples Nacional com permissão de crédito</SelectItem>
                                  <SelectItem value="102">102 - Tributada pelo Simples Nacional sem permissão de crédito</SelectItem>
                                  <SelectItem value="103">103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta</SelectItem>
                                  <SelectItem value="201">201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="202">202 - Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="203">203 - Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária</SelectItem>
                                  <SelectItem value="300">300 - Imune</SelectItem>
                                  <SelectItem value="400">400 - Não tributada pelo Simples Nacional</SelectItem>
                                  <SelectItem value="500">500 - ICMS cobrado anteriormente por substituição tributária (substituído) ou por antecipação</SelectItem>
                                  <SelectItem value="900">900 - Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="icmsRate">Alíquota ICMS (%)</Label>
                              <Input
                                id="icmsRate"
                                name="icmsRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={selectedProduct.icmsRate || ''}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">IPI</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="ipiCst">CST IPI</Label>
                              <Select name="ipiCst" defaultValue={selectedProduct.ipiCst || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="CST" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="00">00 - Entrada com recuperação de crédito</SelectItem>
                                  <SelectItem value="01">01 - Entrada tributável com alíquota zero</SelectItem>
                                  <SelectItem value="02">02 - Entrada isenta</SelectItem>
                                  <SelectItem value="03">03 - Entrada não-tributada</SelectItem>
                                  <SelectItem value="04">04 - Entrada imune</SelectItem>
                                  <SelectItem value="05">05 - Entrada com suspensão</SelectItem>
                                  <SelectItem value="49">49 - Outras entradas</SelectItem>
                                  <SelectItem value="50">50 - Saída tributada</SelectItem>
                                  <SelectItem value="51">51 - Saída tributável com alíquota zero</SelectItem>
                                  <SelectItem value="52">52 - Saída isenta</SelectItem>
                                  <SelectItem value="53">53 - Saída não-tributada</SelectItem>
                                  <SelectItem value="54">54 - Saída imune</SelectItem>
                                  <SelectItem value="55">55 - Saída com suspensão</SelectItem>
                                  <SelectItem value="99">99 - Outras saídas</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="ipiRate">Alíquota IPI (%)</Label>
                              <Input
                                id="ipiRate"
                                name="ipiRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={selectedProduct.ipiRate || ''}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">PIS/PASEP</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="pisCst">CST PIS</Label>
                              <Select name="pisCst" defaultValue={selectedProduct.pisCst || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="CST" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="01">01 - Operação Tributável (base de cálculo = valor da operação alíquota normal)</SelectItem>
                                  <SelectItem value="02">02 - Operação Tributável (base de cálculo = valor da operação (alíquota diferenciada))</SelectItem>
                                  <SelectItem value="03">03 - Operação Tributável (base de cálculo = quantidade vendida x alíquota por unidade de produto)</SelectItem>
                                  <SelectItem value="04">04 - Operação Tributável (tributação monofásica (alíquota zero))</SelectItem>
                                  <SelectItem value="05">05 - Operação Tributável (Substituição Tributária)</SelectItem>
                                  <SelectItem value="06">06 - Operação Tributável (alíquota zero)</SelectItem>
                                  <SelectItem value="07">07 - Operação Isenta da Contribuição</SelectItem>
                                  <SelectItem value="08">08 - Operação Sem Incidência da Contribuição</SelectItem>
                                  <SelectItem value="09">09 - Operação com Suspensão da Contribuição</SelectItem>
                                  <SelectItem value="49">49 - Outras Operações de Saída</SelectItem>
                                  <SelectItem value="50">50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="51">51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="52">52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação</SelectItem>
                                  <SelectItem value="53">53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno</SelectItem>
                                  <SelectItem value="54">54 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="55">55 - Operação com Direito a Crédito - Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="56">56 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação</SelectItem>
                                  <SelectItem value="60">60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="61">61 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="62">62 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação</SelectItem>
                                  <SelectItem value="63">63 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno</SelectItem>
                                  <SelectItem value="64">64 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="65">65 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="66">66 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação</SelectItem>
                                  <SelectItem value="67">67 - Crédito Presumido - Outras Operações</SelectItem>
                                  <SelectItem value="70">70 - Operação de Aquisição sem Direito a Crédito</SelectItem>
                                  <SelectItem value="71">71 - Operação de Aquisição com Isenção</SelectItem>
                                  <SelectItem value="72">72 - Operação de Aquisição com Suspensão</SelectItem>
                                  <SelectItem value="73">73 - Operação de Aquisição a Alíquota Zero</SelectItem>
                                  <SelectItem value="74">74 - Operação de Aquisição; sem Incidência da Contribuição</SelectItem>
                                  <SelectItem value="75">75 - Operação de Aquisição por Substituição Tributária</SelectItem>
                                  <SelectItem value="98">98 - Outras Operações de Entrada</SelectItem>
                                  <SelectItem value="99">99 - Outras Operações</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="pisRate">Alíquota PIS (%)</Label>
                              <Input
                                id="pisRate"
                                name="pisRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={selectedProduct.pisRate || ''}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">COFINS</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="cofinsCst">CST COFINS</Label>
                              <Select name="cofinsCst" defaultValue={selectedProduct.cofinsCst || ''}>
                                <SelectTrigger>
                                  <SelectValue placeholder="CST" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="01">01 - Operação Tributável (base de cálculo = valor da operação alíquota normal)</SelectItem>
                                  <SelectItem value="02">02 - Operação Tributável (base de cálculo = valor da operação (alíquota diferenciada))</SelectItem>
                                  <SelectItem value="03">03 - Operação Tributável (base de cálculo = quantidade vendida x alíquota por unidade de produto)</SelectItem>
                                  <SelectItem value="04">04 - Operação Tributável (tributação monofásica (alíquota zero))</SelectItem>
                                  <SelectItem value="05">05 - Operação Tributável (Substituição Tributária)</SelectItem>
                                  <SelectItem value="06">06 - Operação Tributável (alíquota zero)</SelectItem>
                                  <SelectItem value="07">07 - Operação Isenta da Contribuição</SelectItem>
                                  <SelectItem value="08">08 - Operação Sem Incidência da Contribuição</SelectItem>
                                  <SelectItem value="09">09 - Operação com Suspensão da Contribuição</SelectItem>
                                  <SelectItem value="49">49 - Outras Operações de Saída</SelectItem>
                                  <SelectItem value="50">50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="51">51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="52">52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação</SelectItem>
                                  <SelectItem value="53">53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno</SelectItem>
                                  <SelectItem value="54">54 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="55">55 - Operação com Direito a Crédito - Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="56">56 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação</SelectItem>
                                  <SelectItem value="60">60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="61">61 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno</SelectItem>
                                  <SelectItem value="62">62 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação</SelectItem>
                                  <SelectItem value="63">63 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno</SelectItem>
                                  <SelectItem value="64">64 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="65">65 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação</SelectItem>
                                  <SelectItem value="66">66 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno, e de Exportação</SelectItem>
                                  <SelectItem value="67">67 - Crédito Presumido - Outras Operações</SelectItem>
                                  <SelectItem value="70">70 - Operação de Aquisição sem Direito a Crédito</SelectItem>
                                  <SelectItem value="71">71 - Operação de Aquisição com Isenção</SelectItem>
                                  <SelectItem value="72">72 - Operação de Aquisição com Suspensão</SelectItem>
                                  <SelectItem value="73">73 - Operação de Aquisição a Alíquota Zero</SelectItem>
                                  <SelectItem value="74">74 - Operação de Aquisição; sem Incidência da Contribuição</SelectItem>
                                  <SelectItem value="75">75 - Operação de Aquisição por Substituição Tributária</SelectItem>
                                  <SelectItem value="98">98 - Outras Operações de Entrada</SelectItem>
                                  <SelectItem value="99">99 - Outras Operações</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="cofinsRate">Alíquota COFINS (%)</Label>
                              <Input
                                id="cofinsRate"
                                name="cofinsRate"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                defaultValue={selectedProduct.cofinsRate || ''}
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Informações Adicionais</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="productUnit">Unidade</Label>
                              <Select name="productUnit" defaultValue={selectedProduct.productUnit || 'UN'}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UN">UN - Unidade</SelectItem>
                                  <SelectItem value="KG">KG - Quilograma</SelectItem>
                                  <SelectItem value="G">G - Grama</SelectItem>
                                  <SelectItem value="L">L - Litro</SelectItem>
                                  <SelectItem value="ML">ML - Mililitro</SelectItem>
                                  <SelectItem value="M">M - Metro</SelectItem>
                                  <SelectItem value="CM">CM - Centímetro</SelectItem>
                                  <SelectItem value="M2">M² - Metro quadrado</SelectItem>
                                  <SelectItem value="M3">M³ - Metro cúbico</SelectItem>
                                  <SelectItem value="PC">PC - Peça</SelectItem>
                                  <SelectItem value="PAR">PAR - Par</SelectItem>
                                  <SelectItem value="CX">CX - Caixa</SelectItem>
                                  <SelectItem value="FD">FD - Fardo</SelectItem>
                                  <SelectItem value="SC">SC - Saco</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="grossWeight">Peso Bruto (kg)</Label>
                              <Input
                                id="grossWeight"
                                name="grossWeight"
                                type="number"
                                step="0.001"
                                placeholder="0.000"
                                defaultValue={selectedProduct.grossWeight || ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="netWeight">Peso Líquido (kg)</Label>
                              <Input
                                id="netWeight"
                                name="netWeight"
                                type="number"
                                step="0.001"
                                placeholder="0.000"
                                defaultValue={selectedProduct.netWeight || ''}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedProduct(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateProductMutation.isPending}
                          >
                            {updateProductMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Selecione um produto para configurar as informações tributárias</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfe" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração NF-e</CardTitle>
              <CardDescription>
                Configure os parâmetros para emissão de Nota Fiscal Eletrônica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNfeConfigSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="environment">Ambiente</Label>
                    <Select
                      value={nfeConfig.environment}
                      onValueChange={(value) => setNfeConfig({ ...nfeConfig, environment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ambiente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="serie">Série</Label>
                    <Input
                      id="serie"
                      type="number"
                      value={nfeConfig.serie}
                      onChange={(e) => setNfeConfig({ ...nfeConfig, serie: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nextNumber">Próximo Número</Label>
                    <Input
                      id="nextNumber"
                      type="number"
                      value={nfeConfig.nextNumber}
                      onChange={(e) => setNfeConfig({ ...nfeConfig, nextNumber: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={nfeConfig.isActive}
                      onChange={(e) => setNfeConfig({ ...nfeConfig, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive">Ativar emissão de NF-e</Label>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Certificado Digital</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para emitir NF-e em produção, é necessário configurar o certificado digital A1.
                    Entre em contato com o suporte para assistência na configuração.
                  </p>
                  <Button type="button" variant="outline" size="sm">
                    Configurar Certificado
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateNfeConfigMutation.isPending}
                  >
                    {updateNfeConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}