// Logique métier du panier. Le panier est toujours en base, lié au user connecté
// (voir §9 du cahier des charges : persistance côté serveur pour les utilisateurs connectés).
const prisma = require('../config/prisma');

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true } } },
    });
  }
  return cart;
}

async function addItem(userId, productId, quantity = 1) {
  const cart = await getOrCreateCart(userId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const err = new Error('Produit introuvable');
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  }

  return prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity },
  });
}

async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) {
    const err = new Error('Article introuvable dans le panier');
    err.statusCode = 404;
    throw err;
  }
  if (quantity <= 0) {
    return prisma.cartItem.delete({ where: { id: itemId } });
  }
  return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) {
    const err = new Error('Article introuvable dans le panier');
    err.statusCode = 404;
    throw err;
  }
  return prisma.cartItem.delete({ where: { id: itemId } });
}

// Fusionne un panier local (localStorage, envoyé par le frontend à la connexion)
// avec le panier serveur de l'utilisateur (voir §9 : synchronisation à la connexion).
async function mergeLocalCart(userId, localItems = []) {
  const cart = await getOrCreateCart(userId);

  for (const localItem of localItems) {
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: localItem.productId } },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + localItem.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: localItem.productId, quantity: localItem.quantity },
      });
    }
  }

  return getOrCreateCart(userId);
}

module.exports = { getOrCreateCart, addItem, updateItemQuantity, removeItem, mergeLocalCart };
