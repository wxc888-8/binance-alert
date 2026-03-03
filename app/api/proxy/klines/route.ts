import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '500';

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // 服务器在海外，直接请求币安接口
    const response = await axios.get(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch from Binance' },
      { status: 500 }
    );
  }
}
