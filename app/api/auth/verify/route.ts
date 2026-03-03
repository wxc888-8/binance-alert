import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (user.isVerified) {
        return NextResponse.json({ error: '用户已验证' }, { status: 400 });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return NextResponse.json({ error: '验证码错误' }, { status: 400 });
    }

    if (user.verificationExpiry && new Date() > user.verificationExpiry) {
        return NextResponse.json({ error: '验证码已过期' }, { status: 400 });
    }

    // Verify User
    await prisma.user.update({
      where: { id: user.id },
      data: { 
          isVerified: true,
          verificationCode: null,
          verificationExpiry: null
      },
    });

    // Auto Login
    const token = await signToken({ userId: user.id });
    (await cookies()).set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
