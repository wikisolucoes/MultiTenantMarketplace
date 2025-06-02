import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tenant, Product } from "@/types/api";
import { ShoppingCart, Star, Filter, Grid, List } from "lucide-react";

interface ProductCatalogProps {
  tenant: Tenant;
  products: Product[];
  onAddToCart: (productId: number, quantity?: number) => void;
  isLoading: boolean;
}

export default function ProductCatalog({ tenant, products, onAddToCart, isLoading }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<"all" | "0-100" | "100-500" | "500+">("all");

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(typeof value === "string" ? parseFloat(value) : value);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => product.isActive);

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price);
        switch (priceRange) {
          case "0-100":
            return price <= 100;
          case "100-500":
            return price > 100 && price <= 500;
          case "500+":
            return price > 500;
          default:
            return true;
        }
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, searchQuery, sortBy, priceRange]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i}>
                <div className="aspect-square bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Produtos - {tenant.name}
        </h1>
        <p className="text-muted-foreground">
          Encontre os melhores produtos em {tenant.category}
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select value={priceRange} onValueChange={(value: any) => setPriceRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os preços</SelectItem>
                <SelectItem value="0-100">Até R$ 100</SelectItem>
                <SelectItem value="100-500">R$ 100 - R$ 500</SelectItem>
                <SelectItem value="500+">Acima de R$ 500</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="price-low">Menor preço</SelectItem>
                <SelectItem value="price-high">Maior preço</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-muted-foreground">
          {filteredAndSortedProducts.length} produto(s) encontrado(s)
        </p>
      </div>

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou termos de busca
          </p>
          <Button onClick={() => { setSearchQuery(""); setPriceRange("all"); }}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredAndSortedProducts.map((product) => (
            <Card key={product.id} className={`group hover:shadow-lg transition-shadow ${
              viewMode === "list" ? "flex" : ""
            }`}>
              <div className={`${viewMode === "list" ? "w-48" : "aspect-square"} bg-muted rounded-t-lg ${
                viewMode === "list" ? "rounded-l-lg rounded-t-none" : ""
              } relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                    {viewMode === "grid" && (
                      <p className="text-sm font-medium">{product.name}</p>
                    )}
                  </div>
                </div>
                {product.stock === 0 && (
                  <Badge variant="destructive" className="absolute top-2 right-2">
                    Esgotado
                  </Badge>
                )}
              </div>
              <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                <Link href={`/produto/${product.id}`}>
                  <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                {product.description && viewMode === "list" && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                </div>
                <div className={`flex items-center ${viewMode === "list" ? "justify-between" : "justify-between"}`}>
                  <div>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onAddToCart(product.id)}
                    disabled={product.stock === 0}
                    className="shrink-0"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {viewMode === "list" && "Adicionar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}