const prisma = require('../config/prisma');
const slugify = require('slugify');

async function getAll() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

async function create({ name }) {
  const slug = slugify(name, { lower: true, strict: true });
  return prisma.category.create({ data: { name, slug } });
}

async function update(id, { name }) {
  const data = { name };
  if (name) data.slug = slugify(name, { lower: true, strict: true });
  return prisma.category.update({ where: { id }, data });
}

async function remove(id) {
  return prisma.category.delete({ where: { id } });
}

module.exports = { getAll, create, update, remove };
