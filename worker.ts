import WebSocket from 'ws';
import { PrismaClient } from '@prisma/client';
import { sendTelegram, sendBark, sendEmail } from './lib/notifier';

const prisma = new PrismaClient();

// In-memory cache for active alerts
let activeAlerts: any[] = [];

// Fetch alerts periodically to sync with DB changes
async function refreshAlerts() {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });
    activeAlerts = alerts;
    console.log(`[Worker] Loaded ${activeAlerts.length} active alerts.`);
  } catch (error) {
    console.error('[Worker] Error refreshing alerts:', error);
  }
}

// Initial load
refreshAlerts();
setInterval(refreshAlerts, 5000); // Check for new alerts every 5 seconds

// Connect to Binance Futures WebSocket
const wsUrl = 'wss://fstream.binance.com/ws/!miniTicker@arr';
let ws: WebSocket;

function connect() {
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('[Worker] Connected to Binance Futures WebSocket');
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const tickers = JSON.parse(data.toString());
      if (Array.isArray(tickers)) {
        tickers.forEach((ticker: any) => {
          const symbol = ticker.s;
          const price = parseFloat(ticker.c);
          checkPrice(symbol, price);
        });
      }
    } catch (error) {
      console.error('[Worker] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Worker] WebSocket closed. Reconnecting...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('[Worker] WebSocket error:', err);
    ws.close();
  });
}

async function checkPrice(symbol: string, currentPrice: number) {
  // Filter relevant alerts from memory
  const relevantAlerts = activeAlerts.filter((a) => a.symbol === symbol);

  for (const alert of relevantAlerts) {
    // Check if user is active and member
    if (!alert.user.isActive || !alert.user.isMember) {
        continue;
    }

    let triggered = false;
    
    // Calculate Trigger Price with Buffer
    // If buffer is 0.05%, and target is 100.
    // If Condition is ABOVE (Long TP), trigger at 100 * (1 - 0.0005) = 99.95
    // If Condition is BELOW (Long SL), trigger at 100 * (1 + 0.0005) = 100.05
    // Note: Buffer is percentage, e.g. 0.05
    
    const bufferMultiplier = (alert.alertBuffer || 0) / 100;
    let effectiveTargetPrice = alert.targetPrice;

    if (alert.condition === 'ABOVE') {
       // Want to trigger slightly before hitting target (from below)
       effectiveTargetPrice = alert.targetPrice * (1 - bufferMultiplier);
       if (currentPrice >= effectiveTargetPrice) triggered = true;
    } else if (alert.condition === 'BELOW') {
       // Want to trigger slightly before hitting target (from above)
       effectiveTargetPrice = alert.targetPrice * (1 + bufferMultiplier);
       if (currentPrice <= effectiveTargetPrice) triggered = true;
    }

    if (triggered) {
      // Check throttle for CONTINUOUS alerts
      if (alert.notificationType === 'CONTINUOUS') {
        const lastNotified = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt).getTime() : 0;
        const now = Date.now();
        // Throttle to 30 seconds
        if (now - lastNotified < 30000) {
          continue; // Skip if notified recently
        }
      }

      console.log(`[Worker] TRIGGER: ${alert.symbol} ${alert.type} at ${currentPrice} (Target: ${alert.targetPrice}, Eff: ${effectiveTargetPrice})`);
      
      try {
        if (alert.notificationType === 'ONCE') {
             // 1. Mark as TRIGGERED in DB immediately
            await prisma.alert.update({
                where: { id: alert.id },
                data: { status: 'TRIGGERED' },
            });
            // Remove from local cache immediately
            activeAlerts = activeAlerts.filter((a) => a.id !== alert.id);
        } else {
             // 2. Update lastNotifiedAt for CONTINUOUS
             await prisma.alert.update({
                where: { id: alert.id },
                data: { lastNotifiedAt: new Date() },
            });
            // Update local cache manually to avoid waiting for refresh
            alert.lastNotifiedAt = new Date();
        }

        // 3. Send Notifications
        const typeMap: Record<string, string> = {
            'NORMAL': '价格预警',
            'TP': '止盈触发',
            'SL': '止损触发'
        };
        const typeCN = typeMap[alert.type] || '预警';
        
        const message = `🚨 ${typeCN}: ${alert.symbol}\n当前价格: ${currentPrice}\n目标价格: ${alert.targetPrice}\n(触发价: ${effectiveTargetPrice.toFixed(4)}, 缓冲: ${alert.alertBuffer}%)`;
        
        if (alert.user.telegramId) {
          sendTelegram(alert.user.telegramId, message, alert.user.telegramToken);
        }
        if (alert.user.barkKey) {
          sendBark(alert.user.barkKey, '加密货币预警', message);
        }
        
        // Use notificationEmail if set, otherwise fallback to login email
        const targetEmail = alert.user.notificationEmail || alert.user.email;
        if (targetEmail) {
          sendEmail(targetEmail, `预警触发: ${alert.symbol}`, message);
        }
      } catch (dbError) {
        console.error('[Worker] DB Error updating alert:', dbError);
      }
    }
  }
}

connect();
