// Peuple la base de données avec des catégories et des produits de démonstration.
// Lancer avec : npx prisma db seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const prisma = new PrismaClient();

const categories = ['Clothing', 'Electronics', 'Home', 'Shoes', 'Accessories', 'Bags'];

const products = [
  { name: 'Cotton T-Shirt', category: 'Clothing', price: 19.99, oldPrice: null, stock: 40, isNew: true },
  { name: 'Slim Fit Jeans', category: 'Clothing', price: 39.99, oldPrice: 49.99, stock: 25 },
  { name: 'Wool Sweater', category: 'Clothing', price: 44.99, oldPrice: null, stock: 18 },
  { name: 'Classic Travel Backpack', category: 'Bags', price: 49.99, oldPrice: 69.99, stock: 15 },
  { name: 'Classic Travel Bag', category: 'Bags', price: 59.99, oldPrice: null, stock: 12 },
  { name: 'Leather Tote Bag', category: 'Bags', price: 74.99, oldPrice: 89.99, stock: 10 },
  { name: 'Classic Travel Boots', category: 'Shoes', price: 79.99, oldPrice: 99.99, stock: 20 },
  { name: 'Running Sneakers', category: 'Shoes', price: 64.99, oldPrice: null, stock: 30, isNew: true },
  { name: 'Leather Loafers', category: 'Shoes', price: 89.99, oldPrice: null, stock: 14 },
  { name: 'Wireless Headphones', category: 'Electronics', price: 59.99, oldPrice: 79.99, stock: 22 },
  { name: 'Bluetooth Speaker', category: 'Electronics', price: 34.99, oldPrice: null, stock: 28 },
  { name: 'Smart Watch', category: 'Electronics', price: 129.99, oldPrice: 159.99, stock: 16, isNew: true },
  { name: 'USB-C Charger', category: 'Electronics', price: 14.99, oldPrice: null, stock: 50 },
  { name: 'Ceramic Mug Set', category: 'Home', price: 24.99, oldPrice: null, stock: 35 },
  { name: 'Scented Candle', category: 'Home', price: 12.99, oldPrice: null, stock: 45 },
  { name: 'Linen Cushion Cover', category: 'Home', price: 17.99, oldPrice: 22.99, stock: 30 },
  { name: 'Table Lamp', category: 'Home', price: 39.99, oldPrice: null, stock: 20 },
  { name: 'Leather Belt', category: 'Accessories', price: 22.99, oldPrice: null, stock: 26 },
  { name: 'Aviator Sunglasses', category: 'Accessories', price: 29.99, oldPrice: 34.99, stock: 24, isNew: true },
  { name: 'Wool Scarf', category: 'Accessories', price: 18.99, oldPrice: null, stock: 32 },
];

async function main() {
  console.log('🌱 Nettoyage de la base...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🌱 Création des catégories...');
  const categoryMap = {};
  for (const name of categories) {
    const cat = await prisma.category.create({
      data: { name, slug: slugify(name, { lower: true, strict: true }) },
    });
    categoryMap[name] = cat.id;
  }

  console.log('🌱 Création des produits...');
  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name, { lower: true, strict: true }),
        description: `${p.name} — un produit de qualité, parfait pour un usage quotidien.`,
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        image: `assets/products/${slugify(p.name, { lower: true, strict: true })}.jpg`,
        isNew: p.isNew || false,
        popularity: Math.floor(Math.random() * 100),
        categoryId: categoryMap[p.category],
      },
    });
  }

  console.log('🌱 Création du compte administrateur de démonstration...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'Boutique',
      email: 'admin@boutique.test',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  await prisma.cart.create({ data: { userId: admin.id } });

  console.log('✅ Seed terminé. Compte admin : admin@boutique.test / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
