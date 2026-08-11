import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { RequestWithUser } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345';

export const login = async (req: RequestWithUser, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (error: any) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() }
    });

    // Generate a new token with the updated name
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, name: updatedUser.name, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error: any) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: RequestWithUser, res: Response) => {
  const { username, password, name, role } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields (username, password, name, role) are required' });
  }

  const validRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];
  const formattedRole = role.toUpperCase();
  if (!validRoles.includes(formattedRole)) {
    return res.status(400).json({ error: 'Role must be ADMIN, SALES, WAREHOUSE, or ACCOUNTS' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername }
    });

    if (existing) {
      return res.status(400).json({ error: `Username '${cleanUsername}' is already taken` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let createdUser: { id: string; username: string; name: string; role: string };

    try {
      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash,
          name: name.trim(),
          role: formattedRole
        }
      });
      createdUser = {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      };
    } catch (createErr: any) {
      console.warn('Prisma user create failed, executing standalone MongoDB raw fallback');
      await prisma.$runCommandRaw({
        insert: 'User',
        documents: [
          {
            username: cleanUsername,
            passwordHash,
            name: name.trim(),
            role: formattedRole,
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() }
          }
        ]
      });

      const fetched = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (!fetched) throw new Error('User creation raw fallback failed');
      createdUser = {
        id: fetched.id,
        username: fetched.username,
        name: fetched.name,
        role: fetched.role
      };
    }

    const token = jwt.sign(
      { id: createdUser.id, username: createdUser.username, name: createdUser.name, role: createdUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: createdUser
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
};


