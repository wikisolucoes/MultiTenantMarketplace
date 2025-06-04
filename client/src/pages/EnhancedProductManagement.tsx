import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getUserTenantId } from "@/lib/auth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Package, 
  Tag, 
  Percent, 
  Calculator,
  Globe,
  Star,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Settings
} from "lucide-react";

// Enhanced product schema with all advanced features
const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  sku: z.string().min(1, "SKU é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  compareAtPrice: z.string().optional(),
  costPrice: z.string().min(1, "Preço de custo é obrigatório"),
  stock: z.number().min(0, "Estoque deve ser não negativo"),
  minStock: z.number().min(0, "Estoque mínimo deve ser não negativo"),
  maxStock: z.number().min(1, "Estoque máximo deve ser positivo"),
  brandId: z.number().optional(),
  categoryId: z.number().optional(),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  // Brazilian tax fields
  ncmCode: z.string().optional(),
  cfopCode: z.string().optional(),
  icmsRate: z.string().optional(),
  ipiRate: z.string().optional(),
  pisRate: z.string().optional(),
  cofinsRate: z.string().optional(),
  origin: z.string().optional(),
  cest: z.string().optional(),
  // Related data
  images: z.array(z.object({
    url: z.string(),
    altText: z.string(),
    sortOrder: z.number(),
    isPrimary: z.boolean()
  })).default([]),
  specifications: z.array(z.object({
    name: z.string(),
    value: z.string(),
    sortOrder: z.number()
  })).default([]),
  bulkPricingRules: z.array(z.object({
    minQuantity: z.number(),
    maxQuantity: z.number().nullable(),
    pricePerUnit: z.string(),
    discountPercentage: z.string(),
    isActive: z.boolean()
  })).default([])
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EnhancedProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tenantId = getUserTenantId();
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch products with details
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/products/${tenantId}`],
    enabled: !!tenantId,
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: [`/api/brands/${tenantId}`],
    enabled: !!tenantId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: [`/api/categories/${tenantId}`],
    enabled: !!tenantId,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: "",
      compareAtPrice: "",
      costPrice: "",
      stock: 0,
      minStock: 0,
      maxStock: 100,
      isActive: true,
      isFeatured: false,
      tags: [],
      images: [],
      specifications: [],
      bulkPricingRules: []
    }
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images"
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control: form.control,
    name: "specifications"
  });

  const { fields: bulkFields, append: appendBulk, remove: removeBulk } = useFieldArray({
    control: form.control,
    name: "bulkPricingRules"
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        tenantId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${tenantId}`] });
      setIsProductDialogOpen(false);
      form.reset();
      toast({
        title: "Produto criado!",
        description: "Produto criado com sucesso com todas as funcionalidades avançadas."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar produto.",
        variant: "destructive"
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id: number }) => {
      const { id, ...productData } = data;
      const response = await apiRequest("PUT", `/api/products/${id}`, {
        ...productData,
        tenantId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${tenantId}`] });
      setIsProductDialogOpen(false);
      setSelectedProduct(null);
      form.reset();
      toast({
        title: "Produto atualizado!",
        description: "Produto atualizado com sucesso."
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`, { tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${tenantId}`] });
      toast({
        title: "Produto excluído!",
        description: "Produto excluído com sucesso."
      });
    }
  });

  const handleSubmit = (data: ProductFormData) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ ...data, id: selectedProduct.id });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    form.reset({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      stock: product.stock || 0,
      categoryId: product.categoryId || "",
      brandId: product.brandId || "",
      isActive: product.isActive || true,
      ncm: product.ncm || "",
      cest: product.cest || "",
      cfop: product.cfop || "",
      icmsOrigin: product.icmsOrigin || "",
      icmsCst: product.icmsCst || "",
      icmsRate: product.icmsRate?.toString() || "",
      ipiCst: product.ipiCst || "",
      ipiRate: product.ipiRate?.toString() || "",
      pisCst: product.pisCst || "",
      pisRate: product.pisRate?.toString() || "",
      cofinsCst: product.cofinsCst || "",
      cofinsRate: product.cofinsRate?.toString() || "",
      productUnit: product.productUnit || "",
      grossWeight: product.grossWeight?.toString() || "",
      netWeight: product.netWeight?.toString() || "",
      compareAtPrice: "",
      costPrice: "",
      images: [],
      specifications: [],
      bulkPricingRules: []
    });
    setIsProductDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    
    // Simulate image upload - replace with actual upload logic
    const newImages = Array.from(files).map((file, index) => ({
      url: URL.createObjectURL(file),
      altText: `Imagem do produto ${index + 1}`,
      sortOrder: imageFields.length + index,
      isPrimary: imageFields.length === 0 && index === 0
    }));

    newImages.forEach(image => appendImage(image));
    setUploadingImages(false);
    
    toast({
      title: "Imagens adicionadas!",
      description: `${files.length} imagem(ns) adicionada(s) com sucesso.`
    });
  };

  const calculateBulkPrice = (originalPrice: string, quantity: number) => {
    const basePrice = parseFloat(originalPrice);
    const rules = form.watch("bulkPricingRules");
    
    for (const rule of rules) {
      if (quantity >= rule.minQuantity && (rule.maxQuantity === null || quantity <= rule.maxQuantity)) {
        return parseFloat(rule.pricePerUnit);
      }
    }
    
    return basePrice;
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão Avançada de Produtos</h1>
          <p className="text-muted-foreground">
            Sistema completo com imagens, especificações, preços em atacado e configuração fiscal
          </p>
        </div>
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedProduct(null); form.reset(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? "Editar Produto" : "Criar Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                Configure todas as propriedades avançadas do produto
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="images">Imagens</TabsTrigger>
                    <TabsTrigger value="specs">Especificações</TabsTrigger>
                    <TabsTrigger value="pricing">Atacado</TabsTrigger>
                    <TabsTrigger value="tax">Impostos</TabsTrigger>
                  </TabsList>

                  {/* Basic Information Tab */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Smartphone Premium X1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: SPX1-001" {...field} />
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
                            <Textarea 
                              placeholder="Descrição detalhada do produto..."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Venda (R$)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compareAtPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço "De" (R$)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormDescription>Preço riscado para comparação</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="costPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Custo (R$)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma marca" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brands.map((brand: any) => (
                                  <SelectItem key={brand.id} value={brand.id.toString()}>
                                    {brand.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque Atual</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque Mínimo</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque Máximo</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Produto Ativo</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Produto em Destaque</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Images Tab */}
                  <TabsContent value="images" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Imagens do Produto</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImages ? "Enviando..." : "Adicionar Imagens"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {imageFields.map((field, index) => (
                        <Card key={field.id} className="relative">
                          <CardContent className="p-4">
                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                              {field.url ? (
                                <img 
                                  src={field.url} 
                                  alt={field.altText}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <Input
                              placeholder="Texto alternativo"
                              value={field.altText}
                              onChange={(e) => {
                                const images = form.getValues("images");
                                images[index].altText = e.target.value;
                                form.setValue("images", images);
                              }}
                              className="mb-2"
                            />
                            <div className="flex items-center justify-between">
                              <Badge variant={field.isPrimary ? "default" : "secondary"}>
                                {field.isPrimary ? "Principal" : "Secundária"}
                              </Badge>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeImage(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {imageFields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma imagem adicionada ainda</p>
                        <p className="text-sm">Clique em "Adicionar Imagens" para começar</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Specifications Tab */}
                  <TabsContent value="specs" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Especificações Técnicas</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendSpec({ name: "", value: "", sortOrder: specFields.length })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Especificação
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {specFields.map((field, index) => (
                        <div key={field.id} className="flex items-center space-x-3">
                          <Input
                            placeholder="Nome (ex: Processador)"
                            value={field.name}
                            onChange={(e) => {
                              const specs = form.getValues("specifications");
                              specs[index].name = e.target.value;
                              form.setValue("specifications", specs);
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Valor (ex: Intel Core i7)"
                            value={field.value}
                            onChange={(e) => {
                              const specs = form.getValues("specifications");
                              specs[index].value = e.target.value;
                              form.setValue("specifications", specs);
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSpec(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {specFields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma especificação adicionada ainda</p>
                        <p className="text-sm">Adicione especificações técnicas do produto</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Bulk Pricing Tab */}
                  <TabsContent value="pricing" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Preços em Atacado</Label>
                        <p className="text-sm text-muted-foreground">Configure preços especiais por quantidade</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendBulk({ 
                          minQuantity: 1, 
                          maxQuantity: null, 
                          pricePerUnit: "0.00", 
                          discountPercentage: "0.00", 
                          isActive: true 
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Regra
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {bulkFields.map((field, index) => (
                        <Card key={field.id}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-5 gap-3 items-end">
                              <div>
                                <Label className="text-xs">Qtd. Mínima</Label>
                                <Input
                                  type="number"
                                  value={field.minQuantity}
                                  onChange={(e) => {
                                    const rules = form.getValues("bulkPricingRules");
                                    rules[index].minQuantity = parseInt(e.target.value) || 0;
                                    form.setValue("bulkPricingRules", rules);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Qtd. Máxima</Label>
                                <Input
                                  type="number"
                                  placeholder="Ilimitado"
                                  value={field.maxQuantity || ""}
                                  onChange={(e) => {
                                    const rules = form.getValues("bulkPricingRules");
                                    rules[index].maxQuantity = e.target.value ? parseInt(e.target.value) : null;
                                    form.setValue("bulkPricingRules", rules);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Preço Unitário</Label>
                                <Input
                                  placeholder="0.00"
                                  value={field.pricePerUnit}
                                  onChange={(e) => {
                                    const rules = form.getValues("bulkPricingRules");
                                    rules[index].pricePerUnit = e.target.value;
                                    form.setValue("bulkPricingRules", rules);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Desconto (%)</Label>
                                <Input
                                  placeholder="0.00"
                                  value={field.discountPercentage}
                                  onChange={(e) => {
                                    const rules = form.getValues("bulkPricingRules");
                                    rules[index].discountPercentage = e.target.value;
                                    form.setValue("bulkPricingRules", rules);
                                  }}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeBulk(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {bulkFields.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma regra de atacado configurada</p>
                        <p className="text-sm">Configure preços especiais para vendas em quantidade</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tax Configuration Tab */}
                  <TabsContent value="tax" className="space-y-4">
                    <Label>Configuração Fiscal Brasileira</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ncmCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código NCM</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 8517.12.31" {...field} />
                            </FormControl>
                            <FormDescription>Nomenclatura Comum do Mercosul</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cfopCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código CFOP</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 5102" {...field} />
                            </FormControl>
                            <FormDescription>Código Fiscal de Operações e Prestações</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="icmsRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ICMS (%)</FormLabel>
                            <FormControl>
                              <Input placeholder="18.00" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ipiRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IPI (%)</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origem</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">0 - Nacional</SelectItem>
                                <SelectItem value="1">1 - Estrangeira - Importação direta</SelectItem>
                                <SelectItem value="2">2 - Estrangeira - Adquirida no mercado interno</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="pisRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIS (%)</FormLabel>
                            <FormControl>
                              <Input placeholder="1.65" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cofinsRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>COFINS (%)</FormLabel>
                            <FormControl>
                              <Input placeholder="7.60" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEST</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 2100100" {...field} />
                            </FormControl>
                            <FormDescription>Código Especificador da Substituição Tributária</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsProductDialogOpen(false);
                      setSelectedProduct(null);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {selectedProduct ? "Atualizar" : "Criar"} Produto
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Produtos ({products.length})
          </CardTitle>
          <CardDescription>
            Gerencie todos os seus produtos com funcionalidades avançadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.brand?.name} • {product.category?.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">R$ {parseFloat(product.price).toFixed(2)}</div>
                      {product.compareAtPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          R$ {parseFloat(product.compareAtPrice).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock > product.minStock ? "success" : "destructive"}>
                      {product.stock} un.
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={product.isActive ? "success" : "secondary"}>
                        {product.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
              <p className="text-sm">Clique em "Novo Produto" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}