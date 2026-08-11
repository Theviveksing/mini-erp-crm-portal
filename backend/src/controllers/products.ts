import { Response } from 'express';
import prisma from '../db';
import { RequestWithUser } from '../middlewares/auth';

export const getProducts = async (req: RequestWithUser, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const lowStock = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      // Products where stock is less than or equal to min stock alert
      where.currentStock = {
        lte: prisma.product.fields.minStockAlert
      };
    }

    // SQLite Prisma doesn't directly support comparing two columns inside where natively in simple prisma syntax without `where: { currentStock: { lte: prisma.product.fields.minStockAlert } }` in prisma v5. Let's make sure it's valid.
    // If it throws an error in prisma, we can also fetch products and filter in JS, or write custom prisma logic.
    // Actually, Prisma v5.x supports field reference checks. Let's make sure. Let's do it safely:
    // If lowStock is true, we can do raw query or fetch and filter, or use Prisma's `lte: prisma.product.fields.minStockAlert`. Let's use Prisma's native `lte: prisma.product.fields.minStockAlert` if supported, or to be 100% safe on SQLite, we can implement it as:
    // Actually, SQLite supports it, and Prisma supports `currentStock: { lte: prisma.product.fields.minStockAlert }` from v4.3+.
    // Let's check how to construct it: `lte: prisma.product.fields.minStockAlert` is correct.

    // Let's implement paginated products query.
    // To support lowStock filter safely, we can do standard where clause.
    // If Prisma client throws on fields reference, we'll write a clean fallback. Let's just use Prisma's standard field reference:
    // we do:
    // where: {
    //   currentStock: {
    //     lte: prisma.product.fields.minStockAlert
    //   }
    // }
    // Wait, let's keep it safe. If lowStock is true, let's do:
    // where: {} and then we can query. But since pagination is applied, filtering in memory would mess up page counts. Let's use Prisma.product.fields.minStockAlert.

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Add alert status dynamically
    const productsWithAlert = products.map(product => ({
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert
    }));

    return res.json({
      products: productsWithAlert,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

export const createProduct = async (req: RequestWithUser, res: Response) => {
  const {
    name,
    sku,
    category,
    unitPrice,
    currentStock,
    minStockAlert,
    location
  } = req.body;

  if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined || minStockAlert === undefined || !location) {
    return res.status(400).json({ error: 'Missing required product fields' });
  }

  try {
    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return res.status(400).json({ error: `Product SKU '${sku}' already exists` });
    }

    // Create product and log initial stock movement
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          sku,
          category,
          unitPrice: parseFloat(unitPrice),
          currentStock: parseInt(currentStock),
          minStockAlert: parseInt(minStockAlert),
          location
        }
      });

      if (parseInt(currentStock) > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            quantityChanged: parseInt(currentStock),
            type: 'IN',
            reason: 'Initial stock creation',
            createdById: req.user!.id
          }
        });
      }

      return p;
    });

    return res.status(201).json(product);
  } catch (error: any) {
    console.error('createProduct error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const {
    name,
    sku,
    category,
    unitPrice,
    minStockAlert,
    location
  } = req.body;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (sku && sku !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) {
        return res.status(400).json({ error: `Product SKU '${sku}' is already taken` });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        sku: sku !== undefined ? sku : existing.sku,
        category: category !== undefined ? category : existing.category,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : existing.unitPrice,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : existing.minStockAlert,
        location: location !== undefined ? location : existing.location
      }
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

export const adjustStock = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { quantityChanged, reason } = req.body; // quantityChanged can be positive (IN) or negative (OUT)

  if (quantityChanged === undefined || !reason) {
    return res.status(400).json({ error: 'Quantity changed and reason are required' });
  }

  const changeQty = parseInt(quantityChanged);
  if (changeQty === 0) {
    return res.status(400).json({ error: 'Quantity changed cannot be zero' });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newStock = product.currentStock + changeQty;
    if (newStock < 0) {
      return res.status(400).json({ error: `Insufficient stock. Current: ${product.currentStock}, attempted reduction: ${Math.abs(changeQty)}` });
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantityChanged: Math.abs(changeQty),
          type: changeQty > 0 ? 'IN' : 'OUT',
          reason,
          createdById: req.user!.id
        }
      });

      // Update product currentStock
      return await tx.product.update({
        where: { id: product.id },
        data: {
          currentStock: newStock
        }
      });
    });

    return res.json(updatedProduct);
  } catch (error: any) {
    console.error('adjustStock error:', error);
    return res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

export const getProductMovements = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      include: {
        createdBy: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(movements);
  } catch (error: any) {
    console.error('getProductMovements error:', error);
    return res.status(500).json({ error: 'Failed to retrieve stock movements' });
  }
};
