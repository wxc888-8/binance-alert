'use client';

import { useState, useEffect } from 'react';
import { TradingChart } from '@/components/TradingChart';
import { Bell, ArrowUp, ArrowDown, Trash2, Zap, Shield, Mail, Send, Activity, BarChart2, Clock, LogOut, Settings, PlayCircle, StopCircle } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  type: 'NORMAL' | 'TP' | 'SL';
  status: 'ACTIVE' | 'TRIGGERED';
  alertBuffer: number;
  notificationType: 'ONCE' | 'CONTINUOUS';
  note?: string;
}

interface User {
  id: string;
  email: string;
  notificationEmail?: string;
  telegramId?: string;
  telegramToken?: string;
  barkKey?: string;
  role: 'USER' | 'ADMIN';
  isMember: boolean;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [targetPrice, setTargetPrice] = useState('');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  
  // Settings
  const [alertBuffer, setAlertBuffer] = useState('0.05');
  const [notificationType, setNotificationType] = useState<'ONCE' | 'CONTINUOUS'>('ONCE');
  const [note, setNote] = useState('');
  
  // Contacts
  const [telegramId, setTelegramId] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [barkKey, setBarkKey] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'normal' | 'strategy'>('normal');
  const [currentTime, setCurrentTime] = useState('');

  // Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
        setTelegramId(res.data.user.telegramId || '');
        setTelegramToken(res.data.user.telegramToken || '');
        setBarkKey(res.data.user.barkKey || '');
        // Only set notificationEmail if explicitly set, otherwise leave empty (use placeholder)
        setNotificationEmail(res.data.user.notificationEmail || '');
      } catch (e) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts');
      setAlerts(res.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    
    // Clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour12: false }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [user]);

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    router.push('/login');
  };

  const handleCreateAlert = async (type: 'NORMAL' | 'TP_SL') => {
    if (!symbol) return;
    if (user && !user.isMember) {
        alert('您还不是会员，请联系管理员开通权限');
        return;
    }

    setLoading(true);
    
    // Auto-adjust TP/SL trigger price logic is handled by worker now based on buffer
    let finalTpPrice = tpPrice ? parseFloat(tpPrice) : undefined;
    let finalSlPrice = slPrice ? parseFloat(slPrice) : undefined;

    try {
      await axios.post('/api/alerts', {
        symbol,
        type,
        targetPrice: type === 'NORMAL' ? parseFloat(targetPrice) : undefined,
        tpPrice: finalTpPrice,
        slPrice: finalSlPrice,
        alertBuffer,
        notificationType,
        telegramId,
        telegramToken,
        barkKey,
        notificationEmail,
        note,
      });
      fetchAlerts();
      setNote('');
      if (type === 'NORMAL') setTargetPrice('');
      if (type === 'TP_SL') {
        setTpPrice('');
        setSlPrice('');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '创建预警失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('确定要删除这条预警吗？')) return;

    try {
      await axios.delete(`/api/alerts/${id}`);
      fetchAlerts();
    } catch (error: any) {
      alert(error.response?.data?.error || '删除失败，请检查网络');
    }
  };

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 pb-20 font-sans selection:bg-[#4A90E2]/20 selection:text-[#4A90E2] overflow-x-hidden relative">
      
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm/50">
        <div className="container mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="bg-[#4A90E2] p-2 rounded-xl text-white shadow-lg shadow-[#4A90E2]/20 transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              预警<span className="font-light text-[#4A90E2]">中心</span>
            </h1>
          </div>

          {/* 导航菜单区域 */}
          <nav className="hidden md:flex items-center gap-8 mr-auto ml-12">
            <a href="#" className="text-[#4A90E2] font-bold text-sm border-b-2 border-[#4A90E2] pb-6 pt-6">预警中心</a>
            {/* <a href="#" className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors pb-6 pt-6 border-b-2 border-transparent hover:border-slate-200">用户信息</a>
            <a href="#" className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors pb-6 pt-6 border-b-2 border-transparent hover:border-slate-200">设置</a> */}
          </nav>

          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F7FA] border border-slate-100">
                <Clock className="w-4 h-4 text-[#4A90E2]" />
                <span className="font-mono text-slate-600 font-bold">{currentTime}</span>
            </div>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
              <div className="flex flex-col items-end mr-2">
                  <span className="text-slate-800 font-bold text-xs hidden md:inline">{user.email}</span>
                  <div className="flex gap-1.5 mt-0.5">
                    {user.role === 'ADMIN' && (
                        <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                            <Shield className="w-3 h-3" /> 管理员
                        </span>
                    )}
                    {user.isMember ? (
                        <span className="text-[10px] bg-[#38D9A9]/10 text-[#38D9A9] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-[#38D9A9]/20">
                            专业版
                        </span>
                    ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">
                            免费版
                        </span>
                    )}
                  </div>
              </div>
              
              {user.role === 'ADMIN' && (
                <button 
                    onClick={() => router.push('/admin')}
                    className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-[#4A90E2] transition-colors border border-transparent hover:border-slate-100"
                    title="管理后台"
                >
                    <Settings className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-[#FF5252]/10 rounded-xl text-slate-400 hover:text-[#FF5252] transition-colors border border-transparent hover:border-[#FF5252]/20"
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-8">
        
        {/* 概览卡片区域 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">总预警数</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-2">{alerts.length}</h3>
                    </div>
                    <div className="bg-[#4A90E2]/10 p-2.5 rounded-xl text-[#4A90E2] group-hover:bg-[#4A90E2] group-hover:text-white transition-colors">
                        <Activity className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="text-[#38D9A9] flex items-center gap-1"><ArrowUp className="w-3 h-3" /> +2</span>
                    较昨日
                </div>
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">运行中 (Active)</p>
                        <h3 className="text-3xl font-bold text-[#38D9A9] mt-2">{alerts.filter(a => a.status === 'ACTIVE').length}</h3>
                    </div>
                    <div className="bg-[#38D9A9]/10 p-2.5 rounded-xl text-[#38D9A9] group-hover:bg-[#38D9A9] group-hover:text-white transition-colors">
                        <PlayCircle className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#38D9A9] h-full rounded-full" style={{ width: `${(alerts.filter(a => a.status === 'ACTIVE').length / (alerts.length || 1)) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">已触发 (Triggered)</p>
                        <h3 className="text-3xl font-bold text-[#FFB84D] mt-2">{alerts.filter(a => a.status === 'TRIGGERED').length}</h3>
                    </div>
                    <div className="bg-[#FFB84D]/10 p-2.5 rounded-xl text-[#FFB84D] group-hover:bg-[#FFB84D] group-hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#FFB84D] h-full rounded-full" style={{ width: `${(alerts.filter(a => a.status === 'TRIGGERED').length / (alerts.length || 1)) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">高风险策略</p>
                        <h3 className="text-3xl font-bold text-[#FF5252] mt-2">{alerts.filter(a => a.type !== 'NORMAL').length}</h3>
                    </div>
                    <div className="bg-[#FF5252]/10 p-2.5 rounded-xl text-[#FF5252] group-hover:bg-[#FF5252] group-hover:text-white transition-colors">
                        <Shield className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span className="bg-[#FF5252]/10 text-[#FF5252] px-2 py-0.5 rounded">TP/SL</span>
                    策略占比 {(alerts.filter(a => a.type !== 'NORMAL').length / (alerts.length || 1) * 100).toFixed(0)}%
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* 左侧：K线图 & 列表 */}
          <div className="xl:col-span-8 space-y-8">
            <div className="bg-white rounded-[24px] p-1 shadow-sm border border-slate-100">
                {/* KEY PROP ADDED HERE TO FIX RACE CONDITION */}
                <TradingChart key={symbol} symbol={symbol} alerts={alerts} />
            </div>
            
            {/* 活跃预警列表 */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-3 text-slate-800">
                  <div className="bg-[#4A90E2]/10 p-2 rounded-xl text-[#4A90E2]">
                    <Bell className="w-5 h-5" />
                  </div>
                  监控任务列表
                </h3>
                <div className="flex gap-2">
                    <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        全部 ({alerts.length})
                    </span>
                    <span className="text-xs font-bold text-[#38D9A9] px-3 py-1.5 rounded-lg bg-[#38D9A9]/10 border border-[#38D9A9]/20">
                        运行中 ({alerts.filter(a => a.status === 'ACTIVE').length})
                    </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F7FA]/50 text-slate-400 border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-5 font-bold pl-8">币种</th>
                      <th className="p-5 font-bold">类型</th>
                      <th className="p-5 font-bold">条件</th>
                      <th className="p-5 font-bold">目标价</th>
                        <th className="p-5 font-bold hidden md:table-cell">备注</th>
                        <th className="p-5 font-bold">配置</th>
                      <th className="p-5 font-bold">状态</th>
                      <th className="p-5 font-bold text-right pr-8">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F7FA]">
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-4">
                            <div className="bg-[#F5F7FA] p-6 rounded-full">
                                <Bell className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">暂无监控任务</p>
                            <p className="text-xs text-slate-400">请在右侧创建新的预警</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      alerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-[#F5F7FA] transition-colors group">
                          <td className="p-5 pl-8 font-bold text-slate-700">{alert.symbol}</td>
                          <td className="p-5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              alert.type === 'TP' ? 'bg-[#38D9A9]/10 text-[#38D9A9] border-[#38D9A9]/20' :
                              alert.type === 'SL' ? 'bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20' :
                              'bg-[#4A90E2]/10 text-[#4A90E2] border-[#4A90E2]/20'
                            }`}>
                              {alert.type === 'NORMAL' ? '价格' : alert.type === 'TP' ? '止盈' : '止损'}
                            </span>
                          </td>
                          <td className="p-5 flex items-center gap-1">
                            {alert.condition === 'ABOVE' ? 
                              <span className="flex items-center text-[#38D9A9] font-bold text-xs bg-[#38D9A9]/5 px-2 py-1 rounded"><ArrowUp className="w-3 h-3 mr-1" /> 高于</span> : 
                              <span className="flex items-center text-[#FF5252] font-bold text-xs bg-[#FF5252]/5 px-2 py-1 rounded"><ArrowDown className="w-3 h-3 mr-1" /> 低于</span>
                            }
                          </td>
                          <td className="p-5 font-mono text-base font-bold text-slate-700">${alert.targetPrice}</td>
                          <td className="p-5 hidden md:table-cell">
                            {alert.note ? (
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded max-w-[150px] truncate block" title={alert.note}>
                                {alert.note}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                        <td className="p-5 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5 font-medium"><Activity className="w-3 h-3 text-[#FFB84D]" /> 缓冲: {alert.alertBuffer}%</div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                {alert.notificationType === 'ONCE' ? <StopCircle className="w-3 h-3 text-slate-400" /> : <PlayCircle className="w-3 h-3 text-[#38D9A9]" />}
                                {alert.notificationType === 'ONCE' ? '单次' : '循环'}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full w-fit ${
                              alert.status === 'ACTIVE' ? 'bg-[#38D9A9]/10 text-[#38D9A9]' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                alert.status === 'ACTIVE' ? 'bg-[#38D9A9] animate-pulse' : 'bg-slate-400'
                              }`}></span>
                              {alert.status === 'ACTIVE' ? '运行中' : '已触发'}
                            </span>
                          </td>
                          <td className="p-5 pr-8 text-right">
                            <button 
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2.5 hover:bg-[#FF5252]/10 text-slate-400 hover:text-[#FF5252] rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                              title="删除预警"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="xl:col-span-4 space-y-8">
            
            {/* 1. 交易对选择 */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
              <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="bg-[#4A90E2]/10 p-1.5 rounded-lg text-[#4A90E2] group-hover:scale-110 transition-transform">
                    <BarChart2 className="w-4 h-4" />
                </div>
                监控币种
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 pl-5 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all placeholder-slate-400"
                  placeholder="如 BTCUSDT"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4A90E2] bg-white border border-[#4A90E2]/20 px-2 py-1 rounded-lg shadow-sm">
                  永续
                </div>
              </div>
            </div>

            {/* 2. 全局设置 (缓冲 & 频率) */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                <h3 className="font-bold text-slate-700 mb-5 flex items-center gap-2 text-sm">
                    <div className="bg-[#FFB84D]/10 p-1.5 rounded-lg text-[#FFB84D] group-hover:rotate-12 transition-transform">
                        <Settings className="w-4 h-4" />
                    </div>
                    全局设置
                </h3>
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">触发缓冲</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={alertBuffer}
                                onChange={(e) => setAlertBuffer(e.target.value)}
                                className="w-full bg-[#F5F7FA] border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all text-slate-800"
                                step="0.01"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">推送频率</label>
                        <div className="flex bg-[#F5F7FA] p-1 rounded-xl">
                            <button
                                onClick={() => setNotificationType('ONCE')}
                                className={`flex-1 text-xs py-2 rounded-lg transition-all flex justify-center items-center gap-1 font-bold ${notificationType === 'ONCE' ? 'bg-white shadow-sm text-[#4A90E2]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <StopCircle className="w-3 h-3" /> 单次
                            </button>
                            <button
                                onClick={() => setNotificationType('CONTINUOUS')}
                                className={`flex-1 text-xs py-2 rounded-lg transition-all flex justify-center items-center gap-1 font-bold ${notificationType === 'CONTINUOUS' ? 'bg-white shadow-sm text-[#4A90E2]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <PlayCircle className="w-3 h-3" /> 循环
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 预警设置 */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="flex border-b border-[#F5F7FA] p-1.5 gap-1 m-1.5 bg-[#F5F7FA] rounded-xl">
                <button
                  onClick={() => setActiveTab('normal')}
                  className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 rounded-lg ${
                    activeTab === 'normal' ? 'bg-white text-[#4A90E2] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  价格预警
                </button>
                <button
                  onClick={() => setActiveTab('strategy')}
                  className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 rounded-lg ${
                    activeTab === 'strategy' ? 'bg-white text-[#FFB84D] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  止盈止损
                </button>
              </div>

              <div className="p-6 pt-6">
                {activeTab === 'normal' ? (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">目标价格</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                <input
                                type="number"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 pl-8 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all"
                                placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-bold text-slate-400 mb-2 ml-1">备注 (可选)</label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                placeholder="策略说明"
                            />
                        </div>
                    </div>
                    <button
                      onClick={() => handleCreateAlert('NORMAL')}
                      disabled={loading || !targetPrice}
                      className="w-full bg-[#4A90E2] hover:bg-[#357ABD] text-white font-bold p-4 rounded-xl shadow-lg shadow-[#4A90E2]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      创建预警
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                        {/* 止盈止损输入 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-[#38D9A9] mb-2 flex items-center gap-1 ml-1">
                                    <ArrowUp className="w-4 h-4" /> 止盈 (TP)
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#38D9A9]/50 font-medium">$</span>
                                    <input
                                    type="number"
                                    value={tpPrice}
                                    onChange={(e) => setTpPrice(e.target.value)}
                                    className="w-full bg-[#38D9A9]/5 border border-transparent hover:border-[#38D9A9]/30 rounded-xl p-4 pl-8 text-slate-800 font-mono font-bold focus:border-[#38D9A9] focus:bg-white outline-none transition-all"
                                    placeholder="高于当前"
                                    />
                                    {tpPrice && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#38D9A9] bg-white px-2 py-1 rounded shadow-sm font-mono border border-[#38D9A9]/20">
                                            触发: {(parseFloat(tpPrice) * (1 - parseFloat(alertBuffer)/100)).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#FF5252] mb-2 flex items-center gap-1 ml-1">
                                    <ArrowDown className="w-4 h-4" /> 止损 (SL)
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF5252]/50 font-medium">$</span>
                                    <input
                                    type="number"
                                    value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                    className="w-full bg-[#FF5252]/5 border border-transparent hover:border-[#FF5252]/30 rounded-xl p-4 pl-8 text-slate-800 font-mono font-bold focus:border-[#FF5252] focus:bg-white outline-none transition-all"
                                    placeholder="低于当前"
                                    />
                                    {slPrice && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#FF5252] bg-white px-2 py-1 rounded shadow-sm font-mono border border-[#FF5252]/20">
                                            触发: {(parseFloat(slPrice) * (1 + parseFloat(alertBuffer)/100)).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 备注输入 */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2 ml-1">策略备注 (可选)</label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-[#FFB84D]/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                placeholder="例如：突破前高做多，止损放在前低"
                            />
                        </div>

                        <button
                      onClick={() => handleCreateAlert('TP_SL')}
                      disabled={loading || (!tpPrice && !slPrice)}
                      className="w-full bg-[#FFB84D] hover:bg-[#F5A623] text-white font-bold p-4 rounded-xl shadow-lg shadow-[#FFB84D]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      <Shield className="w-5 h-5" />
                      部署策略
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. 通知设置 */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-700 mb-5 flex items-center gap-2">
                <div className="bg-[#4A90E2]/10 p-1.5 rounded-lg text-[#4A90E2] group-hover:rotate-12 transition-transform">
                    <Send className="w-4 h-4" />
                </div>
                通知渠道配置
              </h3>
              <div className="space-y-4">
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Send className="h-4 w-4 text-slate-400 group-focus-within/input:text-[#4A90E2] transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Telegram Chat ID"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="w-full bg-[#F5F7FA] border-none rounded-xl p-3.5 pl-10 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Settings className="h-4 w-4 text-slate-400 group-focus-within/input:text-[#4A90E2] transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Telegram Bot Token (自定义机器人, 选填)"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className="w-full bg-[#F5F7FA] border-none rounded-xl p-3.5 pl-10 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all"
                  />
                </div>
                
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Bell className="h-4 w-4 text-slate-400 group-focus-within/input:text-[#FFB84D] transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Bark Key (iOS)"
                    value={barkKey}
                    onChange={(e) => setBarkKey(e.target.value)}
                    className="w-full bg-[#F5F7FA] border-none rounded-xl p-3.5 pl-10 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#FFB84D]/20 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400 group-focus-within/input:text-[#4A90E2] transition-colors" />
                  </div>
                  <input
                    type="email"
                    placeholder="自定义邮箱 (选填)"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full bg-[#F5F7FA] border-none rounded-xl p-3.5 pl-10 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
