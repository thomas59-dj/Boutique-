// Logique métier des produits : recherche, filtres, tri, pagination.
const prisma = require('../config/prisma');
const slugify = require('slugify');

async function list(query) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    brand,
    sort,
    page = 1,
    limit = 12,
  } = query;

  const where = {};

  // Recherche textuelle sur nom, description, et catégorie (via relation)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }

  if (brand) {
    where.brand = brand;
  }

  // Tri : prix croissant/décroissant, plus récent, popularité
  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };
  if (sort === 'popularity') orderBy = { popularity: 'desc' };

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) {
    const err = new Error('Produit introuvable');
    err.statusCode = 404;
    throw err;
  }
  return product;
}

async function create(data) {
  const slug = slugify(data.name, { lower: true, strict: true });
  return prisma.product.create({ data: { ...data, slug } });
}

async function update(id, data) {
  const payload = { ...data };
  if (data.name) payload.slug = slugify(data.name, { lower: true, strict: true });
  return prisma.product.update({ where: { id }, data: payload });
}

async function remove(id) {
  return prisma.product.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
