// Logique métier des commandes : création à partir du panier, historique utilisateur.
const prisma = require('../config/prisma');
const { getOrCreateCart } = require('./cart.service');

const SHIPPING_COST = 3.99;

async function createOrder(userId, { addressId, paymentMethod }) {
  const cart = await getOrCreateCart(userId);

  if (!cart.items.length) {
    const err = new Error('Le panier est vide');
    err.statusCode = 400;
    throw err;
  }

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) {
    const err = new Error('Adresse de livraison introuvable');
    err.statusCode = 404;
    throw err;
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = SHIPPING_COST;
  const total = subtotal + shipping;

  // Transaction : on vérifie le stock, crée la commande + ses lignes, décrémente
  // le stock puis vide le panier — le tout ou rien pour rester cohérent
  // (et éviter la survente en cas de commandes concurrentes sur le même produit).
  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        const err = new Error(`Stock insuffisant pour "${item.product.name}"`);
        err.statusCode = 409;
        throw err;
      }
    }

    const newOrder = await tx.order.create({
      data: {
        userId,
        addressId,
        subtotal,
        shipping,
        total,
        paymentMethod, // "CREDIT_CARD_DEMO" | "PAYPAL_DEMO"
        status: 'PAID', // paiement DEMO : validé immédiatement
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true, address: true },
    });

    // Décrémente le stock de chaque produit commandé
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Vide le panier après confirmation de la commande
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
}

async function listOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true, address: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOrderById(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, address: true },
  });
  if (!order) {
    const err = new Error('Commande introuvable');
    err.statusCode = 404;
    throw err;
  }
  return order;
}

module.exports = { createOrder, listOrders, getOrderById, SHIPPING_COST };
