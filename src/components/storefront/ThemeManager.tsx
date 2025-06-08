import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Eye, Download, Settings, Check, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Theme {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  isActive: boolean;
  isPremium: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  features: string[];
}

interface ThemeManagerProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

const availableThemes: Theme[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design with smooth animations",
    category: "Professional",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: false,
    colors: { primary: "#3b82f6", secondary: "#1e40af", accent: "#06b6d4" },
    features: ["Responsive Design", "Fast Loading", "SEO Optimized", "Mobile First"]
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless and elegant design for traditional businesses",
    category: "Traditional",
    preview: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: false,
    colors: { primary: "#dc2626", secondary: "#991b1b", accent: "#f59e0b" },
    features: ["Classic Layout", "Professional", "Clean Typography", "Wide Compatibility"]
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and focused design that highlights your products",
    category: "Minimalist",
    preview: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: false,
    colors: { primary: "#374151", secondary: "#111827", accent: "#6b7280" },
    features: ["Ultra Clean", "Fast Performance", "Minimal Distractions", "Focus on Content"]
  },
  {
    id: "bold",
    name: "Bold",
    description: "Eye-catching design with vibrant colors and strong typography",
    category: "Creative",
    preview: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: false,
    colors: { primary: "#7c3aed", secondary: "#5b21b6", accent: "#ec4899" },
    features: ["Bold Typography", "Vibrant Colors", "Creative Layout", "High Impact"]
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated design with premium aesthetics",
    category: "Luxury",
    preview: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: false,
    colors: { primary: "#059669", secondary: "#047857", accent: "#10b981" },
    features: ["Premium Look", "Sophisticated", "Luxury Feel", "High-End Design"]
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Premium theme with gold accents and sophisticated design",
    category: "Premium",
    preview: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: true,
    colors: { primary: "#eab308", secondary: "#a16207", accent: "#fbbf24" },
    features: ["Gold Accents", "Premium Animation", "Luxury Typography", "VIP Experience"]
  },
  {
    id: "sport",
    name: "Sport",
    description: "Dynamic and energetic theme perfect for sports and fitness",
    category: "Sports",
    preview: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: true,
    colors: { primary: "#ea580c", secondary: "#c2410c", accent: "#f97316" },
    features: ["Dynamic Layout", "Energy Theme", "Performance Focus", "Athletic Design"]
  },
  {
    id: "tech",
    name: "Tech",
    description: "Futuristic design with neon accents and cyberpunk aesthetics",
    category: "Technology",
    preview: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: true,
    colors: { primary: "#06b6d4", secondary: "#0891b2", accent: "#22d3ee" },
    features: ["Futuristic Design", "Neon Effects", "Tech Aesthetic", "Advanced Animations"]
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Nostalgic design with retro colors and classic typography",
    category: "Retro",
    preview: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: true,
    colors: { primary: "#d97706", secondary: "#92400e", accent: "#f59e0b" },
    features: ["Retro Style", "Vintage Colors", "Classic Typography", "Nostalgic Feel"]
  },
  {
    id: "nature",
    name: "Nature",
    description: "Organic design inspired by nature with earth tones",
    category: "Organic",
    preview: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    isActive: false,
    isPremium: true,
    colors: { primary: "#059669", secondary: "#047857", accent: "#10b981" },
    features: ["Organic Design", "Earth Tones", "Natural Feel", "Eco-Friendly"]
  }
];

export default function ThemeManager({ currentTheme, onThemeChange }: ThemeManagerProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { toast } = useToast();

  const themes = availableThemes.map(theme => ({
    ...theme,
    isActive: theme.id === currentTheme
  }));

  const categories = ["all", ...Array.from(new Set(themes.map(t => t.category)))];
  const filteredThemes = filterCategory === "all" 
    ? themes 
    : themes.filter(t => t.category === filterCategory);

  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme.id);
    toast({
      title: "Tema aplicado",
      description: `O tema ${theme.name} foi aplicado com sucesso.`,
    });
  };

  const handlePreview = (theme: Theme) => {
    setSelectedTheme(theme);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Temas</h2>
          <p className="text-gray-600">Escolha o tema perfeito para sua loja virtual</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Tema Atual: {themes.find(t => t.isActive)?.name || "Padrão"}
          </Badge>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={filterCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(category)}
            className="capitalize"
          >
            {category === "all" ? "Todos" : category}
          </Button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <Card key={theme.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
            theme.isActive ? 'ring-2 ring-cyan-500 shadow-lg' : ''
          }`}>
            <div className="relative">
              <img
                src={theme.preview}
                alt={theme.name}
                className="w-full h-40 object-cover"
              />
              
              {/* Theme Status Badges */}
              <div className="absolute top-2 left-2 flex space-x-2">
                {theme.isActive && (
                  <Badge className="bg-green-500 text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                )}
                {theme.isPremium && (
                  <Badge className="bg-yellow-500 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>

              {/* Theme Colors */}
              <div className="absolute bottom-2 right-2 flex space-x-1">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
            </div>

            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{theme.name}</h3>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {theme.category}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {theme.description}
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {theme.features.slice(0, 2).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {theme.features.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{theme.features.length - 2} mais
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(theme)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                {!theme.isActive && (
                  <Button
                    size="sm"
                    onClick={() => handleThemeSelect(theme)}
                    className="flex-1"
                    disabled={theme.isPremium}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {theme.isPremium ? "Premium" : "Aplicar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Theme Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Pré-visualização: {selectedTheme?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTheme && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
                <TabsTrigger value="features">Recursos</TabsTrigger>
                <TabsTrigger value="colors">Cores</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <img
                    src={selectedTheme.preview}
                    alt={selectedTheme.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{selectedTheme.name}</h3>
                  <p className="text-gray-600">{selectedTheme.description}</p>
                  <Badge>{selectedTheme.category}</Badge>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedTheme.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Sobre este tema</h4>
                  <p className="text-sm text-blue-700">
                    Este tema foi especialmente desenvolvido para oferecer a melhor experiência 
                    para seus clientes, com design responsivo e otimizado para conversão.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-200"
                      style={{ backgroundColor: selectedTheme.colors.primary }}
                    />
                    <p className="text-sm font-medium">Cor Primária</p>
                    <p className="text-xs text-gray-500">{selectedTheme.colors.primary}</p>
                  </div>
                  
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-200"
                      style={{ backgroundColor: selectedTheme.colors.secondary }}
                    />
                    <p className="text-sm font-medium">Cor Secundária</p>
                    <p className="text-xs text-gray-500">{selectedTheme.colors.secondary}</p>
                  </div>
                  
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-gray-200"
                      style={{ backgroundColor: selectedTheme.colors.accent }}
                    />
                    <p className="text-sm font-medium">Cor de Destaque</p>
                    <p className="text-xs text-gray-500">{selectedTheme.colors.accent}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Paleta de Cores</h4>
                  <p className="text-sm text-gray-600">
                    Esta paleta foi cuidadosamente selecionada para garantir acessibilidade 
                    e uma experiência visual agradável em todos os dispositivos.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            {selectedTheme && !selectedTheme.isActive && (
              <Button 
                onClick={() => {
                  handleThemeSelect(selectedTheme);
                  setIsPreviewOpen(false);
                }}
                disabled={selectedTheme.isPremium}
              >
                {selectedTheme.isPremium ? "Tema Premium" : "Aplicar Tema"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}