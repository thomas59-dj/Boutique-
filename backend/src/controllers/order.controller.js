const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const orderService = require('../services/order.service');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  return success(res, order, 'Commande confirmée', 201);
});

const listOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrders(req.user.id);
  return success(res, orders);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id);
  return success(res, order);
});

module.exports = { createOrder, listOrders, getOrder };
