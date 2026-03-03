# Binance Futures Alert System

A real-time crypto alert system with TradingView charts, supporting Telegram, Bark, and Email notifications.

## Features
- **Real-time Charts**: Powered by TradingView Lightweight Charts and Binance WebSockets.
- **Alert Strategies**:
  - **Normal**: Trigger when price crosses a target.
  - **TP/SL**: Automatically set Stop Profit and Stop Loss alerts.
- **Notifications**: Telegram, Bark (iOS), Email.
- **Modern UI**: Dark mode, responsive design.

## Prerequisites
- Node.js (v18+)
- SQLite (included)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma migrate dev --name init
   ```

## Running the Application

You need to run two processes:

1. **Frontend & API** (Terminal 1)
   ```bash
   npm run dev
   ```
   Access the dashboard at [http://localhost:3000](http://localhost:3000).

2. **Alert Engine** (Terminal 2)
   This background worker monitors prices and triggers alerts.
   ```bash
   npm run worker
   ```

## Configuration
The database is a local SQLite file (`dev.db`).
Notifications require valid keys/tokens which you can input in the UI or hardcode in `lib/notifier.ts` / `.env`.

## Usage
1. Enter a Symbol (e.g., BTCUSDT).
2. Choose "Set Target" for a single price alert.
3. Or use "Set TP/SL Strategy" to automatically create both Take Profit and Stop Loss alerts.
4. Alerts will trigger when the price condition is met.
