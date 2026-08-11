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

// Interactive Swagger UI API Documentation
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Mini ERP + CRM API Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; }
        .swagger-ui .topbar { background-color: #0f172a; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
          });
        };
      </script>
    </body>
    </html>
  `);
});

app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Mini ERP + CRM Portal REST API',
      version: '1.0.0',
      description: 'API specification for authentication, CRM customer pipeline, inventory stock management, and sales challan processing.'
    },
    servers: [{ url: 'http://localhost:5000/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {
      '/auth/login': {
        post: {
          summary: 'User Sign In',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Authenticated successfully' } }
        }
      },
      '/auth/register': {
        post: {
          summary: 'User Registration',
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } } }
          },
          responses: { 201: { description: 'User account created' } }
        }
      },
      '/customers': {
        get: { summary: 'List Customers', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Customer list' } } },
        post: { summary: 'Create Customer Lead', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Customer created' } } }
      },
      '/products': {
        get: { summary: 'List Products', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Product list' } } },
        post: { summary: 'Create Product', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Product created' } } }
      },
      '/challans': {
        get: { summary: 'List Sales Challans', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Challan list' } } },
        post: { summary: 'Create Sales Challan', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Challan created' } } }
      }
    }
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date(), service: 'Mini ERP + CRM Backend API' });
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
