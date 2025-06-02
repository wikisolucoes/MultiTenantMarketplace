import { Link } from "wouter";
import { Tenant } from "@/types/api";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

interface StorefrontFooterProps {
  tenant: Tenant;
}

export default function StorefrontFooter({ tenant }: StorefrontFooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{tenant.name}</h3>
            <p className="text-sm mb-4 capitalize">
              Loja especializada em {tenant.category}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                São Paulo, SP
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                (11) 99999-9999
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                contato@{tenant.subdomain}.com
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/produtos">
                  <a className="hover:text-white transition-colors">Produtos</a>
                </Link>
              </li>
              <li>
                <Link href="/sobre">
                  <a className="hover:text-white transition-colors">Sobre Nós</a>
                </Link>
              </li>
              <li>
                <Link href="/contato">
                  <a className="hover:text-white transition-colors">Contato</a>
                </Link>
              </li>
              <li>
                <Link href="/carrinho">
                  <a className="hover:text-white transition-colors">Meu Carrinho</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Formas de Pagamento
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Entrega e Frete
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Trocas e Devoluções
                </a>
              </li>
              <li>
                <Link href="/privacidade">
                  <a className="hover:text-white transition-colors">Política de Privacidade</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-4">
              <p className="text-sm mb-2">Receba nossas novidades:</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-sm focus:outline-none focus:border-primary"
                />
                <button className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary/90 transition-colors">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center">
            <p className="text-sm mb-4">Formas de Pagamento</p>
            <div className="flex justify-center items-center space-x-4 text-xs">
              <span className="px-3 py-1 bg-gray-700 rounded">PIX</span>
              <span className="px-3 py-1 bg-gray-700 rounded">Cartão de Crédito</span>
              <span className="px-3 py-1 bg-gray-700 rounded">Boleto</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>
            © {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Powered by WikiStore - Plataforma de E-commerce
          </p>
        </div>
      </div>
    </footer>
  );
}