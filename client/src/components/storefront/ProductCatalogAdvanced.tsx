import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Product, Tenant } from "@/types/api";
import { Search, Filter, Grid, List, Star, Heart, ShoppingCart, ChevronDown, X } from "lucide-react";

interface ProductCatalogAdvancedProps {
  tenant: Tenant | null;
  products: Product[];
  onAddToCart: (productId: number, quantity: number) => void;
  onViewProduct: (productId: number) => void;
  onAddToWishlist?: (productId: number) => void;
  isLoading: boolean;
  category?: string;
  brand?: string;
  promotion?: boolean;
}

interface FilterState {
  search: string;
  category: string;
  brand: string;
  priceRange: [number, number];
  inStock: boolean;
  promotion: boolean;
  rating: number;
}

export default function ProductCatalogAdvanced({
  tenant,
  products,
  onAddToCart,
  onViewProduct,
  onAddToWishlist,
  isLoading,
  category = "",
  brand = "",
  promotion = false
}: ProductCatalogAdvancedProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: category,
    brand: brand,
    priceRange: [0, 5000],
    inStock: false,
    promotion: promotion,
    rating: 0
  });

  // Mock enhanced product data with additional fields
  const enhancedProducts = useMemo(() => {
    return products.map(product => ({
      ...product,
      category: 'Eletrônicos',
      brand: 'TechBrand',
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
      reviewCount: Math.floor(Math.random() * 100) + 10,
      discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 10 : 0,
      images: [
        `https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=${encodeURIComponent(product.name.slice(0, 10))}`,
        `https://via.placeholder.com/400x400/059669/FFFFFF?text=Vista+2`,
        `https://via.placeholder.com/400x400/DC2626/FFFFFF?text=Vista+3`
      ],
      specifications: {
        warranty: '12 meses',
        weight: '200g',
        dimensions: '15x10x5cm'
      }
    }));
  }, [products]);

  // Get unique categories and brands for filters
  const categories = Array.from(new Set(enhancedProducts.map(p => p.category)));
  const brands = Array.from(new Set(enhancedProducts.map(p => p.brand)));

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return enhancedProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           product.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesBrand = !filters.brand || product.brand === filters.brand;
      const price = parseFloat(product.price);
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      const matchesStock = !filters.inStock || product.stock > 0;
      const matchesPromotion = !filters.promotion || product.discount > 0;
      const matchesRating = !filters.rating || product.rating >= filters.rating;

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && 
             matchesStock && matchesPromotion && matchesRating;
    });
  }, [enhancedProducts, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-desc':
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredProducts, sortBy]);

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      priceRange: [0, 5000],
      inStock: false,
      promotion: false,
      rating: 0
    });
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const renderProductCard = (product: any) => {
    const discountedPrice = product.discount > 0 
      ? getDiscountedPrice(parseFloat(product.price), product.discount)
      : parseFloat(product.price);

    return (
      <Card key={product.id} className="group hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform cursor-pointer"
              onClick={() => onViewProduct(product.id)}
            />
            {product.discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
                <Badge variant="destructive">Esgotado</Badge>
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90"
                onClick={() => onAddToWishlist?.(product.id)}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <h3 
              className="font-semibold text-sm mb-2 line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => onViewProduct(product.id)}
            >
              {product.name}
            </h3>
            
            <div className="flex items-center mb-2">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground ml-1">
                ({product.reviewCount})
              </span>
            </div>

            <div className="space-y-1 mb-3">
              {product.discount > 0 ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-primary">
                      R$ {discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">
                    Economia de R$ {(parseFloat(product.price) - discountedPrice).toFixed(2)}
                  </p>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">
                  R$ {parseFloat(product.price).toFixed(2)}
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                ou 12x de R$ {(discountedPrice / 12).toFixed(2)}
              </p>
            </div>

            <Button
              onClick={() => onAddToCart(product.id, 1)}
              className="w-full"
              size="sm"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock === 0 ? 'Esgotado' : 'Adicionar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProductList = (product: any) => {
    const discountedPrice = product.discount > 0 
      ? getDiscountedPrice(parseFloat(product.price), product.discount)
      : parseFloat(product.price);

    return (
      <Card key={product.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="relative">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                onClick={() => onViewProduct(product.id)}
              />
              {product.discount > 0 && (
                <Badge className="absolute top-1 left-1 bg-red-500 text-white text-xs">
                  -{product.discount}%
                </Badge>
              )}
            </div>
            
            <div className="flex-1">
              <h3 
                className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary"
                onClick={() => onViewProduct(product.id)}
              >
                {product.name}
              </h3>
              
              <div className="flex items-center mb-2">
                {renderStars(product.rating)}
                <span className="text-sm text-muted-foreground ml-2">
                  ({product.reviewCount} avaliações)
                </span>
              </div>

              <p className="text-muted-foreground mb-3 text-sm">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  {product.discount > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary">
                          R$ {discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-green-600">
                        Economia de R$ {(parseFloat(product.price) - discountedPrice).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">
                    ou 12x de R$ {(discountedPrice / 12).toFixed(2)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => onAddToWishlist?.(product.id)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onAddToCart(product.id, 1)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {product.stock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {category ? `Categoria: ${category}` : 
           brand ? `Marca: ${brand}` :
           promotion ? 'Promoções' : 'Produtos'}
        </h1>
        <p className="text-muted-foreground">
          {sortedProducts.length} produtos encontrados
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome A-Z</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
                <SelectItem value="rating">Mais bem avaliados</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.category || filters.brand || filters.promotion || filters.inStock || filters.rating > 0) && (
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categoria: {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters({ ...filters, category: "" })}
                />
              </Badge>
            )}
            {filters.brand && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Marca: {filters.brand}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters({ ...filters, brand: "" })}
                />
              </Badge>
            )}
            {filters.promotion && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Em promoção
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters({ ...filters, promotion: false })}
                />
              </Badge>
            )}
            {filters.inStock && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Em estoque
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters({ ...filters, inStock: false })}
                />
              </Badge>
            )}
            {filters.rating > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.rating}+ estrelas
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters({ ...filters, rating: 0 })}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <div className={`lg:block ${showFilters ? 'block' : 'hidden'} w-full lg:w-64 space-y-6`}>
          <Card>
            <CardContent className="p-4 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Preço</h3>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                  max={5000}
                  min={0}
                  step={50}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>R$ {filters.priceRange[0]}</span>
                  <span>R$ {filters.priceRange[1]}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Categoria</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox
                        id={cat}
                        checked={filters.category === cat}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, category: checked ? cat : "" })
                        }
                      />
                      <label htmlFor={cat} className="text-sm cursor-pointer">
                        {cat}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Marca</h3>
                <div className="space-y-2">
                  {brands.map((brandName) => (
                    <div key={brandName} className="flex items-center space-x-2">
                      <Checkbox
                        id={brandName}
                        checked={filters.brand === brandName}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, brand: checked ? brandName : "" })
                        }
                      />
                      <label htmlFor={brandName} className="text-sm cursor-pointer">
                        {brandName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Avaliação</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={filters.rating === rating}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, rating: checked ? rating : 0 })
                        }
                      />
                      <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex items-center">
                        {renderStars(rating)}
                        <span className="ml-1">e acima</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={filters.inStock}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, inStock: !!checked })
                    }
                  />
                  <label htmlFor="inStock" className="text-sm cursor-pointer">
                    Apenas em estoque
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="promotion"
                    checked={filters.promotion}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, promotion: !!checked })
                    }
                  />
                  <label htmlFor="promotion" className="text-sm cursor-pointer">
                    Em promoção
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {sortedProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground mb-4">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum produto encontrado</p>
                  <p className="text-sm">Tente ajustar os filtros ou buscar por outros termos</p>
                </div>
                <Button onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map(renderProductCard)}
            </div>
          ) : (
            <div>
              {sortedProducts.map(renderProductList)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}