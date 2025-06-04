import { Button } from "@/components/ui/button";
import { Store, CreditCard, TrendingUp } from "lucide-react";

interface LandingPageProps {
  onShowRegistration: () => void;
  onShowLogin: () => void;
  onShowDemo?: () => void;
}

export default function LandingPage({ onShowRegistration, onShowLogin, onShowDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary">WikiStore</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={onShowRegistration} className="bg-primary hover:bg-primary/90">
                Criar Loja
              </Button>
              <Button variant="ghost" onClick={onShowLogin}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Crie sua loja online em{" "}
            <span className="text-primary">minutos</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Plataforma SaaS completa com pagamentos via PIX, cartão e boleto. 
            Gestão financeira integrada com a Celcoin para saques automáticos.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={onShowRegistration}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
              size="lg"
            >
              Começar Agora
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={onShowDemo}
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Store className="text-primary text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Multi-Tenant</h3>
            <p className="text-muted-foreground">
              Isolamento completo de dados com schemas PostgreSQL separados por loja.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="text-green-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Pagamentos Integrados</h3>
            <p className="text-muted-foreground">
              PIX, cartão e boleto via API Celcoin com conta digital para cada lojista.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-border">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-amber-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Gestão Financeira</h3>
            <p className="text-muted-foreground">
              Saldos, saques automáticos e relatórios financeiros completos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
