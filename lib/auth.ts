import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-it';

export async function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  const decoded = await verifyToken(token);
  if (!decoded?.userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { 
      id: true, 
      email: true, 
      notificationEmail: true,
      telegramId: true, 
      telegramToken: true,
      barkKey: true,
      role: true,
      isActive: true,
      isMember: true,
      isVerified: true
    }
  });
  
  if (user && !user.isActive) return null;
  
  return user;
}
