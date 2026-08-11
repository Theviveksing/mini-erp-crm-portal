import { Response } from 'express';
import prisma from '../db';
import { RequestWithUser } from '../middlewares/auth';

export const getChallans = async (req: RequestWithUser, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || '';
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true, role: true }
          }
        }
      }),
      prisma.challan.count({ where })
    ]);

    // Format challans with parsed snapshot data and customer name
    const formattedChallans = await Promise.all(
      challans.map(async (challan) => {
        const customer = await prisma.customer.findUnique({
          where: { id: challan.customerId },
          select: { name: true, businessName: true }
        });
        
        let parsedSnapshot = [];
        try {
          parsedSnapshot = JSON.parse(challan.snapshotData);
        } catch (e) {
          parsedSnapshot = [];
        }

        return {
          ...challan,
          customerName: customer?.name || 'Unknown',
          customerBusinessName: customer?.businessName || 'Unknown',
          products: parsedSnapshot
        };
      })
    );

    return res.json({
      challans: formattedChallans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('getChallans error:', error);
    return res.status(500).json({ error: 'Failed to retrieve challans' });
  }
};

export const getChallanById = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const challan = await prisma.challan.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: { name: true, role: true }
        }
      }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: challan.customerId }
    });

    let parsedSnapshot = [];
    try {
      parsedSnapshot = JSON.parse(challan.snapshotData);
    } catch (e) {
      parsedSnapshot = [];
    }

    return res.json({
      ...challan,
      customer,
      products: parsedSnapshot
    });
  } catch (error: any) {
    console.error('getChallanById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve challan details' });
  }
};

export const createChallan = async (req: RequestWithUser, res: Response) => {
  const { customerId, items, status } = req.body; // status: DRAFT or CONFIRMED, items: [{ productId, quantity }]

  if (!customerId || !items || !Array.isArray(items) || items.length === 0 || !status) {
    return res.status(400).json({ error: 'Missing required challan fields' });
  }

  const validStatuses = ['DRAFT', 'CONFIRMED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Initial challan status must be DRAFT or CONFIRMED' });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Process and validate items
    const snapshotItems: any[] = [];
    let totalQuantity = 0;

    // Transaction to ensure stock checks and updates are atomic if CONFIRMED
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Challan Number
      const lastChallan = await tx.challan.findFirst({
        orderBy: { id: 'desc' }
      });
      let nextId = 1;
      if (lastChallan) {
        const parts = lastChallan.challanNumber.split('-');
        if (parts.length === 3) {
          const lastNum = parseInt(parts[2]);
          if (!isNaN(lastNum)) {
            nextId = lastNum + 1;
          }
        }
      }
      const challanNumber = `CH-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

      // 2. Fetch and snapshot product details
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: parseInt(item.productId) }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const qty = parseInt(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for product ${product.name}`);
        }

        // If CONFIRMED, check stock levels
        if (status === 'CONFIRMED') {
          if (product.currentStock < qty) {
            throw new Error(`Insufficient stock for product '${product.name}'. Available: ${product.currentStock}, Requested: ${qty}`);
          }

          // Decrement stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              currentStock: product.currentStock - qty
            }
          });

          // Log stock movement
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantityChanged: qty,
              type: 'OUT',
              reason: `Sales Challan ${challanNumber} Confirmation`,
              createdById: req.user!.id
            }
          });
        }

        totalQuantity += qty;

        // Store snapshot of product info at this point in time
        snapshotItems.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: product.unitPrice,
          location: product.location,
          quantity: qty
        });
      }

      // 3. Create Challan
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: parseInt(customerId),
          totalQuantity,
          status,
          createdById: req.user!.id,
          snapshotData: JSON.stringify(snapshotItems)
        }
      });

      return newChallan;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('createChallan error:', error);
    return res.status(400).json({ error: error.message || 'Failed to create challan' });
  }
};

export const confirmChallan = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const challan = await prisma.challan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    if (challan.status !== 'DRAFT') {
      return res.status(400).json({ error: `Challan is already in ${challan.status} status` });
    }

    const items = JSON.parse(challan.snapshotData);

    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock for all items
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product '${item.name}' not found in inventory`);
        }

        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product '${product.name}'. Available: ${product.currentStock}, Requested: ${item.quantity}`);
        }

        // Update stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: product.currentStock - item.quantity
          }
        });

        // Log movement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantityChanged: item.quantity,
            type: 'OUT',
            reason: `Sales Challan ${challan.challanNumber} Confirmation`,
            createdById: req.user!.id
          }
        });
      }

      // Update challan status
      return await tx.challan.update({
        where: { id: challan.id },
        data: {
          status: 'CONFIRMED'
        }
      });
    });

    return res.json(result);
  } catch (error: any) {
    console.error('confirmChallan error:', error);
    return res.status(400).json({ error: error.message || 'Failed to confirm challan' });
  }
};

export const cancelChallan = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const challan = await prisma.challan.findUnique({
      where: { id: parseInt(id) }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Challan is already cancelled' });
    }

    const wasConfirmed = challan.status === 'CONFIRMED';
    const items = JSON.parse(challan.snapshotData);

    const result = await prisma.$transaction(async (tx) => {
      // If it was confirmed, return the stock
      if (wasConfirmed) {
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (product) {
            // Restore stock
            await tx.product.update({
              where: { id: product.id },
              data: {
                currentStock: product.currentStock + item.quantity
              }
            });

            // Log stock movement
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                quantityChanged: item.quantity,
                type: 'IN',
                reason: `Sales Challan ${challan.challanNumber} Cancellation`,
                createdById: req.user!.id
              }
            });
          }
        }
      }

      // Update status
      return await tx.challan.update({
        where: { id: challan.id },
        data: {
          status: 'CANCELLED'
        }
      });
    });

    return res.json(result);
  } catch (error: any) {
    console.error('cancelChallan error:', error);
    return res.status(500).json({ error: 'Failed to cancel challan' });
  }
};
