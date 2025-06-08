import { Tenant } from "@/types/api";
import { Award, Users, Heart, Star } from "lucide-react";

interface AboutProps {
  tenant: Tenant;
}

export default function About({ tenant }: AboutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Sobre a {tenant.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conheça nossa história, valores e compromisso em oferecer os melhores produtos em {tenant.category}.
        </p>
      </div>

      {/* Company Story */}
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-6">Nossa História</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              A {tenant.name} nasceu com o objetivo de revolucionar o mercado de {tenant.category}, 
              oferecendo produtos de alta qualidade com atendimento excepcional.
            </p>
            <p>
              Desde nossa fundação, temos o compromisso de buscar sempre a excelência, 
              trabalhando com os melhores fornecedores e mantendo padrões rigorosos de qualidade.
            </p>
            <p>
              Nossa missão é proporcionar a melhor experiência de compra para nossos clientes, 
              com produtos que fazem a diferença no dia a dia das pessoas.
            </p>
          </div>
        </div>
        <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-2xl">
                {tenant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">{tenant.name}</h3>
            <p className="text-muted-foreground capitalize">{tenant.category}</p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Nossos Valores
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Qualidade</h3>
            <p className="text-muted-foreground">
              Comprometidos em oferecer apenas produtos da mais alta qualidade, 
              rigorosamente selecionados para atender às suas expectativas.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Atendimento</h3>
            <p className="text-muted-foreground">
              Nossa equipe está sempre pronta para ajudar, oferecendo suporte personalizado 
              e soluções para todas as suas necessidades.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Confiança</h3>
            <p className="text-muted-foreground">
              Construímos relacionamentos duradouros baseados na transparência, 
              honestidade e compromisso com nossos clientes.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-primary text-primary-foreground rounded-lg p-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Números que Falam por Si</h2>
          <p className="opacity-90">Resultados que demonstram nossa dedicação</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">10K+</div>
            <div className="opacity-90">Clientes Satisfeitos</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="opacity-90">Produtos Disponíveis</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">5</div>
            <div className="opacity-90">Anos de Experiência</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">4.8</div>
            <div className="opacity-90 flex items-center justify-center">
              <Star className="h-4 w-4 mr-1 fill-current" />
              Avaliação Média
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          Nossa Equipe
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Ana Silva", role: "Fundadora & CEO", description: "Visionária por trás da empresa" },
            { name: "Carlos Santos", role: "Diretor Comercial", description: "Especialista em relacionamento com clientes" },
            { name: "Maria Oliveira", role: "Gerente de Qualidade", description: "Garantindo excelência em cada produto" }
          ].map((member, index) => (
            <div key={index} className="text-center">
              <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">{member.name}</h3>
              <p className="text-primary font-medium mb-2">{member.role}</p>
              <p className="text-muted-foreground text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-muted rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Quer Saber Mais?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Estamos sempre disponíveis para esclarecer suas dúvidas e conhecer suas necessidades. 
          Entre em contato conosco!
        </p>
        <div className="space-y-2">
          <p className="text-foreground">
            <strong>Email:</strong> contato@{tenant.subdomain}.com
          </p>
          <p className="text-foreground">
            <strong>Telefone:</strong> (11) 99999-9999
          </p>
          <p className="text-foreground">
            <strong>Horário de Atendimento:</strong> Segunda a Sexta, 9h às 18h
          </p>
        </div>
      </div>
    </div>
  );
}