import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  CreditCard, 
  Shield, 
  Edit2, 
  Trash2,
  Plus,
  Eye,
  Star,
  RotateCcw
} from "lucide-react";

interface CustomerAccountProps {
  onBack: () => void;
  customerData: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cpf: string;
    birthDate?: string;
  };
}

interface Address {
  id: number;
  type: 'home' | 'work' | 'other';
  name: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  date: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  trackingCode?: string;
}

interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

export default function CustomerAccount({ onBack, customerData }: CustomerAccountProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Mock data for demonstration
  const [addresses] = useState<Address[]>([
    {
      id: 1,
      type: 'home',
      name: 'Casa',
      zipCode: '01234-567',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      isDefault: true
    },
    {
      id: 2,
      type: 'work',
      name: 'Trabalho',
      zipCode: '54321-098',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      isDefault: false
    }
  ]);

  const [orders] = useState<Order[]>([
    {
      id: 1,
      orderNumber: 'PED-2025-001',
      date: '2025-05-20',
      status: 'delivered',
      total: 299.90,
      items: [
        {
          id: 1,
          name: 'Smartphone Galaxy S24',
          price: 299.90,
          quantity: 1,
          image: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=Phone'
        }
      ],
      trackingCode: 'BR123456789'
    },
    {
      id: 2,
      orderNumber: 'PED-2025-002',
      date: '2025-05-25',
      status: 'shipped',
      total: 159.90,
      items: [
        {
          id: 2,
          name: 'Fone de Ouvido Bluetooth',
          price: 159.90,
          quantity: 1,
          image: 'https://via.placeholder.com/100x100/059669/FFFFFF?text=Headphone'
        }
      ],
      trackingCode: 'BR987654321'
    }
  ]);

  const [wishlist] = useState<WishlistItem[]>([
    {
      id: 3,
      name: 'Notebook Gaming',
      price: 2499.90,
      image: 'https://via.placeholder.com/100x100/DC2626/FFFFFF?text=Laptop',
      inStock: true
    },
    {
      id: 4,
      name: 'Mouse Gamer RGB',
      price: 89.90,
      image: 'https://via.placeholder.com/100x100/7C3AED/FFFFFF?text=Mouse',
      inStock: false
    }
  ]);

  const [editedProfile, setEditedProfile] = useState(customerData);

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSaveProfile = () => {
    // Here you would save the profile data
    setIsEditing(false);
  };

  const renderProfile = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Meus Dados
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={editedProfile.firstName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={editedProfile.lastName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: formatPhone(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={editedProfile.cpf}
                  onChange={(e) => setEditedProfile({ ...editedProfile, cpf: formatCPF(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={editedProfile.birthDate || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, birthDate: e.target.value })}
              />
            </div>

            <Button onClick={handleSaveProfile}>
              Salvar Alterações
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p>{customerData.firstName} {customerData.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{customerData.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p>{customerData.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p>{customerData.cpf}</p>
              </div>
            </div>
            {customerData.birthDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                <p>{new Date(customerData.birthDate).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAddresses = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Meus Endereços</h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Endereço
        </Button>
      </div>

      {addresses.map((address) => (
        <Card key={address.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{address.name}</h4>
                  {address.isDefault && (
                    <Badge variant="secondary">Padrão</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {address.street}, {address.number}
                  {address.complement && `, ${address.complement}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.neighborhood}, {address.city} - {address.state}
                </p>
                <p className="text-sm text-muted-foreground">CEP: {address.zipCode}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Meus Pedidos</h3>
      
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-medium">Pedido {order.orderNumber}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
                <p className="text-lg font-semibold mt-1">
                  R$ {order.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      Qtd: {item.quantity} | R$ {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
                {order.trackingCode && (
                  <Button variant="outline" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Rastrear
                  </Button>
                )}
                {order.status === 'delivered' && (
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Avaliar
                  </Button>
                )}
              </div>
              {order.status === 'delivered' && (
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Solicitar Devolução
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderWishlist = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lista de Desejos</h3>
      
      {wishlist.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Sua lista de desejos está vazia</p>
            <Button className="mt-4">
              Explorar Produtos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlist.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-lg font-semibold text-primary">
                      R$ {item.price.toFixed(2)}
                    </p>
                    <Badge variant={item.inStock ? "secondary" : "destructive"} className="mt-2">
                      {item.inStock ? "Em estoque" : "Indisponível"}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button className="flex-1" disabled={!item.inStock}>
                    Adicionar ao Carrinho
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Segurança da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Senha</h4>
              <p className="text-sm text-muted-foreground">
                Última alteração há 30 dias
              </p>
            </div>
            <Button variant="outline">Alterar Senha</Button>
          </div>

          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Autenticação em duas etapas</h4>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>

          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Dispositivos conectados</h4>
              <p className="text-sm text-muted-foreground">
                Gerencie os dispositivos que acessam sua conta
              </p>
            </div>
            <Button variant="outline">Ver Dispositivos</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Dados pessoais</h4>
              <p className="text-sm text-muted-foreground">
                Baixe uma cópia dos seus dados
              </p>
            </div>
            <Button variant="outline">Solicitar Dados</Button>
          </div>

          <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Excluir conta</h4>
              <p className="text-sm text-muted-foreground">
                Remover permanentemente sua conta
              </p>
            </div>
            <Button variant="destructive">Excluir Conta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack}>
          ← Voltar
        </Button>
        <h1 className="text-3xl font-bold mt-4">Minha Conta</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="addresses">Endereços</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="wishlist">Favoritos</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {renderProfile()}
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          {renderAddresses()}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {renderOrders()}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {renderWishlist()}
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {renderSecurity()}
        </TabsContent>
      </Tabs>
    </div>
  );
}