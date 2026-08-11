import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding using raw MongoDB commands (no replica set required)...');

  // 1. Drop existing data by executing drop commands
  const collections = ['User', 'Product', 'Customer', 'StockMovement', 'FollowUpNote', 'Challan'];
  for (const col of collections) {
    try {
      await prisma.$runCommandRaw({ drop: col });
      console.log(`Dropped collection ${col}`);
    } catch (e) {
      // Ignore if collection does not exist
    }
  }

  // 2. Hash passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const salesHash = await bcrypt.hash('sales123', salt);
  const warehouseHash = await bcrypt.hash('warehouse123', salt);
  const accountsHash = await bcrypt.hash('accounts123', salt);

  // Generate 24-char hex IDs
  const adminId = '65c8f1e29c8d4e001f8a8b11';
  const salesId = '65c8f1e29c8d4e001f8a8b12';
  const warehouseId = '65c8f1e29c8d4e001f8a8b13';
  const accountsId = '65c8f1e29c8d4e001f8a8b14';

  // Insert Users
  await prisma.$runCommandRaw({
    insert: 'User',
    documents: [
      {
        _id: { $oid: adminId },
        username: 'admin',
        passwordHash,
        name: 'Aditya Admin',
        role: 'ADMIN',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: salesId },
        username: 'sales',
        passwordHash: salesHash,
        name: 'Siddharth Sales',
        role: 'SALES',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: warehouseId },
        username: 'warehouse',
        passwordHash: warehouseHash,
        name: 'Waseem Warehouse',
        role: 'WAREHOUSE',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: accountsId },
        username: 'accounts',
        passwordHash: accountsHash,
        name: 'Aishwarya Accounts',
        role: 'ACCOUNTS',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      }
    ]
  });
  console.log('Seeded users');

  // Insert Products
  const prodIds = [
    '65c8f1e29c8d4e001f8a8b21',
    '65c8f1e29c8d4e001f8a8b22',
    '65c8f1e29c8d4e001f8a8b23',
    '65c8f1e29c8d4e001f8a8b24',
    '65c8f1e29c8d4e001f8a8b25'
  ];

  await prisma.$runCommandRaw({
    insert: 'Product',
    documents: [
      {
        _id: { $oid: prodIds[0] },
        name: 'Premium Leather Shoes',
        sku: 'SHO-LEA-001',
        category: 'Footwear',
        unitPrice: 1200.00,
        currentStock: 50,
        minStockAlert: 10,
        location: 'Aisle 3, Shelf B',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: prodIds[1] },
        name: 'Cotton Casual T-Shirt',
        sku: 'TSH-COT-002',
        category: 'Apparel',
        unitPrice: 450.00,
        currentStock: 120,
        minStockAlert: 15,
        location: 'Aisle 1, Shelf D',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: prodIds[2] },
        name: 'Denim Jeans Blue',
        sku: 'JNS-DEN-003',
        category: 'Apparel',
        unitPrice: 1800.00,
        currentStock: 12,
        minStockAlert: 20,
        location: 'Aisle 1, Shelf F',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: prodIds[3] },
        name: 'Stainless Steel Water Bottle',
        sku: 'BTL-SST-004',
        category: 'Kitchenware',
        unitPrice: 650.00,
        currentStock: 5,
        minStockAlert: 10,
        location: 'Aisle 5, Shelf A',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: prodIds[4] },
        name: 'Wireless Bluetooth Earbuds',
        sku: 'EAR-WLS-005',
        category: 'Electronics',
        unitPrice: 2499.00,
        currentStock: 80,
        minStockAlert: 15,
        location: 'Aisle 8, Shelf C',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      }
    ]
  });
  console.log('Seeded products');

  // Insert Stock Movements
  await prisma.$runCommandRaw({
    insert: 'StockMovement',
    documents: [
      {
        productId: { $oid: prodIds[0] },
        quantityChanged: 50,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: { $oid: adminId },
        createdAt: { $date: new Date().toISOString() }
      },
      {
        productId: { $oid: prodIds[1] },
        quantityChanged: 120,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: { $oid: adminId },
        createdAt: { $date: new Date().toISOString() }
      },
      {
        productId: { $oid: prodIds[2] },
        quantityChanged: 12,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: { $oid: adminId },
        createdAt: { $date: new Date().toISOString() }
      },
      {
        productId: { $oid: prodIds[3] },
        quantityChanged: 5,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: { $oid: adminId },
        createdAt: { $date: new Date().toISOString() }
      },
      {
        productId: { $oid: prodIds[4] },
        quantityChanged: 80,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: { $oid: adminId },
        createdAt: { $date: new Date().toISOString() }
      }
    ]
  });
  console.log('Seeded stock movements');

  // Insert Customers
  const custIds = [
    '65c8f1e29c8d4e001f8a8b31',
    '65c8f1e29c8d4e001f8a8b32',
    '65c8f1e29c8d4e001f8a8b33',
    '65c8f1e29c8d4e001f8a8b34'
  ];

  await prisma.$runCommandRaw({
    insert: 'Customer',
    documents: [
      {
        _id: { $oid: custIds[0] },
        name: 'Reliance Retail Ltd',
        mobile: '9876543210',
        email: 'procurement@relianceretail.com',
        businessName: 'Reliance Retail Limited',
        gstNumber: '27AAACR1234F1Z5',
        customerType: 'WHOLESALE',
        address: 'Reliance Corporate Park, Ghansoli, Navi Mumbai, MH - 400701',
        status: 'ACTIVE',
        notes: 'Major wholesale partner, order cycle is monthly.',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: custIds[1] },
        name: 'Acme Distributors',
        mobile: '8765432109',
        email: 'orders@acmedistributors.in',
        businessName: 'Acme Retail & Distribution',
        gstNumber: '27AABCA5678B2Z2',
        customerType: 'DISTRIBUTOR',
        address: 'Plot 45, GIDC Electronics Estate, Gandhinagar, GJ - 382028',
        status: 'ACTIVE',
        notes: 'Prefers bulk delivery on weekends.',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: custIds[2] },
        name: 'Rahul Sharma',
        mobile: '7654321098',
        email: 'rahul.sharma@gmail.com',
        businessName: 'Sharma General Store',
        gstNumber: '',
        customerType: 'RETAIL',
        address: 'Shop No. 12, Sector 15 Market, Noida, UP - 201301',
        status: 'LEAD',
        notes: 'Inquired about buying custom branded clothing items.',
        followUpDate: { $date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      },
      {
        _id: { $oid: custIds[3] },
        name: 'Classic Styles Outlet',
        mobile: '6543210987',
        email: 'info@classicstyles.com',
        businessName: 'Classic Styles Boutiques',
        gstNumber: '07AAACS9876E1Z9',
        customerType: 'WHOLESALE',
        address: 'D-56, Lajpat Nagar Central Market, New Delhi - 110024',
        status: 'INACTIVE',
        notes: 'No purchases in the last 6 months. Sales executive to re-engage.',
        createdAt: { $date: new Date().toISOString() },
        updatedAt: { $date: new Date().toISOString() }
      }
    ]
  });
  console.log('Seeded customers');

  // Insert FollowUpNotes
  await prisma.$runCommandRaw({
    insert: 'FollowUpNote',
    documents: [
      {
        customerId: { $oid: custIds[0] },
        note: 'Major wholesale partner, order cycle is monthly.',
        createdBy: 'System Seed',
        createdAt: { $date: new Date().toISOString() }
      },
      {
        customerId: { $oid: custIds[1] },
        note: 'Prefers bulk delivery on weekends.',
        createdBy: 'System Seed',
        createdAt: { $date: new Date().toISOString() }
      },
      {
        customerId: { $oid: custIds[2] },
        note: 'Inquired about buying custom branded clothing items.',
        createdBy: 'System Seed',
        createdAt: { $date: new Date().toISOString() }
      },
      {
        customerId: { $oid: custIds[3] },
        note: 'No purchases in the last 6 months. Sales executive to re-engage.',
        createdBy: 'System Seed',
        createdAt: { $date: new Date().toISOString() }
      }
    ]
  });
  console.log('Seeded follow up notes');

  console.log('Raw database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
