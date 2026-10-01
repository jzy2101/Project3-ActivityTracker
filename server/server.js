import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path'
import dotenv from 'dotenv';
import Category from './models/Category.js';
import activitiesRouter from './routes/activities.js';
import categoriesRouter from './routes/categories.js';
import { CATEGORIES } from './constants/categories.js';
const __dirname = import.meta.dirname;
const app = express();
const PORT = process.env.PORT || 3001;
dotenv.config({ path: path.join(__dirname, '.env') });

app.use(express.json());

app.get('/api', (req, res) => {
  res.send('Hello from the Node.js backend api!');
});

app.use('/api/activities', activitiesRouter);
app.use('/api/categories', categoriesRouter);

// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

async function startServer() {
  if (!process.env.DB_URI) {
    throw new Error('DB_URI is missing from server/.env');
  }

  await mongoose.connect(process.env.DB_URI, { dbName: 'activity_tracker' });

  const existingCategoryCount = await Category.countDocuments();
  if (existingCategoryCount === 0) {
    await Category.insertMany(CATEGORIES.map((name) => ({ name })));
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});