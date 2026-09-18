const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const productService = require('../services/product.service');

const list = asyncHandler(async (req, res) => {
  const result = await productService.list(req.query);
  return success(res, result);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  return success(res, product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  return success(res, product, 'Produit créé', 201);
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  return success(res, product, 'Produit mis à jour');
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  return success(res, null, 'Produit supprimé');
});

module.exports = { list, getById, create, update, remove };
