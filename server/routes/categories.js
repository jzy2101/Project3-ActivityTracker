import express from 'express';
import Category from '../models/Category.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { isDuplicateKeyError } from '../utils/mongooseErrors.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Failed to load categories:', error.message);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (name.length > 40) {
    return res.status(400).json({ error: 'Category name must be 40 characters or fewer' });
  }

  try {
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'That category already exists' });
    }
    console.error('Failed to save category:', error.message);
    res.status(500).json({ error: 'Failed to save category' });
  }
});

router.patch('/:id', validateObjectId, async (req, res) => {
  const { id } = req.params;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (name.length > 40) {
    return res.status(400).json({ error: 'Category name must be 40 characters or fewer' });
  }

  try {
    const category = await Category.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'That category already exists' });
    }
    console.error('Failed to update category:', error.message);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete category:', error.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
