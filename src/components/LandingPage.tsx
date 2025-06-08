import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, CreditCard, TrendingUp, Package, Users, Globe, 
  ShoppingCart, BarChart3, Zap, Shield, Smartphone, 
  FileText, Calculator, Plug, Crown, Target, Gift,
  Settings, Database, Cloud, CheckCircle
} from "lucide-react";

interface LandingPageProps {
  onShowRegistration: () => void;
  onShowLogin: () => void;
  onShowDemo?: () => void;
}

export default function LandingPage({ onShowRegistration, onShowLogin, onShowDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                  WikiStore
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={onShowRegistration} 
                className="gradient-primary hover:gradient-hover text-white font-semibold"
              >
                Criar Loja
              </Button>
              <Button variant="ghost" onClick={onShowLogin} className="text-gray-700 hover:text-cyan-600">
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge className="mb-6 bg-cyan-100 text-cyan-800 px-4 py-2">
            🚀 Plataforma SaaS Multi-Tenant Completa
          </Badge>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            E-commerce Empresarial com{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              Gestão Fiscal Brasileira
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Solução completa para empresas: Multi-tenant, gestão avançada de produtos, 
            conformidade fiscal (NCM, CFOP, ICMS, IPI), integração Celcoin, NF-e automática, 
            marketplaces e sistema de plugins por assinatura.
          </p>
          <div className="flex justify-center space-x-4 mb-12">
            <Button 
              onClick={onShowRegistration}
              className="gradient-primary hover:gradient-hover text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              Começar Gratuitamente
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50"
              onClick={onShowDemo}
            >
              Ver Demo Interativa
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">Multi-Tenant</div>
              <div className="text-gray-600">Isolamento Completo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">8 Abas</div>
              <div className="text-gray-600">Gestão de Produtos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">15+ Plugins</div>
              <div className="text-gray-600">Sistema Extensível</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">NF-e</div>
              <div className="text-gray-600">Automática</div>
            </div>
          </div>
        </div>
      </div>

      {/* Principais Recursos */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos Empresariais Avançados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que sua empresa precisa para vender online com conformidade fiscal brasileira
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gestão de Produtos Avançada */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <Package className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestão de Produtos Completa</h3>
              <p className="text-gray-600 mb-4">
                8 abas de configuração: Básico, SEO, Preços, Estoque, Imagens, Variações, Fiscal e Logística
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• NCM, CFOP, ICMS, IPI, PIS, COFINS</li>
                <li>• Variações com preços dinâmicos</li>
                <li>• Promoções e descontos</li>
                <li>• SEO otimizado</li>
              </ul>
            </div>

            {/* Conformidade Fiscal */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <FileText className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Conformidade Fiscal Brasileira</h3>
              <p className="text-gray-600 mb-4">
                Sistema completo de gestão fiscal com todas as obrigações brasileiras
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• NF-e automática via API</li>
                <li>• Configuração NCM por produto</li>
                <li>• CFOP personalizável</li>
                <li>• Cálculo automático de impostos</li>
              </ul>
            </div>

            {/* Integração Financeira */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <CreditCard className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integração Celcoin</h3>
              <p className="text-gray-600 mb-4">
                Conta digital para cada lojista com saques automáticos
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• PIX, cartão e boleto</li>
                <li>• Saques automáticos</li>
                <li>• Dashboard financeiro</li>
                <li>• Relatórios detalhados</li>
              </ul>
            </div>

            {/* Sistema Multi-Tenant */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <Database className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Tenant Empresarial</h3>
              <p className="text-gray-600 mb-4">
                Isolamento completo de dados com PostgreSQL por tenant
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Isolamento total de dados</li>
                <li>• Subdomínios personalizados</li>
                <li>• Gestão centralizada</li>
                <li>• Escalabilidade automática</li>
              </ul>
            </div>

            {/* Marketplaces */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <Globe className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integração Marketplaces</h3>
              <p className="text-gray-600 mb-4">
                Sincronização automática com principais marketplaces
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Mercado Livre</li>
                <li>• Shopee e Amazon</li>
                <li>• Instagram Shopping</li>
                <li>• Google Shopping</li>
              </ul>
            </div>

            {/* Sistema de Plugins */}
            <div className="feature-card">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <Plug className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Plugins por Assinatura</h3>
              <p className="text-gray-600 mb-4">
                Sistema extensível com 15+ plugins especializados
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Email Marketing</li>
                <li>• CRM Avançado</li>
                <li>• Analytics Premium</li>
                <li>• Automações</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recursos Técnicos */}
      <div className="gradient-card py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tecnologia Empresarial
            </h2>
            <p className="text-xl text-gray-600">
              Arquitetura robusta para alta performance e escalabilidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <Shield className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">LGPD Compliant</h3>
              <p className="text-sm text-gray-600">Proteção total de dados</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <Cloud className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Cloud Native</h3>
              <p className="text-sm text-gray-600">Escalabilidade automática</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <Zap className="w-10 h-10 text-cyan-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Alta Performance</h3>
              <p className="text-sm text-gray-600">React + PostgreSQL</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <Smartphone className="w-10 h-10 text-teal-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-sm text-gray-600">Responsive design</p>
            </div>
          </div>
        </div>
      </div>

      {/* Planos e Preços */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Modelos de Cobrança Flexíveis
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o modelo que melhor se adapta ao seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Básico */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-cyan-300 transition-all">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Starter</h3>
                <div className="text-4xl font-bold text-cyan-600 mb-2">2,5%</div>
                <div className="text-gray-600 mb-6">por transação</div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Loja completa</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Gestão fiscal básica</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Até 1.000 produtos</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Suporte por email</li>
                </ul>
                <Button className="w-full gradient-primary hover:gradient-hover text-white" onClick={onShowRegistration}>
                  Começar Agora
                </Button>
              </div>
            </div>

            {/* Plano Professional */}
            <div className="bg-white border-2 border-cyan-500 rounded-2xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="gradient-primary text-white px-4 py-1">Mais Popular</Badge>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional</h3>
                <div className="text-4xl font-bold text-cyan-600 mb-2">R$ 297</div>
                <div className="text-gray-600 mb-6">por mês + 1,5% por transação</div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Tudo do Starter</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Produtos ilimitados</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Marketplaces integrados</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />NF-e automática</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Plugins básicos</li>
                </ul>
                <Button className="w-full gradient-primary hover:gradient-hover text-white" onClick={onShowRegistration}>
                  Escolher Professional
                </Button>
              </div>
            </div>

            {/* Plano Enterprise */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-teal-300 transition-all">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                <div className="text-4xl font-bold text-teal-600 mb-2">Custom</div>
                <div className="text-gray-600 mb-6">sob medida</div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Tudo do Professional</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />White Label</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />API personalizada</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Suporte dedicado</li>
                  <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />Plugins premium</li>
                </ul>
                <Button variant="outline" className="w-full border-2 border-teal-500 text-teal-600 hover:bg-teal-50">
                  Falar com Vendas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="gradient-primary py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Revolucionar seu E-commerce?
          </h2>
          <p className="text-xl text-cyan-100 mb-8">
            Junte-se a centenas de empresas que já vendem mais com nossa plataforma
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={onShowRegistration}
              className="bg-white text-cyan-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
              size="lg"
            >
              Criar Loja Gratuita
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 rounded-xl border-2 border-white text-white hover:bg-white/10"
              onClick={onShowDemo}
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
              WikiStore
            </h3>
            <p className="text-gray-400 mb-6">
              Plataforma SaaS Multi-Tenant para E-commerce Empresarial
            </p>
            <div className="flex justify-center space-x-8 text-sm">
              <a href="#" className="hover:text-cyan-400 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">LGPD</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}