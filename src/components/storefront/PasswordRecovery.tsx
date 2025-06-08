import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

interface PasswordRecoveryProps {
  subdomain: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PasswordRecovery({ subdomain, onBack, onSuccess }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [requestData, setRequestData] = useState({
    email: ""
  });

  const [resetData, setResetData] = useState({
    token: "",
    password: "",
    confirmPassword: ""
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: requestData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao enviar email de recuperação");
      }

      setSuccess("Se o email existir, um link de recuperação foi enviado para sua caixa de entrada.");
      setStep('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (resetData.password !== resetData.confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (resetData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/storefront/${subdomain}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetData.token,
          password: resetData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Falha ao redefinir senha");
      }

      setSuccess("Senha redefinida com sucesso! Você já pode fazer login.");
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Mail className="h-12 w-12 text-cyan-600" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
            {step === 'request' ? 'Recuperar Senha' : 'Redefinir Senha'}
          </CardTitle>
          <CardDescription>
            {step === 'request' 
              ? 'Digite seu email para receber o link de recuperação'
              : 'Digite o código recebido e sua nova senha'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {step === 'request' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={requestData.email}
                    onChange={(e) => setRequestData({ email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>

              <div className="text-center">
                <Button variant="link" onClick={onBack} className="text-sm">
                  Lembrou da senha? Fazer login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Código de Recuperação</Label>
                <Input
                  id="token"
                  placeholder="Cole o código do email aqui"
                  value={resetData.token}
                  onChange={(e) => setResetData(prev => ({ ...prev, token: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-600">
                  Verifique sua caixa de entrada e spam para encontrar o código
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    value={resetData.password}
                    onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
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
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    className="pr-10"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>

              <div className="text-center space-y-2">
                <Button 
                  variant="link" 
                  onClick={() => setStep('request')} 
                  className="text-sm"
                >
                  Não recebeu o código? Tentar novamente
                </Button>
                <Button variant="link" onClick={onBack} className="text-sm">
                  Voltar ao login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}