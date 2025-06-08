import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Shield, Settings, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

interface CookieConsentProps {
  tenantId: number;
}

export default function CookieConsent({ tenantId }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(`cookie_consent_${tenantId}`);
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, [tenantId]);

  const saveConsent = async (prefs: CookiePreferences) => {
    try {
      await apiRequest("POST", "/api/cookie-consent", {
        tenantId,
        consentGiven: true,
        consentTypes: prefs,
        ipAddress: "", // Will be filled by server
        userAgent: navigator.userAgent,
      });

      localStorage.setItem(`cookie_consent_${tenantId}`, JSON.stringify(prefs));
      setPreferences(prefs);
      setShowBanner(false);
      setShowSettings(false);

      toast({
        title: "Preferências salvas",
        description: "Suas preferências de cookies foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas preferências. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(necessaryOnly);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, value: boolean) => {
    if (type === "necessary") return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [type]: value }));
  };

  if (!showBanner && !showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 p-4">
        <Card className="mx-auto max-w-4xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-6">
            {!showSettings ? (
              // Main consent banner
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Cookie className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Utilizamos cookies para melhorar sua experiência
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Este site utiliza cookies para garantir funcionalidades essenciais, 
                      analisar o desempenho e personalizar conteúdo. Ao continuar navegando, 
                      você concorda com nossa{" "}
                      <button 
                        className="underline text-primary hover:text-primary/80"
                        onClick={() => window.open("/politica-privacidade", "_blank")}
                      >
                        Política de Privacidade
                      </button>
                      {" "}e{" "}
                      <button 
                        className="underline text-primary hover:text-primary/80"
                        onClick={() => window.open("/politica-cookies", "_blank")}
                      >
                        Política de Cookies
                      </button>
                      . Em conformidade com a LGPD (Lei Geral de Proteção de Dados).
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Seus direitos LGPD:</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Você pode acessar, corrigir, excluir ou solicitar a portabilidade 
                        de seus dados pessoais a qualquer momento. Entre em contato conosco 
                        através do e-mail: privacidade@loja.com.br
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={acceptNecessary}
                  >
                    Apenas Necessários
                  </Button>
                  <Button 
                    onClick={acceptAll}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Aceitar Todos
                  </Button>
                </div>
              </div>
            ) : (
              // Detailed settings
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Configurações de Cookies</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Cookies Necessários</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Essenciais para o funcionamento básico do site. Não podem ser desabilitados.
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>

                  {/* Functional Cookies */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Cookies Funcionais</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Melhoram a funcionalidade e personalização do site (carrinho, preferências).
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.functional}
                      onCheckedChange={(value) => handlePreferenceChange("functional", value)}
                    />
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Cookies de Análise</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nos ajudam a entender como você usa o site para melhorarmos a experiência.
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.analytics}
                      onCheckedChange={(value) => handlePreferenceChange("analytics", value)}
                    />
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Cookies de Marketing</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permitem mostrar anúncios relevantes e medir a eficácia das campanhas.
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.marketing}
                      onCheckedChange={(value) => handlePreferenceChange("marketing", value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettings(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => saveConsent(preferences)}>
                    Salvar Preferências
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}