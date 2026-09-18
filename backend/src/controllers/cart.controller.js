const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const cartService = require('../services/cart.service');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getOrCreateCart(req.user.id);
  return success(res, cart);
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  await cartService.addItem(req.user.id, productId, quantity || 1);
  const cart = await cartService.getOrCreateCart(req.user.id);
  return success(res, cart, 'Produit ajouté au panier', 201);
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  await cartService.updateItemQuantity(req.user.id, req.params.id, quantity);
  const cart = await cartService.getOrCreateCart(req.user.id);
  return success(res, cart, 'Panier mis à jour');
});

const removeItem = asyncHandler(async (req, res) => {
  await cartService.removeItem(req.user.id, req.params.id);
  const cart = await cartService.getOrCreateCart(req.user.id);
  return success(res, cart, 'Produit retiré du panier');
});

const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // panier local envoyé lors de la connexion
  const cart = await cartService.mergeLocalCart(req.user.id, items);
  return success(res, cart, 'Panier synchronisé');
});

module.exports = { getCart, addItem, updateItem, removeItem, mergeCart };
