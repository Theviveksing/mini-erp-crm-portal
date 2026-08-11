import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { authenticateJWT, requireRole } from './middlewares/auth';
import { login, register, getMe, updateProfile } from './controllers/auth';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote
} from './controllers/customers';
import {
  getProducts,
  createProduct,
  updateProduct,
  adjustStock,
  getProductMovements
} from './controllers/products';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan
} from './controllers/challans';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);

// Protected routes (require JWT)
app.get('/api/auth/me', authenticateJWT, getMe);
app.put('/api/auth/profile', authenticateJWT, updateProfile);

// CRM Customers routing
app.get(
  '/api/customers',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES', 'ACCOUNTS']),
  getCustomers
);
app.get(
  '/api/customers/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES', 'ACCOUNTS']),
  getCustomerById
);
app.post(
  '/api/customers',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  createCustomer
);
app.put(
  '/api/customers/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  updateCustomer
);
app.post(
  '/api/customers/:id/notes',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  addFollowUpNote
);

// Products and Stock Inventory routing
app.get(
  '/api/products',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  getProducts
);
app.post(
  '/api/products',
  authenticateJWT,
  requireRole(['ADMIN', 'WAREHOUSE']),
  createProduct
);
app.put(
  '/api/products/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'WAREHOUSE']),
  updateProduct
);
app.post(
  '/api/products/:id/adjust-stock',
  authenticateJWT,
  requireRole(['ADMIN', 'WAREHOUSE']),
  adjustStock
);
app.get(
  '/api/products/:id/movements',
  authenticateJWT,
  requireRole(['ADMIN', 'WAREHOUSE']),
  getProductMovements
);

// Sales Challans routing
app.get(
  '/api/challans',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  getChallans
);
app.get(
  '/api/challans/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  getChallanById
);
app.post(
  '/api/challans',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  createChallan
);
app.put(
  '/api/challans/:id/confirm',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  confirmChallan
);
app.put(
  '/api/challans/:id/cancel',
  authenticateJWT,
  requireRole(['ADMIN', 'SALES']),
  cancelChallan
);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
