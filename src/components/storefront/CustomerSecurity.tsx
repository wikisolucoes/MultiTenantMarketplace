import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Shield, Smartphone, Key, AlertTriangle, CheckCircle, Mail, Lock, Copy } from "lucide-react";

interface CustomerSecurityProps {
  customer: any;
  subdomain: string;
  onUpdate: (customer: any) => void;
}

export default function CustomerSecurity({ customer, subdomain, onUpdate }: CustomerSecurityProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 2FA states
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-customer-id": customer.id.toString()
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao alterar senha");
      }

      setSuccess("Senha alterada com sucesso!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: customer.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao enviar email de verificação");
      }

      setSuccess("Email de verificação enviado! Verifique sua caixa de entrada.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setup2FA = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/2fa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-customer-id": customer.id.toString()
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao configurar 2FA");
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShow2FASetup(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const activate2FA = async () => {
    setIsLoading(true);
    setError("");

    if (!twoFactorToken || twoFactorToken.length !== 6) {
      setError("Digite um código de 6 dígitos válido");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/2fa/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-customer-id": customer.id.toString()
        },
        body: JSON.stringify({ token: twoFactorToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao ativar 2FA");
      }

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShow2FASetup(false);
      setSuccess("Autenticação de dois fatores ativada com sucesso!");
      
      // Update customer state
      onUpdate({ ...customer, twoFactorEnabled: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    setIsLoading(true);
    setError("");

    if (!disablePassword) {
      setError("Digite sua senha para desativar 2FA");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/2fa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-customer-id": customer.id.toString()
        },
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao desativar 2FA");
      }

      setSuccess("Autenticação de dois fatores desativada.");
      setDisablePassword("");
      
      // Update customer state
      onUpdate({ ...customer, twoFactorEnabled: false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copiado para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-cyan-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Segurança da Conta</h2>
        <p className="text-gray-600">Gerencie as configurações de segurança da sua conta</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Status do Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {customer.emailVerified ? (
                        <>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Não Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!customer.emailVerified && (
                    <Button variant="outline" size="sm" onClick={handleEmailVerification} disabled={isLoading}>
                      Verificar Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Autenticação de Dois Fatores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {customer.twoFactorEnabled ? "Ativada" : "Desativada"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {customer.twoFactorEnabled 
                        ? "Sua conta está protegida com 2FA" 
                        : "Adicione uma camada extra de segurança"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.twoFactorEnabled ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Última Atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Último login:</span>
                    <span className="text-sm font-medium">
                      {customer.lastLoginAt 
                        ? new Date(customer.lastLoginAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Nunca"
                      }
                    </span>
                  </div>
                  {customer.lastLoginIp && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IP do último login:</span>
                      <span className="text-sm font-medium">{customer.lastLoginIp}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Crie uma senha forte com pelo menos 6 caracteres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verificação de Email</CardTitle>
              <CardDescription>
                Verifique seu email para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-gray-600">
                      {customer.emailVerified 
                        ? "Email verificado com sucesso" 
                        : "Email aguardando verificação"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.emailVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                        <Button variant="outline" size="sm" onClick={handleEmailVerification} disabled={isLoading}>
                          Reenviar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
              <CardDescription>
                Adicione uma camada extra de segurança à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!customer.twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Como funciona o 2FA?</h4>
                    <p className="text-sm text-blue-700">
                      O 2FA adiciona uma camada extra de segurança, exigindo um código do seu celular 
                      além da sua senha para fazer login.
                    </p>
                  </div>
                  
                  <Button onClick={setup2FA} disabled={isLoading} className="w-full">
                    <Smartphone className="h-4 w-4 mr-2" />
                    {isLoading ? "Configurando..." : "Configurar 2FA"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">2FA Ativo</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Sua conta está protegida com autenticação de dois fatores.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="disablePassword">Senha para Desativar 2FA</Label>
                      <Input
                        id="disablePassword"
                        type="password"
                        placeholder="Digite sua senha"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={disable2FA} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Desativando..." : "Desativar 2FA"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação 2FA</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu app autenticador
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCode && (
              <div className="text-center">
                <img src={qrCode} alt="QR Code 2FA" className="mx-auto border rounded-lg" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Código Manual (se não conseguir escanear):</Label>
              <div className="flex items-center gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(secret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verify2fa">Código de Verificação (6 dígitos):</Label>
              <Input
                id="verify2fa"
                placeholder="000000"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').substring(0, 6))}
                maxLength={6}
              />
            </div>
            
            <Button onClick={activate2FA} disabled={isLoading} className="w-full">
              {isLoading ? "Ativando..." : "Ativar 2FA"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Códigos de Backup</DialogTitle>
            <DialogDescription>
              Guarde estes códigos em local seguro. Use-os se não conseguir acessar seu app autenticador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded font-mono text-sm text-center">
                  {code}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(backupCodes.join(' '))}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Todos
              </Button>
              <Button onClick={() => setShowBackupCodes(false)} className="flex-1">
                Concluir
              </Button>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Cada código só pode ser usado uma vez. Mantenha-os seguros!
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}