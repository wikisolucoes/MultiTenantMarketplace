import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ExternalLink, Code, Key, Shield, Zap, BookOpen, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocumentation() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              API de Integração WikiStore
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Conecte sistemas externos com sua loja virtual usando nossa API REST completa. 
            Gerencie produtos, pedidos, clientes e muito mais de forma programática.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="authentication">Autenticação</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
            <TabsTrigger value="documentation">Documentação</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-8 w-8 text-cyan-500" />
                    <h3 className="font-semibold text-lg">Segura</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Autenticação baseada em API Keys com controle granular de permissões
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-8 w-8 text-blue-500" />
                    <h3 className="font-semibold text-lg">Rápida</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Rate limiting inteligente e otimizações para máxima performance
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="h-8 w-8 text-green-500" />
                    <h3 className="font-semibold text-lg">REST</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    API REST padrão com formatos JSON e códigos HTTP convencionais
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-8 w-8 text-purple-500" />
                    <h3 className="font-semibold text-lg">Documentada</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Documentação OpenAPI completa com exemplos e testes interativos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Início Rápido
                </CardTitle>
                <CardDescription>
                  Comece a usar a API em 3 passos simples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      1
                    </div>
                    <h4 className="font-semibold mb-2">Criar Credencial</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Acesse o painel de API e crie suas credenciais de acesso
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      2
                    </div>
                    <h4 className="font-semibold mb-2">Configurar Auth</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Use Bearer Token com formato API_KEY:SECRET
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                      3
                    </div>
                    <h4 className="font-semibold mb-2">Fazer Requests</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Comece integrando com endpoints de produtos e pedidos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication */}
          <TabsContent value="authentication" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Autenticação API
                </CardTitle>
                <CardDescription>
                  Como configurar e usar credenciais de API para autenticação segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Gerando Credenciais</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Acesse o painel de "API de Integração" em sua conta para criar novas credenciais. 
                    Cada credencial possui permissões específicas e limite de requisições por hora.
                  </p>
                  
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="font-mono text-sm">
                      <span className="text-cyan-600">API Key:</span> wks_abc123def456...
                      <br />
                      <span className="text-cyan-600">Secret:</span> secret_xyz789uvw012...
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Formato de Autenticação</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Use o header Authorization com Bearer Token no formato API_KEY:SECRET
                  </p>
                  
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
                      onClick={() => copyToClipboard(`Authorization: Bearer wks_abc123:secret_xyz789`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="text-sm">
{`Authorization: Bearer wks_abc123:secret_xyz789`}
                    </pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Exemplo cURL</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
                      onClick={() => copyToClipboard(`curl -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  https://sua-loja.repl.app/api/public/v1/products`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="text-sm">
{`curl -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  https://sua-loja.repl.app/api/public/v1/products`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Controle de requisições por hora baseado na credencial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Limites Padrão</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li>• <Badge variant="secondary">1000 req/hora</Badge> para credenciais básicas</li>
                      <li>• <Badge variant="secondary">5000 req/hora</Badge> para credenciais premium</li>
                      <li>• <Badge variant="secondary">10000 req/hora</Badge> para integrações enterprise</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Headers de Resposta</h4>
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm font-mono">
                      X-RateLimit-Limit: 1000<br />
                      X-RateLimit-Remaining: 999<br />
                      X-RateLimit-Reset: 1640995200
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints */}
          <TabsContent value="endpoints" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Produtos</CardTitle>
                  <CardDescription>Gerenciamento completo de produtos e estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /products</span>
                      <Badge variant="secondary">Listar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /products/:id</span>
                      <Badge variant="secondary">Detalhes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">POST /products</span>
                      <Badge variant="default">Criar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">PUT /products/:id</span>
                      <Badge variant="outline">Atualizar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">PUT /products/:id/stock</span>
                      <Badge variant="outline">Estoque</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pedidos</CardTitle>
                  <CardDescription>Gestão de pedidos e status de entrega</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /orders</span>
                      <Badge variant="secondary">Listar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /orders/:id</span>
                      <Badge variant="secondary">Detalhes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">POST /orders</span>
                      <Badge variant="default">Criar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">PUT /orders/:id/status</span>
                      <Badge variant="outline">Status</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clientes</CardTitle>
                  <CardDescription>Gerenciamento de base de clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /customers</span>
                      <Badge variant="secondary">Listar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /customers/:id</span>
                      <Badge variant="secondary">Detalhes</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">POST /customers</span>
                      <Badge variant="default">Criar</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">PUT /customers/:id</span>
                      <Badge variant="outline">Atualizar</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories & Brands */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categorias & Marcas</CardTitle>
                  <CardDescription>Organização de produtos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /categories</span>
                      <Badge variant="secondary">Categorias</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">GET /brands</span>
                      <Badge variant="secondary">Marcas</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Examples */}
          <TabsContent value="examples" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Exemplos de Integração</CardTitle>
                <CardDescription>
                  Exemplos práticos de como integrar com a API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Listar Produtos */}
                <div>
                  <h4 className="font-semibold mb-3">Listar Produtos</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
                      onClick={() => copyToClipboard(`curl -X GET "https://sua-loja.repl.app/api/public/v1/products?page=1&limit=10" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json"`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="text-sm">
{`curl -X GET "https://sua-loja.repl.app/api/public/v1/products?page=1&limit=10" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json"`}
                    </pre>
                  </div>
                </div>

                <Separator />

                {/* Criar Produto */}
                <div>
                  <h4 className="font-semibold mb-3">Criar Produto</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
                      onClick={() => copyToClipboard(`curl -X POST "https://sua-loja.repl.app/api/public/v1/products" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Smartphone Galaxy S24",
    "description": "Smartphone com 128GB de armazenamento",
    "price": 2999.99,
    "stock": 50,
    "sku": "GALXY-S24-128",
    "categoryId": 1,
    "brandId": 1
  }'`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="text-sm">
{`curl -X POST "https://sua-loja.repl.app/api/public/v1/products" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Smartphone Galaxy S24",
    "description": "Smartphone com 128GB de armazenamento",
    "price": 2999.99,
    "stock": 50,
    "sku": "GALXY-S24-128",
    "categoryId": 1,
    "brandId": 1
  }'`}
                    </pre>
                  </div>
                </div>

                <Separator />

                {/* Atualizar Status do Pedido */}
                <div>
                  <h4 className="font-semibold mb-3">Atualizar Status do Pedido</h4>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-200"
                      onClick={() => copyToClipboard(`curl -X PUT "https://sua-loja.repl.app/api/public/v1/orders/123/status" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "shipped"
  }'`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <pre className="text-sm">
{`curl -X PUT "https://sua-loja.repl.app/api/public/v1/orders/123/status" \\
  -H "Authorization: Bearer wks_abc123:secret_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "shipped"
  }'`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation */}
          <TabsContent value="documentation" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentação Interativa
                </CardTitle>
                <CardDescription>
                  Acesse a documentação OpenAPI completa com testes interativos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Swagger UI Disponível</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Acesse a documentação interativa completa com exemplos e testes em tempo real
                  </p>
                  <Button asChild className="gap-2">
                    <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Abrir Documentação Swagger
                    </a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Recursos Disponíveis</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li>• Documentação completa de todos os endpoints</li>
                      <li>• Exemplos de requisições e respostas</li>
                      <li>• Esquemas JSON detalhados</li>
                      <li>• Teste interativo de APIs</li>
                      <li>• Códigos de erro e tratamento</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Formatos Suportados</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li>• <Badge variant="outline">JSON</Badge> para todas as requisições</li>
                      <li>• <Badge variant="outline">OpenAPI 3.0</Badge> padrão</li>
                      <li>• <Badge variant="outline">REST</Badge> endpoints convencionais</li>
                      <li>• <Badge variant="outline">UTF-8</Badge> encoding</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base URL da API</CardTitle>
                <CardDescription>Endpoint base para todas as requisições</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <code className="text-sm">
                    {window.location.origin}/api/public/v1
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/public/v1`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}