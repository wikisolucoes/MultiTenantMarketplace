import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Monitor, Smartphone, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModernTheme from "./themes/ModernTheme";
import ClassicTheme from "./themes/ClassicTheme";
import MinimalTheme from "./themes/MinimalTheme";
import BoldTheme from "./themes/BoldTheme";
import ElegantTheme from "./themes/ElegantTheme";

interface ThemeManagerProps {
  tenant: any;
  products: any[];
  banners: any[];
  onThemeChange: (theme: string) => void;
  currentTheme: string;
  wishlist: number[];
  onProductClick: (product: any) => void;
  onAddToCart: (product: any) => void;
  onToggleWishlist: (productId: number) => void;
}

const themeConfigs = {
  modern: {
    name: "Modern",
    description: "Design contemporâneo com gradientes e animações fluidas",
    color: "from-cyan-500 to-teal-600",
    preview: "https://images.unsplash.com/photo-1558618756-fcd25c85cd64?w=300&h=200&fit=crop",
    features: ["Gradientes modernos", "Animações fluidas", "Design responsivo", "Banner carousel"],
    component: ModernTheme
  },
  classic: {
    name: "Classic",
    description: "Estilo tradicional e elegante com toques dourados",
    color: "from-amber-500 to-orange-600",
    preview: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
    features: ["Design tradicional", "Tipografia serif", "Cores quentes", "Layout formal"],
    component: ClassicTheme
  },
  minimal: {
    name: "Minimal",
    description: "Simplicidade e clean design com foco no conteúdo",
    color: "from-gray-400 to-gray-600",
    preview: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop",
    features: ["Design limpo", "Espaços amplos", "Tipografia leve", "Foco no produto"],
    component: MinimalTheme
  },
  bold: {
    name: "Bold",
    description: "Impactante e vibrante com cores fortes e elementos gráficos",
    color: "from-purple-500 to-pink-600",
    preview: "https://images.unsplash.com/photo-1541963463532-d68292c34d19?w=300&h=200&fit=crop",
    features: ["Cores vibrantes", "Tipografia bold", "Elementos gráficos", "Alto impacto"],
    component: BoldTheme
  },
  elegant: {
    name: "Elegant",
    description: "Sofisticado e refinado com elementos luxuosos",
    color: "from-gray-700 to-gray-900",
    preview: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
    features: ["Design sofisticado", "Elementos refinados", "Tipografia elegante", "Layout premium"],
    component: ElegantTheme
  }
};

export default function ThemeManager({
  tenant,
  products,
  banners,
  onThemeChange,
  currentTheme,
  wishlist,
  onProductClick,
  onAddToCart,
  onToggleWishlist
}: ThemeManagerProps) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const CurrentThemeComponent = themeConfigs[currentTheme as keyof typeof themeConfigs]?.component || ModernTheme;

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Preview Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsPreviewMode(false)}
                variant="outline"
                size="sm"
              >
                Voltar ao Editor
              </Button>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Modo Preview - {themeConfigs[currentTheme as keyof typeof themeConfigs]?.name}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setPreviewDevice('desktop')}
                variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                onClick={() => setPreviewDevice('mobile')}
                variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className={`${previewDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'} transition-all duration-300`}>
          <CurrentThemeComponent
            tenant={tenant}
            products={products}
            banners={banners}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            wishlist={wishlist}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciador de Temas</h1>
          <p className="text-gray-600">Personalize a aparência da sua loja com nossos temas profissionais</p>
        </div>

        <Tabs defaultValue="themes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="themes">Temas</TabsTrigger>
            <TabsTrigger value="customize">Personalizar</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Theme Selection */}
          <TabsContent value="themes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(themeConfigs).map(([themeKey, config]) => (
                <motion.div
                  key={themeKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    currentTheme === themeKey ? 'ring-2 ring-cyan-500 shadow-lg' : 'hover:scale-105'
                  }`}>
                    <div className="relative">
                      <img
                        src={config.preview}
                        alt={config.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-80`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-2xl font-bold text-white">{config.name}</h3>
                      </div>
                      {currentTheme === themeKey && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">{config.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{config.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Características:</h4>
                          <div className="flex flex-wrap gap-1">
                            {config.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => onThemeChange(themeKey)}
                            disabled={currentTheme === themeKey}
                            className="flex-1"
                          >
                            {currentTheme === themeKey ? 'Tema Ativo' : 'Selecionar'}
                          </Button>
                          <Button
                            onClick={() => {
                              onThemeChange(themeKey);
                              setIsPreviewMode(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Customization Panel */}
          <TabsContent value="customize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Personalização do Tema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor Primária
                    </label>
                    <input
                      type="color"
                      defaultValue={tenant?.primaryColor || "#0891b2"}
                      className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor Secundária
                    </label>
                    <input
                      type="color"
                      defaultValue={tenant?.secondaryColor || "#0e7490"}
                      className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo da Loja
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {tenant?.logo ? (
                        <img src={tenant.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Palette className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline">
                      Alterar Logo
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Preview do Tema</span>
                  </span>
                  <Button
                    onClick={() => setIsPreviewMode(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Visualizar em Tela Cheia
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-96 overflow-y-auto">
                    <div className="scale-50 origin-top-left w-[200%]">
                      <CurrentThemeComponent
                        tenant={tenant}
                        products={products.slice(0, 3)}
                        banners={banners.slice(0, 2)}
                        onProductClick={() => {}}
                        onAddToCart={() => {}}
                        onToggleWishlist={() => {}}
                        wishlist={wishlist}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}