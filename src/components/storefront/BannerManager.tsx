import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Plus, Edit, Trash2, Eye, BarChart3, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  position: number;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  impressions?: number;
  clicks?: number;
  conversionRate?: number;
}

interface BannerManagerProps {
  banners: Banner[];
  onUpdateBanners: (banners: Banner[]) => void;
}

export default function BannerManager({ banners, onUpdateBanners }: BannerManagerProps) {
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const handleCreateBanner = () => {
    const newBanner: Banner = {
      id: Date.now(),
      title: "Novo Banner",
      description: "Descrição do banner",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
      mobileImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
      linkUrl: "",
      buttonText: "Saiba Mais",
      isActive: true,
      position: banners.length + 1,
      displayOrder: banners.length + 1,
      targetAudience: "all",
      impressions: 0,
      clicks: 0,
      conversionRate: 0
    };
    setEditingBanner(newBanner);
    setIsDialogOpen(true);
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsDialogOpen(true);
  };

  const handleSaveBanner = () => {
    if (!editingBanner) return;

    const existingIndex = banners.findIndex(b => b.id === editingBanner.id);
    let updatedBanners;

    if (existingIndex >= 0) {
      updatedBanners = [...banners];
      updatedBanners[existingIndex] = editingBanner;
    } else {
      updatedBanners = [...banners, editingBanner];
    }

    onUpdateBanners(updatedBanners);
    setIsDialogOpen(false);
    setEditingBanner(null);
    
    toast({
      title: "Banner salvo",
      description: "O banner foi salvo com sucesso.",
    });
  };

  const handleDeleteBanner = (bannerId: number) => {
    const updatedBanners = banners.filter(b => b.id !== bannerId);
    onUpdateBanners(updatedBanners);
    
    toast({
      title: "Banner removido",
      description: "O banner foi removido com sucesso.",
    });
  };

  const handleToggleActive = (bannerId: number) => {
    const updatedBanners = banners.map(b =>
      b.id === bannerId ? { ...b, isActive: !b.isActive } : b
    );
    onUpdateBanners(updatedBanners);
  };

  const reorderBanners = (dragIndex: number, dropIndex: number) => {
    const updatedBanners = [...banners];
    const draggedBanner = updatedBanners[dragIndex];
    updatedBanners.splice(dragIndex, 1);
    updatedBanners.splice(dropIndex, 0, draggedBanner);
    
    // Update display order
    updatedBanners.forEach((banner, index) => {
      banner.displayOrder = index + 1;
    });
    
    onUpdateBanners(updatedBanners);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gerenciar Banners</h2>
          <p className="text-gray-600">Configure banners para sua loja virtual</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{previewMode ? "Editar" : "Visualizar"}</span>
          </Button>
          <Button onClick={handleCreateBanner} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Novo Banner</span>
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Impressões</p>
                <p className="text-2xl font-bold">
                  {banners.reduce((sum, b) => sum + (b.impressions || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Cliques</p>
                <p className="text-2xl font-bold">
                  {banners.reduce((sum, b) => sum + (b.clicks || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Banners Ativos</p>
                <p className="text-2xl font-bold">
                  {banners.filter(b => b.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold">
                  {banners.length > 0 
                    ? ((banners.reduce((sum, b) => sum + (b.conversionRate || 0), 0) / banners.length)).toFixed(1) + '%'
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner List */}
      <div className="grid gap-4">
        {banners.map((banner, index) => (
          <Card key={banner.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-32 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{banner.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={banner.isActive ? "default" : "secondary"}>
                          {banner.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <span className="text-sm text-gray-500">Posição: {banner.displayOrder}</span>
                        {banner.impressions && (
                          <span className="text-sm text-gray-500">
                            {banner.impressions.toLocaleString()} impressões
                          </span>
                        )}
                        {banner.clicks && (
                          <span className="text-sm text-gray-500">
                            {banner.clicks.toLocaleString()} cliques
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleActive(banner.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBanner(banner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {banners.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum banner configurado</h3>
              <p className="text-gray-600 mb-4">Crie seu primeiro banner para começar a promover seus produtos</p>
              <Button onClick={handleCreateBanner}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Banner
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Banner Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner?.id ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
          </DialogHeader>
          
          {editingBanner && (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="scheduling">Agendamento</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editingBanner.title}
                      onChange={(e) => setEditingBanner({
                        ...editingBanner,
                        title: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonText">Texto do Botão</Label>
                    <Input
                      id="buttonText"
                      value={editingBanner.buttonText || ""}
                      onChange={(e) => setEditingBanner({
                        ...editingBanner,
                        buttonText: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={editingBanner.description}
                    onChange={(e) => setEditingBanner({
                      ...editingBanner,
                      description: e.target.value
                    })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkUrl">URL de Destino</Label>
                  <Input
                    id="linkUrl"
                    value={editingBanner.linkUrl || ""}
                    onChange={(e) => setEditingBanner({
                      ...editingBanner,
                      linkUrl: e.target.value
                    })}
                    placeholder="https://..."
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">URL da Imagem (Desktop)</Label>
                  <Input
                    id="imageUrl"
                    value={editingBanner.imageUrl}
                    onChange={(e) => setEditingBanner({
                      ...editingBanner,
                      imageUrl: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="mobileImageUrl">URL da Imagem (Mobile)</Label>
                  <Input
                    id="mobileImageUrl"
                    value={editingBanner.mobileImageUrl || ""}
                    onChange={(e) => setEditingBanner({
                      ...editingBanner,
                      mobileImageUrl: e.target.value
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">Posição</Label>
                    <Input
                      id="position"
                      type="number"
                      value={editingBanner.position}
                      onChange={(e) => setEditingBanner({
                        ...editingBanner,
                        position: parseInt(e.target.value) || 1
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetAudience">Público-Alvo</Label>
                    <Select
                      value={editingBanner.targetAudience || "all"}
                      onValueChange={(value) => setEditingBanner({
                        ...editingBanner,
                        targetAudience: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Visitantes</SelectItem>
                        <SelectItem value="new">Novos Visitantes</SelectItem>
                        <SelectItem value="returning">Visitantes Recorrentes</SelectItem>
                        <SelectItem value="mobile">Usuários Mobile</SelectItem>
                        <SelectItem value="desktop">Usuários Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Image Preview */}
                {editingBanner.imageUrl && (
                  <div>
                    <Label>Pré-visualização</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={editingBanner.imageUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="scheduling" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={editingBanner.startDate || ""}
                      onChange={(e) => setEditingBanner({
                        ...editingBanner,
                        startDate: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={editingBanner.endDate || ""}
                      onChange={(e) => setEditingBanner({
                        ...editingBanner,
                        endDate: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingBanner.isActive}
                    onCheckedChange={(checked) => setEditingBanner({
                      ...editingBanner,
                      isActive: checked
                    })}
                  />
                  <Label htmlFor="isActive">Banner Ativo</Label>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Dicas de Agendamento</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use datas específicas para campanhas promocionais</li>
                    <li>• Deixe vazio para banners permanentes</li>
                    <li>• Configure com antecedência para não perder prazos</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBanner}>
              Salvar Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}