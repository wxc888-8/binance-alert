import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/notifier';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: '用户已存在' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationCode,
        verificationExpiry,
        isVerified: false,
        role: email === 'wxc888_8@qq.com' ? 'ADMIN' : 'USER',
        isMember: email === 'wxc888_8@qq.com' ? true : false,
      },
    });

    // Send Verification Email
    await sendEmail(
      email,
      '验证您的币安预警账号',
      `您的验证码是：${verificationCode}\n该验证码10分钟内有效。\n如非本人操作，请忽略此邮件。`
    );

    return NextResponse.json({ success: true, message: '注册成功，请查收邮件验证码' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

