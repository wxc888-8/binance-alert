'use client';

import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  type: 'NORMAL' | 'TP' | 'SL';
  status: 'ACTIVE' | 'TRIGGERED';
}

interface TradingChartProps {
  symbol: string;
  alerts?: Alert[];
}

export const TradingChart: React.FC<TradingChartProps> = ({ symbol, alerts }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<any[]>([]); // To track active price lines
  const wsRef = useRef<WebSocket | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [interval, setInterval] = useState<string>('1m');

  const intervals = [
    { label: '1分', value: '1m' },
    { label: '5分', value: '5m' },
    { label: '15分', value: '15m' },
    { label: '1时', value: '1h' },
    { label: '4时', value: '4h' },
    { label: '1天', value: '1d' },
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#cbd5e1',
      },
      rightPriceScale: {
        borderColor: '#cbd5e1',
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#ef4444', // Red 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Effect to update Price Lines when alerts change
  useEffect(() => {
    if (!seriesRef.current || !alerts) return;

    // 1. Clear existing lines
    priceLinesRef.current.forEach(line => {
      seriesRef.current?.removePriceLine(line);
    });
    priceLinesRef.current = [];

    // 2. Add new lines for current symbol's active alerts
    alerts
      .filter(a => a.symbol === symbol && a.status === 'ACTIVE')
      .forEach(alert => {
        let color = '#3b82f6'; // Default Blue
        let title = '预警';

        if (alert.type === 'TP') {
            color = '#10b981'; // Green
            title = '止盈';
        } else if (alert.type === 'SL') {
            color = '#ef4444'; // Red
            title = '止损';
        }

        const line = seriesRef.current?.createPriceLine({
          price: alert.targetPrice,
          color: color,
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `${title}: ${alert.targetPrice}`,
        });

        if (line) {
          priceLinesRef.current.push(line);
        }
      });
  }, [alerts, symbol]);

  useEffect(() => {
    // Cleanup previous state when symbol/interval changes
    let isMounted = true;
    let ws: WebSocket | null = null;

    const fetchDataAndConnectWS = async () => {
      if (!isMounted) return;
      setLoading(true);
      if (seriesRef.current) {
        seriesRef.current.setData([]);
      }

      try {
        // 1. 获取历史K线数据 (Binance Futures API)
        // 使用 Next.js API 代理请求，解决前端跨域问题 (CORS)
        const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`);
        
        if (!isMounted) return; // Prevent setting state if unmounted

        const data: CandlestickData[] = response.data.map((d: any[]) => ({
          time: d[0] / 1000, // timestamp
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        if (seriesRef.current) {
          seriesRef.current.setData(data);
        }
        
        if (data.length > 0) {
            setCurrentPrice(data[data.length - 1].close);
        }

      } catch (error) {
        console.error("Failed to fetch history data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }

      if (!isMounted) return;

      // 2. 连接 WebSocket 更新实时数据
      const wsSymbol = symbol.toLowerCase();
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${interval}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const message = JSON.parse(event.data);
        if (message.e === 'kline') {
          const k = message.k;
          const candle: CandlestickData = {
            time: (k.t / 1000) as any,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
          };

          if (seriesRef.current) {
            seriesRef.current.update(candle);
          }
          setCurrentPrice(parseFloat(k.c));
          setLoading(false); // Ensure loading is cleared on first WS message
        }
      };

      ws.onerror = (err) => {
        console.error("WS Error", err);
        if (isMounted) setLoading(false);
      };
    };

    fetchDataAndConnectWS();

    return () => {
      isMounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [symbol, interval]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm overflow-hidden relative p-1.5 shrink-0">
                <img 
                    src={`https://assets.coincap.io/assets/icons/${symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                    alt={symbol}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/87496d50-2408-43e1-ad4c-78b47b448a6a.png';
                    }}
                />
            </div>
            <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  {symbol} 
                  <span className="text-xs font-medium px-2 py-0.5 rounded text-blue-600 bg-blue-50 border border-blue-100 shrink-0">永续</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        实时
                    </div>
                    <div className="flex bg-slate-100 rounded-md p-1 gap-1 overflow-x-auto max-w-[200px] md:max-w-none no-scrollbar">
                        {intervals.map((i) => (
                            <button
                                key={i.value}
                                onClick={() => setInterval(i.value)}
                                className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all whitespace-nowrap ${
                                    interval === i.value 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {i.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto flex justify-between md:block items-center">
            <div>
              <div className={`text-3xl font-mono font-bold tracking-tight transition-colors duration-300 ${currentPrice > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
              ${currentPrice.toFixed(2)}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">标记价格</p>
            </div>
        </div>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border border-slate-100 h-[350px] md:h-[500px]">
          {loading && (
              <div className="absolute inset-0 z-10 bg-white flex flex-col p-8 animate-pulse">
                  {/* Skeleton Header */}
                  <div className="flex justify-between items-center mb-12 opacity-50">
                      <div className="space-y-2">
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                      </div>
                      <div className="space-y-2">
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                          <div className="h-4 w-12 bg-slate-200 rounded"></div>
                      </div>
                  </div>
                  {/* Skeleton Candles */}
                  <div className="flex-1 flex items-end justify-between gap-2 px-4">
                      {[...Array(12)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-full bg-slate-100 rounded-sm" 
                            style={{ 
                                height: `${Math.random() * 40 + 20}%`,
                                opacity: 1 - (i % 2) * 0.3 
                            }}
                          ></div>
                      ))}
                  </div>
                  {/* Skeleton X Axis */}
                  <div className="h-6 w-full border-t border-slate-100 mt-4 flex justify-between pt-2">
                      <div className="h-2 w-8 bg-slate-100 rounded"></div>
                      <div className="h-2 w-8 bg-slate-100 rounded"></div>
                      <div className="h-2 w-8 bg-slate-100 rounded"></div>
                      <div className="h-2 w-8 bg-slate-100 rounded"></div>
                  </div>
              </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
