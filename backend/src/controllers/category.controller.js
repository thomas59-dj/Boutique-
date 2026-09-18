const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const categoryService = require('../services/category.service');

const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAll();
  return success(res, categories);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  return success(res, category, 'Catégorie créée', 201);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  return success(res, category, 'Catégorie mise à jour');
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  return success(res, null, 'Catégorie supprimée');
});

module.exports = { getAll, create, update, remove };
