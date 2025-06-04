import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, Calendar, Link, Image, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BannerCarousel from "./BannerCarousel";

interface Banner {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  position: number;
  isActive: boolean;
  showOnThemes: string[];
  startDate?: string;
  endDate?: string;
  clickCount: number;
}

interface BannerManagerProps {
  banners: Banner[];
  onBannerCreate: (banner: Omit<Banner, 'id' | 'clickCount'>) => void;
  onBannerUpdate: (id: number, banner: Partial<Banner>) => void;
  onBannerDelete: (id: number) => void;
  currentTheme: string;
}

const themeOptions = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'elegant', label: 'Elegant' }
];

export default function BannerManager({
  banners,
  onBannerCreate,
  onBannerUpdate,
  onBannerDelete,
  currentTheme
}: BannerManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    mobileImageUrl: '',
    linkUrl: '',
    linkText: '',
    position: 0,
    isActive: true,
    showOnThemes: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
    startDate: '',
    endDate: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      mobileImageUrl: '',
      linkUrl: '',
      linkText: '',
      position: 0,
      isActive: true,
      showOnThemes: ['modern', 'classic', 'minimal', 'bold', 'elegant'],
      startDate: '',
      endDate: ''
    });
  };

  const handleCreate = () => {
    onBannerCreate(formData);
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      mobileImageUrl: banner.mobileImageUrl || '',
      linkUrl: banner.linkUrl || '',
      linkText: banner.linkText || '',
      position: banner.position,
      isActive: banner.isActive,
      showOnThemes: banner.showOnThemes,
      startDate: banner.startDate || '',
      endDate: banner.endDate || ''
    });
  };

  const handleUpdate = () => {
    if (editingBanner) {
      onBannerUpdate(editingBanner.id, formData);
      resetForm();
      setEditingBanner(null);
    }
  };

  const activeBanners = banners.filter(banner => 
    banner.isActive && 
    banner.showOnThemes.includes(currentTheme)
  ).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Banners</h2>
          <p className="text-gray-600">Controle os banners do carousel da sua loja</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Banner</DialogTitle>
            </DialogHeader>
            <BannerForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Gerenciar</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Banner Management */}
        <TabsContent value="manage" className="space-y-4">
          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`${banner.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-24 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=150&fit=crop`;
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                            <Badge variant={banner.isActive ? "default" : "secondary"}>
                              {banner.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge variant="outline">Posição {banner.position}</Badge>
                          </div>
                          {banner.description && (
                            <p className="text-sm text-gray-600 mb-2">{banner.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {banner.showOnThemes.map(theme => (
                              <Badge key={theme} variant="secondary" className="text-xs">
                                {themeOptions.find(t => t.value === theme)?.label}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {banner.clickCount} cliques
                            </span>
                            {banner.linkUrl && (
                              <span className="flex items-center">
                                <Link className="h-4 w-4 mr-1" />
                                Link ativo
                              </span>
                            )}
                            {banner.mobileImageUrl && (
                              <span className="flex items-center">
                                <Smartphone className="h-4 w-4 mr-1" />
                                Mobile otimizado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewBanner(banner)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onBannerDelete(banner.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview do Carousel - Tema {currentTheme}</CardTitle>
            </CardHeader>
            <CardContent>
              {activeBanners.length > 0 ? (
                <BannerCarousel
                  banners={activeBanners}
                  theme={currentTheme as any}
                  height="h-64"
                />
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Nenhum banner ativo para este tema</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-gray-900">{banners.length}</div>
                <p className="text-sm text-gray-600">Total de Banners</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {banners.filter(b => b.isActive).length}
                </div>
                <p className="text-sm text-gray-600">Banners Ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-cyan-600">
                  {banners.reduce((sum, banner) => sum + banner.clickCount, 0)}
                </div>
                <p className="text-sm text-gray-600">Total de Cliques</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Banners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {banners
                  .sort((a, b) => b.clickCount - a.clickCount)
                  .map((banner) => (
                    <div key={banner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-12 h-8 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{banner.title}</p>
                          <p className="text-sm text-gray-600">{banner.clickCount} cliques</p>
                        </div>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-cyan-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (banner.clickCount / Math.max(...banners.map(b => b.clickCount))) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingBanner} onOpenChange={() => setEditingBanner(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Banner</DialogTitle>
          </DialogHeader>
          <BannerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setEditingBanner(null)}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview do Banner</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <BannerCarousel
              banners={[previewBanner]}
              theme={currentTheme as any}
              height="h-64"
              autoplay={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BannerFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function BannerForm({ formData, setFormData, onSubmit, onCancel }: BannerFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Título do banner"
          />
        </div>
        <div>
          <Label htmlFor="position">Posição</Label>
          <Input
            id="position"
            type="number"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do banner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="imageUrl">URL da Imagem Desktop *</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="mobileImageUrl">URL da Imagem Mobile</Label>
          <Input
            id="mobileImageUrl"
            value={formData.mobileImageUrl}
            onChange={(e) => setFormData({ ...formData, mobileImageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="linkUrl">URL do Link</Label>
          <Input
            id="linkUrl"
            value={formData.linkUrl}
            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="linkText">Texto do Botão</Label>
          <Input
            id="linkText"
            value={formData.linkText}
            onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
            placeholder="Saiba Mais"
          />
        </div>
      </div>

      <div>
        <Label>Exibir nos Temas</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {themeOptions.map((theme) => (
            <div key={theme.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={theme.value}
                checked={formData.showOnThemes.includes(theme.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      showOnThemes: [...formData.showOnThemes, theme.value]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      showOnThemes: formData.showOnThemes.filter((t: string) => t !== theme.value)
                    });
                  }
                }}
                className="rounded"
              />
              <Label htmlFor={theme.value} className="text-sm">{theme.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Banner Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={!formData.title || !formData.imageUrl}>
          Salvar Banner
        </Button>
      </div>
    </div>
  );
}