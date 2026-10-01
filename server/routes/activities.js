import express from 'express';
import Activity from '../models/Activity.js';
import Category from '../models/Category.js';
import { categorizeActivity } from '../services/categorize.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    console.error('Failed to load activities:', error.message);
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Activity name is required' });
  }

  if (name.length > 120) {
    return res.status(400).json({ error: 'Activity name must be 120 characters or fewer' });
  }

  try {
    const categoryDocs = await Category.find().sort({ name: 1 });
    const category = await categorizeActivity(name, categoryDocs.map((doc) => doc.name));
    const activity = await Activity.create({ name, category });
    res.status(201).json(activity);
  } catch (error) {
    console.error('Failed to save activity:', error.message);
    res.status(500).json({ error: 'Failed to save activity' });
  }
});

router.patch('/:id', validateObjectId, async (req, res) => {
  const { id } = req.params;
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const categoryExists = await Category.exists({ name: category });

    if (!categoryExists) {
      return res.status(400).json({ error: 'That category does not exist' });
    }

    const activity = await Activity.findByIdAndUpdate(id, { category }, { new: true, runValidators: true });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Failed to update activity:', error.message);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const deleted = await Activity.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete activity:', error.message);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

router.delete('/', async (_req, res) => {
  try {
    await Activity.deleteMany({});
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete activities:', error.message);
    res.status(500).json({ error: 'Failed to delete activities' });
  }
});

export default router;
