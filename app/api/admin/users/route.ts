import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isMember: true,
        createdAt: true,
        _count: {
            select: { alerts: true }
        }
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body; 
    // action: 'toggleStatus', 'toggleMembership'

    if (!userId || !action) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let updateData = {};
    if (action === 'toggleStatus') {
        updateData = { isActive: !user.isActive };
    } else if (action === 'toggleMembership') {
        updateData = { isMember: !user.isMember };
    } else if (action === 'setAdmin') {
        updateData = { role: 'ADMIN' };
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { id: true, email: true, isActive: true, isMember: true, role: true }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
