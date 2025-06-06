# WikiStore Frontend Client

Interface React moderna e responsiva para a plataforma WikiStore, oferecendo dashboards administrativos, painéis de merchant e storefronts públicos personalizáveis.

## 🎨 Stack Frontend

### Tecnologias Principais
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** como sistema de design
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento
- **Framer Motion** para animações

### Estrutura de Componentes
```
client/src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base do shadcn/ui
│   ├── AdminDashboard.tsx
│   ├── MerchantDashboard.tsx
│   ├── AdminHeader.tsx
│   └── StorefrontComponents.tsx
├── pages/               # Páginas da aplicação
│   ├── Admin.tsx        # Dashboard administrativo
│   ├── Merchant.tsx     # Dashboard do merchant
│   ├── Home.tsx         # Página inicial
│   ├── CelcoinIntegration.tsx
│   ├── ApiDocumentation.tsx
│   └── Storefront*.tsx  # Páginas públicas
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   └── use-toast.ts
├── lib/                 # Utilitários e configurações
│   ├── queryClient.ts   # Configuração TanStack Query
│   ├── auth.ts          # Utilitários de autenticação
│   └── utils.ts         # Funções auxiliares
├── types/               # Definições de tipos TypeScript
├── App.tsx              # Componente raiz
├── main.tsx             # Ponto de entrada
└── index.css            # Estilos globais
```

## 🚀 Funcionalidades Principais

### 👨‍💼 Dashboard Administrativo
- **Gestão de Tenants**: Visualização e gerenciamento de todas as lojas
- **Analytics Financeiros**: Receita da plataforma e métricas de performance
- **Sistema de Plugins**: Marketplace e gestão de assinaturas
- **Usuários e Permissões**: Controle de acesso granular
- **Relatórios Avançados**: Dados em tempo real com gráficos interativos
- **Monitoramento de Sistema**: Status de serviços e performance

### 🏪 Dashboard Merchant
- **Gestão de Produtos**: CRUD completo com imagens e variações
- **Pedidos e Vendas**: Acompanhamento em tempo real
- **Financeiro**: Saldo, extratos e integrações de pagamento
- **Configurações Fiscais**: Impostos brasileiros (ICMS, IPI, PIS, COFINS)
- **Suporte**: Sistema de tickets integrado
- **Personalização**: Temas e customização da loja

### 🛍️ Storefront Público
- **10+ Temas Profissionais**: Layouts responsivos e modernos
- **Performance Otimizada**: Carregamento rápido e SEO
- **Carrinho de Compras**: Experiência fluida de checkout
- **Pagamentos Integrados**: PIX, boleto e cartões
- **Busca Avançada**: Filtros e categorização
- **Responsivo**: Perfeito em mobile, tablet e desktop

## 🎯 Rotas da Aplicação

### Rotas Públicas
```
/                        # Home/Landing page
/storefront/*           # Storefronts públicos dos tenants
/themes                 # Galeria de temas
```

### Rotas Autenticadas - Admin
```
/admin                  # Dashboard principal do admin
/admin-support         # Centro de suporte administrativo
/api-docs              # Documentação da API
```

### Rotas Autenticadas - Merchant
```
/merchant              # Dashboard principal do merchant
/products              # Gestão de produtos
/tax-config           # Configuração fiscal
/plugins              # Assinaturas de plugins
/support              # Centro de suporte do merchant
/celcoin              # Integração financeira Celcoin
/api-credentials      # Credenciais da API pública
```

## 🔐 Sistema de Autenticação

### Contexto de Autenticação
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

### Proteção de Rotas
```typescript
// App.tsx
function AppRouter() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [userRole, setUserRole] = useState<string | null>(null);

  return (
    <Switch>
      <Route path="/admin">
        {isAuth && userRole === "admin" ? <Admin /> : <Home />}
      </Route>
      <Route path="/merchant">
        {isAuth && userRole === "merchant" ? <Merchant /> : <Home />}
      </Route>
      <Route path="/celcoin">
        {isAuth && (userRole === "admin" || userRole === "merchant") ? 
          <CelcoinIntegration /> : <Home />}
      </Route>
    </Switch>
  );
}
```

### Tratamento de Erros de Autorização
```typescript
// Nível de página
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Não autorizado",
      description: "Você foi desconectado. Fazendo login novamente...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }
}, [isAuthenticated, isLoading, toast]);

// Nível de endpoint
const mutation = useMutation({
  onError: (error) => {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Não autorizado",
        description: "Sessão expirou. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  },
});
```

## 📊 Gerenciamento de Estado

### TanStack Query Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('401')) return false;
        return failureCount < 3;
      },
    },
  },
});

export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<any> {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return response.json();
}
```

### Queries e Mutations
```typescript
// Exemplo de uso em componente
function ProductManagement() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/tenant/products'],
  });

  const createProductMutation = useMutation({
    mutationFn: (productData) => 
      apiRequest('POST', '/api/tenant/products', productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/products'] });
      toast({
        title: "Produto criado",
        description: "Produto foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      {isLoading ? (
        <div className="animate-pulse">Carregando...</div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
}
```

## 🎨 Sistema de Design

### Configuração Tailwind
```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Cores específicas da WikiStore
        'wiki-cyan': {
          50: '#f0fdfa',
          500: '#06b6d4',
          600: '#0891b2',
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### Componentes shadcn/ui
```typescript
// Exemplo de componente customizado
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function MetricCard({ title, value, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Badge variant={trend > 0 ? "default" : "destructive"}>
          {trend > 0 ? "+" : ""}{trend}%
        </Badge>
      </CardContent>
    </Card>
  );
}
```

## 📱 Responsividade e Mobile

### Grid System Responsivo
```typescript
// Exemplo de layout responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {metrics.map((metric) => (
    <MetricCard key={metric.id} {...metric} />
  ))}
</div>

// Navigation responsiva
<nav className="hidden md:flex space-x-8">
  <NavLinks />
</nav>
<MobileMenu className="md:hidden" />
```

### Breakpoints Tailwind
```css
/* Breakpoints utilizados */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## 🎭 Sistema de Temas

### Implementação de Temas
```typescript
// Contexto de tema
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Uso em componentes
const { theme, setTheme } = useTheme();

<Button
  variant="ghost"
  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
>
  {theme === "light" ? <Moon /> : <Sun />}
</Button>
```

### CSS Variables para Temas
```css
/* index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
}
```

## 📊 Componentes de Dados

### Tabelas Avançadas
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DataTable({ data, columns }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.render ? column.render(row) : row[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Gráficos com Recharts
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function RevenueChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
        <Bar dataKey="revenue" fill="#06b6d4" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## 🔔 Sistema de Notificações

### Toast Notifications
```typescript
// hooks/use-toast.ts
import { useToast as useToastPrimitive } from "@/components/ui/use-toast";

export function useToast() {
  const { toast: toastPrimitive } = useToastPrimitive();

  const toast = (props: ToastProps) => {
    return toastPrimitive({
      duration: 5000,
      ...props,
    });
  };

  const success = (message: string) => {
    toast({
      title: "Sucesso",
      description: message,
      variant: "default",
    });
  };

  const error = (message: string) => {
    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
  };

  return { toast, success, error };
}
```

### Notificações em Tempo Real
```typescript
// WebSocket para notificações
useEffect(() => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    
    if (notification.type === 'new_order') {
      toast({
        title: "Novo Pedido",
        description: `Pedido #${notification.data.id} recebido`,
      });
    }
  };

  return () => socket.close();
}, []);
```

## 📋 Formulários Avançados

### React Hook Form + Zod
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().positive("Preço deve ser positivo"),
  description: z.string().optional(),
});

function ProductForm({ onSubmit }: ProductFormProps) {
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      description: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </form>
    </Form>
  );
}
```

## 🔍 Busca e Filtros

### Componente de Busca
```typescript
function SearchAndFilter({ onSearch, onFilter }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});

  const debouncedSearch = useCallback(
    debounce((term: string) => onSearch(term), 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      
      <Select value={filters.category} onValueChange={(value) => 
        setFilters(prev => ({ ...prev, category: value }))
      }>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="electronics">Eletrônicos</SelectItem>
          <SelectItem value="clothing">Roupas</SelectItem>
          <SelectItem value="books">Livros</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## 📊 Performance e Otimização

### Lazy Loading de Componentes
```typescript
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const MerchantDashboard = lazy(() => import('@/components/MerchantDashboard'));

function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <Router />
    </Suspense>
  );
}
```

### Memoização de Componentes
```typescript
import { memo, useMemo } from 'react';

const ProductCard = memo(({ product }: { product: Product }) => {
  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(product.price), 
    [product.price]
  );

  return (
    <Card>
      <CardContent>
        <h3>{product.name}</h3>
        <p>{formattedPrice}</p>
      </CardContent>
    </Card>
  );
});
```

## 🧪 Desenvolvimento e Debug

### Variáveis de Ambiente
```env
# Desenvolvimento
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws

# Stripe (frontend)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=false
```

### Debug Tools
```typescript
// Modo desenvolvimento
if (import.meta.env.DEV) {
  console.log('Development mode:', {
    user: currentUser,
    tenant: currentTenant,
    features: enabledFeatures
  });
}

// React Query Devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        {import.meta.env.DEV && <ReactQueryDevtools />}
      </QueryClientProvider>
    </>
  );
}
```

## 🔧 Build e Deployment

### Scripts Disponíveis
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives",
    "type-check": "tsc --noEmit"
  }
}
```

### Configuração de Build
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, '../attached_assets')
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
});
```

## 🚀 Recursos Avançados

### Custom Hooks
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Utilitários
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

**WikiStore Frontend** - Interface moderna e performática para e-commerce multi-tenant