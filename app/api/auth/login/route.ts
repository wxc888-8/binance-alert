import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: '账号已被禁用，请联系管理员' }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 400 });
    }

    const token = await signToken({ userId: user.id });
    (await cookies()).set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
