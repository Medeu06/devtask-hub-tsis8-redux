import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      alert(`Ошибка при выходе: ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto glass-card p-5 sm:p-6 rounded-xl space-y-5 my-6 sm:my-8 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Protected Page 🔒
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-white mt-1">Профиль пользователя</h1>
        </div>
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-lg border border-red-800/60 transition-all"
        >
          Выйти из аккаунта
        </button>
      </div>

      <div className="bg-slate-900/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px]">Email:</span>
          <span className="text-sm sm:text-base font-bold text-white break-all">{currentUser?.email}</span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">UID пользователя:</span>
          <span className="font-mono text-indigo-300 font-bold bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 block sm:inline-block mt-1 break-all">
            {currentUser?.uid}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">Способ входа:</span>
          <span className="text-slate-300 font-semibold">
            {currentUser?.providerData?.[0]?.providerId === 'google.com' ? '🌐 Google OAuth' : '✉️ Email / Password'}
          </span>
        </div>
      </div>
    </div>
  );
}
