'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Shield, UserCheck, UserX, Loader2, ArrowLeft, CheckCircle, XCircle, User } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  isMember: boolean;
  createdAt: string;
  _count: {
    alerts: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data.users);
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (userId: string, action: string) => {
    try {
      await axios.patch('/api/admin/users', { userId, action });
      fetchUsers(); // Refresh list
    } catch (error) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 p-8 font-sans">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => router.push('/')}
                className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-[#F5F7FA] transition-colors shadow-sm text-slate-500 hover:text-[#4A90E2]"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">用户管理后台</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">管理系统用户及权限</p>
            </div>
          </div>
          <div className="bg-[#4A90E2]/10 text-[#4A90E2] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-[#4A90E2]/20">
            <Shield className="w-5 h-5" />
            管理员模式
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F5F7FA]/50 border-b border-[#F5F7FA] text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-6 font-bold pl-8">用户邮箱</th>
                <th className="p-6 font-bold">注册时间</th>
                <th className="p-6 font-bold">预警数量</th>
                <th className="p-6 font-bold">会员状态</th>
                <th className="p-6 font-bold">账号状态</th>
                <th className="p-6 font-bold text-right pr-8">操作管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F7FA]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#F5F7FA]/50 transition-colors group">
                  <td className="p-6 pl-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F5F7FA] flex items-center justify-center text-slate-400 group-hover:bg-[#4A90E2]/10 group-hover:text-[#4A90E2] transition-colors">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-slate-700">{user.email}</div>
                            {user.role === 'ADMIN' && <span className="text-[10px] bg-[#4A90E2] text-white px-1.5 py-0.5 rounded font-bold mt-1 inline-block">ADMIN</span>}
                        </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-700">
                    {user._count.alerts}
                  </td>
                  <td className="p-6">
                    {user.isMember ? (
                      <span className="inline-flex items-center gap-1.5 bg-[#38D9A9]/10 text-[#38D9A9] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#38D9A9]/20">
                        <CheckCircle className="w-3.5 h-3.5" /> PRO会员
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                        普通用户
                      </span>
                    )}
                  </td>
                  <td className="p-6">
                    {user.isActive ? (
                      <span className="text-[#38D9A9] font-bold text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38D9A9]"></span> 正常
                      </span>
                    ) : (
                      <span className="text-[#FF5252] font-bold text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252]"></span> 已封禁
                      </span>
                    )}
                  </td>
                  <td className="p-6 pr-8 text-right space-x-2">
                    {user.role !== 'ADMIN' && (
                        <>
                            <button
                                onClick={() => handleAction(user.id, 'toggleMembership')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                    user.isMember 
                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                    : 'bg-[#38D9A9] text-white hover:bg-[#2EBC91] shadow-lg shadow-[#38D9A9]/20'
                                }`}
                            >
                                {user.isMember ? '取消会员' : '开通会员'}
                            </button>
                            <button
                                onClick={() => handleAction(user.id, 'toggleStatus')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                    user.isActive 
                                    ? 'bg-[#FF5252]/10 text-[#FF5252] hover:bg-[#FF5252]/20 border border-[#FF5252]/20' 
                                    : 'bg-[#38D9A9]/10 text-[#38D9A9] hover:bg-[#38D9A9]/20 border border-[#38D9A9]/20'
                                }`}
                            >
                                {user.isActive ? '封禁' : '解封'}
                            </button>
                            <button
                                onClick={() => {
                                    if(confirm('确定要将该用户设为管理员吗？')) handleAction(user.id, 'setAdmin');
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-95"
                            >
                                设为管理
                            </button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
