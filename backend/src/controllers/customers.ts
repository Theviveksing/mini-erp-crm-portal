import { Response } from 'express';
import prisma from '../db';
import { RequestWithUser } from '../middlewares/auth';

export const getCustomers = async (req: RequestWithUser, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.q as string) || '';
    const status = (req.query.status as string) || '';
    const type = (req.query.type as string) || '';

    const skip = (page - 1) * limit;

    // Build filters
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.customerType = type;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return res.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('getCustomers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve customers' });
  }
};

export const getCustomerById = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error: any) {
    console.error('getCustomerById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve customer details' });
  }
};

export const createCustomer = async (req: RequestWithUser, res: Response) => {
  const {
    name,
    mobile,
    email,
    businessName,
    gstNumber,
    customerType,
    address,
    status,
    followUpDate,
    notes
  } = req.body;

  // Simple input validation
  if (!name || !mobile || !email || !businessName || !customerType || !status || !address) {
    return res.status(400).json({ error: 'Missing required customer fields' });
  }

  const validTypes = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'];
  const validStatus = ['LEAD', 'ACTIVE', 'INACTIVE'];

  if (!validTypes.includes(customerType)) {
    return res.status(400).json({ error: 'Invalid customer type' });
  }

  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber: gstNumber || null,
        customerType,
        address,
        status,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes || null
      }
    });

    // If initial notes are provided, create the first follow-up note
    if (notes) {
      await prisma.followUpNote.create({
        data: {
          customerId: newCustomer.id,
          note: `Customer created. Initial note: ${notes}`,
          createdBy: req.user?.name || 'System'
        }
      });
    }

    return res.status(201).json(newCustomer);
  } catch (error: any) {
    console.error('createCustomer error:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const {
    name,
    mobile,
    email,
    businessName,
    gstNumber,
    customerType,
    address,
    status,
    followUpDate,
    notes
  } = req.body;

  try {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        mobile: mobile !== undefined ? mobile : existing.mobile,
        email: email !== undefined ? email : existing.email,
        businessName: businessName !== undefined ? businessName : existing.businessName,
        gstNumber: gstNumber !== undefined ? gstNumber : existing.gstNumber,
        customerType: customerType !== undefined ? customerType : existing.customerType,
        address: address !== undefined ? address : existing.address,
        status: status !== undefined ? status : existing.status,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : existing.followUpDate,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    return res.json(updatedCustomer);
  } catch (error: any) {
    console.error('updateCustomer error:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const addFollowUpNote = async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const newNote = await prisma.followUpNote.create({
      data: {
        customerId: id,
        note,
        createdBy: req.user?.name || 'System'
      }
    });

    // Also update customer's last notes & update time
    await prisma.customer.update({
      where: { id },
      data: {
        notes: note
      }
    });

    return res.status(201).json(newNote);
  } catch (error: any) {
    console.error('addFollowUpNote error:', error);
    return res.status(500).json({ error: 'Failed to add follow-up note' });
  }
};
