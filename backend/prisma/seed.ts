import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clear Database (Disabled for standalone MongoDB)
  // await prisma.followUpNote.deleteMany({});
  // await prisma.stockMovement.deleteMany({});
  // await prisma.challan.deleteMany({});
  // await prisma.customer.deleteMany({});
  // await prisma.product.deleteMany({});
  // await prisma.user.deleteMany({});

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  const salesHash = await bcrypt.hash('sales123', salt);
  const warehouseHash = await bcrypt.hash('warehouse123', salt);
  const accountsHash = await bcrypt.hash('accounts123', salt);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      name: 'Aditya Admin',
      role: 'ADMIN'
    }
  });

  const sales = await prisma.user.create({
    data: {
      username: 'sales',
      passwordHash: salesHash,
      name: 'Siddharth Sales',
      role: 'SALES'
    }
  });

  const warehouse = await prisma.user.create({
    data: {
      username: 'warehouse',
      passwordHash: warehouseHash,
      name: 'Waseem Warehouse',
      role: 'WAREHOUSE'
    }
  });

  const accounts = await prisma.user.create({
    data: {
      username: 'accounts',
      passwordHash: accountsHash,
      name: 'Aishwarya Accounts',
      role: 'ACCOUNTS'
    }
  });

  console.log('Seeded users: admin, sales, warehouse, accounts');

  // 3. Create Products
  const products = [
    {
      name: 'Premium Leather Shoes',
      sku: 'SHO-LEA-001',
      category: 'Footwear',
      unitPrice: 1200.00,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Aisle 3, Shelf B'
    },
    {
      name: 'Cotton Casual T-Shirt',
      sku: 'TSH-COT-002',
      category: 'Apparel',
      unitPrice: 450.00,
      currentStock: 120,
      minStockAlert: 15,
      location: 'Aisle 1, Shelf D'
    },
    {
      name: 'Denim Jeans Blue',
      sku: 'JNS-DEN-003',
      category: 'Apparel',
      unitPrice: 1800.00,
      currentStock: 12, // Low stock!
      minStockAlert: 20,
      location: 'Aisle 1, Shelf F'
    },
    {
      name: 'Stainless Steel Water Bottle',
      sku: 'BTL-SST-004',
      category: 'Kitchenware',
      unitPrice: 650.00,
      currentStock: 5, // Low stock!
      minStockAlert: 10,
      location: 'Aisle 5, Shelf A'
    },
    {
      name: 'Wireless Bluetooth Earbuds',
      sku: 'EAR-WLS-005',
      category: 'Electronics',
      unitPrice: 2499.00,
      currentStock: 80,
      minStockAlert: 15,
      location: 'Aisle 8, Shelf C'
    }
  ];

  for (const item of products) {
    const p = await prisma.product.create({
      data: item
    });

    // Create initial stock movement logs
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        quantityChanged: p.currentStock,
        type: 'IN',
        reason: 'Seeded initial stock',
        createdById: admin.id
      }
    });
  }

  console.log(`Seeded ${products.length} products`);

  // 4. Create Customers
  const customers = [
    {
      name: 'Reliance Retail Ltd',
      mobile: '9876543210',
      email: 'procurement@relianceretail.com',
      businessName: 'Reliance Retail Limited',
      gstNumber: '27AAACR1234F1Z5',
      customerType: 'WHOLESALE',
      address: 'Reliance Corporate Park, Ghansoli, Navi Mumbai, MH - 400701',
      status: 'ACTIVE',
      notes: 'Major wholesale partner, order cycle is monthly.'
    },
    {
      name: 'Acme Distributors',
      mobile: '8765432109',
      email: 'orders@acmedistributors.in',
      businessName: 'Acme Retail & Distribution',
      gstNumber: '27AABCA5678B2Z2',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 45, GIDC Electronics Estate, Gandhinagar, GJ - 382028',
      status: 'ACTIVE',
      notes: 'Prefers bulk delivery on weekends.'
    },
    {
      name: 'Rahul Sharma',
      mobile: '7654321098',
      email: 'rahul.sharma@gmail.com',
      businessName: 'Sharma General Store',
      gstNumber: '',
      customerType: 'RETAIL',
      address: 'Shop No. 12, Sector 15 Market, Noida, UP - 201301',
      status: 'LEAD',
      notes: 'Inquired about buying custom branded clothing items.',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    {
      name: 'Classic Styles Outlet',
      mobile: '6543210987',
      email: 'info@classicstyles.com',
      businessName: 'Classic Styles Boutiques',
      gstNumber: '07AAACS9876E1Z9',
      customerType: 'WHOLESALE',
      address: 'D-56, Lajpat Nagar Central Market, New Delhi - 110024',
      status: 'INACTIVE',
      notes: 'No purchases in the last 6 months. Sales executive to re-engage.'
    }
  ];

  for (const item of customers) {
    const c = await prisma.customer.create({
      data: item
    });

    if (item.notes) {
      await prisma.followUpNote.create({
        data: {
          customerId: c.id,
          note: item.notes,
          createdBy: 'System Seed'
        }
      });
    }
  }

  console.log(`Seeded ${customers.length} customers`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
