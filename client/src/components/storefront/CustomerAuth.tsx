import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, User, Mail, Phone, MapPin } from "lucide-react";

interface CustomerAuthProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (userData: CustomerRegistrationData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export interface CustomerRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cpf: string;
  birthDate: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  acceptTerms: boolean;
  acceptNewsletter: boolean;
}

export default function CustomerAuth({ onLogin, onRegister, onBack, isLoading }: CustomerAuthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Registration form state
  const [registerData, setRegisterData] = useState<CustomerRegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cpf: "",
    birthDate: "",
    address: {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    acceptTerms: false,
    acceptNewsletter: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRegistration = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!registerData.firstName.trim()) newErrors.firstName = "Nome é obrigatório";
    if (!registerData.lastName.trim()) newErrors.lastName = "Sobrenome é obrigatório";
    if (!validateEmail(registerData.email)) newErrors.email = "Email inválido";
    if (registerData.password.length < 6) newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    if (registerData.password !== registerData.confirmPassword) newErrors.confirmPassword = "Senhas não coincidem";
    if (!validateCPF(registerData.cpf)) newErrors.cpf = "CPF inválido";
    if (!registerData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (!registerData.address.zipCode.trim()) newErrors.zipCode = "CEP é obrigatório";
    if (!registerData.acceptTerms) newErrors.acceptTerms = "Você deve aceitar os termos";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      onLogin(loginData.email, loginData.password);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateRegistration()) {
      onRegister(registerData);
    }
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Voltar
        </Button>
        <h1 className="text-2xl font-bold text-center">Minha Conta</h1>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Fazer Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="loginPassword">Senha</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Criar Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      placeholder="João"
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input
                      id="lastName"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      placeholder="Silva"
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="registerEmail">Email *</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: formatPhone(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={registerData.cpf}
                      onChange={(e) => setRegisterData({ ...registerData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      className={errors.cpf ? "border-red-500" : ""}
                    />
                    {errors.cpf && <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={registerData.birthDate}
                    onChange={(e) => setRegisterData({ ...registerData, birthDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registerPassword">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="registerPassword"
                        type={showPassword ? "text" : "password"}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="••••••••"
                        className={errors.password ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className={errors.confirmPassword ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Address Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Endereço
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={registerData.address.zipCode}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          address: { ...registerData.address, zipCode: formatZipCode(e.target.value) }
                        })}
                        placeholder="00000-000"
                        className={errors.zipCode ? "border-red-500" : ""}
                      />
                      {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          value={registerData.address.street}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            address: { ...registerData.address, street: e.target.value }
                          })}
                          placeholder="Rua das Flores"
                        />
                      </div>
                      <div>
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          value={registerData.address.number}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            address: { ...registerData.address, number: e.target.value }
                          })}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={registerData.address.complement}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          address: { ...registerData.address, complement: e.target.value }
                        })}
                        placeholder="Apto 45, Bloco B"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={registerData.address.neighborhood}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            address: { ...registerData.address, neighborhood: e.target.value }
                          })}
                          placeholder="Centro"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={registerData.address.city}
                          onChange={(e) => setRegisterData({
                            ...registerData,
                            address: { ...registerData.address, city: e.target.value }
                          })}
                          placeholder="São Paulo"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={registerData.address.state}
                        onChange={(e) => setRegisterData({
                          ...registerData,
                          address: { ...registerData.address, state: e.target.value }
                        })}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={registerData.acceptTerms}
                      onCheckedChange={(checked) => setRegisterData({ ...registerData, acceptTerms: !!checked })}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      Aceito os <Button variant="link" className="p-0 h-auto text-sm">termos de uso</Button> e a <Button variant="link" className="p-0 h-auto text-sm">política de privacidade</Button> *
                    </Label>
                  </div>
                  {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acceptNewsletter"
                      checked={registerData.acceptNewsletter}
                      onCheckedChange={(checked) => setRegisterData({ ...registerData, acceptNewsletter: !!checked })}
                    />
                    <Label htmlFor="acceptNewsletter" className="text-sm">
                      Quero receber ofertas e novidades por email
                    </Label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}