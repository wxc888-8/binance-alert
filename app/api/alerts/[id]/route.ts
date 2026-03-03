import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const alert = await prisma.alert.findUnique({
      where: { id }
    });

    if (!alert) {
        return NextResponse.json({ error: '预警不存在' }, { status: 404 });
    }

    if (alert.userId !== session.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    await prisma.alert.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
