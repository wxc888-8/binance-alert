import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Membership
    if (!session.isMember) {
      return NextResponse.json({ error: 'Membership Required' }, { status: 403 });
    }

    const body = await req.json();
    const { symbol, type, targetPrice, tpPrice, slPrice, alertBuffer, notificationType, telegramId, telegramToken, barkKey, notificationEmail } = body;

    // Update user contact info
    await prisma.user.update({
      where: { id: session.id },
      data: { telegramId, telegramToken, barkKey, notificationEmail },
    });

    // Fetch Current Price
    const priceRes = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
    const currentPrice = parseFloat(priceRes.data.price);

    const alertsToCreate = [];
    const buffer = alertBuffer ? parseFloat(alertBuffer) : 0.05; // Default 0.05%

    if (type === 'TP_SL') {
      if (tpPrice) {
        alertsToCreate.push({
          userId: session.id,
          symbol,
          targetPrice: parseFloat(tpPrice),
          condition: parseFloat(tpPrice) > currentPrice ? 'ABOVE' : 'BELOW',
          type: 'TP',
          status: 'ACTIVE',
          alertBuffer: buffer,
          notificationType: notificationType || 'ONCE',
        });
      }
      if (slPrice) {
        alertsToCreate.push({
          userId: session.id,
          symbol,
          targetPrice: parseFloat(slPrice),
          condition: parseFloat(slPrice) > currentPrice ? 'ABOVE' : 'BELOW',
          type: 'SL',
          status: 'ACTIVE',
          alertBuffer: buffer,
          notificationType: notificationType || 'ONCE',
        });
      }
    } else {
      alertsToCreate.push({
        userId: session.id,
        symbol,
        targetPrice: parseFloat(targetPrice),
        condition: parseFloat(targetPrice) > currentPrice ? 'ABOVE' : 'BELOW',
        type: 'NORMAL',
        status: 'ACTIVE',
        alertBuffer: buffer,
        notificationType: notificationType || 'ONCE',
      });
    }

    await prisma.alert.createMany({
      data: alertsToCreate,
    });

    return NextResponse.json({ success: true, count: alertsToCreate.length });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: { 
        userId: session.id,
        status: 'ACTIVE' 
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
