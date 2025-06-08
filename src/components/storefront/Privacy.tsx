import { Tenant } from "@/types/api";
import { Shield, Eye, UserCheck, Lock, Mail, FileText } from "lucide-react";

interface PrivacyProps {
  tenant: Tenant;
}

export default function Privacy({ tenant }: PrivacyProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Política de Privacidade
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Seu direito à privacidade é fundamental. Saiba como coletamos, usamos e protegemos seus dados.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Introduction */}
        <div className="bg-muted rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Compromisso com sua Privacidade
              </h2>
              <p className="text-muted-foreground">
                A {tenant.name} está comprometida em proteger sua privacidade e dados pessoais. 
                Esta política explica como coletamos, usamos, compartilhamos e protegemos suas informações 
                quando você usa nossos serviços.
              </p>
            </div>
          </div>
        </div>

        {/* Data Collection */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Informações que Coletamos
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Nome completo e informações de contato (email, telefone)</li>
                <li>Endereço de entrega e cobrança</li>
                <li>Informações de pagamento (processadas de forma segura)</li>
                <li>Histórico de pedidos e preferências</li>
                <li>Comunicações conosco (emails, chat, formulários)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Endereço IP e informações do dispositivo</li>
                <li>Tipo de navegador e sistema operacional</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Usage */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Como Usamos suas Informações
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Operações Principais</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Processar e entregar seus pedidos</li>
                <li>Gerenciar sua conta e preferências</li>
                <li>Processar pagamentos de forma segura</li>
                <li>Fornecer suporte ao cliente</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Melhorias e Comunicação</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Melhorar nossos produtos e serviços</li>
                <li>Personalizar sua experiência</li>
                <li>Enviar atualizações sobre pedidos</li>
                <li>Compartilhar ofertas (com seu consentimento)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Proteção dos seus Dados
            </h2>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Medidas de Segurança Implementadas
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Armazenamento seguro em servidores protegidos</li>
                <li>Controle de acesso restrito aos dados</li>
                <li>Monitoramento contínuo de segurança</li>
              </ul>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Auditorias regulares de segurança</li>
                <li>Backup seguro dos dados</li>
                <li>Políticas de privacidade para funcionários</li>
                <li>Conformidade com LGPD e regulamentações</li>
              </ul>
            </div>
          </div>
        </section>

        {/* User Rights */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Seus Direitos (LGPD)
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Acesso aos Dados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar acesso aos seus dados pessoais que temos.
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Correção de Dados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar correção de dados incorretos ou incompletos.
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Exclusão de Dados
                </h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar exclusão dos seus dados pessoais.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Portabilidade
                </h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar cópia dos seus dados em formato estruturado.
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Oposição ao Tratamento
                </h4>
                <p className="text-sm text-muted-foreground">
                  Opor-se ao tratamento dos seus dados em certas situações.
                </p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Revogação do Consentimento
                </h4>
                <p className="text-sm text-muted-foreground">
                  Revogar consentimento dado anteriormente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Cookies e Tecnologias Similares
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência em nosso site. Os cookies são pequenos 
              arquivos de texto armazenados em seu dispositivo que nos ajudam a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li>Manter você logado em sua conta</li>
              <li>Lembrar suas preferências e itens do carrinho</li>
              <li>Analisar como você usa nosso site</li>
              <li>Personalizar conteúdo e ofertas</li>
            </ul>
            <p className="text-muted-foreground">
              Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
            </p>
          </div>
        </section>

        {/* Data Sharing */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Compartilhamento de Dados
          </h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              <strong>Não vendemos seus dados pessoais.</strong> Compartilhamos informações apenas quando necessário:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Com processadores de pagamento para completar transações</li>
              <li>Com transportadoras para entrega de produtos</li>
              <li>Com provedores de serviços que nos ajudam a operar o negócio</li>
              <li>Quando exigido por lei ou autoridades competentes</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Contato sobre Privacidade
            </h2>
          </div>
          <div className="bg-muted rounded-lg p-6">
            <p className="text-muted-foreground mb-4">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <div className="space-y-2">
              <p className="text-foreground">
                <strong>Email:</strong> privacidade@{tenant.subdomain}.com
              </p>
              <p className="text-foreground">
                <strong>Telefone:</strong> (11) 99999-9999
              </p>
              <p className="text-foreground">
                <strong>Endereço:</strong> Rua das Flores, 123 - Centro, São Paulo - SP
              </p>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Atualizações desta Política
          </h2>
          <p className="text-muted-foreground">
            Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
            por email ou através de avisos em nosso site. Recomendamos que você revise esta política 
            regularmente para se manter informado sobre como protegemos seus dados.
          </p>
        </section>
      </div>
    </div>
  );
}