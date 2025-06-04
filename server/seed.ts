import bcrypt from "bcrypt";
import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create demo tenant using the existing database structure
    const hashedPassword = await bcrypt.hash("demo123", 10);
    
    const tenant = await storage.createTenant({
      name: "Loja Demo",
      subdomain: "lojademo",
      category: "retail",
      status: "active",
      cnpj: "12.345.678/0001-90",
      corporateName: "Loja Demo LTDA",
      fantasyName: "Loja Demo",
      description: "Loja de demonstração com produtos variados",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      phone: "11999999999",
      email: "contato@lojademo.com",
      contactPerson: "João Silva"
    });

    const user = await storage.createUser({
      email: "joao@exemplo.com",
      password: hashedPassword,
      fullName: "João Silva",
      document: "12345678901",
      documentType: "cpf",
      phone: "11999999999",
      role: "merchant",
      tenantId: tenant.id
    });

    console.log(`Created tenant: ${tenant.name} (ID: ${tenant.id})`);
    console.log(`Created user: ${user.email} (ID: ${user.id})`);

    // Create brands
    const brand1 = await storage.createBrand({
      tenantId: tenant.id,
      name: "Marca Premium",
      description: "Produtos de alta qualidade",
      logoUrl: "https://via.placeholder.com/200x100/4F46E5/FFFFFF?text=Marca+Premium",
      isActive: true
    });

    const brand2 = await storage.createBrand({
      tenantId: tenant.id,
      name: "Eco Sustentável",
      description: "Produtos ecológicos e sustentáveis",
      logoUrl: "https://via.placeholder.com/200x100/10B981/FFFFFF?text=Eco+Sustentavel",
      isActive: true
    });

    console.log(`Created brands: ${brand1.name}, ${brand2.name}`);

    // Create categories
    const category1 = await storage.createCategory({
      tenantId: tenant.id,
      name: "Eletrônicos",
      description: "Produtos eletrônicos e tecnologia",
      isActive: true
    });

    const category2 = await storage.createCategory({
      tenantId: tenant.id,
      name: "Casa e Jardim",
      description: "Produtos para casa e decoração",
      parentId: null,
      isActive: true
    });

    const subcategory = await storage.createCategory({
      tenantId: tenant.id,
      name: "Smartphones",
      description: "Telefones celulares e acessórios",
      parentId: category1.id,
      isActive: true
    });

    console.log(`Created categories: ${category1.name}, ${category2.name}, ${subcategory.name}`);

    // Create products with advanced features
    const product1 = await storage.createProduct({
      tenantId: tenant.id,
      name: "Smartphone Premium X1",
      description: "Smartphone com tecnologia de ponta, câmera de 108MP e bateria de longa duração",
      sku: "SPX1-001",
      price: "2499.99",
      compareAtPrice: "2999.99",
      costPrice: "1800.00",
      stock: 50,
      minStock: 5,
      maxStock: 200,
      brandId: brand1.id,
      categoryId: subcategory.id,
      weight: "0.180",
      dimensions: { length: 15.5, width: 7.5, height: 0.8 },
      isActive: true,
      isFeatured: true,
      tags: ["smartphone", "premium", "5g", "camera"],
      // Brazilian tax fields
      ncmCode: "8517.12.31",
      cfopCode: "5102",
      icmsRate: "18.00",
      ipiRate: "0.00",
      pisRate: "1.65",
      cofinsRate: "7.60",
      origin: "0",
      cest: "2100100"
    });

    // Add images for product 1
    await storage.updateProductImages(product1.id, [
      {
        productId: product1.id,
        url: "https://via.placeholder.com/800x800/1F2937/FFFFFF?text=Smartphone+X1+Frente",
        altText: "Smartphone Premium X1 - Vista frontal",
        sortOrder: 0,
        isPrimary: true
      },
      {
        productId: product1.id,
        url: "https://via.placeholder.com/800x800/374151/FFFFFF?text=Smartphone+X1+Verso",
        altText: "Smartphone Premium X1 - Vista traseira",
        sortOrder: 1,
        isPrimary: false
      },
      {
        productId: product1.id,
        url: "https://via.placeholder.com/800x800/4B5563/FFFFFF?text=Smartphone+X1+Lateral",
        altText: "Smartphone Premium X1 - Vista lateral",
        sortOrder: 2,
        isPrimary: false
      }
    ]);

    // Add specifications for product 1
    await storage.updateProductSpecifications(product1.id, [
      { productId: product1.id, name: "Tela", value: "6.7 polegadas AMOLED", sortOrder: 0 },
      { productId: product1.id, name: "Processador", value: "Snapdragon 8 Gen 2", sortOrder: 1 },
      { productId: product1.id, name: "Memória RAM", value: "12GB LPDDR5", sortOrder: 2 },
      { productId: product1.id, name: "Armazenamento", value: "256GB UFS 4.0", sortOrder: 3 },
      { productId: product1.id, name: "Câmera Principal", value: "108MP com OIS", sortOrder: 4 },
      { productId: product1.id, name: "Bateria", value: "4500mAh com carregamento rápido 67W", sortOrder: 5 },
      { productId: product1.id, name: "Sistema Operacional", value: "Android 14", sortOrder: 6 },
      { productId: product1.id, name: "Conectividade", value: "5G, Wi-Fi 6E, Bluetooth 5.3", sortOrder: 7 }
    ]);

    // Add bulk pricing rules (atacado) for product 1
    await storage.updateBulkPricingRules(product1.id, [
      {
        productId: product1.id,
        minQuantity: 5,
        maxQuantity: 9,
        pricePerUnit: "2399.99",
        discountPercentage: "4.00",
        isActive: true
      },
      {
        productId: product1.id,
        minQuantity: 10,
        maxQuantity: 19,
        pricePerUnit: "2299.99",
        discountPercentage: "8.00",
        isActive: true
      },
      {
        productId: product1.id,
        minQuantity: 20,
        maxQuantity: null,
        pricePerUnit: "2199.99",
        discountPercentage: "12.00",
        isActive: true
      }
    ]);

    const product2 = await storage.createProduct({
      tenantId: tenant.id,
      name: "Kit Jardinagem Eco",
      description: "Kit completo para jardinagem sustentável com ferramentas biodegradáveis",
      sku: "KJE-002",
      price: "149.99",
      compareAtPrice: "199.99",
      costPrice: "80.00",
      stock: 25,
      minStock: 3,
      maxStock: 100,
      brandId: brand2.id,
      categoryId: category2.id,
      weight: "1.200",
      dimensions: { length: 45.0, width: 25.0, height: 15.0 },
      isActive: true,
      isFeatured: false,
      tags: ["jardinagem", "eco", "sustentavel", "ferramentas"],
      ncmCode: "8201.30.00",
      cfopCode: "5102",
      icmsRate: "18.00",
      ipiRate: "5.00",
      pisRate: "1.65",
      cofinsRate: "7.60",
      origin: "0"
    });

    // Add images for product 2
    await storage.updateProductImages(product2.id, [
      {
        productId: product2.id,
        url: "https://via.placeholder.com/800x800/059669/FFFFFF?text=Kit+Jardinagem",
        altText: "Kit Jardinagem Eco - Conjunto completo",
        sortOrder: 0,
        isPrimary: true
      },
      {
        productId: product2.id,
        url: "https://via.placeholder.com/800x800/0D9488/FFFFFF?text=Ferramentas+Eco",
        altText: "Kit Jardinagem Eco - Ferramentas individuais",
        sortOrder: 1,
        isPrimary: false
      }
    ]);

    // Add specifications for product 2
    await storage.updateProductSpecifications(product2.id, [
      { productId: product2.id, name: "Material", value: "Bambu e materiais reciclados", sortOrder: 0 },
      { productId: product2.id, name: "Itens Inclusos", value: "Pá, enxada, rastelo, regador, luvas", sortOrder: 1 },
      { productId: product2.id, name: "Certificação", value: "Produto certificado como sustentável", sortOrder: 2 },
      { productId: product2.id, name: "Durabilidade", value: "Resistente à água e intempéries", sortOrder: 3 }
    ]);

    // Add bulk pricing rules for product 2
    await storage.updateBulkPricingRules(product2.id, [
      {
        productId: product2.id,
        minQuantity: 3,
        maxQuantity: 5,
        pricePerUnit: "139.99",
        discountPercentage: "6.67",
        isActive: true
      },
      {
        productId: product2.id,
        minQuantity: 6,
        maxQuantity: null,
        pricePerUnit: "129.99",
        discountPercentage: "13.33",
        isActive: true
      }
    ]);

    // Create promotions
    const promotion1 = await storage.createPromotion({
      tenantId: tenant.id,
      name: "Black Friday Eletrônicos",
      description: "Desconto especial em todos os eletrônicos",
      discountType: "percentage",
      discountValue: "25.00",
      startDate: new Date("2024-11-25"),
      endDate: new Date("2024-11-30"),
      isActive: true,
      usageLimit: 100,
      usageCount: 0
    });

    const promotion2 = await storage.createPromotion({
      tenantId: tenant.id,
      name: "Frete Grátis Casa e Jardim",
      description: "Frete grátis para produtos de casa e jardim acima de R$ 100",
      discountType: "fixed_amount",
      discountValue: "15.00",
      startDate: new Date(),
      endDate: new Date("2024-12-31"),
      isActive: true,
      usageLimit: null,
      usageCount: 0
    });

    console.log(`Created promotions: ${promotion1.name}, ${promotion2.name}`);

    // Create sample orders
    const order1 = await storage.createOrder({
      tenantId: tenant.id,
      productId: product1.id,
      quantity: 2,
      unitPrice: "2499.99",
      totalPrice: "4999.98",
      status: "processing"
    });

    const order2 = await storage.createOrder({
      tenantId: tenant.id,
      productId: product2.id,
      quantity: 1,
      unitPrice: "149.99",
      totalPrice: "149.99",
      status: "delivered"
    });

    console.log(`Created orders: ${order1.id}, ${order2.id}`);

    console.log("Database seeding completed successfully!");
    console.log("\n=== LOGIN CREDENTIALS ===");
    console.log("Email: joao@exemplo.com");
    console.log("Password: demo123");
    console.log("Role: merchant");
    console.log("Tenant: Loja Demo");
    console.log("=========================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  }).catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}