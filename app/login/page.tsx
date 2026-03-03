'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[24px] shadow-sm border border-slate-100 p-10 relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4A90E2]"></div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">欢迎回来</h1>
          <p className="text-slate-400 text-sm font-medium">登录您的币安预警账户</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#FF5252]/10 text-[#FF5252] p-3 rounded-xl text-sm text-center font-bold">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">邮箱</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4A90E2] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 pl-11 text-slate-800 font-medium focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white transition-all placeholder:text-slate-300"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4A90E2] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 pl-11 text-slate-800 font-medium focus:ring-2 focus:ring-[#4A90E2]/20 focus:bg-white transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4A90E2] hover:bg-[#357ABD] text-white font-bold p-4 rounded-xl shadow-lg shadow-[#4A90E2]/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>登录 <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            还没有账号？{' '}
            <Link href="/register" className="text-[#4A90E2] font-bold hover:text-[#357ABD] transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
