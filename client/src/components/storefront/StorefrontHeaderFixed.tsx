import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tenant } from "@/types/api";
import { Search, ShoppingCart, Menu, X, User, Phone, Mail } from "lucide-react";

interface StorefrontHeaderProps {
  tenant: Tenant | null;
  cartItemCount: number;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function StorefrontHeaderFixed({ tenant, cartItemCount, onNavigate, currentPage }: StorefrontHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("produtos");
    }
  };

  const NavButton = ({ page, children, className = "" }: { page: string; children: React.ReactNode; className?: string }) => (
    <button
      onClick={() => onNavigate(page)}
      className={`${className} ${currentPage === page ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'}`}
    >
      {children}
    </button>
  );

  if (!tenant) {
    return (
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">Carregando...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-border sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                <span>(11) 98765-4321</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                <span>contato@{tenant.subdomain}.com</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NavButton page="login" className="hover:underline text-sm">
                <User className="h-3 w-3 mr-1 inline" />
                Minha Conta
              </NavButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <NavButton page="home" className="text-2xl font-bold text-primary hover:text-primary/80">
              {tenant.name}
            </NavButton>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavButton page="home">Início</NavButton>
            <NavButton page="produtos">Produtos</NavButton>
            <NavButton page="sobre">Sobre</NavButton>
            <NavButton page="contato">Contato</NavButton>
          </nav>

          {/* Search and Cart */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pr-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Cart */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("carrinho")}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden mt-4">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full px-3"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <NavButton page="home" className="text-left py-2">Início</NavButton>
              <NavButton page="produtos" className="text-left py-2">Produtos</NavButton>
              <NavButton page="sobre" className="text-left py-2">Sobre</NavButton>
              <NavButton page="contato" className="text-left py-2">Contato</NavButton>
              <NavButton page="privacidade" className="text-left py-2">Privacidade</NavButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}